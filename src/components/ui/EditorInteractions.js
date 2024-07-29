import $ from 'jquery';
import { ContinuousTrigger } from '../continuous/Continuous';
import { GLOBALS } from '../../Globals';
import { 
    Object3D, 
    Vector3, 
    Color, 
    Vector2, 
    Raycaster } from 'three';
import { animate } from '../../Main';
import { 
    planeInstanceReset, 
    deleteItemInstanced } from '../items/Items.js';
import {
    cubeState
} from '../cubeManager/CubeManager.js';
import {
    raycastSelected
} from '../boxSelection/BoxSelection.js';
import {
    hoverItem
} from '../items/Items.js';
import { addItem } from '../items/AddItem.js';

window.addEventListener("contextmenu", e => e.preventDefault());

var justClicked = false;
var raycaster = new Raycaster();


$("body").on('click', '#side-bar-left, #ui-top', function () {
    document.querySelector('.menu').classList.remove('menu-show');
});

$("body").on('click', '#rotate-item', function () {
    if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("door") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("faith_plate")) {

        var door = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName);
        door.rotation.y += Math.PI / 2;
    } else {
        for (var i = 0; i < 1; i++) { //GLOBALS.SELECTED_ID.length

            var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].itemName);

            var dummy = new Object3D();
            dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.position);
            dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.rotation);

            dummy.rotation.y += Math.PI / 2;

            dummy.updateMatrix();
            instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.userData.id, dummy.matrix)

            instanced.instanceMatrix.needsUpdate = true;
            instanced.computeBoundingSphere();

            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.rotation.copy(dummy.rotation);
        }
    }

    animate();
});

$("body").on('click', '#delete', function () {

    if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].isInstanced) {

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.otherSide.hasItem = false;
            GLOBALS.SCENE_CHILDREN.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous);
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge) {
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge)
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField) {
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField)
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.cloneLaserField) {

            var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName);
            var dummy = new Object3D();
            dummy.scale.set(0, 0, 0);
            dummy.updateMatrix();

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "laser_field")
                instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.cloneLaserID, dummy.matrix);
            else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "fizzler")
                instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.cloneFizzlerID, dummy.matrix);


            instanced.instanceMatrix.needsUpdate = true;
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "tractor_beam") {
            const index = GLOBALS.TRACTOR_BEAM.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous);
            if (index > -1) { // only splice array when item is found
                GLOBALS.TRACTOR_BEAM.splice(index, 1); // 2nd parameter means remove one item only
                GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.splice(index, 1); // 2nd parameter means remove one item only
            }
        }

        deleteItemInstanced(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], false);
    } else {
        GLOBALS.ITEMS_COUNT[GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName]["count"] -= 1;
        GLOBALS.ITEMS_ADDED.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item);
    }

    planeInstanceReset(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], false, null, null, null, null, null, null, null, false, null, false);
    $(".menu").removeClass("menu-show");

    animate()
});

$("body").on('input', '#state-dispenser', function () {

    var scale;

    if (this.checked)
        scale = new Vector3(1, 1, 1);
    else
        scale = new Vector3(0, 0, 0);

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.hasDispenser = this.checked;

    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
    var dummy = new Object3D();
    dummy.scale.copy(scale);
    dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserPosition);
    dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.rotation);
    dummy.updateMatrix();
    instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserID, dummy.matrix);
    instanced.instanceMatrix.needsUpdate = true;

    animate();
});

$("body").on('input', '#dispenser-opened', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.opened = this.checked;
})

$("body").on('input', '#state-lines', function () {
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
        if (GLOBALS.CONNECTIONS[i]['from'].itemName == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName)
            GLOBALS.CONNECTIONS[i]["line"].visible = this.checked;
    }

    animate();
})

$("body").on('input', '#state-pedetsal-infinity', function () {
    if (this.checked)
        $("#pedestal-timer").addClass("disabled");
    else
        $("#pedestal-timer").removeClass("disabled");

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.pedestalInfinity = this.checked;
});

$("body").on('input', '#pedestal-timer-value', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.pedestalValue = parseInt(this.value);
});

