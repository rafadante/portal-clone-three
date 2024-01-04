import {
  BufferGeometry,
  Camera,
  Color,
  Frustum,
  InstancedBufferAttribute,
  InstancedMesh,
  Material,
  Matrix4,
  Sphere,
  Vector3,
} from 'three';
import { InstancedEntity, SharedData } from './InstancedEntity';

const _color = new Color();
const _frustum = new Frustum();
const _projScreenMatrix = new Matrix4();
const _sphere = new Sphere();

export class InstancedMesh2 extends InstancedMesh {
  constructor(
    geometry,
    material,
    count,
    onCreateEntity,
    color,
    shared = [],
    visible = true
  ) {
    super(geometry, material, count);
    this.internalCount = count;
    if (color !== undefined) color = _color.set(color);
    if (visible === false) this.count = 0;
    this.instances = new Array(count);
    this._internalInstances = new Array(count);

    for (let i = 0; i < count; i++) {
      const instance = new InstancedEntity(
        this,
        i,
        color,
        shared[i],
        visible
      );
      if (onCreateEntity) onCreateEntity(instance, i);
      this._internalInstances[i] = instance;
      this.instances[i] = instance;
    }

    this.updateInstancedAttributes();
    if (!this.geometry.boundingSphere) this.geometry.computeBoundingSphere();
    this.frustumCulled = false;
  }

  updateInstancedAttributes() {
    const array = [this.instanceMatrix];
    if (this.instanceColor) array.push(this.instanceColor);

    const attributes = this.geometry.attributes;
    for (const key in attributes) {
      if (
        attributes[key].isInstancedBufferAttribute === true
      )
        array.push(attributes[key]);
    }

    this.instancedAttributes = array;
  }

  setInstanceVisibility(instance, value) {
    if (
      value ===
      (instance._visible &&
        (!this._perObjectFrustumCulled || instance._inFrustum))
    )
      return;
    if (value === true) {
      this.swapInstance(instance, this.count);
      this.count++;
    } else {
      this.swapInstance(instance, this.count - 1);
      this.count--;
    }
  }

  setInstancesVisibility(show, hide) {
    const hideLengthMinus = hide.length - 1;
    const length = Math.min(show.length, hide.length);

    show = show.sort(this._sortComparer);
    hide = hide.sort(this._sortComparer);

    for (let i = 0; i < length; i++) {
      this.swapInstance2(show[i], hide[hideLengthMinus - i]);
    }

    this.needsUpdate();

    if (show.length === hide.length) return;

    if (show.length > hide.length)
      this.showInstances(show, length);
    else this.hideInstances(hide, hide.length - length);
  }

  showInstances(entities, count) {
    let startIndex = count;
    let endIndex = entities.length - 1;

    while (endIndex >= startIndex) {
      if (entities[startIndex]._internalId === this.count) {
        startIndex++;
      } else {
        this.swapInstance(entities[endIndex], this.count);
        endIndex--;
      }
      this.count++;
    }
  }

  hideInstances(entities, count) {
    let startIndex = 0;
    let endIndex = count - 1;

    while (endIndex >= startIndex) {
      if (entities[endIndex]._internalId === this.count - 1) {
        endIndex--;
      } else {
        this.swapInstance(entities[startIndex], this.count - 1);
        startIndex++;
      }
      this.count--;
    }
  }

  swapInstance(instanceFrom, idTo) {
    const instanceTo = this._internalInstances[idTo];
    if (instanceFrom === instanceTo) return;
    const idFrom = instanceFrom._internalId;
    this.swapAttributes(idFrom, idTo);
    this._internalInstances[idTo] = instanceFrom;
    this._internalInstances[idFrom] = instanceTo;
    instanceTo._internalId = idFrom;
    instanceFrom._internalId = idTo;
  }

  swapInstance2(instanceFrom, instanceTo) {
    const idFrom = instanceFrom._internalId;
    const idTo = instanceTo._internalId;
    this.swapAttributes(idFrom, idTo);
    this._internalInstances[idTo] = instanceFrom;
    this._internalInstances[idFrom] = instanceTo;
    instanceTo._internalId = idFrom;
    instanceFrom._internalId = idTo;
  }

  swapAttributes(idFrom, idTo) {
    for (const attr of this.instancedAttributes) {
      this.swapAttribute(attr, idTo, idFrom);
    }
  }

