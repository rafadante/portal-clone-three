import { Vector3, Quaternion, Clock } from 'three';
import { portalButton } from '../portal/CreatePortal.js'
import { interactWithItem } from '../events/interaction.js'
import { GLOBALS } from '../../Globals.js';
import { AUDIO, play } from '../audio/Audio.js';
import "./Player.js";
import "./Input.js";
import { INPUT } from './index.js';
import { Crouch, openMenu } from './Input.js';
import * as CANNON from "cannon";
import { playerExitPurpleGel } from './Player.js';
import { MathUtils } from 'three';
import $ from 'jquery';

var gamepadButton1 = false;
var gamepadButton3 = false;
var gamepadButton5 = false;
var gamepadButton6 = false;
var gamepadButton7 = false;
var gamepadButton12 = false;
var gamepadButton15 = false;
var headBobHeight = 0.01;//
let controllerIndex = null;
var finalRotationY;
window.PLAYER_JUMPING_FROM_BLUE_GEL = false;
var rotationMobile = 0.1;
var vv = false;
var lastTimeStamp = 0;
var activeAction, lastAction;
const clock = new Clock();


// Rotation variables
let targetYaw = 0; // Target rotation around Y-axis
let targetPitch = 0; // Target rotation around X-axis
let currentYaw = 0; // Current rotation around Y-axis
let currentPitch = 0; // Current rotation around X-axis
var lerpFactor = 0.1; // Smoothing factor (0 to 1)

var fowardPressed = false;
var backwardPressed = false;
var leftPressed = false;
var rightPressed = false;
var spacePressed = false;


