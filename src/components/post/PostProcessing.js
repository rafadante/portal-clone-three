import { EffectComposer, EffectPass, RenderPass, ToneMappingEffect, ToneMappingMode, Selection, SelectiveBloomEffect, BloomEffect } from "postprocessing";
import { HalfFloatType, Color } from 'three';
import { GLOBALS } from "../../Globals";

//POST
GLOBALS.SELECTED_FOR_BLOOM = new Selection();
var initiated = false;

function initPost() {

    if (initiated)
        return;

    initiated = true;

    //
    GLOBALS.COMPOSER = new EffectComposer(GLOBALS.RENDERER, {
        multisampling: Math.min(4, GLOBALS.RENDERER.capabilities.maxSamples),
        frameBufferType: HalfFloatType
    });
    GLOBALS.COMPOSER.addPass(new RenderPass(GLOBALS.SCENE, GLOBALS.MAIN_CAMERA));

    const renderPass = new RenderPass(GLOBALS.GUN_GROUP, GLOBALS.PORTAL_GUN_CAMERA);
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
        resolution: 64,
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
        resolutionScale: 1,
        //blendFunction: BlendFunction.SCREEN
    });
    selectiveBloom.selection = GLOBALS.SELECTED_FOR_BLOOM;

    //
    const bloom = new BloomEffect({
        luminanceThreshold: 1.1,
        //luminanceSmoothing: 0.2,
        //blendFunction: BlendFunction.ADD.
        //width: window.innerWidth,
        //height: window.innerHeight
    });

    //
    if (GLOBALS.MOBILE) {
        GLOBALS.COMPOSER.addPass(new EffectPass(GLOBALS.MAIN_CAMERA,
            toneMappingEffect
        ));
    } else {
        GLOBALS.COMPOSER.addPass(new EffectPass(GLOBALS.MAIN_CAMERA,
            toneMappingEffect,
            bloom
        ));
    }

}

export { initPost }