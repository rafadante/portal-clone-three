import {
    Group,
    Vector3,
    Quaternion,
    Box3,
} from 'three';
import $ from 'jquery';
import {
    animate
} from '../../Main.js';
import {
    GLOBALS
} from '../../Globals.js';
import {
    addPositionalAudio,
    AUDIO,
    addAudio
} from '../audio/Audio.js';
import { initPost } from '../post/PostProcessing.js';
import './Colliders.js';
import {
    colliderItemManager
} from './Colliders.js';
import { testLightsManager } from '../lights/Lights.js';
import { manageInstances } from './Instances.js';
import './BackToEditor.js';
import { stateDoor } from '../door/Door.js';
import { addGel } from '../gels/Gels.js';
import { findPath } from '../findPath/FindPath.js';
import { levelEnteredFunction } from '../events/states.js';
import { loadAvatar } from '../loadObj/LoaderOBJ.js';

$("body").on('click', '#view-fps', function () {
    //
    $("#loading-parent").css("opacity", 1)
    $("#loading-parent").css("pointer-events", "all")
    window.ttt = true;

    if(GLOBALS.GUN){
        viewFPS();
    }else{
        loadAvatar();
    }
});

var p = 0;

function loadingTxt() {

    p += 1;

    $(".introduction-text").addClass("loading-disabled");
    $("#p" + p).removeClass("loading-disabled");

    if (p < 4) {
        setTimeout(() => {
            loadingTxt()
        }, 3000);
    }
}

