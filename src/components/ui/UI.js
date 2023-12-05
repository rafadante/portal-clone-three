import $ from 'jquery';
import * as THREE from 'three';

if (!window.mobile)
    $(".mobile").css("display", "none")


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
})

//SHADOW
$("body").on('input', '#option-shadow', function () {
    window.RENDERER.shadowMap.enabled = !this.checked;
})

//RECURSIVE PORTALS
$('#recursive-select').on('change', function () {
    window.PORTAL_RECURSION_LEVELS = $(this).val();
});

//FPS MAIN SCENE
window.fpsUnlocked = true;
$('#fps-select').on('change', function () {
    window.fps = $(this).val();

    if (window.fps == "unlocked") {
        window.fps = window.unlockedFPS;
        window.fpsUnlocked = true;
    } else {
        window.fpsUnlocked = false;
    }


    window.interval = 1 / window.fps;
});

//RESOLUTION
$('#resolution-select').on('change', function () {
    window.RENDERER.setPixelRatio(window.devicePixelRatio * $(this).val());
    //window.MAIN_CAMERA.updateProjectionMatrix();
    //window.MAIN_SCENE.updateWorldMatrix(false, true);

    //window.PORTAL_TARGETS = [new THREE.WebGLRenderTarget(1, 1), new THREE.WebGLRenderTarget(1, 1)]
    //window.PORTAL_TMP_TARGETS = [new THREE.WebGLRenderTarget(1, 1), new THREE.WebGLRenderTarget(1, 1)]
});

//SHADOW RESOLUTION
$('#shadows-resolution-select').on('change', function () {
    window.spotLight.shadow.mapSize.width = $(this).val();
    window.spotLight.shadow.mapSize.height = $(this).val();

    window.spotLight.shadow.map.dispose(); // important
    window.spotLight.shadow.map = null;
});

//FOV
$('#fov-val-range').on('input', function () {
    $("#fov-val-number").val($(this).val());
    window.MAIN_CAMERA.fov = $(this).val();
    window.MAIN_CAMERA.updateProjectionMatrix();
});

//MOUSE
$('#mouse-val-range').on('input', function () {
    $("#mouse-val-number").val($(this).val());

    if (!window.mobile)
        window.PointerControls.pointerSpeed = $(this).val();
    //else
    //    window.rotationMobile = $(this).val() * 0.1;
});

//GYRO
$("body").on('input', '#gyro-input', function () {
    window.gyro = !this.checked;
})

//BUTTON OPACITY
$("body").on('input', '#opacity-val-range', function () {
    $("#opacity-val-number").val($(this).val());
    $("#mobile-controls").css("opacity", $(this).val());
})

//BACK FROM EDITOR
$("body").on('click', '#back-editor', function () {

    window.STATS.container.style.display = "none";
    window.FPS = false;
    window.ROOM.visible = true;
    window.GROUP_STRUCTURE.visible = false;
    window.CONTROLS.enabled = true;
    window.MAIN_SCENE.environment = window.ENV_MAP_FPS;
    window.LIGHT_GROUP.visible = false;

    $("#ui").css("display", "block");
    $(".img").removeClass("image");
    $("#mobile-controls").css("display", "none");

    var bb = new THREE.Box3()
    bb.setFromObject(window.ROOM);
    bb.getCenter(window.CONTROLS.target);

    window.CONTROLS.target.set(window.CONTROLS.target.x + 0, window.CONTROLS.target.y + 0, window.CONTROLS.target.z + 0);
    window.MAIN_CAMERA.position.set(-4.2, 13, 22.5)
    window.CONTROLS.update();
    $("#blocker").css("display", "none");
    $("#blocker").css("pointer-events", "none");
    $("#reticle").css("display", "none");
    window.MAIN_CAMERA.remove(window.GUN);

    if (window.PORTALS.length == 1) {
        window.MAIN_SCENE.remove(window.PORTALS[0]);
    } else if (window.PORTALS.length == 2) {
        window.MAIN_SCENE.remove(window.PORTALS[1]);
        window.MAIN_SCENE.remove(window.PORTALS[0]);
    }
    window.PORTALS = [null, null];
});