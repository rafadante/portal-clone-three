import { getLoadedCoopChamber } from './loadedChamber';
import $ from 'jquery';
import { Vector3 } from 'three';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLOBALS } from '../Globals';
import { supabase } from '../supabaseClient';
import { applyChamberConfig, serializeChamber } from '../components/ui/EditorInteractions';
import { loadNetworkChamber } from '../components/mainMenu/MainMenu';
import { deletePortal, newPortal } from '../components/portal/CreatePortal';
import { createLightBridgesFromPortal } from '../components/continuous/Continuous';
import { ChamberRoom, roomCode, ROOM_PATTERN } from './ChamberRoom';
import { ownedPortals } from './chamberConfig';
import './session.css';

let active;
function status(text) { $('#room-status').text(text); }
function panel() {
  if ($('#chamber-room-panel').length) return;
  $('body').append(`<section id="chamber-room-panel" aria-label="Multiplayer room" hidden>
    <h2>Multiplayer chamber</h2>
    <p id="room-status" role="status">Enter the code shared by the host.</p>
    <div id="room-join-fields"><label for="room-code-input">Room code</label>
    <input id="room-code-input" maxlength="12" autocomplete="off" spellcheck="false" />
    <button id="room-connect">Join room</button></div>
    <div id="room-invitation" hidden><span>Your room code</span><strong id="room-code-display"></strong>
    <button id="room-copy">Copy invitation link</button><p id="room-controls"></p></div>
    <button id="room-dismiss">Close</button><button id="room-leave" hidden>Leave room</button>
  </section><button id="room-show" hidden>Room · 1/2</button>`);
}
function show() { panel(); $('#chamber-room-panel').prop('hidden', false); }

class Session {
  constructor(host, code, document) {
    this.slot = host ? 0 : 1;
    this.ready = false;
    this.revisions = [0, 0, 0, 0];
    this.applied = [-1, -1, -1, -1];
    this.portalData = [null, null, null, null];
    this.code = code;
    this.room = new ChamberRoom(supabase, {
      host, code, document,
      getState: () => this.snapshot(),
      onState: state => { this.remote = state; },
      onDocument: async doc => { await loadNetworkChamber(doc, () => this.closed); },
      onStatus: status,
      onPeer: () => { $('#room-show').text('Room · 2/2'); status('Chamber shared. Use PLAY when loading finishes.'); },
      onError: message => { this.close(); show(); status(message); },
    });
    GLOBALS.MULTIPLAYER = this;
    active = this;
    $('#chamber-mode-select, #chamber-portal-mode-select, #host-chamber-room').prop('disabled', true);
    $('#room-join-fields').prop('hidden', true);
    $('#room-dismiss').prop('hidden', false);
    $('#room-invitation, #room-leave, #room-show').prop('hidden', false);
    $('#room-show').text('Room · 1/2');
    $('#room-code-display').text(code);
    $('#room-controls').text(host ? 'You are player 1. Share this code with player 2.' : 'You are player 2. Loading the host’s chamber…');
    status('Connecting…');
    this.room.connect();
    this.timer = setInterval(() => this.update(), 50);
  }
  portalChanged(index, data) {
    if (this.applying || this.closed || !ownedPortals(GLOBALS.CHAMBER_CONFIG, this.slot).includes(index)) return;
    this.portalData[index] = data;
    this.revisions[index]++;
  }
  onReady() {
    if (this.closed || this.ready) return;
    this.ready = true;
    for (const index of ownedPortals(GLOBALS.CHAMBER_CONFIG, this.slot)) {
      this.portalChanged(index, GLOBALS.PORTALS[index]?.netData || null);
    }
    // Reuse the existing animated character asset and chamber geometry.
    this.avatar = clone(GLOBALS.PLAYER_MODEL);
    this.avatar.traverse(object => {
      if (object.isMesh) {
        const copy = material => { const m = material.clone(); m.clippingPlanes = []; m.visible = true; m.opacity = 1; m.colorWrite = true; m.depthWrite = true; return m; };
        object.material = Array.isArray(object.material) ? object.material.map(copy) : copy(object.material);
      }
    });
    this.avatar.visible = false;
    GLOBALS.SCENE_FPS.add(this.avatar);
    const controls = GLOBALS.CHAMBER_CONFIG.portalMode === 'shared'
      ? `Player ${this.slot + 1} · Both mouse buttons place your ${this.slot === 0 ? 'cyan' : 'yellow'} portal.`
      : `Player ${this.slot + 1} · Left / right click place your ${this.slot === 0 ? 'cyan / yellow' : 'purple / green'} pair.`;
    $('#room-controls').text(controls);
    $('#chamber-room-panel').prop('hidden', true);
  }
  snapshot() {
    const p = GLOBALS.PLAYER?.position;
    const q = GLOBALS.PLAYER_MODEL?.quaternion;
    return { ready: this.ready, p: p ? [p.x, p.y, p.z] : [0, 0, 0], q: q ? q.toArray() : [0, 0, 0, 1],
      portals: ownedPortals(GLOBALS.CHAMBER_CONFIG, this.slot).map(index => ({ index, rev: this.revisions[index], data: this.portalData[index] })) };
  }
  update() {
    if (!this.ready || !this.remote?.ready || this.closed) return;
    this.avatar.visible = GLOBALS.FPS_MODE;
    const target = new Vector3(...this.remote.p); target.y -= 0.6;
    if (!this.avatarPlaced || this.avatar.position.distanceTo(target) > 3) this.avatar.position.copy(target);
    else this.avatar.position.lerp(target, 0.5);
    this.avatarPlaced = true;
    this.avatar.quaternion.fromArray(this.remote.q);
    for (const portal of this.remote.portals) {
      if (portal.rev <= this.applied[portal.index]) continue;
      const data = portal.data;
      const host = data && (data.angled ? GLOBALS.ANGLED_PANELS[data.panel]?.body : GLOBALS.PLANE_USER_DATA[data.plane]?.body);
      if (data && !host) continue;
      this.applying = true;
      try {
        deletePortal(portal.index);
        if (data) {
          newPortal(portal.index, portal.index ^ 1, new Vector3(...data.p), new Vector3(...data.n), host, new Vector3(...data.up), [], data.side, data.angled);
          if (data.angled) GLOBALS.ANGLED_PANELS[data.panel].hasPortal = portal.index;
          createLightBridgesFromPortal(portal.index, GLOBALS.LIGHT_BRIDGE_RAYCASTER);
          createLightBridgesFromPortal(portal.index, GLOBALS.TRACTOR_BEAM_RAYCASTER);
        }
        this.applied[portal.index] = portal.rev;
      } finally { this.applying = false; }
    }
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.room.close();
    clearInterval(this.timer);
    if (this.avatar) {
      this.avatar.removeFromParent();
      this.avatar.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
    }
    GLOBALS.MULTIPLAYER = null;
    active = null;
    GLOBALS.PORTALS.forEach((p, i) => deletePortal(i));
    applyChamberConfig(GLOBALS.CHAMBER_CONFIG);
    $('#room-show, #room-invitation, #room-leave').prop('hidden', true);
    $('#room-join-fields, #room-dismiss').prop('hidden', false);
    $('#room-connect').prop('disabled', false);
    status('You left the room.');
    refreshRoomButton();
  }
}

