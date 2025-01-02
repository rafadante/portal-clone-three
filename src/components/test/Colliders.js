import { Vector3, Quaternion, Object3D, MeshBasicMaterial, MeshStandardMaterial, SpotLight, Color } from 'three';
import * as CANNON from 'cannon';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import { GLOBALS } from '../../Globals.js';
import { addPositionalAudio } from '../audio/Audio.js';
import { deletePortal } from '../portal/CreatePortal.js';
import { tweenCamera, } from '../../Utils.js';
import { interactWithItem } from '../events/events.js';
import { respawn } from '../events/states.js';
import { addLaserToCube } from '../lasers/Laser.js';
import { addPelletBall, addPelletCatcher } from '../pellet/Pellet.js';
import { faithPlate } from '../faithPlate/FaithPlate.js';
import { gelTrigger } from '../gels/Gels.js';
import { stateDoor } from '../door/Door.js';

function colliderItemManager() {

    for (var i = 0; i < GLOBALS.GOO_PLANES.length; i++)
        GLOBALS.GOO_PLANES[i].item.visible = false;

    //CORRIDOR ENTER COLLIDERS
    corridorColliderNames(GLOBALS.CORRIDOR_ENTER, false);

    addColliderItem(GLOBALS.DYMANIC_ITEMS['dispenser'], "dispenser", 0, 1)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['dispenser'], "dispenser", 0, 2)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['dispenser'], "dispenser", 0, 3)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['dispenser'], "dispenser", 0, 4)

    addColliderItem(GLOBALS.DYMANIC_ITEMS['cube'], "cube", 5)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['cube_2'], "cube_2", 5)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['scale_cube'], "scale_cube", 5)
    addColliderItem(GLOBALS.DYMANIC_ITEMS["sphere"], "sphere", 5)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_blue'], "gel_gun_blue", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_orange'], "gel_gun_orange", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_white'], "gel_gun_white", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['pedestal_button'], "pedestal_button", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['radio'], "radio", 5)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_weight'], "button_weight", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 1)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 2)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 3)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_box'], "button_box", 0, 4)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_sphere'], "button_sphere", 0, 1)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_sphere'], "button_sphere", 0, 2)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_sphere'], "button_sphere", 0, 3)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['button_sphere'], "button_sphere", 0, 4)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['ramp'], "ramp", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['ramp_half'], "ramp_half", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['ramp_half2'], "ramp_half2", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['stairs'], "stairs", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['laser_cube'], "laser_cube", 5)
    addColliderItem(GLOBALS.DOORS, "door", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['pellet_launcher'], "pellet_launcher", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['pellet_catcher'], "pellet_catcher", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['faith_plate'], "faith_plate", 0)

    addColliderItem(GLOBALS.DYMANIC_ITEMS['bed'], "bed", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['toilet'], "toilet", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['trash'], "trash", 5)

    addColliderItem(GLOBALS.DYMANIC_ITEMS['desk'], "desk", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['cabinet'], "cabinet", 0)
    addColliderItem(GLOBALS.DYMANIC_ITEMS['sign'], "sign", 0)

    addColliderDoorsDefault(GLOBALS.ENTER_DOOR, "enter");
    addColliderDoorsDefault(GLOBALS.EXIT_DOOR, "exit");

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['angled_panel'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['angled_panel'][i].length != 0) {

            const panel = GLOBALS.DYMANIC_ITEMS['angled_panel'][i].getObjectByName("panel");
            GLOBALS.ANGLED_PANELS.push(panel);

            const cube = GLOBALS.DYMANIC_ITEMS['angled_panel'][i].getObjectByName("Cube");

            var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.1));
            var body = new CANNON.Body({
                shape: shape,
                mass: 0,
                material: new CANNON.Material()
            });

            body.name = "panel";
            body.panel = panel;

            var worldPos = new Vector3();
            cube.getWorldPosition(worldPos)
            body.position.copy(worldPos);

            var worldQua = new Quaternion();
            cube.getWorldQuaternion(worldQua)
            body.quaternion.copy(worldQua);

            body.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
            body.collisionFilterMask = GLOBALS.CGROUP_ALL;

            GLOBALS.CANNON_BODIES.push(body);
            GLOBALS.CANNON_WORLD.addBody(body);

            panel.body = body;
        }
    }
}

