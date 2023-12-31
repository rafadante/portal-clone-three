import * as THREE from 'three';
import $ from 'jquery';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import {
    createLightBridges
} from '../continuous/Continuous.js';
import {
    animate
} from '../../Main.js';
import {
    newPortal,
    deletePortal
} from '../portal/CreatePortal.js';
import {
    GLOBALS
} from '../../Globals.js';

var totalBodies = 0;
var meshesWallPortal = [];
var meshesWallNonPortal = [];
var meshesFloorPortal = [];
var meshesFloorNonPortal = [];
var id = 0;

var sideDown = [];
var sideUp = [];
var sideFront = [];
var sideBack = [];
var sideRight = [];
var sideLeft = [];

$("body").on('click', '#view-fps', function () {
    viewFPS();
})

function viewFPS() {

    GLOBALS.ITEM_CUBE.visible = false;
    GLOBALS.SPOTLIGHT.intensity = 0;

    var obj = GLOBALS.ENTER_DOOR.clone();
    obj.translateZ(1);
    GLOBALS.PLAYER.spawnPosition = obj.position.clone();

    $("#loading-parent").css("opacity", 1)
    $("#loading-parent").css("pointer-events", "all")
    $("#container").css("filter", "blur(3px)")
    $(".img").addClass("image");

    setTimeout(() => {

        //
        GLOBALS.EXIT_ROOM.visible = true;

        // DOORS SCALE
        GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").scale.set(1, 1, 1);
        GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").scale.set(1, 1, 1);
        GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").scale.set(1, 1, 1);
        GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").scale.set(1, 1, 1);

        GLOBALS.EXIT_DOOR.getObjectByName("warning").visible = false;

        setTimeout(() => {
            //UI SETUP
            $("#ui").css("display", "none");
            $("#reticle").css("display", "flex");
            $("#blocker").css("display", "block");
            $("#blocker").css("pointer-events", "all");
            $("#loading-parent").css("opacity", 0)
            $("#loading-parent").css("pointer-events", "none")

            if (GLOBALS.MOBILE)
                $("#mobile-controls").css("display", "block");
        }, 5000);

        GLOBALS.CONTROLS.enabled = false;
        GLOBALS.ROOM.visible = false;

        //SEPARETE MESHS FOR INSTANCING
        for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
            if (GLOBALS.PLANE_USER_DATA[i].exists) {
                if (GLOBALS.PLANE_USER_DATA[i].itemName != "enterDoor" &&
                    GLOBALS.PLANE_USER_DATA[i].itemName != "exitDoor") {

                    if (GLOBALS.PLANE_USER_DATA[i].side == "front")
                        sideFront.push(GLOBALS.PLANE_USER_DATA[i])
                    else if (GLOBALS.PLANE_USER_DATA[i].side == "back")
                        sideBack.push(GLOBALS.PLANE_USER_DATA[i])
                    else if (GLOBALS.PLANE_USER_DATA[i].side == "right")
                        sideRight.push(GLOBALS.PLANE_USER_DATA[i])
                    else if (GLOBALS.PLANE_USER_DATA[i].side == "left")
                        sideLeft.push(GLOBALS.PLANE_USER_DATA[i])

                    if (GLOBALS.PLANE_USER_DATA[i].portal) {
                        if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                            sideUp.push(GLOBALS.PLANE_USER_DATA[i])
                            meshesFloorPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                        }  else {
                            meshesWallPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                        }
                    } else {
                        if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                            meshesFloorNonPortal.push(GLOBALS.PLANE_USER_DATA[i])
                            sideUp.push(GLOBALS.PLANE_USER_DATA[i])
                        }  else {
                            meshesWallNonPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                        }
                    }
                }
            }
        }

        colliderRoom(sideDown, "down", "z", "x", "y", "x");
        colliderRoom(sideUp, "up", "z", "x", "y", "x");
        colliderRoom(sideFront, "front", "y", "x", "z", "x");
        colliderRoom(sideBack, "back", "y", "x", "z", "x");
        colliderRoom(sideRight, "right", "y", "z", "x", "z");
        colliderRoom(sideLeft, "left", "y", "z", "x", "z");
        console.log("TOTAL BODIES COLLIDERS: " + totalBodies);

        GLOBALS.CORRIDOR_ENTER.visible = true;
        GLOBALS.SCENE.environment = null;
        GLOBALS.LIGHT_GROUP.visible = true;
        GLOBALS.STATS.container.style.display = "block";
        GLOBALS.OBSERVATION_ROOM.visible = true;
        GLOBALS.SCENE.getObjectByName("window").visible = false;
        //--------------------------------------------------------------------------
        GLOBALS.OBSERVATION_ROOM.position.copy(GLOBALS.OBSERVATION_ROOM_IMG.position);
        GLOBALS.OBSERVATION_ROOM.rotation.copy(GLOBALS.OBSERVATION_ROOM_IMG.rotation);
        //---------------------------------------------------------
        var target = new THREE.Vector3(); // create once an reuse it
        GLOBALS.OBSERVATION_ROOM.getObjectByName("room_light").getWorldPosition(target);

        GLOBALS.LIGHT_GROUP.getObjectByName("spotLightMain").position.copy(target);
        GLOBALS.LIGHT_GROUP.getObjectByName("spotLightMain").translateY(-1);
        GLOBALS.LIGHT_GROUP.getObjectByName("spotLightMain").translateX(-0.5);

        var target = new THREE.Vector3(); // create once an reuse it
        GLOBALS.OBSERVATION_ROOM_IMG.getObjectByName("target_light").getWorldPosition(target);

        var obj = new THREE.Object3D();
        obj.position.copy(target);
        GLOBALS.SCENE.add(obj);

        GLOBALS.LIGHT_GROUP.getObjectByName("spotLightMain").target = obj;
        GLOBALS.SCENE.add(GLOBALS.GUN);
        GLOBALS.GUN.children[0].add(GLOBALS.LIGHTNIN_STRIKE_1,
            GLOBALS.LIGHTNIN_STRIKE_2, GLOBALS.LIGHTNIN_STRIKE_3);
        GLOBALS.GUN.visible = true;
        GLOBALS.GUN_SPHERE.material = GLOBALS.MATERIAL_GUN;
        GLOBALS.GUN_CYLINDER.material = GLOBALS.MATERIAL_GUN;
        GLOBALS.MAIN_CAMERA.add(GLOBALS.GUN)

        //CORRIDOR ENTER COLLIDERS
        corridorColliderNames(true);

        var bb = new THREE.Box3(); // for re-use
        bb.setFromObject(GLOBALS.ELEVATOR_TRIGGER);
        GLOBALS.ELEVATOR_TRIGGER = bb;
        //
        var target = new THREE.Vector3(); // create once an reuse it
        GLOBALS.CORRIDOR_ENTER.getObjectByName("spawn").getWorldPosition(target);

        GLOBALS.PLAYER.position.copy(target)

        GLOBALS.MAIN_CAMERA.rotation.x = 0;
        GLOBALS.MAIN_CAMERA.rotation.y = GLOBALS.SCENE.getObjectByName("enterDoor").rotation.y + Math.PI;
        GLOBALS.MAIN_CAMERA.rotation.z = 0;

        //
        createInstances(meshesWallPortal, GLOBALS.MATERIAL_WALL_PORTAL)
        createInstances(meshesWallNonPortal, GLOBALS.MATERIAL_WALL_NON_PORTAL)
        createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL)
        createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL)

        GLOBALS.SCENE.remove(GLOBALS.ROOM);
        GLOBALS.RENDERER.renderLists.dispose();
        GLOBALS.ENTER_DOOR.children[1].visible = false;

        addColliderItem(GLOBALS.DYMANIC_ITEMS['cube'], "cube", 5)
        addColliderItem(GLOBALS.DYMANIC_ITEMS["sphere"], "sphere", 5)
        addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_blue'], "gel_gun_blue", 0)
        addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_orange'], "gel_gun_orange", 0)
        addColliderItem(GLOBALS.DYMANIC_ITEMS['gel_gun_white'], "gel_gun_white", 0)
        addColliderItem(GLOBALS.DYMANIC_ITEMS['pedestal_button'], "pedestal_button", 0)
        addColliderItem(GLOBALS.DYMANIC_ITEMS['radio'], "radio", 1)
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
        //
        createLightBridges('light_bridge', GLOBALS.LIGHT_BRIDGE_RAYCASTER);
        createLightBridges("tractor_beam", GLOBALS.TRACTOR_BEAM_RAYCASTER);
        createLightBridges("laser_emitter", GLOBALS.LASER_EMITTER_RAYCASTER);

        for (var s = 0; s < GLOBALS.DYMANIC_ITEMS["tractor_beam"].length; s++) {
            if (GLOBALS.DYMANIC_ITEMS["tractor_beam"][s].length != 0)
                GLOBALS.TRACTOR_BEAM_LENGTH++
        }

        for (var s = 0; s < GLOBALS.DYMANIC_ITEMS["laser_emitter"].length; s++) {
            if (GLOBALS.DYMANIC_ITEMS["laser_emitter"][s].length != 0)
                GLOBALS.LASER_EMITTER_LENGTH++
        }

        GLOBALS.SCENE.traverse(child => {
            child.frustumCulled = true;
        })

        GLOBALS.FPS_MODE = true;
        animate();

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("lightEmissive");
        instanced.material.emissive = new THREE.Color(0xffffff)
        instanced.material.emissiveIntensity = 100

        for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['stripe'].length; i++) {
            if (GLOBALS.DYMANIC_ITEMS['stripe'][i].id) {
                const geometry = new THREE.PlaneGeometry(1, 1);
                const material = new THREE.MeshStandardMaterial({
                    side: THREE.DoubleSide,
                    emissive: new THREE.Color(0xffffff),
                    emissiveIntensity: 100
                });
                const plane = new THREE.Mesh(geometry, material);
                plane.position.copy(GLOBALS.DYMANIC_ITEMS['stripe'][i].position);
                plane.rotation.copy(GLOBALS.DYMANIC_ITEMS['stripe'][i].rotation);
                plane.scale.set(0.2, 2, 2)
                plane.translateZ(0.025);
                GLOBALS.SCENE.add(plane);
            }
        }

        for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['light'].length; i++) {

            if (GLOBALS.DYMANIC_ITEMS['light'][i].id) {

                var planeInstanced = GLOBALS.PLANE_USER_DATA[GLOBALS.DYMANIC_ITEMS['light'][i].planeInstancedId];

                const rectLight = new THREE.RectAreaLight(0xffffff, 2, 5, 5);
                rectLight.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
                rectLight.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
                rectLight.translateZ(0.025);
                rectLight.rotation.x *= -1;
                rectLight.rotation.y *= -1;
                rectLight.rotation.z *= -1;
                //GLOBALS.SCENE.add(rectLight);

                var lightEmissive = new THREE.Object3D();
                lightEmissive.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
                lightEmissive.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
                lightEmissive.updateMatrix();
                instanced.setMatrixAt(i, lightEmissive.matrix);
                instanced.instanceMatrix.needsUpdate = true;

                //
                var spotLight = new THREE.SpotLight(0xffffff, 100);
                spotLight.distance = 0;
                spotLight.decay = 2;
                spotLight.penumbra = 1;
                spotLight.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
                spotLight.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
                spotLight.translateY(0.3);
                spotLight.angle = Math.PI / 2;
                //spotLight.rotation.x *= -1;
                //spotLight.rotation.y *= -1;
                //spotLight.rotation.z *= -1;
                //spotLight.castShadow = true;
                spotLight.shadow.mapSize.width = 1024;
                spotLight.shadow.mapSize.height = 1024;
                spotLight.shadow.camera.near = 1;
                spotLight.shadow.camera.far = 10;
                spotLight.shadow.focus = 1;

                var dir = new THREE.Vector3();
                GLOBALS.DYMANIC_ITEMS['light'][i].getWorldDirection(dir);

                spotLight.target.position.set(spotLight.position.x + (dir.x * 10),
                    spotLight.position.y + (dir.z * 10),
                    spotLight.position.z + (dir.y * 10));

                GLOBALS.SCENE.add(spotLight);
                var lightHelper = new THREE.SpotLightHelper(spotLight);
                //GLOBALS.SCENE.add(lightHelper);

                //
                const geometry = new THREE.PlaneGeometry(1, 1);
                const material = new THREE.MeshStandardMaterial({
                    side: THREE.DoubleSide,
                    emissive: new THREE.Color(0xffffff),
                    emissiveIntensity: 100
                });
                const plane = new THREE.Mesh(geometry, material);
                plane.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
                plane.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
                plane.scale.set(0.2, 2, 2)
                plane.translateZ(0.025);
                //plane.rotation.x *= -1;
                //plane.rotation.y *= -1;
                //plane.rotation.z *= -1;
                //GLOBALS.SCENE.add(plane);
            }
        }

        window['createBlueGel']()
        window['createOrangeGel']()


        var vec = new THREE.Vector3(0, 0, 0);
        var obj = new THREE.Object3D();

        setTimeout(() => {
            newPortal(0, 1, new THREE.Vector3(3, 1, 0), new THREE.Vector3(0, 0, 1), obj, new THREE.Vector3(0, 1, 0), vec)
            newPortal(1, 0, new THREE.Vector3(5.6, 1, 0), new THREE.Vector3(0, 0, 1), obj, new THREE.Vector3(0, 1, 0), vec)
            setTimeout(() => {
                deletePortal(0);
                deletePortal(1);
                GLOBALS.EXIT_ROOM.visible = false;
            }, 1000);
        }, 1000);


    }, 500);
};

