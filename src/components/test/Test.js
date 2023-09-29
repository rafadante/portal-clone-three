import * as THREE from '../../build/three.module.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import * as BufferGeometryUtils from '../../jsm/utils/BufferGeometryUtils.js';

var room2;
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

        room2 = window.ROOM.clone();
        var toDelete = [];
        window.ROOM.visible = false;
        window.MAIN_SCENE.add(room2);

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

        room2.traverse(child => {
            if (child.userData.hasItem && child.userData.itemName == "window") {
                nameWindow = child.name;
            }
        })

        var target = new THREE.Vector3(); // create once an reuse it
        window.side_window.getWorldPosition(target);
        room2.getObjectByName(target.x + "/" + target.y + "/" + target.z).getObjectByName(nameWindow).visible = false;

        //console.log(room2.getObjectByName(target.x + "/" + target.y + "/" + target.z).getObjectByName(nameWindow))

        //room2.remove(room2.getObjectByName(target.x + "/" + target.y + "/" + target.z));

        var bb = [];

        const matrix = new THREE.Matrix4();

        var sideUp = [];

        room2.traverse(child => {
            if (child.material) {
                if (child.userData.isCube && child.parent) {

                    if (child.parent && child.visible) {

                        if (child.name == "up" || child.name == "down" || child.name == "back" ||
                            child.name == "front" || child.name == "left" || child.name == "right") {
                            sideUp.push(child)
                        }

                        if (child.userData.portal) {

                            if (child.visible)
                                window.SURFACES_TO_PLACE_PORTAL.push(child);

                            if (child.userData.name == "up") {
                                child.material = window.materialFloorPortal;
                                meshesFloorPortal.push(child)
                            } else if (child.userData.name == "down") {
                                child.material = materialUpPortal;
                                meshesUpPortal.push(child)
                            } else {
                                child.material = window.materialWallPortal;
                                meshesWallPortal.push(child);
                            }
                        } else {
                            if (child.userData.name == "up") {
                                child.material = window.materialFloorNonPortal;
                                meshesFloorNonPortal.push(child)
                            } else if (child.userData.name == "down") {
                                child.material = materialUpNonPortal;
                                meshesUpNonPortal.push(child)
                            } else {
                                child.material = window.materialWallNonPortal;
                                meshesWallNonPortal.push(child);
                            }

                            window.nonPortal.push(child);
                        }

                        //child.updateMatrix(); // as needed
                        //bb.push(child);

                        var target = new THREE.Vector3();
                        child.getWorldPosition(target);

                        matrix.makeTranslation(
                            target.x,
                            target.y,
                            target.z
                        );

                        bb.push(child.geometry.clone().applyMatrix4(matrix));
                    }


                    if (child.visible == false || !child.parent)
                        toDelete.push(child);
                    else
                        window.cubes.push(child)
                }
            }

            if (child.userData.hasItem || child.name == "warning" || child.name == "spawn") {

                if (child.userData.itemName) {
                    if (!child.userData.itemName.includes("cube-") &&
                        !child.userData.itemName.includes("sphere-") &&
                        !child.userData.itemName.includes("pedestal_button-") &&
                        !child.userData.itemName.includes("button_circle-") &&
                        !child.userData.itemName.includes("button_box-") &&
                        !child.userData.itemName.includes("button_weight-") &&
                        !child.userData.itemName.includes("camera-") &&
                        !child.userData.itemName.includes("radio-"))
                        toDelete.push(child);
                } else {
                    toDelete.push(child);
                }

            }

            if (child.name.includes("side"))
                child.visible = false;

        });

        console.log(sideUp)

        //UP COLLIDERS
        for (var i = 0; i < sideUp.length; i++) {

            var mergedGroup = [];

            if (!sideUp[i].userData.merged && sideUp[i].visible && sideUp[i].userData.itemName != "enterDoor") {

                mergedGroup.push(sideUp[i])
                sideUp[i].userData.merged = true;

                for (var j = 0, o = 2; j < 100; j++, o += 2) {

                    if (sideUp[i].name == "left" || sideUp[i].name == "right") {
                        var neighbour = room2.getObjectByName(sideUp[i].parent.position.x + "/" +
                            sideUp[i].parent.position.y + "/" +
                            (sideUp[i].parent.position.z + o))
                    } else {
                        var neighbour = room2.getObjectByName((sideUp[i].parent.position.x + o) + "/" +
                            sideUp[i].parent.position.y + "/" +
                            sideUp[i].parent.position.z)
                    }

                    if (sideUp[i].name == "left" || sideUp[i].name == "right") {
                        var shape = new CANNON.Box(new CANNON.Vec3(0.001, 1, mergedGroup.length));
                    } else {
                        var shape = new CANNON.Box(new CANNON.Vec3(mergedGroup.length, 0.001, 1));
                    }

                    if (!neighbour) {

                        var box = new CANNON.Body({
                            mass: 0,
                            shape: shape,
                            material: window.PHYSICS_MATERIAL
                        })

                        var target = new THREE.Vector3();
                        sideUp[i].getWorldPosition(target);

                        box.position.copy(target);

                        if (sideUp[i].name == "left" || sideUp[i].name == "right")
                            box.position.z += mergedGroup.length - 1;
                        else
                            box.position.x += mergedGroup.length - 1;

                        if (sideUp[i].name == "back" || sideUp[i].name == "front")
                            box.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

                        window.CANNON_WORLD.addBody(box);

                        break;
                    } else {
                        if (neighbour.getObjectByName(sideUp[i].name).visible &&
                            neighbour.getObjectByName(sideUp[i].name).userData.itemName != "enterDoor") {
                            mergedGroup.push(neighbour.getObjectByName(sideUp[i].name))
                            neighbour.getObjectByName(sideUp[i].name).userData.merged = true;
                        } else {

                            var box = new CANNON.Body({
                                mass: 0,
                                shape: shape,
                                material: window.PHYSICS_MATERIAL
                            })

                            var target = new THREE.Vector3();
                            sideUp[i].getWorldPosition(target);

                            box.position.copy(target)
                            if (sideUp[i].name == "left" || sideUp[i].name == "right")
                                box.position.z += mergedGroup.length - 1;
                            else
                                box.position.x += mergedGroup.length - 1;

                            if (sideUp[i].name == "back" || sideUp[i].name == "front")
                                box.quaternion.setFromEuler(-Math.PI / 2, 0, 0);

                            window.CANNON_WORLD.addBody(box);
                            break;
                        }
                    }
                }
            }
        }

        window.horizontal = [];
        window.vertical = [];

        let PHYSICS_MATERIAL = new CANNON.Material();
        PHYSICS_MATERIAL.friction = 0.4; //0.01
        PHYSICS_MATERIAL.restitution = 0; //0.1

        window.MAIN_SCENE.traverse(child => {
            if (child.name.includes("observation_room")) {
                child.children[0].visible = false;
                child.children[1].visible = true;
            }

            if (child.name.includes("cube-")) {
                window.DISPENSER_COVERS.push(child.dispenser.getObjectByName("cover"))
                window.ITEM_BOXES.push(child);
            }

            if (child.name.includes("sphere-")) {
                window.DISPENSER_COVERS.push(child.dispenser.getObjectByName("cover"))
                window.ITEM_SPHERES.push(child);
            }

            if (child.name == "interactive") {
                window.INTERACTIVE.push(child);
            }

            if (child.name.includes("pedestal_button")) {

                const result = threeToCannon(child, {
                    type: ShapeType.BOX
                });

                var pedestal_button = new CANNON.Body({
                    mass: 0,
                    shape: result.shape,
                    material: window.PHYSICS_MATERIAL
                })

                var target = new THREE.Vector3();
                child.getWorldPosition(target);

                pedestal_button.position.copy(target);
                pedestal_button.position.y += result.shape.halfExtents.y;

                window.CANNON_WORLD.addBody(pedestal_button);
            }

            if (child.name.includes("coliider_button_circle")) {

                const result = threeToCannon(child, {
                    type: ShapeType.HULL
                });
                child.material.visible = false;

                var button_sphere = new CANNON.Body({
                    mass: 0,
                    shape: result.shape,
                    material: window.PHYSICS_MATERIAL
                })

                var target = new THREE.Vector3();
                child.getWorldPosition(target);
                button_sphere.position.copy(target);
                var target = new THREE.Quaternion();
                child.getWorldQuaternion(target);
                button_sphere.quaternion.copy(target);
                window.CANNON_WORLD.addBody(button_sphere);
            }

            if (child.name.includes("button_weight")) {
                const result = threeToCannon(child, {
                    type: ShapeType.HULL
                });

                var button_weight = new CANNON.Body({
                    mass: 0,
                    shape: result.shape,
                    material: window.PHYSICS_MATERIAL
                })

                var target = new THREE.Vector3();
                child.getWorldPosition(target);

                target.y += 0.1;

                button_weight.position.copy(target);
                //button_weight.position.y += result.shape.halfExtents.y;

                var euler = new THREE.Euler(Math.PI / 2, 0, 0);
                var quaternion = new THREE.Quaternion();
                quaternion.setFromEuler(euler);
                button_weight.quaternion.copy(quaternion);

                window.CANNON_WORLD.addBody(button_weight);
            }

            if (child.name.includes("camera")) {

                const result = threeToCannon(child, {
                    type: ShapeType.BOX
                });

                var body = new CANNON.Body({
                    mass: 0,
                    shape: result.shape,
                    material: window.PHYSICS_MATERIAL
                })

                var target = new THREE.Vector3();
                child.getWorldPosition(target);
                body.position.copy(target);
                var target = new THREE.Quaternion();
                child.getWorldQuaternion(target);
                body.quaternion.copy(target);
                body.position.y += 0.8;
                body.position.z += 0.2;
                window.CANNON_WORLD.addBody(body);
            }

            if (child.name == "horizontal") {
                window.horizontal.push(child)
            } else if (child.name == "vertical") {
                window.vertical.push(child)
            }

            if (child.name.includes("radio")) {

                const result = threeToCannon(child, {
                    type: ShapeType.BOX
                });

                var body = new CANNON.Body({
                    mass: 5,
                    shape: result.shape,
                    material: PHYSICS_MATERIAL
                })

                body.allowSleep = true;
                body.sleepSpeedLimit = 1.0;
                body.sleepTimeLimit = 1.0;

                var target = new THREE.Vector3();
                child.getWorldPosition(target);
                body.position.copy(target);
                var target = new THREE.Quaternion();
                child.getWorldQuaternion(target);
                body.quaternion.copy(target);

                child.body = body;
                window.ITEM_GENERAL.push(child);

                window.CANNON_WORLD.addBody(body);

                const listener = new THREE.AudioListener();
                window.MAIN_CAMERA.add(listener);

                var audioElement = new Audio('./assets/audio/fps/radio.mp3');
                audioElement.loop = true;
                audioElement.play();

                const positionalAudio = new THREE.PositionalAudio(listener);
                positionalAudio.setMediaElementSource(audioElement);
                positionalAudio.setRefDistance(0.1);
                positionalAudio.setDirectionalCone(180, 230, 0.1);

                child.add(positionalAudio);
            }

            if (child.name.includes("observation_room-")) {
                const result = threeToCannon(child, {
                    type: ShapeType.BOX
                });

                var OBSERVATION_ROOM = new CANNON.Body({
                    mass: 0,
                    shape: result.shape,
                    material: window.PHYSICS_MATERIAL
                })

                var target = child.clone();
                target.translateZ(-1);

                OBSERVATION_ROOM.position.copy(target.position);

                window.CANNON_WORLD.addBody(OBSERVATION_ROOM);
            }
        });

        room2.traverse(child => {
            if (child.material) {
                if (child.material.side == 1)
                    child.material.side = 2;
            }

            if (child.name == "corridorExit" || child.name == "corridorEnter") {
                //child.visible = true;
            }
        })

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
        for (var i = 0; i < window.cubes.length; i++) {

            var x = 1;
            var y = 1;
            var z = 0.001;

            window.cubes[i].material.side = 2;

            if (window.cubes[i].name == "up" || window.cubes[i].name == "down") {
                x = 1;
                y = 0.001;
                z = 1;
            } else if (window.cubes[i].name == "left" || window.cubes[i].name == "right") {
                x = 0.001;
                y = 1;
                z = 1;
            }

            const wall = new CANNON.Body({
                shape: new CANNON.Box(new CANNON.Vec3(x, y, z)),
                mass: 0,
                material: window.PHYSICS_MATERIAL
            })

            //wall.obj = window.cubes[i];

            var target = new THREE.Vector3(); // create once an reuse it
            window.cubes[i].getWorldPosition(target);
            wall.position.copy(target);

            //wall.allowSleep = true;
            //wall.sleepSpeedLimit = 1.0;
            //wall.sleepTimeLimit = 1.0;

            if (!target.equals(new THREE.Vector3(1, 0, 0)) && !target.equals(new THREE.Vector3(-1, 0, 0)) &&
                !target.equals(new THREE.Vector3(0, 1, 0)) && !target.equals(new THREE.Vector3(0, -1, 0)) &&
                !target.equals(new THREE.Vector3(0, 0, 1)) && !target.equals(new THREE.Vector3(0, 0, -1))) {
                //window.CANNON_WORLD.addBody(wall);
            } else {
                //var parent = window.cubes[i].parent;
                //parent.remove(window.cubes[i]);
                window.cubes[i].scale.set(0, 0, 0)
            }
        }

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

            /*box.addEventListener("sleepy", function (event) {
                console.log("The sphere is feeling sleepy...");
            });

            box.addEventListener("sleep", function (event) {
                console.log("The sphere fell asleep!");
            });*/

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

        createInstances(meshesWallPortal)
        createInstances(meshesWallNonPortal)
        createInstances(meshesFloorPortal)
        createInstances(meshesFloorNonPortal)
        createInstances(meshesUpPortal)
        createInstances(meshesUpNonPortal)


        window.MAIN_SCENE.remove(room2);
        window.MAIN_SCENE.remove(window.ROOM);

        window.RENDERER.renderLists.dispose();
        window.ENTER_DOOR.children[1].visible = false;

        console.log(window.MAIN_SCENE)
    }, 100);
});

