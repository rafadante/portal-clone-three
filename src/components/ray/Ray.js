import * as THREE from 'three';
import {
    LightningStrike
} from '../../LightningStrike.js';

const rayParams1 = {
    sourceOffset: new THREE.Vector3(),
    destOffset: new THREE.Vector3(),
    radius0: 0.000075,
    radius1: 0.000075,
    minRadius: 2.5,
    maxIterations: 7,
    isEternal: true,

    timeScale: 0.7,

    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 2.5,
    subrayDutyCycle: 0.3,
    maxSubrayRecursion: 3,
    ramification: 7,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.68
}

const rayParams2 = {
    sourceOffset: new THREE.Vector3(),
    destOffset: new THREE.Vector3(),
    radius0: 0.000075,
    radius1: 0.000075,
    minRadius: 2.5,
    maxIterations: 7,
    isEternal: true,

    timeScale: 0.7,

    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 2.5,
    subrayDutyCycle: 0.3,
    maxSubrayRecursion: 3,
    ramification: 7,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.68
}

const rayParams3 = {
    sourceOffset: new THREE.Vector3(),
    destOffset: new THREE.Vector3(),
    radius0: 0.000075,
    radius1: 0.000075,
    minRadius: 2.5,
    maxIterations: 7,
    isEternal: true,

    timeScale: 0.7,

    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 2.5,
    subrayDutyCycle: 0.3,
    maxSubrayRecursion: 3,
    ramification: 7,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.68
}

let lightningStrike, lightningStrike2, lightningStrike3;
let lightningStrikeMesh, lightningStrikeMesh2, lightningStrikeMesh3;

function recreateRay() {

    lightningStrike = new LightningStrike(rayParams1);
    lightningStrikeMesh = new THREE.Mesh(lightningStrike, new THREE.MeshBasicMaterial({
        color: 0xffffff
    }));

    lightningStrike2 = new LightningStrike(rayParams2);
    lightningStrikeMesh2 = new THREE.Mesh(lightningStrike2, new THREE.MeshBasicMaterial({
        color: 0xffffff
    }));

    lightningStrike3 = new LightningStrike(rayParams3);
    lightningStrikeMesh3 = new THREE.Mesh(lightningStrike3, new THREE.MeshBasicMaterial({
        color: 0xffffff
    }));

    window.lightningStrikeMesh = lightningStrikeMesh;
    lightningStrikeMesh.visible = false;

    window.lightningStrikeMesh2 = lightningStrikeMesh2;
    lightningStrikeMesh2.visible = false;

    window.lightningStrikeMesh3 = lightningStrikeMesh3;
    lightningStrikeMesh3.visible = false;
}

//
let t = 0;

function updateRay() {
    t += 0.01;

    if (lightningStrike && lightningStrike2 && lightningStrike3 && window.FPS) {

        lightningStrike.rayParameters.sourceOffset.copy(window.cube_1.position);
        lightningStrike.rayParameters.destOffset.copy(window.cube_2.position);

        lightningStrike2.rayParameters.sourceOffset.copy(window.cube_2.position);
        lightningStrike2.rayParameters.destOffset.copy(window.cube_3.position);

        lightningStrike3.rayParameters.sourceOffset.copy(window.cube_3.position);
        lightningStrike3.rayParameters.destOffset.copy(window.cube_1.position);

        lightningStrike.update(t);
        lightningStrike2.update(t);
        lightningStrike3.update(t);
    }
}

export {
    updateRay,
    recreateRay
};