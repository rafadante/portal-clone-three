import * as THREE from '../../build/three.module.js';
import {
    RectAreaLightHelper
} from '../../jsm/helpers/RectAreaLightHelper.js';
import {
    RectAreaLightUniformsLib
} from '../../jsm/lights/RectAreaLightUniformsLib.js';

const Lights = function (THREE) {

    var lightGroup = new THREE.Group();
    lightGroup.visible = false;

    const light = new THREE.AmbientLight(0x404040); // soft white light
    //lightGroup.add(light);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x8d8d8d, 0.15);
    //lightGroup.add(ambient);

    window.ambient = ambient;

    var spotLight = new THREE.SpotLight(0xffffff, 20);
    spotLight.name = "spotLightMain";
    //spotLight.position.set(16, 15, 12);
    spotLight.position.set(18, 7.5, 6);
    spotLight.angle = Math.PI / 2.25;
    spotLight.penumbra = 1;
    spotLight.decay = 1; //2
    spotLight.distance = 20000;

    spotLight.castShadow = true;

    if(window.mobile){
        spotLight.shadow.mapSize.width = 512;
        spotLight.shadow.mapSize.height = 512;
    }else{
        spotLight.shadow.mapSize.width = 2048;
        spotLight.shadow.mapSize.height = 2048;
    }
    
    spotLight.shadow.camera.near = 1;
    spotLight.shadow.camera.far = 500;
    spotLight.shadow.focus = 1;
    //spotLight.shadow.bias = -0.1;//-0.0001
    spotLight.shadow.bias = -0.02;//-0.0009

    console.log(spotLight)

    window.spotLight = spotLight;

    lightGroup.add(spotLight);

    var lightHelper = new THREE.SpotLightHelper(spotLight);
    //lightGroup.add(lightHelper);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2.5);
    directionalLight.position.set(18, 7.5, 6);
    directionalLight.castShadow = true;
    directionalLight.shadow.camera.near = 0.01;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.right = 30;
    directionalLight.shadow.camera.left = -30;
    directionalLight.shadow.camera.top = 30;
    directionalLight.shadow.camera.bottom = -30;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.radius = 4;
    directionalLight.shadow.bias = -0.0001;
    //lightGroup.add(directionalLight);

    const geometry = new THREE.BoxGeometry(30, 1, 1);
    const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0x4c4f4c)
    });
    const cube = new THREE.Mesh(geometry, material);
    cube.position.y = 10;
    cube.castShadow = true;
    //lightGroup.add(cube);

    RectAreaLightUniformsLib.init();

    const rectLight1 = new THREE.RectAreaLight(0xffffff, 0.5, 10, 14);
    rectLight1.rotation.x = -Math.PI / 2;
    rectLight1.rotation.z = -Math.PI / 2;
    rectLight1.position.set(8, 7.99, 6);
    lightGroup.add(rectLight1);

    //lightGroup.add(new RectAreaLightHelper(rectLight1));

    /*var texture360 = new THREE.TextureLoader().load(assets.ASSETS.SKY);
    texture360.encoding = THREE.sRGBEncoding;
    var geometry360 = new THREE.SphereGeometry(100, 100, 100);
    var material360 = new THREE.MeshBasicMaterial();
    var mesh360 = new THREE.Mesh(geometry360, material360);
    mesh360.material.map = texture360;
    mesh360.material.side = 1;
    lightGroup.add(mesh360);*/

    return lightGroup;
};

export {
    Lights
};