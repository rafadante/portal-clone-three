/* eslint-disable */
import * as THREE from 'three';
import $ from 'jquery';
import {
    AddGoo
} from '../goo/Goo.js';
import {
    animate,
    tweenCamera
} from '../../Main.js';
import {
    GLOBALS
} from '../../Globals.js';
import {
    removeJointConstraint
} from '../../Physics.js';
import { findPath } from '../findPath/FindPath.js';
import { AUDIO } from '../audio/Audio.js';
import { floor, func, userData } from 'three/examples/jsm/nodes/Nodes.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { stateDoor } from '../door/Door.js';
import {
    createLightBridges
} from '../continuous/Continuous.js';
import { lightBridgeTrigger } from '../boxSelection/BoxSelection.js';

var beamType;
let lineFollow;
let isDrawStart = false;
var count = 0;
var mouse = new THREE.Vector3();
var positions;
var itemCount = 0;
const materialLine = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2
});

$("body").on('pointerdown', '.item', function (event) {
    event.preventDefault();
    clickItem($(this))
});

$("body").on('pointerdown', '.dispenser-once', function (event) {
    var i = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];
    i.trigger.item.item.state = "once";
    i.state = "once";

});

$("body").on('pointerdown', '.dispenser-always', function (event) {
    var i = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];
    i.trigger.item.item.state = "always";
    i.state = "always";
});

