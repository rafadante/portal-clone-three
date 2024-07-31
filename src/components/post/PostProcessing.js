import {
    EffectComposer,
    EffectPass,
    RenderPass,
    ToneMappingEffect,
    ToneMappingMode,
    Selection,
    SelectiveBloomEffect,
    BlendFunction
} from "postprocessing";
import {
    HalfFloatType,
    Color
} from 'three';
import { GLOBALS } from "../../Globals";

//POST
GLOBALS.SELECTED_FOR_BLOOM = new Selection();

function initPost() {
    //
    GLOBALS.COMPOSER = new EffectComposer(GLOBALS.RENDERER, {
        multisampling: Math.min(4, GLOBALS.RENDERER.capabilities.maxSamples),
        frameBufferType: HalfFloatType
    });
    GLOBALS.COMPOSER.addPass(new RenderPass(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA));

    const renderPass = new RenderPass(GLOBALS.GUN, GLOBALS.PORTAL_GUN_CAMERA);
    renderPass.clearColor = new Color(1, 1, 1);
    renderPass.clearAlpha = 0;
    renderPass.clearPass.enabled = true;
    renderPass.clearPass.color = false;
    renderPass.clearPass.camera = GLOBALS.PORTAL_GUN_CAMERA;
    GLOBALS.COMPOSER.addPass(renderPass);

    //
    const toneMappingEffect = new ToneMappingEffect({
        mode: ToneMappingMode.ACES_FILMIC,
        //blendFunction: BlendFunction.SKIP,
        resolution: 256,
        whitePoint: 4.0,
        middleGrey: 0.6,
        minLuminance: 0.01,
        averageLuminance: 0.01,
        adaptationRate: 1.0
    });

    //
    const selectiveBloom = new SelectiveBloomEffect(GLOBALS.GUN, GLOBALS.PORTAL_GUN_CAMERA, {
        intensity: 20.0,
        mipmapBlur: true,
        luminanceThreshold: 0.3,
        luminanceSmoothing: 0.2,
        radius: 0.618,
        resolutionScale: 4,
        //blendFunction: BlendFunction.SCREEN
    });
    selectiveBloom.selection = GLOBALS.SELECTED_FOR_BLOOM;

    //
    GLOBALS.COMPOSER.addPass(new EffectPass(GLOBALS.MAIN_CAMERA,
        toneMappingEffect
    ));
}

export { initPost }