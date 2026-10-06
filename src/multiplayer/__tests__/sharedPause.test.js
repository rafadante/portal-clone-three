import { SharedPause } from '../SharedPause';
test('host waits for a partner to apply the world and press PLAY', () => {
 const host=new SharedPause(true); host.local=false; expect(host.paused).toBe(true);
 host.joined=true; expect(host.paused).toBe(true);
 host.receive({ready:false,paused:false}); expect(host.paused).toBe(true);
 host.receive({ready:true,paused:true}); expect(host.paused).toBe(true);
 host.receive({ready:true,paused:false}); expect(host.paused).toBe(false);
});
test('either player pauses both; both must close their own pause menu to resume', () => {
 const host=new SharedPause(true),guest=new SharedPause(false);
 host.local=false; guest.local=false; guest.hydrated=true;
 const sync=()=>{host.receive({ready:guest.hydrated,paused:guest.local});guest.receive({ready:true,paused:host.local});};
 sync(); expect(host.paused).toBe(false); expect(guest.paused).toBe(false);
 guest.local=true; sync(); expect(host.paused).toBe(true); expect(guest.paused).toBe(true);
 host.local=true; guest.local=false; sync(); expect(host.paused).toBe(true); expect(guest.paused).toBe(true);
 host.local=false; sync(); expect(host.paused).toBe(false); expect(guest.paused).toBe(false);
});
test('guest remains frozen before hydration even if both want to play', () => {
 const guest=new SharedPause(false); guest.local=false; guest.receive({ready:true,paused:false});
 expect(guest.paused).toBe(true); guest.hydrated=true; expect(guest.paused).toBe(false);
});
