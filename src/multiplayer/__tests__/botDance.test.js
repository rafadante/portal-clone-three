import { Object3D, AnimationMixer, AnimationClip, NumberKeyframeTrack, LoopOnce } from 'three';
import { startBotDance, botDanceAnimation } from '../botDance';
import { BOT_DANCE_FILES } from '../botAnimationClips';
import { RemoteAvatar, validAnimation } from '../RemoteAvatar';

function bot() {
  const model = new Object3D(), mixer = new AnimationMixer(model);
  model.userData.bot = true;
  model.animationActions = {};
  for (let i=1;i<=7;i++) {
    const clip = new AnimationClip(`ANIM_DANCE_${i}`, 2, [new NumberKeyframeTrack('.position[x]',[0,2],[0,2])]);
    model.animationActions[clip.name] = mixer.clipAction(clip);
  }
  return model;
}
test('each numeric key selects the matching supplied dance and plays once', () => {
  const model = bot(), duplicate = bot();
  for (let i=1;i<=7;i++) {
    expect(BOT_DANCE_FILES[`ANIM_DANCE_${i}`]).toBe(`dance/${i}.fbx`);
    expect(startBotDance(model,duplicate,`Digit${i}`)).toBe(true);
    expect(botDanceAnimation(model,.1,false)).toBe(`ANIM_DANCE_${i}`);
    expect(model.animationActions[`ANIM_DANCE_${i}`].loop).toBe(LoopOnce);
    expect(duplicate.animationActions[`ANIM_DANCE_${i}`].loop).toBe(LoopOnce);
  }
  expect(startBotDance(model,duplicate,'Numpad3')).toBe(true);
  expect(startBotDance(model,duplicate,'Digit8')).toBe(false);
  expect(startBotDance(new Object3D(),null,'Digit1')).toBe(false);
});
test('movement or finishing the clip releases the dance selection', () => {
  const model = bot();startBotDance(model,null,'Digit1');
  expect(botDanceAnimation(model,.1,true)).toBeNull();
  startBotDance(model,null,'Digit2');
  botDanceAnimation(model,2,false);
  expect(botDanceAnimation(model,.1,false)).toBeNull();
});
test('remote dancers play once and restart when the same dance is requested again', () => {
  const model=bot(), remote=new Object3D(), avatar=new RemoteAvatar(remote,model.animationActions);
  avatar.update('ANIM_DANCE_7',.5,1);
  expect(remote.position.x).toBeCloseTo(.5);
  avatar.update('ANIM_DANCE_7',3,1);
  expect(remote.position.x).toBeCloseTo(2);
  avatar.update('ANIM_DANCE_7',.2,2);
  expect(remote.position.x).toBeCloseTo(.2);
  expect(validAnimation('ANIM_DANCE_8')).toBe(false);
  expect(validAnimation('ANIM_DANCE_1_NO_GUN')).toBe(true);
  avatar.dispose();
});