$('body').on('click', '#option-multiplayer-create', () => {
  $('#option-community-build').trigger('click');
  applyChamberConfig({ mode: 'multiplayer', portalMode: 'shared' });
});
$('body').on('click', '#option-multiplayer-join', () => show());
function refreshRoomButton() {
  const canHost = GLOBALS.FPS_MODE && window.loaded && GLOBALS.CHAMBER_CONFIG.mode === 'multiplayer' && Boolean(getLoadedCoopChamber());
  if (!active) $('#room-show').text('Create room & invite').prop('hidden', !canHost);
}
function hostCurrentChamber() {
  show();
  if (active) return;
  if (GLOBALS.CHAMBER_CONFIG.mode !== 'multiplayer') return status('Select Multiplayer in chamber settings.');
  const playing = GLOBALS.FPS_MODE && window.loaded;
  if (!playing && !window.allowTest) return status('The entrance and exit bounds must be green before hosting.');
  try {
    const document = playing ? getLoadedCoopChamber() : serializeChamber();
    if (!document) return status('Reopen the saved cooperative chamber before hosting.');
    const session = new Session(true, roomCode(), document);
    if (playing) { session.onReady(); show(); }
    else $('#view-fps').trigger('click');
  } catch (error) { status(error.message); }
}
$('body').on('click', '#host-chamber-room', hostCurrentChamber);
window.addEventListener('chamber-play-ready', refreshRoomButton);
window.addEventListener('chamber-play-ended', () => {
  $('#room-show, #chamber-room-panel').prop('hidden', true);
});
$('body').on('click', '#room-connect', () => {
  if (active) return;
  const code = $('#room-code-input').val().toUpperCase().replace(/\s/g, '');
  if (!ROOM_PATTERN.test(code)) return status('Enter the 12-character code shared by the host.');
  try { new Session(false, code); } catch (error) { status(error.message); }
});
$('body').on('click', '#room-copy', async () => {
  if (!active) return;
  const link = new URL(window.location.href); link.search = ''; link.searchParams.set('room', active.code);
  try { await navigator.clipboard.writeText(link.href); status('Invitation link copied.'); }
  catch { status(`Copy the room code above: ${active.code}`); }
});
$('body').on('click', '#room-dismiss', () => $('#chamber-room-panel').prop('hidden', true));
$('body').on('click', '#room-show', () => {
  document.exitPointerLock?.();
  if (active) show(); else hostCurrentChamber();
});
$('body').on('click', '#room-leave', () => active?.close());
window.addEventListener('beforeunload', () => active?.close());
panel();
const invite = new URLSearchParams(window.location.search).get('room');
if (invite || new URLSearchParams(window.location.search).has('coop')) {
  show(); if (invite) $('#room-code-input').val(invite.toUpperCase().slice(0, 12));
}
