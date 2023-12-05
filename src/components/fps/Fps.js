import * as THREE from '../../build/three.module.js';
import {
    PointerLockControls
} from '../../jsm/controls/PointerLockControls.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import nipplejs from 'nipplejs';
import {
    DeviceOrientationControls
} from '../../jsm/controls/DeviceOrientationControls.js';
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
    var controlsDevice = new DeviceOrientationControls(window.MAIN_CAMERA);
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

document.addEventListener('keydown', (event) => {

    //if (event.code == "ControlLeft" && !crouched)
    //console.log(window.RENDERER.info.render.calls)

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

document.addEventListener('mousedown', (event) => {
    if (!window.mobile && document.pointerLockElement !== null)
        portalButton(event.button)
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
                window.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.2), window.PLAYER.position)
            }
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

    if (moving)
        window.GUN.children[0].position.x += Math.sin(headBobTimer * headBobSpeed) * headBobHeight;

    const targetPosition = window.MAIN_CAMERA.quaternion.clone();
    window.GUN.quaternion.slerp(targetPosition, window.smoothness);
    updateHeadBob(deltaTime);

    if (window.MAIN_CAMERA.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100)
        window.PLAYER.position.copy(window.SPAWN_POSITION);
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

export {
    updatePlayer
};