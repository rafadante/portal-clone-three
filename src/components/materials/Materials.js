import * as THREE from 'three';

//MATERIAL FLOOR NON PORTAL
window.materialFloorNonPortal = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialFloorNonPortal, 'floor/nonPortalable/1/base.jpg', 'floor/nonPortalable/1/normal.jpg',
    null, 'floor/nonPortalable/1/roughness.jpg', null);

//MATERIAL FLOOR PORTAL
window.materialFloorPortal = window.materialFloorNonPortal.clone();
loadMaterial(window.materialFloorPortal, 'floor/portalable/1/base.jpg', null, null, null, null);

//MATERIAL WALL PORTAL
window.materialWallPortal = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialWallPortal, 'wall/portalable/1/base.jpg', 'wall/portalable/1/normal.jpg',
    null, 'wall/portalable/1/roughness.jpg', null);

//MATERIAL NON WALL PORTAL
window.materialWallNonPortal = window.materialWallPortal.clone();
loadMaterial(window.materialWallNonPortal, 'wall/nonPortalable/1/base.jpg', null,
    null, null, null);

function loadMaterial(material, base, normal, ao, rough, metal) {

    var map;

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
        material.metalness = map;
    }
}