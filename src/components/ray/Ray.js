import {
    Vector3,
    Mesh,
    MeshBasicMaterial,
    Color
} from 'three';
import {
    LightningStrike
} from '../../LightningStrike.js';
import { GLOBALS } from '../../Globals.js';

const rayParams1 = {
    sourceOffset: new Vector3(),
    destOffset: new Vector3(),
    radius0: 0.001,
    radius1: 0.001,
    minRadius: 25,
    maxIterations: 7,
    isEternal: true,

    timeScale: 0.7,

    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 2.5,
    subrayDutyCycle: 0.3,
    maxSubrayRecursion: 3,
    ramification: 7,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.68
}

const rayParams2 = {
    sourceOffset: new Vector3(),
    destOffset: new Vector3(),
    radius0: 0.001,
    radius1: 0.001,
    minRadius: 25,
    maxIterations: 7,
    isEternal: true,

    timeScale: 0.7,

    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 2.5,
    subrayDutyCycle: 0.3,
    maxSubrayRecursion: 3,
    ramification: 7,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.68
}

const rayParams3 = {
    sourceOffset: new Vector3(),
    destOffset: new Vector3(),
    radius0: 0.001,
    radius1: 0.001,
    minRadius: 25,
    maxIterations: 7,
    isEternal: true,

    timeScale: 0.7,

    propagationTimeFactor: 0.05,
    vanishingTimeFactor: 0.95,
    subrayPeriod: 2.5,
    subrayDutyCycle: 0.3,
    maxSubrayRecursion: 3,
    ramification: 7,
    recursionProbability: 0.6,

    roughness: 0.85,
    straightness: 0.68
}

let lightningStrike, lightningStrike2, lightningStrike3;
let lightningStrikeMesh, lightningStrikeMesh2, lightningStrikeMesh3;

function recreateRay() {

    lightningStrike = new LightningStrike(rayParams1);
    lightningStrikeMesh = new Mesh(lightningStrike, new MeshBasicMaterial({
        color: new Color(2,2,2)
    }));

    lightningStrike2 = new LightningStrike(rayParams2);
    lightningStrikeMesh2 = new Mesh(lightningStrike2, new MeshBasicMaterial({
        color: new Color(2,2,2)
    }));

    lightningStrike3 = new LightningStrike(rayParams3);
    lightningStrikeMesh3 = new Mesh(lightningStrike3, new MeshBasicMaterial({
        color: new Color(2,2,2)
    }));

    //GLOBALS.SELECTED_FOR_BLOOM.add(lightningStrikeMesh);
    //GLOBALS.SELECTED_FOR_BLOOM.add(lightningStrikeMesh2);
    //GLOBALS.SELECTED_FOR_BLOOM.add(lightningStrikeMesh3);

    GLOBALS.LIGHTNIN_STRIKE_1 = lightningStrikeMesh;
    lightningStrikeMesh.visible = false;

    GLOBALS.LIGHTNIN_STRIKE_2 = lightningStrikeMesh2;
    lightningStrikeMesh2.visible = false;

    GLOBALS.LIGHTNIN_STRIKE_3 = lightningStrikeMesh3;
    lightningStrikeMesh3.visible = false;

    GLOBALS.LIGHTNIN_STRIKE_1.scale.set(1,1,1)
    GLOBALS.LIGHTNIN_STRIKE_2.scale.set(1,1,1)
    GLOBALS.LIGHTNIN_STRIKE_3.scale.set(1,1,1)

    lightningStrikeMesh.layers.mask = 2;
    lightningStrikeMesh2.layers.mask = 2;
    lightningStrikeMesh3.layers.mask = 2;
}

//
let t = 0;

function updateRay() {
    t += 0.01;

    if (lightningStrike && lightningStrike2 && lightningStrike3 && GLOBALS.FPS_MODE) {

        var t1 = GLOBALS.GUN.getObjectByName("cube_1").position;
        var t2 = GLOBALS.GUN.getObjectByName("cube_2").position;
        var t3 = GLOBALS.GUN.getObjectByName("cube_3").position;

        lightningStrike.rayParameters.sourceOffset.copy(t1);
        lightningStrike.rayParameters.destOffset.copy(GLOBALS.PORTAL_GUN_FLASH.position);

        lightningStrike2.rayParameters.sourceOffset.copy(t2);
        lightningStrike2.rayParameters.destOffset.copy(GLOBALS.PORTAL_GUN_FLASH.position);

        lightningStrike3.rayParameters.sourceOffset.copy(t3);
        lightningStrike3.rayParameters.destOffset.copy(GLOBALS.PORTAL_GUN_FLASH.position);

        lightningStrike.update(t);
        lightningStrike2.update(t);
        lightningStrike3.update(t);
    }
}

export {
    updateRay,
    recreateRay
};