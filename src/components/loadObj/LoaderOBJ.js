import * as THREE from '../../build/three.module.js';
import {
    GLTFLoader
} from '../../jsm/loaders/GLTFLoader.js';
import {
    buildIniCubes
} from '../cubeManager/CubeManager.js';
import {
    RectAreaLightHelper
} from '../../jsm/helpers/RectAreaLightHelper.js';
import $ from 'jquery';
import JSZipUtils from 'jszip-utils';
import {
    unzipSync,
    strFromU8
} from '../../jsm/libs/fflate.module.js';



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

                if (obj == "loadButtonCube") {
                    loadButtonCubeManager(result.scene)
                } else if (obj == "loadButtonSphere") {
                    loadButtonSphereManager(result.scene)
                } else if (obj == "loadButtonWeight") {
                    loadButtonWeightManager(result.scene)
                } else if (obj == "loadPedestalButton") {
                    loadPedestalButtonManager(result.scene)
                } else if (obj == "loadCamera") {
                    loadCameraManager(result.scene)
                } else if (obj == "loadRadio") {
                    loadRadioManager(result.scene)
                } else if (obj == "loadCorridor") {
                    loadCorridorEnter(result.scene)
                } else if (obj == "loadExitDoor") {
                    loadExitDoor(result.scene)
                } else if (obj == "loadEnterDoor") {
                    loadEnterDoor(result.scene)
                } else if (obj == "loadDispenser") {
                    loadDispenserManager(result.scene)
                } else if (obj == "loadGun") {
                    loadGunManager(result.scene)
                } else if (obj == "loadPortalCube") {
                    loadPortalCubeManager(result.scene)
                }else if (obj == "loadPortalSphere") {
                    loadPortalSphereManager(result.scene)
                }

                
            });

        }
    });
}


const manager = new THREE.LoadingManager();
manager.onStart = function (url, itemsLoaded, itemsTotal) {
    //console.log('Started loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onLoad = function () {
    //console.log('Loading complete!');
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    //console.log('Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.');
};

manager.onError = function (url) {
    //console.log('There was an error loading ' + url);
};

const loader = new GLTFLoader(manager).setPath('./assets');

function loadCube() {

    var bb = new THREE.Box3()
    bb.setFromObject(window.CUBES);
    bb.getCenter(window.CONTROLS.target);

    window.CONTROLS.target.set(window.CONTROLS.target.x + 8, window.CONTROLS.target.y + 2, window.CONTROLS.target.z + 6);
    window.MAIN_CAMERA.position.set(-12.2, 17.4, 26.3)
    window.CONTROLS.update();

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

            if (child.name == "side_window") {
                window.side_window = child;
            }
        })

        gltf.scene.rotation.y = -Math.PI / 2;
        gltf.scene.position.set(16, 7, 7);
        gltf.scene.translateY(-1)
        gltf.scene.translateX(-1)
        gltf.scene.name = "window";
        window.MAIN_SCENE.add(gltf.scene);
        window.OBSERVATION_ROOM_IMG = gltf.scene;
        loadWindow();
    });
}

function loadWindow() {
    loader.load('/3ds/window.glb', (gltf) => {
        gltf.scene.traverse(child => {
            if (child.name.includes("Cube")) {
                //child.receiveShadow = true;
                child.castShadow = true;
            }

            if (child.name == "room_light") {
                const light = new THREE.PointLight(0xffffff, 50, 3);
                var target = new THREE.Vector3(); // create once an reuse it
                child.getWorldPosition(target);
                light.position.copy(target);
                light.translateY(-0.2);
                gltf.scene.add(light);
                window.room_light = child;

                window.lightRoom = light;
            }

            if (child.name.includes("vidro")) {
                child.renderOrder = -1;
            }
        })

        gltf.scene.rotation.y = -Math.PI / 2;
        gltf.scene.position.set(16, 6, 6);
        gltf.scene.visible = false;
        gltf.scene.name = "OBSERVATION_ROOM";
        window.MAIN_SCENE.add(gltf.scene);

        window.OBSERVATION_ROOM = gltf.scene;
        loadGun();
    });
}

