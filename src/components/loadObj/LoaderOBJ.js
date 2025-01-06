import {
    LoadingManager, Box3, MeshBasicMaterial, Color, PointLight, Vector3, Group, MathUtils, Bone, SRGBColorSpace,
    PlaneGeometry, Mesh, TextureLoader, BoxGeometry, Object3D, AnimationMixer, MeshStandardMaterial,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { buildIniCubes } from '../cubeManager/CubeManager.js';
import $ from 'jquery';
import { fetchLevel, loadLevelJSON } from '../mainMenu/MainMenu.js';
import { GLOBALS } from '../../Globals.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { hex2rgb } from '../../Utils.js';
import { viewFPS } from '../test/Test.js';
import { addItem } from '../items/AddItem.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';
import { manageConnection } from '../boxSelection/Connection.js';

var defaultLoaded = 0;
var fpsDefaultLoaded = 0;
var fpsPropsLoading = false;

function loadDefault() {

    var bb = new Box3()
    bb.setFromObject(GLOBALS.CUBES);
    bb.getCenter(GLOBALS.CONTROLS.target);

    GLOBALS.CONTROLS.target.set(GLOBALS.CONTROLS.target.x + 8, GLOBALS.CONTROLS.target.y + 2, GLOBALS.CONTROLS.target.z + 6);
    GLOBALS.MAIN_CAMERA.position.set(-12.2, 17.4, 26.3)
    GLOBALS.CONTROLS.update();

    load3D("/items/open.glb", "door", false);
    load3D("/items/hd_portal_gun3.glb", "gun", false);
    load3D("/items/cube_dispenser.glb", "dispenser", true, false, 0.2, 0.5, false, false, true, false, null, null, null, 100);
    loadWindowIMG();
}

var draco = new DRACOLoader();
draco.setDecoderPath("draco/");
draco.preload();

const loader = new GLTFLoader().setPath('./assets/3ds/');
loader.setDRACOLoader(draco);

function load3D(path, name, instanced, interactive, roughness, envIntensity, wall, ground, ceiling, trigger, found, loaded, elem, max) {

    const manager = new LoadingManager();
    const loader2 = new GLTFLoader(manager).setPath('./assets/3ds/medium');
    loader2.setDRACOLoader(draco);

    manager.onStart = function (url, itemsLoaded, itemsTotal) {
        $("#loading-parent").css("opacity", 1);
        $("#loading-parent").css("pointer-events", "all");
    };

    manager.onLoad = function () {

        if (defaultLoaded < 3) {

            defaultLoaded++;

            if (defaultLoaded == 3) {

                buildIniCubes();

                if (!GLOBALS.LOADED_LEVEL) {
                    $("#loading-parent").css("opacity", 0);
                    $("#loading-parent").css("pointer-events", "none");
                } else {
                    fetchLevel();
                }
            }
        } else if (fpsPropsLoading) {

            fpsDefaultLoaded++;

            if (fpsDefaultLoaded == 2) {
                fpsPropsLoading = false;
                viewFPS(true);
            }
        } else {

            if (found) {
                GLOBALS.ITEM_HOLDED_NAME = name;
                GLOBALS.DRAGGED_ITEM_ELEMENT = elem;
                addItem(found, loaded);
            }

            if(!GLOBALS.LOADED_LEVEL){
                $("#loading-parent").css("opacity", 0);
                $("#loading-parent").css("pointer-events", "none");
            }
        }
    };

    manager.onProgress = function (url, itemsLoaded, itemsTotal) { };

    loader2.load(path, async function (glb) {

        const scene = glb.scene;
        scene.instanced = instanced;

        scene.traverse(child => {
            child.frustumCulled = true;
        });

        if (instanced) {
            var item = instancedTransform(scene, name, interactive, roughness, envIntensity, max)
            item.userData.wall = wall;
            item.userData.ground = ground;
            item.userData.ceiling = ceiling;
            item.userData.trigger = trigger;

            if (interactive) {
                item.scene = scene.children[0];
                item.clone = scene;
                item.clone.children[0].material.envMap = GLOBALS.ENV_MAP;
                item.clone.children[0].material.envMapIntensity = 0.5;
                item.clone.children[0].material.roughness = 0.2;
            }
        } else {
            if (name == "door")
                loadEnterDoor(scene);
            else if (name == "gun")
                loadGunManager(scene);
            else if (name == "window")
                loadWindowManager(scene);
            else if (name == "corridor")
                loadCorridorEnter(scene);
            else if (name == "faith_plate")
                loadFaithPlateManager(scene);
            else if (name == "camera")
                loadCameraManager(scene);
            else if (name == "portal_gun")
                loadPortalGunStand(scene);
            else if (name == "angled_panel")
                loadAngledPanelManager(scene);
        }
    });
}

function instancedTransform(scene, name, interactive, roughness, envIntensity, max) {

    var geometry = scene.children[0].geometry.clone();
    geometry.computeVertexNormals();
    geometry.computeBoundsTree();

    const item = new InstancedMesh2(geometry, scene.children[0].material.clone(), { createInstances: true });

    item.addInstances(max, (obj, index) => {
        obj.visible = false;
    });
    item.raycastOnlyFrustum = true;
    item.computeBVH();
    item.name = name;
    item.receiveShadow = true;
    item.castShadow = true;
    item.material.envMap = GLOBALS.ENV_MAP;
    item.material.envMapIntensity = envIntensity;
    item.material.roughness = roughness;
    item.frustumCulled = true;
    item.instanceMatrix.needsUpdate = true;

    if (interactive)
        GLOBALS.INTERACTIVE.push(item);

    if (name == "laser_cube") {
        GLOBALS.LASER_CUBE = item;
        item.material.transparent = true;
        item.material.opacity = 0.9;
        item.material.roughness = 0;
    }

    for (var i = 0; i < max; i++)
        GLOBALS.DYMANIC_ITEMS[name].push([])

    GLOBALS.ITEMS_ADDED.add(item);

    return item;
}

function loadWindowIMG() {
    loader.load('/medium/items/WINDOW_IMG.glb', (gltf) => {

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
    });
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

            //fakeLight.object.init(child, 1, true);
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
    planeExitDoor.position.set(-0.6, 0.8, 0.16);
    planeExitDoor.scale.set(0.8, 0.4, 0.8);
    GLOBALS.EXIT_DOOR.add(planeExitDoor);

    //ADD BOX
    const geometryBox = new BoxGeometry(5.99, 5.99, 11.5);
    const materialBox = new MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    const box = new Mesh(geometryBox, materialBox);
    box.geometry.computeBoundingBox(); // This is only necessary if not allready computed
    box.updateMatrixWorld(true); // This might be necessary if box is moved
    box.name = "trigger";
    box.position.set(0, 0, -5.76);
    GLOBALS.EXIT_DOOR.add(box);

    const box2 = box.clone();
    box2.material = new MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5 });
    GLOBALS.ENTER_DOOR.add(box2);

    //
    const geometryFizzler = new PlaneGeometry(2, 2);
    const planeFizzler = new Mesh(geometryFizzler, GLOBALS.MATERIAL_FIZZLER);
    planeFizzler.name = "fizzler";
    planeFizzler.translateZ(-0.5);
    GLOBALS.ENTER_DOOR.fizzler = planeFizzler;
    GLOBALS.ENTER_DOOR.add(planeFizzler);

    const planeFizzlerCLone = planeFizzler.clone();
    GLOBALS.EXIT_DOOR.fizzler = planeFizzlerCLone;
    GLOBALS.EXIT_DOOR.add(planeFizzlerCLone);
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

            if (!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high"))
                scene.add(light);
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
    GLOBALS.SCENE_CHILDREN.add(scene);
    GLOBALS.SPOTLIGHT.target = scene.getObjectByName("lightTarget");
    GLOBALS.OBSERVATION_ROOM = scene;
    GLOBALS.OBSERVATION_ROOM.add(GLOBALS.LIGHT_GROUP);
}

