import { Vector3 } from 'three';

export function triggerBodies(globals) {
  const bodies = [...globals.DYNAMIC_OBJECTS];
  const session = globals.MULTIPLAYER;
  if (session?.slot === 0 && session.remote?.ready) bodies.push({
    name: 'player', remoteTrigger: true,
    position: new Vector3(...session.remote.p), shapes: globals.PLAYER.shapes,
  });
  return bodies;
}

export function triggerPoints(body) {
  const shape = body.shapes?.[0];
  const extents = shape?.halfExtents;
  const radius = shape?.radius || shape?.height / 2 || .625;
  const { x, y, z } = body.position;
  return [new Vector3(x,y,z),
    new Vector3(x+(extents?.x || radius),y,z), new Vector3(x-(extents?.x || radius),y,z),
    new Vector3(x,y+(extents?.y || radius),z), new Vector3(x,y-(extents?.y || radius),z),
    new Vector3(x,y,z+(extents?.z || radius)), new Vector3(x,y,z-(extents?.z || radius))];
}

export function occupiesTrigger(body, box) {
  return box.accept.includes(body.name) && triggerPoints(body).some(p => box.containsPoint(p));
}
