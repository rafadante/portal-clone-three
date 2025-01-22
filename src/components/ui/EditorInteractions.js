import $ from 'jquery';
import { ContinuousTrigger } from '../continuous/Continuous';
import { GLOBALS } from '../../Globals';
import { Object3D, Vector3, Color, Vector2, Raycaster } from 'three';
import { planeInstanceReset, deleteItemInstanced } from '../items/Items.js';
import { cubeState } from '../cubeManager/CubeManager.js';
import { raycastSelected } from '../boxSelection/BoxSelection.js';
import { hoverItem } from '../items/Items.js';
import { addItem } from '../items/AddItem.js';
import { updateMaterialRepeat } from '../materials/Materials.js';
import { hex2rgb } from '../../Utils.js';
import { targetFaithPlateStart } from '../faithPlate/FaithPlate';
import { respawn } from '../events/states';
import { AUDIO } from '../audio/Audio';
import { checkToUpdateContinuous } from '../cubeManager/UpdateRaycast';
import JSZip from "jszip";
import { updateAngledPanel } from '../test/Colliders';

window.addEventListener("contextmenu", e => e.preventDefault());

var justClicked = false;
var raycaster = new Raycaster();

$("body").on('click', '#side-bar-left, #ui-top', function () {
    document.querySelector('.menu').classList.remove('menu-show');
});

$("body").on('click', '#rotate-item', function () {
    if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("door") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("faith_plate") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("portal_0") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("portal_0") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("angled_panel") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("portal_gun")) {

        var door = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName);

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("angled_panel") &&
            (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].side == "left" || GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].side == "right")) {
            door.rotation.x += Math.PI / 2;
            door.userData.rotationY = door.rotation.x;
        } else {
            door.rotation.y += Math.PI / 2;
            door.userData.rotationY = door.rotation.y;
        }

    } else {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName);

        var dummy = new Object3D();
        dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.position);
        dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.rotation);

        dummy.rotation.y += Math.PI / 2;
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.rotationY = dummy.rotation.y;

        dummy.updateMatrix();
        instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.id, dummy.matrix)

        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.rotation.copy(dummy.rotation);
    }
});

