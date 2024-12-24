import {
    GLOBALS
} from '../../Globals.js';
import {
    AUDIO,
    play,
    playVoice
} from "../audio/Audio.js";


function checkForTriggerContact() {
    for (var f = 0; f < GLOBALS.TRIGGER_BOXES.length; f++) {
        //if item or player touches the trigger
        if (GLOBALS.TRIGGER_BOXES[f].box3.containsPoint(GLOBALS.PLAYER.position)) {//TRIGER START

            if(GLOBALS.TRIGGER_BOXES[f].item.userData.active)
                continue;

            GLOBALS.TRIGGER_BOXES[f].item.userData.active = true;

            if (GLOBALS.TRIGGER_BOXES[f].instancedName == "trigger_save" &&
                !GLOBALS.PLAYER.spawnPosition.equals(GLOBALS.TRIGGER_BOXES[f].item.position)
            ) {
                AUDIO.POSITIVE.play();
                GLOBALS.PLAYER.spawnPosition = GLOBALS.TRIGGER_BOXES[f].item.position;
            } else if (GLOBALS.TRIGGER_BOXES[f].instancedName == "trigger_voice") {

                console.log("playing")
                playVoice(GLOBALS.TRIGGER_BOXES[f].item.userData);

            }
        }else{
            GLOBALS.TRIGGER_BOXES[f].item.userData.active = false;
        }
    }
}

export {
    checkForTriggerContact
}