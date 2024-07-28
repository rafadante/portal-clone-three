import {
    Matrix4,
    Quaternion,
    Group,
    Vector3
} from 'three';
import * as CANNON from "cannon";
import { AUDIO, play } from '../audio/Audio.js';
import { removeJointConstraint } from "../../Physics.js";
import { cannonToThreeVector3, threeToFour, fourToThree } from '../../Utils.js';
import {
    GLOBALS
} from '../../Globals.js';

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(object, portal) {
    let f = new Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    object.applyMatrix4(m)
}

function teleportPhysicalObject(object, portal) {

    let f = new Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    //object.mesh.applyMatrix4(m)
    let position = cannonToThreeVector3(object.position)
    let previousPosition = cannonToThreeVector3(object.position)
    let velocity = cannonToThreeVector3(object.velocity)
    let force = cannonToThreeVector3(object.force)

    let orientation = new Quaternion().copy(object.quaternion)
    let mquat = new Quaternion().setFromRotationMatrix(m)
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

// apply teleportation to the output portal to the vector
// no side effects
function getTeleportedPositionalVector(v, portal) {
    let f = new Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// for directional vectors, it doesn't make sense to translate them
// we only apply the rotational component of the matrix
function getTeleportedDirectionalVector(v, portal) {
    let f = new Matrix4().makeScale(-1, -1, 1)
    let it = new Matrix4()
    it.extractRotation(portal.CDBB.inverse_t)
    let to = new Matrix4()
    to.extractRotation(portal.output.CDBB.t)

    let m = it.clone().premultiply(f).premultiply(to)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

var teleported = false;

function teleportationState() {

    if(teleported){
        teleported = false;
        GLOBALS.PLAYER_MODEL.visible = true; 
    }

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

        let pos = new Vector3(d.position.x, d.position.y, d.position.z);

        if (dd == 0) {
            pos = new Vector3(GLOBALS.MAIN_CAMERA.position.x, d.position.y, GLOBALS.MAIN_CAMERA.position.z);
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
                                    var positionBoneHand = new Vector3();
                                    c.getWorldPosition(positionBoneHand);
                                    window.posW = positionBoneHand;
                                }
                            }
                        });
                    }
                }
            } else {
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
                        play(AUDIO.PORTAL_ENTER)

                        AUDIO.PORTAL_EXIT.pause();
                        AUDIO.PORTAL_EXIT.currentTime = 0;
                        play(AUDIO.PORTAL_EXIT);

                        removeJointConstraint();
                        teleportObject3D(GLOBALS.MAIN_CAMERA, GLOBALS.PORTALS[p]);
                        GLOBALS.PLAYER_MODEL_CLONE.visible = false;
                        GLOBALS.PLAYER_MODEL.visible = false;
                        GLOBALS.GUN.visible = false;
                        teleported = true;

                        // fix camera rotation
                        // create a new basis with up as the up
                        // https://danielilett.com/2020-01-03-tut4-4-portal-momentum/
                        let up = new Vector3(0, 1, 0);
                        let cameraForward = new Vector3();
                        GLOBALS.MAIN_CAMERA.getWorldDirection(cameraForward);
                        cameraForward.normalize();
                        let cameraRight = cameraForward.clone().cross(up).normalize();
                        let cameraUp = cameraRight.clone().cross(cameraForward).normalize();
                        let cameraMat = new Matrix4().makeBasis(
                            cameraRight,
                            cameraUp,
                            cameraForward.negate()
                        );
                        GLOBALS.MAIN_CAMERA.quaternion.setFromRotationMatrix(cameraMat);

                        var q = new Quaternion()
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
    obj.name = "camera";
    GLOBALS.DYNAMIC_OBJECTS.push(box);
    GLOBALS.CANNON_WORLD.addBody(box);
    GLOBALS.INTERACTIVE.push(obj.cube);
}

export {
    teleportPhysicalObject,
    teleportObject3D,
    teleportationState
}