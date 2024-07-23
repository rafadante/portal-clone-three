/* eslint-disable */
import * as THREE from "three";
import { GLOBALS } from "../../Globals.js";
import { stateDoor } from '../door/Door.js';
import { tractorBeam } from "../tractorBeam/TractorBeam.js";
import {
  portalButton
} from '../portal/CreatePortal.js';
import { func } from "three/examples/jsm/nodes/Nodes.js";
import { AUDIO } from "../audio/Audio.js";

function updateEvents() {
  levelEnteredFunction();
  tractorBeam();

  var id = 0;

  for (let d of GLOBALS.DYNAMIC_OBJECTS) {

    let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z);

    if (pos.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
      if (!d.repawning) respawn(d);
    }

    for (var j = 0; j < GLOBALS.GOO_BOXES.length; j++) {
      if (GLOBALS.GOO_BOXES[j].containsPoint(pos)) {
        if (!d.repawning) {
          if (d.name == "player") {
            document.getElementById("death-screen").style.backgroundColor = "rgb(111, 55, 0)";
            document.getElementById("death-screen").style.opacity = 1;
          }


          respawn(d);
        }
      }
    }

    pos.y -= d.shapes[0].height / 2;
    var abriu = false;

    //Go through each connection to check for triggers
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
      if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pedestal")) {
        continue
      }
      //if item or player touches the trigger
      if (GLOBALS.CONNECTIONS[i]['from'].box3.containsPoint(pos)) {//TRIGER START
        //Verify if the button accepts the body
        if (GLOBALS.CONNECTIONS[i]['from'].box3.accept.includes(d.name)) {

          //
          if (!GLOBALS.CONNECTIONS[i]['line'].active) {
            GLOBALS.CONNECTIONS[i]['to'].item.buttons += 1;
            GLOBALS.CONNECTIONS[i]['line'].idConnection = id;
            GLOBALS.CONNECTIONS[i]['line'].active = true;
            GLOBALS.CONNECTIONS[i]['line'].material.color = new THREE.Color(0x0077B6);

            //Manage Door Trigger
            if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
              GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
              if (GLOBALS.CONNECTIONS[i]['to'].item.connections == GLOBALS.CONNECTIONS[i]['to'].item.buttons) {
                stateDoor(0, true, false, GLOBALS.CONNECTIONS[i]['to'].item);
              }
            } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("cube") ||
              GLOBALS.CONNECTIONS[i]['to'].itemName.includes("sphere")) {
              if (GLOBALS.CONNECTIONS[i]['to'].item.connections == GLOBALS.CONNECTIONS[i]['to'].item.buttons) {
                dispenserSpawn(GLOBALS.CONNECTIONS[i]['to'].item);
              }
            } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
              if (GLOBALS.CONNECTIONS[i]['to'].item.connections == GLOBALS.CONNECTIONS[i]['to'].item.buttons) {
                tractorStates(GLOBALS.CONNECTIONS[i]['to']);
              }
            } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
              if (GLOBALS.CONNECTIONS[i]['to'].item.connections == GLOBALS.CONNECTIONS[i]['to'].item.buttons) {
                lightBridgeState(GLOBALS.CONNECTIONS[i]['to'])
              }
            } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
              GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
              if (GLOBALS.CONNECTIONS[i]['to'].item.connections == GLOBALS.CONNECTIONS[i]['to'].item.buttons) {
                laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
              }
            } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
              GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {

              GLOBALS.CONNECTIONS[i]['to'].item.active = true;

              if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0"))
                portalButton(0, GLOBALS.CONNECTIONS[i]['to'].item)
              else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1"))
                portalButton(2, GLOBALS.CONNECTIONS[i]['to'].item)
            }
          }
        }
      } else {//TRIGER ENDS

        if (GLOBALS.CONNECTIONS[i]['line'].active && GLOBALS.CONNECTIONS[i]['line'].idConnection == id) {
          GLOBALS.CONNECTIONS[i]['to'].item.buttons -= 1;
          GLOBALS.CONNECTIONS[i]['line'].idConnection = null;
          GLOBALS.CONNECTIONS[i]['line'].active = false;
          GLOBALS.CONNECTIONS[i]['line'].material.color = new THREE.Color(0xffa500);

          if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.buttons < GLOBALS.CONNECTIONS[i]['to'].item.connections) {
              stateDoor(0, false, false, GLOBALS.CONNECTIONS[i]['to'].item);
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("tractor")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.buttons < GLOBALS.CONNECTIONS[i]['to'].item.connections) {
              tractorStates(GLOBALS.CONNECTIONS[i]['to']);
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("light_bridge")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.buttons < GLOBALS.CONNECTIONS[i]['to'].item.connections) {
              lightBridgeState(GLOBALS.CONNECTIONS[i]['to']);
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_field") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("fizzler")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.buttons < GLOBALS.CONNECTIONS[i]['to'].item.connections) {
              laserFieldState(GLOBALS.CONNECTIONS[i]['to'])
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {
            GLOBALS.CONNECTIONS[i]['to'].item.active = false;
          }
        }
      }
    }

    id++;
  }
}

