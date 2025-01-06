import {
    Vector3, Group, MeshBasicMaterial, CircleGeometry, Mesh, TextureLoader,
    BoxGeometry, Color, Object3D, Box3, ConeGeometry, PlaneGeometry,
    MeshStandardMaterial,
} from 'three';
import { AddGoo } from '../goo/Goo.js';
import { GLOBALS } from '../../Globals.js';
import { findPath } from '../findPath/FindPath.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { createLightBridges } from '../continuous/Continuous.js';
import { ContinuousTrigger } from '../continuous/Continuous.js';
import { getPlaneByName } from '../../Utils.js';
import $ from 'jquery';
import { planeInstanceReset } from './Items.js';
import { laserEmitterRaycast, laserEmitterPosition } from '../lasers/Laser.js';
import { targetFaithPlateStart, targetFaithPlateEnd, targetFaithPlateUpdate } from '../faithPlate/FaithPlate.js';
import { gelRecharger } from '../gels/PaintingGun.js';
import { addLine, manageConnection } from '../boxSelection/Connection.js';
import { load3D, loadAvatar } from '../loadObj/LoaderOBJ.js';
import { playVoiceTrigger } from '../triggers/Triggers.js';
import { checkToUpdateContinuous } from '../cubeManager/UpdateRaycast.js';
import { viewFPS } from '../test/Test.js';
import { managePlatformRange } from '../platforms/Platform.js';

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
                const line = addLine(GLOBALS.CONNECTIONS[j]["from"], GLOBALS.CONNECTIONS[j]["to"].position);
                GLOBALS.SCENE_CHILDREN.add(line);
                GLOBALS.CONNECTIONS[j]["line"] = line;

            } else if (GLOBALS.CONNECTIONS[j]["to"] == window.changingPositionPlane) {

                GLOBALS.CONNECTIONS[j]["to"] = userData;

                if (instanced)
                    GLOBALS.CONNECTIONS[j]["to"].item.userData.connections += 1;

                var endPos, clone;

                for (var i = 0; i < 10; i++) {

                    clone = userData.item.checkersSlots[i]

                    if (!clone.visible) {

                        clone.visible = true;
                        endPos = clone.position;

                        window.checkers.instances[GLOBALS.CONNECTIONS[j]["checker"]].position.copy(endPos);
                        window.checkers.instances[GLOBALS.CONNECTIONS[j]["checker"]].updateMatrix(); // necessary after transformations
                        window.checkers.computeBoundingSphere();
                        GLOBALS.CONNECTIONS[j]["clone"] = clone;

                        break;
                    }
                }

                //

                GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[j]["line"]);
                const line = addLine(GLOBALS.CONNECTIONS[j]["from"], endPos);
                GLOBALS.SCENE_CHILDREN.add(line);
                GLOBALS.CONNECTIONS[j]["line"] = line;
            }
        }
    }
}

const textureLoader = new TextureLoader();
const trigger_border = textureLoader.load('./assets/textures/trigger_border.png');
const trigger_connection = textureLoader.load('./assets/textures/trigger_connection.png');
const trigger_save = textureLoader.load('./assets/textures/trigger_save.png');
const trigger_voice = textureLoader.load('./assets/textures/trigger_voice.png');
const trigger_audio = textureLoader.load('./assets/textures/trigger_audio.png');
const falling = textureLoader.load('./assets/textures/falling.png');

