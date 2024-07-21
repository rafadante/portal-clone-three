import * as THREE from 'three';
import $ from 'jquery';
import {
    GLOBALS
} from '../../Globals.js';
import {
    animate
} from '../../Main.js';
import { planeInstanceReset, deleteItemInstanced } from '../items/Items.js';
import { MeshLineGeometry, MeshLineMaterial, raycast } from 'meshline';
import { func } from 'three/examples/jsm/nodes/Nodes.js';

const orange = new THREE.Color("rgb(255, 165, 0)");
var initialPosition = null;
var currentID = null;

function raycastSelected(found, event, type) {

    $("#delete").css("display", "none")
    document.querySelector('.menu').classList.remove('menu-show');

    const instanceId = found.instanceId;

    if (GLOBALS.CONNECTING) {

        GLOBALS.CONNECTING = false;

        GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CURRENT_LINE);

        if (GLOBALS.PLANE_USER_DATA[instanceId].allowconnection) {

            GLOBALS.PLANE_USER_DATA[instanceId].item.connections += 1;

            var endPos = GLOBALS.PLANE_USER_DATA[instanceId].position;

            if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") || GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere"))
                endPos = GLOBALS.PLANE_USER_DATA[instanceId].item.dispenserPosition

            const points = [];
            points.push(GLOBALS.SELECTED_FOR_CONNECTION.position);
            points.push(endPos);

            console.log(GLOBALS.PLANE_USER_DATA[instanceId])

            const geometry = new MeshLineGeometry()
            geometry.setPoints(points)
            const material = new MeshLineMaterial({
                color: 0xffa500,
                side: 2,
                depthTest: true,
                transparent: true
            })
            material.uniforms.alphaTest.value = 0;
            material.uniforms.dashArray.value = 0.01;
            material.uniforms.lineWidth.value = 0.1;
            material.uniforms.useDash.value = 1;
            const line = new THREE.Mesh(geometry, material)

            GLOBALS.SCENE_CHILDREN.add(line);

            GLOBALS.CONNECTIONS.push({
                line: line,
                from: GLOBALS.SELECTED_FOR_CONNECTION,
                to: GLOBALS.PLANE_USER_DATA[instanceId]
            })

            console.log(GLOBALS.CONNECTIONS)
        }

        GLOBALS.ITEM_CUBE.visible = false;
        GLOBALS.CURRENT_LINE = null;

        return;
    }

    if (event.button == 2) {
        //removeSelection();
        if (GLOBALS.PLANE_USER_DATA[instanceId].itemName != "exitDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "enterDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "window") {

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
                    $("#state-dispenser").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.hasDispenser);
                    console.log(GLOBALS.PLANE_USER_DATA[instanceId].item.opened)
                    $("#dispenser-opened").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.opened);
                } else {
                    $(".dispenser").css("display", "none");
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("button")) {
                    $(".buttons").css("display", "block");

                    $("#connections").empty();

                    console.log(GLOBALS.PLANE_USER_DATA[instanceId])
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
                    $("#state-pedetsal-infinity").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.pedestalInfinity);
                    $("#pedestal-timer-value").prop("value", GLOBALS.PLANE_USER_DATA[instanceId].item.pedestalValue);

                    if (GLOBALS.PLANE_USER_DATA[instanceId].item.pedestalInfinity) {
                        $("#pedestal-timer").addClass("disabled");
                    } else {
                        $("#pedestal-timer").removeClass("disabled");
                    }
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("tractor")) {
                    $(".tractor").css("display", "block");

                    $("#tractor-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.state)
                    $("#tractor-direction-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.reversed)
                    $("#tractor-trigger").find(".title").text("Triggers: " + GLOBALS.PLANE_USER_DATA[instanceId].item.triggers);
                    console.log("bbbbbbbbbbbbbbbbbb")
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("light_bridge")) {
                    $(".light-bridge").css("display", "block");

                    $("#light-bridge-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.state);
                    $("#light-bridge-trigger").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.triggers);
                }

                if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("laser_field")) {
                    $(".laser-field").css("display", "block");

                    $("#laser-field-state-input").prop("checked", GLOBALS.PLANE_USER_DATA[instanceId].item.state);
                    $("#laser-field-trigger").find(".title").text(GLOBALS.PLANE_USER_DATA[instanceId].item.triggers);
                }
            }

            GLOBALS.SELECTED_ID.push(instanceId);

            showMenu(event.pageX, event.pageY);

            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(instanceId, orange);
            //GLOBALS.SELECTED_ID_ORANGE.push(plane[0]);
            //GLOBALS.SELECTED_ID.push(plane[0].id_instanced);
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
                                GLOBALS.LIGHT_BRIDGE_TRIGGER = planeInstanceOld.item.triggers;
                                GLOBALS.CANNON_WORLD.removeBody(planeInstanceOld.item.bodyBridge);
                                planeInstanceOld.item.bodyBridge = null;
                            }

                            if(planeInstanceOld.item.cloneLaserID){
                                GLOBALS.LASER_FIELD_TRIGGER = planeInstanceOld.item.triggers;
                            }


                            deleteItemInstanced(planeInstanceOld, true);
                            planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null, false);
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
                            planeInstanceOld.item.namePosition = planeInstanceNew.position.x + "/" + planeInstanceNew.position.y + "/" + planeInstanceNew.position.z;
                            planeInstanceOld.item.position.copy(planeInstanceNew.position);

                            if (!planeInstanceOld.item.name.includes("door-"))
                                planeInstanceOld.item.rotation.copy(planeInstanceNew.rotation);

                            //UPDATE PARAMETERS OF THE NEW PLACEMENT
                            planeInstanceReset(planeInstanceNew, true, planeInstanceOld.item.name, planeInstanceOld.item,
                                planeInstanceOld.state, planeInstanceOld.canRotate, planeInstanceOld.floor,
                                planeInstanceOld.ceiling, planeInstanceOld.walls, false, null, planeInstanceOld.allowconnection);
                            //UPDATE PARAMETERS OF THE OLD PLACEMENT
                            planeInstanceReset(planeInstanceOld, false, null, null, null, null, null, null, null, false, null, false)

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

        if (type == "down" && GLOBALS.SELECTED_ID.length > 0 && event.button == 0)
            removeSelection()

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
        scale = new THREE.Vector3(1, 1, 1);
    else
        scale = new THREE.Vector3(0, 0, 0);

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.hasDispenser = this.checked;

    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
    var dummy = new THREE.Object3D();
    dummy.scale.copy(scale);
    dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserPosition);
    dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.rotation);
    dummy.updateMatrix();
    instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.dispenserID, dummy.matrix);
    instanced.instanceMatrix.needsUpdate = true;

    animate();
});