function addItem(found, loaded) {

    if (!GLOBALS.ITEM_CUBE.place)
        return


    if (GLOBALS.ITEM_HOLDED_NAME == "goo") {
        AddGoo(found, false);
        return;
    }

    if (loaded)
        GLOBALS.ITEM_HOLDED_NAME = found.itemName.split('-')[0];

    const i = 0;

    if (GLOBALS.CONNECTING) {

        target = GLOBALS.PLANE_USER_DATA[found[i].instanceId];

        GLOBALS.SELECTED_FOR_CONNECTION.trigger = target;
        GLOBALS.SELECTED_FOR_CONNECTION.normal = found[i].normal;

        findPath(GLOBALS.SELECTED_FOR_CONNECTION.position, target.position, found[i])
    } else {

        var userData;

        if (loaded) {
            userData = found;
        } else {
            userData = GLOBALS.PLANE_USER_DATA[found[i].instanceId];
            userData.hasItem = false; //delete here
        }

        console.log(found)

        if (!userData.hasItem || loaded) {


            if (GLOBALS.ITEM_HOLDED_NAME == "portal_0" || GLOBALS.ITEM_HOLDED_NAME == "portal_1") {

                var map2 = new THREE.TextureLoader().load(GLOBALS.DRAGGED_ITEM_ELEMENT.attr("src"));
                map2.colorSpace = THREE.SRGBColorSpace;


                const geometry = new THREE.BoxGeometry(2, 0, 2);
                const material = new THREE.MeshBasicMaterial({ map: map2, transparent: true, visible: false });
                const plane = new THREE.Mesh(geometry, material);

                console.log(item)

                var color;

                if (GLOBALS.ITEM_HOLDED_NAME == "portal_0")
                    color = new THREE.Color(0xff9a00);
                else if (GLOBALS.ITEM_HOLDED_NAME == "portal_1")
                    color = new THREE.Color(0x27a7d8);

                const geometry2 = new THREE.BoxGeometry(0.1, 0.1, 2);
                const material2 = new THREE.MeshStandardMaterial({ color: color, roughness: 0.2, envMap: GLOBALS.ENV_MAP });
                const box = new THREE.Mesh(geometry2, material2);
                const box2 = box.clone()
                box.translateX(0.65)
                box2.translateX(-0.65)


                plane.add(box)
                plane.add(box2)


                var item = plane;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var item = GLOBALS.ITEMS.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();

                item.traverse(child => {
                    if (child.name == "horizontal")
                        GLOBALS.CAMERA_OBJ_HORIZONTAL.push(child)
                    else if (child.name == "vertical")
                        GLOBALS.CAMERA_OBJ_VERTICAL.push(child)
                })
            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
                var item = GLOBALS.ITEMS.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {

                var item = new THREE.Group();

                const geometry = new THREE.CircleGeometry(0.25, 32);
                const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
                const circle = new THREE.Mesh(geometry, material);
                circle.rotation.x = -Math.PI / 2;
                circle.name = "circle_rotation";
                item.add(circle);
                circle.translateZ(0.01);

                const door = SkeletonUtils.clone(GLOBALS.ENTER_DOOR);
                door.position.set(0, 0, 0);
                door.rotation.set(0, 0, 0);
                item.add(door);
                door.translateZ(-1);
                door.translateY(1);

                item.getObjectByName("portal_door_right_04").scale.set(1, 1, 1);
                item.getObjectByName("portal_door_left_06").scale.set(1, 1, 1);
                item.getObjectByName("warning").visible = false;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_blue2") {
                GLOBALS.ITEM_HOLDED_NAME = "dispenser";
                var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
                var item = new THREE.Object3D();
                item.userData = instanced.userData;
            } else {
                var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME);
                var item = new THREE.Object3D();
                item.userData = instanced.userData;
            }

            if (GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"] < GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["max"]) {
                GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"] += 1;
            } else {
                alert("Max Number of this item on the scene reached!");
                return;
            }

            item.buttons = 0;
            item.connections = 0;
            item.opened = true;

            /*userData.hasItem = true;
            userData.itemName = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;
            userData.item = item;
            userData.state = "open";*/

            //UPDATE INSTANCE DATA
            planeInstanceReset(
                userData,
                true,
                GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount,
                item,
                'open',
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('rotate'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('floor'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('ceiling'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('walls'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('instanced'),
                GLOBALS.ITEM_HOLDED_NAME,
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('allowconnection')
            );

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var target = new THREE.Vector3(); // create once an reuse it

                if (loaded)
                    target = found.position;
                else
                    found[i].object.getWorldPosition(target);

                item.position.copy(target);
            } else
                item.position.copy(userData.position);


            console.log(userData)
            item.position.copy(userData.position);
            item.rotation.set(userData.normal.x, userData.normal.y, userData.normal.z)
            item.renderOrder = 2;
            item.name = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;
            item.planeInstancedId = userData.id_instanced;

            /*if (loaded) {
                item.rotation.copy(userData.itemRotation);
            } else if (userData.side == "front") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.x = Math.PI / 2;
                else
                    item.rotation.y = 0;
            } else if (userData.side == "right") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.z = Math.PI / 2;
                else
                    item.rotation.y = -Math.PI / 2;
            } else if (userData.side == "back") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.x = -Math.PI / 2;
                else
                    item.rotation.y = Math.PI;
            } else if (userData.side == "left") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.z = -Math.PI / 2;
                else
                    item.rotation.y = Math.PI / 2;
            } else if (userData.side == "down") {
                if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube")
                    item.translateY(1);
                else if (GLOBALS.ITEM_HOLDED_NAME == "radio")
                    item.translateY(0.25);

                if (GLOBALS.ITEM_HOLDED_NAME == "stripe" || GLOBALS.ITEM_HOLDED_NAME == "tractor_beam")
                    item.rotation.x = -Math.PI / 2;
            } else {
                if (GLOBALS.ITEM_HOLDED_NAME == "light" || GLOBALS.ITEM_HOLDED_NAME == "button_box")
                    item.rotation.x = Math.PI;
                else if (GLOBALS.ITEM_HOLDED_NAME == "stripe" || GLOBALS.ITEM_HOLDED_NAME == "tractor_beam")
                    item.rotation.x = Math.PI / 2;
            }*/

            //item.rotation.x = 

            //userData.itemRotation = item.rotation;

            if (GLOBALS.ITEM_HOLDED_NAME == "radio") {
                item.translateY(0.5);
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube") {

                var idInstanced;
                userData.dispenser = true;
                item.translateY(1);

                for (var j = 0; j < GLOBALS.DYMANIC_ITEMS["dispenser"].length; j++) {
                    if (GLOBALS.DYMANIC_ITEMS["dispenser"][j].length == 0) {
                        GLOBALS.DYMANIC_ITEMS["dispenser"][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                var instanced2 = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
                var item2 = new THREE.Object3D();
                //item2.userData = instanced2.userData;
                item2.position.copy(userData.position);
                //userData.item2 = item2;

                //GET CEILING SURFACE
                for (var x = 0, j = 2; x < 100; x++, j += 2) {

                    var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                    if (boxTop.length > 0) {
                        boxTop[0].hasItem = true;
                        boxTop[0].itemName = "dispenser";
                        boxTop[0].item = item2;
                        item2.translateY(j);
                        break;
                    }
                }

                item.dispenserPosition = item2.position.clone();
                item.hasDispenser = true;
                item.dispenserID = idInstanced;
                item.state = "open";

                item2.item = item;
                item2.userData.id = idInstanced;
                item2.scale.set(1, 1, 1);
                item2.updateMatrix();
                instanced2.setMatrixAt(idInstanced, item2.matrix);
                instanced2.instanceMatrix.needsUpdate = true;
                instanced2.computeBoundingSphere();
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "laser_field") {
                item.state = true;
                item.triggers = GLOBALS.LASER_FIELD_TRIGGER;
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "light_bridge") {
                item.state = true;
                item.triggers = GLOBALS.LIGHT_BRIDGE_TRIGGER;
                createLightBridges("light_bridge", GLOBALS.LIGHT_BRIDGE_RAYCASTER, item);

                setTimeout(() => {
                    lightBridgeTrigger(userData, GLOBALS.LIGHT_BRIDGE_TRIGGER, $("#light-bridge-trigger"), "light_bridge");
                }, 100);
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "tractor_beam") {
                item.beam = beamType;
                item.state = true;
                item.reversed = false;
                item.triggers = "State";
                createLightBridges("tractor_beam", GLOBALS.TRACTOR_BEAM_RAYCASTER, item);
            }

            if (GLOBALS.ITEM_HOLDED_NAME.includes("button")) {
                const geometryBox3 = new THREE.BoxGeometry(1, 0.5, 1);
                const materialBox3 = new THREE.MeshBasicMaterial({
                    color: 0x00ff00
                });
                const cube = new THREE.Mesh(geometryBox3, materialBox3);
                cube.position.copy(item.position);
                //GLOBALS.SCENE.add(cube);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);

                if (userData.instancedName == "button_box") {
                    bb.accept = "cube";
                } else if (userData.instancedName == "button_circle") {
                    bb.accept = "sphere";
                } else if (userData.instancedName == "button_weight") {
                    bb.accept = "sphere-cube-player";
                }

                userData.box3 = bb;

                console.log(GLOBALS.PLANE_USER_DATA[userData.id_instanced])

                //item.rotation.copy(userData.rotation)
                //item.rotation.x += Math.PI/2;
            }

            item.pedestalInfinity = true;
            item.pedestalValue = 3;

            if (GLOBALS.ITEM_HOLDED_NAME == "portal_0" || GLOBALS.ITEM_HOLDED_NAME == "portal_1") {
                GLOBALS.ITEMS_ADDED.add(item);
                item.translateY(0.01)
                console.log(item)
            } else if (GLOBALS.ITEM_HOLDED_NAME == "camera") {

                item.translateY(0.3)

                const geometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
                const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
                const cube = new THREE.Mesh(geometry, material);
                cube.name = "camera";
                cube.visible = false;

                var holder = new THREE.Vector3();
                item.children[1].getWorldPosition(holder)
                holder.y -= 0.25;

                cube.position.copy(holder)
                GLOBALS.SCENE.add(cube);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);
                item.box3 = bb;
                item.fixed = true;
                item.cube = cube;
                cube.item = item;


                GLOBALS.CAMERAS.push(item);
                GLOBALS.ITEMS_ADDED.add(item);

            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
                item.translateY(0.025);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(item);
                bb.side = 1;
                bb.position = item.position;
                bb.item = item;

                GLOBALS.FAITH_PLATE_CONTACT_BOX.push(bb);

                item.traverse(child => {
                    if (child.name == "launch") {
                        GLOBALS.FAITH_PLATE_TO_ROTATE.push(child)
                    }
                })

                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {
                //item.rotation.copy(userData.rotation);
                console.log(item)
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.DOORS.push(item)
            } else {
                var idInstanced;

                for (var j = 0; j < GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME].length; j++) {
                    if (GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME][j].length == 0) {
                        item.laser = false;
                        GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                if (GLOBALS.ITEM_HOLDED_NAME == "dispenser") {
                    //GET CEILING SURFACE
                    for (var x = 0, j = 2; x < 100; x++, j += 2) {

                        var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                        if (boxTop.length > 0) {
                            item.translateY(j);
                            break;
                        }
                    }
                }

                item.userData.id = idInstanced;
                item.idInstanced = idInstanced;
                console.log(idInstanced)
                item.scale.set(1, 1, 1);
                item.updateMatrix();
                instanced.setMatrixAt(idInstanced, item.matrix);

                if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_blue") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0x0000ff));
                    instanced.instanceColor.needsUpdate = true;
                } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_orange") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0xffa500));
                    instanced.instanceColor.needsUpdate = true;
                } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_white") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0xffffff));
                    instanced.instanceColor.needsUpdate = true;
                }

                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();

                if (GLOBALS.ITEM_HOLDED_NAME == "laser_field") {
                    createLightBridges("laser_field", GLOBALS.LASER_FIELD_RAYCASTER, item, instanced);

                    setTimeout(() => {
                        lightBridgeTrigger(userData, GLOBALS.LASER_FIELD_TRIGGER, $("#laser-field-trigger"), "laser_field");
                    }, 100);
                }
            }

            itemCount++;
        }
    }

    if (loaded) {
        GLOBALS.ITEM_HOLDED_NAME = null;
        $("#follow").css("display", "none");
        //animate()
    }
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

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

    var geometry = new THREE.BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    lineFollow = new THREE.Line(geometry, materialLine);
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

    console.log("11111111111")

    //addPoint(GLOBALS.SELECTED.parent.position.x, GLOBALS.SELECTED.parent.position.y - 1, GLOBALS.SELECTED.parent.position.z);
    //addPoint(GLOBALS.SELECTED.parent.position.x, GLOBALS.SELECTED.parent.position.y - 1, GLOBALS.SELECTED.parent.position.z);
})

function addPoint(x, y, z) {
    positions[count * 3 + 0] = x;
    positions[count * 3 + 1] = y;
    positions[count * 3 + 2] = z;
    count++;
    lineFollow.geometry.setDrawRange(0, count);
}

document.body.addEventListener('mousemove', onPointerMove);

var raycaster = new THREE.Raycaster();
const mouse2 = new THREE.Vector2(1, 1);

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

    if (connecting) {
        if (userData.allowconnection) {
            GLOBALS.ITEM_CUBE.material.color = new THREE.Color(0x00ff00)
            GLOBALS.ITEM_CUBE.place = true;
        } else {
            GLOBALS.ITEM_CUBE.material.color = new THREE.Color(0xff0000)
            GLOBALS.ITEM_CUBE.place = false;
        }
    } else {
        if (userData.hasItem ||
            (userData.side == "down" && !GLOBALS.DRAGGED_ITEM_ELEMENT.data("floor")) ||
            (userData.side == "up" && !GLOBALS.DRAGGED_ITEM_ELEMENT.data("ceiling")) ||
            ((userData.side == "front" || userData.side == "back" || userData.side == "left" || userData.side == "right")
                && !GLOBALS.DRAGGED_ITEM_ELEMENT.data("walls"))
        ) {
            GLOBALS.ITEM_CUBE.material.color = new THREE.Color(0xff0000)
            GLOBALS.ITEM_CUBE.place = false;
        } else {
            GLOBALS.ITEM_CUBE.material.color = new THREE.Color(0x00ff00)
            GLOBALS.ITEM_CUBE.place = true;
        }
    }

    GLOBALS.ITEM_CUBE.position.copy(userData.position);
    GLOBALS.ITEM_CUBE.visible = true;

    if (connecting)
        animate();
}

var itemHolder = null;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function interactWithItem() {

    raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(GLOBALS.INTERACTIVE);

    if (GLOBALS.HOLDING_ITEM) {

        AUDIO.HOLD.pause();
        tweenCamera(250, GLOBALS.GUN.children[0].children[0].position, new THREE.Vector3(0.009, -0.013, -0.012))
        GLOBALS.HOLDING_ITEM = false;
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.OBJ_HOLDED_CLONE);
        GLOBALS.OBJ_HOLDED_CLONE = null;

        if (itemHolder) {
            itemHolder.gelJumping = false;
            itemHolder.sleeping = false;
        }

        GLOBALS.CURRENT_ITEM.body.holding = false;
        GLOBALS.CURRENT_ITEM.body.angularDamping = 0;
        GLOBALS.CURRENT_ITEM.body.allowSleep = true;
        GLOBALS.CURRENT_ITEM = null;
        GLOBALS.CURRENT_ITEM_ID = null;
        itemHolder = null;

        removeJointConstraint();

    } else if (intersects.length > 0) {

        if (intersects[0].object.name == "pedestal_button") {

            if (intersects[0].distance < 1) {

                var item = GLOBALS.DYMANIC_ITEMS[intersects[0].object.name][intersects[0].instanceId];
                var goal = GLOBALS.PLANE_USER_DATA[item.planeInstancedId];

                //Go through each connection to check for triggers
                for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
                    if (goal == GLOBALS.CONNECTIONS[i]['from']) {
                        if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
                            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
                            if (!GLOBALS.CONNECTIONS[i]['line'].active) {

                                GLOBALS.CONNECTIONS[i]['to'].item.buttons += 1;
                                GLOBALS.CONNECTIONS[i]['line'].active = true;
                                GLOBALS.CONNECTIONS[i]['line'].material.color = new THREE.Color(0x0077B6);

                                if (GLOBALS.CONNECTIONS[i]['to'].item.connections == GLOBALS.CONNECTIONS[i]['to'].item.buttons) {
                                    stateDoor(0, true, false, GLOBALS.CONNECTIONS[i]['to'].item);
                                }

                                if (!GLOBALS.CONNECTIONS[i]['from'].item.pedestalInfinity) {

                                    var holder = GLOBALS.CONNECTIONS[i];

                                    setTimeout(() => {
                                        holder['line'].active = false;
                                        holder['to'].item.buttons -= 1;
                                        holder['line'].material.color = new THREE.Color(0xffa500);

                                        if (holder['to'].item.buttons < holder['to'].item.connections) {
                                            stateDoor(0, false, false, holder['to'].item);
                                        }
                                    }, GLOBALS.CONNECTIONS[i]['from'].item.pedestalValue * 1000);
                                }
                            }
                        }
                    }
                }


                /*var item = GLOBALS.DYMANIC_ITEMS[intersects[0].object.name][intersects[0].instanceId];
                var goal = GLOBALS.PLANE_USER_DATA[item.planeInstancedId];

                if (goal.trigger.itemName.includes("exitDoor")) {

                } else if (goal.trigger.itemName.includes("dispenser")) {
                    GLOBALS.BOX_BODY[goal.trigger.item.userData.id].mass = 5;
                }

                goal.circle.material.color = new THREE.Color(0xfcba03);
                goal.check.material.color = new THREE.Color(0xfcba03);
                goal.check.material.map = GLOBALS.IMG_CHECK;

                setTimeout(() => {
                    goal.circle.material.color = new THREE.Color(0x03e8fc);
                    goal.check.material.color = new THREE.Color(0x03e8fc);
                    goal.check.material.map = GLOBALS.CLOSE;
                }, 2000);*/


            }
        } else {
            if (intersects[0].distance < 1.5) {

                GLOBALS.HOLDING_ITEM = true;
                tweenCamera(250, GLOBALS.GUN.children[0].children[0].position, new THREE.Vector3(0.009, -0.013, -0.004))

                if (intersects[0].object.name != "camera") {
                    var instancedId = intersects[0].instanceId;
                    var name = intersects[0].object.name;

                    GLOBALS.CURRENT_ITEM = GLOBALS.DYMANIC_ITEMS[name][instancedId];
                    GLOBALS.CURRENT_INSTANCED = GLOBALS.ITEMS_ADDED.getObjectByName(name);
                    GLOBALS.CURRENT_ITEM_ID = instancedId;

                    itemHolder = GLOBALS.DYMANIC_ITEMS[name][instancedId].body;
                    GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
                    GLOBALS.CURRENT_ITEM.body.allowSleep = false;
                    GLOBALS.CURRENT_ITEM.body.holding = true;

                    //if (GLOBALS.DYMANIC_ITEMS[name][instancedId].body.placed)
                    //    revert(GLOBALS.DYMANIC_ITEMS[name][instancedId].body)

                    GLOBALS.OBJ_HOLDED_CLONE = GLOBALS.CURRENT_ITEM.userData.obj;
                    GLOBALS.OBJ_HOLDED_CLONE.userData.instanced = true;
                } else {
                    GLOBALS.CURRENT_ITEM = intersects[0].object;
                    GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
                    GLOBALS.CURRENT_ITEM.body.allowSleep = false;
                    GLOBALS.CURRENT_ITEM.body.holding = true;
                    GLOBALS.OBJ_HOLDED_CLONE = GLOBALS.CURRENT_ITEM.item.clone();
                    GLOBALS.OBJ_HOLDED_CLONE.userData.instanced = false;
                }

                GLOBALS.SCENE_CHILDREN.add(GLOBALS.OBJ_HOLDED_CLONE);
                GLOBALS.OBJ_HOLDED_CLONE.visible = false;

                AUDIO.PICK_SUCESS.pause();
                AUDIO.PICK_SUCESS.currentTime = 0;
                AUDIO.PICK_SUCESS.play();

                AUDIO.HOLD.play();
            } else {
                AUDIO.PICK_FAIL.pause();
                AUDIO.PICK_FAIL.currentTime = 0;
                AUDIO.PICK_FAIL.play();
            }
        }
    } else {
        AUDIO.PICK_FAIL.pause();
        AUDIO.PICK_FAIL.currentTime = 0;
        AUDIO.PICK_FAIL.play();
    }

    GLOBALS.LIGHTNIN_STRIKE_1.visible = GLOBALS.HOLDING_ITEM;
    GLOBALS.LIGHTNIN_STRIKE_2.visible = GLOBALS.HOLDING_ITEM;
    GLOBALS.LIGHTNIN_STRIKE_3.visible = GLOBALS.HOLDING_ITEM;
}

