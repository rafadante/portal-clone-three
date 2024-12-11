import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';
import {
    animate
} from '../../Main.js';
import { AUDIO, play } from '../audio/Audio.js';
import { stateDoor } from '../door/Door.js';
import { deletePortal } from '../portal/CreatePortal.js';
import { resetAll } from '../events/events.js';
import { Vector3 } from 'three';

//BACK FROM EDITOR
$("body").on('click', '#back-editor', function () {

    GLOBALS.DEBUGGER_GROUP.visible = false;

    GLOBALS.GROUP_LINE_TRAGECTORY.visible=true;
    GLOBALS.STATS.dom.style.display = "none";
    GLOBALS.ROOM.visible = true;
    GLOBALS.CONTROLS.enabled = true;
    GLOBALS.SCENE.environment = GLOBALS.ENV_MAP;
    GLOBALS.LIGHT_GROUP.visible = false;
    GLOBALS.SCENE.background = null;
    GLOBALS.CORRIDOR_ENTER.visible = false;
    GLOBALS.SCENE.getObjectByName("window").visible = true;
    GLOBALS.OBSERVATION_ROOM.visible = false;
    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.SCENE_FPS);
    GLOBALS.SCENE_FPS = null;
    GLOBALS.LEVEL_ENTERED = false;
    GLOBALS.DOOR_OPEN_STATE = false;
    GLOBALS.ENTER_DOOR.add(GLOBALS.CORRIDOR_ENTER);

    $("#ui").css("display", "block");
    $(".img").removeClass("image");
    $("#mobile-controls").css("display", "none");
    $("#container").css("filter", "none");

    $("#blocker").css("display", "none");
    $("#blocker").css("pointer-events", "none");
    $("#reticle").css("display", "none");

    deletePortal(0)
    deletePortal(1)
    GLOBALS.PORTAL_BOX = [];

    GLOBALS.MAIN_CAMERA.position.set(-12.2, 17.4, 26.3)

    GLOBALS.LIGHT_PORTAL_0.visible = false;
    GLOBALS.LIGHT_PORTAL_1.visible = false;
    GLOBALS.FLASH.visible = false;

    for (var i = GLOBALS.CANNON_BODIES.length - 1; i >= 0; i--) {
        GLOBALS.CANNON_WORLD.remove(GLOBALS.CANNON_BODIES[i]);
    }

    GLOBALS.CANNON_BODIES = [];
    GLOBALS.WALL_BODIES = [];
    GLOBALS.RADIO_MUSIC = [];
    GLOBALS.BLOCK_PORTAL = [];
    GLOBALS.DYNAMIC_OBJECTS = [];
    GLOBALS.DYNAMIC_OBJECTS.push(GLOBALS.PLAYER);

    GLOBALS.TRACTOR_BEAM_LENGTH = 0;
    GLOBALS.LASER_EMITTER_LENGTH = 0;

    GLOBALS.CONTROLS.update();
    animate();


    play(AUDIO.EDITOR)
    AUDIO.AMBIENT.pause();

    GLOBALS.ENTER_DOOR.remove(GLOBALS.ENTER_DOOR.fizzler);
    GLOBALS.EXIT_DOOR.remove(GLOBALS.EXIT_DOOR.fizzler);
    GLOBALS.ENTER_DOOR.children[0].rotation.z += Math.PI;

    stateDoor(0, false, false, GLOBALS.ENTER_DOOR, true);
    stateDoor(0, false, false, GLOBALS.EXIT_DOOR, true);

    GLOBALS.CORRIDOR_ENTER.getObjectByName("elevatorOBJ").visible = true;
    GLOBALS.CORRIDOR_ENTER.getObjectByName("leftDoor").visible = true;
    GLOBALS.CORRIDOR_ENTER.getObjectByName("rightDoor").visible = true;

    GLOBALS.CORRIDOR_ENTER.getObjectByName("rightDoor").rotation.y = Math.PI / 2;
    GLOBALS.CORRIDOR_ENTER.getObjectByName("leftDoor").rotation.y = Math.PI / 2;

    GLOBALS.MATERIAL_TRACTOR_BEAM.depthWrite = true;
    GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE.depthWrite = true;

    GLOBALS.FPS_MODE = false;

    resetAll();

    const dynamics = ["cube", "cube_2", "radio", "sphere", "laser_cube"]

    for (var i = 0; i < dynamics.length; i++) {
        for (var j = 0; j < GLOBALS.DYMANIC_ITEMS[dynamics[i]].length; j++) {
            if (GLOBALS.DYMANIC_ITEMS[dynamics[i]][j].visible) {
                resetPositions(GLOBALS.DYMANIC_ITEMS[dynamics[i]][j], dynamics[i])
            }
        }
    }

    for (var i = 0; i < GLOBALS.CAMERAS.length; i++) {
        GLOBALS.CAMERAS[i].fixed = true;
        GLOBALS.CAMERAS[i].position.copy(GLOBALS.CAMERAS[i].initialPosition);
        GLOBALS.CAMERAS[i].rotation.copy(GLOBALS.CAMERAS[i].initialRotation);

        var holder = new Vector3();
        GLOBALS.CAMERAS[i].children[1].getWorldPosition(holder)
        holder.y -= 0.25;

        GLOBALS.CAMERAS[i].cube.position.copy(holder);
        GLOBALS.CAMERAS[i].cube.body = null;

        const index = GLOBALS.INTERACTIVE.indexOf(GLOBALS.CAMERAS[i].cube);
        if (index > -1) {
            GLOBALS.INTERACTIVE.splice(index, 1);
        }
    }

    for (var i = 0; i < GLOBALS.SOUNDS_FPS.length; i++) {
        GLOBALS.SOUNDS_FPS[i].audio.pause();
    }

    GLOBALS.SCENE_FPS = [];

    setTimeout(() => {
        GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.z = 10;
        GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.z = 10;

        GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z = 10;
        GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z = 10;
    }, 1500);

    GLOBALS.PORTAL_GUN_INITIATE = GLOBALS.PORTAL_GUN_INITIATE_HOLDER;
    for (var i = 0; i < GLOBALS.PORTAL_GUN_BOX.length; i++) {
        GLOBALS.PORTAL_GUN_BOX[i].item.visible = true;
        GLOBALS.PORTAL_GUN_BOX[i] = GLOBALS.PORTAL_GUN_BOX[i].item;
    }

    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
        GLOBALS.CONNECTIONS[i]['line'].visible = true;
        if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("trigger_area"))
            GLOBALS.CONNECTIONS[i]['from'].item.visible = true;
    }
});

function resetPositions(item, name) {
    item.position.copy(item.initialPosition);
    item.updateMatrix();
    const instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);
    instanced.setMatrixAt(item.userData.idInstanced, item.matrix);
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
}