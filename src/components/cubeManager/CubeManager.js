import { Object3D, Color, Vector3, PlaneGeometry, BoxGeometry, MeshBasicMaterial, Mesh, Box3 } from 'three';
import { GLOBALS } from '../../Globals.js';
import { getPlaneByName, warning } from '../../Utils.js';
import { checkToUpdateContinuous } from './UpdateRaycast.js';
import { removeSelection } from '../boxSelection/BoxSelection.js';
import { addConnectionPoints, updateLines } from '../items/AddItem.js';
import { addLine } from '../boxSelection/Connection.js';
import { InstancedMesh2, createRadixSort } from '@three.ez/instanced-mesh';

var IndexArray = [];
var remove;
var sides = ["left", "right", "up", "down", "front", "back"];

function cubeState(button) {

    remove = false;

    if (button == "plus") {

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
            for (var j = 0; j < 6; j++) {
                var exists = checkSidesWithItems(i, 1, sides[j])
                if (exists) return;
            }
        }

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++)
            trasnlatePlane(GLOBALS.SELECTED_ID[i], 1, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]]);
    } else if (button == "minus") {

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
            for (var j = 0; j < 6; j++) {
                var exists = checkSidesWithItems(i, -1, sides[j])
                if (exists) return;
            }
        }

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

            /*if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.y - 2 == 20 ||
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.y - 2 == -30) {
                warning("You can not spawn more cubes on this direction");
                return;
            } else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.x == 28 ||
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.x == -12) {
                warning("You can not spawn more cubes on this direction");
                return;
            } else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.z == -14 ||
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.z == 26) {
                warning("You can not spawn more cubes on this direction");
                return;
            }*/

            trasnlatePlane(GLOBALS.SELECTED_ID[i], -1, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]]);
        }
    }

    for (var i = 0; i < IndexArray.length; i++) {

        var erase = new Object3D();
        erase.scale.set(0, 0, 0);

        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(IndexArray[i], erase.matrix);
        GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(IndexArray[i], false);
        GLOBALS.PLANE_USER_DATA[IndexArray[i]] = {};
        //GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        GLOBALS.BUDGET += 1;
    }

    IndexArray = [];

    checkToUpdateContinuous();

    if (remove)
        removeSelection();
}

function checkSidesWithItems(i, t, side) {

    var sideOther;

    var dummy = new Object3D();
    dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position);
    dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].rotation);
    dummy.translateZ(t);

    if (side == "left")
        dummy.rotation.set(0, Math.PI / 2, 0)
    else if (side == "right")
        dummy.rotation.set(0, -Math.PI / 2, 0)
    else if (side == "up")
        dummy.rotation.set(Math.PI / 2, 0, 0)
    else if (side == "down")
        dummy.rotation.set(-Math.PI / 2, 0, 0)
    else if (side == "front")
        dummy.rotation.set(0, 0, 0)
    else if (side == "back")
        dummy.rotation.set(0, Math.PI, 0)

    if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side == "left")
        sideOther = "right"
    else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side == "right")
        sideOther = "left"
    else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side == "up")
        sideOther = "down"
    else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side == "down")
        sideOther = "up"
    else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side == "front")
        sideOther = "back"
    else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side == "back")
        sideOther = "front"

    dummy.translateZ(t);
    dummy.position.copy(dummy.position.round());

    var sideExists = getPlaneByName(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z);

    if (sideExists.length > 0) {
        if ((sideExists[0].hasItem && GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].side != sideExists[0].side) ||
            (sideExists[0].side == sideOther && GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].hasItem)) {//GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].hasItem
            warning("Conflict!");
            return true;
        }
    }

    return false
}

