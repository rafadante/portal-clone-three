import $ from 'jquery';
import "./Variables.js"
import * as physics from './Physics.js';
import * as THREE from './build/three.module.js';
import {
    OrbitControls
} from './jsm/controls/OrbitControls.js';
import {
    RGBELoader
} from './jsm/loaders/RGBELoader.js';
import {
    TWEEN
} from './jsm/Tween.js';
import {
    Lights
} from './components/lights/Lights.js';
import {
    contactShadowRender,
    contactShadowInit
} from './components/contactShadow/ContactShadow.js';
import {
    cubeState
} from './components/cubeManager/CubeManager.js';
import {
    raycastSelected
} from './components/boxSelection/BoxSelection.js';
import {
    createPortalShader,
    generateMeshPortalShader,
    animatePortalShader
} from './components/portalShader/PortalShader.js';
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
import {
    updateParticles
} from './components/particles/Particles.js';
import './components/test/Test.js';
import {
    itemUpdate,
    addItem,
    hoverItem
} from './components/items/Items.js';
import {
    BloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass,
    Selection,
    BlendFunction,
    EdgeDetectionMode,
    SMAAEffect,
    SMAAImageLoader,
    SMAAPreset,
    ToneMappingEffect,
    ToneMappingMode,
    SelectiveBloomEffect
} from "postprocessing";
import Stats from "stats-gl";
//
//
window.SELECTED_OBJECTS_FOR_BLOOM = new Selection()
window.COMPOSER = new EffectComposer(window.RENDERER);
window.COMPOSER.addPass(new RenderPass(window.MAIN_SCENE, window.MAIN_CAMERA));

//const globalBloom = new EffectPass(window.MAIN_CAMERA, new BloomEffect());
//window.COMPOSER.addPass(globalBloom);

const toneMappingEffect = new ToneMappingEffect({
    mode: ToneMappingMode.ACES_FILMIC,
    resolution: 256,
    whitePoint: 16.0,
    middleGrey: 0.6,
    minLuminance: 0.01,
    averageLuminance: 0.01,
    adaptationRate: 1.0
});

const selectiveBloom = new SelectiveBloomEffect(window.MAIN_SCENE, window.MAIN_CAMERA, {
    intensity: 1.5,
    luminanceThreshold: 0.0001,
    mipmapBlur: true,
    radius: .35
})

selectiveBloom.selection = window.SELECTED_OBJECTS_FOR_BLOOM;

//this.effect = toneMappingEffect;
window.COMPOSER.addPass(new EffectPass(window.MAIN_CAMERA, selectiveBloom, toneMappingEffect));
//VARIABLES
const clickMouse = new THREE.Vector2(); // create once
var mouse = new THREE.Vector2();
var raycaster = new THREE.Raycaster();
let pmremGenerator, currentRenderTarget;
let timeTarget = 0;
var justClicked = false;
window.buttonLeft = false;
//
window.CONTROLS = new OrbitControls(window.MAIN_CAMERA, window.RENDERER.domElement);
window.CONTROLS.minDistance = 5;
window.CONTROLS.maxDistance = 100;
window.CONTROLS.enablePan = true;
//
// create a new Stats object
let mainContainer = document.createElement('div');
mainContainer.id = 'main-container';
document.body.appendChild(mainContainer);

window.STATS = new Stats({
    logsPerSecond: 20,
    samplesLog: 100,
    samplesGraph: 10,
    precision: 2,
    horizontal: true,
    minimal: false,
    mode: 0
});
mainContainer.appendChild(window.STATS.container);
window.STATS.init(window.RENDERER.domElement);
//
const geometry = new THREE.BoxGeometry(2, 2, 2);
const material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    transparent: true,
    opacity: 0.5
});
window.ITEM_CUBE = new THREE.Mesh(geometry, material);
window.ITEM_CUBE.visible = false;
window.ITEM_CUBE.name = "ITEM_CUBE";
window.connecting = false;

