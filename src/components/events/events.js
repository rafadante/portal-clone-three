import { triggerBodies, triggerPoints, occupiesTrigger } from '../../multiplayer/triggerOccupancy';
import { updateCrosshair } from '../../multiplayer/crosshair';
import { chamberTimeout } from '../../multiplayer/chamberTimeout';
import { Vector3, Color, Clock } from "three";
import { GLOBALS } from "../../Globals.js";
import { stateDoor } from '../door/Door.js';
import { tractorBeam } from "../tractorBeam/TractorBeam.js";
import { pelletUpdate, resetBall } from "../pellet/Pellet.js";
import { deletePortal, portalButton } from '../portal/CreatePortal.js';
import { addPositionalAudio, AUDIO, playVoice } from "../audio/Audio.js";
import { laserFieldState, tractorStates, lightBridgeState, dispenserSpawn, respawn, levelEnteredFunction, wakeUpAll } from "./states.js";
import { tweenCamera } from "../../Utils.js";
import { interactWithItem } from "./interaction.js";
import { updateAngledPanel } from "../test/Colliders.js";

let clock = new Clock();
let delta = 0;
// 30 fps
let interval = 1 / 60;

function updateEvents(deltaTime) {

  levelEnteredFunction(false);

  /*delta += clock.getDelta();

  if (delta > interval) {
    // The draw or time dependent code are here
    tractorBeam();
    pelletUpdate(delta);

    delta = delta % interval;
  }*/

  tractorBeam(deltaTime);
  //pelletUpdate(deltaTime);

  var id = 0;

  const bodies = triggerBodies(GLOBALS);
  for (let d of bodies) {

    let pos = new Vector3(d.position.x, d.position.y, d.position.z);

    if (!d.remoteTrigger) {
    if (d.name == "player") {
      for (var i = 0; i < GLOBALS.PORTAL_GUN_BOX.length; i++) {
        if (GLOBALS.PORTAL_GUN_BOX[i].containsPoint(pos) && GLOBALS.PORTAL_GUN_BOX[i].item.visible) {

          GLOBALS.PORTAL_GUN_BOX[i].item.visible = false;

          if (GLOBALS.PORTAL_GUN_BOX[i].item.name.includes("portal_gun")) {

            GLOBALS.PORTAL_GUN_INITIATE = GLOBALS.PORTAL_GUN_BOX[i].item.userData.state;
            GLOBALS.GUN.children[0].visible = true;
            GLOBALS.GUN_CLONE.children[0].visible = true;
            GLOBALS.GUN_CLONE2.children[0].visible = true;

            document.getElementById("reticle-img").style.filter = "none";
            //document.getElementById("reticle-img").src = './assets/textures/crosshairNone.webp';

            updateCrosshair('none');

            GLOBALS.GUN.visible = true;
            GLOBALS.GUN_MODE = "portal";

            if (GLOBALS.PORTAL_GUN_INITIATE == "left")
              document.getElementById("warning-game").innerHTML = "Press Mouse Left to create Blue Portals!";
            else
              document.getElementById("warning-game").innerHTML = "Press Mouse Right to create Orange Portals!";

            document.getElementById("warning-game").style.opacity = "1";

            chamberTimeout(() => {
              document.getElementById("warning-game").style.opacity = "0";
            }, 7000);

          } else if (GLOBALS.PORTAL_GUN_BOX[i].item.name.includes("paint_gun")) {
            GLOBALS.GUN.visible = false;
            //GLOBALS.PAINT_GUN.visible = true;
            GLOBALS.GUN_MODE = "paint";
          }
        }
      }
    }

    if (pos.distanceTo(new Vector3(0, 0, 0)) > 100) {
      if (d.name.includes("pellet")) {
        //console.log(pos)
        //resetBall(d.pellet, true)
        //d.pellet.position.copy(d.pellet.origin.position);
        //d.pellet.rotation.copy(d.pellet.origin.rotation);
        //d.position.copy(d.pellet.origin.position);
        //d.quaternion.copy(d.pellet.origin.quaternion);
      } else if (!d.repawning) {
        respawn(d);
      }
    }

    for (var j = 0; j < GLOBALS.GOO_BOXES.length; j++) {
      if (GLOBALS.GOO_BOXES[j].containsPoint(pos)) {
        if (!d.repawning)
          respawn(d);
      }
    }

    }
    const posArray = triggerPoints(d);

    //Go through each connection to check for triggers
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
      if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pedestal")
        || GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("laser_receiver")
        || GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("laser_relay")
        || GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("pellet_catcher"))
        continue

      if (GLOBALS.MULTIPLAYER?.slot === 1) continue;
      var notInPos = 0;

      for (var f = 0; f < posArray.length; f++) {
        //if item or player touches the trigger
        if (GLOBALS.CONNECTIONS[i]['from'].box3.containsPoint(posArray[f])) {//TRIGER START
          //Verify if the button accepts the body
          if (GLOBALS.CONNECTIONS[i]['from'].box3.accept.includes(d.name)) {

            if (!GLOBALS.CONNECTIONS[i]['line'].active) {

              var waitFor = 0;

              if (!GLOBALS.CONNECTIONS[i]['from'].item.userData.pedestalInfinity) {
                waitFor = GLOBALS.CONNECTIONS[i]['from'].item.userData.pedestalValue * 1000;

              } else {
                AUDIO.POSITIVE.play();
                connectionState(GLOBALS.CONNECTIONS[i], id, true, new Color(2, 1.3, 0))
                GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons += 1;
              }

              var to = GLOBALS.CONNECTIONS[i]['to'];
              var connection = GLOBALS.CONNECTIONS[i];
              var idHolder = id;

              GLOBALS.CONNECTIONS[i]['line'].active = true;
              doSetTimeout(to, waitFor, idHolder, connection, d);
            }
          }
          break;
        } else {//TRIGER ENDS

          if (GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("trigger") ||
            GLOBALS.CONNECTIONS[i]['from'].instancedName.includes("incinerator"))
            continue

          notInPos++;

          if (notInPos >= posArray.length && !bodies.some(other => other !== d && occupiesTrigger(other, GLOBALS.CONNECTIONS[i].from.box3))) {
            if (GLOBALS.CONNECTIONS[i]['line'].active && GLOBALS.CONNECTIONS[i]['line'].idConnection == id) {

              var active = false;;

              if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons == GLOBALS.CONNECTIONS[i]['to'].item.userData.connections)
                active = true;

              GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons -= 1;
              connectionState(GLOBALS.CONNECTIONS[i], null, false, new Color(0, 2.0, 5.0));

              if (active) {

                if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_emitter")) {
                  if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
                    GLOBALS.CONNECTIONS[i]['to'].item.continuous.visible = !GLOBALS.CONNECTIONS[i]['to'].item.continuous.visible;
                  }
                } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("angled_panel")) {
                  tweenCamera(500, GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation,
                    new Vector3(
                      GLOBALS.CONNECTIONS[i]['to'].item.userData.angle * Math.PI / 180,
                      GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation.y,
                      GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation.z)
                  );

                  const holderItem = GLOBALS.CONNECTIONS[i]['to'].item;

                  if (Boolean(GLOBALS.PORTALS[holderItem.getObjectByName("panel").hasPortal])) {
                    deletePortal(holderItem.getObjectByName("panel").hasPortal)
                  }

                  holderItem.getObjectByName("panel").hasPortal = 100;

                  chamberTimeout(() => {
                    updateAngledPanel(holderItem.getObjectByName("panel").body, holderItem.getObjectByName("Cube"));
                  }, 500);
                } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("faith_plate")) {
                  //if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections < GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                  GLOBALS.CONNECTIONS[i]['to'].item.userData.state = false;
                  //}
                } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
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
                } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("piston_platforms") ||
                  GLOBALS.CONNECTIONS[i]['to'].itemName.includes("track_platforms") ||
                  GLOBALS.CONNECTIONS[i]['to'].itemName.includes("pellet_launcher")) {

                  GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive = !GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive;


                  GLOBALS.CONNECTIONS[i]['to'].item.body.pistonDown = true;

                  if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("piston_platforms") ||
                    GLOBALS.CONNECTIONS[i]['to'].itemName.includes("track_platforms")) {
                    if (GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive)
                      GLOBALS.CONNECTIONS[i]['to'].item.body.sound.audio.play()
                    else
                      GLOBALS.CONNECTIONS[i]['to'].item.body.sound.audio.pause()
                  }

                }
              }
            }
          }
        }
      }
    }
    id++;
  }
}

