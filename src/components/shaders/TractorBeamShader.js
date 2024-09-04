import {
    Vector3,
    ShaderMaterial
} from 'three';
import { GLOBALS } from '../../Globals';

GLOBALS.UNIFORMS_TRACTOR_BEAM = {
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
        value: new Vector3(0.02, 0.5, 0.95)
    },
};

GLOBALS.UNIFORMS_TRACTOR_BEAM_ORANGE = {
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
        value: new Vector3(0.95, 0.45, 0.02)
    }
};

const vshader = `
attribute float height;  // Custom attribute for height

varying vec2 vUv; 
varying float vHeight;

void main()
{
    vHeight = height;  // Pass height to fragment shader
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
varying float vHeight;  // Received from vertex shader

float height(in vec2 uv) {
    float speed = 6.0;

    // Calculate normalized horizontal position
    float horizontalPos = uv.x + uv.y * vHeight;

    // Adjust frequency to spread waves evenly and control width
    float horizontalWaves = sin(iTime * (speed + 2.0) + horizontalPos * 18.85);

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

const fshaderOrange = `
//
uniform float iTime;
uniform float iAlpha;
uniform vec2 iResolution;
uniform vec3 iColor;
varying vec2 vUv;
varying float vHeight;  // Received from vertex shader

float height(in vec2 uv) {
    float speed = 6.0;

    // Calculate normalized horizontal position
    float horizontalPos = uv.x + uv.y * vHeight;

    // Adjust frequency to spread waves evenly and control width
    float horizontalWaves = sin(iTime * (speed + 2.0) + horizontalPos * 18.85);

    float b = smoothstep(0.0, 4.0, horizontalWaves);
    return b * 3.0;
}

void main() {
    vec2 uv= vUv;

    float waveHeight = height(uv);
    
    // Set transparency based on wave height
    float alpha = waveHeight; // Invert waveHeight to make black parts transparent
    
    vec3 color = vec3(waveHeight * iColor.x, waveHeight * iColor.y, waveHeight * iColor.z);
    
    gl_FragColor = vec4(color, iAlpha * alpha);

    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;

GLOBALS.MATERIAL_TRACTOR_BEAM = new ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_TRACTOR_BEAM,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true
});

GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE = new ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_TRACTOR_BEAM_ORANGE,
    vertexShader: vshader,
    fragmentShader: fshaderOrange,
    side: 2,
    transparent: true
});

/*window.materialBridgeOrange = new ShaderMaterial({
    uniforms: window.uniformsBridge,
    vertexShader: vshader,
    fragmentShader: fshaderOrange,
    side: 2,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5
});*/