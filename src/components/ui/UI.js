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
    alert("The option changes will be saved to local storage while there is no server to allocate player data.");
});

$("body").on('click', '#settings-controls', function () {
    $("#options-controls").css("display", "block");
    $("#options-settings").css("display", "none");
    $(".settings-menu").css("width", "50%");
    $("#settings-menu-title").text("CONTROLS");
    $("#done").css("display", "block");
    alert("The option changes will be saved to local storage while there is no server to allocate player data.");
});

$("body").on('click', '#done', function () {
    $("#options-video").css("display", "none");
    $("#options-controls").css("display", "none");
    $("#options-settings").css("display", "block");
    $(".settings-menu").css("width", "25%");
    $("#settings-menu-title").text("OPTIONS");
    $("#done").css("display", "none");
});

//QUALITY
$('#quality-select').on('change', function () {

    allowUpdate = false;
    localStorage.setItem("quality-select", $(this).val());

    console.log($(this).data("recursive"))

    if($(this).val() == "potato"){
        $("#recursive-select").val(0).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(0.5).change();
        $("#shadows-resolution-select").val(512).change();
        localStorage.setItem("antialising", false);
    }else if($(this).val() == "very_low"){
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(0.5).change();
        $("#shadows-resolution-select").val(512).change();
        localStorage.setItem("antialising", false);
    }else if($(this).val() == "low"){
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(0.8).change();
        $("#shadows-resolution-select").val(1024).change();
        localStorage.setItem("antialising", false);
    }else if($(this).val() == "medium"){
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(1).change();
        $("#shadows-resolution-select").val(1024).change();
        localStorage.setItem("antialising", true);
    }else if($(this).val() == "high"){
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(100).change();
        $("#resolution-select").val(1).change();
        $("#shadows-resolution-select").val(2048).change();
        localStorage.setItem("antialising", true);
    }else if($(this).val() == "epic"){
        $("#recursive-select").val(7).change();
        $("#recursive-render-select").val(100).change();
        $("#resolution-select").val(1).change();
        $("#shadows-resolution-select").val(4096).change();
        localStorage.setItem("antialising", true);
    }

    allowUpdate = true;
    update();
});

//RECURSIVE PORTALS
$('#recursive-select').on('change', function () {
    GLOBALS.PORTAL_RECURSION_LEVELS = $(this).val();
    update();
});

//RECURSIVE PORTALS RENDER
$('#recursive-render-select').on('change', function () {
    GLOBALS.PORTAL_RENDER_LEVEL = $(this).val();
    update();
});

//RESOLUTION
$('#resolution-select').on('change', function () {
    GLOBALS.PIXEL_RATIO = $(this).val();

    if(allowUpdate){
        GLOBALS.RENDERER.setPixelRatio(window.devicePixelRatio * $(this).val());
        update();
    }
});

//SHADOW RESOLUTION
$('#shadows-resolution-select').on('change', function () {

    if(allowUpdate){
        GLOBALS.SPOTLIGHT.shadow.mapSize.width = $(this).val();
        GLOBALS.SPOTLIGHT.shadow.mapSize.height = $(this).val();
    }

    GLOBALS.RENDERER.shadowMap.autoUpdate = true;
        GLOBALS.RENDERER.shadowMap.autoUpdate = false;
    
    update()
});

//STATS
$("body").on('input', '#option-stats', function () {
    localStorage.setItem("option-stats", this.checked);
    if (!this.checked)
        $("#main-container").css("display", "none");
    else
        $("#main-container").css("display", "block");

    update()
});

//FOV
$('#fov-val-range').on('input', function () {
    localStorage.setItem("fov-val-range", $(this).val());
    $("#fov-val-number").val($(this).val());
    GLOBALS.MAIN_CAMERA.fov = $(this).val();
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();

    update();
});

//MOUSE
$('#mouse-val-range').on('input', function () {
    localStorage.setItem("mouse-val-range", $(this).val());
    $("#mouse-val-number").val($(this).val());

    if (!GLOBALS.MOBILE)
        GLOBALS.POINTER_CONTROLS.pointerSpeed = $(this).val();

    update();
});

//RESET CONTROLS
$('#reset-control').on('click', function () {
    $("#fov-val-range").val(60).trigger("input");
    $("#mouse-val-range").val(0.5).trigger("input");
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

var allowUpdate = false;

function update(){
    if(allowUpdate){
        GLOBALS.PAUSED = false;
        setTimeout(() => {
            GLOBALS.PAUSED = true;
        }, 100);

        localStorage.setItem("saved", true);
    }
}

//VERIFY IF THE PLAYER HAS SETTINGS SAVED ON THE LOCALSTORAGE
if(localStorage.getItem("saved")){

    //if(localStorage.getItem("recursive-select"))
    //    $("#recursive-select").val(localStorage.getItem("recursive-select")).change();
    //if(localStorage.getItem("recursive-render-select"))
    //    $("#recursive-render-select").val(localStorage.getItem("recursive-render-select")).change();
    //if(localStorage.getItem("resolution-select"))
    //    $("#resolution-select").val(localStorage.getItem("resolution-select")).change();

}else{
    $("#recursive-select").val(GLOBALS.PORTAL_RECURSION_LEVELS).change();
    $("#resolution-select").val(0.5).change();
    $("#shadows-resolution-select").val(512).change();

    //$("#quality-select").val("low").change();
}

allowUpdate = true;
console.log(localStorage)