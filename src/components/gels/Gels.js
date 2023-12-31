import * as THREE from 'three';
import * as CANNON from 'cannon';
import {
    TWEEN
} from '../../Tween.js';
import {
    GLOBALS
} from '../../Globals.js';

var vv = false;
var destroyed = false;
var cc = false;
var tt = 0;
var instancedMeshGel, gelBallBlue, gelBallOrange, gelBallBodyBlue, gelBallBodyOrange;

function initGels() {

    GLOBALS.INK_MATERIAL.envMap = GLOBALS.ENV_MAP;
    const geometryDecal = new THREE.PlaneGeometry(2, 2);

    instancedMeshGel = new THREE.InstancedMesh(geometryDecal.clone(), GLOBALS.INK_MATERIAL, 100);
    instancedMeshGel.castShadow = true;
    instancedMeshGel.receiveShadow = true;
    instancedMeshGel.frustumCulled = false;
    instancedMeshGel.name = "gel-parent";
    GLOBALS.SCENE.add(instancedMeshGel);

    var clone = new THREE.Object3D();

    for (var i = 0; i < 100; i++) {
        clone.scale.set(0, 0, 0);
        clone.rotation.x = -Math.PI / 2;
        clone.updateMatrix();
        instancedMeshGel.setMatrixAt(i, clone.matrix);

        GLOBALS.GELS.push(false);
    }
}


function updateGels() {
    if (gelBallBlue) {
        gelBallBlue.position.copy(gelBallBodyBlue.position);
        gelBallBlue.quaternion.copy(gelBallBodyBlue.quaternion);
    }

    if (gelBallOrange) {
        gelBallOrange.position.copy(gelBallBodyOrange.position);
        gelBallOrange.quaternion.copy(gelBallBodyOrange.quaternion);
    }
}

var vv2 = false;

window['createOrangeGel'] = function () {

    destroyed = false;

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_orange'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_orange'][i].length != 0) {

            if (!vv2) {
                let PHYSICS_MATERIAL = new CANNON.Material();
                PHYSICS_MATERIAL.friction = 0; //0.01
                PHYSICS_MATERIAL.restitution = 0; //0.1

                var shape = new CANNON.Sphere(0.3);
                gelBallBodyOrange = new CANNON.Body({
                    shape: shape,
                    mass: 100,
                    material: PHYSICS_MATERIAL
                })

                const geometry = new THREE.IcosahedronGeometry(20, 4);
                gelBallOrange = new THREE.Mesh(geometry, mat2);
                GLOBALS.SCENE.add(gelBallOrange);

                gelBallOrange.scale.set(0.022, 0.022, 0.022)

                gelBallBodyOrange.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
                gelBallBodyOrange.collisionFilterMask = GLOBALS.CGROUP_ENVIRONMENT
                gelBallBodyOrange.gel = true;

                GLOBALS.CANNON_WORLD.addBody(gelBallBodyOrange);
                gelBallBodyOrange.name = "ball_gel"
                GLOBALS.DYNAMIC_OBJECTS.push(gelBallBodyOrange);
            } else {
                // Velocity
                gelBallBodyOrange.velocity.setZero();
                gelBallBodyOrange.initVelocity.setZero();
                gelBallBodyOrange.angularVelocity.setZero();
                gelBallBodyOrange.initAngularVelocity.setZero();

                // Force
                gelBallBodyOrange.force.setZero();
                gelBallBodyOrange.torque.setZero();
            }

            var pos = GLOBALS.DYMANIC_ITEMS['gel_orange'][i].position.clone();
            pos.y -= 0.5;
            gelBallBodyOrange.position.copy(pos);
            gelBallOrange.position.copy(pos);

            gelBallOrange.visible = true;

            if (!vv2) {
                gelBallBodyOrange.addEventListener('collide', (event) => {

                    if (event.target.inArea || event.target.teleporting) {

                    } else if (event.body.room && !cc2) {

                        cc2 = true;

                        if (event.target.name == "player") {

                            gelBallOrange.visible = false;
                            window['createOrangeGel']();

                            setTimeout(() => {
                                cc2 = false;
                            }, 10);
                        } else {

                            const pos = new THREE.Vector3(event.target.position.x, event.body.position.y, event.target.position.z);
                            const pos2 = pos.round();
                            var plane = getPlaneByName((2 * Math.floor(pos2.x / 2) + 1) + "/" +
                                pos2.y + "/" +
                                (2 * Math.floor(pos2.z / 2) + 1))

                            if (plane.length > 0) {



                                if (!plane[0].painted) {
                                    createGelOrange(pos2, plane[0]);
                                }

                                plane[0].painted = true;
                            }

                            gelBallOrange.visible = false;

                            setTimeout(() => {
                                window['createOrangeGel']();

                                setTimeout(() => {
                                    cc2 = false;
                                }, 10);
                            }, 2000);
                        }
                    }
                })
            }

        }
    }

    vv2 = true;
}

