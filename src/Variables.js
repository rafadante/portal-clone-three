/* eslint-disable */
import * as THREE from 'three';
import * as CANNON from 'cannon';

//
window.paused = false;
window.fps = 60;
var pixelRatio, shadowMap, portalsRecursive, fov;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    window.mobile = true;
    pixelRatio = 1;
    shadowMap = true;
    portalsRecursive = 1;
    fov = 70;
} else {
    window.mobile = false;
    pixelRatio = 1;
    shadowMap = true;
    portalsRecursive = 7;
    fov = 60;
}

//
var camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.005, 1000);
camera.rotation.order = 'YXZ';
camera.position.set(0, 0, 30);

const geometryHolder = new THREE.BoxGeometry(0.0, 0.0, 0.0);
const materialHolder = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
const cubeHolder = new THREE.Mesh(geometryHolder, materialHolder);
cubeHolder.position.z = -1;
camera.add(cubeHolder);
window.holder = cubeHolder;
//
const scene = new THREE.Scene();

const geometry2 = new THREE.BoxGeometry(1, 1, 1);
const material2 = new THREE.MeshBasicMaterial({
    color: 0x00ff00
});
const cube = new THREE.Mesh(geometry2, material2);
//scene.add( cube );
//
var RENDERER = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
    stencil: true
});
console.log(window.devicePixelRatio)
RENDERER.setPixelRatio(window.devicePixelRatio * pixelRatio);
RENDERER.setSize(window.innerWidth, window.innerHeight);
RENDERER.outputEncoding = THREE.sRGBEncoding;
RENDERER.outputColorSpace = THREE.SRGBColorSpace;
RENDERER.toneMapping = THREE.ACESFilmicToneMapping;;
RENDERER.toneMappingExposure = 0.5;
RENDERER.shadowMap.enabled = shadowMap;
RENDERER.shadowMap.type = THREE.PCFSoftShadowMap;
RENDERER.localClippingEnabled = true;
RENDERER.physicallyCorrectLights = true;
RENDERER.domElement.id = "viewer-3d";
//


window.maxAnisotropy = RENDERER.capabilities.getMaxAnisotropy();
//
//const geometry = new THREE.PlaneGeometry(2, 2);
const geometry = new THREE.BoxGeometry(2, 2, 0.1);
const material = new THREE.MeshBasicMaterial({
    color: 0xfcb603,
    transparent: true,
    opacity: 0.5,
    //polygonOffset: true,
    //polygonOffsetFactor: -10
    //depthTest: false
});
var CUBE_SELECTION = new THREE.Mesh(geometry, material);
CUBE_SELECTION.name = "cubeSelection";
CUBE_SELECTION.rotation.x = -Math.PI / 2
CUBE_SELECTION.position.y = 0.5;
//
const geometryShadowPlane = new THREE.PlaneGeometry(16, 12);
const materialShadowPlane = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0
});
const SHADOW_PLANE = new THREE.Mesh(geometryShadowPlane, materialShadowPlane);
SHADOW_PLANE.position.x = 8;
SHADOW_PLANE.position.y = 0;
SHADOW_PLANE.position.z = 6;
SHADOW_PLANE.rotation.x = Math.PI / 2;
scene.add(SHADOW_PLANE);
//
var texture = new THREE.TextureLoader().load("./assets/models/tileNonPortal.jpg");
texture.encoding = THREE.sRGBEncoding;
var MATERIAL_NON_PORTAL_EDITOR = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true
})
//
var texture = new THREE.TextureLoader().load("./assets/models/tilePortal.jpg");
texture.encoding = THREE.sRGBEncoding;
var MATERIAL_PORTAL_EDITOR = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true
})
//
var MATERIAL_PORTAL_EDITOR_FLIPED = MATERIAL_PORTAL_EDITOR.clone();
MATERIAL_PORTAL_EDITOR_FLIPED.side = 2;
//
var MATERIAL_NON_PORTAL_EDITOR_FLIPED = MATERIAL_NON_PORTAL_EDITOR.clone();
MATERIAL_NON_PORTAL_EDITOR_FLIPED.side = 2;

let PHYSICS_MATERIAL = new CANNON.Material();
PHYSICS_MATERIAL.friction = 0.01;
PHYSICS_MATERIAL.restitution = 0.1;
//VARIABLES
/***********************************************************
 * PORTALS
 ***********************************************************/
