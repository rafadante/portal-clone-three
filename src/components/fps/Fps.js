import * as THREE from 'three';
import {
    PointerLockControls
} from '../../PointerLockControls.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import nipplejs from 'nipplejs';
/*import {
    DeviceOrientationControls
} from 'three/addons/controls/DeviceOrientationControls.js';*/
import {
    KeyQ,
    KeyZ
} from '../recall/recall.js'
import {
    tweenCamera
} from '../../Main.js';
import {
    portalButton
} from '../portal/CreatePortal.js'
import {
    interactWithItem
} from '../items/Items.js'
import {
    TWEEN
} from '../../Tween.js';

//
let shouldJump = false;
var gamepadButton1 = false;
var gamepadButton3 = false;
var gamepadButton5 = false;
var gamepadButton6 = false;
var gamepadButton7 = false;
var gamepadButton12 = false;
var gamepadButton15 = false;
var headBobTimer = 0;
var headBobSpeed = 3;
var headBobHeight = 0.00005;
var headBobActive = false;
var repositioningGUn = false;
var moving = false;
let controllerIndex = null;
var allowEnterFPS = true;
var openedDoor = false;
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

let mouseTime = 0;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();
var crouched = false;
var moving = false;
var wasInJump = false;
var slipperyMaterial = new CANNON.Material();
slipperyMaterial.friction = 0.00;

//WINDOW VARIABLES

window.dynamicObjects = [];
window.GUN_MODE = 1;
window.allowPlacePortals = true;
window.initLevel = false;
window.gelOrange = false;
window.rotationMobile = 0.1;
window.smoothness = 0.1;

// MOBILE VARIABLES

let fwdValue = 0;
let bkdValue = 0;
let rgtValue = 0;
let lftValue = 0;

if (window.mobile) {
    //var controlsDevice = new DeviceOrientationControls(window.MAIN_CAMERA);
    window.targetRotationX = 0;
    var targetRotationOnMouseDownX = 0;
    window.targetRotationY = 0;
    var targetRotationOnMouseDownY = 0;
    var mouseX = 0;
    var mouseXOnMouseDown = 0;
    var mouseY = 0;
    var mouseYOnMouseDown = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var finalRotationY, outOfAngle = false;
    var blocked_bottom = false,
        blocked_top = false;
    var deltaX2, touchX2;
    var touches = 0;
    let joyManager;

    document.getElementById("camera").addEventListener('touchstart', onDocumentTouchStart, false);
    document.getElementById("camera").addEventListener('touchmove', onDocumentTouchMove, false);
    document.getElementById("camera").addEventListener('touchup', onDocumentTouchUp, false);

    function onDocumentTouchUp(event) {
        touches = 0;
    }

    function onDocumentTouchStart(event) {
        if (event.touches.length > 0) {
            touches = event.touches.length - 1;

            if (touches == 0 || touches == 1) {
                mouseXOnMouseDown = event.touches[touches].pageX - windowHalfX;
                targetRotationOnMouseDownX = window.targetRotationX;

                mouseYOnMouseDown = event.touches[touches].pageY - windowHalfY;
                targetRotationOnMouseDownY = window.targetRotationY;
            }
        }
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length > 0 && (touches == 0 || touches == 1)) {
            mouseX = event.touches[touches].pageX - windowHalfX;
            window.targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * (-0.01); //camera speed

            mouseY = event.touches[touches].pageY - windowHalfY;
            deltaX2 = event.touches[touches].pageY - touchX2;
            touchX2 = event.touches[touches].pageY;

            if (deltaX2 > 0) {
                if (!blocked_bottom)
                    window.targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
            } else {
                if (!blocked_top)
                    window.targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
            }
        }
    }

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
            touches = 0;
        })
    }
}

player();

if (!window.mobile)
    controlsLock();
// added joystick + movement

var upVector;

function player() {

    let sphereShape = new CANNON.Sphere(0.3);
    // define shape
    let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5 / 2, 2 / 2.3, 0.5 / 2));

    // define the physical body attributes
    window.PLAYER = new CANNON.Body({
        mass: 50,
        material: slipperyMaterial
    });
    window.PLAYER.allowSleep = false;
    window.PLAYER.addShape(physicsShape);
    window.PLAYER.position.set(5, 5, 5);
    window.PLAYER.linearDamping = 0.9;
    window.PLAYER.name = "player"

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

    upVector = new CANNON.Vec3(0, 1, 0);
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

