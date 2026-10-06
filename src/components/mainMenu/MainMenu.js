import { rememberChamber } from '../../multiplayer/loadedChamber';
import { readChamberFile } from '../../chambers/chamberFile';
import { applyChamberConfig } from '../ui/EditorInteractions.js';
import { readChamberConfig } from '../../multiplayer/chamberConfig.js';
import { PlaneGeometry, Mesh, Color, Clock, Object3D, Vector2, TextureLoader, SRGBColorSpace, RepeatWrapping } from 'three';
import $ from 'jquery';
import { addConnectionPoints, addItem } from '../items/AddItem.js';
import { GLOBALS, reset } from '../../Globals.js';
import '../shaders/MainMenuShader.js';
import { init } from '../../Main.js';
import { AUDIO, play } from '../audio/Audio.js';
import { addTileGel } from '../gels/Gels.js';
import { loadDefault } from '../loadObj/LoaderOBJ.js';
import { backToEditor } from '../test/BackToEditor.js';
import { playVoiceTrigger } from '../triggers/Triggers.js';
import JSZip, { file } from 'jszip';
import { v4 as uuidv4 } from 'uuid';
import { apertureStyle } from '../materials/Materials.js';

var plane1, plane2, level;
var transition = false;
var transition2 = false;
window.stopMenuLoop = false;
let clock = new Clock();
window.unlockedFPS = 0;
window.isCustom = false;

$("#blocker").css("display", "flex");
$("#options-main").css("display", "block");
$("#loading-parent").css("opacity", "0");
$("#loading-parent").css("pointer-events", "none");

$("body").on('click', '#option-community-build, #option-single-load', function () { //
    //alert("The level editor is still very unstable, and things will change a lot in the coming weeks, so maps can break in future updates. Feel free to mess around with it.");


    $("#alert").css("opacity", "1");
    $("#alert span").text("The level editor is still very unstable, and things will change a lot in the coming weeks, so maps can break in future updates. Feel free to mess around with it.");

    setTimeout(() => {
        $("#alert").css("opacity", "0");
    }, 10000);

    setTimeout(() => {
        play(AUDIO.EDITOR);
        init();
    }, 2000);
});


$("body").on('click', '#back-main-map-btn, #back-main-menu', function () {

    $("#blocker .body").css("opacity", "1");

    $("#blocker").css("display", "flex");
    $("#ui").css("display", "none");
    $("#blocker .body").css("opacity", "1");



    $(".optionMenu").css("display", "none");
    $("#options-main").css("display", "block");
    //$("#container").css("display", "none");

    $("#options-settings").css("display", "none");


    $("#settings-close").css("display", "none");

    $("#next-map").css("display", "none");


    $("#options-main .option").css("display", "block");



    window.stopMenuLoop = false;
    //window.location.reload();

    //animate()
});


if (!window.stopMenuLoop) {
    setTimeout(() => {
        var planegeometry = new PlaneGeometry(1, 1);
        plane1 = new Mesh(planegeometry, GLOBALS.MATERIAL_MAIN_MENU);
        GLOBALS.SCENE_CHILDREN.add(plane1);

        var planegeometry = new PlaneGeometry(1, 1);
        plane2 = new Mesh(planegeometry, GLOBALS.MATERIAL_SUB_MENU);

        GLOBALS.SCENE.background = new Color(0x000000)

        planeFitPerspectiveCamera(plane1, GLOBALS.MAIN_CAMERA)

        animate();
        window.addEventListener('resize', onWindowResize);
    }, 1000);
}

function onWindowResize() {
    GLOBALS.RENDERER.setSize(window.innerWidth, window.innerHeight);

    GLOBALS.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();

    GLOBALS.MATERIAL_MAIN_MENU.uniforms.resolution.value = new Vector2(window.innerWidth, window.innerHeight);
    GLOBALS.MATERIAL_SUB_MENU.uniforms.resolution.value = new Vector2(window.innerWidth, window.innerHeight);

    planeFitPerspectiveCamera(plane1, GLOBALS.MAIN_CAMERA)
}