init();
//
function init() {
    // SCENE
    window.ROOM.name = "ROOM";
    window.ITEMS_ADDED.name = "ITEMS";
    window.CUBES.name = "CUBES";
    window.MAIN_SCENE.add(window.ROOM);
    window.MAIN_SCENE.add(window.ITEMS_ADDED);
    window.ROOM.add(window.CUBES);
    window.MAIN_SCENE.add(window.ITEM_CUBE);

    console.log(window.MAIN_SCENE)
    //
    contactShadowInit(window.MAIN_SCENE);
    // CAMERA
    window.MAIN_SCENE.add(window.MAIN_CAMERA);
    // RENDERER
    document.getElementById("container").appendChild(window.RENDERER.domElement);
    //
    createPortalShader(window.RENDERER);
    generateMeshPortalShader(window.MAIN_SCENE, window.MAIN_CAMERA, window.RENDERER);
    //LIGHT GROUP
    window.LIGHT_GROUP = new Lights(THREE);
    window.LIGHT_GROUP.name = "LIGHT_GROUP";
    window.MAIN_SCENE.add(window.LIGHT_GROUP);
    //HDR
    pmremGenerator = new THREE.PMREMGenerator(window.RENDERER);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader()
        .setPath('./assets/')
        .load("hdr/photo_studio_01_1k.hdr", function (texture2) {
            var envMap = pmremGenerator.fromEquirectangular(texture2).texture;
            window.ENV_MAP_FPS = envMap;
            window.MAIN_SCENE.environment = envMap;
            texture2.dispose();
            pmremGenerator.dispose();
            //
            loadCube();
            animate();
        })
    //LISTENER
    window.addEventListener('resize', onWindowResize);
    document.getElementById("container").addEventListener('pointerdown', onDocumentMouseDown, false);
    document.getElementById("container").addEventListener('pointermove', onDocumentMouseMove, false);
    document.getElementById("container").addEventListener('pointerup', onDocumentMouseUp, false);

    recreateRay();
}

$(document).on('keypress', function (event) {
    if (!window.FPS) {
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
    }
});

function getIntersects(point, objects) {
    mouse.set((point.x * 2) - 1, -(point.y * 2) + 1);
    raycaster.setFromCamera(mouse, window.MAIN_CAMERA);
    return raycaster.intersectObjects(objects);
}

function getMousePosition(dom, x, y) {
    var rect = dom.getBoundingClientRect();
    return [(x - rect.left) / rect.width, (y - rect.top) / rect.height];
}

function onDocumentMouseDown(event) {
    if (!window.FPS) {
        raycastManager(event, "down");
    }
}

function onDocumentMouseMove(event) {
    if (!window.FPS) {
        raycastManager(event, "move");
    }
}

function onDocumentMouseUp(event) {
    if (!window.FPS) {
        window.SELECTING = false;
        window.CONTROLS.enabled = true;
        window.CONTROLS.update();
        window.buttonLeft = false;
        window.itemSelected = false;

        if (window.ITEM_HOLDED_NAME || window.connecting) {
            raycastManager(event, "up");
        }

        window.ITEM_HOLDED_NAME = null;
        $("#follow").css("display", "none");

        if (window.SELECTED) {
            if (!window.SELECTED.userData.hasItem)
                window.ITEM_CUBE.visible = false;
        } else {
            window.ITEM_CUBE.visible = false;
        }
    }
}

function raycastManager(event, type) {
    if (!window.FPS) {
        var array = getMousePosition(document.getElementById("container"), event.clientX, event.clientY);
        clickMouse.fromArray(array)

        const found = getIntersects(clickMouse, window.CUBES_EDIT, false);

        if (type == "move") {
            if (found.length > 0) {
                for (var i = 0; i < found.length; i++) {
                    if (found[i].object.visible && !window.itemSelected) {

                        if (found[i].object.userData.hasItem) {
                            document.body.style.cursor = "grab";
                        } else {
                            document.body.style.cursor = "crosshair";
                        }
                    }
                }
            } else {
                document.body.style.cursor = "default";
            }
        }

        if (window.SELECTING && type == "move") {
            raycastSelected(found, event, type)
        } else if (type == "down") {

            if (event.button == 0) {
                window.buttonLeft = true;
            }

            raycastSelected(found, event, type)
        }

        if (type == "up") {
            if (found.length > 0)
                addItem(found);
        }

        if (window.ITEM_HOLDED_NAME) {

            $("#follow").css("display", "block");
            $("#follow").css({
                left: event.pageX - 25,
                top: event.pageY - 25
            });

            //itemUpdate(found, event, type);
            hoverItem(found);
        }
    }
}

