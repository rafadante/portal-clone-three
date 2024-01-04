import * as THREE from 'three';
import {
    GLOBALS
} from './Globals.js';

var fbo,sceneSonar;
let clock = new THREE.Clock();
clock.start();

function animateSonar() {
    GLOBALS.RENDERER.setRenderTarget(fbo);
    GLOBALS.RENDERER.clearColor();
    GLOBALS.RENDERER.clearDepth();

    const deltaTime = clock.getDelta();
    const ellapseTime = clock.getElapsedTime();

    GLOBALS.RENDERER.render(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA);

    window["TTT"](deltaTime, ellapseTime);

    GLOBALS.RENDERER.setRenderTarget(null);
    GLOBALS.RENDERER.clearColor();
    GLOBALS.RENDERER.clearDepth();
    GLOBALS.RENDERER.render(sceneSonar, GLOBALS.MAIN_CAMERA);
}

function PostRender() {

    //GLOBALS.RENDERER.outputColorSpace   = THREE.SRGBColorSpace;
    //GLOBALS.RENDERER.autoClearColor     = false;
    //GLOBALS.RENDERER.autoClearDepth     = false;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Core
    const scene = new THREE.Scene();
    sceneSonar = scene;
    const camera = GLOBALS.MAIN_CAMERA; //new THREE.OrthographicCamera( -1, 1, 1, -1, 0, 1 );
    fbo = fboColorDepthSRGB(GLOBALS.RENDERER.getDrawingBufferSize(new THREE.Vector2()).toArray());
    const tri = ndcTriangle(postColorMaterial(fbo.texture));

    scene.add(tri);

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // METHODS
    let self; // Need to declare before methods for it to be useable

    var tt = false;

    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    // Build return object
    self = {
        scene,
        camera
    };

    Object.defineProperty(self, 'colorTexture', {
        get() {
            return fbo.texture;
        }
    });
    Object.defineProperty(self, 'depthTexture', {
        get() {
            return fbo.depthTexture;
        }
    });
    Object.defineProperty(self, 'postMaterial', {
        set(mat) {
            tri.material = mat;
        }
    });

    return self;
}


// #region HELPER FUNCTIONS
function ndcTriangle(mat) {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1.0, -1.0, 3.0, -1.0, -1.0, 3.0]), 2));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 2, 0, 0, 2]), 2));

    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = true;
    return mesh;
}

function fboColorDepthSRGB(rendSize, isMultiSamples = true) {
    const fbo = new THREE.WebGLRenderTarget(
        rendSize[0], // * dpr,
        rendSize[1], // * dpr,
        {
            type: THREE.UnsignedByteType,
            minFilter: THREE.NearestFilter,
            magFilter: THREE.NearestFilter,
            depthBuffer: true,
            depthTexture: new THREE.DepthTexture(
                rendSize[0], // * dpr,
                rendSize[1], // * dpr,
                THREE.UnsignedIntType,
                THREE.UVMapping,
            )
        }
    );

    if (isMultiSamples) fbo.samples = 4;

    if (fbo.texture.colorSpace) fbo.texture.colorSpace = THREE.SRGBColorSpace; // rev > 152
    else fbo.texture.encoding = THREE.sRGBEncoding;

    fbo.texture.name = 'texColor';
    fbo.depthTexture.name = 'texDepth';
    return fbo;
}

function postColorMaterial(tex) {
    return new THREE.RawShaderMaterial({
        name: "PostMaterial",
        depthTest: false,
        transparent: false,
        alphaToCoverage: false,
        uniforms: {
            texColor: {
                type: "sampler2D",
                value: tex
            },
        },
        glslVersion: THREE.GLSL3,
        vertexShader: `
          in vec2 position;
          in vec2 uv;
  
          // uniform mat4 viewMatrix;
          // uniform mediump mat4 projectionMatrix;
  
          out vec2 fragUV;
  
          void main(){            
              fragUV      = uv;
              // gl_Position = projectionMatrix * viewMatrix * vec4( position, 0.0, 1.0 );
              gl_Position = vec4( position, 0.0, 1.0 );
          }`,

        fragmentShader: `
          precision mediump float;
          
          uniform sampler2D texColor;
          
          in   vec2 fragUV;
          out  vec4 outColor;
  
          void main(){
              vec4 color = texture( texColor, fragUV );
              outColor   = color;
          }`,
    });
}
// #endregion

export {
    PostRender,
    animateSonar
}