import * as THREE from '../../build/three.module.js';

const AddGoo = function (found) {

    console.log("1111111111")
    //console.log(found)

    for (var i = 0; i < found.length; i++) {

        var userData = window.planeUserData[found[i].instanceId];
        //console.log(userData);

        if (userData.side != "down") {
            continue;
        } else {

            /*var box1 = getPlaneByName((userData.position.x + 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
            var box2 = getPlaneByName((userData.position.x - 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);

            var box3 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z + 1));
            var box4 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z - 1));

            console.log(box1)
            console.log(box2)
            console.log(box3)
            console.log(box4)*/

            /*for (var x = 0; x < 2; x++) {

                

                for (var z = 0; z < 2; z++) {


                }

            }*/

            goo = [];

            if (!userData.hasGoo)
                checkSides(userData)
        }

    }

    console.log(goo)

    const geometry = new THREE.BoxGeometry(2, 2, 1.8);
    const plane = new THREE.Mesh(geometry, material);
    plane.rotation.x = -Math.PI / 2;
    //scene.add(plane);
    console.log(material)

    for (var i = 0; i < goo.length; i++) {

        var clone = plane.clone();
        clone.position.copy(goo[i]);
        //clone.translateZ(1.8);
        clone.translateZ(0.9);
        window.GOO.add(clone);
    }
};

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

    //console.log(box1)
    //console.log(box2)
    //console.log(box3)
    //console.log(box4)
    //console.log(goo)
}

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

const vshader = `
uniform vec2 uvScale;
			varying vec2 vUv;

			void main()
			{

				vUv = uvScale * uv;
				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
				gl_Position = projectionMatrix * mvPosition;

			}
`;

const fshader = `
uniform sampler2D iChannel0;
uniform sampler2D iChannel1;
uniform float time;
uniform vec2 resolution;

float noise(in vec3 x)
{
    vec3 p = floor(x);
    vec3 f = fract(x);
	f = smoothstep(0.0, 1.0, f);
	
	vec2 uv = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
	vec2 rg = texture(iChannel1, (uv + 0.5) / 256.0, -100.0).yx;
	return mix(rg.x, rg.y, f.z) * 2.0 - 1.0;
}

vec2 swirl(in vec2 p)
{
	return vec2(noise(vec3(p.xy, .9)), noise(vec3(p.yx, .9)));
}

varying vec2 vUv;

void main()
{
	vec2 fragCoord = vUv * resolution;
    vec4 col = vec4(1.0, 0.9, 0.0, 1.0);

    for(int i = 0; i < 3; i++) 
		col += texture(iChannel0, fragCoord + 0.01 * swirl(9.66 * fragCoord + time * 0.33)) * col * col;

    gl_FragColor = col * 0.066;
}
`;

const textureLoader = new THREE.TextureLoader();

const cloudTexture = textureLoader.load('./assets/textures/lava/lavatile2.jpg');
const lavaTexture = textureLoader.load('./assets/textures/lava/1.png');

lavaTexture.colorSpace = THREE.SRGBColorSpace;

cloudTexture.wrapS = cloudTexture.wrapT = THREE.RepeatWrapping;
lavaTexture.wrapS = lavaTexture.wrapT = THREE.RepeatWrapping;

var uniforms = {
    
    resolution: {
        type: "v2",
        value: new THREE.Vector2(2, 2)
    },
    'fogDensity': {
        value: 0.0
    },
    'fogColor': {
        value: new THREE.Vector3(0, 0, 0)
    },
    'time': {
        value: 0.0
    },
    'uvScale': {
        value: new THREE.Vector2(0.5, 0.5)
    },
    'iChannel0': {
        value: cloudTexture
    },
    'iChannel1': {
        value: lavaTexture
    }

};

const material = new THREE.ShaderMaterial({

    uniforms: uniforms,
    vertexShader: vshader,
    fragmentShader: fshader

});

var clock = new THREE.Clock();

function renderGoo(){
    //const delta = 5 * clock.getDelta();
    //uniforms[ 'time' ].value += 0.2 * delta;

    uniforms[ 'time' ].value += clock.getDelta();
    
    //window.uniformsBridge[ 'iTime' ].value += clock.getDelta();
}

export {
    AddGoo,
    renderGoo
};