function planeFitPerspectiveCamera(plane, camera, relativeZ = null) {
    const cameraZ = relativeZ !== null ? relativeZ : camera.position.z;
    const distance = cameraZ - plane.position.z;
    const vFov = camera.fov * Math.PI / 180;
    const scaleY = 2 * Math.tan(vFov / 2) * distance;
    const scaleX = scaleY * camera.aspect;

    plane.scale.set(scaleX, scaleY, 1);
    plane2.scale.set(scaleX, scaleY, 1);
}

$("body").on('click', '#option-single-load', function () {

    window.chamberID = null;

    $("#next-map-btn").css("display", "block");

    startLevel();

    setTimeout(() => {
        /*if (!localStorage.getItem("level"))
        window.currentLevel = 1;
        else
        window.currentLevel = parseInt(localStorage.getItem("level"));*/

        window.currentLevel = 1;

        window.stopMenuLoop = true;
        GLOBALS.LOADED_LEVEL = true;
        //loadDefault();
    }, 2000);

});

$('#next-map-btn').on('click', function () {

    window.chamberID = null;

    $("#loading-parent").css("opacity", 1);
    $("#loading-parent").css("pointer-events", "all");
    $("#next-map").css("display", "none");

    backToEditor();

    setTimeout(() => {
        fetchLevel()
    }, 2000);

    //localStorage.setItem("level", window.currentLevel + 1);

    /*localStorage.setItem("level", window.currentLevel + 1);
    localStorage.setItem("load", "true");

    window.open("https://" + window.location.host, "_self");*/
});

function fetchLevel() {

    var path = "./levels/tutorial_" + window.currentLevel + "_by_rafadante.json";

    if (single)
        path = custompath;

    if (window.isCustom && !single) {

        level = custompath;

        chamberName = "tutorial_" + window.currentLevel + "_by_rafadante";

        $("#portal-gun-select").val(level[0][0]).change();
        $("#ambient-sound-select").val(level[0][1]).change();

        if (level[0][2])
            $("#color-wall-portal").val(level[0][2]).change();

        if (level[0][3])
            $("#chamber_style-select").val(level[0][3]).change();

        loadLevelJSON();

    } else {
        fetch(path)
            .then(response => response.json())
            .then(json => {
                level = json;

                chamberName = "tutorial_" + window.currentLevel + "_by_rafadante";

                $("#portal-gun-select").val(level[0][0]).change();
                $("#ambient-sound-select").val(level[0][1]).change();

                if (level[0][2])
                    $("#color-wall-portal").val(level[0][2]).change();

                if (level[0][3])
                    $("#chamber_style-select").val(level[0][3]).change();

                loadLevelJSON();
            });
    }
}

$("body").on('click', '.load-custom', function () {
    window.isCustom = true;
    init();
    fetch("./levels/custom/" + $(this).data("id") + ".json")
        .then(response => response.json())
        .then(json => {
            level = json;
            GLOBALS.LOADED_LEVEL = true;
            startLevel();
        });
});

var custompath;

var first = true;

window.allowEdit = false;

var single = false;


