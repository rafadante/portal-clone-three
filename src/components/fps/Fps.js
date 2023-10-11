import * as THREE from '../../build/three.module.js';
import {
    TWEEN
} from '../../jsm/Tween.js';
import {
    PointerLockControls
} from '../../jsm/controls/PointerLockControls.js';
import {
    Portal
} from '../portal/Portal.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import nipplejs from 'nipplejs';
import {
    DeviceOrientationControls
} from '../../jsm/controls/DeviceOrientationControls.js';

// MOBILE VARIABLES

let fwdValue = 0;
let bkdValue = 0;
let rgtValue = 0;
let lftValue = 0;

if (window.mobile) {
    var controlsDevice = new DeviceOrientationControls(window.MAIN_CAMERA);
    var targetRotationX = 0;
    var targetRotationOnMouseDownX = 0;
    var targetRotationY = 0;
    var targetRotationOnMouseDownY = 0;
    var mouseX = 0;
    var mouseXOnMouseDown = 0;
    var mouseY = 0;
    var mouseYOnMouseDown = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var finalRotationY, outOfAngle = false;
    var info = false;

    var blocked_bottom = false,
        blocked_top = false;

    var deltaX2, touchX2;
    var vec = [],
        offsetX = 0;

    document.getElementById("camera").addEventListener('touchstart', onDocumentTouchStart, false);
    document.getElementById("camera").addEventListener('touchmove', onDocumentTouchMove, false);
    document.getElementById("camera").addEventListener('touchup', onDocumentTouchUp, false);

    var touches = 0;

    function onDocumentTouchUp(event) {
        //event.preventDefault();
        touches = 0;
    }

    function onDocumentTouchStart(event) {
        //for (var i = 0; i < event.touches.length; i++) {

        //event.preventDefault();
        if (event.touches.length > 0) {
            touches = event.touches.length - 1;

            if (touches == 0 || touches == 1) {
                mouseXOnMouseDown = event.touches[touches].pageX - windowHalfX;
                targetRotationOnMouseDownX = targetRotationX;

                mouseYOnMouseDown = event.touches[touches].pageY - windowHalfY;
                targetRotationOnMouseDownY = targetRotationY;
            }

        }

        //}
    }

    function onDocumentTouchMove(event) {
        //event.preventDefault();
        if (event.touches.length > 0 && (touches == 0 || touches == 1)) {
            mouseX = event.touches[touches].pageX - windowHalfX;
            targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * (-0.01); //camera speed

            mouseY = event.touches[touches].pageY - windowHalfY;
            deltaX2 = event.touches[touches].pageY - touchX2;
            touchX2 = event.touches[touches].pageY;

            if (deltaX2 > 0) {
                if (!blocked_bottom) {
                    targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
                }
            } else {
                if (!blocked_top) {
                    targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
                }
            }
        }
        //for (var i = 0; i < event.touches.length; i++) {

        //}
    }

    // vars
    let joyManager, joyManager2;

    addJoystick();

    function addJoystick() {
        const options = {
            zone: document.getElementById('joystickWrapper1'),
            size: 120,
            multitouch: true,
            maxNumberOfNipples: 2,
            mode: 'static',
            restJoystick: true,
            shape: 'circle',
            // position: { top: 20, left: 20 },
            position: {
                top: '60px',
                left: '60px'
            },
            dynamicPage: true,
        }

        joyManager = nipplejs.create(options);

        joyManager['0'].on('move', function (evt, data) {

            const forward = data.vector.y
            const turn = data.vector.x

            if (forward > 0) {
                fwdValue = Math.abs(forward)
                bkdValue = 0
            } else if (forward < 0) {
                fwdValue = 0
                bkdValue = Math.abs(forward)
            }

            if (turn > 0) {
                lftValue = 0
                rgtValue = Math.abs(turn)
            } else if (turn < 0) {
                lftValue = Math.abs(turn)
                rgtValue = 0
            }

            headBobActive = true;
        })

        joyManager['0'].on('end', function (evt) {
            bkdValue = 0
            fwdValue = 0
            lftValue = 0
            rgtValue = 0
            // headBobActive = false;
            repositioningGUn = true;
            moving = false;
            headBobTimer = 0;
            //headBobActive = false;

            tweenCamera(500, window.GUN.children[0].position, new THREE.Vector3(0, 0, 0))
            setTimeout(() => {
                //repositioningGUn = false;
            }, 100);

            touches = 0;
        })
    }
}

//

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();
var crouched = false;
var moving = false;

//
var wasInJump = false;
var slipperyMaterial = new CANNON.Material();
slipperyMaterial.friction = 0.00;
window.dynamicObjects = [];

player();

if (!window.mobile)
    controlsLock();
