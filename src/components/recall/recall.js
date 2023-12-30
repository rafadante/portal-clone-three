import * as THREE from 'three';
import {
    TWEEN
} from '../../Tween.js';
import {
    MeshLineGeometry,
    MeshLineMaterial,
} from 'meshline';
import {
    tweenCamera
} from '../../Main.js';
import {
    PostRender
} from '../../usePostRender.js';
import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';

window.pickingToRecall = false;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function recall() {
    raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(GLOBALS.INTERACTIVE);

    if (intersects.length > 0) {
        var instancedId = intersects[0].instanceId;
        var name = intersects[0].object.name;
        var item = GLOBALS.DYMANIC_ITEMS[name][instancedId];

        if (item.body.arrayPos.length > 0) {
            recallingItem = item.body;
            item.body.recall = true;
            window.recalling = true;
            transport(item, item.body.arrayPos.length - 1);

        }
    }
}


function recallRay() {
    raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(arr);

    if (intersects.length > 0) {
        intersects[0].object.parent.visible = true;
        //console.log(intersects[0].object.parent.name)
        /*var instancedId = intersects[0].instanceId;
        var name = intersects[0].object.name;

        console.log(name)
        window.groupRecall.getObjectByName("name").visible = true;*/
    } else {
        for (var i = 0; i < window.groupRecall.children.length; i++) {
            if (!window.groupRecall.children[i].material)
                window.groupRecall.children[i].visible = false;
        }
    }
}

function tweenCamera2(duration, ini, final, item, end2) {
    var obj = new THREE.Object3D();
    GLOBALS.SCENE.add(obj)
    obj.quaternion.copy(ini.clone());
    new TWEEN.Tween(ini).to(final, duration)
        .onUpdate((tween) => {
            obj.quaternion.slerp(final, 0.1);
            item.body.quaternion.copy(obj.quaternion);
        })
        .start();
}

var timeouts = [];
window.recalling = false;
var recallingItem;

function transport(item, i) {
    tweenCamera(10, item.body.position, item.body.arrayPos[i])

    var obj = new THREE.Object3D();
    obj.quaternion.copy(item.body.quaternion);
    tweenCamera2(10, obj.quaternion, item.body.arrayRot[i], item, item.body.arrayPos[i])

    if (i > 0) {
        timeouts.push(setTimeout(() => {
            transport(item, i -= 1)
        }, 10))
    } else {
        item.body.recall = false;
        //item.body.allowSleep = true;
        window.recalling = false;
        item.body.arrayPos = [];
        item.body.arrayRot = [];

        // Velocity
        item.body.velocity.setZero();
        item.body.initVelocity.setZero();
        item.body.angularVelocity.setZero();
        item.body.initAngularVelocity.setZero();

        // Force
        item.body.force.setZero();
        item.body.torque.setZero();

        var aa = {
            value: 1
        };

        new TWEEN.Tween(aa, false)
            .to({
                value: 0
            }, 500)
            .onUpdate(() => {
            })
            .start();

        setTimeout(() => {
            // Sleep state reset
            item.body.sleepState = 0;
            item.body.timeLastSleepy = 0;
            item.body._wakeUpAfterNarrowphase = false;
        }, 2000)

    }
}

var arr = [];

