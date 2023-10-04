import * as THREE from '../../build/three.module.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import * as BufferGeometryUtils from '../../jsm/utils/BufferGeometryUtils.js';

var cubesDefault = [];

/*$("#container img").attr("src", './assets/images/vig5.jpg');
$("#reticle-img ").attr("src", './assets/textures/crosshairNone.png');
$("#back-loading1").attr("src", './assets/loading/2.jpg');
$("#back-loading2").attr("src", './assets/loading/2.jpg');
$("#back-loading3").attr("src", './assets/loading/2.jpg');*/

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
//var singleGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries([geometry1, geometry2]);
var singleGeometry;

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
    //window.CANNON_WORLD.addBody(groundBody);

    setTimeout(() => {

        window.enter_door_right.scale.set(1, 1, 1);
        window.enter_door_left.scale.set(1, 1, 1);

        window.exit_door_right.scale.set(1, 1, 1);
        window.exit_door_left.scale.set(1, 1, 1);

        //window.EXIT_DOOR.visible = false;
        //window.ENTER_DOOR.visible = false;

        setTimeout(() => {
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

        var toDelete = [];
        window.ROOM.visible = false;

        window.materialWallPortal.envMap = window.ENV_MAP_FPS;
        window.materialWallPortal.envMapIntensity = 0.2;

        window.materialWallNonPortal.envMap = window.ENV_MAP_FPS;
        window.materialWallNonPortal.envMapIntensity = 0.2;

        window.materialFloorPortal.envMap = window.ENV_MAP_FPS;
        window.materialFloorPortal.envMapIntensity = 0.2;

        window.materialFloorNonPortal.envMap = window.ENV_MAP_FPS;
        window.materialFloorNonPortal.envMapIntensity = 0.2;

        const materialUpPortal = window.materialFloorPortal.clone();
        materialUpPortal.envMapIntensity = 0.8;

        const materialUpNonPortal = window.materialFloorNonPortal.clone();
        materialUpNonPortal.envMapIntensity = 0.8;

        var nameWindow;
        window.nonPortal = [];
        window.cubes = [];

        var bb = [];

        const matrix = new THREE.Matrix4();

        var sideUp = [];

        for (var i = 0; i < window.planeUserData.length; i++) {

            if (window.planeUserData[i].exists) {

                if (!window.planeUserData[i].hasItem &&
                    (window.planeUserData[i].itemName != "enterDoor" ||
                        window.planeUserData[i].itemName != "exitDoor" ||
                        window.planeUserData[i].itemName != "window")) {



                    if (window.planeUserData[i].portal) {

                        if (window.planeUserData[i].side == "up") {
                            meshesFloorPortal.push(window.planeUserData[i])
                        } else if (window.planeUserData[i].side == "down") {
                            meshesUpPortal.push(window.planeUserData[i])
                            sideUp.push(window.planeUserData[i])
                        } else {
                            meshesWallPortal.push(window.planeUserData[i]);
                        }

                    } else {

                        if (window.planeUserData[i].side == "up") {
                            meshesFloorNonPortal.push(window.planeUserData[i])
                        } else if (window.planeUserData[i].side == "down") {
                            meshesUpNonPortal.push(window.planeUserData[i])
                            sideUp.push(window.planeUserData[i])
                        } else {
                            meshesWallNonPortal.push(window.planeUserData[i]);
                        }

                    }
                }

            }

        }

        console.log(sideUp)
        //GROUP COLUMNS

        var colums = [];

        for (var i = 0; i < sideUp.length; i++) {

            var z = sideUp[i].position.z;
            var row = [];

            for (var j = 0; j < sideUp.length; j++) {

                if (!sideUp[j].checked) {

                    if (sideUp[j].position.z == z) {

                        sideUp[j].position.checked = false;
                        row.push(sideUp[j].position)
                        sideUp[j].checked = true;

                    }

                }

            }

            if (row.length > 0) {
                colums.push(row.sort((a, b) => a.x - b.x))
            }

        }

        //TRANSFORM COLUM ARRAY IN A MATRIX

        var columsNew = [];

        for (var i = 0; i < colums.length; i++) {

            columsNew.push([]);

            for (var j = 0; j < colums[i].length; j++) {

                var y = colums[i][j].y;
                var row = [];

                for (var c = 0; c < colums[i].length; c++) {

                    if (!colums[i][c].checked) {

                        if (colums[i][c].y == y) { //&& ((colums[i][c].x - 2) == row[row.length - 1].x)

                            if (row.length > 0) {

                                if (colums[i][c].x - 2 == row[row.length - 1].x) {

                                    colums[i][c].checked = true;
                                    row.push(colums[i][c])

                                }else{
                                    break;
                                }

                            } else {
                                colums[i][c].checked = true;
                                row.push(colums[i][c])
                            }


                        } else {
                            break;
                        }

                    }

                }

                if (row.length > 0)
                    columsNew[i].push(row);

            }

        }

        console.log(colums)
        console.log(columsNew)
        var totalBodies = 0;

        for (var i = 0; i < columsNew.length; i++) {

            for (var j = 0; j < columsNew[i].length; j++) {

                var shape = new CANNON.Box(new CANNON.Vec3(columsNew[i][j].length, 0.0001, 1));

                var box = new CANNON.Body({
                    mass: 0,
                    shape: shape,
                    material: window.PHYSICS_MATERIAL
                })

                var obj = new THREE.Object3D();
                obj.position.copy(new THREE.Vector3(columsNew[i][j][0].x,
                    columsNew[i][j][0].y,
                    columsNew[i][j][0].z));
                obj.translateY(10000);

                box.position.copy(obj.position);

                box.position.x += columsNew[i][j].length - 1;

                window.CANNON_WORLD.addBody(box);
                totalBodies++;

            }

        }

        console.log(totalBodies)

        //

        /*for (var i = 0; i < colums.length; i++) {

            var v = [];

            for(var j =0; j<colums[i].length; j++){
                v.push(colums[i][j].x)
            }

            xArray.push(v.sort())

        }*/

        //UP COLLIDERS
        /*for (var i = 0; i < sideUp.length; i++) {

            var mergedGroup = [];

            //console.log(sideUp[i].merged)

            if (!sideUp[i].merged && sideUp[i].itemName != "enterDoor") {

                mergedGroup.push(sideUp[i])
                sideUp[i].merged = true;

                for (var j = 0, o = 2; j < 100; j++, o += 2) {

                    if (sideUp[i].side == "left" || sideUp[i].side == "right") {
                        var neighbour = getPlaneByName(sideUp, sideUp[i].position.x + "/" +
                            sideUp[i].position.y + "/" +
                            (sideUp[i].position.z + o))
                    } else {
                        var neighbour = getPlaneByName(sideUp, (sideUp[i].position.x + o) + "/" +
                            sideUp[i].position.y + "/" +
                            sideUp[i].position.z)
                    }

                    if (sideUp[i].side == "left" || sideUp[i].side == "right") {
                        var shape = new CANNON.Box(new CANNON.Vec3(0.001, 1, mergedGroup.length));
                    } else {
                        var shape = new CANNON.Box(new CANNON.Vec3(mergedGroup.length, 0.001, 1));
                    }

                    //console.log(neighbour.length)

                    if (neighbour.length == 0) {

                        var box = new CANNON.Body({
                            mass: 0,
                            shape: shape,
                            material: window.PHYSICS_MATERIAL
                        })

                        var obj = new THREE.Object3D();
                        obj.position.copy(sideUp[i].position);
                        obj.translateY(10000)

                        box.position.copy(obj.position);

                        if (sideUp[i].side == "left" || sideUp[i].side == "right")
                            box.position.z += mergedGroup.length - 1;
                        else
                            box.position.x += mergedGroup.length - 1;

                        if (sideUp[i].side == "back" || sideUp[i].side == "front")
                            box.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

                        window.CANNON_WORLD.addBody(box);

                        console.log("ooooooooo")

                        break;
                    } else {

                        //console.log(neighbour)
                        mergedGroup.push(neighbour[0])
                        neighbour[0].merged = true;

                    }
                }

                //console.log(mergedGroup)
            }
        }*/

        window.horizontal = [];
        window.vertical = [];

        let PHYSICS_MATERIAL = new CANNON.Material();
        PHYSICS_MATERIAL.friction = 0.4; //0.01
        PHYSICS_MATERIAL.restitution = 0; //0.1

        window.CORRIDOR_ENTER.visible = true;
        //window.CORRIDOR_EXIT.visible = true;

        for (var i = 0; i < toDelete.length; i++) {
            var parent = toDelete[i].parent;
            if (parent)
                parent.remove(toDelete[i]);
        }

        window.FPS = true;

        window.MAIN_SCENE.environment = null;
        window.LIGHT_GROUP.visible = true;

        window.STATS.container.style.display = "block";

        window.OBSERVATION_ROOM.visible = true;
        window.MAIN_SCENE.getObjectByName("window").visible = false;

        //--------------------------------------------------------------------------

        window.OBSERVATION_ROOM.position.copy(window.OBSERVATION_ROOM_IMG.position);
        window.OBSERVATION_ROOM.rotation.copy(window.OBSERVATION_ROOM_IMG.rotation);

        const result = threeToCannon(window.OBSERVATION_ROOM, {
            type: ShapeType.BOX
        });

        var OBSERVATION_ROOM = new CANNON.Body({
            mass: 0,
            shape: new CANNON.Box(new CANNON.Vec3(2, 1, 2)),
            material: window.PHYSICS_MATERIAL
        })

        var target = window.OBSERVATION_ROOM.clone();
        target.translateZ(-2);
        target.translateY(1);

        OBSERVATION_ROOM.position.copy(target.position);

        var quat = new THREE.Quaternion();
        window.OBSERVATION_ROOM.getWorldQuaternion(quat);
        OBSERVATION_ROOM.quaternion.copy(quat)

        window.CANNON_WORLD.addBody(OBSERVATION_ROOM);

        //---------------------------------------------------------

        //
        var target = new THREE.Vector3(); // create once an reuse it
        window.room_light.getWorldPosition(target);


        console.log(window.room_light)

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

        console.log(window.GUN)

        /*mesh.renderOrder = zindex || 999;
        mesh.material.depthTest = false;
        mesh.material.depthWrite = false;
        mesh.onBeforeRender = function (renderer) {
            renderer.clearDepth();
        };*/

        //

        for (var i = 0; i < window.INTERACTIVE.length; i++) {
            window.cubes.push(window.INTERACTIVE[i])
        }

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

        //-----------------------------

        for (var i = 0; i < window.ITEM_BOXES.length; i++) {
            var box = new CANNON.Body({
                mass: 5,
                shape: new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.3)),
                material: PHYSICS_MATERIAL
            })

            box.allowSleep = true;
            box.sleepSpeedLimit = 1.0;
            box.sleepTimeLimit = 1.0;

            var axis = new CANNON.Vec3(1, 0, 0);
            var angle = Math.PI / 3;
            box.quaternion.setFromAxisAngle(axis, angle);

            window.ITEM_BOXES[i].position.copy(window.ITEM_BOXES[i].dispenser.position);
            window.ITEM_BOXES[i].translateY(-1);
            window.ITEM_BOXES[i].body = box;
            box.position.copy(window.ITEM_BOXES[i].position)
            window.BOX_BODY.push(box);

        }

        for (var i = 0; i < window.ITEM_SPHERES.length; i++) {
            var sphere = new CANNON.Body({
                mass: 5,
                shape: new CANNON.Sphere(0.3),
                material: PHYSICS_MATERIAL
            })

            sphere.allowSleep = true;
            sphere.sleepSpeedLimit = 1.0;
            sphere.sleepTimeLimit = 1.0;

            window.ITEM_SPHERES[i].position.copy(window.ITEM_SPHERES[i].dispenser.position);
            window.ITEM_SPHERES[i].translateY(-1);
            window.ITEM_SPHERES[i].body = sphere;
            sphere.position.copy(window.ITEM_SPHERES[i].position)
            window.SPHERE_BODY.push(sphere);
        }

        //-------------------------

        createInstances(meshesWallPortal, window.materialWallPortal)
        createInstances(meshesWallNonPortal, window.materialWallNonPortal)
        createInstances(meshesFloorPortal, window.materialFloorPortal)
        createInstances(meshesFloorNonPortal, window.materialFloorNonPortal)
        createInstances(meshesUpPortal, materialUpPortal)
        createInstances(meshesUpNonPortal, materialUpNonPortal)

        window.MAIN_SCENE.remove(window.ROOM);

        window.RENDERER.renderLists.dispose();
        window.ENTER_DOOR.children[1].visible = false;

        console.log(window.MAIN_SCENE)
    }, 500);
});