function laserFieldState(obj) {
  obj.item.state = !obj.item.state;
  obj.item.continuous.visible = !obj.item.continuous.visible;

  if (obj.item.state)
    GLOBALS.CANNON_WORLD.addBody(obj.item.bodyLaserField);
  else
    GLOBALS.CANNON_WORLD.removeBody(obj.item.bodyLaserField);
}

function lightBridgeState(obj) {
  obj.item.state = !obj.item.state;
  obj.item.continuous.visible = !obj.item.continuous.visible;

  if (obj.item.state)
    GLOBALS.CANNON_WORLD.addBody(obj.item.bodyBridge);
  else
    GLOBALS.CANNON_WORLD.removeBody(obj.item.bodyBridge);

  if (obj.item.clone) {
    if (obj.item.clone.bodyBridge) {
      obj.item.clone.visible = obj.item.continuous.visible;

      if (obj.item.state)
        GLOBALS.CANNON_WORLD.addBody(obj.item.clone.bodyBridge);
      else
        GLOBALS.CANNON_WORLD.removeBody(obj.item.clone.bodyBridge);
    }
  }
}

function tractorStates(obj) {
  if (obj.item.triggers == "State" || obj.item.triggers == "Both") {
    obj.item.state = !obj.item.state;
    obj.item.continuous.visible = !obj.item.continuous.visible;

    if (obj.item.clone)
      obj.item.clone.visible = obj.item.continuous.visible;
  }

  if (obj.item.triggers == "Direction" || obj.item.triggers == "Both") {
    obj.item.reversed = !obj.item.reversed;

    if (obj.item.reversed)
      obj.item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE;
    else
      obj.item.continuous.material = GLOBALS.MATERIAL_TRACTOR_BEAM;

    if (obj.item.clone)
      obj.item.clone.material = obj.item.continuous.material;
  }
}

function respawn(d) {
  if (d.name.includes("gel")) return;

  d.repawning = true;

  var time = 2500;
  var time2 = 0;

  if (d.name == "player") {
    AUDIO.DEATH.currentTime = 0;
    AUDIO.DEATH.play();
    time = 500;
    time2 = 500;
  }

  setTimeout(() => {
    d.repawning = false;

    // Velocity
    d.velocity.setZero();
    d.initVelocity.setZero();
    d.angularVelocity.setZero();
    d.initAngularVelocity.setZero();

    // Force
    d.force.setZero();
    d.torque.setZero();

    d.position.copy(d.spawnPosition);

    if (d.name != "player")
      d.mass = 0;

    setTimeout(() => {

      if (d.name != "player") {
        if (d.state == "once") {
          d.mass = 0;
        } else {
          d.mass = 5;
        }

        console.log(d.mass)
        d.wakeUp()
      } else {
        document.getElementById("death-screen").style.opacity = 0;
      }
    }, time);
  }, time2);
}

window.CAMERA_ROTATING = false;

function levelEnteredFunction() {
  if (!GLOBALS.LEVEL_ENTERED) {
    if (GLOBALS.ENTER_DOOR.box3.containsPoint(GLOBALS.PLAYER.position)) {
      GLOBALS.LEVEL_ENTERED = true;
      GLOBALS.WALL_CORRIDOR_ENTER.position.y = 0;

      setTimeout(() => {
        GLOBALS.SPOTLIGHT.intensity = 20;
        GLOBALS.RENDERER.shadowMap.autoUpdate = true;

        setTimeout(() => {
          for (var i = 0; i < GLOBALS.BOX_BODY.length; i++) {
            console.log(GLOBALS.BOX_BODY[i].item.state)
            if (GLOBALS.BOX_BODY[i].item.opened)
              dispenserSpawn(GLOBALS.BOX_BODY[i].item);
          }
        }, 1000);
      }, 1000);
      stateDoor(1000, false, true, GLOBALS.ENTER_DOOR)
    }
  }
}

function dispenserSpawn(item) {
  item.body.position.set(item.dispenserPosition.x, item.dispenserPosition.y - 1, item.dispenserPosition.z);
  item.body.mass = 5;
  item.body.allowSleep = true;

  // Velocity
  item.body.velocity.setZero();
  item.body.initVelocity.setZero();
  item.body.angularVelocity.setZero();
  item.body.initAngularVelocity.setZero();

  // Force
  item.body.force.setZero();
  item.body.torque.setZero();

  item.body.wakeUp();
}

export { updateEvents, dispenserSpawn, respawn };