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

var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();
var allowPortal = true;

function portalButton(button) {

    if(!allowPortal)
        return;

    if (GLOBALS.FPS_MODE && (button == 2 || button == 0 || button == 1) && GLOBALS.ALLOW_PLACE_PORTALS) {

        raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

        if (intersects.length > 0) {

            var userData = GLOBALS.PLANE_USER_DATA[intersects[0].instanceId];

            var obj = intersects[0].object;
            var target = new THREE.Vector3(); // create once an reuse it
            intersects[0].object.getWorldPosition(target);

            var direction = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
            var offsetVector = new THREE.Vector3(0.0 * direction.x, 0.0 * direction.y, 0.0 * direction.z);

            var x = intersects[0].point.x + offsetVector.x;
            var y = intersects[0].point.y + offsetVector.y;
            var z = intersects[0].point.z + offsetVector.z;

            //PORTAL GUN FLASH
            if (button == 0) { // left click
                //GLOBALS.FLASH.children[0].material.color = new THREE.Color( 1, 0.25, 0 );
                //GLOBALS.FLASH.children[0].material.emissive = new THREE.Color( 1, 0.25, 0 );
                GLOBALS.FLASH.color = new THREE.Color( 1, 0.25, 0 );
            } else if (button == 2) { // left click
                //GLOBALS.FLASH.children[0].material.color = new THREE.Color( 0, 0.3, 1 );
                //GLOBALS.FLASH.children[0].material.emissive = new THREE.Color( 0, 0.3, 1 ); 
                GLOBALS.FLASH.color = new THREE.Color( 0, 0.3, 1 );
            }

            //GLOBALS.PORTAL_GUN_FLASH

            var positionGun = new THREE.Vector3();
            GLOBALS.PORTAL_GUN_FLASH.getWorldPosition(positionGun);

            if(button==0 || button ==2){

                GLOBALS.FLASH.position.copy(positionGun);
                //GLOBALS.FLASH.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);

                GLOBALS.FLASH.visible = true;
                //GLOBALS.FLASH.children[3].visible = true;

                //tweenCamera(100, GLOBALS.FLASH.scale, new THREE.Vector3(0.25,0.25,0.25));
                tweenCamera(300, GLOBALS.FLASH.position, new THREE.Vector3(x, y, z));

                allowPortal = false;
                tweenCamera(100, GLOBALS.GUN.children[0].position, new THREE.Vector3(GLOBALS.GUN.children[0].position.x,
                    GLOBALS.GUN.children[0].position.y,
                    0.005));
                setTimeout(() => {
                    tweenCamera(100, GLOBALS.GUN.children[0].position, new THREE.Vector3(GLOBALS.GUN.children[0].position.x,
                        GLOBALS.GUN.children[0].position.y,
                        0));
                }, 100);
            }

            setTimeout(() => {
                //tweenCamera(100, GLOBALS.FLASH.scale, new THREE.Vector3(0,0,0));
                GLOBALS.FLASH.scale.set(0.02,0.02,0.02)
                //GLOBALS.FLASH.children[3].visible = false;
                GLOBALS.FLASH.visible = false;
                //GLOBALS.FLASH.visible = false;
                allowPortal = true;
            }, 300);

            //
            if (GLOBALS.GUN_MODE == 1) {

                if (userData.portal) {

                    //-------------------------------------------------
                    var boxUpName = userData.position.x + "/" +
                        (userData.position.y + 2) + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxUpName).length == 0) {
                        if (intersects[0].uv.y >= 0.5)
                            y = userData.position.y;
                    } else {
                        if (intersects[0].uv.y >= 0.5 && !getPlaneByName(boxUpName)[0].portal)
                            y = userData.position.y;
                    }
                    //-------------------------------------------------
                    var boxDownName = userData.position.x + "/" +
                        (userData.position.y - 2) + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxDownName).length == 0) {
                        if (intersects[0].uv.y <= 0.5)
                            y = userData.position.y;
                    } else {
                        if (intersects[0].uv.y <= 0.5 && !getPlaneByName(boxDownName)[0].portal)
                            y = userData.position.y;
                    }
                    //-------------------------------------------------
                    var boxLeftName = (userData.position.x + 2) + "/" +
                        userData.position.y + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxLeftName).length == 0) {
                        if (userData.side == "front") {
                            if (intersects[0].uv.x >= 0.75)
                                x = userData.position.x + 0.5;
                        } else if (userData.side == "back") {
                            if (intersects[0].uv.x <= 0.25)
                                x = userData.position.x + 0.5;
                        } else {
                            x = userData.position.x;
                        }
                    }
                    //-------------------------------------------------
                    var boxRightName = (userData.position.x - 2) + "/" +
                        userData.position.y + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxRightName).length == 0) {
                        if (userData.side == "front") {
                            if (intersects[0].uv.x <= 0.25)
                                x = userData.position.x - 0.5;
                        } else if (userData.side == "back") {
                            if (intersects[0].uv.x >= 0.75)
                                x = userData.position.x - 0.5;
                        } else {
                            x = userData.position.x;
                        }
                    }
                    //-------------------------------------------------
                    var boxFrontName = userData.position.x + "/" +
                        userData.position.y + "/" +
                        (userData.position.z + 2);

                    if (getPlaneByName(boxFrontName).length == 0) {
                        if (userData.side == "left") {
                            if (intersects[0].uv.x <= 0.25)
                                z = userData.position.z + 0.5;
                        } else if (userData.side == "right") {
                            if (intersects[0].uv.x >= 0.75)
                                z = userData.position.z + 0.5;
                        } else {
                            z = userData.position.z;
                        }
                    }
                    //-------------------------------------------------
                    var boxBackName = userData.position.x + "/" +
                        userData.position.y + "/" +
                        (userData.position.z - 2);

                    if (getPlaneByName(boxBackName).length == 0) {
                        if (userData.side == "left") {
                            if (intersects[0].uv.x >= 0.75)
                                z = userData.position.z - 0.5;
                        } else if (userData.side == "right") {
                            if (intersects[0].uv.x <= 0.25)
                                z = userData.position.z - 0.5;
                        } else {
                            z = userData.position.z;
                        }
                    }
                    //-------------------------------------------------
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

                    point.add(dir.clone().multiplyScalar(-0.01));

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

                    /*let portalPoints = [
                        new THREE.Vector3(x - 0.48, y - 0.98, z),
                        new THREE.Vector3(x + 0.48, y - 0.98, z),
                        new THREE.Vector3(x - 0.48, y + 0.98, z),
                        new THREE.Vector3(x + 0.48, y + 0.98, z)
                    ]*/

                    //console.log(portalPoints)

                    var ii;
                    if (button == 0)
                        ii = 1;
                    else if (button == 2) 
                        ii = 0;

                    if(GLOBALS.PORTAL_BOX[ii]){
                    for (let p of portalPoints) {
                        if (!validPortalPoint(p, normal, intersects[0].object, ii)) {
                            return;
                        }
                    }}

                    if (button == 0) { // left click

                        if (GLOBALS.PORTALS[1] === null) {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairOrange.png';
                        } else {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                            //if (point.distanceTo(GLOBALS.PORTALS[1].pos) < 2)
                            //    return;
                        }

                        // delete the old portal this new one is replacing
                        if (GLOBALS.PORTALS[0] !== null)
                            deletePortal(0);

                        newPortal(0, 1, point, normal, userData.body, playerUpDirection, portalPoints)

                        GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iColor.value = new THREE.Vector3(1.0, 0.25, 0.0);

                        if (GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha.value == 0.0) {
                            new TWEEN.Tween(GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }
                    } else if (button == 2) { // left click

                        if (GLOBALS.PORTALS[0] === null) {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBlue.png';
                        } else {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                            //if (point.distanceTo(GLOBALS.PORTALS[0].pos) < 2)
                            //    return;
                        }

                        // delete the old portal this new one is replacing
                        if (GLOBALS.PORTALS[1] !== null)
                            deletePortal(1);

                        newPortal(1, 0, point, normal, userData.body, playerUpDirection, userData.rotation)

                        GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iColor.value = new THREE.Vector3(0.0, 0.3, 1.0);

                        if (GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha.value == 0.0) {
                            new TWEEN.Tween(GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }
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
                }
            }

        }
    }
}