var ss = 0;

document.addEventListener('keydown', (event) => {

    //if (event.code == "ControlLeft" && !crouched)

    if (window.FPS && allowEnterFPS) {
        if (controller[event.code])
            controller[event.code].pressed = true;

        headBobActive = true;

        if (event.code == "ControlLeft" && !crouched) {
            crouched = true;
            Crouch(-0.25);
        }
        if (event.code == "Digit1") {
            window.GUN_MODE = 1;
            tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
                0,
                window.INK.position.z))
        } else if (event.code == "Digit2") {
            window.GUN_MODE = 2;
            tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
                0.08,
                window.INK.position.z))
        } else if (event.code == "KeyE")
            interactWithItem();
        else if (event.code == "KeyQ")
            KeyQ();
        else if (event.code == "KeyZ")
            KeyZ();
    }
});

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

    console.log(window.PointerControls)

    window.PointerControls.addEventListener('lock', function () {
        document.getElementById('blocker').style.display = 'none';

        setTimeout(() => {
            window.allowPlacePortals = true;
        }, 1000);
    });

    window.PointerControls.addEventListener('unlock', function () {

        $("#container").css("filter", "blur(2px)")
        document.getElementById('blocker').style.display = 'block';
        window.allowPlacePortals = false;
        allowEnterFPS = false;

        setTimeout(() => {
            allowEnterFPS = true;
        }, 1500);
    });
}

document.addEventListener('keyup', (event) => {

    if (window.FPS && allowEnterFPS) {

        if (controller[event.code])
            controller[event.code].pressed = false;

        repositioningGUn = true;
        moving = false;
        headBobTimer = 0;
        //headBobActive = false;

        tweenCamera(500, window.GUN.children[0].position, new THREE.Vector3(0, 0, 0))

        if (crouched) {
            crouched = false;
            Crouch(0.25);
        }
    }
});

$("body").on('pointerdown', '#crouch', function () {
    crouched = true;
    Crouch(-0.25);
})

$("body").on('pointerup', '#crouch', function () {
    Crouch(0.25);
})

function tweenBBB(duration, ini, final) {

    var obj = new THREE.Object3D();
    window.MAIN_SCENE.add(obj)
    obj.quaternion.copy(ini.clone());

    new TWEEN.Tween(ini).to(final, duration)
        .onUpdate((tween) => {

            obj.quaternion.slerp(final, 0.1);
            window.MAIN_CAMERA.quaternion.copy(obj.quaternion);
            window.PLAYER.quaternion.copy(obj.quaternion);
        })

    var aa = {
        value: 0
    };

    new TWEEN.Tween(aa, false)
        .to({
            value: 1
        }, 1000)
        .onUpdate(() => {
            obj.quaternion.slerp(final, 0.1);
            window.MAIN_CAMERA.quaternion.copy(obj.quaternion);
            window.PLAYER.quaternion.copy(obj.quaternion);
            //window.sepiaEffect.intensity = aa.value;
            //window.vig.darkness = aa.value * 0.7;
        })
        .start();
}

document.addEventListener('mousedown', (event) => {
    if (!window.mobile && document.pointerLockElement !== null)
        portalButton(event.button)

    /*if (event.button == 2 && window.FPS && allowEnterFPS) {
        if (ss == 0) {

            var dd = 0;
            for (let d of window.dynamicObjects) {
                if (dd > 0)
                    d.mass = 0;

                dd++
            }

            //PAREDE

            window.CANNON_WORLD.gravity.set(0, 0, -9.8);

            var axis = new CANNON.Vec3(1, 0, 0);
            var angle = Math.PI / 2;

            var obj = new THREE.Object3D();
            window.MAIN_SCENE.add(obj)
            obj.quaternion.setFromAxisAngle(axis, angle);

            tweenBBB(10000, window.MAIN_CAMERA.quaternion, obj.quaternion)

            upVector = new CANNON.Vec3(0, 0, 1);
            up = new THREE.Vector3(0, 0, 1)
            window.PointerControls.maxPolarAngle = 0;
            window.PointerControls._euler = new THREE.Euler(0, 0, 0, 'XZY');
        } else if (ss == 1) {
            //TET0

            window.CANNON_WORLD.gravity.set(0, 9.8, 0);

            var axis = new CANNON.Vec3(1, 0, 0);
            var angle = -Math.PI;

            var obj = new THREE.Object3D();
            window.MAIN_SCENE.add(obj)
            obj.quaternion.setFromAxisAngle(axis, angle);

            tweenBBB(10000, window.MAIN_CAMERA.quaternion, obj.quaternion)

            upVector = new CANNON.Vec3(0, -1, 0);
            up = new THREE.Vector3(0, -1, 0)
            window.dir = -1;

            window.PointerControls.maxPolarAngle = Math.PI;
            window.PointerControls._euler = new THREE.Euler(0, 0, 0, 'YXZ');
        } else if (ss == 2) {
            //TET0

            window.CANNON_WORLD.gravity.set(0, -9.8, 0);

            var axis = new CANNON.Vec3(1, 0, 0);
            var angle = 0;

            var obj = new THREE.Object3D();
            window.MAIN_SCENE.add(obj)
            obj.quaternion.setFromAxisAngle(axis, angle);

            tweenBBB(10000, window.MAIN_CAMERA.quaternion, obj.quaternion)

            upVector = new CANNON.Vec3(0, 1, 0);
            up = new THREE.Vector3(0, 1, 0)
            window.dir = 1;
        }

        ss++;
    }*/
});

