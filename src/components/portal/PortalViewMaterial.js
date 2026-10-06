import { ShaderMaterial, DoubleSide, EqualStencilFunc, ReplaceStencilOp } from 'three';

const materials = new WeakMap();
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


export function getPortalViewMaterial(renderer, index) {
    let slots = materials.get(renderer);
    if (!slots) { slots = new Map(); materials.set(renderer, slots); }
    if (!slots.has(index)) {
        slots.set(index, new ShaderMaterial({
            vertexShader: VERT_SHADER, fragmentShader: FRAG_SHADER,
            uniforms: { texture1: {value:null}, ww: {value:renderer.domElement.width}, wh: {value:renderer.domElement.height} },
            stencilWrite: true, stencilFunc: EqualStencilFunc, stencilRef: 1, stencilFail: ReplaceStencilOp,
            depthTest: true, depthWrite: true, polygonOffset: false, polygonOffsetFactor: -2, side: DoubleSide,
        }));
    }
    return slots.get(index);
}