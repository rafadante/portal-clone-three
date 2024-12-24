import {
    Plane,
    CylinderGeometry,
    Matrix4,
    BoxGeometry,
    ShaderMaterial,
    Texture,
    Mesh,
    DoubleSide,
    MeshBasicMaterial,
    ArrowHelper,
    EqualStencilFunc,
    ReplaceStencilOp,
    Group,
    Vector3
} from 'three';
import {
    GeneralBB
} from '../generalBB/GeneralBB.js'
import {
    GLOBALS
} from '../../Globals.js';
import './Teleportation.js';

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
        this.plane = new Plane(new Vector3(0, 1, 0), 0)
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
            this.portalPoints = [this.pos.clone().add(this.tz.clone().multiplyScalar(GLOBALS.PORTAL_DEPTH / 2 + 2 * GLOBALS.PORTAL_EPS).add(this.tx.clone().multiplyScalar(GLOBALS.PORTAL_WIDTH / 2 + 2 * GLOBALS.PORTAL_EPS))),
            this.pos.clone().add(this.tz.clone().multiplyScalar(-GLOBALS.PORTAL_DEPTH / 2 - 2 * GLOBALS.PORTAL_EPS).add(this.tx.clone().multiplyScalar(GLOBALS.PORTAL_WIDTH / 2 + 2 * GLOBALS.PORTAL_EPS))),
            this.pos.clone().add(this.tz.clone().multiplyScalar(-GLOBALS.PORTAL_DEPTH / 2 - 2 * GLOBALS.PORTAL_EPS).add(this.tx.clone().multiplyScalar(-GLOBALS.PORTAL_WIDTH / 2 - 2 * GLOBALS.PORTAL_EPS))),
            this.pos.clone().add(this.tz.clone().multiplyScalar(GLOBALS.PORTAL_DEPTH / 2 + 2 * GLOBALS.PORTAL_EPS).add(this.tx.clone().multiplyScalar(-GLOBALS.PORTAL_WIDTH / 2 - 2 * GLOBALS.PORTAL_EPS)))
            ]
        }

        let tRot = new Matrix4().makeBasis(this.tx, this.ty, this.tz)

        // for visualization purposes
        let xHelper = new ArrowHelper(this.tx, position, 1, 0xff0000)
        let yHelper = new ArrowHelper(this.ty, position, 1, 0x00ff00)
        let zHelper = new ArrowHelper(this.tz, position, 1, 0x0000ff)
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


            #include <tonemapping_fragment>
            #include <colorspace_fragment>
        }
        `

        /*#include <tonemapping_fragment>
            #include <colorspace_fragment>*/

        const {
            width,
            height
        } = GLOBALS.RENDERER.domElement

        const geometry = new CylinderGeometry(GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_WIDTH, GLOBALS.PORTAL_HEIGHT);
        const uniforms = {
            texture1: {
                type: 't',
                value: new Texture()
            },
            ww: {
                type: 'f',
                value: width
            }, // not correct values at time of creation necessarily, will be updated later in render loop
            wh: {
                type: 'f',
                value: height
            }
        }

        const material = new ShaderMaterial({
            vertexShader: VERT_SHADER,
            fragmentShader: FRAG_SHADER,
            uniforms: uniforms,
            stencilWrite: true, // stencil optimization, only for culling portal
            stencilFunc: EqualStencilFunc,
            stencilRef: 1,
            stencilFail: ReplaceStencilOp,
            depthTest: true,
            depthWrite: true,
            polygonOffset: false,
            polygonOffsetFactor: -2,
            side: DoubleSide
        });

        this.mesh = new Mesh(geometry, material);
        this.mesh.applyMatrix4(this.transform)
        this.mesh.updateMatrix()
        this.mesh.matrixAutoUpdate = true;
        this.matrixAutoUpdate = true;
        this.mesh.frustumCulled = true;
        this.add(this.mesh)
        this.mesh.renderOrder = 100;

        this.mesh.translateY(-0.1);

        /*this.mesh.onAfterRender = function (renderer) {
            renderer.clearStencil();
        };*/

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

        light.position.copy(this.mesh.position)
        light.visible = true;
        this.light = light;

        var parent = GLOBALS.PORTAL_SHADER[index].parent;
        if (parent) {
            parent.remove(GLOBALS.PORTAL_SHADER[index]);
            GLOBALS.PORTAL_SHADER[index].matrix.identity().decompose(GLOBALS.PORTAL_SHADER[index].position, GLOBALS.PORTAL_SHADER[index].quaternion, GLOBALS.PORTAL_SHADER[index].scale)
        }

        //
        GLOBALS.PORTAL_SHADER[index].applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_SHADER[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_SHADER[index].updateMatrix()
        GLOBALS.PORTAL_SHADER[index].matrixAutoUpdate = true;
        this.portalShader = GLOBALS.PORTAL_SHADER[index];
        this.portalShader.frustumCulled = true;
        this.add(GLOBALS.PORTAL_SHADER[index])

        //
        const geometry3 = new BoxGeometry(1.4, 2, 0.1);
        const material3 = new MeshBasicMaterial({ color: 0x00ff00 });
        GLOBALS.PORTAL_BOX[index] = new Mesh(geometry3, material3);
        GLOBALS.PORTAL_BOX[index].applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_BOX[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_BOX[index].updateMatrix()
        GLOBALS.PORTAL_BOX[index].matrixAutoUpdate = true;
        GLOBALS.PORTAL_BOX[index].visible = false;
        this.add(GLOBALS.PORTAL_BOX[index]);

        //
        const geometry4 = new BoxGeometry(0.75, 1.2, 0.1);
        GLOBALS.PORTAL_INNER_BOX[index] = new Mesh(geometry4, material3);
        GLOBALS.PORTAL_INNER_BOX[index].applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
        GLOBALS.PORTAL_INNER_BOX[index].applyMatrix4(this.transform)
        GLOBALS.PORTAL_INNER_BOX[index].updateMatrix()
        GLOBALS.PORTAL_INNER_BOX[index].matrixAutoUpdate = true;
        GLOBALS.PORTAL_INNER_BOX[index].visible = false;
        this.add(GLOBALS.PORTAL_INNER_BOX[index]);

        // CDBB: collision disable BB
        // STBB: should teleport BB
        // matrix for the CDBB
        // CDBB is centered at portal
        let tCDBB = this.transform.clone();
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

export {
    Portal
}