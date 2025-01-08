import { PositionalAudio, AudioListener } from 'three';
import { GLOBALS } from '../../Globals.js';

window.listernAdded = false;
var listener;

function playVoice(data) {

    if (!data.link || data.played)
        return;

    if (window.previousAudio) {
        window.previousAudio.currentTime = 0;
        window.previousAudio.pause();
    }

    data.played = true;
    data.voice.currentTime = 0;
    data.voice.play();
    window.previousAudio = data.voice;

    //data.played = true;
    //playAudioSequentially(data.voice)
}

const activeAudios = [];

// Play audio and wait for it to finish
async function playAudioSequentially(audio) {
    // Wait for currently active audios to finish
    if (activeAudios.length > 0) {
        await Promise.all(activeAudios.map((audio) => new Promise((resolve) => {
            audio.addEventListener('ended', resolve, { once: true });
        })));
    }

    // Play the new audio
    activeAudios.push(audio);
    audio.currentTime = 0;
    audio.play();

    // Remove audio from active list when finished
    audio.addEventListener('ended', () => {
        const index = activeAudios.indexOf(audio);
        if (index > -1) activeAudios.splice(index, 1);
    });
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

    if (!window.listernAdded) {
        window.listernAdded = true;
        // create an AudioListener and add it to the camera
        listener = new AudioListener();
        listener.name = "listener";
        GLOBALS.MAIN_CAMERA.add(listener);
    }

    listener.context.resume();

    // create the PositionalAudio object (passing in the listener)
    const sound = new PositionalAudio(listener);

    var audioClone = document.getElementById(path).cloneNode(true);
    audioClone.id = "";
    sound.setMediaElementSource(audioClone);
    sound.setRefDistance(1);
    sound.setMaxDistance(maxDis);
    sound.setDistanceModel("linear");
    sound.setVolume(0.5); // Keep volume between 0.0 and 1.0
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
            addPositionalAudio(name, obj[i], true, true, true, 2);

            if (name == 'audio-fizzler' || name == 'audio-laser-beam')
                addPositionalAudio(name, obj[i].cloneLaserField, true, true, true, 2);
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