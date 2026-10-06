import { Matrix4, Quaternion, Raycaster, Vector3 } from 'three';

// Every effect follows the output of the portal it actually enters.
export function traceEffectPath({ origin, direction, portals, shaders, obstacles = [], acceptPortal = () => true, maxHops = 8, far = 1000, firstNear = .001 }) {
  const segments = [], visited = new Set();
  let start = origin.clone(), dir = direction.clone().normalize(), rotation = new Quaternion();
  const active = shaders.filter((shader, index) => shader && portals[index]?.output);
  for (let hop = 0; hop <= maxHops; hop++) {
    const ray = new Raycaster(start, dir, hop === 0 ? firstNear : .001, far);
    const hits = ray.intersectObjects(obstacles, true);
    const wall = hits[0];
    const portalHit = ray.intersectObjects(active, false).find(hit => acceptPortal(hit) && (!wall || hit.distance <= wall.distance + .05));
    const length = portalHit ? portalHit.distance : wall?.distance ?? far;
    segments.push({ origin: start.clone(), direction: dir.clone(), length, rotation: rotation.clone(), ray, hit: portalHit || wall });
    if (!portalHit || hop === maxHops) break;
    const index = shaders.indexOf(portalHit.object), entry = portals[index];
    const outputIndex = portals.indexOf(entry.output), exit = entry.output;
    if (outputIndex < 0 || !shaders[outputIndex] || visited.has(index)) break;
    visited.add(index);
    let transform;
    if (entry.CDBB && exit.CDBB) {
      transform = exit.CDBB.t.clone().multiply(new Matrix4().makeScale(-1, -1, 1)).multiply(entry.CDBB.inverse_t);
    } else {
      portalHit.object.updateWorldMatrix(true, false);
      shaders[outputIndex].updateWorldMatrix(true, false);
      transform = shaders[outputIndex].matrixWorld.clone().multiply(new Matrix4().makeRotationY(Math.PI)).multiply(portalHit.object.matrixWorld.clone().invert());
    }
    const turn = new Quaternion().setFromRotationMatrix(transform);
    dir.transformDirection(transform);
    start = portalHit.point.clone().applyMatrix4(transform).addScaledVector(dir, .01);
    rotation.premultiply(turn);
  }
  return segments;
}