$("body").on('click', '.custom-chamber1', function () {

    single = true;
    /*window.isCustom = true;
    //init();
    fetch("./community/The_Return_Chamber_17_by_FlameDogo99.json")
        .then(response => response.json())
        .then(json => {
            level = json;
            GLOBALS.LOADED_LEVEL = true;
            startLevel();

            level = json;

            chamberName = "tutorial_" + window.currentLevel + "_by_rafadante";

            $("#portal-gun-select").val(level[0][0]).change();
            $("#ambient-sound-select").val(level[0][1]).change();

            loadLevelJSON();
        });*/

    $("#next-map-btn").css("display", "none");

    //

    window.isCustom = true;

    if ($(this).parent().attr("id") == "list-custm-chambers")
        $("#next-map-btn").css("display", "none");
    else {
        $("#next-map-btn").css("display", "block");
        window.currentLevel = $(this).data("id");
    }

    setTimeout(() => {

        custompath = $(this).data("name") + ".json";

        window.stopMenuLoop = true;
        GLOBALS.LOADED_LEVEL = true;
    }, 2000);

    //

    if (first) {

        setTimeout(() => {
            init();
        }, 2000);

        startLevel();

    } else {
        $("#loading-parent").css("opacity", 1);
        $("#loading-parent").css("pointer-events", "all");
        $("#next-map").css("display", "none");

        $("#options-settings").css("display", "block");
        $("#options-main").css("display", "none");
        $("#options-single").css("display", "none");
        $("#options-community").css("display", "none");
        $("#container").css("display", "block");

        $("#back-main").css("display", "none");
        $("#settings-close").css("display", "block");

        backToEditor();


        setTimeout(() => {
            fetchLevel()
        }, 2100);
    }

    first = false;

});

async function manageLoadCustom(json, user_id, chamber_id, name, finished, played1, mine) {
    single = false;
    window.allowEdit = false;

    $("#next-map-btn").css("display", "none");

    window.isCustom = true;

    /*if (elem.parent().parent().attr("id") == "list-custm-chambers")
        $("#next-map-btn").css("display", "none");
    else {
        $("#next-map-btn").css("display", "block");
        window.currentLevel = elem.parent().data("id");
    }*/

    if (mine == "mine")
        window.allowEdit = true;

    const session = await window["getSession"]();

    setTimeout(() => {

        //custompath = $(this).data("json");
        //var tt = window.arrayJSON[$(this).parent().data("jsonid")];

        custompath = json;

        /*console.log(custompath)
        console.log(JSON.stringify(custompath))

        var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(custompath));
        var dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);
        dlAnchorElem.setAttribute("download", "chamber.json");
        dlAnchorElem.click();*/

        window.chamberID = chamber_id;
        window.chamberUSERID = user_id;
        window.chamberFinished = finished;

        const played = parseInt(played1) + 1;

        window.session = session;

        if (user_id != session.user.id) {
            window["updateChamberPlayedValue"](chamber_id, played);
        }

        window.stopMenuLoop = true;
        GLOBALS.LOADED_LEVEL = true;
    }, 2000);

    //


    $("#chamber-name-to-save").val(name);

    if (first) {

        setTimeout(() => {
            init();
        }, 2100);

        startLevel();

    } else {
        $("#next-map").css("display", "none");

        $("#options-settings").css("display", "block");
        $("#options-main").css("display", "none");
        $("#options-single").css("display", "none");
        $("#options-community").css("display", "none");
        $("#container").css("display", "block");

        $("#back-main").css("display", "none");
        $("#settings-close").css("display", "block");

        backToEditor();


        setTimeout(() => {
            fetchLevel()
        }, 2100);
    }

    first = false;
}

if (localStorage.getItem("load") == "true") {

    $("#loading-parent").css("opacity", "1");
    $("#loading-parent").css("pointer-events", "all");

    localStorage.setItem("load", "false");

    setTimeout(() => {

        window.currentLevel = parseInt(localStorage.getItem("level"));

        init();

        fetch("./levels/" + window.currentLevel + ".json")
            .then(response => response.json())
            .then(json => {
                level = json;
                GLOBALS.LOADED_LEVEL = true;

                startLevel();
                /*setTimeout(() => {
                    loadLevel(json[0]);
    
                    for (var i = 0; i < json[1].length; i++) {
                        AddGoo(json[1][i], true);
                    }
                }, 3000);*/
                //Do something with json variable
            });
    }, 1000);
}