var cc2 = false;

function createGelOrange(pos, plane) {

    var id;

    for (var i = 0; i < GLOBALS.GELS.length; i++) {
        if (!GLOBALS.GELS[i]) {
            GLOBALS.GELS[i] = true;
            id = i;
            break;
        }
    }


    var gel = new THREE.Object3D();
    gel.scale.set(1, 1, 1);
    gel.position.copy(pos);

    //

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.01; //0.01
    PHYSICS_MATERIAL.restitution = 0.1; //0.1

    var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.01));

    var box = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: PHYSICS_MATERIAL
    })


    gel.rotation.copy(plane.rotation)
    box.up = new THREE.Vector3(0, 1, 0)
    box.vel = new THREE.Vector3(1, 0, 1)

    gel.updateMatrix();
    instancedMeshGel.setMatrixAt(id, gel.matrix);
    instancedMeshGel.setColorAt(id, new THREE.Color(0xFF8C00));
    instancedMeshGel.instanceColor.needsUpdate = true;
    instancedMeshGel.instanceMatrix.needsUpdate = true;
    instancedMeshGel.computeBoundingSphere();

    box.position.copy(pos);
    box.quaternion.copy(gel.quaternion)
    box.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
    box.collisionFilterMask = GLOBALS.CGROUP_ALL
    box.linearDamping = 0.01;
    box.name = "gel-orange";
    box.side = plane.side;

    GLOBALS.CANNON_WORLD.addBody(box);

    GLOBALS.PLAYER.addEventListener('collide', (event) => {
        if (event.body.name == "gel-orange") {
            GLOBALS.GEL_ORANGE = true;
        } else {
            GLOBALS.GEL_ORANGE = false;
        }
    })

    GLOBALS.DYNAMIC_OBJECTS.push(box);
}

