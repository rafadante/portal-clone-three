import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

function cubeState(button) {

    var toRemove = [];

    if (button == "plus") {
        //
        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            //
            window.SELECTED = window.CUBE_SELECTION_ARRAY[i].selected;
            var selectedName = window.SELECTED.name;
            //
            if (window.SELECTED && window.SELECTED.parent.position.y && !window.SELECTED.userData.blocked) {

                window.CUBE_SELECTION_ARRAY[i].translateZ(-1);

                var boxBehindPosition = new THREE.Vector3();
                boxBehindPosition.copy(window.CUBE_SELECTION_ARRAY[i].position);
                boxBehindPosition.round();

                var boxBehindName = boxBehindPosition.x + "/" + boxBehindPosition.y + "/" + boxBehindPosition.z;

                var box_behind = window.CUBES.getObjectByName(boxBehindName)

                window.CUBE_SELECTION_ARRAY[i].translateZ(4);

                var boxAheadPosition = new THREE.Vector3();
                boxAheadPosition.copy(window.CUBE_SELECTION_ARRAY[i].position);
                boxAheadPosition.round();

                var boxAheadName = boxAheadPosition.x + "/" + boxAheadPosition.y + "/" + boxAheadPosition.z;

                var box_a_head = window.CUBES.getObjectByName(boxAheadName)

                window.CUBE_SELECTION_ARRAY[i].translateZ(-1);

                if (box_a_head) {
                    //
                    console.log("1");
                    //
                    if (window.SELECTED.parent) {
                        //
                        cubeCheck(-1, window.CUBE_SELECTION_ARRAY[i].clone(), "plus")
                        //
                        if (!box_behind) {
                            //if()
                            window.CUBES.remove(window.SELECTED.parent);
                            //window.SELECTED.parent.visible = false;
                        }
                    }
                    //
                    window.CUBE_SELECTION_ARRAY[i].selected = box_a_head.getObjectByName(selectedName);
                    //
                } else {
                    //
                    console.log("2")
                    //
                    if (window.SELECTED.parent) {
                        //
                        var count = 0;

                        if (cubeUp(boxAheadPosition))
                            count++;

                        if (cubeDown(boxAheadPosition))
                            count++;

                        if (cubeLeft(boxAheadPosition))
                            count++;

                        if (cubeRight(boxAheadPosition))
                            count++;

                        if (cubeFront(boxAheadPosition))
                            count++;

                        if (cubeBack(boxAheadPosition))
                            count++;

                        if (count > 1) {
                            console.log("21")
                            window.CUBES.remove(window.SELECTED.parent);
                            cubeCheck(-1, window.CUBE_SELECTION_ARRAY[i].clone(), "plus");
                        } else {
                            console.log("22")
                            //
                            cubeCheck(-1, window.CUBE_SELECTION_ARRAY[i].clone(), "plus");
                            //
                            var opposite;
                            //
                            if (selectedName == "up")
                                opposite = "down";
                            else if (selectedName == "down")
                                opposite = "up";
                            else if (selectedName == "left")
                                opposite = "right";
                            else if (selectedName == "right")
                                opposite = "left";
                            else if (selectedName == "front")
                                opposite = "back";
                            else if (selectedName == "back")
                                opposite = "front";
                            //

                            console.log(opposite)

                            window.SELECTED.parent.traverse(child => {
                                if (child.material) {
                                    child.material = new THREE.MeshBasicMaterial();
                                    child.material.visible = false;
                                }
                            });

                            if (window.SELECTED.userData.portal)
                                window.SELECTED.parent.getObjectByName(opposite).material = window.MATERIAL_PORTAL_EDITOR_FLIPED;
                            else
                                window.SELECTED.parent.getObjectByName(opposite).material = window.MATERIAL_NON_PORTAL_EDITOR_FLIPED;

                            

                            

                            

                            //cubeCheck(-1, window.CUBE_SELECTION_ARRAY[i].clone(), "minus", window.SELECTED.parent)

                            window.SELECTED.parent.getObjectByName(opposite).userData.blocked = true;
                            window.SELECTED.parent.userData.blocked = true;

                            window.SELECTED.parent.getObjectByName(opposite).visible = true;
                            window.CUBE_SELECTION_ARRAY[i].selected = window.SELECTED.parent.getObjectByName(opposite);
                        }
                    }
                }
            } else {
                warning()
            }
        }
    } else if (button == "minus") {
        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            //
            window.SELECTED = window.CUBE_SELECTION_ARRAY[i].selected;
            var selectedName = window.SELECTED.name;
            //
            if (window.SELECTED.parent.position.y >= -31 &&
                (window.SELECTED.parent.position.z >= -31 &&
                    window.SELECTED.parent.position.z <= 43) &&
                (window.SELECTED.parent.position.x <= 45 &&
                    window.SELECTED.parent.position.x >= -29)) {


                if (window.SELECTED) {

                    window.CUBE_SELECTION_ARRAY[i].translateZ(-1);

                    var newBoxPosition = new THREE.Vector3();
                    newBoxPosition.copy(window.CUBE_SELECTION_ARRAY[i].position);
                    newBoxPosition.round();

                    var newBoxName = newBoxPosition.x + "/" + newBoxPosition.y + "/" + newBoxPosition.z;

                    var box_behind = window.CUBES.getObjectByName(newBoxName)

                    window.CUBE_SELECTION_ARRAY[i].translateZ(-1);

                    if (box_behind) {
                        //
                        console.log("3")

                        if (window.SELECTED.userData.blocked) {

                            if (window.SELECTED.userData.portal)
                                window.SELECTED.material = window.MATERIAL_PORTAL_EDITOR;
                            else
                                window.SELECTED.material = window.MATERIAL_NON_PORTAL_EDITOR;
                            //
                            window.SELECTED.userData.blocked = false;
                            window.SELECTED.parent.userData.blocked = false;

                            if (window.SELECTED.parent.userData.top)
                                window.SELECTED.visible = false;
                            //
                            if (selectedName == "up")
                                selectedName = "down";
                            else if (selectedName == "down")
                                selectedName = "up";
                            else if (selectedName == "left")
                                selectedName = "right";
                            else if (selectedName == "right")
                                selectedName = "left";
                            else if (selectedName == "front")
                                selectedName = "back";
                            else if (selectedName == "back")
                                selectedName = "front";
                        }
                        //
                        window.CUBE_SELECTION_ARRAY[i].selected = box_behind.getObjectByName(selectedName);
                        cubeCheck(1, window.CUBE_SELECTION_ARRAY[i].clone(), "minus", window.SELECTED.parent)
                        //
                    } else {

                        if (window.SELECTED.parent.userData.inverted) {

                            console.log("4")

                            window.SELECTED.visible = false;
                            //
                            window.CUBE_SELECTION_ARRAY[i].translateZ(1);

                            var newBoxPosition = new THREE.Vector3();
                            newBoxPosition.copy(window.CUBE_SELECTION_ARRAY[i].position);
                            newBoxPosition.round();

                            var newBoxName = newBoxPosition.x + "/" + newBoxPosition.y + "/" + newBoxPosition.z;

                            window.CUBE_SELECTION_ARRAY[i].translateZ(-1);
                            //
                            var newInvertedBox = window.INVERTED_CUBE.clone();
                            newInvertedBox.position.copy(newBoxPosition);
                            newInvertedBox.name = newBoxName;
                            newInvertedBox.userData.inverted = true;

                            if (newInvertedBox.position.y == 7) {
                                newInvertedBox.getObjectByName("down").visible = false
                            }

                            //
                            window.CUBES.add(newInvertedBox);
                            window.CUBE_SELECTION_ARRAY[i].selected = newInvertedBox.getObjectByName(selectedName);
                            window.CUBE_SELECTION_ARRAY[i].selected.userData.extrusion = false;
                            //
                            disableFace(selectedName, newInvertedBox);
                            addFaceToArray(newInvertedBox);
                            cubeCheck(1, window.CUBE_SELECTION_ARRAY[i].clone(), "minus", newInvertedBox)

                            if (!cubeUp(newInvertedBox.position))
                                newInvertedBox.getObjectByName("down").visible = true;

                            if (!cubeDown(newInvertedBox.position))
                                newInvertedBox.getObjectByName("up").visible = true;

                            if (!cubeLeft(newInvertedBox.position))
                                newInvertedBox.getObjectByName("right").visible = true;

                            if (!cubeRight(newInvertedBox.position))
                                newInvertedBox.getObjectByName("left").visible = true;

                            if (!cubeBack(newInvertedBox.position))
                                newInvertedBox.getObjectByName("front").visible = true;

                            if (!cubeFront(newInvertedBox.position))
                                newInvertedBox.getObjectByName("back").visible = true;

                            newInvertedBox.traverse(child => {
                                if (child.material) {
                                    child.userData.portal = window.STATE_PORTAL;

                                    if (window.STATE_PORTAL) {
                                        child.material = window.MATERIAL_PORTAL_EDITOR;
                                    } else {
                                        child.material = window.MATERIAL_NON_PORTAL_EDITOR;
                                    }
                                }
                            });


                            //IF WALL CONFLICTS WITH ANOTHER OPEN WALL
                            //window.CUBE_SELECTION_ARRAY[i].selected.visible = true;
                            if (!window.CUBE_SELECTION_ARRAY[i].selected.visible) {
                                toRemove.push(window.CUBE_SELECTION_ARRAY[i])
                                var parent = window.CUBE_SELECTION_ARRAY[i].parent;
                                if (parent)
                                    parent.remove(window.CUBE_SELECTION_ARRAY[i]);
                            }
                        }
                    }
                }
            } else {
                warning();
            }
        }
    }
    //REPOSITION SHADOW CONTACT PLANE
    var box = new THREE.Box3().setFromObject(window.CUBES);
    var obj_size = box.getSize(new THREE.Vector3(0, 0, 0));
    window.CONTACT_SHADOW_POSITION.position.y = -(obj_size.y - 7.9);
    //
    if (toRemove.length > 0)
        window.CUBE_SELECTION_ARRAY = [];

    removeFromArray()
}

