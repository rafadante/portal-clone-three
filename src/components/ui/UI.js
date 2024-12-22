import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';
import { volume } from '../audio/Audio.js';
import "./Custom.js";

if (!GLOBALS.MOBILE)
    $(".mobile").css("display", "none");

$("body").on('click', '.settings-audio', function () {
    $("#options-audio").css("display", "block");
    $("#options-settings").css("display", "none");
    $(".settings-menu").css("width", "50%");
    $("#settings-menu-title").text("AUDIO");
    $("#done").css("display", "block");
});

$("body").on('click', '.settings-video', function () {
    $("#options-video").css("display", "block");
    $("#options-settings").css("display", "none");
    $(".settings-menu").css("width", "50%");
    $("#settings-menu-title").text("GRAPHICS");
    $("#done").css("display", "block");
    //alert("The option changes will be saved to local storage while there is no server to allocate player data.");
});

$("body").on('click', '.settings-controls', function () {
    $("#options-controls").css("display", "block");
    $("#options-settings").css("display", "none");
    $(".settings-menu").css("width", "50%");
    $("#settings-menu-title").text("CONTROLS");
    $("#done").css("display", "block");
    //alert("The option changes will be saved to local storage while there is no server to allocate player data.");
});

$("body").on('click', '#done', function () {
    $("#options-video").css("display", "none");
    $("#options-controls").css("display", "none");
    $("#options-audio").css("display", "none");
    $("#options-settings").css("display", "block");
    $(".settings-menu").css("width", "25%");
    $("#settings-menu-title").text("OPTIONS");
    $("#done").css("display", "none");
});

//QUALITY
$('#quality-select').on('change', function () {

    localStorage.setItem("quality-select", $(this).val());
    GLOBALS.RENDERER.shadowMap.enabled = false;

    if ($(this).val() == "potato") {
        $("#recursive-select").val(2).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(0.5).change();
        $("#shadows-resolution-select").val(512).change();
        localStorage.setItem("antialising", false);
    } else if ($(this).val() == "very_low") {
        $("#recursive-select").val(2).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(0.5).change();
        $("#shadows-resolution-select").val(256).change();
        localStorage.setItem("antialising", false);
    } else if ($(this).val() == "low") {
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(0.8).change();
        $("#shadows-resolution-select").val(1024).change();
        localStorage.setItem("antialising", false);
    } else if ($(this).val() == "medium") {
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(0).change();
        $("#resolution-select").val(1).change();
        $("#shadows-resolution-select").val(1024).change();
        localStorage.setItem("antialising", true);
    } else if ($(this).val() == "high") {
        GLOBALS.RENDERER.shadowMap.enabled = true;
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(100).change();
        $("#resolution-select").val(1).change();
        $("#shadows-resolution-select").val(2048).change();
        localStorage.setItem("antialising", true);
        GLOBALS.RENDERER.shadowMap.autoUpdate = true;
    } else if ($(this).val() == "epic") {
        GLOBALS.RENDERER.shadowMap.enabled = true;
        $("#recursive-select").val(3).change();
        $("#recursive-render-select").val(100).change();
        $("#resolution-select").val(1).change();
        $("#shadows-resolution-select").val(4096).change();
        localStorage.setItem("antialising", true);
        GLOBALS.RENDERER.shadowMap.autoUpdate = true;
    }

    /*if (window.loaded) {
        // reload the current page
        alert("The page needs to be reloaded!")
        window.location.reload();
    }*/

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

    if (allowUpdate) {
        GLOBALS.RENDERER.setPixelRatio(window.devicePixelRatio * $(this).val());
        update();
    }
});

//SHADOW RESOLUTION
$('#shadows-resolution-select').on('change', function () {

    if (allowUpdate) {
        GLOBALS.SPOTLIGHT.shadow.mapSize.width = $(this).val();
        GLOBALS.SPOTLIGHT.shadow.mapSize.height = $(this).val();
    }

    //if (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high") {
        GLOBALS.RENDERER.shadowMap.autoUpdate = true;
        GLOBALS.RENDERER.shadowMap.autoUpdate = false;
    //}

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

//VLOUME
$('#vol-val-range').on('input', function () {
    localStorage.setItem("vol-val-range", $(this).val());
    $("#vol-val-number").val($(this).val());
    volume($(this).val());
});

//FOV
$('#fov-val-range').on('input', function () {
    /*localStorage.setItem("fov-val-range", $(this).val());
    $("#fov-val-number").val($(this).val());
    GLOBALS.MAIN_CAMERA.fov = $(this).val();
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();

    update();*/
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

function update() {
    if (allowUpdate) {
        GLOBALS.PAUSED = false;
        setTimeout(() => {
            GLOBALS.PAUSED = true;
        }, 100);

        localStorage.setItem("saved", true);
    }
}


//LOAD PLAYER DATA
//VERIFY IF THE PLAYER HAS SETTINGS SAVED ON THE LOCALSTORAGE
if (!localStorage.getItem("saved")) {
    $("#recursive-select").val(GLOBALS.PORTAL_RECURSION_LEVELS).change();
    $("#resolution-select").val(0.5).change();
    $("#shadows-resolution-select").val(512).change();
}

if (localStorage.getItem("vol-val-range")) {
    $("#vol-val-range").val(localStorage.getItem("vol-val-range")).trigger("input");
}
//volume(localStorage.getItem("vol-val-range"));

allowUpdate = true;

$('#next-map-btn').on('click', function () {

    localStorage.setItem("level", window.currentLevel + 1);
    localStorage.setItem("load", "true");

    window.open("https://" + window.location.host, "_self");
});

$('#social-youtube').on('click', function () {
    window.open("https://www.youtube.com/@Rafa_dante");
});

$('#social-twitter').on('click', function () {
    window.open("https://x.com/RafaTecXR");
});

$('#social-discord').on('click', function () {
    window.open("https://discord.com/invite/CsARjYrc");
});

$('#option-download').on('click', function () {
    window.open("https://drive.google.com/drive/folders/1V4JBopiETzoDdxIogca9_7XqLjbSaHTd?usp=sharing", "_blank");
});

window.addEventListener("orientationchange", (event) => {
    if (GLOBALS.MOBILE)
        checkOrientation()
});

checkOrientation()

function checkOrientation() {
    if (Math.abs(window.orientation) == 0) {
        $("#mobile-warning").css("display", "flex")
    } else {
        $("#mobile-warning").css("display", "none")
    }
}

//PLAYER
$("body").on('input', '#option-player', function () {
    localStorage.setItem("option-player", this.checked);
    if (this.checked) {
        window.playerState = true;
        GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL);
        GLOBALS.SCENE_FPS.add(GLOBALS.GUN_CLONE);
        GLOBALS.SCENE_FPS.add(GLOBALS.GUN_CLONE2);
    } else {
        window.playerState = false;
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PLAYER_MODEL);
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PLAYER_MODEL_CLONE);
        GLOBALS.SCENE_FPS.remove(GLOBALS.GUN_CLONE);
        GLOBALS.SCENE_FPS.remove(GLOBALS.GUN_CLONE2);
    }

    update()
});

if (localStorage.getItem("option-player") == "true") {
    $("#option-player").prop('checked', true);
    window.playerState = true;
}