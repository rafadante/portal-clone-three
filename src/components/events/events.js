import {
  Vector3,
  Color,
  Raycaster
} from "three";
import { GLOBALS } from "../../Globals.js";
import { stateDoor } from '../door/Door.js';
import { tractorBeam } from "../tractorBeam/TractorBeam.js";
import { pelletUpdate } from "../pellet/Pellet.js";
import {
  portalButton
} from '../portal/CreatePortal.js';
import {
  AUDIO,
  play,
  addPositionalAudio
} from "../audio/Audio.js";
import {
  removeJointConstraint
} from '../../Physics.js';
import {
  tweenCamera
} from '../../Utils.js';
import {
  laserFieldState,
  tractorStates,
  lightBridgeState,
  dispenserSpawn,
  respawn,
  levelEnteredFunction,
  wakeUpAll
} from "./states.js";

var itemHolder = null;
var coords = new Vector3();
var raycaster2 = new Raycaster();

function updateEvents() {

  levelEnteredFunction();
  tractorBeam();
  pelletUpdate();

  var id = 0;

  //

  for (let d of GLOBALS.DYNAMIC_OBJECTS) {

    let pos = new Vector3(d.position.x, d.position.y, d.position.z);

    if (d.name == "player") {
      for (var i = 0; i < GLOBALS.PORTAL_GUN_BOX.length; i++) {
        if (GLOBALS.PORTAL_GUN_BOX[i].containsPoint(pos) && GLOBALS.PORTAL_GUN_BOX[i].item.visible) {
          GLOBALS.PORTAL_GUN_BOX[i].item.visible = false;
          GLOBALS.PORTAL_GUN_INITIATE = GLOBALS.PORTAL_GUN_BOX[i].item.userData.state;

          //
          GLOBALS.GUN.children[0].visible = true;
          GLOBALS.GUN_CLONE.children[0].visible = true;
          GLOBALS.GUN_CLONE2.children[0].visible = true;
          //document.getElementById("reticle-img").style.display = "block";


          document.getElementById("reticle-img").style.filter = "none";
          document.getElementById("reticle-img").src = './assets/textures/crosshairNone.png';
        }
      }
    }

    if (pos.distanceTo(new Vector3(0, 0, 0)) > 100) {
      if (!d.repawning) respawn(d);
    }

    for (var j = 0; j < GLOBALS.GOO_BOXES.length; j++) {
      if (GLOBALS.GOO_BOXES[j].containsPoint(pos)) {
        if (!d.repawning) {
          if (d.name == "player") {

          }


          respawn(d);
        }
      }
    }

    const posArray = [
      new Vector3(d.position.x + d.shapes[0].height / 2, d.position.y, d.position.z),
      new Vector3(d.position.x - d.shapes[0].height / 2, d.position.y, d.position.z),
      new Vector3(d.position.x, d.position.y + d.shapes[0].height / 2, d.position.z),
      new Vector3(d.position.x, d.position.y - d.shapes[0].height / 2, d.position.z),
      new Vector3(d.position.x, d.position.y, d.position.z + d.shapes[0].height / 2),
      new Vector3(d.position.x, d.position.y, d.position.z - d.shapes[0].height / 2)
    ]

    //Go through each connection to check for triggers
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
      if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pedestal")
        || GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("laser_receiver")
        || GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("laser_relay")
        || GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pellet_catcher"))
        continue
      else if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("trigger_area") && GLOBALS.CONNECTIONS[i]['from'].item.visible)
        GLOBALS.CONNECTIONS[i]['from'].item.visible = false;

      var notInPos = 0;

      for (var f = 0; f < posArray.length; f++) {
        //if item or player touches the trigger
        if (GLOBALS.CONNECTIONS[i]['from'].box3.containsPoint(posArray[f])) {//TRIGER START
          //Verify if the button accepts the body
          if (GLOBALS.CONNECTIONS[i]['from'].box3.accept.includes(d.name)) {

            if (!GLOBALS.CONNECTIONS[i]['line'].active) {
              GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons += 1;
              GLOBALS.CONNECTIONS[i]['line'].idConnection = id;
              GLOBALS.CONNECTIONS[i]['line'].active = true;
              GLOBALS.CONNECTIONS[i]['line'].material.color = new Color(2, 1.3, 0);
              //GLOBALS.BATCHED_BLUE.setVisibleAt(GLOBALS.CONNECTIONS[i]['line'].lineInstancedId, false);
              //GLOBALS.BATCHED_ORANGE.setVisibleAt(GLOBALS.CONNECTIONS[i]['line'].lineInstancedId, true);

              //PLAY AUDIO POSITIVE
              if (!GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("trigger_area")) {
                addPositionalAudio('audio-button-positive', GLOBALS.CONNECTIONS[i]['from'], true, false, true, 8);
                var soundHolder = GLOBALS.CONNECTIONS[i]['from'];
                setTimeout(() => {
                  GLOBALS.SCENE_FPS.remove(soundHolder.sound);
                }, 1500);
              }

              //Manage Door Trigger
              if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                  stateDoor(0, true, false, GLOBALS.CONNECTIONS[i]['to'].item);
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("cube") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("sphere")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                  dispenserSpawn(GLOBALS.CONNECTIONS[i]['to'].item);
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                  tractorStates(GLOBALS.CONNECTIONS[i]['to']);
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                  lightBridgeState(GLOBALS.CONNECTIONS[i]['to']);
                  wakeUpAll()
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                  laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {

                GLOBALS.CONNECTIONS[i]['to'].item.active = true;

                if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0"))
                  portalButton(0, GLOBALS.CONNECTIONS[i]['to'].item, GLOBALS.MAIN_CAMERA)
                else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1"))
                  portalButton(2, GLOBALS.CONNECTIONS[i]['to'].item, GLOBALS.MAIN_CAMERA)
              }
            }
          }
          break;
        } else {//TRIGER ENDS

          if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("trigger_area"))
            continue

          notInPos++;

          if (notInPos >= 6) {
            if (GLOBALS.CONNECTIONS[i]['line'].active && GLOBALS.CONNECTIONS[i]['line'].idConnection == id) {
              GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons -= 1;
              GLOBALS.CONNECTIONS[i]['line'].idConnection = null;
              GLOBALS.CONNECTIONS[i]['line'].active = false;
              GLOBALS.CONNECTIONS[i]['line'].material.color = new Color(0, 2.0, 5.0);
              //GLOBALS.BATCHED_BLUE.setVisibleAt(GLOBALS.CONNECTIONS[i]['line'].lineInstancedId, true);
              //GLOBALS.BATCHED_ORANGE.setVisibleAt(GLOBALS.CONNECTIONS[i]['line'].lineInstancedId, false);

              if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
                  stateDoor(0, false, false, GLOBALS.CONNECTIONS[i]['to'].item);
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
                  tractorStates(GLOBALS.CONNECTIONS[i]['to']);
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
                  lightBridgeState(GLOBALS.CONNECTIONS[i]['to']);
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
                  laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
                }
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {
                GLOBALS.CONNECTIONS[i]['to'].item.active = false;
              }
            }
          }
        }
      }
    }
    id++;
  }
}

