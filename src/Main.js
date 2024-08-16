import "./components/materials/Materials.js";
import "./components/ui/UI.js";
import "./components/ui/EditorInteractions.js";
import "./Utils.js";
import {
    updatePhysics
} from './Physics.js';
import {
    BoxGeometry,
    MeshBasicMaterial,
    Mesh,
    PMREMGenerator,
    Clock,
    Matrix4,
    Frustum,
    Vector3,
    GridHelper,
    Quaternion
} from 'three';
import {
    TWEEN
} from './Tween.js';
import {
    Lights
} from './components/lights/Lights.js';
import {
    animateShader
} from "./components/shaders/AnimateShaders.js"
import {
    updatePlayer,
    updateCamera
} from './components/fps/Fps.js';
import {
    loadCube
} from './components/loadObj/LoaderOBJ.js';
import {
    updateRay,
    recreateRay
} from './components/ray/Ray.js';
import './components/test/Test.js';
import Stats from "stats-gl";
import "./components/mainMenu/MainMenu.js";
import {
    renderGoo
} from './components/goo/Goo.js';
import {
    updateEvents
} from './components/events/events.js';
import {
    loadMaterials
} from "./components/materials/Materials.js";
import {
    RoomEnvironment
} from 'three/addons/environments/RoomEnvironment.js';
import './components/gels/Gels.js';
import {
    GLOBALS
} from './Globals.js';
import { teleportationState } from './components/portal/Teleportation.js';
import { hideMaterial } from "./Utils.js";

//VARIABLES
var angleHolder = 0;
let pmremGenerator, currentRenderTarget;
let timeTarget = 0;
//SCENE FPS
let clock2 = new Clock();
let clockPortal = new Clock();
let deltaPortal = 0;
let frames = 0, prevTime = performance.now();
var fps = 0;
let cloneVisible;
let frustum = new Frustum();

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
GLOBALS.STATS.container.style.display = "none";
//
const geometry = new BoxGeometry(2, 2, 2);
const material = new MeshBasicMaterial({
    color: 0x00ff00
});
GLOBALS.ITEM_CUBE = new Mesh(geometry, material);
GLOBALS.ITEM_CUBE.visible = false;
GLOBALS.ITEM_CUBE.name = "ITEM_CUBE";

document.getElementById("container").appendChild(GLOBALS.RENDERER.domElement);
//
function init() {
    // SCENE
    GLOBALS.ROOM.name = "ROOM";
    GLOBALS.ITEMS_ADDED.name = "ITEMS";
    GLOBALS.CUBES.name = "CUBES";
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.ROOM);
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.ITEMS_ADDED);
    GLOBALS.ROOM.add(GLOBALS.CUBES);
    GLOBALS.SCENE_CHILDREN.add(GLOBALS.ITEM_CUBE);
    // CAMERA
    GLOBALS.SCENE.add(GLOBALS.MAIN_CAMERA_GROUP);
    GLOBALS.MAIN_CAMERA_GROUP.add(GLOBALS.MAIN_CAMERA);
    GLOBALS.PIVOT = GLOBALS.MAIN_CAMERA;
    //LIGHT GROUP
    GLOBALS.LIGHT_GROUP = new Lights();
    GLOBALS.LIGHT_GROUP.name = "LIGHT_GROUP";
    //GLOBALS.SCENE_CHILDREN.add(GLOBALS.LIGHT_GROUP);
    //HDR
    pmremGenerator = new PMREMGenerator(GLOBALS.RENDERER);
    const environment = new RoomEnvironment(GLOBALS.RENDERER);

    var envMap = pmremGenerator.fromScene(environment).texture;
    GLOBALS.SCENE.environment = envMap
    GLOBALS.ENV_MAP = envMap;

    envMap.dispose();
    pmremGenerator.dispose();
    //
    loadCube();
    loadMaterials();
    //initGels();
    //LISTENER
    window.addEventListener('resize', onWindowResize);
    recreateRay();
}

function onWindowResize() {
    GLOBALS.RENDERER.setSize(window.innerWidth, window.innerHeight);

    GLOBALS.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    GLOBALS.MAIN_CAMERA.updateProjectionMatrix();

    if (GLOBALS.COMPOSER)
        GLOBALS.COMPOSER.setSize(window.innerWidth, window.innerHeight);
}

