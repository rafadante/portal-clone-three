import $ from 'jquery';
import "./Variables.js";
import "./components/ui/UI.js";
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
    cubeState
} from './components/cubeManager/CubeManager.js';
import {
    raycastSelected
} from './components/boxSelection/BoxSelection.js';
/*import {
    createPortalShader,
    generateMeshPortalShader,
    animatePortalShader
} from './components/portalShader/PortalShader.js';*/
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
    SelectiveBloomEffect,

    ColorChannel,
    DepthDownsamplingPass,
    NormalPass,
    SSAOEffect,
    TextureEffect,
    GridEffect,
    NoiseEffect,
    SepiaEffect,
    VignetteEffect
} from "postprocessing";
import Stats from "stats-gl";
import "./components/menuShader/MenuShader.js";
import {
    GUI
} from './jsm/libs/lil-gui.module.min.js';
import {
    renderGoo
} from './components/goo/Goo.js';
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
    intensity: 1,
    luminanceThreshold: 0.3,
    //mipmapBlur: true,
    radius: 0.0
})

selectiveBloom.selection = window.SELECTED_OBJECTS_FOR_BLOOM;

console.log(selectiveBloom)

const smaaEffect = new SMAAEffect(
    EdgeDetectionMode.DEPTH
);

smaaEffect.edgeDetectionMaterial.setEdgeDetectionThreshold(0.01);

//

const normalPass = new NormalPass(window.MAIN_SCENE, window.MAIN_CAMERA);
const depthDownsamplingPass = new DepthDownsamplingPass({
    normalBuffer: normalPass.texture,
    resolutionScale: 0.5
});

const capabilities = window.RENDERER.capabilities;

const normalDepthBuffer = capabilities.isWebGL2 ?
    depthDownsamplingPass.texture : null;

// Note: Thresholds and falloff correspond to camera near/far.
// Example: worldDistance = distanceThreshold * (camera.far - camera.near)
const ssaoEffect = new SSAOEffect(window.MAIN_CAMERA, normalPass.texture, {
    blendFunction: BlendFunction.MULTIPLY,
    distanceScaling: true,
    depthAwareUpsampling: true,
    normalDepthBuffer,
    samples: 9,
    rings: 7,
    distanceThreshold: 0.005, // Render up to a distance of ~20 world units
    distanceFalloff: 0.0025, // with an additional ~2.5 units of falloff.
    rangeThreshold: 0.0003, // Occlusion proximity of ~0.3 world units
    rangeFalloff: 0.0001, // with ~0.1 units of falloff.
    luminanceInfluence: 0.7,
    minRadiusScale: 0.33,
    radius: 0.1,
    intensity: 1.33,
    bias: 0.025,
    fade: 0.01,
    color: null,
    resolutionScale: 0.5
});

//
var effectPass;

const noiseEffect = new NoiseEffect({
    premultiply: false
});
const gridEffect = new GridEffect({
    scale: 1.6
});

console.log(gridEffect)
console.log(noiseEffect)

noiseEffect.blendMode.opacity.value = 0.7;
noiseEffect.blendMode.blendFunction = BlendFunction.REFLECT;

window.sepiaEffect = new SepiaEffect();
//window.sepiaEffect.blendMode.opacity = 0;
//window.sepiaEffect.setIntensity(0);
window.sepiaEffect.intensity = 0;
console.log(window.sepiaEffect)

window.vig = new VignetteEffect({
    darkness: 0
});

console.log(window.vig)

if (window.mobile) {
    effectPass = new EffectPass(window.MAIN_CAMERA, toneMappingEffect, smaaEffect, selectiveBloom); //selectiveBloom
} else {
    effectPass = new EffectPass(window.MAIN_CAMERA, toneMappingEffect, smaaEffect, window.vig, selectiveBloom, window.sepiaEffect); //selectiveBloom
}

console.log(effectPass)

//this.effect = toneMappingEffect;
window.COMPOSER.addPass(effectPass);
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

document.getElementById("container").appendChild(window.RENDERER.domElement);

