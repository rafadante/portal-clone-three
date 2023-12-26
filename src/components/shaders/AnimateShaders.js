import * as THREE from 'three';
import {
    generateMeshPortalShader
} from './Portals/Portals.js';
import './PortalGun/PortalGunShaders.js';
import {
    animateLightBridges
} from '../lightBridges/LightBridges.js'

generateMeshPortalShader();

var clock = new THREE.Clock();

var start = Date.now();

//
var clock2 = new THREE.Clock();
var delta = 0;
const interval = 1 / 30;

const animateShader = (time) => {
    delta += clock2.getDelta();

    if (delta > interval) {
        // The draw or time dependent code are here
        animateShader2();
        delta = delta % interval;
    }
};

const animateShader2 = (time) => {
    var val = clock.getDelta();

    window.uniformShaderPortalGunBallEnergy.iTime.value += val;

    window.uniformShaderPortal.iTime.value += val;

    window.uniformsgEL.time.value =  .00025 * ( Date.now() - start)

    animateLightBridges();
};

export {
    animateShader
};