import {
    MeshStandardMaterial,
    TextureLoader,
    SRGBColorSpace,
    Vector2,
    Color,
    MeshBasicMaterial,
    RepeatWrapping
} from 'three';
import {
    GLOBALS
} from '../../Globals.js';

function loadMaterials() {
    //MATERIAL FLOOR NON PORTAL
    GLOBALS.MATERIAL_FLOOR_NON_PORTAL = new MeshStandardMaterial();
    loadMaterial(
        GLOBALS.MATERIAL_FLOOR_NON_PORTAL,
        'metal/floor.jpg',
        'metal/floor_normal.jpg',
        null,
        null,//'floor/nonPortalable/1/roughness.jpg'
        null,
        null,
        0.7,
        0,
        0.2,
        0,
        null,
        null
    );

    //MATERIAL FLOOR PORTAL
    GLOBALS.MATERIAL_FLOOR_PORTAL = GLOBALS.MATERIAL_FLOOR_NON_PORTAL.clone();
    loadMaterial(
        GLOBALS.MATERIAL_FLOOR_PORTAL,
        'portal/floor.jpg',
        'portal/floor_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    //MATERIAL WALL PORTAL
    GLOBALS.MATERIAL_WALL_PORTAL = new MeshStandardMaterial();
    loadMaterial(
        GLOBALS.MATERIAL_WALL_PORTAL,
        'portal/wall1.jpg',
        'portal/wall1_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    GLOBALS.MATERIAL_WALL_PORTAL2 = new MeshStandardMaterial();
    loadMaterial(
        GLOBALS.MATERIAL_WALL_PORTAL2,
        'portal/wall2.jpg',
        'portal/wall2_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    GLOBALS.MATERIAL_WALL_PORTAL3 = new MeshStandardMaterial();
    loadMaterial(
        GLOBALS.MATERIAL_WALL_PORTAL3,
        'portal/wall3.jpg',
        'portal/wall3_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    GLOBALS.MATERIAL_WALL_PORTAL4 = new MeshStandardMaterial();
    loadMaterial(
        GLOBALS.MATERIAL_WALL_PORTAL4,
        'portal/wall4.jpg',
        'portal/wall4_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    //MATERIAL WALL NON PORTAL
    GLOBALS.MATERIAL_WALL_NON_PORTAL = GLOBALS.MATERIAL_WALL_PORTAL.clone();
    loadMaterial(
        GLOBALS.MATERIAL_WALL_NON_PORTAL,
        'metal/wall1.jpg',
        'metal/wall1_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    GLOBALS.MATERIAL_WALL_NON_PORTAL2 = GLOBALS.MATERIAL_WALL_PORTAL.clone();
    loadMaterial(
        GLOBALS.MATERIAL_WALL_NON_PORTAL2,
        'metal/wall2.jpg',
        'metal/wall2_normal.jpg',
        null,
        null,
        null,
        null,
        1,
        0,
        0.2,
        0,
        null,
        null
    );

    //GRID
    GLOBALS.MATERIAL_GRID = new MeshStandardMaterial({
        side: 2
    });

    loadMaterial(
        GLOBALS.MATERIAL_GRID,
        "wall/grid/1K_chain_1_basecolor.png",
        "wall/grid/1K_chain_1_normal.png",
        "wall/grid/1K_chain_1_ambientocclusion.png",
        null,
        null,
        "wall/grid/1K_chain_1_opacity.png",
        0.25,
        1,
        0.5,
        0.5,
        100,
        100
    );

    //GLASS
    GLOBALS.MATERIAL_GLASS = new MeshStandardMaterial({
        transparent: true,
        opacity: 0.5,
        side: 2
    });
    loadMaterial(
        GLOBALS.MATERIAL_GLASS,
        "wall/glass/Image_8.png",
        "wall/glass/normal.png",
        null,
        null,
        null,
        null,
        0.1,
        0,
        0.8,
        0,
        null,
        null
    );
}

function loadMaterial(material, base, normal, ao, rough, metal, alpha, roughValue, metalValue, envIntensity, alphaTest, repeatX, repeatY) {

    var map;
    material.roughness = roughValue;
    material.metalness = metalValue;

    if (base) {
        map = new TextureLoader().load('./assets/textures/' + base);
        map.colorSpace = SRGBColorSpace;
        material.map = map;

        if (repeatX)
            applyRepeat(map, repeatX, repeatY);
    }

    if (normal) {
        map = new TextureLoader().load('./assets/textures/' + normal);
        material.normalMap = map;
        //material.normalScale.x = 2;
        //material.normalScale.y = 2;
        ///console.log(material)

        if (repeatX)
            applyRepeat(map, repeatX, repeatY);
    }

    if (ao) {
        map = new TextureLoader().load('./assets/textures/' + ao);
        material.aoMap = map;

        if (repeatX)
            applyRepeat(map, repeatX, repeatY);
    }

    if (rough) {
        map = new TextureLoader().load('./assets/textures/' + rough);
        material.roughnessMap = map;

        if (repeatX)
            applyRepeat(map, repeatX, repeatY);
    }

    if (metal) {
        map = new TextureLoader().load('./assets/textures/' + metal);
        material.metalnessMap = map;

        if (repeatX)
            applyRepeat(map, repeatX, repeatY);
    }

    if (alpha) {
        map = new TextureLoader().load('./assets/textures/' + alpha);
        material.alphaMap = map;

        if (repeatX)
            applyRepeat(map, repeatX, repeatY);
    }

    material.envMap = GLOBALS.ENV_MAP;
    material.alphaTest = alphaTest;

    if (GLOBALS.MOBILE || (localStorage.getItem("quality-select") != "epic" && localStorage.getItem("quality-select") != "high"))
        material.envMapIntensity = 0.5;
    else
        material.envMapIntensity = envIntensity;
}

function applyRepeat(map, repeatX, repeatY) {
    console.log(map)
    map.wrapS = map.wrapT = RepeatWrapping;
    map.repeat.set(repeatX, repeatY);
    map.needsUpdate = true;
}

const textureLoader = new TextureLoader();
const map = textureLoader.load('./assets/textures/decal/base2.png');
//decalDiffuse.colorSpace = SRGBColorSpace;
map.colorSpace = SRGBColorSpace;
var normal = textureLoader.load('./assets/textures/decal/normal.webp');

GLOBALS.INK_MATERIAL = new MeshStandardMaterial({
    //map: map,
    normalMap: normal,
    normalScale: new Vector2(1, 1),
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    wireframe: false,
    roughness: 0.0,
});

//
var texture = new TextureLoader().load("./assets/textures/tilePortal.jpg");
map.colorSpace = SRGBColorSpace;
GLOBALS.MATERIAL_PORTAL_EDITOR = new MeshStandardMaterial({
    map: texture,
    transparent: true
})
//
var texture = new TextureLoader().load("./assets/textures/tileNonPortal.jpg");
map.colorSpace = SRGBColorSpace;
GLOBALS.MATERIAL_NON_PORTAL_EDITOR = new MeshStandardMaterial({
    map: texture,
    transparent: true
});
//
GLOBALS.IMG_CHECK = new TextureLoader().load('./assets/check.png');
GLOBALS.IMG_CLOSE = new TextureLoader().load('./assets/close.png');

function updateMaterialRepeat(mesh, newMaterial, distance) {
    mesh.material = newMaterial.clone();

    const x = 5;
    distance *= 5;

    var cloneTexture = mesh.material.map.clone();
    mesh.material.map = cloneTexture;
    cloneTexture.repeat.set(x, distance);
    cloneTexture.needsUpdate = true;

    var cloneTexture = mesh.material.normalMap.clone();
    mesh.material.normalMap = cloneTexture;
    cloneTexture.repeat.set(x, distance);
    cloneTexture.needsUpdate = true;

    if (mesh.material.metalnessMap) {
        var cloneTexture = mesh.material.metalnessMap.clone();
        mesh.material.metalnessMap = cloneTexture;
        cloneTexture.repeat.set(x, distance);
        cloneTexture.needsUpdate = true;
    }

    if (mesh.material.alphaMap) {
        var cloneTexture = mesh.material.alphaMap.clone();
        mesh.material.alphaMap = cloneTexture;
        cloneTexture.repeat.set(x, distance);
        cloneTexture.needsUpdate = true;
    }

    if (mesh.material.roughnessMap) {
        var cloneTexture = mesh.material.roughnessMap.clone();
        mesh.material.roughnessMap = cloneTexture;
        cloneTexture.repeat.set(x, distance);
        cloneTexture.needsUpdate = true;
    }
}

//
var texture = new TextureLoader().load("./assets/textures/trigger_once.jpg");
map.colorSpace = SRGBColorSpace;
GLOBALS.MATERIAL_TRIGGER_ONCE = new MeshBasicMaterial({
    map: texture
});


var texture = new TextureLoader().load("./assets/textures/trigger_mult.jpg");
map.colorSpace = SRGBColorSpace;
GLOBALS.MATERIAL_TRIGGER_MULT = new MeshBasicMaterial({
    map: texture
});

var texture = new TextureLoader().load("./assets/textures/cone.png");
map.colorSpace = SRGBColorSpace;
GLOBALS.MATERIAL_CONE = new MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.05,
    emissive: new Color(2, 2, 0),
    side: 2
});

export {
    loadMaterials,
    updateMaterialRepeat
}