function onWindowResize() {
    window.RENDERER.setSize(window.innerWidth, window.innerHeight);
    window.COMPOSER.setSize(window.innerWidth, window.innerHeight);

    window.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    window.MAIN_CAMERA.updateProjectionMatrix();
}

const cannonDebugger = new CannonDebugger(window.MAIN_SCENE, window.CANNON_WORLD)

let clock = new THREE.Clock();
let delta = 0;
// 30 fps
let interval = 1 / 30;

function animate(time) {

    window.STATS.begin();

    if (!window.FPS) {
        //contactShadowRender(window.MAIN_SCENE, window.MAIN_CAMERA, window.RENDERER);
        window.RENDERER.render(window.MAIN_SCENE, window.MAIN_CAMERA)
    } else {
        //itemUpdate();
        updateRay();
        animatePortalShader(time, window.MAIN_SCENE, window.MAIN_CAMERA, window.RENDERER)

        delta += clock.getDelta();

        if (delta > interval) {
            // The draw or time dependent code are here
            animatePortal();

            delta = delta % interval;
        }

        window.COMPOSER.render()
        updatePlayer(1 / 30);
        //updateParticles();
        TWEEN.update();

        if (Date.now() >= timeTarget) {
            const timeStep = 1 / 60
            window.CANNON_WORLD.step(timeStep)
            timeTarget += 1000 / window.PHYSICS_UPDATEPERSEC_LIMIT
            if (Date.now() >= timeTarget) {
                timeTarget = Date.now()
            }
        }

        if (window.initLevel) {

            if (window.HOLDING_ITEM) {
                var target = new THREE.Vector3(); // create once an reuse it
                window.holder.getWorldPosition(target);
                //window.CURRENT_ITEM.position.copy(target);

                var x = target.x;
                var y = target.y;
                var z = target.z;

                /*if (window.COL_X)
                x = window.COL_X_POS;
            if (window.COL_Y)
                y = window.COL_Y_POS;
            if (window.COL_Z)
                z = window.COL_Z_POS;*/

                window.CURRENT_ITEM.position.copy(new THREE.Vector3(x, y, z));
                window.CURRENT_ITEM.rotation.copy(window.MAIN_CAMERA.rotation);

                //window.CURRENT_ITEM.rotation.y = window.MAIN_CAMERA.rotation.y;
                //  
                /*window.CURRENT_ITEM.velocity.set(0, 0, 0);
                window.CURRENT_ITEM.angularVelocity.set(0, 0, 0);
                window.CURRENT_ITEM.force.setZero();
                window.CURRENT_ITEM.torque.setZero();*/

                // Position
                //body.position.setZero();
                //body.previousPosition.setZero();
                //body.interpolatedPosition.setZero();
                //body.initPosition.setZero();
            }

            for (var i = 0; i < window.ITEM_BOXES.length; i++) {

                if (window.ITEM_BOXES[i] != window.CURRENT_ITEM) {
                    window.ITEM_BOXES[i].position.copy(window.ITEM_BOXES[i].body.position);
                    window.ITEM_BOXES[i].quaternion.copy(window.ITEM_BOXES[i].body.quaternion);
                }

            }
            for (var i = 0; i < window.ITEM_SPHERES.length; i++) {

                if (window.ITEM_SPHERES[i] != window.CURRENT_ITEM) {
                    window.ITEM_SPHERES[i].position.copy(window.ITEM_SPHERES[i].body.position);
                    window.ITEM_SPHERES[i].quaternion.copy(window.ITEM_SPHERES[i].body.quaternion);
                }
            }
        }

        for (var i = 0; i < window.ITEM_GENERAL.length; i++) {

            if (window.ITEM_GENERAL[i] != window.CURRENT_ITEM) {
                window.ITEM_GENERAL[i].position.copy(window.ITEM_GENERAL[i].body.position);
                window.ITEM_GENERAL[i].quaternion.copy(window.ITEM_GENERAL[i].body.quaternion);

                window.ITEM_GENERAL[i].translateY(-0.15);
            }
        }

        for (var i = 0; i < window.horizontal.length; i++) {
            window.horizontal[i].lookAt(window.GUN.position);
            window.horizontal[i].rotation.x = Math.PI / 2;
            window.horizontal[i].rotation.y = 0;
        }

        for (var i = 0; i < window.vertical.length; i++) {
            window.vertical[i].lookAt(window.GUN.position);
            window.vertical[i].rotation.z = 0;
            window.vertical[i].rotation.y = 0;
        }

        //cannonDebugger.update();
    }

    requestAnimationFrame(animate);

    window.STATS.end();
}

