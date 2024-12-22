import { Quaternion as pt, Vector3 as _, Euler as _t, Box3 as N, GLBufferAttribute as gt, DataTexture as z, WebGLUtils as yt, FloatType as G, UnsignedIntType as At, IntType as bt, RGBAFormat as It, RGBAIntegerFormat as St, RGFormat as wt, RGIntegerFormat as Ct, RedFormat as q, RedIntegerFormat as Tt, Sphere as D, Matrix4 as L, Color as vt, Mesh as W, MeshDepthMaterial as Mt, RGBADepthPacking as Ot, MeshDistanceMaterial as Ut, InstancedBufferAttribute as Dt, ColorManagement as Lt, Frustum as Ft, ShaderMaterial as Rt, Ray as Bt, ShaderChunk as f } from "three";
import { BVH as Pt, HybridBuilder as jt, WebGLCoordinateSystem as Et, vec3ToArray as Q, box3ToArray as J } from "three-mesh-bvh";
import { radixSort as Nt } from "three/addons/utils/SortUtils.js";
class dt {
  /**
   * This object is instantiated automatically by setting `createInstances` to `true` in the `InstancedMesh2` constructor parameters.
   * Dont instantiate this manually.
   * @param owner The `InstancedMesh2` that owns this instance.
   * @param id The unique identifier for this instance within the `InstancedMesh2`.
   * @param useEuler Whether to use Euler rotations in addition to quaternion rotations.
   */
  constructor(t, i, e) {
    this.isInstanceEntity = !0, this.position = new _(), this.scale = new _(1, 1, 1), this.id = i, this.owner = t;
    const n = this.quaternion = new pt();
    if (e) {
      const s = this.rotation = new _t();
      s._onChange(() => n.setFromEuler(s, !1)), n._onChange(() => s.setFromQuaternion(n, void 0, !1));
    }
  }
  /**
   * The visibility state set and got from `owner.visibilityArray`.
   */
  get visible() {
    return this.owner.getVisibilityAt(this.id);
  }
  set visible(t) {
    this.owner.setVisibilityAt(this.id, t);
  }
  /**
   * Color set and got from `owner.colorsTexture`.
   */
  get color() {
    return this.owner.getColorAt(this.id);
  }
  set color(t) {
    this.owner.setColorAt(this.id, t);
  }
  /**
   * Opacity set and got from `owner.colorsTexture`.
   */
  get opacity() {
    return this.owner.getOpacityAt(this.id);
  }
  set opacity(t) {
    this.owner.setOpacityAt(this.id, t);
  }
  /**
   * Morph target influences set and got from `owner.morphTexture`.
   */
  get morph() {
    return this.owner.getMorphAt(this.id);
  }
  set morph(t) {
    this.owner.setMorphAt(this.id, t);
  }
  /**
   * The local transform matrix got from `owner.matricesTexture`.
   */
  get matrix() {
    return this.owner.getMatrixAt(this.id);
  }
  /**
   * The world transform matrix got by multiplying the matrix got from `owner.matricesTexture` and `this.owner.matrixWorld`.
   */
  get matrixWorld() {
    return this.matrix.premultiply(this.owner.matrixWorld);
  }
  /**
   * Updates the transformation matrix with its current position, quaternion, and scale.
   * The updated matrix is stored in the `owner.matricesTexture`.
   */
  updateMatrix() {
    var Z;
    const t = this.owner, i = this.position, e = this.quaternion, n = this.scale, s = t.matricesTexture._data, o = this.id, a = o * 16, c = e._x, h = e._y, l = e._z, u = e._w, d = c + c, x = h + h, m = l + l, g = c * d, b = c * x, w = c * m, K = h * x, k = h * m, H = l * m, V = u * d, Y = u * x, X = u * m, R = n.x, B = n.y, P = n.z;
    s[a + 0] = (1 - (K + H)) * R, s[a + 1] = (b + X) * R, s[a + 2] = (w - Y) * R, s[a + 3] = 0, s[a + 4] = (b - X) * B, s[a + 5] = (1 - (g + H)) * B, s[a + 6] = (k + V) * B, s[a + 7] = 0, s[a + 8] = (w + Y) * P, s[a + 9] = (k - V) * P, s[a + 10] = (1 - (g + K)) * P, s[a + 11] = 0, s[a + 12] = i.x, s[a + 13] = i.y, s[a + 14] = i.z, s[a + 15] = 1, t.matricesTexture.enqueueUpdate(o), (Z = t.bvh) == null || Z.move(o);
  }
  /**
   * Updates only the position component of the transformation matrix.
   * This is useful if only position changes, avoiding recalculating the full matrix.
   * The updated matrix is stored in the `owner.matricesTexture`.
   */
  updateMatrixPosition() {
    var o;
    const t = this.owner, i = this.position, e = t.matricesTexture._data, n = this.id, s = n * 16;
    e[s + 12] = i.x, e[s + 13] = i.y, e[s + 14] = i.z, t.matricesTexture.enqueueUpdate(n), (o = t.bvh) == null || o.move(n);
  }
  /**
   * Retrieves the uniform value associated with the given name.
   * @param name The name of the uniform to retrieve.
   * @param target Optional target object where the uniform value will be written.
   * @returns The retrieved uniform value.
   */
  getUniform(t, i) {
    return this.owner.getUniformAt(this.id, t, i);
  }
  /**
   * Sets the uniform value for the given name
   * @param name The name of the uniform to set.
   * @param value The new value for the uniform.
   */
  setUniform(t, i) {
    this.owner.setUniformAt(this.id, t, i);
  }
  /**
   * Copies the transformation properties (`position`, `scale`, `quaternion`) of this instance to the specified `Object3D`.
   * @param target The `Object3D` where the transformation properties will be copied.
   */
  copyTo(t) {
    t.position.copy(this.position), t.scale.copy(this.scale), t.quaternion.copy(this.quaternion), this.rotation && t.rotation.copy(this.rotation);
  }
  /**
   * Applies the matrix transform to the object and updates the object's position, rotation and scale.
   * @param m The matrix to apply.
   * @returns The instance of the object.
   */
  applyMatrix4(t) {
    return this.matrix.premultiply(t).decompose(this.position, this.quaternion, this.scale), this;
  }
  /**
   * Applies the rotation represented by the quaternion to the object.
   * @param q The quaternion representing the rotation to apply.
   * @returns The instance of the object.
   */
  applyQuaternion(t) {
    return this.quaternion.premultiply(t), this;
  }
  /**
   * Rotate an object along an axis in object space. The axis is assumed to be normalized.
   * @param axis A normalized vector in object space.
   * @param angle The angle in radians.
   * @returns The instance of the object.
   */
  rotateOnAxis(t, i) {
    return v.setFromAxisAngle(t, i), this.quaternion.multiply(v), this;
  }
  /**
   * Rotate an object along an axis in world space. The axis is assumed to be normalized. Method Assumes no rotated parent.
   * @param axis A normalized vector in world space.
   * @param angle The angle in radians.
   * @returns The instance of the object.
   */
  rotateOnWorldAxis(t, i) {
    return v.setFromAxisAngle(t, i), this.quaternion.premultiply(v), this;
  }
  /**
   * Rotates the object around x axis in local space.
   * @param angle The angle to rotate in radians.
   * @returns The instance of the object.
   */
  rotateX(t) {
    return this.rotateOnAxis(et, t);
  }
  /**
   * Rotates the object around y axis in local space.
   * @param angle The angle to rotate in radians.
   * @returns The instance of the object.
   */
  rotateY(t) {
    return this.rotateOnAxis(it, t);
  }
  /**
   * Rotates the object around z axis in local space.
   * @param angle The angle to rotate in radians.
   * @returns The instance of the object.
   */
  rotateZ(t) {
    return this.rotateOnAxis(nt, t);
  }
  /**
   * Translate an object by distance along an axis in object space. The axis is assumed to be normalized.
   * @param axis A normalized vector in object space.
   * @param distance The distance to translate.
   * @returns The instance of the object.
   */
  translateOnAxis(t, i) {
    return tt.copy(t).applyQuaternion(this.quaternion), this.position.add(tt.multiplyScalar(i)), this;
  }
  /**
   * Translates object along x axis in object space by distance units.
   * @param distance The distance to translate.
   * @returns The instance of the object.
   */
  translateX(t) {
    return this.translateOnAxis(et, t);
  }
  /**
   * Translates object along y axis in object space by distance units.
   * @param distance The distance to translate.
   * @returns The instance of the object.
   */
  translateY(t) {
    return this.translateOnAxis(it, t);
  }
  /**
   * Translates object along z axis in object space by distance units.
   * @param distance The distance to translate.
   * @returns The instance of the object.
   */
  translateZ(t) {
    return this.translateOnAxis(nt, t);
  }
}
const v = new pt(), tt = new _(), et = new _(1, 0, 0), it = new _(0, 1, 0), nt = new _(0, 0, 1);
class zt {
  /**
   * @param target The target `InstancedMesh2`.
   * @param margin The margin applied for bounding box calculations (default is 0).
   * @param getBBoxFromBSphere Flag to determine if instance bounding boxes should be computed from the geometry bounding sphere. Faster but less precise (default is false).
   * @param accurateCulling Flag to enable accurate frustum culling without considering margin (default is true).
   */
  constructor(t, i = 0, e = !1, n = !0) {
    this.nodesMap = /* @__PURE__ */ new Map(), this.LODsMap = /* @__PURE__ */ new Map(), this._geoBoundingSphere = null, this._sphereTarget = null, this.target = t, this.accurateCulling = n, this._margin = i;
    const s = t._geometry;
    if (s.boundingBox || s.computeBoundingBox(), this.geoBoundingBox = s.boundingBox, e) {
      s.boundingSphere || s.computeBoundingSphere();
      const o = s.boundingSphere.center;
      o.x === 0 && o.y === 0 && o.z === 0 ? (this._geoBoundingSphere = s.boundingSphere, this._sphereTarget = { centerX: 0, centerY: 0, centerZ: 0, maxScale: 0 }) : (console.warn('"getBoxFromSphere" is ignored because geometry is not centered.'), e = !1);
    }
    this.bvh = new Pt(new jt(), Et), this._origin = new Float32Array(3), this._dir = new Float32Array(3), this._cameraPos = new Float32Array(3), this._getBoxFromSphere = e;
  }
  /**
   * Builds the BVH from the target mesh's instances using a top-down construction method.
   * This approach is more efficient and accurate compared to incremental methods, which add one instance at a time.
   */
  create() {
    const t = this.target._instancesCount, i = new Array(t), e = new Uint32Array(t);
    this.clear();
    for (let n = 0; n < t; n++)
      i[n] = this.getBox(n, new Float32Array(6)), e[n] = n;
    this.bvh.createFromArray(e, i, (n) => {
      this.nodesMap.set(n.object, n);
    }, this._margin);
  }
  /**
   * Inserts an instance into the BVH.
   * @param id The id of the instance to insert.
   */
  insert(t) {
    const i = this.bvh.insert(t, this.getBox(t, new Float32Array(6)), this._margin);
    this.nodesMap.set(t, i);
  }
  /**
   * Inserts a range of instances into the BVH.
   * @param ids An array of ids to insert.
   */
  insertRange(t) {
    const i = t.length, e = new Array(i);
    for (let n = 0; n < i; n++)
      e[n] = this.getBox(t[n], new Float32Array(6));
    this.bvh.insertRange(t, e, this._margin, (n) => {
      this.nodesMap.set(n.object, n);
    });
  }
  /**
   * Moves an instance within the BVH.
   * @param id The id of the instance to move.
   */
  move(t) {
    const i = this.nodesMap.get(t);
    i && (this.getBox(t, i.box), this.bvh.move(i, this._margin));
  }
  /**
   * Deletes an instance from the BVH.
   * @param id The id of the instance to delete.
   */
  delete(t) {
    const i = this.nodesMap.get(t);
    i && (this.bvh.delete(i), this.nodesMap.delete(t));
  }
  /**
   * Clears the BVH.
   */
  clear() {
    this.bvh.clear(), this.nodesMap = /* @__PURE__ */ new Map();
  }
  /**
   * Performs frustum culling to determine which instances are visible based on the provided projection matrix.
   * @param projScreenMatrix The projection screen matrix for frustum culling.
   * @param onFrustumIntersection Callback function invoked when an instance intersects the frustum.
   */
  frustumCulling(t, i) {
    this._margin > 0 && this.accurateCulling ? this.bvh.frustumCulling(t.elements, (e, n, s) => {
      n.isIntersectedMargin(e.box, s, this._margin) && i(e);
    }) : this.bvh.frustumCulling(t.elements, i);
  }
  /**
   * Performs frustum culling with Level of Detail (LOD) consideration.
   * @param projScreenMatrix The projection screen matrix for frustum culling.
   * @param cameraPosition The camera's position used for LOD calculations.
   * @param levels An array of LOD levels.
   * @param onFrustumIntersection Callback function invoked when an instance intersects the frustum.
   */
  frustumCullingLOD(t, i, e, n) {
    this.LODsMap.has(e) || this.LODsMap.set(e, new Float32Array(e.length));
    const s = this.LODsMap.get(e);
    for (let a = 0; a < e.length; a++)
      s[a] = e[a].distance;
    const o = this._cameraPos;
    o[0] = i.x, o[1] = i.y, o[2] = i.z, this._margin > 0 && this.accurateCulling ? this.bvh.frustumCullingLOD(t.elements, o, s, (a, c, h, l) => {
      h.isIntersectedMargin(a.box, l, this._margin) && n(a, c);
    }) : this.bvh.frustumCullingLOD(t.elements, o, s, n);
  }
  /**
   * Performs raycasting to check if a ray intersects any instances.
   * @param raycaster The raycaster used for raycasting.
   * @param onIntersection Callback function invoked when a ray intersects an instance.
   */
  raycast(t, i) {
    const e = t.ray, n = this._origin, s = this._dir;
    Q(e.origin, n), Q(e.direction, s), this.bvh.rayIntersections(s, n, i, t.near, t.far);
  }
  /**
   * Checks if a given box intersects with any instance bounding box.
   * @param target The target bounding box.
   * @param onIntersection Callback function invoked when an intersection occurs.
   * @returns `True` if there is an intersection, otherwise `false`.
   */
  intersectBox(t, i) {
    this._boxArray || (this._boxArray = new Float32Array(6));
    const e = this._boxArray;
    return J(t, e), this.bvh.intersectsBox(e, i);
  }
  getBox(t, i) {
    if (this._getBoxFromSphere) {
      const e = this.target.matricesTexture._data, { centerX: n, centerY: s, centerZ: o, maxScale: a } = this.getSphereFromMatrix_centeredGeometry(t, e, this._sphereTarget), c = this._geoBoundingSphere.radius * a;
      i[0] = n - c, i[1] = n + c, i[2] = s - c, i[3] = s + c, i[4] = o - c, i[5] = o + c;
    } else
      st.copy(this.geoBoundingBox).applyMatrix4(this.target.getMatrixAt(t)), J(st, i);
    return i;
  }
  getSphereFromMatrix_centeredGeometry(t, i, e) {
    const n = t * 16, s = i[n + 0], o = i[n + 1], a = i[n + 2], c = i[n + 4], h = i[n + 5], l = i[n + 6], u = i[n + 8], d = i[n + 9], x = i[n + 10], m = s * s + o * o + a * a, g = c * c + h * h + l * l, b = u * u + d * d + x * x;
    return e.maxScale = Math.sqrt(Math.max(m, g, b)), e.centerX = i[n + 12], e.centerY = i[n + 13], e.centerZ = i[n + 14], e;
  }
}
const st = new N();
class Gt extends gt {
  /**
   * @param gl The WebGL2RenderingContext used to create the buffer.
   * @param type The type of data in the attribute.
   * @param itemSize The number of elements per attribute.
   * @param elementSize The size of individual elements in the array.
   * @param array The data array that holds the attribute values.
   * @param meshPerAttribute The number of meshes that share the same attribute data.
   */
  constructor(t, i, e, n, s, o = 1) {
    const a = t.createBuffer();
    super(a, i, e, n, s.length / e), this.isGLInstancedBufferAttribute = !0, this._needsUpdate = !1, this.isInstancedBufferAttribute = !0, this.meshPerAttribute = o, this.array = s, this._cacheArray = s, t.bindBuffer(t.ARRAY_BUFFER, a), t.bufferData(t.ARRAY_BUFFER, s, t.DYNAMIC_DRAW);
  }
  /**
   * Updates the buffer data.
   * This method is designed to be called during the `onBeforeRender` callback.
   * It ensures that the attribute data is updated just before the rendering process begins.
   * @param renderer The WebGLRenderer used to render the scene.
   * @param count The number of elements to update in the buffer.
   */
  update(t, i) {
    if (!this._needsUpdate || i === 0) return;
    const e = t.getContext();
    e.bindBuffer(e.ARRAY_BUFFER, this.buffer), this.array === this._cacheArray ? e.bufferSubData(e.ARRAY_BUFFER, 0, this.array, 0, i) : (e.bufferData(e.ARRAY_BUFFER, this.array, e.DYNAMIC_DRAW), this._cacheArray = this.array), this._needsUpdate = !1;
  }
  /** @internal */
  clone() {
    return this;
  }
}
function ft(r, t) {
  return Math.max(t, Math.ceil(Math.sqrt(r / t)) * t);
}
function qt(r, t, i, e) {
  t === 3 && (console.warn('"channels" cannot be 3. Set to 4. More info: https://github.com/mrdoob/three.js/pull/23228'), t = 4);
  const n = ft(e, i), s = new r(n * n * t), o = r.name.includes("Float"), a = r.name.includes("Uint"), c = o ? G : a ? At : bt;
  let h;
  switch (t) {
    case 1:
      h = o ? q : Tt;
      break;
    case 2:
      h = o ? wt : Ct;
      break;
    case 4:
      h = o ? It : St;
      break;
  }
  return { array: s, size: n, type: c, format: h };
}
class E extends z {
  /**
   * @param arrayType The constructor for the TypedArray.
   * @param channels The number of channels in the texture.
   * @param pixelsPerInstance The number of pixels required for each instance.
   * @param capacity The total number of instances.
   * @param uniformMap Optional map for handling uniform values.
   */
  constructor(t, i, e, n, s) {
    const { array: o, format: a, size: c, type: h } = qt(t, i, e, n);
    super(o, c, c, a, h), this.partialUpdate = !0, this.maxUpdateCalls = 100, this._renderer = null, this._gl = null, this._utils = null, this._data = o, this._channels = i, this._pixelsPerInstance = e, this._stride = e * i, this._rowToUpdate = new Array(c), this._uniformMap = s, this.needsUpdate = !0;
  }
  /**
   * Resizes the texture to accommodate a new number of instances.
   * @param count The new total number of instances.
   */
  resize(t) {
    const i = ft(t, this._pixelsPerInstance);
    if (i === this.image.width) return;
    const e = this._data, n = this._channels;
    this._rowToUpdate.length = i;
    const s = e.constructor, o = new s(i * i * n), a = Math.min(e.length, o.length);
    o.set(new s(e.buffer, 0, a)), this.dispose(), this.image = { data: o, height: i, width: i }, this._data = o;
  }
  /**
   * Marks a row of the texture for update during the next render cycle.
   * This helps in optimizing texture updates by only modifying the rows that have changed.
   * @param index The index of the instance to update.
   */
  enqueueUpdate(t) {
    if (!this.partialUpdate) {
      this.needsUpdate = !0;
      return;
    }
    const i = this.image.width / this._pixelsPerInstance, e = Math.floor(t / i);
    this._rowToUpdate[e] = !0;
  }
  /**
   * Updates the texture data based on the rows that need updating.
   * This method is optimized to only update the rows that have changed, improving performance.
   * @param renderer The WebGLRenderer used for rendering.
   */
  update(t) {
    if (!this.partialUpdate) return;
    const i = this.getUpdateRowsInfo();
    i.length !== 0 && (i.length > this.maxUpdateCalls ? this.needsUpdate = !0 : (this.initRendererInfo(t), this.updateRows(i)), this._rowToUpdate.fill(!1));
  }
  getUpdateRowsInfo() {
    const t = this._rowToUpdate, i = [];
    for (let e = 0, n = t.length; e < n; e++)
      if (t[e]) {
        const s = e;
        for (; e < n && t[e]; e++)
          ;
        i.push({ row: s, count: e - s });
      }
    return i;
  }
  initRendererInfo(t) {
    this._renderer || (this._renderer = t), this._gl || (this._gl = t.getContext()), this._utils || (this._utils = new yt(this._gl, t.extensions));
  }
  // Reference: https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLRenderer.js#L2569
  updateRows(t) {
    const i = this._renderer.state, e = this._gl, n = this._utils.convert(this.format), s = this._utils.convert(this.type), { data: o, height: a, width: c } = this.image, h = this._renderer.properties.get(this);
    if (!h.__webglTexture) return;
    i.bindTexture(e.TEXTURE_2D, h.__webglTexture), e.pixelStorei(e.UNPACK_FLIP_Y_WEBGL, this.flipY), e.pixelStorei(e.UNPACK_PREMULTIPLY_ALPHA_WEBGL, this.premultiplyAlpha), e.pixelStorei(e.UNPACK_ALIGNMENT, this.unpackAlignment);
    const l = e.getParameter(e.UNPACK_ROW_LENGTH), u = e.getParameter(e.UNPACK_IMAGE_HEIGHT), d = e.getParameter(e.UNPACK_SKIP_PIXELS), x = e.getParameter(e.UNPACK_SKIP_ROWS), m = e.getParameter(e.UNPACK_SKIP_IMAGES);
    e.pixelStorei(e.UNPACK_ROW_LENGTH, c), e.pixelStorei(e.UNPACK_IMAGE_HEIGHT, a), e.pixelStorei(e.UNPACK_SKIP_PIXELS, 0), e.pixelStorei(e.UNPACK_SKIP_IMAGES, 0);
    for (const { count: g, row: b } of t)
      e.pixelStorei(e.UNPACK_SKIP_ROWS, b), e.texSubImage2D(e.TEXTURE_2D, 0, 0, b, c, g, n, s, o);
    e.pixelStorei(e.UNPACK_ROW_LENGTH, l), e.pixelStorei(e.UNPACK_IMAGE_HEIGHT, u), e.pixelStorei(e.UNPACK_SKIP_PIXELS, d), e.pixelStorei(e.UNPACK_SKIP_ROWS, x), e.pixelStorei(e.UNPACK_SKIP_IMAGES, m), i.unbindTexture();
  }
  /**
   * Sets a uniform value at the specified instance ID in the texture.
   * @param id The instance ID to set the uniform for.
   * @param name The name of the uniform.
   * @param value The value to set for the uniform.
   */
  setUniformAt(t, i, e) {
    const { offset: n, size: s } = this._uniformMap.get(i), o = this._stride;
    s === 1 ? this._data[t * o + n] = e : e.toArray(this._data, t * o + n);
  }
  /**
   * Retrieves a uniform value at the specified instance ID from the texture.
   * @param id The instance ID to retrieve the uniform from.
   * @param name The name of the uniform.
   * @param target Optional target object to store the uniform value.
   * @returns The uniform value for the specified instance.
   */
  getUniformAt(t, i, e) {
    const { offset: n, size: s } = this._uniformMap.get(i), o = this._stride;
    return s === 1 ? this._data[t * o + n] : e.fromArray(this._data, t * o + n);
  }
  /**
   * Generates the GLSL code for accessing the uniform data stored in the texture.
   * @param textureName The name of the texture in the GLSL shader.
   * @param indexName The name of the index in the GLSL shader.
   * @returns The GLSL code to access the uniform data.
   */
  getUniformsFragmentGLSL(t, i) {
    const e = this._pixelsPerInstance, n = this._uniformMap;
    let s = `
      int size = textureSize(${t}, 0).x;
      int j = int(${i}) * ${e};
      int x = j % size;
      int y = j / size;
    `;
    for (let a = 0; a < this._pixelsPerInstance; a++)
      s += `vec4 _texel${a} = texelFetch(${t}, ivec2(x + ${a}, y), 0);
`;
    let o = "";
    for (const [a, { type: c, offset: h, size: l }] of n) {
      const u = Math.floor(h / this._channels);
      if (c === "mat3")
        o += `mat3 ${a} = mat3(texel${u}.rgb, vec3(texel${u}.a, texel${u + 1}.rg), vec3(texel${u + 1}.ba, texel${u + 2}.r));
`;
      else if (c === "mat4")
        o += `mat4 ${a} = mat4(texel${u}, texel${u + 1}, texel${u + 2}, texel${u + 3});
`;
      else {
        const d = this.getUniformComponents(h, l);
        o += `${c} ${a} = _texel${u}.${d};
`;
      }
    }
    return `
      uniform highp sampler2D ${t};  

      void main() {
        ${s}
        ${o}`;
  }
  getUniformComponents(t, i) {
    const e = t % this._channels;
    let n = "";
    for (let s = 0; s < i; s++)
      n += Wt[e + s];
    return n;
  }
}
const Wt = ["r", "g", "b", "a"];
class p extends W {
  /**
   * @remarks Geometries and materials cannot be shared. If reused, they will be cloned.
   * @param geometry An instance of `BufferGeometry`.
   * @param material A single or an array of `Material`.
   * @param params Optional configuration parameters object. See `InstancedMesh2Params` for details.
   */
  constructor(t, i, e = {}, n) {
    if (!t) throw new Error('"geometry" is mandatory.');
    if (!i) throw new Error('"material" is mandatory.');
    const { allowsEuler: s, renderer: o, createInstances: a } = e;
    super(t, null), this.type = "InstancedMesh2", this.isInstancedMesh2 = !0, this.instances = null, this.colorsTexture = null, this.morphTexture = null, this.uniformsTexture = null, this.boundingBox = null, this.boundingSphere = null, this.bvh = null, this.customSort = null, this.raycastOnlyFrustum = !1, this.LODinfo = null, this._renderer = null, this._instancesCount = 0, this._count = 0, this._perObjectFrustumCulled = !0, this._sortObjects = !1, this._indexArrayNeedsUpdate = !1, this._useOpacity = !1, this.customDepthMaterial = new Mt({ depthPacking: Ot }), this.customDistanceMaterial = new Ut(), this.isInstancedMesh = !0, this.instanceMatrix = new Dt(new Float32Array(0), 16), this.instanceColor = null;
    const c = e.capacity > 0 ? e.capacity : $t;
    this._renderer = o, this._capacity = c, this._parentLOD = n, this._geometry = t, this.material = i, this._allowsEuler = s ?? !1, this._tempInstance = new dt(this, -1, s), this.visibilityArray = (n == null ? void 0 : n.visibilityArray) ?? new Array(c).fill(!0), this.initIndexAttribute(), this.initMatricesTexture(), this.patchMaterial(this.customDepthMaterial), this.patchMaterial(this.customDistanceMaterial), a && this.createInstances();
  }
  // must be null to avoid exception
  /**
   * The capacity of the instance buffers.
   */
  get capacity() {
    return this._capacity;
  }
  /**
   * The number of instances rendered in the last frame.
   */
  get count() {
    return this._count;
  }
  /**
   * The number of active instances.
   * If a number greater than the `capacity` is set, the `capacity` will be increased automatically.
   */
  get instancesCount() {
    return this._instancesCount;
  }
  set instancesCount(t) {
    this.setInstancesCount(t);
  }
  /**
   * Determines if per-instance frustum culling is enabled.
   * @default true
   */
  get perObjectFrustumCulled() {
    return this._perObjectFrustumCulled;
  }
  set perObjectFrustumCulled(t) {
    this._perObjectFrustumCulled = t, this._indexArrayNeedsUpdate = !0;
  }
  /**
   * Determines if objects should be sorted before rendering.
   * @default false
   */
  get sortObjects() {
    return this._sortObjects;
  }
  set sortObjects(t) {
    this._sortObjects = t, this._indexArrayNeedsUpdate = !0;
  }
  /**
   * An instance of `BufferGeometry` (or derived classes), defining the object's structure.
   */
  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  get geometry() {
    return this._geometry;
  }
  set geometry(t) {
    this._geometry = t, this.patchGeometry(t);
  }
  /**
   * An instance of `material` (or derived classes) or an array of materials, defining the object's appearance.
   */
  // @ts-expect-error it's defined as a property, but is overridden as an accessor.
  get material() {
    return this._material;
  }
  set material(t) {
    this._material = t, this.patchMaterials(t);
  }
  onBeforeShadow(t, i, e, n, s, o, a) {
    var c, h;
    !this.instanceIndex || a && !this.isFirstGroup(a.materialIndex) || (this.matricesTexture.update(t), (c = this.colorsTexture) == null || c.update(t), (h = this.uniformsTexture) == null || h.update(t), this.performFrustumCulling(n, e));
  }
  onBeforeRender(t, i, e, n, s, o) {
    var a, c;
    if (!this.instanceIndex) {
      this._renderer = t;
      return;
    }
    o && !this.isFirstGroup(o.materialIndex) || (this.matricesTexture.update(t), (a = this.colorsTexture) == null || a.update(t), (c = this.uniformsTexture) == null || c.update(t), this.performFrustumCulling(e));
  }
  onAfterRender(t, i, e, n, s, o) {
    this.instanceIndex || o && !this.isLastGroup(o.materialIndex) || this.initIndexAttribute();
  }
  isFirstGroup(t) {
    const i = this.material;
    for (let e = 0; e <= t; e++)
      if (i[e].visible)
        return e === t;
  }
  isLastGroup(t) {
    const i = this.material;
    for (let e = i.length - 1; e >= t; e--)
      if (i[e].visible)
        return e === t;
  }
  initIndexAttribute() {
    if (!this._renderer) {
      this._count = 0;
      return;
    }
    const t = this._renderer.getContext(), i = this._capacity, e = new Uint32Array(i);
    for (let n = 0; n < i; n++)
      e[n] = n;
    this.instanceIndex = new Gt(t, t.UNSIGNED_INT, 1, 4, e), this._geometry.setAttribute("instanceIndex", this.instanceIndex);
  }
  initMatricesTexture() {
    this._parentLOD ? this.matricesTexture = this._parentLOD.matricesTexture : this.matricesTexture = new E(Float32Array, 4, 4, this._capacity);
  }
  initColorsTexture() {
    this.colorsTexture = new E(Float32Array, 4, 1, this._capacity), this.colorsTexture.colorSpace = Lt.workingColorSpace, this.colorsTexture._data.fill(1);
  }
  patchGeometry(t) {
    t.hasAttribute("instanceIndex") && (console.warn("The geometry has been cloned because it was already used."), t = t.clone(), t.deleteAttribute("instanceIndex")), this.instanceIndex && t.setAttribute("instanceIndex", this.instanceIndex);
  }
  patchMaterials(t) {
    if (t) {
      if (t.isMaterial) {
        this.patchMaterial(t);
        return;
      }
      for (const i of t)
        this.patchMaterial(i);
    }
  }
  patchMaterial(t) {
    t.isInstancedMesh2Patched && (this.isMaterialUsedByLOD(t) || (console.warn("The material has been cloned because it was already used."), t = t.clone(), t.isInstancedMesh2Patched = !1));
    const i = t.onBeforeCompile.bind(t);
    t.onBeforeCompile = (e, n) => {
      if (i && i(e, n), !!e.instancing) {
        if (e.instancing = !1, e.instancingColor = !1, e.uniforms.matricesTexture = { value: this.matricesTexture }, e.defines || (e.defines = {}), e.defines.USE_INSTANCING_INDIRECT = "", this.uniformsTexture) {
          e.vertexShader.includes("varying uint vInstanceIndex") || (e.vertexShader = e.vertexShader.replace("void main() {", `flat varying uint vInstanceIndex;
 void main() {
 vInstanceIndex = instanceIndex;`), e.fragmentShader = e.fragmentShader.replace("void main() {", `flat varying uint vInstanceIndex;
 void main() {`)), e.uniforms.uniformsTexture = { value: this.uniformsTexture };
          const s = this.uniformsTexture.getUniformsFragmentGLSL("uniformsTexture", "vInstanceIndex");
          e.fragmentShader = e.fragmentShader.replace("void main() {", s);
        }
        if (this.colorsTexture) {
          if (!e.fragmentShader.includes("#include <color_pars_fragment>")) return;
          e.uniforms.colorsTexture = { value: this.colorsTexture }, e.vertexShader = e.vertexShader.replace("<color_vertex>", "<instanced_color_vertex>"), e.defines.USE_INSTANCING_COLOR_INDIRECT = "", e.vertexColors && (e.defines.USE_VERTEX_COLOR = ""), this._useOpacity ? e.defines.USE_COLOR_ALPHA = "" : e.defines.USE_COLOR = "";
        }
      }
    }, t.isInstancedMesh2Patched = !0;
  }
  isMaterialUsedByLOD(t) {
    if (this._parentLOD) {
      for (const i of this._parentLOD.LODinfo.objects)
        if (i.material === t) return !0;
    }
  }
  /**
   * Creates and computes the BVH (Bounding Volume Hierarchy) for the instances.
   * It's recommended to create it when all the instance matrices have been assigned.
   * Once created it will be updated automatically.
   * @param config Optional configuration parameters object. See `BVHParams` for details.
   */
  computeBVH(t = {}) {
    this.bvh || (this.bvh = new zt(this, t.margin, t.getBBoxFromBSphere, t.accurateCulling)), this.bvh.clear(), this.bvh.create();
  }
  /**
   * Disposes of the BVH structure.
   */
  disposeBVH() {
    this.bvh = null;
  }
  /**
   * Sets the local transformation matrix for a specific instance.
   * @param id The index of the instance.
   * @param matrix A `Matrix4` representing the local transformation to apply to the instance.
   */
  setMatrixAt(t, i) {
    var e;
    if (i.toArray(this.matricesTexture._data, t * 16), this.instances) {
      const n = this.instances[t];
      i.decompose(n.position, n.quaternion, n.scale);
    }
    this.matricesTexture.enqueueUpdate(t), (e = this.bvh) == null || e.move(t);
  }
  /**
   * Gets the local transformation matrix of a specific instance.
   * @param id The index of the instance.
   * @param matrix Optional `Matrix4` to store the result.
   * @returns The transformation matrix of the instance.
   */
  getMatrixAt(t, i = Kt) {
    return i.fromArray(this.matricesTexture._data, t * 16);
  }
  /**
   * Retrieves the position of a specific instance.
   * @param index The index of the instance.
   * @param target Optional `Vector3` to store the result.
   * @returns The position of the instance as a `Vector3`.
   */
  getPositionAt(t, i = Ht) {
    const e = t * 16, n = this.matricesTexture._data;
    return i.x = n[e + 12], i.y = n[e + 13], i.z = n[e + 14], i;
  }
  /**
   * Calculates the maximum scale on any axis for a specific instance.
   * @param index The index of the instance.
   * @returns The maximum scale on any axis as a number.
   */
  getMaxScaleOnAxisAt(t) {
    const i = t * 16, e = this.matricesTexture._data, n = e[i + 0], s = e[i + 1], o = e[i + 2], a = n * n + s * s + o * o, c = e[i + 4], h = e[i + 5], l = e[i + 6], u = c * c + h * h + l * l, d = e[i + 8], x = e[i + 9], m = e[i + 10], g = d * d + x * x + m * m;
    return Math.sqrt(Math.max(a, u, g));
  }
  /**
   * Sets the visibility of a specific instance.
   * @param id The index of the instance.
   * @param visible Whether the instance should be visible.
   */
  setVisibilityAt(t, i) {
    this.visibilityArray[t] = i, this._indexArrayNeedsUpdate = !0;
  }
  /**
   * Gets the visibility of a specific instance.
   * @param id The index of the instance.
   * @returns Whether the instance is visible.
   */
  getVisibilityAt(t) {
    return this.visibilityArray[t];
  }
  /**
   * Sets the color of a specific instance.
   * @param id The index of the instance.
   * @param color The color to assign to the instance.
   */
  setColorAt(t, i) {
    this.colorsTexture === null && this.initColorsTexture(), i.isColor ? i.toArray(this.colorsTexture._data, t * 4) : at.set(i).toArray(this.colorsTexture._data, t * 4), this.colorsTexture.enqueueUpdate(t);
  }
  /**
   * Gets the color of a specific instance.
   * @param id The index of the instance.
   * @param color Optional `Color` to store the result.
   * @returns The color of the instance.
   */
  getColorAt(t, i = at) {
    return i.fromArray(this.colorsTexture._data, t * 4);
  }
  /**
   * Sets the opacity of a specific instance.
   * @param id The index of the instance.
   * @param value The opacity value to assign.
   */
  setOpacityAt(t, i) {
    this.colorsTexture === null && this.initColorsTexture(), this._useOpacity = !0, this.colorsTexture._data[t * 4 + 3] = i, this.colorsTexture.enqueueUpdate(t);
  }
  /**
   * Gets the opacity of a specific instance.
   * @param id The index of the instance.
   * @returns The opacity of the instance.
   */
  getOpacityAt(t) {
    return this.colorsTexture._data[t * 4 + 3];
  }
  /**
   * Gets the morph target data for a specific instance.
   * @param index The index of the instance.
   * @param object Optional `Mesh` to store the morph target data.
   * @returns The mesh object with updated morph target influences.
   */
  getMorphAt(t, i = kt) {
    const e = i.morphTargetInfluences, n = this.morphTexture.source.data.data, s = e.length + 1, o = t * s + 1;
    for (let a = 0; a < e.length; a++)
      e[a] = n[o + a];
    return i;
  }
  /**
   * Sets the morph target influences for a specific instance.
   * @param index The index of the instance.
   * @param object The `Mesh` containing the morph target influences to apply.
   */
  setMorphAt(t, i) {
    const e = i.morphTargetInfluences, n = e.length + 1;
    this.morphTexture === null && (this.morphTexture = new z(new Float32Array(n * this._capacity), n, this._capacity, q, G));
    const s = this.morphTexture.source.data.data;
    let o = 0;
    for (const h of e)
      o += h;
    const a = this._geometry.morphTargetsRelative ? 1 : 1 - o, c = n * t;
    s[c] = a, s.set(e, c + 1), this.morphTexture.needsUpdate = !0;
  }
  /**
   * Copies `position`, `quaternion`, and `scale` of a specific instance to the specified target `Object3D`.
   * @param id The index of the instance.
   * @param target The `Object3D` where to copy transformation data.
   */
  copyTo(t, i) {
    this.getMatrixAt(t, i.matrix).decompose(i.position, i.quaternion, i.scale);
  }
  /**
   * Computes the bounding box that encloses all instances, and updates the `boundingBox` attribute.
   */
  computeBoundingBox() {
    const t = this._geometry, i = this._instancesCount;
    this.boundingBox === null && (this.boundingBox = new N()), t.boundingBox === null && t.computeBoundingBox();
    const e = t.boundingBox, n = this.boundingBox;
    n.makeEmpty();
    for (let s = 0; s < i; s++)
      rt.copy(e).applyMatrix4(this.getMatrixAt(s)), n.union(rt);
  }
  /**
   * Computes the bounding sphere that encloses all instances, and updates the `boundingSphere` attribute.
   */
  computeBoundingSphere() {
    const t = this._geometry, i = this._instancesCount;
    this.boundingSphere === null && (this.boundingSphere = new D()), t.boundingSphere === null && t.computeBoundingSphere();
    const e = t.boundingSphere, n = this.boundingSphere;
    n.makeEmpty();
    for (let s = 0; s < i; s++)
      ot.copy(e).applyMatrix4(this.getMatrixAt(s)), n.union(ot);
  }
  copy(t, i) {
    return super.copy(t, i), this.matricesTexture = t.matricesTexture.clone(), t.colorsTexture !== null && (this.colorsTexture = t.colorsTexture.clone()), t.morphTexture !== null && (this.morphTexture = t.morphTexture.clone()), this._instancesCount = t._instancesCount, this._count = t._capacity, this._capacity = t._capacity, t.boundingBox !== null && (this.boundingBox = t.boundingBox.clone()), t.boundingSphere !== null && (this.boundingSphere = t.boundingSphere.clone()), this;
  }
  /**
   * Frees the GPU-related resources allocated.
   */
  dispose() {
    var t, i, e;
    this.dispatchEvent({ type: "dispose" }), this.matricesTexture.dispose(), (t = this.colorsTexture) == null || t.dispose(), (i = this.morphTexture) == null || i.dispose(), (e = this.uniformsTexture) == null || e.dispose();
  }
}
const $t = 1e3, rt = new N(), ot = new D(), Kt = new L(), at = new vt(), kt = new W(), Ht = new _();
p.prototype.resizeBuffers = function(r) {
  var e;
  const t = this._capacity;
  this._capacity = r;
  const i = Math.min(r, t);
  if (this.instanceIndex) {
    const n = new Uint32Array(r);
    n.set(new Uint32Array(this.instanceIndex.array.buffer, 0, i)), this.instanceIndex.array = n;
  }
  if (this.LODinfo)
    for (const n of this.LODinfo.objects) {
      const s = new Uint32Array(r);
      n.instanceIndex.array = s;
    }
  if (this.visibilityArray.length = r, r > t && this.visibilityArray.fill(!0, t), this.matricesTexture.resize(r), this.colorsTexture && (this.colorsTexture.resize(r), r > t && this.colorsTexture._data.fill(1, t * 4)), this.morphTexture) {
    const n = this.morphTexture.image.data, s = n.length / t;
    this.morphTexture.dispose(), this.morphTexture = new z(new Float32Array(s * r), s, r, q, G), this.morphTexture.image.data.set(n);
  }
  return (e = this.uniformsTexture) == null || e.resize(r), this;
};
p.prototype.setInstancesCount = function(r) {
  if (r > this._capacity) {
    let t = this._capacity + (this._capacity >> 1) + 512;
    for (; t < r; )
      t += (t >> 1) + 512;
    this.resizeBuffers(t);
  }
  this._instancesCount = r, this.instances && this.createInstances();
};
function se(r) {
  const t = {
    get: (i) => i.depthSort,
    aux: new Array(r._capacity),
    reversed: null
  };
  return function(e) {
    var c;
    t.reversed = !!((c = r._material) != null && c.transparent), r._capacity > t.aux.length && (t.aux.length = r._capacity);
    let n = 1 / 0, s = -1 / 0;
    for (const { depth: h } of e)
      h > s && (s = h), h < n && (n = h);
    const o = s - n, a = (2 ** 32 - 1) / o;
    for (const h of e)
      h.depthSort = (h.depth - n) * a;
    Nt(e, t);
  };
}
function xt(r, t) {
  return r.depth - t.depth;
}
function mt(r, t) {
  return t.depth - r.depth;
}
function Vt(r, t) {
  return r.distance - t.distance;
}
class Yt {
  constructor() {
    this.array = [], this.pool = [];
  }
  /**
   * Adds a new render item to the list.
   * @param depth The depth value used for sorting or determining the rendering order.
   * @param index The unique instance id of the render item.
   */
  push(t, i) {
    const e = this.pool, n = this.array, s = n.length;
    s >= e.length && e.push({ depth: null, index: null, depthSort: null });
    const o = e[s];
    o.depth = t, o.index = i, n.push(o);
  }
  /**
   * Resets the render list by clearing the array.
   */
  reset() {
    this.array.length = 0;
  }
}
const M = new Ft(), A = new Yt(), I = new L(), S = new L(), F = new _(), T = new _(), C = new _(), O = new _(), y = new D();
p.prototype.performFrustumCulling = function(r, t = r) {
  const i = this.LODinfo, e = r !== t;
  let n;
  if (i) {
    n = e ? i.shadowRender ?? i.render : i.render;
    for (const s of i.objects)
      s === this ? s._count = 0 : s.visible = !1;
  }
  (n == null ? void 0 : n.levels.length) > 0 ? this.frustumCullingLOD(n, i.objects, r, t) : this._parentLOD || this.frustumCulling(r), this.instanceIndex.update(this._renderer, this._count);
};
p.prototype.frustumCulling = function(r) {
  var n;
  const t = this._sortObjects, i = this._perObjectFrustumCulled, e = this.instanceIndex.array;
  if (this.instanceIndex._needsUpdate = !0, !i && !t) {
    this.updateIndexArray();
    return;
  }
  if (t && (S.copy(this.matrixWorld).invert(), T.setFromMatrixPosition(r.matrixWorld).applyMatrix4(S), F.set(0, 0, -1).transformDirection(r.matrixWorld).transformDirection(S)), i ? (I.multiplyMatrices(r.projectionMatrix, r.matrixWorldInverse).multiply(this.matrixWorld), this.bvh ? this.BVHCulling() : this.linearCulling()) : this.updateRenderList(), t) {
    const s = this.customSort;
    s === null ? A.array.sort((n = this._material) != null && n.transparent ? mt : xt) : s(A.array);
    const o = A.array, a = o.length;
    for (let c = 0; c < a; c++)
      e[c] = o[c].index;
    this._count = a, A.reset();
  }
};
p.prototype.updateIndexArray = function() {
  if (!this._indexArrayNeedsUpdate) return;
  const r = this.instanceIndex.array, t = this._instancesCount;
  let i = 0;
  for (let e = 0; e < t; e++)
    this.getVisibilityAt(e) && (r[i++] = e);
  this._count = i, this._indexArrayNeedsUpdate = !1;
};
p.prototype.updateRenderList = function() {
  const r = this._instancesCount;
  for (let t = 0; t < r; t++)
    if (this.getVisibilityAt(t)) {
      const i = this.getMatrixAt(t), e = O.setFromMatrixPosition(i).sub(T).dot(F);
      A.push(e, t);
    }
};
p.prototype.BVHCulling = function() {
  const r = this.instanceIndex.array, t = this._instancesCount, i = this._sortObjects;
  let e = 0;
  this.bvh.frustumCulling(I, (n) => {
    const s = n.object;
    if (s < t && this.getVisibilityAt(s))
      if (i) {
        this.getPositionAt(s, O);
        const o = O.sub(T).dot(F);
        A.push(o, s);
      } else
        r[e++] = s;
  }), this._count = e;
};
p.prototype.linearCulling = function() {
  const r = this.instanceIndex.array, t = this._geometry.boundingSphere, i = t.radius, e = t.center, n = this._instancesCount, s = e.x === 0 && e.y === 0 && e.z === 0, o = this._sortObjects;
  let a = 0;
  M.setFromProjectionMatrix(I);
  for (let c = 0; c < n; c++)
    if (this.getVisibilityAt(c)) {
      if (s)
        this.getPositionAt(c, y.center), y.radius = i * this.getMaxScaleOnAxisAt(c);
      else {
        const h = this.getMatrixAt(c);
        y.center.copy(e).applyMatrix4(h), y.radius = i * h.getMaxScaleOnAxis();
      }
      if (M.intersectsSphere(y))
        if (o) {
          const h = O.subVectors(y.center, T).dot(F);
          A.push(h, c);
        } else
          r[a++] = c;
    }
  this._count = a;
};
p.prototype.frustumCullingLOD = function(r, t, i, e) {
  var h, l;
  const { count: n, levels: s } = r, a = !(i !== e) && this._sortObjects;
  for (let u = 0; u < s.length; u++)
    n[u] = 0, s[u].object.instanceIndex && (s[u].object.instanceIndex._needsUpdate = !0);
  I.multiplyMatrices(i.projectionMatrix, i.matrixWorldInverse).multiply(this.matrixWorld), S.copy(this.matrixWorld).invert(), T.setFromMatrixPosition(i.matrixWorld).applyMatrix4(S), C.setFromMatrixPosition(e.matrixWorld).applyMatrix4(S);
  const c = r.levels.map((u) => u.object.instanceIndex.array);
  if (this.bvh ? this.BVHCullingLOD(r, c, a) : this.linearCullingLOD(r, c, a), a) {
    const u = this.customSort, d = A.array;
    let x = 0, m = s[1].distance;
    u === null ? d.sort((h = s[0].object._material) != null && h.transparent ? mt : xt) : u(d);
    for (let g = 0, b = d.length; g < b; g++) {
      const w = d[g];
      w.depth > m && (x++, m = ((l = s[x + 1]) == null ? void 0 : l.distance) ?? 1 / 0), c[x][n[x]++] = w.index;
    }
    A.reset();
  }
  for (let u = 0; u < s.length; u++) {
    const d = s[u].object;
    d.visible = d === this || n[u] > 0, d._count = n[u];
  }
};
p.prototype.BVHCullingLOD = function(r, t, i) {
  const { count: e, levels: n } = r, s = this._instancesCount, o = this.visibilityArray;
  i ? this.bvh.frustumCulling(I, (a) => {
    const c = a.object;
    if (c < s && o[c]) {
      const h = this.getPositionAt(c).distanceToSquared(C);
      A.push(h, c);
    }
  }) : this.bvh.frustumCullingLOD(I, C, n, (a, c) => {
    const h = a.object;
    if (h < s && o[h]) {
      if (c === null) {
        const l = this.getPositionAt(h).distanceToSquared(C);
        c = this.getObjectLODIndexForDistance(n, l);
      }
      t[c][e[c]++] = h;
    }
  });
};
p.prototype.linearCullingLOD = function(r, t, i) {
  const { count: e, levels: n } = r, s = this._geometry.boundingSphere, o = s.radius, a = s.center, c = this._instancesCount, h = a.x === 0 && a.y === 0 && a.z === 0;
  M.setFromProjectionMatrix(I);
  for (let l = 0; l < c; l++)
    if (this.visibilityArray[l]) {
      if (h)
        this.getPositionAt(l, y.center), y.radius = o * this.getMaxScaleOnAxisAt(l);
      else {
        const u = this.getMatrixAt(l);
        y.center.copy(a).applyMatrix4(u), y.radius = o * u.getMaxScaleOnAxis();
      }
      if (M.intersectsSphere(y)) {
        const u = y.center.distanceToSquared(C);
        if (i)
          A.push(u, l);
        else {
          const d = this.getObjectLODIndexForDistance(n, u);
          t[d][e[d]++] = l;
        }
      }
    }
};
p.prototype.clearInstance = function(r, t) {
  var i;
  return r.id = t, r.position.set(0, 0, 0), r.scale.set(1, 1, 1), r.quaternion.set(0, 0, 0, 1), (i = r.rotation) == null || i.set(0, 0, 0), r;
};
p.prototype.updateInstances = function(r, t = 0, i = this._instancesCount) {
  const e = t + i, n = this.instances, s = this._tempInstance;
  for (let o = t; o < e; o++) {
    const a = n ? n[o] : this.clearInstance(s, o);
    r(a, o), a.updateMatrix();
  }
  return this;
};
p.prototype.updateInstancesPosition = function(r, t = 0, i = this._instancesCount) {
  const e = t + i, n = this.instances, s = this._tempInstance;
  for (let o = t; o < e; o++) {
    const a = n ? n[o] : this.clearInstance(s, o);
    r(a, o), a.updateMatrixPosition();
  }
  return this;
};
p.prototype.createInstances = function(r = 0, t = this._instancesCount) {
  const i = r + t;
  this.instances ? this.instances.length = i : this.instances = new Array(t);
  const e = this.instances;
  for (let n = r; n < i; n++) {
    const s = new dt(this, n, this._allowsEuler);
    e[n] = s;
  }
  return this;
};
p.prototype.addInstances = function(r, t) {
  const i = this._instancesCount, e = i + r, n = this.bvh;
  if (this.setInstancesCount(this._instancesCount + r), t)
    for (let s = i; s < e; s++) {
      const o = this.instances ? this.instances[s] : this.clearInstance(this._tempInstance, s);
      t(o, s), o.updateMatrix(), n == null || n.insert(s);
    }
  return this;
};
p.prototype.getObjectLODIndexForDistance = function(r, t) {
  for (let i = r.length - 1; i > 0; i--) {
    const e = r[i], n = e.distance - e.distance * e.hysteresis;
    if (t >= n) return i;
  }
  return 0;
};
p.prototype.setFirstLODDistance = function(r = 0, t = 0) {
  if (this._parentLOD) {
    console.error("Cannot create LOD for this InstancedMesh2.");
    return;
  }
  return this.LODinfo || (this.LODinfo = { render: null, shadowRender: null, objects: [this] }), this.LODinfo.render || (this.LODinfo.render = {
    levels: [{ distance: r, hysteresis: t, object: this }],
    count: [0]
  }), this;
};
p.prototype.addLOD = function(r, t, i = 0, e = 0) {
  var n;
  if (this._parentLOD) {
    console.error("Cannot create LOD for this InstancedMesh2.");
    return;
  }
  if (!((n = this.LODinfo) != null && n.render) && i === 0) {
    console.error('Cannot set distance to 0 for the first LOD. Use "setFirstLODDistance" before use "addLOD".');
    return;
  } else
    this.setFirstLODDistance(0, e);
  return this.addLevel(this.LODinfo.render, r, t, i, e), this;
};
p.prototype.addShadowLOD = function(r, t = 0, i = 0) {
  if (this._parentLOD) {
    console.error("Cannot create LOD for this InstancedMesh2.");
    return;
  }
  this.LODinfo || (this.LODinfo = { render: null, shadowRender: null, objects: [this] }), this.LODinfo.shadowRender || (this.LODinfo.shadowRender = { levels: [], count: [] });
  const e = this.addLevel(this.LODinfo.shadowRender, r, null, t, i);
  return e.castShadow = !0, this.castShadow = !0, this;
};
p.prototype.addLevel = function(r, t, i, e, n) {
  const s = this.LODinfo.objects, o = r.levels;
  let a, c;
  e = e ** 2;
  const h = s.findIndex((l) => l.geometry === t);
  if (h === -1) {
    const l = { capacity: this._capacity, renderer: this._renderer };
    c = new p(t, i ?? new Rt(), l, this), c.frustumCulled = !1, s.push(c), this.add(c);
  } else
    c = s[h], i && (c.material = i);
  for (a = 0; a < o.length && !(e < o[a].distance); a++)
    ;
  return o.splice(a, 0, { distance: e, hysteresis: n, object: c }), r.count.push(0), c;
};
const j = [], U = new W(), Xt = new Bt(), ct = new _(), ht = new _(), ut = new L(), lt = new D();
p.prototype.raycast = function(r, t) {
  if (this._material === void 0) return;
  const i = this.raycastOnlyFrustum && this._perObjectFrustumCulled && !this.bvh;
  U.geometry = this._geometry, U.material = this._material;
  const e = r.ray, n = r.near, s = r.far;
  ut.copy(this.matrixWorld).invert(), ht.setFromMatrixScale(this.matrixWorld), ct.copy(r.ray.direction).multiply(ht);
  const o = ct.length();
  if (r.ray = Xt.copy(r.ray).applyMatrix4(ut), r.near /= o, r.far /= o, this.bvh)
    this.bvh.raycast(r, (a) => this.checkObjectIntersection(r, a, t));
  else {
    if (this.boundingSphere === null && this.computeBoundingSphere(), lt.copy(this.boundingSphere), !r.ray.intersectsSphere(lt)) return;
    const a = this.instanceIndex.array, c = i ? this._count : this._instancesCount;
    for (let h = 0; h < c; h++)
      this.checkObjectIntersection(r, a[h], t);
  }
  t.sort(Vt), r.ray = e, r.near = n, r.far = s;
};
p.prototype.checkObjectIntersection = function(r, t, i) {
  if (!(t > this._instancesCount || !this.getVisibilityAt(t))) {
    this.getMatrixAt(t, U.matrixWorld), U.raycast(r, j);
    for (const e of j)
      e.instanceId = t, e.object = this, i.push(e);
    j.length = 0;
  }
};
p.prototype.getUniformAt = function(r, t, i) {
  if (!this.uniformsTexture)
    throw new Error(`Before get/set uniform, it's necessary to use "initUniformPerInstance".`);
  return this.uniformsTexture.getUniformAt(r, t, i);
};
p.prototype.setUniformAt = function(r, t, i) {
  if (!this.uniformsTexture)
    throw new Error(`Before get/set uniform, it's necessary to use "initUniformPerInstance".`);
  this.uniformsTexture.setUniformAt(r, t, i), this.uniformsTexture.enqueueUpdate(r);
};
p.prototype.initUniformsPerInstance = function(r) {
  const { channels: t, pixelsPerInstance: i, uniformMap: e } = this.getUniforSchemaResult(r);
  this.uniformsTexture = new E(Float32Array, t, i, this._capacity, e);
};
p.prototype.getUniforSchemaResult = function(r) {
  let t = 0;
  const i = /* @__PURE__ */ new Map(), e = [];
  for (const a in r) {
    const c = r[a], h = this.getUniformSize(c);
    t += h, e.push({ name: a, type: c, size: h });
  }
  e.sort((a, c) => c.size - a.size);
  const n = [];
  for (const { name: a, size: c, type: h } of e) {
    const l = this.getUniformOffset(c, n);
    i.set(a, { offset: l, size: c, type: h });
  }
  const s = Math.ceil(t / 4);
  return { channels: Math.min(t, 4), pixelsPerInstance: s, uniformMap: i };
};
p.prototype.getUniformOffset = function(r, t) {
  if (r < 4) {
    for (let e = 0; e < t.length; e++)
      if (t[e] + r <= 4) {
        const n = e * 4 + t[e];
        return t[e] += r, n;
      }
  }
  const i = t.length * 4;
  for (; r > 0; r -= 4)
    t.push(r);
  return i;
};
p.prototype.getUniformSize = function(r) {
  switch (r) {
    case "float":
      return 1;
    case "vec2":
      return 2;
    case "vec3":
      return 3;
    case "vec4":
      return 4;
    case "mat3":
      return 9;
    case "mat4":
      return 16;
    default:
      throw new Error(`Invalid uniform type: ${r}`);
  }
};
const Zt = (
  /* glsl */
  `
#ifdef USE_INSTANCING_INDIRECT
  attribute uint instanceIndex;
  uniform highp sampler2D matricesTexture;  

  mat4 getInstancedMatrix() {
    int size = textureSize( matricesTexture, 0 ).x;
    int j = int( instanceIndex ) * 4;
    int x = j % size;
    int y = j / size;
    vec4 v1 = texelFetch( matricesTexture, ivec2( x, y ), 0 );
    vec4 v2 = texelFetch( matricesTexture, ivec2( x + 1, y ), 0 );
    vec4 v3 = texelFetch( matricesTexture, ivec2( x + 2, y ), 0 );
    vec4 v4 = texelFetch( matricesTexture, ivec2( x + 3, y ), 0 );
    return mat4( v1, v2, v3, v4 );
  }
#endif
`
), Qt = (
  /* glsl */
  `
#ifdef USE_INSTANCING_COLOR_INDIRECT
  uniform highp sampler2D colorsTexture;

  #ifdef USE_COLOR_ALPHA
    vec4 getColorTexture() {
      int size = textureSize( colorsTexture, 0 ).x;
      int j = int( instanceIndex );
      int x = j % size;
      int y = j / size;
      return texelFetch( colorsTexture, ivec2( x, y ), 0 );
    }
  #else
    vec3 getColorTexture() {
      int size = textureSize( colorsTexture, 0 ).x;
      int j = int( instanceIndex );
      int x = j % size;
      int y = j / size;
      return texelFetch( colorsTexture, ivec2( x, y ), 0 ).rgb;
    }
  #endif
#endif
`
), Jt = (
  /* glsl */
  `
#ifdef USE_INSTANCING_INDIRECT
  mat4 instanceMatrix = getInstancedMatrix();

  #ifdef USE_INSTANCING_COLOR_INDIRECT
    vColor *= getColorTexture();
  #endif
#endif
`
), te = (
  /* glsl */
  `
#ifdef USE_INSTANCING_COLOR_INDIRECT
  #ifdef USE_VERTEX_COLOR
    vColor = color;
  #else
    #ifdef USE_COLOR_ALPHA
      vColor = vec4( 1.0 );
    #else
      vColor = vec3( 1.0 );
    #endif
  #endif
#endif
`
);
f.instanced_pars_vertex = Zt;
f.instanced_color_pars_vertex = Qt;
f.instanced_vertex = Jt;
f.instanced_color_vertex = te;
function $(r) {
  return r.replace("#ifdef USE_INSTANCING", "#if defined USE_INSTANCING || defined USE_INSTANCING_INDIRECT");
}
f.project_vertex = $(f.project_vertex);
f.worldpos_vertex = $(f.worldpos_vertex);
f.defaultnormal_vertex = $(f.defaultnormal_vertex);
f.batching_pars_vertex = f.batching_pars_vertex.concat(`
#include <instanced_pars_vertex>`);
f.color_pars_vertex = f.color_pars_vertex.concat(`
#include <instanced_color_pars_vertex>`);
f.batching_vertex = f.batching_vertex.concat(`
#include <instanced_vertex>`);
f.morphinstance_vertex = f.morphinstance_vertex.replaceAll("gl_InstanceID", "instanceIndex");
export {
  Gt as GLInstancedBufferAttribute,
  dt as InstancedEntity,
  p as InstancedMesh2,
  zt as InstancedMeshBVH,
  Yt as InstancedRenderList,
  Vt as ascSortIntersection,
  se as createRadixSort,
  $ as patchShader,
  xt as sortOpaque,
  mt as sortTransparent
};
//# sourceMappingURL=index.js.map