window.PORTAL_RECURSION_LEVELS = portalsRecursive
/***********************************************************
 * WORLD
 ***********************************************************/
window.MAIN_CAMERA = camera
window.MAIN_SCENE = scene
window.PORTAL_TARGETS = [new THREE.WebGLRenderTarget(1, 1), new THREE.WebGLRenderTarget(1, 1)]
window.PORTAL_TMP_TARGETS = [new THREE.WebGLRenderTarget(1, 1), new THREE.WebGLRenderTarget(1, 1)]
window.PORTALS = [null, null]
window.FPS = false

window.SELECTING = false
window.CUBE_SELECTION_ARRAY = []
window.COMPOSER = null
window.SELECTED = null
window.ROOM = new THREE.Group()
window.CUBE_SELECTION = CUBE_SELECTION
window.CONTROLS = null
window.RENDERER = RENDERER
window.CUBES_EDIT = []
window.CUBES = new THREE.Group()

window.CORRIDOR_EXIT = null
window.CORRIDOR_ENTER = null
window.GUN = null
window.GROUP_STRUCTURE = new THREE.Group()
window.SURFACES_TO_PLACE_PORTAL = []
window.INVERTED_MATERIAL = new THREE.MeshStandardMaterial({
        side: 0
    }),
    window.ENV_MAP_FPS = null
window.ENTER_DOOR = null
window.EXIT_DOOR = null
window.GUN_BLOOM = null
window.DEFAULT_CUBE = null
window.INVERTED_CUBE = null

window.MATERIAL_PORTAL_EDITOR = MATERIAL_PORTAL_EDITOR
window.MATERIAL_NON_PORTAL_EDITOR = MATERIAL_NON_PORTAL_EDITOR

window.MATERIAL_NON_PORTAL_EDITOR_FLIPED = MATERIAL_NON_PORTAL_EDITOR_FLIPED
window.MATERIAL_PORTAL_EDITOR_FLIPED = MATERIAL_PORTAL_EDITOR_FLIPED

window.PORTAL_WIDTH = 1
window.PORTAL_DEPTH = 2
window.PORTAL_CDBB_HEIGHT = 3
window.PORTAL_HEIGHT = 0.0
window.PORTAL_EPS = 0.01
window.PORTAL_RING_THICKNESS = 0.3
window.PORTAL_COLORS = [0x00e1ff, 0xffc600]

window.CGROUP_ENVIRONMENT = 1 << 0
window.CGROUP_PORTAL_HOST_CDISABLE = [1 << 1, 1 << 2]
window.CGROUP_DYNAMIC = 1 << 3
window.CGROUP_ALL = 0xFF
window.PLAYER_COLLIDER = null
window.CONTACT_SHADOW_POSITION = null
window.maxAnisotropy = maxAnisotropy
window.STATE_PORTAL = null

window.PHYSICS_UPDATEPERSEC_LIMIT = 75
window.PHYSICS_MATERIAL = PHYSICS_MATERIAL
window.PLAYER = null
window.HOLDING_ITEM = false
window.LIGHT_GROUP = null

window.STATS = null
window.ITEM_HOLDED_NAME = null
window.ITEMS = new THREE.Group()
window.ITEMS_ADDED = new THREE.Group()
window.INTERACTIVE = []
window.ITEM_BOXES = []
window.BOX_BODY = []
window.ITEM_SPHERES = []
window.ITEM_GENERAL = []
window.SPHERE_BODY = []
window.DISPENSER_COVERS = []
window.CURRENT_ITEM = null

window.COL_X = false
window.COL_X_POS = 0
window.COL_Y = false
window.COL_Y_POS = 0
window.COL_Z = false
window.COL_Z_POS = 0
window.ITEM_CUBE = null


//----------------------------------------------
var map;

//MATERIAL FLOOR NON PORTAL
window.materialFloorNonPortal = new THREE.MeshPhysicalMaterial();

map = new THREE.TextureLoader().load('./assets/textures/floor2/base.jpg');
map.encoding = THREE.sRGBEncoding;
materialFloorNonPortal.map = map;

map = new THREE.TextureLoader().load('./assets/textures/floor2/ao.jpg');
//materialFloorNonPortal.aoMap = map;

map = new THREE.TextureLoader().load('./assets/textures/floor2/normal.jpg');
materialFloorNonPortal.normalMap = map;

