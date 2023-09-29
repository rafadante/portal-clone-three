import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

window.itemSelected = false;
var itemSelectedName;
var previousItemHolder;
var currentArrayDirection;
var arrayUp = [
    []
]
var arrayBack = [
    []
];

function raycastSelected(found, event, type) {

    document.querySelector('.menu').classList.remove('menu-show')

    if (found.length > 0) {
        if (type == "down" && window.buttonLeft) {
            for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
                var parent = window.CUBE_SELECTION_ARRAY[i].parent;
                if (parent)
                    parent.remove(window.CUBE_SELECTION_ARRAY[i]);
            }

            window.CUBE_SELECTION_ARRAY = [];
            window.itemSelected = false;
            itemSelectedName = null;
            //
            currentArrayDirection = null;
            arrayUp = [
                []
            ]
            arrayBack = [
                []
            ];
        }

        for (var i = 0; i < found.length; i++) {


            //
            if (window.itemSelected && window.buttonLeft && found[i].object.visible) {
                if (!found[i].object.userData.hasItem) { //&& Math.abs(found[i].normal.y) != 1

                    const item = window.MAIN_SCENE.getObjectByName(itemSelectedName)

                    if (item.userData.wall && (found[i].object.name == "up" || found[i].object.name == "down"))
                        continue;
                    else if (item.userData.ground && (found[i].object.name != "up" && found[i].object.name != "down"))
                        continue;

                    found[i].object.userData.hasItem = true;
                    found[i].object.userData.connection = true;
                    found[i].object.userData.itemName = itemSelectedName;

                    //found[i].object.check1 = previousItemHolder.check1;
                    //found[i].object.check2 = previousItemHolder.check2;
                    //found[i].object.check3 = previousItemHolder.check3;
                    //found[i].object.check4 = previousItemHolder.check4;

                    previousItemHolder.userData.hasItem = false;
                    previousItemHolder.userData.connection = false;
                    previousItemHolder.item = null;
                    previousItemHolder.userData.itemName = null;
                    previousItemHolder.userData.checks = 0;

                    item.position.copy(found[i].object.parent.position);

                    if (found[i].object.name == "back") {
                        item.rotation.y = 0;
                    } else if (found[i].object.name == "right") {
                        item.rotation.y = -Math.PI / 2;
                    } else if (found[i].object.name == "front") {
                        item.rotation.y = Math.PI;
                    } else if (found[i].object.name == "left") {
                        item.rotation.y = Math.PI / 2;
                    }

                    if (item.userData.ground) {
                        if (itemSelectedName.includes("sphere-") || itemSelectedName.includes("cube-")) {

                            item.dispenser.position.copy(item.position);

                            for (var x = 0, j = 0; x < 100; x++, j += 2) {

                                var boxTop = window.CUBES.getObjectByName(found[i].object.parent.position.x + "/" +
                                    (found[i].object.parent.position.y + j) + "/" +
                                    found[i].object.parent.position.z)

                                if (boxTop) {
                                    if (boxTop.getObjectByName("down").visible) {
                                        item.dispenser.position.y = j + 2;
                                        break;
                                    }
                                }

                            }

                        } else {
                            item.translateY(-1);
                        }
                    } else {
                        item.translateZ(-1);
                    }

                    //

                    if (itemSelectedName == "window") {
                        item.translateY(-1)
                        item.translateX(-1)
                    }

                    previousItemHolder = found[i].object;
                    window.SELECTED.item = item;
                }

            } else if (found[i].object.userData.hasItem && window.buttonLeft && found[i].object.visible) {
                window.itemSelected = true;
                window.CONTROLS.enabled = false;
                window.SELECTING = true;
                itemSelectedName = found[i].object.userData.itemName;
                previousItemHolder = found[i].object;
                document.body.style.cursor = "grabbing";

                window.SELECTED = found[i].object;
                //window.CUBE_SELECTION_ARRAY[0].visible = false;
                //
                var target = new THREE.Vector3();
                found[i].object.getWorldPosition(target);

                window.ITEM_CUBE.position.copy(target);
                window.ITEM_CUBE.visible = true;
                window.ITEM_CUBE.material.color = new THREE.Color(0xff950a)
            }


            if (found[i].object.parent && window.buttonLeft && !window.itemSelected) {
                //
                if (found[i].object.visible) {
                    //
                    //
                    window.CONTROLS.enabled = false;
                    window.SELECTED = found[i].object;
                    window.SELECTED.normal = found[i].normal.clone();
                    window.STATE_PORTAL = found[i].object.userData.portal;

                    var direction = new THREE.Vector3(1, 0, 0).applyQuaternion(window.SELECTED.quaternion);

                    if (!window.CUBES.getObjectByName("cube-selection/" + window.SELECTED.parent.position.x + "/" +
                            window.SELECTED.parent.position.y + "/" + window.SELECTED.parent.position.z)) {

                        var clone = window.CUBE_SELECTION.clone();
                        clone.name = "cube-selection/" + window.SELECTED.parent.position.x + "/" +
                            window.SELECTED.parent.position.y + "/" + window.SELECTED.parent.position.z;

                        // create onb for bb transformations
                        var ty = found[i].normal.clone().normalize()
                        var tz = direction.clone().projectOnPlane(ty).normalize()
                        if (tz.length() < 0.1) {
                            tz = new THREE.Vector3(0, 1, 0)
                        }
                        var tx = tz.clone().cross(ty)

                        // set portal corner points

                        let tRot = new THREE.Matrix4().makeBasis(tx, ty, tz)

                        var transform = tRot.clone().setPosition(window.SELECTED.position)

                        clone.applyMatrix4(transform)
                        clone.updateMatrix()

                        clone.position.set(window.SELECTED.parent.position.x,
                            window.SELECTED.parent.position.y,
                            window.SELECTED.parent.position.z)

                        if (found[i].object.userData.blocked)
                            clone.translateZ(-1);
                        else
                            clone.translateZ(1);

                        if (window.SELECTED.parent.userData.inverted) {
                            clone.rotation.y += Math.PI
                        }

                        clone.normal = found[i].normal.clone();
                        window.CUBES.add(clone);
                        clone.selected = window.SELECTED;

                        handlePositions(clone);

                        window.CUBE_SELECTION_ARRAY.push(clone);
                    }

                    if (event.button == 0 && type == "down")
                        window.SELECTING = true;

                    break;
                }
            }
        }

        if (window.SELECTED && event.button == 2) {
            $(".hasItem").css("display", "none");
            $(".noItem").css("opacity", "1");
            $(".noItem").css("pointer-events", "all");
            $(".noItem a").css("pointer-events", "all");
            $(".noItem button").css("pointer-events", "all");

            if (window.SELECTED.userData.itemName != "exitDoor" &&
                window.SELECTED.userData.itemName != "enterDoor" &&
                window.SELECTED.userData.itemName != "window")
                showMenu(event.pageX, event.pageY);
        }

        for (var i = 0; i < found.length; i++) {
            if (found[i].object.userData.hasItem && event.button == 2 && window.SELECTED) {

                console.log(window.SELECTED)

                if (window.SELECTED.item.userData.trigger) {
                    $(".hasItem").css("display", "flex");
                }
                
                $(".noItem").css("opacity", "0.5");
                $(".noItem").css("pointer-events", "none");
                $(".noItem a").css("pointer-events", "none");
                $(".noItem button").css("pointer-events", "none");

                window.startItem = window.SELECTED.item;

                if (found[i].object.userData.itemName != "exitDoor" &&
                    found[i].object.userData.itemName != "enterDoor" &&
                    found[i].object.userData.itemName != "window")
                    showMenu(event.pageX, event.pageY);

                break;
            }
        }
    }
}

