import { Group, Bone, Mesh, BoxGeometry, MeshBasicMaterial, Box3, Vector3, Quaternion } from 'three';
import { attachBotGun, updateBotGun } from '../botGun';

test('portal gun follows the rig hand and camera aim with a stable world size', () => {
 const bot=new Group(),hand=new Bone();hand.name='mixamorigRightHand'; hand.position.set(1,2,3);bot.add(hand);
 bot.scale.setScalar(.01);bot.rotation.y=.7;bot.position.set(4,0,8);
 const knuckles=new Bone();knuckles.name='mixamorigRightHandMiddle1';knuckles.position.y=10;hand.add(knuckles);
 const palm=()=>hand.getWorldPosition(new Vector3()).lerp(knuckles.getWorldPosition(new Vector3()),.65).add(new Vector3(0,0,-.30).applyQuaternion(aim));
 const template=new Group();template.add(new Mesh(new BoxGeometry(10,5,20),new MeshBasicMaterial()));
 template.children[0].visible=false;
 const gun=attachBotGun(bot,template),aim=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),1);
 expect(gun.children[0].visible).toBe(true);
 updateBotGun(bot,aim,true);bot.updateMatrixWorld(true);
 expect(gun.getWorldPosition(new Vector3()).distanceTo(palm())).toBeCloseTo(0);
 const barrel = new Vector3(0,0,-1).applyQuaternion(gun.getWorldQuaternion(new Quaternion()));
 const forward = new Vector3(0,0,-1).applyQuaternion(aim);
 expect(barrel.dot(forward)).toBeCloseTo(1);
 const top = new Vector3(0,1,0).applyQuaternion(gun.getWorldQuaternion(new Quaternion()));
 expect(top.dot(new Vector3(0,1,0).applyQuaternion(aim))).toBeCloseTo(1);
 const size=new Box3().setFromObject(gun).getSize(new Vector3());expect(size.length()).toBeGreaterThan(.4);
 hand.position.y+=5;updateBotGun(bot,aim,false);bot.updateMatrixWorld(true);
 expect(gun.visible).toBe(false);
 expect(gun.getWorldPosition(new Vector3()).distanceTo(palm())).toBeCloseTo(0);
 expect(template.children[0].material).not.toBe(gun.children[0].material);
});
