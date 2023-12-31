import * as THREE from 'three';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import {
    buildIniCubes
} from '../cubeManager/CubeManager.js';
import {
    RectAreaLightHelper
} from 'three/addons/helpers/RectAreaLightHelper.js';
import $ from 'jquery';
import JSZipUtils from 'jszip-utils';
import {
    unzipSync,
    strFromU8
} from 'three/addons/libs/fflate.module.js';
import {
    animate
} from '../../Main.js';
import {
    loadLevelJSON
} from '../menuShader/MenuShader.js';
import {
    GLOBALS
} from '../../Globals.js';

async function handleZip(path, obj) {
    await JSZipUtils.getBinaryContent(path, function (err, data) {
        if (err) {
            throw err;
        }
        const zip = unzipSync(new Uint8Array(data));

        for (const path in zip) {

            const file = zip[path];
            var loader23 = new GLTFLoader();
            loader23.parse(file.buffer, '', function (result) {

                result.scene.traverse(child => {
                    child.frustumCulled = false;
                })

                if (obj == "loadButtonCube")
                    loadButtonCubeManager(result.scene)
                else if (obj == "loadButtonSphere")
                    loadButtonSphereManager(result.scene)
                else if (obj == "loadButtonWeight")
                    loadButtonWeightManager(result.scene)
                else if (obj == "loadPedestalButton")
                    loadPedestalButtonManager(result.scene)
                else if (obj == "loadCamera")
                    loadCameraManager(result.scene)
                else if (obj == "loadRadio")
                    loadRadioManager(result.scene)
                else if (obj == "loadCorridor")
                    loadCorridorEnter(result.scene)
                else if (obj == "loadExitDoor")
                    loadExitDoor(result.scene)
                else if (obj == "loadEnterDoor")
                    loadEnterDoor(result.scene)
                else if (obj == "loadDispenser")
                    loadDispenserManager(result.scene)
                else if (obj == "loadGun")
                    loadGunManager(result.scene)
                else if (obj == "loadPortalCube")
                    loadPortalCubeManager(result.scene)
                else if (obj == "loadPortalSphere")
                    loadPortalSphereManager(result.scene)
                else if (obj == "loadWindow")
                    loadWindowManager(result.scene)
                else if (obj == "loadWindowHalf")
                    loadWindowHalfManager(result.scene)
                else if (obj == "loadStairs")
                    loadStairsManager(result.scene)
                else if (obj == "loadLightBridge")
                    loadLightBridgeManager(result.scene)
                else if (obj == "loadTractorBeam")
                    loadTractorBeamManager(result.scene)
                else if (obj == "loadLaserEmitter")
                    loadLaserEmitterManager(result.scene)
                else if (obj == "loadLaserCube")
                    loadLaserCubeManager(result.scene)
                else if (obj == "loadFaithPlate")
                    loadFaithPlateManager(result.scene)
                else if (obj == "loadDoorNormal")
                    loadDoorNormalManager(result.scene)
                else if (obj == "loadLight")
                    loadLightManager(result.scene)
                else if (obj == "loadLightEmissive")
                    loadLightEmissiveManager(result.scene)
                else if (obj == "loadLightStripe")
                    loadLightStripeManager(result.scene)
                else if (obj == "loadGelBlue")
                    loadGelBlueManager(result.scene)
                else if (obj == "loadElevatorRoom")
                    loadElevatorRoomManager(result.scene)
                else if (obj == "loadGelOrange")
                    loadGelOrangeManager(result.scene)



            });
        }
    });
}

const manager = new THREE.LoadingManager();
const loader = new GLTFLoader(manager).setPath('./assets');

