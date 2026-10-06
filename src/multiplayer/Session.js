import { chooseAvatar, readAvatar } from './avatarProfile';
import { createBot } from './BotAvatar';
import { updateBotGun } from './botGun';
import { RemoteAvatar } from './RemoteAvatar';
import { chamberTimeout } from './chamberTimeout';
import { PausedClock } from './PausedClock';
import { TWEEN } from '../Tween';
import { togglePause } from '../Main';
import { SharedPause } from './SharedPause';
import { SharedObjects } from './SharedObjects';
import { snapshotChamber, applyChamberState } from './SharedChamber';
import { copyText } from './clipboard';
import { connectionState } from '../components/events/events';
import { activatePedestal } from '../components/events/interaction';
import { removeJointConstraint } from '../Physics';
import { getLoadedCoopChamber } from './loadedChamber';
import $ from 'jquery';
import { Vector3, Object3D, Color, Group, Quaternion } from 'three';
import { GLOBALS } from '../Globals';
import { supabase } from '../supabaseClient';
import { applyChamberConfig, serializeChamber } from '../components/ui/EditorInteractions';
import { loadNetworkChamber } from '../components/mainMenu/MainMenu';
import { deletePortal, newPortal } from '../components/portal/CreatePortal';
import { createLightBridgesFromPortal } from '../components/continuous/Continuous';
import { updateCrosshair } from './crosshair';
import { PingMarkers, pickPingPoint } from './PingMarkers';
import { ChamberRoom, roomCode, ROOM_PATTERN } from './ChamberRoom';
import { ownedPortals } from './chamberConfig';
import './session.css';