//LEFT PORTAL MOBILE
document.getElementById("portal_l").addEventListener('pointerdown', portal_l_Touch, false);

function portal_l_Touch() {
    window.allowPlacePortals = true;
    portalButton(0);
}
//RIGHT PORTAL MOBILE
document.getElementById("portal_r").addEventListener('pointerdown', portal_r_Touch, false);

function portal_r_Touch() {
    window.allowPlacePortals = true;
    portalButton(2)
}
//JUMP MOBILE
document.getElementById("jump").addEventListener('pointerdown', jumpTouch, false);

function jumpTouch() {
    // handle jumping when space bar is pressed
    if (!window.PLAYER.inJump)
        shouldJump = true;
}

var vv = false;
var up = new THREE.Vector3(0, 1, 0)

const updatePlayer = function (deltaTime) {

    var velocity = 1100;

    //ROTATE THE CAMERA WITH TOUCH ON MOBILE
    if (window.mobile) {
        velocity = 900;
        window.MAIN_CAMERA.rotation.y += (window.targetRotationX - window.MAIN_CAMERA.rotation.y) * window.rotationMobile;

        //vertical rotation 
        finalRotationY = (window.targetRotationY - window.MAIN_CAMERA.rotation.x);
        if (window.MAIN_CAMERA.rotation.x <= 1 && window.MAIN_CAMERA.rotation.x >= -1)
            window.MAIN_CAMERA.rotation.x += finalRotationY * window.rotationMobile;

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
            //controlsDevice.update();
            window.MAIN_CAMERA.rotation.z = 0
        }
    }

    // gives a bit of air control
    // define directions
    let cameraDirection = new THREE.Vector3()
    window.MAIN_CAMERA.getWorldDirection(cameraDirection)

    const forward = cameraDirection.projectOnPlane(up).normalize()
    const backward = forward.clone().negate()
    const left = up.clone().cross(forward).normalize()
    const right = left.clone().negate()

    // physics changes while jumping
    let jumpMultiplier = 1
    if (window.PLAYER.inJump)
        jumpMultiplier = 0.05

    if (!window.PLAYER.inJump)
        window.PLAYER.linearDamping = 0.999
    else
        window.PLAYER.linearDamping = 0.01

    // regulates speed when multiple directions are pressed 
    let movementDirections = fwdValue + bkdValue + lftValue + rgtValue;
    let movementMultiplier = 1
    if (movementDirections == 2)
        movementMultiplier = (1 / Math.sqrt(movementDirections))

    // apply forces in WASD directions when pressed

    var mass = 50;
    if (window.PLAYER.mass == 0)
        mass = 10;

    const f = velocity * window.PLAYER.mass * jumpMultiplier * deltaTime; //window.PLAYER.mass

    if (window.gelOrange)
        window.PLAYER.applyForce(forward.clone().multiplyScalar(f * 3), window.PLAYER.position)

    if (!window.stopTime) {
        if (window.mobile) {

            if (fwdValue > 0)
                movePlayerTouch(forward, f, fwdValue)
            if (bkdValue > 0)
                movePlayerTouch(backward, f, bkdValue)
            if (lftValue > 0)
                movePlayerTouch(left, f, lftValue)
            if (rgtValue > 0)
                movePlayerTouch(right, f, rgtValue)

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

                joystickAction(gamepad, 5, gamepadButton5, 1);
                joystickAction(gamepad, 6, gamepadButton6, 0);
                joystickAction(gamepad, 7, gamepadButton7, 2);

                if (gamepad.buttons[3].value == 1 && !gamepadButton3) {
                    /*crouched = true;
                    Crouch(-0.25);
                    gamepadButton3 = true;*/
                    KeyZ();
                    vv = true;
                } else if (gamepad.buttons[3].value == 0) {
                    /*if (crouched) {
                        Crouch(0.25);
                    }
                    gamepadButton3 = false;
                    crouched = false;*/
                    if (vv) {
                        KeyZ();
                        vv = false;
                    }
                }

                if (gamepad.buttons[1].value == 1 && !gamepadButton1) {
                    interactWithItem();
                    gamepadButton1 = true;
                } else if (gamepad.buttons[1].value == 0)
                    gamepadButton1 = false;

                joystickGel(gamepad, 12, gamepadButton12, 1, 0)
                joystickGel(gamepad, 15, gamepadButton15, 2, 0.08)

                if (gamepad.axes[2] > 0.5)
                    window.MAIN_CAMERA.rotation.y -= 0.05;
                if (gamepad.axes[2] < -0.5)
                    window.MAIN_CAMERA.rotation.y += 0.05;
                if (gamepad.axes[3] < -0.5)
                    window.MAIN_CAMERA.rotation.x += 0.025;
                if (gamepad.axes[3] > 0.5)
                    window.MAIN_CAMERA.rotation.x -= 0.025;

                var gamepadPressed = 0;

                if (gamepad.axes[1] < -0.5)
                    movePlayerJoystick(forward, f, movementMultiplier, gamepadPressed)
                if (gamepad.axes[1] > 0.5)
                    movePlayerJoystick(backward, f, movementMultiplier, gamepadPressed)
                if (gamepad.axes[0] < -0.5)
                    movePlayerJoystick(left, f, movementMultiplier, gamepadPressed)
                if (gamepad.axes[0] > 0.5)
                    movePlayerJoystick(right, f, movementMultiplier, gamepadPressed)
                if (gamepadPressed == 0) {
                    moving = false;
                    headBobActive = false;
                }
            }

            var posPlayer = new THREE.Vector3(window.PLAYER.position.x, window.PLAYER.position.y, window.PLAYER.position.z)

            if (controller["KeyW"].pressed && !window.COL_Z)
                movePlayerKeyboard(forward, posPlayer, f, movementMultiplier)
            if (controller["KeyS"].pressed)
                movePlayerKeyboard(backward, posPlayer, f, movementMultiplier)
            if (controller["KeyA"].pressed)
                movePlayerKeyboard(left, posPlayer, f, movementMultiplier)
            if (controller["KeyD"].pressed)
                movePlayerKeyboard(right, posPlayer, f, movementMultiplier)

            shouldJump = false;
            // handle jumping when space bar is pressed

            if (controllerIndex !== null) {
                if (gamepad.buttons[0].value > 0 && !window.PLAYER.inJump)
                    shouldJump = true;
            } else if (controller["Space"].pressed && !window.PLAYER.inJump)
                shouldJump = true;
            // update lastTimeStampInJump
            wasInJump = window.PLAYER.inJump;

            if (shouldJump) {
                window.PLAYER.inJump = true
                window.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.14), window.PLAYER.position)
            }
        }
    }

    //window.MAIN_CAMERA.rotation.multiplyScalar(-1);

    // always look where the camera points
    window.PLAYER.quaternion.copy(window.MAIN_CAMERA.quaternion)
    window.PLAYER.quaternion.x = 0
    window.PLAYER.quaternion.z = 0
    window.PLAYER.quaternion.normalize()

    // set camera position to be at player
    window.MAIN_CAMERA.position.copy(window.PLAYER.position)
    //window.GUN.position.copy(window.MAIN_CAMERA.position);

    if (moving)
        window.GUN.children[0].position.x += Math.sin(headBobTimer * headBobSpeed) * headBobHeight;

    //const targetPosition = window.MAIN_CAMERA.quaternion.clone();
    //window.GUN.quaternion.slerp(window.GUN.quaternion, window.smoothness);
    //window.GUN.quaternion.copy(window.MAIN_CAMERA.quaternion);
    updateHeadBob(deltaTime);

    if (window.MAIN_CAMERA.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
        var obj = window.ENTER_DOOR.clone();
        obj.translateZ(1);
        window.PLAYER.position.copy(obj.position);
    }
}

