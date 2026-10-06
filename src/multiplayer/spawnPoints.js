export function playerSpawn(items, slot = 0) {
  return items.getObjectByName(slot === 1 ? 'spawn_player2' : 'spawn');
}

export function replacesEntrance(items, cooperative) {
  return Boolean(playerSpawn(items) && (!cooperative || playerSpawn(items, 1)));
}

export function markEntrance(session, atEntrance, hasSpawn) {
  if (atEntrance || hasSpawn) session.entered = true;
  return session.entered === true && session.remote?.entered === true && session.remote?.ready === true;
}