$("body").on('click', '#delete', function () {

    var indexesToDelete = [];

    for (var j = 0; j < GLOBALS.CONNECTIONS.length; j++) {
        if (GLOBALS.CONNECTIONS[j]["from"] == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]])
            indexesToDelete.push(j);
        else if (GLOBALS.CONNECTIONS[j]["to"] == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]])
            indexesToDelete.push(j);
    }

    for (var j = indexesToDelete.length - 1; j >= 0; j--) {

        const index = GLOBALS.CONNECTIONS[indexesToDelete[j]];

        if (index['from'].item.userData.connectedTo.includes(index["to"].id_instanced)) {
            const indexToRemove = index['from'].item.userData.connectedTo.indexOf(index["to"].id_instanced);
            index['from'].item.userData.connectedTo.splice(indexToRemove);
        }

        GLOBALS.LINE.remove(GLOBALS.CONNECTIONS[indexesToDelete[j]]["line"]);

        window.checkers.setVisibilityAt(index["checker"], false);
        window.checkersIndexes[index["checker"]] = false;
        index["clone"].visible = false;
        GLOBALS.CONNECTIONS.splice(indexesToDelete[j], 1);
    }

    if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].isInstanced) {

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "incinerator") {

            GLOBALS.ITEMS_ADDED.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.trigger);
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous) {
            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.otherSide)
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.otherSide.hasItem = false;
            GLOBALS.ITEMS_ADDED.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous);
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge)
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge)

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField)
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField)

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
                GLOBALS.TRACTOR_BEAM_RAYCASTER.splice(index, 1); // 2nd parameter means remove one item only
            }
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "laser_emitter") {

            GLOBALS.LASERS.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.clone);
            GLOBALS.LASERS.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous);
            const index = GLOBALS.LASER_EMITTER_RAYCASTER.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.raycaster);
            if (index > -1) { // only splice array when item is found
                GLOBALS.LASER_EMITTER_RAYCASTER.splice(index, 1); // 2nd parameter means remove one item only
            }
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "fizzler") {
            const index = GLOBALS.FIZZLER_RAYCASTER.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.raycaster);
            if (index > -1) { // only splice array when item is found
                GLOBALS.FIZZLER_RAYCASTER.splice(index, 1); // 2nd parameter means remove one item only
            }
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "laser_field") {
            const index = GLOBALS.LASER_FIELD_RAYCASTER.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.raycaster);
            if (index > -1) { // only splice array when item is found
                GLOBALS.LASER_FIELD_RAYCASTER.splice(index, 1); // 2nd parameter means remove one item only
            }
        }

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "light_bridge") {
            const index = GLOBALS.LIGHT_BRIDGE_RAYCASTER.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.raycaster);
            if (index > -1) { // only splice array when item is found
                GLOBALS.LIGHT_BRIDGE_RAYCASTER.splice(index, 1); // 2nd parameter means remove one item only
            }
        }

        deleteItemInstanced(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], window.moving);
    } else {

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName == "goo") {

            const item = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item;

            GLOBALS.ITEMS_ADDED.remove(item.water);
            GLOBALS.ITEMS_ADDED.remove(item.lava);
            GLOBALS.ITEMS_ADDED.remove(item);

            for (var j = 0; j < item.ids.length; j++)
                GLOBALS.PLANE_USER_DATA[item.ids[j]].hasGoo = false;

            for (var j = GLOBALS.GOO_BOXES.length - 1; j >= 0; j--) {
                if (GLOBALS.GOO_BOXES[j].idPlane == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].id_instanced) {
                    const index = GLOBALS.GOO_BOXES.indexOf(GLOBALS.GOO_BOXES[j]);
                    if (index > -1) { // only splice array when item is found
                        GLOBALS.GOO_BOXES.splice(index, 1); // 2nd parameter means remove one item only
                    }
                }
            }

        } else {

            const index = GLOBALS.TRIGGER_BOXES.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]]);
            if (index > -1) { // only splice array when item is found
                GLOBALS.TRIGGER_BOXES.splice(index, 1); // 2nd parameter means remove one item only
            }

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "faith_plate") {
                GLOBALS.SCENE.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.target);
                GLOBALS.GROUP_LINE_TRAGECTORY.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.target.line);
            }

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName == "glass") {
                const index = GLOBALS.GLASS_RAYCASTER.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.raycaster);
                if (index > -1) { // only splice array when item is found
                    GLOBALS.GLASS_RAYCASTER.splice(index, 1); // 2nd parameter means remove one item only
                }
            }

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous) {
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.otherSide.hasItem = false;
                GLOBALS.ITEMS_ADDED.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous);
            }

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge)
                GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge)

            GLOBALS.ITEMS_COUNT[GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName]["count"] -= 1;
            GLOBALS.ITEMS_ADDED.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item);

            $("#" + GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName).parent().children("span").text(GLOBALS.ITEMS_COUNT[GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName]["max"] - GLOBALS.ITEMS_COUNT[GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName]["count"]);
        }
    }

    planeInstanceReset(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], false, null, null, null, null, null, null, null, false, null, false, false);
    $(".menu").removeClass("menu-show");
    checkToUpdateContinuous();
});

$("body").on('input', '#state-dispenser', function () {

    var scale;

    if (this.checked)
        scale = new Vector3(1, 1, 1);
    else
        scale = new Vector3(0, 0, 0);

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.hasDispenser = this.checked;

    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
    var dummy = new Object3D();
    dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserPosition);
    dummy.rotation.set(0, 0, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserID, dummy.matrix);
    instanced.setVisibilityAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserID, this.checked);
    instanced.instanceMatrix.needsUpdate = true;
});

$("body").on('input', '#dispenser-opened', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.opened = this.checked;
})

$("body").on('input', '#state-lines', function () {
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
        if (GLOBALS.CONNECTIONS[i]['from'].itemName == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName) {
            GLOBALS.CONNECTIONS[i]["line"].visible = this.checked;
            GLOBALS.CONNECTIONS[i]['from'].item.userData.showLines = this.checked;
        }
    }
})

$("body").on('input', '#state-pedetsal-infinity', function () {
    if (this.checked)
        $("#pedestal-timer").addClass("disabled");
    else
        $("#pedestal-timer").removeClass("disabled");

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.pedestalInfinity = this.checked;
});

$("body").on('input', '#pedestal-timer-value', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.pedestalValue = parseInt(this.value);
});

$("body").on('click', '.tile-nonPortal', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (!GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].tile = $(this).data("id");
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '.tile-portal', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].tile = $(this).data("id");
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('input', '#tractor-state-input, #light-bridge-state-input, #laser-field-state-input, #fizzler-state-input', function () {

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.state = this.checked;
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.visible = this.checked;

    //bodyLaserField
    if ($(this).attr("id") == "light-bridge-state-input") {
        if (this.checked) {
            //GLOBALS.CANNON_BODIES.push(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge);
            GLOBALS.CANNON_WORLD.addBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge);
        } else
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge);
    } else if ($(this).attr("id") == "laser-field-state-input" || $(this).attr("id") == "fizzler-state-input") {
        if (this.checked) {
            //GLOBALS.CANNON_BODIES.push(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField);
            GLOBALS.CANNON_WORLD.addBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField);
        } else
            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyLaserField);
    }
});

