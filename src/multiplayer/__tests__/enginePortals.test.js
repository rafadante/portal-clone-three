import { Matrix4, Vector3, Quaternion } from 'three';
import { teleportPhysicalObject } from '../../components/portal/Teleportation';
import { GLOBALS } from '../../Globals';

jest.mock('../../Globals', () => ({ GLOBALS: { PORTALS: [null, null, null, null] } }));
jest.mock('../../components/audio/Audio', () => ({ AUDIO: {}, play: jest.fn() }));
jest.mock('../../Physics', () => ({ removeJointConstraint: jest.fn() }));
jest.mock('../../components/pellet/Pellet', () => ({ resetBall: jest.fn() }));
jest.mock('../../Utils', () => {
  const { Vector3, Vector4 } = require('three');
  return { cannonToThreeVector3: p => new Vector3(p.x, p.y, p.z),
    threeToFour: p => new Vector4(p.x, p.y, p.z, 1), fourToThree: p => new Vector3(p.x, p.y, p.z).divideScalar(p.w) };
});

function portal(x, y = 0) {
  const t = new Matrix4().makeTranslation(x, y, 0);
  return { CDBB: { t, inverse_t: t.clone().invert() }, normal: new Vector3(1, 0, 0),
    portalShader: { position: new Vector3(x, y, 0) } };
}
function body() {
  return { position: new Vector3(1, 0, 0), previousPosition: new Vector3(1, 0, 0),
    velocity: new Vector3(2, 3, 4), force: new Vector3(), quaternion: new Quaternion() };
}
test('original engine transports through player 2 pair when player 1 has no portals', () => {
  const entry = portal(0), exit = portal(10);
  entry.output = exit; exit.output = entry;
  GLOBALS.PORTALS = [null, null, entry, exit];
  const player = body(); const speed = player.velocity.length();
  teleportPhysicalObject(player, entry);
  expect(player.position.toArray()).toEqual([9, 0, 0]);
  expect(player.velocity.length()).toBeCloseTo(speed);
  teleportPhysicalObject(player, exit);
  expect(player.position.toArray()).toEqual([1, 0, 0]);
  expect(player.velocity.toArray()).toEqual([2, 3, 4]);
});
test('transport follows the entered pair, independent of unrelated portal normals', () => {
  const first = portal(100), second = portal(200), entry = portal(0), exit = portal(12, 3);
  first.normal.set(0, 1, 0); second.normal.set(0, -1, 0);
  entry.output = exit; exit.output = entry;
  GLOBALS.PORTALS = [first, second, entry, exit];
  const object = body(); teleportPhysicalObject(object, entry);
  expect(object.position.toArray()).toEqual([11, 3, 0]);
  expect(object.velocity.toArray()).toEqual([-2, -3, 4]);
  expect(object.looping).toBeUndefined();
});