const updatePlayer = function (deltaTime) {

    fowardPressed = false;
    backwardPressed = false;
    leftPressed = false;
    rightPressed = false;
    spacePressed = false;

    var velocity = 1100;

    //ROTATE THE CAMERA WITH TOUCH ON MOBILE
    if (GLOBALS.MOBILE && controllerIndex == null && !GLOBALS.TELEPORTING_TARGET_QUATERNION) {
        velocity = 900;
        GLOBALS.MAIN_CAMERA.rotation.y += (GLOBALS.TARGET_ROTATION_X - GLOBALS.MAIN_CAMERA.rotation.y) * rotationMobile;

        //vertical rotation 
        finalRotationY = (GLOBALS.TARGET_ROTATION_Y - GLOBALS.MAIN_CAMERA.rotation.x);

        if (GLOBALS.MAIN_CAMERA.rotation.x <= 1.5 && GLOBALS.MAIN_CAMERA.rotation.x >= -1.5)
            GLOBALS.MAIN_CAMERA.rotation.x += finalRotationY * rotationMobile;

        if (GLOBALS.MAIN_CAMERA.rotation.x > 1.5) {
            INPUT.blocked_top = true;
            GLOBALS.MAIN_CAMERA.rotation.x = 1.5
        } else
            INPUT.blocked_top = false;

        if (GLOBALS.MAIN_CAMERA.rotation.x < -1.5) {
            INPUT.blocked_bottom = true;
            GLOBALS.MAIN_CAMERA.rotation.x = -1.5
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
            const sensitivity = 2.5;  // Sensibilidade do controle

            /*// Lê os estados dos controles do gamepad
            const xAxis = gamepad.axes[2];  // Movimento horizontal
            const yAxis = gamepad.axes[3];  // Movimento vertical

            // Atualiza a orientação da câmera
            GLOBALS.MAIN_CAMERA.rotation.y -= xAxis * 0.02;
            GLOBALS.MAIN_CAMERA.rotation.x -= yAxis * 0.02;

            // Limita o movimento vertical entre -PI/2 e PI/2 para evitar que a câmera dê uma volta completa
            GLOBALS.MAIN_CAMERA.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, GLOBALS.MAIN_CAMERA.rotation.x));*/


            if (!GLOBALS.TELEPORTING_TARGET_QUATERNION) {
                // Right joystick axes for rotation
                const rightStickX = gamepad.axes[2]; // Left/Right (Yaw)
                const rightStickY = gamepad.axes[3]; // Up/Down (Pitch)

                // Update target rotation based on input
                targetYaw -= rightStickX * sensitivity * deltaTime;
                targetPitch -= rightStickY * sensitivity * deltaTime;

                // Clamp the pitch to prevent over-rotation
                targetPitch = MathUtils.clamp(targetPitch, -Math.PI / 2, Math.PI / 2);

                // Interpolate yaw and pitch towards their target values
                currentYaw += (targetYaw - currentYaw) * lerpFactor;
                currentPitch += (targetPitch - currentPitch) * lerpFactor;

                // Apply the smoothed rotations to the camera
                //GLOBALS.MAIN_CAMERA.rotation.set(currentPitch, currentYaw, GLOBALS.MAIN_CAMERA.rotation.z);

                // Atualiza a orientação da câmera
                GLOBALS.MAIN_CAMERA.rotation.x = currentPitch;
                GLOBALS.MAIN_CAMERA.rotation.y = currentYaw;

                // Limita o movimento vertical entre -PI/2 e PI/2 para evitar que a câmera dê uma volta completa
                GLOBALS.MAIN_CAMERA.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, GLOBALS.MAIN_CAMERA.rotation.x));
            }




            var gamepadPressed = 0;

            if (gamepad.axes[1] < -0.5) {
                fowardPressed = true;
                movePlayerJoystick(forward, f, movementMultiplier, gamepadPressed, deltaTime)
            } if (gamepad.axes[1] > 0.5) {
                backwardPressed = true;
                movePlayerJoystick(backward, f, movementMultiplier, gamepadPressed, deltaTime)
            } if (gamepad.axes[0] < -0.5) {
                leftPressed = true;
                movePlayerJoystick(left, f, movementMultiplier, gamepadPressed, deltaTime)
            } if (gamepad.axes[0] > 0.5) {
                rightPressed = true;
                movePlayerJoystick(right, f, movementMultiplier, gamepadPressed, deltaTime)
            }
        }

        if (GLOBALS.MOBILE && controllerIndex == null) {

            if (INPUT.fwdValue > 0) {
                fowardPressed = true;
                movePlayerTouch(forward, f, INPUT.fwdValue)
            } if (INPUT.bkdValue > 0) {
                backwardPressed = true;
                movePlayerTouch(backward, f, INPUT.bkdValue)
            } if (INPUT.lftValue > 0) {
                leftPressed = true;
                movePlayerTouch(left, f, INPUT.lftValue)
            } if (INPUT.rgtValue > 0) {
                rightPressed = true;
                movePlayerTouch(right, f, INPUT.rgtValue)
            }

            if (INPUT.shouldJump) {
                GLOBALS.PLAYER.inJump = true
                GLOBALS.PLAYER.applyImpulse(GLOBALS.PLAYER.upVectorThree.clone().multiplyScalar(200), GLOBALS.PLAYER.position)
            }

            INPUT.shouldJump = false;
        } else {

            var posPlayer = new Vector3(GLOBALS.PLAYER.position.x, GLOBALS.PLAYER.position.y, GLOBALS.PLAYER.position.z)

            if (INPUT.controller["KeyW"].pressed) {
                fowardPressed = true;
                movePlayerKeyboard(forward, posPlayer, f, movementMultiplier, deltaTime)
            } if (INPUT.controller["KeyS"].pressed) {
                backwardPressed = true;
                movePlayerKeyboard(backward, posPlayer, f, movementMultiplier, deltaTime)
            } if (INPUT.controller["KeyA"].pressed) {
                leftPressed = true;
                movePlayerKeyboard(left, posPlayer, f, movementMultiplier, deltaTime)
            } if (INPUT.controller["KeyD"].pressed) {
                rightPressed = true;
                movePlayerKeyboard(right, posPlayer, f, movementMultiplier, deltaTime)
            }

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
                    GLOBALS.PLAYER.applyImpulse(GLOBALS.PLAYER.upVectorThree.clone().multiplyScalar(200), GLOBALS.PLAYER.position)
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
        GLOBALS.GUN.children[0].position.x += Math.sin(INPUT.headBobTimer * GLOBALS.HEAD_BOB_SPEED) * headBobHeight * deltaTime;
        //GLOBALS.PAINT_GUN.children[0].position.x += Math.sin(INPUT.headBobTimer * GLOBALS.HEAD_BOB_SPEED) * headBobHeight * 700;
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

function animateIdleGun(gun, time) {
    //const time = idleClock.getElapsedTime();
    const breathingAmplitude = 0.0025; // Adjust for subtlety
    const breathingSpeed = 0.001; // How fast the gun moves

    // Apply a gentle up-and-down movement
    gun.position.y += Math.sin(time * breathingSpeed) * breathingAmplitude;
    gun.rotation.x += Math.sin(time * breathingSpeed) * (breathingAmplitude / 2);
}

const updateCamera = function (deltaTime) {

    if (GLOBALS.TELEPORTING_TARGET_QUATERNION) {

        lerpFactor = 1;
        GLOBALS.MAIN_CAMERA.quaternion.slerp(GLOBALS.TELEPORTING_TARGET_QUATERNION, 0.15);

        if (isSlerpComplete(GLOBALS.MAIN_CAMERA.quaternion, GLOBALS.TELEPORTING_TARGET_QUATERNION)) {
            GLOBALS.TELEPORTING_TARGET_QUATERNION = null;
            GLOBALS.MAIN_CAMERA.rotation.z = 0;

            setTimeout(() => {
                lerpFactor = 0.1;
            }, 50);
        }

        GLOBALS.GUN.position.copy(GLOBALS.MAIN_CAMERA.position);
        GLOBALS.GUN.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);
        GLOBALS.PORTAL_GUN_CAMERA.position.copy(GLOBALS.MAIN_CAMERA.position);
        GLOBALS.PORTAL_GUN_CAMERA.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);

        GLOBALS.TARGET_ROTATION_X = GLOBALS.MAIN_CAMERA.rotation.y;
        GLOBALS.TARGET_ROTATION_Y = GLOBALS.MAIN_CAMERA.rotation.x;
        window.targetRotationOnMouseDownX = GLOBALS.TARGET_ROTATION_X;
        window.targetRotationOnMouseDownY = GLOBALS.TARGET_ROTATION_Y;

        targetPitch = GLOBALS.MAIN_CAMERA.rotation.x;
        targetYaw = GLOBALS.MAIN_CAMERA.rotation.y;
    } else {

        if (!window.blockCamRotation) {
            GLOBALS.GUN.quaternion.slerp(GLOBALS.MAIN_CAMERA.quaternion, 0.075);

            animateIdleGun(GLOBALS.GUN, deltaTime); // `gun` is the 3D object for the weapon

        }
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



    //GLOBALS.GUN.quaternion.copy(GLOBALS.PIVOT.quaternion)
    //GLOBALS.PAINT_GUN.quaternion.copy(GLOBALS.PIVOT.quaternion)

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

        GLOBALS.PLAYER_MODEL_CLONE.position.copy(GLOBALS.PLAYER.position).add(GLOBALS.PLAYER.upVectorThree.clone().multiplyScalar(-1))
        //
        GLOBALS.PLAYER_MODEL_CLONE.quaternion.copy(GLOBALS.PLAYER.quaternion)
        GLOBALS.PLAYER_MODEL_CLONE.quaternion.multiply(new Quaternion(0, 50, 0)).normalize()

        //GLOBALS.PLAYER_MODEL.position.y += 0.2;
        GLOBALS.PLAYER_MODEL_CLONE.translateY(0.4)

        /*GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PLAYER_MODEL_CLONE)
        GLOBALS.PLAYER_MODEL_CLONE = SkeletonUtils.clone(GLOBALS.PLAYER_MODEL);

        if ((!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high")) ||
            (window.playerState)) {
            GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL_CLONE);
        }*/

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

    if (GLOBALS.PLAYER_MODEL) {

        var idle = "ANIM_STANDING_IDLE";
        var walking = "ANIM_STATIONARY_RUNNING";
        var walkingB = "ANIM_BACKWARD_RUNNING";
        var jump = "ANIM_JUMP";
        var strafeL = "ANIM_LEFT_STRAFE";
        var strafeR = "ANIM_RIGHT_STRAFE";

        if (GLOBALS.PORTAL_GUN_INITIATE == "none") {
            idle = "ANIM_STANDING_IDLE_NO_GUN";
            walking = "ANIM_STATIONARY_RUNNING_NO_GUN";
            walkingB = "ANIM_BACKWARD_RUNNING_NO_GUN";
            jump = "ANIM_JUMP_NO_GUN";
            strafeL = "ANIM_LEFT_STRAFE_NO_GUN";
            strafeR = "ANIM_RIGHT_STRAFE_NO_GUN";
        }

        let action = GLOBALS.PLAYER_MODEL.animationActions[idle];
        let actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle];

        if (GLOBALS.PLAYER_MODEL.modelReady) {
            if (GLOBALS.PLAYER.inJump && !GLOBALS.PLAYER.inTractor) {
                action = GLOBALS.PLAYER_MODEL.animationActions[jump]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[jump]
            } else if (fowardPressed && leftPressed && rightPressed && backwardPressed) {
                action = GLOBALS.PLAYER_MODEL.animationActions[idle]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle]
            } else if (fowardPressed && backwardPressed) {
                action = GLOBALS.PLAYER_MODEL.animationActions[idle]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle]
                if (rightPressed) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[strafeR]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[strafeR]
                } else if (leftPressed) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[strafeL]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[strafeL]
                }
            } else if (leftPressed && rightPressed) {
                action = GLOBALS.PLAYER_MODEL.animationActions[idle]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle]
                if (fowardPressed) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[walking]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[walking]
                } else if (backwardPressed) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[walkingB]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[walkingB]
                }
            }

            else if (INPUT.fwdValue > 0 && INPUT.rgtValue > 0 && INPUT.lftValue && INPUT.bkdValue > 0) {
                action = GLOBALS.PLAYER_MODEL.animationActions[idle]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle]
            } else if (INPUT.fwdValue > 0 && INPUT.bkdValue > 0) {
                action = GLOBALS.PLAYER_MODEL.animationActions[idle]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle]
                if (INPUT.rgtValue > 0) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[strafeR]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[strafeR]
                } else if (INPUT.lftValue) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[strafeL]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[strafeL]
                }
            } else if (INPUT.lftValue && INPUT.rgtValue > 0) {
                action = GLOBALS.PLAYER_MODEL.animationActions[idle]
                actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[idle]
                if (INPUT.fwdValue > 0) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[walking]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[walking]
                } else if (INPUT.bkdValue > 0) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[walkingB]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[walkingB]
                }
            }

            else {
                if (fowardPressed || INPUT.fwdValue > 0) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[walking]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[walking]
                }
                if (backwardPressed || INPUT.bkdValue > 0) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[walkingB]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[walkingB]
                }
                if (rightPressed || INPUT.rgtValue > 0) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[strafeR]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[strafeR]
                }
                if (leftPressed || INPUT.lftValue) {
                    action = GLOBALS.PLAYER_MODEL.animationActions[strafeL]
                    actionClone = GLOBALS.PLAYER_MODEL_CLONE.animationActions[strafeL]
                }
            }

            setAction(action);
            setActionClone(actionClone);
            const delta = clock.getDelta();

            GLOBALS.MIXERS.update(delta);
            GLOBALS.MIXERS_CLONE.update(delta);
        }
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