map = new THREE.TextureLoader().load('./assets/textures/floor2/roughness.jpg');
//materialFloorNonPortal.roughnessMap = map;
//MATERIAL FLOOR PORTAL
window.materialFloorPortal = materialFloorNonPortal.clone();

map = new THREE.TextureLoader().load('./assets/textures/floor2/base2.jpg');
map.encoding = THREE.sRGBEncoding;
materialFloorPortal.map = map;
//MATERIAL WALL PORTAL
window.materialWallPortal = new THREE.MeshPhysicalMaterial({
    side: 2,
});

map = new THREE.TextureLoader().load('./assets/textures/wall4/base.jpg');
map.encoding = THREE.sRGBEncoding;
//map.colorSpace = THREE.SRGBColorSpace;
map.flipY = true;
map.wrapS = map.wrapT = THREE.RepeatWrapping;
map.repeat.set(0.5, 0.5);
materialWallPortal.map = map;

map = new THREE.TextureLoader().load('./assets/textures/wall/2/ao.jpg');
map.wrapS = map.wrapT = THREE.RepeatWrapping;
map.repeat.set(2, 2);
//map.colorSpace = THREE.SRGBColorSpace;
//materialWallPortal.aoMap = map;

map = new THREE.TextureLoader().load('./assets/textures/wall/2/normal.jpg');
//map.encoding = THREE.sRGBEncoding;
//map.colorSpace = THREE.SRGBColorSpace;
map.wrapS = map.wrapT = THREE.RepeatWrapping;
map.repeat.set(2, 2);
materialWallPortal.normalMap = map;

map = new THREE.TextureLoader().load('./assets/textures/wall/2/roughness.jpg');
map.wrapS = map.wrapT = THREE.RepeatWrapping;
map.repeat.set(2, 2);
materialWallPortal.roughnessMap = map;


//MATERIAL NON WALL PORTAL
window.materialWallNonPortal = materialWallPortal.clone();

map = new THREE.TextureLoader().load('./assets/textures/wall4/base3.jpg');
map.encoding = THREE.sRGBEncoding;
map.wrapS = map.wrapT = THREE.RepeatWrapping;
//map.repeat.set(0.5, 0.5);
materialWallNonPortal.map = map;
//
window.OBSERVATION_ROOM = null;
window.OBSERVATION_ROOM_IMG = null;

window.CHECK = new THREE.TextureLoader().load('./assets/check.png');

 /**********************************************************
    * PHYSICS
    **********************************************************/
    // https://github.com/schteppe/cannon.js/blob/master/demos/collisionFilter.html
    // as long as at one of the objects say that it doesn't collide with the other, then they will not collide.
    // we don't have to set collision masks for both.
    // rules:
    // all dynamic objects collide with all environment objects and dynamic objects by default.
    //    all dynamic objects have mask ALL on creation
    //    group DYNAMIC on creation
    // all environment objects collide with dynamic objects by default.
    //    all environment objects have mask DYNAMIC on creation
    //    group ENVIRONMENT on creation
    // when dynamic object d is in bb of portal p, then d should not collide with p's host object.
    //    on create p: set p host object group to PORTAL_HOST_CDISABLE[p]
    //        p host object mask is still DYNAMIC
    //    on trigger bb: set d mask to all except for PORTAL_HOST_CDISABLE[p]
    //        d group is still DYNAMIC
    //        d mask is its ALL & ~PORTAL_HOST_CDISABLE[p]
    // pseudocode:
    // on update loop:
    // for each dynamic object d:
    //     set mask to CGROUP_ALL
    //     for each portal p:
    //         if d in p's bounding box:
    //             set mask &= ~CGROUP_PORTAL_HOST_CDISABLE[p]
    //     no change to group.
    // on creation of portal p:
    //     set previous host object group back to CGROUP_ENVIRONMENT if in neither CGROUP_PORTAL_HOST_CDISABLE's
    //     set new host object group &= CGROUP_PORTAL_HOST_CDISABLE[p]
    //     no change to mask.
    window.CGROUP_ENVIRONMENT = 1 << 0;
    window.CGROUP_PORTAL_HOST_CDISABLE = [1 << 1, 1 << 2];
    window.CGROUP_DYNAMIC = 1 << 3;
    window.CGROUP_ALL = 0xFF;