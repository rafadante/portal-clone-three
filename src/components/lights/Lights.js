import { GLOBALS } from '../../Globals';
import { Group, AmbientLight, SpotLight, Color, PlaneGeometry, MeshStandardMaterial, DoubleSide, Mesh } from 'three';

const Lights = function () {

    var lightGroup = new Group();
    lightGroup.visible = false;

    const light = new AmbientLight(0x404040); // soft white light
    lightGroup.add(light);

    var spotLight = new SpotLight(0xffffff, 20);
    spotLight.name = "spotLightMain";
    spotLight.position.set(-1, 0, -2);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 1;
    spotLight.decay = 1; //2
    spotLight.distance = 0;

    console.log(spotLight)

    spotLight.castShadow = true;

    if (GLOBALS.MOBILE) {
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
    } else {
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
    }

    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 500;
    spotLight.shadow.focus = 1;
    //spotLight.shadow.bias = -0.1;//-0.0001
    spotLight.shadow.bias = 0;//-0.0009//-0.02

    GLOBALS.SPOTLIGHT = spotLight;

    if (!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high"))
        lightGroup.add(spotLight);

    return lightGroup;
};

function testLightsManager() {
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("light");//lightEmissive
    if (instanced)
        instanced.material.color = new Color(2, 2, 2);
    //instanced.material.emissive = new Color(0xffffff)
    //instanced.material.emissiveIntensity = 100

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['light'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['light'][i].id) {
            const geometry = new PlaneGeometry(1, 1);
            const material = new MeshStandardMaterial({
                side: DoubleSide,
                emissive: new Color(1, 1, 1),
                emissiveIntensity: 2
            });
            const plane = new Mesh(geometry, material);
            plane.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
            plane.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
            plane.rotateX(-Math.PI / 2)
            plane.scale.set(0.2, 2, 2)
            plane.translateZ(0.025);
            GLOBALS.SCENE_FPS.add(plane);
        }
    }

    /*for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['light'].length; i++) {

        if (GLOBALS.DYMANIC_ITEMS['light'][i].id) {

            var lightEmissive = new Object3D();
            lightEmissive.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
            lightEmissive.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
            lightEmissive.updateMatrix();

            console.log(instanced)

            instanced.setMatrixAt(i, lightEmissive.matrix);
            instanced.instanceMatrix.needsUpdate = true;
            instanced.computeBoundingSphere();

            //
            var spotLight = new SpotLight(GLOBALS.DYMANIC_ITEMS['light'][i].userData.lightColor, 25);
            spotLight.distance = 25;
            spotLight.decay = 2;
            spotLight.penumbra = 1;
            spotLight.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
            spotLight.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
            spotLight.translateY(0.3);
            spotLight.angle = Math.PI / 2;
            spotLight.shadow.mapSize.width = 1024;
            spotLight.shadow.mapSize.height = 1024;
            spotLight.shadow.camera.near = 1;
            spotLight.shadow.camera.far = 10;
            spotLight.shadow.focus = 1;

            var dir = new Vector3();
            GLOBALS.DYMANIC_ITEMS['light'][i].getWorldDirection(dir);

            spotLight.target.position.set(spotLight.position.x + (dir.x * 10),
                spotLight.position.y + (dir.z * 10),
                spotLight.position.z + (dir.y * 10));


            if (!GLOBALS.MOBILE && (localStorage.getItem("quality-select") == "epic" || localStorage.getItem("quality-select") == "high"))
                GLOBALS.SCENE_FPS.add(spotLight);

            spotLight.target.updateMatrixWorld();
        }
    }*/

    for (var i = 0; i < GLOBALS.ITEMS_ADDED.children.length; i++) {
        if (GLOBALS.ITEMS_ADDED.children[i].name.includes("observation_room")) {
            GLOBALS.ITEMS_ADDED.children[i].visible = false;

            const cloneObsRoom = GLOBALS.OBSERVATION_ROOM_HALF.clone();
            cloneObsRoom.visible = true;
            GLOBALS.SCENE_FPS.add(cloneObsRoom);
            cloneObsRoom.position.copy(GLOBALS.ITEMS_ADDED.children[i].position);
            cloneObsRoom.rotation.copy(GLOBALS.ITEMS_ADDED.children[i].rotation);

            if (cloneObsRoom.getObjectByName("pointLight"))
                cloneObsRoom.getObjectByName("pointLight").color = new Color(GLOBALS.ITEMS_ADDED.children[i].userData.lightColor);

            var light = GLOBALS.SPOTLIGHT.clone();
            cloneObsRoom.add(light);

            if (cloneObsRoom.getObjectByName("pointLight"))
                light.color = cloneObsRoom.getObjectByName("pointLight").color;

            light.intensity = 5;
            light.distance = 12;
            light.position.set(0, -1, -0.5);
            light.target = cloneObsRoom.getObjectByName("targetLight");
        }
    }
}

export {
    Lights,
    testLightsManager
};