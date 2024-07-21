import * as THREE from 'three';
import {
    generateMeshPortalShader
} from './Portals/PortalsShader.js';
import './PortalGun/PortalGunShaders.js';
import './LightBridge/LightBridgerShader.js';
import './TractorBeam/TractorBeamShader.js';
import './ExitRoom/ExitRoomShader.js';
import './LightBridge/LaserFieldShader.js';
import './Fizzler.js';
import './Dissolve.js'
import {
    GLOBALS
} from '../../Globals.js';

generateMeshPortalShader();

var clock = new THREE.Clock();
var clock2 = new THREE.Clock();

var start = Date.now();

//
var clock2 = new THREE.Clock();
var delta = 0;
const interval = 1 / 30;

var clock3 = new THREE.Clock();

const animateShader = (time) => {
    delta += clock2.getDelta();

    if (delta > interval) {
        // The draw or time dependent code are here
        animateShader2();
        delta = delta % interval;
    }
};

const effectOrigin = new THREE.Vector3(1,1,5)

const animateShader2 = (time) => {
    var val = clock.getDelta();
    const elapsed = clock3.getElapsedTime()

    //PORTAL GUN
    GLOBALS.UNIFORMS_PORTAL_GUN_ENERGY.iTime.value += val;

    //PORTALS
    if (GLOBALS.PORTALS[0])
        GLOBALS.PORTALS[0].portalShader.material.uniforms.iTime.value += val;
    if (GLOBALS.PORTALS[1])
        GLOBALS.PORTALS[1].portalShader.material.uniforms.iTime.value += val;

    //GELS
    //GLOBALS.UNIFORMS_GEL.time.value = .00025 * (Date.now() - start)

    //EXIT ROOM WALL
    //GLOBALS.MATERIAL_EXIT_ROOM.uniforms.iTime.value += val;

    //LIGHT BRIDGES
    let t = clock.getElapsedTime();
    GLOBALS.UNIFORMS_LIGHT_BRIDGE.time.value = t;
    GLOBALS.UNIFORMS_LASER_FIELD.time.value = t;

    //TRACTOR BEAM
    GLOBALS.UNIFORMS_TRACTOR_BEAM.iTime.value += val;
    GLOBALS.UNIFORMS_TRACTOR_BEAM_ORANGE.iTime.value += val;
    GLOBALS.UNIFORMS_FIZZLER.iTime.value += val;


    //GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value = effectOrigin;
    GLOBALS.UNIFORMS_DISSOLVER.u_Time.value = t;
};

export {
    animateShader
};