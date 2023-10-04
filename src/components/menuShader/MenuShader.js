import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

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
        float offset = (grid.y - grid.x)*-0.1;
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
        else if (transitionType == 2)
            // flip once
            time = clamp(time - 1., 0., 1.);
        else if (transitionType == 3)
            ;// flip and return once
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
        vec4 c1 = texture(iChannel0, uv1);
        vec4 c2 = texture(iChannel1, uv2);

        gl_FragColor = mix(gl_FragColor, mix(c1, c2, side), alpha);
        //gl_FragColor = mix(gl_FragColor, vec4(p.z-1., 1.-p.z, 0, 1)*10., alpha);
    }
}
`;

const fshader2 = `
// inspired by shader from VoidChicken
// https://www.shadertoy.com/view/XtdXR2
// ... and portal of course ;)

uniform vec2 resolution;
uniform float iTime;
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform bool start;

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
        float offset = (grid.y - grid.x)*0.1;
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
        else if (transitionType == 2)
            // flip once
            time = clamp(time - 1., 0., 1.);
        else if (transitionType == 3)
            ;// flip and return once
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
        vec4 c1 = texture(iChannel1, uv1);
        vec4 c2 = texture(iChannel0, uv2);

        gl_FragColor = mix(gl_FragColor, mix(c1, c2, side), alpha);
        //gl_FragColor = mix(gl_FragColor, vec4(p.z-1., 1.-p.z, 0, 1)*10., alpha);
    }
}
`;

const width = window.innerWidth;
const height = window.innerHeight;

var background = new THREE.TextureLoader().load('./assets/loading/3.jpg');

var grid1 = new THREE.TextureLoader().load('./assets/ui/grid1.jpg');
var grid2 = new THREE.TextureLoader().load('./assets/ui/grid2.jpg');
var grid3 = new THREE.TextureLoader().load('./assets/ui/grid3.jpg');
var grid4 = new THREE.TextureLoader().load('./assets/ui/grid4.jpg');
var grid5 = new THREE.TextureLoader().load('./assets/ui/grid5.jpg');

window.tuniform = {
    iTime: {
        type: 'f',
        value: 1.2
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2(width, height)
    },
    iChannel0: {
        type: "t",
        value: background,
    },
    iChannel1: {
        type: "t",
        value: grid1,
    },
};

window.tuniform2 = {
    iTime: {
        type: 'f',
        value: 1.2
    },
    resolution: {
        type: "v2",
        value: new THREE.Vector2(width, height)
    },
    iChannel0: {
        type: "t",
        value: background,
    },
    iChannel1: {
        type: "t",
        value: grid1,
    },
};

var mat = new THREE.ShaderMaterial({
    uniforms: window.tuniform,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true,
});

var mat2 = new THREE.ShaderMaterial({
    uniforms: window.tuniform2,
    vertexShader: vshader,
    fragmentShader: fshader2,
    side: 2,
    transparent: true,
});

var plane1;
var plane2;

var transition = false;
var transition2 = false;
var stopMenuLoop = true;

$("#blocker").css("display", "none");
$("#ui").css("display", "block");
$("#container #back-effect").css("display", "none");
$("#main-container").css("display", "block");

$("#option-main").css("display", "none");
$("#options-settings").css("display", "block");
$("#settings-menu-title").text("OPTIONS");
$("#back-main").css("display", "none");
$("#settings-close").css("display", "block");
$("#main-container").css("display", "block");

if (!stopMenuLoop) {
    setTimeout(() => {
        var planegeometry = new THREE.PlaneGeometry(1, 1);
        plane1 = new THREE.Mesh(planegeometry, mat);
        window.MAIN_SCENE.add(plane1);

        var planegeometry = new THREE.PlaneGeometry(1, 1);
        plane2 = new THREE.Mesh(planegeometry, mat2);

        window.MAIN_SCENE.background = new THREE.Color(0x000000)

        planeFitPerspectiveCamera(plane1, window.MAIN_CAMERA)

        animate();
        window.addEventListener('resize', onWindowResize);

        setTimeout(() => {
            getMonitorFPS = false;
            console.log(window.unlockedFPS)
        }, 1000);
    }, 1000);
}



function onWindowResize() {
    window.RENDERER.setSize(window.innerWidth, window.innerHeight);
    window.COMPOSER.setSize(window.innerWidth, window.innerHeight);

    window.MAIN_CAMERA.aspect = window.innerWidth / window.innerHeight;
    window.MAIN_CAMERA.updateProjectionMatrix();
    planeFitPerspectiveCamera(plane1, window.MAIN_CAMERA)
}

function planeFitPerspectiveCamera(plane, camera, relativeZ = null) {
    const cameraZ = relativeZ !== null ? relativeZ : camera.position.z;
    const distance = cameraZ - plane.position.z;
    const vFov = camera.fov * Math.PI / 180;
    const scaleY = 2 * Math.tan(vFov / 2) * distance;
    const scaleX = scaleY * camera.aspect;

    plane.scale.set(scaleX, scaleY, 1);
    plane2.scale.set(scaleX, scaleY, 1);
}

$("body").on('click', '#option-community-build', function () {
    /*$("#blocker").css("display", "none");
    $("#ui").css("display", "block");
    $("#container #back-effect").css("display", "none");
    window.MAIN_SCENE.remove(plane1);
    window.MAIN_SCENE.remove(plane2);
    window.MAIN_SCENE.background = null;
    stopMenuLoop = true;*/

    $("#blocker .body").css("opacity", "0");
    $("#logo").css("opacity", "0");

    window.tuniform.iChannel0.value = window.tuniform.iChannel1.value;
    window.tuniform.iChannel1.value = null;
    window.tuniform.iTime.value = 1.2;

    transition = true;
    transition2 = false;
    window.MAIN_SCENE.add(plane1);
    window.MAIN_SCENE.remove(plane2);

    setTimeout(() => {
        $("#loading-parent").css("opacity", "1");

        setTimeout(() => {
            $("#blocker").css("display", "none");
            $("#ui").css("display", "block");
            $("#container #back-effect").css("display", "none");
            $("#blocker .body").css("opacity", "1");

            $(".option-main").css("display", "none");
            $("#options-settings").css("display", "block");
            $("#settings-menu-title").text("OPTIONS");
            $("#back-main").css("display", "none");
            $("#settings-close").css("display", "block");
            $("#main-container").css("display", "block");

            window.MAIN_SCENE.remove(plane1);
            window.MAIN_SCENE.remove(plane2);
            window.MAIN_SCENE.background = null;
            stopMenuLoop = true;
        }, 1000);
    }, 1000);
});

$("body").on('click', '#option-single', function () {
    optionMenu(grid1, "SINGLE PLAYER", "#options-single");
});

$("body").on('click', '#option-community', function () {
    optionMenu(grid2, "COMMUNITY CHAMBERS", "#options-community");
});

$("body").on('click', '#option-options', function () {
    $("#back-editor").css("display", "none");
    optionMenu(grid3, "OPTIONS", "#options-settings");
});

$("body").on('click', '#option-about', function () {
    optionMenu(grid4, "ABOUT", "#options-about");
});

$("body").on('click', '#option-patreon', function () {
    optionMenu(grid5, "PATREON", "#options-patreon");
});

function optionMenu(texture, title, id) {
    window.tuniform.iChannel1.value = texture;
    window.tuniform2.iChannel1.value = texture;
    window.tuniform.iTime.value = 1.2;
    window.tuniform2.iTime.value = 1.2;
    transition = true;

    if (transition2) {
        transition2 = false;
        window.MAIN_SCENE.add(plane1);
        window.MAIN_SCENE.remove(plane2);
    }

    pointerState("block", "none", title, "flex", id);
}

$("body").on('click', '#back-main', function () {
    window.tuniform2.iTime.value = 1.2;
    transition2 = true;
    transition = false;
    window.MAIN_SCENE.remove(plane1);
    window.MAIN_SCENE.add(plane2);

    pointerState("none", "block", "", "none", ".option-main");
});

function pointerState(display1, display2, title, titleDisplay, id) {
    console.log(id)
    $("#blocker .body").css("opacity", "0");
    $("#logo").css("opacity", "0");
    $("#blocker").css("pointer-events", "none");
    setTimeout(() => {
        $("#options-main").css("display", display2);
        $(id).css("display", display1);
        $("#back-main").css("display", display1);

        $("#settings-menu-title").css("display", titleDisplay);
        $("#settings-menu-title").text(title);

        $("#blocker").css("pointer-events", "all");
        $("#blocker .body").css("opacity", "1");
        $("#logo").css("opacity", "1");
    }, 2000);
}

let clock = new THREE.Clock();

var t = [];
var getMonitorFPS = true;
window.unlockedFPS = 0;

function animate(time) {
    if (!stopMenuLoop) {

        if (getMonitorFPS) {
            t.unshift(time);
            if (t.length > 10) {
                var t0 = t.pop();
                window.unlockedFPS = Math.floor(1000 * 10 / (time - t0));
            }
        }

        if (transition)
            window.tuniform.iTime.value += clock.getDelta();

        if (transition2)
            window.tuniform2.iTime.value += clock.getDelta();

        window.RENDERER.render(window.MAIN_SCENE, window.MAIN_CAMERA)
        requestAnimationFrame(animate);
    }
}