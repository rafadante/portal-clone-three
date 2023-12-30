import * as THREE from 'three';
import {
    generateMeshPortalShader
} from './Portals/Portals.js';
import './PortalGun/PortalGunShaders.js';
import {
    animateLightBridges
} from '../lightBridges/LightBridges.js';
import {
    GLOBALS
} from '../../Globals.js';

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

    GLOBALS.UNIFORMS_GEL.time.value =  .00025 * ( Date.now() - start)

    uniformsExitRoom.iTime.value += val;
    animateLightBridges();
};

//


const vertexShader = `
varying vec2 vUv; 
void main()
{
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fragmentShader = `
uniform float iTime;
varying vec2 vUv;

void main() {
    //vec2 u = gl_FragCoord.xy / resolution.xy;
    vec2 u = vUv;
    vec4 fragColor = vec4(0.0);

    for (float i = 1.0; i < 22.0; i++) {
        float s1 = i * i / 1e4 * sin(i * 2e2 * u.x / i + 9.0 * i + sin(iTime));
        float s2 = i * i / 1e4 * sin(i * 2e2 * u.x / i + 9.0 * i + sin(iTime + 1.0));
        float s3 = 0.5 * i * i / 1e4 * sin(i * 2e2 * u.x / i + 9.0 * i + sin(iTime + 5.0));

        if (u.y < 0.7 - 0.03 * i + 2.0 * s1 + s2 + s3) {
            fragColor = i * vec4(0.0, 0.0, 0.0, 1.0);
        } else {
            fragColor += vec4(0.05);
        }
    }

    gl_FragColor = fragColor;
}
`;

var uniformsExitRoom = {
    'iTime': {
        value: 0.0
    },
};

// Create a custom shader material
var material = new THREE.ShaderMaterial({
    uniforms: uniformsExitRoom,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
});

window.shaderExitRoom = material;

export {
    animateShader
};