function loadCube() {

    var bb = new THREE.Box3()
    bb.setFromObject(GLOBALS.CUBES);
    bb.getCenter(GLOBALS.CONTROLS.target);

    GLOBALS.CONTROLS.target.set(GLOBALS.CONTROLS.target.x + 8, GLOBALS.CONTROLS.target.y + 2, GLOBALS.CONTROLS.target.z + 6);
    GLOBALS.MAIN_CAMERA.position.set(-12.2, 17.4, 26.3)
    GLOBALS.CONTROLS.update();

    buildIniCubes();
    loadWindowIMG()
}

function loadWindowIMG() {
    loader.load('/3ds/WINDOW_IMG.glb', (gltf) => {

        gltf.scene.traverse(child => {

            child.userData.wall = true;
            child.userData.ground = false;
            child.userData.ceiling = false;

            if (child.material) {
                var map = child.material.map;
                child.material = new THREE.MeshBasicMaterial();
                child.material.map = map;
                child.material.polygonOffset = true;
                child.material.polygonOffsetFactor = -1;
            }
        })

        gltf.scene.rotation.y = -Math.PI / 2;
        gltf.scene.position.set(20, 7, 7);
        gltf.scene.translateY(-1)
        gltf.scene.translateX(-1)
        gltf.scene.name = "window";
        GLOBALS.SCENE.add(gltf.scene);
        GLOBALS.OBSERVATION_ROOM_IMG = gltf.scene;
        loadWindow();
    });
}

function loadWindow() {
    handleZip('./assets/3ds/window.zip', "loadWindow");
}

function loadWindowManager(scene) {

    scene.traverse(child => {
        if (child.name.includes("Cube")) {
            child.receiveShadow = true;
            child.castShadow = true;
        }

        if (child.name.includes("image")) {
            child.material.side = 2;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.3;
        }
    })

    scene.rotation.y = -Math.PI / 2;
    scene.position.set(16, 6, 6);
    scene.visible = false;
    scene.name = "OBSERVATION_ROOM";
    GLOBALS.SCENE.add(scene);

    GLOBALS.OBSERVATION_ROOM = scene;
    loadGun();
}

function loadGun() {
    handleZip('./assets/3ds/hd_portal_gun3.zip', "loadGun");
}

function loadGunManager(scene) {

    GLOBALS.GUN = new THREE.Group();
    GLOBALS.GUN.visible = false;

    var newGroup = new THREE.Group();

    GLOBALS.GUN.add(newGroup);
    newGroup.add(scene);

    var cube_1, cube_2, cube_3;

    scene.traverse(child => {
        if (child.material) {
            child.receiveShadow = true;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.25;
        }

        child.renderOrder = 10;

        if (child.name == "sphere")
            GLOBALS.GUN_SPHERE = child;
        else if (child.name == "cylinder")
            GLOBALS.GUN_CYLINDER = child;
        else if (child.name == "cube_1")
            cube_1 = child;
        else if (child.name == "cube_2")
            cube_2 = child;
        else if (child.name == "cube_3")
            cube_3 = child;
    });

    GLOBALS.GUN.name = "GUN";
    GLOBALS.SCENE.add(GLOBALS.GUN);

    //gltf.scene.position.set(0.12, -0.14, -0.13);
    scene.scale.set(0.1, 0.1, 0.1)
    scene.position.set(0.01, -0.012, -0.011);
    loadDoor()

    const geometry = new THREE.SphereGeometry(0.01, 32, 16);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        visible: false
    });
    const sphere = new THREE.Mesh(geometry, material);
    const sphere1 = sphere.clone();
    sphere1.name = "sphere1";
    const sphere2 = sphere.clone();
    sphere2.name = "sphere2";
    const sphere3 = sphere.clone();
    sphere3.name = "sphere3";

    var target = new THREE.Vector3(); // create once an reuse it
    cube_1.getWorldPosition(target);
    sphere1.position.copy(target)
    GLOBALS.GUN.add(sphere1)

    var target = new THREE.Vector3(); // create once an reuse it
    cube_2.getWorldPosition(target);
    sphere2.position.copy(target)
    GLOBALS.GUN.add(sphere2)

    var target = new THREE.Vector3(); // create once an reuse it
    cube_3.getWorldPosition(target);
    sphere3.position.copy(target)
    GLOBALS.GUN.add(sphere3)
}

