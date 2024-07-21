/* eslint-disable */
import * as THREE from 'three';
import {
    GeneralBB
} from '../generalBB/GeneralBB.js'
import {
    Group,
    Vector3
} from 'three';
import {
    GLOBALS
} from '../../Globals.js';
import * as CANNON from "cannon";
import { AUDIO } from '../audio/Audio.js';
import { hideMaterial } from "../../Main.js";
import { removeJointConstraint } from "../../Physics.js";

class Portal extends Group {
    // position - the center position (vector3)
    // normal - the normal of the host surface
    // playerDirection - the direction the player is facing
    // output - portal that this portal is paired with
    // hostObjects - object that this portal is on
    // ringColor - the color of the ring, portal1: orange, portal2: blue
    // portalPoints - the positions of the corners of the portals
    constructor(position, normal, playerUpDirection, output, hostObjects, ringColor, index, portalPoints = []) {
        super()
        this.pos = position.clone()
        this.output = output
        this.hostObjects = hostObjects
        this.plane = new THREE.Plane(new Vector3(0, 1, 0), 0)
        this.debugMeshes = new Group()

        // create onb for bb transformations
        this.ty = normal.clone().normalize()
        this.tz = playerUpDirection.clone().projectOnPlane(this.ty).normalize()
        if (this.tz.length() < 0.1) {
            this.tz = new Vector3(0, 1, 0)
        }
        this.tx = this.tz.clone().cross(this.ty)

        // set portal corner points
        // set portal corner points
        this.portalPoints = portalPoints;
        if (portalPoints === undefined || portalPoints.length == 0) {
            this.portalPoints = [this.pos.clone().add(this.tz.clone().multiplyScalar(portal_depth / 2 + 2 * portal_eps).add(this.tx.clone().multiplyScalar(portal_width / 2 + 2 * portal_eps))),
            this.pos.clone().add(this.tz.clone().multiplyScalar(-portal_depth / 2 - 2 * portal_eps).add(this.tx.clone().multiplyScalar(portal_width / 2 + 2 * portal_eps))),
            this.pos.clone().add(this.tz.clone().multiplyScalar(-portal_depth / 2 - 2 * portal_eps).add(this.tx.clone().multiplyScalar(-portal_width / 2 - 2 * portal_eps))),
            this.pos.clone().add(this.tz.clone().multiplyScalar(portal_depth / 2 + 2 * portal_eps).add(this.tx.clone().multiplyScalar(-portal_width / 2 - 2 * portal_eps)))
            ]
        }

        let tRot = new THREE.Matrix4().makeBasis(this.tx, this.ty, this.tz)

        // for visualization purposes
        let xHelper = new THREE.ArrowHelper(this.tx, position, 1, 0xff0000)
        let yHelper = new THREE.ArrowHelper(this.ty, position, 1, 0x00ff00)
        let zHelper = new THREE.ArrowHelper(this.tz, position, 1, 0x0000ff)
        this.debugMeshes.add(xHelper, yHelper, zHelper)

        this.transform = tRot.clone().setPosition(position)
        this.plane.applyMatrix4(this.transform)
        this.plane.translate(normal.clone().multiplyScalar(0.0001));

        // create the 3d model for the portal
        const VERT_SHADER = `
        void main() 
        {
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition;
        }
        `
        const FRAG_SHADER = `
        uniform sampler2D texture1;
        uniform float ww;
        uniform float wh;
        
        void main() {
            gl_FragColor = texture2D(texture1, gl_FragCoord.xy / vec2(ww, wh));

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
        `
        const geometry = new THREE.CylinderGeometry(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_HEIGHT);
        const uniforms = {
            texture1: {
                type: 't',
                value: new THREE.Texture()
            },
            ww: {
                type: 'f',
                value: 1
            }, // not correct values at time of creation necessarily, will be updated later in render loop
            wh: {
                type: 'f',
                value: 1
            }
        }

        const material = new THREE.ShaderMaterial({
            vertexShader: VERT_SHADER,
            fragmentShader: FRAG_SHADER,
            uniforms: uniforms,
            stencilWrite: true, // stencil optimization, only for culling portal
            stencilFunc: THREE.EqualStencilFunc,
            stencilRef: 1,
            stencilFail: THREE.ReplaceStencilOp,
            depthTest: true,
            depthWrite: false,
            polygonOffset: true,
            polygonOffsetFactor: -5,
            side: THREE.DoubleSide
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.applyMatrix4(this.transform)
        this.mesh.updateMatrix()
        this.mesh.matrixAutoUpdate = true;
        this.matrixAutoUpdate = true;
        this.mesh.frustumCulled = true;
        this.add(this.mesh)

        this.mesh.translateY(-0.25);

        this.mesh.onAfterRender = function (renderer) {
            renderer.clearStencil();
        };

        var light;

        if (index == 0) {
            this.mesh.userData.this = 0;
            this.mesh.userData.other = 1;

            light = GLOBALS.LIGHT_PORTAL_0;
        } else {
            this.mesh.userData.this = 1;
            this.mesh.userData.other = 0;

            light = GLOBALS.LIGHT_PORTAL_1;
        }

        light.position.copy(this.mesh.position)
        light.visible = true;

        var parent = GLOBALS.PORTAL_SHADER[index].parent;
        if (parent) {
            parent.remove(GLOBALS.PORTAL_SHADER[index]);
            GLOBALS.PORTAL_SHADER[index].matrix.identity().decompose(GLOBALS.PORTAL_SHADER[index].position, GLOBALS.PORTAL_SHADER[index].quaternion, GLOBALS.PORTAL_SHADER[index].scale)
        }

        //
        GLOBALS.PORTAL_SHADER[index].applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_SHADER[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_SHADER[index].updateMatrix()
        GLOBALS.PORTAL_SHADER[index].matrixAutoUpdate = true;
        this.portalShader = GLOBALS.PORTAL_SHADER[index];
        this.portalShader.frustumCulled = true;
        this.add(GLOBALS.PORTAL_SHADER[index])

        //
        const geometry3 = new THREE.BoxGeometry(1.4, 2, 0.1);
        const material3 = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        GLOBALS.PORTAL_BOX[index] = new THREE.Mesh(geometry3, material3);
        GLOBALS.PORTAL_BOX[index].applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_BOX[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_BOX[index].updateMatrix()
        GLOBALS.PORTAL_BOX[index].matrixAutoUpdate = true;
        GLOBALS.PORTAL_BOX[index].visible = false;
        this.add(GLOBALS.PORTAL_BOX[index]);

        //
        const geometry4 = new THREE.BoxGeometry(0.75, 1.2, 0.1);
        GLOBALS.PORTAL_INNER_BOX[index] = new THREE.Mesh(geometry4, material3);
        GLOBALS.PORTAL_INNER_BOX[index].applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_INNER_BOX[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_INNER_BOX[index].updateMatrix()
        GLOBALS.PORTAL_INNER_BOX[index].matrixAutoUpdate = true;
        GLOBALS.PORTAL_INNER_BOX[index].visible = false;
        this.add(GLOBALS.PORTAL_INNER_BOX[index]);

        // CDBB: collision disable BB
        // STBB: should teleport BB
        // matrix for the CDBB
        // CDBB is centered at portal
        let tCDBB = this.transform.clone();
        // STBB is centered at 1/4 height of CDBB behind the portal
        // because height of STBB is half height of CDBB
        let pSTBB = position.clone().add(normal.clone().multiplyScalar(-GLOBALS.PORTAL_CDBB_HEIGHT / 4))
        let tSTBB = tRot.clone().setPosition(pSTBB)

        this.CDBB = new GeneralBB(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_CDBB_HEIGHT, GLOBALS.PORTAL_DEPTH, tCDBB, 0xff0000)
        this.STBB = new GeneralBB(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_CDBB_HEIGHT / 2, GLOBALS.PORTAL_DEPTH, tSTBB, 0x00ff00)

        this.debugMeshes.add(this.CDBB.helper)
        this.debugMeshes.add(this.STBB.helper)
        this.debugMeshes.visible = false; //globals.DEBUG
        this.add(this.debugMeshes)
    }
}

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(object, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    object.applyMatrix4(m)
}

function teleportPhysicalObject(object, portal) {

    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    //object.mesh.applyMatrix4(m)
    let position = cannonToThreeVector3(object.position)
    let previousPosition = cannonToThreeVector3(object.position)
    let velocity = cannonToThreeVector3(object.velocity)
    let force = cannonToThreeVector3(object.force)

    let orientation = new THREE.Quaternion().copy(object.quaternion)
    let mquat = new THREE.Quaternion().setFromRotationMatrix(m)
    orientation.premultiply(mquat)

    position = getTeleportedPositionalVector(position, portal)
    previousPosition = getTeleportedPositionalVector(previousPosition, portal)
    velocity = getTeleportedDirectionalVector(velocity, portal)
    force = getTeleportedDirectionalVector(force, portal)

    if (velocity.x > 10) {
        velocity.x = 10;
    } else if (velocity.x < -10)
        velocity.x = -10;

    if (velocity.y > 10) {
        velocity.y = 10;
    } else if (velocity.y < -10)
        velocity.y = -10;

    if (velocity.z > 10) {
        velocity.z = 10;
    } else if (velocity.z < -10)
        velocity.z = -10;

    if (Math.abs(GLOBALS.PORTALS[0].normal.y) == 1 && Math.abs(GLOBALS.PORTALS[1].normal.y) == 1) {
        velocity.x *= 0.5;
        velocity.z *= 0.5;
    }

    object.position.copy(position)
    object.previousPosition.copy(previousPosition)
    object.velocity.copy(velocity)
    object.force.copy(force)
    object.quaternion.copy(orientation)
}

function threeToCannonVector3(v3) {
    return new CANNON.Vec3().copy(v3)
}

function cannonToThreeVector3(v3) {
    return new THREE.Vector3().copy(v3)
}

// apply teleportation to the output portal to the vector
// no side effects
function getTeleportedPositionalVector(v, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// for directional vectors, it doesn't make sense to translate them
// we only apply the rotational component of the matrix
function getTeleportedDirectionalVector(v, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let it = new THREE.Matrix4()
    it.extractRotation(portal.CDBB.inverse_t)
    let to = new THREE.Matrix4()
    to.extractRotation(portal.output.CDBB.t)

    let m = it.clone().premultiply(f).premultiply(to)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// convert vector3 to vector4
function threeToFour(v) {
    return new THREE.Vector4(v.x, v.y, v.z, 1)
}

function fourToThree(v) {
    return new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(1 / v.w)
}

function teleportationState() {

    GLOBALS.MAIN_CAMERA.position.copy(GLOBALS.PLAYER.position)
    GLOBALS.MAIN_CAMERA.translateY(0.3)
    GLOBALS.GUN.position.copy(GLOBALS.MAIN_CAMERA.position);

    if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null) return;

    var dd = 0;

    for (var i = 0; i < GLOBALS.CAMERAS.length; i++) {
        if (
            (GLOBALS.CAMERAS[i].box3.containsPoint(GLOBALS.PORTAL_BOX[0].position) ||
                GLOBALS.CAMERAS[i].box3.containsPoint(
                    GLOBALS.PORTAL_BOX[1].position
                )) &&
            GLOBALS.CAMERAS[i].fixed
        ) {
            GLOBALS.CAMERAS[i].fixed = false;
            addCameraBody(GLOBALS.CAMERAS[i]);
        }
    }

    if (GLOBALS.OBJ_HOLDED_CLONE && GLOBALS.HOLDING_ITEM) {

        let pos = GLOBALS.CURRENT_ITEM.body.position;
        let CDBB_isOverlap = false;
        GLOBALS.OBJ_HOLDED_CLONE.visible = false;

        for (let p = 0; p < GLOBALS.PORTALS.length; p++) {
            // collision disable, might be partially intersecting with portal
            if (GLOBALS.PORTALS[p].CDBB.containsPoint(pos)) {
                // show the clone
                if (p == 0 || (p > 0 && !CDBB_isOverlap)) {
                    CDBB_isOverlap = true;
                    teleportObject3D(GLOBALS.OBJ_HOLDED_CLONE, GLOBALS.PORTALS[p]);
                    GLOBALS.OBJ_HOLDED_CLONE.visible = true;
                }
            }
        }
    }

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z);

        if (dd == 0) {
            //pos = new THREE.Vector3(GLOBALS.MAIN_CAMERA.position.x, d.position.y, GLOBALS.MAIN_CAMERA.position.z);
        }

        d.collisionFilterMask = GLOBALS.CGROUP_ALL;

        if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null) continue;

        var inArea = 0;

        if (dd == 0) {
            GLOBALS.PLAYER_MODEL_CLONE.visible = false;
            GLOBALS.GUN_CLONE.visible = false;
            GLOBALS.GUN_CLONE2.visible = false;
        }

        let CDBB_isOverlap = false;

        for (let p = 0; p < GLOBALS.PORTALS.length; p++) {
            // collision disable, might be partially intersecting with portal
            if (GLOBALS.PORTALS[p].CDBB.containsPoint(pos)) {
                if (d.name != "player") {
                    d.wakeUp();
                }

                d.collisionFilterMask &=
                    ~GLOBALS.PORTALS[p].hostObjects.collisionFilterGroup;
                d.inArea = true;

                if (dd == 0) {
                    inArea++;

                    // show the clone
                    if (p == 0 || (p > 0 && !CDBB_isOverlap)) {

                        CDBB_isOverlap = true;
                        teleportObject3D(GLOBALS.PLAYER_MODEL_CLONE, GLOBALS.PORTALS[p]);
                        GLOBALS.PLAYER_MODEL_CLONE.visible = true;

                        GLOBALS.PLAYER_MODEL_CLONE.traverse((c) => {
                            if (c.isBone) {
                                if (c.name == "wrist_R") {
                                    var positionBoneHand = new THREE.Vector3();
                                    c.getWorldPosition(positionBoneHand);
                                    window.posW = positionBoneHand;
                                }
                            }
                        });
                    }
                }
            }else{
                d.inArea = false;
            }

            // should teleport
            if (GLOBALS.PORTALS[p].STBB.containsPoint(pos)) {

                if (d.holding) {
                    d.teleportingHolding = true;
                } else {
                    teleportPhysicalObject(d, GLOBALS.PORTALS[p]);

                    if (dd == 0) {

                        AUDIO.PORTAL_ENTER.pause();
                        AUDIO.PORTAL_ENTER.currentTime = 0;
                        AUDIO.PORTAL_ENTER.play();

                        AUDIO.PORTAL_EXIT.pause();
                        AUDIO.PORTAL_EXIT.currentTime = 0;
                        AUDIO.PORTAL_EXIT.play();

                        hideMaterial(GLOBALS.PLAYER_MODEL, true, 0)
                        GLOBALS.PLAYER_MODEL_CLONE.visible = false;

                        removeJointConstraint();
                        teleportObject3D(GLOBALS.MAIN_CAMERA, GLOBALS.PORTALS[p]);

                        // fix camera rotation
                        // create a new basis with up as the up
                        // https://danielilett.com/2020-01-03-tut4-4-portal-momentum/
                        let up = new THREE.Vector3(0, 1, 0);
                        let cameraForward = new THREE.Vector3();
                        GLOBALS.MAIN_CAMERA.getWorldDirection(cameraForward);
                        cameraForward.normalize();
                        let cameraRight = cameraForward.clone().cross(up).normalize();
                        let cameraUp = cameraRight.clone().cross(cameraForward).normalize();
                        let cameraMat = new THREE.Matrix4().makeBasis(
                            cameraRight,
                            cameraUp,
                            cameraForward.negate()
                        );
                        GLOBALS.MAIN_CAMERA.quaternion.setFromRotationMatrix(cameraMat);

                        var q = new THREE.Quaternion()
                        q.setFromRotationMatrix(cameraMat);
                        window.q = q;

                        GLOBALS.TARGET_ROTATION_X = GLOBALS.MAIN_CAMERA.rotation.y;
                        GLOBALS.TARGET_ROTATION_Y = GLOBALS.MAIN_CAMERA.rotation.x;

                        GLOBALS.GUN.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);

                        window.CAMERA_ROTATING = true;
                        setTimeout(() => {
                            window.CAMERA_ROTATING = false;
                        }, 1000);
                    }

                    d.collisionFilterMask |=
                        GLOBALS.PORTALS[p].hostObjects.collisionFilterGroup;
                    d.collisionFilterMask &=
                        ~GLOBALS.PORTALS[1 - p].hostObjects.collisionFilterGroup;

                    break;
                }
            } else {
                if (d.portal == p && d.teleportingHolding) d.teleportingHolding = false;
            }
        }
        dd++;
    }
}

function addCameraBody(obj) {
    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.4; //0.01
    PHYSICS_MATERIAL.restitution = 0; //0.1
  
    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.2, 0.2));
  
    var box = new CANNON.Body({
      shape: shape,
      mass: 10,
      material: PHYSICS_MATERIAL,
    });
  
    box.position.copy(obj.cube.position);
    box.quaternion.copy(obj.quaternion);
    box.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    box.collisionFilterMask = GLOBALS.CGROUP_ALL;
    box.offset = 0.2;
    obj.body = box;
    obj.cube.body = box;
    obj.name == "camera";
    GLOBALS.DYNAMIC_OBJECTS.push(box);
    GLOBALS.CANNON_WORLD.addBody(box);
    GLOBALS.INTERACTIVE.push(obj.cube);
  }

export {
    Portal,
    teleportPhysicalObject,
    teleportObject3D,
    teleportationState
}