function loadLevelJSON() {
    rememberChamber(level);
    applyChamberConfig(readChamberConfig(level));

    $("#option-single").css("display", "none");
    $("#option-community").css("display", "none");
    $("#option-about").css("display", "none");

    if (!window.allowEdit)
        $("#back-editor").css("display", "none");
    else
        $("#back-editor").css("display", "block");

    loadLevel(level[1])
}

$("body").on('click', '#option-community-build', function () {
    window.allowEdit = true;
    startLevel()
});

$("body").on('click', '#option-single-reset', function () {
    var check = window.confirm("Are you sure you want to reset your progress?");
    if (check == true) {
        localStorage.setItem("level", 1);
        window.location.reload();
    }
});

function startLevel() {

    $(".settings-menu").css("width", "80%");
    $(".settings-menu").css("max-height", "60%");
    $(".settings-menu").css("height", "auto");

    $("#settings-menu-title").css("display", "block");

    $(".body").css("z-index", "1");
    $(".body").css("margin-left", "15vh");
    $(".body").css("background-color", "transparent");

    $("#blocker .body").css("opacity", "0");
    $("#logo").css("opacity", "0");

    GLOBALS.MATERIAL_MAIN_MENU.uniforms.iChannel0.value = GLOBALS.MATERIAL_MAIN_MENU.uniforms.iChannel1.value;
    GLOBALS.MATERIAL_MAIN_MENU.uniforms.iChannel1.value = null;
    GLOBALS.MATERIAL_MAIN_MENU.uniforms.iTime.value = 1.2;

    transition = true;
    transition2 = false;
    GLOBALS.SCENE_CHILDREN.add(plane1);
    GLOBALS.SCENE_CHILDREN.remove(plane2);

    setTimeout(() => {
        $("#loading-parent").css("opacity", "1");
        $("#loading-parent").css("pointer-events", "all");

        setTimeout(() => {
            $("#blocker").css("display", "none");
            $("#ui").css("display", "block");
            $("#container #back-effect").css("display", "none");
            $("#blocker .body").css("opacity", "1");

            $(".option-main").css("display", "none");
            $("#options-settings").css("display", "block");
            $("#settings-menu-title").text("OPTIONS");
            $("#back-main").css("display", "none");
            $("#settings-close").css("display", "block");
            $("#main-container").css("display", "block");

            GLOBALS.SCENE_CHILDREN.remove(plane1);
            GLOBALS.SCENE_CHILDREN.remove(plane2);
            GLOBALS.SCENE.background = null;
            window.stopMenuLoop = true;
        }, 1000);
    }, 1000);
}

$("body").on('click', '#option-single', function () {
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "SINGLE PLAYER", "#options-single");
});

$("body").on('click', '#option-community', function () {
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "CUSTOM CHAMBERS", "#options-community");
    $(".main-option").css("display", "flex")
    $(".sub-option").css("display", "none")
});

$("body").on('click', '#option-options', function () {
    $("#back-editor").css("display", "none");
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "OPTIONS", "#options-settings");
});

$("body").on('click', '#option-about', function () {
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "ABOUT", "#options-about");
});

$("body").on('click', '#option-patreon', function () {
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "PATREON", "#options-patreon");
});

function optionMenu(texture, title, id) {
    GLOBALS.MATERIAL_MAIN_MENU.uniforms.iChannel1.value = texture;
    GLOBALS.MATERIAL_SUB_MENU.uniforms.iChannel1.value = texture;
    GLOBALS.MATERIAL_MAIN_MENU.uniforms.iTime.value = 1.2;
    GLOBALS.MATERIAL_SUB_MENU.uniforms.iTime.value = 1.2;
    transition = true;

    if (transition2) {
        transition2 = false;
        GLOBALS.SCENE_CHILDREN.add(plane1);
        GLOBALS.SCENE_CHILDREN.remove(plane2);
    }

    pointerState("block", "none", title, "flex", id);
}

