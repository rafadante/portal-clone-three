import {
    Vector3,
    Raycaster,
    Color,
    Box3
} from 'three';
import {
    TWEEN
} from '../../Tween.js';
import {
    createLightBridgesFromPortal
} from '../continuous/Continuous.js';
import {
    tweenCamera
} from '../../Utils.js';
import {
    Portal
} from '../portal/Portal.js';
import {
    GLOBALS
} from '../../Globals.js';
import { AUDIO, play } from '../audio/Audio.js';

var coords = new Vector3();
var raycaster2 = new Raycaster();
var allowPortal = true;

function portalButton(button, auto) {

    if (!auto) {
        if (GLOBALS.PORTAL_GUN_INITIATE == "none" ||
            (GLOBALS.PORTAL_GUN_INITIATE == "left" && button == 2) ||
            (GLOBALS.PORTAL_GUN_INITIATE == "right" && button == 0)
        ) {
            return;
        }
    }

    if (!allowPortal || GLOBALS.HOLDING_ITEM && !auto)//|| 
        return;

    if (GLOBALS.FPS_MODE && (button == 2 || button == 0 || button == 1) && GLOBALS.ALLOW_PLACE_PORTALS) {

        raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);

        var intersectBlockPortal = raycaster2.intersectObjects(GLOBALS.BLOCK_PORTAL);
        var blockPortal = null;

        if (!auto) {
            for (var i = 0; i < intersectBlockPortal.length; i++) {
                if (intersectBlockPortal[i].object.visible) {
                    blockPortal = intersectBlockPortal[i];
                    break;
                }
            }
        }


        var intersects = raycaster2.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

        if (auto) {
            auto.point = auto.position;
            auto.instanceId = auto.userData.planeInstancedId;
            auto.object = auto;
            intersects = [auto];
        }

        if (intersects.length > 0) {

            var userData = GLOBALS.PLANE_USER_DATA[intersects[0].instanceId];

            var obj = intersects[0].object;
            var target = new Vector3(); // create once an reuse it
            intersects[0].object.getWorldPosition(target);

            var direction = new Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
            var offsetVector = new Vector3(0.0 * direction.x, 0.0 * direction.y, 0.0 * direction.z);

            var x = intersects[0].point.x + offsetVector.x;
            var y = intersects[0].point.y + offsetVector.y;
            var z = intersects[0].point.z + offsetVector.z;

            //PORTAL GUN FLASH
            if (!auto) {
                if (button == 0) // left click
                    GLOBALS.FLASH.color = new Color(1, 0.25, 0);
                else if (button == 2) // left click
                    GLOBALS.FLASH.color = new Color(0, 0.3, 1);

                var positionGun = new Vector3();
                GLOBALS.PORTAL_GUN_FLASH.getWorldPosition(positionGun);

                if (button == 0 || button == 2) {

                    GLOBALS.FLASH.position.copy(positionGun);

                    if (GLOBALS.PLAYER.position.distanceTo(intersects[0].point) > 2)
                        GLOBALS.FLASH.visible = true;

                    if (blockPortal)
                        tweenCamera(300, GLOBALS.FLASH.position, blockPortal.point);
                    else
                        tweenCamera(300, GLOBALS.FLASH.position, new Vector3(x, y, z));

                    allowPortal = false;
                    tweenCamera(150, GLOBALS.GUN.children[0].position, new Vector3(GLOBALS.GUN.children[0].position.x,
                        GLOBALS.GUN.children[0].position.y,
                        0.00005));
                    setTimeout(() => {
                        tweenCamera(150, GLOBALS.GUN.children[0].position, new Vector3(GLOBALS.GUN.children[0].position.x,
                            GLOBALS.GUN.children[0].position.y,
                            0));
                    }, 150);
                }

                setTimeout(() => {
                    GLOBALS.FLASH.scale.set(0.02, 0.02, 0.02);
                    GLOBALS.FLASH.visible = false;
                    allowPortal = true;
                }, 300);
            }

            if (blockPortal) {
                //NONPORTABLE WALL
                AUDIO.PORTAL_INVALID.currentTime = 0;
                play(AUDIO.PORTAL_INVALID)
                return;
            }

            if (GLOBALS.GUN_MODE == 1) {

                if (auto || (userData.portal)) {//!userData.hasItem || (userData.itemName.includes("camera"))
                    const point = new Vector3(x, y, z);
                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    // define playerUpDirection
                    let playerUpDirection = new Vector3(0, 1, 0)

                    var normal;
                    if (userData.side == "front")
                        normal = new Vector3(0, 0, 1)
                    else if (userData.side == "back")
                        normal = new Vector3(0, 0, -1)
                    else if (userData.side == "right")
                        normal = new Vector3(-1, 0, 0)
                    else if (userData.side == "left")
                        normal = new Vector3(1, 0, 0)
                    else if (userData.side == "up") {
                        playerUpDirection.applyQuaternion(GLOBALS.MAIN_CAMERA.quaternion)
                        normal = new Vector3(0, -1, 0)
                    } else if (userData.side == "down") {
                        playerUpDirection.applyQuaternion(GLOBALS.MAIN_CAMERA.quaternion)
                        normal = new Vector3(0, 1, 0)
                    }

                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    const depthDir = playerUpDirection.clone().projectOnPlane(normal).normalize()
                    const widthDir = depthDir.clone().cross(normal)
                    const portal_width = GLOBALS.PORTAL_WIDTH
                    const portal_depth = GLOBALS.PORTAL_DEPTH

                    let EPS = -GLOBALS.PORTAL_EPS * 3;
                    let portalPoints = [point.clone().add(depthDir.clone().multiplyScalar(portal_depth / 2 + EPS).add(widthDir.clone().multiplyScalar(portal_width / 2 + EPS))),
                    point.clone().add(depthDir.clone().multiplyScalar(-portal_depth / 2 - EPS).add(widthDir.clone().multiplyScalar(portal_width / 2 + EPS))),
                    point.clone().add(depthDir.clone().multiplyScalar(-portal_depth / 2 - EPS).add(widthDir.clone().multiplyScalar(-portal_width / 2 - EPS))),
                    point.clone().add(depthDir.clone().multiplyScalar(portal_depth / 2 + EPS).add(widthDir.clone().multiplyScalar(-portal_width / 2 - EPS)))
                    ]

                    //IF THE PORTAL IS SPAWNING IN THE SAME POSITION OF ANOTHER PORTAL RETURN
                    var portalID;
                    if (button == 0)
                        portalID = 1;
                    else if (button == 2)
                        portalID = 0;

                    if (GLOBALS.PORTAL_BOX[portalID]) {
                        for (let p of portalPoints) {
                            if (!isInOtherPortalArea(p, normal, intersects[0].object, portalID)) {
                                AUDIO.PORTAL_INVALID.pause();
                                AUDIO.PORTAL_INVALID.currentTime = 0;
                                play(AUDIO.PORTAL_INVALID)
                                return;
                            }
                        }
                    }

                    //CHECK IF THE PORTAL IS GOING OUT OF BOUNDS AND REPOSITIONING IT
                    pointsChecked = [];

                    for (let p of portalPoints)
                        validPortalPoint(p, normal, intersects[0].object);

                    if (userData.side == "up" || userData.side == "down") {
                        if (pointsChecked[1].length == 0 || pointsChecked[1].length == 0 ||
                            pointsChecked[2].length == 0 || pointsChecked[3].length == 0
                        ) {
                            point.z = userData.position.z;
                            point.x = userData.position.x;
                        }
                    } else {
                        if (pointsChecked[1].length == 0 || pointsChecked[1].length == 0 ||
                            pointsChecked[2].length == 0 || pointsChecked[3].length == 0
                        ) {
                            point.y = userData.position.y - 0.1;
                        }

                        if (pointsChecked[0].length == 0 || pointsChecked[3].length == 0) {
                            point.x = userData.position.x;
                            point.z = userData.position.z;
                        }
                    }

                    if (button == 0) { // left click

                        //if (GLOBALS.PORTALS[1] === null)
                        document.getElementById("reticle-img").src = './assets/textures/crosshairOrange.png';
                        //else
                        //    document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                        // delete the old portal this new one is replacing
                        if (GLOBALS.PORTALS[0] !== null)
                            deletePortal(0);

                        newPortal(0, 1, point, normal, userData.body, playerUpDirection, portalPoints, userData.side)

                        GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iColor.value = new Vector3(2.5, 0.7, 0.0);

                        if (GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha.value == 0.0) {
                            new TWEEN.Tween(GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }

                        GLOBALS.PORTALS[0].normal = normal;

                        AUDIO.PORTAL_GUN_ORANGE.pause();
                        AUDIO.PORTAL_GUN_ORANGE.currentTime = 0;
                        play(AUDIO.PORTAL_GUN_ORANGE)
                    } else if (button == 2) { // left click

                        //if (GLOBALS.PORTALS[0] === null)
                        document.getElementById("reticle-img").src = './assets/textures/crosshairBlue.png';
                        //
                        //    document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                        // delete the old portal this new one is replacing
                        if (GLOBALS.PORTALS[1] !== null)
                            deletePortal(1);

                        newPortal(1, 0, point, normal, userData.body, playerUpDirection, userData.rotation, userData.side)

                        GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iColor.value = new Vector3(0.0, 1.25, 2.5);

                        if (GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha.value == 0.0) {
                            new TWEEN.Tween(GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }

                        GLOBALS.PORTALS[1].normal = normal;

                        AUDIO.PORTAL_GUN_BLUE.pause();
                        AUDIO.PORTAL_GUN_BLUE.currentTime = 0;
                        play(AUDIO.PORTAL_GUN_BLUE)
                    }

                    setTimeout(() => {
                        if (button == 0) {
                            createLightBridgesFromPortal(1, GLOBALS.LIGHT_BRIDGE_RAYCASTER);
                            createLightBridgesFromPortal(1, GLOBALS.TRACTOR_BEAM_RAYCASTER);
                            createLightBridgesFromPortal(1, GLOBALS.LASER_EMITTER_RAYCASTER);
                        } else if (button == 2) {
                            createLightBridgesFromPortal(0, GLOBALS.LIGHT_BRIDGE_RAYCASTER);
                            createLightBridgesFromPortal(0, GLOBALS.TRACTOR_BEAM_RAYCASTER);
                            createLightBridgesFromPortal(0, GLOBALS.LASER_EMITTER_RAYCASTER);
                        }
                    }, 300);
                } else {
                    //NONPORTABLE WALL
                    AUDIO.PORTAL_INVALID.pause();
                    AUDIO.PORTAL_INVALID.currentTime = 0;
                    play(AUDIO.PORTAL_INVALID)
                }
            }
        }
    }
}

function isInOtherPortalArea(point, normal, object, i) {

    var box = new Box3(); // for re-use
    box.setFromObject(GLOBALS.PORTAL_BOX[i]);

    if (box.containsPoint(point))
        return false

    return true
}

var pointsChecked = [];

function validPortalPoint(point, normal, object) {

    // check that no intersectable objects are directly in front of point
    let frontPoint = point.clone().add(normal.clone().multiplyScalar(1))
    const raycaster = new Raycaster(frontPoint, normal.clone().multiplyScalar(-1), 0, 1000);
    let intersects = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

    if (intersects.length == 0) {
        pointsChecked.push([])
        return false
    }

    if (intersects.length > 0) {
        var userData = GLOBALS.PLANE_USER_DATA[intersects[0].instanceId];
        if (!userData.portal || intersects[0].distance > 1.1) {
            pointsChecked.push([])
            return false
        }
    }

    pointsChecked.push(intersects)

    return true;
}

// deletes the portal with index portalIndex from the scene
function deletePortal(portalIndex) {

    if (GLOBALS.PORTALS[0] === null && GLOBALS.PORTALS[1] === null)
        AUDIO.PORTAL_GUN_LOOP.pause();

    if (GLOBALS.PORTALS[portalIndex] === null)
        return;


    //REMOVE FIELDS THAT ARE GOING THROUGH THIS PORTAL
    if (GLOBALS.PORTALS[portalIndex].field) {
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PORTALS[portalIndex].field);
        GLOBALS.PORTALS[portalIndex].field = null;
    }

    if (GLOBALS.PORTALS[portalIndex].fieldBody) {

        var body = GLOBALS.PORTALS[portalIndex].fieldBody;

        setTimeout(() => {
            GLOBALS.CANNON_WORLD.removeBody(body);
        }, 10);

        GLOBALS.PORTALS[portalIndex].fieldBodyClone = null;
        GLOBALS.PORTALS[portalIndex].fieldBody = null;
    }

    if (GLOBALS.PORTALS[portalIndex].fieldTrigger) {
        const index = GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.indexOf(GLOBALS.PORTALS[portalIndex].fieldTrigger);
        if (index > -1) {
            GLOBALS.TRACTOR_BEAM.splice(index, 1);
            GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.splice(index, 1);
        }
        GLOBALS.PORTALS[portalIndex].fieldTrigger = null;
    }

    //

    GLOBALS.PORTALS[portalIndex].light.visible = false;
    GLOBALS.PORTAL_AUDIO[portalIndex].sound.audio.pause();

    if (GLOBALS.PORTALS[portalIndex].hostObjects !== null) {

        GLOBALS.PORTALS[portalIndex].hostObjects.portal = false;

        for (var i = 0; i < GLOBALS.WALL_BODIES.length; i++) {
            // mark this object as collideable with portal 0 bb objects
            GLOBALS.WALL_BODIES[i].collisionFilterGroup &= ~GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[portalIndex]
            // add back to environment group only if collideable with both portal objects
            if (!(GLOBALS.WALL_BODIES[i].collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[0]) &&
                !(GLOBALS.WALL_BODIES[i].collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[1])) {
                GLOBALS.WALL_BODIES[i].collisionFilterGroup |= GLOBALS.CGROUP_ENVIRONMENT
            }
        }
    }
    GLOBALS.SCENE.remove(GLOBALS.PORTALS[portalIndex]);
    GLOBALS.PORTALS[portalIndex].portalShader.material.uniforms.iOpened.value = 0;
    GLOBALS.PORTALS[portalIndex] = null;
}

