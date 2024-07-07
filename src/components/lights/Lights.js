import { GLOBALS } from '../../Globals';

const Lights = function (THREE) {

    var lightGroup = new THREE.Group();
    lightGroup.visible = false;

    const light = new THREE.AmbientLight(0x404040); // soft white light
    lightGroup.add(light);

    var spotLight = new THREE.SpotLight(0xffffff, 20);
    spotLight.name = "spotLightMain";
    spotLight.position.set(-1, 0, -2);
    spotLight.angle = Math.PI / 3;
    spotLight.penumbra = 1;
    spotLight.decay = 1; //2
    spotLight.distance = 0;

    spotLight.castShadow = true;

    if(GLOBALS.MOBILE){
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
    }else{
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

export {
    Lights
};