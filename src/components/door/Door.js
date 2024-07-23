import { AUDIO } from '../audio/Audio.js';
import * as THREE from "three";
import { tweenCamera } from "../../Main.js";
import { GLOBALS } from "../../Globals.js";

var playing = true;

function stateDoor(timeToTrigger, open, enter, door) {

    if (!enter) {
      door.getObjectByName("portal_door_right_04").position.z = -10;
      door.getObjectByName("portal_door_left_06").position.z = -10;
    } else {
      door.getObjectByName("portal_door_right_04").position.z = 10;
      door.getObjectByName("portal_door_left_06").position.z = 10;
    }
  
    if (door.timeOutDoor1) {
      clearTimeout(door.timeOutDoor1);
      clearTimeout(door.timeOutDoor2);
    }
  
    door.timeOutDoor1 = setTimeout(() => {
  
      if (playing && door.sound) {
        door.sound.audio.currentTime = 0;
        door.sound.audio.play();
      }
  
      playing = false;
      setTimeout(() => {
        playing = true;
      }, 100);
  
      var vel;
  
      if (open) {
        doorSpinner(Math.PI, door);
        vel = 400;
      } else {
        doorPanel(-65, door)
        vel = 800;
      }
  
      if (!enter && door.body) {
        if (open)
          door.body.position.y = 1000;
        else
          door.body.position.y = door.position.y;
      }
  
      door.timeOutDoor2 = setTimeout(() => {
  
        if (!open)
          doorSpinner(0, door)
        else
          doorPanel(25, door)
  
        if (GLOBALS.FPS_MODE) {
          if (enter) {
            setTimeout(() => {
              GLOBALS.CORRIDOR_ENTER.visible = false;
            }, 100);
          }
  
          if (door == GLOBALS.EXIT_DOOR) {
            GLOBALS.CORRIDOR_EXIT.visible = open;
          }
        } else {
          GLOBALS.CORRIDOR_ENTER.visible = false;
          GLOBALS.ENTER_DOOR.add(GLOBALS.CORRIDOR_ENTER);
        }
      }, vel);
    }, timeToTrigger);
  }
  
  function doorSpinner(angle, door) {
  
    tweenCamera(400, door.getObjectByName("central_spinner_right_05").rotation,
      new THREE.Vector3(angle,
        door.getObjectByName("central_spinner_right_05").rotation.y,
        door.getObjectByName("central_spinner_right_05").rotation.z))
  
    tweenCamera(400, door.getObjectByName("central_spinner_left_07").rotation, new THREE.Vector3(angle,
      door.getObjectByName("central_spinner_left_07").rotation.y,
      door.getObjectByName("central_spinner_left_07").rotation.z))
  }
  
  function doorPanel(pos, door) {
  
    tweenCamera(800, door.getObjectByName("portal_door_right_04").position,
      new THREE.Vector3(pos, door.getObjectByName("portal_door_right_04").position.y,
        door.getObjectByName("portal_door_right_04").position.z))
  
    tweenCamera(800, door.getObjectByName("portal_door_left_06").position,
      new THREE.Vector3(-pos, door.getObjectByName("portal_door_left_06").position.y,
        door.getObjectByName("portal_door_left_06").position.z))
  }

  export {stateDoor}