// added joystick + movement



function player() {
    // define shape
    let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5 / 2, 2 / 2.3, 0.5 / 2));
    // let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 0.5)); 

    // define the physical body attributes
    window.PLAYER = new CANNON.Body({
        mass: 50,
        material: slipperyMaterial
    });
    window.PLAYER.allowSleep = false;
    window.PLAYER.addShape(physicsShape);
    window.PLAYER.position.set(5, 5, 5);
    window.PLAYER.linearDamping = 0.9;

    // keep the player upright
    window.PLAYER.angularDamping = 1

    // set additional properties
    window.PLAYER.inJump = true

    // construct the physical body
    window.PLAYER.updateMassProperties()
    window.CANNON_WORLD.addBody(window.PLAYER);

    // normal collision events don't happen consistently - will stop once an object is stable on the ground
    // so need to check contacts to detect if grounded or not
    // https://github.com/schteppe/cannon.js/issues/313

    let upVector = new CANNON.Vec3(0, 1, 0);
    let contactNormal = new CANNON.Vec3(0, 0, 0);

    window.CANNON_WORLD.addEventListener("postStep", (e) => {
        window.PLAYER.inJump = true;
        if (window.CANNON_WORLD.contacts.length > 0) {
            for (let contact of window.CANNON_WORLD.contacts) {
                if (contact.bi.id == window.PLAYER.id || contact.bj.id == window.PLAYER.id) {
                    if (contact.bi.id == window.PLAYER.id) {
                        // contact.ni.negate(contactNormal);
                        contactNormal = new THREE.Vector3(contact.ni.x * -1, contact.ni.y * -1, contact.ni.z * -1)
                    } else {
                        // contact.ni.copy(contactNormal);
                        contactNormal = contact.ni
                    }

                    window.PLAYER.inJump = (contactNormal.dot(upVector) <= 0.5);
                }
            }
        }
    })

    window.dynamicObjects.push(window.PLAYER);

    for (let d of window.dynamicObjects) {
        d.collisionFilterGroup = window.CGROUP_DYNAMIC
        d.collisionFilterMask = window.CGROUP_ALL
    }
}

var controller = {
    "KeyE": {
        pressed: false
    },
    "KeyW": {
        pressed: false
    },
    "KeyS": {
        pressed: false
    },
    "KeyA": {
        pressed: false
    },
    "KeyD": {
        pressed: false
    },
    "Space": {
        pressed: false
    },
}

var itemHolder = null;

document.addEventListener('keydown', (event) => {

    if (event.code == "ControlLeft" && !crouched) {

        //console.log(window.RENDERER.info.render.calls)

    }

    if (window.FPS && allowEnterFPS) {
        if (controller[event.code]) {
            controller[event.code].pressed = true;
        }
        headBobActive = true;

        if (event.code == "ControlLeft" && !crouched) {

            crouched = true;

            window.PLAYER.shapes[0].halfExtents.y -= 0.25;
            window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
            window.PLAYER.computeAABB();
            window.PLAYER.updateMassProperties();

        }

        if (event.code == "KeyE") {

            raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
            var intersects = raycaster2.intersectObjects(window.INTERACTIVE);

            console.log(intersects)

            if (window.HOLDING_ITEM) {
                window.HOLDING_ITEM = false;

                // Position
                itemHolder.position.setZero();
                itemHolder.previousPosition.setZero();
                itemHolder.interpolatedPosition.setZero();
                itemHolder.initPosition.setZero();

                // orientation
                itemHolder.quaternion.set(0, 0, 0, 1);
                itemHolder.initQuaternion.set(0, 0, 0, 1);
                //body.previousQuaternion.set(0, 0, 0, 1);
                itemHolder.interpolatedQuaternion.set(0, 0, 0, 1);

                // Velocity
                itemHolder.velocity.setZero();
                itemHolder.initVelocity.setZero();
                itemHolder.angularVelocity.setZero();
                itemHolder.initAngularVelocity.setZero();

                // Force
                itemHolder.force.setZero();
                itemHolder.torque.setZero();

                // Sleep state reset
                itemHolder.sleepState = 0;
                itemHolder.timeLastSleepy = 0;
                itemHolder._wakeUpAfterNarrowphase = false;

                //itemHolder.velocity.set(0, 0, 0);
                //itemHolder.angularVelocity.set(0, 0, 0);
                itemHolder.position.copy(window.CURRENT_ITEM.position);
                itemHolder.quaternion.copy(window.CURRENT_ITEM.quaternion);

                window.PLAYER.velocity.set(0, 0, 0);
                window.PLAYER.angularVelocity.set(0, 0, 0);

                window.CANNON_WORLD.addBody(itemHolder);

                window.CURRENT_ITEM = null;
                window.CURRENT_ITEM_ID = null;
                itemHolder = null;
                window.COL_Z = false;
                window.holder.position.z = -1;
            } else if (intersects.length > 0) {
                if (intersects[0].distance < 2) {
                    window.HOLDING_ITEM = true;
                    //window.CURRENT_ITEM = intersects[0].object.parent;

                    //window.CURRENT_ITEM.item = intersects[0].object;
                    //window.CURRENT_ITEM.mass = 0;

                    var instancedId = intersects[0].instanceId;

                    window.CURRENT_ITEM = window.PORTAL_CUBES[instancedId];

                    window.CURRENT_ITEM_ID = instancedId;


                    itemHolder = window.PORTAL_CUBES[instancedId].body;
                    window.CANNON_WORLD.removeBody(window.PORTAL_CUBES[instancedId].body);
                }
            }

            window.lightningStrikeMesh.visible = window.HOLDING_ITEM;
            window.lightningStrikeMesh2.visible = window.HOLDING_ITEM;
            window.lightningStrikeMesh3.visible = window.HOLDING_ITEM;
        }
    }
});