function viewFPS() {

    p = 0;
    loadingTxt()

    AUDIO.EDITOR.pause();

    GLOBALS.SCENE_FPS = new Group();
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.SCENE_FPS);

    GLOBALS.ITEM_CUBE.visible = false;
    //GLOBALS.SPOTLIGHT.intensity = 0;

    var obj = GLOBALS.ENTER_DOOR.clone();
    obj.translateZ(1);
    GLOBALS.PLAYER.spawnPosition = obj.position.clone();

    
    $("#container").css("filter", "blur(3px)")
    $(".img").addClass("image");
    GLOBALS.FLASH.visible = true;

    //ADD PORTAL AMBIENT AUDIO
    addPositionalAudio('audio-portal-ambient', GLOBALS.PORTAL_AUDIO[0], false, true, false, 3);
    addPositionalAudio('audio-portal-ambient', GLOBALS.PORTAL_AUDIO[1], false, true, false, 3);

    setTimeout(() => {

        if (localStorage.getItem("quality-select") == "epic") {
            initPost();
        }
        //
        manageInstances();

        addPositionalAudio('audio-door', GLOBALS.EXIT_DOOR, false, false, true, 8);
        addPositionalAudio('audio-door', GLOBALS.ENTER_DOOR, false, false, true, 8);

        GLOBALS.UNIFORMS_LASER_FIELD.fade = 1;
        GLOBALS.MATERIAL_TRACTOR_BEAM.depthWrite = false;
        GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE.depthWrite = false;

        GLOBALS.ENTER_DOOR.children[0].rotation.z += Math.PI;
        GLOBALS.RENDERER.setPixelRatio(window.devicePixelRatio * GLOBALS.PIXEL_RATIO);

        if (localStorage.getItem("option-stats"))
            $("#option-stats").prop('checked', localStorage.getItem("option-stats") == 'true');
        if (localStorage.getItem("fov-val-range"))
            $("#fov-val-range").val(localStorage.getItem("fov-val-range")).trigger("input");
        if (localStorage.getItem("mouse-val-range"))
            $("#mouse-val-range").val(localStorage.getItem("mouse-val-range")).trigger("input");
        if (localStorage.getItem("quality-select"))
            $("#quality-select").val(localStorage.getItem("quality-select")).change();

        //DOOR ENTER TRIGGER
        const cube = GLOBALS.ENTER_DOOR.cube.clone();

        var p = new Vector3();
        GLOBALS.ENTER_DOOR.cube.getWorldPosition(p);

        var r = new Quaternion();
        GLOBALS.ENTER_DOOR.cube.getWorldQuaternion(r);

        //GLOBALS.SCENE.add(cube);
        cube.position.copy(p);
        cube.quaternion.copy(r);

        var bb = new Box3(); // for re-use
        bb.setFromObject(cube);

        GLOBALS.ENTER_DOOR.box3 = bb;

        //----------------------------------------------

        setTimeout(() => {
            addGel();
            GLOBALS.MAIN_CAMERA.lookAt(GLOBALS.ENTER_DOOR.position);
            GLOBALS.PAUSED = false;
            GLOBALS.CORRIDOR_ENTER.visible = true;
            setTimeout(() => {
                GLOBALS.PAUSED = true;
            }, 100);
            //UI SETUP
            $("#ui").css("display", "none");
            $("#reticle").css("display", "flex");
            $("#blocker").css("display", "block");
            $("#blocker").css("pointer-events", "all");
            $("#loading-parent").css("opacity", 0)
            $("#loading-parent").css("pointer-events", "none")

            if (GLOBALS.MOBILE)
                $("#mobile-controls").css("display", "block");

            //GLOBALS.CUBES.remove(GLOBALS.PLANE_LEVEL_INSTANCED);

            //GLOBALS.RENDERER.compile(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);
            //GLOBALS.RENDERER.dispose()
            window.loaded = true;
        }, 500);

        GLOBALS.CONTROLS.enabled = false;
        GLOBALS.ROOM.visible = false;


        GLOBALS.SCENE.environment = null;
        GLOBALS.LIGHT_GROUP.visible = true;
        GLOBALS.STATS.container.style.display = "block";
        GLOBALS.OBSERVATION_ROOM.visible = true;
        GLOBALS.SCENE.getObjectByName("window").visible = false;
        //--------------------------------------------------------------------------
        GLOBALS.OBSERVATION_ROOM.position.copy(GLOBALS.OBSERVATION_ROOM_IMG.position);
        GLOBALS.OBSERVATION_ROOM.rotation.copy(GLOBALS.OBSERVATION_ROOM_IMG.rotation);
        //--------------------------------------------------------------------------

        if ((!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high"))
            || (window.playerState)) {
            GLOBALS.SCENE_FPS.add(GLOBALS.GUN_CLONE);
            GLOBALS.SCENE_FPS.add(GLOBALS.GUN_CLONE2);
        }


        GLOBALS.GUN.children[0].children[0].add(GLOBALS.LIGHTNIN_STRIKE_1,
            GLOBALS.LIGHTNIN_STRIKE_2, GLOBALS.LIGHTNIN_STRIKE_3);

        GLOBALS.GUN.visible = true;
        GLOBALS.GUN_SPHERE.material = GLOBALS.MATERIAL_GUN;
        GLOBALS.GUN_CYLINDER.material = GLOBALS.MATERIAL_GUN;

        //
        var target = new Vector3(); // create once an reuse it
        GLOBALS.CORRIDOR_ENTER.getObjectByName("spawn").getWorldPosition(target);
        GLOBALS.PLAYER.position.copy(target)
        //

        colliderItemManager();
        //
        addAudio(GLOBALS.DYMANIC_ITEMS['fizzler'], 'audio-fizzler')
        addAudio(GLOBALS.DYMANIC_ITEMS['laser_field'], 'audio-fizzler')
        addAudio(GLOBALS.DYMANIC_ITEMS['tractor_beam'], 'audio-tractor-beam')

        for (var s = 0; s < GLOBALS.DYMANIC_ITEMS["tractor_beam"].length; s++) {
            if (GLOBALS.DYMANIC_ITEMS["tractor_beam"][s].length != 0)
                GLOBALS.TRACTOR_BEAM_LENGTH++
        }

        for (var s = 0; s < GLOBALS.DYMANIC_ITEMS["laser_emitter"].length; s++) {
            if (GLOBALS.DYMANIC_ITEMS["laser_emitter"][s].length != 0)
                GLOBALS.LASER_EMITTER_LENGTH++
        }

        GLOBALS.SCENE.traverse(child => {
            child.frustumCulled = true;
        })

        animate();
        testLightsManager();

        //GLOBALS.SCENE.background = new Color(0x000000);//0xff0000
        GLOBALS.FLASH.visible = false;

        blockPortal();
        GLOBALS.RENDERER.renderLists.dispose();

        //GUN STATE
        GLOBALS.PORTAL_GUN_INITIATE_HOLDER = GLOBALS.PORTAL_GUN_INITIATE;
        if (GLOBALS.PORTAL_GUN_INITIATE == "none") {
            GLOBALS.GUN.children[0].visible = false;
            GLOBALS.GUN_CLONE.children[0].visible = false;
            GLOBALS.GUN_CLONE2.children[0].visible = false;
            //document.getElementById("reticle-img").style.display = "none";
            document.getElementById("reticle-img").src = './assets/textures/crosshairNull.png';
            document.getElementById("reticle-img").style.filter = "invert(1)";
        } else {
            GLOBALS.GUN.children[0].visible = true;
            GLOBALS.GUN_CLONE.children[0].visible = true;
            GLOBALS.GUN_CLONE2.children[0].visible = true;
            //document.getElementById("reticle-img").style.display = "block";
            document.getElementById("reticle-img").style.filter = "none";
        }

        //
        var holder = [];
        for (var i = 0; i < GLOBALS.PORTAL_GUN_BOX.length; i++) {
            if (GLOBALS.PORTAL_GUN_BOX[i].parent) {
                var bb = new Box3(); // for re-use
                bb.setFromObject(GLOBALS.PORTAL_GUN_BOX[i]);
                bb.item = GLOBALS.PORTAL_GUN_BOX[i];
                holder.push(bb);
            }
        }

        GLOBALS.PORTAL_GUN_BOX = holder;
        GLOBALS.FPS_MODE = true;

        //stateDoor(0, false, false, GLOBALS.EXIT_DOOR);
        /*if (GLOBALS.EXIT_DOOR.userData.connections > 0)
            stateDoor(0, false, false, GLOBALS.EXIT_DOOR);
          else
            stateDoor(0, true, false, GLOBALS.EXIT_DOOR);*/

        GLOBALS.GROUP_LINE_TRAGECTORY.visible = false;

        animate()

        if (GLOBALS.MOBILE || (localStorage.getItem("quality-select") != "epic" && localStorage.getItem("quality-select") != "high"))
            GLOBALS.SCENE.environment = GLOBALS.ENV_MAP;

        for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
            GLOBALS.CONNECTIONS[i]["line"].visible = false;
            findPath(
                GLOBALS.CONNECTIONS[i]["from"].position,
                GLOBALS.CONNECTIONS[i]["to"].position,
                GLOBALS.CONNECTIONS[i]["to"],
                GLOBALS.CONNECTIONS[i]["from"],
                GLOBALS.CONNECTIONS[i]
            )
        }

        if (GLOBALS.ITEMS_ADDED.getObjectByName("spawn")) {
            GLOBALS.CORRIDOR_ENTER.visible = false;
            GLOBALS.ITEMS_ADDED.getObjectByName("spawn").visible = false;
            GLOBALS.PLAYER.spawnPosition = GLOBALS.ITEMS_ADDED.getObjectByName("spawn").position.clone();
            GLOBALS.ENTER_DOOR.visible = false;
            GLOBALS.PLAYER.position.copy(GLOBALS.PLAYER.spawnPosition);

            setTimeout(() => {
                levelEnteredFunction(true);
            }, 5000);
        }
    }, 500);
};