function loadGunManager(scene) {

    GLOBALS.GUN = new Group();
    GLOBALS.GUN.visible = false;

    var newGroup = new Group();

    GLOBALS.GUN.add(newGroup);


    GLOBALS.GUN_CLONE = new Group();
    newGroup.add(scene);

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
        else if (child.name == "gel_left" || child.name == "gel_right") {
            child.visible = false;
            child.material = new MeshStandardMaterial();
            child.material.roughness = 0;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 1;
        }
    });

    //LOAD PRPERTIES
    if (localStorage.getItem("portal_gun_color")) {
        var color = hex2rgb(localStorage.getItem("portal_gun_color"));
        scene.getObjectByName("Object_6").material.color = new Color(color.r / 255, color.g / 255, color.b / 255);
    }

    if (localStorage.getItem("portal_gun_roughness")) {
        scene.getObjectByName("Object_6").material.roughness = localStorage.getItem("portal_gun_roughness");
    }

    if (localStorage.getItem("portal_gun_metalness")) {
        scene.getObjectByName("Object_6").material.metalnessMap = null;
        scene.getObjectByName("Object_6").material.metalness = localStorage.getItem("portal_gun_metalness");
    }

    GLOBALS.GUN.name = "GUN";
    GLOBALS.GUN_GROUP.add(GLOBALS.GUN);
    scene.scale.set(0.07, 0.07, 0.05)
    scene.position.set(0.007, -0.01, -0.0095);
    scene.rotation.y = -0.1;

    GLOBALS.GUN_CLONE.scale.setScalar(0.7);
    GLOBALS.GUN_CLONE2.scale.setScalar(0.7);
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

            if (child.name == "spawn") {
                child.name = "spawnElevator";
            }
        }
    });

    GLOBALS.CORRIDOR_ENTER = corridor;
    GLOBALS.CORRIDOR_ENTER.name = "corridorEnter";
    GLOBALS.ENTER_DOOR.add(GLOBALS.CORRIDOR_ENTER);
}

