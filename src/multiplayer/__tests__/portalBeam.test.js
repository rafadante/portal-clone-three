import { Group, Mesh, PlaneGeometry, MeshBasicMaterial, DoubleSide, Vector3, Raycaster, Matrix4 } from 'three';
import { GLOBALS } from '../../Globals';
import { traceEffectPath } from '../../components/portal/EffectPath';

jest.mock('../../Globals', () => ({ GLOBALS: {} }));
jest.mock('../../components/events/states', () => ({ respawn: jest.fn() }));
jest.mock('../../components/audio/Audio', () => ({ AUDIO: {}, play: jest.fn() }));
jest.mock('../../Utils', () => ({ getPlaneByName: jest.fn() }));
jest.mock('../../components/materials/Materials', () => ({ updateMaterialRepeat: jest.fn() }));
jest.mock('../../components/test/Colliders', () => ({ fizzlerTrigger: jest.fn() }));
jest.mock('three-to-cannon', () => ({ ShapeType: { BOX: 'box' }, threeToCannon: () => ({ shape: new (require('cannon').Box)(new (require('cannon').Vec3)(1,1,1)) }) }));

global.window = {};
const { createLightBridgesFromPortal } = require('../../components/continuous/Continuous');

function chamber(name = 'tractor_beam', withWall = true) {
 const material = new MeshBasicMaterial({side:DoubleSide});
 const shaders = [[0,3,true],[10,0,false],[10,4,true],[20,0,false]].map(([x,z,back],index) => {
  const mesh = new Mesh(new PlaneGeometry(1,2),material);
  mesh.name = 'portal-' + index; mesh.position.set(x,0,z); mesh.rotation.y = back ? Math.PI : 0;
  mesh.updateMatrixWorld(true); return mesh;
 });
 const portals = shaders.map(mesh => ({mesh}));
 portals.forEach((p,i) => {p.output = portals[i^1];});
 const wall = new Mesh(new PlaneGeometry(80,20),material);
 wall.position.set(withWall ? 10 : 100,0,8); wall.updateMatrixWorld(true);
 const source = new Mesh(new (require('three').CylinderGeometry)(.8,.8,8),material);
 source.quaternion.setFromUnitVectors(new Vector3(0,1,0),new Vector3(0,0,1));
 const item = {continuous:source,userData:{state:true,opened:true}};
 source.item=item;
 const ray = new Raycaster(new Vector3(),new Vector3(0,0,1));
 ray.name=name; ray.item=item; ray.distance=8;
 const bodies = [];
 Object.assign(GLOBALS, {
  PORTALS:portals, PORTAL_SHADER:shaders, PLANE_LEVEL_INSTANCED:wall, ITEMS_ADDED:new Group(),
  TRACTOR_BEAM_LENGTH:1, TRACTOR_BEAM:[source], TRACTOR_BEAM_BOUNDING_BOX:[],
  LIGHT_BRIDGE_CLONE:[], LIGHT_BRIDGE_COLLIDER_CLONE:[], CANNON_BODIES_CONTINUOUS:[],
  DYNAMIC_OBJECTS:[], ANGLED_PANELS:[], CANNON_WORLD:{addBody:body=>bodies.push(body),removeBody:body=>{const i=bodies.indexOf(body);if(i>=0)bodies.splice(i,1);}},
  LIGHT_BRIDGE_RAYCASTER:name==='light_bridge'?[ray]:[], TRACTOR_BEAM_RAYCASTER:name==='tractor_beam'?[ray]:[],
 });
 return {ray, portals, shaders, wall, item, bodies};
}
function trace(scene, extra={}) {
 return traceEffectPath({origin:new Vector3(),direction:new Vector3(0,0,1),portals:scene.portals,shaders:scene.shaders,obstacles:[scene.wall],...extra});
}

test('effects travel through both cooperative pairs and stop at the wall', () => {
 const scene=chamber();
 const path=trace(scene);
 expect(path).toHaveLength(3);
 expect(path.map(s=>Math.round(s.origin.x))).toEqual([0,10,20]);
 expect(path[0].length).toBeCloseTo(3);
 expect(path[2].length).toBeCloseTo(7.99);
 expect(path[2].direction.z).toBeCloseTo(1);
});

test('an unpaired portal does not intercept an effect', () => {
 const scene=chamber(); scene.portals[2].output=null; scene.portals[3].output=null;
 expect(trace(scene).map(s=>Math.round(s.origin.x))).toEqual([0,10]);
});

test('a nearer wall blocks all portals behind it', () => {
 const scene=chamber(); scene.wall.position.z=2; scene.wall.updateMatrixWorld(true);
 expect(trace(scene)).toHaveLength(1);
 expect(trace(scene)[0].length).toBeCloseTo(2);
});

test('portal loops terminate without unbounded segments', () => {
 const scene=chamber();
 scene.shaders[3].position.set(0,0,0);scene.shaders[3].updateMatrixWorld(true);
 expect(trace(scene).length).toBeLessThanOrEqual(5);
 expect(trace(scene,{maxHops:1})).toHaveLength(2);
});

test('tractor beam creates an independent trigger after each pair and clears stale paths', () => {
 const scene=chamber();
 createLightBridgesFromPortal(0,[scene.ray]);
 expect(GLOBALS.TRACTOR_BEAM).toHaveLength(3);
 expect(GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[2]).toBeDefined();
 expect(scene.item.portalClones).toHaveLength(2);
 scene.portals.forEach(p=>{p.output=null;});
 createLightBridgesFromPortal(0,[scene.ray]);
 expect(GLOBALS.TRACTOR_BEAM).toHaveLength(1);
 expect(scene.item.portalClones).toHaveLength(0);
 expect(scene.item.continuous.scale.y).toBeCloseTo(1);
});

test('light bridge creates both colliders and removes them when a pair closes', () => {
 const scene=chamber('light_bridge');
 createLightBridgesFromPortal(0,[scene.ray]);
 expect(GLOBALS.LIGHT_BRIDGE_CLONE).toHaveLength(2);
 expect(scene.bodies).toHaveLength(2);
 scene.portals[2].output=null;scene.portals[3].output=null;
 createLightBridgesFromPortal(0,[scene.ray]);
 expect(GLOBALS.LIGHT_BRIDGE_CLONE).toHaveLength(1);
 expect(scene.bodies).toHaveLength(1);
 expect(GLOBALS.CANNON_BODIES_CONTINUOUS).toHaveLength(1);
});

test('missing chamber intersections are safe and bounded', () => {
 const scene=chamber('tractor_beam',false);
 expect(()=>createLightBridgesFromPortal(0,[scene.ray])).not.toThrow();
 expect(GLOBALS.TRACTOR_BEAM).toHaveLength(2);
});

test('engine portal transforms turn outgoing effects toward a ceiling', () => {
 const scene=chamber();
 scene.shaders[1].rotation.set(-Math.PI/2,0,0);scene.shaders[1].updateMatrixWorld(true);
 scene.portals.forEach((p,i)=>{
  const t=scene.shaders[i].matrixWorld.clone().multiply(new Matrix4().makeRotationX(Math.PI/2));
  p.CDBB={t,inverse_t:t.clone().invert()};
 });
 scene.wall.rotation.x=Math.PI/2;scene.wall.position.set(10,6,0);scene.wall.updateMatrixWorld(true);
 const path=trace(scene);
 expect(path).toHaveLength(2);
 expect(path[1].direction.y).toBeCloseTo(1);
 expect(path[1].length).toBeCloseTo(5.99);
});
