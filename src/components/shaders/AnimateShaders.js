import * as THREE from '../../build/three.module.js';
import {
    generateMeshPortalShader
} from './Portals/Portals.js';
import './PortalGun/PortalGunShaders.js';
import {
    animateLightBridges
} from '../lightBridges/LightBridges.js'

generateMeshPortalShader();

var clock = new THREE.Clock();

const animateShader = (time) => {
    var val = clock.getDelta();

    window.uniformShaderPortalGunBallEnergy.iTime.value += val;

    window.uniformShaderPortal.iTime.value += val;

    animateLightBridges();
};

export {
    animateShader
};