import {
    PerspectiveCamera, Object3D, WebGLRenderer, SRGBColorSpace, ACESFilmicToneMapping,
    PCFSoftShadowMap, Group, Scene, WebGLRenderTarget, AudioListener, Mesh, BufferGeometry
} from 'three';
import * as CANNON from 'cannon';
import "./components/materials/Materials.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import $ from 'jquery';

// Add the extension functions
BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
Mesh.prototype.raycast = acceleratedRaycast;

var pixelRatio, shadowMap, portalsRecursive, fov, mobile, antialias;

if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    mobile = true;
    pixelRatio = 0.5;
    shadowMap = false;
    portalsRecursive = 1;
    fov = 63;
    antialias = false;

    document.getElementById("next-map").style.transform = "scale(0.5)";

    $(".desktop").css("display", "none")
} else {
    mobile = false;
    pixelRatio = 0.5;
    shadowMap = true;
    portalsRecursive = 2;
    fov = 63;

    if (localStorage.getItem("antialising") == "true")
        antialias = true;
    else
        antialias = false;
}

const maxWidth = 1920;  // Set your maximum width resolution
const maxHeight = 1080; // Set your maximum height resolution

// Get the actual window dimensions
window.canvasWidth = window.innerWidth;
window.canvasHeight = window.innerHeight;

// Cap the width and height to your maximum values
window.canvasWidth = Math.min(window.canvasWidth, maxWidth);
window.canvasHeight = Math.min(window.canvasHeight, maxHeight);

//MAIN CAMERA
const camera = new PerspectiveCamera(fov, window.canvasWidth / window.canvasHeight, 0.1, 1000);
camera.rotation.order = 'YXZ';
camera.position.set(0, 0, 30);
window.fov = fov;

const listener = new Object3D();
listener.name = "listener";
camera.add(listener);

var hFOV = 2 * Math.atan(Math.tan(camera.fov * Math.PI / 180 / 2) * camera.aspect) * 180 / Math.PI; // degrees

//CAMERA THAT ONLY RENDERS THE MAIN PORTAL GUN ON TOP OF THE SCENE
const portalGunCamera = camera.clone();
portalGunCamera.layers.mask = 2;
portalGunCamera.near = 0.00001;
portalGunCamera.updateProjectionMatrix();

//POINT OF OBJECTS WHILE HOLDING WITH THE GUN
const cubeHolder = new Object3D()
cubeHolder.position.z = -1.25;
cubeHolder.name = "cubeHolder";
window.cubeHolder = cubeHolder;
camera.add(cubeHolder);