init();
$("body").on('click', '#option-community-build', function () { //#option-single-load
    setTimeout(() => {
        init();
    }, 2000);
});
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

    window.GOO = new THREE.Group();
    window.MAIN_SCENE.add(window.GOO);

    console.log(window.MAIN_SCENE)
    // CAMERA
    window.MAIN_SCENE.add(window.MAIN_CAMERA);
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
            //
            window.decalMaterial.envMap = envMap;
            const geometryDecal = new THREE.PlaneGeometry(2, 2);

            window.instancedMeshGel = new THREE.InstancedMesh(geometryDecal.clone(), window.decalMaterial, 100);
            //window.instancedMeshGel.rotation.x = -Math.PI/2;
            window.instancedMeshGel.castShadow = true;
            window.instancedMeshGel.receiveShadow = true;
            window.instancedMeshGel.name = "gel-parent";
            window.MAIN_SCENE.add(window.instancedMeshGel);

            var clone = new THREE.Object3D();

            for (var i = 0; i < 100; i++) {
                clone.scale.set(0, 0, 0);
                clone.rotation.x = -Math.PI / 2;
                clone.updateMatrix();
                window.instancedMeshGel.setMatrixAt(i, clone.matrix);

                window.GELS.push(false);
            }
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

function onDocumentMouseDown(event) {
    if (!window.FPS) {
        raycastManager(event, "down");
    }
}

function onDocumentMouseMove(event) {
    if (!window.FPS) {
        mouse2.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse2.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycastManager(event, "move");
    }
}

