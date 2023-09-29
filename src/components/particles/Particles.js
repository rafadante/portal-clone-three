import * as THREE from '../../build/three.module.js';
import ParticleSystem, {
    GPURenderer
} from "three-nebula";
import json from "./test.json";
import json2 from "./test2.json";
import json3 from "./test3.json";
import json4 from "./test4.json";

var nebula, nebula2, nebula3, nebula4;

var g = new THREE.Group();
window.particlesGunGroup = g;

var g2 = new THREE.Group();
window.particlesGunGroup2 = g2;

startParticle()

ParticleSystem.fromJSONAsync(json, THREE).then(loaded => {
    nebula = loaded.addRenderer(new GPURenderer(g, THREE));
    nebula.emitters[0].position.set(0.12, -0.078, -0.14);
    window.nebula_left_portal = nebula.emitters[0];
});

ParticleSystem.fromJSONAsync(json2, THREE).then(loaded => {
    nebula2 = loaded.addRenderer(new GPURenderer(g, THREE));
    nebula2.emitters[0].position.set(0.115, -0.127, -0.25);
    window.nebula_left_portal2 = nebula2.emitters[0];
});

ParticleSystem.fromJSONAsync(json3, THREE).then(loaded => {
    nebula3 = loaded.addRenderer(new GPURenderer(g, THREE));
    nebula3.emitters[0].position.set(0.115, -0.127, -0.5);
    window.nebula_left_portal3 = nebula3.emitters[0];
});

ParticleSystem.fromJSONAsync(json4, THREE).then(loaded => {
    nebula4 = loaded.addRenderer(new GPURenderer(g2, THREE));
    window.nebula_left_portal4 = nebula4.emitters[0];
});

function startParticle(){
    window.MAIN_SCENE.add(g);
    window.MAIN_SCENE.add(g2);
}

function updateParticles() {
    if (nebula)
        nebula.update()

    if (nebula2)
        nebula2.update()

    if (nebula3)
        nebula3.update();

    if (nebula4)
        nebula4.update();
}

export {
    updateParticles,
    startParticle
};