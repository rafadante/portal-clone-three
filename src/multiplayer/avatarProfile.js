import { readGunAppearance, validGunAppearance } from './gunAppearance';
export const DEFAULT_AVATAR = { model: 'ybot', color: '#00baca' };
export function validAvatar(profile) {
  return profile && (profile.gunStyle === undefined || validGunAppearance(profile.gunStyle)) && ['xbot', 'ybot'].includes(profile.model) && /^#[0-9a-f]{6}$/i.test(profile.color);
}
export function readAvatar(test = false) {
  try {
    const profile = JSON.parse(localStorage.getItem(test ? 'test-avatar' : 'coop-avatar'));
    if (validAvatar(profile) || (test && profile?.model === 'chell' && /^#[0-9a-f]{6}$/i.test(profile.color))) return profile;
  } catch (_) {}
  return { ...DEFAULT_AVATAR, ...(test ? { model: 'chell' } : {}) };
}

let pending;
export function chooseAvatar({ test = false } = {}) {
  if (pending) return pending;
  pending = new Promise(resolve => {
    const profile = readAvatar(test);
    const panel = document.createElement('section');
    panel.id = 'coop-avatar-picker';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-labelledby', 'coop-avatar-title');
    const swatches = [['#6bc442','Verde'], ['#f58b1b','Laranja'], ['#59b4e5','Azul'], ['#d52e32','Vermelho'], ['#ffdf15','Amarelo'], ['#f4f5f6','Branco']];
    const aperture = '<svg class="avatar-aperture" viewBox="0 0 100 100" aria-hidden="true">' + Array.from({length:8}, (_,i) => '<path d="M48 3 A47 47 0 0 1 79 12 L62 42 L48 3Z" transform="rotate(' + i*45 + ' 50 50)"/>').join('') + '</svg>';
    panel.innerHTML = `<header>${aperture}<h2 id="coop-avatar-title">${test ? 'Teste de câmara' : 'Câmara cooperativa'}</h2><span class="avatar-rule"></span></header>
      <div class="avatar-picker-body"><div class="avatar-intro"><svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="64" cy="40" rx="9" ry="35" fill="none" stroke="#20bdeb" stroke-width="5"/><g fill="#283338"><circle cx="34" cy="20" r="7"/><path d="M24 31 L39 29 L49 42 L61 42 L61 48 L45 48 L37 39 L32 52 L47 62 L45 76 L38 76 L39 65 L24 58 L13 73 L7 69 L23 48 L27 37 L21 38 L15 47 L9 44 L18 32Z"/></g></svg><div><h3>${test ? 'Personagem para o teste' : 'Escolha seu bot'}</h3><p>${test ? 'Teste a câmara com Chell ou com um dos bots.' : 'Seu parceiro verá este personagem na câmara cooperativa.'}</p></div></div>
      <label for="coop-avatar-model">Modelo</label>
      <select id="coop-avatar-model">${test ? '<option value="chell">Chell</option>' : ''}<option value="xbot">Feminino · XBot</option><option value="ybot">Masculino · YBot</option></select>
      <div class="avatar-color-section"><label for="coop-avatar-color">Cor do bot</label><div class="avatar-swatches">${swatches.map(([value,name]) => '<button type="button" class="avatar-swatch" data-color="' + value + '" style="--swatch:' + value + '" aria-label="' + name + '" aria-pressed="false"></button>').join('')}<input id="coop-avatar-color" type="color" aria-label="Cor personalizada do bot" title="Cor personalizada do bot" /></div></div>
      <fieldset><legend><img src="./assets/ui/items/gun.webp" alt="" />Portal gun</legend>
      <label for="portal-gun-color">Cor</label><div class="avatar-gun-color"><input id="portal-gun-color" type="color" /><span aria-hidden="true">▾</span></div>
      <div class="avatar-material-fields"><div><label for="portal-gun-roughness">Rugosidade</label><input id="portal-gun-roughness" type="number" min="0" max="1" step="0.1" /></div>
      <div><label for="portal-gun-metalness">Metalização</label><input id="portal-gun-metalness" type="number" min="0" max="1" step="0.1" /></div></div></fieldset>
      <button id="coop-avatar-confirm"><span aria-hidden="true">▶</span>${test ? 'Iniciar teste' : 'Continuar'}</button></div>`;
    document.body.appendChild(panel);
    const model = panel.querySelector('#coop-avatar-model'), color = panel.querySelector('#coop-avatar-color');
    model.value = profile.model; color.value = profile.color;
    const gunStyle = readGunAppearance();
    for (const key of ['color','roughness','metalness']) panel.querySelector('#portal-gun-' + key).value = gunStyle[key];
    const updateColor = () => {
      const chell = model.value === 'chell';
      color.disabled = chell;
      panel.querySelector('.avatar-color-section').hidden = chell;
    };
    const updateSwatches = () => panel.querySelectorAll('.avatar-swatch').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.color === color.value.toLowerCase())));
    panel.querySelectorAll('.avatar-swatch').forEach(button => { button.onclick = () => { color.value = button.dataset.color; updateSwatches(); }; });
    color.oninput = updateSwatches;
    updateSwatches();
    model.onchange = updateColor;
    updateColor();
    panel.querySelector('#coop-avatar-confirm').onclick = () => {
      const gunStyle = {
        color: panel.querySelector('#portal-gun-color').value,
        roughness: Math.max(0, Math.min(1, Number(panel.querySelector('#portal-gun-roughness').value))),
        metalness: Math.max(0, Math.min(1, Number(panel.querySelector('#portal-gun-metalness').value))),
      };
      for (const key of ['color','roughness','metalness']) {
        const input = panel.querySelector('#portal-gun-' + key);
        input.value = gunStyle[key]; input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      const choice = { model: model.value, color: color.value, gunStyle };
      try { localStorage.setItem(test ? 'test-avatar' : 'coop-avatar', JSON.stringify(choice)); } catch (_) {}
      panel.remove(); pending = null; resolve(choice);
    };
    model.focus();
  });
  return pending;
}
