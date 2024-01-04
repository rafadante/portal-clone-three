import * as THREE from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
    GLOBALS
} from '../../Globals.js';
import {
    Water
} from '../../Water.js';

var GOO = null;
var water;

const AddGoo = function (found, loading) {

    if (GOO == null) {
        GOO = new THREE.Group();
        GLOBALS.SCENE.add(GOO);
    }

    if (!loading) {
        for (var i = 0; i < found.length; i++) {

            var userData = GLOBALS.PLANE_USER_DATA[found[i].instanceId];

            if (userData.side != "down") {
                continue;
            } else {

                /*var box1 = getPlaneByName((userData.position.x + 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
                var box2 = getPlaneByName((userData.position.x - 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
    
                var box3 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z + 1));
                var box4 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z - 1));
    
                */

                /*for (var x = 0; x < 2; x++) {
    
                    
    
                    for (var z = 0; z < 2; z++) {
    
    
                    }
    
                }*/

                goo = [];

                if (!userData.hasGoo)
                    checkSides(userData)
            }

        }

        /*
    
        const geometry = new THREE.PlaneGeometry(2, 2);
        const plane = new THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI / 2;
    
        for (var i = 0; i < goo.length; i++) {
            var clone = plane.clone();
            clone.position.copy(goo[i]);
            clone.translateZ(1.8);
            GOO.add(clone);
        }*/

        //

        /*var mesh = new THREE.InstancedMesh(geometry.clone(), material, goo.length);
        mesh.receiveShadow = true;
        mesh.frustumCulled = false;
        GOO.add(mesh);
    
        for (var i = 0; i < goo.length; i++) {
    
            var dummy = new THREE.Object3D();
    
            dummy.rotation.set(0, 0, 0);
            dummy.rotation.x = -Math.PI / 2;
    
            dummy.position.copy(goo[i]);
            dummy.translateZ(1.8);
            dummy.updateMatrix();
    
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        mesh.computeBoundingSphere();*/

        //------------------------

        /*goo = [
            new THREE.Vector3(7,0,5),
            new THREE.Vector3(7,0,7),
            new THREE.Vector3(7,0,3)]*/
    } else {
        goo = found;
    }

    const geometry = new THREE.PlaneGeometry(2, 2);
    const geometries = [];
    const matrix = new THREE.Matrix4();

    GLOBALS.GOO_PLANES.push(goo)

    for (let i = 0; i < goo.length; i++) {

        var dummy = new THREE.Object3D();

        dummy.rotation.set(0, 0, 0);
        dummy.rotation.x = -Math.PI / 2;

        dummy.position.copy(goo[i]);
        dummy.translateZ(1.79);
        dummy.updateMatrix();

        matrix.compose(dummy.position, dummy.quaternion, dummy.scale);
        //randomizeMatrix(matrix);

        const instanceGeometry = geometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        geometries.push(instanceGeometry);

    }

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    // mergedGeometry.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI))

    var mesh = new THREE.Mesh(mergedGeometry, new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x964B00)
    })); //material

    const waterGeometry = new THREE.PlaneGeometry(1000, 1000);

    water = new Water(
        waterGeometry, {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load('assets/textures/waternormals.jpg', function (texture) {

                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 0.4,
            alpha: 0.8
        }
    );

    //water.updateMatrix();

    water.rotation.x = -Math.PI / 2;
    water.position.set(0, -0.2, 0)
    water.material.transparent = true;
    console.log(water)

    GOO.add(water);
    GOO.add(mesh);

    var bb = new THREE.Box3(); // for re-use
    bb.setFromObject(mesh);
    bb.max.y += 0.2;

    GLOBALS.GOO_BOXES.push(bb);
};

const randomizeMatrix = function () {

    const position = new THREE.Vector3();
    const quaternion = new THREE.Quaternion();
    const scale = new THREE.Vector3();

    return function (matrix) {

        position.x = Math.random() * 40 - 20;
        position.y = Math.random() * 40 - 20;
        position.z = Math.random() * 40 - 20;

        quaternion.random();

        scale.x = scale.y = scale.z = Math.random() * 1;

        matrix.compose(position, quaternion, scale);

    };

}();

var goo = [];

function checkSides(userData) {


    var box1 = getPlaneByName((userData.position.x + 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
    if (box1.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position))
            goo.push(userData.position)

        var userData2 = getPlaneByName((userData.position.x + 2) + "/" + userData.position.y + "/" + userData.position.z);
        if (userData2.length > 0) {
            if (!userData2[0].hasGoo)
                checkSides(userData2[0])
        }
    }

    var box2 = getPlaneByName((userData.position.x - 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
    if (box2.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position))
            goo.push(userData.position)

        var userData2 = getPlaneByName((userData.position.x - 2) + "/" + userData.position.y + "/" + userData.position.z);
        if (userData2.length > 0) {
            if (!userData2[0].hasGoo)
                checkSides(userData2[0])
        }
    }

    var box3 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z + 1));
    if (box3.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position))
            goo.push(userData.position)

        var userData2 = getPlaneByName(userData.position.x + "/" + userData.position.y + "/" + (userData.position.z + 2));
        if (userData2.length > 0) {
            if (!userData2[0].hasGoo)
                checkSides(userData2[0])
        }
    }

    var box4 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z - 1));
    if (box4.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position))
            goo.push(userData.position)

        var userData2 = getPlaneByName(userData.position.x + "/" + userData.position.y + "/" + (userData.position.z - 2));
        if (userData2.length > 0) {
            if (!userData2[0].hasGoo)
                checkSides(userData2[0])
        }
    }
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