$("body").on('click', '#back-main, #back-main2', function () {
    console.log("iiiiiiiiiiiii")
    GLOBALS.MATERIAL_SUB_MENU.uniforms.iTime.value = 1.2;
    transition2 = true;
    transition = false;
    GLOBALS.SCENE_CHILDREN.remove(plane1);
    GLOBALS.SCENE_CHILDREN.add(plane2);

    pointerState("none", "block", "", "none", ".option-main");

    $(".settings-menu").css("width", "80%");
    $(".settings-menu").css("max-height", "60%");
    $(".settings-menu").css("height", "auto");

    $("#settings-menu-title").css("display", "block");

    $(".body").css("z-index", "1");
    $(".body").css("margin-left", "15vh");
    $(".body").css("background-color", "transparent");

    $("#custom-menu2").css("display", "none");
});

function pointerState(display1, display2, title, titleDisplay, id) {
    $("#blocker .body").css("opacity", "0");
    $("#logo").css("opacity", "0");
    $("#blocker").css("pointer-events", "none");
    setTimeout(() => {
        $("#options-main").css("display", display2);
        $(id).css("display", display1);
        $("#back-main").css("display", display1);

        $("#settings-menu-title").css("display", titleDisplay);
        $("#settings-menu-title").text(title);

        $("#blocker").css("pointer-events", "all");
        $("#blocker .body").css("opacity", "1");
        $("#logo").css("opacity", "1");
    }, 2000);
}

function animate(time) {
    if (!window.stopMenuLoop) {
        if (transition)
            GLOBALS.MATERIAL_MAIN_MENU.uniforms.iTime.value += clock.getDelta();

        if (transition2)
            GLOBALS.MATERIAL_SUB_MENU.uniforms.iTime.value += clock.getDelta();

        GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA)
        requestAnimationFrame(animate);
    }
}

$("body").on('click', '#load-level, #option-chamber-file', function () {
    $('#chamber-file-status').text('');
    $("#load-level-panel").css("display", "flex")
})

$("body").on('click', '#close-load-level-panel', function () {
    $("#load-level-panel").css("display", "none");
})

$("body").on('click', '#option-community-play', function () {
    $(".main-option").css("display", "none")
    $(".sub-option").css("display", "grid")

    $(".settings-menu").css("width", "100%");
    $(".settings-menu").css("max-height", "100%");
    $(".settings-menu").css("height", "100%");

    $("#settings-menu-title").css("display", "none");

    $(".body").css("z-index", "10000000");
    $(".body").css("margin-left", "0px");
    $(".body").css("background-color", "black");

    $("#custom-menu2").css("display", "block");
});

var chamberName = "null";

$('body').on('change', '#input-level', async function (event) {
    const input = event.target, file = input.files?.[0];
    if (!file) return;
    input.disabled = true;
    $('#chamber-file-status').text('Lendo arquivo…');
    try {
        // Read and validate before changing the currently open chamber.
        const data = await readChamberFile(file);
        GLOBALS.MULTIPLAYER?.close();
        if (GLOBALS.FPS_MODE) backToEditor();
        if (!GLOBALS.PLANE_LEVEL_INSTANCED || !window.stopMenuLoop) {
            $('#option-community-build').trigger('click');
            await new Promise((resolve, reject) => {
                const deadline = Date.now() + 60000;
                const timer = setInterval(() => {
                    if (GLOBALS.PLANE_LEVEL_INSTANCED && GLOBALS.ENTER_DOOR && GLOBALS.EXIT_DOOR && window.stopMenuLoop) {
                        clearInterval(timer); resolve();
                    } else if (Date.now() > deadline) {
                        clearInterval(timer); reject(new Error('O editor não terminou de carregar. Tente novamente.'));
                    }
                }, 100);
            });
        }
        window.chamberID = null; window.chamberUSERID = null;
        window.allowEdit = true; window.isCustom = false; single = false;
        GLOBALS.LOADED_LEVEL = false;
        chamberName = file.name;
        $('#portal-gun-select').val(data[0][0] || 'all').change();
        $('#ambient-sound-select').val(data[0][1] || 'none').change();
        $('#color-wall-portal').val(data[0][2] || '#ffffff').change();
        $('#chamber_style-select').val(data[0][3] || 'standard').change();
        rememberChamber(data);
        applyChamberConfig(readChamberConfig(data));
        loadLevel(data[1]);
        $('#back-editor').css('display', 'block');
        $('#load-level-panel').css('display', 'none');
        $('#chamber-file-status').text('');
    } catch (error) {
        $('#chamber-file-status').text(error.message || 'Não foi possível carregar a câmara.');
    } finally {
        input.disabled = false;
        input.value = '';
    }
});
window.totalItemsToLoad = 0;
window.totalItemsLoaded = 0;