$("body").on('input', '#tractor-direction-input', function () {

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.reversed = this.checked;

    if (this.checked)
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE;
    else
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM;
});

$("body").on('click', '.tractor-triggers', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.triggers = $(this).data("trigger");
    $("#tractor-trigger").data("trigger", $(this).data("trigger"))
    $("#tractor-trigger").find(".title").text("Triggers: " + $(this).data("trigger"));
});

$("body").on('input', '#ligh-color-input', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.lightColor = this.value;
});

$("body").on('click', '.light-bridge-triggers', function () {
    GLOBALS.LIGHT_BRIDGE_TRIGGER = $(this).data("trigger");
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#light-bridge-trigger"), "light_bridge")
});

$("body").on('click', '.light-position', function () {
    GLOBALS.LIGHT_TRIGGER = $(this).data("trigger");
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#light-position"), "light")
});

$("body").on('click', '.laser-field-triggers', function () {
    GLOBALS.LASER_FIELD_TRIGGER = $(this).data("trigger");
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#laser-field-trigger"), "laser_field")
});

$("body").on('click', '.fizzler-triggers', function () {
    GLOBALS.FIZZLER_TRIGGER = $(this).data("trigger");
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#fizzler-trigger"), "fizzler")
});

$("body").on('click', '.glass-triggers', function () {
    GLOBALS.GLASS_TRIGGER = $(this).data("trigger");
    ContinuousTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#glass-trigger"), "glass")
});

$("body").on('input', '#grid-state-input', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.grid = this.checked;

    if (this.checked) {
        updateMaterialRepeat(
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous,
            GLOBALS.MATERIAL_GRID,
            (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.distance * 2) / 3
        )
    } else {
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.material = GLOBALS.MATERIAL_GLASS;
    }
});

$("body").on('input', '#plate-state-input', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.state = this.checked;
});

document.getElementById("container").addEventListener('pointerdown', onDocumentMouseDown, false);
document.getElementById("container").addEventListener('pointermove', onDocumentMouseMove, false);
document.getElementById("container").addEventListener('pointerup', onDocumentMouseUp, false);

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
    }
});

function onDocumentMouseDown(event) {
    if (!GLOBALS.FPS_MODE)
        raycastManager(event, "down");
}

function onDocumentMouseMove(event) {
    if (!GLOBALS.FPS_MODE) {
        mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycastManager(event, "move");
    }
}

function onDocumentMouseUp(event) {
    if (!GLOBALS.FPS_MODE) {

        if (window.faithPlateMoved) {
            //PORTALS CAN NOT SPAWN ON ITEM POSITION
            window.faithPlateMoved.portal = false;
            window.faithPlateMoved.planeColor = 0x808080;
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(window.faithPlateMoved.id_instanced, new Color(0x808080));
            targetFaithPlateStart(window.faithPlateMoved.item);
        }

        GLOBALS.RESIZING_GLASS_PANEL = false;
        GLOBALS.SELECTED_SIDE = null;
        GLOBALS.SELECTING = false;
        GLOBALS.CONTROLS.enabled = true;
        GLOBALS.CONTROLS.update();

        if ((GLOBALS.ITEM_HOLDED_NAME || GLOBALS.CONNECTING) && !window.faithPlateMoved)
            raycastManager(event, "up");

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
        } else
            GLOBALS.ITEM_CUBE.visible = false;

        window.faithPlateMoved = null;
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

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal) {
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].planeColor = 0xffffff;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(0xffffff));
            } else {
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].planeColor = 0x808080;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(0x808080));
            }
        }
    }

    document.querySelector('.menu').classList.remove('menu-show');
});

$("body").on('click', '#save-level', function () {
    saveChamber(false)
});