function addColliderItem(items, type, mass, offset) {

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.4; //0.01
    PHYSICS_MATERIAL.restitution = 0; //0.1

    for (var i = 0; i < items.length; i++) {
        if (items[i].length != 0) {

            var pos = items[i].position;
            var rot = items[i].quaternion

            if (type == "door") {

                const result = threeToCannon(items[i].children[1], {
                    type: ShapeType.BOX
                });
                var shape = result.shape;


                var vec = new THREE.Vector3();
                items[i].children[1].getWorldPosition(vec)
                var pos = vec;

                var vec = new THREE.Quaternion();
                items[i].children[1].getWorldQuaternion(vec)
                var rot = vec;
            } else if (type == "cube" || type == "laser_cube")
                var shape = new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.3));
            else if (type == "sphere")
                var shape = new CANNON.Sphere(0.3);
            else if (type == "gel_gun_blue" || type == "gel_gun_orange" || type == "gel_gun_white") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.5, 0.1));
                items[i].position.y += 0.5;
            } else if (type == "pedestal_button") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.126, 0.35, 0.126));
                items[i].position.y += 0.35;
            } else if (type == "radio") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.11, 0.07, 0.049));
            } else if (type == "button_weight") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.117, 0.5));
                items[i].position.y += 0.117;
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
                    items[i].position.y += 0.14;
                    items[i].position.z += a1;
                } else if (offset == 2) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.14, 0.1));
                    items[i].position.z -= a2;
                } else if (offset == 3) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.14, 0.5));
                    items[i].position.z += a1;
                    items[i].position.x += a1;
                } else if (offset == 4) {
                    var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.14, 0.5));
                    items[i].position.x -= a2;
                }
            } else if (type == "dispenser") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.7, 0.77, 0.7));
                items[i].position.y += 0.77;
            } else if (type == "ramp" || type == "ramp_half" || type == "ramp_half2" || type == "stairs") {
                const result = threeToCannon(GLOBALS.ITEMS_ADDED.getObjectByName(type), {
                    type: ShapeType.HULL
                });
                var shape = result.shape;
                PHYSICS_MATERIAL.friction = 0.3; //0.01
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


            //GLOBALS.PLANE_USER_DATA[items[i].planeInstancedId].state = box.state;

            box.updateMassProperties()

            if (mass > 0) {



                if ((type == "cube" || type == "laser_cube" || type == "sphere") && items[i].hasDispenser) {

                    box.position.copy(new THREE.Vector3(items[i].dispenserPosition.x,
                        items[i].dispenserPosition.y - 1,
                        items[i].dispenserPosition.z));
                    items[i].position.copy(box.position)
                }

                box.spawnPosition = items[i].position.clone();
                box.allowSleep = true;
                box.sleepSpeedLimit = 1.0;
                box.sleepTimeLimit = 1.0;
                box.mass = 0;

                GLOBALS.DYNAMIC_OBJECTS.push(box);
                box.gelJumping = false;
                box.waiting = false;
                GLOBALS.BOX_BODY.push(box);

                box.arrayPos = [];
                box.arrayRot = [];
                box.recall = false;
                box.name = type;

                box.addEventListener("sleep", function (event) {
                    box.sleeping = true;
                });

                box.addEventListener('wakeup', (event) => {
                    box.sleeping = false;
                })
            } else {

            }

            GLOBALS.CANNON_WORLD.addBody(box);
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

            var obj = new THREE.Object3D();
            obj.position.copy(new THREE.Vector3(columsNew[i][j][0].x,
                columsNew[i][j][0].y,
                columsNew[i][j][0].z));

            box.position.copy(obj.position);
            box.position[a4] += columsNew[i][j].length - 1;
            box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
            box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC
            box.room = true;

            for (var c = 0; c < columsNew[i][j].length; c++)
                GLOBALS.PLANE_USER_DATA[columsNew[i][j][c].i].body = box;

            GLOBALS.CANNON_WORLD.addBody(box);
            totalBodies++;
        }
    }
}

