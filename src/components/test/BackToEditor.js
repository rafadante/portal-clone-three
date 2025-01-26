import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';
import { AUDIO, play } from '../audio/Audio.js';
import { stateDoor } from '../door/Door.js';
import { deletePortal } from '../portal/CreatePortal.js';
import { resetAll } from '../events/events.js';
import { interactWithItem } from '../events/interaction.js';
import { Color, Group, Vector3 } from 'three';
import { removePelletHitInstances } from '../pellet/Pellet.js';
import { resetPlatforms } from '../platforms/Platform.js';
import { resetPlayerBody } from '../fps/Player.js';
import { updateLaserEmitterRaycaster } from '../lasers/Laser.js';

//BACK FROM EDITOR
$("body").on('click', '#back-editor', function () {
    backToEditor();
});

function backToEditor() {

    GLOBALS.ANGLED_PANELS = [];
    
    for(var i=0; i<window.glass.length;i++){
        if(window.glass[i].cloneTexture){
            window.glass[i].material.alphaMap = null;
        }
    }

    GLOBALS.STATS.dom.style.display = "none";
    GLOBALS.MATERIAL_FIZZLER.depthWrite = true;

    GLOBALS.EXIT_DOOR.finished = false;
    GLOBALS.STATS_UI.time = 0;
    GLOBALS.STATS_UI.steps = 0;
    window.curentTimeOffset = 0;
    window.pellets = [];

    resetPlayerBody();

    GLOBALS.MAIN_CAMERA.remove(GLOBALS.MAIN_CAMERA.getObjectByName("listener"));
    window.listernAdded = false;

    for (var i = 0; i < GLOBALS.SOUNDS_FPS.length; i++) {
        GLOBALS.SCENE_FPS.remove(GLOBALS.SOUNDS_FPS[i]);
        GLOBALS.SOUNDS_FPS[i].audio.currentTime = 0;
        GLOBALS.SOUNDS_FPS[i].audio.pause();
    }

    removePelletHitInstances();

    if (GLOBALS.HOLDING_ITEM)
        interactWithItem();

    for (var j = 0; j < GLOBALS.BOUNDING_BOX.length; j++) {
        GLOBALS.BOUNDING_BOX[j].platform.material.color = new Color(0x00ff00);
        GLOBALS.BOUNDING_BOX[j].platform.material.emissive = null;
        GLOBALS.BOUNDING_BOX[j].platform.material.transparent = true;
        GLOBALS.BOUNDING_BOX[j].platform.scale.x = 1;
        GLOBALS.BOUNDING_BOX[j].platform.scale.z = 1;
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS["piston_platforms"].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS["piston_platforms"][i].length != 0)
            resetPlatforms(GLOBALS.DYMANIC_ITEMS["piston_platforms"][i], i, "piston_platforms");
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS["track_platforms"].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS["track_platforms"][i].length != 0)
            resetPlatforms(GLOBALS.DYMANIC_ITEMS["track_platforms"][i], i, "track_platforms");
    }

    for (var i = 0; i < GLOBALS.GOO_PLANES.length; i++) {
        if (GLOBALS.GOO_PLANES[i].item)
            GLOBALS.GOO_PLANES[i].item.visible = true;
    }

    for (var f = 0; f < GLOBALS.TRIGGER_BOXES.length; f++) {

        if (GLOBALS.TRIGGER_BOXES[i]) {
            GLOBALS.TRIGGER_BOXES[i].item.visible = true;

            GLOBALS.TRIGGER_BOXES[f].item.userData.active = false;
            GLOBALS.TRIGGER_BOXES[f].item.userData.played = false;
        }

    }

    GLOBALS.ENTER_DOOR.getObjectByName("trigger").visible = true;
    GLOBALS.EXIT_DOOR.getObjectByName("trigger").visible = true;

    /*const cleanMaterial = material => {
        //console.log('dispose material!')
        material.dispose()
    
        // dispose textures
        for (const key of Object.keys(material)) {
            const value = material[key]
            if (value && typeof value === 'object' && 'minFilter' in value) {
                //console.log('dispose texture!')
                value.dispose()
            }
        }
    }

    GLOBALS.SCENE_FPS.traverse(object => {
        if (!object.isMesh) return
        
        //console.log('dispose geometry!')
        object.geometry.dispose()
    
        if (object.material.isMaterial) {
            cleanMaterial(object.material)
        } else {
            // an array of materials
            for (const material of object.material) cleanMaterial(material)
        }
    })*/

    for (var i = 0; i < window.instances.length; i++) {
        GLOBALS.SCENE_FPS.remove(window.instances[i]);
    }

    if (GLOBALS.ITEMS_ADDED.getObjectByName("spawn")) {
        GLOBALS.CORRIDOR_ENTER.visible = false;
        GLOBALS.ITEMS_ADDED.getObjectByName("spawn").visible = true;
        GLOBALS.ENTER_DOOR.visible = true;
    }

    GLOBALS.DEBUGGER_GROUP.visible = false;

    GLOBALS.GROUP_LINE_TRAGECTORY.visible = true;
    //GLOBALS.STATS.dom.style.display = "none";
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
    GLOBALS.FINISHED = false;
    //GLOBALS.ENTER_DOOR.add(GLOBALS.CORRIDOR_ENTER);

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


    for (var g = 0; g < GLOBALS.LIGHT_BRIDGE_CLONE.length; g++) {
        GLOBALS.ITEMS_ADDED.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
        GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);
        GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;
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


    play(AUDIO.EDITOR)
    AUDIO.AMBIENT.pause();

    //GLOBALS.ENTER_DOOR.remove(GLOBALS.ENTER_DOOR.fizzler);
    //GLOBALS.EXIT_DOOR.remove(GLOBALS.EXIT_DOOR.fizzler);
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

    const dynamics = ["cube", "cube_2", "radio", "sphere", "laser_cube", "scale_cube"]

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
        if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("trigger_area")) {
            GLOBALS.CONNECTIONS[i]['from'].item.visible = true;
        }

        GLOBALS.CONNECTIONS[i]['line'].active = false;
        GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons = 0;
    }

    GLOBALS.SCENE_FPS = new Group();

    for (var i = 0; i < GLOBALS.LASER_EMITTER_RAYCASTER.length; i++) {

        GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.visible = false;

    }
}

function resetPositions(item, name) {
    item.position.copy(item.position);
    item.updateMatrix();
    const instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);
    instanced.setMatrixAt(item.userData.idInstanced, item.matrix);
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
}

export {
    backToEditor
}