async function addItem(found, loaded) {

    if (loaded) {
        GLOBALS.ITEM_HOLDED_NAME = found.itemName.split('-')[0];
        GLOBALS.DRAGGED_ITEM_ELEMENT = $("#" + GLOBALS.ITEM_HOLDED_NAME)
    }

    if (!GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME)
        && GLOBALS.ITEM_HOLDED_NAME != "glass"
        && GLOBALS.ITEM_HOLDED_NAME != "trigger_area"
        && GLOBALS.ITEM_HOLDED_NAME != "trigger_save"
        && GLOBALS.ITEM_HOLDED_NAME != "trigger_voice"
        && GLOBALS.ITEM_HOLDED_NAME != "trigger_audio"
        && GLOBALS.ITEM_HOLDED_NAME != "spawn"
        && GLOBALS.ITEM_HOLDED_NAME != "goo"
        && GLOBALS.ITEM_HOLDED_NAME != "door") {

        $("#follow").css("display", "none");

        await load3D(
            "/items/" + GLOBALS.ITEM_HOLDED_NAME + ".glb",
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

        if (userData.hasGoo) {
            alert("Already has goo!")
            return;
        }

        userData.hasItem = true;
        userData.hasGoo = true;
        userData.itemName = "goo";

        const geometry = new BoxGeometry(1.98, 2, 1.98);
        const box = new Mesh(geometry, new MeshBasicMaterial({
            color: new Color("rgb(150,75,0)"),
            side: 2,
            transparent: true,
            opacity: 0.5,
            map: trigger_border
        }));

        box.position.copy(userData.position);
        box.translateY(1)
        GLOBALS.SCENE.add(box);
        userData.item = box;

        const geometryPlane = new PlaneGeometry(2, 2);
        const materialPlane = new MeshBasicMaterial({
            color: new Color("rgb(150,75,0)"),
            map: falling,
            side: 2,
            depthTest: false,
            transparent: true
        });
        const plane = new Mesh(geometryPlane, materialPlane);
        box.add(plane);

        AddGoo(userData);
        window.totalItemsLoaded++;

        return;
    }

    const i = 0;

    if (GLOBALS.CONNECTING) {

        var target = GLOBALS.PLANE_USER_DATA[found[i].instanceId];

        GLOBALS.SELECTED_FOR_CONNECTION.trigger = target;
        GLOBALS.SELECTED_FOR_CONNECTION.normal = found[i].normal;

        findPath(GLOBALS.SELECTED_FOR_CONNECTION.position, target.position, found[i])
    } else {

        var userData, userDataLoadedItem;

        if (loaded) {
            userData = found;
            userDataLoadedItem = userData.item;
        } else if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "cube_2" ||
            GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube" ||
            GLOBALS.ITEM_HOLDED_NAME == "scale_cube") {

            userData = GLOBALS.PLANE_USER_DATA[found[i].instanceId];

            //GET CEILING SURFACE
            for (var x = 0, j = 2; x < 100; x++, j += 2) {

                var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                if (boxTop.length > 0) {
                    userData = boxTop[0];
                    break;
                }
            }
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
            } else if (GLOBALS.ITEM_HOLDED_NAME.includes("trigger")) {

                const geometry = new BoxGeometry(1.98, 2, 1.98);
                const box = new Mesh(geometry, new MeshBasicMaterial({
                    color: new Color($("#" + GLOBALS.ITEM_HOLDED_NAME).data("color")),
                    side: 2,
                    transparent: true,
                    opacity: 0.5,
                    map: trigger_border

                }));
                box.userData.multipleTrigger = false;
                box.userData.triggerVisibility = true;
                box.userData.soundEffect = null;
                box.userData.soundEffectLoop = false;
                box.userData.link = null;

                //
                var map;
                if (GLOBALS.ITEM_HOLDED_NAME == "trigger_area")
                    map = trigger_connection;
                else if (GLOBALS.ITEM_HOLDED_NAME == "trigger_save")
                    map = trigger_save;
                else if (GLOBALS.ITEM_HOLDED_NAME == "trigger_voice")
                    map = trigger_voice;
                else if (GLOBALS.ITEM_HOLDED_NAME == "trigger_audio")
                    map = trigger_audio;

                const geometryPlane = new PlaneGeometry(1, 1);
                const materialPlane = new MeshBasicMaterial({
                    color: new Color($("#" + GLOBALS.ITEM_HOLDED_NAME).data("color")),
                    map: map,
                    transparent: true,
                    side: 2,
                    opacity: 0.5,
                    depthWrite: false
                });
                const plane = new Mesh(geometryPlane, materialPlane);
                box.add(plane);

                //
                var item = box;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "paint_gun") {
                var item = GLOBALS.PAINT_GUN.clone();
                item.name = "paint_gun";
                item.visible = true;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "glass") {
                const box = new Object3D()
                var item = box;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
                item.visible = true;
                item.traverse(child => {
                    if (child.name == "horizontal")
                        GLOBALS.CAMERA_OBJ_HORIZONTAL.push(child)
                    else if (child.name == "vertical")
                        GLOBALS.CAMERA_OBJ_VERTICAL.push(child)
                })
            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
                item.visible = true;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
                item.visible = true;
            } else if (GLOBALS.ITEM_HOLDED_NAME == "observation_room") {
                var item = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {

                var item = new Group();

                const geometry = new CircleGeometry(1, 10);
                const material = new MeshBasicMaterial({ color: new Color(0, 2, 5), transparent: true, opacity: 0.5 });
                const circle = new Mesh(geometry, material);
                circle.rotation.x = -Math.PI / 2;
                circle.name = "circle_rotation";
                item.add(circle);
                circle.translateZ(0.01);

                const door = SkeletonUtils.clone(GLOBALS.ENTER_DOOR);
                door.remove(door.getObjectByName("trigger"))
                door.remove(door.getObjectByName("fizzler"))
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
                item.visible = true;
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

            if (GLOBALS.ITEM_HOLDED_NAME == "piston_platforms" || GLOBALS.ITEM_HOLDED_NAME == "track_platforms") {

                const pivot = new Group();
                pivot.scale.y = 0;
                GLOBALS.ITEMS_ADDED.add(pivot);
                pivot.position.copy(userData.position);

                const geometry = new BoxGeometry(2, 2, 2);
                const box = new Mesh(geometry, new MeshStandardMaterial({
                    color: new Color(0, 2, 0),
                    envMap: GLOBALS.ENV_MAP,
                    emissiveIntensity: 1,
                    transparent: true,
                    opacity: 0.5
                }));

                if (GLOBALS.ITEM_HOLDED_NAME == "track_platforms") {
                    if (userData.side == "front") {
                        pivot.rotation.z = -Math.PI / 2;
                        pivot.translateZ(1);
                    } else if (userData.side == "back") {
                        pivot.rotation.z = -Math.PI / 2;
                        pivot.translateZ(-1);
                    } else if (userData.side == "left") {
                        pivot.rotation.x = Math.PI / 2;
                        pivot.translateX(1);
                    } else if (userData.side == "right") {
                        pivot.rotation.x = Math.PI / 2;
                        pivot.translateX(-1);
                    }
                }

                pivot.add(box);
                box.position.y = 1.01;
                box.side = userData.side;
                box.name = GLOBALS.ITEM_HOLDED_NAME;
                item.platformBox = box;
                item.initialPosition = userData.position;
                item.userData.isActive = true;
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "pellet_launcher") {
                item.userData.isActive = true;
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

            item.position.copy(userData.position);

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                if (userData.side == "back" && userData.normal.y == 0)
                    item.rotation.set(userData.normal.x, Math.PI, userData.normal.z)
                else
                    item.rotation.set(userData.normal.x, userData.normal.y, userData.normal.z)
            } else {
                item.rotation.set(userData.normal.x, userData.normal.y, userData.normal.z)
            }



            item.renderOrder = 2;
            item.name = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;

            if (GLOBALS.ITEM_HOLDED_NAME == "radio" || GLOBALS.ITEM_HOLDED_NAME == "trash")
                item.translateY(0.5);

            if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "cube_2" ||
                GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube" ||
                GLOBALS.ITEM_HOLDED_NAME == "scale_cube") {

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
                        boxTop[0].isInstanced = true;
                        boxTop[0].dispenserPosition = item2.position;
                        boxTop[0].dispenserID = idInstanced;
                        boxTop[0].instancedName = "dispenser";
                        item2.translateY(j);
                        break;
                    }
                }

                item.dispenserPosition = item2.position;
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

                if (item2.scale.x == 1)
                    instanced2.setVisibilityAt(idInstanced, true);

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
                    bb.accept = "cube-cube_2-laser_cube-scale_cube";
                } else if (userData.instancedName == "button_sphere") {
                    bb.accept = "sphere";
                } else if (userData.instancedName == "button_weight") {
                    bb.accept = "sphere-cube-player-laser_cube-cube_2-scale_cube";
                }

                userData.box3 = bb;
                item.userData.connectedTo = [];
                item.userData.showLines = true;

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
            } else if (GLOBALS.ITEM_HOLDED_NAME.includes("trigger")) {

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

                //if (GLOBALS.ITEM_HOLDED_NAME != "trigger_area") {
                GLOBALS.TRIGGER_BOXES.push(userData);
                //}

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
                item.traverse(child => {
                    if (child.name == "launch") {
                        item.ToRotate = child;
                    }
                })

                GLOBALS.DYMANIC_ITEMS['faith_plate'].push(item)
                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.DOORS.push(item)
            } else if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.PORTAL_GUN_BOX.push(item);
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
                instanced.setVisibilityAt(idInstanced, true);
                instanced.setMatrixAt(idInstanced, item.matrix);
                userData.isInstanced = true;

                if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_blue")
                    instanced.setColorAt(idInstanced, new Color(0x0000ff));
                else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_orange")
                    instanced.setColorAt(idInstanced, new Color(0xffa500));
                else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_white")
                    instanced.setColorAt(idInstanced, new Color(0xffffff));

                instanced.computeBoundingSphere();
                instanced.dispose();
                instanced.instanceMatrix.needsUpdate = true;
            }

            itemCount++;

            if (loaded)
                manageItemVariablesLoaded(item, userDataLoadedItem, instanced, userData);
            else
                manageItemVariables(item, userData, instanced);

            //Update Connection Lines
            window.totalItemsLoaded++;
            addConnectionPoints(userData);
            updateLines(userData, true);

            if (window.totalItemsToLoad == window.totalItemsLoaded) {
                //CONNECTIONS

                for (var g = 0; g < GLOBALS.LOADED_CONNECTIONS.length; g++) {
                    for (var h = 0; h < GLOBALS.LOADED_CONNECTIONS[g]["data"].connectedTo.length; h++) {

                        GLOBALS.SELECTED_FOR_CONNECTION = GLOBALS.PLANE_USER_DATA[GLOBALS.LOADED_CONNECTIONS[g]["data"].planeInstancedId];

                        manageConnection(
                            GLOBALS.LOADED_CONNECTIONS[g]["data"].connectedTo[h],
                            GLOBALS.LOADED_CONNECTIONS[g]["item"]
                        );
                    }
                }

                if (GLOBALS.LOADED_LEVEL) {
                    $("#chamberName").css("opacity", 1);
                    $("#chamberName").text($("#chamber-name-to-save").val() + "_by_" + $("#author-name-to-save").val());

                    $("#loading-parent").css("opacity", 1)
                    $("#loading-parent").css("pointer-events", "all")

                    if (GLOBALS.PLAYER_MODEL)
                        viewFPS();
                    else
                        loadAvatar();
                }
            }
        }
    }

    //if (loaded) {
    GLOBALS.ITEM_HOLDED_NAME = null;
    $("#follow").css("display", "none");
    //}

    window.changingPosition = false;
    checkToUpdateContinuous();
}

