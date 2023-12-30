import $ from 'jquery';
import "./Variables.js";
import "./components/materials/Materials.js"
import "./components/ui/UI.js";
import * as physics from './Physics.js';
import * as THREE from 'three';
import {
    TWEEN
} from './Tween.js';
import {
    Lights
} from './components/lights/Lights.js';
import {
    cubeState
} from './components/cubeManager/CubeManager.js';
import {
    raycastSelected
} from './components/boxSelection/BoxSelection.js';
import {
    animateShader
} from "./components/shaders/AnimateShaders.js"
import {
    updatePlayer
} from './components/fps/Fps.js';
import {
    loadCube
} from './components/loadObj/LoaderOBJ.js';
import CannonDebugger from 'cannon-es-debugger';
import {
    updateRay,
    recreateRay
} from './components/ray/Ray.js';
import './components/test/Test.js';
import {
    itemUpdate,
    addItem,
    hoverItem
} from './components/items/Items.js';
import Stats from "stats-gl";
import "./components/menuShader/MenuShader.js";
import {
    renderGoo
} from './components/goo/Goo.js';
import {
    updateEvents
} from './components/events/events.js';
import {
    recallRay
} from './components/recall/recall.js';
import {
    loadMaterials
} from "./components/materials/Materials.js";
import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';
import {
    updateGels,
    initGels
} from './components/gels/Gels.js';
import {
    GLOBALS
} from './Globals.js';
import {
    animateSonar
} from './usePostRender.js';


//VARIABLES
var debugColision = true;
var raycaster = new THREE.Raycaster();
let pmremGenerator, currentRenderTarget;
let timeTarget = 0;
var justClicked = false;
// create a new Stats object
let mainContainer = document.createElement('div');
mainContainer.id = 'main-container';
document.body.appendChild(mainContainer);

GLOBALS.STATS = new Stats({
    logsPerSecond: 20,
    samplesLog: 100,
    samplesGraph: 10,
    precision: 2,
    horizontal: true,
    minimal: false,
    mode: 0
});
mainContainer.appendChild(GLOBALS.STATS.container);
GLOBALS.STATS.init(GLOBALS.RENDERER.domElement);
//
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
});
GLOBALS.ITEM_CUBE = new THREE.Mesh(geometry, material);
GLOBALS.ITEM_CUBE.visible = false;
GLOBALS.ITEM_CUBE.name = "ITEM_CUBE";

document.getElementById("container").appendChild(GLOBALS.RENDERER.domElement);

init();
$("body").on('click', '#option-community-build, #option-single-load', function () { //
    setTimeout(() => {
        init();
    }, 2000);
});
//
function init() {
    // SCENE
    GLOBALS.ROOM.name = "ROOM";
    GLOBALS.ITEMS_ADDED.name = "ITEMS";
    GLOBALS.CUBES.name = "CUBES";
    GLOBALS.SCENE.add(GLOBALS.ROOM);
    GLOBALS.SCENE.add(GLOBALS.ITEMS_ADDED);
    GLOBALS.ROOM.add(GLOBALS.CUBES);
    GLOBALS.SCENE.add(GLOBALS.ITEM_CUBE);

    console.log(GLOBALS.SCENE)
    // CAMERA
    GLOBALS.SCENE.add(GLOBALS.MAIN_CAMERA);
    //LIGHT GROUP
    GLOBALS.LIGHT_GROUP = new Lights(THREE);
    GLOBALS.LIGHT_GROUP.name = "LIGHT_GROUP";
    GLOBALS.SCENE.add(GLOBALS.LIGHT_GROUP);
    //HDR
    pmremGenerator = new THREE.PMREMGenerator(GLOBALS.RENDERER);
    const environment = new RoomEnvironment(GLOBALS.RENDERER);

    var envMap = pmremGenerator.fromScene(environment).texture;
    GLOBALS.SCENE.environment = envMap
    GLOBALS.ENV_MAP = envMap;

    envMap.dispose();
    pmremGenerator.dispose();
    //
    loadCube();
    loadMaterials();
    initGels();
    //LISTENER
    window.addEventListener('resize', onWindowResize);
    document.getElementById("container").addEventListener('pointerdown', onDocumentMouseDown, false);
    document.getElementById("container").addEventListener('pointermove', onDocumentMouseMove, false);
    document.getElementById("container").addEventListener('pointerup', onDocumentMouseUp, false);

    recreateRay();
}

