import { GLOBALS } from '../../Globals.js';
import { createLightBridges } from '../continuous/Continuous.js';
import { ContinuousTrigger } from '../continuous/Continuous.js';
import $ from 'jquery';
import { laserEmitterRaycast } from '../lasers/Laser.js';
import { Color, Vector3, Box3 } from 'three';

function checkToUpdateContinuous() {

    for (var i = 0; i < GLOBALS.TRACTOR_BEAM_RAYCASTER.length; i++) {
        createLightBridges("tractor_beam", GLOBALS.TRACTOR_BEAM_RAYCASTER[i],
            GLOBALS.TRACTOR_BEAM_RAYCASTER[i].item, null, true, i);
    }

    for (var i = 0; i < GLOBALS.LIGHT_BRIDGE_RAYCASTER.length; i++) {

        createLightBridges(
            "light_bridge",
            GLOBALS.LIGHT_BRIDGE_RAYCASTER[i],
            GLOBALS.LIGHT_BRIDGE_RAYCASTER[i].item,
            null,
            true,
            i);

        ContinuousTrigger(
            GLOBALS.LIGHT_BRIDGE_RAYCASTER[i].item,
            GLOBALS.LIGHT_BRIDGE_RAYCASTER[i].item.userData.triggers,
            $("#light-bridge-trigger"),
            "light_bridge");
    }

    for (var i = 0; i < GLOBALS.LASER_FIELD_RAYCASTER.length; i++) {

        createLightBridges(
            "laser_field",
            GLOBALS.LASER_FIELD_RAYCASTER[i],
            GLOBALS.LASER_FIELD_RAYCASTER[i].item,
            GLOBALS.ITEMS_ADDED.getObjectByName("laser_field"),
            true,
            i);

        ContinuousTrigger(
            GLOBALS.LASER_FIELD_RAYCASTER[i].item,
            GLOBALS.LASER_FIELD_RAYCASTER[i].item.userData.triggers,
            $("#laser-field-trigger"),
            "laser_field");
    }

    for (var i = 0; i < GLOBALS.FIZZLER_RAYCASTER.length; i++) {

        createLightBridges(
            "fizzler",
            GLOBALS.FIZZLER_RAYCASTER[i],
            GLOBALS.FIZZLER_RAYCASTER[i].item,
            GLOBALS.ITEMS_ADDED.getObjectByName("fizzler"),
            true,
            i);

        ContinuousTrigger(
            GLOBALS.FIZZLER_RAYCASTER[i].item,
            GLOBALS.FIZZLER_RAYCASTER[i].item.userData.triggers,
            $("#fizzler-trigger"),
            "fizzler");
    }

    for (var i = 0; i < GLOBALS.GLASS_RAYCASTER.length; i++) {

        createLightBridges(
            "glass",
            GLOBALS.GLASS_RAYCASTER[i],
            GLOBALS.GLASS_RAYCASTER[i].item,
            null,
            true,
            i);

        ContinuousTrigger(
            GLOBALS.GLASS_RAYCASTER[i].item,
            GLOBALS.GLASS_RAYCASTER[i].item.userData.triggers,
            $("#glass-trigger"),
            "glass");
    }

    for (var i = 0; i < GLOBALS.LASER_EMITTER_RAYCASTER.length; i++) {
        laserEmitterRaycast(
            GLOBALS.LASER_EMITTER_RAYCASTER[i].item,
            true,
            GLOBALS.LASER_EMITTER_RAYCASTER[i],
            i);
    }

    var bb = new Box3(); // for re-use
    bb.setFromObject(GLOBALS.EXIT_DOOR.getObjectByName("trigger"));
    GLOBALS.EXIT_DOOR.bb = bb;
    GLOBALS.EXIT_DOOR.add(GLOBALS.EXIT_DOOR.getObjectByName("trigger"));

    var bb = new Box3(); // for re-use
    bb.setFromObject(GLOBALS.ENTER_DOOR.getObjectByName("trigger"));
    GLOBALS.ENTER_DOOR.bb = bb;
    GLOBALS.ENTER_DOOR.add(GLOBALS.ENTER_DOOR.getObjectByName("trigger"));

    GLOBALS.ENTER_DOOR.getObjectByName("trigger").material.color = new Color(0x00ff00);
    GLOBALS.EXIT_DOOR.getObjectByName("trigger").material.color = new Color(0x00ff00);
    window.allowTest = true;

    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[i].exists) {

            if (GLOBALS.ENTER_DOOR.bb.containsPoint(GLOBALS.PLANE_USER_DATA[i].position)) {
                GLOBALS.ENTER_DOOR.getObjectByName("trigger").material.color = new Color(0xff0000);
                window.allowTest = false;
            }

            if (GLOBALS.EXIT_DOOR.bb.containsPoint(GLOBALS.PLANE_USER_DATA[i].position)) {
                GLOBALS.EXIT_DOOR.getObjectByName("trigger").material.color = new Color(0xff0000);
                window.allowTest = false;
            }
        }
    }
}

window.allowTest = true;

export {
    checkToUpdateContinuous
}