function trasnlatePlane(id, val, portal, old) {

    var dummy = new Object3D();
    dummy.position.copy(GLOBALS.PLANE_USER_DATA[id].position);
    dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[id].rotation);

    //-----------------------------------------------------

    dummy.translateZ(val * 2);
    dummy.position.copy(dummy.position.round());

    var frontExists = getPlaneByName(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z);
    var clone = dummy.clone();

    clone.translateZ(-val * 2);

    if (GLOBALS.PLANE_USER_DATA[id].side == "front" || GLOBALS.PLANE_USER_DATA[id].side == "back") {
        checkSides(clone.clone(), val, id, "left", portal);
        checkSides(clone.clone(), val, id, "right", portal);
        checkSides(clone.clone(), val, id, "up", portal);
        checkSides(clone.clone(), val, id, "down", portal);
    } else if (GLOBALS.PLANE_USER_DATA[id].side == "up" || GLOBALS.PLANE_USER_DATA[id].side == "down") {
        checkSides(clone.clone(), val, id, "left", portal);
        checkSides(clone.clone(), val, id, "right", portal);
        checkSides(clone.clone(), val, id, "front", portal);
        checkSides(clone.clone(), val, id, "back", portal);
    } else if (GLOBALS.PLANE_USER_DATA[id].side == "left" || GLOBALS.PLANE_USER_DATA[id].side == "right") {
        checkSides(clone.clone(), val, id, "front", portal);
        checkSides(clone.clone(), val, id, "back", portal);
        checkSides(clone.clone(), val, id, "up", portal);
        checkSides(clone.clone(), val, id, "down", portal);
    }

    if (frontExists.length > 0) {

        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(id, new Color(0xffffff));

        var erase = new Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(id, erase.matrix);
        GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(id, false);
        GLOBALS.PLANE_USER_DATA[id] = {};

        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(frontExists[0].id_instanced, new Color(0xffffff));

        //---------------------------------------
        var erase = new Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(frontExists[0].id_instanced, erase.matrix);
        GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(frontExists[0].id_instanced, false);
        GLOBALS.PLANE_USER_DATA[frontExists[0].id_instanced] = {};
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        GLOBALS.BUDGET += 2;
        remove = true;
    } else {

        GLOBALS.PLANE_USER_DATA[id].position = dummy.position.clone();
        GLOBALS.PLANE_USER_DATA[id].rotation = dummy.rotation.clone();
        GLOBALS.PLANE_USER_DATA[id].name = dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z;

        dummy.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(id, dummy.matrix)
        GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(id, true)

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        if (GLOBALS.PLANE_USER_DATA[id].hasItem) {

            var plane = GLOBALS.PLANE_USER_DATA[id];

            for (var j = 0; j < GLOBALS.CONNECTIONS.length; j++) {

                if (GLOBALS.CONNECTIONS[j]["from"] == plane) {

                    GLOBALS.CONNECTIONS[j]["from"] = plane;
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[j]["line"]);
                    const line = addLine(GLOBALS.CONNECTIONS[j]["from"], GLOBALS.CONNECTIONS[j]["to"].position);
                    GLOBALS.SCENE_CHILDREN.add(line);
                    GLOBALS.CONNECTIONS[j]["line"] = line;

                    //UPDATE BOX3 TRIGGER
                    const geometryBox3 = new BoxGeometry(1, 0.5, 1);
                    const materialBox3 = new MeshBasicMaterial();
                    const cube = new Mesh(geometryBox3, materialBox3);
                    cube.position.copy(plane.position);
                    cube.rotation.copy(plane.rotation);

                    var bb = new Box3(); // for re-use
                    bb.setFromObject(cube);

                    if (plane.instancedName == "button_box") {
                        bb.accept = "cube-cube_2-laser_cube-scale_cube";
                    } else if (plane.instancedName == "button_sphere") {
                        bb.accept = "sphere";
                    } else if (plane.instancedName == "button_weight") {
                        bb.accept = "sphere-cube-player-laser_cube-cube_2-scale_cube";
                    }

                    plane.box3 = bb;

                } else if (GLOBALS.CONNECTIONS[j]["to"] == plane) {

                    GLOBALS.CONNECTIONS[j]["to"] = plane;
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[j]["line"]);
                    const line = addLine(GLOBALS.CONNECTIONS[j]["from"], GLOBALS.CONNECTIONS[j]["to"].position);
                    GLOBALS.SCENE_CHILDREN.add(line);
                    GLOBALS.CONNECTIONS[j]["line"] = line;
                }
            }

            if (GLOBALS.PLANE_USER_DATA[id].itemName == "gel") {

            } else if (GLOBALS.PLANE_USER_DATA[id].isInstanced) {
                plane.item.position.copy(plane.position);
                var item = new Object3D();
                item.position.copy(plane.position);
                item.rotation.copy(plane.item.rotation);

                if (plane.instancedName == "cube" || plane.instancedName == "sphere"
                    || plane.instancedName == "cube_2" || plane.instancedName == "laser_cube"
                    || plane.instancedName == "scale_cube") {

                    item.translateY(-1);

                    item.translateY(2);

                    //UPDATE DISPENSER
                    var item2 = new Object3D();
                    item2.position.copy(plane.position);
                    item2.updateMatrix();
                    GLOBALS.ITEMS_ADDED.getObjectByName("dispenser").setMatrixAt(plane.item.dispenserID, item2.matrix);
                    GLOBALS.ITEMS_ADDED.getObjectByName("dispenser").instanceMatrix.needsUpdate = true;

                    plane.item.dispenserPosition = item2.position.clone();
                }

                plane.item.initialPosition = item.position.clone();
                    plane.item.initialRotation = item.rotation.clone();



                item.updateMatrix();
                GLOBALS.ITEMS_ADDED.getObjectByName(plane.instancedName).setMatrixAt(plane.item.userData.id, item.matrix);
                GLOBALS.ITEMS_ADDED.getObjectByName(plane.instancedName).instanceMatrix.needsUpdate = true;
            } else {
                plane.item.position.copy(plane.position);
            }
        }
    }
}

