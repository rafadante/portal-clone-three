import { validAvatar } from './avatarProfile';
import { validAnimation } from './RemoteAvatar';
import { validPing } from './PingMarkers';
import { validObjects } from './SharedObjects';
import { validChamberState } from './SharedChamber';
import { ownedPortals, readChamberConfig, validateChamberDocument } from './chamberConfig';

export const ROOM_PATTERN = /^[A-Z0-9]{12}$/;
const CHUNK = 12000;
const MAX_CHUNKS = 350;
export function roomCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(12)), n => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[n % 36]).join('');
}
export const vector = (v, n = 3) => Array.isArray(v) && v.length === n && v.every(x => Number.isFinite(x) && Math.abs(x) <= 10000);
export function validPortal(p) {
  return p === null || (p && vector(p.p) && vector(p.n) && vector(p.up)
    && Math.abs(Math.hypot(...p.n) - 1) < 0.01 && Math.abs(Math.hypot(...p.up) - 1) < 0.01
    && Number.isInteger(p.plane) && p.plane >= -1 && Number.isInteger(p.panel) && p.panel >= -1
    && ['front', 'back', 'left', 'right', 'up', 'down'].includes(p.side) && typeof p.angled === 'boolean');
}
export function validState(state, config, slot) {
  return state && (state.avatar === undefined || validAvatar(state.avatar)) && (state.gun === undefined || typeof state.gun === "boolean") && (state.animation === undefined || validAnimation(state.animation)) && (state.entered === undefined || typeof state.entered === 'boolean') && (state.actions === undefined || (Array.isArray(state.actions) && state.actions.length <= 32 && state.actions.every(a => a && Number.isSafeInteger(a.seq) && a.seq > 0 && Number.isSafeInteger(a.id) && a.id >= 0)))
    && (state.animationRevision === undefined || (Number.isSafeInteger(state.animationRevision) && state.animationRevision >= 0))
    && (state.ping === undefined || validPing(state.ping))
    && (state.paused === undefined || typeof state.paused === 'boolean') && (state.world === undefined || (slot === 0 && validChamberState(state.world)))
    && (state.objects === undefined || validObjects(state.objects)) && typeof state.ready === 'boolean' && vector(state.p) && vector(state.q, 4)
    && Math.abs(Math.hypot(...state.q) - 1) < 0.01
    && (state.cq === undefined || (vector(state.cq, 4) && Math.abs(Math.hypot(...state.cq) - 1) < 0.01))
    && Array.isArray(state.portals)
    && state.portals.length === ownedPortals(config, slot).length
    && state.portals.every((p, i) => p && p.index === ownedPortals(config, slot)[i]
      && Number.isSafeInteger(p.rev) && p.rev >= 0 && validPortal(p.data));
}

