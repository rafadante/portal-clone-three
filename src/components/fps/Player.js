import { Euler, Vector3 } from 'three';
import * as CANNON from 'cannon';
import { GLOBALS } from '../../Globals.js';
import { AUDIO, fadeAudio, play, addPositionalAudio } from '../audio/Audio.js';
import { faithPlate } from '../faithPlate/FaithPlate.js';
import { gelTrigger } from '../gels/Gels.js';
import { tweenCamera } from '../../Utils.js';
import { platformPostStep } from '../platforms/Platform.js';

var slipperyMaterial = new CANNON.Material();
slipperyMaterial.friction = 0.025;

// define shape
let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5 / 2, 2 / 3.2, 0.5 / 2));
physicsShape.height = 1.25;
physicsShape.width = 0.5;

// define the physical body attributes
GLOBALS.PLAYER = new CANNON.Body({
    mass: 50,
    material: slipperyMaterial
});
GLOBALS.PLAYER.allowSleep = false;
GLOBALS.PLAYER.addShape(physicsShape);
GLOBALS.PLAYER.position.set(5, 5, 5);
GLOBALS.PLAYER.linearDamping = 0.999;
GLOBALS.PLAYER.name = "player";

// keep the player upright
GLOBALS.PLAYER.angularDamping = 1

// set additional properties
GLOBALS.PLAYER.inJump = true
GLOBALS.PLAYER.DIR = 1;

// construct the physical body
GLOBALS.PLAYER.updateMassProperties()
GLOBALS.CANNON_WORLD.addBody(GLOBALS.PLAYER);

// normal collision events don't happen consistently - will stop once an object is stable on the ground
// so need to check contacts to detect if grounded or not
// https://github.com/schteppe/cannon.js/issues/313

GLOBALS.PLAYER.upVector = new CANNON.Vec3(0, 1, 0);
GLOBALS.PLAYER.upVectorThree = new Vector3(0, 1, 0);
let contactNormal = new CANNON.Vec3(0, 0, 0);

GLOBALS.PLAYER.addEventListener("collide", function (event) {

    if (event.body.name == "gel") {
        gelTrigger(event);
    }

    if (GLOBALS.PLAYER.ROTATING)
        return;

    if (event.body.type == "orange") {
        GLOBALS.SPEED = 3;
        GLOBALS.HEAD_BOB_SPEED = 10;
    } else {
        if (event.target.OrangeContact) {
            event.target.OrangeContact = false;
            GLOBALS.SPEED = 1;
            GLOBALS.HEAD_BOB_SPEED = 6;
            AUDIO.WALK.volume = 0.25;
            fadeAudio(AUDIO.PROPULSION)
        }
    }

    if (event.body.type != "purple") {
        if (GLOBALS.PLAYER.customGravity) {
            clearTimeout(event.target.timeout);
            event.target.timeout = setTimeout(() => {
                playerExitPurpleGel();
            }, 10);
        }
    }

    if (event.body.type != "blue") {
        if (event.target.impactVelocity) {
            clearTimeout(event.target.timeout);
            event.target.timeout = setTimeout(() => {
                event.target.impactVelocity = null;
                event.target.jumpVelocity = null;
                event.target.impactSide = null;
            }, 10);
        }
    }

    GLOBALS.PLAYER.looping = false;

    if (event.body.name == "faith_plate" && !GLOBALS.PLAYER.block) {

        GLOBALS.PLAYER.block = true;
        setTimeout(() => {
            GLOBALS.PLAYER.block = false;
        }, 10);

        clearTimeout(AUDIO.AERIAL.timeout)
        AUDIO.AERIAL.volume = 1;

        if (AUDIO.AERIAL.duration > 0 && !AUDIO.AERIAL.paused) {
            //already playing
        } else {
            AUDIO.AERIAL.currentTime = 0;
            AUDIO.AERIAL.play()
        }

        GLOBALS.BLOCK_PLAYER_MOVE = true;
        GLOBALS.PLAYER.inJump = true;
        GLOBALS.PLAYER_MOVING = true;
        GLOBALS.PLAYER.linearDamping = 0.01
        faithPlate(event.body, event.target)
    }

    if (event.contact.bj.name == "light_bridge") {
        GLOBALS.PLAYER.lightBridge = true;
    } else {
        GLOBALS.PLAYER.lightBridge = false;
    }

    if (GLOBALS.PLAYER.inJump) {
        play(AUDIO.JUMP)
    }

    //addPositionalAudio('audio-repulsion', GLOBALS.PLAYER, false, false, true, 20, 'soundRepulsion');
})