function checkSides(dummy, val, id, side, portal) {

    dummy.translateZ(val);

    if (side == "left")
        dummy.rotation.set(0, Math.PI / 2, 0)
    else if (side == "right")
        dummy.rotation.set(0, -Math.PI / 2, 0)
    else if (side == "up")
        dummy.rotation.set(Math.PI / 2, 0, 0)
    else if (side == "down")
        dummy.rotation.set(-Math.PI / 2, 0, 0)
    else if (side == "front")
        dummy.rotation.set(0, 0, 0)
    else if (side == "back")
        dummy.rotation.set(0, Math.PI, 0)

    dummy.translateZ(val);
    dummy.position.copy(dummy.position.round());

    var sideExists = getPlaneByName(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z);

    if (sideExists.length == 0) { //if there is no face create one

        dummy.updateMatrix();

        // GET EMPTY ARRAY
        var idEmptyToFill;
        for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
            if (!GLOBALS.PLANE_USER_DATA[i].exists) {
                idEmptyToFill = i;
                break;
            }
        }

        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(idEmptyToFill, dummy.matrix);
        GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(idEmptyToFill, true);

        var planeColor = 0x808080;

        if (portal) {
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(idEmptyToFill, new Color().setHex(0xffffff));
            planeColor = 0xffffff;
        } else {
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(idEmptyToFill, new Color().setHex(0x808080));
        }

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        dummy.position.copy(dummy.position.round());

        var direction = new Vector3();
        dummy.getWorldDirection(direction);

        if (direction.round().z == 1)
            side = "front"
        else if (direction.round().z == -1)
            side = "back"
        else if (direction.round().x == 1)
            side = "left"
        else if (direction.round().x == -1)
            side = "right"
        else if (direction.round().y == 1)
            side = "down"
        else if (direction.round().y == -1)
            side = "up"

        var normal;

        if (side == "down")
            normal = new Vector3(0, 0, 0);
        else if (side == "up")
            normal = new Vector3(Math.PI, 0, 0);
        else if (side == "front")
            normal = new Vector3(Math.PI / 2, 0, 0);
        else if (side == "back")
            normal = new Vector3(-Math.PI / 2, 0, 0);
        else if (side == "right")
            normal = new Vector3(Math.PI / 2, 0, Math.PI / 2);
        else if (side == "left")
            normal = new Vector3(Math.PI / 2, 0, -Math.PI / 2);

        GLOBALS.PLANE_USER_DATA[idEmptyToFill] = {
            iniPos: dummy.position.clone(),
            base: true,
            side: side,
            name: dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z,
            selected: false,
            position: dummy.position.clone(),
            rotation: dummy.rotation.clone(),
            exists: true,
            id_instanced: idEmptyToFill,
            portal: portal,
            tile: 1,
            normal: normal,
            planeColor: planeColor
        };

        GLOBALS.BUDGET -= 1;
    } else { //if there is a face delete it
        IndexArray.push(sideExists[0].id_instanced);
    }
}

var a = 0;
GLOBALS.PLANE_USER_DATA = [];
for (var i = 0; i < GLOBALS.BUDGET; i++) {
    GLOBALS.PLANE_USER_DATA.push({})
}