function loadGun() {
    handleZip('./assets/3ds/hd_portal_gun3.zip', "loadGun");
}

function loadGunManager(scene) {

    window.GUN = new THREE.Group();
    window.GUN.visible = false;

    var newGroup = new THREE.Group();

    window.GUN.add(newGroup);
    newGroup.add(scene);

    scene.traverse(child => {
        if (child.material) {
            child.receiveShadow = true;
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.25;
        }

        child.renderOrder = -1;

        if (child.name == "sphere") {
            window.GUN_SPHERE = child;
        } else if (child.name == "cylinder") {
            window.GUN_CYLINDER = child;
        } else if (child.name == "cube_1")
            window.cube_1 = child;
        else if (child.name == "cube_2")
            window.cube_2 = child;
        else if (child.name == "cube_3")
            window.cube_3 = child;
        //else if (child.name == "holder")
        //    window.holder = child;

    });

    //console.log(window.holder.position)
    window.GUN.name = "GUN";
    window.MAIN_SCENE.add(window.GUN);

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
    const sphere2 = sphere.clone();
    const sphere3 = sphere.clone();

    var target = new THREE.Vector3(); // create once an reuse it
    window.cube_1.getWorldPosition(target);
    sphere1.position.copy(target)
    window.GUN.add(sphere1)
    window.cube_1 = sphere1;

    var target = new THREE.Vector3(); // create once an reuse it
    window.cube_2.getWorldPosition(target);
    sphere2.position.copy(target)
    window.GUN.add(sphere2)
    window.cube_2 = sphere2;

    var target = new THREE.Vector3(); // create once an reuse it
    window.cube_3.getWorldPosition(target);
    sphere3.position.copy(target)
    window.GUN.add(sphere3)
    window.cube_3 = sphere3;
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
    window.EXIT_DOOR = door;
    window.MAIN_SCENE.add(door);

    door.traverse(child => {

        child.userData.wall = true;
        child.userData.ground = false;
        child.userData.ceiling = false;

        if (child.isBone) {
            if (child.name == "portal_door_right_04") {
                child.scale.set(0, 0, 0);
                window.exit_door_right = child;
            } else if (child.name == "portal_door_left_06") {
                child.scale.set(0, 0, 0);
                window.exit_door_left = child;
            }
        }

        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
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
    window.ENTER_DOOR = door;
    window.MAIN_SCENE.add(door);

    //
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        side: 2,
        visible: false
    });
    const plane = new THREE.Mesh(geometry, material);
    window.planeEnterDoor = plane;
    door.add(plane);

    door.traverse(child => {

        child.userData.wall = true;
        child.userData.ground = false;
        child.userData.ceiling = false;

        if (child.isBone) {
            if (child.name == "portal_door_right_04") {
                child.scale.set(0, 0, 0);
                window.enter_door_right = child;
            } else if (child.name == "portal_door_left_06") {
                child.scale.set(0, 0, 0);
                window.enter_door_left = child;
            } else if (child.name == "central_spinner_right_05") {
                window.enter_door_right_spinner = child;
            } else if (child.name == "central_spinner_left_07") {
                window.enter_door_left_spinner = child;
            }
        }

        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
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
            child.material.envMap = window.ENV_MAP_FPS;

            if (child.material.name == "lambert5") {

                child.material = new THREE.MeshBasicMaterial()
                window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
            }
        }
    });

    window.CORRIDOR_ENTER = corridor;
    window.CORRIDOR_ENTER.name = "corridorEnter";
    window.ENTER_DOOR.add(window.CORRIDOR_ENTER);
    loadCorridorExit(scene);
}