// Two seats on the existing Supabase Realtime service. The host supplies the
// authored chamber. Each peer publishes only its own avatar and portal slots.
export class ChamberRoom {
  constructor(client, { host, code, document, getState, onState, onDocument, onStatus, onPeer, onJoin, onError }) {
    if (!ROOM_PATTERN.test(code)) throw new Error('Enter a 12-character room code.');
    if (host && (!validateChamberDocument(document) || readChamberConfig(document).mode !== 'multiplayer')) throw new Error('Choose a multiplayer chamber first.');
    Object.assign(this, { client, host, code, getState, onState, onDocument, onStatus, onPeer, onJoin, onError });
    // getRandomValues also works on HTTP LAN origins, where randomUUID
    // is unavailable. A peer ID only needs an opaque, collision-resistant token.
    this.id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    this.config = host ? readChamberConfig(document) : null;
    const json = host ? JSON.stringify(document) : '';
    if (json.length > CHUNK * MAX_CHUNKS) throw new Error('This chamber is too large to share online (4 MB maximum).');
    this.chunks = host ? json.match(new RegExp(`[\\s\\S]{1,${CHUNK}}`, 'g')) : [];
    this.chunk = 0;
    this.seq = 0;
    this.lastSeq = -1;
    this.lastPeer = this.started = Date.now();
  }
  connect() {
    this.channel = this.client.channel(`portal-chamber-v1:${this.code}`, { config: { broadcast: { self: false } } });
    this.channel.on('broadcast', { event: 'chamber' }, ({ payload }) => this.receive(payload));
    this.timer = setInterval(() => this.pulse(), 100);
    this.channel.subscribe(status => {
      if (this.closed) return;
      if (status === 'SUBSCRIBED') {
        this.connected = true;
        this.onStatus(this.host ? 'Waiting for player 2…' : 'Finding room…');
      } else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) this.fail('Connection lost. Leave and reconnect.');
    });
  }
  send(type, data = {}) {
    if (!this.connected || this.closed) return;
    this.channel.send({ type: 'broadcast', event: 'chamber', payload: { v: 1, sender: this.id, to: this.peer, type, ...data } })
      .then(result => { if (result !== 'ok' && !this.closed) this.fail('Realtime could not send updates.'); })
      .catch(() => this.fail('Realtime connection failed.'));
  }
  pulse() {
    if (this.closed) return;
    const now = Date.now();
    if (!this.connected && now - this.started > 15000) return this.fail('Realtime is unavailable.');
    if (!this.connected) return;
    if (!this.peer) {
      if (!this.host) {
        if (now - this.started > 15000) return this.fail('Room not found. Check the code and keep the host connected.');
        if (!this.lastJoin || now - this.lastJoin > 1000) { this.send('join'); this.lastJoin = now; }
      }
      return;
    }
    if (now - this.lastPeer > 15000) return this.fail('Your partner disconnected. Leave and create or join another room.');
    this.send('heartbeat');
    if (this.host && !this.mapReceived) {
      this.send('map', { index: this.chunk, total: this.chunks.length, text: this.chunks[this.chunk] });
    }
    if (this.mapReceived && this.config) {
      const state = this.getState();
      if (validState(state, this.config, this.host ? 0 : 1)) this.send('state', { seq: ++this.seq, state });
    }
  }
  receive(m) {
    if (this.closed || !m || m.v !== 1 || typeof m.sender !== 'string' || m.sender.length > 64 || m.sender === this.id || (m.to && m.to !== this.id)) return;
    if (this.host && m.type === 'join') {
      if (this.peer && this.peer !== m.sender) return this.send('full', { to: m.sender });
      if (!this.peer) this.onJoin?.();
      this.peer = m.sender;
      this.lastPeer = Date.now();
      this.send('welcome');
      this.onStatus('Player 2 connected · Sending chamber…');
      return;
    }
    if (!this.host && !this.peer) {
      if (m.type === 'full') return this.fail('This room already has two players.');
      if (m.type !== 'welcome') return;
      this.peer = m.sender;
      this.onStatus('Connected · Receiving chamber…');
    }
    if (m.sender !== this.peer) return;
    this.lastPeer = Date.now();
    if (m.type === 'leave') return this.fail('Your partner left the room.');
    if (this.host && m.type === 'ack' && m.index === this.chunk) {
      if (++this.chunk === this.chunks.length) { this.mapReceived = true; this.onPeer(); }
    } else if (!this.host && m.type === 'map') {
      if (!Number.isInteger(m.total) || m.total < 1 || m.total > MAX_CHUNKS || !Number.isInteger(m.index)
        || m.index < 0 || m.index >= m.total || typeof m.text !== 'string' || m.text.length > CHUNK) return;
      if (this.total && this.total !== m.total) return;
      this.total = m.total;
      if (m.index > this.chunks.length) return;
      if (m.index === this.chunks.length) this.chunks.push(m.text);
      this.send('ack', { index: m.index });
      if (this.chunks.length === this.total && !this.mapReceived) {
        try {
          const document = JSON.parse(this.chunks.join(''));
          if (!validateChamberDocument(document) || readChamberConfig(document).mode !== 'multiplayer') throw new Error('Invalid multiplayer chamber.');
          this.config = readChamberConfig(document);
          this.mapReceived = true;
          Promise.resolve(this.onDocument(document)).catch(error => this.fail(error.message));
          this.onPeer();
        } catch (error) { this.fail(error.message); }
      }
    } else if (m.type === 'state' && this.mapReceived && Number.isSafeInteger(m.seq) && m.seq > this.lastSeq
      && validState(m.state, this.config, this.host ? 1 : 0)) {
      this.lastSeq = m.seq;
      this.onState(m.state);
    }
  }
  fail(message) {
    if (this.closed) return;
    this.close();
    this.onError(message);
  }
  close() {
    if (this.closed) return;
    this.send('leave');
    this.closed = true;
    clearInterval(this.timer);
    if (this.channel) this.client.removeChannel(this.channel);
  }
}
