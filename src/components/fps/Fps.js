import { Vector3, Quaternion, Clock } from 'three';
import { portalButton } from '../portal/CreatePortal.js'
import { interactWithItem } from '../events/events.js'
import { GLOBALS } from '../../Globals.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { AUDIO, play } from '../audio/Audio.js';
import "./Player.js";
import "./Input.js";
import { INPUT } from './index.js';
import { Crouch } from './Input.js';
import * as CANNON from "cannon";
import { playerExitPurpleGel } from './Player.js';

var gamepadButton1 = false;
var gamepadButton3 = false;
var gamepadButton5 = false;
var gamepadButton6 = false;
var gamepadButton7 = false;
var gamepadButton12 = false;
var gamepadButton15 = false;
var headBobHeight = 0.0000006;//
let controllerIndex = null;
var finalRotationY;
window.PLAYER_JUMPING_FROM_BLUE_GEL = false;
var rotationMobile = 0.1;
var vv = false;
var lastTimeStamp = 0;
var activeAction, lastAction;
const clock = new Clock();

const updatePlayer = function (deltaTime) {

    var velocity = 1100;

    //ROTATE THE CAMERA WITH TOUCH ON MOBILE
    if (GLOBALS.MOBILE && controllerIndex == null) {
        velocity = 900;
        GLOBALS.MAIN_CAMERA.rotation.y += (GLOBALS.TARGET_ROTATION_X - GLOBALS.MAIN_CAMERA.rotation.y) * rotationMobile;

        //vertical rotation 
        finalRotationY = (GLOBALS.TARGET_ROTATION_Y - GLOBALS.MAIN_CAMERA.rotation.x);
        if (GLOBALS.MAIN_CAMERA.rotation.x <= 1 && GLOBALS.MAIN_CAMERA.rotation.x >= -1)
            GLOBALS.MAIN_CAMERA.rotation.x += finalRotationY * rotationMobile;

        if (GLOBALS.MAIN_CAMERA.rotation.x > 1) {
            INPUT.blocked_top = true;
            GLOBALS.MAIN_CAMERA.rotation.x = 1
        } else
            INPUT.blocked_top = false;

        if (GLOBALS.MAIN_CAMERA.rotation.x < -1) {
            INPUT.blocked_bottom = true;
            GLOBALS.MAIN_CAMERA.rotation.x = -1
        } else
            INPUT.blocked_bottom = false;
    }

    // gives a bit of air control
    // define directions
    let cameraDirection = new Vector3()
    GLOBALS.MAIN_CAMERA.getWorldDirection(cameraDirection)

    const forward = cameraDirection.projectOnPlane(GLOBALS.PLAYER.upVectorThree).normalize()
    const backward = forward.clone().negate()
    const left = GLOBALS.PLAYER.upVectorThree.clone().cross(forward).normalize()
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
    let movementDirections = INPUT.fwdValue + INPUT.bkdValue + INPUT.lftValue + INPUT.rgtValue;
    let movementMultiplier = 1
    if (movementDirections == 2)
        movementMultiplier = (1 / Math.sqrt(movementDirections))

    // apply forces in WASD directions when pressed

    const f = velocity * GLOBALS.PLAYER.mass * jumpMultiplier * deltaTime * GLOBALS.SPEED;

    if (GLOBALS.GEL_ORANGE)
        GLOBALS.PLAYER.applyForce(forward.clone().multiplyScalar(f * 3), GLOBALS.PLAYER.position)

    if (!GLOBALS.STOP_TIME && !GLOBALS.GEL_ORANGE && !window.PLAYER_JUMPING_FROM_BLUE_GEL) {

        var gamepad;
        if (controllerIndex !== null) {

            gamepad = navigator.getGamepads()[controllerIndex];

            joystickAction(gamepad, 5, gamepadButton5, 1);
            joystickAction(gamepad, 6, gamepadButton6, 0);
            joystickAction(gamepad, 7, gamepadButton7, 2);

            if (gamepad.buttons[3].value == 1 && !gamepadButton3) {
                INPUT.crouched = true;
                Crouch(-0.25);
                gamepadButton3 = true;
                vv = true;
            } else if (gamepad.buttons[3].value == 0) {
                if (INPUT.crouched) {
                    Crouch(0.25);
                }
                gamepadButton3 = false;
                INPUT.crouched = false;
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

            // Ajuste esses valores conforme necessário para controlar a sensibilidade dos movimentos
            const sensitivity = 0.04;  // Sensibilidade do controle

            // Lê os estados dos controles do gamepad
            const xAxis = gamepad.axes[2];  // Movimento horizontal
            const yAxis = gamepad.axes[3];  // Movimento vertical

            // Atualiza a orientação da câmera
            GLOBALS.MAIN_CAMERA.rotation.y -= xAxis * 0.08;
            GLOBALS.MAIN_CAMERA.rotation.x -= yAxis * 0.04;

            // Limita o movimento vertical entre -PI/2 e PI/2 para evitar que a câmera dê uma volta completa
            GLOBALS.MAIN_CAMERA.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, GLOBALS.MAIN_CAMERA.rotation.x));


            var gamepadPressed = 0;

            if (gamepad.axes[1] < -0.5)
                movePlayerJoystick(forward, f, movementMultiplier, gamepadPressed)
            if (gamepad.axes[1] > 0.5)
                movePlayerJoystick(backward, f, movementMultiplier, gamepadPressed)
            if (gamepad.axes[0] < -0.5)
                movePlayerJoystick(left, f, movementMultiplier, gamepadPressed)
            if (gamepad.axes[0] > 0.5)
                movePlayerJoystick(right, f, movementMultiplier, gamepadPressed)
        }

        if (GLOBALS.MOBILE && controllerIndex == null) {

            if (INPUT.fwdValue > 0)
                movePlayerTouch(forward, f, INPUT.fwdValue)
            if (INPUT.bkdValue > 0)
                movePlayerTouch(backward, f, INPUT.bkdValue)
            if (INPUT.lftValue > 0)
                movePlayerTouch(left, f, INPUT.lftValue)
            if (INPUT.rgtValue > 0)
                movePlayerTouch(right, f, INPUT.rgtValue)

            if (INPUT.shouldJump) {
                GLOBALS.PLAYER.inJump = true
                GLOBALS.PLAYER.applyImpulse(GLOBALS.PLAYER.upVectorThree.clone().multiplyScalar(f * 0.25), GLOBALS.PLAYER.position)
            }

            INPUT.shouldJump = false;
        } else {

            var posPlayer = new Vector3(GLOBALS.PLAYER.position.x, GLOBALS.PLAYER.position.y, GLOBALS.PLAYER.position.z)

            if (INPUT.controller["KeyW"].pressed)
                movePlayerKeyboard(forward, posPlayer, f, movementMultiplier)
            if (INPUT.controller["KeyS"].pressed)
                movePlayerKeyboard(backward, posPlayer, f, movementMultiplier)
            if (INPUT.controller["KeyA"].pressed)
                movePlayerKeyboard(left, posPlayer, f, movementMultiplier)
            if (INPUT.controller["KeyD"].pressed)
                movePlayerKeyboard(right, posPlayer, f, movementMultiplier)

            INPUT.shouldJump = false;
            // handle jumping when space bar is pressed

            if (!INPUT.controller["Space"].pressed) {
                jumpPressed = false;
            }

            if (controllerIndex !== null) {
                if (gamepad.buttons[0].value > 0 && !GLOBALS.PLAYER.inJump)
                    INPUT.shouldJump = true;
            } else if (INPUT.controller["Space"].pressed && !GLOBALS.PLAYER.inJump) {
                INPUT.shouldJump = true;
            }

            if (INPUT.shouldJump && !GLOBALS.PLAYER.inJump && !jumpPressed && !blockJump) {
                AUDIO.WALK.pause();
                AUDIO.WALK_LIGHT_BRIDGE.pause();
                jumpPressed = true;
                GLOBALS.PLAYER.inJump = true;

                if (GLOBALS.PLAYER.jumpVelocity) {
                    GLOBALS.PLAYER.linearDamping = 0.01
                    const impulseStrength = -1 * GLOBALS.PLAYER.mass * GLOBALS.PLAYER.jumpVelocity;
                    const impulse = new CANNON.Vec3(
                        impulseStrength * GLOBALS.PLAYER.upVectorThree.x,
                        impulseStrength * GLOBALS.PLAYER.upVectorThree.y,
                        impulseStrength * GLOBALS.PLAYER.upVectorThree.z
                    );

                    GLOBALS.PLAYER.applyImpulse(impulse, GLOBALS.PLAYER.position)
                    GLOBALS.PLAYER.jumpVelocity = null;
                } else {
                    GLOBALS.PLAYER.applyImpulse(GLOBALS.PLAYER.upVectorThree.clone().multiplyScalar(230), GLOBALS.PLAYER.position)
                }


                blockJump = true;
                setTimeout(() => {
                    blockJump = false;
                }, 100);

                if (GLOBALS.PLAYER.customGravity)
                    playerExitPurpleGel();
            }
        }
    }

    updateHeadBob(deltaTime);

    if (GLOBALS.PLAYER_MOVING) {
        GLOBALS.GUN.children[0].position.x += Math.sin(INPUT.headBobTimer * GLOBALS.HEAD_BOB_SPEED) * headBobHeight;
        GLOBALS.PAINT_GUN.children[0].position.x += Math.sin(INPUT.headBobTimer * GLOBALS.HEAD_BOB_SPEED) * headBobHeight * 700;
    }

}