function animatePortal() {

    const currentShadowAutoUpdate = window.RENDERER.shadowMap.autoUpdate;
    window.RENDERER.shadowMap.autoUpdate = false;
    currentRenderTarget = window.RENDERER.getRenderTarget();
    window.RENDERER.xr.enabled = false;

    // save the original camera properties
    /*currentRenderTarget = window.RENDERER.getRenderTarget();
    const currentXrEnabled = window.RENDERER.xr.enabled;
    const currentShadowAutoUpdate = window.RENDERER.shadowMap.autoUpdate;
    window.RENDERER.xr.enabled = false; // Avoid camera modification
    window.RENDERER.shadowMap.autoUpdate = false; // Avoid re-computing shadows

    window.RENDERER.autoClear = true*/

    // stencil optimization - only render parts of scene multiple
    window.RENDERER.autoClear = true
    //window.RENDERER.clear()
    // times when it is going to be viewed by the portal
    window.RENDERER.autoClearStencil = false;
    //window.ambient.intensity = 0;
    renderPortal2(0, 1)
    renderPortal2(1, 0)
    //window.ambient.intensity = 0.15;

    if (window.PORTALS[0] === null && window.PORTALS[1] !== null) {
        window.PORTALS[1].mesh.visible = false
    }
    if (window.PORTALS[0] !== null && window.PORTALS[1] === null) {
        window.PORTALS[0].mesh.visible = false
    }
    if (window.PORTALS[0] !== null && window.PORTALS[1] !== null) {
        window.PORTALS[0].mesh.visible = true
        window.PORTALS[1].mesh.visible = true
    }

    // finally, render to screen
    /*window.RENDERER.setRenderTarget(currentRenderTarget);
    window.RENDERER.localClippingEnabled = false
    window.RENDERER.clippingPlanes = []
    // restore the original rendering properties
    window.RENDERER.xr.enabled = currentXrEnabled;
    window.RENDERER.shadowMap.autoUpdate = currentShadowAutoUpdate;
    window.RENDERER.render(window.MAIN_SCENE, window.MAIN_CAMERA)*/

    window.RENDERER.shadowMap.autoUpdate = currentShadowAutoUpdate;

    // finally, render to screen
    //window.RENDERER.setRenderTarget(null)
    window.RENDERER.setRenderTarget(currentRenderTarget);
    window.RENDERER.localClippingEnabled = false
    window.RENDERER.clippingPlanes = []
    //window.RENDERER.render(window.MAIN_SCENE, window.MAIN_CAMERA)
    //window.COMPOSER.render()

    /*window.PORTAL_TARGETS[0].dispose();
    window.PORTAL_TARGETS[1].dispose();

    window.PORTAL_TMP_TARGETS[0].dispose();
    window.PORTAL_TMP_TARGETS[1].dispose();*/

    /*window.PORTAL_TARGETS[0].dispose();
    window.PORTAL_TARGETS[1].dispose();

    window.PORTAL_TMP_TARGETS[0].dispose();
    window.PORTAL_TMP_TARGETS[1].dispose();


    if(window.PORTALS[0]){
        if(window.PORTALS[0].mesh){
            //window.PORTALS[0].mesh.material.map.dispose();
            window.PORTALS[0].mesh.material.dispose();
            //window.PORTALS[0].mesh.geometry.dispose();
        }
        
    }
    
    if(window.PORTALS[1]){
        if(window.PORTALS[1].mesh){
           // window.PORTALS[1].mesh.material.map.dispose();
            window.PORTALS[1].mesh.material.dispose();
            //window.PORTALS[1].mesh.geometry.dispose();
        }
        
    }

    renderer.dispose()*/

    //window.RENDERER.dispose()

    if (!c) {
        c = true;
        setTimeout(() => {
            c = false;
            //window.RENDERER.renderLists.dispose()
        }, 1000);
    }


}

var c = false;


