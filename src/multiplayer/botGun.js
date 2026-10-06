import { Box3, Vector3, Quaternion } from 'three';

export function attachBotGun(bot, template) {
  const gun = template.clone(true);
  gun.name = 'coop-portal-gun';
  gun.scale.setScalar(1); gun.position.set(0,0,0); gun.quaternion.identity();
  gun.traverse(object => {
    object.layers.set(0); object.renderOrder = 0;
    if (object.isMesh) object.material = Array.isArray(object.material) ? object.material.map(m=>m.clone()) : object.material.clone();
  });
  for (const child of gun.children) child.rotation.x = 0;
  const bounds = new Box3().setFromObject(gun), size = bounds.getSize(new Vector3());
  const grip = gun.getObjectByName('cube_4');
  const center = grip ? gun.worldToLocal(grip.getWorldPosition(new Vector3())) : bounds.getCenter(new Vector3());
  // Center the prop around the hand before placing it in the character's coordinate space.
  for (const child of gun.children) { child.position.sub(center); child.visible = true; }
  gun.scale.setScalar(.55 / Math.max(size.x,size.y,size.z) / bot.getWorldScale(new Vector3()).x);
  bot.add(gun); bot.portalGun = gun;
  return gun;
}

export function updateBotGun(bot, cameraQuaternion, visible = true) {
  const gun = bot?.portalGun;
  if (!gun) return;
  gun.visible = visible;
  const hand = bot.getObjectByName('mixamorigRightHand');
  if (!hand) return;
  bot.updateMatrixWorld(true);
  const palm = hand.getWorldPosition(new Vector3());
  const knuckles = bot.getObjectByName('mixamorigRightHandMiddle1');
  if (knuckles) palm.lerp(knuckles.getWorldPosition(new Vector3()), 0.65);
  // Advance the grip along the aim in world units, independent of the rig scale.
  palm.add(new Vector3(0, 0, -0.30).applyQuaternion(cameraQuaternion));
  gun.position.copy(bot.worldToLocal(palm));
  const aim = cameraQuaternion.clone();
  gun.quaternion.copy(bot.getWorldQuaternion(new Quaternion()).invert().multiply(aim));
}
