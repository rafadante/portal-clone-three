import * as THREE from '../../build/three.module.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import {
    createLightBridges
} from '../lightBridges/LightBridges.js';
//
window.raycastLightBridge = [];
window.raycastTractorBeam = [];
window.raycastLaserEmitter = [];
window.lightBridgesClone = [];
window.lightBridgesColliderClone = [];
window.portalShader = [];
window.beamLength = 0;
window.laserLength = 0;
//
var cubesDefault = [];
var totalBodies = 0;
var meshesWallPortal = [];
var meshesWallPortal2 = [];
var meshesWallPortal3 = [];
var meshesWallNonPortal = [];
var meshesWallNonPortal2 = [];
var meshesWallNonPortal3 = [];
var meshesFloorPortal = [];
var meshesFloorNonPortal = [];
var meshesUpPortal = [];
var meshesUpNonPortal = [];
var id = 0;

$("#arrow-menu").click(function () {
    if ($("#side-bar-left").css("left") == "0px") {
        $("#side-bar-left").css("left", "-300px");
        $("#arrow-menu i").addClass("fa-chevron-right")
        $("#arrow-menu i").removeClass("fa-chevron-left")
    } else {
        $("#side-bar-left").css("left", "0px");
        $("#arrow-menu i").removeClass("fa-chevron-right")
        $("#arrow-menu i").addClass("fa-chevron-left")
    }
});

$(".item").mouseenter(function () {
    $("#info-box").css("opacity", 1)
    $("#info-title").text($(this).data("title"))
    $("#info-content").text($(this).data("content"))
})

$(".item").mouseleave(function () {
    $("#info-box").css("opacity", 0)
})

