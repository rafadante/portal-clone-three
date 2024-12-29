import { PositionalAudio, AudioListener } from 'three';
import { GLOBALS } from '../../Globals.js';

var listernAdded = false;
var listener;

function playVoice(data) {

    if (!data.link)
        return;

    data.voice.play();
}

function play(elem) {

    var isPlaying = elem.currentTime > 0 && !elem.paused && !elem.ended
        && elem.readyState > elem.HAVE_CURRENT_DATA;

    if (!isPlaying) {//
        // Show loading animation.

        elem.volume = elem.getAttribute("volume");
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

function addPositionalAudio(path, parent, play, loop, staticPosition, maxDis, nameSound) {

    if (!listernAdded) {
        listernAdded = true;
        // create an AudioListener and add it to the camera
        listener = new AudioListener();
        GLOBALS.GUN.add(listener);

        listener.context.resume();
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
    parent[nameSound] = sound;
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
    AMBIENT: document.getElementById("AUDIO-AMBIENT"),
    EDITOR: document.getElementById("AUDIO-EDITOR"),
    PORTAL_GUN_BLUE: document.getElementById("AUDIO-PORTAL_GUN_BLUE"),
    PORTAL_GUN_ORANGE: document.getElementById("AUDIO-PORTAL_GUN_ORANGE"),
    PORTAL_ENTER: document.getElementById("AUDIO-PORTAL_ENTER"),
    PORTAL_EXIT: document.getElementById("AUDIO-PORTAL_EXIT"),
    PORTAL_GUN_LOOP: document.getElementById("AUDIO-PORTAL_GUN_LOOP"),
    PORTAL_INVALID: document.getElementById("AUDIO-PORTAL_INVALID"),
    FALLING: document.getElementById("AUDIO-FALLING"),
    PICK_FAIL: document.getElementById("AUDIO-PICK_FAIL"),
    PICK_SUCESS: document.getElementById("AUDIO-PICK_SUCESS"),
    HOLD: document.getElementById("AUDIO-HOLD"),
    PLAYER_INSIDE_TRACTOR_BEAM: document.getElementById("AUDIO-PLAYER_INSIDE_TRACTOR_BEAM"),
    DEATH: document.getElementById("AUDIO-DEATH"),
    WALK: document.getElementById("AUDIO-WALK"),
    JUMP: document.getElementById("AUDIO-JUMP"),
    AERIAL: document.getElementById("AUDIO-AERIAL"),
    POSITIVE: document.getElementById("AUDIO-POSITIVE"),
    PROPULSION: document.getElementById("AUDIO-PROPULSION"),
}

AUDIO.AMBIENT.value = 1;

export {
    addPositionalAudio,
    AUDIO,
    volume,
    play,
    addAudio,
    fadeAudio,
    playVoice
}