GLOBALS.CANNON_WORLD.addEventListener("postStep", (e) => {

    platformPostStep();

    GLOBALS.PLAYER.inJump = true;

    if (GLOBALS.BLOCK_PLAYER_MOVE)
        return

    if (GLOBALS.CANNON_WORLD.contacts.length > 0) {

        for (let contact of GLOBALS.CANNON_WORLD.contacts) {

            if (contact.bi.collisionResponse == 0 || contact.bj.collisionResponse == 0) continue;

            if (contact.bi.id == GLOBALS.PLAYER.id || contact.bj.id == GLOBALS.PLAYER.id) {
                if (contact.bi.id == GLOBALS.PLAYER.id) {
                    // contact.ni.negate(contactNormal);
                    contactNormal = new Vector3(contact.ni.x * -1, contact.ni.y * -1, contact.ni.z * -1)
                } else {
                    // contact.ni.copy(contactNormal);
                    contactNormal = contact.ni
                }

                GLOBALS.PLAYER.inJump = (contactNormal.dot(GLOBALS.PLAYER.upVector) <= 0.5);

                /*if (!GLOBALS.PLAYER.inJump) {
                    window.PLAYER_JUMPING_FROM_BLUE_GEL = false;
                }*/

                break;
            }
        }
    }

    GLOBALS.PLAYER_MOVING = GLOBALS.PLAYER.inJump;

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {
        d.firstCollisionHandled = false;
    }
})

GLOBALS.DYNAMIC_OBJECTS.push(GLOBALS.PLAYER);

for (let d of GLOBALS.DYNAMIC_OBJECTS) {
    d.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
    d.collisionFilterMask = GLOBALS.CGROUP_ALL
}

function playerExitPurpleGel() {

    GLOBALS.HEAD_BOB_SPEED = 6;
    GLOBALS.PLAYER.PURPLE_CONTACT = false;
    GLOBALS.PLAYER.customGravity = null;
    GLOBALS.PLAYER.side = null;
    GLOBALS.PLAYER.EULER = null;
    GLOBALS.PLAYER.DIR = 1;
    const index = GLOBALS.CUSTOM_GRAVITY.indexOf(GLOBALS.PLAYER);
    GLOBALS.SPEED = 1;
    if (index > -1) {

        AUDIO.WALK_PAINT.pause();
        AUDIO.WALK = AUDIO.WALK_NORMAL;

        GLOBALS.PLAYER.EULER = null;
        GLOBALS.CUSTOM_GRAVITY.splice(index, 1);

        GLOBALS.PLAYER.upVector = new CANNON.Vec3(0, 1, 0);
        GLOBALS.PLAYER.upVectorThree = new Vector3(0, 1, 0);
        window.nnn = false;

        GLOBALS.POINTER_CONTROLS.maxPolarAngle = Math.PI;
        GLOBALS.POINTER_CONTROLS._euler = new Euler(0, 0, 0, 'YXZ');

        // Velocity
        GLOBALS.PLAYER.velocity.setZero();
        GLOBALS.PLAYER.initVelocity.setZero();
        GLOBALS.PLAYER.angularVelocity.setZero();
        GLOBALS.PLAYER.initAngularVelocity.setZero();

        // Force
        GLOBALS.PLAYER.force.setZero();
        GLOBALS.PLAYER.torque.setZero();

        tweenCamera(400, GLOBALS.MAIN_CAMERA_GROUP.rotation, new Vector3(0, 0, 0))

        setTimeout(() => {

            GLOBALS.MAIN_CAMERA.position.copy(GLOBALS.MAIN_CAMERA_GROUP.position)
            GLOBALS.MAIN_CAMERA_GROUP.position.set(0, 0, 0)

            GLOBALS.PIVOT = GLOBALS.MAIN_CAMERA;
        }, 500);
    }
}

function resetPlayerBody() {
    // Position
    GLOBALS.PLAYER.position.set(0,0,0);
    GLOBALS.PLAYER.previousPosition.set(0,0,0);
    GLOBALS.PLAYER.interpolatedPosition.set(0,0,0);
    GLOBALS.PLAYER.initPosition.set(0,0,0);

    // orientation
    GLOBALS.PLAYER.quaternion.set(0, 0, 0, 1);
    GLOBALS.PLAYER.initQuaternion.set(0, 0, 0, 1);
    //GLOBALS.PLAYER.previousQuaternion.set(0, 0, 0, 1);
    GLOBALS.PLAYER.interpolatedQuaternion.set(0, 0, 0, 1);

    // Velocity
    GLOBALS.PLAYER.velocity.set(0,0,0);
    GLOBALS.PLAYER.initVelocity.set(0,0,0);
    GLOBALS.PLAYER.angularVelocity.set(0,0,0);
    GLOBALS.PLAYER.initAngularVelocity.set(0,0,0);

    // Force
    GLOBALS.PLAYER.force.set(0,0,0);
    GLOBALS.PLAYER.torque.set(0,0,0);

    GLOBALS.PLAYER.inJump = false;
}

export {
    playerExitPurpleGel,
    resetPlayerBody
}