$("body").on('click', '.removeConnection', function () {

    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[$(this).data("id")]["line"]);
    GLOBALS.CONNECTIONS[$(this).data("id")]["to"].item.connections -= 1;

    //RESET UI
    GLOBALS.CONNECTIONS.splice($(this).data("id"), 1);
    $("#connections").empty();
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {

        if (GLOBALS.CONNECTIONS[i]['from'].itemName == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName) {
            var elem = '<li data-id="' + i + '" class="menu-item removeConnection">' +
                '<button type="button" class="menu-btn">' +
                '<i class="fas fa-times"></i>' +
                '<span class="menu-text">' + GLOBALS.CONNECTIONS[i]["to"].itemName + '</span>' +
                '</button>' +
                '</li>';

            $("#connections").append(elem);
        }
    }

    animate();
});

$("body").on('mouseenter', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.position.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].position);
    GLOBALS.ITEM_CUBE.rotation.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].rotation);
    GLOBALS.ITEM_CUBE.translateZ(1)
    GLOBALS.ITEM_CUBE.material.color = new Color(0xff0000);
    GLOBALS.ITEM_CUBE.visible = true;
    animate();
});

$("body").on('mouseleave', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.visible = false;
});

$("body").on('click', '.tile-nonPortal', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (!GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].tile = $(this).data("id");
        }
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '.tile-portal', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].tile = $(this).data("id");
        }
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('input', '#tractor-state-input, #light-bridge-state-input, #laser-field-state-input,#fizzler-state-input', function () {

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.state = this.checked;
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.visible = this.checked;

    if ($(this).attr("id") == "light-bridge-state-input") {
        if (this.checked)
            GLOBALS.CANNON_WORLD.addBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge);
        else
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge);
    }

    animate();
});

$("body").on('input', '#tractor-direction-input', function () {

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.reversed = this.checked;

    if (this.checked)
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE;
    else
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM;

    animate();
});

$("body").on('click', '.tractor-triggers', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.triggers = $(this).data("trigger");
    $("#tractor-trigger").data("trigger", $(this).data("trigger"))
    $("#tractor-trigger").find(".title").text("Triggers: " + $(this).data("trigger"));
});

$("body").on('input', '#ligh-color-input', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.lightColor = this.value;
});

$("body").on('click', '.light-bridge-triggers', function () {
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], $(this).data("trigger"), $("#light-bridge-trigger"), "light_bridge")
});

$("body").on('click', '.laser-field-triggers', function () {
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], $(this).data("trigger"), $("#laser-field-trigger"), "laser_field")
});

$("body").on('click', '.fizzler-triggers', function () {
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], $(this).data("trigger"), $("#fizzler-trigger"), "fizzler")
});

//
document.getElementById("container").addEventListener('pointerdown', onDocumentMouseDown, false);
document.getElementById("container").addEventListener('pointermove', onDocumentMouseMove, false);
document.getElementById("container").addEventListener('pointerup', onDocumentMouseUp, false);
document.getElementById("container").addEventListener('wheel', onDocumentMouseWheel, false);

$(document).on('keypress', function (event) {
    if (!GLOBALS.FPS_MODE) {
        if (event.keyCode === 45 && !justClicked) { // minus
            cubeState("minus");
        } else if ((event.keyCode === 43 || event.keyCode === 61) && !justClicked) { // plus
            cubeState("plus");
        }
        if (!justClicked) {
            justClicked = true;
            setTimeout(() => {
                justClicked = false;
            }, 100);
        }
        animate();
    }
});

function onDocumentMouseDown(event) {
    if (!GLOBALS.FPS_MODE) {
        raycastManager(event, "down");
        animate();
    }
}

function onDocumentMouseWheel() {
    animate();
}

function onDocumentMouseMove(event) {
    if (!GLOBALS.FPS_MODE) {
        mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycastManager(event, "move");
        animate()
    }
}

