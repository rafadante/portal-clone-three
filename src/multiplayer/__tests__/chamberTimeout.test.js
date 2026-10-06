jest.mock('../../Globals', () => ({GLOBALS:{MULTIPLAYER:null}}));
import { GLOBALS } from '../../Globals';
import { chamberTimeout } from '../chamberTimeout';
afterEach(()=>{GLOBALS.MULTIPLAYER=null;jest.useRealTimers();});
test('dispenser and puzzle delays do not expire while either peer pauses', () => {
 jest.useFakeTimers('modern'); let paused=true; GLOBALS.MULTIPLAYER={isPaused:()=>paused};
 const callback=jest.fn(); chamberTimeout(callback,100);
 jest.advanceTimersByTime(2000); expect(callback).not.toHaveBeenCalled();
 paused=false; jest.advanceTimersByTime(120); expect(callback).toHaveBeenCalledTimes(1);
 expect(jest.getTimerCount()).toBe(0);
});