$("body").on('input', '#dispenser-opened', function () {
    console.log(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]])
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
    GLOBALS.ITEM_CUBE.material.color = new THREE.Color(0xff0000);
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


$("body").on('input', '#tractor-state-input, #light-bridge-state-input, #laser-field-state-input', function () {

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

$("body").on('click', '.light-bridge-triggers', function () {
    lightBridgeTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], $(this).data("trigger"), $("#light-bridge-trigger"), "light_bridge")
});

$("body").on('click', '.laser-field-triggers', function () {
    lightBridgeTrigger(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]], $(this).data("trigger"), $("#laser-field-trigger"), "laser_field")
});

function lightBridgeTrigger(obj, trigger, elem, name) {
    obj.item.triggers = trigger;
    elem.data("trigger", trigger)
    elem.find(".title").text(trigger);

    var dummy = new THREE.Object3D();
    dummy.position.copy(new THREE.Vector3(
        obj.position.x,
        obj.position.y,
        obj.position.z
    ));
    dummy.rotation.set(
        obj.normal.x,
        obj.normal.y,
        obj.normal.z
    );

    if (trigger == "Middle Vertical") {
        dummy.rotateY(Math.PI / 2);
    } else if (trigger == "Top") {
        dummy.translateZ(-0.8);
    } else if (trigger == "Bottom") {
        dummy.translateZ(0.8);
    } else if (trigger == "Left") {
        dummy.rotateY(Math.PI / 2);
        dummy.translateZ(-0.8);
    } else if (trigger == "Right") {
        dummy.rotateY(Math.PI / 2);
        dummy.translateZ(0.8);
    }

    obj.item.raycaster.ray.origin = dummy.position;
    obj.item.continuous.position.copy(dummy.position)
    obj.item.continuous.rotation.copy(dummy.rotation)
    obj.item.continuous.translateY(obj.item.continuous.distance);

    if (name == "light_bridge") {
        obj.item.bodyBridge.position.copy(obj.item.continuous.position)
        obj.item.bodyBridge.quaternion.copy(dummy.quaternion)
        //GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.bodyBridge.translateY(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.distance);
    }

    dummy.updateMatrix();
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);
    instanced.setMatrixAt(obj.item.idInstanced, dummy.matrix);


    if (name == "laser_field") {
        obj.item.bodyLaserField.position.copy(obj.item.continuous.position)
        obj.item.bodyLaserField.quaternion.copy(dummy.quaternion)

        dummy.rotateX(Math.PI);
        dummy.translateY(-obj.item.cloneLaserDistance);

        dummy.updateMatrix();
        instanced.setMatrixAt(obj.item.cloneLaserID, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();

    animate();
}

export {
    raycastSelected,
    lightBridgeTrigger
}