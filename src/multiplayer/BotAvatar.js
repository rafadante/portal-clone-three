import { applyGunAppearance } from './gunAppearance';
import { attachBotGun } from './botGun';
import { AnimationMixer, Box3, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { GLOBALS } from '../Globals';
import { botAnimationClips } from './BotAnimations';

const templates = new Map();
const draco = new DRACOLoader().setDecoderPath('draco/');
const loader = new GLTFLoader().setDRACOLoader(draco);
let original;
export function rememberOriginalAvatar() {
  if (!original) original = { model: GLOBALS.PLAYER_MODEL, clone: GLOBALS.PLAYER_MODEL_CLONE, mixer: GLOBALS.MIXERS, mixerClone: GLOBALS.MIXERS_CLONE, hand: window.hand, left: window.handLeft, neck: window.neck };
}

async function template(model) {
  if (!templates.has(model)) {
    const promise = (async () => {
      rememberOriginalAvatar();
      const glb = await loader.loadAsync(`./assets/3ds/avatar/${model}.glb`);
      const root = glb.scene;
      root.updateMatrixWorld(true);
      const box = new Box3().setFromObject(root);
      root.scale.multiplyScalar(1.35 / box.getSize(new Vector3()).y);
      root.updateMatrixWorld(true);
      const clips = await botAnimationClips(root);
      return {root,clips};
    })();
    templates.set(model,promise);
    promise.catch(()=>templates.delete(model));
  }
  return templates.get(model);
}

export async function createBot(profile) {
  const {root,clips} = await template(profile.model);
  const bot = clone(root);
  bot.userData.bot = true;
  bot.userData.avatar = { ...profile };
  bot.traverse(object=> {
    if (!object.isMesh) return;
    const copy = material => {
      const m = material.clone();
      if (!/joint/i.test(m.name)) m.color.set(profile.color);
      m.envMap = GLOBALS.ENV_MAP; m.envMapIntensity = .5;
      m.clippingPlanes = []; m.visible = true; m.opacity=1; m.colorWrite=true; m.depthWrite=true;
      return m;
    };
    object.material=Array.isArray(object.material)?object.material.map(copy):copy(object.material);
    object.castShadow=true;
  });
  const mixer = new AnimationMixer(bot);
  bot.animationActions = Object.fromEntries(Object.entries(clips).map(([name,clip])=>[name,mixer.clipAction(clip)]));
  bot.modelReady=true;
  mixer.clipAction(bot.animationActions.ANIM_STANDING_IDLE.getClip()).play();
  mixer.update(0); bot.updateMatrixWorld(true);
  bot.userData.floorOffset = -new Box3().setFromObject(bot, true).min.y - 0.025;
  mixer.stopAllAction();
  if (GLOBALS.GUN_CLONE) { attachBotGun(bot,GLOBALS.GUN_CLONE); applyGunAppearance(bot.portalGun,profile.gunStyle); }
  return {bot,mixer};
}

export async function installLocalBot(profile) {
  rememberOriginalAvatar();
  const {bot,mixer}=await createBot(profile);
  const duplicate=clone(bot); duplicate.portalGun=duplicate.getObjectByName('coop-portal-gun');
  duplicate.traverse(o=>{if(o.isMesh)o.material=Array.isArray(o.material)?o.material.map(m=>m.clone()):o.material.clone();});
  const mixerClone=new AnimationMixer(duplicate);
  duplicate.animationActions=Object.fromEntries(Object.entries(bot.animationActions).map(([name,action])=>[name,mixerClone.clipAction(action.getClip())]));
  GLOBALS.PLAYER_MODEL?.removeFromParent(); GLOBALS.PLAYER_MODEL_CLONE?.removeFromParent();
  GLOBALS.PLAYER_MODEL=bot; GLOBALS.PLAYER_MODEL_CLONE=duplicate;
  GLOBALS.MIXERS=mixer; GLOBALS.MIXERS_CLONE=mixerClone;
  window.hand=bot.getObjectByName('mixamorigRightHand'); window.handLeft=bot.getObjectByName('mixamorigLeftForeArm'); window.neck=bot.getObjectByName('mixamorigNeck');
  GLOBALS.SCENE_CHILDREN.add(bot,duplicate);
  bot.position.y=100000; duplicate.position.y=100000;
}

export function restoreOriginalAvatar() {
  if (!original || !GLOBALS.PLAYER_MODEL?.userData.bot) return;
  GLOBALS.PLAYER_MODEL.removeFromParent(); GLOBALS.PLAYER_MODEL_CLONE.removeFromParent();
  Object.assign(GLOBALS,{PLAYER_MODEL:original.model,PLAYER_MODEL_CLONE:original.clone,MIXERS:original.mixer,MIXERS_CLONE:original.mixerClone});
  window.hand=original.hand; window.handLeft=original.left; window.neck=original.neck;
  GLOBALS.SCENE_CHILDREN.add(original.model,original.clone);
}
