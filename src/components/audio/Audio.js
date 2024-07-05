import * as THREE from 'three';
import {
    GLOBALS
} from '../../Globals.js';

var sound;

function addRadioAudio() {
    // create an AudioListener and add it to the camera
    const listener = new THREE.AudioListener();
    GLOBALS.MAIN_CAMERA.add(listener);

    // create the PositionalAudio object (passing in the listener)
    sound = new THREE.PositionalAudio(listener);

    // load a sound and set it as the PositionalAudio object's buffer
    const audioLoader = new THREE.AudioLoader();
    audioLoader.load('audio/radio.mp3', function (buffer) {
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
    GLOBALS.RADIO_MUSIC.push(sound)
    GLOBALS.SCENE_FPS.add(sound)
}

const ambient = new Audio('audio/ambient.mp3')
ambient.loop = true;

const editor = new Audio('audio/editor.mp3')
editor.loop = true;

function volume(val) {
    ambient.volume = val;
    editor.volume = val;

    if (sound)
        sound.volume = val;
}

var AUDIO = {
    AMBIENT: ambient,
    EDITOR: editor,
}

export {
    addRadioAudio,
    AUDIO,
    volume
}