function revert(d) {
    var goal = d.goal;
    goal.circle.material.color = new THREE.Color(0x03e8fc);
    goal.check.material.color = new THREE.Color(0x03e8fc);
    goal.check.material.map = GLOBALS.IMG_CLOSE;

    setTimeout(() => {
        d.placed = false;
        d.goal = null;
    }, 5000);

    if (goal.trigger.itemName.includes("door")) {
        const doorLeft = goal.trigger.item.getObjectByName("door_left");
        const doorRight = goal.trigger.item.getObjectByName("door_right");

        setTimeout(() => {
            //doorLeft.position.z += 0.1;
            //doorRight.position.z += 0.1;
            GLOBALS.CANNON_WORLD.addBody(goal.trigger.item.body);
            tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x + 1, doorLeft.position.y, doorLeft.position.z))
            tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x - 1, doorRight.position.y, doorRight.position.z))
        }, 1000);

    } else {
        /*exit = true;
        setTimeout(() => {
            tweenCamera(500, GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation, new THREE.Vector3(Math.PI,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation.y,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation.z))

            tweenCamera(500, GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation, new THREE.Vector3(Math.PI,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation.y,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation.z))

            GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z = -5;
            tweenCamera(1000, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position, new THREE.Vector3(GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.x + 60, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.y, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z))

            GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z = -5;
            tweenCamera(1000, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position, new THREE.Vector3(GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.x + 60, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.y, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z))
        }, 1000);*/
    }
}

