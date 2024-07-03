/* eslint-disable */
import * as THREE from 'three';
import {
    PointerLockControls
} from '../../PointerLockControls.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import nipplejs from 'nipplejs';
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
    elevatorCollider
} from '../test/Test.js';
import {
    GLOBALS
} from '../../Globals.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';

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
var headBobSpeed = 5;
var headBobHeight = 0.00005;
var headBobActive = false;
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

var crouched = false;
var moving = false;
var slipperyMaterial = new CANNON.Material();
slipperyMaterial.friction = 0.00;
window.PLAYER_JUMPING_FROM_BLUE_GEL = false;

//WINDOW VARIABLES

var rotationMobile = 0.1;

// MOBILE VARIABLES

let fwdValue = 0;
let bkdValue = 0;
let rgtValue = 0;
let lftValue = 0;

if (GLOBALS.MOBILE) {
    //var controlsDevice = new DeviceOrientationControls(GLOBALS.MAIN_CAMERA);
    var targetRotationOnMouseDownX = 0;
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
                targetRotationOnMouseDownX = GLOBALS.TARGET_ROTATION_X;

                mouseYOnMouseDown = event.touches[touches].pageY - windowHalfY;
                targetRotationOnMouseDownY = GLOBALS.TARGET_ROTATION_Y;
            }
        }
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length > 0 && (touches == 0 || touches == 1)) {
            mouseX = event.touches[touches].pageX - windowHalfX;
            GLOBALS.TARGET_ROTATION_X = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * (-0.01); //camera speed

            mouseY = event.touches[touches].pageY - windowHalfY;
            deltaX2 = event.touches[touches].pageY - touchX2;
            touchX2 = event.touches[touches].pageY;

            if (deltaX2 > 0) {
                if (!blocked_bottom)
                    GLOBALS.TARGET_ROTATION_Y = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
            } else {
                if (!blocked_top)
                    GLOBALS.TARGET_ROTATION_Y = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
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
            moving = false;
            headBobTimer = 0;
            //headBobActive = false;

            tweenCamera(500, GLOBALS.GUN.children[0].position, new THREE.Vector3(0, 0, 0))
            touches = 0;
        })
    }
}

player();

if (!GLOBALS.MOBILE)
    controlsLock();
// added joystick + movement

var upVector;

function player() {

    let sphereShape = new CANNON.Sphere(0.3);
    // define shape
    let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5 / 2, 2 / 2.3, 0.5 / 2));

    // define the physical body attributes
    GLOBALS.PLAYER = new CANNON.Body({
        mass: 50,
        material: slipperyMaterial
    });
    GLOBALS.PLAYER.allowSleep = false;
    GLOBALS.PLAYER.addShape(physicsShape);
    GLOBALS.PLAYER.position.set(5, 5, 5);
    GLOBALS.PLAYER.linearDamping = 0.9;
    GLOBALS.PLAYER.name = "player";

    // keep the player upright
    GLOBALS.PLAYER.angularDamping = 1

    // set additional properties
    GLOBALS.PLAYER.inJump = true

    // construct the physical body
    GLOBALS.PLAYER.updateMassProperties()
    GLOBALS.CANNON_WORLD.addBody(GLOBALS.PLAYER);

    // normal collision events don't happen consistently - will stop once an object is stable on the ground
    // so need to check contacts to detect if grounded or not
    // https://github.com/schteppe/cannon.js/issues/313

    upVector = new CANNON.Vec3(0, 1, 0);
    let contactNormal = new CANNON.Vec3(0, 0, 0);

    GLOBALS.CANNON_WORLD.addEventListener("postStep", (e) => {
        GLOBALS.PLAYER.inJump = true;
        if (GLOBALS.CANNON_WORLD.contacts.length > 0) {

            for (let contact of GLOBALS.CANNON_WORLD.contacts) {

                if (contact.bi.id == GLOBALS.PLAYER.id || contact.bj.id == GLOBALS.PLAYER.id) {
                    if (contact.bi.id == GLOBALS.PLAYER.id) {
                        // contact.ni.negate(contactNormal);
                        contactNormal = new THREE.Vector3(contact.ni.x * -1, contact.ni.y * -1, contact.ni.z * -1)
                    } else {
                        // contact.ni.copy(contactNormal);
                        contactNormal = contact.ni
                    }

                    GLOBALS.PLAYER.inJump = (contactNormal.dot(upVector) <= 0.5);

                    if(!GLOBALS.PLAYER.inJump){
                        window.PLAYER_JUMPING_FROM_BLUE_GEL = false;
                    }

                    break;
                }
            }
        }

        moving = GLOBALS.PLAYER.inJump;
    })

    GLOBALS.DYNAMIC_OBJECTS.push(GLOBALS.PLAYER);

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {
        d.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
        d.collisionFilterMask = GLOBALS.CGROUP_ALL
    }
}

