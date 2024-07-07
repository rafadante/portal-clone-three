import * as THREE from 'three';
import $ from 'jquery';
import {
    GLOBALS
} from '../../Globals.js';
import {
    animate
} from '../../Main.js';
import { planeInstanceReset, deleteItemInstanced } from '../items/Items.js';

var color = new THREE.Color();
const orange = new THREE.Color("rgb(255, 165, 0)");

var initialPosition = null;
var planeSelection = null;

var dir;
var currentID = null;

function raycastSelected(found, event, type) {

    $("#delete").css("display", "none")
    document.querySelector('.menu').classList.remove('menu-show');

    const instanceId = found.instanceId;

    /*if (GLOBALS.CONNECTING) {
        GLOBALS.CONNECTING = false;

        GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

        return;
    }*/

    if (event.button == 2) {
        removeSelection();
        if (GLOBALS.PLANE_USER_DATA[instanceId].itemName != "exitDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "enterDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "window") {

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem &&
                (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("laser_cube"))) {
                $("#dispenser-state").css("display", "block");
            } else {
                $("#dispenser-state").css("display", "none");
            }

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem &&
                (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("door") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("ramp") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("faith_plate"))) {
                $("#rotate-item").css("display", "block");
            } else {
                $("#rotate-item").css("display", "none");
            }

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem) {
                $("#delete").css("display", "block")
            }

            GLOBALS.SELECTED_ID.push(instanceId);

            showMenu(event.pageX, event.pageY);
        }
    } else {
        //MOVE ITEMS ON THE LEVEL EDITOR
        if (type == "move") {
            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem) {
            } else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]]) {//&& type == "move"
                //CHECK IF THE INSTANCED PLANE HAS AN ITEM
                if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].hasItem) {
                    //AFTER DRAGGING ONLY MOVE IF THE NEXT PLANE IS DIFFERENT 
                    if (GLOBALS.SELECTED_ID[0] != instanceId) {

                        //GET THE OLD AND NEW PLANES
                        var planeInstanceOld = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];
                        var planeInstanceNew = GLOBALS.PLANE_USER_DATA[instanceId];

                        if (planeInstanceOld.isInstanced) {
                            GLOBALS.DRAGGING = true;
                            deleteItemInstanced(planeInstanceOld, true);
                            planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null);
                        } else {
                            //CHECK IF THE ITEM CAN BE MOVED ALONG DIRECTIONS
                            if (planeInstanceNew.side == "down") {
                                if (!planeInstanceOld.floor) {
                                    warning("You can not move this item on the floor!");
                                    return;
                                }
                            } else if (planeInstanceNew.side == "up") {
                                if (!planeInstanceOld.ceiling) {
                                    warning("You can not move this item on the ceiling!");
                                    return;
                                }
                            } else {
                                if (!planeInstanceOld.walls) {
                                    warning("You can not move this item on the walls!");
                                    return;
                                }
                            }

                            if (planeInstanceOld.itemName.includes("enterDoor")) {
                                planeInstanceOld.item = GLOBALS.ENTER_DOOR;
                            } else if (planeInstanceOld.itemName.includes("exitDoor")) {
                                planeInstanceOld.item = GLOBALS.EXIT_DOOR;
                            } else if (planeInstanceOld.itemName.includes("window")) {
                                planeInstanceOld.item = GLOBALS.OBSERVATION_ROOM_IMG;
                            }

                            //IF EVERYTHING IS OK, MOVE THE ITEM TO THE NEXT POSITION
                            GLOBALS.DRAGGING = true;
                            planeInstanceOld.item.namePosition = planeInstanceNew.position.x + "/" + planeInstanceNew.position.y + "/" + planeInstanceNew.position.z;
                            planeInstanceOld.item.position.copy(planeInstanceNew.position);
                            planeInstanceOld.item.rotation.copy(planeInstanceNew.rotation);
                            //UPDATE PARAMETERS OF THE NEW PLACEMENT
                            planeInstanceReset(planeInstanceNew, true, planeInstanceOld.item.name, planeInstanceOld.item,
                                planeInstanceOld.state, planeInstanceOld.canRotate, planeInstanceOld.floor,
                                planeInstanceOld.ceiling, planeInstanceOld.walls, false, null);
                            //UPDATE PARAMETERS OF THE OLD PLACEMENT
                            planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null)

                            /*if (planeInstanceNew.itemName.includes("door_enter") || planeInstanceNew.itemName.includes("door_exit")) {
                                checkItemBoundingBox(planeInstanceNew.item, planeInstanceNew.item.cube)
                            }*/
                        }

                        removeSelection();
                        GLOBALS.SELECTED_ID[0] = instanceId;
                        return;
                    }
                }
            }
        }

        if (type == "down" && GLOBALS.SELECTED_ID.length > 0 && event.button == 0) {
            removeSelection()
        }

        if (GLOBALS.DRAGGING)
            return;

        if (currentID != instanceId) { //!GLOBALS.PLANE_USER_DATA[instanceId].hasItem

            currentID = instanceId;

            for (var i = 0; i < GLOBALS.SELECTED_ID_ORANGE.length; i++) {
                if (GLOBALS.SELECTED_ID_ORANGE[i].portal)
                    GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID_ORANGE[i].id_instanced, new THREE.Color(0xffffff));
                else
                    GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID_ORANGE[i].id_instanced, new THREE.Color(0x808080));
            }

            GLOBALS.SELECTED_ID_ORANGE = [];

            if (GLOBALS.SELECTED_ID.length == 0) {
                initialPosition = GLOBALS.PLANE_USER_DATA[instanceId].position;
                GLOBALS.SELECTED_ID.push(instanceId);
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.PLANE_USER_DATA[instanceId].id_instanced, orange);
            } else {

                GLOBALS.SELECTED_ID = [];

                let vec1 = initialPosition;
                let vec2 = GLOBALS.PLANE_USER_DATA[instanceId].position;

                var xDir = Math.sign(vec1.x - vec2.x) * (-1);
                var yDir = Math.sign(vec1.y - vec2.y) * (-1);
                var zDir = Math.sign(vec1.z - vec2.z) * (-1);

                let size = new THREE.Vector3().subVectors(vec2, vec1);
                let center = new THREE.Vector3().addVectors(vec1, vec2).multiplyScalar(0.5);

                let planeWidth = Math.abs(size.x);
                let planeHeight = Math.abs(size.y);
                let planeDepth = Math.abs(size.z);

                let planeGeom = new THREE.BoxGeometry(planeWidth, planeHeight, planeDepth);
                let planeMat = new THREE.MeshBasicMaterial({
                    color: new THREE.Color("rgb(0, 0, 255)")
                });
                var planeSelection = new THREE.Mesh(planeGeom, planeMat);
                planeSelection.position.copy(center);

                var direction = new THREE.Vector3();
                planeSelection.getWorldDirection(direction);
                direction = new THREE.Vector3(Math.abs(direction.x - 1), Math.abs(direction.y - 1), Math.abs(direction.z - 1))
                //xDir *= direction.x;
                //yDir *= direction.y;
                //zDir *= direction.z;

                for (var w = 0, i = 0; w <= planeWidth / 2; w++, i += 2) {

                    for (var h = 0, j = 0; h <= planeHeight / 2; h++, j += 2) {

                        for (var d = 0, k = 0; d <= planeDepth / 2; d++, k += 2) {

                            var plane = getPlaneByName((vec1.x + (i * xDir)) + "/" + (vec1.y + (j * yDir)) + "/" + (vec1.z + (k * zDir)));

                            if (plane[0]) {
                                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(plane[0].id_instanced, orange);
                                GLOBALS.SELECTED_ID_ORANGE.push(plane[0]);
                                GLOBALS.SELECTED_ID.push(plane[0].id_instanced);
                            }
                        }
                    }
                }
            }

            GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        }
    }
}