window['createBlueGel'] = function () {

    destroyed = false;

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_blue'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_blue'][i].length != 0) {

            if (!vv) {
                let PHYSICS_MATERIAL = new CANNON.Material();
                PHYSICS_MATERIAL.friction = 0; //0.01
                PHYSICS_MATERIAL.restitution = 0; //0.1

                var shape = new CANNON.Sphere(0.3);
                gelBallBodyBlue = new CANNON.Body({
                    shape: shape,
                    mass: 100,
                    material: PHYSICS_MATERIAL
                })

                const geometry = new THREE.IcosahedronGeometry(20, 4);
                gelBallBlue = new THREE.Mesh(geometry, mat);
                GLOBALS.SCENE.add(gelBallBlue);

                gelBallBlue.scale.set(0.022, 0.022, 0.022)

                gelBallBodyBlue.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
                gelBallBodyBlue.collisionFilterMask = GLOBALS.CGROUP_ENVIRONMENT
                gelBallBodyBlue.gel = true;

                GLOBALS.CANNON_WORLD.addBody(gelBallBodyBlue);
                gelBallBodyBlue.name = "ball_gel"
                GLOBALS.DYNAMIC_OBJECTS.push(gelBallBodyBlue);
            } else {
                // Velocity
                gelBallBodyBlue.velocity.setZero();
                gelBallBodyBlue.initVelocity.setZero();
                gelBallBodyBlue.angularVelocity.setZero();
                gelBallBodyBlue.initAngularVelocity.setZero();

                // Force
                gelBallBodyBlue.force.setZero();
                gelBallBodyBlue.torque.setZero();
            }

            var pos = GLOBALS.DYMANIC_ITEMS['gel_blue'][i].position.clone();
            pos.y -= 0.5;
            gelBallBodyBlue.position.copy(pos);
            gelBallBlue.position.copy(pos);

            gelBallBlue.visible = true;

            if (!vv) {
                gelBallBodyBlue.addEventListener('collide', (event) => {

                    if (event.target.inArea || event.target.teleporting) {

                    } else if (event.body.room && !cc) {

                        cc = true;

                        if (event.target.name == "player") {

                            gelBallBlue.visible = false;
                            window['createBlueGel']();

                            setTimeout(() => {
                                cc = false;
                            }, 10);
                        } else {

                            const pos = new THREE.Vector3(event.target.position.x, event.body.position.y, event.target.position.z);
                            const pos2 = pos.round();
                            var plane = getPlaneByName((2 * Math.floor(pos2.x / 2) + 1) + "/" +
                                pos2.y + "/" +
                                (2 * Math.floor(pos2.z / 2) + 1))

                            if (plane.length > 0) {



                                if (!plane[0].painted) {
                                    createGel(pos2, plane[0]);
                                }

                                plane[0].painted = true;
                            }

                            gelBallBlue.visible = false;

                            setTimeout(() => {
                                window['createBlueGel']();

                                setTimeout(() => {
                                    cc = false;
                                }, 10);
                            }, 2000);
                        }


                    }
                })
            }

        }
    }

    vv = true;
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

function createGel(pos, plane) {

    var id;

    for (var i = 0; i < GLOBALS.GELS.length; i++) {
        if (!GLOBALS.GELS[i]) {
            GLOBALS.GELS[i] = true;
            id = i;
            break;
        }
    }

    //const geometry = new THREE.PlaneGeometry(2, 2);
    //const material = new THREE.MeshBasicMaterial();
    //const gel = new THREE.Mesh(geometry, material);

    var gel = new THREE.Object3D();
    gel.scale.set(1, 1, 1);
    //pos.y -= 0.01;
    gel.position.copy(pos);

    //

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.01; //0.01
    PHYSICS_MATERIAL.restitution = 0.1; //0.1

    var shape = new CANNON.Box(new CANNON.Vec3(1, 1, 0.01));

    var box = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: PHYSICS_MATERIAL
    })

    //gel.rotation.x = -Math.PI / 2;
    gel.rotation.copy(plane.rotation)
    box.up = new THREE.Vector3(0, 1, 0)
    box.vel = new THREE.Vector3(1, 0, 1)


    gel.updateMatrix();
    instancedMeshGel.setMatrixAt(id, gel.matrix);


    instancedMeshGel.setColorAt(id, new THREE.Color(0x108ac8));

    instancedMeshGel.instanceColor.needsUpdate = true;
    instancedMeshGel.instanceMatrix.needsUpdate = true;
    instancedMeshGel.computeBoundingSphere();

    box.position.copy(pos);
    box.quaternion.copy(gel.quaternion)
    box.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC
    box.collisionFilterMask = GLOBALS.CGROUP_ALL
    box.linearDamping = 0.01;
    box.name = "gel";
    //box.posIni = box.position.y;
    //box.posMinus = box.position.y - 100;

    if (plane.side == "down") {
        box.up = new THREE.Vector3(0, 1, 0)
        box.vel = new THREE.Vector3(1, 0, 1)
    } else if (plane.side == "up") {
        box.up = new THREE.Vector3(0, -1, 0)
        box.vel = new THREE.Vector3(1, 0, 1)
    } else if (plane.side == "back") {
        box.up = new THREE.Vector3(0.6, 0.15, -1)
        box.vel = new THREE.Vector3(1, 1, 0)
    } else if (plane.side == "left") {
        box.up = new THREE.Vector3(1, 0, 0)
        box.vel = new THREE.Vector3(0, 1, 1)
    } else if (plane.side == "right") {
        box.up = new THREE.Vector3(-1, 0, 0)
        box.vel = new THREE.Vector3(0, 1, 1)
    } else if (plane.side == "front") {
        box.up = new THREE.Vector3(0.6, 0.15, 1)
        box.vel = new THREE.Vector3(1, 1, 0)
    }

    box.side = plane.side;

    // When a body collides with another body, they both dispatch the "collide" event.
    box.addEventListener('collide', (event) => {

        if (event.body.gel) {
            return;
        }

        if (!event.body.gelJumping) {

            var relativeVelocity = event.contact.getImpactVelocityAlongNormal();

            if (event.target.side == "front" || event.target.side == "back")
                relativeVelocity = 1;

            event.body.gelJumping = true;

            var holder = event.body;

            setTimeout(() => {
                holder.gelJumping = false;
            }, 10);

            if (event.target.side == "front" || event.target.side == "back")
                event.body.velocity.setZero();
            else
                event.body.velocity.set(event.body.velocity.x * event.target.vel.x,
                    event.body.velocity.y * event.target.vel.y,
                    event.body.velocity.z * event.target.vel.z);

            event.body.applyImpulse(event.target.up.clone().multiplyScalar(10 * event.body.mass * Math.abs((relativeVelocity * 0.045) + 1)), event.body.position)
        }
    })

    GLOBALS.CANNON_WORLD.addBody(box);
    GLOBALS.DYNAMIC_OBJECTS.push(box);
}

