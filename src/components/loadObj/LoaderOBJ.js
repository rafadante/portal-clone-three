import {
    LoadingManager,
    Box3,
    MeshBasicMaterial,
    Color,
    PointLight,
    Vector3,
    Group,
    MathUtils,
    Bone,
    SRGBColorSpace,
    PlaneGeometry,
    Mesh,
    TextureLoader,
    BoxGeometry,
    Object3D,
    AnimationMixer,
    DynamicDrawUsage,
    InstancedMesh,
    MeshStandardMaterial
} from 'three';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
import {
    buildIniCubes
} from '../cubeManager/CubeManager.js';
import $ from 'jquery';
import JSZipUtils from 'jszip-utils';
import {
    unzipSync
} from 'three/addons/libs/fflate.module.js';
import {
    animate
} from '../../Main.js';
import {
    loadLevelJSON
} from '../mainMenu/MainMenu.js';
import {
    GLOBALS
} from '../../Globals.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { hex2rgb } from '../../Utils.js';

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
                    child.frustumCulled = true;
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
                else if (obj == "loadLight")
                    loadLightManager(result.scene)
                else if (obj == "loadLightEmissive")
                    loadLightEmissiveManager(result.scene)
                else if (obj == "loadLightStripe")
                    loadLightStripeManager(result.scene)
                else if (obj == "loadLaserField")
                    loadLaserFieldManager(result.scene)
                else if (obj == "loadFizzler")
                    loadFizzlerManager(result.scene)
                else if (obj == "loadPortalCube2")
                    loadPortalCubeManager2(result.scene)
                else if (obj == "loadAutoPortal")
                    loadAutoPortalManager(result.scene)
                else if (obj == "loadAutoPortal1")
                    loadAutoPortalManager1(result.scene)
                else if (obj == "loadLaserReceiver")
                    loadLaserReceiverManager(result.scene)
                else if (obj == "loadLaserRelay")
                    loadLaserRelayManager(result.scene)
                else if (obj == "loadPelletLauncher")
                    loadPelletLauncherManager(result.scene)
                else if (obj == "loadPelletCatcher")
                    loadPelletCatcherManager(result.scene)
                else if (obj == "loadGelBlue")
                    loadGelBlueManager(result.scene)
                else if (obj == "loadGelOrange")
                    loadGelOrangeManager(result.scene)
                else if (obj == "loadGelPurple")
                    loadGelPurpleManager(result.scene)
                else if (obj == "loadAngledPanel")
                    loadAngledPanelManager(result.scene)
                else if (obj == "loadGelWhite")
                    loadGelWhiteManager(result.scene)
                else if (obj == "loadGelClear")
                    loadGelClearManager(result.scene)
                else if (obj == "loadGelReflection")
                    loadGelReflectionManager(result.scene)
                else if (obj == "loadGelRecharger")
                    loadGelRechargerManager(result.scene)
                else if (obj == "loadPaintGun")
                    loadPaintGunManager(result.scene)
            });
        }
    });
}

const manager = new LoadingManager();
const loader = new GLTFLoader(manager).setPath('./assets');

function loadCube() {

    var bb = new Box3()
    bb.setFromObject(GLOBALS.CUBES);
    bb.getCenter(GLOBALS.CONTROLS.target);

    GLOBALS.CONTROLS.target.set(GLOBALS.CONTROLS.target.x + 8, GLOBALS.CONTROLS.target.y + 2, GLOBALS.CONTROLS.target.z + 6);
    GLOBALS.MAIN_CAMERA.position.set(-12.2, 17.4, 26.3)
    GLOBALS.CONTROLS.update();

    loadWindowIMG()
}