function loadPortalGunStand(scene) {

    scene.traverse(child => {
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
        }
    });

    scene.name = "portal_gun";
    scene.visible = false;
    GLOBALS.ITEMS_ADDED.add(scene);
}

function loadAvatar() {

    fpsPropsLoading = true;

    const playerModel = loader.loadAsync('/avatar/medium/chell.glb');

    load3D("/items/window.glb", "window", false);
    load3D("/items/corridor.glb", "corridor", false);

    GLOBALS.PLAYER_ANIMATIONS = {
        //WITH PORTAL GUN
        ANIM_STANDING_IDLE: loader.loadAsync('/avatar/StandingIdle.glb'),
        ANIM_JUMP: loader.loadAsync('/avatar/Jump.glb'),
        ANIM_STATIONARY_RUNNING: loader.loadAsync('/avatar/StationaryRunning.glb'),
        ANIM_BACKWARD_RUNNING: loader.loadAsync('/avatar/RunningBackward.glb'),
        ANIM_RIGHT_STRAFE: loader.loadAsync('/avatar/RightStrafe.glb'),
        ANIM_LEFT_STRAFE: loader.loadAsync('/avatar/LeftStrafe.glb'),
        ANIM_FALLING_IDLE: loader.loadAsync('/avatar/FallingIdle.glb'),
        //NO PORTAL GUN
        /*ANIM_STANDING_IDLE_NO_GUN: loader.loadAsync('./assets/avatar/noGun/StandingIdle.glb'),
        ANIM_JUMP_NO_GUN: loader.loadAsync('./assets/avatar/noGun/Jump.glb'),
        ANIM_STATIONARY_RUNNING_NO_GUN: loader.loadAsync('./assets/avatar/noGun/StationaryRunning.glb'),
        ANIM_BACKWARD_RUNNING_NO_GUN: loader.loadAsync('./assets/avatar/noGun/RunningBackward.glb'),
        ANIM_RIGHT_STRAFE_NO_GUN: loader.loadAsync('./assets/avatar/noGun/RightStrafe.glb'),
        ANIM_LEFT_STRAFE_NO_GUN: loader.loadAsync('./assets/avatar/noGun/LeftStrafe.glb'),*/
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

        GLOBALS.PLAYER_MODEL = fbx;
        GLOBALS.PLAYER_MODEL_CLONE = SkeletonUtils.clone(GLOBALS.PLAYER_MODEL);
        GLOBALS.MIXERS_CLONE = new AnimationMixer(GLOBALS.PLAYER_MODEL_CLONE)

        GLOBALS.PLAYER_MODEL.position.y = 100000;
        GLOBALS.PLAYER_MODEL_CLONE.position.y = 100000;

        if ((!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high"))
            || (window.playerState)) {
            GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL);
            GLOBALS.SCENE_CHILDREN.add(GLOBALS.PLAYER_MODEL_CLONE);
        }

        GLOBALS.PLAYER_MODEL.animationActions = {};
        GLOBALS.PLAYER_MODEL_CLONE.animationActions = {};
        GLOBALS.PLAYER_MODEL.modelReady = true;
    }).then(() => {
        let animationPromises = []
        for (let index in GLOBALS.PLAYER_ANIMATIONS) {
            const anim = GLOBALS.PLAYER_ANIMATIONS[index]

            anim.then((anim) => {
                const animationAction = GLOBALS.MIXERS.clipAction(anim.animations[0])
                GLOBALS.PLAYER_MODEL.animationActions[index] = animationAction

                const animationActionClone = GLOBALS.MIXERS_CLONE.clipAction(anim.animations[0])
                GLOBALS.PLAYER_MODEL_CLONE.animationActions[index] = animationActionClone;
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
}

function loadAngledPanelManager(scene) {
    scene.name = "angled_panel";
    scene.userData.wall = true;
    scene.userData.ground = true;
    scene.userData.ceiling = true;
    scene.visible = false;
    GLOBALS.ITEMS_ADDED.add(scene);
    scene.traverse(child => {
        if (child.name.includes("panel") && child.material) {
            child.material.side = 2;
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 0.2;
            child.material.roughness = 1;
        }

        if (child.material) {
            child.material.polygonOffset = true;
            child.material.polygonOffsetFactor = 2;
        }
    });
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
        //handleZip('./assets/3ds/window_half.glb', "loadWindowHalf");
    })
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


            if (!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high"))
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

function loadCameraManager(scene) {
    scene.name = "camera";
    scene.visible = false;
    scene.userData.wall = true;
    scene.userData.ground = false;
    scene.userData.ceiling = false;
    GLOBALS.ITEMS_ADDED.add(scene);
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
}

function loadFaithPlateManager(scene) {
    scene.name = "faith_plate";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = true;
    scene.visible = false;
    GLOBALS.ITEMS_ADDED.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = GLOBALS.ENV_MAP;
            child.material.envMapIntensity = 1;
            child.material.roughness = 0.2;
        }
    })
}

GLOBALS.LIGHT_PORTAL_1 = new PointLight(new Color(1, 0.25, 0), 0, 2);
GLOBALS.LIGHT_PORTAL_0 = new PointLight(new Color(0, 0.3, 1), 0, 2);
GLOBALS.FLASH = new PointLight(0xff0000, 10);

if (localStorage.getItem("quality-select") == "epic") {
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.LIGHT_PORTAL_0);
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.LIGHT_PORTAL_1);
    //GLOBALS.SCENE_CHILDREN.add(GLOBALS.FLASH);
}

/*setTimeout(() => {
    GLOBALS.LIGHT_PORTAL_0.visible = false;
    GLOBALS.LIGHT_PORTAL_1.visible = false;
    GLOBALS.FLASH.visible = false;
}, 3000);*/

export {
    loadDefault,
    load3D,
    loadAvatar
};