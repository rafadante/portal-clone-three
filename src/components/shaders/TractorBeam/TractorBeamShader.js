import * as THREE from 'three';
import { GLOBALS } from '../../../Globals';

GLOBALS.UNIFORMS_TRACTOR_BEAM = {
    iTime: {
        type: 'f',
        value: 1.0
    },
    iAlpha: {
        type: 'f',
        value: 0.3
    },
    iColor: {
        type: 'v3',
        value: new THREE.Vector3(0.0, 0.35, 0.75)
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2(10, 1)
    }
};

GLOBALS.UNIFORMS_TRACTOR_BEAM_ORANGE = {
    iTime: {
        type: 'f',
        value: 1.0
    },
    iAlpha: {
        type: 'f',
        value: 0.3
    },
    iColor: {
        type: 'v3',
        value: new THREE.Vector3(1.0, 0.5, 0.0)
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2(10, 1)
    }
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
//
uniform float iTime;
uniform float iAlpha;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec2 iResolution;
uniform vec3 iColor;

float height(in vec2 uv){
    float speed = 6.0;

    float topright=		sin(iTime*(speed+1.0)	-sin(length(uv-vec2(1.0,1.0)))*53.0);
    float topleft=		sin(iTime*(speed+1.0)	-sin(length(uv-vec2(0.0,1.0)))*37.0);
    float bottomright=	sin(iTime*(speed)    	-sin(length(uv-vec2(1.0,0.0)))*61.0);
    float bottomleft=	sin(iTime*(speed+2.0)	-sin(length(uv-vec2(0.0,0.0)))*47.0);

    float horizontalWaves=sin(iTime*(speed+2.0)-sin(uv.y)*47.0);
    
    
    float temp = horizontalWaves +bottomleft*0.4 +bottomright*0.2 +topleft*0.6 +topright*0.3;
    
    float b=smoothstep(-2.5,5.0,temp);
    return b*3.0;
}

varying vec2 vUv;

void main()
{
	//vec2 uv=gl_FragCoord.xy/iResolution.xy;

    vec2 uv= 0.0 + 1.0 *vUv;
    
    float waveHeight=0.4+height(uv);
    
    //vec3 color=vec3(waveHeight*0.3,waveHeight*0.5,waveHeight);
    vec3 color=vec3(waveHeight * iColor.x,waveHeight*iColor.y,waveHeight * iColor.z);
    
    gl_FragColor = vec4( color, iAlpha );
}
`;

const fshaderOrange = `
//
uniform float iTime;
uniform float iAlpha;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform vec2 iResolution;
uniform vec3 iColor;

float height(in vec2 uv){
    float speed = 6.0;

    float topright=		sin(iTime*(speed+1.0)	-sin(length(uv-vec2(1.0,1.0)))*53.0);
    float topleft=		sin(iTime*(speed+1.0)	-sin(length(uv-vec2(0.0,1.0)))*37.0);
    float bottomright=	sin(iTime*(speed)    	-sin(length(uv-vec2(1.0,0.0)))*61.0);
    float bottomleft=	sin(iTime*(speed+2.0)	-sin(length(uv-vec2(0.0,0.0)))*47.0);

    float horizontalWaves=sin(iTime*(speed+2.0)-sin(uv.y)*47.0);
    
    
    float temp = horizontalWaves +bottomleft*0.4 +bottomright*0.2 +topleft*0.6 +topright*0.3;
    
    float b=smoothstep(-2.5,5.0,temp);
    return b*3.0;
}

varying vec2 vUv;

void main()
{
	//vec2 uv=gl_FragCoord.xy/iResolution.xy;

    vec2 uv= 0.0 + 1.0 *-vUv;
    
    float waveHeight=0.4+height(uv);
    
    //vec3 color=vec3(waveHeight*0.3,waveHeight*0.5,waveHeight);
    vec3 color=vec3(waveHeight * iColor.x,waveHeight*iColor.y,waveHeight * iColor.z);
    
    gl_FragColor = vec4( color, iAlpha );
}
`;

GLOBALS.MATERIAL_TRACTOR_BEAM = new THREE.ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_TRACTOR_BEAM,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 0,
    transparent: true
});

GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE = new THREE.ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_TRACTOR_BEAM_ORANGE,
    vertexShader: vshader,
    fragmentShader: fshaderOrange,
    side: 0,
    transparent: true
});

console.log(GLOBALS.MATERIAL_TRACTOR_BEAM)

/*window.materialBridgeOrange = new THREE.ShaderMaterial({
    uniforms: window.uniformsBridge,
    vertexShader: vshader,
    fragmentShader: fshaderOrange,
    side: 2,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5
});*/