function saveChamber(publish) {
    var data = [];
    var userDataHolder = [];
    var itemHolder = [];

    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[i].item) {

            userDataHolder.push(GLOBALS.PLANE_USER_DATA[i])
            itemHolder.push(GLOBALS.PLANE_USER_DATA[i].item)
            GLOBALS.PLANE_USER_DATA[i].item = GLOBALS.PLANE_USER_DATA[i].item.userData;
        }

        GLOBALS.PLANE_USER_DATA[i].body = null;
    }

    const settings = [
        GLOBALS.PORTAL_GUN_INITIATE,
        AUDIO.AMBIENT.value,
        document.getElementById("color-wall-portal").value,
        window.oldAperture
    ]

    data.push(settings);
    data.push(GLOBALS.PLANE_USER_DATA);

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));


    if (publish) {
        zipJson(JSON.stringify(data), window.chamberID)
    } else {
        var dlAnchorElem = document.createElement('a');
        dlAnchorElem.setAttribute("href", dataStr);

        if ($("#chamber-name-to-save").val())
            dlAnchorElem.setAttribute("download", $("#chamber-name-to-save").val() + "_by_" + $("#author-name-to-save").val() + ".json");
        else
            dlAnchorElem.setAttribute("download", "chamber.json");

        dlAnchorElem.click();
    }

    for (var i = 0; i < userDataHolder.length; i++)
        userDataHolder[i].item = itemHolder[i];
}

// Function to zip a JSON object
async function zipJson(jsonObject, update) {
    const zip = new JSZip();
    const zipFileName = "data.zip";

    // Convert JSON object to string
    //const jsonString = JSON.stringify(jsonObject, null, 2);

    // Add the JSON string as a file in the zip archive
    zip.file("data.json", jsonObject);

    // Generate the zip file as a Blob
    //const zipBlob = await zip.generateAsync({ type: "blob" });

    zip.generateAsync({
        type: "blob",
        /* NOTE THESE ADDED COMPRESSION OPTIONS */
        /* deflate is the name of the compression algorithm used */
        compression: "DEFLATE",
        compressionOptions: {
            /* compression level ranges from 1 (best speed) to 9 (best compression) */
            level: 9
        }
    })
        .then(function (content) {
            // see FileSaver.js
            //saveAs(content, "example.zip");

            // Create a download link for the zip file
            /*const link = document.createElement("a");
            link.href = URL.createObjectURL(content);
            link.download = zipFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);*/

            if (update)
                window["updateChamber"]($("#chamber-name-to-save").val(), window.chamberID, content);
            else
                window["saveChamber"]($("#chamber-name-to-save").val(), content);
        });
}

$("body").on('input', '#friction', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.friction = this.value;
});

$("body").on('input', '#restitution', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.restitution = parseFloat(this.value);
});

//PORTAL_GUN_INITIATE
$("body").on('click', '#header-items', function () {
    $(this).css("background-color", "black");
    $(this).css("color", "white");
    $("#header-settings").css("background-color", "white");
    $("#header-settings").css("color", "black");
    $("#items").css("display", "grid");
    $("#settings").css("display", "none");
});

$("body").on('click', '#header-settings', function () {
    $(this).css("background-color", "black");
    $(this).css("color", "white");
    $("#header-items").css("background-color", "white");
    $("#header-items").css("color", "black");
    $("#items").css("display", "none");
    $("#settings").css("display", "flex");
});

$('#portal-gun-select').on('change', function () {
    GLOBALS.PORTAL_GUN_INITIATE = $(this).val();
})

$("body").on('click', '.portal_gun-state', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.state = $(this).data("state");
    $("#portal_gun-state").find(".title").text($(this).data("state") + " Portals");
});

$("body").on('input', '#portal-gun-color', function () {
    var color = hex2rgb(this.value);
    localStorage.setItem("portal_gun_color", this.value);
    GLOBALS.GUN.getObjectByName("Object_6").material.color = new Color(color.r / 255, color.g / 255, color.b / 255);
})

$("body").on('input', '#portal-gun-roughness', function () {
    localStorage.setItem("portal_gun_roughness", this.value);
    GLOBALS.GUN.getObjectByName("Object_6").material.roughness = this.value;
})

$("body").on('input', '#portal-gun-metalness', function () {
    localStorage.setItem("portal_gun_metalness", this.value);
    GLOBALS.GUN.getObjectByName("Object_6").material.metalness = this.value;
})

$("body").on('change', '#option-goo-reflections', function () {
    GLOBALS.GOO_REFLECTIONS = this.checked;
    localStorage.setItem("goo_reflections", this.checked);
})

if (localStorage.getItem("goo_reflections")) {
    GLOBALS.GOO_REFLECTIONS = localStorage.getItem("goo_reflections") == "true";
    $("#option-goo-reflections").prop('checked', GLOBALS.GOO_REFLECTIONS);
}

$("body").on('click', '.angled_panel_option', function () {

    $("#angled_panel_option").find(".title").text("Angle on Start: " + $(this).data("angle"));
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.angle = $(this).data("real");

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.getObjectByName("pivot2").rotation.x = Math.PI / 180 * $(this).data("real");
});

