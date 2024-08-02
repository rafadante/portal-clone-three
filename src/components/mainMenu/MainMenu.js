import {
    PlaneGeometry,
    Mesh,
    Color,
    Clock,
    Object3D,
    InstancedMesh
} from 'three';
import $ from 'jquery';
import {
    addItem,
} from '../items/AddItem.js';
import {
    AddGoo
} from '../goo/Goo.js';
import {
    viewFPS
} from '../test/Test.js';
import {
    GLOBALS,
    reset
} from '../../Globals.js';
import '../shaders/MainMenuShader.js';
import { findPath } from '../findPath/FindPath.js';
import { init } from '../../Main.js';
import { AUDIO, play } from '../audio/Audio.js';
import { manageConnection } from '../boxSelection/Connection.js';

var plane1;
var plane2;

var transition = false;
var transition2 = false;
var stopMenuLoop = false;

//
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

        setTimeout(() => {
            getMonitorFPS = false;
        }, 1000);
    }, 1000);
}

function onWindowResize() {
    GLOBALS.RENDERER.setSize(window.innerWidth, window.innerHeight);

    GLOBALS.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();
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

var level;
$("body").on('click', '#option-single-load', function () {
    fetch("./levels/1.json")
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
})

function loadLevelJSON() {
    loadLevel(level[0]);

    for (var i = 0; i < level[1].length; i++) {
        AddGoo(level[1][i], true);
    }

    viewFPS();
}

$("body").on('click', '#option-community-build', function () {
    startLevel()
});

function startLevel() {
    /*$("#blocker").css("display", "none");
        $("#ui").css("display", "block");
        $("#container #back-effect").css("display", "none");
        GLOBALS.SCENE_CHILDREN.remove(plane1);
        GLOBALS.SCENE_CHILDREN.remove(plane2);
        GLOBALS.SCENE.background = null;
        stopMenuLoop = true;*/

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

let clock = new Clock();

var t = [];
var getMonitorFPS = true;
window.unlockedFPS = 0;

function animate(time) {
    if (!stopMenuLoop) {

        if (getMonitorFPS) {
            t.unshift(time);
            if (t.length > 10) {
                var t0 = t.pop();
                window.unlockedFPS = Math.floor(1000 * 10 / (time - t0));
            }
        }

        if (transition)
            GLOBALS.MATERIAL_MAIN_MENU.uniforms.iTime.value += clock.getDelta();

        if (transition2)
            GLOBALS.MATERIAL_SUB_MENU.uniforms.iTime.value += clock.getDelta();

        GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA)
        requestAnimationFrame(animate);
    }
}

//
$("body").on('click', '#load-level', function () {
    $("#load-level-panel").css("display", "flex")
})

$("body").on('click', '#close-load-level-panel', function () {
    $("#load-level-panel").css("display", "none")
})

$("#input-level").on('change', function (e) {
    var file = e.target.files[0];
    var path = (window.URL || window.webkitURL).createObjectURL(file);
    readTextFile(path, function (text) {
        var data = JSON.parse(text);

        loadLevel(data[0])

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

function loadLevel(data) {

    var toRemove = [];
    for (var i = 0; i < GLOBALS.ITEMS_ADDED.children.length; i++) {
        if (GLOBALS.ITEMS_ADDED.children[i].instanceMatrix) {
            for (var j = 0; j < GLOBALS.ITEMS_ADDED.children[i].count; j++) {
                var instanced = GLOBALS.ITEMS_ADDED.children[i];
                var dummy = new Object3D();
                dummy.scale.set(0, 0, 0);
                dummy.updateMatrix();
                instanced.setMatrixAt(j, dummy.matrix);
                instanced.instanceMatrix.needsUpdate = true;
            }
        } else {
            toRemove.push(GLOBALS.ITEMS_ADDED.children[i])
        }
    }

    for (var i = 0; i < toRemove.length; i++) {
        GLOBALS.ITEMS_ADDED.remove(toRemove[i]);
    }

    reset();

    GLOBALS.PLANE_USER_DATA = data;
    GLOBALS.CUBES.remove(GLOBALS.PLANE_LEVEL_INSTANCED);

    const geometry = new PlaneGeometry(2, 2);

    GLOBALS.PLANE_LEVEL_INSTANCED = new InstancedMesh(geometry.clone(), GLOBALS.MATERIAL_PORTAL_EDITOR, GLOBALS.BUDGET);
    GLOBALS.PLANE_LEVEL_INSTANCED.frustumCulled = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.castShadow = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.receiveShadow = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.name = "cube-parent";
    GLOBALS.CUBES.add(GLOBALS.PLANE_LEVEL_INSTANCED);

    var clone = new Object3D();

    for (var i = 0; i < GLOBALS.BUDGET; i++) {
        clone.scale.set(0, 0, 0);
        clone.position.set(100000, 100000, 100000);
        clone.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(i, clone.matrix);
    }

    var triggers = [];

    for (var i = 0; i < data.length; i++) {

        if (data[i].exists) {

            clone.rotation.copy(data[i].rotation);
            clone.position.copy(data[i].position);
            clone.scale.set(1, 1, 1);

            clone.updateMatrix();
            GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(i, clone.matrix);

            //GLOBALS.PLANE_USER_DATA[i] = data[i];

            if (data[i].portal)
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(i, new Color().setHex(0xffffff));
            else
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(i, new Color().setHex(0x808080));

            GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        }

        if (data[i].itemName == "exitDoor") {
            GLOBALS.EXIT_DOOR.position.set(data[i].position.x, data[i].position.y, data[i].position.z);
            GLOBALS.EXIT_DOOR.rotation.copy(data[i].rotation);

            GLOBALS.EXIT_DOOR.userData = data[i].item;
            GLOBALS.EXIT_DOOR.userData.connections = 0;
            data[i].item = GLOBALS.EXIT_DOOR;

        } else if (data[i].itemName == "enterDoor") {
            GLOBALS.ENTER_DOOR.position.set(data[i].position.x, data[i].position.y, data[i].position.z)
            GLOBALS.ENTER_DOOR.rotation.copy(data[i].rotation)

            GLOBALS.ENTER_DOOR.userData = data[i].item;
            data[i].item = GLOBALS.ENTER_DOOR;
        } else if (data[i].itemName == "window") {
            GLOBALS.OBSERVATION_ROOM_IMG.position.set(data[i].position.x, data[i].position.y, data[i].position.z)
            GLOBALS.OBSERVATION_ROOM_IMG.rotation.copy(data[i].rotation)

            GLOBALS.OBSERVATION_ROOM_IMG.userData = data[i].item;
            data[i].item = GLOBALS.OBSERVATION_ROOM_IMG;
        }
    }

    for (var i = 0; i < data.length; i++) {

        if (data[i].exists) {

            if (data[i].hasItem) {

                if (data[i].itemName.split('-')[0] != "exitDoor" &&
                    data[i].itemName.split('-')[0] != "enterDoor" &&
                    data[i].itemName.split('-')[0] != "window" &&
                    data[i].itemName.split('-')[0] != "dispenser") {

                    const state = data[i].state;

                    addItem(GLOBALS.PLANE_USER_DATA[i], true)

                    GLOBALS.PLANE_USER_DATA[i].state = state;

                    if (data[i].trigger) {
                        triggers.push(GLOBALS.PLANE_USER_DATA[i]);
                    }
                }
            }
        }
    }

    //CONNECTIONS
    for (var g = 0; g < GLOBALS.LOADED_CONNECTIONS.length; g++) {
        for (var h = 0; h < GLOBALS.LOADED_CONNECTIONS[g]["data"].connectedTo.length; h++) {
            console.log(GLOBALS.PLANE_USER_DATA[GLOBALS.LOADED_CONNECTIONS[g]["data"].connectedTo[h]])
            console.log(GLOBALS.EXIT_DOOR)
            manageConnection(
                GLOBALS.LOADED_CONNECTIONS[g]["data"].connectedTo[h],
                GLOBALS.LOADED_CONNECTIONS[g]["item"]
            );
        }
    }
}

export {
    loadLevelJSON
}