var activeActionClone, lastActionClone;

function setActionClone(action) {
    if (action != activeActionClone) {
        lastActionClone = activeActionClone;
        activeActionClone = action;
        let fadeDuration = 0.01
        if (lastActionClone) {
            fadeDuration = 0.8
            lastActionClone.fadeOut(fadeDuration)
        }
        activeActionClone.reset()
        activeActionClone.fadeIn(fadeDuration)
        activeActionClone.play()
    }
}

function movePlayerKeyboard(direction, posPlayer, f, movementMultiplier, delta) {

    GLOBALS.PLAYER.centering = false;

    if (GLOBALS.BLOCK_PLAYER_MOVE)
        return;

    if (AUDIO.WALK.paused && !GLOBALS.PLAYER.inJump && !GLOBALS.PLAYER.lightBridge) {
        AUDIO.WALK.currentTime = 0;
        play(AUDIO.WALK)
    } else if (!GLOBALS.PLAYER.inJump && GLOBALS.PLAYER.lightBridge) {

        if (!AUDIO.WALK.paused)
            AUDIO.WALK.pause()
    }

    GLOBALS.PLAYER_MOVING = true;
    if (GLOBALS.PLAYER.mass == 0) {
        posPlayer.add(direction.clone().multiplyScalar(delta * 1));
        GLOBALS.PLAYER.position.copy(posPlayer);
    } else {
        GLOBALS.STATS_UI.steps += 0.01;
        GLOBALS.PLAYER.applyForce(direction.clone().multiplyScalar(f * movementMultiplier), GLOBALS.PLAYER.position)
    }
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

function joystickMenu(gamepad) {

    if (controllerIndex !== null) {

        gamepad = navigator.getGamepads()[controllerIndex];

        /**if (gamepad.buttons[12].value == 1 && !gamepad.buttons[12].pressed2) {//up
            console.log("up");
            gamepad.buttons[12].pressed2 = true;
            setTimeout(() => {
                gamepad.buttons[12].pressed2 = false;
            }, 100);
        } else if (gamepad.buttons[13].value == 1 && !gamepad.buttons[13].pressed2) {//down
            console.log("down");
            gamepad.buttons[13].pressed2 = true;
            setTimeout(() => {
                gamepad.buttons[13].pressed2 = false;
            }, 100);
        } else if (gamepad.buttons[14].value == 1 && !gamepad.buttons[14].pressed2) {//left
            console.log("left");
            gamepad.buttons[14].pressed2 = true;
            setTimeout(() => {
                gamepad.buttons[14].pressed2 = false;
            }, 100);
        } else if (gamepad.buttons[15].value == 1 && !gamepad.buttons[15].pressed2) {//right
            console.log("right");
            gamepad.buttons[15].pressed2 = true;
            setTimeout(() => {
                gamepad.buttons[15].pressed2 = false;
            }, 100);
        } else */
        if (gamepad.buttons[9].value == 1 && !gamepad.buttons[9].pressed2) {//start
            console.log("start");
            gamepad.buttons[9].pressed2 = true;
            setTimeout(() => {
                gamepad.buttons[9].pressed2 = false;
            }, 100);

            document.exitPointerLock();
            openMenu();
        } else if (gamepad.buttons[0].value == 1 && !gamepad.buttons[0].pressed2) {//A

            if ($("#blocker").css("display") == "block") {
                console.log("A");
                gamepad.buttons[0].pressed2 = true;
                setTimeout(() => {
                    gamepad.buttons[0].pressed2 = false;
                }, 100);

                if (GLOBALS.FINISHED)
                    $("#next-map-btn").trigger("click");
                else
                    $("#settings-close").trigger("click");
            }

        }
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
    updateCamera,
    joystickMenu
};