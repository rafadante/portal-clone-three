import * as THREE from '../../../build/three.module.js';

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

//window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 0.25, 0.0);
//window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.3, 0.5, 1.0);



window.uniformShaderPortalGunBallEnergy = {
    iTime: {
        type: 'f',
        value: 1.0
    },
    iAlpha: {
        type: 'f',
        value: 0.0
    },
    iColor: {
        type: 'v3',
        value: new THREE.Vector3(1.0, 0.25, 0.0)
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2(10, 1)
    },
    iChannel0: {
        type: "t",
        value: new THREE.TextureLoader().load('./assets/textures/shaders/energy2.png'),
    },
};

//const geometry = new THREE.PlaneGeometry( 10, 1);
//const geometry = new THREE.CylinderGeometry( 5, 5, 20, 32 );  
const geometry = new THREE.SphereGeometry( 15, 32, 16 ); 
const material2 = new THREE.MeshBasicMaterial( { color: 0xffff00 } ); 

window.materialGun = new THREE.ShaderMaterial({
    uniforms: window.uniformShaderPortalGunBallEnergy,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true,
    opacity: 0
});

const sphere = new THREE.Mesh( geometry, window.materialGun );
//window.MAIN_SCENE.add(sphere);