function movePlayerKeyboard(direction, posPlayer, f, movementMultiplier) {
    moving = true;
    if (window.PLAYER.mass == 0) {
        posPlayer.add(direction.clone().multiplyScalar(0.02));
        window.PLAYER.position.copy(posPlayer);
    } else
        window.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
}

function movePlayerJoystick(direction, f, movementMultiplier, gamepadPressed) {
    window.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
    moving = true;
    gamepadPressed++;
    headBobActive = true;
}

function movePlayerTouch(direction, f, value) {
    window.PLAYER.applyForce(direction.clone().multiplyScalar(f * value), window.PLAYER.position)
    moving = true;
}

function joystickAction(gamepad, index, gamepadButton, button) {
    if (gamepad.buttons[index].value == 1 && !gamepadButton) {
        portalButton(button);

        /*gamepad.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 200,
            weakMagnitude: 1.0,
            strongMagnitude: 1.0,
        });*/

        gamepadButton = true;
    } else if (gamepad.buttons[index].value == 0) {
        gamepadButton = false;
    }
}

function Crouch(value) {
    window.PLAYER.shapes[0].halfExtents.y += value;
    window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    window.PLAYER.computeAABB();
    window.PLAYER.updateMassProperties();
}

function joystickGel(gamepad, index, gamepadButton, mode, value) {
    if (gamepad.buttons[index].value == 1 && !gamepadButton) {
        window.GUN_MODE = mode;
        tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
            value,
            window.INK.position.z))
        gamepadButton = true;
    } else if (gamepad.buttons[index].value == 0) {
        gamepadButton = false;
    }
}

