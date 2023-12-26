import * as THREE from 'three';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';

//
window.uniformsBridge = {
    'iTime': {
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
    
	gl_FragColor = vec4(colour, 0.5);
}
`;

const fshaderOrange = `
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
    colour = clamp(colour + vec3(1.0, 0.5, 0.0), 0.0, 1.0);
    
	gl_FragColor = vec4(colour, 0.5);
}
`;

window.materialBridge = new THREE.ShaderMaterial({
    uniforms: window.uniformsBridge,
    vertexShader: vshader,
    fragmentShader: fshader,
    side: 2,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5
});

window.materialBridgeOrange = new THREE.ShaderMaterial({
    uniforms: window.uniformsBridge,
    vertexShader: vshader,
    fragmentShader: fshaderOrange,
    side: 2,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -5
});

function createLightBridges(item, rayItem) {
    for (var i = 0; i < window.DYMANIC_ITEMS[item].length; i++) {
        if (window.DYMANIC_ITEMS[item][i].length != 0) {

            var obj = new THREE.Object3D();
            obj.position.copy(window.DYMANIC_ITEMS[item][i].position);
            obj.rotation.copy(window.DYMANIC_ITEMS[item][i].rotation);

            var vector = new THREE.Vector3();
            var raycaster = new THREE.Raycaster();

            vector.copy(obj.position);

            let dir = new THREE.Vector3()
            obj.getWorldDirection(dir)
            dir.normalize()

            raycaster.set(vector, dir);
            var intersects = raycaster.intersectObject(window.instancedMesh);

            var material = window.materialBridge;

            if (item == "light_bridge") {
                var geometry = new THREE.BoxGeometry(0.9, 0.025, intersects[0].distance);
                raycaster.name = "light_bridge";
                rayItem.push(raycaster);
            } else if (item == "tractor_beam") {
                var geometry = new THREE.CylinderGeometry(0.9, 0.9, intersects[0].distance, 32);
                raycaster.name = "tractor_beam";
                rayItem.push(raycaster);
                raycaster.beam = "blue";

                if (window.DYMANIC_ITEMS[item][i].beam == "orange") {
                    material = window.materialBridgeOrange;
                    raycaster.beam = "orange";
                }
            } else if (item == "laser_emitter") {
                var geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);
                raycaster.name = "laser_emitter";
                rayItem.push(raycaster);

                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(1, 0.15, 0)
                })
            }

            const plane = new THREE.Mesh(geometry, material); //materialBridge
            window.MAIN_SCENE.add(plane);

            if (item == "tractor_beam" || item == "laser_emitter") {
                plane.rotation.x = Math.PI / 2;
                plane.updateMatrix();
                plane.geometry.applyMatrix4(plane.matrix);
            }

            plane.position.copy(obj.position);
            plane.rotation.copy(obj.rotation);
            plane.translateZ(intersects[0].distance / 2);

            if (item == "laser_emitter") {
                plane.translateY(-0.6)
            }

            const result = threeToCannon(plane, {
                type: ShapeType.BOX
            });

            let PHYSICS_MATERIAL = new CANNON.Material();
            PHYSICS_MATERIAL.friction = 0.4; //0.01
            PHYSICS_MATERIAL.restitution = 0; //0.1

            var box = new CANNON.Body({
                shape: result.shape,
                mass: 0,
                material: window.PHYSICS_MATERIAL
            })

            box.position.copy(plane.position);
            box.quaternion.copy(plane.quaternion);

            if (item == "light_bridge") {
                box.collisionFilterGroup = window.CGROUP_ENVIRONMENT
                box.collisionFilterMask = 10;
                window.CANNON_WORLD.addBody(box);
            } else if (item == "tractor_beam") {
                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(plane);
                bb.side = 1;

                if (window.DYMANIC_ITEMS[item][i].beam == "orange")
                    bb.side = -1;

                plane.inTractor = false;
                window.tractorBeam.push(plane);
                window.tractorBeamBoundingBox.push(bb);
            } else if (item == "laser_emitter") {

                //var clone = plane.clone();
                //plane.scale.set(10,10,10);

                //var bb = new THREE.Box3(); // for re-use
                //bb.setFromObject(plane);

                //plane.inTractor = false;
                window.laserEmitter.push(plane);
                //window.laserEmitterBoundingBox.push(bb);
                //obj.position.copy(plane.position);
                //obj.rotation.copy(plane.rotation);

                obj.position.y = plane.position.y;
                obj.distance = intersects[0].distance;
                window.laserEmitterRaycaster.push(obj);
            }
        }
    }
}

//raycaster

window.tractorBeamBoundingBox = [];
window.tractorBeam = [];
window.raycastTractorBeam = [];

window.laserEmitterBoundingBox = [];
window.laserEmitter = [];
window.laserEmitterRaycaster = [];

function createLightBridgesFromPortal(portal, rayItem) {

    if (window.PORTALS[0] === null || window.PORTALS[1] === null)
        return

    for (var g = 0; g < rayItem.length; g++) {

        var intersects = rayItem[g].intersectObjects(window.portalShader);

        if (intersects.length > 0) {

            if (intersects[0].object.name == "portal-0")
                portal = 1;
            else
                portal = 0;

            if (rayItem[g].name == "light_bridge") {
                if (window.lightBridgesClone[g]) {
                    window.MAIN_SCENE.remove(window.lightBridgesClone[g]);
                    window.CANNON_WORLD.removeBody(window.lightBridgesColliderClone[g]);
                }
            } else if (rayItem[g].name == "tractor_beam") {
                if (window.tractorBeam[window.beamLength + g]) {
                    window.MAIN_SCENE.remove(window.tractorBeam[window.beamLength + g]);
                    window.tractorBeamBoundingBox[window.beamLength + g] = null;
                }
            } else if (rayItem[g].name == "laser_emitter") {
                if (window.laserEmitter[window.laserLength + g]) {
                    window.MAIN_SCENE.remove(window.laserEmitter[window.laserLength + g]);
                    window.laserEmitterBoundingBox[window.laserLength + g] = null;
                }
            }

            let dir = new THREE.Vector3()
            window.portalShader[portal].getWorldDirection(dir)

            var raycasterBridge = new THREE.Raycaster();
            raycasterBridge.set(window.portalShader[portal].position, dir);

            var intersectsInstance = raycasterBridge.intersectObject(window.instancedMesh);

            if (intersects.length > 0) {
                if (intersects[0].uv.x > 0.3 && intersects[0].uv.x < 0.7) {
                    if (rayItem[g].name == "light_bridge") {
                        if (window.lightBridgesClone[g]) {
                            window.MAIN_SCENE.remove(window.lightBridgesClone[g]);
                            window.CANNON_WORLD.removeBody(window.lightBridgesColliderClone[g]);
                        }
                    } else if (rayItem[g].name == "tractor_beam") {
                        if (window.tractorBeam[window.beamLength + g]) {
                            window.MAIN_SCENE.remove(window.tractorBeam[window.beamLength + g]);
                            window.tractorBeamBoundingBox[window.beamLength + g] = null;
                        }
                    } else if (rayItem[g].name == "laser_emitter") {
                        if (window.laserEmitter[window.laserLength + g]) {
                            window.MAIN_SCENE.remove(window.laserEmitter[window.laserLength + g]);
                            window.laserEmitterBoundingBox[window.laserLength + g] = null;
                        }
                    }
                } else {
                    continue;
                }
            }

            //---------------------------------------------------------------------

            var material = window.materialBridge;

            if (rayItem[g].name == "light_bridge") {
                var geometry = new THREE.BoxGeometry(0.9, 0.025, intersectsInstance[0].distance);
            } else if (rayItem[g].name == "tractor_beam") {
                var geometry = new THREE.CylinderGeometry(0.9, 0.9, intersectsInstance[0].distance, 32);

                if (rayItem[g].beam == "orange")
                    material = window.materialBridgeOrange;
            } else if (rayItem[g].name == "laser_emitter") {
                var geometry = new THREE.CylinderGeometry(0.02, 0.02, intersectsInstance[0].distance, 32);

                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(1, 0.15, 0)
                })
            }

            const plane = new THREE.Mesh(geometry, material); //materialBridge
            window.MAIN_SCENE.add(plane);

            if (rayItem[g].name == "tractor_beam" || rayItem[g].name == "laser_emitter") {
                plane.rotation.x = Math.PI / 2;
                plane.updateMatrix();
                plane.geometry.applyMatrix4(plane.matrix);
            }

            plane.position.copy(window.portalShader[portal].position);
            plane.rotation.copy(window.portalShader[portal].rotation);
            plane.translateZ(intersectsInstance[0].distance / 2);
            plane.translateY((((intersects[0].uv.y) - 0.5) * 2));

            const result = threeToCannon(plane, {
                type: ShapeType.BOX
            });

            if (rayItem[g].name == "laser_emitter") {
                plane.translateY(0.6)
            }

            let PHYSICS_MATERIAL = new CANNON.Material();
            PHYSICS_MATERIAL.friction = 0.4; //0.01
            PHYSICS_MATERIAL.restitution = 0; //0.1

            var box = new CANNON.Body({
                shape: result.shape,
                mass: 0,
                material: PHYSICS_MATERIAL
            })

            box.position.copy(plane.position);
            box.quaternion.copy(plane.quaternion);

            if (rayItem[g].name == "light_bridge") {
                box.collisionFilterGroup = window.CGROUP_ENVIRONMENT
                box.collisionFilterMask = 10;
                window.CANNON_WORLD.addBody(box);

                window.lightBridgesClone[g] = plane;
                window.lightBridgesColliderClone[g] = box;
            } else if (rayItem[g].name == "tractor_beam") {

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(plane);
                bb.side = 1;

                if (rayItem[g].beam == "orange")
                    bb.side = -1;

                plane.inTractor = false;

                window.tractorBeam[window.beamLength + g] = plane;
                window.tractorBeamBoundingBox[window.beamLength + g] = bb;
            } else if (rayItem[g].name == "laser_emitter") {

                var obj = new THREE.Object3D();
                obj.position.copy(window.portalShader[portal].position);
                obj.rotation.copy(window.portalShader[portal].rotation);

                //var clone = plane.clone();
                //plane.scale.set(10,10,10);

                //var bb = new THREE.Box3(); // for re-use
                //bb.setFromObject(plane);

                //plane.inTractor = false;
                window.laserEmitter.push(plane);
                //window.laserEmitterBoundingBox.push(bb);
                //obj.position.copy(plane.position);
                //obj.rotation.copy(plane.rotation);

                obj.position.y = plane.position.y;
                obj.distance = intersects[0].distance;
                window.laserEmitterRaycaster.push(obj);
            }
        } else {

            if (rayItem[g].name == "light_bridge") {
                if (window.lightBridgesClone[g]) {
                    window.MAIN_SCENE.remove(window.lightBridgesClone[g]);
                    window.CANNON_WORLD.removeBody(window.lightBridgesColliderClone[g]);
                }
            } else if (rayItem[g].name == "tractor_beam") {
                if (window.tractorBeam[window.beamLength + g]) {
                    window.MAIN_SCENE.remove(window.tractorBeam[window.beamLength + g]);
                    window.tractorBeamBoundingBox[window.beamLength + g] = null;
                }
            } else if (rayItem[g].name == "laser_emitter") {
                if (window.laserEmitter[window.laserLength + g]) {
                    window.MAIN_SCENE.remove(window.laserEmitter[window.laserLength + g]);
                    window.laserEmitterBoundingBox[window.laserLength + g] = null;
                }
            }
        }
    }
}

window.tractorBeamBoundingBoxClone = [];

var clock = new THREE.Clock();

function animateLightBridges() {
    window.uniformsBridge['iTime'].value += clock.getDelta();
}

export {
    animateLightBridges,
    createLightBridges,
    createLightBridgesFromPortal
};