// Render loop
function renderPortal2(thisIndex, pairIndex) {

    if (window.PORTALS[thisIndex] === null || window.PORTALS[pairIndex] === null) {
        return
    }

    let portalCamera = window.MAIN_CAMERA.clone()

    // ensure that uniforms and render target are correctly sized
    const {
        width,
        height
    } = window.RENDERER.domElement

    window.PORTALS[thisIndex].mesh.material.uniforms.ww.value = width
    window.PORTALS[thisIndex].mesh.material.uniforms.wh.value = height
    window.PORTAL_TARGETS[thisIndex].setSize(width, height)
    window.PORTAL_TMP_TARGETS[thisIndex].setSize(width, height)

    //window.PORTALS[thisIndex].mesh.material.stencilWrite = true
    //window.RENDERER.clearStencil()
    //window.RENDERER.setRenderTarget(null)
    //window.RENDERER.render(window.PORTALS[pairIndex].mesh, window.MAIN_CAMERA)

    let shouldRender = new Array(window.PORTAL_RECURSION_LEVELS + 1)
    shouldRender[0] = portalIsVisibleInCamera(window.MAIN_CAMERA, window.PORTALS[thisIndex], null)
    for (let i = 0; i < window.PORTAL_RECURSION_LEVELS; i++) {
        shouldRender[i + 1] = portalIsVisibleInCamera(portalCamera, window.PORTALS[thisIndex], window.PORTALS[pairIndex].plane) && shouldRender[i]
        //shouldRender[i + 1] = shouldRender[i]
        teleportObject3D(window.PORTALS[thisIndex], portalCamera)
    }

    // hide the portal for the farthest iteration - texture is currently garbage
    if (window.mobile) {
        window.PORTALS[thisIndex].mesh.visible = false
        window.PORTALS[pairIndex].mesh.visible = false
    } else {
        window.PORTALS[thisIndex].visible = false
        window.PORTALS[pairIndex].visible = false
    }
    window.RENDERER.localClippingEnabled = true

    for (let level = window.PORTAL_RECURSION_LEVELS - 1; level >= 0; level--) {
        if (!shouldRender[level]) {
            teleportObject3D(window.PORTALS[pairIndex], portalCamera)
            continue
        }
        // necessary so that we properly render recursion (otherwise the other portal might block)
        window.RENDERER.clippingPlanes = [window.PORTALS[pairIndex].plane.clone()]
        window.RENDERER.setRenderTarget(window.PORTAL_TMP_TARGETS[thisIndex])
        window.RENDERER.render(window.MAIN_SCENE, portalCamera)

        // need to do the swap operation:
        // https://stackoverflow.com/questions/54048816/how-to-switch-the-texture-of-render-target-in-three-js
        // cannot render to texture while also using texture, so have to create another temp render target
        let swap = window.PORTAL_TARGETS[thisIndex]
        window.PORTAL_TARGETS[thisIndex] = window.PORTAL_TMP_TARGETS[thisIndex]
        window.PORTAL_TMP_TARGETS[thisIndex] = swap
        //window.PORTAL_TARGETS[thisIndex].texture.encoding = THREE.sRGBEncoding;
        //window.PORTAL_TARGETS[thisIndex].texture.needsPMREMUpdate = true;
        window.PORTALS[thisIndex].mesh.material.uniforms.texture1.value = window.PORTAL_TARGETS[thisIndex].texture

        teleportObject3D(window.PORTALS[pairIndex], portalCamera)

        // show this portal to itself on subsequent iterations
        window.PORTALS[thisIndex].visible = true
    }

    if (window.mobile) {
        window.PORTALS[thisIndex].mesh.visible = true
        window.PORTALS[pairIndex].mesh.visible = true
    } else {
        window.PORTALS[thisIndex].visible = true
        window.PORTALS[pairIndex].visible = true
    }


    window.PORTALS[thisIndex].mesh.material.stencilWrite = false
}

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(obj1, obj2) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = obj1.CDBB.inverse_t.clone().premultiply(f).premultiply(obj1.output.CDBB.t)
    obj2.applyMatrix4(m)
}

function portalIsVisibleInCamera(camera, portal, clippingPlane) {
    camera.updateMatrix();
    camera.updateMatrixWorld();
    let frustum = new THREE.Frustum();
    frustum.setFromProjectionMatrix(new THREE.Matrix4().multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));

    // in frustum,
    // in front of clipping plane,
    // camera is in front of the portal
    return frustum.intersectsObject(portal.mesh) &&
        (clippingPlane === null || clippingPlane.distanceToPoint(portal.mesh.position) > 0) &&
        portal.plane.distanceToPoint(camera.position) > 0;
}