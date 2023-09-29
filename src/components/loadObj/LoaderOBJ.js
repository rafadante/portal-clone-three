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

    loader.load('/models/cubes/cube.glb', (gltf) => {

        gltf.scene.userData.isCube = true;

        gltf.scene.traverse(child => {
            if (child.material) {
                if (!window.INVERTED_MATERIAL.map) {
                    window.INVERTED_MATERIAL.map = child.material.map;
                }
            }

            child.userData.isCube = true;
            child.receiveShadow = true;
            child.castShadow = true;
        })

        window.DEFAULT_CUBE = gltf.scene;

        var bb = new THREE.Box3()
        bb.setFromObject(window.CUBES);
        bb.getCenter(window.CONTROLS.target);

        window.CONTROLS.target.set(window.CONTROLS.target.x + 8, window.CONTROLS.target.y + 2, window.CONTROLS.target.z + 6);
        window.MAIN_CAMERA.position.set(-12.2, 17.4, 26.3)
        window.CONTROLS.update();

        loadInvertedCube();
    });
}

function loadInvertedCube() {
    loader.load('/models/cubes/cubeInverted.glb', (gltf) => {

        gltf.scene.userData.isCube = true;

        gltf.scene.traverse(child => {
            child.userData.isCube = true;
            child.receiveShadow = true;
            child.castShadow = true;
        })

        window.INVERTED_CUBE = gltf.scene;
        buildIniCubes(gltf.scene);
        loadWindowIMG()
    });
}

function loadWindowIMG() {
    loader.load('/models/cubes/WINDOW_IMG.glb', (gltf) => {

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
    loader.load('/models/cubes/window.glb', (gltf) => {
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
    var gunBasic = new THREE.MeshBasicMaterial();
    loader.load('/models/hd_portal_gun3.glb', (gltf) => {


        window.GUN = new THREE.Group();
        window.GUN.visible = false;

        var newGroup = new THREE.Group();

        window.GUN.add(newGroup);
        newGroup.add(gltf.scene);

        //window.GUN = gltf.scene;

        gltf.scene.traverse(child => {
            if (child.material) {
                child.receiveShadow = true;
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.4;
            }

            child.renderOrder = -1;

            if (child.name.includes("lightBloom")) {
                child.material = gunBasic;
                //window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
                window.GUN_BLOOM = child.material;

                const light = new THREE.PointLight(0xffffff, 1, 0.1);
                light.position.set(0, 0, 0);
                //child.add(light);
            }

            if (child.name == "lightBloom") {
                window.orbGun = child;
                child.material.visible = false;

                const geometry = new THREE.BoxGeometry(0.01, 0.01, 0.01);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00
                });
                const cube = new THREE.Mesh(geometry, material);

                var target = new THREE.Vector3(); // create once an reuse it
                window.orbGun.getWorldPosition(target);
                cube.position.copy(target);

                window.orbGun.add(cube);
                //window["ddd"]();
            }

            if (child.name == "cube_1")
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
        gltf.scene.position.set(0.12, -0.14, -0.13);
        loadExitDoor()

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
    });
}

function loadExitDoor() {
    loader.load('/doors/open.glb', (gltf) => {
        //EXIT DOOR
        gltf.scene.position.set(13, 1, -0.99)
        gltf.scene.translateZ(1);
        gltf.scene.name = "exitDoor";
        window.EXIT_DOOR = gltf.scene;
        window.MAIN_SCENE.add(gltf.scene);

        gltf.scene.traverse(child => {

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
        loadEnterDoor();
    })
}

function loadEnterDoor() {
    loader.load('/doors/open.glb', (gltf) => {
        //ENTER DOOR
        gltf.scene.name = "enterDoor";
        gltf.scene.rotation.y = Math.PI;
        gltf.scene.position.set(3, 1, 13);
        gltf.scene.translateZ(1);
        window.ENTER_DOOR = gltf.scene;
        window.MAIN_SCENE.add(gltf.scene);

        //
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            side: 2,
            visible: false
        });
        const plane = new THREE.Mesh(geometry, material);
        window.planeEnterDoor = plane;
        gltf.scene.add(plane);

        gltf.scene.traverse(child => {

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
        gltf.scene.getObjectByName("warning").material = new THREE.MeshStandardMaterial();
        var map = new THREE.TextureLoader().load('./assets/enter.jpg');
        map.flipY = false;
        map.encoding = THREE.sRGBEncoding;
        gltf.scene.getObjectByName("warning").material.map = map;
        //
        loadCorridorEnter()
    })
}

function loadCorridorEnter() {
    loader.load('/3ds/corridor.glb', (gltf) => {

        gltf.scene.position.z = -0.99;
        gltf.scene.visible = false;

        gltf.scene.traverse(child => {
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;

                if (child.material.name == "lambert5") {
                    child.material = new THREE.MeshBasicMaterial()
                    window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
                }
            }
        });

        window.CORRIDOR_ENTER = gltf.scene.clone();
        window.CORRIDOR_ENTER.name = "corridorEnter";
        window.ENTER_DOOR.add(window.CORRIDOR_ENTER);
        loadCorridorExit();
    })
}

function loadCorridorExit() {
    loader.load('/3ds/corridor.glb', (gltf) => {

        gltf.scene.position.z = -0.99;
        gltf.scene.visible = false;

        gltf.scene.traverse(child => {
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;

                if (child.material.name == "lambert5") {
                    child.material = new THREE.MeshBasicMaterial()
                    window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
                }
            }
        });

        window.CORRIDOR_EXIT = gltf.scene.clone();
        window.CORRIDOR_EXIT.name = "corridorExit";
        window.CORRIDOR_EXIT.getObjectByName("spawn").material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0
        })
        window.CORRIDOR_EXIT.getObjectByName("spawn").name = "completed";
        window.EXIT_DOOR.add(window.CORRIDOR_EXIT);
        loadPortalCube()
    })
}

function loadPortalCube() {
    //PORTAL CUBE
    loader.load('/models/portal_cube.glb', (gltf) => {
        gltf.scene.name = "cube";
        gltf.scene.renderOrder = 3;
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
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
    })
}

function loadPortalSphere() {
    //SPHERE
    loader.load('/models/portal_sphere.glb', (gltf) => {
        gltf.scene.name = "sphere";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);

        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
                child.material.roughness = 0.2;

                //child.material.depthTest = false;
                //child.material.transparent = true;
            }

            if (child.name.includes("bloom")) {
                //window.SELECTED_OBJECTS_FOR_BLOOM.add(child);
               // child.material.emissive = "blue"
                //child.material.emissiveIntensity = 10
            }
        })
    })
    loadHalfWindow()
}