function resetAll() {
  for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
    if (GLOBALS.CONNECTIONS[i]['line'].active) {
      GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons -= 1;
      GLOBALS.CONNECTIONS[i]['line'].idConnection = null;
      GLOBALS.CONNECTIONS[i]['line'].active = false;
      GLOBALS.CONNECTIONS[i]['line'].material.color = new Color(0, 2.0, 5.0);

      if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
        GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
        if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
          stateDoor(0, false, false, GLOBALS.CONNECTIONS[i]['to'].item);
        }
      } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
        if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
          tractorStates(GLOBALS.CONNECTIONS[i]['to']);
        }
      } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
        if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
          lightBridgeState(GLOBALS.CONNECTIONS[i]['to']);
        }
      } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
        GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
        if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
          laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
        }
      } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
        GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {
        GLOBALS.CONNECTIONS[i]['to'].item.active = false;
      }
    }
  }
}

function interactWithItem() {

  raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
  var intersects = raycaster2.intersectObjects(GLOBALS.INTERACTIVE);

  if (GLOBALS.HOLDING_ITEM) {

    AUDIO.HOLD.pause();
    tweenCamera(250, GLOBALS.GUN.children[0].children[0].position, new Vector3(0.00009, -0.00013, -0.00012))
    GLOBALS.HOLDING_ITEM = false;

    if (itemHolder) {
      itemHolder.gelJumping = false;
      itemHolder.sleeping = false;
    }

    GLOBALS.CURRENT_ITEM.body.sideContact = null;
    GLOBALS.CURRENT_ITEM.body.contactID = null;
    GLOBALS.CURRENT_ITEM.body.holding = false;
    GLOBALS.CURRENT_ITEM.body.angularDamping = 0;
    GLOBALS.CURRENT_ITEM.body.allowSleep = true;
    //GLOBALS.CURRENT_ITEM.body.mass = GLOBALS.CURRENT_ITEM.body.initialMass;
    GLOBALS.CURRENT_ITEM = null;
    GLOBALS.CURRENT_ITEM_ID = null;
    itemHolder = null;

    removeJointConstraint();

  } else if (intersects.length > 0) {

    if (intersects[0].object.name == "pedestal_button") {

      if (intersects[0].distance < 1) {

        var item = GLOBALS.DYMANIC_ITEMS[intersects[0].object.name][intersects[0].instanceId];
        var goal = GLOBALS.PLANE_USER_DATA[item.userData.planeInstancedId];

        //Go through each connection to check for triggers
        for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
          if (!GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pedestal")) {
            continue
          }
          //if item or player touches the trigger
          if (goal == GLOBALS.CONNECTIONS[i]['from']) {//TRIGER START
            //Verify if the button accepts the body
            if (!GLOBALS.CONNECTIONS[i]['line'].active) {
              GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons += 1;
              //GLOBALS.CONNECTIONS[i]['line'].idConnection = id;
              GLOBALS.CONNECTIONS[i]['line'].active = true;
              GLOBALS.CONNECTIONS[i]['line'].material.color = new Color(2, 1.3, 0);
              //GLOBALS.BATCHED_BLUE.setVisibleAt(GLOBALS.CONNECTIONS[i]['line'].lineInstancedId, false);
              //GLOBALS.BATCHED_ORANGE.setVisibleAt(GLOBALS.CONNECTIONS[i]['line'].lineInstancedId, true);

              //PLAY AUDIO POSITIVE
              addPositionalAudio('audio-button-positive', GLOBALS.CONNECTIONS[i]['from'], true, false, true, 8);
              var soundHolder = GLOBALS.CONNECTIONS[i]['from'];
              setTimeout(() => {
                GLOBALS.SCENE_FPS.remove(soundHolder.sound);
              }, 1500);

              //Manage Door Trigger
              if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
                  stateDoor(0, true, false, GLOBALS.CONNECTIONS[i]['to'].item);
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("cube") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("sphere")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
                  dispenserSpawn(GLOBALS.CONNECTIONS[i]['to'].item);
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
                  tractorStates(GLOBALS.CONNECTIONS[i]['to']);
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
                  lightBridgeState(GLOBALS.CONNECTIONS[i]['to'])
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
                  laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
              } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {

                GLOBALS.CONNECTIONS[i]['to'].item.active = true;

                if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0"))
                  portalButton(0, GLOBALS.CONNECTIONS[i]['to'].item, GLOBALS.MAIN_CAMERA)
                else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1"))
                  portalButton(2, GLOBALS.CONNECTIONS[i]['to'].item, GLOBALS.MAIN_CAMERA)
              }

              if (!GLOBALS.CONNECTIONS[i]['from'].item.userData.pedestalInfinity) {
                setTimeout(pedestalTimer, GLOBALS.CONNECTIONS[i]['from'].item.userData.pedestalValue * 1000, GLOBALS.CONNECTIONS[i]);
              }
            }
          }
        }
      }
    } else {
      if (intersects[0].distance < 1.5) {

        GLOBALS.HOLDING_ITEM = true;
        tweenCamera(250, GLOBALS.GUN.children[0].children[0].position, new Vector3(0.00009, -0.00013, -0.00001))

        if (intersects[0].object.name != "camera") {
          var instancedId = intersects[0].instanceId;
          var name = intersects[0].object.name;

          GLOBALS.CURRENT_ITEM = GLOBALS.DYMANIC_ITEMS[name][instancedId];
          GLOBALS.CURRENT_INSTANCED = GLOBALS.ITEMS_ADDED.getObjectByName(name);
          GLOBALS.CURRENT_ITEM_ID = instancedId;

          itemHolder = GLOBALS.DYMANIC_ITEMS[name][instancedId].body;
          GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
          GLOBALS.CURRENT_ITEM.body.allowSleep = false;
          GLOBALS.CURRENT_ITEM.body.holding = true;
        } else {
          GLOBALS.CURRENT_ITEM = intersects[0].object;
          GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
          GLOBALS.CURRENT_ITEM.body.allowSleep = false;
          GLOBALS.CURRENT_ITEM.body.holding = true;
        }

        GLOBALS.CURRENT_ITEM.body.collisionResponse = 1;
        GLOBALS.CURRENT_ITEM.body.wakeUp();

        if (GLOBALS.PORTAL_GUN_INITIATE != "none") {
          AUDIO.PICK_SUCESS.pause();
          AUDIO.PICK_SUCESS.currentTime = 0;
          play(AUDIO.PICK_SUCESS)
          play(AUDIO.HOLD)
        }

        GLOBALS.CURRENT_ITEM.body.impactVelocity = null;
        GLOBALS.CURRENT_ITEM.body.customGravity = null;
        GLOBALS.CURRENT_ITEM.body.side = null;
        GLOBALS.CURRENT_ITEM.body.impactSide = null;
        const index = GLOBALS.CUSTOM_GRAVITY.indexOf(GLOBALS.CURRENT_ITEM.body);
        if (index > -1) {
          GLOBALS.CUSTOM_GRAVITY.splice(index, 1);
        }
      } else {
        AUDIO.PICK_FAIL.pause();
        AUDIO.PICK_FAIL.currentTime = 0;
        play(AUDIO.PICK_FAIL)
      }
    }
  } else {
    AUDIO.PICK_FAIL.pause();
    AUDIO.PICK_FAIL.currentTime = 0;
    play(AUDIO.PICK_FAIL)
  }

  GLOBALS.LIGHTNIN_STRIKE_1.visible = GLOBALS.HOLDING_ITEM;
  GLOBALS.LIGHTNIN_STRIKE_2.visible = GLOBALS.HOLDING_ITEM;
  GLOBALS.LIGHTNIN_STRIKE_3.visible = GLOBALS.HOLDING_ITEM;
}

