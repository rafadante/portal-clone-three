import { AnimationMixer, LoopOnce } from 'three';

export const validAnimation = name => typeof name === 'string' && /^ANIM_(STANDING_IDLE|STATIONARY_RUNNING|BACKWARD_RUNNING|JUMP|FALLING_IDLE|LEFT_STRAFE|RIGHT_STRAFE|DANCE_[1-7])(_NO_GUN)?$/.test(name);

export class RemoteAvatar {
  constructor(model, sourceActions) {
    this.mixer = new AnimationMixer(model);
    this.sourceActions = sourceActions;
  }
  update(name, delta, revision = 0) {
    const source = this.sourceActions[validAnimation(name) ? name : 'ANIM_STANDING_IDLE'];
    if (!source) return;
    const next = this.mixer.clipAction(source.getClip());
    if (next !== this.action || (/^ANIM_DANCE_/.test(name) && revision !== this.revision)) {
      this.action?.fadeOut(0.15);
      next.reset().fadeIn(0.15).play();
      if (/^ANIM_DANCE_/.test(name)) { next.setLoop(LoopOnce, 1); next.clampWhenFinished = true; }
      this.action = next;
      this.revision = revision;
    }
    this.mixer.update(delta);
  }
  dispose() {
    this.mixer.stopAllAction();
    this.mixer.uncacheRoot(this.mixer.getRoot());
  }
}
