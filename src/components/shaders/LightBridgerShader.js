import {
    MeshBasicMaterial,
    Color,
    DoubleSide,
    AdditiveBlending
} from 'three';
import {
    GLOBALS
} from '../../Globals';

GLOBALS.UNIFORMS_LIGHT_BRIDGE = {
    time: {
        value: 0
    }
}

var color = new Color(0, 0.75, 1);

if (localStorage.getItem("quality-select") == "epic") {
    color = new Color(0, 1.5, 2);
}

GLOBALS.MATERIAL_LIGHT_BRIDGERS = new MeshBasicMaterial({
    color: color,//0, 0.75, 1
    side: DoubleSide,
    transparent: true,
    blending: AdditiveBlending,
    onBeforeCompile: shader => {
        shader.uniforms.time = GLOBALS.UNIFORMS_LIGHT_BRIDGE.time;
        shader.fragmentShader = `
          uniform float time;
          ${shader.fragmentShader}
        `.replace(
            `#include <color_fragment>`,
            `#include <color_fragment>
          float t = time;
          float mainWave = sin((vUv.x - t * 0.2) * 1.5 * PI2) * 0.5 + 0.5;
          mainWave = mainWave * 0.25 + 0.25;
          mainWave *= (sin(t * PI2 * 0.1) * 0.5 + 0.5) * 0.25 + 0.75;
          float sideLines = smoothstep(0.45, 0.5, abs(vUv.x - 0.5));
          float contactLines = smoothstep(0.45, 0.5, abs(vUv.y - 0.5));
          float scanLineSin = abs(vUv.x - (sin(t * 2.7) * 0.5 + 0.5));
          float scanLine = smoothstep(0.01, 0., scanLineSin);
          float fadeOut = pow(vUv.y, 2.7);
          
          
          float a = 0.;
          a = max(a, mainWave);
          a = max(a, sideLines);
          a = max(a, contactLines);
          //a = max(a, scanLine);
          
          diffuseColor.a = a;

            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          
          `
        );
    }
});

GLOBALS.MATERIAL_LIGHT_BRIDGERS.defines = {
    "USE_UV": ""
}