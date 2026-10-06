import { Quaternion, Vector3 } from 'three';
export const BOT_ANIMATION_FILES = {
  ANIM_STANDING_IDLE: 'StandingIdle.fbx',
  ANIM_STATIONARY_RUNNING: 'StationaryRunning.fbx',
  ANIM_BACKWARD_RUNNING: 'RunningBackward.fbx',
  ANIM_LEFT_STRAFE: 'LeftStrafe.fbx',
  ANIM_RIGHT_STRAFE: 'RightStrafe.fbx',
  ANIM_JUMP: 'Jump.fbx',
  ANIM_FALLING_IDLE: 'FallingIdle.fbx',
};
export const BOT_DANCE_FILES = Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`ANIM_DANCE_${i + 1}`, `dance/${i + 1}.fbx`]));

export function prepareBotClip(target, source, animation, name) {
  if (!animation?.tracks.length) throw new Error(`Animação do bot ausente: ${name}`);
  const bones = new Map();
  target.traverse(bone => { if (bone.isBone) bones.set(bone.name, bone); });
  const clip = animation.clone();
  clip.name = name;
  clip.tracks = clip.tracks.filter(track => {
    const [boneName, property] = track.name.split('.');
    const bone = bones.get(boneName);
    if (!bone) return false;
    if (property === 'quaternion') {
      if (boneName === 'mixamorigHips') {
        target.updateMatrixWorld(true); source.updateMatrixWorld(true);
        const sourceHip = source.getObjectByName(boneName);
        const basis = bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(sourceHip.parent.getWorldQuaternion(new Quaternion()));
        for (let i=0;i<track.values.length;i+=4) basis.clone().multiply(new Quaternion().fromArray(track.values,i)).toArray(track.values,i);
      }
      return true;
    }
    if (property !== 'position' || boneName !== 'mixamorigHips') return false;
    const sourceHip = source.getObjectByName(boneName);
    target.updateMatrixWorld(true); source.updateMatrixWorld(true);
    const baseline = sourceHip.position;
    const ratio = bone.position.length() / (baseline.length() || 1);
    const basis = bone.parent.getWorldQuaternion(new Quaternion()).invert().multiply(sourceHip.parent.getWorldQuaternion(new Quaternion()));
    for (let i = 0; i < track.values.length; i += 3) {
      const delta = new Vector3(0, Math.max(-15,Math.min(15,(track.values[i+1]-baseline.y)*ratio)), 0).applyQuaternion(basis);
      bone.position.clone().add(delta).toArray(track.values,i);
    }
    return true;
  });
  if (!clip.tracks.some(track => track.name.endsWith('.quaternion'))) throw new Error(`Rig incompatível na animação: ${name}`);
  return clip;
}