// Vertex Shader
const vertexShader = `
varying vec2 vUv;
uniform float iTime;

void main() {
    //vUv = uv;
    vUv = vec2(position.x,position.z)*0.5;
    
    // Add a sine wave displacement to the y-coordinate of the position
    vec3 displacedPosition = position;
    displacedPosition.y += sin(position.x * 5.0 + iTime) * 0.02; // Adjust the frequency and amplitude as needed

    gl_Position = projectionMatrix * modelViewMatrix * vec4(displacedPosition, 1.0);
}
`;

// Fragment Shader
const fragmentShader = `
#define PI 3.141592654

uniform float iTime;
varying vec2 vUv;

vec2 rot(vec2 p, float a) {
    float c = cos(a * 15.83);
    float s = sin(a * 15.83);
    return p * mat2(s, c, c, -s);
}

void mainImage(out vec4 o, in vec2 uv) {
    uv = vUv;
    uv = vec2(.125, .75) + (uv - vec2(.125, .75)) * .01; // Adjust the offset
    float T = iTime * .25;

    vec3 c = clamp(1. - .7 * vec3(
        length(uv - vec2(.1, 0)),
        length(uv - vec2(.9, 0)),
        length(uv - vec2(.5, 1))
    ), 0., 1.) * 2. - 1.;

    vec3 c0 = vec3(0);
    float w0 = 0.;
    const float N = 20.;

    for (float i = 0.; i < N; i++) {
    float wt = (i * i / N / N - .2) * .3;
    float wp = 0.5 + (i + 1.) * (i + 1.5) * 0.001;
    float wb = .05 + i / N * 0.1;
    c.zx = rot(c.zx, 1.6 + T * 0.65 * wt + (uv.x + .7) * 23. * wp);
    //c.xy = rot(c.xy, c.z * c.x * wb + 1.7 + T * wt + (uv.y + 1.1) * 15. * wp);
    //c.yz = rot(c.yz, c.x * c.y * wb + 2.4 - T * 0.79 * wt + (uv.x + uv.y * (fract(i / 2.) - 0.25) * 4.) * 17. * wp);
    //c.zx = rot(c.zx, c.y * c.z * wb + 1.6 - T * 0.65 * wt + (uv.x + .7) * 23. * wp);
    //c.xy = rot(c.xy, c.z * c.x * wb + 1.7 - T * wt + (uv.y + 1.1) * 15. * wp);
    float w = (1.5 - i / N);
    c0 += c * w;
    w0 += w;
    }

     c0 = c0 / w0 * 2.0 + 0.5;

    // Adjust the values to achieve a brown color and reduce colorfulness
    c0 *= vec3(0.4, 0.2, 0.1);
    //c0 += pow(length(sin(c0 * PI * 4.0)) / sqrt(3.0) * 1.0, 20.0) * (0.3 + 0.7 * c0);;

    o = vec4(c0, 1.0);
}

void main() {
    vec4 color;
    mainImage(color, vUv);
    gl_FragColor = color;

    #include <tonemapping_fragment>
    #include <encodings_fragment>
}
`;

var uniforms = {
    iTime: {
        value: 0
    }
};

const material = new THREE.ShaderMaterial({

    uniforms: uniforms,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    side: 2

});


var clock = new THREE.Clock();
var clock2 = new THREE.Clock();
var delta = 0;
const interval = 1 / 20;

function renderGoo() {
    delta += clock2.getDelta();

    /*if (delta > interval) {
        // The draw or time dependent code are here
        renderGoo2();
        delta = delta % interval;
    }*/

    renderGoo2();
}

function renderGoo2() {
    //const delta = 5 * clock.getDelta();
    //uniforms[ 'time' ].value += 0.2 * delta;

    //uniforms['iTime'].value += clock.getDelta();
    if (water)
        water.material.uniforms['time'].value += 0.0005;

}

export {
    AddGoo,
    renderGoo
};