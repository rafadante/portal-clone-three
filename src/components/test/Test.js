import * as THREE from 'three';
import $, { globalEval } from 'jquery';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import {
    animate
} from '../../Main.js';
import {
    GLOBALS
} from '../../Globals.js';
import { add } from 'three/examples/jsm/libs/tween.module.js';
import { newPortal, deletePortal } from '../portal/CreatePortal.js';
import { addRadioAudio, AUDIO } from '../audio/Audio.js';
import { func } from 'three/examples/jsm/nodes/Nodes.js';
import { stateDoor } from '../door/Door.js';

var totalBodies = 0;
var id = 0;

$("body").on('click', '#view-fps', function () {
    viewFPS();
})

function groupByPercentage(users, percentages) {
    // Get percentage for 1 user:
    let unit = 100 / users.length;
    // Sort percentages by decreasing remainder (modulo unit) 
    //   and get number of units covered by each percentage
    let sorted = percentages.map((p, i) => [i, Math.floor(p / unit), p % unit])
        .sort((a, b) => b[2] - a[2]);
    // Get how many units are not yet distributed:
    let remain = users.length - sorted.reduce((sum, a) => sum += a[1], 0);
    // Distribute those, giving priority to groups where the remainders are greatest
    for (let i = 0; i < remain; i++) sorted[i][1]++;
    // Build and return the chunks by filling the groups in their 
    //    original order
    let i = 0;
    return sorted.sort((a, b) => a[0] - b[0]).map(a => users.slice(i, i += a[1]));
}

function shuffle(array) {
    var array = array.slice(0);
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array
}