function loadDoor() {
    handleZip('./assets/3ds/open.zip', "loadExitDoor");
}

function loadExitDoor(scene) {
    //EXIT DOOR
    var door = scene;
    door.position.set(13, 1, -0.99)
    door.translateZ(1);
    door.name = "exitDoor";
    GLOBALS.EXIT_DOOR = door;
    GLOBALS.SCENE.add(door);

    door.traverse(child => {

        child.userData.wall = true;
        child.userData.ground = false;
        child.userData.ceiling = false;

        if (child.isBone) {
            if (child.name == "portal_door_right_04") {
                child.scale.set(0, 0, 0);
            } else if (child.name == "portal_door_left_06") {
                child.scale.set(0, 0, 0);
            }
        }

        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
        }
    })
    //
    //loadEnterDoor(scene);
    handleZip('./assets/3ds/open.zip', "loadEnterDoor");
}

function loadEnterDoor(scene) {

    var door = scene;

    //ENTER DOOR
    door.name = "enterDoor";
    door.rotation.y = Math.PI;
    door.position.set(3, 1, 13);
    door.translateZ(1);
    GLOBALS.ENTER_DOOR = door;
    GLOBALS.SCENE.add(door);

    //
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: 2,
        visible: false
    });
    const plane = new THREE.Mesh(geometry, material);
    door.add(plane);

    door.traverse(child => {

        child.userData.wall = true;
        child.userData.ground = false;
        child.userData.ceiling = false;

        if (child.isBone) {
            if (child.name == "portal_door_right_04") {
                child.scale.set(0, 0, 0);
            } else if (child.name == "portal_door_left_06") {
                child.scale.set(0, 0, 0);
            }
        }

        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
        }
    })
    //
    door.getObjectByName("warning").material = new THREE.MeshStandardMaterial();
    var map = new THREE.TextureLoader().load('./assets/enter.jpg');
    map.flipY = false;
    map.encoding = THREE.sRGBEncoding;
    door.getObjectByName("warning").material.map = map;
    //
    loadCorridor()
}

function loadCorridor() {
    handleZip('./assets/3ds/corridor.zip', "loadCorridor");
}

function loadCorridorEnter(scene) {

    var corridor = scene.clone();
    corridor.position.z = -0.99;
    corridor.visible = false;

    corridor.traverse(child => {
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;

            if (child.material.name == "lambert5") {
                child.material = new THREE.MeshBasicMaterial()
            }

            if (child.name == "back") {
                GLOBALS.WALL_CORRIDOR_BACK = child;
            }
        }
    });

    GLOBALS.CORRIDOR_ENTER = corridor;
    GLOBALS.CORRIDOR_ENTER.name = "corridorEnter";
    GLOBALS.ENTER_DOOR.add(GLOBALS.CORRIDOR_ENTER);
    //loadCorridorExit(scene);
    loadPortalCube();
}

function loadPortalCube() {
    handleZip('./assets/3ds/portal_cube.zip', "loadPortalCube");
}

