import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { BOT_ANIMATION_FILES, BOT_DANCE_FILES, prepareBotClip } from './botAnimationClips';

const loader = new FBXLoader();
let animations;
async function loadAnimations() {
  if (!animations) {
    animations = Promise.all(Object.entries({ ...BOT_ANIMATION_FILES, ...BOT_DANCE_FILES }).map(async ([name, file]) => {
      const source = await loader.loadAsync(`./assets/3ds/avatar/bots/${file}`);
      return { name, source, clip: source.animations[0] };
    }));
    animations.catch(() => { animations = null; });
  }
  return animations;
}

export async function botAnimationClips(target) {
  const clips = {};
  for (const { name, source, clip } of await loadAnimations()) {
    clips[name] = prepareBotClip(target, source, clip, name);
    // The supplied files have one pose set; use it both with and without the gun.
    clips[`${name}_NO_GUN`] = clips[name].clone();
    clips[`${name}_NO_GUN`].name = `${name}_NO_GUN`;
  }
  return clips;
}