var allowPlacePortals = false;

//
var allowEnterFPS = true;
var openedDoor = false;

//MENU
$("body").on('click', '#close', function () {
    $("#blocker").css("display", "block");
    //$("#mobile-controls").css("display", "none");
    $("#container").css("filter", "blur(2px)");
    //window.paused = true;
    //openFullscreen();
})


$("body").on('click', '#settings-close', function () {
    if (window.FPS && allowEnterFPS) {

        window.paused = false;

        if (!window.mobile) {
            document.body.requestPointerLock();
        } else {
            $("#blocker").css("display", "none");
            $("#mobile-controls").css("display", "block");
            openFullscreen();
        }


        mouseTime = performance.now();
        //

        $("#container").css("filter", "none");

        if (!openedDoor) {
            openedDoor = true;

            setTimeout(() => {

                tweenCamera(500, window.enter_door_right_spinner.rotation, new THREE.Vector3(Math.PI,
                    window.enter_door_right_spinner.rotation.y,
                    window.enter_door_right_spinner.rotation.z))

                tweenCamera(500, window.enter_door_left_spinner.rotation, new THREE.Vector3(Math.PI,
                    window.enter_door_left_spinner.rotation.y,
                    window.enter_door_left_spinner.rotation.z))

                setTimeout(() => {
                    window.enter_door_right.position.z = -4;
                    tweenCamera(1000, window.enter_door_right.position, new THREE.Vector3(25, window.enter_door_right.position.y, window.enter_door_right.position.z))

                    window.enter_door_left.position.z = -4;
                    tweenCamera(1000, window.enter_door_left.position, new THREE.Vector3(-25, window.enter_door_left.position.y, window.enter_door_left.position.z))
                }, 500);

            }, 1000);
        }
    }
})

function openFullscreen() {
    if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
    } else if (document.body.mozRequestFullScreen) {
        /* Firefox */
        document.body.mozRequestFullScreen();
    } else if (document.body.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        document.body.webkitRequestFullscreen();
    } else if (document.body.msRequestFullscreen) {
        /* IE/Edge */
        document.body.msRequestFullscreen();
    }
}

function controlsLock() {
    window.PointerControls = new PointerLockControls(window.MAIN_CAMERA, document.body);
    window.PointerControls.pointerSpeed = 0.5;

    window.PointerControls.addEventListener('lock', function () {

        document.getElementById('blocker').style.display = 'none';

        setTimeout(() => {
            allowPlacePortals = true;
        }, 1000);

    });

    window.PointerControls.addEventListener('unlock', function () {

        $("#container").css("filter", "blur(2px)")
        document.getElementById('blocker').style.display = 'block';
        allowPlacePortals = false;
        allowEnterFPS = false;

        setTimeout(() => {
            allowEnterFPS = true;
        }, 1500);
    });
}

document.addEventListener('keyup', (event) => {

    if (window.FPS && allowEnterFPS) {

        if (controller[event.code]) {
            controller[event.code].pressed = false;
        }

        repositioningGUn = true;
        moving = false;
        headBobTimer = 0;
        //headBobActive = false;

        tweenCamera(500, window.GUN.children[0].position, new THREE.Vector3(0, 0, 0))


        setTimeout(() => {
            //repositioningGUn = false;
        }, 100);

        if (crouched) {

            crouched = false;

            /*tweenCamera(250, window.PLAYER_COLLIDER.end, new THREE.Vector3(
                window.PLAYER_COLLIDER.end.x,
                window.PLAYER_COLLIDER.end.y + 0.5,
                window.PLAYER_COLLIDER.end.z))*/

            window.PLAYER.shapes[0].halfExtents.y += 0.25;
            window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
            window.PLAYER.computeAABB();
            window.PLAYER.updateMassProperties();

        }
    }
});

