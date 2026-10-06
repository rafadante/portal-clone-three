import { SharedObjects, validObjects } from '../SharedObjects';
function vector(x = 0, y = 0, z = 0) { return { x, y, z, set(a,b,c) { this.x=a; this.y=b; this.z=c; } }; }
function world() { const body = { mass: 1, position: vector(), velocity: vector(), angularVelocity: vector(), quaternion: { x:0,y:0,z:0,w:1,set(x,y,z,w) { Object.assign(this,{x,y,z,w}); } } }; return { cube: [{ body }] }; }
test('guest places and releases a cube: host receives pose and velocity used by button checks', () => {
 const a=world(), b=world(), host=new SharedObjects(0,a), guest=new SharedObjects(1,b);
 expect(guest.claim(b.cube[0].body)).toBe(true);
 b.cube[0].body.holding=true; b.cube[0].body.position.set(4,1,2);
 host.receive(guest.snapshot(),1); host.apply();
 expect(a.cube[0].body.position.y).toBe(1);
 expect(host.claim(a.cube[0].body)).toBe(false);
 b.cube[0].body.holding=false;
 host.receive(guest.snapshot(),1); host.apply();
 expect(host.claim(a.cube[0].body)).toBe(true);
 a.cube[0].body.position.set(8,2,3);
 guest.receive(host.snapshot(),0); guest.apply();
 expect(b.cube[0].body.position.x).toBe(8);
});
test('simultaneous claims resolve to the same owner and stale packets cannot revert ownership', () => {
 const a=world(),b=world(),host=new SharedObjects(0,a),guest=new SharedObjects(1,b);
 const stale=host.snapshot(); host.claim(a.cube[0].body); guest.claim(b.cube[0].body);
 const h=host.snapshot(),g=guest.snapshot(); host.receive(g,1); guest.receive(h,0); guest.receive(stale,0);
 expect(host.entries.get('cube:0').owner).toBe(0); expect(guest.entries.get('cube:0').owner).toBe(0);
});
test('network validation rejects malformed transforms', () => {
 const state=new SharedObjects(0,world()).snapshot(); expect(validObjects(state)).toBe(true);
 state[0].p[0]=Infinity; expect(validObjects(state)).toBe(false);
});

test('dispenser alias of a cube does not synchronize or move the ceiling dispenser', () => {
 const a=world(),b=world();
 a.dispenser=[a.cube[0]]; b.dispenser=[b.cube[0]];
 const host=new SharedObjects(0,a),guest=new SharedObjects(1,b);
 a.cube[0].body.position.set(7,1,4);
 expect([...host.entries.keys()]).toEqual(['cube:0']);
 guest.receive(host.snapshot(),0); guest.apply();
 expect([...guest.entries.values()].map(e=>e.name)).toEqual(['cube']);
 expect(b.cube[0].body.position.x).toBe(7);
});

test('remote cube corrections restore the button position after a local physics step', () => {
 const a=world(),b=world(),host=new SharedObjects(0,a),guest=new SharedObjects(1,b);
 guest.claim(b.cube[0].body); b.cube[0].body.position.set(3,.25,4);
 host.receive(guest.snapshot(),1); host.apply();
 a.cube[0].body.position.set(100,100,100); host.apply();
 expect([a.cube[0].body.position.x,a.cube[0].body.position.y,a.cube[0].body.position.z]).toEqual([3,.25,4]);
});

test('late join receives stationary dispenser cubes and zero-mass platform phase', () => {
 const a=world(),b=world(); a.cube[0].body.initialMass=5; b.cube[0].body.initialMass=5;
 a.cube[0].body.mass=0; b.cube[0].body.mass=0;
 a.piston_platforms=[{body:{...world().cube[0].body,mass:0,pistonDown:true}}];
 b.piston_platforms=[{body:{...world().cube[0].body,mass:0,pistonDown:false}}];
 a.cube[0].body.position.set(9,2,7); a.piston_platforms[0].body.position.set(0,4,0);
 const host=new SharedObjects(0,a),guest=new SharedObjects(1,b); const state=host.snapshot();
 expect(state).toHaveLength(2); expect(validObjects(state)).toBe(true);
 guest.receive(state,0); guest.apply();
 expect(b.cube[0].body.position.x).toBe(9); expect(b.piston_platforms[0].body.position.y).toBe(4);
 expect(b.piston_platforms[0].body.pistonDown).toBe(true);
});