function warning(text) {
    $("#warning span").text(text);
    $("#warning").css("opacity", 1);
    setTimeout(() => {
        $("#warning").css("opacity", 0);
    }, 2000);
}

function removeSelection() {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new THREE.Color(0xffffff));
        else
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new THREE.Color(0x808080));

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].selected = false;
    }

    GLOBALS.SELECTED_ID = [];
    GLOBALS.SELECTED_COLOR = [];
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

//UI
function showMenu(x, y) {
    var menu = document.querySelector('.menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('menu-show');
}

$("body").on('click', '#rotate-item', function () {
    /*for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("door");

        var dummy = new THREE.Object3D();
        dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.position);
        dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.rotation);

        dummy.rotation.y += Math.PI / 2;

        dummy.updateMatrix();
        instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.userData.id, dummy.matrix)

        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.rotation.copy(dummy.rotation);
    }*/

    if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("door") ||
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName.includes("faith_plate")) {

        var door = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName);
        door.rotation.y += Math.PI / 2;
    } else {
        for (var i = 0; i < 1; i++) { //GLOBALS.SELECTED_ID.length

            var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].itemName);

            var dummy = new THREE.Object3D();
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
        deleteItemInstanced(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], false);
    }else{
        GLOBALS.ITEMS_COUNT[GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName]["count"] -= 1;
        GLOBALS.ITEMS_ADDED.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item);
        planeInstanceReset(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], false, null, null, null, null, null, null, null, false, null);
    }

    $(".menu").removeClass("menu-show");

    animate()
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

$("body").on('click', '#dispenser-state', function () {

    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.hasDispenser = !GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.hasDispenser;

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
        var item = new THREE.Object3D();
        item.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.dispenserPosition);

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.hasDispenser) {
            item.scale.set(1, 1, 1);
        } else {
            item.scale.set(0, 0, 0);
        }

        item.updateMatrix();
        instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.dispenserID, item.matrix);
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();
    }
});

export {
    raycastSelected
}