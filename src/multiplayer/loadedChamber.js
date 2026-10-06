import { readChamberConfig } from './chamberConfig';

let savedDocument = null;
// Capture before the engine replaces serialized items with live meshes/bodies.
export function rememberChamber(document) {
  savedDocument = JSON.parse(JSON.stringify(document));
}
export function getLoadedChamber() {
  return savedDocument ? JSON.parse(JSON.stringify(savedDocument)) : null;
}
export function getLoadedCoopChamber() {
  return savedDocument && readChamberConfig(savedDocument).mode === 'multiplayer' ? getLoadedChamber() : null;
}
