import * as THREE from 'three';
import {
    GLOBALS
} from '../../Globals.js';

function loadMaterials() {
    //MATERIAL FLOOR NON PORTAL
    GLOBALS.MATERIAL_FLOOR_NON_PORTAL = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_FLOOR_NON_PORTAL, 'metal/floor.jpg', 'metal/floor_normal.jpg', null, 
    'floor/nonPortalable/1/roughness.jpg', null, 1, 0.15);
    //GLOBALS.MATERIAL_FLOOR_NON_PORTAL.envMapIntensity = 0.3;

    //MATERIAL FLOOR PORTAL
    GLOBALS.MATERIAL_FLOOR_PORTAL = GLOBALS.MATERIAL_FLOOR_NON_PORTAL.clone();
    loadMaterial(GLOBALS.MATERIAL_FLOOR_PORTAL, 'portal/floor.jpg', 'portal/floor_normal.jpg', null, null, null, 1, 0.05);

    //MATERIAL WALL PORTAL
    GLOBALS.MATERIAL_WALL_PORTAL = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_WALL_PORTAL, 'portal/wall1.jpg', 'portal/wall1_normal.jpg',
        null, null, null, 1, 0.05);

    GLOBALS.MATERIAL_WALL_PORTAL2 = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_WALL_PORTAL2, 'portal/wall2.jpg', 'portal/wall2_normal.jpg',
        null, null, null, 1, 0.05);

    GLOBALS.MATERIAL_WALL_PORTAL3 = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_WALL_PORTAL3, 'portal/wall3.jpg', 'portal/wall3_normal.jpg',
        null, null, null, 1, 0.05);

    GLOBALS.MATERIAL_WALL_PORTAL4 = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_WALL_PORTAL4, 'portal/wall4.jpg', 'portal/wall4_normal.jpg',
        null, null, null, 1, 0.05);

    //MATERIAL WALL NON PORTAL
    GLOBALS.MATERIAL_WALL_NON_PORTAL = GLOBALS.MATERIAL_WALL_PORTAL.clone();
    loadMaterial(GLOBALS.MATERIAL_WALL_NON_PORTAL, 'metal/wall1.jpg', 'metal/wall1_normal.jpg',
        null, null, null, 1, 0.2);

    GLOBALS.MATERIAL_WALL_NON_PORTAL2 = GLOBALS.MATERIAL_WALL_PORTAL.clone();
    loadMaterial(GLOBALS.MATERIAL_WALL_NON_PORTAL2, 'metal/wall2.jpg', 'metal/wall2_normal.jpg',
        null, null, null, 1, 0.2);
}

function loadMaterial(material, base, normal, ao, rough, metal, roughValue, envIntensity) {

    var map;
    material.roughness = roughValue;

    if (base) {
        map = new THREE.TextureLoader().load('./assets/textures/' + base);
        map.colorSpace = THREE.SRGBColorSpace;
        material.map = map;
    }

    if (normal) {
        map = new THREE.TextureLoader().load('./assets/textures/' + normal);
        material.normalMap = map;
    }

    if (ao) {
        map = new THREE.TextureLoader().load('./assets/textures/' + ao);
        material.aoMap = map;
    }

    if (rough) {
        map = new THREE.TextureLoader().load('./assets/textures/' + rough);
        material.roughnessMap = map;
    }

    if (metal) {
        map = new THREE.TextureLoader().load('./assets/textures/' + metal);
        material.metalnessMap = map;
        material.metalness = 1;
    }

    material.envMap = GLOBALS.ENV_MAP;
    material.envMapIntensity = envIntensity;
}

const textureLoader = new THREE.TextureLoader();
const map = textureLoader.load('./assets/textures/decal/base2.png');
//decalDiffuse.colorSpace = THREE.SRGBColorSpace;
map.colorSpace = THREE.SRGBColorSpace;
const normal = textureLoader.load('./assets/textures/decal/normal.jpg');

GLOBALS.INK_MATERIAL = new THREE.MeshStandardMaterial({
    //map: map,
    normalMap: normal,
    normalScale: new THREE.Vector2(1, 1),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    wireframe: false,
    roughness: 0.0,
});

//
var texture = new THREE.TextureLoader().load("./assets/textures/tilePortal.jpg");
map.colorSpace = THREE.SRGBColorSpace;
GLOBALS.MATERIAL_PORTAL_EDITOR = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true
})
//
var texture = new THREE.TextureLoader().load("./assets/textures/tileNonPortal.jpg");
map.colorSpace = THREE.SRGBColorSpace;
GLOBALS.MATERIAL_NON_PORTAL_EDITOR = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true
});
//
GLOBALS.IMG_CHECK = new THREE.TextureLoader().load('./assets/check.png');
GLOBALS.IMG_CLOSE = new THREE.TextureLoader().load('./assets/close.png');

export {
    loadMaterials
}