//RENDERER
const renderer = new WebGLRenderer({
    alpha: true,
    powerPreference: "high-performance",
    antialias: antialias
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.canvasWidth, window.canvasHeight);
renderer.outputColorSpace = SRGBColorSpace;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = shadowMap;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.shadowMap.needsUpdate = true;
renderer.localClippingEnabled = true;
renderer.physicallyCorrectLights = true;
renderer.domElement.id = "viewer-3d";
renderer.shadowMap.autoUpdate = true;
renderer.domElement.id = "viewer-3d";
//renderer.info.autoReset = false;

//CONTROLS
const controls = new OrbitControls(camera, renderer.domElement);
controls.minDistance = 0;

function getItemValues() {
    return {
        cube: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: false,
            ceiling: true,
            trigger: false
        },
        cube_2: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: false,
            ceiling: true,
            trigger: false
        },
        scale_cube: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: false,
            ceiling: true,
            trigger: false
        },
        door: {
            count: 0,
            max: 5
        },
        sphere: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: false,
            ceiling: true,
            trigger: false
        },
        gel_gun_blue: {
            count: 0,
            max: 10
        },
        gel_gun_orange: {
            count: 0,
            max: 10
        },
        gel_gun_white: {
            count: 0,
            max: 10
        },
        pedestal_button: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: true
        },
        radio: {
            count: 0,
            max: 1,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        button_weight: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        button_box: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: true
        },
        button_sphere: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: true
        },
        dispenser: {
            count: 0,
            max: 100,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: false,
            ceiling: true,
            trigger: false
        },
        ramp: {
            count: 0,
            max: 10
        },
        ramp_half: {
            count: 0,
            max: 10
        },
        ramp_half2: {
            count: 0,
            max: 10
        },
        stairs: {
            count: 0,
            max: 10
        },
        light_bridge: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        tractor_beam: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        laser_emitter: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        laser_receiver: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        laser_relay: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        pellet_launcher: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        pellet_catcher: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        laser_cube: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: false,
            ceiling: true,
            trigger: false
        },
        faith_plate: {
            count: 0,
            max: 10,
            instanced: false,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        door: {
            count: 0,
            max: 5
        },
        light: {
            count: 0,
            max: 20,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false

        },
        lightEmissive: {
            count: 0,
            max: 10,
            instanced: false,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        stripe: {
            count: 0,
            max: 10
        },
        gel_blue: {
            count: 0,
            max: 10
        },
        gel_recharger: {
            count: 0,
            max: 10
        },
        gel_reflection: {
            count: 0,
            max: 10
        },
        gel_clear: {
            count: 0,
            max: 10
        },
        gel_white: {
            count: 0,
            max: 10
        },
        angled_panel: {
            count: 0,
            max: 10,
            instanced: false,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        gel_orange: {
            count: 0,
            max: 10
        },
        gel_purple: {
            count: 0,
            max: 10
        },
        camera: {
            count: 0,
            max: 5,
            instanced: false,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: false,
            ceiling: false,
            trigger: false
        },
        bed: {
            count: 0,
            max: 5,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        incinerator: {
            count: 0,
            max: 5,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: true
        },
        trash: {
            count: 0,
            max: 5,
            instanced: true,
            interactive: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        toilet: {
            count: 0,
            max: 5,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        desk: {
            count: 0,
            max: 20,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.8,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        step: {
            count: 0,
            max: 20,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.8,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        cabinet: {
            count: 0,
            max: 5,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        sign: {
            count: 0,
            max: 5,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        portal_0: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        portal_1: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        laser_field: {
            count: 0,
            max: 20,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        fizzler: {
            count: 0,
            max: 20,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: true,
            trigger: false
        },
        observation_room: {
            count: 0,
            max: 10
        },
        glass: {
            count: 0,
            max: 20
        },
        portal_gun: {
            count: 0,
            max: 1,
            instanced: false,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            ground: true,
            ceiling: false,
            trigger: false
        },
        paint_gun: {
            count: 0,
            max: 1
        },
        trigger_area: {
            count: 0,
            max: 10
        },
        trigger_voice: {
            count: 0,
            max: 10
        },
        trigger_audio: {
            count: 0,
            max: 10
        },
        trigger_save: {
            count: 0,
            max: 10
        },
        portal: {
            count: 0,
            max: 10
        },
        spawn: {
            count: 0,
            max: 1
        },
        piston_platforms: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: false,
            trigger: true
        },
        track_platforms: {
            count: 0,
            max: 10,
            instanced: true,
            interactive: false,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: true,
            ground: true,
            ceiling: false,
            trigger: true
        },
        turrets: {
            count: 0,
            max: 10,
            instanced: true,
            false: true,
            roughness: 0.2,
            envIntensity: 0.5,
            wall: false,
            true: false,
            ceiling: true,
            trigger: false,
            interactive: true
        },
    }
}

var GLOBALS = {

    LASERS: new Group(),
    STATS_UI: {
        time: 0,
        portals: 0,
        steps: 0
    },

    BOUNDING_BOX: [],
    PLATFORM_BODIES: [],

    FINISHED: false,
    PIXEL_RATIO: pixelRatio,
    DEBUGGER_GROUP: new Group(),

    SCENE: new Scene(),
    SCENE_CHILDREN: new Group(),
    MAIN_CAMERA: camera,
    MAIN_CAMERA_GROUP: new Group(),
    PIVOT: null,
    PORTAL_GUN_CAMERA: portalGunCamera,
    CONTROLS: controls,
    POINTER_CONTROLS: null,
    RENDERER: renderer,
    COMPOSER: null,
    COMPOSER2: null,
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
    ITEMS_ADDED: new Group(),
    ROOM: new Group(),
    ITEMS: new Group(),
    CUBES: new Group(),

    //LEVEL EDITOR
    PLANE_USER_DATA: [],
    PLANE_LEVEL_INSTANCED: null,
    BUDGET: 5000,

    //PORTALS
    CHAMBER_CONFIG: { version: 1, mode: 'single', portalMode: 'shared' },
    MULTIPLAYER: null,
    PORTALS: [null, null, null, null],
    PORTAL_RECURSION_LEVELS: portalsRecursive,
    PORTAL_TARGETS: Array.from({ length: 4 }, () => new WebGLRenderTarget(window.canvasWidth, window.canvasHeight)),
    PORTAL_TMP_TARGETS: Array.from({ length: 4 }, () => new WebGLRenderTarget(window.canvasWidth, window.canvasHeight)),
    PORTAL_WIDTH: 0.9,
    PORTAL_DEPTH: 1.8,
    PORTAL_EPS: 0.01,
    PORTAL_COLORS: [0x00e1ff, 0xffc600, 0xa555ff, 0x50ff83],
    PORTAL_CDBB_HEIGHT: 3,
    PORTAL_HEIGHT: 0.2,
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
    CGROUP_ENVIRONMENT: 1,
    CGROUP_PORTAL_HOST_CDISABLE: [1 << 3, 1 << 4, 1 << 5, 1 << 6],
    CGROUP_DYNAMIC: 2,
    CGROUP_PLAYER: 4,
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
    MIXERS_CLONE: null,
    BOX_BODY: [],
    SPHERE_BODY: [],
    TRIGGER: {
        button_weight: [],
        button_box: [],
        button_sphere: [],
        pedestal_button: [],
    },

    //ITEMS
    DYMANIC_ITEMS: {
        cube: [],
        cube_2: [],
        scale_cube: [],
        sphere: [],
        gel_gun_blue: [],
        gel_gun_orange: [],
        gel_gun_white: [],
        pedestal_button: [],
        radio: [],
        button_weight: [],
        button_box: [],
        button_sphere: [],
        dispenser: [],
        ramp: [],
        ramp_half: [],
        ramp_half2: [],
        stairs: [],
        light_bridge: [],
        tractor_beam: [],
        laser_emitter: [],
        laser_receiver: [],
        laser_relay: [],
        laser_cube: [],
        faith_plate: [],
        door: [],
        light: [],
        lightEmissive: [],
        stripe: [],
        gel_blue: [],
        gel_recharger: [],
        gel_reflection: [],
        gel_clear: [],
        gel_orange: [],
        gel_purple: [],
        gel_white: [],
        camera: [],
        portal_0: [],
        portal_1: [],
        laser_field: [],
        fizzler: [],
        glass: [],
        portal_gun: [],
        trigger_area: [],
        trigger_save: [],
        trigger_voice: [],
        trigger_audio: [],
        pellet_launcher: [],
        pellet_catcher: [],
        angled_panel: [],
        paint_gun: [],
        spawn: [],
        bed: [],
        trash: [],
        toilet: [],
        desk: [],
        cabinet: [],
        sign: [],
        piston_platforms: [],
        track_platforms: [],
        incinerator: [],
        step: [],
        turrets: []
    },

    TRIGGER_BOXES: [],

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
    GUN_CLONE2: null,
    GUN_MODE: "portal",

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
    LIGHT_BRIDGE_TRIGGER: "Middle Horizontal",
    LIGHT_TRIGGER: "Middle Horizontal",
    GLASS_TRIGGER: "Middle Vertical",
    LASER_FIELD_TRIGGER: "Middle Vertical",
    FIZZLER_TRIGGER: "Middle Vertical",

    LASER_FIELD_RAYCASTER: [],
    FIZZLER_RAYCASTER: [],
    GLASS_RAYCASTER: [],

    LIGHT_GROUP: null,
    INTERVAL: 1 / 60,
    CURRENT_INSTANCED: null,

    CAMERA_OBJ_HORIZONTAL: [],
    CAMERA_OBJ_VERTICAL: [],

    MATERIAL_PORTAL_EDITOR: null,
    MATERIAL_NON_PORTAL_EDITOR: null,

    OBSERVATION_ROOM: null,
    OBSERVATION_ROOM_IMG: null,

    OBSERVATION_ROOM_HALF: null,

    IMG_CHECK: null,
    IMG_CLOSE: null,

    SMOOTHNESS: 0.1,

    GOO_PLANES: [],
    GOO_BOXES: [],

    FAITH_PLATE_TO_ROTATE: [],
    FAITH_PLATE_CONTACT_BOX: [],

    UNIFORMS_GEL: null,
    UNIFORMS_LIGHT_BRIDGE: null,
    UNIFORMS_TRACTOR_BEAM: null,
    UNIFORMS_TRACTOR_BEAM_ORANGE: null,
    UNIFORMS_PORTAL_GUN_ENERGY: null,
    UNIFORMS_FIZZLER: null,
    UNIFORMS_DISSOLVER: null,
    MATERIAL_DISSOLVER: null,

    LIGHTNIN_STRIKE_1: null,
    LIGHTNIN_STRIKE_2: null,
    LIGHTNIN_STRIKE_3: null,

    TARGET_ROTATION_X: 0,
    TARGET_ROTATION_Y: 0,

    SPOTLIGHT: null,

    DOORS: [],

    MATERIAL_FLOOR_PORTAL: null,
    MATERIAL_FLOOR_NON_PORTAL: null,
    MATERIAL_WALL_PORTAL: null,
    MATERIAL_WALL_PORTAL2: null,
    MATERIAL_WALL_PORTAL3: null,
    MATERIAL_WALL_PORTAL4: null,
    MATERIAL_WALL_NON_PORTAL: null,
    MATERIAL_WALL_NON_PORTAL2: null,
    MATERIAL_WALL_NON_PORTAL3: null,
    MATERIAL_GUN: null,
    MATERIAL_MAIN_MENU: null,
    MATERIAL_SUB_MENU: null,
    TEXTURE_MENU_GRID: null,

    MATERIAL_TRACTOR_BEAM: null,
    MATERIAL_TRACTOR_BEAM_REVERSE: null,
    MATERIAL_LIGHT_BRIDGERS: null,
    MATERIAL_LASER_FIELD: null,
    MATERIAL_FIZZLER: null,
    UNIFORMS_LASER_FIELD: null,

    ELEVATOR: null,
    ELEVATOR_DOOR_LEFT: null,
    ELEVATOR_DOOR_RIGHT: null,
    ELEVATOR_TRIGGER: null,

    WALL_CORRIDOR_ENTER: null,
    BODY_ELEVATOR: null,
    WALL_CORRIDOR_BACK: null,
    CORRIDOR_COLLIDERS: [],

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
    CAMERAS: [],

    ITEMS_COUNT: getItemValues(),

    SCENE_FPS: null,
    LISTENER: new AudioListener(),
    CANNON_BODIES: [],
    CANNON_BODIES_CONTINUOUS: [],
    LEVEL_ENTERED: false,
    DOOR_OPEN_STATE: false,
    AMBIENT_AUDIO: null,
    PORTAL_AUDIO: [],
    DRAGGING: false,
    DRAGGED_ITEM_ELEMENT: null,
    CURRENT_LINE: null,

    CONNECTIONS: [],

    POSITIONAL_AUDIO_GROUP: null,
    PORTAL_AUDIO: [new Object3D, new Object3D],

    SELECTED_FOR_BLOOM: null,
    PLAYER_MOVING: false,
    GLASS_PANELS: [],
    RESIZING_GLASS_PANEL: false,
    BLOCK_PORTAL: [],

    MATERIAL_GLASS: null,
    MATERIAL_GRID: null,
    GRID_STATE: false,
    LOADED_CONNECTIONS: [],

    PORTAL_GUN_INITIATE: "all",
    PORTAL_GUN_INITIATE_HOLDER: null,
    TELEPORTING_TARGET_QUATERNION: null,
    PORTAL_GUN_BOX: [],
    WALL_BODIES: [],
    ACTIVATED: [],
    SOUNDS_FPS: [],
    MATERIAL_TRIGGER_ONCE: null,
    MATERIAL_TRIGGER_MULT: null,
    BATCHED_ORANGE: null,
    BATCHED_BLUE: null,
    BATCHED_GLASS: null,
    BATCHED_GRID: null,
    LASER_EMITTER_PORTAL_CLONES: [],
    DYNAMIC_BODIES: [],
    LASER_EMITTER_TRIGGER: "Bottom",
    LASER_RECEIVER_TRIGGER: "Bottom",
    LASER_TRIGGERS: [],
    MATERIAL_CONE: null,
    BLOCK_PLAYER_MOVE: false,
    FAITH_PLATE_TARGET: null,
    GROUP_LINE_TRAGECTORY: new Group(),
    GOO_REFLECTIONS: false,
    CUSTOM_GRAVITY: [],
    SPEED: 1,
    HEAD_BOB_SPEED: 6,
    ANGLED_PANELS: [],
    INSTANCED_WHITE_GEL: [],
    GEL_TRIGGER: [],
    PAINTING_GUN_MODE: [],
    PAINT_GUN: null,
    GUN_GROUP: new Group(),
    LINES: new Group()
}

GLOBALS.SCENE.add(GLOBALS.SCENE_CHILDREN)

function reset() {

    GLOBALS.STATS_UI = {
        time: 0,
        portals: 0,
        steps: 0
    };
    GLOBALS.BOUNDING_BOX = [];
    GLOBALS.PLATFORM_BODIES = [];
    GLOBALS.FINISHED = false;
    window.glass = [];
    GLOBALS.BOX_BODY = [];
    GLOBALS.ITEMS_COUNT = getItemValues();
    GLOBALS.TRIGGER_BOXES = [];
    //GLOBALS.INTERACTIVE = [];
    GLOBALS.SELECTED_ID = [];
    GLOBALS.SELECTED_ID_ORANGE = [];
    GLOBALS.SELECTED_COLOR = [];
    GLOBALS.LASER_EMITTER = [];
    GLOBALS.LASER_EMITTER_OBJ = [];
    GLOBALS.LASER_EMITTER_LENGTH = 0;
    GLOBALS.LASER_EMITTER_BOUNDING_BOX = [];
    GLOBALS.LASER_EMITTER_RAYCASTER = [];
    GLOBALS.LASER_CUBE = null;
    GLOBALS.TRACTOR_BEAM = [];
    GLOBALS.TRACTOR_BEAM_BOUNDING_BOX = [];
    GLOBALS.TRACTOR_BEAM_RAYCASTER = [];
    GLOBALS.TRACTOR_BEAM_LENGTH = 0;
    GLOBALS.LIGHT_BRIDGE_RAYCASTER = [];
    GLOBALS.LIGHT_BRIDGE_CLONE = [];
    GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE = [];
    GLOBALS.LASER_FIELD_RAYCASTER = [];
    GLOBALS.FIZZLER_RAYCASTER = [];
    GLOBALS.GLASS_RAYCASTER = [];
    GLOBALS.CAMERA_OBJ_HORIZONTAL = [];
    GLOBALS.CAMERA_OBJ_VERTICAL = [];
    GLOBALS.GOO_PLANES = [];
    GLOBALS.GOO_BOXES = [];
    GLOBALS.FAITH_PLATE_TO_ROTATE = [];
    GLOBALS.FAITH_PLATE_CONTACT_BOX = [];
    GLOBALS.DOORS = [];
    GLOBALS.RADIO_MUSIC = [];
    GLOBALS.CAMERAS = [];
    GLOBALS.CANNON_BODIES = [];
    GLOBALS.CANNON_BODIES_CONTINUOUS = [];
    GLOBALS.CONNECTIONS = [];
    GLOBALS.GLASS_PANELS = [];
    GLOBALS.BLOCK_PORTAL = [];
    GLOBALS.LOADED_CONNECTIONS = [];
    GLOBALS.PORTAL_GUN_BOX = [];
    GLOBALS.WALL_BODIES = [];
    GLOBALS.ACTIVATED = [];
    GLOBALS.SOUNDS_FPS = [];
    GLOBALS.LASER_EMITTER_PORTAL_CLONES = [];
    GLOBALS.DYNAMIC_BODIES = [];
    GLOBALS.LASER_TRIGGERS = [];
    GLOBALS.CUSTOM_GRAVITY = [];
    GLOBALS.ANGLED_PANELS = [];
    GLOBALS.PAINTING_GUN_MODE = [];
}

export {
    GLOBALS,
    reset
}