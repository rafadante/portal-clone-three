import * as THREE from 'three';
import {
    GLOBALS
} from '../../Globals.js';

var sound;
var listernAdded = false;
var listener;

function addRadioAudio(path, parent, play) {

    if (!listernAdded) {
        listernAdded = true;
        // create an AudioListener and add it to the camera
        listener = new THREE.AudioListener();
        GLOBALS.GUN.add(listener);
    }

    // create the PositionalAudio object (passing in the listener)
    sound = new THREE.PositionalAudio(listener);

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load(path, function (buffer) {
        sound.setBuffer(buffer);
        sound.setRefDistance(1);
        sound.setMaxDistance(8);
        //sound.setRolloffFactor( 20 );
        sound.setDistanceModel("linear");
        sound.play();
        sound.loop = true;
        sound.source.loop = true;


    });

    // finally add the sound to the mesh
    parent.push(sound)
    GLOBALS.SCENE_FPS.add(sound)
}

const ambient = new Audio('audio/ambient.mp3')
ambient.loop = true;

const editor = new Audio('audio/editor.mp3')
editor.loop = true;

const portal_gun_loop = new Audio('audio/wpn_portal_ambient_lp_01.wav')
portal_gun_loop.loop = true;
portal_gun_loop.volume = 0.2;

const falling = new Audio('audio/player_fall_whoosh_lp_01.wav')
falling.loop = true;

const hold = new Audio('audio/hold_loop.wav')
hold.loop = true;

const door_move = new Audio('audio/doormove2.wav');

function volume(val) {
    ambient.volume = val;
    editor.volume = val;
    door_move.volume = val;

    if (sound)
        sound.volume = val;
}

var AUDIO = {
    AMBIENT: ambient,
    EDITOR: editor,
    PORTAL_GUN_BLUE: new Audio('audio/portalgun_shoot_blue1.wav'),
    PORTAL_GUN_ORANGE: new Audio('audio/portalgun_shoot_red1.wav'),
    PORTAL_ENTER: new Audio('audio/portal_enter2.wav'),
    PORTAL_EXIT: new Audio('audio/portal_exit2.wav'),
    PORTAL_GUN_LOOP: portal_gun_loop,
    PORTAL_INVALID: new Audio('audio/portal_invalid_surface_03.wav'),
    FALLING: falling,
    PICK_FAIL: new Audio('audio/object_use_failure_01.wav'),
    PICK_SUCESS: new Audio('audio/object_use_01.wav'),
    HOLD: hold,
    DOOR_MOVE: door_move,
}

export {
    addRadioAudio,
    AUDIO,
    volume
}