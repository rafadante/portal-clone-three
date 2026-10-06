import { chamberDocument, readChamberConfig, ownedPortals, shotPortal, validateChamberDocument } from '../chamberConfig';
import { ChamberRoom, roomCode, validState } from '../ChamberRoom';

beforeAll(() => { global.crypto = require('crypto').webcrypto; });
const config = mode => ({ mode: 'multiplayer', portalMode: mode });
const document = mode => chamberDocument(['all', 'none', '#fff', false], [{ exists: true, position: { x: 0, y: 0, z: 0 }, rotation: { _x: 0, _y: 0, _z: 0, _order: 'XYZ' } }], config(mode));
const state = (mode, slot) => ({ ready: true, p: [0, 1, 0], q: [0, 0, 0, 1], portals: ownedPortals(config(mode), slot).map(index => ({ index, rev: 0, data: null })) });

test('old chamber files default to single; both multiplayer modes round-trip', () => {
  expect(readChamberConfig([['all'], []]).mode).toBe('single');
  for (const mode of ['shared', 'independent']) {
    const doc = JSON.parse(JSON.stringify(document(mode)));
    expect(validateChamberDocument(doc)).toBe(true);
    expect(readChamberConfig(doc)).toMatchObject(config(mode));
  }
});
test('serialization does not mutate live item meshes or physics bodies', () => {
  const body = {}; body.world = body;
  const mesh = { isObject3D: true, userData: { itemName: 'cube' }, toJSON: () => { throw new Error('Do not serialize the model geometry'); } };
  const planes = [{ item: mesh, body }];
  const result = chamberDocument([], planes, config('shared'));
  expect(result[1][0]).toEqual({ item: { itemName: 'cube' }, body: null });
  expect(planes[0].item).toBe(mesh); expect(planes[0].body).toBe(body);
});
test('shared pair assigns one endpoint per player; independent pairs stay separate', () => {
  expect([shotPortal(config('shared'), 0, 0), shotPortal(config('shared'), 0, 2)]).toEqual([0, 0]);
  expect([shotPortal(config('shared'), 1, 0), shotPortal(config('shared'), 1, 2)]).toEqual([1, 1]);
  expect([shotPortal(config('independent'), 1, 0), shotPortal(config('independent'), 1, 2)]).toEqual([2, 3]);
  expect(shotPortal(config('shared'), 2, 0)).toBeNull();
});
test('network states reject other player portal slots and nonfinite transforms', () => {
  const packet = state('independent', 1);
  expect(validState(packet, config('independent'), 1)).toBe(true);
  expect(validState(packet, config('independent'), 0)).toBe(false);
  packet.p[0] = Infinity;
  expect(validState(packet, config('independent'), 1)).toBe(false);
});

function network() {
  const channels = [];
  const queue = [];
  return {
    channel(name) {
      const c = { name, on: (_, __, handler) => { c.handler = handler; return c; }, subscribe: callback => callback('SUBSCRIBED'),
        send: packet => { queue.push(() => channels.filter(peer => peer !== c && peer.name === name).forEach(peer => peer.handler({ payload: packet.payload }))); return Promise.resolve('ok'); } };
      channels.push(c); return c;
    },
    removeChannel(c) { channels.splice(channels.indexOf(c), 1); },
    flush() { let guard = 1000; while (queue.length && guard--) queue.shift()(); },
  };
}
function peer(net, host, code, mode = 'shared', overrides = {}) {
  const options = { host, code, document: host ? document(mode) : undefined, getState: () => state(mode, host ? 0 : 1),
    onState: jest.fn(), onDocument: jest.fn(), onStatus: jest.fn(), onPeer: jest.fn(), onError: jest.fn(), ...overrides };
  const room = new ChamberRoom(net, options); room.connect(); return { room, options };
}
test.each(['shared', 'independent'])('two players receive identical authored %s chamber and portal ownership', mode => {
  jest.useFakeTimers();
  const net = network(), code = roomCode();
  const host = peer(net, true, code, mode), guest = peer(net, false, code, mode);
  guest.room.pulse(); net.flush(); host.room.pulse(); net.flush();
  expect(guest.options.onDocument).toHaveBeenCalledWith(document(mode));
  host.room.pulse(); guest.room.pulse(); net.flush();
  expect(host.options.onState).toHaveBeenCalledWith(state(mode, 1));
  expect(guest.options.onState).toHaveBeenCalledWith(state(mode, 0));
  const third = peer(net, false, code, mode); third.room.pulse(); net.flush();
  expect(third.options.onError).toHaveBeenCalledWith('This room already has two players.');
  guest.room.close(); net.flush(); expect(host.options.onError).toHaveBeenCalledWith('Your partner left the room.');
  host.room.close(); third.room.close(); jest.useRealTimers();
});
test('out-of-order, foreign and duplicate state packets are ignored', () => {
  jest.useFakeTimers(); const net = network(), host = peer(net, true, roomCode());
  host.room.peer = 'guest'; host.room.mapReceived = true;
  const packet = { v: 1, sender: 'guest', type: 'state', seq: 2, state: state('shared', 1) };
  host.room.receive(packet); host.room.receive(packet); host.room.receive({ ...packet, seq: 1 }); host.room.receive({ ...packet, sender: 'intruder', seq: 3 });
  expect(host.options.onState).toHaveBeenCalledTimes(1); host.room.close(); jest.useRealTimers();
});

