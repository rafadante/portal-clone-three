// Runtime puzzle values only: authored settings and model assets stay in the map.
const FLAGS = ['state', 'isActive', 'buttons', 'reversed', 'active', 'opened'];
const NODES = ['pivot2', 'portal_door_right_04', 'portal_door_left_06', 'central_spinner_right_05', 'central_spinner_left_07'];
const scalar = v => typeof v === 'boolean' || (Number.isFinite(v) && Math.abs(v) <= 10000);
const vec = (v,n) => Array.isArray(v) && v.length === n && v.every(x => Number.isFinite(x) && Math.abs(x) <= 10000);
export function validChamberState(state) {
  return state && (state.connections === undefined || (Array.isArray(state.connections) && state.connections.length <= 100000 && state.connections.every(x => typeof x === 'boolean'))) && typeof state.entered === 'boolean' && Array.isArray(state.items) && state.items.length <= 100000
    && state.items.every(o => o && Number.isSafeInteger(o.id) && o.id >= 0
      && o.flags && Object.keys(o.flags).every(k => FLAGS.includes(k) && scalar(o.flags[k]))
      && (o.open === undefined || typeof o.open === 'boolean')
      && (o.visible === undefined || typeof o.visible === 'boolean')
      && Array.isArray(o.nodes) && o.nodes.length <= NODES.length && o.nodes.every(n => NODES.includes(n.name) && vec(n.p,3) && vec(n.q,4) && Math.abs(Math.hypot(...n.q)-1)<.01));
}
export function snapshotChamber(globals) {
  return { connections: (globals.CONNECTIONS || []).map(c => Boolean(c.line.active)), entered: Boolean(globals.LEVEL_ENTERED), items: globals.PLANE_USER_DATA.flatMap((plane,id) => {
    const item = plane?.item;
    if (!item?.userData) return [];
    const flags = Object.fromEntries(FLAGS.filter(k => scalar(item.userData[k])).map(k => [k,item.userData[k]]));
    const nodes = NODES.flatMap(name => {
      const n = item.getObjectByName?.(name);
      return n ? [{name,p:n.position.toArray(),q:n.quaternion.toArray()}] : [];
    });
    return [{id,flags,nodes, ...(typeof item.open === 'boolean' ? {open:item.open} : {}),
      ...(item.continuous ? {visible:item.continuous.visible} : {})}];
  }) };
}
export function applyChamberState(globals, state, onConnection) {
  globals.LEVEL_ENTERED = state.entered;
  state.connections?.forEach((active, index) => {
    const connection = globals.CONNECTIONS?.[index];
    if (connection) onConnection?.(connection, active);
  });
  for (const o of state.items) {
    const item = globals.PLANE_USER_DATA[o.id]?.item;
    if (!item?.userData) continue;
    Object.assign(item.userData,o.flags);
    if (o.open !== undefined) { item.open = o.open; if (item.body) item.body.collisionResponse = o.open ? 0 : 1; }
    for (const n of o.nodes) {
      const child = item.getObjectByName?.(n.name);
      if (child) { child.position.fromArray(n.p); child.quaternion.fromArray(n.q); }
    }
    if (o.visible !== undefined && item.continuous) {
      item.continuous.visible = o.visible;
      if (typeof o.flags.reversed === 'boolean' && globals.MATERIAL_TRACTOR_BEAM) {
        item.continuous.material = o.flags.reversed ? globals.MATERIAL_TRACTOR_BEAM_REVERSE : globals.MATERIAL_TRACTOR_BEAM;
      }
      if (item.clone) item.clone.visible = o.visible;
      for (const body of [item.bodyBridge,item.bodyLaserField]) {
        if (!body) continue;
        const present = globals.CANNON_WORLD.bodies.includes(body);
        if (o.visible && !present) globals.CANNON_WORLD.addBody(body);
        else if (!o.visible && present) globals.CANNON_WORLD.removeBody(body);
      }
    }
  }
}