// creates a new portal and adds it to the scene
function newPortal(thisPortalIndex, otherPortalIndex, point, normal, hostObject, playerUpDirection, portalPoints, side) {

    let color = GLOBALS.PORTAL_COLORS[thisPortalIndex]

    GLOBALS.PORTALS[thisPortalIndex] = new Portal(
        point,
        normal, // normal of surface
        playerUpDirection,
        GLOBALS.PORTALS[otherPortalIndex],
        hostObject,
        color,
        thisPortalIndex,
        portalPoints)
    GLOBALS.PORTALS[thisPortalIndex].mesh.scale.set(0, 0, 0);
    GLOBALS.PORTALS[thisPortalIndex].portalShader.scale.set(0, 0, 0);

    GLOBALS.PORTALS[thisPortalIndex].hostObjects.portal = true;

    for (var i = 0; i < GLOBALS.WALL_BODIES.length; i++) {
        if (GLOBALS.WALL_BODIES[i].side == side) {
            GLOBALS.WALL_BODIES[i].collisionFilterGroup |= GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
            // remove this object from the environment group
            GLOBALS.WALL_BODIES[i].collisionFilterGroup &= ~GLOBALS.CGROUP_ENVIRONMENT
        }
    }

    if (GLOBALS.PORTALS[otherPortalIndex] !== null)
        GLOBALS.PORTALS[otherPortalIndex].output = GLOBALS.PORTALS[thisPortalIndex]

    GLOBALS.SCENE.add(GLOBALS.PORTALS[thisPortalIndex])
    tweenCamera(300, GLOBALS.PORTALS[thisPortalIndex].mesh.scale, new Vector3(0.6, 1, 1))
    tweenCamera(300, GLOBALS.PORTALS[thisPortalIndex].portalShader.scale, new Vector3(0.6, 1, 1))

    if (GLOBALS.PORTALS[otherPortalIndex] !== null)
        GLOBALS.PORTALS[otherPortalIndex].output = GLOBALS.PORTALS[thisPortalIndex]

    if (GLOBALS.PORTALS[0] !== null && GLOBALS.PORTALS[1] !== null) {
        GLOBALS.PORTALS[0].portalShader.material.uniforms.iOpened.value = 1;
        GLOBALS.PORTALS[1].portalShader.material.uniforms.iOpened.value = 1;
    }

    GLOBALS.PORTAL_AUDIO[thisPortalIndex].sound.position.copy(GLOBALS.PORTALS[thisPortalIndex].mesh.position);
    GLOBALS.PORTAL_AUDIO[thisPortalIndex].sound.quaternion.copy(GLOBALS.PORTALS[thisPortalIndex].mesh.quaternion);
    play(GLOBALS.PORTAL_AUDIO[thisPortalIndex].sound.audio)

    if (AUDIO.PORTAL_GUN_LOOP.paused)
        play(AUDIO.PORTAL_GUN_LOOP)
}

export {
    portalButton,
    deletePortal,
    newPortal
}