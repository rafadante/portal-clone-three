import { Vector3, Color, Raycaster } from "three";
import { GLOBALS } from "../../Globals.js";
import { stateDoor } from '../door/Door.js';
import { portalButton } from '../portal/CreatePortal.js';
import { AUDIO, play, } from "../audio/Audio.js";
import { removeJointConstraint } from '../../Physics.js';
import { tweenCamera } from '../../Utils.js';
import { laserFieldState, tractorStates, lightBridgeState, dispenserSpawn } from "./states.js";
import { connectionState } from "./events";

var itemHolder = null;
var coords = new Vector3();
var raycaster2 = new Raycaster();

function interactWithItem() {

    raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);

    var intersectsWall = raycaster2.intersectObjects(window.glass);

    var intersects = raycaster2.intersectObjects(GLOBALS.INTERACTIVE);

    if (GLOBALS.HOLDING_ITEM) {

        AUDIO.HOLD.pause();
        tweenCamera(250, GLOBALS.GUN.children[0].children[0].position, new Vector3(0.007, -0.01, -0.0095))
        GLOBALS.HOLDING_ITEM = false;

        if (itemHolder) {
            itemHolder.gelJumping = false;
            itemHolder.sleeping = false;
        }

        GLOBALS.CURRENT_ITEM.body.collisionFilterMask = GLOBALS.CGROUP_ALL;
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

        if (intersectsWall.length > 0) {
            if (intersectsWall[0].distance < intersects[0].distance) {
                AUDIO.PICK_FAIL.pause();
                AUDIO.PICK_FAIL.currentTime = 0;
                play(AUDIO.PICK_FAIL)
                return;
            }
        }

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
                            connectionState(GLOBALS.CONNECTIONS[i], "no", true, new Color(2, 1.3, 0))

                            //PLAY AUDIO POSITIVE
                            AUDIO.POSITIVE.play();

                            //Manage Door Trigger
                            if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("faith_plate")) {
                                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                                    GLOBALS.CONNECTIONS[i]['to'].item.userData.state = true;
                                }
                            } else if (GLOBALS.CONNECTIONS[i]['to'].itemName.includes("door") ||
                                GLOBALS.CONNECTIONS[i]['to'].itemName.includes("exitDoor")) {
                                    
                                if (GLOBALS.CONNECTIONS[i]['to'].item.userData.connections == GLOBALS.CONNECTIONS[i]['to'].item.userData.buttons) {
                                    stateDoor(0, true, false, GLOBALS.CONNECTIONS[i]['to'].item);
                                }
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

                                if (!GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_0") &&
                                    !GLOBALS.CONNECTIONS[i]['to'].itemName.includes("portal_1")) {
                                    const audioTikTok = document.getElementById("tiktok").cloneNode(true);
                                    audioTikTok.play();
                                    setTimeout(() => {
                                        audioTikTok.pause();
                                    }, GLOBALS.CONNECTIONS[i]['from'].item.userData.pedestalValue * 1000);
                                }


                                setTimeout(pedestalTimer, GLOBALS.CONNECTIONS[i]['from'].item.userData.pedestalValue * 1000, GLOBALS.CONNECTIONS[i]);
                            }
                        }
                    }
                }
            }
        } else {

            if (intersects[0].distance < 1.5) {

                var instancedId = intersects[0].instanceId;
                var name = intersects[0].object.name;
                var test;

                if (intersects[0].object.name != "camera") {
                    if (GLOBALS.DYMANIC_ITEMS[name][instancedId].body.mass == 0)
                        return;
                }

                if (intersects[0].object.name != "camera") {
                    test = GLOBALS.DYMANIC_ITEMS[name][instancedId];
                } else {
                    test = intersects[0].object;
                }

                if (test.body.mass == 0) {
                    //return;
                }

                GLOBALS.HOLDING_ITEM = true;//0.00009, -0.00013, -0.00012
                tweenCamera(250, GLOBALS.GUN.children[0].children[0].position, new Vector3(0.007, -0.01, -0.004))

                if (intersects[0].object.name != "camera") {
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

                GLOBALS.CURRENT_ITEM.body.collisionFilterMask = GLOBALS.CGROUP_ENVIRONMENT | GLOBALS.CGROUP_DYNAMIC;

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

    var active = false;;

    if (holder['to'].item.userData.buttons == holder['to'].item.userData.connections)
        active = true;

    holder['to'].item.userData.buttons -= 1;
    connectionState(holder, "no", false, new Color(0, 2.0, 5.0))

    if (active) {
        if (holder['to'].itemName.includes("faith_plate")) {
            //if (holder['to'].item.userData.connections < holder['to'].item.userData.buttons)
            holder['to'].item.userData.state = false;
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
        }
    }
}

export {
    interactWithItem
}