function addColliderDoorsDefault(obj, name) {
    var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.01));
    var door = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: new CANNON.Material()
    });
    door.name = name;
    GLOBALS.CANNON_BODIES.push(door);
    door.position.copy(obj.position);
    door.quaternion.copy(obj.quaternion);
    door.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    door.collisionFilterMask = GLOBALS.CGROUP_ALL;
    obj.body = door;
    GLOBALS.CANNON_BODIES.push(door);
    GLOBALS.CANNON_WORLD.addBody(door);

    var holder = new Object3D()
    holder.position.copy(obj.position)
    holder.quaternion.copy(obj.quaternion)
    holder.translateZ(-0.5)
    var fizzler = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: new CANNON.Material()
    });
    fizzler.name = name;
    GLOBALS.CANNON_BODIES.push(fizzler);
    fizzler.position.copy(holder.position);
    fizzler.quaternion.copy(holder.quaternion);
    fizzler.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    fizzler.collisionFilterMask = GLOBALS.CGROUP_ALL;
    fizzler.collisionResponse = 0;
    GLOBALS.CANNON_BODIES.push(fizzler);
    GLOBALS.CANNON_WORLD.addBody(fizzler);


    //ADD FIZZLER
    fizzlerTrigger(fizzler)
}

function fizzlerTrigger(body) {
    body.addEventListener("collide", function (e) {

        if (e.target.collisionResponse == 1)
            return;

        if (e.body === GLOBALS.PLAYER) {

            if (e.target.name == "exit" && !GLOBALS.EXIT_DOOR.finished) {
                GLOBALS.EXIT_DOOR.finished = true;
                stateDoor(0, false, false, GLOBALS.EXIT_DOOR);
            }

            deletePortal(0)
            deletePortal(1)
            GLOBALS.PORTAL_BOX = [];
        } else if (e.body.name == "sphere" || e.body.name == "cube" ||
            e.body.name == "radio" || e.body.name == "cube_2" || e.body.name == "laser_cube" ||
            e.body.name == "scale_cube") {
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

            addPositionalAudio('audio-dissolve', clone, true, false, true, 2, 'sound')

            tweenCamera(3000, GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value, clone.position)
            tweenCamera(3000, clone.position, clone2.position)

            //GLOBALS.MATERIAL_DISSOLVER

            setTimeout(() => {
                if (GLOBALS.SCENE_FPS) {
                    GLOBALS.SCENE.remove(clone);
                    GLOBALS.SCENE_FPS.remove(clone.sound);
                }
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

            var pos = items[i].position.clone();
            var rot = items[i].quaternion;

            var objHolder = new Object3D();
            objHolder.position.copy(pos);
            objHolder.quaternion.copy(rot);
            GLOBALS.SCENE.add(objHolder);

            if (type == "bed" || type == "toilet" || type == "desk" || type == "cabinet" || type == "sign") {
                var result = threeToCannon(GLOBALS.ITEMS_ADDED.getObjectByName(type), { type: ShapeType.HULL });
                var shape = result.shape;
            } else if (type == "trash") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.05, 0.09, 0.05));
                offset = 0.09;
            } else if (type == "door") {

                var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.01));

                var vec = new Vector3();
                items[i].children[1].getWorldPosition(vec)
                var pos = vec;
                objHolder.position.copy(pos);

                var vec = new Quaternion();
                items[i].children[1].getWorldQuaternion(vec)
                var rot = vec;
            } else if (type == "cube" || type == "cube_2" || type == "laser_cube" || type == "scale_cube") {
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
                objHolder.translateY(0.35)
            } else if (type == "radio") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.15, 0.07, 0.1));
                offset = 0.07;
            } else if (type == "button_weight") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.117, 0.5));
                objHolder.translateY(0.117)
            } else if (type == "button_box" || type == "button_sphere") {

                var a1, a2;

                if (type == "button_box") {
                    a1 = 0.45;
                    a2 = 0.9;
                } else if (type == "button_sphere") {
                    a1 = 0.4;
                    a2 = 0.8;
                }

                if (offset == 1) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.14, 0.1));
                    objHolder.translateY(0.14)
                    objHolder.translateZ(a1)
                } else if (offset == 2) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.14, 0.1));
                    objHolder.translateY(0.14)
                    objHolder.translateZ(-a1)
                } else if (offset == 3) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.14, 0.5));
                    objHolder.translateY(0.14)
                    objHolder.translateX(a1)
                } else if (offset == 4) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.14, 0.5));
                    objHolder.translateY(0.14)
                    objHolder.translateX(-a1)
                }
            } else if (type == "dispenser") {

                if (!items[i].userData.hasDispenser)
                    return;

                objHolder.position.copy(items[i].dispenserPosition);
                objHolder.rotation.set(0, 0, 0);

                if (offset == 1) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.7, 0.77, 0.01));
                    objHolder.translateZ(0.7)
                } else if (offset == 2) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.7, 0.77, 0.01));
                    objHolder.translateZ(-0.7)
                } else if (offset == 3) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.01, 0.77, 0.7));
                    objHolder.translateX(0.7)
                } else if (offset == 4) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.01, 0.77, 0.7));
                    objHolder.translateX(-0.7)
                }

                objHolder.translateY(-0.8)

            } else if (type == "ramp" || type == "ramp_half" || type == "ramp_half2" || type == "stairs") {
                const result = threeToCannon(GLOBALS.ITEMS_ADDED.getObjectByName(type), {
                    type: ShapeType.HULL
                });
                var shape = result.shape;
            } else if (type == "pellet_launcher") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.6, 0.3, 0.6));
                objHolder.translateY(0.3)

                addPelletBall(items[i]);
            } else if (type == "pellet_catcher") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.3, 0.5));
                objHolder.translateY(0.3);

                addPelletCatcher(items[i]);
            } else if (type == "faith_plate") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.1, 1));
            }

            var box = new CANNON.Body({
                shape: shape,
                mass: mass,
                material: PHYSICS_MATERIAL
            });

            box.position.copy(objHolder.position);
            box.quaternion.copy(rot);
            box.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
            box.collisionFilterMask = GLOBALS.CGROUP_ALL
            items[i].body = box;
            box.state = items[i].state;
            box.updateMassProperties();
            box.item = items[i];
            box.name = type;
            box.initialMass = mass;
            //box.invMass = 0.1;
            //box.invMassSolve = 0.1;

            GLOBALS.SCENE.remove(objHolder);

            if (type == "radio") {
                addPositionalAudio('audio-radio', box, true, true, false, 8, 'sound')
            } else if (type == "door") {
                addPositionalAudio('audio-door', items[i], false, false, true, 8, 'sound')
            } else if (type == "laser_cube") {
                addLaserToCube(box)
            }

            if (type == "faith_plate") {
                box.collisionResponse = 0;
                addPositionalAudio('faith_plate_hit', box, false, false, true, 12, 'sound')
            }

            if (mass > 0) {

                addPositionalAudio('audio-repulsion', box, false, false, true, 20, 'soundRepulsion');

                if ((type == "cube" || type == "cube_2" || type == "laser_cube" || type == "sphere" || type == "scale_cube")) {

                    if (items[i].userData.hasDispenser) {

                        box.mass = 0;
                        box.allowSleep = false;
                    } else {
                        box.allowSleep = true;
                    }

                    box.position.copy(new Vector3(items[i].dispenserPosition.x,
                        items[i].dispenserPosition.y - 1,
                        items[i].dispenserPosition.z));
                    items[i].position.copy(box.position);
                    GLOBALS.BOX_BODY.push(box);
                }

                box.spawnPosition = items[i].position.clone();
                box.sleepSpeedLimit = 0.1;
                box.sleepTimeLimit = 1.0;
                GLOBALS.DYNAMIC_OBJECTS.push(box);
                box.gelJumping = false;
                box.waiting = false;
                box.offset = offset;
                box.arrayPos = [];
                box.arrayRot = [];
                box.dynamic = true;
                box.playingAudioGel = false;

                const clone = GLOBALS.ITEMS_ADDED.getObjectByName(type).clone.clone();
                clone.visible = false;
                GLOBALS.SCENE_FPS.add(clone);
                box.clone = clone;

                if (type != "radio" && type != "trash") {
                    addPositionalAudio('audio-impact', box, false, false, true, 8, 'sound');
                }

                box.addEventListener("collide", function (event) {

                    event.body.looping = false;
                    event.body.looping2 = false;
                    event.body.centered = false;
                    event.body.centering = false;
                    event.body.heightDifference = null;

                    if (event.body.type != "blue") {
                        if (event.target.impactVelocity) {
                            clearTimeout(event.target.timeout);
                            event.target.timeout = setTimeout(() => {
                                event.target.impactVelocity = null;
                                event.target.impactSide = null;
                            }, 10);
                        }
                    }

                    if (event.body.type != "purple") {
                        if (event.target.customGravity) {
                            clearTimeout(event.target.timeout);
                            event.target.timeout = setTimeout(() => {
                                event.target.customGravity = null;
                                const index = GLOBALS.CUSTOM_GRAVITY.indexOf(event.target);
                                if (index > -1) {
                                    GLOBALS.CUSTOM_GRAVITY.splice(index, 1);

                                    // Velocity
                                    event.target.velocity.setZero();
                                    event.target.initVelocity.setZero();
                                    event.target.angularVelocity.setZero();
                                    event.target.initAngularVelocity.setZero();

                                    // Force
                                    event.target.force.setZero();
                                    event.target.torque.setZero();
                                }
                            }, 10);
                        }
                    }

                    if (event.body.name == "gel" && event.body.type == "blue") {

                        if (!event.target.playingAudioGel) {
                            event.target.playingAudioGel = true;
                            setTimeout(() => {
                                event.target.playingAudioGel = false;
                            }, 2000);
                        }


                        gelTrigger(event);

                        return;
                    }

                    if (event.body.name == "faith_plate") {
                        faithPlate(event.body, event.target)
                    }

                    if (event.target.name == "radio" || event.target.name == "trash")
                        return;

                    if ((Math.abs(event.target.velocity.x) > 1.5 ||
                        Math.abs(event.target.velocity.y) > 1.5 ||
                        Math.abs(event.target.velocity.z) > 1.5)) {
                        event.target.sound.position.copy(event.target.position)
                        //event.target.sound.audio.currentTime = 0;
                        event.target.sound.audio.play();
                    }
                });
                //}


                box.addEventListener("sleep", function (event) {
                    box.sleeping = true;

                    if (box.name == "laser_cube") {
                        //box.mass = 0;
                        //box.collisionResponse = 0;
                    }
                });

                box.addEventListener('wakeup', (event) => {
                    box.sleeping = false;
                })
            }

            GLOBALS.CANNON_WORLD.addBody(box);
            GLOBALS.CANNON_BODIES.push(box);
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

            var offsetX = 0;
            var offsetY = 0;
            var offsetZ = 0;

            if (side == "up") {
                offsetY = 0.04;
            } else if (side == "down") {
                offsetY = -0.04;
            } else if (side == "front") {
                offsetZ = -0.04;
            } else if (side == "back") {
                offsetZ = 0.04;
            }else if (side == "right") {
                offsetX = 0.04;
            } else if (side == "left") {
                offsetX = -0.04;
            }

            if (side == "up" || side == "down") {
                shapeDimension = new CANNON.Vec3(columsNew[i][j].length, 0.05, 1)
            } else if (side == "front" || side == "back") {
                shapeDimension = new CANNON.Vec3(columsNew[i][j].length, 1, 0.05)
            } else if (side == "right" || side == "left") {
                shapeDimension = new CANNON.Vec3(0.01, 1, columsNew[i][j].length)
            }

            var shape = new CANNON.Box(shapeDimension);
            var box = new CANNON.Body({
                mass: 0,
                shape: shape,
                material: GLOBALS.PHYSICS_MATERIAL
            })

            var obj = new Object3D();
            obj.position.copy(new Vector3(
                columsNew[i][j][0].x + offsetX,
                columsNew[i][j][0].y + offsetY,
                columsNew[i][j][0].z + offsetZ
            ));

            box.position.copy(obj.position);
            box.position[a4] += columsNew[i][j].length - 1;
            box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT;
            box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
            box.room = true;
            box.side = side;
            box.name = "wall";
            box.wallRotation = array[0].normal;

            for (var c = 0; c < columsNew[i][j].length; c++)
                GLOBALS.PLANE_USER_DATA[columsNew[i][j][c].i].body = box;

            GLOBALS.CANNON_WORLD.addBody(box);
            GLOBALS.CANNON_BODIES.push(box);
            GLOBALS.WALL_BODIES.push(box);
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
                child.material = new MeshBasicMaterial({
                    color: new Color(2, 2, 2)
                });

                if (child.children[0]) {
                    child.remove(child.children[0])
                }

                const light = new SpotLight(0xffffff, 20);
                light.angle = Math.PI / 2;
                light.penumbra = 1;
                light.decay = 1; //2
                light.distance = 6;
                light.position.set(0, 0.1, 0);
                light.name = "spot"
                child.add(light);
                window.worlPos = new Object3D();
                child.getWorldPosition(window.worlPos.position);
                GLOBALS.SCENE_FPS.add(window.worlPos)
                window.worlPos.position.y -= 4;
                light.target = window.worlPos;
            } else {
                child.getWorldPosition(window.worlPos.position);
                window.worlPos.position.y -= 4;
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
    GLOBALS.CANNON_BODIES.push(wall);
    const worldPos = new Vector3();
    mesh.getWorldPosition(worldPos);

    const worldQuat = new Quaternion();
    mesh.getWorldQuaternion(worldQuat);

    wall.position.copy(worldPos);
    wall.quaternion.copy(worldQuat);
    wall.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
    wall.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC
    GLOBALS.CANNON_WORLD.addBody(wall);
    GLOBALS.CANNON_BODIES.push(wall);
    GLOBALS.CORRIDOR_COLLIDERS.push(wall);

    if (mesh.name.includes("collider_door")) {
        GLOBALS.BODY_ELEVATOR = wall;
        wall.addEventListener("collide", function (event) {
            if (GLOBALS.LEVEL_ENTERED && GLOBALS.LOADED_LEVEL && !GLOBALS.FINISHED) {//

                GLOBALS.FINISHED = true;
                window.currentLevel++;

                if (!GLOBALS.MOBILE) {
                    //GLOBALS.POINTER_CONTROLS.unlock();
                    document.exitPointerLock();
                }

                document.getElementById("next-map").style.display = "flex";

                /*if (window.currentLevel == 7 || window.isCustom) {
                    document.getElementById("next-map-btn").style.display = "none";
                    document.getElementById("congrats").style.display = "block";

                }*/
            }
        })
    }
}

export {
    colliderItemManager,
    colliderRoom,
    corridorColliderNames,
    fizzlerTrigger
}