import { rememberChamber, getLoadedCoopChamber } from '../loadedChamber';

const chamber = mode => [["all", "ambient", "#ffffff", "standard", { mode, portalMode: "independent" }], [{ exists: true, item: { name: "cube" } }]];
afterEach(() => rememberChamber(chamber('single')));

test('a saved cooperative chamber remains available after the engine mutates its items', () => {
  const document = chamber('multiplayer');
  rememberChamber(document);
  document[1][0].item = { isObject3D: true, runtime: true };
  const invitation = getLoadedCoopChamber();
  expect(invitation[0][4]).toEqual({ mode: 'multiplayer', portalMode: 'independent' });
  expect(invitation[1][0].item).toEqual({ name: 'cube' });
  invitation[1].length = 0;
  expect(getLoadedCoopChamber()[1]).toHaveLength(1);
});
test('opening a single-player or legacy chamber clears the previous cooperative map', () => {
  rememberChamber(chamber('multiplayer'));
  rememberChamber(chamber('single'));
  expect(getLoadedCoopChamber()).toBeNull();
  rememberChamber(chamber('multiplayer'));
  rememberChamber([['all'], []]);
  expect(getLoadedCoopChamber()).toBeNull();
});