$("body").on('click', '#view-fps', function () {

    window.ITEM_CUBE.visible = false;
    window.spotLight.intensity = 0;
    window.lightRoom.intensity = 0;

    $("#loading-parent").css("opacity", 1)
    $("#loading-parent").css("pointer-events", "all")
    $("#container").css("filter", "blur(3px)")

    $(".img").addClass("image");

    const groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        shape: new CANNON.Plane(),
        material: window.PHYSICS_MATERIAL
    })
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.collisionFilterGroup = window.CGROUP_ENVIRONMENT
    groundBody.collisionFilterMask = window.CGROUP_DYNAMIC
    //window.CANNON_WORLD.addBody(groundBody);

    setTimeout(() => {

        window.enter_door_right.scale.set(1, 1, 1);
        window.enter_door_left.scale.set(1, 1, 1);

        window.exit_door_right.scale.set(1, 1, 1);
        window.exit_door_left.scale.set(1, 1, 1);

        var obj = window.ENTER_DOOR.clone();
        obj.translateZ(1);
        window.SPAWN_POSITION = obj.position.clone();

        setTimeout(() => {
            window.debugCol = false;
            $("#loading-parent").css("opacity", 0)
            $("#loading-parent").css("pointer-events", "none")

            if (window.mobile)
                $("#mobile-controls").css("display", "block");
        }, 5000);

        for (var i = 0; i < cubesDefault.length; i++)
            cubesDefault[i].visible = true;

        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            var parent = window.CUBE_SELECTION_ARRAY[i].parent;
            if (parent)
                parent.remove(window.CUBE_SELECTION_ARRAY[i]);
        }

        window.CUBE_SELECTION_ARRAY = [];
        window.CONTROLS.enabled = false;
        $("#ui").css("display", "none");
        $("#reticle").css("display", "flex");
        $("#blocker").css("display", "block");
        $("#blocker").css("pointer-events", "all");

        window.ROOM.visible = false;

        //------------------------------------------------------------

        window.materialWallPortal.envMap = window.ENV_MAP_FPS;
        window.materialWallPortal.envMapIntensity = 0.2;

        window.materialWallPortal2.envMap = window.ENV_MAP_FPS;
        window.materialWallPortal2.envMapIntensity = 0.2;

        window.materialWallPortal3.envMap = window.ENV_MAP_FPS;
        window.materialWallPortal3.envMapIntensity = 0.2;

        window.materialWallNonPortal.envMap = window.ENV_MAP_FPS;
        window.materialWallNonPortal.envMapIntensity = 0.2;

        window.materialWallNonPortal2.envMap = window.ENV_MAP_FPS;
        window.materialWallNonPortal2.envMapIntensity = 0.2;

        window.materialWallNonPortal3.envMap = window.ENV_MAP_FPS;
        window.materialWallNonPortal3.envMapIntensity = 0.2;

        window.materialFloorPortal.envMap = window.ENV_MAP_FPS;
        window.materialFloorPortal.envMapIntensity = 0.2;

        window.materialFloorNonPortal.envMap = window.ENV_MAP_FPS;
        window.materialFloorNonPortal.envMapIntensity = 0.2;

        const materialUpPortal = window.materialFloorPortal.clone();
        materialUpPortal.envMapIntensity = 0.8;

        const materialUpNonPortal = window.materialFloorNonPortal.clone();
        materialUpNonPortal.envMapIntensity = 0.8;

        //-----------------------------------------------------------------

        window.nonPortal = [];
        window.cubes = [];
        var sideDown = [];
        var sideUp = [];
        var sideFront = [];
        var sideBack = [];
        var sideRight = [];
        var sideLeft = [];

        for (var i = 0; i < window.planeUserData.length; i++) {

            if (window.planeUserData[i].exists) {

                if (window.planeUserData[i].itemName != "enterDoor" &&
                    window.planeUserData[i].itemName != "exitDoor") {

                    if (window.planeUserData[i].side == "front")
                        sideFront.push(window.planeUserData[i])
                    else if (window.planeUserData[i].side == "back")
                        sideBack.push(window.planeUserData[i])
                    else if (window.planeUserData[i].side == "right")
                        sideRight.push(window.planeUserData[i])
                    else if (window.planeUserData[i].side == "left")
                        sideLeft.push(window.planeUserData[i])

                    if (window.planeUserData[i].portal) {
                        if (window.planeUserData[i].side == "up") {
                            meshesFloorPortal.push(window.planeUserData[i])
                            sideUp.push(window.planeUserData[i])
                        } else if (window.planeUserData[i].side == "down") {
                            meshesUpPortal.push(window.planeUserData[i])
                            sideDown.push(window.planeUserData[i])
                        } else {
                            if (window.planeUserData[i].tile == 1)
                                meshesWallPortal.push(window.planeUserData[i]);
                            else if (window.planeUserData[i].tile == 2)
                                meshesWallPortal2.push(window.planeUserData[i]);
                            else if (window.planeUserData[i].tile == 3)
                                meshesWallPortal3.push(window.planeUserData[i]);
                        }
                    } else {
                        if (window.planeUserData[i].side == "up") {
                            meshesFloorNonPortal.push(window.planeUserData[i])
                            sideUp.push(window.planeUserData[i])
                        } else if (window.planeUserData[i].side == "down") {
                            meshesUpNonPortal.push(window.planeUserData[i])
                            sideDown.push(window.planeUserData[i])
                        } else {
                            if (window.planeUserData[i].tile == 1)
                                meshesWallNonPortal.push(window.planeUserData[i]);
                            else if (window.planeUserData[i].tile == 2)
                                meshesWallNonPortal2.push(window.planeUserData[i]);
                            else if (window.planeUserData[i].tile == 3)
                                meshesWallNonPortal3.push(window.planeUserData[i]);
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

        let PHYSICS_MATERIAL = new CANNON.Material();
        PHYSICS_MATERIAL.friction = 0.4; //0.01
        PHYSICS_MATERIAL.restitution = 0; //0.1

        window.CORRIDOR_ENTER.visible = true;
        //window.CORRIDOR_EXIT.visible = true;
        window.FPS = true;
        window.MAIN_SCENE.environment = null;
        window.LIGHT_GROUP.visible = true;
        window.STATS.container.style.display = "block";
        window.OBSERVATION_ROOM.visible = true;
        window.MAIN_SCENE.getObjectByName("window").visible = false;
        //--------------------------------------------------------------------------
        window.OBSERVATION_ROOM.position.copy(window.OBSERVATION_ROOM_IMG.position);
        window.OBSERVATION_ROOM.rotation.copy(window.OBSERVATION_ROOM_IMG.rotation);
        //---------------------------------------------------------
        var target = new THREE.Vector3(); // create once an reuse it
        window.room_light.getWorldPosition(target);

        window.LIGHT_GROUP.getObjectByName("spotLightMain").position.copy(target);
        window.LIGHT_GROUP.getObjectByName("spotLightMain").translateY(-1);
        window.LIGHT_GROUP.getObjectByName("spotLightMain").translateX(-0.5);

        var target = new THREE.Vector3(); // create once an reuse it
        window.OBSERVATION_ROOM_IMG.getObjectByName("target_light").getWorldPosition(target);

        var obj = new THREE.Object3D();
        obj.position.copy(target);
        window.MAIN_SCENE.add(obj);

        window.LIGHT_GROUP.getObjectByName("spotLightMain").target = obj;
        window.MAIN_SCENE.add(window.GUN);
        window.GUN.children[0].add(window.lightningStrikeMesh, window.lightningStrikeMesh2, window.lightningStrikeMesh3);
        window.GUN.visible = true;
        window.GUN_SPHERE.material = window.materialGun;
        window.GUN_CYLINDER.material = window.materialGun;

        //CORRIDOR ENTER COLLIDERS
        corridorCollider(window.CORRIDOR_ENTER, "down", 1, 0.001, 3.5, false);
        corridorCollider(window.CORRIDOR_ENTER, "up", 1, 0.001, 3.5, false);
        corridorCollider(window.CORRIDOR_ENTER, "left", 0.001, 1, 3.5, false);
        corridorCollider(window.CORRIDOR_ENTER, "right", 0.001, 1, 3.5, false);
        corridorCollider(window.CORRIDOR_ENTER, "back", 1.5, 1.5, 0.001, true);
        corridorCollider(window.CORRIDOR_ENTER, "front", 1, 1, 0.001, false);
        //CORRIDOR EXIT COLLIDERS
        corridorCollider(window.CORRIDOR_EXIT, "down", 1, 0.001, 3.5, false);
        corridorCollider(window.CORRIDOR_EXIT, "up", 1, 0.001, 3.5, false);
        corridorCollider(window.CORRIDOR_EXIT, "left", 0.001, 1, 3.5, false);
        corridorCollider(window.CORRIDOR_EXIT, "right", 0.001, 1, 3.5, false);
        corridorCollider(window.CORRIDOR_EXIT, "back", 1.5, 1.5, 0.001, true);
        corridorCollider(window.CORRIDOR_EXIT, "front", 1, 1, 0.001, false);
        //
        var target = new THREE.Vector3(); // create once an reuse it
        window.CORRIDOR_ENTER.getObjectByName("spawn").getWorldPosition(target);

        window.PLAYER.position.copy(target)

        window.MAIN_CAMERA.rotation.x = 0;
        window.MAIN_CAMERA.rotation.y = window.MAIN_SCENE.getObjectByName("enterDoor").rotation.y + Math.PI;
        window.MAIN_CAMERA.rotation.z = 0;

        //
        createInstances(meshesWallPortal, window.materialWallPortal)
        createInstances(meshesWallPortal2, window.materialWallPortal2)
        createInstances(meshesWallPortal3, window.materialWallPortal3)

        createInstances(meshesWallNonPortal, window.materialWallNonPortal)
        createInstances(meshesWallNonPortal2, window.materialWallNonPortal2)
        createInstances(meshesWallNonPortal3, window.materialWallNonPortal3)

        createInstances(meshesFloorPortal, materialUpPortal)
        createInstances(meshesFloorNonPortal, materialUpNonPortal)
        createInstances(meshesUpPortal, window.materialFloorPortal)
        createInstances(meshesUpNonPortal, window.materialFloorNonPortal)

        window.MAIN_SCENE.remove(window.ROOM);
        window.RENDERER.renderLists.dispose();
        window.ENTER_DOOR.children[1].visible = false;

        addColliderItem(window.DYMANIC_ITEMS['cube'], "cube", 5)
        addColliderItem(window.DYMANIC_ITEMS["sphere"], "sphere", 5)
        addColliderItem(window.DYMANIC_ITEMS['gel_gun_blue'], "gel_gun_blue", 0)
        addColliderItem(window.DYMANIC_ITEMS['gel_gun_orange'], "gel_gun_orange", 0)
        addColliderItem(window.DYMANIC_ITEMS['gel_gun_white'], "gel_gun_white", 0)
        addColliderItem(window.DYMANIC_ITEMS['pedestal_button'], "pedestal_button", 0)
        addColliderItem(window.DYMANIC_ITEMS['radio'], "radio", 1)
        addColliderItem(window.DYMANIC_ITEMS['button_weight'], "button_weight", 0)

        addColliderItem(window.DYMANIC_ITEMS['button_box'], "button_box", 0, 1)
        addColliderItem(window.DYMANIC_ITEMS['button_box'], "button_box", 0, 2)
        addColliderItem(window.DYMANIC_ITEMS['button_box'], "button_box", 0, 3)
        addColliderItem(window.DYMANIC_ITEMS['button_box'], "button_box", 0, 4)

        addColliderItem(window.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 1)
        addColliderItem(window.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 2)
        addColliderItem(window.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 3)
        addColliderItem(window.DYMANIC_ITEMS['button_circle'], "button_circle", 0, 4)

        addColliderItem(window.DYMANIC_ITEMS['ramp'], "ramp", 0)
        addColliderItem(window.DYMANIC_ITEMS['ramp_half'], "ramp_half", 0)
        addColliderItem(window.DYMANIC_ITEMS['ramp_half2'], "ramp_half2", 0)
        //addColliderItem(window.DYMANIC_ITEMS['dispenser'], "dispenser", 0, 4)

        addColliderItem(window.DYMANIC_ITEMS['stairs'], "stairs", 0)
        addColliderItem(window.DYMANIC_ITEMS['laser_cube'], "laser_cube", 5)

        /*var items = Object.keys(window.DYMANIC_ITEMS);
        console.log(items)

        for (var i = 0; i < items.length; i++) {
            
            if (items[i] == "radio") {
                addColliderItem(window.DYMANIC_ITEMS[items[i]], items[i], 1)
            } else if (items[i] == "cube" || items[i] == "sphere") {
                console.log(items[i])
                //console.log(window.DYMANIC_ITEMS[items[i]])
                addColliderItem(window.DYMANIC_ITEMS[items[i].toString()], items[i].toString(), 5)
           } else if (items[i] == "button_box" || items[i] == "button_circle" || items[i] == "laser_cube") {
                for (var j = 1; j < 5; j++)
                    addColliderItem(window.DYMANIC_ITEMS[items[i]], items[i], 0, j)
            } else
                addColliderItem(window.DYMANIC_ITEMS[items[i]], items[i], 0)
        }*/

        createLightBridges('light_bridge', window.raycastLightBridge);
        createLightBridges("tractor_beam", window.raycastTractorBeam);
        createLightBridges("laser_emitter", window.raycastLaserEmitter);

        for (var s = 0; s < window.DYMANIC_ITEMS["tractor_beam"].length; s++) {
            if (window.DYMANIC_ITEMS["tractor_beam"][s].length != 0)
                window.beamLength++
        }

        for (var s = 0; s < window.DYMANIC_ITEMS["laser_emitter"].length; s++) {
            if (window.DYMANIC_ITEMS["laser_emitter"][s].length != 0)
                window.laserLength++
        }

        //window["POST"]();

        
        //window.ITEMS_ADDED.getObjectByName("ramp").material = window.materialFloorPortal;

        
        window.MAIN_SCENE.traverse(child => {
            child.frustumCulled = false;
        })
    }, 500);
});

function addColliderItem(items, type, mass, offset) {

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.4; //0.01
    PHYSICS_MATERIAL.restitution = 0; //0.1

    for (var i = 0; i < items.length; i++) {
        if (items[i].length != 0) {

            if (type == "cube" || type == "laser_cube")
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
                const result = threeToCannon(window.ITEMS_ADDED.getObjectByName(type), {
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

            box.position.copy(items[i].position);
            box.quaternion.copy(items[i].quaternion);
            box.collisionFilterGroup = window.CGROUP_DYNAMIC
            box.collisionFilterMask = window.CGROUP_ALL
            items[i].body = box;

            if (mass > 0) {
                box.allowSleep = true;
                box.sleepSpeedLimit = 1.0;
                box.sleepTimeLimit = 1.0;

                window.dynamicObjects.push(box);
                box.gelJumping = false;
                box.waiting = false;
                window.BOX_BODY.push(box);

                box.arrayPos = [];
                box.arrayRot = [];
                box.recall = false;
                box.name = type;

                box.addEventListener("sleep", function (event) {
                    //console.log("The sphere fell asleep!");
                    box.sleeping = true;
                    //console.log(box)
                });

                box.addEventListener('wakeup', (event) => {
                    //console.log('The sphere woke up!')
                    box.sleeping = false;
                })
            } else {
                window.CANNON_WORLD.addBody(box);
            }
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
                material: window.PHYSICS_MATERIAL
            })

            var obj = new THREE.Object3D();
            obj.position.copy(new THREE.Vector3(columsNew[i][j][0].x,
                columsNew[i][j][0].y,
                columsNew[i][j][0].z));

            box.position.copy(obj.position);
            box.position[a4] += columsNew[i][j].length - 1;
            box.collisionFilterGroup = window.CGROUP_ENVIRONMENT
            box.collisionFilterMask = window.CGROUP_DYNAMIC

            for (var c = 0; c < columsNew[i][j].length; c++)
                window.planeUserData[columsNew[i][j][c].i].body = box;

            window.CANNON_WORLD.addBody(box);
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
    window.MAIN_SCENE.add(mesh);
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
        material: window.PHYSICS_MATERIAL
    })

    wall.position.copy(target);

    var quat = new THREE.Quaternion();
    parent.getObjectByName(name).getWorldQuaternion(quat)

    wall.quaternion.copy(quat);
    wall.collisionFilterGroup = window.CGROUP_ENVIRONMENT
    wall.collisionFilterMask = window.CGROUP_DYNAMIC
    window.CANNON_WORLD.addBody(wall);

    if (name == "front" && parent == window.CORRIDOR_ENTER)
        window.wallCorridorEnter = wall;
    else if (name == "front" && parent == window.CORRIDOR_EXIT)
        window.wallCorridorExit = wall;
}