var meshesWallPortal = [];
var meshesWallNonPortal = [];
var meshesFloorPortal = [];
var meshesFloorNonPortal = [];
var meshesUpPortal = [];
var meshesUpNonPortal = [];

var id = 0;

function createInstances(meshes) {

    if (meshes.length == 0)
        return;

    var mesh = new THREE.InstancedMesh(meshes[0].geometry.clone(), meshes[0].material, meshes.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.material.side = 0;
    mesh.name = "Instanced-" + id;
    window.MAIN_SCENE.add(mesh);

    id++;

    //window.csm.setupMaterial(mesh.material);

    var dummy = new THREE.Object3D();
    for (var i = 0; i < meshes.length; i++) {

        dummy.rotation.set(0, 0, 0);

        var target = new THREE.Vector3();
        meshes[i].getWorldPosition(target);
        dummy.position.copy(target);

        if (!target.equals(new THREE.Vector3(1, 0, 0)) && !target.equals(new THREE.Vector3(-1, 0, 0)) &&
            !target.equals(new THREE.Vector3(0, 1, 0)) && !target.equals(new THREE.Vector3(0, -1, 0)) &&
            !target.equals(new THREE.Vector3(0, 0, 1)) && !target.equals(new THREE.Vector3(0, 0, -1))) {

            if (meshes[i].name == "up" || meshes[i].name == "down")
                dummy.rotation.x = Math.PI;
            else if (meshes[i].name == "left")
                dummy.rotation.y = -Math.PI;
            else if (meshes[i].name == "back")
                dummy.rotation.y = Math.PI / 2;
            else if (meshes[i].name == "front")
                dummy.rotation.y = -Math.PI / 2;

            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix)
        }

        meshes[i].visible = false;
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
    window.MAIN_SCENE.remove(room2);
    window.ROOM.visible = true;
    window.GROUP_STRUCTURE.visible = false;
    window.CONTROLS.enabled = true;
    window.MAIN_SCENE.environment = window.ENV_MAP_FPS;
    window.LIGHT_GROUP.visible = false;

    $("#ui").css("display", "block");
    $(".img").removeClass("image");

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