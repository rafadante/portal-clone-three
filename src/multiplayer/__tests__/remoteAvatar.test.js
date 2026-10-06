import { Object3D, AnimationClip, AnimationMixer, NumberKeyframeTrack } from 'three';
import { RemoteAvatar, validAnimation } from '../RemoteAvatar';

test('remote avatar plays independent clips and switches from running to idle', () => {
 const local = new Object3D(), remote = new Object3D(), mixer = new AnimationMixer(local);
 const clip = new AnimationClip('run', 1, [new NumberKeyframeTrack('.position[x]', [0,1], [0,10])]);
 const idle = new AnimationClip('idle', 1, [new NumberKeyframeTrack('.position[x]', [0,1], [0,0])]);
 const source = { ANIM_STATIONARY_RUNNING: mixer.clipAction(clip), ANIM_STANDING_IDLE: mixer.clipAction(idle) };
 const avatar = new RemoteAvatar(remote,source);
 avatar.update('ANIM_STATIONARY_RUNNING',.5);
 expect(remote.position.x).toBeCloseTo(5);
 expect(local.position.x).toBe(0);
 avatar.update('ANIM_STANDING_IDLE',.5); avatar.update('ANIM_STANDING_IDLE',.2);
 expect(remote.position.x).toBeCloseTo(0);
 avatar.dispose();
});

test('accepts gun and no-gun animations and rejects arbitrary network names', () => {
 expect(validAnimation('ANIM_JUMP_NO_GUN')).toBe(true);
 expect(validAnimation('ANIM_RIGHT_STRAFE')).toBe(true);
 expect(validAnimation('__proto__')).toBe(false);
});