document.addEventListener('keydown', (event) => {

    //if (event.code == "ControlLeft" && !crouched)

    if (GLOBALS.FPS_MODE && allowEnterFPS) {
        if (controller[event.code])
            controller[event.code].pressed = true;

        headBobActive = true;

        if (event.code == "ControlLeft" && !crouched) {
            crouched = true;
            Crouch(-0.25);
        } else if (event.code == "KeyE")
            interactWithItem();
    }
});

$("body").on('click', '#close', function () {
    $("#blocker").css("display", "block");
    //$("#mobile-controls").css("display", "none");
    $("#container").css("filter", "blur(2px)");
    //openFullscreen();
})

$("body").on('click', '#item', function () {
    interactWithItem();
})

$("body").on('click', '#settings-close', function () {
    if (GLOBALS.FPS_MODE && allowEnterFPS) {

        GLOBALS.PAUSED = false;

        if (!GLOBALS.MOBILE) {
            document.body.requestPointerLock();
        } else {
            $("#blocker").css("display", "none");
            $("#mobile-controls").css("display", "block");
            openFullscreen();
        }

        $("#container").css("filter", "none");

        if (!GLOBALS.DOOR_OPEN_STATE) {
            GLOBALS.DOOR_OPEN_STATE = true;

            console.log(GLOBALS.ENTER_DOOR)

            setTimeout(() => {
                tweenCamera(500, GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_right_05").rotation, new THREE.Vector3(Math.PI,
                    GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_right_05").rotation.y,
                    GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_right_05").rotation.z))

                tweenCamera(500, GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_left_07").rotation, new THREE.Vector3(Math.PI,
                    GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_left_07").rotation.y,
                    GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_left_07").rotation.z))

                setTimeout(() => {
                    console.log("yyyyyyyyyyyyyyy")
                    GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.z = -4;
                    tweenCamera(1000, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position, new THREE.Vector3(25, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.y, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.z))

                    GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.z = -4;
                    tweenCamera(1000, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position, new THREE.Vector3(-25, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.y, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.z))
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
    GLOBALS.POINTER_CONTROLS = new PointerLockControls(GLOBALS.MAIN_CAMERA, document.body);
    GLOBALS.POINTER_CONTROLS.pointerSpeed = 0.5;

    GLOBALS.POINTER_CONTROLS.addEventListener('lock', function () {
        document.getElementById('blocker').style.display = 'none';
        GLOBALS.PAUSED = false;

        setTimeout(() => {
            GLOBALS.ALLOW_PLACE_PORTALS = true;
        }, 1000);
    });

    GLOBALS.POINTER_CONTROLS.addEventListener('unlock', function () {

        $("#container").css("filter", "blur(2px)")
        document.getElementById('blocker').style.display = 'block';
        GLOBALS.ALLOW_PLACE_PORTALS = false;
        allowEnterFPS = false;
        GLOBALS.PAUSED = true;

        setTimeout(() => {
            allowEnterFPS = true;
        }, 1500);
    });
}

document.addEventListener('keyup', (event) => {

    if (GLOBALS.FPS_MODE && allowEnterFPS) {

        if (controller[event.code])
            controller[event.code].pressed = false;

        moving = false;
        headBobTimer = 0;
        //headBobActive = false;

        tweenCamera(300, GLOBALS.GUN.children[0].position, new THREE.Vector3(0, 0, 0))

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
    if (!GLOBALS.MOBILE && document.pointerLockElement !== null)
        portalButton(event.button)
});

//LEFT PORTAL MOBILE
document.getElementById("portal_l").addEventListener('pointerdown', portal_l_Touch, false);

function portal_l_Touch() {
    GLOBALS.ALLOW_PLACE_PORTALS = true;
    portalButton(0);
}
//RIGHT PORTAL MOBILE
document.getElementById("portal_r").addEventListener('pointerdown', portal_r_Touch, false);

function portal_r_Touch() {
    GLOBALS.ALLOW_PLACE_PORTALS = true;
    portalButton(2)
}
//JUMP MOBILE
document.getElementById("jump").addEventListener('pointerdown', jumpTouch, false);

function jumpTouch() {
    // handle jumping when space bar is pressed
    if (!GLOBALS.PLAYER.inJump)
        shouldJump = true;
}

var vv = false;
var up = new THREE.Vector3(0, 1, 0)
var lastTimeStamp = 0;

const updatePlayer = function (deltaTime) {

    var velocity = 1100;

    //ROTATE THE CAMERA WITH TOUCH ON MOBILE
    if (GLOBALS.MOBILE) {
        velocity = 900;
        GLOBALS.MAIN_CAMERA.rotation.y += (GLOBALS.TARGET_ROTATION_X - GLOBALS.MAIN_CAMERA.rotation.y) * rotationMobile;

        //vertical rotation 
        finalRotationY = (GLOBALS.TARGET_ROTATION_Y - GLOBALS.MAIN_CAMERA.rotation.x);
        if (GLOBALS.MAIN_CAMERA.rotation.x <= 1 && GLOBALS.MAIN_CAMERA.rotation.x >= -1)
            GLOBALS.MAIN_CAMERA.rotation.x += finalRotationY * rotationMobile;

        if (GLOBALS.MAIN_CAMERA.rotation.x > 1) {
            blocked_top = true;
            GLOBALS.MAIN_CAMERA.rotation.x = 1
        } else
            blocked_top = false;

        if (GLOBALS.MAIN_CAMERA.rotation.x < -1) {
            blocked_bottom = true;
            GLOBALS.MAIN_CAMERA.rotation.x = -1
        } else
            blocked_bottom = false;
    }

    // gives a bit of air control
    // define directions
    let cameraDirection = new THREE.Vector3()
    GLOBALS.MAIN_CAMERA.getWorldDirection(cameraDirection)

    const forward = cameraDirection.projectOnPlane(up).normalize()
    const backward = forward.clone().negate()
    const left = up.clone().cross(forward).normalize()
    const right = left.clone().negate()

    // physics changes while jumping
    let jumpMultiplier = 1
    if (GLOBALS.PLAYER.inJump)
        jumpMultiplier = 0.05

    if (!GLOBALS.PLAYER.inJump)
        GLOBALS.PLAYER.linearDamping = 0.999
    else
        GLOBALS.PLAYER.linearDamping = 0.01

    // regulates speed when multiple directions are pressed 
    let movementDirections = fwdValue + bkdValue + lftValue + rgtValue;
    let movementMultiplier = 1
    if (movementDirections == 2)
        movementMultiplier = (1 / Math.sqrt(movementDirections))

    // apply forces in WASD directions when pressed

    var mass = 50;
    if (GLOBALS.PLAYER.mass == 0)
        mass = 10;

    const f = velocity * GLOBALS.PLAYER.mass * jumpMultiplier * deltaTime;

    if (GLOBALS.GEL_ORANGE)
        GLOBALS.PLAYER.applyForce(forward.clone().multiplyScalar(f * 3), GLOBALS.PLAYER.position)

    if (!GLOBALS.STOP_TIME && !GLOBALS.GEL_ORANGE && !window.PLAYER_JUMPING_FROM_BLUE_GEL) {
        if (GLOBALS.MOBILE) {

            if (fwdValue > 0)
                movePlayerTouch(forward, f, fwdValue)
            if (bkdValue > 0)
                movePlayerTouch(backward, f, bkdValue)
            if (lftValue > 0)
                movePlayerTouch(left, f, lftValue)
            if (rgtValue > 0)
                movePlayerTouch(right, f, rgtValue)

            if (shouldJump) {
                GLOBALS.PLAYER.inJump = true
                GLOBALS.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.25), GLOBALS.PLAYER.position)
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
                    vv = true;
                } else if (gamepad.buttons[3].value == 0) {
                    /*if (crouched) {
                        Crouch(0.25);
                    }
                    gamepadButton3 = false;
                    crouched = false;*/
                    if (vv) {
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
                    GLOBALS.MAIN_CAMERA.rotation.y -= 0.05;
                if (gamepad.axes[2] < -0.5)
                    GLOBALS.MAIN_CAMERA.rotation.y += 0.05;
                if (gamepad.axes[3] < -0.5)
                    GLOBALS.MAIN_CAMERA.rotation.x += 0.025;
                if (gamepad.axes[3] > 0.5)
                    GLOBALS.MAIN_CAMERA.rotation.x -= 0.025;

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

            var posPlayer = new THREE.Vector3(GLOBALS.PLAYER.position.x, GLOBALS.PLAYER.position.y, GLOBALS.PLAYER.position.z)

            if (controller["KeyW"].pressed)
                movePlayerKeyboard(forward, posPlayer, f, movementMultiplier)
            if (controller["KeyS"].pressed)
                movePlayerKeyboard(backward, posPlayer, f, movementMultiplier)
            if (controller["KeyA"].pressed)
                movePlayerKeyboard(left, posPlayer, f, movementMultiplier)
            if (controller["KeyD"].pressed)
                movePlayerKeyboard(right, posPlayer, f, movementMultiplier)

            shouldJump = false;
            // handle jumping when space bar is pressed

            if(!controller["Space"].pressed){
                jumpPressed = false;
            }

            if (controllerIndex !== null) {
                if (gamepad.buttons[0].value > 0 && !GLOBALS.PLAYER.inJump)
                    shouldJump = true;
            } else if (controller["Space"].pressed && !GLOBALS.PLAYER.inJump){
                shouldJump = true;
            }

            if (shouldJump && !GLOBALS.PLAYER.inJump && !jumpPressed) {
                jumpPressed = true;
                GLOBALS.PLAYER.inJump = true
                GLOBALS.PLAYER.applyImpulse(up.clone().multiplyScalar(230), GLOBALS.PLAYER.position)
            }
        }
    }

    updateHeadBob(deltaTime);

    if (moving)
        GLOBALS.GUN.children[0].position.x += Math.sin(headBobTimer * headBobSpeed) * headBobHeight;
}

var jumpPressed = false;

const updateCamera = function (deltaTime) {

    if(window.CAMERA_ROTATING){
        GLOBALS.MAIN_CAMERA.quaternion.slerp(window.q, 0.1);
    }

    // always look where the camera points
    GLOBALS.PLAYER.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion)
    GLOBALS.PLAYER.quaternion.x = 0
    GLOBALS.PLAYER.quaternion.z = 0
    GLOBALS.PLAYER.quaternion.normalize()

    // set camera position to be at player
    GLOBALS.MAIN_CAMERA.position.copy(GLOBALS.PLAYER.position);
    GLOBALS.GUN.position.copy(GLOBALS.MAIN_CAMERA.position);
    GLOBALS.GUN.quaternion.slerp(GLOBALS.MAIN_CAMERA.quaternion, GLOBALS.SMOOTHNESS);

    if (GLOBALS.MAIN_CAMERA.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
        var obj = GLOBALS.ENTER_DOOR.clone();
        obj.translateZ(1);
        GLOBALS.PLAYER.position.copy(obj.position);
    }

    // copy position and rotation so player model aligns with the physical body
    if (GLOBALS.PLAYER_MODEL) {
        GLOBALS.PLAYER_MODEL.position.copy(GLOBALS.PLAYER.position).add(new THREE.Vector3(0, -1, 0))
        GLOBALS.PLAYER_MODEL.quaternion.copy(GLOBALS.PLAYER.quaternion)
        GLOBALS.PLAYER_MODEL.quaternion.multiply(new THREE.Quaternion(0, 50, 0)).normalize()

        GLOBALS.PLAYER_MODEL.position.y += 0.2;

        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PLAYER_MODEL_CLONE)
        GLOBALS.PLAYER_MODEL_CLONE = SkeletonUtils.clone(GLOBALS.PLAYER_MODEL);
        GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL_CLONE)
    }

    // handle model movements
    const timeElapsedS = (deltaTime - lastTimeStamp) * 0.001;
    lastTimeStamp = deltaTime;
    let action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
    if (GLOBALS.PLAYER_MODEL.modelReady) {
        if (GLOBALS.PLAYER.inJump) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_JUMP
        } else if (controller["KeyW"].pressed && controller["KeyD"].pressed && controller["KeyA"].pressed && controller["KeyS"].pressed) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
        } else if (controller["KeyW"].pressed && controller["KeyS"].pressed) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
            if (controller["KeyD"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_RIGHT_STRAFE
            else if (controller["KeyA"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_LEFT_STRAFE
        } else if (controller["KeyA"].pressed && controller["KeyD"].pressed) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
            if (controller["KeyW"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STATIONARY_RUNNING
            else if (controller["KeyS"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_BACKWARD_RUNNING
        } else {
            if (controller["KeyW"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STATIONARY_RUNNING
            if (controller["KeyS"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_BACKWARD_RUNNING
            if (controller["KeyD"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_RIGHT_STRAFE
            if (controller["KeyA"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_LEFT_STRAFE
        }

        setAction(action);
        const delta = clock.getDelta();
        GLOBALS.MIXERS.update(delta);
    }
}

var activeAction, lastAction;
const clock = new THREE.Clock();

function setAction(action) {
    if (action != activeAction) {
        lastAction = activeAction;
        activeAction = action;
        let fadeDuration = 0.01
        if (lastAction) {
            fadeDuration = 0.8
            lastAction.fadeOut(fadeDuration)
        }
        activeAction.reset()
        activeAction.fadeIn(fadeDuration)
        activeAction.play()
    }
}

function movePlayerKeyboard(direction, posPlayer, f, movementMultiplier) {
    //if (GLOBALS.PLAYER.launch)
    //    return;

    moving = true;
    if (GLOBALS.PLAYER.mass == 0) {
        posPlayer.add(direction.clone().multiplyScalar(0.02));
        GLOBALS.PLAYER.position.copy(posPlayer);
    } else
        GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), GLOBALS.PLAYER.position)
}

function movePlayerJoystick(direction, f, movementMultiplier, gamepadPressed) {
    GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), GLOBALS.PLAYER.position)
    moving = true;
    gamepadPressed++;
    headBobActive = true;
}

function movePlayerTouch(direction, f, value) {
    GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * value), GLOBALS.PLAYER.position)
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
    GLOBALS.PLAYER.shapes[0].halfExtents.y += value;
    GLOBALS.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    GLOBALS.PLAYER.computeAABB();
    GLOBALS.PLAYER.updateMassProperties();
}

function joystickGel(gamepad, index, gamepadButton, mode, value) {
    if (gamepad.buttons[index].value == 1 && !gamepadButton) {
        GLOBALS.GUN_MODE = mode;
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

function elevator() {

    elevatorCollider();

    setTimeout(() => {
        tweenCamera(1000, GLOBALS.ELEVATOR_DOOR_LEFT.rotation, new THREE.Vector3(0, 0, 0))
        tweenCamera(1000, GLOBALS.ELEVATOR_DOOR_RIGHT.rotation, new THREE.Vector3(0, 0, 0))

        setTimeout(() => {
            $("#loading-parent").css("opacity", 1);
        }, 3000);
    }, 1000);
}

export {
    updatePlayer,
    elevator,
    updateCamera
};