const vshader = `
// Include the Ashima code here!

varying vec2 vUv;
varying float noise;
uniform float time;
  
  vec3 mod289(vec3 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x)
{
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x)
{
  return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec3 fade(vec3 t) {
  return t*t*t*(t*(t*6.0-15.0)+10.0);
}

// Classic Perlin noise
float cnoise(vec3 P)
{
  vec3 Pi0 = floor(P); // Integer part for indexing
  vec3 Pi1 = Pi0 + vec3(1.0); // Integer part + 1
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

// Classic Perlin noise, periodic variant
float pnoise(vec3 P, vec3 rep)
{
  vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
  vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P); // Fractional part for interpolation
  vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}

float turbulence( vec3 p ) {
    float w = 100.0;
    float t = -.5;
    for (float f = 1.0 ; f <= 10.0 ; f++ ){
        float power = pow( 2.0, f );
        t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
    }
    return t;
}

void main() {

    vUv = uv;

    // add time to the noise parameters so it's animated
    noise = 10.0 *  -.10 * turbulence( .5 * normal + time );
    float b = 5.0 * pnoise( 0.05 * position + vec3( 2.0 * time ), vec3( 100.0 ) );
    float displacement = - noise + b;
    
    vec3 newPosition = position + normal * displacement;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( newPosition, 1.0 );

}

`;

const fshader = `
varying vec2 vUv;
varying float noise;

void main() {

    // compose the colour using the UV coordinate
    // and modulate it with the noise like ambient occlusion
    vec3 color = vec3(0.06, 0.54, 0.78);
    gl_FragColor = vec4( color.rgb, 1.0 );
}

`;

const fshader2 = `
varying vec2 vUv;
varying float noise;

void main() {

    // compose the colour using the UV coordinate
    // and modulate it with the noise like ambient occlusion
    vec3 color = vec3(1.0, 0.5, 0.0);
    gl_FragColor = vec4( color.rgb, 1.0 );
}

`;

GLOBALS.UNIFORMS_GEL = {
    time: { // float initialized to 0
        type: "f",
        value: 0.0
    }
}

var mat = new THREE.ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_GEL,
    vertexShader: vshader,
    fragmentShader: fshader,
});

var mat2 = new THREE.ShaderMaterial({
    uniforms: GLOBALS.UNIFORMS_GEL,
    vertexShader: vshader,
    fragmentShader: fshader2,
});

export {
    updateGels,
    initGels
}