function handlePositions(clone) {
    if (Math.abs(clone.normal.x) == 1) {
        clone.userData.pos1 = "down";
        clone.userData.pos2 = "up";
        clone.userData.pos3 = "up";
        clone.userData.pos4 = "down";
        clone.userData.pos5 = "front";
        clone.userData.pos6 = "back";
        clone.userData.pos7 = "back";
        clone.userData.pos8 = "front";
    } else if (Math.abs(clone.normal.y) == 1) {
        clone.userData.pos1 = "right";
        clone.userData.pos2 = "left";
        clone.userData.pos3 = "left";
        clone.userData.pos4 = "right";
        clone.userData.pos5 = "front";
        clone.userData.pos6 = "back";
        clone.userData.pos7 = "back";
        clone.userData.pos8 = "front";
    } else if (Math.abs(clone.normal.z) == 1) {
        clone.userData.pos1 = "right";
        clone.userData.pos2 = "left";
        clone.userData.pos3 = "left";
        clone.userData.pos4 = "right";
        clone.userData.pos5 = "down";
        clone.userData.pos6 = "up";
        clone.userData.pos7 = "up";
        clone.userData.pos8 = "down";
    }
}

//
//UI
function showMenu(x, y) {
    var menu = document.querySelector('.menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('menu-show');
}

$("body").on('click', '#delete', function () {

    window.SELECTED.userData.hasItem = false;
    window.SELECTED.userData.itemName = null;

    window.ITEMS_ADDED.remove(window.SELECTED.item);
    window.SELECTED.item = null;

    if (window.SELECTED.item2) {
        window.ITEMS_ADDED.remove(window.SELECTED.item2);
        window.SELECTED.item2 = null;
    }

    $(".menu").removeClass("menu-show");
})

export {
    raycastSelected
}