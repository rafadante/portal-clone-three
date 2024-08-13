import {
    Vector3
} from 'three';
import * as CANNON from 'cannon';
import {
    GLOBALS
} from '../../Globals.js';
import { AUDIO, play } from '../audio/Audio.js';
import { faithPlate } from '../faithPlate/FaithPlate.js';

var upVector;
var slipperyMaterial = new CANNON.Material();
slipperyMaterial.friction = 0.00;

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
GLOBALS.PLAYER.invMass = 0.1;
GLOBALS.PLAYER.invMassSolve = 0.1;

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

GLOBALS.PLAYER.addEventListener("collide", function (event) {

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
        AUDIO.JUMP.currentTime = 0;
        play(AUDIO.JUMP)
    }
})

GLOBALS.CANNON_WORLD.addEventListener("postStep", (e) => {

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

                GLOBALS.PLAYER.inJump = (contactNormal.dot(upVector) <= 0.5);

                /*if (!GLOBALS.PLAYER.inJump) {
                    window.PLAYER_JUMPING_FROM_BLUE_GEL = false;
                }*/

                break;
            }
        }
    }

    GLOBALS.PLAYER_MOVING = GLOBALS.PLAYER.inJump;
})

GLOBALS.DYNAMIC_OBJECTS.push(GLOBALS.PLAYER);

for (let d of GLOBALS.DYNAMIC_OBJECTS) {
    d.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
    d.collisionFilterMask = GLOBALS.CGROUP_ALL
}