function loadWindowIMG() {
    loader.load('/3ds/glb/WINDOW_IMG.glb', (gltf) => {

        gltf.scene.traverse(child => {

            child.userData.wall = true;
            child.userData.ground = false;
            child.userData.ceiling = false;

            if (child.material) {
                var map = child.material.map;
                child.material = new MeshBasicMaterial();
                child.material.map = map;
                child.material.polygonOffset = true;
                child.material.polygonOffsetFactor = -1;
            }
        })

        gltf.scene.rotation.y = -Math.PI / 2;
        gltf.scene.position.set(16, 8, 8);
        gltf.scene.translateY(-1)
        gltf.scene.translateX(-1)
        gltf.scene.name = "window";
        GLOBALS.SCENE_CHILDREN.add(gltf.scene);
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
            child.castShadow = true;
            child.material = new MeshBasicMaterial({
                color: new Color(0x000000)
            })
        }

        if (child.name == "room_light") {
            const light = new PointLight(0xffffff, 50, 3);
            var target = new Vector3(); // create once an reuse it
            child.getWorldPosition(target);
            light.position.copy(target);
            light.translateY(-0.2);
            scene.add(light);
        }

        if (child.name.includes("image")) {
            child.material.side = 2;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.3;
        }

        //if (child.name.includes("vidro") || child.name.includes("Cube005"))
        //    child.visible = false;
    })

    scene.rotation.y = -Math.PI / 2;
    scene.position.set(16, 6, 6);
    scene.visible = false;
    scene.name = "OBSERVATION_ROOM";
    GLOBALS.SCENE_CHILDREN.add(scene);
    GLOBALS.SPOTLIGHT.target = scene.getObjectByName("lightTarget");
    GLOBALS.OBSERVATION_ROOM = scene;
    GLOBALS.OBSERVATION_ROOM.add(GLOBALS.LIGHT_GROUP);
    loadGun();
}

function loadGun() {
    handleZip('./assets/3ds/hd_portal_gun3.zip', "loadGun");
}

function loadGunManager(scene) {

    GLOBALS.GUN = new Group();
    GLOBALS.GUN.visible = false;

    var newGroup = new Group();

    GLOBALS.GUN.add(newGroup);
    newGroup.add(scene);

    GLOBALS.GUN_CLONE = new Group();
    var gunClone = scene.clone();
    gunClone.rotation.x = MathUtils.degToRad(10);
    gunClone.position.set(-0.05, 0.075, -0.1)
    GLOBALS.GUN_CLONE.add(gunClone);

    GLOBALS.GUN_CLONE2 = GLOBALS.GUN_CLONE.clone();

    scene.traverse(child => {

        child.castShadow = true;
        child.layers.mask = 2;
        child.renderOrder = 100;
        if (child.material) {
            child.receiveShadow = true;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
        }

        if (child.name == "sphere") {
            GLOBALS.GUN_SPHERE = child;
            GLOBALS.SELECTED_FOR_BLOOM.add(child)
        } else if (child.name == "cylinder") {
            GLOBALS.GUN_CYLINDER = child;
            GLOBALS.SELECTED_FOR_BLOOM.add(child)
        } else if (child.name == "cube_4")
            window.gun_holder = child;
        else if (child.name == "cube_5")
            GLOBALS.PORTAL_GUN_FLASH = child;
        else if(child.name == "gel_left" || child.name == "gel_right"){
            child.visible = false;
            child.material = new MeshStandardMaterial();
            child.material.roughness = 0;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 1;
        }
    });

    //LOAD PRPERTIES
    if(localStorage.getItem("portal_gun_color")){
        var color = hex2rgb(localStorage.getItem("portal_gun_color"));
        scene.getObjectByName("Object_6").material.color = new Color(color.r/255, color.g/255, color.b/255);
    }

    if(localStorage.getItem("portal_gun_roughness")){
        scene.getObjectByName("Object_6").material.roughness = localStorage.getItem("portal_gun_roughness");
    }

    if(localStorage.getItem("portal_gun_metalness")){
        scene.getObjectByName("Object_6").material.metalnessMap = null;
        scene.getObjectByName("Object_6").material.metalness = localStorage.getItem("portal_gun_metalness");
    }
        
    GLOBALS.GUN.name = "GUN";
    GLOBALS.GUN_GROUP.add(GLOBALS.GUN);
    scene.scale.set(0.001, 0.001, 0.001)
    scene.position.set(0.00009, -0.00013, -0.00012);
    //cene.scale.set(1, 1, 1)
    //scene.position.set(0.12, -0.16, -0.14);
    //scene.visible = false;
    loadDoor()
}