function onDocumentMouseUp(event) {
    if (!window.FPS) {
        window.SELECTED_SIDE = null;
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

const mouse2 = new THREE.Vector2(1, 1);

function raycastManager(event, type) {
    if (!window.FPS && window.instancedMesh) {

        raycaster.setFromCamera(mouse2, window.MAIN_CAMERA);
        const intersection = raycaster.intersectObject(window.instancedMesh);

        if (intersection.length > 0) {

            const color = new THREE.Color();

            const instanceId = intersection[0].instanceId;
            window.instancedMesh.getColorAt(instanceId, color);

            if (type == "move" && window.SELECTING) {

                if (!window.planeUserData[instanceId].selected &&
                    window.planeUserData[instanceId].side == window.SELECTED_SIDE) {
                    window.planeUserData[instanceId].selected = true;
                    raycastSelected(intersection[0], event, type)
                }

            } else if (type == "down") {

                window.SELECTING = true;
                window.CONTROLS.enabled = false;

                //if (!window.planeUserData[instanceId].selected) {
                window.planeUserData[instanceId].selected = true;
                window.SELECTED_SIDE = window.planeUserData[instanceId].side;
                raycastSelected(intersection[0], event, type)
                //}

            }


            if (type == "up") {
                if (intersection.length > 0)
                    addItem(intersection);
            }

            if (window.ITEM_HOLDED_NAME) {

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
    window.RENDERER.setSize(window.innerWidth, window.innerHeight);
    window.COMPOSER.setSize(window.innerWidth, window.innerHeight);

    window.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    window.MAIN_CAMERA.updateProjectionMatrix();
}

window.debugCol = true;

const cannonDebugger = new CannonDebugger(window.MAIN_SCENE, window.CANNON_WORLD, {
    onInit(body, mesh) {
        mesh.visible = false;
        $("body").on('input', '#debug-input', function () {
            window.debugCol = this.checked;
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
window.interval = 1 / window.fps;

console.log(window.STATS);

function animate(time) {


    if (window.skybox) {
        //window.skybox.radius = 20;
        //window.skybox.height = 440;
    }

    renderGoo();

    if (!window.FPS) {
        window.STATS.begin();
        //window.tuniform.iTime.value += clock.getDelta();
        window.RENDERER.render(window.MAIN_SCENE, window.MAIN_CAMERA)
        window.STATS.end();
    } else if (!window.paused) {

        delta += clock.getDelta();

        if (window.fpsUnlocked) {
            render(time);
        } else {
            if (delta > window.interval) {
                // The draw or time dependent code are here
                render(time);
                delta = delta % window.interval;
            }
        }

        delta2 += clock3.getDelta();

        if (delta2 > 1 / 60) {
            // The draw or time dependent code are here
            fixedUpdate();
            delta2 = delta2 % 60;
        }
    }

    requestAnimationFrame(animate);
}

function fixedUpdate() { //60 fps always for physics
    const deltaTime = clock2.getDelta();
    updatePlayer(deltaTime);

    if (Date.now() >= timeTarget) {

        const timeStep = (1 / 60); //window.fps
        window.CANNON_WORLD.step(timeStep)
        timeTarget += 1000 / window.PHYSICS_UPDATEPERSEC_LIMIT
        if (Date.now() >= timeTarget) {
            timeTarget = Date.now()
        }
    }
}

const STEPS_PER_FRAME = 1;

function render(time) {

    window.STATS.begin();
    animatePortal();
    updateRay();
    animateShader();
    //itemUpdate();
    TWEEN.update();

    if (window.initLevel) {
        if (window.HOLDING_ITEM) {
            var target = new THREE.Vector3(); // create once an reuse it
            window.holder.getWorldPosition(target);

            var x = target.x;
            var y = target.y;
            var z = target.z;
            var item = new THREE.Object3D();

            item.position.copy(new THREE.Vector3(x, y, z));
            item.rotation.copy(window.MAIN_CAMERA.rotation);

            window.CURRENT_ITEM.position.copy(item.position);
            window.CURRENT_ITEM.rotation.copy(item.rotation);

            item.updateMatrix();
            window.CURRENT_INSTANCED.setMatrixAt(window.CURRENT_ITEM_ID, item.matrix)
            window.CURRENT_INSTANCED.instanceMatrix.needsUpdate = true;
            window.CURRENT_INSTANCED.computeBoundingSphere();


            if (recordingPosition && !window.CURRENT_ITEM.body.recall) {
                //console.log("oooooooooooooo")
                //if (!window.CURRENT_ITEM.body.sleeping) {
                    window.CURRENT_ITEM.body.arrayPos.push(item.position.clone())
                    window.CURRENT_ITEM.body.arrayRot.push(item.quaternion.clone())
                    //console.log("iiiiiiiiiii")
                //}
            }
        }

        //SYNC OBJECTS WITH THE PHYSICAL WORLD

        //
        for (let d of window.dynamicObjects) {
            if (d.inTractor) {
                //d.position.y = d.inTractorPositionY;
            } else if (d.inTractorClone) {
                //d.position.y = d.inTractorPositionYClone;
            }
        }

        for (const property in window.DYMANIC_ITEMS) {

            var instanced = window.ITEMS_ADDED.getObjectByName(property);

            if (property == "gel_gun_blue" || property == "gel_gun_orange" || property == "gel_gun_white" ||
                property == "pedestal_button" || property == "button_weight" || property == "button_box" ||
                property == "button_circle" || property == "dispenser" || property == "ramp" ||
                property == "ramp_half" || property == "ramp_half2" || property == "stairs" ||
                property == "light_bridge" | property == "tractor_beam" || property == "laser_emitter")
                continue;

            for (var i = 0; i < window.DYMANIC_ITEMS[property].length; i++) {

                if (window.DYMANIC_ITEMS[property][i].length != 0) {

                    if (i == window.CURRENT_ITEM_ID) {
                        if (window.CURRENT_INSTANCED.name == property)
                            continue;
                    }

                    var item = new THREE.Object3D();
                    item.position.copy(window.DYMANIC_ITEMS[property][i].body.position);
                    item.quaternion.copy(window.DYMANIC_ITEMS[property][i].body.quaternion);

                    if (recordingPosition && !window.DYMANIC_ITEMS[property][i].body.recall) {
                        if (!window.DYMANIC_ITEMS[property][i].body.sleeping) {
                            window.DYMANIC_ITEMS[property][i].body.arrayPos.push(item.position.clone())
                            window.DYMANIC_ITEMS[property][i].body.arrayRot.push(item.quaternion.clone())
                            //console.log("iiiiiiiiiii")
                        }
                    }

                    if (window.DYMANIC_ITEMS[property][i].body.recall) {
                        //console.log(item.quaternion)
                    }

                    item.updateMatrix();
                    instanced.setMatrixAt(i, item.matrix)
                    instanced.instanceMatrix.needsUpdate = true;
                    instanced.computeBoundingSphere();
                }

            }
        }

        if (recordingPosition) {
            recordingPosition = false;
            setTimeout(() => {
                recordingPosition = true;
            }, 10);
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

    if (window.debugCol)
        cannonDebugger.update();

    window.COMPOSER.render();
    window.STATS.end();
}

var recordingPosition = true;

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

    window.GUN.children[0].children[0].scale.set(1, 1, 1)
    window.GUN.children[0].children[0].position.set(0.12, -0.14, -0.13);

    renderPortal2(0, 1)
    renderPortal2(1, 0)
    //window.ambient.intensity = 0.15;

    window.RENDERER.autoClear = false;

    window.GUN.children[0].children[0].scale.set(0.1, 0.1, 0.1)
    window.GUN.children[0].children[0].position.set(0.01, -0.012, -0.011);

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