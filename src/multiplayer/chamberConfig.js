export const DEFAULT_CHAMBER_CONFIG = Object.freeze({ version: 1, mode: 'single', portalMode: 'shared' });

export function normalizeChamberConfig(value) {
  return {
    version: 1,
    mode: value?.mode === 'multiplayer' ? 'multiplayer' : 'single',
    portalMode: value?.portalMode === 'independent' ? 'independent' : 'shared',
  };
}

export function readChamberConfig(document) {
  return normalizeChamberConfig(document?.[0]?.[4]);
}

export function portalCount(config) {
  return config.mode === 'multiplayer' && config.portalMode === 'independent' ? 4 : 2;
}

export function ownedPortals(config, slot) {
  if (slot !== 0 && slot !== 1) return [];
  if (config.mode !== 'multiplayer') return slot === 0 ? [0, 1] : [];
  return config.portalMode === 'shared' ? [slot] : [slot * 2, slot * 2 + 1];
}

export function shotPortal(config, slot, button) {
  if (button !== 0 && button !== 2) return null;
  const owned = ownedPortals(config, slot);
  return owned.length === 1 ? owned[0] : (owned[button === 0 ? 0 : 1] ?? null);
}

export function validateChamberDocument(data) {
  if (!Array.isArray(data) || data.length !== 2 || !Array.isArray(data[0]) || !Array.isArray(data[1])) return false;
  if (data[0].length > 5 || data[1].length < 1 || data[1].length > 100000) return false;
  const vector = p => p && ['x', 'y', 'z'].every(k => Number.isFinite(p[k]) && Math.abs(p[k]) <= 10000);
  return data[1].every(p => p && typeof p === 'object' && (!p.exists || (vector(p.position) && p.rotation && typeof p.rotation === 'object')));
}

// Preserve the existing [settings, planes] format. Append metadata to the
// settings array; never replace live meshes or physics bodies while saving.
export function chamberDocument(settings, planes, config) {
  // Extract userData before JSON.stringify invokes Three.js Object3D.toJSON,
  // which otherwise exports the entire model and its textures.
  const savedPlanes = planes.map(plane => ({ ...plane, body: null,
    ...(plane.item?.isObject3D ? { item: plane.item.userData } : {}),
  }));
  const data = [[...settings.slice(0, 4), normalizeChamberConfig(config)], savedPlanes];
  return JSON.parse(JSON.stringify(data, (key, value) => {
    if (key === 'body') return null;
    if (key === 'item' && value?.isObject3D) return value.userData;
    return value;
  }));
}