function loadLevel(data) {

    for (var i = GLOBALS.CANNON_BODIES_CONTINUOUS.length - 1; i >= 0; i--) {
        GLOBALS.CANNON_WORLD.remove(GLOBALS.CANNON_BODIES_CONTINUOUS[i]);
    }

    for (var i = GLOBALS.LASERS.children.length - 1; i >= 0; i--) {
        GLOBALS.LASERS.remove(GLOBALS.LASERS.children[i]);
    }

    GLOBALS.EXIT_DOOR.finished = false;

    if (GLOBALS.CORRIDOR_ENTER) {
        const map = new TextureLoader().load('./levels/signs/' + window.currentLevel + '.webp');
        map.colorSpace = SRGBColorSpace;
        map.wrapS = map.wrapT = RepeatWrapping;
        map.flipY = false;
        GLOBALS.CORRIDOR_ENTER.getObjectByName("sign").visible = true;
        GLOBALS.CORRIDOR_ENTER.getObjectByName("sign").material.map = map;
        GLOBALS.CORRIDOR_ENTER.getObjectByName("sign").material.envMapIntensity = 0;
        GLOBALS.CORRIDOR_ENTER.getObjectByName("sign").scale.z = -1;
    }

    if (!window.chamberID) {
        const base = chamberName.replace(/\.(json|zip)$/i, '');
        const split = base.lastIndexOf('_by_');
        $("#chamber-name-to-save").val(split >= 0 ? base.slice(0, split) : base);
        $("#author-name-to-save").val(split >= 0 ? base.slice(split + 4) : '');
    }


    var toRemove = [];
    for (var i = 0; i < GLOBALS.ITEMS_ADDED.children.length; i++) {
        if (GLOBALS.ITEMS_ADDED.children[i].instanceMatrix) {
            for (var j = 0; j < GLOBALS.ITEMS_ADDED.children[i].count; j++) {
                var instanced = GLOBALS.ITEMS_ADDED.children[i];
                var dummy = new Object3D();
                dummy.scale.set(0, 0, 0);
                dummy.position.set(100000, 100000, 100000);
                dummy.updateMatrix();
                instanced.setMatrixAt(j, dummy.matrix);
                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();
            }
        } else {
            toRemove.push(GLOBALS.ITEMS_ADDED.children[i])
        }
    }

    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[i].gelType) {

            GLOBALS.PLANE_USER_DATA[i].hasItem = false;
            GLOBALS.PLANE_USER_DATA[i].itemName = null;
            GLOBALS.PLANE_USER_DATA[i].gelType = null;

            var color;
            if (GLOBALS.PLANE_USER_DATA[i].portal)
                color = 0xffffff;
            else
                color = 0x808080;

            GLOBALS.PLANE_USER_DATA[i].planeColor = color;
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(i, new Color(color));
            //GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

            const index = GLOBALS.GELS.indexOf(GLOBALS.PLANE_USER_DATA[i]);
            if (index > -1) {
                GLOBALS.GELS.splice(index, 1);
            }
        }
    }

    for (var i = 0; i < toRemove.length; i++)
        GLOBALS.ITEMS_ADDED.remove(toRemove[i]);

    reset();

    for (var prop in GLOBALS.DYMANIC_ITEMS) {
        for (var i = 0; i < GLOBALS.DYMANIC_ITEMS[prop].length; i++)
            GLOBALS.DYMANIC_ITEMS[prop][i] = [];
    }

    GLOBALS.PLANE_USER_DATA = data;
    var clone = new Object3D();
    var triggers = [];

    for (var i = 0; i < data.length; i++) {

        if (data[i].exists) {

            clone.rotation.copy(data[i].rotation);
            clone.position.copy(data[i].position);
            clone.scale.set(1, 1, 1);

            clone.updateMatrix();
            GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(i, clone.matrix);
            GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(i, true);

            if (data[i].portal)
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(i, new Color().setHex(0xffffff));
            else
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(i, new Color().setHex(0x808080));

            var planeColor = 0x808080;

            if (data[i].portal)
                planeColor = 0xffffff;

            data[i].planeColor = planeColor;
        } else {
            GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(i, false);
        }

        if (data[i].itemName == "exitDoor") {
            GLOBALS.EXIT_DOOR.position.set(data[i].position.x, data[i].position.y, data[i].position.z);
            GLOBALS.EXIT_DOOR.rotation.copy(data[i].rotation);

            GLOBALS.EXIT_DOOR.userData = data[i].item;
            GLOBALS.EXIT_DOOR.userData.connections = 0;
            GLOBALS.EXIT_DOOR.userData.buttons = 0;
            GLOBALS.EXIT_DOOR.userData.played = false;
            data[i].item = GLOBALS.EXIT_DOOR;

            playVoiceTrigger(data[i].item.userData, false);

            addConnectionPoints(data[i]);
        } else if (data[i].itemName == "enterDoor") {

            GLOBALS.ENTER_DOOR.position.set(data[i].position.x, data[i].position.y, data[i].position.z)
            GLOBALS.ENTER_DOOR.rotation.copy(data[i].rotation)

            GLOBALS.ENTER_DOOR.userData = data[i].item;
            data[i].item = GLOBALS.ENTER_DOOR;

            addConnectionPoints(data[i]);
        } else if (data[i].itemName == "window") {
            GLOBALS.OBSERVATION_ROOM_IMG.position.set(data[i].position.x, data[i].position.y, data[i].position.z)
            GLOBALS.OBSERVATION_ROOM_IMG.rotation.copy(data[i].rotation)

            GLOBALS.OBSERVATION_ROOM_IMG.userData = data[i].item;
            data[i].item = GLOBALS.OBSERVATION_ROOM_IMG;
        } else if (data[i].itemName == "gel") {
            addTileGel(data[i], data[i].gelType, data[i].planeColor, data[i].id_instanced);
        }

        data[i].hasGoo = false;
    }

    GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

    window.totalItemsToLoad = 0;
    window.totalItemsLoaded = 0;

    window.gooToLoad = [];

    for (var i = 0; i < data.length; i++) {
        if (data[i].exists) {
            if (data[i].hasItem && data[i].itemName != "gel") {
                if (data[i].itemName.split('-')[0] != "exitDoor" &&
                    data[i].itemName.split('-')[0] != "enterDoor" &&
                    data[i].itemName.split('-')[0] != "window" &&
                    data[i].itemName.split('-')[0] != "dispenser" &&
                    data[i].itemName.split('-')[0] != "goo") {
                    window.totalItemsToLoad++;
                } else if (data[i].itemName.split('-')[0] == "goo") {
                    window.gooToLoad.push(data[i]);
                }
            }
        }
    }

    for (var i = 0; i < data.length; i++) {

        if (data[i].exists) {

            if (data[i].hasItem && data[i].itemName != "gel") {

                if (data[i].itemName.split('-')[0] != "exitDoor" &&
                    data[i].itemName.split('-')[0] != "enterDoor" &&
                    data[i].itemName.split('-')[0] != "window" &&
                    data[i].itemName.split('-')[0] != "dispenser" &&
                    data[i].itemName.split('-')[0] != "goo") {

                    const state = data[i].state;
                    addItem(data[i], true)

                    data[i].state = state;

                    if (data[i].trigger) {
                        triggers.push(data[i]);
                    }
                }
            }
        }
    }

    for (var i = 0; i < window.checkers.instances.length; i++) {
        window.checkers.instances[i].visible = false;
    }

    for (var i = GLOBALS.LINES.children.length - 1; i >= 0; i--) {
        GLOBALS.LINES.remove(GLOBALS.LINES.children[i])
    }
}

