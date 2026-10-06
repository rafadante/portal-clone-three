import { Bone, Group, AnimationClip, VectorKeyframeTrack, QuaternionKeyframeTrack } from 'three';
import { BOT_ANIMATION_FILES, prepareBotClip } from '../botAnimationClips';

test('native bot clips preserve rotations and prevent root motion from duplicating physics', () => {
  const bot = new Group(), hips = new Bone(), source = new Group(), sourceHip = new Bone();
  hips.name = sourceHip.name = 'mixamorigHips'; hips.position.set(1,100,2); sourceHip.position.y = 90;
  bot.add(hips); source.add(sourceHip);
  const clip = new AnimationClip('jump', 1, [
    new VectorKeyframeTrack('mixamorigHips.position', [0,1], [0,90,0,50,200,100]),
    new QuaternionKeyframeTrack('mixamorigHips.quaternion', [0,1], [0,0,0,1,0,0,1,0]),
    new VectorKeyframeTrack('unknown.position', [0,1], [0,0,0,1,1,1]),
  ]);
  const prepared = prepareBotClip(bot,source,clip,'ANIM_JUMP');
  expect(prepared.tracks).toHaveLength(2);
  expect([...prepared.tracks[0].values]).toEqual([1,100,2,1,115,2]);
  expect([...prepared.tracks[1].values]).toEqual([...clip.tracks[1].values]);
  expect(clip.tracks[0].values[3]).toBe(50);
});

test('native bot animation list includes every movement and rejects incompatible rigs', () => {
  expect(Object.values(BOT_ANIMATION_FILES)).toHaveLength(7);
  expect(BOT_ANIMATION_FILES.ANIM_FALLING_IDLE).toBe('FallingIdle.fbx');
  const clip = new AnimationClip('bad',1,[new QuaternionKeyframeTrack('wrist_R.quaternion',[0],[0,0,0,1])]);
  expect(()=>prepareBotClip(new Group(),new Group(),clip,'bad')).toThrow('Rig incompatível');
});
