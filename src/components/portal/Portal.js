/* eslint-disable */

import * as THREE from '../../build/three.module.js';
import {
    GeneralBB
} from '../generalBB/GeneralBB.js'
import {
    Group,
    MeshStandardMaterial,
    PlaneGeometry,
    Vector3
} from '../../build/three.module.js';


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
        void main() {
            gl_FragColor = texture2D(texture1, gl_FragCoord.xy / vec2(ww, wh));
        }
        `

        const geometry = new THREE.CylinderGeometry(window.PORTAL_WIDTH, window.PORTAL_WIDTH, window.PORTAL_HEIGHT, 50);
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
            /*polygonOffset: true,
            polygonOffsetFactor: -1*/
        });

        this.mesh = new THREE.Mesh(geometry, material);
        //this.mesh.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 6))
        this.mesh.applyMatrix4(this.transform)
        this.mesh.updateMatrix()
        this.mesh.matrixAutoUpdate = true;
        this.matrixAutoUpdate = true;
        this.mesh.scale.x *= 0.5;
        this.add(this.mesh)

        var portalShader;
        if (index == 0) {
            portalShader = window.leftPortalShader.clone();
            portalShader.name = "portal-0"
            this.mesh.userData.this = 0;
            this.mesh.userData.other = 1;
            window.portalShader[0] = portalShader;
        } else {
            portalShader = window.rightPortalShader.clone();
            portalShader.name = "portal-1"
            this.mesh.userData.this = 1;
            this.mesh.userData.other = 0;
            window.portalShader[1] = portalShader;
        }


        portalShader.applyMatrix4(new THREE.Matrix4().makeRotationX(-Math.PI / 2))
        //portalShader.applyMatrix4(new THREE.Matrix4().makeRotationY(-Math.PI / 6))
        portalShader.applyMatrix4(this.transform)
        //portalShader.position.add(normal.clone().multiplyScalar(window.PORTAL_HEIGHT / 2 + 0.002))
        portalShader.updateMatrix()
        portalShader.matrixAutoUpdate = true;
        portalShader.scale.x *= 0.5;
        this.portalShader = portalShader;
        this.add(portalShader)



        // constructing the portal borders
        const ringGeometry = new THREE.PlaneGeometry(window.PORTAL_WIDTH + 2 * window.PORTAL_RING_THICKNESS, window.PORTAL_DEPTH + 2 * window.PORTAL_RING_THICKNESS);
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
        this.ringMesh.position.add(normal.clone().multiplyScalar(window.PORTAL_HEIGHT / 2 + 0.001))
        this.ringMesh.updateMatrix()
        this.ringMesh.matrixAutoUpdate = true;
        //this.ringMesh.rotation.set(0,0,0);
        this.ringMesh.visible = false;
        //this.add(this.ringMesh)


        //this.translateZ(1)

        //var dir = new THREE.Vector3();
        //console.log(dir)
        //dir.subVectors(window.MAIN_CAMERA.position, this.portalShader.getWorldPosition(dir)).normalize();
        //console.log(dir)
        //this.portalShader.translateOnAxis(dir, 1);

        // CDBB: collision disable BB
        // STBB: should teleport BB

        // matrix for the CDBB
        // CDBB is centered at portal
        let tCDBB = this.transform.clone()
        // STBB is centered at 1/4 height of CDBB behind the portal
        // because height of STBB is half height of CDBB
        let pSTBB = position.clone().add(normal.clone().multiplyScalar(-window.PORTAL_CDBB_HEIGHT / 4))
        let tSTBB = tRot.clone().setPosition(pSTBB)

        this.CDBB = new GeneralBB(window.PORTAL_WIDTH, window.PORTAL_CDBB_HEIGHT, window.PORTAL_DEPTH, tCDBB, 0xff0000)
        this.STBB = new GeneralBB(window.PORTAL_WIDTH, window.PORTAL_CDBB_HEIGHT / 2, window.PORTAL_DEPTH, tSTBB, 0x00ff00)

        this.debugMeshes.add(this.CDBB.helper)
        this.debugMeshes.add(this.STBB.helper)
        this.debugMeshes.visible = false;//globals.DEBUG
        this.add(this.debugMeshes)
    }

    update(timeStamp) {
        // update parent collision groups based on bb
    }

    // apply teleportation to the output portal to the vector
    // no side effects
    getTeleportedPositionalVector(v) {
        let f = new THREE.Matrix4().makeScale(-1, -1, 1)
        let m = this.CDBB.inverse_t.clone().premultiply(f).premultiply(this.output.CDBB.t)
        let v4 = util.threeToFour(v).applyMatrix4(m)
        return util.fourToThree(v4)
    }

    // for directional vectors, it doesn't make sense to translate them
    // we only apply the rotational component of the matrix
    getTeleportedDirectionalVector(v) {
        let f = new THREE.Matrix4().makeScale(-1, -1, 1)
        let it = new THREE.Matrix4()
        it.extractRotation(this.CDBB.inverse_t)
        let to = new THREE.Matrix4()
        to.extractRotation(this.output.CDBB.t)

        let m = it.clone().premultiply(f).premultiply(to)
        let v4 = util.threeToFour(v).applyMatrix4(m)
        return util.fourToThree(v4)
    }

    // teleport a 3D object directly, returns nothing
    // Object3D includes camera, meshes
    teleportObject3D(object) {
        let f = new THREE.Matrix4().makeScale(-1, -1, 1)
        let m = this.CDBB.inverse_t.clone().premultiply(f).premultiply(this.output.CDBB.t)
        object.applyMatrix4(m)
    }

    teleportPhysicalObject(object) {
        let f = new THREE.Matrix4().makeScale(-1, -1, 1)
        let m = this.CDBB.inverse_t.clone().premultiply(f).premultiply(this.output.CDBB.t)
        object.mesh.applyMatrix4(m)
        let position = util.cannonToThreeVector3(object.physicsBody.position)
        let previousPosition = util.cannonToThreeVector3(object.physicsBody.position)
        let velocity = util.cannonToThreeVector3(object.physicsBody.velocity)
        let force = util.cannonToThreeVector3(object.physicsBody.force)

        let orientation = new THREE.Quaternion().copy(object.physicsBody.quaternion)
        let mquat = new THREE.Quaternion().setFromRotationMatrix(m)
        orientation.premultiply(mquat)

        position = this.getTeleportedPositionalVector(position)
        previousPosition = this.getTeleportedPositionalVector(previousPosition)
        velocity = this.getTeleportedDirectionalVector(velocity)
        force = this.getTeleportedDirectionalVector(force)

        object.physicsBody.position.copy(position)
        object.physicsBody.previousPosition.copy(previousPosition)
        object.physicsBody.velocity.copy(velocity)
        object.physicsBody.force.copy(force)
        object.physicsBody.quaternion.copy(orientation)
    }
}

export {
    Portal
}