function loadCorridorExit(scene) {

    var corridor = scene.clone();

    corridor.position.z = -0.99;
    corridor.visible = false;

    corridor.traverse(child => {
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;

            if (child.material.name == "lambert5") {
                child.material = new THREE.MeshBasicMaterial()
                window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
            }
        }
    });

    window.CORRIDOR_EXIT = corridor;
    window.CORRIDOR_EXIT.name = "corridorExit";
    window.CORRIDOR_EXIT.getObjectByName("spawn").material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0
    })
    window.CORRIDOR_EXIT.getObjectByName("spawn").name = "completed";
    window.EXIT_DOOR.add(window.CORRIDOR_EXIT);
    loadPortalCube()
}

function loadPortalCube() {
    handleZip('./assets/3ds/portal_cube.zip', "loadPortalCube");
}

function loadPortalCubeManager(scene) {
    scene.name = "cube";
    scene.renderOrder = 3;
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.2;
        }

        if (child.name.includes("bloom")) {
            //window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
        }
    })
    loadPortalSphere()
}

function loadPortalSphere() {
    handleZip('./assets/3ds/portal_sphere.zip', "loadPortalSphere");
}

function loadPortalSphereManager(scene) {
    scene.name = "sphere";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    window.ITEMS.add(scene);

    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
            child.material.roughness = 0.2;

            //child.material.depthTest = false;
            //child.material.transparent = true;
        }
    })
    loadHalfWindow()
}

function loadHalfWindow() {
    //HALF WINDOW IMG
    loader.load('/3ds/WINDOW_HALF_IMG.glb', (gltf) => {
        gltf.scene.name = "observation_room";
        gltf.scene.userData.wall = true;
        gltf.scene.userData.ground = false;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);
        //HALF WINDOW
        loader.load('/3ds/window_half.glb', (gltf2) => {
            gltf2.scene.traverse(child => {
                child.receiveShadow = true;
                child.castShadow = true;
                if (child.material) {
                    //child.material.envMap = window.ENV_MAP_FPS;
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
                    gltf2.scene.add(light);
                    //console.log(light)
                    //window.room_light = child;
                    //window.lightRoom = light;
                }

                if (child.name.includes("vidro")) {
                    child.renderOrder = -1;
                }
            })

            gltf2.scene.position.y = -1;
            gltf2.scene.visible = false;

            gltf.scene.add(gltf2.scene);
        })
    })
    loadDispenser()
}

function loadDispenser() {
    handleZip('./assets/3ds/cube_dispenser.zip', "loadDispenser");
}

function loadDispenserManager(scene) {
    scene.name = "dispenser";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
        }
    })

    loadPedestalButton()
}

function loadPedestalButton() {
    handleZip('./assets/3ds/pedestal_button.zip', "loadPedestalButton");
}

function loadPedestalButtonManager(scene) {
    scene.name = "pedestal_button";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    scene.userData.trigger = true;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
        }
    })

    loadButtonSphere()
}

function loadButtonSphere() {
    handleZip('./assets/3ds/button_sphere.zip', "loadButtonSphere");
}

function loadButtonSphereManager(scene) {
    scene.name = "button_circle";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    scene.userData.trigger = true;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
        }
    })

    loadButtonCube()
}

function loadButtonCube() {
    handleZip('./assets/3ds/button_cube.zip', "loadButtonCube");
}

function loadButtonCubeManager(scene) {
    console.log(scene)
    scene.name = "button_box";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    scene.userData.trigger = true;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
        }
    })
    loadButtonWeight()
}

function loadButtonWeight() {
    handleZip('./assets/3ds/button_weight.zip', "loadButtonWeight");
}

function loadButtonWeightManager(scene) {
    scene.name = "button_weight";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    scene.userData.trigger = true;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
        }
    })

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
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
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
    scene.name = "radio";
    scene.userData.wall = false;
    scene.userData.ground = true;
    scene.userData.ceiling = false;
    window.ITEMS.add(scene);
    scene.traverse(child => {
        child.receiveShadow = true;
        child.castShadow = true;
        if (child.material) {
            child.material.envMap = window.ENV_MAP_FPS;
            child.material.envMapIntensity = 0.5;
        }
    })

    $("#loading-parent").css("opacity", 0);
    $("#loading-parent").css("pointer-events", "none");
}

export {
    loadCube
};