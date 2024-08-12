import { GLOBALS } from "../../Globals.js";
import {
    AUDIO,
    play
} from "../audio/Audio.js";
import { stateDoor } from "../door/Door.js";
import { deletePortal } from "../portal/CreatePortal.js";

function laserFieldState(obj) {
    obj.item.userData.state = !obj.item.userData.state;
    obj.item.continuous.visible = !obj.item.continuous.visible;

    if (obj.item.userData.state)
        GLOBALS.CANNON_WORLD.addBody(obj.item.bodyLaserField);
    else
        GLOBALS.CANNON_WORLD.removeBody(obj.item.bodyLaserField);
}

function lightBridgeState(obj) {
    obj.item.userData.state = !obj.item.userData.state;
    obj.item.continuous.visible = !obj.item.continuous.visible;

    if (obj.item.userData.state)
        GLOBALS.CANNON_WORLD.addBody(obj.item.bodyBridge);
    else
        GLOBALS.CANNON_WORLD.removeBody(obj.item.bodyBridge);

    if (obj.item.clone) {
        if (obj.item.clone.bodyBridge) {
            obj.item.clone.visible = obj.item.continuous.visible;

            if (obj.item.userData.state)
                GLOBALS.CANNON_WORLD.addBody(obj.item.clone.bodyBridge);
            else
                GLOBALS.CANNON_WORLD.removeBody(obj.item.clone.bodyBridge);
        }
    }
}

function tractorStates(obj) {
    if (obj.item.userData.triggers == "State" || obj.item.userData.triggers == "Both") {
        obj.item.userData.state = !obj.item.userData.state;
        obj.item.continuous.visible = !obj.item.continuous.visible;

        if (obj.item.clone)
            obj.item.clone.visible = obj.item.continuous.visible;
    }

    if (obj.item.userData.triggers == "Direction" || obj.item.userData.triggers == "Both") {
        obj.item.userData.reversed = !obj.item.userData.reversed;

        if (obj.item.userData.reversed)
            obj.item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE;
        else
            obj.item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM;

        if (obj.item.clone)
            obj.item.clone.material = obj.item.continuous.material;
    }
}

function dispenserSpawn(item) {
    item.body.position.set(item.dispenserPosition.x, item.dispenserPosition.y - 1, item.dispenserPosition.z);
    item.body.mass = item.body.initialMass;
    item.body.allowSleep = true;

    // Velocity
    item.body.velocity.setZero();
    item.body.initVelocity.setZero();
    item.body.angularVelocity.setZero();
    item.body.initAngularVelocity.setZero();

    // Force
    item.body.force.setZero();
    item.body.torque.setZero();

    item.body.wakeUp();
}

function wakeUpAll() {
    for (let d of GLOBALS.DYNAMIC_OBJECTS) {
        d.wakeUp();
    }
}

function respawn(d) {
    if (d.name.includes("gel")) return;

    d.repawning = true;

    var time = 2500;
    var time2 = 0;

    if (d.name == "player") {

        document.getElementById("death-screen").style.backgroundColor = "rgb(255, 0, 0)";
        document.getElementById("death-screen").style.opacity = 0.75;

        AUDIO.DEATH.currentTime = 0;
        play(AUDIO.DEATH);
        time = 500;
        time2 = 500;

        deletePortal(0)
        deletePortal(1)
        GLOBALS.PORTAL_BOX = [];
    }

    setTimeout(() => {
        d.repawning = false;

        // Velocity
        d.velocity.setZero();
        d.initVelocity.setZero();
        d.angularVelocity.setZero();
        d.initAngularVelocity.setZero();

        // Force
        d.force.setZero();
        d.torque.setZero();

        d.position.copy(d.spawnPosition);

        if (d.name != "player")
            d.mass = 0;

        setTimeout(() => {

            if (d.name != "player") {
                if (d.state == "once") {
                    d.mass = 0;
                } else {
                    d.mass = 5;
                }

                d.wakeUp()
            } else {
                document.getElementById("death-screen").style.opacity = 0;
            }
        }, time);
    }, time2);
}

function levelEnteredFunction() {
    if (!GLOBALS.LEVEL_ENTERED) {
        if (GLOBALS.ENTER_DOOR.box3.containsPoint(GLOBALS.PLAYER.position)) {
            GLOBALS.LEVEL_ENTERED = true;
            setTimeout(() => {
                for (var i = 0; i < GLOBALS.BOX_BODY.length; i++) {
                    if (GLOBALS.BOX_BODY[i].item.userData.opened)
                        dispenserSpawn(GLOBALS.BOX_BODY[i].item);
                }
            }, 1000);
            stateDoor(1000, false, true, GLOBALS.ENTER_DOOR)
        }
    }
}

export {
    laserFieldState,
    tractorStates,
    lightBridgeState,
    dispenserSpawn,
    levelEnteredFunction,
    wakeUpAll,
    respawn
}