$(document).on('keypress', function (event) {
    if (!GLOBALS.FPS_MODE) {
        if (event.keyCode === 45 && !justClicked) { // minus
            cubeState("minus");
        } else if ((event.keyCode === 43 || event.keyCode === 61) && !justClicked) { // plus
            cubeState("plus");
        }
        if (!justClicked) {
            justClicked = true;
            setTimeout(() => {
                justClicked = false;
            }, 100);
        }
        animate();
    }
});

function onDocumentMouseDown(event) {
    if (!GLOBALS.FPS_MODE) {
        raycastManager(event, "down");
        animate();
    }
}

function onDocumentMouseMove(event) {
    if (!GLOBALS.FPS_MODE) {
        mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycastManager(event, "move");
        animate()
    }
}

function onDocumentMouseUp(event) {
    if (!GLOBALS.FPS_MODE) {
        GLOBALS.SELECTED_SIDE = null;
        GLOBALS.SELECTING = false;
        GLOBALS.CONTROLS.enabled = true;
        GLOBALS.CONTROLS.update();

        if (GLOBALS.ITEM_HOLDED_NAME || GLOBALS.CONNECTING) {
            raycastManager(event, "up");
        }

        GLOBALS.ITEM_HOLDED_NAME = null;
        $("#follow").css("display", "none");

        if (GLOBALS.SELECTED) {
            if (!GLOBALS.SELECTED.userData.hasItem)
                GLOBALS.ITEM_CUBE.visible = false;
        } else {
            GLOBALS.ITEM_CUBE.visible = false;
        }

        animate();
    }
}

const mouse2 = new THREE.Vector2(1, 1);

function raycastManager(event, type) {
    if (!GLOBALS.FPS_MODE && GLOBALS.PLANE_LEVEL_INSTANCED) {

        raycaster.setFromCamera(mouse2, GLOBALS.MAIN_CAMERA);
        const intersection = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

        if (intersection.length > 0) {

            const color = new THREE.Color();

            const instanceId = intersection[0].instanceId;
            GLOBALS.PLANE_LEVEL_INSTANCED.getColorAt(instanceId, color);

            if (type == "move" && GLOBALS.SELECTING) {

                raycastSelected(intersection[0], event, type)

            } else if (type == "down") {

                GLOBALS.SELECTING = true;
                GLOBALS.CONTROLS.enabled = false;

                GLOBALS.PLANE_USER_DATA[instanceId].selected = true;
                GLOBALS.SELECTED_SIDE = GLOBALS.PLANE_USER_DATA[instanceId].side;
                raycastSelected(intersection[0], event, type)
            }

            if (type == "up") {
                if (intersection.length > 0)
                    addItem(intersection, false);
            }

            if (GLOBALS.ITEM_HOLDED_NAME) {

                $("#follow").css("display", "block");
                $("#follow").css({
                    left: event.pageX - 25,
                    top: event.pageY - 25
                });

                //itemUpdate(found, event, type);
                hoverItem(intersection);
            }
        }
    }
}

function onWindowResize() {
    GLOBALS.RENDERER.setSize(window.innerWidth, window.innerHeight);

    GLOBALS.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();
}

const cannonDebugger = new CannonDebugger(GLOBALS.SCENE, GLOBALS.CANNON_WORLD, {
    onInit(body, mesh) {
        mesh.visible = false;
        $("body").on('input', '#debug-input', function () {
            debugColision = this.checked;
            mesh.visible = this.checked;
        })
    }
})
//SCENE FPS
let clock = new THREE.Clock();
let clock2 = new THREE.Clock();
let clock3 = new THREE.Clock();
let delta = 0;
let delta2 = 0;


let clockPortal = new THREE.Clock();
let deltaPortal = 0;

