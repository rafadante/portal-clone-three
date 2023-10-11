import * as THREE from 'three';

//MATERIAL FLOOR NON PORTAL
window.materialFloorNonPortal = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialFloorNonPortal, 'floor/nonPortalable/1/base.jpg',
    'floor/nonPortalable/1/normal.jpg', null, 'floor/nonPortalable/1/roughness.jpg', null, 1);

//MATERIAL FLOOR PORTAL
window.materialFloorPortal = window.materialFloorNonPortal.clone();
loadMaterial(window.materialFloorPortal, 'floor/portalable/1/base.jpg', null, null, null, null, 1);

//MATERIAL WALL PORTAL
window.materialWallPortal = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialWallPortal, 'wall/portalable/1/base.jpg', 'wall/portalable/1/normal.jpg',
    null, 'wall/portalable/1/roughness.jpg', null, 1);

//MATERIAL WALL PORTAL 2
window.materialWallPortal2 = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialWallPortal2, 'wall/portalable/2/base.jpg', 'wall/portalable/2/normal.jpg',
    'wall/portalable/2/ao.jpg', 'wall/portalable/2/roughness.jpg', null, 1);

//MATERIAL WALL PORTAL 3
window.materialWallPortal3 = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialWallPortal3, 'wall/portalable/3/base.jpg', 'wall/portalable/3/normal.jpg',
    null, 'wall/portalable/3/roughness.jpg', null, 1);

//MATERIAL NON WALL PORTAL
window.materialWallNonPortal = window.materialWallPortal.clone();
loadMaterial(window.materialWallNonPortal, 'wall/nonPortalable/1/base.jpg', null,
    null, null, null, 1);

//MATERIAL NON WALL PORTAL 2
window.materialWallNonPortal2 = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialWallNonPortal2, 'wall/nonPortalable/2/base.jpg',
    'wall/nonPortalable/2/normal.jpg', null, null, 'wall/nonPortalable/2/metal.jpg', 0.5);

//MATERIAL NON WALL PORTAL 3
window.materialWallNonPortal3 = new THREE.MeshPhysicalMaterial();
loadMaterial(window.materialWallNonPortal3, 'wall/nonPortalable/3/base.jpg',
    'wall/nonPortalable/3/normal.jpg', null, null, 'wall/nonPortalable/3/metal.jpg', 0.5);

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
}