function viewFPS() {

    console.log(GLOBALS.SCENE_CHILDREN)

    GLOBALS.MAIN_CAMERA.near = 0.0095;
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();

    AUDIO.EDITOR.pause();
    var meshesWallPortal = [];
    var meshesWallNonPortal = [];
    var meshesFloorPortal = [];
    var meshesFloorNonPortal = [];
    var sideDown = [];
    var sideUp = [];
    var sideFront = [];
    var sideBack = [];
    var sideRight = [];
    var sideLeft = [];

    GLOBALS.SCENE_FPS = new THREE.Group();
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.SCENE_FPS);

    GLOBALS.ITEM_CUBE.visible = false;
    GLOBALS.SPOTLIGHT.intensity = 0;

    var obj = GLOBALS.ENTER_DOOR.clone();
    obj.translateZ(1);
    GLOBALS.PLAYER.spawnPosition = obj.position.clone();

    $("#loading-parent").css("opacity", 1)
    $("#loading-parent").css("pointer-events", "all")
    $("#container").css("filter", "blur(3px)")
    $(".img").addClass("image");
    GLOBALS.FLASH.visible = true;

    //ADD PORTAL AMBIENT AUDIO
    addRadioAudio('audio/portal_ambient_loop1.wav', GLOBALS.PORTAL_AUDIO, false);
    addRadioAudio('audio/portal_ambient_loop1.wav', GLOBALS.PORTAL_AUDIO, false);



    setTimeout(() => {

        GLOBALS.MATERIAL_TRACTOR_BEAM.depthWrite = false;
        GLOBALS.MATERIAL_TRACTOR_BEAM.side = 2;
        GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE.depthWrite = false;
        GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE.side = 2;

        GLOBALS.ENTER_DOOR.children[0].rotation.z += Math.PI;

        GLOBALS.RENDERER.setPixelRatio(window.devicePixelRatio * GLOBALS.PIXEL_RATIO);

        //if(localStorage.getItem("shadows-resolution-select"))
        //    $("#shadows-resolution-select").val(localStorage.getItem("shadows-resolution-select")).change();
        if (localStorage.getItem("option-stats"))
            $("#option-stats").prop('checked', localStorage.getItem("option-stats") == 'true');
        if (localStorage.getItem("fov-val-range"))
            $("#fov-val-range").val(localStorage.getItem("fov-val-range")).trigger("input");
        if (localStorage.getItem("mouse-val-range"))
            $("#mouse-val-range").val(localStorage.getItem("mouse-val-range")).trigger("input");
        if (localStorage.getItem("quality-select"))
            $("#quality-select").val(localStorage.getItem("quality-select")).change();

        //
        GLOBALS.EXIT_ROOM.visible = true;

        // DOORS SCALE
        GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").scale.set(1, 1, 1);
        GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").scale.set(1, 1, 1);
        GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").scale.set(1, 1, 1);
        GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").scale.set(1, 1, 1);
        //GLOBALS.ENTER_DOOR.rotation.y += Math.PI;

        //DOOR ENTER TRIGGER
        const cube = GLOBALS.ENTER_DOOR.cube.clone();

        var p = new THREE.Vector3();
        GLOBALS.ENTER_DOOR.cube.getWorldPosition(p);

        var r = new THREE.Quaternion();
        GLOBALS.ENTER_DOOR.cube.getWorldQuaternion(r);

        //GLOBALS.SCENE.add(cube);
        cube.position.copy(p);
        cube.quaternion.copy(r);

        var bb = new THREE.Box3(); // for re-use
        bb.setFromObject(cube);

        GLOBALS.ENTER_DOOR.box3 = bb;

        //----------------------------------------------

        GLOBALS.EXIT_DOOR.getObjectByName("warning").visible = false;

        setTimeout(() => {
            GLOBALS.MAIN_CAMERA.lookAt(GLOBALS.ENTER_DOOR.position);
            GLOBALS.PAUSED = false;
            setTimeout(() => {
                GLOBALS.PAUSED = true;
            }, 100);
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
                if (GLOBALS.PLANE_USER_DATA[i].name != GLOBALS.ENTER_DOOR.namePosition &&
                    GLOBALS.PLANE_USER_DATA[i].name != GLOBALS.EXIT_DOOR.namePosition) {

                    GLOBALS.PLANE_USER_DATA[i].checked = false;
                    GLOBALS.PLANE_USER_DATA[i].position.checked = false;

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
                        } else {
                            meshesWallPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                        }
                    } else {
                        if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                            meshesFloorNonPortal.push(GLOBALS.PLANE_USER_DATA[i])
                            sideUp.push(GLOBALS.PLANE_USER_DATA[i])
                        } else {
                            meshesWallNonPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                        }
                    }
                } else {
                    console.log("99999999999999")
                }
            }
        }

        // Floor
        /*const floorShape = new CANNON.Plane()
        const floorBody = new CANNON.Body({ mass: 0 })
        floorBody.addShape(floorShape)
        floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
        floorBody.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        floorBody.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC
        GLOBALS.CANNON_WORLD.addBody(floorBody)*/

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
        //--------------------------------------------------------------------------

        GLOBALS.SCENE_FPS.add(GLOBALS.GUN_CLONE);
        GLOBALS.SCENE_FPS.add(GLOBALS.GUN_CLONE2);

        GLOBALS.GUN.children[0].children[0].add(GLOBALS.LIGHTNIN_STRIKE_1,
            GLOBALS.LIGHTNIN_STRIKE_2, GLOBALS.LIGHTNIN_STRIKE_3);



        GLOBALS.GUN.visible = true;
        GLOBALS.GUN_SPHERE.material = GLOBALS.MATERIAL_GUN;
        GLOBALS.GUN_CYLINDER.material = GLOBALS.MATERIAL_GUN;

        //CORRIDOR ENTER COLLIDERS
        corridorColliderNames(true, GLOBALS.CORRIDOR_ENTER);


        GLOBALS.CORRIDOR_EXIT = GLOBALS.CORRIDOR_ENTER.clone();
        GLOBALS.EXIT_DOOR.add(GLOBALS.CORRIDOR_EXIT);
        GLOBALS.CORRIDOR_EXIT.translateY(-0.1)
        corridorColliderNames(false, GLOBALS.CORRIDOR_EXIT);

        /*var bb = new THREE.Box3(); // for re-use
        bb.setFromObject(GLOBALS.ELEVATOR_TRIGGER);
        GLOBALS.ELEVATOR_TRIGGER = bb;*/
        //
        var target = new THREE.Vector3(); // create once an reuse it
        GLOBALS.CORRIDOR_ENTER.getObjectByName("spawn").getWorldPosition(target);

        GLOBALS.PLAYER.position.copy(target)

        //GLOBALS.MAIN_CAMERA.rotation.x = 0;
        //GLOBALS.MAIN_CAMERA.rotation.y = GLOBALS.SCENE.getObjectByName("enterDoor").rotation.y + Math.PI;
        //GLOBALS.MAIN_CAMERA.rotation.z = 0;

        //
        let percentages = [5, 85, 5, 5];
        var arr = shuffle(meshesWallPortal);
        let result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_PORTAL);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_PORTAL2);
        createInstances(result[2], GLOBALS.MATERIAL_WALL_PORTAL3);
        createInstances(result[3], GLOBALS.MATERIAL_WALL_PORTAL4);
        //
        percentages = [50, 50];
        arr = shuffle(meshesWallNonPortal);
        result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_NON_PORTAL)
        createInstances(result[1], GLOBALS.MATERIAL_WALL_NON_PORTAL2)
        //
        createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL)
        createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL)

        //GLOBALS.SCENE_CHILDREN.remove(GLOBALS.ROOM);
        GLOBALS.RENDERER.renderLists.dispose();
        GLOBALS.ENTER_DOOR.children[1].visible = false;

        addColliderItem(GLOBALS.DYMANIC_ITEMS['cube'], "cube", 10)
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
        //

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
                GLOBALS.SCENE_FPS.add(plane);
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
                //GLOBALS.SCENE_FPS.add(rectLight);

                var lightEmissive = new THREE.Object3D();
                lightEmissive.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
                lightEmissive.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
                lightEmissive.updateMatrix();
                instanced.setMatrixAt(i, lightEmissive.matrix);
                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();

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

                GLOBALS.SCENE_FPS.add(spotLight);
                var lightHelper = new THREE.SpotLightHelper(spotLight);
                //GLOBALS.SCENE_FPS.add(lightHelper);

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
                //GLOBALS.SCENE_FPS.add(plane);
            }
        }

        //setTimeout(() => {
        window['createBlueGel']()
        window['createOrangeGel']()
        //}, 10000);




        var vec = new THREE.Vector3(0, 0, 0);
        var obj = new THREE.Object3D();

        /*setTimeout(() => {
            newPortal(0, 1, new THREE.Vector3(3, 1, 0), new THREE.Vector3(0, 0, 1), obj, new THREE.Vector3(0, 1, 0), vec)
            

            setTimeout(() => {

                newPortal(1, 0, new THREE.Vector3(5.6, 1, 0), new THREE.Vector3(0, 0, 1), obj, new THREE.Vector3(0, 1, 0), vec)
                GLOBALS.RENDERER.compile(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA)
                
                setTimeout(() => {
                    deletePortal(0);
                    deletePortal(1);
                    //GLOBALS.EXIT_ROOM.visible = false;
                    
                }, 5000);
            }, 5000);
            
        }, 5000);*/

        GLOBALS.EXIT_ROOM.visible = false;

        for (var i = GLOBALS.SCENE.children.length - 1; i >= 0; i--) {
            var obj = GLOBALS.SCENE.children[i];
            //GLOBALS.SCENE_CHILDREN.remove(obj); 
        }

        //GLOBALS.RENDERER.renderLists.dispose();
        GLOBALS.SCENE.background = new THREE.Color(0x000000);//0xff0000
        GLOBALS.FLASH.visible = false;

        if (GLOBALS.EXIT_DOOR.connections > 0)
            stateDoor(0, false, false, GLOBALS.EXIT_DOOR);
        else
            stateDoor(0, true, false, GLOBALS.EXIT_DOOR);
    }, 500);
};

