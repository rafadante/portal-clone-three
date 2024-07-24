import * as THREE from 'three';
import {
    GLOBALS
} from '../../Globals.js';

var listernAdded = false;
var listener;

function preLoadAudios() {
    const audio = new Audio("freejazz.wav");
}

function play(elem) {
    var isPlaying = elem.currentTime > 0 && !elem.paused && !elem.ended
        && elem.readyState > elem.HAVE_CURRENT_DATA;

    if (!isPlaying) {
        //elem.play();

        // Show loading animation.
        var playPromise = elem.play();

        if (playPromise !== undefined) {
            playPromise.then(_ => {
                // Automatic playback started!
                // Show playing UI.
            })
                .catch(error => {
                    // Auto-play was prevented
                    // Show paused UI.
                });
        }
    }
}

function addRadioAudio(path, parent, play, loop, staticPosition, maxDis) {

    if (!listernAdded) {
        listernAdded = true;
        // create an AudioListener and add it to the camera
        listener = new THREE.AudioListener();
        GLOBALS.GUN.add(listener);
    }

    // create the PositionalAudio object (passing in the listener)
    const sound = new THREE.PositionalAudio(listener);

    var audioClone = document.getElementById(path).cloneNode(true);
    audioClone.id = "";
    sound.setMediaElementSource(audioClone);
    sound.setRefDistance(1);
    sound.setMaxDistance(maxDis);
    sound.setDistanceModel("linear");
    sound.audio = audioClone;
    sound.audio.loop = loop;

    if (play) {
        const elem = sound.audio;

        var isPlaying = elem.currentTime > 0 && !elem.paused && !elem.ended
            && elem.readyState > elem.HAVE_CURRENT_DATA;

        if (!isPlaying) {
            elem.play();
        }
    }

    // finally add the sound to the mesh
    parent.sound = sound;
    GLOBALS.SCENE_FPS.add(sound);

    if (staticPosition) {
        sound.position.copy(parent.position);
    }
}

const ambient = new Audio('audio/ambient.mp3')
ambient.volume = 0.15;
ambient.loop = true;

const walk = new Audio('audio/tile1.wav')
walk.volume = 0.5;
walk.loop = true;
walk.pause();

const walkLightBridde = new Audio('audio/fs_fm_lightbridge_01.wav')
walkLightBridde.volume = 0.5;
walkLightBridde.loop = true;
walkLightBridde.playbackRate = 1.5;
walkLightBridde.pause();

const jump = new Audio('audio/p2_fs_jump_land_tile_01.wav')
walk.volume = 0.15;

const playerInsideTractorBeam = new Audio('audio/player_enter_tbeam_lp_01.wav')
playerInsideTractorBeam.volume = 0.5;
playerInsideTractorBeam.loop = true;

const deathAudio = new Audio('audio/body_medium_impact_hard1.wav')
deathAudio.volume = 0.5;

const editor = new Audio('audio/editor.mp3')
editor.loop = true;

const portal_gun_loop = new Audio('audio/wpn_portal_ambient_lp_01.wav')
portal_gun_loop.loop = true;
portal_gun_loop.volume = 0.2;

const falling = new Audio('audio/player_fall_whoosh_lp_01.wav')
falling.loop = true;

const hold = new Audio('audio/hold_loop.wav')
hold.loop = true;

function volume(val) {
    //ambient.volume = val;
    //editor.volume = val;
    //door_move.volume = val;

    //if (sound)
    //    sound.volume = val;
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
    PLAYER_INSIDE_TRACTOR_BEAM: playerInsideTractorBeam,
    DEATH: deathAudio,
    WALK: walk,
    JUMP: jump,
    WALK_LIGHT_BRIDGE: walkLightBridde
}

export {
    addRadioAudio,
    AUDIO,
    volume,
    play
}