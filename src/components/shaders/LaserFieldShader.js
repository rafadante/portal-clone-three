import {
    Color,
    MeshBasicMaterial,
    DoubleSide,
    Vector3,
    ShaderMaterial
} from 'three';
import { GLOBALS } from '../../Globals';

/*GLOBALS.UNIFORMS_LASER_FIELD = {
    time: {
        value: 0
    }
}

GLOBALS.MATERIAL_LASER_FIELD = new MeshBasicMaterial({
    color: new Color(5, 0, 0),
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
          //a = max(a, sideLines);
          a = max(a, contactLines);
          //a = max(a, scanLine);
          
            diffuseColor.a = a;
          `
        );
    }
});

GLOBALS.MATERIAL_LASER_FIELD.defines = {
    "USE_UV": ""
}*/

GLOBALS.UNIFORMS_LASER_FIELD = {
    iTime: {
        type: 'f',
        value: 1.0
    },
    iAlpha: {
        type: 'f',
        value: 1.0
    },
    iColor: {
        type: 'v3',
        value: new Vector3(25.0, 0.0, 0.0)
    },
};

const vshader = `

varying vec2 vUv; 

void main()
{
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
`;

const fshader = `
uniform float iTime;
uniform float iAlpha;
uniform vec2 iResolution;
uniform vec3 iColor;
varying vec2 vUv;

float height(in vec2 uv) {
    float speed = 2.0;

    // Calculate normalized horizontal position
    float horizontalPos = uv.x;

    // Adjust frequency to spread waves evenly and control width
    float horizontalWaves = sin(iTime * (speed + 2.0) + horizontalPos * 75.0);

    float b = smoothstep(0.0, 4.0, horizontalWaves);
    return b * 3.0;
}

void main() {
    vec2 uv= -vUv;

    float waveHeight = height(uv);
    
    // Set transparency based on wave height
    float alpha = waveHeight; // Invert waveHeight to make black parts transparent
    
    vec3 color = vec3(waveHeight * iColor.x, waveHeight * iColor.y, waveHeight * iColor.z);

    // Glow effect: render the object with a halo around it
    float glowStrength = 0.2;
    float glowSize = 0.2;

    // Calculate distance from center (for circular glow)
    float dist = length(vUv - 0.5);

    // Apply glow based on distance from center
    float glow = glowStrength * smoothstep(glowSize, 0.0, dist);

    // Add glow to color
    color += vec3(glow);
    
    gl_FragColor = vec4(color, iAlpha * alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

GLOBALS.MATERIAL_LASER_FIELD = new ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_LASER_FIELD,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true
});

console.log(GLOBALS.MATERIAL_LASER_FIELD)