function removeFromArray() {
    window.CUBES_EDIT = [];
    window.CUBES.traverse(child => {
        if (child.material) {
            if (child.visible == true) {
                window.CUBES_EDIT.push(child);
            }
        }
    });
}

function cubeUp(position) {
    var obj = new THREE.Object3D();
    //window.MAIN_SCENE.add(obj);
    obj.position.copy(position);
    obj.translateY(2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxUp = window.CUBES.getObjectByName(name);
    return boxUp;
}

function cubeDown(position) {
    var obj = new THREE.Object3D();
    //window.MAIN_SCENE.add(obj);
    obj.position.copy(position);
    obj.translateY(-2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxDown = window.CUBES.getObjectByName(name);
    return boxDown;
}

function cubeRight(position) {
    var obj = new THREE.Object3D();
    //window.MAIN_SCENE.add(obj);
    obj.position.copy(position);
    obj.translateX(-2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxRight = window.CUBES.getObjectByName(name);
    return boxRight;
}

function cubeLeft(position) {
    var obj = new THREE.Object3D();
    //(obj);
    obj.position.copy(position);
    obj.translateX(2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxLeft = window.CUBES.getObjectByName(name);
    return boxLeft;
}

function cubeBack(position) {
    var obj = new THREE.Object3D();
    //window.MAIN_SCENE.add(obj);
    obj.position.copy(position);
    obj.translateZ(2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxBack = window.CUBES.getObjectByName(name);
    return boxBack;
}

function cubeFront(position) {
    var obj = new THREE.Object3D();
    //window.MAIN_SCENE.add(obj);
    obj.position.copy(position);
    obj.translateZ(-2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxFront = window.CUBES.getObjectByName(name);
    return boxFront;
}

function cubeCheck(dirZ, clone, type, newInvertedBox) {

    var obj = new THREE.Object3D();
    //window.MAIN_SCENE.add(obj);

    clone.translateZ(dirZ);

    //CUBE UP
    obj.position.copy(clone.position);
    obj.translateY(2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxUp = window.CUBES.getObjectByName(name);
    if (boxUp) {
        if (type == "plus_minus" && !boxUp.parent.userData.blocked) {
            if (boxUp.userData.inverted) {
                boxUp.getObjectByName("up").visible = true;
                boxUp.getObjectByName("up").userData.portal = window.STATE_PORTAL;

                if (window.STATE_PORTAL) {
                    boxUp.getObjectByName("up").material = window.MATERIAL_PORTAL_EDITOR;
                } else {
                    boxUp.getObjectByName("up").material = window.MATERIAL_NON_PORTAL_EDITOR;
                }
            } else {
                newInvertedBox.getObjectByName("up").visible = false;
            }
        } else if (type == "plus" && boxUp.userData.inverted && !boxUp.parent.userData.blocked) {
            boxUp.getObjectByName("up").visible = true;
            boxUp.getObjectByName("up").userData.portal = window.STATE_PORTAL;

            if (window.STATE_PORTAL) {
                boxUp.getObjectByName("up").material = window.MATERIAL_PORTAL_EDITOR;
            } else {
                boxUp.getObjectByName("up").material = window.MATERIAL_NON_PORTAL_EDITOR;
            }

        } else {
            if (boxUp.userData.inverted) {
                boxUp.getObjectByName("up").visible = false;
                newInvertedBox.getObjectByName("down").visible = false;
            }
        }
    }

    //CUBE DOWN
    obj.position.copy(clone.position);
    obj.translateY(-2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxDown = window.CUBES.getObjectByName(name);
    if (boxDown) {
        if (type == "plus_minus" && !boxDown.parent.userData.blocked) {
            if (boxDown.userData.inverted) {
                boxDown.getObjectByName("down").visible = true;
                boxDown.getObjectByName("down").userData.portal = window.STATE_PORTAL;

                if (window.STATE_PORTAL) {
                    boxDown.getObjectByName("down").material = window.MATERIAL_PORTAL_EDITOR;
                } else {
                    boxDown.getObjectByName("down").material = window.MATERIAL_NON_PORTAL_EDITOR;
                }
            } else {
                newInvertedBox.getObjectByName("down").visible = false;
            }
        } else if (type == "plus" && boxDown.userData.inverted && !boxDown.parent.userData.blocked) {
            boxDown.getObjectByName("down").visible = true;
            boxDown.getObjectByName("down").userData.portal = window.STATE_PORTAL;

            if (window.STATE_PORTAL) {
                boxDown.getObjectByName("down").material = window.MATERIAL_PORTAL_EDITOR;
            } else {
                boxDown.getObjectByName("down").material = window.MATERIAL_NON_PORTAL_EDITOR;
            }
        } else {
            if (boxDown.userData.inverted) {
                boxDown.getObjectByName("down").visible = false;
                newInvertedBox.getObjectByName("up").visible = false;
            }
        }
    }

    //CUBE RIGHT
    obj.position.copy(clone.position);
    obj.translateX(-2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxRight = window.CUBES.getObjectByName(name);
    if (boxRight) {
        if (type == "plus_minus" && !boxRight.parent.userData.blocked) {
            if (boxRight.userData.inverted) {
                boxRight.getObjectByName("right").visible = true;
                boxRight.getObjectByName("right").userData.portal = window.STATE_PORTAL;

                if (window.STATE_PORTAL) {
                    boxRight.getObjectByName("right").material = window.MATERIAL_PORTAL_EDITOR;
                } else {
                    boxRight.getObjectByName("right").material = window.MATERIAL_NON_PORTAL_EDITOR;
                }
            } else {
                newInvertedBox.getObjectByName("right").visible = false;
            }
        } else if (type == "plus" && boxRight.userData.inverted && !boxRight.parent.userData.blocked) {
            boxRight.getObjectByName("right").visible = true;
            boxRight.getObjectByName("right").userData.portal = window.STATE_PORTAL;

            if (window.STATE_PORTAL) {
                boxRight.getObjectByName("right").material = window.MATERIAL_PORTAL_EDITOR;
            } else {
                boxRight.getObjectByName("right").material = window.MATERIAL_NON_PORTAL_EDITOR;
            }
        } else {
            if (boxRight.userData.inverted) {
                boxRight.getObjectByName("right").visible = false;
                newInvertedBox.getObjectByName("left").visible = false;
            }

        }
    }

    //CUBE LEFT
    obj.position.copy(clone.position);
    obj.translateX(2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxLeft = window.CUBES.getObjectByName(name);
    if (boxLeft) {
        if (type == "plus_minus" && !boxLeft.parent.userData.blocked) {
            if (boxLeft.userData.inverted) {
                boxLeft.getObjectByName("left").visible = true;
                boxLeft.getObjectByName("left").userData.portal = window.STATE_PORTAL;

                if (window.STATE_PORTAL) {
                    boxLeft.getObjectByName("left").material = window.MATERIAL_PORTAL_EDITOR;
                } else {
                    boxLeft.getObjectByName("left").material = window.MATERIAL_NON_PORTAL_EDITOR;
                }
            } else {
                newInvertedBox.getObjectByName("left").visible = false;
            }
        } else if (type == "plus" && boxLeft.userData.inverted && !boxLeft.parent.userData.blocked) {
            boxLeft.getObjectByName("left").visible = true;
            boxLeft.getObjectByName("left").userData.portal = window.STATE_PORTAL;

            if (window.STATE_PORTAL) {
                boxLeft.getObjectByName("left").material = window.MATERIAL_PORTAL_EDITOR;
            } else {
                boxLeft.getObjectByName("left").material = window.MATERIAL_NON_PORTAL_EDITOR;
            }
        } else {
            if (boxLeft.userData.inverted) {
                boxLeft.getObjectByName("left").visible = false;
                newInvertedBox.getObjectByName("right").visible = false;
            }
        }
    }

    //CUBE BACK
    obj.position.copy(clone.position);
    obj.translateZ(2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxBack = window.CUBES.getObjectByName(name);
    if (boxBack) {
        if (type == "plus_minus" && !boxBack.parent.userData.blocked) {
            if (boxBack.userData.inverted) {
                boxBack.getObjectByName("back").visible = true;
                boxBack.getObjectByName("back").userData.portal = window.STATE_PORTAL;

                if (window.STATE_PORTAL) {
                    boxBack.getObjectByName("back").material = window.MATERIAL_PORTAL_EDITOR;
                } else {
                    boxBack.getObjectByName("back").material = window.MATERIAL_NON_PORTAL_EDITOR;
                }
            } else {
                newInvertedBox.getObjectByName("back").visible = false;
            }
        } else if (type == "plus" && boxBack.userData.inverted && !boxBack.parent.userData.blocked) {
            boxBack.getObjectByName("back").visible = true;
            boxBack.getObjectByName("back").userData.portal = window.STATE_PORTAL;

            if (window.STATE_PORTAL) {
                boxBack.getObjectByName("back").material = window.MATERIAL_PORTAL_EDITOR;
            } else {
                boxBack.getObjectByName("back").material = window.MATERIAL_NON_PORTAL_EDITOR;
            }
        } else {
            if (boxBack.userData.inverted) {
                boxBack.getObjectByName("back").visible = false;
                newInvertedBox.getObjectByName("front").visible = false;
            }
        }
    } else {
        if (type == "plus") {

        }
    }

    //CUBE FRONT
    obj.position.copy(clone.position);
    obj.translateZ(-2);
    obj.position.round();
    var name = obj.position.x + "/" + obj.position.y + "/" + obj.position.z;
    var boxFront = window.CUBES.getObjectByName(name);
    if (boxFront) {
        if (type == "plus_minus" && !boxFront.parent.userData.blocked) {
            if (boxFront.userData.inverted) {
                boxFront.getObjectByName("front").visible = true;
                boxFront.getObjectByName("front").userData.portal = window.STATE_PORTAL;

                if (window.STATE_PORTAL) {
                    boxFront.getObjectByName("front").material = window.MATERIAL_PORTAL_EDITOR;
                } else {
                    boxFront.getObjectByName("front").material = window.MATERIAL_NON_PORTAL_EDITOR;
                }
            } else {
                newInvertedBox.getObjectByName("front").visible = false;
            }
        } else if (type == "plus" && boxFront.userData.inverted && !boxFront.parent.userData.blocked) {
            boxFront.getObjectByName("front").visible = true;
            boxFront.getObjectByName("front").userData.portal = window.STATE_PORTAL;

            if (window.STATE_PORTAL) {
                boxFront.getObjectByName("front").material = window.MATERIAL_PORTAL_EDITOR;
            } else {
                boxFront.getObjectByName("front").material = window.MATERIAL_NON_PORTAL_EDITOR;
            }
        } else {
            if (boxFront.userData.inverted) {
                boxFront.getObjectByName("front").visible = false;
                newInvertedBox.getObjectByName("back").visible = false;
            }
        }
    }
}

function addFaceToArray(box) {
    box.traverse(child => {
        child.userData.portal = window.SELECTED.userData.portal;

        if (child.material) {
            if (!child.userData.portal) {
                child.material = window.MATERIAL_NON_PORTAL_EDITOR;
            }
        }
    })
}

function disableFace(selectedName, box) {
    if (selectedName == "back") {
        box.getObjectByName("front").visible = false;
    } else if (selectedName == "front") {
        box.getObjectByName("back").visible = false;
    }

    if (selectedName == "up") {
        box.getObjectByName("down").visible = false;
    } else if (selectedName == "down") {
        box.getObjectByName("up").visible = false;
    }

    if (selectedName == "left") {
        box.getObjectByName("right").visible = false;
    } else if (selectedName == "right") {
        box.getObjectByName("left").visible = false;
    }
}

function warning() {
    $("#warning").css("opacity", 1);
    setTimeout(() => {
        $("#warning").css("opacity", 0);
    }, 3000);
}

function buildIniCubes(obj) {
    //GROUND
    buildLayer(-1, -1, 1, obj, 'x', 'z', 'y', 6, 8, "up");
    buildLayer(-1, -1, 3, obj, 'x', 'z', 'y', 6, 8, "up");
    buildLayer(-1, -1, 5, obj, 'x', 'z', 'y', 6, 8, "up");
    buildLayer(-1, -1, 7, obj, 'x', 'z', 'y', 6, 8, "up");

    //buildLayer(-1, -1, 9, obj, 'x', 'z', 'y', 10, 10, "up");
    //buildLayer(-1, -1, 11, obj, 'x', 'z', 'y', 10, 10, "up");
    //buildLayer(-1, -1, 13, obj, 'x', 'z', 'y', 10, 10, "up");
    //buildLayer(-1, -1, 15, obj, 'x', 'z', 'y', 10, 10, "up");
    //WALL BACK
    //buildLayer(-1, -1, -1, obj, 'x', 'y', 'z', 4, 8, "back");
    //WALL FRONT
    //buildLayer(-1, -1, 13, obj, 'x', 'y', 'z', 4, 8, "front");
    //WALL LEFT SIDE
    //buildLayer(-1, -1, 17, obj, 'z', 'y', 'x', 4, 6, "right");
    //WALL RIGHT SIDE
    //buildLayer(-1, -1, -1, obj, 'z', 'y', 'x', 4, 6, "left");
    //

    removeFromArray();
}

function buildLayer(x, y, z, obj, x2, y2, z2, height, width, side) {
    for (var i = 0; i < width; i++) {
        x += 2;
        for (var j = 0; j < height; j++) {
            y += 2;
            var clone = obj.clone();
            clone.position[x2] = x;
            clone.position[y2] = y;
            clone.position[z2] = z;
            clone.name = clone.position.x + "/" + clone.position.y + "/" + clone.position.z;
            clone.userData.iniPos = clone.position.clone();
            clone.userData.base = true;
            clone.userData.side = side;

            clone.traverse(child => {
                

                child.userData.inverted = true;
                child.userData.checks = 0;

                if(child.material){
                    child.material = window.MATERIAL_PORTAL_EDITOR;
                }

                if(child.name == "down"){
                    child.userData.portal = false;
                    child.material = window.MATERIAL_NON_PORTAL_EDITOR;
                }else if (side == "front") {
                    if (clone.position.x <= 5) {
                        child.userData.portal = false;
                        child.material = window.MATERIAL_NON_PORTAL_EDITOR;
                    } else {
                        child.userData.portal = true;
                    }
                } else if (side == "left") {
                    if (clone.position.z >= 7) {
                        child.userData.portal = false;
                        child.material = window.MATERIAL_NON_PORTAL_EDITOR;
                    } else {
                        child.userData.portal = true;
                    }
                } else if (side == "up") {
                    if (clone.position.x <= 5 && clone.position.z >= 7 && clone.position.y <= 5) {
                        child.userData.portal = false;
                        child.material = window.MATERIAL_NON_PORTAL_EDITOR;
                    } else if (clone.position.x >= 10 && clone.position.z <= 1 && clone.position.y <= 3) {
                        child.userData.portal = false;
                        child.material = window.MATERIAL_NON_PORTAL_EDITOR;
                    }else {
                        child.userData.portal = true;
                    }
                } else {
                    child.userData.portal = true;
                }

                if (child.material) {
                    child.userData.cloned = false;
                    //child.material.visible = false;
                }
            });

            if (z == 7) {
                //clone.getObjectByName("down").visible = false;
                clone.userData.top = true;
            }

            if (clone.position.equals(new THREE.Vector3(15, 7, 7))) {
                //clone.getObjectByName("right").visible = false;
                clone.getObjectByName("right").userData.hasItem = true;
                clone.getObjectByName("right").userData.itemName = "window";
            }else if (clone.position.equals(new THREE.Vector3(15, 7, 5))) {
                //clone.getObjectByName("right").visible = false;
            }

            if (clone.position.equals(new THREE.Vector3(13, 1, 1))) {
                clone.getObjectByName("back").userData.hasItem = true;
                clone.getObjectByName("back").userData.itemName = "exitDoor";
                clone.getObjectByName("back").userData.connection = true;
            } else if (clone.position.equals(new THREE.Vector3(3, 1, 11))) {
                clone.getObjectByName("front").userData.hasItem = true;
                clone.getObjectByName("front").userData.itemName = "enterDoor";
            }

            //clone.visible = false;

            window.CUBES.add(clone);
            //console.log(window.CUBES)
            cubeCheck(0, clone.clone(), "minus", clone);
        }
        y = -1;
    }

    window.RENDERER.renderLists.dispose();
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
    window.SELECTED.userData.portal = !window.SELECTED.userData.portal;
    for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
        window.CUBE_SELECTION_ARRAY[i].selected.userData.portal = window.SELECTED.userData.portal;
    }

    if (window.SELECTED.userData.portal) {
        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            window.CUBE_SELECTION_ARRAY[i].selected.material = window.MATERIAL_PORTAL_EDITOR;
        }
    } else {
        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            window.CUBE_SELECTION_ARRAY[i].selected.material = window.MATERIAL_NON_PORTAL_EDITOR;;
        }
    }
    document.querySelector('.menu').classList.remove('menu-show')
})

window.addEventListener("contextmenu", e => e.preventDefault());

export {
    buildIniCubes,
    cubeState
};