function loadDoor() {
    handleZip('./assets/3ds/open.zip', "loadEnterDoor");
}

function loadEnterDoor(scene) {

    var door = scene;
    door.userData.connections = 0;

    //ENTER DOOR
    door.name = "enterDoor";
    door.rotation.y = Math.PI;
    door.position.set(3, 1, 12);

    door.namePosition = door.position.x + "/" + door.position.y + "/" + door.position.z;
    GLOBALS.ENTER_DOOR = door;
    GLOBALS.SCENE_CHILDREN.add(door);

    //
    const geometry = new PlaneGeometry(2, 2);
    const material = new MeshBasicMaterial({
        color: 0xffff00,
        side: 2,
        visible: false
    });
    const plane = new Mesh(geometry, material);
    door.add(plane);

    const geometry3 = new BoxGeometry(2, 2, 0.1);
    const material3 = new MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new Mesh(geometry3, material3);
    cube.visible = false;
    door.add(cube);
    door.cube = cube;
    cube.translateZ(0.3);

    door.traverse(child => {

        child.userData.wall = true;
        child.userData.ground = false;
        child.userData.ceiling = false;

        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;

            if (child.name.includes("dif")) {
                child.material = new MeshBasicMaterial();
                child.material.color = new Color(0x000000);
            }
        }

    })
    //
    GLOBALS.EXIT_DOOR = SkeletonUtils.clone(GLOBALS.ENTER_DOOR);
    GLOBALS.EXIT_DOOR.position.set(13, 1, 0);
    GLOBALS.EXIT_DOOR.userData.buttons = 0;
    GLOBALS.EXIT_DOOR.userData.connections = 0;
    GLOBALS.EXIT_DOOR.name = "exitDoor";
    GLOBALS.EXIT_DOOR.rotation.y += Math.PI;
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.EXIT_DOOR);
    GLOBALS.EXIT_DOOR.namePosition = GLOBALS.EXIT_DOOR.position.x + "/" + GLOBALS.EXIT_DOOR.position.y + "/" + GLOBALS.EXIT_DOOR.position.z;
    //
    var map = new TextureLoader().load('./assets/exit.jpg');
    map.colorSpace = SRGBColorSpace;

    const geometryExitDoor = new PlaneGeometry(1, 1);
    const materialExitDoor = new MeshBasicMaterial({ map: map });
    const planeExitDoor = new Mesh(geometryExitDoor, materialExitDoor);
    planeExitDoor.position.set(0, 1.3, 0.01)
    planeExitDoor.scale.set(1, 0.5, 1)
    GLOBALS.EXIT_DOOR.add(planeExitDoor);

    loadCorridor()
}

function loadCorridor() {
    handleZip('./assets/3ds/corridor.zip', "loadCorridor");
}

function loadCorridorEnter(scene) {

    var corridor = scene.clone();
    corridor.visible = false;

    corridor.traverse(child => {
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;

            if (child.material.name == "lambert5")
                child.material = new MeshBasicMaterial()

            if (child.name == "back")
                GLOBALS.WALL_CORRIDOR_BACK = child;
        }
    });

    GLOBALS.CORRIDOR_ENTER = corridor;
    GLOBALS.CORRIDOR_ENTER.name = "corridorEnter";
    GLOBALS.ENTER_DOOR.add(GLOBALS.CORRIDOR_ENTER);
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
    item.scene = scene.children[0];
    item.clone = scene;
    item.clone.children[0].material.envMap = GLOBALS.ENV_MAP;
    item.clone.children[0].material.envMapIntensity = 0.5;
    item.clone.children[0].material.roughness = 0.2;
    loadPortalSphere();
    buildIniCubes();
}