function buildIniCubes(obj) {

    const geometry = new PlaneGeometry(2, 2);
    geometry.computeBoundsTree();

    GLOBALS.PLANE_LEVEL_INSTANCED = new InstancedMesh2(geometry, GLOBALS.MATERIAL_PORTAL_EDITOR);
    GLOBALS.PLANE_LEVEL_INSTANCED.sortObjects = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.customSort = createRadixSort(GLOBALS.PLANE_LEVEL_INSTANCED);

    GLOBALS.PLANE_LEVEL_INSTANCED.addInstances(GLOBALS.BUDGET, (obj, index) => {
        obj.visible = false;
    });

    GLOBALS.PLANE_LEVEL_INSTANCED.raycastOnlyFrustum = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.computeBVH();

    GLOBALS.PLANE_LEVEL_INSTANCED.frustumCulled = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.castShadow = false;
    GLOBALS.PLANE_LEVEL_INSTANCED.receiveShadow = false;
    GLOBALS.PLANE_LEVEL_INSTANCED.name = "cube-parent";
    GLOBALS.CUBES.add(GLOBALS.PLANE_LEVEL_INSTANCED);

    //GROUND
    buildLayer(-1, -1, 0, 'x', 'z', 'y', 6, 8, "down", new Vector3(-Math.PI / 2, 0, 0), new Vector3(0, 0, 0));
    //CEILING
    buildLayer(-1, -1, 8, 'x', 'z', 'y', 6, 8, "up", new Vector3(Math.PI / 2, 0, 0), new Vector3(Math.PI, 0, 0));
    //WALL FRONT
    buildLayer(-1, -1, 0, 'x', 'y', 'z', 4, 8, "front", new Vector3(0, 0, 0), new Vector3(Math.PI / 2, 0, 0));
    //WALL BACK
    buildLayer(-1, -1, 12, 'x', 'y', 'z', 4, 8, "back", new Vector3(0, Math.PI, 0), new Vector3(-Math.PI / 2, Math.PI, 0));
    //WALL RIGHT
    buildLayer(-1, -1, 16, 'z', 'y', 'x', 4, 6, "right", new Vector3(0, -Math.PI / 2, 0), new Vector3(Math.PI / 2, 0, Math.PI / 2));
    //WALL LEFT
    buildLayer(-1, -1, 0, 'z', 'y', 'x', 4, 6, "left", new Vector3(0, Math.PI / 2, 0), new Vector3(Math.PI / 2, 0, -Math.PI / 2));

    GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
    GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

}

function buildLayer(x, y, z, x2, y2, z2, height, width, side, rot, normal) {

    var yo = y;

    var clone = new Object3D();

    for (var i = 0; i < width; i++) {

        x += 2;

        for (var j = 0; j < height; j++) {

            y += 2;

            clone.rotation.set(rot.x, rot.y, rot.z);
            clone.scale.set(1, 1, 1);

            clone.position[x2] = x;
            clone.position[y2] = y;
            clone.position[z2] = z;

            clone.updateMatrix();
            GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(a, clone.matrix);
            GLOBALS.PLANE_LEVEL_INSTANCED.setVisibilityAt(a, true);

            var portal;
            var planeColor = 0x808080;

            if (clone.position.x <= 5 && clone.position.z >= 7 && clone.position.y <= 5) {
                portal = false;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new Color().setHex(0x808080));
            } else if (clone.position.x >= 10 && clone.position.z <= 1 && clone.position.y <= 3) {
                portal = false;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new Color().setHex(0x808080));
            } else if (clone.position.y == 8) {
                portal = false;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new Color().setHex(0x808080));
            } else {
                portal = true;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new Color().setHex(0xffffff));
                planeColor = 0xffffff;
            }

            var hasItem = false;
            var itemName = null;
            var canRotate = false;
            var floor = false;
            var ceiling = false;
            var walls = false;
            var item = null;
            var allowconnection = false;

            if (clone.position.equals(new Vector3(3, 1, 12))) {
                hasItem = true;
                itemName = "enterDoor";
                walls = true;
                item = GLOBALS.ENTER_DOOR;
                allowconnection = true;
            } else if (clone.position.equals(new Vector3(13, 1, 0))) {
                hasItem = true;
                itemName = "exitDoor";
                walls = true;
                item = GLOBALS.EXIT_DOOR;
                allowconnection = true;
            } else if (clone.position.equals(new Vector3(16, 7, 7))) {
                hasItem = true;
                itemName = "window";
                walls = true;
                item = GLOBALS.OBSERVATION_ROOM_IMG;
            }

            //ADD USERDATA TO ARRAY LINKED WITH THE INSTANCED ID
            clone.position.copy(clone.position.round());
            GLOBALS.PLANE_USER_DATA[a] = {
                iniPos: clone.position.clone(),
                base: true,
                side: side,
                name: clone.position.x + "/" + clone.position.y + "/" + clone.position.z,
                selected: false,
                position: clone.position.clone(),
                rotation: clone.rotation.clone(),
                exists: true,
                id_instanced: a,
                portal: portal,
                tile: 1,
                hasItem: hasItem,
                itemName: itemName,
                merged: false,
                checked: false,

                canRotate: canRotate,
                floor: floor,
                walls: walls,
                ceiling: ceiling,
                isInstanced: false,
                item: item,
                allowconnection: allowconnection,
                connected: [],
                idConnection: [],
                line: [],
                normal: normal,
                planeColor: planeColor,
                connectionPoints: []
            }

            GLOBALS.BUDGET -= 1;

            if (itemName == "exitDoor") {
                addConnectionPoints(GLOBALS.PLANE_USER_DATA[a]);
            }

            a++;
        }

        y = yo;
    }

    GLOBALS.RENDERER.renderLists.dispose();
}

export {
    buildIniCubes,
    cubeState
};