function validPortalPoint(point, normal, object,i) {

    var bb = new THREE.Box3(); // for re-use
    bb.setFromObject(GLOBALS.PORTAL_BOX[i]);

    if (bb.containsPoint(point)) {
        return false
    }else{
        return true
    }
}

// deletes the portal with index portalIndex from the scene
function deletePortal(portalIndex) {

    if (GLOBALS.PORTALS[portalIndex] === null)
        return;

    //GLOBALS.PORTALS[portalIndex].mesh.geometry.dispose();
    //GLOBALS.PORTALS[portalIndex].mesh.material.dispose();
    if (GLOBALS.PORTALS[portalIndex].hostObjects !== null) {
        // mark this object as collideable with portal 0 bb objects
        GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup &= ~GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[portalIndex]
        // add back to environment group only if collideable with both portal objects
        if (!(GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[0]) &&
            !(GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup & GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[1])) {
            GLOBALS.PORTALS[portalIndex].hostObjects.collisionFilterGroup |= GLOBALS.CGROUP_ENVIRONMENT
        }
    }
    GLOBALS.SCENE.remove(GLOBALS.PORTALS[portalIndex]);
    GLOBALS.PORTALS[portalIndex].portalShader.material.uniforms.iOpened.value = 0;
    GLOBALS.PORTALS[portalIndex] = null;
}

// creates a new portal and adds it to the scene
function newPortal(thisPortalIndex, otherPortalIndex, point, normal, hostObject, playerUpDirection, portalPoints) {

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

    GLOBALS.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup |= GLOBALS.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
    // remove this object from the environment group
    GLOBALS.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup &= ~GLOBALS.CGROUP_ENVIRONMENT

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
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

export {
    portalButton,
    deletePortal,
    newPortal
}