function instancedTransform(scene, name, interactive, roughness, envIntensity) {
    var geometry = scene.children[0].geometry.clone();
    geometry.computeVertexNormals();
    geometry.computeBoundsTree();

    var item = new InstancedMesh(geometry, scene.children[0].material.clone(), 20);
    item.instanceMatrix.setUsage(DynamicDrawUsage); // will be updated every frame

    var clone = new Object3D();

    for (var i = 0; i < 20; i++) {
        clone.scale.set(0, 0, 0);
        clone.position.set(100000, 100000, 100000);
        clone.updateMatrix();
        item.setMatrixAt(i, clone.matrix);
    }

    item.instanceMatrix.needsUpdate = true;
    item.computeBoundingSphere();

    item.name = name;
    item.receiveShadow = true;
    item.castShadow = true;
    item.material.envMap = GLOBALS.ENV_MAP;
    item.material.envMapIntensity = envIntensity;
    item.material.roughness = roughness;
    item.frustumCulled = true;

    if (interactive)
        GLOBALS.INTERACTIVE.push(item);

    if (name == "laser_cube") {
        GLOBALS.LASER_CUBE = item;
        item.material.transparent = true;
        item.material.opacity = 0.9;
        item.material.roughness = 0;
    }

    for (var i = 0; i < 20; i++)
        GLOBALS.DYMANIC_ITEMS[name].push([])

    GLOBALS.ITEMS_ADDED.add(item);
    //GLOBALS.ITEMS_ADDED.visible = false;

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
    item.scene = scene.children[0];
    item.clone = scene.children[0];
    item.clone.material.envMap = GLOBALS.ENV_MAP;
    item.clone.material.envMapIntensity = 0.5;
    item.clone.material.roughness = 0.2;

    loadHalfWindow()
}

function loadHalfWindow() {
    //HALF WINDOW IMG
    loader.load('/3ds/glb/WINDOW_HALF_IMG.glb', (gltf) => {
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

    //const geometry = new BoxGeometry(1, 1, 1);
    //const material = new MeshBasicMaterial({ color: 0x00ff00 });
    //const cube = new Mesh(geometry, material);
    var targetLight = new Object3D();
    targetLight.name = "targetLight";
    scene.add(targetLight)
    targetLight.translateY(4);
    targetLight.translateZ(1);

    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;

        if (child.name.includes("Cube")) {
            child.castShadow = true;
        }

        if (child.name == "room_light") {
            const light = new PointLight(0xffffff, 3, 3);
            var target = new Vector3(); // create once an reuse it
            child.getWorldPosition(target);
            light.position.copy(target);
            scene.add(light);
            light.position.set(0, -1, -0.8)
            light.shadow.bias = -0.1;
            light.castShadow = false;
            light.name = "pointLight";
        }

        if (child.name.includes("vidro")) {
            child.visible = false;
            child.material.side = 2;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.3;
        }
    })

    scene.position.y = -1;
    scene.visible = false;
    GLOBALS.OBSERVATION_ROOM_HALF = scene;
}

function loadDispenser() {
    handleZip('./assets/3ds/cube_dispenser.zip', "loadDispenser");
}

function loadDispenserManager(scene) {

    var item = instancedTransform(scene, "dispenser", false, 0.2, 0.5)

    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;

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
                child.material = new MeshBasicMaterial();
                child.material.roughness = 0;
                child.material.color = new Color(0xf70022);
            }
        }
    });

    loadRadio();
}

function loadRadio() {
    handleZip('./assets/3ds/radio.zip', "loadRadio");
}

