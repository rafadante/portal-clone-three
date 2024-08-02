import {
    Vector3,
    Quaternion,
    Object3D,
    MeshBasicMaterial,
    RectAreaLight,
    MeshStandardMaterial,
    PlaneGeometry,
    Mesh,
    PointLight
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
import { deletePortal } from '../portal/CreatePortal.js';
import {
    tweenCamera,
} from '../../Utils.js';
import { interactWithItem } from '../events/events.js';
import { respawn } from '../events/states.js';

function colliderItemManager() {

    //CORRIDOR ENTER COLLIDERS
    corridorColliderNames(GLOBALS.CORRIDOR_ENTER, false);

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

    addColliderDoorsDefault(GLOBALS.ENTER_DOOR);
    addColliderDoorsDefault(GLOBALS.EXIT_DOOR);
}

function addColliderDoorsDefault(obj) {
    var shape = new CANNON.Box(new CANNON.Vec3(2, 2, 0.01));
    var door = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: new CANNON.Material()
    });
    door.position.copy(obj.position);
    door.quaternion.copy(obj.quaternion);
    door.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    door.collisionFilterMask = GLOBALS.CGROUP_ALL;
    obj.body = door;
    GLOBALS.CANNON_WORLD.addBody(door);

    //ADD FIZZLER
    const geometry = new PlaneGeometry(2, 2);
    const plane = new Mesh(geometry, GLOBALS.MATERIAL_FIZZLER);
    plane.translateZ(-0.1)
    obj.add(plane);

    fizzlerTrigger(door)
}

function fizzlerTrigger(body) {
    body.addEventListener("collide", function (e) {

        if (e.target.collisionResponse == 1)
            return;

        if (e.body === GLOBALS.PLAYER) {
            deletePortal(0)
            deletePortal(1)
        } else if (e.body.name == "sphere" || e.body.name == "cube" || e.body.name == "radio" || e.body.name == "cube_2") {
            //CREATE A CLONE TO APPLY DISSOLVE SHADER
            const clone = GLOBALS.ITEMS_ADDED.getObjectByName(e.body.name).scene.clone();
            clone.position.set(e.body.position.x, e.body.position.y, e.body.position.z);
            clone.quaternion.copy(e.body.quaternion);
            clone.visible = true;

            if (GLOBALS.HOLDING_ITEM)
                interactWithItem()

            GLOBALS.UNIFORMS_DISSOLVER.diffuseMap.value = clone.material.map;
            clone.material = GLOBALS.MATERIAL_DISSOLVER;

            GLOBALS.SCENE.add(clone);

            var posClone = clone.position.clone();
            posClone.y += 2;

            GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value = posClone;

            var clone2 = clone.clone();
            clone2.position.y += 1;

            addPositionalAudio('audio-dissolve', clone, true, false, true, 8)

            tweenCamera(3000, GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value, clone.position)
            tweenCamera(3000, clone.position, clone2.position)

            //GLOBALS.MATERIAL_DISSOLVER

            setTimeout(() => {
                GLOBALS.SCENE.remove(clone);
                GLOBALS.SCENE_FPS.remove(clone.sound);
            }, 3000);

            respawn(e.body);
        }
    });
}

function addColliderItem(items, type, mass, offset) {

    var offset;

    for (var i = 0; i < items.length; i++) {
        if (items[i].length != 0) {

            let PHYSICS_MATERIAL = new CANNON.Material();
            PHYSICS_MATERIAL.friction = items[i].userData.friction; //0.01
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
                const mat3_ground = new CANNON.ContactMaterial(GLOBALS.PHYSICS_MATERIAL, PHYSICS_MATERIAL, { friction: 0.0, restitution: items[i].userData.restitution })
                GLOBALS.CANNON_WORLD.addContactMaterial(mat3_ground);
            } else if (type == "sphere") {
                var shape = new CANNON.Sphere(0.3);
                shape.height = 0.6;
                shape.width = 0.6;
                offset = 0.5;

                // Create contact material behaviour
                const mat3_ground = new CANNON.ContactMaterial(GLOBALS.PHYSICS_MATERIAL, PHYSICS_MATERIAL, { friction: 0.0, restitution: items[i].userData.restitution })
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
                    if (items[i].userData.hasDispenser) {

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

                if (type != "radio") {
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
                }


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

function corridorColliderNames(corridor, update) {

    for (var i = 0; i < GLOBALS.CORRIDOR_COLLIDERS.length; i++) {
        GLOBALS.CANNON_WORLD.removeBody(GLOBALS.CORRIDOR_COLLIDERS[i]);
    }

    GLOBALS.CORRIDOR_COLLIDERS = [];

    const cloneFloorMaterial = GLOBALS.MATERIAL_FLOOR_NON_PORTAL.clone();
    cloneFloorMaterial.side = 2;
    const cloneCeilingMaterial = GLOBALS.MATERIAL_FLOOR_NON_PORTAL.clone();
    cloneCeilingMaterial.side = 2;
    cloneCeilingMaterial.envMapIntensity = 0.35;
    cloneCeilingMaterial.roughness = 1;
    cloneCeilingMaterial.roughnessMap = null;
    const cloneWallMaterial = GLOBALS.MATERIAL_WALL_NON_PORTAL.clone();
    cloneWallMaterial.side = 2;

    corridor.traverse(child => {
        if (child.name.includes("collider")) {
            child.visible = false;
            addCollidersToCorridor(child)
        } else if (child.name.includes("floor")) {
            if (!update)
                child.material = cloneFloorMaterial;
        } else if (child.name.includes("ceiling")) {
            if (!update)
                child.material = cloneCeilingMaterial;
        } else if (child.name.includes("wall")) {
            if (!update)
                child.material = cloneWallMaterial;
        } else if (child.name.includes("emissive")) {
            if (!update) {
                child.material = new MeshBasicMaterial();

                const width = 1;
                const height = 1;
                const intensity = 50;
                const rectLight = new RectAreaLight(0xffffff, intensity, width, height);
                rectLight.rotation.x = Math.PI;
                rectLight.position.z = 0.01;
                child.add(rectLight);
                /*const light = new PointLight(0xffffff, 5, 10);
                light.translateZ(0.2)
                child.add(light);*/
            }
        } else if (child.name.includes("light")) {
            if (!update)
                child.material.envMapIntensity = 0.25;
        } else if (child.name.includes("Cylinder")) {
            if (!update)
                child.material = new MeshStandardMaterial();
        }
    });
}

function addCollidersToCorridor(mesh) {
    const result = threeToCannon(mesh, {
        type: ShapeType.BOX
    });

    var wall = new CANNON.Body({
        shape: result.shape,
        mass: 0,
        material: GLOBALS.PHYSICS_MATERIAL
    });

    const worldPos = new Vector3();
    mesh.getWorldPosition(worldPos);

    const worldQuat = new Quaternion();
    mesh.getWorldQuaternion(worldQuat);

    wall.position.copy(worldPos);
    wall.quaternion.copy(worldQuat);
    wall.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
    wall.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC
    GLOBALS.CANNON_WORLD.addBody(wall);
    GLOBALS.CORRIDOR_COLLIDERS.push(wall);

    if (mesh.name.includes("collider_door")) {
        GLOBALS.BODY_ELEVATOR = wall;
    }
}

export {
    colliderItemManager,
    colliderRoom,
    corridorColliderNames,
    fizzlerTrigger
}