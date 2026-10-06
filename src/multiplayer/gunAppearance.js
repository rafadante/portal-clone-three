export function validGunAppearance(style) {
  return style && /^#[0-9a-f]{6}$/i.test(style.color) && ['roughness','metalness'].every(key => Number.isFinite(style[key]) && style[key] >= 0 && style[key] <= 1);
}
export function readGunAppearance() {
  const style = { color: '#ffffff', roughness: 1, metalness: 0 };
  try {
    const color = localStorage.getItem('portal_gun_color');
    if (/^#[0-9a-f]{6}$/i.test(color)) style.color = color;
    for (const key of ['roughness','metalness']) {
      const saved = localStorage.getItem(`portal_gun_${key}`);
      if (saved !== null && Number(saved) >= 0 && Number(saved) <= 1) style[key] = Number(saved);
    }
  } catch (_) {}
  return style;
}
export function applyGunAppearance(root, style) {
  if (!validGunAppearance(style)) return;
  const material = root?.getObjectByName('Object_6')?.material;
  if (!material) return;
  material.color.set(style.color); material.roughness = style.roughness; material.metalness = style.metalness;
}