function loadPortalCubeManager(scene) {

    var item = instancedTransform(scene, "cube", true, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    loadPortalSphere()
}

function instancedTransform(scene, name, interactive, roughness, envIntensity) {
    var geometry = scene.children[0].geometry.clone();
    geometry.computeVertexNormals();

    //if (interactive)
    //    geometry.scale(0.015, 0.015, 0.015);

    var item = new THREE.InstancedMesh(geometry, scene.children[0].material.clone(), 20);
    item.instanceMatrix.setUsage(THREE.DynamicDrawUsage); // will be updated every frame

    var clone = new THREE.Object3D();

    for (var i = 0; i < 20; i++) {
        clone.scale.set(0, 0, 0);
        clone.updateMatrix();
        item.setMatrixAt(i, clone.matrix);
    }

    item.name = name;
    item.receiveShadow = true;
    item.castShadow = true;
    item.material.envMap = GLOBALS.ENV_MAP;
    item.material.envMapIntensity = envIntensity;
    item.material.roughness = roughness;
    item.frustumCulled = false;

    if (interactive) {
        GLOBALS.INTERACTIVE.push(item);
    }

    if (name == "laser_cube") {
        GLOBALS.LASER_CUBE = item;
        item.material.transparent = true;
        item.material.opacity = 0.9;
        item.material.roughness = 0;
    }

    for (var i = 0; i < 20; i++)
        GLOBALS.DYMANIC_ITEMS[name].push([])

    GLOBALS.ITEMS_ADDED.add(item);

    return item;
}

function loadPortalSphere() {
    handleZip('./assets/3ds/portal_sphere.zip', "loadPortalSphere");
}

function loadPortalSphereManager(scene) {
    var item = instancedTransform(scene, "sphere", true, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    loadHalfWindow()
}

function loadHalfWindow() {
    //HALF WINDOW IMG
    loader.load('/3ds/WINDOW_HALF_IMG.glb', (gltf) => {
        gltf.scene.name = "observation_room";
        gltf.scene.userData.wall = true;
        gltf.scene.userData.ground = false;
        gltf.scene.userData.ceiling = false;
        GLOBALS.ITEMS.add(gltf.scene);
        //HALF WINDOW
        handleZip('./assets/3ds/window_half.zip', "loadWindowHalf");
    })
    loadDispenser()
}

function loadWindowHalfManager(scene) {
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            //child.material.envMap = GLOBALS.ENV_MAP;
            //child.material.envMapIntensity = 1;
        }

        if (child.name.includes("Cube")) {
            //child.receiveShadow = true;
            child.castShadow = true;
        }

        if (child.name == "room_light") {
            const light = new THREE.PointLight(0xffffff, 25, 10);
            var target = new THREE.Vector3(); // create once an reuse it
            child.getWorldPosition(target);
            light.position.copy(target);
            light.translateY(-1);
            scene.add(light);
        }

        if (child.name.includes("vidro")) {
            //child.renderOrder = -1;
            child.material.side = 2;
            child.material.envMap = GLOBALS.ENV_MAP;
        }
    })

    scene.position.y = -1;
    scene.visible = false;
}

function loadDispenser() {
    handleZip('./assets/3ds/cube_dispenser.zip', "loadDispenser");
}

function loadDispenserManager(scene) {

    var item = instancedTransform(scene, "dispenser", false, 0.2, 0.5)

    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;

    /*scene.name = "dispenser";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    GLOBALS.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
        }
    })*/

    loadPedestalButton()
}

function loadPedestalButton() {
    handleZip('./assets/3ds/pedestal_button.zip', "loadPedestalButton");
}

function loadPedestalButtonManager(scene) {

    var item = instancedTransform(scene, "pedestal_button", true, 0.2, 0.5)

    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    item.userData.trigger = true;

    loadButtonSphere()
}

function loadButtonSphere() {
    handleZip('./assets/3ds/button_sphere.zip', "loadButtonSphere");
}

function loadButtonSphereManager(scene) {

    var item = instancedTransform(scene, "button_circle", false, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    item.userData.trigger = true;

    loadButtonCube()
}

function loadButtonCube() {
    handleZip('./assets/3ds/button_cube.zip', "loadButtonCube");
}

function loadButtonCubeManager(scene) {

    var item = instancedTransform(scene, "button_box", false, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    item.userData.trigger = true;

    loadButtonWeight()
}

function loadButtonWeight() {
    handleZip('./assets/3ds/button_weight.zip', "loadButtonWeight", 0.2, 0.5);
}

function loadButtonWeightManager(scene) {

    var item = instancedTransform(scene, "button_weight", false, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    item.userData.trigger = true;

    loadCamera();
}

function loadCamera() {
    handleZip('./assets/3ds/camera.zip', "loadCamera");
}

function loadCameraManager(scene) {
    scene.name = "camera";
    scene.userData.wall = true;
    scene.userData.ground = false;
    scene.userData.ceiling = false;
    GLOBALS.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.2;

            if (child.name == "Sphere") {
                child.material = new THREE.MeshBasicMaterial();
                child.material.roughness = 0;
                child.material.color = new THREE.Color(0xf70022);
            }
        }
    })

    loadRadio()
}