function addColliderItem(items, type, mass, offset) {

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.4; //0.01
    PHYSICS_MATERIAL.restitution = 0; //0.1

    var offset;

    for (var i = 0; i < items.length; i++) {
        if (items[i].length != 0) {

            var pos = items[i].position;
            var rot = items[i].quaternion;

            if (type == "door") {

                //items[i].getObjectByName("circle_rotation").visible = false;

                //console.log(items[i])

                /*const result = threeToCannon(items[i].children[1].children[0], {
                    type: ShapeType.BOX
                });
                var shape = result.shape;*/

                var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.01));

                var vec = new THREE.Vector3();
                items[i].children[1].getWorldPosition(vec)
                var pos = vec;

                var vec = new THREE.Quaternion();
                items[i].children[1].getWorldQuaternion(vec)
                var rot = vec;
            } else if (type == "cube" || type == "laser_cube") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.3, 0.3, 0.3));
                shape.height = 0.6;
                shape.width = 0.6;
                offset = 0.5;
            } else if (type == "sphere") {
                var shape = new CANNON.Sphere(0.3);
                shape.height = 0.6;
                shape.width = 0.6;
                offset = 0.5;
            } else if (type == "gel_gun_blue" || type == "gel_gun_orange" || type == "gel_gun_white") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.1, 0.5, 0.1));
                items[i].position.y += 0.5;
            } else if (type == "pedestal_button") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.126, 0.35, 0.126));
                items[i].position.y += 0.35;
            } else if (type == "radio") {
                var shape = new CANNON.Box(new CANNON.Vec3(0.11, 0.07, 0.049));
                offset = 0.07;
                addRadioAudio('audio/radio.mp3', GLOBALS.RADIO_MUSIC, true)
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
                // PHYSICS_MATERIAL.friction = 0.3; //0.01
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

            console.log(box)


            //GLOBALS.PLANE_USER_DATA[items[i].planeInstancedId].state = box.state;

            box.updateMassProperties();

            if (mass > 0) {

                if ((type == "cube" || type == "laser_cube" || type == "sphere")) {
                    if (items[i].hasDispenser) {

                        box.mass = 0;
                        box.allowSleep = false;
                        box.position.copy(new THREE.Vector3(items[i].dispenserPosition.x,
                            items[i].dispenserPosition.y - 1,
                            items[i].dispenserPosition.z));
                        items[i].position.copy(box.position);

                        box.item = items[i];
                        GLOBALS.BOX_BODY.push(box);

                        console.log(items[i])
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
            GLOBALS.CANNON_BODIES.push(box)
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
    //mesh.frustumCulled = true;
    GLOBALS.SCENE_FPS.add(mesh);
    id++;

    var leftWindowObsRoom = new THREE.Object3D();
    leftWindowObsRoom.position.copy(GLOBALS.OBSERVATION_ROOM_IMG.position);
    leftWindowObsRoom.rotation.copy(GLOBALS.OBSERVATION_ROOM_IMG.rotation);
    GLOBALS.SCENE.add(leftWindowObsRoom)
    leftWindowObsRoom.translateX(-2);

    for (var i = 0; i < meshes.length; i++) {

        var dummy = new THREE.Object3D();

        if (meshes[i].itemName == "window" || (
            meshes[i].position.x == Math.round(leftWindowObsRoom.position.x) &&
            meshes[i].position.y == Math.round(leftWindowObsRoom.position.y) &&
            meshes[i].position.z == Math.round(leftWindowObsRoom.position.z)
        )) {
            dummy.scale.set(0, 0, 0);
            meshes[i].portal = false;
        }


        dummy.rotation.set(0, 0, 0);
        dummy.position.copy(meshes[i].position);
        dummy.rotation.copy(meshes[i].rotation);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
    }

    GLOBALS.SCENE.remove(leftWindowObsRoom)
}

var corridor_colliders = [];

function corridorColliderNames(first, corridor) {

    corridorCollider(corridor, "back", 1.5, 1.5, 0.001, true, first);
    corridorCollider(corridor, "down", 1, 0.001, 3.5, false, first);
    corridorCollider(corridor, "up", 1, 0.001, 3.5, false, first);
    corridorCollider(corridor, "left", 0.001, 1, 3.5, false, first);
    corridorCollider(corridor, "right", 0.001, 1, 3.5, false, first);
    corridorCollider(corridor, "front", 1, 1, 0.001, false, first);

    //if (!first)
    //    GLOBALS.WALL_CORRIDOR_ENTER.position.copy(GLOBALS.ENTER_DOOR.position);
}

function corridorCollider(parent, name, x, y, z, state, first) {
    var target = new THREE.Vector3(); // create once an reuse it
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

    var quat = new THREE.Quaternion();
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

function exitRoomCollider() {

    /*GLOBALS.WALL_CORRIDOR_BACK.visible = false;
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
        GLOBALS.CANNON_BODIES.push(wall)
    }*/
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
    GLOBALS.CANNON_BODIES.push(wall)
}

export {
    viewFPS,
    elevatorCollider,
    exitRoomCollider,
    corridorColliderNames
}