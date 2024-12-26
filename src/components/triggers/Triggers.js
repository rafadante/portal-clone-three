import {
    GLOBALS
} from '../../Globals.js';
import {
    AUDIO,
    play,
    playVoice
} from "../audio/Audio.js";
import $ from 'jquery';

function checkForTriggerContact() {

    for (var f = 0; f < GLOBALS.TRIGGER_BOXES.length; f++) {

        //GLOBALS.TRIGGER_BOXES[f].item.children[0].rotation.y += 0.001;

        if (GLOBALS.TRIGGER_BOXES[f].item.visible)
            GLOBALS.TRIGGER_BOXES[f].item.visible = GLOBALS.TRIGGER_BOXES[f].item.userData.triggerVisibility;

        //if item or player touches the trigger
        if (GLOBALS.TRIGGER_BOXES[f].box3.containsPoint(GLOBALS.PLAYER.position)) {//TRIGER START

            if (GLOBALS.TRIGGER_BOXES[f].item.userData.active || (GLOBALS.TRIGGER_BOXES[f].item.userData.played && !GLOBALS.TRIGGER_BOXES[f].item.userData.multipleTrigger))
                continue;

            GLOBALS.TRIGGER_BOXES[f].item.userData.active = true;
            GLOBALS.TRIGGER_BOXES[f].item.userData.played = true;

            if (GLOBALS.TRIGGER_BOXES[f].instancedName == "trigger_save" &&
                !GLOBALS.PLAYER.spawnPosition.equals(GLOBALS.TRIGGER_BOXES[f].item.position)
            ) {
                AUDIO.POSITIVE.play();
                GLOBALS.PLAYER.spawnPosition = GLOBALS.TRIGGER_BOXES[f].item.position;
            } else if (GLOBALS.TRIGGER_BOXES[f].instancedName == "trigger_voice") {

                console.log("playing")
                playVoice(GLOBALS.TRIGGER_BOXES[f].item.userData);

            }if (GLOBALS.TRIGGER_BOXES[f].instancedName == "trigger_audio") {

                if(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem){
                    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.pause();
                    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.currentTime = 0;
                }

                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.play();
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.loop = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectLoop;

                if(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectLoop){
                    AUDIO.AMBIENT.pause();
                }
            }
        } else {
            GLOBALS.TRIGGER_BOXES[f].item.userData.active = false;
        }
    }
}

$("body").on('change', '#state-trigger-multiple', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.multipleTrigger = this.checked;
})

$("body").on('change', '#state-trigger-visibility', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.triggerVisibility = this.checked;
})

$("body").on('change', '#state-trigger-loop', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectLoop = this.checked;
})

var timeoutAudio;

$('#ambient-sound-select').on('change', function () {
    console.log($(this).val())
    console.log(document.getElementById("ambient-" + $(this).val()))

    AUDIO.AMBIENT.pause();
    AUDIO.AMBIENT.currentTime = 0;

    AUDIO.EDITOR.pause();
    AUDIO.EDITOR.currentTime = 0;

    AUDIO.AMBIENT = document.getElementById("ambient-" + $(this).val());
    play(AUDIO.AMBIENT);

    clearTimeout(timeoutAudio);

    timeoutAudio = setTimeout(() => {
        AUDIO.AMBIENT.pause();
        AUDIO.AMBIENT.currentTime = 0;
        play(AUDIO.EDITOR);
    }, 15000);
})

$('.trigger_audio-state').on('click', function () {

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffect = $(this).data('state');

    if(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem){
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.pause();
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.currentTime = 0;
    }

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem = new Audio('/audio/effect/' + $(this).data('state'));
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.play();
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.loop = false;

    clearTimeout(timeoutAudio);

    timeoutAudio = setTimeout(() => {
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.pause();
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.soundEffectElem.currentTime = 0;
    }, 5000);
})


export {
    checkForTriggerContact
}