function loadRadio() {
    handleZip('./assets/3ds/radio.zip', "loadRadio");
}

function loadRadioManager(scene) {

    var item = instancedTransform(scene, "radio", true, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;

    loadGelRecharger();
}

function loadGelRecharger() {
    loader.load('/3ds/portal_gun_recharger.glb', (gltf) => {

        gltf.scene.traverse(child => {
            if (child.material)
                child.material.roughness = 0;
        })

        var item = instancedTransform(gltf.scene, "gel_gun_blue", true, 0.1, 0.5)
        item.userData.wall = false;
        item.userData.ground = true;
        item.userData.ceiling = false;

        var item = instancedTransform(gltf.scene, "gel_gun_orange", true, 0.1, 0.5)
        item.userData.wall = false;
        item.userData.ground = true;
        item.userData.ceiling = false;

        var item = instancedTransform(gltf.scene, "gel_gun_white", true, 0.1, 0.5)
        item.userData.wall = false;
        item.userData.ground = true;
        item.userData.ceiling = false;

        loadRamp();
    });
}

function loadRamp() {
    loader.load('/3ds/ramp.glb', (gltf) => {

        var item = instancedTransform(gltf.scene, "ramp", false, 0.5, 0.5)
        item.userData.wall = false;
        item.userData.ground = true;
        item.userData.ceiling = false;

        loadRampHalf();
    });
}

function loadRampHalf() {
    loader.load('/3ds/ramp_half.glb', (gltf) => {

        var item = instancedTransform(gltf.scene, "ramp_half", false, 0.5, 0.5)
        item.userData.wall = false;
        item.userData.ground = true;
        item.userData.ceiling = false;

        loadRampHalf2()
    });
}

function loadRampHalf2() {
    loader.load('/3ds/ramp_half2.glb', (gltf) => {

        var item = instancedTransform(gltf.scene, "ramp_half2", false, 0.5, 0.5)
        item.userData.wall = false;
        item.userData.ground = true;
        item.userData.ceiling = false;

        loadStairs();
    });
}

function loadStairs() {
    handleZip('./assets/3ds/stairs.zip', "loadStairs");
}

function loadStairsManager(scene) {
    var item = instancedTransform(scene, "stairs", false, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    loadLightBridge()
}

function loadLightBridge() {
    handleZip('./assets/3ds/light_bridge.zip', "loadLightBridge");
}

function loadLightBridgeManager(scene) {
    var item = instancedTransform(scene, "light_bridge", false, 0.2, 0.5)
    item.userData.wall = true;
    item.userData.ground = false;
    item.userData.ceiling = false;

    loadTractorBeam()
}

function loadTractorBeam() {
    handleZip('./assets/3ds/tractor_beam.zip', "loadTractorBeam");
}

function loadTractorBeamManager(scene) {

    var item = instancedTransform(scene, "tractor_beam", false, 0.2, 0.5)
    item.userData.wall = true;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadLaserEmitter()
}

function loadLaserEmitter() {
    handleZip('./assets/3ds/laser_emitter.zip', "loadLaserEmitter");
}

function loadLaserEmitterManager(scene) {

    var item = instancedTransform(scene, "laser_emitter", false, 0.2, 0.5)
    item.userData.wall = true;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadLaserCube()
}

function loadLaserCube() {
    handleZip('./assets/3ds/laser_cube.zip', "loadLaserCube");
}

function loadLaserCubeManager(scene) {

    var item = instancedTransform(scene, "laser_cube", true, 0.0, 0.5)
    item.userData.wall = true;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadFaithPlate()
}

function loadFaithPlate() {
    handleZip('./assets/3ds/faith_plate.zip', "loadFaithPlate");
}

function loadFaithPlateManager(scene) {
    scene.name = "faith_plate";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = true;
    GLOBALS.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 1;
            child.material.roughness = 0.2;
        }
    })

    loadDoorNormal();
}

