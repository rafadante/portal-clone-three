import { PausedClock } from '../PausedClock';
test('animations preserve their phase through repeated shared pauses', () => {
 let time=100; const clock=new PausedClock(()=>time);
 expect(clock.read()).toBe(100); clock.setPaused(true); time=5000; expect(clock.read()).toBe(100);
 clock.setPaused(true); clock.setPaused(false); time=5020; expect(clock.read()).toBe(120);
 clock.setPaused(true); time=9000; expect(clock.read()).toBe(120); clock.setPaused(false); time=9010;
 expect(clock.read()).toBe(130);
});