function blockPortal() {
    for (var i = 0; i < GLOBALS.LIGHT_BRIDGE_RAYCASTER.length; i++) {
        GLOBALS.BLOCK_PORTAL.push(GLOBALS.LIGHT_BRIDGE_RAYCASTER[i].item.continuous)
    }

    for (var i = 0; i < GLOBALS.LASER_FIELD_RAYCASTER.length; i++) {
        GLOBALS.BLOCK_PORTAL.push(GLOBALS.LASER_FIELD_RAYCASTER[i].item.continuous)
    }

    for (var i = 0; i < GLOBALS.FIZZLER_RAYCASTER.length; i++) {
        GLOBALS.BLOCK_PORTAL.push(GLOBALS.FIZZLER_RAYCASTER[i].item.continuous)
    }

    for (var i = 0; i < GLOBALS.GLASS_RAYCASTER.length; i++) {
        if (!GLOBALS.GLASS_RAYCASTER[i].item.userData.grid) {
            GLOBALS.BLOCK_PORTAL.push(GLOBALS.GLASS_RAYCASTER[i].item.continuous)
        }

    }

    for (var i = 0; i < GLOBALS.DOORS.length; i++) {
        GLOBALS.BLOCK_PORTAL.push(GLOBALS.DOORS[i].children[0].children[0])
        GLOBALS.BLOCK_PORTAL.push(GLOBALS.DOORS[i].children[0].children[1])
    }
}

export {
    viewFPS
}