const updateHeadBob = function (deltaTime) {
    if (headBobActive && moving) {
        const wavLength = Math.PI;
        const nextStep = 1 + Math.floor(((headBobTimer + 0.0000001) * headBobSpeed) / wavLength);
        const nextStepTime = nextStep * wavLength / headBobSpeed;
        headBobTimer = Math.min(headBobTimer + deltaTime, nextStepTime);
    }
}

window.addEventListener("gamepadconnected", (event) => {
    const gamepad = event.gamepad;
    controllerIndex = gamepad.index;
    console.log("connected");
});

window.addEventListener("gamepaddisconnected", (event) => {
    controllerIndex = null;
    console.log("disconnected");
});

var vv = false;
var destroyed = false;
var cc = false;
var tt = 0;

function bbb() {

}

window['createBlueGel'] = function () {

    destroyed = false;

    for (var i = 0; i < window.DYMANIC_ITEMS['dispenser'].length; i++) {
        if (window.DYMANIC_ITEMS['dispenser'][i].length != 0) {

            if (!vv) {
                let PHYSICS_MATERIAL = new CANNON.Material();
                PHYSICS_MATERIAL.friction = 0; //0.01
                PHYSICS_MATERIAL.restitution = 0; //0.1

                var shape = new CANNON.Sphere(0.3);
                window.gelBallBody = new CANNON.Body({
                    shape: shape,
                    mass: 100,
                    material: PHYSICS_MATERIAL
                })

                window.dynamicObjects[1] = window.gelBallBody;

                const geometry = new THREE.IcosahedronGeometry(20, 4);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x0000FF
                });
                window.gelBall = new THREE.Mesh(geometry, mat);
                window.MAIN_SCENE.add(window.gelBall);

                window.gelBall.scale.set(0.015, 0.015, 0.015)

                window.gelBallBody.collisionFilterGroup = window.CGROUP_DYNAMIC
                window.gelBallBody.collisionFilterMask = window.CGROUP_ENVIRONMENT
                window.gelBallBody.gel = true;

                console.log("ppppppppppppppp");
                window.CANNON_WORLD.addBody(window.gelBallBody);
            } else {
                // Velocity
                window.gelBallBody.velocity.setZero();
                window.gelBallBody.initVelocity.setZero();
                window.gelBallBody.angularVelocity.setZero();
                window.gelBallBody.initAngularVelocity.setZero();

                // Force
                window.gelBallBody.force.setZero();
                window.gelBallBody.torque.setZero();
            }

            var pos = window.DYMANIC_ITEMS['dispenser'][i].position.clone();
            pos.y -= 0.5;
            window.gelBallBody.position.copy(pos);
            window.gelBall.position.copy(pos);

            window.gelBall.visible = true;

            if (!vv) {
                window.gelBallBody.addEventListener('collide', (event) => {

                    if (event.target.inArea) {
                        console.log("11111111111")
                    } else if (event.body.room && !cc) {

                        cc = true;

                        console.log(event)

                        createGel(event.target.position);
                        window.gelBall.visible = false;

                        setTimeout(() => {
                            window['createBlueGel']();

                            setTimeout(() => {
                                cc = false;
                            }, 10);
                        }, 2000);
                    }
                })
            }

        }
    }

    vv = true;
}

