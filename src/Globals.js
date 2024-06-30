/* eslint-disable */
import * as THREE from 'three';
import * as CANNON from 'cannon';
import "./components/materials/Materials.js"
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';

var pixelRatio, shadowMap, portalsRecursive, fov, mobile,antialias;

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    mobile = true;
    pixelRatio = 0.5;
    shadowMap = true;
    portalsRecursive = 1;
    fov = 60;
    antialias = false;
} else {
    mobile = false;
    pixelRatio = 0.5;
    shadowMap = true;
    portalsRecursive = 2;
    fov = 60;

    if(localStorage.getItem("antialising") == "true"){
        antialias = true;
    }else{
        antialias = false;
    }
}

//MAIN CAMERA
const camera = new THREE.PerspectiveCamera(fov, window.innerWidth / window.innerHeight, 0.005, 500);
camera.rotation.order = 'YXZ';
camera.position.set(0, 0, 30);

//POINT OF OBJECTS WHILE HOLDING WITH THE GUN
const cubeHolder = new THREE.Object3D()
cubeHolder.position.z = -1.25;
cubeHolder.name = "cubeHolder";
window.cubeHolder = cubeHolder;
camera.add(cubeHolder);

//RENDERER
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    powerPreference: "high-performance",
    antialias: antialias,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;;
renderer.toneMappingExposure = 0.6;
renderer.shadowMap.enabled = shadowMap;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.shadowMap.needsUpdate = false;
renderer.localClippingEnabled = false;
//renderer.physicallyCorrectLights = true;
renderer.domElement.id = "viewer-3d";
renderer.shadowMap.autoUpdate = false;

//CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0;

