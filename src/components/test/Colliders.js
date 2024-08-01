import {
    Vector3,
    Quaternion,
    Object3D,
} from 'three';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import {
    GLOBALS
} from '../../Globals.js';
import { addPositionalAudio } from '../audio/Audio.js';

function colliderItemManager() {

    //CORRIDOR ENTER COLLIDERS
    corridorColliderNames(true, GLOBALS.CORRIDOR_ENTER);

    //
    addColliderItem(GLOBALS.DYMANIC_ITEMS['cube'], "cube", 10)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['cube_2'], "cube_2", 10)
    addColliderItem(GLOBALS.DYMANIC_ITEMS["sphere"], "sphere", 10)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_blue'], "gel_gun_blue", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_orange'], "gel_gun_orange", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_white'], "gel_gun_white", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['pedestal_button'], "pedestal_button", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['radio'], "radio", 10)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_weight'], "button_weight", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 1)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 2)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 3)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 4)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 1)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 2)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 3)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 4)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['ramp'], "ramp", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['ramp_half'], "ramp_half", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['ramp_half2'], "ramp_half2", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['stairs'], "stairs", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['laser_cube'], "laser_cube", 5)
    addColliderItem(GLOBALS.DOORS, "door", 0)
}

function addColliderItem(items, type, mass, offset) {

    var offset;

    for (var i = 0; i < items.length; i++) {
        if (items[i].length != 0) {

            let PHYSICS_MATERIAL = new CANNON.Material();
            PHYSICS_MATERIAL.friction = items[i].friction; //0.01
            //PHYSICS_MATERIAL.restitution = 0; //0.1

            var pos = items[i].position;
            var rot = items[i].quaternion;

            if (type == "door") {

                var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.01));

                var vec = new Vector3();
                items[i].children[1].getWorldPosition(vec)
                var pos = vec;

                var vec = new Quaternion();
                items[i].children[1].getWorldQuaternion(vec)
                var rot = vec;
            } else if (type == "cube" || type == "cube_2" || type == "laser_cube") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.3));
                shape.height = 0.6;
                shape.width = 0.6;
                offset = 0.5;

                // Create contact material behaviour
                const mat3_ground = new CANNON.ContactMaterial(GLOBALS.PHYSICS_MATERIAL, PHYSICS_MATERIAL, { friction: 0.0, restitution: items[i].restitution })
                GLOBALS.CANNON_WORLD.addContactMaterial(mat3_ground);
            } else if (type == "sphere") {
                var shape = new CANNON.Sphere(0.3);
                shape.height = 0.6;
                shape.width = 0.6;
                offset = 0.5;

                // Create contact material behaviour
                const mat3_ground = new CANNON.ContactMaterial(GLOBALS.PHYSICS_MATERIAL, PHYSICS_MATERIAL, { friction: 0.0, restitution: items[i].restitution })
                GLOBALS.CANNON_WORLD.addContactMaterial(mat3_ground);
            } else if (type == "gel_gun_blue" || type == "gel_gun_orange" || type == "gel_gun_white") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.5, 0.1));
            } else if (type == "pedestal_button") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.126, 0.35, 0.126));
                items[i].translateY(0.35)
            } else if (type == "radio") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.11, 0.07, 0.049));
                offset = 0.07;
            } else if (type == "button_weight") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.117, 0.5));
                items[i].translateY(0.117)
            } else if (type == "button_box" || type == "button_circle") {

                var a1, a2;

                if (type == "button_box") {
                    a1 = 0.45;
                    a2 = 0.9;
                } else if (type == "button_circle") {
                    a1 = 0.4;
                    a2 = 0.8;
                }

                if (offset == 1) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.14, 0.1));
                    items[i].translateY(0.14)
                    items[i].translateZ(a1)
                } else if (offset == 2) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.14, 0.1));
                    items[i].translateZ(-a2)
                } else if (offset == 3) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.14, 0.5));
                    items[i].translateZ(a1)
                    items[i].translateX(a1)
                } else if (offset == 4) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.14, 0.5));
                    items[i].translateX(-a2)
                }
            } else if (type == "dispenser") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.7, 0.77, 0.7));
                items[i].translateY(0.77)
            } else if (type == "ramp" || type == "ramp_half" || type == "ramp_half2" || type == "stairs") {
                const result = threeToCannon(GLOBALS.ITEMS_ADDED.getObjectByName(type), {
                    type: ShapeType.HULL
                });
                var shape = result.shape;
            }

            var box = new CANNON.Body({
                shape: shape,
                mass: mass,
                material: PHYSICS_MATERIAL
            })

            box.position.copy(pos);
            box.quaternion.copy(rot);
            box.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
            box.collisionFilterMask = GLOBALS.CGROUP_ALL
            items[i].body = box;
            box.state = items[i].state;
            box.updateMassProperties();

            if (type == "radio") {
                addPositionalAudio('audio-radio', box, true, true, false, 8)
            } else if (type == "door") {
                addPositionalAudio('audio-door', items[i], false, false, true, 8)
            }

            if (mass > 0) {

                if ((type == "cube" || type == "cube_2" || type == "laser_cube" || type == "sphere")) {
                    if (items[i].hasDispenser) {

                        box.mass = 0;
                        box.allowSleep = false;
                        box.position.copy(new Vector3(items[i].dispenserPosition.x,
                            items[i].dispenserPosition.y - 1,
                            items[i].dispenserPosition.z));
                        items[i].position.copy(box.position);

                        box.item = items[i];
                        GLOBALS.BOX_BODY.push(box);
                    } else {
                        box.allowSleep = true;
                    }
                }

                box.spawnPosition = items[i].position.clone();
                box.sleepSpeedLimit = 0.1;
                box.sleepTimeLimit = 2.0;
                GLOBALS.DYNAMIC_OBJECTS.push(box);
                box.gelJumping = false;
                box.waiting = false;
                box.offset = offset;
                box.arrayPos = [];
                box.arrayRot = [];
                box.name = type;

                const clone = GLOBALS.ITEMS_ADDED.getObjectByName(type).clone.clone();
                clone.visible = false;
                GLOBALS.SCENE_FPS.add(clone);
                box.clone = clone;

                addPositionalAudio('audio-impact', box, false, false, true, 8);

                box.addEventListener("collide", function (event) {
                    if (Math.abs(event.target.velocity.x) > 1.5 ||
                        Math.abs(event.target.velocity.y) > 1.5 ||
                        Math.abs(event.target.velocity.z) > 1.5) {
                        event.target.sound.position.copy(event.target.position)
                        //event.target.sound.audio.currentTime = 0;
                        event.target.sound.audio.play();
                    }
                });

                box.addEventListener("sleep", function (event) {
                    box.sleeping = true;
                });

                box.addEventListener('wakeup', (event) => {
                    box.sleeping = false;
                })
            } else {

            }

            GLOBALS.CANNON_WORLD.addBody(box);
            GLOBALS.CANNON_BODIES.push(box)
        }
    }
}