function loadRadioManager(scene) {

    var item = instancedTransform(scene, "radio", true, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    item.scene = scene.children[0];
    item.clone = scene;
    item.clone.children[0].material.envMap = GLOBALS.ENV_MAP;
    item.clone.children[0].material.envMapIntensity = 0.5;
    item.clone.children[0].material.roughness = 0.2;

    loadStairs();
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
    item.scene = scene.children[0];
    item.clone = scene;
    item.clone.children[0].material.envMap = GLOBALS.ENV_MAP;
    item.clone.children[0].material.envMapIntensity = 0.5;
    item.clone.children[0].material.roughness = 0.2;

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

    loadAvatar();
}

const gltfLoader = new GLTFLoader();

function loadAvatar() {

    const playerModel = gltfLoader.loadAsync('./assets/avatar/chell.glb');

    GLOBALS.PLAYER_ANIMATIONS = {
        //WITH PORTAL GUN
        ANIM_STANDING_IDLE: gltfLoader.loadAsync('./assets/avatar/StandingIdle.glb'),
        ANIM_JUMP: gltfLoader.loadAsync('./assets/avatar/Jump.glb'),
        ANIM_STATIONARY_RUNNING: gltfLoader.loadAsync('./assets/avatar/StationaryRunning.glb'),
        ANIM_BACKWARD_RUNNING: gltfLoader.loadAsync('./assets/avatar/RunningBackward.glb'),
        ANIM_RIGHT_STRAFE: gltfLoader.loadAsync('./assets/avatar/RightStrafe.glb'),
        ANIM_LEFT_STRAFE: gltfLoader.loadAsync('./assets/avatar/LeftStrafe.glb'),
        ANIM_FALLING_IDLE: gltfLoader.loadAsync('./assets/avatar/FallingIdle.glb'),
        //NO PORTAL GUN
        /*ANIM_STANDING_IDLE_NO_GUN: gltfLoader.loadAsync('./assets/avatar/noGun/StandingIdle.glb'),
        ANIM_JUMP_NO_GUN: gltfLoader.loadAsync('./assets/avatar/noGun/Jump.glb'),
        ANIM_STATIONARY_RUNNING_NO_GUN: gltfLoader.loadAsync('./assets/avatar/noGun/StationaryRunning.glb'),
        ANIM_BACKWARD_RUNNING_NO_GUN: gltfLoader.loadAsync('./assets/avatar/noGun/RunningBackward.glb'),
        ANIM_RIGHT_STRAFE_NO_GUN: gltfLoader.loadAsync('./assets/avatar/noGun/RightStrafe.glb'),
        ANIM_LEFT_STRAFE_NO_GUN: gltfLoader.loadAsync('./assets/avatar/noGun/LeftStrafe.glb'),*/
    }

    playerModel.then((glb) => {

        const fbx = glb.scene;

        fbx.scale.setScalar(0.015);
        GLOBALS.MIXERS = new AnimationMixer(fbx)

        fbx.traverse(c => {
            c.castShadow = true;

            if (c.material) {

                c.material.envMap = GLOBALS.ENV_MAP;
                c.material.envMapIntensity = 0.5;
                c.material.transparent = true;
                c.material.opacity = 0;
                c.material.colorWrite = false;
                c.material.depthWrite = false;
                c.material.side = 0;
            }

            if (c.isBone) {
                if (c.name == "wrist_R") {
                    window.hand = c;
                } else if (c.name == "elbow_L") {
                    window.handLeft = c;
                } else if (c.name == "neck1") {
                    window.neck = c;
                }
            }
        })

        GLOBALS.GUN_CLONE.scale.setScalar(0.7);
        GLOBALS.GUN_CLONE2.scale.setScalar(0.7);

        GLOBALS.PLAYER_MODEL = fbx;
        GLOBALS.PLAYER_MODEL_CLONE = SkeletonUtils.clone(GLOBALS.PLAYER_MODEL);

        GLOBALS.PLAYER_MODEL.position.y = 100000;
        GLOBALS.PLAYER_MODEL_CLONE.position.y = 100000;

        GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL);
        GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL_CLONE);

        GLOBALS.PLAYER_MODEL.animationActions = {};
        GLOBALS.PLAYER_MODEL.modelReady = true;
    }).then(() => {
        let animationPromises = []
        for (let index in GLOBALS.PLAYER_ANIMATIONS) {
            const anim = GLOBALS.PLAYER_ANIMATIONS[index]

            anim.then((anim) => {
                const animationAction = GLOBALS.MIXERS.clipAction(anim.animations[0])
                GLOBALS.PLAYER_MODEL.animationActions[index] = animationAction
            })
            animationPromises.push(anim)
        }
        Promise.all(animationPromises).then(() => GLOBALS.PLAYER_MODEL.modelReady = true)
    });

    // modify bone update function to also update its world matrix
    // possibly do this only to skeletons you need it for, not for all bones
    var update = Bone.prototype.update;
    Bone.prototype.update = function (parentSkinMatrix, forceUpdate) {
        update.call(this, parentSkinMatrix, forceUpdate);
        this.updateMatrixWorld(true);
    };

    loadLaserField();
}