function loadHalfWindow() {
    //HALF WINDOW IMG
    loader.load('/models/cubes/WINDOW_HALF_IMG.glb', (gltf) => {
        gltf.scene.name = "observation_room";
        gltf.scene.userData.wall = true;
        gltf.scene.userData.ground = false;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);
        //HALF WINDOW
        loader.load('/models/cubes/window_half.glb', (gltf2) => {
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
    //DISPENSER
    loader.load('/models/cube_dispenser.glb', (gltf) => {
        gltf.scene.name = "dispenser";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
            }
        })

        loadPedestalButton()
    })
}

function loadPedestalButton() {
    loader.load('/3ds/pedestal_button.glb', (gltf) => {
        gltf.scene.name = "pedestal_button";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        gltf.scene.userData.trigger = true;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
            }
        })

        loadButtonSphere()
    })
}

function loadButtonSphere() {
    loader.load('/3ds/button_sphere.glb', (gltf) => {
        gltf.scene.name = "button_circle";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        gltf.scene.userData.trigger = true;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
            }
        })

        loadButtonCube()
    })
}

function loadButtonCube() {
    loader.load('/3ds/button_cube.glb', (gltf) => {
        gltf.scene.name = "button_box";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        gltf.scene.userData.trigger = true;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
            }
        })

        loadButtonWeight()
    })
}

function loadButtonWeight() {
    loader.load('/3ds/button_weight.glb', (gltf) => {
        gltf.scene.name = "button_weight";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        gltf.scene.userData.trigger = true;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
            }
        })

        loadCamera()
    })
}

function loadCamera() {
    loader.load('/3ds/camera.glb', (gltf) => {
        gltf.scene.name = "camera";
        gltf.scene.userData.wall = true;
        gltf.scene.userData.ground = false;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
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
    })
}

function loadRadio() {
    loader.load('/3ds/radio.glb', (gltf) => {
        gltf.scene.name = "radio";
        gltf.scene.userData.wall = false;
        gltf.scene.userData.ground = true;
        gltf.scene.userData.ceiling = false;
        window.ITEMS.add(gltf.scene);
        gltf.scene.traverse(child => {
            child.receiveShadow = true;
            child.castShadow = true;
            if (child.material) {
                child.material.envMap = window.ENV_MAP_FPS;
                child.material.envMapIntensity = 0.5;
            }
        })

        $("#loading-parent").css("opacity", 0);
        $("#loading-parent").css("pointer-events", "none");
    })
}

export {
    loadCube
};