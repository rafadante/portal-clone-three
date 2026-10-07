import { Box3, Vector3 } from 'three';
import { triggerBodies, occupiesTrigger } from '../triggerOccupancy';
const shape = {halfExtents: new Vector3(.25,.625,.25)};
const player = p => ({name:'player',position:new Vector3(...p),shapes:[shape]});
const box = Object.assign(new Box3(new Vector3(-1,0,-1),new Vector3(1,.15,1)),{accept:['player']});
test('host includes player 2 using the physics body dimensions', () => {
 const local=player([5,.7,0]);
 const bodies=triggerBodies({DYNAMIC_OBJECTS:[local],PLAYER:local,MULTIPLAYER:{slot:0,remote:{ready:true,p:[0,.7,0]}}});
 expect(bodies.filter(b => occupiesTrigger(b,box))).toHaveLength(1);
 expect(bodies[1].remoteTrigger).toBe(true);
});
test('button remains occupied when one of two players leaves', () => {
 const bodies=[player([0,.7,0]),player([.5,.7,0])];
 expect(bodies.some(b => occupiesTrigger(b,box))).toBe(true);
 bodies[0].position.x=5;
 expect(bodies.some(b => occupiesTrigger(b,box))).toBe(true);
 bodies[1].position.x=5;
 expect(bodies.some(b => occupiesTrigger(b,box))).toBe(false);
});
