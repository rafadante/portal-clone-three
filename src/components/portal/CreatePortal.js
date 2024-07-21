import * as THREE from 'three';
import {
    TWEEN
} from '../../Tween.js';
import {
    createLightBridgesFromPortal
} from '../continuous/Continuous.js';
import {
    tweenCamera
} from '../../Main.js';
import {
    Portal
} from '../portal/Portal.js';
import {
    GLOBALS
} from '../../Globals.js';
import { AUDIO, addRadioAudio } from '../audio/Audio.js';

var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();
var allowPortal = true;

var fffff = false;

function portalButton(button, auto) {

    if (!allowPortal)//|| GLOBALS.HOLDING_ITEM
        return;

    if (GLOBALS.FPS_MODE && (button == 2 || button == 0 || button == 1) && GLOBALS.ALLOW_PLACE_PORTALS) {

        raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

        if (auto) {
            auto.point = auto.position;
            auto.instanceId = auto.planeInstancedId;
            auto.object = auto;
            intersects = [auto];
            console.log("111111111111")
            console.log(intersects)
        }


        if (intersects.length > 0) {

            var userData = GLOBALS.PLANE_USER_DATA[intersects[0].instanceId];

            console.log(userData)

            var obj = intersects[0].object;
            var target = new THREE.Vector3(); // create once an reuse it
            intersects[0].object.getWorldPosition(target);

            var direction = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
            var offsetVector = new THREE.Vector3(0.0 * direction.x, 0.0 * direction.y, 0.0 * direction.z);

            var x = intersects[0].point.x + offsetVector.x;
            var y = intersects[0].point.y + offsetVector.y;
            var z = intersects[0].point.z + offsetVector.z;

            //PORTAL GUN FLASH
            if (!auto) {
                if (button == 0) { // left click
                    GLOBALS.FLASH.color = new THREE.Color(1, 0.25, 0);
                } else if (button == 2) { // left click
                    GLOBALS.FLASH.color = new THREE.Color(0, 0.3, 1);
                }

                var positionGun = new THREE.Vector3();
                GLOBALS.PORTAL_GUN_FLASH.getWorldPosition(positionGun);

                if (button == 0 || button == 2) {

                    GLOBALS.FLASH.position.copy(positionGun);
                    GLOBALS.FLASH.visible = true;

                    tweenCamera(300, GLOBALS.FLASH.position, new THREE.Vector3(x, y, z));

                    allowPortal = false;
                    tweenCamera(150, GLOBALS.GUN.children[0].position, new THREE.Vector3(GLOBALS.GUN.children[0].position.x,
                        GLOBALS.GUN.children[0].position.y,
                        0.005));
                    setTimeout(() => {
                        tweenCamera(150, GLOBALS.GUN.children[0].position, new THREE.Vector3(GLOBALS.GUN.children[0].position.x,
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

            if (GLOBALS.GUN_MODE == 1) {

                console.log(userData)

                if (auto || (userData.portal && (!userData.hasItem || userData.itemName.includes("camera")))) {
                    const point = new THREE.Vector3(x, y, z);
                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    // define playerUpDirection
                    let playerUpDirection = new THREE.Vector3(0, 1, 0)

                    var normal;
                    if (userData.side == "front")
                        normal = new THREE.Vector3(0, 0, 1)
                    else if (userData.side == "back")
                        normal = new THREE.Vector3(0, 0, -1)
                    else if (userData.side == "right")
                        normal = new THREE.Vector3(-1, 0, 0)
                    else if (userData.side == "left")
                        normal = new THREE.Vector3(1, 0, 0)
                    else if (userData.side == "up") {
                        playerUpDirection.applyQuaternion(GLOBALS.MAIN_CAMERA.quaternion)
                        normal = new THREE.Vector3(0, -1, 0)
                    } else if (userData.side == "down") {
                        playerUpDirection.applyQuaternion(GLOBALS.MAIN_CAMERA.quaternion)
                        normal = new THREE.Vector3(0, 1, 0)
                    }

                    var pLocal = new THREE.Vector3(0, 0, -1);
                    var pWorld = pLocal.applyMatrix4(GLOBALS.MAIN_CAMERA.matrixWorld);
                    var dir = pWorld.sub(GLOBALS.MAIN_CAMERA.position).normalize();

                    //const normal = geometry.attributes.normal.clone();
                    //const normalMatrix = new Matrix3().getNormalMatrix( instanceMatrix );
                    //normal.applyNormalMatrix( normalMatrix );

                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    //const objectMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld)
                    //const normal = intersects[0].face.normal.clone().applyMatrix3(objectMatrix).normalize()
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
                                AUDIO.PORTAL_INVALID.play();
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
                            point.y = userData.position.y;
                        }

                        if (pointsChecked[0].length == 0 || pointsChecked[3].length == 0) {
                            point.x = userData.position.x;
                            point.z = userData.position.z;
                        }
                    }

                    //point.add(dir.clone().multiplyScalar(-0.02));

                    console.log("5555555555555555555555555")

                    if (button == 0) { // left click

                        console.log("66666666666666666666666666")

                        if (GLOBALS.PORTALS[1] === null)
                            document.getElementById("reticle-img").src = './assets/textures/crosshairOrange.png';
                        else
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                        // delete the old portal this new one is replacing
                        if (GLOBALS.PORTALS[0] !== null)
                            deletePortal(0);

                        newPortal(0, 1, point, normal, userData.body, playerUpDirection, portalPoints, userData.side)

                        GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iColor.value = new THREE.Vector3(1.0, 0.25, 0.0);

                        if (GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha.value == 0.0) {
                            new TWEEN.Tween(GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }

                        GLOBALS.PORTALS[0].normal = normal;

                        AUDIO.PORTAL_GUN_ORANGE.pause();
                        AUDIO.PORTAL_GUN_ORANGE.currentTime = 0;
                        AUDIO.PORTAL_GUN_ORANGE.play();
                    } else if (button == 2) { // left click

                        console.log("777777777777777777777")

                        if (GLOBALS.PORTALS[0] === null)
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBlue.png';
                        else
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                        // delete the old portal this new one is replacing
                        if (GLOBALS.PORTALS[1] !== null)
                            deletePortal(1);

                        newPortal(1, 0, point, normal, userData.body, playerUpDirection, userData.rotation, userData.side)

                        GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iColor.value = new THREE.Vector3(0.0, 0.3, 1.0);

                        if (GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha.value == 0.0) {
                            new TWEEN.Tween(GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }

                        GLOBALS.PORTALS[1].normal = normal;

                        AUDIO.PORTAL_GUN_BLUE.pause();
                        AUDIO.PORTAL_GUN_BLUE.currentTime = 0;
                        AUDIO.PORTAL_GUN_BLUE.play();
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
                    AUDIO.PORTAL_INVALID.play();
                }
            }
        }
    }
}

function isInOtherPortalArea(point, normal, object, i) {

    var box = new THREE.Box3(); // for re-use
    box.setFromObject(GLOBALS.PORTAL_BOX[i]);

    if (box.containsPoint(point))
        return false

    return true
}

var pointsChecked = [];

function validPortalPoint(point, normal, object) {

    // check that no intersectable objects are directly in front of point
    let frontPoint = point.clone().add(normal.clone().multiplyScalar(1))
    const raycaster = new THREE.Raycaster(frontPoint, normal.clone().multiplyScalar(-1), 0, 1000);
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

    if (GLOBALS.PORTALS[portalIndex] === null)
        return;

    if (GLOBALS.PORTALS[portalIndex].hostObjects !== null) {

        for (var i = 0; i < GLOBALS.CANNON_BODIES.length; i++) {
            // mark this object as collideable with portal 0 bb objects
            GLOBALS.CANNON_BODIES[i].collisionFilterGroup &= ~GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[portalIndex]
            // add back to environment group only if collideable with both portal objects
            if (!(GLOBALS.CANNON_BODIES[i].collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[0]) &&
                !(GLOBALS.CANNON_BODIES[i].collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[1])) {
                    GLOBALS.CANNON_BODIES[i].collisionFilterGroup |= GLOBALS.CGROUP_ENVIRONMENT
            }
        }

        /*// mark this object as collideable with portal 0 bb objects
        GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup &= ~GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[portalIndex]
        // add back to environment group only if collideable with both portal objects
        if (!(GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[0]) &&
            !(GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[1])) {
            GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup |= GLOBALS.CGROUP_ENVIRONMENT
        }*/
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

    //
    for (var i = 0; i < GLOBALS.CANNON_BODIES.length; i++) {
        if (GLOBALS.CANNON_BODIES[i].side == side) {
            GLOBALS.CANNON_BODIES[i].collisionFilterGroup |= GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
            // remove this object from the environment group
            GLOBALS.CANNON_BODIES[i].collisionFilterGroup &= ~GLOBALS.CGROUP_ENVIRONMENT
        }
    }

    //GLOBALS.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup |= GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
    // remove this object from the environment group
    //GLOBALS.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup &= ~GLOBALS.CGROUP_ENVIRONMENT

    if (GLOBALS.PORTALS[otherPortalIndex] !== null)
        GLOBALS.PORTALS[otherPortalIndex].output = GLOBALS.PORTALS[thisPortalIndex]

    GLOBALS.SCENE.add(GLOBALS.PORTALS[thisPortalIndex])
    tweenCamera(300, GLOBALS.PORTALS[thisPortalIndex].mesh.scale, new THREE.Vector3(0.6, 1, 1))
    tweenCamera(300, GLOBALS.PORTALS[thisPortalIndex].portalShader.scale, new THREE.Vector3(0.6, 1, 1))

    if (GLOBALS.PORTALS[otherPortalIndex] !== null)
        GLOBALS.PORTALS[otherPortalIndex].output = GLOBALS.PORTALS[thisPortalIndex]

    if (GLOBALS.PORTALS[0] !== null && GLOBALS.PORTALS[1] !== null) {
        GLOBALS.PORTALS[0].portalShader.material.uniforms.iOpened.value = 1;
        GLOBALS.PORTALS[1].portalShader.material.uniforms.iOpened.value = 1;
    }


    GLOBALS.PORTALS[thisPortalIndex].add(GLOBALS.PORTAL_AUDIO[thisPortalIndex])

    //GLOBALS.PORTAL_AUDIO[thisPortalIndex].play();

    console.log("xxxxxxxxxxxxxx")
}

export {
    portalButton,
    deletePortal,
    newPortal
}