var GLOBALS = {

    PIXEL_RATIO: pixelRatio,

    SCENE: new THREE.Scene(),
    SCENE_CHILDREN: new THREE.Group(),
    MAIN_CAMERA: camera,
    CONTROLS: controls,
    POINTER_CONTROLS: null,
    RENDERER: renderer,
    ITEM_HOLDED_NAME: null,

    //BOOLEAN
    FPS_MODE: false,
    MOBILE: mobile,
    PAUSED: false,
    CONNECTING: false,
    STOP_TIME: false,
    FPS_UNLOCKED: true,
    HOLDING_ITEM: false,
    ALLOW_PLACE_PORTALS: true,
    GEL_ORANGE: false,
    LOADED_LEVEL: false,

    //GROUPS
    ITEMS_ADDED: new THREE.Group(),
    ROOM: new THREE.Group(),
    ITEMS: new THREE.Group(),
    CUBES: new THREE.Group(),

    //LEVEL EDITOR
    PLANE_USER_DATA: [],
    PLANE_LEVEL_INSTANCED: null,
    BUDGET: 3000,

    //PORTALS
    PORTALS: [null, null],
    PORTAL_RECURSION_LEVELS: portalsRecursive,
    PORTAL_TARGETS: [new THREE.WebGLRenderTarget(1, 1), new THREE.WebGLRenderTarget(1, 1)],
    PORTAL_TMP_TARGETS: [new THREE.WebGLRenderTarget(1, 1), new THREE.WebGLRenderTarget(1, 1)],
    PORTAL_WIDTH: 1,
    PORTAL_DEPTH: 2,
    PORTAL_EPS: 0.01,
    PORTAL_COLORS: [0x00e1ff, 0xffc600],
    PORTAL_CDBB_HEIGHT: 3,
    PORTAL_HEIGHT: 0.0,
    PORTAL_RING_THICKNESS: 0.3,
    PORTAL_SHADER: [],
    PORTAL_BOX: [],
    PORTAL_INNER_BOX: [],

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
    CANNON_WORLD: null,
    CGROUP_ENVIRONMENT: 1 << 0,
    CGROUP_PORTAL_HOST_CDISABLE: [1 << 1, 1 << 2],
    CGROUP_DYNAMIC: 1 << 3,
    CGROUP_ALL: 0xFF,
    PHYSICS_UPDATEPERSEC_LIMIT: 75,
    PHYSICS_MATERIAL: new CANNON.Material({
        friction: 0.01,
        restitution: 0.1
    }),
    PLAYER: null,
    PLAYER_MODEL: null,
    PLAYER_MODEL_CLONE: null,
    PLAYER_ANIMATIONS: null,
    MIXERS: null,
    BOX_BODY: [],
    SPHERE_BODY: [],
    TRIGGER: [],

    //ITEMS
    DYMANIC_ITEMS: {
        cube: [],
        sphere: [],
        gel_gun_blue: [],
        gel_gun_orange: [],
        gel_gun_white: [],
        pedestal_button: [],
        radio: [],
        button_weight: [],
        button_box: [],
        button_circle: [],
        dispenser: [],
        ramp: [],
        ramp_half: [],
        ramp_half2: [],
        stairs: [],
        light_bridge: [],
        tractor_beam: [],
        laser_emitter: [],
        laser_cube: [],
        faith_plate: [],
        door: [],
        light: [],
        lightEmissive: [],
        stripe: [],
        gel_blue: [],
        gel_orange: [],
        camera: []
    },

    INTERACTIVE: [],
    ITEM_CUBE: null,
    DYNAMIC_OBJECTS: [],
    SELECTED_ID: [],
    SELECTED_ID_ORANGE: [],
    SELECTED_SIDE: null,
    SELECTED_COLOR: [],
    SELECTED: null,
    SELECTING: false,
    SELECTED_FOR_CONNECTION: null,

    GELS: [],

    CURRENT_ITEM: null,
    CURRENT_ITEM_ID: null,

    GUN: null,
    GUN_CLONE: null,
    GUN_MODE: 1,

    ENV_MAP: null,
    STATS: null,
    INK_MATERIAL: null,

    CORRIDOR_ENTER: null,
    ENTER_DOOR: null,
    EXIT_DOOR: null,

    LASER_EMITTER: [],
    LASER_EMITTER_OBJ: [],
    LASER_EMITTER_LENGTH: 0,
    LASER_EMITTER_BOUNDING_BOX: [],
    LASER_EMITTER_RAYCASTER: [],
    LASER_CUBE: null,

    TRACTOR_BEAM: [],
    TRACTOR_BEAM_BOUNDING_BOX: [],
    TRACTOR_BEAM_RAYCASTER: [],
    TRACTOR_BEAM_LENGTH: 0,

    LIGHT_BRIDGE_RAYCASTER: [],
    LIGHT_BRIDGE_CLONE: [],
    LIGHT_BRIDGE_COLLIDER_CLONE: [],

    LIGHT_GROUP: null,
    INTERVAL: 1 / 60,
    CURRENT_INSTANCED: null,

    CAMERA_OBJ_HORIZONTAL: [],
    CAMERA_OBJ_VERTICAL: [],

    MATERIAL_PORTAL_EDITOR: null,
    MATERIAL_NON_PORTAL_EDITOR: null,

    OBSERVATION_ROOM: null,
    OBSERVATION_ROOM_IMG: null,

    IMG_CHECK: null,
    IMG_CLOSE: null,

    SMOOTHNESS: 0.15,

    GOO_PLANES: [],
    GOO_BOXES: [],

    FAITH_PLATE_TO_ROTATE: [],
    FAITH_PLATE_CONTACT_BOX: [],

    UNIFORMS_GEL: null,
    UNIFORMS_LIGHT_BRIDGE: null,
    UNIFORMS_TRACTOR_BEAM: null,
    UNIFORMS_PORTAL_GUN_ENERGY: null,

    LIGHTNIN_STRIKE_1: null,
    LIGHTNIN_STRIKE_2: null,
    LIGHTNIN_STRIKE_3: null,

    TARGET_ROTATION_X: 0,
    TARGET_ROTATION_Y: 0,

    EXIT_ROOM: null,
    EXIT_ROOM_COLLIDERS: [],

    SPOTLIGHT: null,

    DOORS: [],

    MATERIAL_FLOOR_PORTAL: null,
    MATERIAL_FLOOR_NON_PORTAL: null,
    MATERIAL_WALL_PORTAL: null,
    MATERIAL_WALL_NON_PORTAL: null,
    MATERIAL_GUN: null,
    MATERIAL_EXIT_ROOM: null,
    MATERIAL_MAIN_MENU: null,
    MATERIAL_SUB_MENU: null,
    TEXTURE_MENU_GRID: null,

    MATERIAL_TRACTOR_BEAM: null,
    MATERIAL_LIGHT_BRIDGERS: null,

    ELEVATOR: null,
    ELEVATOR_DOOR_LEFT: null,
    ELEVATOR_DOOR_RIGHT: null,
    ELEVATOR_TRIGGER: null,

    WALL_CORRIDOR_ENTER: null,
    WALL_CORRIDOR_BACK: null,

    PLANE_EXIT_DOOR: null,

    PORTAL_GUN_CLONE_STATE: true,
    PLAYER_CLONE_STATE: true,
    FLASH: null,
    FLASH_CLONE: null,
    PORTAL_GUN_FLASH: null,
    PORTAL_RENDER_LEVEL: 0,

    LIGHT_PORTAL_0: null,
    LIGHT_PORTAL_1: null,
    RADIO_MUSIC: [],
    CAMERAS: []
}

GLOBALS.SCENE.add(GLOBALS.SCENE_CHILDREN)

export {
    GLOBALS
}