function onDocumentMouseUp(event) {
    if (!GLOBALS.FPS_MODE) {
        GLOBALS.SELECTED_SIDE = null;
        GLOBALS.SELECTING = false;
        GLOBALS.CONTROLS.enabled = true;
        GLOBALS.CONTROLS.update();

        if (GLOBALS.ITEM_HOLDED_NAME || GLOBALS.CONNECTING) {
            raycastManager(event, "up");
        }

        GLOBALS.ITEM_HOLDED_NAME = null;
        GLOBALS.DRAGGED_ITEM_ELEMENT = null;
        $("#follow").css("display", "none");

        if (GLOBALS.DRAGGING) {
            GLOBALS.SELECTED_ID = [];
            GLOBALS.DRAGGING = false;
        }

        if (GLOBALS.SELECTED) {
            if (!GLOBALS.SELECTED.userData.hasItem)
                GLOBALS.ITEM_CUBE.visible = false;
        } else {
            GLOBALS.ITEM_CUBE.visible = false;
        }

        animate();
    }
}

const mouse2 = new Vector2(1, 1);

function raycastManager(event, type) {
    if (!GLOBALS.FPS_MODE && GLOBALS.PLANE_LEVEL_INSTANCED) {

        raycaster.setFromCamera(mouse2, GLOBALS.MAIN_CAMERA);
        const intersection = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

        if (intersection.length > 0) {

            const color = new Color();

            const instanceId = intersection[0].instanceId;
            GLOBALS.PLANE_LEVEL_INSTANCED.getColorAt(instanceId, color);

            if (type == "move" && GLOBALS.SELECTING) {

                raycastSelected(intersection[0], event, type)

            } else if (type == "down") {

                GLOBALS.SELECTING = true;
                GLOBALS.CONTROLS.enabled = false;

                GLOBALS.PLANE_USER_DATA[instanceId].selected = true;
                GLOBALS.SELECTED_SIDE = GLOBALS.PLANE_USER_DATA[instanceId].side;
                raycastSelected(intersection[0], event, type)
            }

            if (type == "up") {
                if (intersection.length > 0)
                    addItem(intersection, false);
            }

            if (GLOBALS.ITEM_HOLDED_NAME) {

                $("#follow").css("display", "block");
                $("#follow").css({
                    left: event.pageX - 25,
                    top: event.pageY - 25
                });

                hoverItem(intersection, false);
            }
        } else {
            if (type == "down")
                document.querySelector('.menu').classList.remove('menu-show');
        }
    }
}

//
$("#main-container").on('click', '#plus-portal', function () {
    cubeState("plus");
    document.querySelector('.menu').classList.remove('menu-show')
})

$("body").on('click', '#minus-portal', function () {
    cubeState("minus");
    document.querySelector('.menu').classList.remove('menu-show')
})

$("body").on('click', '#portalable', function () {

    if (GLOBALS.SELECTED_ID.length > 0) {
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].portal = !GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].portal;

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].portal;

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(0xffffff));
            else
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(0x808080));

            GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        }
    }

    document.querySelector('.menu').classList.remove('menu-show');
});

$("body").on('click', '#save-level', function () {

    var data = [];
    var clone = [];

    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[i].item) {
            var obj = new Object3D();
            obj.position.copy(GLOBALS.PLANE_USER_DATA[i].item.position);
            obj.rotation.copy(GLOBALS.PLANE_USER_DATA[i].item.rotation);
            obj.planeInstancedId = GLOBALS.PLANE_USER_DATA[i].item.planeInstancedId;
            obj.userData = GLOBALS.PLANE_USER_DATA[i].item.userData;
            GLOBALS.PLANE_USER_DATA[i].item = obj;
        }

        if (GLOBALS.PLANE_USER_DATA[i].trigger) {
            var obj = new Object3D();
            obj.position.copy(GLOBALS.PLANE_USER_DATA[i].trigger.position);
            obj.rotation.copy(GLOBALS.PLANE_USER_DATA[i].trigger.rotation);
            obj.id_instanced = GLOBALS.PLANE_USER_DATA[i].trigger.id_instanced;
            // obj.userData = GLOBALS.PLANE_USER_DATA[i].trigger.userData;
            GLOBALS.PLANE_USER_DATA[i].trigger = GLOBALS.PLANE_USER_DATA[i].trigger.id_instanced;
        }
    }


    data.push(GLOBALS.PLANE_USER_DATA)
    data.push(GLOBALS.GOO_PLANES)

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "scene.json");
    dlAnchorElem.click();
});

$("body").on('input', '#friction', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.friction = this.value;
});

$("body").on('input', '#restitution', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.restitution = parseFloat(this.value);
});