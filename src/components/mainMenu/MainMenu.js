import { PlaneGeometry, Mesh, Color, Clock, Object3D, Vector2 } from 'three';
import $ from 'jquery';
import { addConnectionPoints, addItem } from '../items/AddItem.js';
import { GLOBALS, reset } from '../../Globals.js';
import '../shaders/MainMenuShader.js';
import { init } from '../../Main.js';
import { AUDIO, play } from '../audio/Audio.js';
import { addTileGel } from '../gels/Gels.js';
import { loadDefault } from '../loadObj/LoaderOBJ.js';
import { backToEditor } from '../test/BackToEditor.js';

var plane1, plane2, level;
var transition = false;
var transition2 = false;
var stopMenuLoop = false;
let clock = new Clock();
window.unlockedFPS = 0;
window.isCustom = false;

$("#blocker").css("display", "flex");
$("#options-main").css("display", "block");
$("#loading-parent").css("opacity", "0");
$("#loading-parent").css("pointer-events", "none");

$("body").on('click', '#option-community-build, #option-single-load', function () { //
    setTimeout(() => {
        play(AUDIO.EDITOR);
        init();
    }, 2000);
});

$("body").on('click', '#back-main-menu', function () {

});

if (!stopMenuLoop) {
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

    startLevel();

    setTimeout(() => {
        if (!localStorage.getItem("level"))
            window.currentLevel = 1;
        else
            window.currentLevel = parseInt(localStorage.getItem("level"));

        stopMenuLoop = true;
        GLOBALS.LOADED_LEVEL = true;
        //loadDefault();
    }, 2000);

});

$('#next-map-btn').on('click', function () {

    $("#loading-parent").css("opacity", 1);
    $("#loading-parent").css("pointer-events", "all");
    $("#next-map").css("display", "none");

    backToEditor();

    setTimeout(() => {
        fetchLevel()
    }, 2000);

    /*localStorage.setItem("level", window.currentLevel + 1);
    localStorage.setItem("load", "true");

    window.open("https://" + window.location.host, "_self");*/
});

function fetchLevel() {
    fetch("./levels/tutorial_" + window.currentLevel + "_by_rafadante.json")
        .then(response => response.json())
        .then(json => {
            level = json;

            $("#portal-gun-select").val(level[0][0]).change();
            $("#ambient-sound-select").val(level[0][1]).change();

            loadLevelJSON();
        });
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

    $("#option-single").css("display", "none");
    $("#option-community").css("display", "none");
    $("#option-about").css("display", "none");
    $("#back-editor").css("display", "none");

    loadLevel(level[1])
}

$("body").on('click', '#option-community-build', function () {
    startLevel()
});

$("body").on('click', '#option-single-reset', function () {
    var check = window.confirm("Are you sure you want to reset your progress?");
    if (check == true)
        localStorage.setItem("level", 1);
});

function startLevel() {

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
            stopMenuLoop = true;
        }, 1000);
    }, 1000);
}

$("body").on('click', '#option-single', function () {
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "SINGLE PLAYER", "#options-single");
});

$("body").on('click', '#option-community', function () {
    optionMenu(GLOBALS.TEXTURE_MENU_GRID, "COMMUNITY CHAMBERS", "#options-community");
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

$("body").on('click', '#back-main', function () {
    GLOBALS.MATERIAL_SUB_MENU.uniforms.iTime.value = 1.2;
    transition2 = true;
    transition = false;
    GLOBALS.SCENE_CHILDREN.remove(plane1);
    GLOBALS.SCENE_CHILDREN.add(plane2);

    pointerState("none", "block", "", "none", ".option-main");
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
    if (!stopMenuLoop) {
        if (transition)
            GLOBALS.MATERIAL_MAIN_MENU.uniforms.iTime.value += clock.getDelta();

        if (transition2)
            GLOBALS.MATERIAL_SUB_MENU.uniforms.iTime.value += clock.getDelta();

        GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA)
        requestAnimationFrame(animate);
    }
}

$("body").on('click', '#load-level', function () {
    $("#load-level-panel").css("display", "flex")
})

$("body").on('click', '#close-load-level-panel', function () {
    $("#load-level-panel").css("display", "none");
})

$("body").on('click', '#option-community-play', function () {
    $(".main-option").css("display", "none")
    $(".sub-option").css("display", "grid")
});

var chamberName = "null";

$("#input-level").on('change', function (e) {
    var file = e.target.files[0];
    chamberName = file.name;
    var path = (window.URL || window.webkitURL).createObjectURL(file);
    readTextFile(path, function (text) {
        var data = JSON.parse(text);

        $("#portal-gun-select").val(data[0][0]).change();
        $("#ambient-sound-select").val(data[0][1]).change();
        loadLevel(data[1])

        /*for (var i = 0; i < data[1].length; i++) {
            AddGoo(data[1][i], true);
        }*/
    });
})

function readTextFile(file, callback) {
    var rawFile = new XMLHttpRequest();
    rawFile.overrideMimeType("application/json");
    rawFile.open("GET", file, true);
    rawFile.onreadystatechange = function () {
        if (rawFile.readyState === 4 && rawFile.status == "200") {
            callback(rawFile.responseText);
        }
    }
    rawFile.send(null);
}

window.totalItemsToLoad = 0;
window.totalItemsLoaded = 0;

function loadLevel(data) {

    $("#chamber-name-to-save").val(chamberName.substring(0, chamberName.indexOf("_by_")));
    $("#author-name-to-save").val(chamberName.split('_by_').pop().replace('.json', ''));

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
            data[i].item = GLOBALS.EXIT_DOOR;

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

    for (var i = 0; i < data.length; i++) {
        if (data[i].exists) {
            if (data[i].hasItem && data[i].itemName != "gel") {
                if (data[i].itemName.split('-')[0] != "exitDoor" &&
                    data[i].itemName.split('-')[0] != "enterDoor" &&
                    data[i].itemName.split('-')[0] != "window" &&
                    data[i].itemName.split('-')[0] != "dispenser") {
                    window.totalItemsToLoad++;
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
                    data[i].itemName.split('-')[0] != "dispenser") {

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

export {
    loadLevelJSON,
    fetchLevel
}