function loadLaserField() {
    handleZip('./assets/3ds/laser_field.zip', "loadLaserField");
}

function loadLaserFieldManager(scene) {

    var item = instancedTransform(scene, "laser_field", false, 0.1, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadFizzler()
}

function loadFizzler() {
    handleZip('./assets/3ds/fizzler.zip', "loadFizzler");
}

function loadFizzlerManager(scene) {

    var item = instancedTransform(scene, "fizzler", false, 0.1, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadPortalCube2();
}

function loadPortalCube2() {
    handleZip('./assets/3ds/cube_2.zip', "loadPortalCube2");
}

function loadPortalCubeManager2(scene) {

    var item = instancedTransform(scene, "cube_2", true, 0.2, 0.5)
    item.userData.wall = false;
    item.userData.ground = true;
    item.userData.ceiling = false;
    item.scene = scene.children[0];
    item.clone = scene;
    item.clone.children[0].material.envMap = GLOBALS.ENV_MAP;
    item.clone.children[0].material.envMapIntensity = 0.5;
    item.clone.children[0].material.roughness = 0.2;

    loadAutoPortal()
}

function loadAutoPortal() {
    handleZip('./assets/3ds/portal_0.zip', "loadAutoPortal");
}

function loadAutoPortalManager(scene) {

    var item = instancedTransform(scene, "portal_0", false, 0.1, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadAutoPortal1()
}

function loadAutoPortal1() {
    handleZip('./assets/3ds/portal_1.zip', "loadAutoPortal1");
}

function loadAutoPortalManager1(scene) {

    var item = instancedTransform(scene, "portal_1", false, 0.1, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadLaserReceiver()
}

function loadLaserReceiver() {
    handleZip('./assets/3ds/laser_receiver.zip', "loadLaserReceiver");
}

function loadLaserReceiverManager(scene) {

    var item = instancedTransform(scene, "laser_receiver", false, 0.1, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadLaserRelay()
}

function loadLaserRelay() {
    handleZip('./assets/3ds/laser_relay.zip', "loadLaserRelay");
}

function loadLaserRelayManager(scene) {

    var item = instancedTransform(scene, "laser_relay", false, 0, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadPelletLauncher();
}

function loadPelletLauncher() {
    handleZip('./assets/3ds/pellet_launcher.zip', "loadPelletLauncher");
}

function loadPelletLauncherManager(scene) {

    var item = instancedTransform(scene, "pellet_launcher", false, 0, 1)
    item.material.polygonOffset = true;
    item.material.polygonOffsetFactor = -10;
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadPelletCatcher();
}

function loadPelletCatcher() {
    handleZip('./assets/3ds/pellet_catcher.zip', "loadPelletCatcher");
}

function loadPelletCatcherManager(scene) {

    var item = instancedTransform(scene, "pellet_catcher", false, 0, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadGelBlue();
}

function loadGelBlue() {
    handleZip('./assets/3ds/gel_blue.zip', "loadGelBlue");
}

function loadGelBlueManager(scene) {

    var item = instancedTransform(scene, "gel_blue", false, 0, 1)
    item.userData.wall = false;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadGelOrange()
}

function loadGelOrange() {
    handleZip('./assets/3ds/gel_orange.zip', "loadGelOrange");
}

function loadGelOrangeManager(scene) {

    var item = instancedTransform(scene, "gel_orange", false, 0, 1)
    item.userData.wall = false;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadGelPurple()
}

function loadGelPurple() {
    handleZip('./assets/3ds/gel_purple.zip', "loadGelPurple");
}

function loadGelPurpleManager(scene) {

    var item = instancedTransform(scene, "gel_purple", false, 0, 1)
    item.userData.wall = false;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadGelWhite();
}

function loadGelWhite() {
    handleZip('./assets/3ds/gel_white.zip', "loadGelWhite");
}

function loadGelWhiteManager(scene) {

    var item = instancedTransform(scene, "gel_white", false, 0, 1)
    item.userData.wall = false;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadGelClear();
}

function loadGelClear() {
    handleZip('./assets/3ds/gel_clear.zip', "loadGelClear");
}

function loadGelClearManager(scene) {

    var item = instancedTransform(scene, "gel_clear", false, 0, 1)
    item.userData.wall = false;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadGelReflection();
}

function loadGelReflection() {
    handleZip('./assets/3ds/gel_reflection.zip', "loadGelReflection");
}

function loadGelReflectionManager(scene) {

    var item = instancedTransform(scene, "gel_reflection", false, 0, 1)
    item.userData.wall = false;
    item.userData.ground = false;
    item.userData.ceiling = true;

    loadGelRecharger();
}

function loadGelRecharger() {
    handleZip('./assets/3ds/gel_recharger.zip', "loadGelRecharger");
}

function loadGelRechargerManager(scene) {

    var item = instancedTransform(scene, "gel_recharger", false, 0, 1)
    item.userData.wall = true;
    item.userData.ground = true;
    item.userData.ceiling = true;

    loadAngledPanel();
}

function loadAngledPanel() {
    handleZip('./assets/3ds/angled_panel.zip', "loadAngledPanel");
}

function loadAngledPanelManager(scene) {
    scene.name = "angled_panel";
    scene.userData.wall = true;
    scene.userData.ground = true;
    scene.userData.ceiling = true;
    GLOBALS.ITEMS.add(scene);
    scene.traverse(child => {
        if(child.name.includes("panel") && child.material){
            child.material.side = 2;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.2;
            child.material.roughness = 1;
        }

        if(child.material){
            child.material.polygonOffset = true;
            child.material.polygonOffsetFactor = 2;
        }
    });

    loadPaintGun()
}

function loadPaintGun() {
    handleZip('./assets/3ds/paint_gun.zip', "loadPaintGun");
}

function loadPaintGunManager(scene) {
    scene.name = "paint_gun";
    scene.userData.wall = true;
    scene.userData.ground = true;
    scene.userData.ceiling = true;
    GLOBALS.ITEMS.add(scene);
    scene.traverse(child => {
        if (child.material) {
            child.receiveShadow = true;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.5;
        }

        if(child.name == "opacity"){
            child.material.transparent = true;
            child.material.opacity = 0.2;
        }else if(child.name == "left" || child.name == "right"){
            child.material.roughness = 0;
            child.material.color = new Color(0,0,0);
        }
    });

    GLOBALS.PAINT_GUN = new Group();
    const group = new Group()

    GLOBALS.PAINT_GUN.add(group);
    group.add(scene);
    GLOBALS.GUN_GROUP.add(GLOBALS.PAINT_GUN);

    //scene.scale.set(0.001, 0.001, 0.001)
    scene.position.set(0.15, -0.17, -0.25);
    GLOBALS.PAINT_GUN.visible = false;

    if (GLOBALS.LOADED_LEVEL) {
        loadLevelJSON()
    } else {
        $("#loading-parent").css("opacity", 0);
        $("#loading-parent").css("pointer-events", "none");
    }
    animate();
}


GLOBALS.LIGHT_PORTAL_0 = new PointLight(new Color(1, 0.25, 0), 3, 2);
GLOBALS.LIGHT_PORTAL_1 = new PointLight(new Color(0, 0.3, 1), 3, 2);
//GLOBALS.SCENE_CHILDREN.add(GLOBALS.LIGHT_PORTAL_0);
//GLOBALS.SCENE_CHILDREN.add(GLOBALS.LIGHT_PORTAL_1);

GLOBALS.FLASH = new PointLight(0xff0000, 10);
//GLOBALS.SCENE_CHILDREN.add(GLOBALS.FLASH);

setTimeout(() => {
    GLOBALS.LIGHT_PORTAL_0.visible = false;
    GLOBALS.LIGHT_PORTAL_1.visible = false;
    GLOBALS.FLASH.visible = false;
}, 3000);

export {
    loadCube
};