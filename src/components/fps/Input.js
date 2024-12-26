import {
    Vector3
} from 'three';
import $ from 'jquery';
import nipplejs from 'nipplejs';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { stateDoor } from '../door/Door.js';
import {
    GLOBALS
} from '../../Globals.js';
import { AUDIO, play } from '../audio/Audio.js';
import {
    portalButton
} from '../portal/CreatePortal.js';
import {
    tweenCamera
} from '../../Utils.js';
import {
    interactWithItem
} from '../events/events.js';
import { INPUT } from './index.js';

var allowEnterFPS = true;

if (GLOBALS.MOBILE) {
    //var controlsDevice = new DeviceOrientationControls(GLOBALS.MAIN_CAMERA);
    window.targetRotationOnMouseDownX = 0;
    window.targetRotationOnMouseDownY = 0;
    var mouseX = 0;
    var mouseXOnMouseDown = 0;
    var mouseY = 0;
    var mouseYOnMouseDown = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var deltaX2, touchX2;
    var touches = 0;
    let joyManager;

    document.getElementById("camera2").addEventListener('touchstart', onDocumentTouchStart, false);
    document.getElementById("camera2").addEventListener('touchmove', onDocumentTouchMove, false);
    document.getElementById("camera2").addEventListener('touchup', onDocumentTouchUp, false);

    function onDocumentTouchUp(event) {
        touches = 0;
    }

    function onDocumentTouchStart(event) {
        if (event.touches.length > 0) {
            touches = event.touches.length - 1;

            if (touches == 0 || touches == 1) {
                mouseXOnMouseDown = event.touches[touches].pageX - windowHalfX;
                window.targetRotationOnMouseDownX = GLOBALS.TARGET_ROTATION_X;

                mouseYOnMouseDown = event.touches[touches].pageY - windowHalfY;
                window.targetRotationOnMouseDownY = GLOBALS.TARGET_ROTATION_Y;
            }
        }
    }

    function onDocumentTouchMove(event) {
        if (event.touches.length > 0 && (touches == 0 || touches == 1)) {
            mouseX = event.touches[touches].pageX - windowHalfX;
            GLOBALS.TARGET_ROTATION_X = window.targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * (-0.01); //camera speed

            mouseY = event.touches[touches].pageY - windowHalfY;
            deltaX2 = event.touches[touches].pageY - touchX2;
            touchX2 = event.touches[touches].pageY;

            if (deltaX2 > 0) {
                if (!INPUT.blocked_bottom)
                    GLOBALS.TARGET_ROTATION_Y = window.targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
            } else {
                if (!INPUT.blocked_top)
                    GLOBALS.TARGET_ROTATION_Y = window.targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
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
                INPUT.fwdValue = Math.abs(forward)
                INPUT.bkdValue = 0
            } else if (forward < 0) {
                INPUT.fwdValue = 0
                INPUT.bkdValue = Math.abs(forward)
            }

            if (turn > 0) {
                INPUT.lftValue = 0
                INPUT.rgtValue = Math.abs(turn)
            } else if (turn < 0) {
                INPUT.lftValue = Math.abs(turn)
                INPUT.rgtValue = 0
            }

            INPUT.headBobActive = true;
        })

        joyManager['0'].on('end', function (evt) {
            INPUT.bkdValue = 0
            INPUT.fwdValue = 0
            INPUT.lftValue = 0
            INPUT.rgtValue = 0
            // headBobActive = false;
            GLOBALS.PLAYER_MOVING = false;
            INPUT.headBobTimer = 0;
            //headBobActive = false;

            tweenCamera(500, GLOBALS.GUN.children[0].position, new Vector3(0, 0, 0))
            touches = 0;
        })
    }
} else {
    controlsLock();
}

var holdDown = false;

