import * as THREE from 'three';
import {
    TWEEN
} from '../../Tween.js';
import {
    createLightBridgesFromPortal
} from '../lightBridges/LightBridges.js';
import {
    tweenCamera
} from '../../Main.js';
import {
    Portal
} from '../portal/Portal.js';
import * as CANNON from 'cannon';
import {
    MeshBVH
} from 'three-mesh-bvh';

window.gels = 0;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();


function portalButton(button) {

    if (window.FPS && (button == 2 || button == 0 || button == 1) && window.allowPlacePortals) {

        raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(window.instancedMesh);

        if (intersects.length > 0) {

            var userData = window.planeUserData[intersects[0].instanceId];

            //

            if (window.GUN_MODE == 2) {

                if (button == 1 && !window.INK_WHITE)
                    return;
                else if (button == 0 && !window.INK_ORANGE)
                    return;
                else if (button == 2 && !window.INK_BLUE)
                    return;

                var id;

                for (var i = 0; i < window.GELS.length; i++) {
                    if (!window.GELS[i]) {
                        window.GELS[i] = true;
                        id = i;
                        break;
                    }
                }

                var gel = new THREE.Object3D();
                gel.renderOrder = window.gels;
                window.gels++;
                gel.scale.set(1, 1, 1);
                gel.position.copy(intersects[0].point);

                //

                let PHYSICS_MATERIAL = new CANNON.Material();
                PHYSICS_MATERIAL.friction = 0.01; //0.01
                PHYSICS_MATERIAL.restitution = 0.1; //0.1

                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.01));

                var box = new CANNON.Body({
                    shape: shape,
                    mass: 0,
                    material: PHYSICS_MATERIAL
                })

                //

                if (userData.side == "down") {
                    gel.rotation.x = -Math.PI / 2;
                    box.up = new THREE.Vector3(0, 1, 0)
                    box.vel = new THREE.Vector3(1, 0, 1)
                } else if (userData.side == "up") {
                    gel.rotation.x = Math.PI / 2;
                    box.up = new THREE.Vector3(0, -1, 0)
                    box.vel = new THREE.Vector3(1, 0, 1)
                } else if (userData.side == "back") {
                    gel.rotation.y = Math.PI;
                    box.up = new THREE.Vector3(0, 0, -1)
                    box.vel = new THREE.Vector3(1, 1, 0)
                } else if (userData.side == "left") {
                    gel.rotation.y = Math.PI / 2;
                    box.up = new THREE.Vector3(1, 0, 0)
                    box.vel = new THREE.Vector3(0, 1, 1)
                } else if (userData.side == "right") {
                    gel.rotation.y = -Math.PI / 2;
                    box.up = new THREE.Vector3(-1, 0, 0)
                    box.vel = new THREE.Vector3(0, 1, 1)
                } else if (userData.side == "front") {
                    box.up = new THREE.Vector3(0, 0, 1)
                    box.vel = new THREE.Vector3(1, 1, 0)
                }

                gel.updateMatrix();
                window.instancedMeshGel.setMatrixAt(id, gel.matrix);

                if (button == 1)
                    window.instancedMeshGel.setColorAt(id, new THREE.Color(0xffffff));
                else if (button == 2)
                    window.instancedMeshGel.setColorAt(id, new THREE.Color(0x0000FF));
                else if (button == 0)
                    window.instancedMeshGel.setColorAt(id, new THREE.Color(0xFFA500));

                window.instancedMeshGel.instanceColor.needsUpdate = true;
                window.instancedMeshGel.instanceMatrix.needsUpdate = true;
                window.instancedMeshGel.computeBoundingSphere();

                box.position.copy(intersects[0].point);
                box.quaternion.copy(gel.quaternion)
                box.collisionFilterGroup = window.CGROUP_DYNAMIC
                box.collisionFilterMask = window.CGROUP_ALL
                box.linearDamping = 0.01;

                if (button == 1) {
                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 1.0, 1.0);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }
                    box.name = "gel-white";
                } else if (button == 0) {
                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 1.0, 0.5);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }
                    box.name = "gel-orange";
                } else if (button == 2) {
                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.0, 0.0, 1.0);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }
                    box.name = "gel-blue";

                    // When a body collides with another body, they both dispatch the "collide" event.
                    box.addEventListener('collide', (event) => {

                        if (!event.body.gelJumping) {

                            var relativeVelocity = event.contact.getImpactVelocityAlongNormal();
                            event.body.gelJumping = true;

                            var holder = event.body;

                            setTimeout(() => {
                                holder.gelJumping = false;
                            }, 10);

                            console.log(event.target.up)
                            console.log(relativeVelocity)


                            //shouldJump = true;
                            //window.PLAYER.inJump = true
                            event.body.velocity.set(event.body.velocity.x * event.target.vel.x,
                                event.body.velocity.y * event.target.vel.y,
                                event.body.velocity.z * event.target.vel.z);
                            event.body.applyImpulse(event.target.up.clone().multiplyScalar(8 * event.body.mass * Math.abs((relativeVelocity * 0.045) + 1)), event.body.position)
                        }
                    })
                }

                window.CANNON_WORLD.addBody(box);

                window.PLAYER.addEventListener('collide', (event) => {
                    if (event.body.name == "gel-orange") {
                        window.gelOrange = true;
                    } else {
                        window.gelOrange = false;
                    }
                })

            } else if (window.GUN_MODE == 1) {

                if (userData.portal) {

                    var obj = intersects[0].object;
                    var target = new THREE.Vector3(); // create once an reuse it
                    intersects[0].object.getWorldPosition(target);
                    window.wallName = userData.name;

                    var direction = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
                    var offsetVector = new THREE.Vector3(0.0 * direction.x, 0.0 * direction.y, 0.0 * direction.z);

                    var x = intersects[0].point.x + offsetVector.x;
                    var y = intersects[0].point.y + offsetVector.y;
                    var z = intersects[0].point.z + offsetVector.z;

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
                        playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)
                        normal = new THREE.Vector3(0, -1, 0)
                    } else if (userData.side == "down") {
                        playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)
                        normal = new THREE.Vector3(0, 1, 0)
                    }

                    var pLocal = new THREE.Vector3(0, 0, -1);
                    var pWorld = pLocal.applyMatrix4(window.MAIN_CAMERA.matrixWorld);
                    var dir = pWorld.sub(window.MAIN_CAMERA.position).normalize();

                    point.add(dir.clone().multiplyScalar(-0.01));

                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    //const objectMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld)
                    //const normal = intersects[0].face.normal.clone().applyMatrix3(objectMatrix).normalize()
                    const depthDir = playerUpDirection.clone().projectOnPlane(normal).normalize()
                    const widthDir = depthDir.clone().cross(normal)
                    const portal_width = window.PORTAL_WIDTH
                    const portal_depth = window.PORTAL_DEPTH

                    let EPS = window.PORTAL_EPS * 3;
                    let portalPoints = [point.clone().add(depthDir.clone().multiplyScalar(portal_depth / 2 + EPS).add(widthDir.clone().multiplyScalar(portal_width / 2 + EPS))),
                        point.clone().add(depthDir.clone().multiplyScalar(-portal_depth / 2 - EPS).add(widthDir.clone().multiplyScalar(portal_width / 2 + EPS))),
                        point.clone().add(depthDir.clone().multiplyScalar(-portal_depth / 2 - EPS).add(widthDir.clone().multiplyScalar(-portal_width / 2 - EPS))),
                        point.clone().add(depthDir.clone().multiplyScalar(portal_depth / 2 + EPS).add(widthDir.clone().multiplyScalar(-portal_width / 2 - EPS)))
                    ]

                    if (button == 0) { // left click

                        if (window.PORTALS[1] === null) {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairOrange.png';
                        } else {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                            if (point.distanceTo(window.PORTALS[1].pos) < 1)
                                return;
                        }

                        // delete the old portal this new one is replacing
                        if (window.PORTALS[0] !== null)
                            deletePortal(0);

                        newPortal(0, 1, point, normal, userData.body, playerUpDirection, portalPoints)

                        window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 0.25, 0.0);
                        if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                            new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }
                    } else if (button == 2) { // left click

                        if (window.PORTALS[0] === null) {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBlue.png';
                        } else {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                            if (point.distanceTo(window.PORTALS[0].pos) < 1)
                                return;
                        }

                        // delete the old portal this new one is replacing
                        if (window.PORTALS[1] !== null) {
                            deletePortal(1);
                        }

                        newPortal(1, 0, point, normal, userData.body, playerUpDirection, userData.rotation)

                        window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.0, 0.3, 1.0);
                        if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                            new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }
                    }

                    setTimeout(() => {
                        if (button == 0) {
                            createLightBridgesFromPortal(1, window.raycastLightBridge);
                            createLightBridgesFromPortal(1, window.raycastTractorBeam);
                            createLightBridgesFromPortal(1, window.raycastLaserEmitter);
                        } else if (button == 2) {
                            createLightBridgesFromPortal(0, window.raycastLightBridge);
                            createLightBridgesFromPortal(0, window.raycastTractorBeam);
                            createLightBridgesFromPortal(0, window.raycastLaserEmitter);
                        }
                    }, 300);
                } else {
                    //NONPORTABLE WALL
                }
            }
        }
    }
}

