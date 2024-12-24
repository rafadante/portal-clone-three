import {
    Clock,
    Vector3,
    Color
} from 'three';
import {
    generateMeshPortalShader
} from './PortalsShader.js';
import './PortalGunShaders.js';
import './LightBridgerShader.js';
import './TractorBeamShader.js';
import './LaserFieldShader.js';
import './Fizzler.js';
import './Dissolve.js'
import {
    GLOBALS
} from '../../Globals.js';

generateMeshPortalShader();

var clock = new Clock();
var clock2 = new Clock();

var start = Date.now();

//
var clock2 = new Clock();
var delta = 0;
const interval = 1 / 60;

var clock3 = new Clock();

const animateShader = (time) => {
    delta += clock2.getDelta();

    if (delta > interval) {
        // The draw or time dependent code are here
        //animateShader2();
        delta = delta % interval;
    }

    animateShader2();
};

const effectOrigin = new Vector3(1, 1, 5)

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

    //LIGHT BRIDGES
    let t = clock.getElapsedTime();
    GLOBALS.UNIFORMS_LIGHT_BRIDGE.time.value = t;

    //TRACTOR BEAM
    GLOBALS.UNIFORMS_TRACTOR_BEAM.iTime.value += val;
    GLOBALS.UNIFORMS_TRACTOR_BEAM_ORANGE.iTime.value += val;
    GLOBALS.UNIFORMS_FIZZLER.iTime.value += val;
    GLOBALS.UNIFORMS_LASER_FIELD.iTime.value += val;

    //GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value = effectOrigin;
    GLOBALS.UNIFORMS_DISSOLVER.u_Time.value = t;

    //
    //const time = t / 1000; // Convert time to seconds

    /*const time2 = t; // Convert time to seconds

    // Update the colors for the trail
    for (var j = 0; j < window.lines.length; j++) {
        for (let i = 0; i <= 100; i++) {
            const t2 = i / 100; // Position along the line

            // Fade calculation with valid ranges
            const wave = Math.sin((time2 * 2 - t2 * 10) % (2 * Math.PI)); // Wrap values into a valid range
            const fade = Math.max(0, wave); // Ensure no negative or NaN values

            //console.log(fade)

            const color = new Color();

            color.setHSL(0.6, 1.0, fade); // Use HSL color (adjust lightness with `fade`)
            window.lines[j].colorAttribute.setXYZ(i, color.r, color.g, color.b);
        }

        window.lines[j].colorAttribute.needsUpdate = true;
    }*/

};

export {
    animateShader
};