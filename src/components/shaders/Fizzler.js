import * as THREE from 'three';
import { GLOBALS } from '../../Globals';

GLOBALS.UNIFORMS_FIZZLER = {
    iTime: {
        value: 0.0
    },
    iResolution: {
        type: "v2",
        value: new THREE.Vector2(1000, 1000)
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
uniform vec2 iResolution;

// Found this on GLSL sandbox. I really liked it, changed a few things and made it tileable.
// :)
// by David Hoskins.
// Original water turbulence effect by joltz0r


// Redefine below to see the tiling...
//#define SHOW_TILING

#define TAU 6.28318530718
#define MAX_ITER 5

varying vec2 vUv;

void main() 
{
	float time = iTime * .5+23.0;
    // uv should be the 0-1 uv of texture...
	//vec2 uv = gl_FragCoord.xy / iResolution.y;
  vec2 uv = -1.0 + 2.0 *vUv;
    
#ifdef SHOW_TILING
	vec2 p = mod(uv*TAU*2.0, TAU)-250.0;
#else
    vec2 p = mod(uv*TAU, TAU)-250.0;
#endif
	vec2 i = vec2(p);
	float c = 1.0;
	float inten = .005;

	for (int n = 0; n < MAX_ITER; n++) 
	{
		float t = time * (1.0 - (3.5 / float(n+1)));
		i = p + vec2(cos(t - i.x) + sin(t + i.y), sin(t - i.y) + cos(t + i.x));
		c += 1.0/length(vec2(p.x / (sin(i.x+t)/inten),p.y / (cos(i.y+t)/inten)));
	}
	c /= float(MAX_ITER);
	c = 1.17-pow(c, 1.4);
	vec3 colour = vec3(pow(abs(c), 8.0));
    colour = clamp(colour + vec3(0.0, 0.35, 0.5), 0.0, 1.0);
    
	gl_FragColor = vec4(colour, 0.1);
}
`;

GLOBALS.MATERIAL_FIZZLER = new THREE.ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_FIZZLER,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true,
    opacity: 0.2
});