var Timer = function (callback, delay) {
  var timerId, start, remaining = delay;

  this.pause = function () {
    if (!timerId) return;
    window.clearTimeout(timerId);
    timerId = null;
    remaining -= Date.now() - start;
  };

  this.resume = function () {
    if (timerId) {
      return;
    }

    start = Date.now();
    timerId = window.setTimeout(callback, remaining);
  };

  this.resume();
};

window.timeoutEvent = [];

function doSetTimeout(to, waitFor, idHolder, connection, body) {

  var id = window.timeoutEvent.length;

  window.timeoutEvent.push(new Timer(function () {

    window.timeoutEvent.splice(id, 1);

    if (waitFor > 0) {
      connectionState(connection, idHolder, true, new Color(2, 1.3, 0))
      to.item.userData.buttons += 1;
    }

    if (connection['from'].itemName.includes("incinerator")) {

      //
      //const instanced = GLOBALS.ITEMS_ADDED.getObjectByName(body.name);
      //instanced.setVisibilityAt(body.item.userData.idInstanced, false);
      //instanced.instanceMatrix.needsUpdate = true;
      //instanced.computeBoundingSphere();

      //CREATE A CLONE TO APPLY DISSOLVE SHADER
      const clone = GLOBALS.ITEMS_ADDED.getObjectByName(body.name).scene.clone();
      clone.position.set(body.position.x, body.position.y, body.position.z);
      clone.quaternion.copy(body.quaternion);
      clone.visible = true;

      if (GLOBALS.HOLDING_ITEM)
        interactWithItem()

      GLOBALS.UNIFORMS_DISSOLVER.diffuseMap.value = clone.material.map;
      clone.material = GLOBALS.MATERIAL_DISSOLVER;

      GLOBALS.SCENE_FPS.add(clone);

      var posClone = clone.position.clone();
      posClone.y += 2;

      GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value = posClone;

      var clone2 = clone.clone();
      clone2.position.y += 0.5;

      addPositionalAudio('audio-dissolve', clone, true, false, true, 2, 'sound')

      tweenCamera(3000, GLOBALS.UNIFORMS_DISSOLVER.u_EffectOrigin.value, clone.position)
      tweenCamera(3000, clone.position, clone2.position)

      //GLOBALS.MATERIAL_DISSOLVER

      chamberTimeout(() => {
        if (GLOBALS.SCENE_FPS && clone.sound) {
          GLOBALS.SCENE.remove(clone);
          GLOBALS.SCENE_FPS.remove(clone.sound);
        }
      }, 3000);

      respawn(body);
    }

    if (to.itemName.includes("laser_emitter")) {
      if (to.item.userData.connections == to.item.userData.buttons) {
        to.item.continuous.visible = !to.item.continuous.visible;
      }
    } else if (to.itemName.includes("angled_panel")) {
      if (to.item.userData.connections == to.item.userData.buttons) {

        tweenCamera(500, to.item.getObjectByName("pivot2").rotation,
          new Vector3(
            to.item.userData.angleTrigger * Math.PI / 180,
            to.item.getObjectByName("pivot2").rotation.y,
            to.item.getObjectByName("pivot2").rotation.z)
        );

        const holderItem = to.item;

        if (Boolean(GLOBALS.PORTALS[holderItem.getObjectByName("panel").hasPortal])) {
          deletePortal(holderItem.getObjectByName("panel").hasPortal)
        }

        holderItem.getObjectByName("panel").hasPortal = 100;

        chamberTimeout(() => {
          updateAngledPanel(holderItem.getObjectByName("panel").body, holderItem.getObjectByName("Cube"));
        }, 500);
      }
    } else if (to.itemName.includes("faith_plate")) {
      if (to.item.userData.connections == to.item.userData.buttons) {
        to.item.userData.state = true;
      }
    } else if (to.itemName.includes("door") ||
      to.itemName.includes("exitDoor")) {
      console.log(to)
      if (to.item.userData.connections == to.item.userData.buttons) {
        stateDoor(0, true, false, to.item);
      }
    } else if (to.itemName.includes("cube") ||
      to.itemName.includes("sphere")) {
      if (to.item.userData.connections == to.item.userData.buttons) {
        dispenserSpawn(to.item);
      }
    } else if (to.itemName.includes("tractor")) {
      if (to.item.userData.connections == to.item.userData.buttons) {
        tractorStates(to);
      }
    } else if (to.itemName.includes("light_bridge")) {
      if (to.item.userData.connections == to.item.userData.buttons) {
        lightBridgeState(to);
        wakeUpAll()
      }
    } else if (to.itemName.includes("laser_field") ||
      to.itemName.includes("fizzler")) {
      if (to.item.userData.connections == to.item.userData.buttons) {
        laserFieldState(to)
      }
    } else if (to.itemName.includes("portal_0") ||
      to.itemName.includes("portal_1")) {

      to.item.active = true;

      if (to.itemName.includes("portal_0"))
        portalButton(0, to.item, GLOBALS.MAIN_CAMERA)
      else if (to.itemName.includes("portal_1"))
        portalButton(2, to.item, GLOBALS.MAIN_CAMERA)
    } else if (to.itemName.includes("piston_platforms") || to.itemName.includes("track_platforms") ||
      to.itemName.includes("pellet_launcher")) {

      to.item.userData.isActive = !to.item.userData.isActive;


      to.item.body.pistonDown = false;

      if (to.itemName.includes("piston_platforms") || to.itemName.includes("track_platforms")) {
        if (to.item.userData.isActive)
          to.item.body.sound.audio.play()
        else
          to.item.body.sound.audio.pause()
      }
    }

    playVoice(to.item.userData);
  }, waitFor));
}

