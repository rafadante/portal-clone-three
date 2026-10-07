import { snapshotChamber,applyChamberState,validChamberState } from '../SharedChamber';
function globals() { return { LEVEL_ENTERED:true, CONNECTIONS:[{line:{active:true}}], PLANE_USER_DATA:[{item:{userData:{isActive:true,buttons:2,state:true,author:'local'},open:true,body:{collisionResponse:0},continuous:{visible:true}}}],CANNON_WORLD:{bodies:[]} }; }
test('late join adopts current puzzle flags and door state, preserving authored settings', () => {
 const host=globals(),guest=globals(); guest.LEVEL_ENTERED=false;
 guest.PLANE_USER_DATA[0].item.userData.isActive=false; guest.PLANE_USER_DATA[0].item.userData.author='guest';
 const state=JSON.parse(JSON.stringify(snapshotChamber(host))); expect(validChamberState(state)).toBe(true);
 const handler=jest.fn(); applyChamberState(guest,state,handler);
 expect(guest.LEVEL_ENTERED).toBe(true); expect(guest.PLANE_USER_DATA[0].item.userData.isActive).toBe(true);
 expect(guest.PLANE_USER_DATA[0].item.userData.buttons).toBe(2); expect(guest.PLANE_USER_DATA[0].item.userData.author).toBe('guest');
 expect(handler).toHaveBeenCalledWith(guest.CONNECTIONS[0],true);
 expect(guest.PLANE_USER_DATA[0].item.body.collisionResponse).toBe(0);
});
test('rejects arbitrary metadata and malformed flags', () => {
 const state=snapshotChamber(globals()); state.items[0].flags.geometry='unexpected'; expect(validChamberState(state)).toBe(false);
 delete state.items[0].flags.geometry; state.items[0].flags.buttons=Infinity; expect(validChamberState(state)).toBe(false);
});

test('exit corridor and door synchronize independently of authored plane items', () => {
 const host=globals(),guest=globals();
 host.EXIT_DOOR={open:true}; host.CORRIDOR_ENTER={visible:true};
 guest.EXIT_DOOR={open:false,body:{collisionResponse:1}};guest.CORRIDOR_ENTER={visible:false};
 const state=snapshotChamber(host);
 expect(validChamberState(state)).toBe(true);
 applyChamberState(guest,state);
 expect(guest.EXIT_DOOR.open).toBe(true);
 expect(guest.EXIT_DOOR.body.collisionResponse).toBe(0);
 expect(guest.CORRIDOR_ENTER.visible).toBe(true);
});
