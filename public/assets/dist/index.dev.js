"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ASSETS = void 0;

var _tileNonPortal = _interopRequireDefault(require("./models/tileNonPortal.jpg"));

var _tilePortal = _interopRequireDefault(require("./models/tilePortal.jpg"));

var _vig = _interopRequireDefault(require("./images/vig5.jpg"));

var _crosshairNone = _interopRequireDefault(require("./textures/crosshairNone.png"));

var _photo_studio_01_1k = _interopRequireDefault(require("./hdr/photo_studio_01_1k.hdr"));

var _cube = _interopRequireDefault(require("./models/cubes/cube.glb"));

var _cubeInverted = _interopRequireDefault(require("./models/cubes/cubeInverted.glb"));

var _hd_portal_gun = _interopRequireDefault(require("./models/hd_portal_gun3.glb"));

var _open = _interopRequireDefault(require("./doors/open.glb"));

var _corridor = _interopRequireDefault(require("./3ds/corridor.glb"));

var _window = _interopRequireDefault(require("./models/cubes/window.glb"));

var _WINDOW_IMG = _interopRequireDefault(require("./models/cubes/WINDOW_IMG.glb"));

var _enter = _interopRequireDefault(require("./enter.jpg"));

var _sky = _interopRequireDefault(require("./images/sky.jpg"));

var _sparklenoise = _interopRequireDefault(require("./textures/portal/sparklenoise.png"));

var _noise = _interopRequireDefault(require("./textures/portal/noise9.png"));

var _waterturbulence = _interopRequireDefault(require("./textures/portal/waterturbulence.png"));

var _rgbnoise = _interopRequireDefault(require("./textures/portal/rgbnoise2.png"));

var _base = _interopRequireDefault(require("./textures/ceiling1/base.jpg"));

var _ao = _interopRequireDefault(require("./textures/ceiling1/ao.jpg"));

var _alpha = _interopRequireDefault(require("./textures/ceiling1/alpha.jpg"));

var _normal = _interopRequireDefault(require("./textures/ceiling1/normal.jpg"));

var _roughness = _interopRequireDefault(require("./textures/ceiling1/roughness.jpg"));

var _base2 = _interopRequireDefault(require("./textures/floor2/base.jpg"));

var _ao2 = _interopRequireDefault(require("./textures/floor2/ao.jpg"));

var _normal2 = _interopRequireDefault(require("./textures/floor2/normal.jpg"));

var _roughness2 = _interopRequireDefault(require("./textures/floor2/roughness.jpg"));

var _base3 = _interopRequireDefault(require("./textures/floor2/base2.jpg"));

var _base4 = _interopRequireDefault(require("./textures/wall4/base.jpg"));

var _base5 = _interopRequireDefault(require("./textures/wall4/base3.jpg"));

var _normal3 = _interopRequireDefault(require("./textures/wall4/normal.jpg"));

var _ao3 = _interopRequireDefault(require("./textures/wall4/ao.jpg"));

var _roughness3 = _interopRequireDefault(require("./textures/wall4/roughness.jpg"));

var _base6 = _interopRequireDefault(require("./textures/wall6/base.jpg"));

var _ao4 = _interopRequireDefault(require("./textures/wall6/ao.jpg"));

var _normal4 = _interopRequireDefault(require("./textures/wall6/normal.jpg"));

var _metal = _interopRequireDefault(require("./textures/wall6/metal.jpg"));

var _roughness4 = _interopRequireDefault(require("./textures/wall6/roughness.jpg"));

var _crosshairBlue = _interopRequireDefault(require("./textures/crosshairBlue.png"));

var _crosshairOrange = _interopRequireDefault(require("./textures/crosshairOrange.png"));

var _crosshairBoth = _interopRequireDefault(require("./textures/crosshairBoth.png"));

var _ = _interopRequireDefault(require("./loading/1.png"));

var _2 = _interopRequireDefault(require("./loading/2.png"));

var _3 = _interopRequireDefault(require("./loading/3.png"));

var _normal5 = _interopRequireDefault(require("./textures/wall/2/normal.jpg"));

var _ao5 = _interopRequireDefault(require("./textures/wall/2/ao.jpg"));

var _roughness5 = _interopRequireDefault(require("./textures/wall/2/roughness.jpg"));

var _WINDOW_HALF_IMG = _interopRequireDefault(require("./models/cubes/WINDOW_HALF_IMG.glb"));

var _window_half = _interopRequireDefault(require("./models/cubes/window_half.glb"));