var jumpPressed = false;
var blockJump = false;

// Function to check if the slerp is at the end quaternion
function isSlerpComplete(currentQuat, endQuat, tolerance = 0.001) {
    // Compute the dot product of the current quaternion and the end quaternion
    const dot = Math.abs(currentQuat.dot(endQuat));

    // The dot product should be close to 1 if the quaternions are very similar
    return Math.abs(dot - 1) < tolerance;
}

window.gg = false;

const updateCamera = function (deltaTime) {

    if (GLOBALS.TELEPORTING_TARGET_QUATERNION) {

        GLOBALS.MAIN_CAMERA.quaternion.slerp(GLOBALS.TELEPORTING_TARGET_QUATERNION, 0.15);

        if (isSlerpComplete(GLOBALS.MAIN_CAMERA.quaternion, GLOBALS.TELEPORTING_TARGET_QUATERNION)) {
            GLOBALS.TELEPORTING_TARGET_QUATERNION = null;
            GLOBALS.MAIN_CAMERA.rotation.z = 0;
        }

        GLOBALS.GUN.position.copy(GLOBALS.MAIN_CAMERA.position);
        GLOBALS.GUN.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);
        GLOBALS.PORTAL_GUN_CAMERA.position.copy(GLOBALS.MAIN_CAMERA.position);
        GLOBALS.PORTAL_GUN_CAMERA.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);
    }

    // always look where the camera points
    //GLOBALS.PLAYER.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), GLOBALS.MAIN_CAMERA.rotation.y);

    if (window.nnn && GLOBALS.PLAYER.EULER) {

        const euler = GLOBALS.PLAYER.EULER; // Example: Rotate 90 degrees around Y axis
        euler.y = GLOBALS.MAIN_CAMERA.rotation.y;

        // Convert Euler to Quaternion
        const quaternion = new Quaternion();
        quaternion.setFromEuler(euler);

        GLOBALS.PLAYER.quaternion.copy(quaternion);
        //GLOBALS.MAIN_CAMERA.rotation.x = Math.PI/2;
    } else {
        GLOBALS.PLAYER.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), GLOBALS.MAIN_CAMERA.rotation.y);
    }


    //GLOBALS.GUN.quaternion.slerp(GLOBALS.MAIN_CAMERA.quaternion, GLOBALS.SMOOTHNESS);
    GLOBALS.GUN.quaternion.copy(GLOBALS.PIVOT.quaternion)
    GLOBALS.PAINT_GUN.quaternion.copy(GLOBALS.PIVOT.quaternion)

    if (GLOBALS.MAIN_CAMERA.position.distanceTo(new Vector3(0, 0, 0)) > 100) {
        var obj = GLOBALS.ENTER_DOOR.clone();
        obj.translateZ(1);
        GLOBALS.PLAYER.position.copy(obj.position);
    }

    // copy position and rotation so player model aligns with the physical body
    if (GLOBALS.PLAYER_MODEL) {
        GLOBALS.PLAYER_MODEL.position.copy(GLOBALS.PLAYER.position).add(GLOBALS.PLAYER.upVectorThree.clone().multiplyScalar(-1))
        //
        GLOBALS.PLAYER_MODEL.quaternion.copy(GLOBALS.PLAYER.quaternion)
        GLOBALS.PLAYER_MODEL.quaternion.multiply(new Quaternion(0, 50, 0)).normalize()

        //GLOBALS.PLAYER_MODEL.position.y += 0.2;
        GLOBALS.PLAYER_MODEL.translateY(0.4)

        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PLAYER_MODEL_CLONE)
        GLOBALS.PLAYER_MODEL_CLONE = SkeletonUtils.clone(GLOBALS.PLAYER_MODEL);
        GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL_CLONE);

        GLOBALS.PLAYER_MODEL_CLONE.visible = false;
        GLOBALS.PLAYER_MODEL_CLONE.traverse(c => {
            if (c.material) {
                const clone = c.material.clone();
                c.material = clone;
                c.material.transparent = false;
                c.material.opacity = 1;
                c.material.colorWrite = true;
                c.material.depthWrite = true;
            }
        })
    }

    // handle model movements
    const timeElapsedS = (deltaTime - lastTimeStamp) * 0.001;
    lastTimeStamp = deltaTime;
    let action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
    if (GLOBALS.PLAYER_MODEL.modelReady) {
        if (GLOBALS.PLAYER.inJump && !GLOBALS.PLAYER.inTractor) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_JUMP
        } else if (INPUT.controller["KeyW"].pressed && INPUT.controller["KeyD"].pressed && INPUT.controller["KeyA"].pressed && INPUT.controller["KeyS"].pressed) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
        } else if (INPUT.controller["KeyW"].pressed && INPUT.controller["KeyS"].pressed) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
            if (INPUT.controller["KeyD"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_RIGHT_STRAFE
            else if (INPUT.controller["KeyA"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_LEFT_STRAFE
        } else if (INPUT.controller["KeyA"].pressed && INPUT.controller["KeyD"].pressed) {
            action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STANDING_IDLE
            if (INPUT.controller["KeyW"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STATIONARY_RUNNING
            else if (INPUT.controller["KeyS"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_BACKWARD_RUNNING
        } else {
            if (INPUT.controller["KeyW"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_STATIONARY_RUNNING
            if (INPUT.controller["KeyS"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_BACKWARD_RUNNING
            if (INPUT.controller["KeyD"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_RIGHT_STRAFE
            if (INPUT.controller["KeyA"].pressed)
                action = GLOBALS.PLAYER_MODEL.animationActions.ANIM_LEFT_STRAFE
        }

        setAction(action);
        const delta = clock.getDelta();
        GLOBALS.MIXERS.update(delta);
    }
}

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

    if (GLOBALS.BLOCK_PLAYER_MOVE)
        return;

    if (AUDIO.WALK.paused && !GLOBALS.PLAYER.inJump && !GLOBALS.PLAYER.lightBridge) {

        if (!AUDIO.WALK_LIGHT_BRIDGE.paused)
            AUDIO.WALK_LIGHT_BRIDGE.pause()

        AUDIO.WALK.currentTime = 0;
        play(AUDIO.WALK)
    } else if (AUDIO.WALK_LIGHT_BRIDGE.paused && !GLOBALS.PLAYER.inJump && GLOBALS.PLAYER.lightBridge) {

        if (!AUDIO.WALK.paused)
            AUDIO.WALK.pause()

        AUDIO.WALK_LIGHT_BRIDGE.currentTime = 0;
        play(AUDIO.WALK_LIGHT_BRIDGE)
    }

    GLOBALS.PLAYER_MOVING = true;
    if (GLOBALS.PLAYER.mass == 0) {
        posPlayer.add(direction.clone().multiplyScalar(0.02));
        GLOBALS.PLAYER.position.copy(posPlayer);
    } else
        GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), GLOBALS.PLAYER.position)
}

function movePlayerJoystick(direction, f, movementMultiplier, gamepadPressed) {

    if (GLOBALS.BLOCK_PLAYER_MOVE)
        return;

    GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), GLOBALS.PLAYER.position)
    GLOBALS.PLAYER_MOVING = true;
    gamepadPressed++;
    INPUT.headBobActive = true;
}

function movePlayerTouch(direction, f, value) {

    if (GLOBALS.BLOCK_PLAYER_MOVE)
        return;

    GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * value), GLOBALS.PLAYER.position)
    GLOBALS.PLAYER_MOVING = true;
}

var pressed = [false, false, false, false, false, false, false, false, false, false]

function joystickAction(gamepad, index, gamepadButton, button) {
    if (gamepad.buttons[index].value == 1 && !pressed[index]) {

        portalButton(button, null, GLOBALS.MAIN_CAMERA);

        /*gamepad.vibrationActuator.playEffect("dual-rumble", {
            startDelay: 0,
            duration: 200,
            weakMagnitude: 1.0,
            strongMagnitude: 1.0,
        });*/

        pressed[index] = true;
    } else if (gamepad.buttons[index].value == 0) {
        pressed[index] = false;
    }
}

function joystickGel(gamepad, index, gamepadButton, mode, value) {
    if (gamepad.buttons[index].value == 1 && !gamepadButton) {
        gamepadButton = true;
    } else if (gamepad.buttons[index].value == 0) {
        gamepadButton = false;
    }
}

const updateHeadBob = function (deltaTime) {
    if (INPUT.headBobActive && GLOBALS.PLAYER_MOVING) {
        const wavLength = Math.PI;
        const nextStep = 1 + Math.floor(((INPUT.headBobTimer + 0.0000001) * GLOBALS.HEAD_BOB_SPEED) / wavLength);
        const nextStepTime = nextStep * wavLength / GLOBALS.HEAD_BOB_SPEED;
        INPUT.headBobTimer = Math.min(INPUT.headBobTimer + deltaTime, nextStepTime);
    }
}

window.addEventListener("gamepadconnected", (event) => {
    const gamepad = event.gamepad;
    controllerIndex = gamepad.index;
});

window.addEventListener("gamepaddisconnected", (event) => {
    controllerIndex = null;
});

export {
    updatePlayer,
    updateCamera
};