let active;
const sharedMeshPose = new Object3D();
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
    <button id="room-copy-code">Copy room code</button><button id="room-copy">Copy invitation link</button><input id="room-invite-link" readonly aria-label="Invitation link" /><p id="room-controls"></p></div>
    <button id="room-dismiss">Close</button><button id="room-leave" hidden>Leave room</button>
  </section><p id="room-shared-pause" role="status" hidden></p><button id="room-show" hidden>Room · 1/2</button>`);
}
function show() { panel(); $('#chamber-room-panel').prop('hidden', false); }

class Session {
  constructor(host, code, document, profile = readAvatar()) {
    this.slot = host ? 0 : 1;
    this.profile = profile;
    this.pause = new SharedPause(host);
    this.originalTweenNow = TWEEN.now;
    this.animationClock = new PausedClock(this.originalTweenNow);
    this.actions = []; this.actionSeq = 0; this.lastAction = 0;
    this.ready = false;
    this.revisions = [0, 0, 0, 0];
    this.applied = [-1, -1, -1, -1];
    this.portalData = [null, null, null, null];
    this.code = code;
    this.room = new ChamberRoom(supabase, {
      host, code, document,
      getState: () => this.snapshot(),
      onState: state => { this.remote = state; this.update(); },
      onJoin: () => { this.pause.joined = true; this.applyPause(); },
      onDocument: async doc => { await loadNetworkChamber(doc, () => this.closed); },
      onStatus: status,
      onPeer: () => { $('#room-show').text('Room · 2/2'); status('Chamber shared. Use PLAY when loading finishes.'); },
      onError: message => { this.close(); show(); status(message); },
    });
    TWEEN.now = () => this.animationClock.read();
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
    this.pings = new PingMarkers(GLOBALS.SCENE_FPS, this.slot);
    updateCrosshair();
    this.objects = new SharedObjects(this.slot, GLOBALS.DYMANIC_ITEMS);
    this.applyPause();
    for (const index of ownedPortals(GLOBALS.CHAMBER_CONFIG, this.slot)) {
      this.portalChanged(index, GLOBALS.PORTALS[index]?.netData || null);
    }
    this.avatar = new Group();
    this.avatar.visible = false;
    GLOBALS.SCENE_FPS.add(this.avatar);
    const controls = GLOBALS.CHAMBER_CONFIG.portalMode === 'shared'
      ? `Player ${this.slot + 1} · Both mouse buttons place your ${this.slot === 0 ? 'cyan' : 'yellow'} portal.`
      : `Player ${this.slot + 1} · Left / right click place your ${this.slot === 0 ? 'cyan / yellow' : 'purple / green'} pair.`;
    $('#room-controls').text(controls + ' · Middle mouse: ping a location for your partner.');
    $('#chamber-room-panel').prop('hidden', this.slot !== 0 || Boolean(this.remote?.ready));
  }
  snapshot() {
    const p = GLOBALS.PLAYER?.position;
    const q = GLOBALS.PLAYER_MODEL?.quaternion;
    const cq = GLOBALS.MAIN_CAMERA?.quaternion;
    return { avatar: this.profile, gun: GLOBALS.PORTAL_GUN_INITIATE !== "none", animation: GLOBALS.PLAYER_MODEL?.currentAnimation || 'ANIM_STANDING_IDLE', animationRevision: GLOBALS.PLAYER_MODEL?.danceRevision || 0, entered: this.entered === true, actions: this.actions, paused: this.pause.local, ...(this.slot === 0 && this.ready ? { world: snapshotChamber(GLOBALS) } : {}),
      objects: this.objects?.snapshot() || [], ready: this.ready && this.pause.hydrated, p: p ? [p.x, p.y, p.z] : [0, 0, 0], q: q ? q.toArray() : [0, 0, 0, 1],
      cq: cq ? cq.toArray() : [0, 0, 0, 1],
      ping: this.pings?.snapshot() || null,
      portals: ownedPortals(GLOBALS.CHAMBER_CONFIG, this.slot).map(index => ({ index, rev: this.revisions[index], data: this.portalData[index] })) };
  }
  queuePedestal(id) {
    if (this.isPaused()) return;
    this.actions.push({seq: ++this.actionSeq, id}); this.actions = this.actions.slice(-32);
  }
  pingLocation() {
    if (!this.ready || this.closed || this.isPaused()) return;
    const point = pickPingPoint(GLOBALS.MAIN_CAMERA, [GLOBALS.PLANE_LEVEL_INSTANCED, GLOBALS.ITEMS_ADDED, ...(GLOBALS.ANGLED_PANELS || []), ...(GLOBALS.BLOCK_PORTAL || [])]);
    if (point) this.pings.place(point);
  }
  isPaused() { return this.pause.paused; }
  ownsBody(body) {
    const entry = [...(this.objects?.entries.values() || [])].find(e => e.body === body);
    return entry ? entry.owner === this.slot : this.slot === 0;
  }
  takeBody(body) {
    if (this.slot !== 0) return;
    const entry = [...(this.objects?.entries.values() || [])].find(e => e.body === body);
    if (entry && entry.owner !== 0) { entry.owner = 0; entry.rev++; entry.held = false; entry.remote = null; }
  }
  setPaused(paused) { this.pause.local = paused; this.applyPause(); }
  applyPause() {
    if (!this.ready || this.closed) return;
    const paused = this.isPaused();
    GLOBALS.PAUSED = paused;
    this.animationClock.setPaused(paused);
    if (paused !== this.lastPaused) {
      (window.timeoutEvent || []).forEach(timer => paused ? timer.pause() : timer.resume());
      if (paused) GLOBALS.ALLOW_PLACE_PORTALS = false;
      else { GLOBALS.ALLOW_PLACE_PORTALS = true; togglePause(); }
      this.lastPaused = paused;
    }
    const shared = paused && !this.pause.local;
    $('#room-shared-pause').prop('hidden', !shared).text(!this.pause.hydrated || !this.pause.peerReady
      ? 'Synchronizing chamber · Waiting for player 2 to be ready…' : 'Game paused by your partner.');
  }
  applyWorld() {
    if (this.slot === 1 && this.remote?.world && this.pause.hydrated) applyChamberState(GLOBALS, this.remote.world, (c, active) => {
      if (c.line.active !== active) connectionState(c, 'no', active, active ? new Color(2, 1.3, 0) : new Color(0, 2, 5));
    });
    this.objects?.apply();
  }
  loadPeerAvatar(profile) {
    const key = profile.model + profile.color;
    if (this.peerAvatarKey === key) return;
    this.peerAvatarKey = key;
    createBot(profile).then(({bot,mixer}) => {
      if (this.closed || this.peerAvatarKey !== key) { mixer.uncacheRoot(bot); return; }
      this.avatarAnimation?.dispose();
      this.avatar.removeFromParent();
      this.avatar = bot;
      bot.visible = false;
      this.avatarAnimation = new RemoteAvatar(bot,bot.animationActions);
      this.avatarPlaced = false;
      GLOBALS.SCENE_FPS.add(bot);
    }).catch(error => {
      this.peerAvatarKey = null;
      status('Não foi possível carregar o bot do parceiro: ' + error.message);
    });
  }
  animateAvatar(delta) {
    if (this.avatarAnimation && this.remote?.ready && !this.isPaused()) this.avatarAnimation.update(this.remote.animation, delta, this.remote.animationRevision);
    if (this.remote?.cq && this.avatar?.portalGun) updateBotGun(this.avatar, new Quaternion().fromArray(this.remote.cq), this.remote.gun !== false);
  }
  drawSharedObjects() {
    for (const e of this.objects?.entries.values() || []) {
      if (e.owner === this.slot || !e.remote) continue;
      const item = e.item;
      const instanced = GLOBALS.ITEMS_ADDED.getObjectByName(e.name);
      if (!instanced?.setMatrixAt || !Number.isInteger(item.userData?.idInstanced ?? e.index)) continue;
      sharedMeshPose.position.copy(e.body.position); sharedMeshPose.quaternion.copy(e.body.quaternion);
      sharedMeshPose.updateMatrix(); instanced.setMatrixAt(item.userData?.idInstanced ?? e.index, sharedMeshPose.matrix);
      instanced.instanceMatrix.needsUpdate = true;
    }
  }
  update() {
    if (this.closed) return;
    this.pings?.update();
    if (this.remote) this.pause.receive(this.remote);
    if (this.ready && this.slot === 1 && this.remote?.ready && this.remote.world) this.pause.hydrated = true;
    this.applyPause();
    if (!this.ready || !this.remote?.ready) return;
    this.pings?.receive(this.remote.ping);
    this.loadPeerAvatar(this.remote.avatar || { model: "ybot", color: "#00baca" });
    this.objects.receive(this.remote.objects || [], this.slot ^ 1);
    if (this.slot === 0 && !this.isPaused()) {
      for (const action of this.remote.actions || []) {
        if (action.seq <= this.lastAction) continue;
        this.lastAction = action.seq;
        const plane = GLOBALS.PLANE_USER_DATA[action.id];
        if (plane?.item && plane.instancedName?.includes('pedestal')
          && plane.item.position.distanceTo(new Vector3(...this.remote.p)) < 2) activatePedestal(plane.item);
      }
    }
    if (GLOBALS.HOLDING_ITEM && [...this.objects.entries.values()].some(e => e.body === GLOBALS.CURRENT_ITEM?.body && e.owner !== this.slot)) {
      removeJointConstraint();
      GLOBALS.HOLDING_ITEM = false;
      GLOBALS.CURRENT_ITEM = null;
      GLOBALS.CURRENT_ITEM_ID = null;
    }
    this.applyWorld();
    this.drawSharedObjects();
    this.avatar.visible = GLOBALS.FPS_MODE && !GLOBALS.VIEW_REMOTE;
    const target = new Vector3(...this.remote.p); target.y += (this.avatar.userData.floorOffset || 0) - 0.625;
    if (!this.avatarPlaced || this.avatar.position.distanceTo(target) > 3) this.avatar.position.copy(target);
    else this.avatar.position.lerp(target, 0.5);
    this.avatarPlaced = true;
    this.avatar.quaternion.fromArray(this.remote.q);
    let portalsChanged = false;
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

        }
        this.applied[portal.index] = portal.rev;
        portalsChanged = true;
      } finally { this.applying = false; }
    }
    if (portalsChanged) {
      const revision = this.beamRevision = (this.beamRevision || 0) + 1;
      // Match local placement: wait until the portal opening tween has finished.
      clearInterval(this.beamTimer);
      this.beamTimer = chamberTimeout(() => {
        if (this.closed || this.beamRevision !== revision) return;
        GLOBALS.SCENE.updateMatrixWorld(true);
        createLightBridgesFromPortal(0, GLOBALS.LIGHT_BRIDGE_RAYCASTER);
        createLightBridgesFromPortal(0, GLOBALS.TRACTOR_BEAM_RAYCASTER);
      }, 400);
    }
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.room.close();
    this.pings?.dispose();
    TWEEN.now = this.originalTweenNow;
    for (const e of this.objects?.entries.values() || []) {
      if (e.owner !== this.slot) { e.body.holding = false; e.body.wakeUp(); }
    }
    clearInterval(this.timer);
    clearInterval(this.beamTimer);
    this.avatarAnimation?.dispose();
    if (this.avatar) {
      this.avatar.removeFromParent();
      this.avatar.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose()); });
    }
    GLOBALS.MULTIPLAYER = null;
    updateCrosshair();
    GLOBALS.VIEW_REMOTE = false;
    active = null;
    GLOBALS.PORTALS.forEach((p, i) => deletePortal(i));
    applyChamberConfig(GLOBALS.CHAMBER_CONFIG);
    $('#room-show, #room-invitation, #room-leave, #room-shared-pause').prop('hidden', true);
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
async function hostCurrentChamber() {
  show();
  if (active) return;
  if (GLOBALS.CHAMBER_CONFIG.mode !== 'multiplayer') return status('Select Multiplayer in chamber settings.');
  const playing = GLOBALS.FPS_MODE && window.loaded;
  if (!playing && !window.allowTest) return status('The entrance and exit bounds must be green before hosting.');
  try {
    const document = playing ? getLoadedCoopChamber() : serializeChamber();
    if (!document) return status('Reopen the saved cooperative chamber before hosting.');
    const profile = playing ? GLOBALS.PLAYER_MODEL.userData.avatar || readAvatar() : await chooseAvatar();
    if (active) return;
    const session = new Session(true, roomCode(), document, profile);
    if (playing) { const paused = GLOBALS.PAUSED; session.onReady(); session.setPaused(paused); show(); }
    else $('#view-fps').trigger('click');
  } catch (error) { status(error.message); }
}
$('body').on('click', '#host-chamber-room', hostCurrentChamber);
GLOBALS.requestCoopPlay = () => {
  if (!active) hostCurrentChamber();
  if (!active?.remote?.ready) {
    show();
    status('Waiting for player 2 to connect and finish loading before PLAY.');
    return false;
  }
  return true;
};
window.addEventListener('chamber-play-ready', () => {
  refreshRoomButton();
  if (GLOBALS.CHAMBER_CONFIG.mode === 'multiplayer' && !active) hostCurrentChamber();
});
window.addEventListener('chamber-play-ended', () => {
  $('#room-show, #chamber-room-panel').prop('hidden', true);
});
$('body').on('click', '#room-connect', async () => {
  if (active) return;
  const code = $('#room-code-input').val().toUpperCase().replace(/\s/g, '');
  if (!ROOM_PATTERN.test(code)) return status('Enter the 12-character code shared by the host.');
  try { const profile = await chooseAvatar(); if (!active) new Session(false, code, undefined, profile); } catch (error) { status(error.message); }
});
$('body').on('click', '#room-copy, #room-copy-code', async event => {
  if (!active) return;
  const link = new URL(window.location.href); link.search = ''; link.hash = '';
  link.searchParams.set('room', active.code);
  const codeOnly = event.currentTarget.id === 'room-copy-code';
  const text = codeOnly ? active.code : link.href;
  $('#room-invite-link').val(text);
  if (await copyText(text)) status(codeOnly ? 'Room code copied.' : 'Invitation link copied.');
  else { $('#room-invite-link').trigger('focus').trigger('select'); status('Press Ctrl+C to copy the selected invitation.'); }
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
