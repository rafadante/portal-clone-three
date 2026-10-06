import { LoopOnce } from 'three';

export function startBotDance(model, duplicate, code) {
  const digit = /^(?:Digit|Numpad)([1-7])$/.exec(code)?.[1];
  if (!digit || !model?.userData.bot) return false;
  const name = `ANIM_DANCE_${digit}`, action = model.animationActions[name];
  if (!action) return false;
  model.dance = { name, remaining: action.getClip().duration };
  model.danceRevision = (model.danceRevision || 0) + 1;
  for (const bot of [model, duplicate]) {
    const dance = bot?.animationActions[name];
    if (dance) { dance.reset().setLoop(LoopOnce, 1); dance.clampWhenFinished = true; }
  }
  return true;
}

export function botDanceAnimation(model, delta, moving) {
  if (!model?.dance) return null;
  if (moving || model.dance.remaining <= 0) { model.dance = null; return null; }
  model.dance.remaining -= delta;
  return model.dance.name;
}
