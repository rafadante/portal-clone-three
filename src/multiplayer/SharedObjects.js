// Stable chamber item keys; Cannon body ids differ between clients.
export function validObjects(objects) {
  return Array.isArray(objects) && objects.length <= 2000 && objects.every(o => o
    && typeof o.id === 'string' && o.id.length <= 100
    && Number.isSafeInteger(o.rev) && o.rev >= 0 && (o.owner === 0 || o.owner === 1)
    && (o.mass === undefined || (Number.isFinite(o.mass) && o.mass >= 0 && o.mass <= 10000))
    && (o.down === undefined || typeof o.down === 'boolean')
    && typeof o.held === 'boolean'
    && [o.p, o.v, o.w].every(v => Array.isArray(v) && v.length === 3 && v.every(x => Number.isFinite(x) && Math.abs(x) <= 10000))
    && Array.isArray(o.q) && o.q.length === 4 && o.q.every(Number.isFinite)
    && Math.abs(Math.hypot(...o.q) - 1) < .01);
}
export class SharedObjects {
  constructor(slot, items) {
    this.slot = slot;
    this.entries = new Map();
    Object.keys(items).sort().forEach(name => items[name].forEach((item, index) => {
      if (name !== 'dispenser' && item?.body && (item.body.mass > 0 || item.body.initialMass > 0 || name === 'piston_platforms' || name === 'track_platforms')) this.entries.set(`${name}:${item.userData?.planeInstancedId ?? index}`, {
        body: item.body, item, name, index, owner: 0, rev: 0, held: false, remote: null,
      });
    }));
  }
  claim(body) {
    const entry = [...this.entries.values()].find(e => e.body === body);
    if (!entry) return true;
    if (entry.held && entry.owner !== this.slot) return false;
    entry.owner = this.slot; entry.rev++; entry.held = true; entry.remote = null;
    return true;
  }
  snapshot() {
    const vec = v => [v.x, v.y, v.z];
    return [...this.entries].filter(([, e]) => e.owner === this.slot).map(([id, e]) => {
      e.held = Boolean(e.body.holding);
      const b = e.body;
      return { id, owner: e.owner, rev: e.rev, held: e.held, mass: b.mass, down: Boolean(b.pistonDown), p: vec(b.position),
        q: [b.quaternion.x, b.quaternion.y, b.quaternion.z, b.quaternion.w], v: vec(b.velocity), w: vec(b.angularVelocity) };
    });
  }
  receive(objects, sender) {
    for (const o of objects) {
      const e = this.entries.get(o.id);
      if (!e || o.owner !== sender || o.rev < e.rev) continue;
      // Resolve simultaneous grabs consistently: player 1 wins equal revisions.
      if (o.rev === e.rev && o.owner > e.owner) continue;
      e.owner = o.owner; e.rev = o.rev; e.held = o.held; e.remote = o;
    }
  }
  apply() {
    for (const e of this.entries.values()) {
      if (e.owner === this.slot || !e.remote) continue;
      const b = e.body, o = e.remote;
      b.position.set(...o.p); b.quaternion.set(...o.q);
      b.velocity.set(...o.v); b.angularVelocity.set(...o.w);
      if (o.mass !== undefined && b.mass !== o.mass) { b.mass = o.mass; b.updateMassProperties?.(); }
      b.pistonDown = o.down;
      b.holding = o.held; b.aabbNeedsUpdate = true;
      b.interpolatedPosition?.copy(b.position);
      b.interpolatedQuaternion?.copy(b.quaternion);
    }
  }
}
