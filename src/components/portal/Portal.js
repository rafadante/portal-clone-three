/* eslint-disable */

import * as THREE from 'three';
import {
    GeneralBB
} from '../generalBB/GeneralBB.js'
import {
    Group,
    Vector3
} from 'three';
import {
    GLOBALS
} from '../../Globals.js';

window.portalTone = false;

class Portal extends Group {
    // position - the center position (vector3)
    // normal - the normal of the host surface
    // playerDirection - the direction the player is facing
    // output - portal that this portal is paired with
    // hostObjects - object that this portal is on
    // ringColor - the color of the ring, portal1: orange, portal2: blue
    // portalPoints - the positions of the corners of the portals
    constructor(position, normal, playerUpDirection, output, hostObjects, ringColor, index, portalPoints = []) {
        super()
        this.pos = position.clone()
        this.output = output
        this.hostObjects = hostObjects
        this.plane = new THREE.Plane(new Vector3(0, 1, 0), 0)
        this.debugMeshes = new Group()

        // create onb for bb transformations
        this.ty = normal.clone().normalize()
        this.tz = playerUpDirection.clone().projectOnPlane(this.ty).normalize()
        if (this.tz.length() < 0.1) {
            this.tz = new Vector3(0, 1, 0)
        }
        this.tx = this.tz.clone().cross(this.ty)

        // set portal corner points
        // set portal corner points
        this.portalPoints = portalPoints;
        if (portalPoints === undefined || portalPoints.length == 0) {
            this.portalPoints = [this.pos.clone().add(this.tz.clone().multiplyScalar(portal_depth / 2 + 2 * portal_eps).add(this.tx.clone().multiplyScalar(portal_width / 2 + 2 * portal_eps))),
                this.pos.clone().add(this.tz.clone().multiplyScalar(-portal_depth / 2 - 2 * portal_eps).add(this.tx.clone().multiplyScalar(portal_width / 2 + 2 * portal_eps))),
                this.pos.clone().add(this.tz.clone().multiplyScalar(-portal_depth / 2 - 2 * portal_eps).add(this.tx.clone().multiplyScalar(-portal_width / 2 - 2 * portal_eps))),
                this.pos.clone().add(this.tz.clone().multiplyScalar(portal_depth / 2 + 2 * portal_eps).add(this.tx.clone().multiplyScalar(-portal_width / 2 - 2 * portal_eps)))
            ]
        }

        let tRot = new THREE.Matrix4().makeBasis(this.tx, this.ty, this.tz)

        // for visualization purposes
        let xHelper = new THREE.ArrowHelper(this.tx, position, 1, 0xff0000)
        let yHelper = new THREE.ArrowHelper(this.ty, position, 1, 0x00ff00)
        let zHelper = new THREE.ArrowHelper(this.tz, position, 1, 0x0000ff)
        this.debugMeshes.add(xHelper, yHelper, zHelper)

        this.transform = tRot.clone().setPosition(position)
        this.plane.applyMatrix4(this.transform)
        this.plane.translate(normal.clone().multiplyScalar(0.0001));

        // create the 3d model for the portal
        const VERT_SHADER = `
        void main() 
        {
            vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * modelViewPosition;
        }
        `
        const FRAG_SHADER = `
        uniform sampler2D texture1;
        uniform float ww;
        uniform float wh;
        uniform bool tone;
        void main() {
            gl_FragColor = texture2D(texture1, gl_FragCoord.xy / vec2(ww, wh));

            if(tone){
                #include <tonemapping_fragment>
                #include <colorspace_fragment>
            }
            
        }
        `

        //#include <tonemapping_fragment>
        //#include <colorspace_fragment>


        const geometry = new THREE.CylinderGeometry(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_HEIGHT, 50);
        const uniforms = {
            texture1: {
                type: 't',
                value: new THREE.Texture()
            },
            ww: {
                type: 'f',
                value: 1
            }, // not correct values at time of creation necessarily, will be updated later in render loop
            wh: {
                type: 'f',
                value: 1
            },
            tone:{
                type: 'Boolean',
                value: window.portalTone
            }
        }

        const material = new THREE.ShaderMaterial({
            vertexShader: VERT_SHADER,
            fragmentShader: FRAG_SHADER,
            uniforms: uniforms,
            stencilWrite: true, // stencil optimization, only for culling portal
            stencilFunc: THREE.EqualStencilFunc,
            stencilRef: 1,
            stencilFail: THREE.ReplaceStencilOp,
            //polygonOffset: true,
            //polygonOffsetFactor: -1
        });

        this.mesh = new THREE.Mesh(geometry, material);
        //this.mesh.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 6))
        this.mesh.applyMatrix4(this.transform)
        this.mesh.updateMatrix()
        this.mesh.matrixAutoUpdate = true;
        this.matrixAutoUpdate = true;
        //this.mesh.scale.x *= 0.75;
        this.mesh.frustumCulled = true;
        this.add(this.mesh)

        this.mesh.onAfterRender = function (renderer) {
            renderer.clearStencil();
        };

        var light;

        if (index == 0) {
            this.mesh.userData.this = 0;
            this.mesh.userData.other = 1;

            light = GLOBALS.LIGHT_PORTAL_0;
        } else {
            this.mesh.userData.this = 1;
            this.mesh.userData.other = 0;

            light = GLOBALS.LIGHT_PORTAL_1;
        }

        //light.applyMatrix4(this.transform)
        //light.updateMatrix()
        //light.matrixAutoUpdate = true;
        //light.matrixAutoUpdate = true;
        //this.add( light );
        light.position.copy(this.mesh.position)
        light.visible = true;

        var parent = GLOBALS.PORTAL_SHADER[index].parent;
        if (parent) {
            parent.remove(GLOBALS.PORTAL_SHADER[index]);
            GLOBALS.PORTAL_SHADER[index].matrix.identity().decompose(GLOBALS.PORTAL_SHADER[index].position, GLOBALS.PORTAL_SHADER[index].quaternion, GLOBALS.PORTAL_SHADER[index].scale)
        }

        GLOBALS.PORTAL_SHADER[index].applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_SHADER[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_SHADER[index].updateMatrix()
        GLOBALS.PORTAL_SHADER[index].matrixAutoUpdate = true;
        this.portalShader = GLOBALS.PORTAL_SHADER[index];
        this.portalShader.frustumCulled = true;
        //GLOBALS.PORTAL_SHADER[index].scale.set(1.1,1.1,1.1)
        this.add(GLOBALS.PORTAL_SHADER[index])

        // constructing the portal borders
        const ringGeometry = new THREE.PlaneGeometry(GLOBALS.PORTAL_WIDTH + 2 * GLOBALS.PORTAL_RING_THICKNESS, GLOBALS.PORTAL_DEPTH + 2 * GLOBALS.PORTAL_RING_THICKNESS);
        // https://stackoverflow.com/questions/33571642/why-do-transparent-materials-result-in-occlusion
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: ringColor,
            side: THREE.FrontSide,
            opacity: 1,
            transparent: true,
            depthWrite: false,
        })
        this.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
        this.ringMesh.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        this.ringMesh.applyMatrix4(this.transform)
        this.ringMesh.position.add(normal.clone().multiplyScalar(GLOBALS.PORTAL_HEIGHT / 2 + 0.001))
        this.ringMesh.updateMatrix()
        this.ringMesh.matrixAutoUpdate = true;
        this.ringMesh.visible = false;

