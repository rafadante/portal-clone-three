import * as THREE from '../../build/three.module.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';

var cubesDefault = [];
var totalBodies = 0;

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
                        } else
                            meshesWallPortal.push(window.planeUserData[i]);
                    } else {

                        if (window.planeUserData[i].side == "up") {
                            meshesFloorNonPortal.push(window.planeUserData[i])
                            sideUp.push(window.planeUserData[i])
                        } else if (window.planeUserData[i].side == "down") {
                            meshesUpNonPortal.push(window.planeUserData[i])
                            sideDown.push(window.planeUserData[i])
                        } else
                            meshesWallNonPortal.push(window.planeUserData[i]);
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

        //

        createInstances(meshesWallPortal, window.materialWallPortal)
        createInstances(meshesWallNonPortal, window.materialWallNonPortal)
        createInstances(meshesFloorPortal, materialUpPortal)
        createInstances(meshesFloorNonPortal, materialUpNonPortal)
        createInstances(meshesUpPortal, window.materialFloorPortal)
        createInstances(meshesUpNonPortal, window.materialFloorNonPortal)

        window.MAIN_SCENE.remove(window.ROOM);
        window.RENDERER.renderLists.dispose();
        window.ENTER_DOOR.children[1].visible = false;
    }, 500);
});

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

        if (row.length > 0) {
            colums.push(row.sort((a, b) => a[a2] - b[a2]))
        }
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

                            } else {
                                //break;
                            }

                        } else {
                            colums[i][c].checked = true;
                            row.push(colums[i][c])
                        }


                    } else {
                        //break;
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
                shapeDimension = new CANNON.Vec3(columsNew[i][j].length, 0.1, 1)
            else if (side == "front" || side == "back")
                shapeDimension = new CANNON.Vec3(columsNew[i][j].length, 1, 0.1)
            else if (side == "right" || side == "left")
                shapeDimension = new CANNON.Vec3(0.0001, 1, columsNew[i][j].length)

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

            for (var c = 0; c < columsNew[i][j].length; c++) {
                window.planeUserData[columsNew[i][j][c].i].body = box;
            }

            window.CANNON_WORLD.addBody(box);
            totalBodies++;

        }

    }

}

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
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Instanced-" + id;
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