  swapAttribute(attr, from, to) {
    const array = attr.array;
    const size = attr.itemSize;
    const fromOffset = from * size;
    const toOffset = to * size;

    const temp = array[fromOffset];
    array[fromOffset] = array[toOffset];
    array[toOffset] = temp;
    for (let i = 1; i < size; i++) {
      const temp = array[fromOffset + i];
      array[fromOffset + i] = array[toOffset + i];
      array[toOffset + i] = temp;
    }
  }

  updateCulling(camera) {
    if (this._perObjectFrustumCulled === false) return;

    _projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    _frustum.setFromProjectionMatrix(_projScreenMatrix);

    const instances = this.instances;
    const bSphere = this.geometry.boundingSphere;
    const radius = bSphere.radius;
    const center = bSphere.center;

    const show = [];
    const hide = [];

    for (let i = 0, l = this.internalCount; i < l; i++) {
      const instance = instances[i];
      if (instance._visible === false) continue;

      _sphere.center.addVectors(center, instance.position);
      _sphere.radius = radius * this.getMax(instance.scale);

      if (
        instance._inFrustum !==
        (instance._inFrustum = _frustum.intersectsSphere(_sphere))
      ) {
        if (instance._inFrustum === true) show.push(instance);
        else hide.push(instance);
      }

      if (instance._inFrustum && instance._needsUpdate) {
        this.composeToArray(instance);
        instance._needsUpdate = false;
      }
    }

    if (show.length > 0 || hide.length > 0)
      this.setInstancesVisibility(show, hide);
  }

  getMax(scale) {
    if (scale.x > scale.y) {
      return scale.x > scale.z ? scale.x : scale.z;
    }
    return scale.y > scale.z ? scale.y : scale.z;
  }

  needsUpdate() {
    for (const attr of this.instancedAttributes) {
      attr.needsUpdate = true;
    }
  }

  updateInstanceMatrix(instance) {
    if (
      this._perObjectFrustumCulled === true ||
      instance._visible === false
    ) {
      instance._needsUpdate = true;
    } else {
      this.composeToArray(instance);
    }
  }

  forceUpdateInstanceMatrix(instance) {
    this.composeToArray(instance);
    instance._needsUpdate = false;
  }

  composeToArray(instance) {
    const te = this.instanceMatrix.array;
    const position = instance.position;
    const quaternion = instance.quaternion;
    const scale = instance.scale;
    const offset = instance._internalId * 16;

    const x = quaternion.x,
      y = quaternion.y,
      z = quaternion.z,
      w = quaternion.w;
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;

    const sx = scale.x,
      sy = scale.y,
      sz = scale.z;

    te[offset] = (1 - (yy + zz)) * sx;
    te[offset + 1] = (xy + wz) * sx;
    te[offset + 2] = (xz - wy) * sx;
    te[offset + 3] = 0;

    te[offset + 4] = (xy - wz) * sy;
    te[offset + 5] = (1 - (xx + zz)) * sy;
    te[offset + 6] = (yz + wx) * sy;
    te[offset + 7] = 0;

    te[offset + 8] = (xz + wy) * sz;
    te[offset + 9] = (yz - wx) * sz;
    te[offset + 10] = (1 - (xx + yy)) * sz;
    te[offset + 11] = 0;

    te[offset + 12] = position.x;
    te[offset + 13] = position.y;
    te[offset + 14] = position.z;
    te[offset + 15] = 1;
  }

  setCount(value) {
    for (let i = 0, l = this.instances.length; i < l; i++) {
      const instance = this.instances[i];
      if (instance._visible !== i < value) {
        if (i < value) {
          instance.visible = true;
          instance._inFrustum = true;
        } else {
          instance.visible = false;
        }
      }
    }
    this.internalCount = value;
    this.needsUpdate();
  }

  enablePerObjectFrustumCulled() {
    for (let i = 0, l = this.instances.length; i < l; i++) {
      this.instances[i]._inFrustum = true;
    }
  }

  disablePerObjectFrustumCulled() {
    const show = [];
    for (let i = 0, l = this.instances.length; i < l; i++) {
      const instance = this.instances[i];
      if (!instance._inFrustum && instance.visible) show.push(instance);
    }
    this.setInstancesVisibility(show, []);
  }
}

InstancedMesh2.prototype.isInstancedMesh2 = true;
InstancedMesh2.prototype.type = 'InstancedMesh2';