        const geometry3 = new THREE.BoxGeometry( 1.4, 2, 0.1 ); 
        const material3 = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
        GLOBALS.PORTAL_BOX[index] = new THREE.Mesh( geometry3, material3 ); 
        GLOBALS.PORTAL_BOX[index].applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_BOX[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_BOX[index].updateMatrix()
        GLOBALS.PORTAL_BOX[index].matrixAutoUpdate = true;
        GLOBALS.PORTAL_BOX[index].visible = false;
        this.add( GLOBALS.PORTAL_BOX[index] );

        // CDBB: collision disable BB
        // STBB: should teleport BB

        // matrix for the CDBB
        // CDBB is centered at portal
        let tCDBB = this.transform.clone()
        // STBB is centered at 1/4 height of CDBB behind the portal
        // because height of STBB is half height of CDBB
        let pSTBB = position.clone().add(normal.clone().multiplyScalar(-GLOBALS.PORTAL_CDBB_HEIGHT / 4))
        let tSTBB = tRot.clone().setPosition(pSTBB)

        this.CDBB = new GeneralBB(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_CDBB_HEIGHT, GLOBALS.PORTAL_DEPTH, tCDBB, 0xff0000)
        this.STBB = new GeneralBB(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_CDBB_HEIGHT / 2, GLOBALS.PORTAL_DEPTH, tSTBB, 0x00ff00)

        this.debugMeshes.add(this.CDBB.helper)
        this.debugMeshes.add(this.STBB.helper)
        this.debugMeshes.visible = false; //globals.DEBUG
        this.add(this.debugMeshes)
    }
}

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(object, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    object.applyMatrix4(m)
}

function teleportPhysicalObject(object, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    //object.mesh.applyMatrix4(m)
    let position = cannonToThreeVector3(object.position)
    let previousPosition = cannonToThreeVector3(object.position)
    let velocity = cannonToThreeVector3(object.velocity)
    let force = cannonToThreeVector3(object.force)

    let orientation = new THREE.Quaternion().copy(object.quaternion)
    let mquat = new THREE.Quaternion().setFromRotationMatrix(m)
    orientation.premultiply(mquat)

    position = getTeleportedPositionalVector(position, portal)
    previousPosition = getTeleportedPositionalVector(previousPosition, portal)
    velocity = getTeleportedDirectionalVector(velocity, portal)
    force = getTeleportedDirectionalVector(force, portal)

    if(velocity.x > 15){
        velocity.x = 15;
    }else if(velocity.x < -15){
        velocity.x = -15;
    }

    if(velocity.y > 15){
        velocity.y = 15;
    }else if(velocity.y < -15){
        velocity.y = -15;
    }

    if(velocity.z > 15){
        velocity.z = 15;
    }else if(velocity.z < -15){
        velocity.z = -15;
    }

    object.position.copy(position)
    object.previousPosition.copy(previousPosition)
    object.velocity.copy(velocity)
    object.force.copy(force)
    object.quaternion.copy(orientation)
}

function threeToCannonVector3(v3) {
    return new CANNON.Vec3().copy(v3)
}

function cannonToThreeVector3(v3) {
    return new THREE.Vector3().copy(v3)
}

// apply teleportation to the output portal to the vector
// no side effects
function getTeleportedPositionalVector(v, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// for directional vectors, it doesn't make sense to translate them
// we only apply the rotational component of the matrix
function getTeleportedDirectionalVector(v, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let it = new THREE.Matrix4()
    it.extractRotation(portal.CDBB.inverse_t)
    let to = new THREE.Matrix4()
    to.extractRotation(portal.output.CDBB.t)

    let m = it.clone().premultiply(f).premultiply(to)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// convert vector3 to vector4
function threeToFour(v) {
    return new THREE.Vector4(v.x, v.y, v.z, 1)
}

function fourToThree(v) {
    return new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(1 / v.w)
}

export {
    Portal,
    teleportPhysicalObject,
    teleportObject3D
}