function colliderRoom(array, side, a1, a2, a3, a4) {

    //GROUP COLUMNS
    var colums = [];

    for (var i = 0; i < array.length; i++) {

        var z = array[i].position[a1];
        var row = [];

        for (var j = 0; j < array.length; j++) {
            if (!array[j].checked) {
                if (array[j].position[a1] == z) {
                    array[j].position.checked = false;
                    array[j].position.i = array[j].id_instanced;
                    row.push(array[j].position)
                    array[j].checked = true;
                }
            }
        }

        if (row.length > 0)
            colums.push(row.sort((a, b) => a[a2] - b[a2]))
    }

    //TRANSFORM COLUM ARRAY IN A MATRIX
    var columsNew = [];

    for (var i = 0; i < colums.length; i++) {

        columsNew.push([]);

        for (var j = 0; j < colums[i].length; j++) {

            var y = colums[i][j][a3];
            var row = [];

            for (var c = 0; c < colums[i].length; c++) {
                if (!colums[i][c].checked) {
                    if (colums[i][c][a3] == y) { //&& ((colums[i][c].x - 2) == row[row.length - 1].x)
                        if (row.length > 0) {
                            if (colums[i][c][a2] - 2 == row[row.length - 1][a2]) {
                                colums[i][c].checked = true;
                                row.push(colums[i][c])
                            }
                        } else {
                            colums[i][c].checked = true;
                            row.push(colums[i][c])
                        }
                    }
                }
            }

            if (row.length > 0)
                columsNew[i].push(row);
        }
    }

    for (var i = 0; i < columsNew.length; i++) {

        for (var j = 0; j < columsNew[i].length; j++) {

            var shapeDimension;

            if (side == "up" || side == "down")
                shapeDimension = new CANNON.Vec3(columsNew[i][j].length, 0.01, 1)
            else if (side == "front" || side == "back")
                shapeDimension = new CANNON.Vec3(columsNew[i][j].length, 1, 0.01)
            else if (side == "right" || side == "left")
                shapeDimension = new CANNON.Vec3(0.01, 1, columsNew[i][j].length)

            var shape = new CANNON.Box(shapeDimension);
            var box = new CANNON.Body({
                mass: 0,
                shape: shape,
                material: GLOBALS.PHYSICS_MATERIAL
            })

            var obj = new Object3D();
            obj.position.copy(new Vector3(columsNew[i][j][0].x,
                columsNew[i][j][0].y,
                columsNew[i][j][0].z));

            box.position.copy(obj.position);
            box.position[a4] += columsNew[i][j].length - 1;
            box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT;
            box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
            box.room = true;
            box.side = side;

            for (var c = 0; c < columsNew[i][j].length; c++)
                GLOBALS.PLANE_USER_DATA[columsNew[i][j][c].i].body = box;

            GLOBALS.CANNON_WORLD.addBody(box);
            GLOBALS.CANNON_BODIES.push(box);
        }
    }
}