test('multi-chunk map retries do not duplicate the chamber or load it twice', () => {
  jest.useFakeTimers(); const net = network(), code = roomCode();
  const doc = document('shared'); doc[1] = Array.from({ length: 400 }, () => ({ ...doc[1][0] }));
  const host = peer(net, true, code, 'shared', { document: doc });
  const guest = peer(net, false, code);
  guest.room.pulse(); net.flush();
  expect(host.room.chunks.length).toBeGreaterThan(1);
  while (!host.room.mapReceived) { host.room.pulse(); host.room.pulse(); net.flush(); }
  expect(guest.options.onDocument).toHaveBeenCalledTimes(1);
  expect(guest.options.onDocument).toHaveBeenCalledWith(doc);
  host.room.close(); guest.room.close(); jest.useRealTimers();
});
test('a missing peer expires the session and closes its timer', () => {
  jest.useFakeTimers(); const net = network(), host = peer(net, true, roomCode());
  host.room.peer = 'guest'; host.room.lastPeer = Date.now() - 16000;
  host.room.pulse();
  expect(host.room.closed).toBe(true);
  expect(host.options.onError).toHaveBeenCalledWith(expect.stringContaining('disconnected'));
  jest.useRealTimers();
});
test('single-player chambers cannot be hosted as multiplayer rooms', () => {
  const doc = document('shared'); doc[0].pop();
  expect(() => new ChamberRoom(network(), { host: true, code: roomCode(), document: doc })).toThrow('Choose a multiplayer chamber');
});


test('HTTP LAN browsers without randomUUID can host, join and exchange states', () => {
  jest.useFakeTimers();
  const originalCrypto = global.crypto;
  global.crypto = { getRandomValues: originalCrypto.getRandomValues.bind(originalCrypto) };
  let host, guest;
  try {
    expect(global.crypto.randomUUID).toBeUndefined();
    const net = network(), code = roomCode();
    host = peer(net, true, code);
    guest = peer(net, false, code);
    expect(host.room.id).toMatch(/^[0-9a-f]{32}$/);
    expect(guest.room.id).not.toBe(host.room.id);
    guest.room.pulse(); net.flush(); host.room.pulse(); net.flush();
    expect(guest.options.onDocument).toHaveBeenCalledWith(document('shared'));
    host.room.pulse(); guest.room.pulse(); net.flush();
    expect(host.options.onState).toHaveBeenCalledWith(state('shared', 1));
    expect(guest.options.onState).toHaveBeenCalledWith(state('shared', 0));
  } finally {
    host?.room.close(); guest?.room.close();
    global.crypto = originalCrypto;
    jest.useRealTimers();
  }
});

test('late join requests synchronization once and delivers the live host world without reloading the host', () => {
 jest.useFakeTimers(); const net=network(),code=roomCode();
 const live={...state('shared',0),paused:false,world:{entered:true,connections:[true],items:[{id:0,flags:{buttons:1,isActive:true},nodes:[]}]}};
 const host=peer(net,true,code,'shared',{getState:()=>live,onJoin:jest.fn()});
 const guest=peer(net,false,code,'shared',{getState:()=>({...state('shared',1),ready:false,paused:true})});
 guest.room.pulse(); net.flush(); guest.room.send('join'); net.flush();
 expect(host.options.onJoin).toHaveBeenCalledTimes(1);
 host.room.pulse(); net.flush(); host.room.pulse(); net.flush();
 expect(host.options.onDocument).not.toHaveBeenCalled();
 expect(guest.options.onDocument).toHaveBeenCalledTimes(1);
 expect(guest.options.onState).toHaveBeenCalledWith(live);
 host.room.close(); guest.room.close(); jest.useRealTimers();
});