function createGel(pos) {

    console.log(pos)

    var id;

    for (var i = 0; i < window.GELS.length; i++) {
        if (!window.GELS[i]) {
            window.GELS[i] = true;
            id = i;
            break;
        }
    }

    var gel = new THREE.Object3D();
    //gel.renderOrder = window.gels;
    window.gels++;
    gel.scale.set(2, 2, 2);
    //pos.y -= 0.15;
    gel.position.copy(pos);

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


    gel.rotation.x = -Math.PI / 2;
    box.up = new THREE.Vector3(0, 1, 0)
    box.vel = new THREE.Vector3(1, 0, 1)


    gel.updateMatrix();
    window.instancedMeshGel.setMatrixAt(id, gel.matrix);


    window.instancedMeshGel.setColorAt(id, new THREE.Color(0x0000FF));

    window.instancedMeshGel.instanceColor.needsUpdate = true;
    window.instancedMeshGel.instanceMatrix.needsUpdate = true;
    window.instancedMeshGel.computeBoundingSphere();

    box.position.copy(pos);
    box.quaternion.copy(gel.quaternion)
    box.collisionFilterGroup = window.CGROUP_DYNAMIC
    box.collisionFilterMask = window.CGROUP_ALL
    box.linearDamping = 0.01;


    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.0, 0.0, 1.0);
    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
            value: 0.5
        }, 300).start();
    }
    box.name = "gel-blue";

    // When a body collides with another body, they both dispatch the "collide" event.
    box.addEventListener('collide', (event) => {

        if (event.body.gel) {
            console.log("9999999999999")
            return;
        }

        if (!event.body.gelJumping) {

            var relativeVelocity = event.contact.getImpactVelocityAlongNormal();
            event.body.gelJumping = true;

            var holder = event.body;

            setTimeout(() => {
                holder.gelJumping = false;
            }, 10);


            //shouldJump = true;
            //window.PLAYER.inJump = true
            event.body.velocity.set(event.body.velocity.x * event.target.vel.x,
                event.body.velocity.y * event.target.vel.y,
                event.body.velocity.z * event.target.vel.z);
            event.body.applyImpulse(event.target.up.clone().multiplyScalar(8 * event.body.mass * Math.abs((relativeVelocity * 0.045) + 1)), event.body.position)
        }
    })

    window.CANNON_WORLD.addBody(box);

    window.PLAYER.addEventListener('collide', (event) => {
        if (event.body.name == "gel-orange") {
            window.gelOrange = true;
        } else {
            window.gelOrange = false;
        }
    })
}

const vshader = `
// Include the Ashima code here!

varying vec2 vUv;
varying float noise;
uniform float time;
  
  vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

float turbulence( vec3 p ) {
    float w = 100.0;
    float t = -.5;
    for (float f = 1.0 ; f <= 10.0 ; f++ ){
        float power = pow( 2.0, f );
        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
    }
    return t;
}

void main() {

    vUv = uv;

    // add time to the noise parameters so it's animated
    noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
    float b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );
    float displacement = - noise + b;
    
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

}

`;

const fshader = `
varying vec2 vUv;
varying float noise;

void main() {

    // compose the colour using the UV coordinate
    // and modulate it with the noise like ambient occlusion
    vec3 color = vec3(0.0, 0.0, vUv.y * (1.0 - 0.0 * noise));
    gl_FragColor = vec4( color.rgb, 1.0 );
}

`;

window.uniformsgEL = {
    time: { // float initialized to 0
        type: "f",
        value: 0.0
    }
}

var mat = new THREE.ShaderMaterial({
    uniforms: window.uniformsgEL,
    vertexShader: vshader,
    fragmentShader: fshader,
});

export {
    updatePlayer
};