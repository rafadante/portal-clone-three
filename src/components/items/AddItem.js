import {
    Vector3,
    Group,
    MeshBasicMaterial,
    CircleGeometry,
    Mesh,
    TextureLoader,
    SRGBColorSpace,
    BoxGeometry,
    Color,
    MeshStandardMaterial,
    Object3D,
    Box3,
    ConeGeometry,
} from 'three';
import {
    AddGoo
} from '../goo/Goo.js';
import {
    GLOBALS
} from '../../Globals.js';
import { findPath } from '../findPath/FindPath.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import {
    createLightBridges
} from '../continuous/Continuous.js';
import { ContinuousTrigger } from '../continuous/Continuous.js';
import { getPlaneByName } from '../../Utils.js';
import $ from 'jquery';
import { planeInstanceReset } from './Items.js';
import {
    laserEmitterRaycast,
    laserEmitterPosition
} from '../lasers/Laser.js';
import {
    targetFaithPlateStart,
    targetFaithPlateEnd,
    targetFaithPlateUpdate
} from '../faithPlate/FaithPlate.js';
import { gelRecharger } from '../gels/PaintingGun.js';
import { addLine } from '../boxSelection/Connection.js';
import { load3D } from '../loadObj/LoaderOBJ.js';

var itemCount = 0;

for (const property in GLOBALS.ITEMS_COUNT) {
    $("#" + property).parent().children("span").text(GLOBALS.ITEMS_COUNT[property]["max"])
}

function updateLines(userData, instanced) {
    if (window.changingPosition) {
        for (var j = 0; j < GLOBALS.CONNECTIONS.length; j++) {
            if (GLOBALS.CONNECTIONS[j]["from"] == window.changingPositionPlane) {

                GLOBALS.CONNECTIONS[j]["from"] = userData;
                GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[j]["line"]);
                const line = addLine(GLOBALS.CONNECTIONS[j]["from"].position, GLOBALS.CONNECTIONS[j]["to"].position);
                GLOBALS.SCENE_CHILDREN.add(line);
                GLOBALS.CONNECTIONS[j]["line"] = line;

            } else if (GLOBALS.CONNECTIONS[j]["to"] == window.changingPositionPlane) {

                GLOBALS.CONNECTIONS[j]["to"] = userData;
                GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[j]["line"]);
                const line = addLine(GLOBALS.CONNECTIONS[j]["from"].position, GLOBALS.CONNECTIONS[j]["to"].position);
                GLOBALS.SCENE_CHILDREN.add(line);
                GLOBALS.CONNECTIONS[j]["line"] = line;

                if (instanced)
                    GLOBALS.CONNECTIONS[j]["to"].item.userData.connections += 1;
            }
        }
    }
}