GLOBALS.RENDERER.info.autoReset = true;

function animate(time) {

    if (GLOBALS.FPS_MODE) {
        requestAnimationFrame(animate);
    }

    if (!GLOBALS.FPS_MODE) {
        //GLOBALS.COMPOSER.render();
        GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);
        TWEEN.update();
        document.getElementById("drawcalls").innerHTML = "Drawcalls: " + GLOBALS.RENDERER.info.render.calls;
    } else if (!GLOBALS.PAUSED) {
        render(time);
    }
}

function fixedUpdate() { //60 fps always for physics

    frames++;
    const time2 = performance.now();

    if (time2 >= prevTime + 100) {
        fps = Math.round((frames * 100) / (time2 - prevTime)) * 10;
        frames = 0;
        prevTime = time2;
    }

    const deltaTime = clock2.getDelta();
    if (fps > 15) {//IF FPS IS LOWER THAN 15, AVOID THE PLAYER TO CONTROL THE CHARACTER TO AVOID PHYSICS ERRORS
        updatePlayer(deltaTime);
        updateRay(deltaTime);
    }

    if (Date.now() >= timeTarget && !GLOBALS.STOP_TIME) {

        const timeStep = (1 / 60);
        GLOBALS.CANNON_WORLD.step(timeStep)
        timeTarget += 1000 / GLOBALS.PHYSICS_UPDATEPERSEC_LIMIT
        if (Date.now() >= timeTarget) {
            timeTarget = Date.now()
        }
    }
}

var updatingShadowMap = false;
var statsBegin = false;

function render(time) {

    //
    if (GLOBALS.LEVEL_ENTERED) {
        GLOBALS.STATS.begin();
        statsBegin = true;
    }


    fixedUpdate();
    animateShader();
    renderGoo();
    updatePhysics();
    updateCamera(time);
    teleportationState()
    updateEvents();
    TWEEN.update();
    animatePortal();

    for (var i = 0; i < GLOBALS.CAMERA_OBJ_HORIZONTAL.length; i++) {
        if (GLOBALS.CAMERAS[i].fixed) {
            GLOBALS.CAMERA_OBJ_HORIZONTAL[i].lookAt(GLOBALS.PIVOT.position);
            GLOBALS.CAMERA_OBJ_HORIZONTAL[i].rotation.x = 0;
            GLOBALS.CAMERA_OBJ_HORIZONTAL[i].rotation.y = 0;
        }
    }

    for (var i = 0; i < GLOBALS.CAMERA_OBJ_VERTICAL.length; i++) {
        if (GLOBALS.CAMERAS[i].fixed) {
            GLOBALS.CAMERA_OBJ_VERTICAL[i].lookAt(GLOBALS.PIVOT.position);
            GLOBALS.CAMERA_OBJ_VERTICAL[i].rotation.z = 0;
            GLOBALS.CAMERA_OBJ_VERTICAL[i].rotation.y = 0;
        }
    }

    // finally, render to screen
    GLOBALS.RENDERER.setRenderTarget(currentRenderTarget);
    GLOBALS.RENDERER.localClippingEnabled = false;
    GLOBALS.RENDERER.clippingPlanes = [];

    GLOBALS.COMPOSER.render();
    //GLOBALS.COMPOSER.render(GLOBALS.SCENE, GLOBALS.PORTAL_GUN_CAMERA);
    //GLOBALS.COMPOSER2.render(GLOBALS.SCENE, GLOBALS.PORTAL_GUN_CAMERA);
    /*GLOBALS.RENDERER.autoClear = false;
    GLOBALS.RENDERER.clear();
    GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);
    document.getElementById("drawcalls").innerHTML = "Drawcalls: " + GLOBALS.RENDERER.info.render.calls;
    GLOBALS.RENDERER.clearDepth()
    GLOBALS.RENDERER.render(GLOBALS.GUN, GLOBALS.PORTAL_GUN_CAMERA);*/

    if (statsBegin)
        GLOBALS.STATS.end();
}

