import {
    Vector3,
    LineBasicMaterial,
    Color,
    Object3D,
    Line,
    BufferAttribute,
    BufferGeometry,
    Raycaster,
    Vector2
} from 'three';
import $ from 'jquery';
import {
    GLOBALS
} from '../../Globals.js';
import { clickItem } from './AddItem.js';
import { targetFaithPlateUpdate } from '../faithPlate/FaithPlate.js';
import { getPlaneByName } from '../../Utils.js';

let lineFollow;
let isDrawStart = false;
var count = 0;
var mouse = new Vector3();
var positions;
const materialLine = new LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2
});

$("body").on('pointerdown', '.item', function (event) {
    event.preventDefault();
    clickItem($(this))
});

document.addEventListener('keydown', (event) => {

    if (event.code == "Escape" && isDrawStart) {

        isDrawStart = false;
        GLOBALS.SCENE_CHILDREN.remove(lineFollow);

        GLOBALS.CONNECTING = false;

        GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

        count = 0;
    }
});

$("body").on('click', '#conection', function (event) {

    GLOBALS.CONNECTING = true;
    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 0.25;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 0.25;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = true;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = true;

    $(".menu").removeClass("menu-show");

    //LINE FOLLOWS MOUSE WHILE CONNECTING

    var geometry = new BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new BufferAttribute(positions, 3));

    lineFollow = new Line(geometry, materialLine);
    GLOBALS.CURRENT_LINE = lineFollow;
    GLOBALS.SCENE_CHILDREN.add(lineFollow);

    isDrawStart = true;

    GLOBALS.SELECTED_FOR_CONNECTION = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];

    addPoint(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.x,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.y,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.z);

    addPoint(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.x,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.y,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.z);
})

function addPoint(x, y, z) {
    positions[count * 3 + 0] = x;
    positions[count * 3 + 1] = y;
    positions[count * 3 + 2] = z;
    count++;
    lineFollow.geometry.setDrawRange(0, count);
}

document.body.addEventListener('mousemove', onPointerMove);

var raycaster = new Raycaster();
const mouse2 = new Vector2(1, 1);

function onPointerMove(event) {

    if (!GLOBALS.CONNECTING)
        return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.z = 0;
    mouse.unproject(GLOBALS.MAIN_CAMERA);
    if (count !== 0 && GLOBALS.CONNECTING) {
        updateLine();
    }

    mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse2, GLOBALS.MAIN_CAMERA);
    var intersects = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

    hoverItem(intersects, true)
}

function updateLine() {
    positions[count * 3 - 3] = mouse.x;
    positions[count * 3 - 2] = mouse.y;
    positions[count * 3 - 1] = mouse.z;
    lineFollow.geometry.attributes.position.needsUpdate = true;
}

function hoverItem(found, connecting) {

    if (found.length == 0)
        return

    var userData = GLOBALS.PLANE_USER_DATA[found[0].instanceId];

    if (GLOBALS.FAITH_PLATE_TARGET)
        targetFaithPlateUpdate(GLOBALS.ITEM_CUBE);

    if (connecting) {
        if (userData.allowconnection || GLOBALS.FAITH_PLATE_TARGET) {
            GLOBALS.ITEM_CUBE.material.color = new Color(0x00ff00)
            GLOBALS.ITEM_CUBE.place = true;
        } else {
            GLOBALS.ITEM_CUBE.material.color = new Color(0xff0000)
            GLOBALS.ITEM_CUBE.place = false;
        }
    } else {
        if ((userData.hasItem || userData.continuousEnding) ||//
            (userData.side == "down" && !GLOBALS.DRAGGED_ITEM_ELEMENT.data("floor")) ||
            (userData.side == "up" && !GLOBALS.DRAGGED_ITEM_ELEMENT.data("ceiling")) ||
            ((userData.side == "front" || userData.side == "back" || userData.side == "left" || userData.side == "right")
                && !GLOBALS.DRAGGED_ITEM_ELEMENT.data("walls"))
        ) {
            GLOBALS.ITEM_CUBE.material.color = new Color(0xff0000)
            GLOBALS.ITEM_CUBE.place = false;
        } else {
            GLOBALS.ITEM_CUBE.material.color = new Color(0x00ff00)
            GLOBALS.ITEM_CUBE.place = true;
        }
    }

    GLOBALS.ITEM_CUBE.position.copy(userData.position);
    GLOBALS.ITEM_CUBE.visible = true;
}

function planeInstanceReset(planeInstance, hasItem, itemName, item, state, canRotate, floor, ceiling, walls, isInstanced, instancedName, allowconnection, continuousEnding) {

    if (planeInstance.item) {
        if (planeInstance.item.continuous) {
            if (planeInstance.item.continuous.otherSide)
                planeInstance.item.continuous.otherSide.continuousEnding = continuousEnding;
        }
    }

    planeInstance.hasItem = hasItem;
    planeInstance.itemName = itemName;
    planeInstance.item = item;
    planeInstance.state = state;
    planeInstance.canRotate = canRotate;
    planeInstance.floor = floor;
    planeInstance.ceiling = ceiling;
    planeInstance.walls = walls;
    planeInstance.isInstanced = isInstanced;
    planeInstance.instancedName = instancedName;
    planeInstance.allowconnection = allowconnection;
}

function deleteItemInstanced(item, moving) {

    GLOBALS.ITEMS_COUNT[item.instancedName]["count"] -= 1;
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(item.instancedName);
    var dummy = new Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(item.item.userData.idInstanced, dummy.matrix);
    instanced.instanceMatrix.needsUpdate = true;

    if (item.instancedName == "cube" || item.instancedName == "sphere"
        || item.instancedName == "cube_2" || item.instancedName == "laser_cube") {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
        var dummy = new Object3D();
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        instanced.setMatrixAt(item.item.dispenserID, dummy.matrix);
        instanced.instanceMatrix.needsUpdate = true;

        if (GLOBALS.DYMANIC_ITEMS["dispenser"][item.item.dispenserID].dispenserPosition.y != item.position.y) {
            var planeDispenser = getPlaneByName(
                GLOBALS.DYMANIC_ITEMS["dispenser"][item.item.dispenserID].dispenserPosition.x + "/" +
                GLOBALS.DYMANIC_ITEMS["dispenser"][item.item.dispenserID].dispenserPosition.y + "/" +
                GLOBALS.DYMANIC_ITEMS["dispenser"][item.item.dispenserID].dispenserPosition.z
            );

            planeInstanceReset(planeDispenser[0], false, null, null, null, null, null, null, null, false, null, false, false);
        }

        GLOBALS.DYMANIC_ITEMS["dispenser"][item.item.dispenserID] = [];
    }

    GLOBALS.DYMANIC_ITEMS[item.instancedName][item.item.userData.idInstanced] = [];

    if (moving) {
        window.changingPosition = true;
        window.changingPositionPlane = item;
        clickItem($("#" + item.instancedName));
    }

    $("#" + item.instancedName).parent().children("span").text(GLOBALS.ITEMS_COUNT[item.instancedName]["max"] - GLOBALS.ITEMS_COUNT[item.instancedName]["count"]);
}

export {
    hoverItem,
    planeInstanceReset,
    deleteItemInstanced
};