function KeyZ() {
    window.pickingToRecall = !window.pickingToRecall;

    if (window.pickingToRecall) {

        window["RECAL"]();
        $("#viewer-3d").css("filter", "sepia(0.5)")

        window.groupRecall = new THREE.Group();
        GLOBALS.SCENE.add(window.groupRecall)

        var it = 0;
        arr = [];

        for (let d of GLOBALS.DYNAMIC_OBJECTS) {

            if (d.name == "player")
                continue;

            const points = [];

            var geometry;

            var g = new THREE.Group();

            if (d.name.includes("sphere"))
                geometry = new THREE.SphereGeometry(0.33, 32, 16);
            else
                geometry = new THREE.BoxGeometry(0.66, 0.66, 0.66);

            const material = new THREE.MeshBasicMaterial({
                color: 0xffff00,
                transparent: true,
                opacity: 0.5
            });

            var newArray = [];
            var newArrayRot = [];
            var holdValue;

            for (var i = 0; i < d.arrayPos.length; i++) {
                if (i > 0) {
                    if (d.arrayPos[i].distanceTo(holdValue) > 0.2) {
                        newArray.push(d.arrayPos[i]);
                        newArrayRot.push(d.arrayRot[i]);
                        holdValue = d.arrayPos[i];
                    }
                } else {
                    holdValue = d.arrayPos[i];
                    newArray.push(d.arrayPos[i]);
                    newArrayRot.push(d.arrayRot[i]);
                }
            }

            console.log(d.arrayPos)
            console.log(newArray)

            var length = newArray.length;
            var values = parseInt(length / 5);
            console.log(values)

            for (var i = 0, j = 0; i < 5; i++, j += values) {
                //console.log(newArray[j])
                points.push(newArray[j].x, newArray[j].y, newArray[j].z)
                var cube = new THREE.Mesh(geometry, material);
                cube.position.copy(newArray[j]);
                cube.quaternion.copy(newArrayRot[j]);
                console.log(cube)
                g.add(cube);
            }

            points.push(d.arrayPos[d.arrayPos.length - 1].x, d.arrayPos[d.arrayPos.length - 1].y, d.arrayPos[d.arrayPos.length - 1].z)

            var cube = new THREE.Mesh(geometry, material);
            cube.position.copy(d.arrayPos[d.arrayPos.length - 1]);
            cube.quaternion.copy(d.arrayRot[d.arrayPos.length - 1]);
            g.add(cube);

            console.log(cube)

            var clone = cube.clone();
            window.groupRecall.add(clone);

            const geometry2 = new MeshLineGeometry();
            geometry2.setPoints(points, (p) => 2 + Math.sin(50 * p));

            var texture = new THREE.TextureLoader().load("./assets/circle.png");
            texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

            const material2 = new MeshLineMaterial({
                color: new THREE.Color(0xffff00),
                map: texture,
                useMap: 1,
                side: 2,
                transparent: true,
                lineWidth: 0.02,
                repeat: new THREE.Vector2(100, 1),
                //dashArray: 0
            });

            console.log(material2)

            const line = new THREE.Mesh(geometry2, material2)
            g.add(line);

            g.visible = false;
            console.log(d)
            d.name = "item-" + it;
            g.name = d.name;

            arr.push(g);

            window.groupRecall.add(g);
            it++;
        }
        GLOBALS.STOP_TIME = true;
    } else {
        GLOBALS.SCENE.remove(window.groupRecall)
        GLOBALS.STOP_TIME = false;
        $("#viewer-3d").css("filter", "sepia(0)")
    }

}

function KeyQ() {
    GLOBALS.STOP_TIME = false;
    $("#viewer-3d").css("filter", "sepia(0)")
    if (window.recalling) {
        for (var i = 0; i < timeouts.length; i++) {
            clearTimeout(timeouts[i]);
        }
        timeouts = [];

        recallingItem.recall = false;
        //recallingItem.allowSleep = true;
        window.recalling = false;
        recallingItem.arrayPos = [];
        recallingItem.arrayRot = [];

        var aa = {
            value: 1
        };

        new TWEEN.Tween(aa, false)
            .to({
                value: 0
            }, 500)
            .onUpdate(() => {
            })
            .start();
    } else {

        if (window.pickingToRecall) {
            GLOBALS.SCENE.remove(window.groupRecall)
            window.pickingToRecall = false;
        }

        var aa = {
            value: 0
        };

        new TWEEN.Tween(aa, false)
            .to({
                value: 1
            }, 500)
            .onUpdate(() => {
            })
            .start();

        recall();
    }
}

let Post = PostRender();
let Ref = {};

window["RECAL"] = function () {

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Setup
    Ref.mat = customMaterial(Post.colorTexture, Post.depthTexture);
    Post.postMaterial = Ref.mat;
    //Post.createRenderLoop( null, onPostRender ).start();

    console.log(Ref)
    console.log(Post)
}

window["TTT"] = function (dt, et) {

    if (Ref.mat) {
        Ref.mat.et = et;
    }

}

// #endregion

