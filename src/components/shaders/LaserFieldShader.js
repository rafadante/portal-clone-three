import {
    Color,
    MeshBasicMaterial,
    DoubleSide
} from 'three';
import { GLOBALS } from '../../Globals';

GLOBALS.UNIFORMS_LASER_FIELD = {
    time: {
        value: 0
    }
}

GLOBALS.MATERIAL_LASER_FIELD = new MeshBasicMaterial({
    color: new Color(1, 0, 0),
    side: DoubleSide,
    transparent: true,
    onBeforeCompile: shader => {
        shader.uniforms.time = GLOBALS.UNIFORMS_LASER_FIELD.time;
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
          a = max(a, scanLine);
          
            diffuseColor.a = a;
          `
        );
    }
});

GLOBALS.MATERIAL_LASER_FIELD.defines = {
    "USE_UV": ""
}