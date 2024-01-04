import {
  Color,
  EventDispatcher,
  Matrix4,
  Quaternion,
  Vector3
} from 'three';
import { InstancedMesh2 } from './InstancedMesh2';

export interface SharedData {
  position: Vector3;
  scale: Vector3;
  quaternion: Quaternion;
  index: number;
}

const _q = new Quaternion();
const _m = new Matrix4();
const _c = new Color();

export class InstancedEntity extends EventDispatcher {
  constructor(
    parent,
    index,
    color,
    sharedData,
    visible = true
  ) {
    super();
    this.parent = parent;
    this._internalId = index;
    this._visible = visible;
    if (color !== undefined) this.setColor(color);

    if (sharedData) {
      this.position = sharedData.position;
      this.scale = sharedData.scale;
      this.quaternion = sharedData.quaternion;
    } else {
      this.position = new Vector3();
      this.scale = new Vector3(1, 1, 1);
      this.quaternion = new Quaternion();
    }
  }

  updateMatrix() {
    this.parent.updateInstanceMatrix(this);
  }

  forceUpdateMatrix() {
    this.parent.forceUpdateInstanceMatrix(this);
  }

  setColor(color) {
    const parent = this.parent;
    parent.setColorAt(this._internalId, _c.set(color));
  }

  getColor(color = _c) {
    this.parent.getColorAt(this._internalId, color);
    return color;
  }

  applyMatrix4(m) {
    _m.compose(this.position, this.quaternion, this.scale);
    _m.premultiply(m);
    _m.decompose(this.position, this.quaternion, this.scale);
    this.parent.setMatrixAt(this._internalId, _m);
    return this;
  }

  applyQuaternion(q) {
    this.quaternion.premultiply(q);
    return this;
  }

  rotateOnAxis(axis, angle) {
    _q.setFromAxisAngle(axis, angle);
    this.quaternion.multiply(_q);
    return this;
  }

  rotateOnWorldAxis(axis, angle) {
    _q.setFromAxisAngle(axis, angle);
    this.quaternion.premultiply(_q);
    return this;
  }
}

InstancedEntity.prototype.isInstanceEntity = true;
InstancedEntity.prototype.type = 'InstancedEntity';