function pedestalTimer(holder) {

  holder['line'].active = false;
  holder['to'].item.userData.buttons -= 1;
  holder['line'].material.color = new Color(0, 2.0, 5.0);
  //GLOBALS.BATCHED_BLUE.setVisibleAt(holder['line'].lineInstancedId, true);
  //GLOBALS.BATCHED_ORANGE.setVisibleAt(holder['line'].lineInstancedId, false);

  if (holder['to'].itemName.includes("door") || holder['to'].itemName.includes("exitDoor")) {
    if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
      stateDoor(0, false, false, holder['to'].item);
  } else if (holder['to'].itemName.includes("tractor")) {
    if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
      tractorStates(holder['to']);
  } else if (holder['to'].itemName.includes("light_bridge")) {
    if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
      lightBridgeState(holder['to']);
  } else if (holder['to'].itemName.includes("laser_field") || holder['to'].itemName.includes("fizzler")) {
    if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
      laserFieldState(holder['to'])
  } else if (holder['to'].itemName.includes("portal_0") ||
    holder['to'].itemName.includes("portal_1")) {
    holder['to'].item.active = false;
  }
}

function laserReceiverTrigger(obj, state, catcher) {

  const item = GLOBALS.PLANE_USER_DATA[obj.userData.planeInstancedId];

  if (state) {
    //Go through each connection to check for triggers
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
      if (!GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("laser_receiver") &&
        !GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("laser_relay") &&
        !GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pellet_catcher")) {
        continue
      }

      //if item or player touches the trigger
      if (item == GLOBALS.CONNECTIONS[i]['from']) {//TRIGER START
        //Verify if the button accepts the body
        if (!GLOBALS.CONNECTIONS[i]['line'].active) {
          item.item.connection = GLOBALS.CONNECTIONS[i];
          GLOBALS.CONNECTIONS[i]['from'].item.userData.state = true;
          GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons += 1;
          GLOBALS.CONNECTIONS[i]['line'].active = true;
          GLOBALS.CONNECTIONS[i]['line'].material.color = new Color(2, 1.3, 0);

          if (!catcher)
            GLOBALS.LASER_TRIGGERS.push(obj);

          //PLAY AUDIO POSITIVE
          addPositionalAudio('audio-button-positive', GLOBALS.CONNECTIONS[i]['from'], true, false, true, 8);
          var soundHolder = GLOBALS.CONNECTIONS[i]['from'];
          setTimeout(() => {
            GLOBALS.SCENE_FPS.remove(soundHolder.sound);
          }, 1500);

          //Manage Door Trigger
          if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
              stateDoor(0, true, false, GLOBALS.CONNECTIONS[i]['to'].item);
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("cube") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("sphere")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
              dispenserSpawn(GLOBALS.CONNECTIONS[i]['to'].item);
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
              tractorStates(GLOBALS.CONNECTIONS[i]['to']);
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
              lightBridgeState(GLOBALS.CONNECTIONS[i]['to'])
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons)
              laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {

            GLOBALS.CONNECTIONS[i]['to'].item.active = true;

            if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0"))
              portalButton(0, GLOBALS.CONNECTIONS[i]['to'].item, GLOBALS.MAIN_CAMERA)
            else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1"))
              portalButton(2, GLOBALS.CONNECTIONS[i]['to'].item, GLOBALS.MAIN_CAMERA)
          }
        }
      }
    }
  } else {

    if (catcher) {
      return;
    }

    const index = GLOBALS.LASER_TRIGGERS.indexOf(obj);
    if (index > -1) {
      GLOBALS.LASER_TRIGGERS.splice(index, 1);
    }

    var holder = item.item.connection;

    holder['line'].active = false;
    holder['to'].item.userData.buttons -= 1;
    holder['line'].material.color = new Color(0, 2.0, 5.0);
    holder['from'].item.userData.state = false;
    //GLOBALS.BATCHED_BLUE.setVisibleAt(holder['line'].lineInstancedId, true);
    //GLOBALS.BATCHED_ORANGE.setVisibleAt(holder['line'].lineInstancedId, false);

    if (holder['to'].itemName.includes("door") || holder['to'].itemName.includes("exitDoor")) {
      if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
        stateDoor(0, false, false, holder['to'].item);
    } else if (holder['to'].itemName.includes("tractor")) {
      if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
        tractorStates(holder['to']);
    } else if (holder['to'].itemName.includes("light_bridge")) {
      if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
        lightBridgeState(holder['to']);
    } else if (holder['to'].itemName.includes("laser_field") || holder['to'].itemName.includes("fizzler")) {
      if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections)
        laserFieldState(holder['to'])
    } else if (holder['to'].itemName.includes("portal_0") ||
      holder['to'].itemName.includes("portal_1")) {
      holder['to'].item.active = false;
    }
  }

}

export {
  updateEvents,
  tractorStates,
  lightBridgeState,
  laserFieldState,
  interactWithItem,
  resetAll,
  laserReceiverTrigger
};