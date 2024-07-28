import {
    Object3D,
    Color,
    Vector3,
    PlaneGeometry,
    InstancedMesh
} from 'three';
import { GLOBALS } from '../../Globals.js';
import { getPlaneByName, warning } from '../../Utils.js';

var IndexArray = [];

function cubeState(button) {

    if (button == "plus") {
        //
        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
            trasnlatePlane(GLOBALS.SELECTED_ID[i], 1, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal);
        }
    } else if (button == "minus") {
        //
        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.y - 2 == 6 ||
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
            }

            trasnlatePlane(GLOBALS.SELECTED_ID[i], -1, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal);
        }
    }

    for (var i = 0; i < IndexArray.length; i++) {

        var erase = new Object3D();
        erase.scale.set(0, 0, 0);

        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(IndexArray[i], erase.matrix);
        GLOBALS.PLANE_USER_DATA[IndexArray[i]] = {};
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        GLOBALS.BUDGET += 1;
    }

    IndexArray = [];
}

function trasnlatePlane(id, val, portal) {

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
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

        var erase = new Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(id, erase.matrix);
        GLOBALS.PLANE_USER_DATA[id] = {};

        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(frontExists[0].id_instanced, new Color(0xffffff));
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

        //---------------------------------------
        var erase = new Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(frontExists[0].id_instanced, erase.matrix);
        GLOBALS.PLANE_USER_DATA[frontExists[0].id_instanced] = {};
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();
        //

        GLOBALS.BUDGET += 2;
    } else {

        GLOBALS.PLANE_USER_DATA[id].position = dummy.position.clone();
        GLOBALS.PLANE_USER_DATA[id].rotation = dummy.rotation.clone();
        GLOBALS.PLANE_USER_DATA[id].name = dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z;

        dummy.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(id, dummy.matrix)

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        if (GLOBALS.PLANE_USER_DATA[id].hasItem) {

            var plane = GLOBALS.PLANE_USER_DATA[id];

            if (GLOBALS.PLANE_USER_DATA[id].isInstanced) {
                var item = new Object3D();
                item.position.copy(plane.position);
                item.rotation.copy(plane.item.rotation);

                if (plane.instancedName == "cube" || plane.instancedName == "sphere") {
                    item.translateY(1);
                }

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

        if (portal)
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(idEmptyToFill, new Color().setHex(0xffffff));
        else
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(idEmptyToFill, new Color().setHex(0x808080));

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
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
            normal = new Vector3(0, 0, Math.PI / 2);
        else if (side == "left")
            normal = new Vector3(0, 0, -Math.PI / 2);

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
            normal: normal
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

    if (!GLOBALS.LOADED_LEVEL) {

        const geometry = new PlaneGeometry(2, 2);

        GLOBALS.PLANE_LEVEL_INSTANCED = new InstancedMesh(geometry.clone(), GLOBALS.MATERIAL_PORTAL_EDITOR, GLOBALS.BUDGET);
        GLOBALS.PLANE_LEVEL_INSTANCED.frustumCulled = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.castShadow = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.receiveShadow = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.name = "cube-parent";
        GLOBALS.CUBES.add(GLOBALS.PLANE_LEVEL_INSTANCED);

        var clone = new Object3D();

        for (var i = 0; i < GLOBALS.BUDGET; i++) {
            clone.scale.set(0, 0, 0);
            clone.position.set(100000, 100000, 100000);
            clone.updateMatrix();
            GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(i, clone.matrix);
        }

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
    }
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

            var portal;

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
                normal: normal
            }

            GLOBALS.BUDGET -= 1;

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