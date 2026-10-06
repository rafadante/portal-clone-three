import { GLOBALS } from '../Globals';

export function crosshairSource({ slot = 0, portalMode, gun = 'both', last = 'none', colors = [0x00e1ff, 0xffc600, 0xa555ff, 0x50ff83] } = {}) {
  if (gun === 'none') return './assets/textures/crosshairNull.png';
  if (slot !== 1 || portalMode === 'shared') {
    if (gun === 'left') return './assets/ui/mobile/portalBlue.png';
    if (gun === 'right') return './assets/ui/mobile/portalOrange.png';
    return `./assets/textures/crosshair${last === 'left' ? 'Blue' : last === 'right' ? 'Orange' : 'None'}.png`;
  }
  const purple = '#' + colors[2].toString(16).padStart(6, '0');
  const green = '#' + colors[3].toString(16).padStart(6, '0');
  const arc = (side, color, path) => gun === 'both' || !['left','right'].includes(gun) || gun === side
    ? `<path d="${path}" fill="none" stroke="${color}" stroke-width="${last === side ? 5 : 3}" stroke-linecap="round"/>` : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 72"><g transform="rotate(15 25 36)">${arc('left', purple, 'M25 8 A18 28 0 0 0 25 64')}${arc('right', green, 'M25 64 A18 28 0 0 0 25 8')}</g><g fill="#f4f4f4">${[[25,36],[25,28],[25,44],[15,36],[35,36]].map(([x,y]) => `<circle cx="${x}" cy="${y}" r="1"/>`).join('')}</g></svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function updateCrosshair(last = 'none') {
  const image = document.getElementById('reticle-img');
  if (!image) return;
  image.src = crosshairSource({ slot: GLOBALS.MULTIPLAYER?.slot, portalMode: GLOBALS.CHAMBER_CONFIG?.portalMode, gun: GLOBALS.PORTAL_GUN_INITIATE, last, colors: GLOBALS.PORTAL_COLORS });
  image.style.filter = GLOBALS.PORTAL_GUN_INITIATE === 'none' ? 'invert(1)' : 'none';
  image.alt = 'Mira';
}
