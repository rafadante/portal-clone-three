import * as THREE from 'three';
import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';

var limit = false;
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

            /*if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.y - 2 == 22 ||
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.y - 2 == -16) {
                warning();
                return;
            } else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.x == 28 ||
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.x == -12) {
                warning();
                return;
            } else if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.z == -14 ||
                GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].position.z == 26) {
                warning();
                return;
            }*/

            trasnlatePlane(GLOBALS.SELECTED_ID[i], -1, GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal);
        }
    }

    for (var i = 0; i < IndexArray.length; i++) {

        var erase = new THREE.Object3D();
        erase.scale.set(0, 0, 0);

        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(IndexArray[i], erase.matrix);
        GLOBALS.PLANE_USER_DATA[IndexArray[i]] = {};
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        GLOBALS.BUDGET += 1;
    }

    if (limit) {
        GLOBALS.SELECTED_SIDE = null;
        GLOBALS.SELECTING = false;
        GLOBALS.SELECTED_ID = [];
        GLOBALS.SELECTED_COLOR = [];
    }

    IndexArray = [];
    limit = false;

    $("#budget").text("BUDGET: " + GLOBALS.BUDGET);

    if (GLOBALS.BUDGET < 900 && GLOBALS.BUDGET >= 300) {
        $("#budget").css("background-color", "yellow");
    } else if (GLOBALS.BUDGET < 300) {
        $("#budget").css("background-color", "red");
    }
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

function trasnlatePlane(id, val, portal) {

    var dummy = new THREE.Object3D();
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

        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(id, new THREE.Color(0xffffff));
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

        var erase = new THREE.Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(id, erase.matrix);
        GLOBALS.PLANE_USER_DATA[id] = {};

        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(frontExists[0].id_instanced, new THREE.Color(0xffffff));
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

        //---------------------------------------
        var erase = new THREE.Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(frontExists[0].id_instanced, erase.matrix);
        GLOBALS.PLANE_USER_DATA[frontExists[0].id_instanced] = {};
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();
        //
        limit = true;

        GLOBALS.BUDGET += 2;
    } else {

        GLOBALS.PLANE_USER_DATA[id].position = dummy.position.clone();
        GLOBALS.PLANE_USER_DATA[id].rotation = dummy.rotation.clone();
        GLOBALS.PLANE_USER_DATA[id].name = dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z;

        dummy.updateMatrix();
        GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(id, dummy.matrix)

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

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
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(idEmptyToFill, new THREE.Color().setHex(0xffffff));
        else
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(idEmptyToFill, new THREE.Color().setHex(0x808080));

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceMatrix.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.computeBoundingSphere();

        dummy.position.copy(dummy.position.round());

        var direction = new THREE.Vector3();
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
        };

        GLOBALS.BUDGET -= 1;

    } else { //if there is a face delete it
        IndexArray.push(sideExists[0].id_instanced);
    }
}

function warning() {
    $("#warning").css("opacity", 1);
    setTimeout(() => {
        $("#warning").css("opacity", 0);
    }, 2000);
}

var a = 0;
GLOBALS.PLANE_USER_DATA = [];
for (var i = 0; i < GLOBALS.BUDGET; i++) {
    GLOBALS.PLANE_USER_DATA.push({})
}

function buildIniCubes(obj) {

    if (!GLOBALS.LOADED_LEVEL) {

        const geometry = new THREE.PlaneGeometry(2, 2);

        GLOBALS.PLANE_LEVEL_INSTANCED = new THREE.InstancedMesh(geometry.clone(), GLOBALS.MATERIAL_PORTAL_EDITOR, GLOBALS.BUDGET);
        GLOBALS.PLANE_LEVEL_INSTANCED.frustumCulled = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.castShadow = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.receiveShadow = true;
        GLOBALS.PLANE_LEVEL_INSTANCED.name = "cube-parent";
        GLOBALS.CUBES.add(GLOBALS.PLANE_LEVEL_INSTANCED);

        var clone = new THREE.Object3D();

        for (var i = 0; i < GLOBALS.BUDGET; i++) {
            clone.scale.set(0, 0, 0);
            clone.position.set(100000, 100000, 100000);
            clone.updateMatrix();
            GLOBALS.PLANE_LEVEL_INSTANCED.setMatrixAt(i, clone.matrix);
        }

        //GROUND
        buildLayer(-1, -1, 0, 'x', 'z', 'y', 6, 10, "down", new THREE.Vector3(-Math.PI / 2, 0, 0));
        //CEILING
        buildLayer(-1, -1, 8, 'x', 'z', 'y', 6, 10, "up", new THREE.Vector3(Math.PI / 2, 0, 0));
        //WALL FRONT
        buildLayer(-1, -1, 0, 'x', 'y', 'z', 4, 10, "front", new THREE.Vector3(0, 0, 0));
        //WALL BACK
        buildLayer(-1, -1, 12, 'x', 'y', 'z', 4, 10, "back", new THREE.Vector3(0, Math.PI, 0));
        //WALL RIGHT
        buildLayer(-1, -1, 20, 'z', 'y', 'x', 4, 6, "right", new THREE.Vector3(0, -Math.PI / 2, 0));
        //WALL LEFT
        buildLayer(-1, -1, 0, 'z', 'y', 'x', 4, 6, "left", new THREE.Vector3(0, Math.PI / 2, 0));

        $("#budget").text("BUDGET: " + GLOBALS.BUDGET);
    }
}