$("body").on('pointerdown', '#crouch', function () {
    crouched = true;
    window.PLAYER.shapes[0].halfExtents.y -= 0.25;
    window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    window.PLAYER.computeAABB();
    window.PLAYER.updateMassProperties();
})

$("body").on('pointerup', '#crouch', function () {
    window.PLAYER.shapes[0].halfExtents.y += 0.25;
    window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    window.PLAYER.computeAABB();
    window.PLAYER.updateMassProperties();
})

document.addEventListener('mousedown', (event) => {

    if (!window.mobile && document.pointerLockElement !== null)
        portalButton(event.button)

});

//LEFT PORTAL MOBILE
document.getElementById("portal_l").addEventListener('pointerdown', portal_l_Touch, false);

function portal_l_Touch() {
    allowPlacePortals = true;
    portalButton(0);
}
//RIGHT PORTAL MOBILE
document.getElementById("portal_r").addEventListener('pointerdown', portal_r_Touch, false);

function portal_r_Touch() {
    allowPlacePortals = true;
    portalButton(2)
}
//JUMP MOBILE
document.getElementById("jump").addEventListener('pointerdown', jumpTouch, false);

function jumpTouch() {
    // handle jumping when space bar is pressed
    if (!window.PLAYER.inJump) {
        shouldJump = true;
        //if (!window.IN_VICTORY) {hideInstructions()}
    }
}

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

function portalButton(button) {
    var id = 0,
        id2 = 1;

    if (button == 2) {
        id = 1;
        id2 = 0;
    }

    if (window.FPS && (button == 2 || button == 0) && allowPlacePortals) {
        //if (document.pointerLockElement !== null) {
        // define playerUpDirection
        //let playerUpDirection = new THREE.Vector3(0, 1, 0)
        //playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)

        //var ray_direction = new THREE.Vector3();
        //var ray = new THREE.Raycaster(); // create once and reuse

        //window.PointerControls.getDirection(ray_direction);
        //ray.set(window.PointerControls.getObject().position, ray_direction);

        raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(window.instancedMesh);

        //console.log(intersects)

        if (intersects.length > 0) {

            var userData = window.planeUserData[intersects[0].instanceId];

            //console.log(intersects[0].uv)

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
                    //playerUpDirection = new THREE.Vector3(0, 0, 1)
                    playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)
                    normal = new THREE.Vector3(0, -1, 0)
                } else if (userData.side == "down") {
                    //playerUpDirection = new THREE.Vector3(0, 0, 1)
                    playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)
                    normal = new THREE.Vector3(0, 1, 0)
                }

                var pLocal = new THREE.Vector3(0, 0, -1);
                var pWorld = pLocal.applyMatrix4(window.MAIN_CAMERA.matrixWorld);
                var dir = pWorld.sub(window.MAIN_CAMERA.position).normalize();

                point.add(dir.clone().multiplyScalar(-0.01));

                //
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

                        //console.log(point.distanceTo(window.PORTALS[1].pos))
                        //console.log(point)
                        //console.log(window.PORTALS[0])
                        //console.log(window.PORTALS[1])
                        if (point.distanceTo(window.PORTALS[1].pos) < 1) {
                            return;
                        }
                    }

                    // delete the old portal this new one is replacing
                    if (window.PORTALS[0] !== null) {
                        deletePortal(0);
                    }

                    createPortal(0, 1, point, normal, userData.body, playerUpDirection, portalPoints)

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

                        if (point.distanceTo(window.PORTALS[0].pos) < 1) {
                            return;
                        }
                    }

                    // delete the old portal this new one is replacing
                    if (window.PORTALS[1] !== null) {
                        deletePortal(1);
                    }

                    createPortal(1, 0, point, normal, userData.body, playerUpDirection, userData.rotation)

                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.0, 0.3, 1.0);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }

                }
            } else {
                //intersects[0].object.visible = false;
            }

        }
    }
}

function validPortalPoint(point, normal, object) {


    // check that no intersectable objects are directly in front of point
    let frontPoint = point.clone().add(normal.clone().multiplyScalar(1))
    const raycaster = new THREE.Raycaster(frontPoint, normal.clone().multiplyScalar(-1), 0, 2000);
    let intersects = raycaster.intersectObject(this.intersectObjects);

    // if there is no intersect or if there is another object in the way, then return false
    if (intersects.length == 0 || intersects[0].object != object) {
        return false
    }

    // have to also check if there is another face occupying the same space. The distance between the first and second intersects will be negligible
    // but the objects will be different.
    if (intersects.length > 1 && Math.abs(intersects[0].distance - intersects[1].distance) < 0.001 && intersects[1].object != object) {
        return false
    }

    return true
}