function addItem(found, loaded) {

    if (!GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME)
        && GLOBALS.ITEM_HOLDED_NAME != "glass"
        && GLOBALS.ITEM_HOLDED_NAME != "trigger_area"
        && GLOBALS.ITEM_HOLDED_NAME != "spawn"
        && GLOBALS.ITEM_HOLDED_NAME != "goo") {

        $("#follow").css("display", "none");

        console.log(GLOBALS.ITEM_HOLDED_NAME)

        load3D(
            "/3ds/" + GLOBALS.ITEM_HOLDED_NAME + ".glb",
            GLOBALS.ITEM_HOLDED_NAME,
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["instanced"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["interactive"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["roughness"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["envIntensity"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["wall"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["ground"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["ceiling"],
            GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["trigger"],
            found, loaded, GLOBALS.DRAGGED_ITEM_ELEMENT, GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["max"]
        );
        return;
    }

    if (!GLOBALS.ITEM_CUBE.place && !loaded)
        return

    if (GLOBALS.ITEM_HOLDED_NAME == "goo" || (loaded && found.itemName == "goo")) {

        if (loaded)
            userData = found;
        else
            userData = GLOBALS.PLANE_USER_DATA[found[0].instanceId];

        userData.hasItem = true;
        userData.itemName = "goo";


        if (loaded) {
            var ar = [found]
            AddGoo(ar, true);
        } else
            AddGoo(found, false);

        return;
    }

    if (loaded) {
        GLOBALS.ITEM_HOLDED_NAME = found.itemName.split('-')[0];
        GLOBALS.DRAGGED_ITEM_ELEMENT = $("#" + GLOBALS.ITEM_HOLDED_NAME)
    }

    const i = 0;

    if (GLOBALS.CONNECTING) {

        target = GLOBALS.PLANE_USER_DATA[found[i].instanceId];

        GLOBALS.SELECTED_FOR_CONNECTION.trigger = target;
        GLOBALS.SELECTED_FOR_CONNECTION.normal = found[i].normal;

        findPath(GLOBALS.SELECTED_FOR_CONNECTION.position, target.position, found[i])
    } else {

        var userData, userDataLoadedItem;

        if (loaded) {
            userData = found;
            userDataLoadedItem = userData.item;
        } else {
            userData = GLOBALS.PLANE_USER_DATA[found[i].instanceId];
            userData.hasItem = false; //delete here
        }

        if ((!userData.hasItem && !userData.continuousEnding) || loaded) {// 

            if (GLOBALS.ITEM_HOLDED_NAME == "spawn") {
                const geometry = new ConeGeometry(0.75, 2, 8);
                const material = new MeshBasicMaterial({ color: 0xff0000 });
                const cone = new Mesh(geometry, material);
                var item = cone;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "trigger_area") {
                const geometry = new BoxGeometry(2, 2, 2);

                var material = GLOBALS.MATERIAL_TRIGGER_ONCE;

                /*if (loaded) {
                    if (!userDataLoadedItem.userData.state)
                        material = GLOBALS.MATERIAL_TRIGGER_MULT;
                }*/

                const box = new Mesh(geometry, material);
                var item = box;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
                var item = GLOBALS.GUN_CLONE.clone();
                item.name = "portal_gun";
                const camera = GLOBALS.MAIN_CAMERA.clone();
                camera.position.set(0, 0, 0)
                camera.rotation.set(0, 0, 0)
                item.add(camera);
                item.camera = camera;
                window.ttt = camera;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "paint_gun") {
                var item = GLOBALS.PAINT_GUN.clone();
                item.name = "paint_gun";
                item.visible = true;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "glass") {
                const box = new Object3D()
                var item = box;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();

                item.traverse(child => {
                    if (child.name == "horizontal")
                        GLOBALS.CAMERA_OBJ_HORIZONTAL.push(child)
                    else if (child.name == "vertical")
                        GLOBALS.CAMERA_OBJ_VERTICAL.push(child)
                })
            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
                item.visible = true;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "observation_room") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {

                var item = new Group();

                const geometry = new CircleGeometry(0.25, 32);
                const material = new MeshBasicMaterial({ color: 0x000000 });
                const circle = new Mesh(geometry, material);
                circle.rotation.x = -Math.PI / 2;
                circle.name = "circle_rotation";
                //item.add(circle);
                circle.translateZ(0.01);

                const door = SkeletonUtils.clone(GLOBALS.ENTER_DOOR);
                door.position.set(0, 0, 0);
                door.rotation.set(0, 0, 0);
                //door.visible=false
                item.add(door);
                door.translateZ(-1);
                door.translateY(1);

                item.getObjectByName("portal_door_right_04").scale.set(1, 1, 1);
                item.getObjectByName("portal_door_left_06").scale.set(1, 1, 1);
                //item.getObjectByName("warning").visible = false;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "angled_panel") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
            } else {
                var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME);
                var item = new Object3D();
                //item.userData = instanced.userData;
            }

            if (GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"] < GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["max"]) {
                GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"] += 1;
                $("#" + GLOBALS.ITEM_HOLDED_NAME).parent().children("span").text(GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["max"] - GLOBALS.ITEMS_COUNT[GLOBALS.ITEM_HOLDED_NAME]["count"])
            } else {
                alert("Max Number of this item on the scene reached!");
                return;
            }

            //UPDATE INSTANCE DATA
            planeInstanceReset(
                userData,
                true,
                GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount,
                item,
                'open',
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('rotate'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('floor'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('ceiling'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('walls'),
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('instanced'),
                GLOBALS.ITEM_HOLDED_NAME,
                GLOBALS.DRAGGED_ITEM_ELEMENT.data('allowconnection'),
                false
            );

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var target = new Vector3(); // create once an reuse it

                if (loaded)
                    target = found.position;
                else
                    found[i].object.getWorldPosition(target);

                item.position.copy(target);
            } else {
                item.position.copy(userData.position);

                //PORTALS CAN NOT SPAWN ON ITEM POSITION
                GLOBALS.PLANE_USER_DATA[userData.id_instanced].portal = false;
                GLOBALS.PLANE_USER_DATA[userData.id_instanced].planeColor = 0x808080;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(userData.id_instanced, new Color(0x808080));
                GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
            }

            item.position.copy(userData.position);
            item.rotation.set(userData.normal.x, userData.normal.y, userData.normal.z)
            item.renderOrder = 2;
            item.name = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;

            if (GLOBALS.ITEM_HOLDED_NAME == "radio")
                item.translateY(0.5);

            if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "cube_2" ||
                GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube") {

                var idInstanced;
                userData.dispenser = true;
                item.translateY(1);

                for (var j = 0; j < GLOBALS.DYMANIC_ITEMS["dispenser"].length; j++) {
                    if (GLOBALS.DYMANIC_ITEMS["dispenser"][j].length == 0) {
                        GLOBALS.DYMANIC_ITEMS["dispenser"][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                var instanced2 = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
                var item2 = new Object3D();
                item2.position.copy(userData.position);

                //GET CEILING SURFACE
                for (var x = 0, j = 2; x < 100; x++, j += 2) {

                    var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                    if (boxTop.length > 0) {
                        boxTop[0].hasItem = true;
                        boxTop[0].itemName = "dispenser";
                        boxTop[0].item = item2;
                        item2.translateY(j);
                        break;
                    }
                }

                item.dispenserPosition = item2.position.clone();
                item.dispenserID = idInstanced;

                item2.item = item;
                item2.userData.id = idInstanced;

                if (loaded) {
                    if (userDataLoadedItem.hasDispenser)
                        item2.scale.set(1, 1, 1);
                    else
                        item2.scale.set(0, 0, 0);
                } else
                    item2.scale.set(1, 1, 1);

                item2.updateMatrix();
                instanced2.setMatrixAt(idInstanced, item2.matrix);
                instanced2.instanceMatrix.needsUpdate = true;
                instanced2.computeBoundingSphere();
            }

            if (GLOBALS.ITEM_HOLDED_NAME.includes("button")) {
                const geometryBox3 = new BoxGeometry(1, 0.5, 1);
                const materialBox3 = new MeshBasicMaterial({
                    color: 0x00ff00
                });
                const cube = new Mesh(geometryBox3, materialBox3);
                cube.position.copy(item.position);
                cube.rotation.copy(item.rotation);

                var bb = new Box3(); // for re-use
                bb.setFromObject(cube);

                if (userData.instancedName == "button_box") {
                    bb.accept = "cube-cube_2-laser_cube";
                } else if (userData.instancedName == "button_sphere") {
                    bb.accept = "sphere";
                } else if (userData.instancedName == "button_weight") {
                    bb.accept = "sphere-cube-player-laser_cube-cube_2";
                }

                userData.box3 = bb;
                item.userData.connectedTo = [];

                GLOBALS.LOADED_CONNECTIONS.push({
                    data: userDataLoadedItem,
                    item: userData
                });
            }

            //LASER EMITTER
            if (GLOBALS.ITEM_HOLDED_NAME == "laser_emitter") {
                laserEmitterRaycast(item, false, GLOBALS.LASER_EMITTER_RAYCASTER)
            } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_receiver" || GLOBALS.ITEM_HOLDED_NAME == "laser_relay" || GLOBALS.ITEM_HOLDED_NAME == "pellet_catcher") {
                item.userData.connectedTo = [];
                GLOBALS.LOADED_CONNECTIONS.push({
                    data: userDataLoadedItem,
                    item: userData
                });
            }

            item.initialPosition = item.position.clone();
            item.initialRotation = item.rotation.clone();

            if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate" && !loaded) {
                targetFaithPlateStart(item);
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "spawn") {
                GLOBALS.ITEMS_ADDED.add(item);
                item.translateY(1);
                item.rotation.x = -Math.PI;
                item.name = "spawn";
            } else if (GLOBALS.ITEM_HOLDED_NAME == "angled_panel") {
                GLOBALS.DYMANIC_ITEMS['angled_panel'].push(item)
                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "trigger_area") {

                GLOBALS.ITEMS_ADDED.add(item);
                item.translateY(1);

                var bb = new Box3(); // for re-use
                bb.setFromObject(item);

                bb.accept = "player";

                userData.box3 = bb;
                item.userData.connectedTo = [];

                GLOBALS.LOADED_CONNECTIONS.push({
                    data: userDataLoadedItem,
                    item: userData
                });

            } else if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
                item.scale.set(1, 1, 1);
                item.position.y += 0.65;
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.PORTAL_GUN_BOX.push(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "paint_gun") {
                item.scale.set(1, 1, 1);
                item.position.y += 0.65;
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.PORTAL_GUN_BOX.push(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "glass") {
                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "camera") {

                item.translateY(0.3)

                const geometry = new BoxGeometry(0.6, 0.6, 0.6);
                const material = new MeshBasicMaterial({ color: 0x00ff00 });
                const cube = new Mesh(geometry, material);
                cube.name = "camera";
                cube.visible = false;

                var holder = new Vector3();
                item.children[1].getWorldPosition(holder)
                holder.y -= 0.25;

                cube.position.copy(holder)
                GLOBALS.SCENE.add(cube);

                var bb = new Box3(); // for re-use
                bb.setFromObject(cube);
                item.box3 = bb;
                item.fixed = true;
                item.cube = cube;
                cube.item = item;

                GLOBALS.CAMERAS.push(item);
                GLOBALS.ITEMS_ADDED.add(item);

            } else if (GLOBALS.ITEM_HOLDED_NAME == "observation_room") {
                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
                item.translateY(0.025);

                /*var bb = new Box3(); // for re-use
                bb.setFromObject(item);
                bb.side = 1;
                bb.position = item.position;
                bb.item = item;

                GLOBALS.FAITH_PLATE_CONTACT_BOX.push(bb);

                item.traverse(child => {
                    if (child.name == "launch") {
                        GLOBALS.FAITH_PLATE_TO_ROTATE.push(child)
                    }
                })

                item.side = userData.side;
                GLOBALS.ITEMS_ADDED.add(item);*/

                item.traverse(child => {
                    if (child.name == "launch") {
                        item.ToRotate = child;
                        //GLOBALS.FAITH_PLATE_TO_ROTATE.push(child)
                    }
                })

                GLOBALS.DYMANIC_ITEMS['faith_plate'].push(item)
                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.DOORS.push(item)
            } else {
                var idInstanced;

                for (var j = 0; j < GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME].length; j++) {
                    if (GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME][j].length == 0) {
                        item.laser = false;
                        GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                if (GLOBALS.ITEM_HOLDED_NAME == "dispenser") {
                    //GET CEILING SURFACE
                    for (var x = 0, j = 2; x < 100; x++, j += 2) {

                        var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                        if (boxTop.length > 0) {
                            item.translateY(j);
                            break;
                        }
                    }
                }

                item.userData.id = idInstanced;
                item.userData.idInstanced = idInstanced;
                item.scale.set(1, 1, 1);
                item.updateMatrix();
                item.initialPosition = item.position.clone();
                instanced.setMatrixAt(idInstanced, item.matrix);

                if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_blue") {
                    instanced.setColorAt(idInstanced, new Color(0x0000ff));
                    instanced.instanceColor.needsUpdate = true;
                } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_orange") {
                    instanced.setColorAt(idInstanced, new Color(0xffa500));
                    instanced.instanceColor.needsUpdate = true;
                } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_white") {
                    instanced.setColorAt(idInstanced, new Color(0xffffff));
                    instanced.instanceColor.needsUpdate = true;
                }

                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();
            }

            itemCount++;

            if (loaded)
                manageItemVariablesLoaded(item, userDataLoadedItem, instanced, userData);
            else
                manageItemVariables(item, userData, instanced);

            //Update Connection Lines
            updateLines(userData, true);
        }
    }

    //if (loaded) {
    GLOBALS.ITEM_HOLDED_NAME = null;
    $("#follow").css("display", "none");
    //}

    window.changingPosition = false;
}

function manageItemVariables(item, userData, instanced) {
    item.userData.buttons = 0;
    item.userData.connections = 0;
    item.userData.opened = true;
    item.userData.instancedName = GLOBALS.ITEM_HOLDED_NAME;
    item.userData.planeInstancedId = userData.id_instanced;
    item.userData.lightColor = "#ffffff";
    item.userData.pedestalInfinity = true;
    item.userData.pedestalValue = 3;
    item.userData.friction = 0.4;
    item.userData.restitution = 0;

    if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
        item.userData.state = "all";
    } else if (GLOBALS.ITEM_HOLDED_NAME == "door" || GLOBALS.ITEM_HOLDED_NAME == "pedestal_button") {
        item.userData.rotationY = 0;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "cube_2" ||
        GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube") {
        item.userData.hasDispenser = true;
        item.userData.state = "open";
    } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_field") {
        item.userData.state = true;
        item.userData.triggers = GLOBALS.LASER_FIELD_TRIGGER;
        createLightBridges("laser_field", GLOBALS.LASER_FIELD_RAYCASTER, item, instanced, false);
        ContinuousTrigger(item, item.userData.triggers, $("#laser-field-trigger"), "laser_field");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "fizzler") {
        item.userData.state = true;
        item.userData.triggers = GLOBALS.FIZZLER_TRIGGER;
        createLightBridges("fizzler", GLOBALS.FIZZLER_RAYCASTER, item, instanced, false);
        ContinuousTrigger(item, item.userData.triggers, $("#laser-field-trigger"), "fizzler");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "light_bridge") {
        item.userData.state = true;
        item.userData.triggers = GLOBALS.LIGHT_BRIDGE_TRIGGER;
        createLightBridges("light_bridge", GLOBALS.LIGHT_BRIDGE_RAYCASTER, item, null, false);
        ContinuousTrigger(item, item.userData.triggers, $("#light-bridge-trigger"), "light_bridge");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "glass") {
        item.userData.state = true;
        item.userData.triggers = GLOBALS.GLASS_TRIGGER;
        item.userData.grid = GLOBALS.GRID_STATE;
        createLightBridges("glass", GLOBALS.GLASS_RAYCASTER, item, null, false);
        ContinuousTrigger(item, item.userData.triggers, $("#glass-trigger"), "glass");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "tractor_beam") {
        item.userData.state = true;
        item.userData.reversed = false;
        item.userData.triggers = "State";
        createLightBridges("tractor_beam", GLOBALS.TRACTOR_BEAM_RAYCASTER, item, null, false);
    } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_emitter") {
        item.userData.state = true;
        item.userData.triggers = GLOBALS.LASER_EMITTER_TRIGGER;
        laserEmitterPosition(item, item.userData.triggers, $("#laser_emitter-trigger"), "laser_emitter");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_receiver") {
        item.userData.state = false;
        item.userData.triggers = GLOBALS.LASER_RECEIVER_TRIGGER;
        laserEmitterPosition(item, item.userData.triggers, $("#laser_receiver-trigger"), "laser_receiver");
    }
}

function manageItemVariablesLoaded(item, userDataLoadedItem, instanced, userData) {
    item.userData.buttons = userDataLoadedItem.buttons;
    item.userData.connections = 0;//userDataLoadedItem.connections
    item.userData.opened = userDataLoadedItem.opened;
    item.userData.instancedName = userDataLoadedItem.instancedName;
    item.userData.planeInstancedId = userDataLoadedItem.planeInstancedId;
    item.userData.lightColor = userDataLoadedItem.lightColor;
    item.userData.pedestalInfinity = userDataLoadedItem.pedestalInfinity;
    item.userData.pedestalValue = userDataLoadedItem.pedestalValue;
    item.userData.friction = userDataLoadedItem.friction;
    item.userData.restitution = userDataLoadedItem.restitution;

    if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
        item.userData.state = userDataLoadedItem.state;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {
        item.userData.rotationY = userDataLoadedItem.rotationY;
        item.rotation.y = item.userData.rotationY;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "pedestal_button") {

        item.userData.rotationY = userDataLoadedItem.rotationY;
        var instanced2 = GLOBALS.ITEMS_ADDED.getObjectByName("pedestal_button");

        var dummy = new Object3D();
        dummy.position.copy(item.position);
        dummy.rotation.copy(item.rotation);

        dummy.rotation.y = item.userData.rotationY;

        dummy.updateMatrix();
        instanced2.setMatrixAt(item.userData.id, dummy.matrix)

        instanced2.instanceMatrix.needsUpdate = true;
        instanced2.computeBoundingSphere();

        item.rotation.copy(dummy.rotation);
    } else if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "cube_2" ||
        GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube") {
        item.userData.hasDispenser = userDataLoadedItem.hasDispenser;
        item.userData.state = userDataLoadedItem.state;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_field") {
        item.userData.state = userDataLoadedItem.state;
        item.userData.triggers = userDataLoadedItem.triggers;
        createLightBridges("laser_field", GLOBALS.LASER_FIELD_RAYCASTER, item, instanced, false);
        ContinuousTrigger(item, item.userData.triggers, $("#laser-field-trigger"), "laser_field");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "fizzler") {
        item.userData.state = userDataLoadedItem.state;
        item.userData.triggers = userDataLoadedItem.triggers;
        createLightBridges("fizzler", GLOBALS.FIZZLER_RAYCASTER, item, instanced, false);
        ContinuousTrigger(item, item.userData.triggers, $("#laser-field-trigger"), "fizzler");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "light_bridge") {
        item.userData.state = userDataLoadedItem.state;
        item.userData.triggers = userDataLoadedItem.triggers;
        createLightBridges("light_bridge", GLOBALS.LIGHT_BRIDGE_RAYCASTER, item, null, false);
        ContinuousTrigger(item, item.userData.triggers, $("#light-bridge-trigger"), "light_bridge");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "glass") {
        item.userData.state = true;
        item.userData.triggers = userDataLoadedItem.triggers;
        item.userData.grid = userDataLoadedItem.grid;
        createLightBridges("glass", GLOBALS.GLASS_RAYCASTER, item, null, false);
        ContinuousTrigger(item, item.userData.triggers, $("#glass-trigger"), "glass");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "tractor_beam") {
        item.userData.state = userDataLoadedItem.state;
        item.userData.reversed = userDataLoadedItem.reversed;
        item.userData.triggers = userDataLoadedItem.triggers;
        createLightBridges("tractor_beam", GLOBALS.TRACTOR_BEAM_RAYCASTER, item, null, false);
    } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_emitter") {
        item.userData.state = userDataLoadedItem.state;
        item.userData.triggers = userDataLoadedItem.triggers;
        laserEmitterPosition(item, item.userData.triggers, $("#laser_emitter-trigger"), "laser_emitter");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "laser_receiver") {
        item.userData.state = false;//userDataLoadedItem.state
        item.userData.triggers = userDataLoadedItem.triggers;
        laserEmitterPosition(item, item.userData.triggers, $("#laser_receiver-trigger"), "laser_receiver");
    } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
        item.userData.state = userDataLoadedItem.state;
        item.userData.target = userDataLoadedItem.target;

        GLOBALS.FAITH_PLATE_TARGET = item;

        const dummy = new Object3D();
        dummy.position.copy(userDataLoadedItem.targetPos);
        dummy.rotation.copy(userDataLoadedItem.targetRot);

        targetFaithPlateUpdate(dummy)
        targetFaithPlateEnd(dummy, userDataLoadedItem.height);
    } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_recharger") {
        item.userData.gel = userDataLoadedItem.gel;
        gelRecharger(item.userData.gel, item)
    }
}

function clickItem(elem) {
    GLOBALS.ITEM_HOLDED_NAME = elem.data("name");
    $("#follow").attr("src", elem.attr("src"));
    GLOBALS.DRAGGED_ITEM_ELEMENT = elem;
}

export {
    addItem,
    clickItem,
    updateLines
}