var corridor_colliders = [];

function corridorColliderNames(first, corridor) {

    //corridorCollider(corridor, "back", 1.5, 1.5, 0.001, true, first);
    corridorCollider(corridor, "down", 1, 0.001, 3.5, false, first);
    //corridorCollider(corridor, "up", 1, 0.001, 3.5, false, first);
    //corridorCollider(corridor, "left", 0.001, 1, 3.5, false, first);
    //corridorCollider(corridor, "right", 0.001, 1, 3.5, false, first);
    //corridorCollider(corridor, "front", 1, 1, 0.001, false, first);

    //if (!first)
    //    GLOBALS.WALL_CORRIDOR_ENTER.position.copy(GLOBALS.ENTER_DOOR.position);
}

function corridorCollider(parent, name, x, y, z, state, first) {
    var target = new Vector3(); // create once an reuse it
    parent.getObjectByName(name).material.visible = state;
    parent.getObjectByName(name).getWorldPosition(target);

    var shape;

    const result = threeToCannon(parent.getObjectByName(name), {
        type: ShapeType.BOX
    });

    shape = result.shape;

    if (name == "front") {
        shape = new CANNON.Box(new CANNON.Vec3(1, 0.01, 1));
    }

    var wall = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: GLOBALS.PHYSICS_MATERIAL
    })

    wall.position.copy(target);

    var quat = new Quaternion();
    parent.getObjectByName(name).getWorldQuaternion(quat)

    wall.quaternion.copy(quat);
    wall.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
    wall.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC
    GLOBALS.CANNON_WORLD.addBody(wall);
    GLOBALS.CANNON_BODIES.push(wall)

    if (name == "front") {
        if (first) {
            GLOBALS.WALL_CORRIDOR_ENTER = wall;
        } else {
            GLOBALS.WALL_CORRIDOR_BACK = wall;
            GLOBALS.EXIT_DOOR.body = wall;
        }
    }

    corridor_colliders.push(wall)
}

export {
    colliderItemManager,
    colliderRoom
}