// deletes the portal with index portalIndex from the scene
function deletePortal(portalIndex) {
    /*window.PORTALS[portalIndex].mesh.geometry.dispose();
    window.PORTALS[portalIndex].mesh.material.dispose();
    window.MAIN_SCENE.remove(window.PORTALS[portalIndex]);
    window.PORTALS[portalIndex] = null;*/


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
function createPortal(thisPortalIndex, otherPortalIndex, point, normal, hostObject, playerUpDirection, portalPoints) {
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

    window.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup |= window.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
    // remove this object from the environment group
    window.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup &= ~window.CGROUP_ENVIRONMENT
    if (window.PORTALS[otherPortalIndex] !== null) {
        window.PORTALS[otherPortalIndex].output = window.PORTALS[thisPortalIndex]
    }

    //window.PORTALS[thisPortalIndex].children[0].rotation.copy(rotation);
    //window.PORTALS[thisPortalIndex].children[1].rotation.copy(rotation);
    //window.PORTALS[thisPortalIndex].rotation.copy(rotation);
    //window.PORTALS[thisPortalIndex].children[1].rotation.x = -Math.PI/2;
    //window.PORTALS[thisPortalIndex].position.copy(point);

    //window.PORTALS[thisPortalIndex].rotation.z = Math.PI/2;
    //window.PORTALS[thisPortalIndex].position.copy(point);

    window.MAIN_SCENE.add(window.PORTALS[thisPortalIndex])
    tweenCamera(300, window.PORTALS[thisPortalIndex].mesh.scale, new THREE.Vector3(0.5, 1, 1))
    tweenCamera(300, window.PORTALS[thisPortalIndex].portalShader.scale, new THREE.Vector3(0.5, 1, 1))

    if (window.PORTALS[otherPortalIndex] !== null) {
        window.PORTALS[otherPortalIndex].output = window.PORTALS[thisPortalIndex]
    }

    if (window.PORTALS[0] !== null && window.PORTALS[1] !== null) {
        window.PORTALS[0].portalShader.material = window.materialLeftOpened
        window.PORTALS[1].portalShader.material = window.materialRightOpened
    }

    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(window.MAIN_CAMERA.matrixWorld);
    var dir = pWorld.sub(window.MAIN_CAMERA.position).normalize();

    //window.PORTALS[thisPortalIndex].position.add(dir.clone().multiplyScalar(-0.02));
}

document.body.addEventListener('mousemove', (event) => { //rafa
    if (window.FPS) {
        //if (document.pointerLockElement === document.body) {
        //window.MAIN_CAMERA.rotation.y -= event.movementX / 1000;
        //window.MAIN_CAMERA.rotation.x -= event.movementY / 1000;
        //}
    }
});

let shouldJump = false;
window.rotationMobile = 0.1;

const updatePlayer = function (deltaTime) {

    raycast();

    var velocity = 1100;

    if (window.mobile) {
        //
        velocity = 900;
        //if (fwdValue == 0 && bkdValue == 0 && rgtValue == 0 && lftValue == 0) {
        //horizontal rotation

        //if (targetRotationX > 0.8) {
        //targetRotationX += 0.1;
        //   window.MAIN_CAMERA.rotation.y += (targetRotationX - window.MAIN_CAMERA.rotation.y) * 0.1;
        //} else if (targetRotationX < -0.8) {
        //targetRotationX -= 0.1;
        //    window.MAIN_CAMERA.rotation.y += (targetRotationX - window.MAIN_CAMERA.rotation.y) * 0.1;
        //} else {
        window.MAIN_CAMERA.rotation.y += (targetRotationX - window.MAIN_CAMERA.rotation.y) * window.rotationMobile;
        //}


        //vertical rotation 
        finalRotationY = (targetRotationY - window.MAIN_CAMERA.rotation.x);
        if (window.MAIN_CAMERA.rotation.x <= 1 && window.MAIN_CAMERA.rotation.x >= -1) {
            window.MAIN_CAMERA.rotation.x += finalRotationY * window.rotationMobile;
            //camera.rotation.x += (targetRotationY - camera.rotation.x) * 0.1;
        }

        if (window.MAIN_CAMERA.rotation.x > 1) {
            blocked_top = true;
            window.MAIN_CAMERA.rotation.x = 1
        } else
            blocked_top = false;

        if (window.MAIN_CAMERA.rotation.x < -1) {
            blocked_bottom = true;
            window.MAIN_CAMERA.rotation.x = -1
        } else
            blocked_bottom = false;


        if (window.gyro) {
            controlsDevice.update();
            window.MAIN_CAMERA.rotation.z = 0
        }

    }

    // gives a bit of air control
    // define directions
    let cameraDirection = new THREE.Vector3()
    window.MAIN_CAMERA.getWorldDirection(cameraDirection)
    const up = new THREE.Vector3(0, 1, 0)
    const forward = cameraDirection.projectOnPlane(up).normalize()
    const backward = forward.clone().negate()
    const left = up.clone().cross(forward).normalize()
    const right = left.clone().negate()

    // physics changes while jumping
    let jumpMultiplier = 1
    if (window.PLAYER.inJump) {
        jumpMultiplier = 0.05
    }

    if (!window.PLAYER.inJump) {
        window.PLAYER.linearDamping = 0.999
    } else {
        window.PLAYER.linearDamping = 0.01
    }

    // regulates speed when multiple directions are pressed 
    //let movementDirections = controller["KeyW"].pressed + controller["KeyS"].pressed + controller["KeyA"].pressed + controller["KeyD"].pressed;
    let movementDirections = fwdValue + bkdValue + lftValue + rgtValue;
    let movementMultiplier = 1
    if (movementDirections == 2) {
        movementMultiplier = (1 / Math.sqrt(movementDirections))
    }

    // apply forces in WASD directions when pressed
    const f = velocity * window.PLAYER.mass * jumpMultiplier * deltaTime;

    // if (this.controller["KeyW"].pressed || this.controller["KeyA"].pressed || this.controller["KeyS"].pressed || this.controller["KeyD"].pressed) { 
    //     if (this.counter % 30 == 0 && !this.window.PLAYER.inJump) {
    //         this.playWalkingSound()
    //     }
    // }

    if (window.qwe) {
        //window.qwe.applyImpulse(forward.clone().multiplyScalar(1), window.qwe.position)
    }

    if (window.mobile) {

        if (fwdValue > 0) {
            window.PLAYER.applyForce(forward.clone().multiplyScalar(f * fwdValue), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }

        if (bkdValue > 0) {
            window.PLAYER.applyForce(backward.clone().multiplyScalar(f * bkdValue), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }

        if (lftValue > 0) {
            window.PLAYER.applyForce(left.clone().multiplyScalar(f * lftValue), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }

        if (rgtValue > 0) {
            window.PLAYER.applyForce(right.clone().multiplyScalar(f * rgtValue), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }

        // update lastTimeStampInJump
        wasInJump = window.PLAYER.inJump;

        if (shouldJump) {
            window.PLAYER.inJump = true
            window.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.25), window.PLAYER.position)
        }

        shouldJump = false;

    } else {
        var gamepad;
        if (controllerIndex !== null) {
            gamepad = navigator.getGamepads()[controllerIndex];
            //handleButtons(gamepad.buttons);
            //handleSticks(gamepad.axes);

            if (gamepad.buttons[6].value > 0) {

                portalButton(0);

                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: 200,
                    weakMagnitude: 1.0,
                    strongMagnitude: 1.0,
                });
            }

            if (gamepad.buttons[7].value > 0) {

                portalButton(2);

                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: 200,
                    weakMagnitude: 1.0,
                    strongMagnitude: 1.0,
                });
            }

            if (gamepad.axes[2] > 0.5) {
                window.MAIN_CAMERA.rotation.y -= 0.05;
            }

            if (gamepad.axes[2] < -0.5) {
                window.MAIN_CAMERA.rotation.y += 0.05;
            }

            if (gamepad.axes[3] < -0.5) {
                window.MAIN_CAMERA.rotation.x += 0.025;
            }

            if (gamepad.axes[3] > 0.5) {
                window.MAIN_CAMERA.rotation.x -= 0.025;
            }

            //
            var gamepadPressed = 0;

            if (gamepad.axes[1] < -0.5) {
                window.PLAYER.applyForce(forward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                //if (!window.IN_VICTORY) {hideInstructions()}
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepad.axes[1] > 0.5) {
                window.PLAYER.applyForce(backward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                //if (!window.IN_VICTORY) {hideInstructions()}
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepad.axes[0] < -0.5) {
                window.PLAYER.applyForce(left.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                //if (!window.IN_VICTORY) {hideInstructions()}
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepad.axes[0] > 0.5) {
                window.PLAYER.applyForce(right.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                //if (!window.IN_VICTORY) {hideInstructions()}
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepadPressed == 0) {
                moving = false;
                headBobActive = false;
            }

        }

        if (controller["KeyW"].pressed && !window.COL_Z) {
            window.PLAYER.applyForce(forward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }
        if (controller["KeyS"].pressed) {
            window.PLAYER.applyForce(backward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }
        if (controller["KeyA"].pressed) {
            window.PLAYER.applyForce(left.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }
        if (controller["KeyD"].pressed) {
            window.PLAYER.applyForce(right.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            //if (!window.IN_VICTORY) {hideInstructions()}
            moving = true;
        }

        shouldJump = false;
        // handle jumping when space bar is pressed

        if (controllerIndex !== null) {
            if (gamepad.buttons[0].value > 0 && !window.PLAYER.inJump) {
                shouldJump = true;
                //if (!window.IN_VICTORY) {hideInstructions()}
            }
        } else if (controller["Space"].pressed && !window.PLAYER.inJump) {
            shouldJump = true;
            //if (!window.IN_VICTORY) {hideInstructions()}
        }
        // update lastTimeStampInJump
        wasInJump = window.PLAYER.inJump;

        if (shouldJump) {
            window.PLAYER.inJump = true
            window.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.11), window.PLAYER.position)
        }
    }

    // always look where the camera points
    window.PLAYER.quaternion.copy(window.MAIN_CAMERA.quaternion)
    window.PLAYER.quaternion.x = 0
    window.PLAYER.quaternion.z = 0
    window.PLAYER.quaternion.normalize()

    // set camera position to be at player
    window.MAIN_CAMERA.position.copy(window.PLAYER.position)
    window.GUN.position.copy(window.MAIN_CAMERA.position);

    if (moving) {
        // window.GUN.translateX(Math.sin(headBobTimer * headBobSpeed) * headBobHeight)
        window.GUN.children[0].position.x += Math.sin(headBobTimer * headBobSpeed) * headBobHeight;
    }

    //smoothness = 0.1; // 0 to 1 only
    const targetPosition = window.MAIN_CAMERA.quaternion.clone();

    //if(){
    window.GUN.quaternion.slerp(targetPosition, smoothness);
    //}else{
    //window.GUN.rotation.copy(window.MAIN_CAMERA.rotation)
    //}
    updateHeadBob(deltaTime);

    //console.log(window.MAIN_CAMERA.position.distanceTo(window.SPAWN_POSITION))

    if (window.MAIN_CAMERA.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
        window.PLAYER.position.copy(window.SPAWN_POSITION);
        //alert("You just found a bug!")
    }
}

var headBobTimer = 0;
var headBobSpeed = 3;
var headBobHeight = 0.00005;
var headBobActive = false;
var repositioningGUn = false;
var smoothness = 0.1;

const updateHeadBob = function (deltaTime) {
    if (headBobActive && moving) {
        const wavLength = Math.PI;
        const nextStep = 1 + Math.floor(((headBobTimer + 0.0000001) * headBobSpeed) / wavLength);
        const nextStepTime = nextStep * wavLength / headBobSpeed;
        headBobTimer = Math.min(headBobTimer + deltaTime, nextStepTime);

        if (headBobTimer == nextStepTime) {
            //headBobActive = false;
        }
    }
}

var levelCompleted = false;
var leveEntered = false;

var moving = false;
window.initLevel = false;

function raycast() {

    if (!leveEntered) {
        raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(window.planeEnterDoor);

        if (intersects.length > 0) {
            //onsole.log(intersects[0].distance)
            if (intersects[0].distance < 0.1) {
                leveEntered = true;

                setTimeout(() => {
                    window.wallCorridorEnter.position.y = 0;
                    window.wallCorridorExit.position.y = 0;
                }, 200);


                setTimeout(() => {
                    window.spotLight.intensity = 20;
                    window.lightRoom.intensity = 50;

                    setTimeout(() => {

                        for (var i = 0; i < window.DISPENSER_COVERS.length; i++) {
                            tweenCamera(300, window.DISPENSER_COVERS[i].scale, new THREE.Vector3(0, 0, 0))
                        }

                        setTimeout(() => {
                            //INITIATE BOX CANNON
                            for (var i = 0; i < window.BOX_BODY.length; i++) {
                                console.log("tttttttttttttt")
                                window.CANNON_WORLD.addBody(window.BOX_BODY[i])
                            }
                            for (var i = 0; i < window.SPHERE_BODY.length; i++) {
                                window.CANNON_WORLD.addBody(window.SPHERE_BODY[i])
                            }
                            window.initLevel = true;

                            setTimeout(() => {
                                for (var i = 0; i < window.DISPENSER_COVERS.length; i++) {
                                    tweenCamera(100, window.DISPENSER_COVERS[i].scale, new THREE.Vector3(0.012, 0.012, 0.012))
                                }
                            }, 1000);
                        }, 300);

                    }, 1000);
                }, 1000);

                setTimeout(() => {

                    window.enter_door_right.position.z = -4;
                    tweenCamera(1000, window.enter_door_right.position, new THREE.Vector3(-65, window.enter_door_right.position.y, window.enter_door_right.position.z))

                    window.enter_door_left.position.z = -4;
                    tweenCamera(1000, window.enter_door_left.position, new THREE.Vector3(65, window.enter_door_left.position.y, window.enter_door_left.position.z))

                    setTimeout(() => {
                        tweenCamera(500, window.enter_door_right_spinner.rotation, new THREE.Vector3(0,
                            window.enter_door_right_spinner.rotation.y,
                            window.enter_door_right_spinner.rotation.z))

                        tweenCamera(500, window.enter_door_left_spinner.rotation, new THREE.Vector3(0,
                            window.enter_door_left_spinner.rotation.y,
                            window.enter_door_left_spinner.rotation.z))


                        setTimeout(() => {
                            window.CORRIDOR_ENTER.visible = false;
                        }, 500);
                    }, 1000);

                }, 3000);
            }
        }
    }

    //
    /*raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
    var intersects = raycaster2.intersectObject(window.CORRIDOR_EXIT.getObjectByName("completed"));
    if (intersects.length > 0) {
        if (intersects[0].distance < 1 && !levelCompleted) {
            levelCompleted = true;
            $("#loading-parent").css("opacity", 1);
            $("#loading-parent").css("pointer-events", "all");

            $(".main-title").text("LEVEL COMPLETED AND VALIDATED")
            $(".introduction-text").text("Congratulations you completed the level, now you will be redirected to the level editor where you can make modifications, save or publish this level.");
        }
    }*/
    //

    if (window.PORTALS[0] === null || window.PORTALS[1] === null) {
        return
    }

    var portals = [window.PORTALS[0].mesh, window.PORTALS[1].mesh];

    var dd = 0;
    for (let d of window.dynamicObjects) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)
        // let bb = new Box3(new Vector3().copy(d.physicsBody.aabb.lowerBound), new Vector3().copy(d.physicsBody.aabb.upperBound))
        d.collisionFilterMask = window.CGROUP_ALL
        if (window.PORTALS[0] === null || window.PORTALS[1] === null) {
            continue
        }
        //d.meshClone.visible = false
        let CDBB_isOverlap = false;

        var inArea = 0;

        for (let p = 0; p < window.PORTALS.length; p++) {

            // collision disable, might be partially intersecting with portal
            if (window.PORTALS[p].CDBB.containsPoint(pos)) {
                d.collisionFilterMask &= ~window.PORTALS[p].hostObjects.collisionFilterGroup;
                //console.log(d.collisionFilterMask)

                if (dd == 0)
                    inArea++;
            }

            // should teleport
            if (window.PORTALS[p].STBB.containsPoint(pos)) {

                console.log()

                teleportPhysicalObject(d, window.PORTALS[p])

                if (dd == 0) {
                    teleportObject3D(window.MAIN_CAMERA, window.PORTALS[p])

                    // fix camera rotation
                    // create a new basis with up as the up
                    // https://danielilett.com/2020-01-03-tut4-4-portal-momentum/
                    let up = new THREE.Vector3(0, 1, 0)
                    let cameraForward = new THREE.Vector3()
                    window.MAIN_CAMERA.getWorldDirection(cameraForward)
                    cameraForward.normalize()
                    let cameraRight = cameraForward.clone().cross(up).normalize()
                    let cameraUp = cameraRight.clone().cross(cameraForward).normalize()
                    let cameraMat = new THREE.Matrix4().makeBasis(cameraRight, cameraUp, cameraForward.negate())
                    window.MAIN_CAMERA.quaternion.setFromRotationMatrix(cameraMat)

                    targetRotationX = window.MAIN_CAMERA.rotation.y;
                    targetRotationY = window.MAIN_CAMERA.rotation.x;

                    if (inArea > 0)
                        smoothness = 1;
                    else
                        smoothness = 0.1;
                }

                d.collisionFilterMask |= window.PORTALS[p].hostObjects.collisionFilterGroup
                d.collisionFilterMask &= ~window.PORTALS[1 - p].hostObjects.collisionFilterGroup
            }

        }

        dd++;

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

function tweenCamera(duration, ini, final) {
    new TWEEN.Tween(ini).to(final, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
}

function tweenOpacity(duration, mat, final) {
    new TWEEN.Tween(mat).to({
        opacity: final
    }, duration).start();
}

var teleporting = false;

let controllerIndex = null;

window.addEventListener("gamepadconnected", (event) => {
    const gamepad = event.gamepad;
    controllerIndex = gamepad.index;
    console.log("connected");
});

window.addEventListener("gamepaddisconnected", (event) => {
    controllerIndex = null;
    console.log("disconnected");
});

//

export {
    updatePlayer
};