import { crosshairSource } from '../crosshair';
jest.mock('../../Globals', () => ({ GLOBALS: {} }));

test('player 2 uses the purple and green portal colors', () => {
  const image = decodeURIComponent(crosshairSource({ slot: 1, portalMode: 'independent', gun: 'both' }));
  expect(image).toContain('stroke="#a555ff"');
  expect(image).toContain('stroke="#50ff83"');
  expect(image).toContain('stroke-width="3"');
});
test('player 2 highlights the fired side and respects a single portal gun', () => {
  const fired = decodeURIComponent(crosshairSource({ slot: 1, last: 'right' }));
  expect(fired).toContain('stroke="#50ff83" stroke-width="5"');
  const single = decodeURIComponent(crosshairSource({ slot: 1, gun: 'left' }));
  expect(single).toContain('#a555ff');
  expect(single).not.toContain('#50ff83');
});
test('player 1, shared pairs and the empty gun retain their existing reticles', () => {
  expect(crosshairSource({ slot: 0, last: 'left' })).toContain('crosshairBlue.png');
  expect(crosshairSource({ slot: 1, portalMode: 'shared' })).toContain('crosshairNone.png');
  expect(crosshairSource({ slot: 1, gun: 'none' })).toContain('crosshairNull.png');
});