function customMaterial(tex, depth) {
    // Assuming you have a texture loaded, you can set it in your code
    const hex = new THREE.TextureLoader().load('./assets/textures/shaders/hex2.jpg'); // Adjust the path accordingly
    hex.wrapS = hex.wrapT = THREE.RepeatWrapping;
    //hex.repeat.set( 0.1, 0.1 );

    const mat = new THREE.RawShaderMaterial({
        name: 'SonarPostEffectMaterial',
        depthTest: true,
        transparent: false,
        alphaToCoverage: false,
        uniforms: {
            texColor: {
                type: 'sampler2D',
                value: tex
            },
            texDepth: {
                type: 'sampler2D',
                value: depth
            },
            textureSampler: {
                type: 'sampler2D',
                value: hex
            },
            et: {
                type: 'float',
                value: 0
            },
            textureScale: {
                type: 'v2',
                value: new THREE.Vector2(6.0, 6.0)
            },
            borderColor: {
                type: 'v3',
                value: new THREE.Vector3(1.0, 1.0, 1.0)
            },
            playerPosition: {
                type: 'v3',
                value: new THREE.Vector3(-GLOBALS.PLAYER.position.x,
                    0.0, -GLOBALS.PLAYER.position.z)
            },
        },
        glslVersion: THREE.GLSL3,
        vertexShader: `
        in vec2 position;
		in vec2 uv;

        out vec2 fragUV;

        void main(){            
            fragUV      = uv;
            gl_Position = vec4( position, 0.0, 1.0 );
        }`,

        fragmentShader: `
        precision mediump float;
        
        uniform mediump mat4 viewMatrix;
        uniform mediump mat4 projectionMatrix;
        
        uniform sampler2D texColor;
        uniform sampler2D texDepth;
        uniform sampler2D textureSampler;  // Texture sampler
        uniform vec2 textureScale;  // Scale factor for tiling
        uniform vec3 borderColor;  // Color for the border
        uniform vec3 playerPosition;  // Color for the border
        uniform float     et;
        
        in  vec2 fragUV;
        out vec4 outColor;

        // #####################################################

        // https://stackoverflow.com/questions/32227283/getting-world-position-from-depth-buffer-value
        // this is supposed to get the world position from the depth buffer
        vec3 worldPosFromDepth( vec2 texCoord, float depth) {
            vec4 clipPos = vec4( texCoord * 2.0 - 1.0, depth * 2.0 - 1.0, 1.0 );
            vec4 viewPos = inverse( projectionMatrix ) * clipPos;
            
            // Perspective division
            // viewPos /= viewPos.w;
            
            vec4 worldPos = inverse( viewMatrix ) * viewPos;
            return worldPos.xyz / worldPos.w;
        }

        // #####################################################

        void main() {
            vec4 color = texture(texColor, fragUV);
            outColor = color;
        
            float depth = texture(texDepth, fragUV).x;
            vec3 wPos = worldPosFromDepth(fragUV, depth);

            // Shift the origin by a fixed offset
            vec3 offset = playerPosition;  // Adjust these values for the desired offset
            wPos += offset;
        
            // Define the number of sonars, their interval, and velocity
            int numSonars = 2;
            float sonarInterval = 2.0;  // Adjust this value for the interval between sonars
            float sonarVelocity = 2.0;  // Adjust this value for the constant velocity
        
            for (int i = 0; i < numSonars; i++) {
                // Calculate the time-dependent factor for each sonar
                float timeFactor = sin((et - float(i) * sonarInterval) * 0.5);
        
                // Calculate the velocity-dependent factor for constant speed
                float velocityFactor = sonarVelocity * (et - float(i) * sonarInterval);
        
                float t = fract((et + timeFactor + velocityFactor) / 6.0);
                float radius = mix(2.2, 10.0, t);
                float space = mix(1.0, 1.5, t);
                float alpha = 1.0 - t;
        
                float dist = length(wPos);
                if (dist < radius) {

                    // Tile the texture by multiplying the UV coordinates
                    vec2 tiledUV = fragUV * textureScale;

                    // Sample the texture and apply it to the outColor.rgb
                    vec4 textureColor = texture(textureSampler, tiledUV);

                    // Blend the texture color with the border color using borderAlpha
                    vec3 blendedColor = mix(borderColor.rgb, textureColor.rgb, alpha);
        
                    outColor.rgb = mix(
                        outColor.rgb,
                        textureColor.rgb,
                        smoothstep(radius - space, radius, dist) * alpha
                    );
                }
            }
        }`,
    });

    Object.defineProperty(mat, 'et', {
        set(v) {
            mat.uniforms.et.value = v;
        }
    });

    return mat;
}

export {
    KeyQ,
    KeyZ,
    recallRay
};