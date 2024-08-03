import {
    Color,
    Mesh,
    Vector3,
    BoxGeometry,
    MeshBasicMaterial
} from 'three';
import $ from 'jquery';
import {
    GLOBALS
} from '../../Globals.js';
import {
    planeInstanceReset,
    deleteItemInstanced
} from '../items/Items.js';
import {
    getPlaneByName,
    warning
} from '../../Utils.js';
import { clickItem } from '../items/AddItem.js';
import { manageConnection } from './Connection.js';

const orange = new Color("rgb(255, 165, 0)");
var initialPosition = null;
var currentID = null;

function raycastSelected(found, event, type) {

    $("#delete").css("display", "none")
    document.querySelector('.menu').classList.remove('menu-show');

    const instanceId = found.instanceId;

    if (GLOBALS.CONNECTING) {
        manageConnection(instanceId, GLOBALS.SELECTED_FOR_CONNECTION)
        return;
    }

    if (event.button == 2) {
        if (GLOBALS.PLANE_USER_DATA[instanceId].itemName != "exitDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "enterDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "window") {

            if (GLOBALS.PLANE_USER_DATA[instanceId].continuousEnding) {

            }

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem &&
                (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("door") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("ramp") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("faith_plate"))) {
                $("#rotate-item").css("display", "block");
            } else {
                $("#rotate-item").css("display", "none");
            }

            $(".hasItem").css("display", "none");

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem) {
                $("#delete").css("display", "block");

                if ((GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("laser_cube"))) {
                    $(".dispenser").css("display", "block");
                    $("#state-dispenser").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.hasDispenser);
                    $("#dispenser-opened").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.opened);
                } else {
                    $(".dispenser").css("display", "none");
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("button")) {
                    $(".buttons").css("display", "block");
                    $("#connections").empty();

                    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {

                        if (GLOBALS.CONNECTIONS[i]['from'].itemName == GLOBALS.PLANE_USER_DATA[instanceId].itemName) {
                            var elem = '<li data-id="' + i + '" class="menu-item removeConnection">' +
                                '<button type="button" class="menu-btn">' +
                                '<i class="fas fa-times"></i>' +
                                '<span class="menu-text">' + GLOBALS.CONNECTIONS[i]["to"].itemName + '</span>' +
                                '</button>' +
                                '</li>';

                            $("#connections").append(elem);

                            $("#state-lines").prop("checked", GLOBALS.CONNECTIONS[i]['line'].visible);
                        }
                    }

                } else {
                    $(".buttons").css("display", "none");
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("pedestal")) {

                    $(".pedestal").css("display", "block");
                    $("#state-pedetsal-infinity").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.pedestalInfinity);
                    $("#pedestal-timer-value").prop("value", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.pedestalValue);

                    if (GLOBALS.PLANE_USER_DATA[instanceId].item.userData.pedestalInfinity) {
                        $("#pedestal-timer").addClass("disabled");
                    } else {
                        $("#pedestal-timer").removeClass("disabled");
                    }
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("tractor")) {
                    $(".tractor").css("display", "block");

                    $("#tractor-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.state)
                    $("#tractor-direction-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.reversed)
                    $("#tractor-trigger").find(".title").text("Triggers: " + GLOBALS.PLANE_USER_DATA[instanceId].item.userData.triggers);
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("light_bridge")) {
                    $(".light-bridge").css("display", "block");

                    $("#light-bridge-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.state);
                    $("#light-bridge-trigger").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.triggers);
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("laser_field")) {
                    $(".laser-field").css("display", "block");

                    $("#laser-field-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.state);
                    $("#laser-field-trigger").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.triggers);
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("fizzler")) {
                    $(".fizzler").css("display", "block");

                    $("#fizzler-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.state);
                    $("#fizzler-trigger").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.triggers);
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("observation_room") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("light")) {
                    $(".light-color").css("display", "block");

                    $("#ligh-color-input").val(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.lightColor)
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere")) {
                    $(".physics").css("display", "block");

                    $("#restitution").val(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.restitution)
                    $("#friction").val(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.friction)
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("glass")) {
                    $(".glass").css("display", "block");

                    $("#glass-trigger").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.triggers);
                    $("#grid-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.userData.grid);
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("portal_gun")) {
                    $(".portal_gun").css("display", "block");
                    $("#portal_gun-state").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.userData.state + " Portals");
                }
            }

            GLOBALS.SELECTED_ID.push(instanceId);
            showMenu(event.pageX, event.pageY);
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(instanceId, orange);
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

                            if (planeInstanceOld.item.continuous) {

                                const index = GLOBALS.TRACTOR_BEAM.indexOf(planeInstanceOld.item.continuous);
                                if (index > -1) { // only splice array when item is found
                                    GLOBALS.TRACTOR_BEAM.splice(index, 1); // 2nd parameter means remove one item only
                                    GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.splice(index, 1); // 2nd parameter means remove one item only
                                }

                                GLOBALS.SCENE_CHILDREN.remove(planeInstanceOld.item.continuous);
                            }

                            if (planeInstanceOld.item.bodyBridge) {
                                GLOBALS.LIGHT_BRIDGE_TRIGGER = planeInstanceOld.item.userData.triggers;
                                GLOBALS.CANNON_WORLD.removeBody(planeInstanceOld.item.bodyBridge);
                                //planeInstanceOld.item.bodyBridge = null;
                            }

                            if (planeInstanceOld.item.cloneLaserID) {
                                GLOBALS.LASER_FIELD_TRIGGER = planeInstanceOld.item.userData.triggers;
                            }

                            if (planeInstanceOld.item.cloneFizzlerID) {
                                GLOBALS.FIZZLER_TRIGGER = planeInstanceOld.item.userData.triggers;
                            }

                            if (planeInstanceOld.item.bodyLaserField) {
                                GLOBALS.CANNON_WORLD.removeBody(planeInstanceOld.item.bodyLaserField);
                            }

                            deleteItemInstanced(planeInstanceOld, true);
                            planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null, false, false);
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

                            //IF EVERYTHING IS OK, MOVE THE ITEM TO THE NEXT POSITION
                            GLOBALS.DRAGGING = true;

                            if (planeInstanceOld.item.continuous) {

                                GLOBALS.GRID_STATE = planeInstanceOld.item.userData.grid;
                                GLOBALS.SCENE_CHILDREN.remove(planeInstanceOld.item.continuous);
                                GLOBALS.ITEMS_ADDED.remove(planeInstanceOld.item);

                                if (planeInstanceOld.item.bodyBridge) {
                                    GLOBALS.CANNON_WORLD.removeBody(planeInstanceOld.item.bodyBridge);
                                    //planeInstanceOld.item.bodyBridge = null;
                                }

                                clickItem($("#" + planeInstanceOld.item.userData.instancedName));
                                planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null, false, false);
                                return;
                            }

                            planeInstanceOld.item.namePosition = planeInstanceNew.position.x + "/" + planeInstanceNew.position.y + "/" + planeInstanceNew.position.z;
                            planeInstanceOld.item.position.copy(planeInstanceNew.position);

                            if (planeInstanceOld.item.name.includes("camera"))
                                planeInstanceOld.item.translateY(0.3)
                            else if (planeInstanceOld.item.name.includes("portal_gun"))
                                planeInstanceOld.item.translateY(0.65)

                            if (planeInstanceOld.item.name.includes("camera") ||
                                planeInstanceOld.item.name.includes("observation") ||
                                planeInstanceOld.item.name.includes("portal_gun"))
                                planeInstanceOld.item.rotation.set(planeInstanceNew.normal.x, planeInstanceNew.normal.y, planeInstanceNew.normal.z)
                            else if (!planeInstanceOld.item.name.includes("door-"))
                                planeInstanceOld.item.rotation.copy(planeInstanceNew.rotation);

                            //UPDATE PARAMETERS OF THE NEW PLACEMENT
                            planeInstanceReset(planeInstanceNew, true, planeInstanceOld.item.name, planeInstanceOld.item,
                                planeInstanceOld.state, planeInstanceOld.canRotate, planeInstanceOld.floor,
                                planeInstanceOld.ceiling, planeInstanceOld.walls, false, null, planeInstanceOld.allowconnection,
                                planeInstanceOld.continuousEnding
                            );
                            //UPDATE PARAMETERS OF THE OLD PLACEMENT
                            planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null, false, false);
                        }

                        removeSelection();
                        GLOBALS.SELECTED_ID[0] = instanceId;
                        return;
                    }
                }
            }
        }

        if (type == "down" && GLOBALS.SELECTED_ID.length > 0 && event.button == 0)
            removeSelection()

        if (GLOBALS.DRAGGING)
            return;

        if (currentID != instanceId) { //!GLOBALS.PLANE_USER_DATA[instanceId].hasItem

            currentID = instanceId;

            for (var i = 0; i < GLOBALS.SELECTED_ID_ORANGE.length; i++) {
                if (GLOBALS.SELECTED_ID_ORANGE[i].portal)
                    GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID_ORANGE[i].id_instanced, new Color(0xffffff));
                else
                    GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID_ORANGE[i].id_instanced, new Color(0x808080));
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

                let size = new Vector3().subVectors(vec2, vec1);
                let center = new Vector3().addVectors(vec1, vec2).multiplyScalar(0.5);

                let planeWidth = Math.abs(size.x);
                let planeHeight = Math.abs(size.y);
                let planeDepth = Math.abs(size.z);

                let planeGeom = new BoxGeometry(planeWidth, planeHeight, planeDepth);
                let planeMat = new MeshBasicMaterial({
                    color: new Color("rgb(0, 0, 255)")
                });
                var planeSelection = new Mesh(planeGeom, planeMat);
                planeSelection.position.copy(center);

                var direction = new Vector3();
                planeSelection.getWorldDirection(direction);
                direction = new Vector3(Math.abs(direction.x - 1), Math.abs(direction.y - 1), Math.abs(direction.z - 1))

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

function removeSelection() {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(0xffffff));
        else
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(0x808080));

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].selected = false;
    }

    GLOBALS.SELECTED_ID = [];
    GLOBALS.SELECTED_COLOR = [];
}

function showMenu(x, y) {
    var menu = document.querySelector('.menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('menu-show');
}

export {
    raycastSelected
}