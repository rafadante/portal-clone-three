import { play } from '../audio/Audio.js';
import { Vector3 } from "three";
import { tweenCamera } from "../../Utils.js";
import { GLOBALS } from "../../Globals.js";
import { corridorColliderNames } from '../test/Colliders.js';

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
      play(door.sound.audio)
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

    if (door.body) {
      if (open)
        door.body.collisionResponse = 0;
      else
        door.body.collisionResponse = 1;
    }

    door.timeOutDoor2 = setTimeout(() => {

      if (!open)
        doorSpinner(0, door)
      else
        doorPanel(25, door)

      if (GLOBALS.FPS_MODE) {
        if (enter) {
          setTimeout(() => {
            GLOBALS.EXIT_DOOR.add(GLOBALS.CORRIDOR_ENTER);
            corridorColliderNames(GLOBALS.CORRIDOR_ENTER, true);
            GLOBALS.CORRIDOR_ENTER.getObjectByName("elevatorOBJ").visible = false;
            GLOBALS.CORRIDOR_ENTER.getObjectByName("leftDoor").visible = false;
            GLOBALS.CORRIDOR_ENTER.getObjectByName("rightDoor").visible = false;
            

            if (GLOBALS.EXIT_DOOR.userData.connections > 0)
              stateDoor(0, false, false, GLOBALS.EXIT_DOOR);
            else
              stateDoor(0, true, false, GLOBALS.EXIT_DOOR);
          }, 300);
        }

        if (door == GLOBALS.EXIT_DOOR) {
          GLOBALS.CORRIDOR_ENTER.visible = open;
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
    new Vector3(angle,
      door.getObjectByName("central_spinner_right_05").rotation.y,
      door.getObjectByName("central_spinner_right_05").rotation.z))

  tweenCamera(400, door.getObjectByName("central_spinner_left_07").rotation, new Vector3(angle,
    door.getObjectByName("central_spinner_left_07").rotation.y,
    door.getObjectByName("central_spinner_left_07").rotation.z))
}

function doorPanel(pos, door) {

  tweenCamera(800, door.getObjectByName("portal_door_right_04").position,
    new Vector3(pos, door.getObjectByName("portal_door_right_04").position.y,
      door.getObjectByName("portal_door_right_04").position.z))

  tweenCamera(800, door.getObjectByName("portal_door_left_06").position,
    new Vector3(-pos, door.getObjectByName("portal_door_left_06").position.y,
      door.getObjectByName("portal_door_left_06").position.z))
}

export { stateDoor }