function planeInstanceReset(planeInstance, hasItem, itemName, item, state, canRotate, floor, ceiling, walls, isInstanced, instancedName, allowconnection) {
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
    console.log(item)
    GLOBALS.ITEMS_COUNT[item.instancedName]["count"] -= 1;
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(item.instancedName);
    var dummy = new THREE.Object3D();
    dummy.scale.set(0, 0, 0);
    dummy.updateMatrix();
    instanced.setMatrixAt(item.item.idInstanced, dummy.matrix);
    instanced.instanceMatrix.needsUpdate = true;

    if (item.instancedName == "cube" || item.instancedName == "sphere") {
        console.log(item.item.dispenserID)
        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
        var dummy = new THREE.Object3D();
        dummy.scale.set(0, 0, 0);
        dummy.updateMatrix();
        instanced.setMatrixAt(item.item.dispenserID, dummy.matrix);
        instanced.instanceMatrix.needsUpdate = true;
        GLOBALS.DYMANIC_ITEMS["dispenser"][item.item.dispenserID] = [];
    }

    GLOBALS.DYMANIC_ITEMS[item.instancedName][item.item.idInstanced] = [];

    if (moving)
        clickItem($("#" + item.instancedName));
}

function clickItem(elem) {
    GLOBALS.ITEM_HOLDED_NAME = elem.data("name");
    beamType = elem.data("beam");
    $("#follow").attr("src", elem.attr("src"));
    GLOBALS.DRAGGED_ITEM_ELEMENT = elem;
}

export {
    addItem,
    hoverItem,
    interactWithItem,
    planeInstanceReset,
    deleteItemInstanced
};