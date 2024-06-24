import * as THREE from 'three';
import {
    GLOBALS
} from '../../Globals.js';

function loadMaterials() {
    //MATERIAL FLOOR NON PORTAL
    GLOBALS.MATERIAL_FLOOR_NON_PORTAL = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_FLOOR_NON_PORTAL, 'metal/floor.jpg', 'metal/floor_normal.jpg', null, 
    'floor/nonPortalable/1/roughness.jpg', null, 1);
    GLOBALS.MATERIAL_FLOOR_NON_PORTAL.envMapIntensity = 0.3;

    //MATERIAL FLOOR PORTAL
    GLOBALS.MATERIAL_FLOOR_PORTAL = GLOBALS.MATERIAL_FLOOR_NON_PORTAL.clone();
    loadMaterial(GLOBALS.MATERIAL_FLOOR_PORTAL, 'portal/floor.jpg', 'portal/floor_normal.jpg', null, null, null, 1);

    //MATERIAL WALL PORTAL
    GLOBALS.MATERIAL_WALL_PORTAL = new THREE.MeshStandardMaterial();
    loadMaterial(GLOBALS.MATERIAL_WALL_PORTAL, 'portal/wall2.jpg', 'portal/wall2_normal.jpg',
        null, null, null, 1);

    //MATERIAL WALL NON PORTAL
    GLOBALS.MATERIAL_WALL_NON_PORTAL = GLOBALS.MATERIAL_WALL_PORTAL.clone();
    loadMaterial(GLOBALS.MATERIAL_WALL_NON_PORTAL, 'metal/wall2.jpg', 'metal/wall2_normal.jpg',
        null, null, null, 1);
}

function loadMaterial(material, base, normal, ao, rough, metal, roughValue) {

    var map;
    material.roughness = roughValue;

    if (base) {
        map = new THREE.TextureLoader().load('./assets/textures/' + base);
        map.encoding = THREE.sRGBEncoding;
        material.map = map;
    }

    if (normal) {
        map = new THREE.TextureLoader().load('./assets/textures/' + normal);
        //map.encoding = THREE.sRGBEncoding;
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
    material.envMapIntensity = 0.15;
}

const textureLoader = new THREE.TextureLoader();
const map = textureLoader.load('./assets/textures/decal/base2.png');
//decalDiffuse.colorSpace = THREE.SRGBColorSpace;
map.encoding = THREE.sRGBEncoding;
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
texture.encoding = THREE.sRGBEncoding;
GLOBALS.MATERIAL_PORTAL_EDITOR = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true
})
//
var texture = new THREE.TextureLoader().load("./assets/textures/tileNonPortal.jpg");
texture.encoding = THREE.sRGBEncoding;
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