$("body").on('click', '#save-level', function () {

    var data = [];
    var clone = [];

    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[i].item) {
            var obj = new THREE.Object3D();
            obj.position.copy(GLOBALS.PLANE_USER_DATA[i].item.position);
            obj.rotation.copy(GLOBALS.PLANE_USER_DATA[i].item.rotation);
            obj.planeInstancedId = GLOBALS.PLANE_USER_DATA[i].item.planeInstancedId;
            obj.userData = GLOBALS.PLANE_USER_DATA[i].item.userData;
            GLOBALS.PLANE_USER_DATA[i].item = obj;
        }

        if (GLOBALS.PLANE_USER_DATA[i].trigger) {
            var obj = new THREE.Object3D();
            obj.position.copy(GLOBALS.PLANE_USER_DATA[i].trigger.position);
            obj.rotation.copy(GLOBALS.PLANE_USER_DATA[i].trigger.rotation);
            obj.id_instanced = GLOBALS.PLANE_USER_DATA[i].trigger.id_instanced;
            // obj.userData = GLOBALS.PLANE_USER_DATA[i].trigger.userData;
            GLOBALS.PLANE_USER_DATA[i].trigger = GLOBALS.PLANE_USER_DATA[i].trigger.id_instanced;
        }
    }


    data.push(GLOBALS.PLANE_USER_DATA)
    data.push(GLOBALS.GOO_PLANES)

    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "scene.json");
    dlAnchorElem.click();
})

function buildLayer(x, y, z, x2, y2, z2, height, width, side, rot) {

    var yo = y;

    var clone = new THREE.Object3D();

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
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else if (clone.position.x >= 10 && clone.position.z <= 1 && clone.position.y <= 3) {
                portal = false;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else if (clone.position.y == 8) {
                portal = false;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else {
                portal = false;
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(a, new THREE.Color().setHex(0x808080));
            }

            var hasItem = false;
            var itemName = null;

            if (clone.position.equals(new THREE.Vector3(3, 1, 12))) {
                hasItem = true;
                itemName = "enterDoor";
            } else if (clone.position.equals(new THREE.Vector3(13, 1, 0))) {
                hasItem = true;
                itemName = "exitDoor";
            } else if (clone.position.equals(new THREE.Vector3(20, 7, 7)) ||
                clone.position.equals(new THREE.Vector3(20, 7, 5))) {
                hasItem = true;
                itemName = "window";
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
                checked: false
            }

            GLOBALS.BUDGET -= 1;

            a++;
        }

        y = yo;
    }

    GLOBALS.RENDERER.renderLists.dispose();
}

//
$("#main-container").on('click', '#plus-portal', function () {
    cubeState("plus");
    document.querySelector('.menu').classList.remove('menu-show')
})

$("body").on('click', '#minus-portal', function () {
    cubeState("minus");
    document.querySelector('.menu').classList.remove('menu-show')
})

$("body").on('click', '#portalable', function () {

    if (GLOBALS.SELECTED_ID.length > 0) {
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].portal = !GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].portal;

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].portal;

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new THREE.Color(0xffffff));
            else
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new THREE.Color(0x808080));

            GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        }
    }

    document.querySelector('.menu').classList.remove('menu-show');
})

window.addEventListener("contextmenu", e => e.preventDefault());

export {
    buildIniCubes,
    cubeState
};