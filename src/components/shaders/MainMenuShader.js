import {
    TextureLoader,
    ShaderMaterial,
    Vector2
} from 'three';
import { GLOBALS } from '../../Globals';

const width = window.innerWidth;
const height = window.innerHeight;

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
// inspired by shader from VoidChicken
// https://www.shadertoy.com/view/XtdXR2
// ... and portal of course ;)

uniform vec2 resolution;
uniform float iTime;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform bool start;

uniform int dir;
uniform float dirVal;

// 1 .. 3
const int transitionType = 1;
bool transitionStarted = false; // Variable to track if the transition has started
float transitionProgress = 0.0; // Variable to control the transition progress

varying vec2 vUv;

void main()
{

    gl_FragColor = vec4(0);
    float depth = -1e3;
    for (float i=0. ; i<=1. ; ++i)
    {
        vec2 fragCoord = vUv * resolution;
        vec2 xy = fragCoord - resolution.xy / 2.0;

        //vec2 xy = fragCoord - iResolution / 2.0;
        //vec2 xy = vUv * resolution / 2.0;
        //vec2 xy = vUv;
        //vec2 xy = -0.1 + 1.0 *vUv;

        float grid_width = 100.0;//159
        xy /= grid_width;
        xy.y += i + .5;
        xy.y /= 2.;
        vec2 grid = floor(xy);
        xy -= grid + 0.5;
        xy.y *= 2.;
        grid.y = grid.y * 2. - i;

        float phase = 0.0;
        float offset = (grid.y - grid.x)*dirVal;
        float time = iTime*1.5 - offset;
        if (transitionType == 1)
        {
            // Check if the transition has not started yet
            if (!transitionStarted)
            {
                // Increment the transitionProgress only once
                transitionProgress += 1.0;
                
                // Set time based on transitionProgress
                float time = mod(transitionProgress, 6.0);
                
                // If one full cycle has occurred, set the transitionStarted flag to true
                if (transitionProgress >= 6.0)
                {
                    transitionStarted = true;
                    
                    // Reset transitionProgress to ensure the transition effect doesn't continue
                    transitionProgress = 0.0;
                }
                
                // Apply your transition effect here based on the value of 'time'
                // This effect will run once and then stop
                // For example, you can use 'time' to control the progress of the transition.
                // The effect will complete in one cycle, and then the flag will be set, stopping further transitions.
            }
        }

        //phase += smoothstep(0.0, 1.0, time);
        phase += 1.0 - smoothstep(3.0, 4.0, time);
        phase = abs(mod(phase, 2.0)-1.0);
        
        float side = step(0.5, phase);

        float angle = radians(phase * 180.), z = 2.;
        vec3 p = inverse(mat3(cos(angle),0,-sin(angle), 0,1,0, 0,0,z)) * vec3(xy, z);
        vec2 uv = p.xy / p.z + .5;

        float alpha = 1.;
        if (uv.x>0.0&&uv.y>0.0&&uv.x<1.0&&uv.y<1.0 && p.z>depth)
            depth = p.z;
        else
            alpha = 0.;

        vec2 scale = grid_width / resolution.xy;
        vec2 uv1 = (grid + uv) * scale + .5;
        vec2 uv2 = (grid + vec2(1. - uv.x, uv.y)) * scale + .5;

        vec4 c1;
        vec4 c2;

        if(dir == 0){
            c1 = texture(iChannel0, uv1);
            c2 = texture(iChannel1, uv2);
        }else{
            c1 = texture(iChannel1, uv1);
            c2 = texture(iChannel0, uv2);
        }
        

        gl_FragColor = mix(gl_FragColor, mix(c1, c2, side), alpha);
        //gl_FragColor = mix(gl_FragColor, vec4(p.z-1., 1.-p.z, 0, 1)*10., alpha);
    }
}
`;

var background = new TextureLoader().load('./assets/loading/3.webp');
GLOBALS.TEXTURE_MENU_GRID = new TextureLoader().load('./assets/ui/grid.webp');

GLOBALS.MATERIAL_MAIN_MENU = new ShaderMaterial({
    uniforms: {
        iTime: {
            type: 'f',
            value: 1.2
        },
        resolution: {
            type: "v2",
            value: new Vector2(width, height)
        },
        iChannel0: {
            type: "t",
            value: background,
        },
        iChannel1: {
            type: "t",
            value: GLOBALS.TEXTURE_MENU_GRID,
        },
        dir: {
            value: 0
        },
        dirVal: {
            value: -0.1
        }
    },
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true,
});

GLOBALS.MATERIAL_SUB_MENU = new ShaderMaterial({
    uniforms: {
        iTime: {
            type: 'f',
            value: 1.2
        },
        resolution: {
            type: "v2",
            value: new Vector2(width, height)
        },
        iChannel0: {
            type: "t",
            value: background,
        },
        iChannel1: {
            type: "t",
            value: GLOBALS.TEXTURE_MENU_GRID,
        },
        dir: {
            value: 1
        },
        dirVal: {
            value: 0.1
        }
    },
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true,
});