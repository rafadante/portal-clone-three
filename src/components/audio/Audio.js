import { PositionalAudio, AudioListener } from 'three';
import {
    GLOBALS
} from '../../Globals.js';

var listernAdded = false;
var listener;

function play(elem) {
    //return
    var isPlaying = elem.currentTime > 0 && !elem.paused && !elem.ended
        && elem.readyState > elem.HAVE_CURRENT_DATA;

    if (!isPlaying) {//
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

function addPositionalAudio(path, parent, play, loop, staticPosition, maxDis, volume) {

    if (!listernAdded) {
        listernAdded = true;
        // create an AudioListener and add it to the camera
        listener = new AudioListener();
        GLOBALS.GUN.add(listener);
    }

    // create the PositionalAudio object (passing in the listener)
    const sound = new PositionalAudio(listener);

    var audioClone = document.getElementById(path).cloneNode(true);
    audioClone.id = "";
    sound.setMediaElementSource(audioClone);
    sound.setRefDistance(1);
    sound.setMaxDistance(maxDis);
    sound.setDistanceModel("linear");
    sound.volume = 0.5;
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

    if (staticPosition)
        sound.position.copy(parent.position);

    GLOBALS.SOUNDS_FPS.push(sound);
}

function addAudio(obj, name) {
    for (var i = 0; i < obj.length; i++) {
        if (obj[i].length != 0) {
            addPositionalAudio(name, obj[i], true, true, true, 4);

            if (name == 'audio-fizzler' || name == 'audio-laser-beam')
                addPositionalAudio(name, obj[i].cloneLaserField, true, true, true, 4);
        }
    }
}

const ambient = new Audio('audio/ambient.mp3')
ambient.volume = 0.15;
ambient.loop = true;

const walk = new Audio('audio/tile1.wav')
walk.volume = 0;//0.25
walk.loop = true;
walk.pause();

const walkGel = new Audio('audio/walkGel.wav')
walkGel.volume = 0.25;
walkGel.loop = true;
walkGel.pause();

const walkLightBridde = new Audio('audio/fs_fm_lightbridge_01.wav')
walkLightBridde.volume = 0.5;
walkLightBridde.loop = true;
walkLightBridde.playbackRate = 1.5;
walkLightBridde.pause();

const jump = new Audio('audio/p2_fs_jump_land_tile_01.wav')
jump.volume = 0;//0.3

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

const aerial = document.getElementById("faith_plate_loop");
aerial.volume = 1;
aerial.loop = false;

const propulsion = new Audio('audio/propulsion.mp3');
propulsion.volume = 1;
propulsion.loop = true;

function volume(val) {
}

function fadeAudio(audio) {

    const a = audio;

    if (audio.volume > 0.1) {
        audio.volume -= 0.1;
        audio.timeout = setTimeout(() => {
            fadeAudio(a)
        }, 100);
    } else {
        audio.pause();
        audio.volume = 1;
    }
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
    WALK_LIGHT_BRIDGE: walkLightBridde,
    AERIAL: aerial,
    WALK_NORMAL: walk,
    WALK_PAINT: walkGel,
    PROPULSION: propulsion
}

export {
    addPositionalAudio,
    AUDIO,
    volume,
    play,
    addAudio,
    fadeAudio
}