function loadDoorNormal() {
    handleZip('./assets/3ds/door.zip', "loadDoorNormal");
}

function loadDoorNormalManager(scene) {
    scene.name = "door";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    GLOBALS.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.2;
        }
    })

    loadLight()
}

function loadLight() {
    handleZip('./assets/3ds/light.zip', "loadLight");
}

function loadLightManager(scene) {
    var item = instancedTransform(scene, "light", false, 0, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadLightEmissive()
}

function loadLightEmissive() {
    handleZip('./assets/3ds/lightEmissive.zip', "loadLightEmissive");
}

function loadLightEmissiveManager(scene) {
    var item = instancedTransform(scene, "lightEmissive", false, 0, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadLightStripe()
}

function loadLightStripe() {
    handleZip('./assets/3ds/stripe.zip', "loadLightStripe");
}

function loadLightStripeManager(scene) {
    var item = instancedTransform(scene, "stripe", false, 0, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadGelBlue()
}

function loadGelBlue() {
    handleZip('./assets/3ds/gel_blue.zip', "loadGelBlue");
}

function loadGelBlueManager(scene) {
    var item = instancedTransform(scene, "gel_blue", false, 0.2, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;


    loadGelOrange()
}

function loadGelOrange() {
    handleZip('./assets/3ds/gel_orange.zip', "loadGelOrange");
}

function loadGelOrangeManager(scene) {
    var item = instancedTransform(scene, "gel_orange", false, 0.2, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;


    loadElevatorRoom()
}

function loadElevatorRoom() {
    handleZip('./assets/3ds/exit_room.zip', "loadElevatorRoom");
}

function loadElevatorRoomManager(scene) {

    scene.name = "exit_room";
    GLOBALS.EXIT_ROOM = scene;

    //GLOBALS.SCENE.add(scene)
    GLOBALS.EXIT_ROOM.visible = false;

    scene.traverse(child => {
        //child.receiveShadow = true;
        //child.castShadow = true;
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            //child.material.envMapIntensity = 0.5;
            //child.material.roughness = 0.2;
        }

        if (child.name == "shader") {
            child.material = GLOBALS.MATERIAL_EXIT_ROOM;
            child.material.side = 1;
        } else if (child.name == "ground") {
            child.material.roughness = 1;
        } else if (child.name == "trigger") {
            child.visible = false;
            GLOBALS.ELEVATOR_TRIGGER = child;
        } else if (child.name == "door") {
            child.visible = false;
            GLOBALS.ELEVATOR = child;
        }

        if (child.name.includes("col")) {
            child.visible = false;
            GLOBALS.EXIT_ROOM_COLLIDERS.push(child)
        }


        if (child.isBone && child.name == "spinnydoor_left_06") {
            GLOBALS.ELEVATOR_DOOR_LEFT = child;
            child.rotation.y = Math.PI / 3;
        }

        if (child.isBone && child.name == "spinnydoor_right_08") {
            GLOBALS.ELEVATOR_DOOR_RIGHT = child;
            child.rotation.y = -Math.PI / 3;
        }
    })

    if (GLOBALS.LOADED_LEVEL) {
        loadLevelJSON()
    } else {
        $("#loading-parent").css("opacity", 0);
        $("#loading-parent").css("pointer-events", "none");
    }
    animate();
}


export {
    loadCube
};