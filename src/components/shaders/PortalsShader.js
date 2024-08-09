import {
    ShaderMaterial,
    Vector2,
    Mesh,
    CircleGeometry
} from 'three';
import { GLOBALS } from '../../Globals';

var width = window.innerWidth,
    height = window.innerHeight;

const vshader = `
varying vec2 vUv; 
void main()
{
    vUv = uv;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}
`;

var fshader = `

// most of the code is from https://www.shadertoy.com/view/lsf3RH

uniform float iTime;
uniform int iPortal;
uniform int iOpened;
uniform vec4 resolution;

varying vec2 vUv;

float snoise(vec3 uv, float res)
{
	const vec3 s = vec3(1e0, 1e2, 1e3);
	
	uv *= res;
	
	vec3 uv0 = floor(mod(uv, res))*s;
	vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
	
	vec3 f = fract(uv); f = f*f*(3.0-2.0*f);

	vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
		      	  uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);

	vec4 r = fract(sin(v*1e-1)*1e3);
	float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
	
	r = fract(sin((v + uv1.z - uv0.z)*1e-1)*1e3);
	float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
	
	return mix(r0, r1, f.z)*2.-1.;
}


void main( ) 
{
    vec2 p = -0.42 + 0.84 *vUv;
	//vec2 p = -.5 + gl_FragCoord.xy / resolution.xy;
	//p.x *= resolution.x/resolution.y;
	
    //p.x *= 1.5;
    
	float color = 3.0 - (3.*length(2.*p));
    
	vec3 coord = vec3(atan(p.x,p.y)/6.2832+.5, length(p)*.4, .5);
	
    coord = 1.0 - coord;

    //for(int i = 1; i <= 2; i++) {
        float power = pow(2.0, float(1));
        color += (0.4 / power) * snoise(coord + vec3(0.,-iTime*.05, iTime*.01), power*16.);
    //}

    color = 1.0 - color;
    color *= 2.7;
    color *= smoothstep(0.43, 0.4, length(p));

    //
    float pct = distance(vUv,vec2(0.5));
    // set solid background
    float y = smoothstep(0.35,0.525,pct);

    if(iOpened == 1){
        if(iPortal == 0){
            gl_FragColor = vec4(pow(max(color,0.),3.)*0.15, pow(max(color,0.),2.)*0.4, color, y);

            gl_FragColor = vec4(mix(vec3(1, 0.2, 0),vec3(color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15),color),y);
        }else{
            gl_FragColor = vec4(mix(vec3(0, 0.2, 1),vec3(pow(max(color,0.),3.)*0.15, pow(max(color,0.),2.)*0.4, color),color),y);
        }
    }else{
        if(iPortal == 0){
            //gl_FragColor  = vec4(color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15 , y);
            gl_FragColor = vec4(pow(max(color,0.),3.)*0.15, pow(max(color,0.),2.)*0.4, color, y);
        
            gl_FragColor = vec4(mix(vec3(1, 0.2, 0),vec3(color, pow(max(color,0.),2.)*0.4, pow(max(color,0.),3.)*0.15),color),1.0);
        }else{
            gl_FragColor = vec4(mix(vec3(0, 0.2, 1),vec3(pow(max(color,0.),3.)*0.15, pow(max(color,0.),2.)*0.4, color),color),1.0);
        }
    }

}
`;

const generateMeshPortalShader = () => {

    var mat = new ShaderMaterial({
        uniforms: {
            iTime: {
                type: 'f',
                value: 0.1
            },
            resolution: {
                value: new Vector2(width, height)
            },
            iPortal: {
                value: 0
            },
            iOpened:{
                value: 0
            }
        },
        vertexShader: vshader,
        fragmentShader: fshader,
        side: 0,
        transparent: true,
        polygonOffset: true,
            polygonOffsetFactor: -10,
            depthWrite: false
    });

    var planegeometry = new CircleGeometry(GLOBALS.PORTAL_WIDTH, 50);
    planegeometry.computeBoundsTree();
    var plane = new Mesh(planegeometry, mat);
    plane.name = "portal-0";
    plane.renderOrder = -1;
    GLOBALS.PORTAL_SHADER[0] = plane;

    var mat2 = new ShaderMaterial({
        uniforms: {
            iTime: {
                type: 'f',
                value: 0.1
            },
            resolution: {
                value: new Vector2(width, height)
            },
            iPortal: {
                value: 1
            },
            iOpened:{
                value: 0
            }
        },
        vertexShader: vshader,
        fragmentShader: fshader,
        side: 0,
        transparent: true,
        polygonOffset: true,
            polygonOffsetFactor: -10,
            depthWrite: false
    });

    var planegeometry = new CircleGeometry(GLOBALS.PORTAL_WIDTH, 50);
    planegeometry.computeBoundsTree();
    var plane = new Mesh(planegeometry, mat2);
    plane.renderOrder = -1;
    plane.name = "portal-1";
    GLOBALS.PORTAL_SHADER[1] = plane;
};

export {
    generateMeshPortalShader
};