function animate(time) {

    if (GLOBALS.FPS_MODE) {
        requestAnimationFrame(animate);
    }

    if (!GLOBALS.FPS_MODE) {
        GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);
    } else if (!GLOBALS.PAUSED) {

        delta += clock.getDelta();

        if (!GLOBALS.STOP_TIME) {
            if (GLOBALS.FPS_UNLOCKED) {
                render(time);
            } else {
                if (delta > GLOBALS.INTERVAL) {
                    // The draw or time dependent code are here
                    render(time);
                    delta = delta % GLOBALS.INTERVAL;
                }
            }
        } else {
            animatePortal();
            recallRay();
            animateSonar();
        }

        delta2 += clock3.getDelta();

        if (delta2 > 1 / 60) {
            // The draw or time dependent code are here
            fixedUpdate();
            delta2 = delta2 % 60;
        }
    }
}

function fixedUpdate() { //60 fps always for physics
    const deltaTime = clock2.getDelta();
    updatePlayer(deltaTime);

    if (Date.now() >= timeTarget && !GLOBALS.STOP_TIME) {

        const timeStep = (1 / 60);
        GLOBALS.CANNON_WORLD.step(timeStep)
        timeTarget += 1000 / GLOBALS.PHYSICS_UPDATEPERSEC_LIMIT
        if (Date.now() >= timeTarget) {
            timeTarget = Date.now()
        }
    }
}

const STEPS_PER_FRAME = 1;

function render(time) {

    GLOBALS.STATS.begin();
    animatePortal();
    updateRay();
    animateShader();
    renderGoo();
    updateEvents();
    TWEEN.update();


    if (GLOBALS.HOLDING_ITEM) {
        var target = new THREE.Vector3(); // create once an reuse it
        GLOBALS.MAIN_CAMERA.getObjectByName("cubeHolder").getWorldPosition(target);

        var x = target.x;
        var y = target.y;
        var z = target.z;
        var item = new THREE.Object3D();

        item.position.copy(new THREE.Vector3(x, y, z));
        item.rotation.copy(GLOBALS.MAIN_CAMERA.rotation);

        GLOBALS.CURRENT_ITEM.position.copy(item.position);
        GLOBALS.CURRENT_ITEM.rotation.copy(item.rotation);

        item.updateMatrix();
        GLOBALS.CURRENT_INSTANCED.setMatrixAt(GLOBALS.CURRENT_ITEM_ID, item.matrix)
        GLOBALS.CURRENT_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.CURRENT_INSTANCED.computeBoundingSphere();

        if (recordingPosition && !GLOBALS.CURRENT_ITEM.body.recall) {
            GLOBALS.CURRENT_ITEM.body.arrayPos.push(item.position.clone())
            GLOBALS.CURRENT_ITEM.body.arrayRot.push(item.quaternion.clone())
        }
    }

    for (const property in GLOBALS.DYMANIC_ITEMS) {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(property);

        if (property == "gel_gun_blue" || property == "gel_gun_orange" || property == "gel_gun_white" ||
            property == "pedestal_button" || property == "button_weight" || property == "button_box" ||
            property == "button_circle" || property == "dispenser" || property == "ramp" ||
            property == "ramp_half" || property == "ramp_half2" || property == "stairs" ||
            property == "light_bridge" | property == "tractor_beam" || property == "laser_emitter" ||
            property == "door" || property == "light" || property == "stripe" || property == "gel_blue" ||
            property == "gel_orange")
            continue;

        for (var i = 0; i < GLOBALS.DYMANIC_ITEMS[property].length; i++) {

            if (GLOBALS.DYMANIC_ITEMS[property][i].length != 0) {

                if (i == GLOBALS.CURRENT_ITEM_ID) {
                    if (GLOBALS.CURRENT_INSTANCED.name == property)
                        continue;
                }

                var item = new THREE.Object3D();
                item.position.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.position);
                item.quaternion.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.quaternion);

                if (GLOBALS.DYMANIC_ITEMS[property][i].body.arrayPos) {
                    if (recordingPosition && !GLOBALS.DYMANIC_ITEMS[property][i].body.recall) {
                        if (!GLOBALS.DYMANIC_ITEMS[property][i].body.sleeping || GLOBALS.DYMANIC_ITEMS[property][i].body.inTractor) {
                            GLOBALS.DYMANIC_ITEMS[property][i].body.arrayPos.push(item.position.clone())
                            GLOBALS.DYMANIC_ITEMS[property][i].body.arrayRot.push(item.quaternion.clone())
                        }
                    }
                }


                item.updateMatrix();
                instanced.setMatrixAt(i, item.matrix)
                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();
            }

        }
    }

    updateGels();

    if (recordingPosition) {
        recordingPosition = false;
        setTimeout(() => {
            recordingPosition = true;
        }, 10);
    }

    for (var i = 0; i < GLOBALS.CAMERA_OBJ_HORIZONTAL.length; i++) {
        GLOBALS.CAMERA_OBJ_HORIZONTAL[i].lookAt(GLOBALS.MAIN_CAMERA.position);
        GLOBALS.CAMERA_OBJ_HORIZONTAL[i].rotation.x = Math.PI / 2;
        GLOBALS.CAMERA_OBJ_HORIZONTAL[i].rotation.y = 0;
    }

    for (var i = 0; i < GLOBALS.CAMERA_OBJ_VERTICAL.length; i++) {
        GLOBALS.CAMERA_OBJ_VERTICAL[i].lookAt(GLOBALS.MAIN_CAMERA.position);
        GLOBALS.CAMERA_OBJ_VERTICAL[i].rotation.z = 0;
        GLOBALS.CAMERA_OBJ_VERTICAL[i].rotation.y = 0;
    }

    if (debugColision)
        cannonDebugger.update();

    // finally, render to screen
    GLOBALS.RENDERER.setRenderTarget(currentRenderTarget);
    GLOBALS.RENDERER.localClippingEnabled = false
    GLOBALS.RENDERER.clippingPlanes = []
    GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);

    GLOBALS.STATS.end();
}