//
var customElement;

$("body").on('click', '.open-menu-chamber', function () {
    $("#menu-chamber").css("display", "flex");

    $("#menu-chamber-top").css("background-image", $(this).parent().find(".span-chamber").css("background-image"));
    customElement = $(this).parent().find(".span-chamber");
});

$("body").on('click', '#btn-close-custom-panel', function () {
    $("#menu-chamber").css("display", "none");
});


window["playCustom"] = async function (image, path, user_id, chamber_id, name, finished, played1, mine) {
    console.log("uuuuuuuuuuuuu")
    $("#menu-chamber").css("display", "none");
    $("#custom-menu2").css("display", "none");

    //

    $("#gallery-img").css("background-image", "url(" +image + ")")

    $("#loading-parent").css("opacity", 1);
    $("#loading-parent").css("pointer-events", "all");

    const zipURL = await window["getZipPath"](path);

    const elem = customElement;

    await fetch(zipURL + "?" + uuidv4())
        .then(res => res.blob()) // Gets the response and returns it as a blob
        .then(blob => {
            // Here's where you get access to the blob
            // And you can use it for whatever you want
            // Like calling ref().put(blob)

            // Here, I use it to make an image appear on the page
            let objectURL = URL.createObjectURL(blob);

            var zip = new JSZip();
            zip.loadAsync(blob /* = file blob */)
                .then(function (zip) {
                    // process ZIP file content here

                    zip.file("data.json").async("string").then(function (data) {
                        // data is a string
                        // TODO Your code goes here!

                        manageLoadCustom(JSON.parse(data), user_id, chamber_id, name, finished, played1, mine)
                    })
                }, function () { alert("Not a valid zip file") });
        });
};

