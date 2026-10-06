import { playerSpawn, replacesEntrance, markEntrance } from '../spawnPoints';

const first = { position: { x: 1 } }, second = { position: { x: 8 } };
const items = entries => ({ getObjectByName: name => entries[name] });

test('each player uses their own marker and missing markers keep the elevator', () => {
  const both = items({ spawn: first, spawn_player2: second });
  expect(playerSpawn(both, 0)).toBe(first);
  expect(playerSpawn(both, 1)).toBe(second);
  expect(playerSpawn(items({ spawn: first }), 1)).toBeUndefined();
  expect(replacesEntrance(both, true)).toBe(true);
  expect(replacesEntrance(items({ spawn: first }), true)).toBe(false);
  expect(replacesEntrance(items({ spawn: first }), false)).toBe(true);
});

test('entrance stays open until both players cross, even after player 1 leaves the trigger', () => {
  const session = { remote: { ready: true, entered: false } };
  expect(markEntrance(session, true, false)).toBe(false);
  expect(markEntrance(session, false, false)).toBe(false);
  session.remote.entered = true;
  expect(markEntrance(session, false, false)).toBe(true);
});

test('custom spawns count as entering but still require the partner to be ready', () => {
  const session = { remote: { ready: false, entered: true } };
  expect(markEntrance(session, false, true)).toBe(false);
  session.remote.ready = true;
  expect(markEntrance(session, false, true)).toBe(true);
});
