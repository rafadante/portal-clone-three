import $ from 'jquery';
import * as THREE from 'three';
import { GLOBALS } from '../../Globals.js';

if (!GLOBALS.MOBILE)
    $(".mobile").css("display", "none");

$("body").on('click', '#settings-video', function () {
    $("#options-video").css("display", "block");
    $("#options-settings").css("display", "none");
    $(".settings-menu").css("width", "50%");
    $("#settings-menu-title").text("GRAPHICS");
    $("#done").css("display", "block");
})

$("body").on('click', '#settings-controls', function () {
    $("#options-controls").css("display", "block");
    $("#options-settings").css("display", "none");
    $(".settings-menu").css("width", "50%");
    $("#settings-menu-title").text("CONTROLS");
    $("#done").css("display", "block");
})

$("body").on('click', '#done', function () {
    $("#options-video").css("display", "none");
    $("#options-controls").css("display", "none");
    $("#options-settings").css("display", "block");
    $(".settings-menu").css("width", "25%");
    $("#settings-menu-title").text("OPTIONS");
    $("#done").css("display", "none");
})

//STATS
$("body").on('input', '#option-stats', function () {
    if (!this.checked)
        $("#main-container").css("display", "none");
    else
        $("#main-container").css("display", "block");

    update()
})

//SHADOW
$("body").on('input', '#option-shadow', function () {
    GLOBALS.RENDERER.shadowMap.enabled = !this.checked;
})

//RECURSIVE PORTALS
$('#recursive-select').on('change', function () {
    GLOBALS.PORTAL_RECURSION_LEVELS = $(this).val();
    update()
});

//FPS MAIN SCENE
$('#fps-select').on('change', function () {
    GLOBALS.FPS_MODE = $(this).val();

    if (GLOBALS.FPS_MODE == "unlocked") {
        GLOBALS.FPS_MODE = window.unlockedFPS;
        GLOBALS.FPS_UNLOCKED = true;
    } else {
        GLOBALS.FPS_UNLOCKED = false;
    }


    GLOBALS.INTERVAL = 1 / GLOBALS.FPS_MODE;
    update()
});

//RESOLUTION
$('#resolution-select').on('change', function () {
    GLOBALS.RENDERER.setPixelRatio(window.devicePixelRatio * $(this).val());
    update()
});

//SHADOW RESOLUTION
$('#shadows-resolution-select').on('change', function () {
    GLOBALS.SPOTLIGHT.shadow.mapSize.width = $(this).val();
    GLOBALS.SPOTLIGHT.shadow.mapSize.height = $(this).val();

    GLOBALS.RENDERER.shadowMap.autoUpdate = true;
    GLOBALS.RENDERER.shadowMap.autoUpdate = false;
    update()
});

//FOV
$('#fov-val-range').on('input', function () {
    $("#fov-val-number").val($(this).val());
    GLOBALS.MAIN_CAMERA.fov = $(this).val();
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();
});

//MOUSE
$('#mouse-val-range').on('input', function () {
    $("#mouse-val-number").val($(this).val());

    if (!GLOBALS.MOBILE)
        GLOBALS.POINTER_CONTROLS.pointerSpeed = $(this).val();
});

//BUTTON OPACITY
$("body").on('input', '#opacity-val-range', function () {
    $("#opacity-val-number").val($(this).val());
    $("#mobile-controls").css("opacity", $(this).val());
})

//BACK FROM EDITOR
$("body").on('click', '#back-editor', function () {

    GLOBALS.STATS.container.style.display = "none";
    GLOBALS.FPS_MODE = false;
    GLOBALS.ROOM.visible = true;
    GLOBALS.CONTROLS.enabled = true;
    GLOBALS.SCENE.environment = GLOBALS.ENV_MAP;
    GLOBALS.LIGHT_GROUP.visible = false;

    $("#ui").css("display", "block");
    $(".img").removeClass("image");
    $("#mobile-controls").css("display", "none");

    var bb = new THREE.Box3()
    bb.setFromObject(GLOBALS.ROOM);
    bb.getCenter(GLOBALS.CONTROLS.target);

    GLOBALS.CONTROLS.target.set(GLOBALS.CONTROLS.target.x + 0, GLOBALS.CONTROLS.target.y + 0, GLOBALS.CONTROLS.target.z + 0);
    GLOBALS.MAIN_CAMERA.position.set(-4.2, 13, 22.5)
    GLOBALS.CONTROLS.update();
    $("#blocker").css("display", "none");
    $("#blocker").css("pointer-events", "none");
    $("#reticle").css("display", "none");
    GLOBALS.MAIN_CAMERA.remove(GLOBALS.GUN);

    if (GLOBALS.PORTALS.length == 1) {
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PORTALS[0]);
    } else if (GLOBALS.PORTALS.length == 2) {
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PORTALS[1]);
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PORTALS[0]);
    }
    GLOBALS.PORTALS = [null, null];
});

$("#arrow-menu").click(function () {
    if ($("#side-bar-left").css("left") == "0px") {
        $("#side-bar-left").css("left", "-350px");
        $("#arrow-menu i").addClass("fa-chevron-right")
        $("#arrow-menu i").removeClass("fa-chevron-left")
    } else {
        $("#side-bar-left").css("left", "0px");
        $("#arrow-menu i").removeClass("fa-chevron-right")
        $("#arrow-menu i").addClass("fa-chevron-left")
    }
});

$(".item").mouseenter(function () {
    $("#info-box").css("opacity", 1)
    $("#info-title").text($(this).data("title"))
    $("#info-content").text($(this).data("content"))
})

$(".item").mouseleave(function () {
    $("#info-box").css("opacity", 0)
})

function update(){
    GLOBALS.PAUSED = false;
    setTimeout(() => {
        GLOBALS.PAUSED = true;
    }, 100);
}