// deletes the portal with index portalIndex from the scene
function deletePortal(portalIndex) {

    if (window.PORTALS[portalIndex] === null) {
        return;
    }

    window.PORTALS[portalIndex].mesh.geometry.dispose();
    window.PORTALS[portalIndex].mesh.material.dispose();
    if (window.PORTALS[portalIndex].hostObjects !== null) {
        // mark this object as collideable with portal 0 bb objects
        window.PORTALS[portalIndex].hostObjects.collisionFilterGroup &= ~window.CGROUP_PORTAL_HOST_CDISABLE[portalIndex]
        // add back to environment group only if collideable with both portal objects
        if (!(window.PORTALS[portalIndex].hostObjects.collisionFilterGroup & window.CGROUP_PORTAL_HOST_CDISABLE[0]) &&
            !(window.PORTALS[portalIndex].hostObjects.collisionFilterGroup & window.CGROUP_PORTAL_HOST_CDISABLE[1])) {
            window.PORTALS[portalIndex].hostObjects.collisionFilterGroup |= window.CGROUP_ENVIRONMENT
        }
    }
    window.MAIN_SCENE.remove(window.PORTALS[portalIndex]);
    window.PORTALS[portalIndex] = null
}

// creates a new portal and adds it to the scene
function newPortal(thisPortalIndex, otherPortalIndex, point, normal, hostObject, playerUpDirection, portalPoints) {
    let color = window.PORTAL_COLORS[thisPortalIndex]

    window.PORTALS[thisPortalIndex] = new Portal(
        point,
        normal, // normal of surface
        playerUpDirection,
        window.PORTALS[otherPortalIndex],
        hostObject,
        color,
        thisPortalIndex,
        portalPoints)
    window.PORTALS[thisPortalIndex].mesh.scale.set(0, 0, 0);
    window.PORTALS[thisPortalIndex].portalShader.scale.set(0, 0, 0);

    // Build the BVH
    window.PORTALS[thisPortalIndex].bvh = new MeshBVH(window.PORTALS[thisPortalIndex].mesh.geometry);

    console.log(window.PORTALS[thisPortalIndex].bvh)

    window.PORTALS[thisPortalIndex].hostObjects.portal = true;

    window.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup |= window.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
    // remove this object from the environment group
    window.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup &= ~window.CGROUP_ENVIRONMENT

    if (window.PORTALS[otherPortalIndex] !== null)
        window.PORTALS[otherPortalIndex].output = window.PORTALS[thisPortalIndex]

    window.MAIN_SCENE.add(window.PORTALS[thisPortalIndex])
    tweenCamera(300, window.PORTALS[thisPortalIndex].mesh.scale, new THREE.Vector3(0.5, 1, 1))
    tweenCamera(300, window.PORTALS[thisPortalIndex].portalShader.scale, new THREE.Vector3(0.5, 1, 1))

    if (window.PORTALS[otherPortalIndex] !== null)
        window.PORTALS[otherPortalIndex].output = window.PORTALS[thisPortalIndex]

    if (window.PORTALS[0] !== null && window.PORTALS[1] !== null) {
        window.PORTALS[0].portalShader.material = window.materialLeftOpened
        window.PORTALS[1].portalShader.material = window.materialRightOpened
    }

    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(window.MAIN_CAMERA.matrixWorld);
    var dir = pWorld.sub(window.MAIN_CAMERA.position).normalize();
    //window.PORTALS[thisPortalIndex].position.add(dir.clone().multiplyScalar(-0.2));
}

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

export {
    portalButton,
    deletePortal
}