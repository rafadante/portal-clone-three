import { CanvasTexture, Raycaster, Sprite, SpriteMaterial, Vector2 } from 'three';

export const PING_SECONDS = 4;
export const validPing = ping => ping === null || (ping && Number.isSafeInteger(ping.seq) && ping.seq > 0 &&
  Array.isArray(ping.p) && ping.p.length === 3 && ping.p.every(n => Number.isFinite(n) && Math.abs(n) <= 10000) &&
  Number.isFinite(ping.ttl) && ping.ttl > 0 && ping.ttl <= PING_SECONDS);

export function pickPingPoint(camera, targets) {
  const meshes = new Set();
  camera.updateWorldMatrix(true, false);
  for (const root of targets.filter(Boolean)) {
    root.updateWorldMatrix(true, true);
    root.traverseVisible(object => { if (object.isMesh) meshes.add(object); });
  }
  const ray = new Raycaster();
  ray.setFromCamera(new Vector2(), camera);
  ray.near = .05; ray.far = 1000;
  const hit = ray.intersectObjects([...meshes], false)[0];
  return hit ? hit.point.clone().addScaledVector(ray.ray.direction, -.03) : null;
}

function eyeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(8,18,25,.8)';
  ctx.beginPath(); ctx.arc(64,64,56,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(20,64); ctx.quadraticCurveTo(64,15,108,64); ctx.quadraticCurveTo(64,113,20,64); ctx.closePath(); ctx.stroke();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(64,64,14,0,Math.PI*2); ctx.fill();
  return new CanvasTexture(canvas);
}

export class PingMarkers {
  constructor(scene, slot, { texture = eyeTexture(), now = () => Date.now(), colors = [0x00e1ff, 0xa555ff] } = {}) {
    this.scene = scene; this.slot = slot; this.texture = texture; this.now = now; this.colors = colors;
    this.markers = new Map(); this.seq = 0; this.remoteSeq = 0;
  }
  show(ping, slot) {
    this.remove(slot);
    const material = new SpriteMaterial({ map: this.texture, color: this.colors[slot], depthTest: false, depthWrite: false, transparent: true });
    const sprite = new Sprite(material);
    sprite.name = 'coop-eye-ping'; sprite.position.fromArray(ping.p); sprite.scale.setScalar(.45);
    sprite.renderOrder = 1000; this.scene.add(sprite);
    this.markers.set(slot, { sprite, expires: this.now() + ping.ttl * 1000, seq: ping.seq, p: [...ping.p] });
  }
  place(point) {
    const ping = { seq: ++this.seq, p: point.toArray(), ttl: PING_SECONDS };
    this.show(ping, this.slot);
  }
  snapshot() {
    const marker = this.markers.get(this.slot), ttl = marker && (marker.expires - this.now()) / 1000;
    return ttl > 0 ? { seq: marker.seq, p: marker.p, ttl } : null;
  }
  receive(ping) {
    if (!validPing(ping) || !ping || ping.seq <= this.remoteSeq) return;
    this.remoteSeq = ping.seq;
    this.show(ping, this.slot ^ 1);
  }
  update() {
    for (const [slot, marker] of this.markers) {
      const remaining = marker.expires - this.now();
      if (remaining <= 0) this.remove(slot);
      else marker.sprite.material.opacity = Math.min(1, remaining / 800);
    }
  }
  remove(slot) {
    const marker = this.markers.get(slot);
    if (marker) { marker.sprite.removeFromParent(); marker.sprite.material.dispose(); this.markers.delete(slot); }
  }
  dispose() {
    for (const slot of this.markers.keys()) this.remove(slot);
    this.texture.dispose();
  }
}