// Network sessions enter the same editor/load/test pipeline as local files.
async function loadNetworkChamber(document, cancelled = () => false) {
    const waitFor = predicate => new Promise((resolve, reject) => {
        const deadline = Date.now() + 60000;
        const timer = setInterval(() => {
            if (cancelled() || Date.now() > deadline) {
                clearInterval(timer); reject(new Error('Chamber loading cancelled or timed out.'));
            } else if (predicate()) { clearInterval(timer); resolve(); }
        }, 100);
    });
    GLOBALS.LOADED_LEVEL = false;
    if (!GLOBALS.PLANE_LEVEL_INSTANCED || !window.stopMenuLoop) $('#option-community-build').trigger('click');
    await waitFor(() => GLOBALS.PLANE_LEVEL_INSTANCED && GLOBALS.ENTER_DOOR && GLOBALS.EXIT_DOOR && window.stopMenuLoop);
    chamberName = 'Multiplayer_by_Host.json';
    window.chamberID = null;
    $('#portal-gun-select').val(document[0][0]).change();
    $('#ambient-sound-select').val(document[0][1]).change();
    if (document[0][2]) $('#color-wall-portal').val(document[0][2]).change();
    $('#chamber_style-select').val(document[0][3] || 'standard').change();
    rememberChamber(document);
    applyChamberConfig(readChamberConfig(document));
    loadLevel(document[1]);
    await waitFor(() => window.totalItemsLoaded >= window.totalItemsToLoad && window.allowTest);
    if (!cancelled()) $('#view-fps').trigger('click');
}

export {
    loadNetworkChamber,
    loadLevelJSON,
    fetchLevel
}
