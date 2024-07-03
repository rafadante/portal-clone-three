/* eslint-disable */
import * as THREE from 'three';
import $ from 'jquery';
import {
    AddGoo
} from '../goo/Goo.js';
import {
    tweenCamera
} from '../../Main.js';
import {
    GLOBALS
} from '../../Globals.js';
import {
    removeJointConstraint
} from '../../Physics.js';
import { findPath } from '../findPath/FindPath.js';

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
    GLOBALS.ITEM_HOLDED_NAME = $(this).data("name");
    beamType = $(this).data("beam");
    $("#follow").attr("src", $(this).attr("src"));
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

        if (!userData.hasItem || loaded) {

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var item = GLOBALS.ITEMS.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();

                item.traverse(child => {
                    if (child.name == "horizontal")
                        GLOBALS.CAMERA_OBJ_HORIZONTAL.push(child)
                    else if (child.name == "vertical")
                        GLOBALS.CAMERA_OBJ_VERTICAL.push(child)
                })
            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate" || GLOBALS.ITEM_HOLDED_NAME == "door") {
                var item = GLOBALS.ITEMS.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
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

            if(GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"] < GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["max"]){
                GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"]+=1;
            }else{
                alert("Max Number of this item on the scene reached!");
                return;
            }
            
            console.log(GLOBALS.ITEMS_COUNT)

            userData.hasItem = true;
            userData.itemName = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;
            userData.item = item;
            userData.state = "open";

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var target = new THREE.Vector3(); // create once an reuse it

                console.log(found)

                if (loaded)
                    target = found.position;
                else
                    found[i].object.getWorldPosition(target);

                item.position.copy(target);
            } else
                item.position.copy(userData.position);

            item.position.copy(userData.position);
            item.renderOrder = 2;
            item.name = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;
            item.planeInstancedId = userData.id_instanced;

            if (loaded) {
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
            }

            userData.itemRotation = item.rotation;

            if (GLOBALS.ITEM_HOLDED_NAME == "button_box") {

                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00
                });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(item.position)

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);

                if (loaded)
                    bb.id = found.id_instanced;
                else
                    bb.id = found[i].instanceId;

                GLOBALS.TRIGGER.push(bb);
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube") {

                var idInstanced;

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

            if (GLOBALS.ITEM_HOLDED_NAME == "light_bridge")
                item.position.y += 1;

            if (GLOBALS.ITEM_HOLDED_NAME == "tractor_beam")
                item.beam = beamType;

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {

                console.log(item)
                item.translateY(1)
                item.translateZ(0.3)

                const geometry = new THREE.BoxGeometry( 0.6, 0.6, 0.6 ); 
                const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
                const cube = new THREE.Mesh( geometry, material ); 
                cube.name = "camera";
                cube.visible = false;

                var holder = new THREE.Vector3();
                item.children[1].getWorldPosition(holder)
                holder.y -= 0.25;

                cube.position.copy(holder)
                GLOBALS.SCENE.add( cube );

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);
                item.box3 = bb;
                item.fixed = true;
                item.cube = cube;


                GLOBALS.CAMERAS.push(item);
                GLOBALS.ITEMS_ADDED.add(item);

                console.log(GLOBALS.CAMERAS)

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
    GLOBALS.SCENE_CHILDREN.add(lineFollow);

    isDrawStart = true;

    GLOBALS.SELECTED_FOR_CONNECTION = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];

    addPoint(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.x,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.y,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.z);

    addPoint(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.x,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.y,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.z);

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
}

function updateLine() {
    positions[count * 3 - 3] = mouse.x;
    positions[count * 3 - 2] = mouse.y;
    positions[count * 3 - 1] = mouse.z;
    lineFollow.geometry.attributes.position.needsUpdate = true;
}

function hoverItem(found) {

    if (found.length == 0)
        return

    var userData = GLOBALS.PLANE_USER_DATA[found[0].instanceId];

    GLOBALS.ITEM_CUBE.position.copy(userData.position);
    GLOBALS.ITEM_CUBE.visible = true;
}

var itemHolder = null;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function interactWithItem() {
    raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(GLOBALS.INTERACTIVE);

    if (GLOBALS.HOLDING_ITEM) {

        GLOBALS.HOLDING_ITEM = false;

        if(itemHolder){
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
                }, 2000);
            }
        } else {
            if (intersects[0].distance < 1.5) {
                GLOBALS.HOLDING_ITEM = true;

                console.log(intersects[0].object.name)

                if(intersects[0].object.name != "camera"){
                    var instancedId = intersects[0].instanceId;
                    var name = intersects[0].object.name;
    
                    GLOBALS.CURRENT_ITEM = GLOBALS.DYMANIC_ITEMS[name][instancedId];
                    GLOBALS.CURRENT_INSTANCED = GLOBALS.ITEMS_ADDED.getObjectByName(name);
                    GLOBALS.CURRENT_ITEM_ID = instancedId;
    
                    itemHolder = GLOBALS.DYMANIC_ITEMS[name][instancedId].body;
                    GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
                    GLOBALS.CURRENT_ITEM.body.allowSleep = false;
                    GLOBALS.CURRENT_ITEM.body.holding = true;
    
                    if (GLOBALS.DYMANIC_ITEMS[name][instancedId].body.placed)
                        revert(GLOBALS.DYMANIC_ITEMS[name][instancedId].body)
                }else{
                    GLOBALS.CURRENT_ITEM = intersects[0].object;
                    GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
                    GLOBALS.CURRENT_ITEM.body.allowSleep = false;
                    GLOBALS.CURRENT_ITEM.body.holding = true;
                }
            }
        }
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

export {
    addItem,
    hoverItem,
    interactWithItem
};