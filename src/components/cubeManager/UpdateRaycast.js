import { GLOBALS } from '../../Globals.js';
import { createLightBridges } from '../continuous/Continuous.js';
import { ContinuousTrigger } from '../continuous/Continuous.js';
import $ from 'jquery';
import { laserEmitterRaycast } from '../lasers/Laser.js';
import { Color, Box3 } from 'three';
import { AddGoo } from '../goo/Goo.js';

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

    for (var j = 0; j < GLOBALS.BOUNDING_BOX.length; j++) {
        GLOBALS.BOUNDING_BOX[j].platform.material.color = new Color(0x00ff00);
    }

    window.allowTest = true;

    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[i].exists) {

            //ENTER CORRIDOR
            if (GLOBALS.ENTER_DOOR.bb.containsPoint(GLOBALS.PLANE_USER_DATA[i].position)) {
                GLOBALS.ENTER_DOOR.getObjectByName("trigger").material.color = new Color(0xff0000);
                window.allowTest = false;
            }

            //EXIT CORRIDOR
            if (GLOBALS.EXIT_DOOR.bb.containsPoint(GLOBALS.PLANE_USER_DATA[i].position)) {
                GLOBALS.EXIT_DOOR.getObjectByName("trigger").material.color = new Color(0xff0000);
                window.allowTest = false;
            }

            //PLATFORMS
            for (var j = 0; j < GLOBALS.BOUNDING_BOX.length; j++) {

                if (GLOBALS.BOUNDING_BOX[j].containsPoint(GLOBALS.PLANE_USER_DATA[i].position)) {

                    if (GLOBALS.BOUNDING_BOX[j].platform.name == "piston_platforms") {
                        if (GLOBALS.PLANE_USER_DATA[i].hasItem || GLOBALS.PLANE_USER_DATA[i].side == "up") {
                            GLOBALS.BOUNDING_BOX[j].platform.material.color = new Color(0xff0000);
                            window.allowTest = false;
                        }
                    } else if (GLOBALS.BOUNDING_BOX[j].platform.name == "track_platforms") {
                        
                        if (GLOBALS.BOUNDING_BOX[j].platform.side == "front" || GLOBALS.BOUNDING_BOX[j].platform.side == "back") {
                            if (GLOBALS.PLANE_USER_DATA[i].hasItem || GLOBALS.PLANE_USER_DATA[i].side == "right"
                                || GLOBALS.PLANE_USER_DATA[i].side == "left"
                            ) {
                                GLOBALS.BOUNDING_BOX[j].platform.material.color = new Color(0xff0000);
                                window.allowTest = false;
                            }
                        }else if (GLOBALS.BOUNDING_BOX[j].platform.side == "left" || GLOBALS.BOUNDING_BOX[j].platform.side == "right") {
                            if (GLOBALS.PLANE_USER_DATA[i].hasItem || GLOBALS.PLANE_USER_DATA[i].side == "front"
                                || GLOBALS.PLANE_USER_DATA[i].side == "back"
                            ) {
                                GLOBALS.BOUNDING_BOX[j].platform.material.color = new Color(0xff0000);
                                window.allowTest = false;
                            }
                        }
                    }
                }
            }
        }
    }

    //UPDATE GOO
    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[i].exists && GLOBALS.PLANE_USER_DATA[i].hasItem && GLOBALS.PLANE_USER_DATA[i].hasGoo) {


            

            const item = GLOBALS.PLANE_USER_DATA[i].item;

            if(!item.ids)
                continue;
            
            GLOBALS.SCENE_CHILDREN.remove(item.water);
            GLOBALS.SCENE_CHILDREN.remove(item.lava);

            for (var j = 0; j < item.ids.length; j++) {
                GLOBALS.PLANE_USER_DATA[item.ids[j]].hasGoo = false;
            }

            for (var j = GLOBALS.GOO_BOXES.length - 1; j >= 0; j--) {
                if (GLOBALS.GOO_BOXES[j].idPlane == GLOBALS.PLANE_USER_DATA[i].id_instanced) {
                    const index = GLOBALS.GOO_BOXES.indexOf(GLOBALS.GOO_BOXES[j]);
                    if (index > -1) { // only splice array when item is found
                        GLOBALS.GOO_BOXES.splice(index, 1); // 2nd parameter means remove one item only
                    }
                }
            }

            //NOW ADD AGAIN
            const userData = GLOBALS.PLANE_USER_DATA[i];
            userData.hasItem = true;
            userData.itemName = "goo";
            userData.item = item;

            AddGoo(userData);
        }
    }

    //CHECK PLATFORM


}

window.allowTest = true;

export {
    checkToUpdateContinuous
}