function animatePortal() {

    // only show player model when rendering portals
    // don't show the clone model when rendering portals
    cloneVisible = false
    if (GLOBALS.PLAYER && GLOBALS.PLAYER_MODEL) {
        hideMaterial(GLOBALS.PLAYER_MODEL, false, 1);
        cloneVisible = GLOBALS.PLAYER_MODEL_CLONE.visible;
    }

    const currentShadowAutoUpdate = GLOBALS.RENDERER.shadowMap.autoUpdate;
    GLOBALS.RENDERER.shadowMap.autoUpdate = false;
    currentRenderTarget = GLOBALS.RENDERER.getRenderTarget();
    GLOBALS.RENDERER.xr.enabled = false;

    GLOBALS.GUN_CLONE.visible = GLOBALS.PLAYER_MODEL.visible;

    var positionBoneHand = new Vector3();
    window.hand.getWorldPosition(positionBoneHand);

    GLOBALS.GUN_CLONE.position.copy(positionBoneHand);
    GLOBALS.GUN_CLONE.rotation.y = GLOBALS.MAIN_CAMERA.rotation.y;

    //APPLY ROTATION TO THE PORTAL GUN AND PLAYER HAND AND NECK
    const angle = (GLOBALS.MAIN_CAMERA.rotation.x * 180) / Math.PI;
    if (angle > -20 && angle < 30) {
        window.neck.rotation.y = -GLOBALS.MAIN_CAMERA.rotation.x;
        angleHolder = GLOBALS.MAIN_CAMERA.rotation.x;
    } else {
        window.neck.rotation.y = -angleHolder;
    }

    deltaPortal += clockPortal.getDelta();

    // stencil optimization - only render parts of scene multiple
    // times when it is going to be viewed by the portal
    GLOBALS.RENDERER.autoClearStencil = false
    //GLOBALS.RENDERER.autoClear = true;

    if (GLOBALS.PORTAL_RECURSION_LEVELS > 0) {
        renderPortal2(0, 1)
        renderPortal2(1, 0)
    } else {
        if (GLOBALS.PORTALS[0] && GLOBALS.PORTALS[1]) {
            if (GLOBALS.PORTALS[0].portalShader.material.uniforms.iOpened.value == 1) {
                GLOBALS.PORTALS[0].mesh.material.uniforms.texture1.value = null;
                GLOBALS.PORTALS[1].mesh.material.uniforms.texture1.value = null;
                GLOBALS.PORTALS[0].portalShader.material.uniforms.iOpened.value = 0;
                GLOBALS.PORTALS[1].portalShader.material.uniforms.iOpened.value = 0;
            }
        }
    }

    GLOBALS.SCENE_CHILDREN.visible = true;
    //GLOBALS.RENDERER.autoClear = false;

    GLOBALS.GUN_CLONE.visible = false;
    GLOBALS.GUN_CLONE2.visible = cloneVisible;

    if (cloneVisible && GLOBALS.GUN_CLONE2 && window.posW) {
        GLOBALS.GUN_CLONE2.position.copy(window.posW);
        GLOBALS.GUN_CLONE2.quaternion.copy(GLOBALS.PLAYER_MODEL_CLONE.quaternion);
        GLOBALS.GUN_CLONE2.rotation.y += Math.PI;
    }

    if (GLOBALS.PLAYER && GLOBALS.PLAYER_MODEL) {
        hideMaterial(GLOBALS.PLAYER_MODEL, true, 0);
        GLOBALS.PLAYER_MODEL_CLONE.visible = cloneVisible;
    }

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

    var qua = new Quaternion();
    GLOBALS.MAIN_CAMERA.getWorldQuaternion(qua)

    let portalCamera = GLOBALS.MAIN_CAMERA.clone();

    portalCamera.position.copy(GLOBALS.PIVOT.position);
    portalCamera.quaternion.copy(qua);

    // ensure that uniforms and render target are correctly sized
    const {
        width,
        height
    } = GLOBALS.RENDERER.domElement

    GLOBALS.PORTALS[thisIndex].mesh.material.uniforms.ww.value = width
    GLOBALS.PORTALS[thisIndex].mesh.material.uniforms.wh.value = height
    GLOBALS.PORTAL_TARGETS[thisIndex].setSize(width, height)
    GLOBALS.PORTAL_TMP_TARGETS[thisIndex].setSize(width, height)

    GLOBALS.PORTALS[thisIndex].mesh.material.stencilWrite = true;
    GLOBALS.RENDERER.clearStencil();
    GLOBALS.RENDERER.setRenderTarget(null);

    let shouldRender = new Array(GLOBALS.PORTAL_RECURSION_LEVELS + 1)
    shouldRender[0] = portalIsVisibleInCamera(portalCamera, GLOBALS.PORTALS[thisIndex], null)
    for (let i = 0; i < GLOBALS.PORTAL_RECURSION_LEVELS; i++) {
        shouldRender[i + 1] = portalIsVisibleInCamera(portalCamera, GLOBALS.PORTALS[thisIndex], GLOBALS.PORTALS[pairIndex].plane) && shouldRender[i]
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

        if (level == 0) {
            GLOBALS.PLAYER_MODEL_CLONE.visible = false;
            GLOBALS.GUN_CLONE2.visible = false;
        } else {
            GLOBALS.PLAYER_MODEL_CLONE.visible = cloneVisible;
            GLOBALS.GUN_CLONE2.visible = cloneVisible;
        }

        if (level > GLOBALS.PORTAL_RENDER_LEVEL)
            GLOBALS.SCENE_CHILDREN.visible = false;
        else
            GLOBALS.SCENE_CHILDREN.visible = true;

        if (!shouldRender[level]) {
            teleportObject3D(GLOBALS.PORTALS[pairIndex], portalCamera)
            continue
        }
        // necessary so that we properly render recursion (otherwise the other portal might block)
        GLOBALS.RENDERER.clippingPlanes = [GLOBALS.PORTALS[pairIndex].plane.clone()]
        GLOBALS.RENDERER.setRenderTarget(GLOBALS.PORTAL_TMP_TARGETS[thisIndex])
        GLOBALS.RENDERER.clear();
        GLOBALS.RENDERER.render(GLOBALS.SCENE, portalCamera)

        // need to do the swap operation:
        // https://stackoverflow.com/questions/54048816/how-to-switch-the-texture-of-render-target-in-three-js
        // cannot render to texture while also using texture, so have to create another temp render target
        let swap = GLOBALS.PORTAL_TARGETS[thisIndex];
        GLOBALS.PORTAL_TARGETS[thisIndex] = GLOBALS.PORTAL_TMP_TARGETS[thisIndex];
        GLOBALS.PORTAL_TMP_TARGETS[thisIndex] = swap;
        GLOBALS.PORTALS[thisIndex].mesh.material.uniforms.texture1.value = GLOBALS.PORTAL_TARGETS[thisIndex].texture;

        teleportObject3D(GLOBALS.PORTALS[pairIndex], portalCamera);

        // show this portal to itself on subsequent iterations
        GLOBALS.PORTALS[thisIndex].visible = true;
    }

    if (GLOBALS.MOBILE) {
        GLOBALS.PORTALS[thisIndex].mesh.visible = true;
        GLOBALS.PORTALS[pairIndex].mesh.visible = true;
    } else {
        GLOBALS.PORTALS[thisIndex].visible = true;
        GLOBALS.PORTALS[pairIndex].visible = true;
    }

    GLOBALS.PORTALS[thisIndex].mesh.material.stencilWrite = false;
}

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(obj1, obj2) {
    let f = new Matrix4().makeScale(-1, -1, 1)
    let m = obj1.CDBB.inverse_t.clone().premultiply(f).premultiply(obj1.output.CDBB.t)
    obj2.applyMatrix4(m)
}

function portalIsVisibleInCamera(camera, portal, clippingPlane) {

    camera.updateMatrix();
    camera.updateMatrixWorld();

    frustum.setFromProjectionMatrix(new Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    // in frustum,
    // in front of clipping plane,
    // camera is in front of the portal
    return frustum.intersectsObject(portal.mesh) &&
        (clippingPlane === null || clippingPlane.distanceToPoint(portal.mesh.position) > 0) &&
        portal.plane.distanceToPoint(camera.position) > 0;
    //&& portal.plane.distanceToPoint(camera.position) < 4;
}

export {
    animate,
    init
};