function resetAll() {
  for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
    if (GLOBALS.CONNECTIONS[i]['line'].active) {

      var active = false;;

      if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons == GLOBALS.CONNECTIONS[i]['to'].item.userData.connections)
        active = true;

      GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons -= 1;
      connectionState(GLOBALS.CONNECTIONS[i], null, false, new Color(0, 2.0, 5.0))

      if (active) {
        if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_emitter")) {
          if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons < GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
            GLOBALS.CONNECTIONS[i]['to'].item.continuous.visible = !GLOBALS.CONNECTIONS[i]['to'].item.continuous.visible;
          }
        } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("angled_panel")) {
          tweenCamera(500, GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation,
            new Vector3(
              GLOBALS.CONNECTIONS[i]['to'].item.userData.angle * Math.PI / 180,
              GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation.y,
              GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation.z)
          );

          const holderItem = GLOBALS.CONNECTIONS[i]['to'].item;

          if (Boolean(GLOBALS.PORTALS[holderItem.getObjectByName("panel").hasPortal])) {
            deletePortal(holderItem.getObjectByName("panel").hasPortal)
          }

          holderItem.getObjectByName("panel").hasPortal = 100;

          chamberTimeout(() => {
            updateAngledPanel(holderItem.getObjectByName("panel").body, holderItem.getObjectByName("Cube"));
          }, 500);
        } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("faith_plate")) {
          //if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections < GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
          GLOBALS.CONNECTIONS[i]['to'].item.userData.state = false;
          //}
        } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
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
        } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("piston_platforms") ||
          GLOBALS.CONNECTIONS[i]['to'].itemName.includes("track_platforms") ||
          GLOBALS.CONNECTIONS[i]['to'].itemName.includes("pellet_launcher")) {

          GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive = !GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive;

          GLOBALS.CONNECTIONS[i]['to'].item.body.pistonDown = true;

          if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("piston_platforms") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("track_platforms")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive)
              GLOBALS.CONNECTIONS[i]['to'].item.body.sound.audio.play()
            else
              GLOBALS.CONNECTIONS[i]['to'].item.body.sound.audio.pause()
          }

        }
      }
    }
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
          connectionState(GLOBALS.CONNECTIONS[i], "no", true, new Color(2, 1.3, 0))

          if (!catcher)
            GLOBALS.LASER_TRIGGERS.push(obj);

          //PLAY AUDIO POSITIVE
          AUDIO.POSITIVE.play();

          //Manage Door Trigger
          if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("laser_emitter")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons == GLOBALS.CONNECTIONS[i]['to'].item.userData.connections) {
              GLOBALS.CONNECTIONS[i]['to'].item.continuous.visible = !GLOBALS.CONNECTIONS[i]['to'].item.continuous.visible;
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("angled_panel")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
              tweenCamera(500, GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation,
                new Vector3(
                  GLOBALS.CONNECTIONS[i]['to'].item.userData.angleTrigger * Math.PI / 180,
                  GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation.y,
                  GLOBALS.CONNECTIONS[i]['to'].item.getObjectByName("pivot2").rotation.z)
              );

              const holderItem = GLOBALS.CONNECTIONS[i]['to'].item;

              if (Boolean(GLOBALS.PORTALS[holderItem.getObjectByName("panel").hasPortal])) {
                deletePortal(holderItem.getObjectByName("panel").hasPortal)
              }

              holderItem.getObjectByName("panel").hasPortal = 100;

              chamberTimeout(() => {
                updateAngledPanel(holderItem.getObjectByName("panel").body, holderItem.getObjectByName("Cube"));
              }, 500);
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("faith_plate")) {
            if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
              GLOBALS.CONNECTIONS[i]['to'].item.userData.state = true;
            }
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
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
          } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("piston_platforms") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("track_platforms") ||
            GLOBALS.CONNECTIONS[i]['to'].itemName.includes("pellet_launcher")) {

            GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive = !GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive;

            GLOBALS.CONNECTIONS[i]['to'].item.body.pistonDown = false;

            if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("piston_platforms") ||
              GLOBALS.CONNECTIONS[i]['to'].itemName.includes("track_platforms")) {
              if (GLOBALS.CONNECTIONS[i]['to'].item.userData.isActive)
                GLOBALS.CONNECTIONS[i]['to'].item.body.sound.audio.play()
              else
                GLOBALS.CONNECTIONS[i]['to'].item.body.sound.audio.pause()
            }

          }
        }
      }
    }
  } else {

    if (catcher)
      return;

    const index = GLOBALS.LASER_TRIGGERS.indexOf(obj);
    if (index > -1)
      GLOBALS.LASER_TRIGGERS.splice(index, 1);

    var holder = item.item.connection;
    var active = false;

    if (holder['to'].item.userData.buttons == holder['to'].item.userData.connections)
      active = true;

    holder['to'].item.userData.buttons -= 1;
    holder['from'].item.userData.state = false;
    connectionState(holder, "no", false, new Color(0, 2.0, 5.0))

    if (active) {
      if (holder['to'].itemName.includes("laser_emitter")) {
        if (holder['to'].item.userData.buttons < holder['to'].item.userData.connections) {
          holder['to'].item.continuous.visible = !holder['to'].item.continuous.visible;
        }
      }else if (holder['to'].itemName.includes("angled_panel")) {
        tweenCamera(500, holder['to'].item.getObjectByName("pivot2").rotation,
          new Vector3(
            holder['to'].item.userData.angle * Math.PI / 180,
            holder['to'].item.getObjectByName("pivot2").rotation.y,
            holder['to'].item.getObjectByName("pivot2").rotation.z)
        );

        const holderItem = holder['to'].item;

        if (Boolean(GLOBALS.PORTALS[holderItem.getObjectByName("panel").hasPortal])) {
          deletePortal(holderItem.getObjectByName("panel").hasPortal)
        }

        holderItem.getObjectByName("panel").hasPortal = 100;

        chamberTimeout(() => {
          updateAngledPanel(holderItem.getObjectByName("panel").body, holderItem.getObjectByName("Cube"));
        }, 500);
      } else if (holder['to'].itemName.includes("faith_plate")) {
        //if (holder['to'].item.userData.connections < holder['to'].item.userData.buttons) {
        holder['to'].item.userData.state = false;
        //}
      } else if (holder['to'].itemName.includes("door") || holder['to'].itemName.includes("exitDoor")) {
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
      } else if (holder['to'].itemName.includes("piston_platforms") ||
        holder['to'].itemName.includes("track_platforms") ||
        holder['to'].itemName.includes("pellet_launcher")) {

        holder['to'].item.userData.isActive = false;


        holder['to'].item.body.pistonDown = true;

        if (holder['to'].itemName.includes("piston_platforms") ||
          holder['to'].itemName.includes("track_platforms")) {
          if (holder['to'].item.userData.isActive)
            holder['to'].item.body.sound.audio.play()
          else
            holder['to'].item.body.sound.audio.pause()
        }

      }
    }
  }
}

function connectionState(connection, id, active, color) {

  if (id != "no")
    connection['line'].idConnection = id;

  connection['line'].active = active;
  connection['line'].material.color = color;

  connection['line2'].material.color = color;

  window.checkers.setColorAt(connection['checker'], color);
}

export {
  updateEvents,
  resetAll,
  laserReceiverTrigger,
  connectionState
};