function manageItemVariables(item, userData, instanced) {
    item.userData.buttons = 0;
    item.userData.showLines = true;
    item.userData.connections = 0;
    item.userData.opened = true;
    item.userData.instancedName = GLOBALS.ITEM_HOLDED_NAME;
    item.userData.planeInstancedId = userData.id_instanced;
    item.userData.lightColor = "#ffffff";
    item.userData.pedestalInfinity = true;
    item.userData.pedestalValue = 3;
    item.userData.friction = 0.4;
    item.userData.restitution = 0;
    item.userData.rotationY = 0;
    item.userData.angle = 45;

    if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
        item.userData.state = "all";
    } else if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "cube_2" ||
        GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube" ||
        GLOBALS.ITEM_HOLDED_NAME == "scale_cube") {
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
    item.userData.showLines = userDataLoadedItem.showLines;
    item.userData.connections = 0;//userDataLoadedItem.connections
    item.userData.opened = userDataLoadedItem.opened;
    item.userData.instancedName = userDataLoadedItem.instancedName;
    item.userData.planeInstancedId = userDataLoadedItem.planeInstancedId;
    item.userData.lightColor = userDataLoadedItem.lightColor;
    item.userData.pedestalInfinity = userDataLoadedItem.pedestalInfinity;
    item.userData.pedestalValue = userDataLoadedItem.pedestalValue;
    item.userData.friction = userDataLoadedItem.friction;
    item.userData.restitution = userDataLoadedItem.restitution;


    item.userData.multipleTrigger = userDataLoadedItem.multipleTrigger;
    item.userData.triggerVisibility = userDataLoadedItem.triggerVisibility;
    item.userData.soundEffectLoop = userDataLoadedItem.soundEffectLoop;
    item.userData.link = userDataLoadedItem.link;

    item.userData.rotationY = userDataLoadedItem.rotationY;
    item.userData.angle = userDataLoadedItem.angle;

    item.userData.isActive = userDataLoadedItem.isActive;

    if (item.userData.link)
        playVoiceTrigger(item.userData, false);

    if (GLOBALS.ITEM_HOLDED_NAME == "track_platforms" || GLOBALS.ITEM_HOLDED_NAME == "piston_platforms") {
        item.platformBox.parent.scale.y = userDataLoadedItem.scaleY;
        item.userData.scaleY = userDataLoadedItem.scaleY;

        managePlatformRange(userDataLoadedItem.scaleY, userData);
    } else if (GLOBALS.ITEM_HOLDED_NAME == "portal_gun") {
        item.userData.state = userDataLoadedItem.state;
        item.rotation.y = item.userData.rotationY;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {
        item.rotation.y = item.userData.rotationY;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "angled_panel") {
        item.rotation.y = item.userData.rotationY;
        item.getObjectByName("pivot2").rotation.x = Math.PI / 180 * item.userData.angle;
    } else if (GLOBALS.ITEM_HOLDED_NAME == "pedestal_button" || GLOBALS.ITEM_HOLDED_NAME == "light"
        || GLOBALS.ITEM_HOLDED_NAME == "bed" || GLOBALS.ITEM_HOLDED_NAME == "toilet"
        || GLOBALS.ITEM_HOLDED_NAME == "desk" || GLOBALS.ITEM_HOLDED_NAME == "cabinet"
        || GLOBALS.ITEM_HOLDED_NAME == "sign" || GLOBALS.ITEM_HOLDED_NAME == "portal_0"
        || GLOBALS.ITEM_HOLDED_NAME == "portal_1") {

        item.userData.rotationY = userDataLoadedItem.rotationY;
        var instanced2 = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME);

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
        GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube" ||
        GLOBALS.ITEM_HOLDED_NAME == "scale_cube") {
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

function addConnectionPoints(userData) {
    userData.item.checkersSlots = [];

    const obj = new Object3D();
    obj.visible = false;

    if (userData.item.dispenserPosition) {
        obj.position.copy(userData.item.dispenserPosition);
    } else {
        obj.position.copy(userData.position);
    }

    obj.rotation.copy(userData.rotation);

    var clone = obj.clone();
    clone.translateX(0.9);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(0.9);
    clone.translateY(0.4);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(0.9);
    clone.translateY(0.8);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(0.9);
    clone.translateY(-0.4);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(0.9);
    clone.translateY(-0.8);
    userData.item.checkersSlots.push(clone);

    //
    var clone = obj.clone();
    clone.translateX(-0.9);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(-0.9);
    clone.translateY(0.4);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(-0.9);
    clone.translateY(0.8);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(-0.9);
    clone.translateY(-0.4);
    userData.item.checkersSlots.push(clone);

    var clone = obj.clone();
    clone.translateX(-0.9);
    clone.translateY(-0.8);
    userData.item.checkersSlots.push(clone);
}

export {
    addItem,
    clickItem,
    updateLines,
    addConnectionPoints
}