var _portal_cube = _interopRequireDefault(require("./models/portal_cube.glb"));

var _portal_sphere = _interopRequireDefault(require("./models/portal_sphere.glb"));

var _cube_dispenser = _interopRequireDefault(require("./models/cube_dispenser.glb"));

var _pedestal_button = _interopRequireDefault(require("./3ds/pedestal_button.glb"));

var _button_sphere = _interopRequireDefault(require("./3ds/button_sphere.glb"));

var _button_cube = _interopRequireDefault(require("./3ds/button_cube.glb"));

var _button_weight = _interopRequireDefault(require("./3ds/button_weight.glb"));

var _camera = _interopRequireDefault(require("./3ds/camera.glb"));

var _radio = _interopRequireDefault(require("./3ds/radio.glb"));

var _radio2 = _interopRequireDefault(require("./audio/fps/radio.mp3"));

var _scene = _interopRequireDefault(require("./3ds/scene.glb"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

//ITEMS
var ASSETS = {
  SCENE: _scene["default"],
  RADIO_MUSIC: _radio2["default"],
  RADIO: _radio["default"],
  CAMERA: _camera["default"],
  BUTTON_WEIGHT: _button_weight["default"],
  BUTTON_CUBE: _button_cube["default"],
  BUTTON_SPHERE: _button_sphere["default"],
  DISPENSER: _cube_dispenser["default"],
  PEDESTAL_BUTTON: _pedestal_button["default"],
  WINDOW_HALF: _window_half["default"],
  PORTAL_SPHERE: _portal_sphere["default"],
  CROSS_HAIR_BLUE: _crosshairBlue["default"],
  CROSS_HAIR_ORANGE: _crosshairOrange["default"],
  CROSS_HAIR_BOTH: _crosshairBoth["default"],
  CROSS_HAIR_NONE: _crosshairNone["default"],
  TILE_NON_PORTAL_EDITOR: _tileNonPortal["default"],
  TILE_PORTAL_EDITOR: _tilePortal["default"],
  BACKGOUND_CONTAINER: _vig["default"],
  RETICLE: _crosshairNone["default"],
  HDR: _photo_studio_01_1k["default"],
  CUBE: _cube["default"],
  CUBE_INVERTED: _cubeInverted["default"],
  GUN: _hd_portal_gun["default"],
  DOOR: _open["default"],
  CORRIDOR: _corridor["default"],
  ENTER_JPG: _enter["default"],
  SKY: _sky["default"],
  PORTAL_SHADER_SPARK: _sparklenoise["default"],
  PORTAL_SHADER_NOISE: _noise["default"],
  PORTAL_SHADER_WATER: _waterturbulence["default"],
  PORTAL_SHADER_RGB: _rgbnoise["default"],
  CEILING_BASE: _base["default"],
  CEILING_AO: _ao["default"],
  CEILING_ALPHA: _alpha["default"],
  CEILING_NORMAL: _normal["default"],
  CEILING_ROUGHNESS: _roughness["default"],
  FLOOR_NON_PORTAL_BASE: _base2["default"],
  FLOOR_NON_PORTAL_AO: _ao2["default"],
  FLOOR_NON_PORTAL_NORMAL: _normal2["default"],
  FLOOR_NON_PORTAL_ROUGHNESS: _roughness2["default"],
  FLOOR_PORTAL_BASE: _base3["default"],
  WALL_PORTAL_BASE: _base4["default"],
  WALL_PORTAL_NORMAL: _normal3["default"],
  WALL_PORTAL_AO: _ao3["default"],
  WALL_NON_PORTAL_BASE: _base6["default"],
  WALL_NON_PORTAL_AO: _ao4["default"],
  WALL_NON_PORTAL_NORMAL: _normal4["default"],
  WALL_NON_PORTAL_METAL: _metal["default"],
  WALL_NON_PORTAL_ROUGH: _roughness4["default"],
  LOADING1: _["default"],
  LOADING2: _2["default"],
  LOADING3: _3["default"],
  WALL_PORTAL_ROUGH: _roughness3["default"],
  WALL_PORTAL_BASE2: _base5["default"],
  WINDOW: _window["default"],
  WINDOW_IMG: _WINDOW_IMG["default"],
  wall_normal: _normal5["default"],
  wall_ao: _ao5["default"],
  wall_roughness: _roughness5["default"],
  PORTAL_CUBE: _portal_cube["default"],
  WINDOW_HALF_IMG: _WINDOW_HALF_IMG["default"]
};
exports.ASSETS = ASSETS;