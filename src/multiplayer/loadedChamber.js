import { readChamberConfig } from './chamberConfig';

let savedDocument = null;
// Capture before the engine replaces serialized items with live meshes/bodies.
export function rememberChamber(document) {
  savedDocument = readChamberConfig(document).mode === 'multiplayer'
    ? JSON.parse(JSON.stringify(document)) : null;
}
export function getLoadedCoopChamber() {
  return savedDocument ? JSON.parse(JSON.stringify(savedDocument)) : null;
}