document.addEventListener('keydown', (event) => {

    //if (event.code == "ControlLeft" && !crouched)

    if (GLOBALS.FPS_MODE && allowEnterFPS) {
        if (INPUT.controller[event.code])
            INPUT.controller[event.code].pressed = true;

        INPUT.headBobActive = true;

        if (event.code == "ControlLeft" && !INPUT.crouched) {
            INPUT.crouched = true;
            Crouch(-0.25);
        } else if (event.code == "KeyE" && !holdDown) {
            holdDown = true;
            interactWithItem();
        }

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

window.blockCamRotation = false;
var timeout;

const pitchLimit = Math.PI / 2;  // Max vertical rotation (90 degrees)
const yawLimit = Math.PI * 2;    // Full horizontal rotation (360 degrees)

document.body.addEventListener('mousemove', (event) => {

    if (document.pointerLockElement === document.body && !GLOBALS.PAUSED) {

        GLOBALS.MAIN_CAMERA.rotation.y -= event.movementX / 1000;
        GLOBALS.MAIN_CAMERA.rotation.x -= event.movementY / 1000;

        // Apply vertical rotation limit (prevent camera from rotating beyond certain pitch)
        GLOBALS.MAIN_CAMERA.rotation.x = Math.max(
            -pitchLimit, Math.min(pitchLimit, GLOBALS.MAIN_CAMERA.rotation.x)
        );

        // Apply horizontal rotation limit (wrap around to avoid large values)
        if (GLOBALS.MAIN_CAMERA.rotation.y > Math.PI) {
            GLOBALS.MAIN_CAMERA.rotation.y -= yawLimit; // Wrap around if rotation exceeds 360°
        } else if (GLOBALS.MAIN_CAMERA.rotation.y < -Math.PI) {
            GLOBALS.MAIN_CAMERA.rotation.y += yawLimit; // Wrap around if rotation goes below -360°
        }

        if (!GLOBALS.TELEPORTING_TARGET_QUATERNION)
            GLOBALS.GUN.quaternion.slerp(GLOBALS.MAIN_CAMERA.quaternion, 0.075);

        window.blockCamRotation = true;

        clearTimeout(timeout);
        timeout = setTimeout(function () { window.blockCamRotation = false; }, 10);
    }

});

var started = false;

$("body").on('click', '#settings-close', function () {
    if (GLOBALS.FPS_MODE && allowEnterFPS) {

        if (!started)
            play(AUDIO.AMBIENT);

        started = true;
        document.getElementById('blocker').style.display = 'none';
        GLOBALS.PAUSED = false;

        setTimeout(() => {
            GLOBALS.ALLOW_PLACE_PORTALS = true;
        }, 1000);

        INPUT.controller = {
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

        GLOBALS.PAUSED = false;

        if (!GLOBALS.MOBILE) {
            document.body.requestPointerLock();
            //openFullscreen();
        } else {
            $("#blocker").css("display", "none");
            $("#mobile-controls").css("display", "block");
            openFullscreen();
        }

        $("#container").css("filter", "none");

        if (!GLOBALS.DOOR_OPEN_STATE) {
            GLOBALS.DOOR_OPEN_STATE = true;

            setTimeout(() => {
                tweenCamera(1000, GLOBALS.CORRIDOR_ENTER.getObjectByName("rightDoor").rotation,
                    new Vector3(
                        GLOBALS.CORRIDOR_ENTER.getObjectByName("rightDoor").rotation.x,
                        Math.PI / 8,
                        GLOBALS.CORRIDOR_ENTER.getObjectByName("rightDoor").rotation.z))

                tweenCamera(1000, GLOBALS.CORRIDOR_ENTER.getObjectByName("leftDoor").rotation,
                    new Vector3(
                        GLOBALS.CORRIDOR_ENTER.getObjectByName("leftDoor").rotation.x,
                        Math.PI * 0.9,
                        GLOBALS.CORRIDOR_ENTER.getObjectByName("leftDoor").rotation.z))

                setTimeout(() => {
                    GLOBALS.BODY_ELEVATOR.position.y = 10000;
                }, 500);

                setTimeout(() => {
                    stateDoor(1000, true, false, GLOBALS.ENTER_DOOR)
                }, 1000);
            }, 500);
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

// Detect pointer lock changes
document.addEventListener('pointerlockchange', () => {
    if (document.pointerLockElement === document.body) {
        console.log('Pointer is now locked');
        // The pointer is locked, you can enable FPS controls or hide the cursor
    } else {
        console.log('Pointer is unlocked');
        // The pointer is unlocked, you can restore the cursor or stop FPS controls
        $("#container").css("filter", "blur(2px)")
        document.getElementById('blocker').style.display = 'block';
        GLOBALS.ALLOW_PLACE_PORTALS = false;
        allowEnterFPS = false;
        GLOBALS.PAUSED = true;

        setTimeout(() => {
            allowEnterFPS = true;
        }, 1500);
    }
});

function controlsLock() {
    /*GLOBALS.POINTER_CONTROLS = new PointerLockControls(GLOBALS.MAIN_CAMERA, document.body);
    GLOBALS.POINTER_CONTROLS.pointerSpeed = 1;

    GLOBALS.POINTER_CONTROLS.addEventListener('lock', function () {

        play(AUDIO.AMBIENT);
        
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
    });*/
}

document.addEventListener('keyup', (event) => {

    if (!GLOBALS.FPS_MODE)
        return;

    holdDown = false;

    if (GLOBALS.FPS_MODE && allowEnterFPS) {

        if (INPUT.controller[event.code])
            INPUT.controller[event.code].pressed = false;

        GLOBALS.PLAYER_MOVING = false;
        INPUT.headBobTimer = 0;
        //headBobActive = false;

        tweenCamera(300, GLOBALS.GUN.children[0].position, new Vector3(0, 0, 0))
        //tweenCamera(300, GLOBALS.PAINT_GUN.children[0].position, new Vector3(0, 0, 0))

        if (INPUT.crouched) {
            INPUT.crouched = false;
            Crouch(0.25);
        }
    }

    AUDIO.WALK.pause();
});

$("body").on('pointerdown', '#crouch', function () {
    INPUT.crouched = true;
    Crouch(-0.25);
})

$("body").on('pointerup', '#crouch', function () {
    Crouch(0.25);
})

document.addEventListener('mousedown', (event) => {
    if (!GLOBALS.MOBILE && document.pointerLockElement !== null)
        portalButton(event.button, null, GLOBALS.MAIN_CAMERA)
});

//LEFT PORTAL MOBILE
document.getElementById("portal_l").addEventListener('pointerdown', portal_l_Touch, false);

function portal_l_Touch() {
    GLOBALS.ALLOW_PLACE_PORTALS = true;
    portalButton(0, null, GLOBALS.MAIN_CAMERA);
}
//RIGHT PORTAL MOBILE
document.getElementById("portal_r").addEventListener('pointerdown', portal_r_Touch, false);

function portal_r_Touch() {
    GLOBALS.ALLOW_PLACE_PORTALS = true;
    portalButton(2, null, GLOBALS.MAIN_CAMERA)
}
//JUMP MOBILE
document.getElementById("jump").addEventListener('pointerdown', jumpTouch, false);

function jumpTouch() {
    // handle jumping when space bar is pressed
    if (!GLOBALS.PLAYER.inJump)
        INPUT.shouldJump = true;
}

function Crouch(value) {
    GLOBALS.PLAYER.shapes[0].halfExtents.y += value;
    GLOBALS.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    GLOBALS.PLAYER.computeAABB();
    GLOBALS.PLAYER.updateMassProperties();
}

export { Crouch }