import { GLOBALS } from '../../Globals';
import { 
    Group, 
    AmbientLight, 
    SpotLight,
    Color,
    PlaneGeometry,
    MeshStandardMaterial,
    DoubleSide,
    Mesh,
    Vector3,
    Object3D 
} from 'three';

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

    lightGroup.add(spotLight);

    return lightGroup;
};

function testLightsManager() {
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("lightEmissive");
    instanced.material.emissive = new Color(0xffffff)
    instanced.material.emissiveIntensity = 100

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['stripe'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['stripe'][i].id) {
            const geometry = new PlaneGeometry(1, 1);
            const material = new MeshStandardMaterial({
                side: DoubleSide,
                emissive: new Color(0xffffff),
                emissiveIntensity: 100
            });
            const plane = new Mesh(geometry, material);
            plane.position.copy(GLOBALS.DYMANIC_ITEMS['stripe'][i].position);
            plane.rotation.copy(GLOBALS.DYMANIC_ITEMS['stripe'][i].rotation);
            plane.scale.set(0.2, 2, 2)
            plane.translateZ(0.025);
            GLOBALS.SCENE_FPS.add(plane);
        }
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['light'].length; i++) {

        if (GLOBALS.DYMANIC_ITEMS['light'][i].id) {

            var lightEmissive = new Object3D();
            lightEmissive.position.copy(GLOBALS.DYMANIC_ITEMS['light'][i].position);
            lightEmissive.rotation.copy(GLOBALS.DYMANIC_ITEMS['light'][i].rotation);
            lightEmissive.updateMatrix();
            instanced.setMatrixAt(i, lightEmissive.matrix);
            instanced.instanceMatrix.needsUpdate = true;
            instanced.computeBoundingSphere();

            //
            var spotLight = new SpotLight(GLOBALS.DYMANIC_ITEMS['light'][i].lightColor, 100);
            spotLight.distance = 0;
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

            GLOBALS.SCENE_FPS.add(spotLight);
        }
    }

    for (var i = 0; i < GLOBALS.ITEMS_ADDED.children.length; i++) {
        if (GLOBALS.ITEMS_ADDED.children[i].name.includes("observation_room")) {
            GLOBALS.ITEMS_ADDED.children[i].visible = false;

            const cloneObsRoom = GLOBALS.OBSERVATION_ROOM_HALF.clone();
            cloneObsRoom.visible = true;
            GLOBALS.SCENE_FPS.add(cloneObsRoom);
            cloneObsRoom.position.copy(GLOBALS.ITEMS_ADDED.children[i].position);
            cloneObsRoom.rotation.copy(GLOBALS.ITEMS_ADDED.children[i].rotation);

            cloneObsRoom.getObjectByName("pointLight").color = new Color(GLOBALS.ITEMS_ADDED.children[i].lightColor);
        }
    }
}

export {
    Lights,
    testLightsManager
};