$("body").on('click', '.angled_panel_trigger', function () {

    $("#angled_panel_trigger").find(".title").text("Angle on Trigger: " + $(this).data("angle"));
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.angleTrigger = $(this).data("real");
});

$("body").on('click', '#reset-check-point', function () {
    if (GLOBALS.LEVEL_ENTERED)
        respawn(GLOBALS.PLAYER);
});

//
var chambers;
var chambersPlayed = [];
var chambersFinished = [];
var j = 0;
window.arrayJSON = [];

$("body").on('click', '#options-custom span', async function () {

    window.arrayJSON = [];

    $("#options-custom span").css("background", "none");
    $(this).css("background", "grey");

    document.getElementById("loading-parent").style.opacity = "1";
    document.getElementById("loading-parent").style.pointerEvents = "all";

    if (!chambers) {
        chambers = await window["selectAllChambers"]();
        chambersPlayed = await window["selectAllChambersPlayed"](false);
        chambersFinished = await window["selectAllChambersPlayed"](true);
    }

    $(".custom-chamber").remove();

    const session = await window["getSession"]();

    j = 0;

    if ($(this).data("value") == "all") {
        for (var i = 0; i < chambers.length; i++) {

            if (!chambers[i].tested || chambersPlayed.includes(chambers[i].id) || chambersFinished.includes(chambers[i].id))
                continue;

            manageChmaberCustom(i)
        }
    } else if ($(this).data("value") == "new") {
        for (var i = 0; i < chambers.length; i++) {

            if (chambers[i].tested)
                continue;

            manageChmaberCustom(i)
        }
    } else if ($(this).data("value") == "mine") {
        for (var i = 0; i < chambers.length; i++) {

            if (chambers[i].user_id != session.user.id)
                continue;

            manageChmaberCustom(i, true)
        }
    } else if ($(this).data("value") == "played") {
        for (var i = 0; i < chambers.length; i++) {

            if (!chambersPlayed.includes(chambers[i].id) )//|| !chambers[i].tested
                continue;

            manageChmaberCustom(i)
        }
    } else if ($(this).data("value") == "finished") {
        for (var i = 0; i < chambers.length; i++) {

            if (!chambersFinished.includes(chambers[i].id) || !chambers[i].tested)
                continue;

            manageChmaberCustom(i);
        }
    }

    document.getElementById("loading-parent").style.opacity = "0";
    document.getElementById("loading-parent").style.pointerEvents = "none";
});

function manageChmaberCustom(i, canDelete) {

    var elemDel = '';
    var elemMine = '';

    if (canDelete) {
        elemDel = '<button class="delete-my-chamber">DELETE</button>';
        elemMine = "mine"
    }

    const elem = '<div data-path="'+chambers[i].path+'" data-jsonid="' + j + '"  data-name="' + chambers[i].name + '" data-finished="' + chambers[i].finished + '"  data-userid="' + chambers[i].user_id + '"  data-played="' + chambers[i].played + '" data-id="' + chambers[i].id + '" class="custom-chamber ' + elemMine + '"' +
        '>' +
        '<div class="chamber-stats">' +
        '<span>played: ' + chambers[i].played + '</span>' +
        '<span>finished: ' + chambers[i].finished + '</span>' +
        '<span>author: ' + chambers[i].author + '</span>' +
        '</div>' +
        elemDel +
        '<div data-path="'+chambers[i].path+'" class="span-chamber" style="background-image: url(' + chambers[i].thumb + ')">' + chambers[i].name + '</div>' +
        '</div>'

    window.arrayJSON.push(chambers[i].json);

    j++;

    $("#list-custm-chambers").append(elem);
}

$("body").on('click', '.delete-my-chamber', async function () {
    window["deleteChamber"]($(this).parent().data("id"), $(this).parent().data("path"));
    chambers = await window["selectAllChambers"]();
    $(this).parent().remove();

    window.location.reload();
})

document.onkeypress = function (e) {
    //e = e || window.event;
    // use e.keyCode
    //console.log(e.key)
    if (GLOBALS.FPS_MODE && e.key == "p") {
        GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);
        window.thumbDataURL = GLOBALS.RENDERER.domElement.toDataURL("image/jpeg", 0.25);

        //alert("thumbnail set!");

        $("#alert").css("opacity", "1");
        $("#alert span").text("thumbnail set!");

        setTimeout(() => {
            $("#alert").css("opacity", "0");
        }, 5000);

        /*var link = document.createElement("a");
        link.download = "name";
        link.href = window.thumbDataURL;
        link.click();*/
    }
};

export { saveChamber }