function createInstances(meshes, material) {

    if (meshes.length == 0)
        return;

    const geometry = new THREE.PlaneGeometry(2, 2);
    var mesh = new THREE.InstancedMesh(geometry.clone(), material, meshes.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Instanced-" + id;
    mesh.frustumCulled = false;
    GLOBALS.SCENE.add(mesh);
    id++;

    for (var i = 0; i < meshes.length; i++) {

        var dummy = new THREE.Object3D();

        if (meshes[i].itemName == "window")
            dummy.scale.set(0, 0, 0);

        dummy.rotation.set(0, 0, 0);
        dummy.position.copy(meshes[i].position);
        dummy.rotation.copy(meshes[i].rotation);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
    }
}

var corridor_colliders = [];

function corridorColliderNames(first) {

    if (!first) {
        for (var i = 0; i < corridor_colliders.length; i++) {
            //GLOBALS.CANNON_WORLD.removeBody(corridor_colliders[i])
        }

        corridor_colliders = [];
    } else {
        corridorCollider(GLOBALS.CORRIDOR_ENTER, "back", 1.5, 1.5, 0.001, true);
    }

    corridorCollider(GLOBALS.CORRIDOR_ENTER, "down", 1, 0.001, 3.5, false);
    corridorCollider(GLOBALS.CORRIDOR_ENTER, "up", 1, 0.001, 3.5, false);
    corridorCollider(GLOBALS.CORRIDOR_ENTER, "left", 0.001, 1, 3.5, false);
    corridorCollider(GLOBALS.CORRIDOR_ENTER, "right", 0.001, 1, 3.5, false);
    corridorCollider(GLOBALS.CORRIDOR_ENTER, "front", 1, 1, 0.001, false);

    if (!first)
        GLOBALS.WALL_CORRIDOR_ENTER.position.y = 0;
}

function corridorCollider(parent, name, x, y, z, state) {
    var target = new THREE.Vector3(); // create once an reuse it
    parent.getObjectByName(name).material.visible = state;
    parent.getObjectByName(name).getWorldPosition(target);

    const result = threeToCannon(parent.getObjectByName(name), {
        type: ShapeType.BOX
    });

    var wall = new CANNON.Body({
        shape: result.shape,
        mass: 0,
        material: GLOBALS.PHYSICS_MATERIAL
    })

    wall.position.copy(target);

    var quat = new THREE.Quaternion();
    parent.getObjectByName(name).getWorldQuaternion(quat)

    wall.quaternion.copy(quat);
    wall.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
    wall.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC
    GLOBALS.CANNON_WORLD.addBody(wall);

    if (name == "front")
        GLOBALS.WALL_CORRIDOR_ENTER = wall;

    corridor_colliders.push(wall)
}

function exitRoomCollider() {

    GLOBALS.WALL_CORRIDOR_BACK.visible = false;
    var posExitRoom = new THREE.Vector3();
    GLOBALS.WALL_CORRIDOR_BACK.getWorldPosition(posExitRoom)
    GLOBALS.EXIT_ROOM.position.copy(posExitRoom)
    GLOBALS.EXIT_ROOM.position.y -= 1;


    for (var i = 0; i < GLOBALS.EXIT_ROOM_COLLIDERS.length; i++) {

        const result = threeToCannon(GLOBALS.EXIT_ROOM_COLLIDERS[i], {
            type: ShapeType.BOX
        });

        var wall = new CANNON.Body({
            shape: result.shape,
            mass: 0,
            material: GLOBALS.PHYSICS_MATERIAL
        })

        var pos = new THREE.Vector3();
        GLOBALS.EXIT_ROOM_COLLIDERS[i].getWorldPosition(pos);
        wall.position.copy(pos)

        var rot = new THREE.Quaternion();
        GLOBALS.EXIT_ROOM_COLLIDERS[i].getWorldQuaternion(rot);
        wall.quaternion.copy(rot)

        wall.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        wall.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC

        GLOBALS.CANNON_WORLD.addBody(wall);
    }
}

function elevatorCollider() {

    const result = threeToCannon(GLOBALS.ELEVATOR, {
        type: ShapeType.BOX
    });

    var wall = new CANNON.Body({
        shape: result.shape,
        mass: 0,
        material: GLOBALS.PHYSICS_MATERIAL
    })

    var pos = new THREE.Vector3();
    GLOBALS.ELEVATOR.getWorldPosition(pos);
    wall.position.copy(pos)

    var rot = new THREE.Quaternion();
    GLOBALS.ELEVATOR.getWorldQuaternion(rot);
    wall.quaternion.copy(rot)

    wall.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
    wall.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC

    GLOBALS.CANNON_WORLD.addBody(wall);
}

export {
    viewFPS,
    elevatorCollider,
    exitRoomCollider,
    corridorColliderNames
}