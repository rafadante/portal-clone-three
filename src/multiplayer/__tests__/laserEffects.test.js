import { Group, Object3D, Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Vector3, InstancedMesh, BoxGeometry, Matrix4 } from 'three';
import { GLOBALS } from '../../Globals';
jest.mock('../../Globals', () => ({GLOBALS:{SCENE_CHILDREN:new (require('three').Group)(),LASERS:new (require('three').Group)()}}));
jest.mock('../../components/events/events',()=>({laserReceiverTrigger:jest.fn()}));
jest.mock('jquery',()=>()=>({on:jest.fn()}));
global.localStorage={getItem:()=>null};
const {laserEmitterRaycast,updateLaserEmitterRaycaster}=require('../../components/lasers/Laser');

function scene() {
 const material=new MeshBasicMaterial({side:DoubleSide});
 const shaders=[[0,3,true],[10,0,false],[10,4,true],[20,0,false]].map(([x,z,back],i)=>{
  const mesh=new Mesh(new PlaneGeometry(1,2),material);
  mesh.name='portal-'+i;mesh.position.set(x,0,z);mesh.rotation.y=back?Math.PI:0;mesh.updateMatrixWorld(true);return mesh;
 });
 const portals=shaders.map(mesh=>({mesh}));portals.forEach((p,i)=>{p.output=portals[i^1];});
 const wall=new Mesh(new PlaneGeometry(80,20),material);wall.position.set(10,0,8);wall.updateMatrixWorld(true);
 const items=new Group();
 for(const [name,x,z] of [['laser_receiver',20,5],['laser_relay',10,2]]) {
  const mesh=new InstancedMesh(new BoxGeometry(.4,.4,.4),material,1);mesh.name=name;
  mesh.setMatrixAt(0,new Matrix4().makeTranslation(x,0,z));items.add(mesh);
 }
 items.updateMatrixWorld(true);
 const receiver={},relay={};
 Object.assign(GLOBALS,{PORTALS:portals,PORTAL_SHADER:shaders,PLANE_LEVEL_INSTANCED:wall,ITEMS_ADDED:items,ANGLED_PANELS:[],
  LEVEL_ENTERED:true,LASERS:new Group(),LASER_EMITTER_RAYCASTER:[],LASER_TRIGGERS:[receiver,relay],DYMANIC_ITEMS:{laser_cube:[],laser_receiver:[receiver],laser_relay:[relay]}});
 const emitter=new Object3D();emitter.quaternion.setFromUnitVectors(new Vector3(0,1,0),new Vector3(0,0,1));emitter.userData.state=true;
 laserEmitterRaycast(emitter,false,GLOBALS.LASER_EMITTER_RAYCASTER,0);
 return {emitter,receiver,relay,portals};
}
test('laser traverses both pairs and activates relays and receivers along the path',()=>{
 const {emitter,receiver,relay}=scene();updateLaserEmitterRaycaster();
 expect(emitter.continuous.portalSegments.filter(s=>s.visible)).toHaveLength(2);
 expect(receiver.emitterState).toBe(true);expect(relay.emitterState).toBe(true);
 expect(emitter.continuous.portalSegments[1].position.x).toBeCloseTo(20);
 expect(emitter.continuous.portalSegments[1].scale.y).toBeCloseTo(4.79);
});
test('closing the second pair hides stale laser segments and deactivates its receiver',()=>{
 const {emitter,receiver,portals}=scene();updateLaserEmitterRaycaster();
 portals[2].output=null;portals[3].output=null;updateLaserEmitterRaycaster();
 expect(emitter.continuous.portalSegments.filter(s=>s.visible)).toHaveLength(1);
 expect(receiver.emitterState).toBe(false);
});