function getPlaneByName(array, name) {
    return array.filter(
        function (data) {
            return data.name == name
        }
    );
}

var meshesWallPortal = [];
var meshesWallNonPortal = [];
var meshesFloorPortal = [];
var meshesFloorNonPortal = [];
var meshesUpPortal = [];
var meshesUpNonPortal = [];

var id = 0;

function createInstances(meshes, material) {

    if (meshes.length == 0)
        return;

    const geometry = new THREE.PlaneGeometry(2, 2);
    var mesh = new THREE.InstancedMesh(geometry.clone(), material, meshes.length);
    mesh.position.y = 10000;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Instanced-" + id;
    window.MAIN_SCENE.add(mesh);

    id++;

    var dummy = new THREE.Object3D();
    for (var i = 0; i < meshes.length; i++) {

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

    window.CANNON_WORLD.addBody(wall);

    if (name == "front" && parent == window.CORRIDOR_ENTER)
        window.wallCorridorEnter = wall;
    else if (name == "front" && parent == window.CORRIDOR_EXIT)
        window.wallCorridorExit = wall;
}

$("body").on('click', '#back-editor', function () {

    window.STATS.container.style.display = "none";

    window.FPS = false;
    window.ROOM.visible = true;
    window.GROUP_STRUCTURE.visible = false;
    window.CONTROLS.enabled = true;
    window.MAIN_SCENE.environment = window.ENV_MAP_FPS;
    window.LIGHT_GROUP.visible = false;

    $("#ui").css("display", "block");
    $(".img").removeClass("image");
    $("#mobile-controls").css("display", "none");

    var bb = new THREE.Box3()
    bb.setFromObject(window.ROOM);
    bb.getCenter(window.CONTROLS.target);

    window.CONTROLS.target.set(window.CONTROLS.target.x + 0, window.CONTROLS.target.y + 0, window.CONTROLS.target.z + 0);
    window.MAIN_CAMERA.position.set(-4.2, 13, 22.5)
    window.CONTROLS.update();
    $("#blocker").css("display", "none");
    $("#blocker").css("pointer-events", "none");
    $("#reticle").css("display", "none");
    window.MAIN_CAMERA.remove(window.GUN);

    if (window.PORTALS.length == 1) {
        window.MAIN_SCENE.remove(window.PORTALS[0]);
    } else if (window.PORTALS.length == 2) {
        window.MAIN_SCENE.remove(window.PORTALS[1]);
        window.MAIN_SCENE.remove(window.PORTALS[0]);
    }
    window.PORTALS = [null, null];
});