function tweenCamera(duration, ini, final) {
    new TWEEN.Tween(ini).to(final, duration)
        //.easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

var recordingPosition = true;

var deltaPortalRecursive = 0;
var clockPortalRecursive = new THREE.Clock();
var renderRecursive = true;

function animatePortal() {

    const currentShadowAutoUpdate = GLOBALS.RENDERER.shadowMap.autoUpdate;
    GLOBALS.RENDERER.shadowMap.autoUpdate = false;
    currentRenderTarget = GLOBALS.RENDERER.getRenderTarget();
    GLOBALS.RENDERER.xr.enabled = false;

    // stencil optimization - only render parts of scene multiple
    GLOBALS.RENDERER.autoClear = true
    // times when it is going to be viewed by the portal
    GLOBALS.RENDERER.autoClearStencil = false;

    GLOBALS.GUN.children[0].children[0].scale.set(1, 1, 1)
    GLOBALS.GUN.children[0].children[0].position.set(0.12, -0.14, -0.13);

    deltaPortal += clockPortal.getDelta();

    if (deltaPortal > 1 / 10) {
        // The draw or time dependent code are here
        renderPortal2(0, 1)
        renderPortal2(1, 0)
        deltaPortal = deltaPortal % 10;
    }

    GLOBALS.RENDERER.autoClear = false;

    GLOBALS.GUN.children[0].children[0].scale.set(0.1, 0.1, 0.1)
    GLOBALS.GUN.children[0].children[0].position.set(0.01, -0.012, -0.011);

    if (GLOBALS.PORTALS[0] === null && GLOBALS.PORTALS[1] !== null) {
        GLOBALS.PORTALS[1].mesh.visible = false
    }
    if (GLOBALS.PORTALS[0] !== null && GLOBALS.PORTALS[1] === null) {
        GLOBALS.PORTALS[0].mesh.visible = false
    }
    if (GLOBALS.PORTALS[0] !== null && GLOBALS.PORTALS[1] !== null) {
        GLOBALS.PORTALS[0].mesh.visible = true
        GLOBALS.PORTALS[1].mesh.visible = true
    }

    GLOBALS.RENDERER.shadowMap.autoUpdate = currentShadowAutoUpdate;
}

// Render loop
function renderPortal2(thisIndex, pairIndex) {

    if (GLOBALS.PORTALS[thisIndex] === null || GLOBALS.PORTALS[pairIndex] === null)
        return

    let portalCamera = GLOBALS.MAIN_CAMERA.clone()

    // ensure that uniforms and render target are correctly sized
    const {
        width,
        height
    } = GLOBALS.RENDERER.domElement

    GLOBALS.PORTALS[thisIndex].mesh.material.uniforms.ww.value = width
    GLOBALS.PORTALS[thisIndex].mesh.material.uniforms.wh.value = height
    GLOBALS.PORTAL_TARGETS[thisIndex].setSize(width, height)
    GLOBALS.PORTAL_TMP_TARGETS[thisIndex].setSize(width, height)

    let shouldRender = new Array(GLOBALS.PORTAL_RECURSION_LEVELS + 1)
    shouldRender[0] = portalIsVisibleInCamera(GLOBALS.MAIN_CAMERA, GLOBALS.PORTALS[thisIndex], null)
    for (let i = 0; i < GLOBALS.PORTAL_RECURSION_LEVELS; i++) {
        shouldRender[i + 1] = portalIsVisibleInCamera(portalCamera, GLOBALS.PORTALS[thisIndex], GLOBALS.PORTALS[pairIndex].plane) && shouldRender[i]
        //shouldRender[i + 1] = shouldRender[i]
        teleportObject3D(GLOBALS.PORTALS[thisIndex], portalCamera)
    }

    // hide the portal for the farthest iteration - texture is currently garbage
    if (GLOBALS.MOBILE) {
        GLOBALS.PORTALS[thisIndex].mesh.visible = false
        GLOBALS.PORTALS[pairIndex].mesh.visible = false
    } else {
        GLOBALS.PORTALS[thisIndex].visible = false
        GLOBALS.PORTALS[pairIndex].visible = false
    }
    GLOBALS.RENDERER.localClippingEnabled = true

    for (let level = GLOBALS.PORTAL_RECURSION_LEVELS - 1; level >= 0; level--) {

        if (level > 0 && !renderRecursive) {
            break;
        }

        if (!shouldRender[level]) {
            teleportObject3D(GLOBALS.PORTALS[pairIndex], portalCamera)
            continue
        }
        // necessary so that we properly render recursion (otherwise the other portal might block)
        GLOBALS.RENDERER.clippingPlanes = [GLOBALS.PORTALS[pairIndex].plane.clone()]
        GLOBALS.RENDERER.setRenderTarget(GLOBALS.PORTAL_TMP_TARGETS[thisIndex])
        GLOBALS.RENDERER.render(GLOBALS.SCENE, portalCamera)

        // need to do the swap operation:
        // https://stackoverflow.com/questions/54048816/how-to-switch-the-texture-of-render-target-in-three-js
        // cannot render to texture while also using texture, so have to create another temp render target
        let swap = GLOBALS.PORTAL_TARGETS[thisIndex]
        GLOBALS.PORTAL_TARGETS[thisIndex] = GLOBALS.PORTAL_TMP_TARGETS[thisIndex]
        GLOBALS.PORTAL_TMP_TARGETS[thisIndex] = swap
        GLOBALS.PORTALS[thisIndex].mesh.material.uniforms.texture1.value = GLOBALS.PORTAL_TARGETS[thisIndex].texture

        teleportObject3D(GLOBALS.PORTALS[pairIndex], portalCamera)

        // show this portal to itself on subsequent iterations
        GLOBALS.PORTALS[thisIndex].visible = true
    }

    if (GLOBALS.MOBILE) {
        GLOBALS.PORTALS[thisIndex].mesh.visible = true
        GLOBALS.PORTALS[pairIndex].mesh.visible = true
    } else {
        GLOBALS.PORTALS[thisIndex].visible = true
        GLOBALS.PORTALS[pairIndex].visible = true
    }

    GLOBALS.PORTALS[thisIndex].mesh.material.stencilWrite = false
}

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(obj1, obj2) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = obj1.CDBB.inverse_t.clone().premultiply(f).premultiply(obj1.output.CDBB.t)
    obj2.applyMatrix4(m)
}

let frustum = new THREE.Frustum();

function portalIsVisibleInCamera(camera, portal, clippingPlane) {


    camera.updateMatrix();
    camera.updateMatrixWorld();

    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    // in frustum,
    // in front of clipping plane,
    // camera is in front of the portal
    return frustum.intersectsObject(portal.mesh) &&
        (clippingPlane === null || clippingPlane.distanceToPoint(portal.mesh.position) > 0) &&
        portal.plane.distanceToPoint(camera.position) > 0;
    //&& portal.plane.distanceToPoint(camera.position) < 4;
}

export {
    tweenCamera,
    animate
};