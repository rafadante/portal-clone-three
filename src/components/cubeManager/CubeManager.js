import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

var limit = false;
var IndexArray = [];

function cubeState(button) {

    if (button == "plus") {
        //
        for (var i = 0; i < window.SELECTED_ID.length; i++) {
            trasnlatePlane(window.SELECTED_ID[i], 1, window.planeUserData[window.SELECTED_ID[i]].portal);
        }
    } else if (button == "minus") {
        //
        for (var i = 0; i < window.SELECTED_ID.length; i++) {

            if (window.planeUserData[window.SELECTED_ID[i]].position.y - 2 == 22 ||
                window.planeUserData[window.SELECTED_ID[i]].position.y - 2 == -16) {
                warning();
                return;
            } else if (window.planeUserData[window.SELECTED_ID[i]].position.x == 28 ||
                window.planeUserData[window.SELECTED_ID[i]].position.x == -12) {
                warning();
                return;
            } else if (window.planeUserData[window.SELECTED_ID[i]].position.z == -14 ||
                window.planeUserData[window.SELECTED_ID[i]].position.z == 26) {
                warning();
                return;
            }

            trasnlatePlane(window.SELECTED_ID[i], -1, window.planeUserData[window.SELECTED_ID[i]].portal);
        }
    }

    for (var i = 0; i < IndexArray.length; i++) {

        var erase = new THREE.Object3D();
        erase.scale.set(0, 0, 0);

        erase.updateMatrix();
        window.instancedMesh.setMatrixAt(IndexArray[i], erase.matrix);
        window.planeUserData[IndexArray[i]] = {};
        window.instancedMesh.instanceMatrix.needsUpdate = true;
        window.instancedMesh.computeBoundingSphere();
    }

    if (limit) {
        window.SELECTED_SIDE = null;
        window.SELECTING = false;
        window.SELECTED_ID = [];
        window.SELECTED_COLOR = [];
    }

    IndexArray = [];
    limit = false;
}

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

function trasnlatePlane(id, val, portal) {

    var dummy = new THREE.Object3D();
    dummy.position.copy(window.planeUserData[id].position);
    dummy.rotation.copy(window.planeUserData[id].rotation);

    //-----------------------------------------------------

    dummy.translateZ(val * 2);
    dummy.position.copy(dummy.position.round());

    var frontExists = getPlaneByName(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z);
    var clone = dummy.clone();

    clone.translateZ(-val * 2);

    if (window.planeUserData[id].side == "front" || window.planeUserData[id].side == "back") {
        checkSides(clone.clone(), val, id, "left", portal);
        checkSides(clone.clone(), val, id, "right", portal);
        checkSides(clone.clone(), val, id, "up", portal);
        checkSides(clone.clone(), val, id, "down", portal);
    } else if (window.planeUserData[id].side == "up" || window.planeUserData[id].side == "down") {
        checkSides(clone.clone(), val, id, "left", portal);
        checkSides(clone.clone(), val, id, "right", portal);
        checkSides(clone.clone(), val, id, "front", portal);
        checkSides(clone.clone(), val, id, "back", portal);
    } else if (window.planeUserData[id].side == "left" || window.planeUserData[id].side == "right") {
        checkSides(clone.clone(), val, id, "front", portal);
        checkSides(clone.clone(), val, id, "back", portal);
        checkSides(clone.clone(), val, id, "up", portal);
        checkSides(clone.clone(), val, id, "down", portal);
    }

    if (frontExists.length > 0) {

        window.instancedMesh.setColorAt(id, new THREE.Color(0xffffff));
        window.instancedMesh.instanceColor.needsUpdate = true;

        var erase = new THREE.Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        window.instancedMesh.setMatrixAt(id, erase.matrix);
        window.planeUserData[id] = {};

        window.instancedMesh.setColorAt(frontExists[0].id_instanced, new THREE.Color(0xffffff));
        window.instancedMesh.instanceColor.needsUpdate = true;

        //---------------------------------------
        var erase = new THREE.Object3D();
        erase.scale.set(0, 0, 0);
        erase.updateMatrix();
        window.instancedMesh.setMatrixAt(frontExists[0].id_instanced, erase.matrix);
        window.planeUserData[frontExists[0].id_instanced] = {};
        window.instancedMesh.instanceMatrix.needsUpdate = true;
        window.instancedMesh.computeBoundingSphere();
        //
        limit = true;
    } else {

        window.planeUserData[id].position = dummy.position.clone();
        window.planeUserData[id].rotation = dummy.rotation.clone();
        window.planeUserData[id].name = dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z;

        dummy.updateMatrix();
        window.instancedMesh.setMatrixAt(id, dummy.matrix)

        window.instancedMesh.instanceMatrix.needsUpdate = true;
        window.instancedMesh.computeBoundingSphere();

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
        for (var i = 0; i < window.planeUserData.length; i++) {
            if (!window.planeUserData[i].exists) {
                idEmptyToFill = i;
                break;
            }
        }

        window.instancedMesh.setMatrixAt(idEmptyToFill, dummy.matrix);

        if (portal)
            window.instancedMesh.setColorAt(idEmptyToFill, new THREE.Color().setHex(0xffffff));
        else
            window.instancedMesh.setColorAt(idEmptyToFill, new THREE.Color().setHex(0x808080));

        window.instancedMesh.instanceMatrix.needsUpdate = true;
        window.instancedMesh.instanceColor.needsUpdate = true;
        window.instancedMesh.computeBoundingSphere();

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

        window.planeUserData[idEmptyToFill] = {
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

    } else { //if there is a face delete it
        IndexArray.push(sideExists[0].id_instanced);
    }
}

function warning() {
    $("#warning").css("opacity", 1);
    setTimeout(() => {
        $("#warning").css("opacity", 0);
    }, 3000);
}

var a = 0;
window.planeUserData = [];
for (var i = 0; i < 1500; i++) {
    window.planeUserData.push({})
}

function buildIniCubes(obj) {

    if (!window.loadedLevel) {

        const geometry = new THREE.PlaneGeometry(2, 2);

        window.instancedMesh = new THREE.InstancedMesh(geometry.clone(), window.MATERIAL_PORTAL_EDITOR, 1500);
        window.instancedMesh.frustumCulled = false;
        window.instancedMesh.castShadow = true;
        window.instancedMesh.receiveShadow = true;
        window.instancedMesh.name = "cube-parent";
        window.CUBES.add(window.instancedMesh);

        var clone = new THREE.Object3D();

        for (var i = 0; i < 1500; i++) {
            clone.scale.set(0, 0, 0);
            clone.updateMatrix();
            window.instancedMesh.setMatrixAt(i, clone.matrix);
        }

        //GROUND
        buildLayer(-1, -1, 0, 'x', 'z', 'y', 6, 8, "down", new THREE.Vector3(-Math.PI / 2, 0, 0));
        //CEILING
        buildLayer(-1, -1, 8, 'x', 'z', 'y', 6, 8, "up", new THREE.Vector3(Math.PI / 2, 0, 0));
        //WALL FRONT
        buildLayer(-1, -1, 0, 'x', 'y', 'z', 4, 8, "front", new THREE.Vector3(0, 0, 0));
        //WALL BACK
        buildLayer(-1, -1, 12, 'x', 'y', 'z', 4, 8, "back", new THREE.Vector3(0, Math.PI, 0));
        //WALL RIGHT
        buildLayer(-1, -1, 16, 'z', 'y', 'x', 4, 6, "right", new THREE.Vector3(0, -Math.PI / 2, 0));
        //WALL LEFT
        buildLayer(-1, -1, 0, 'z', 'y', 'x', 4, 6, "left", new THREE.Vector3(0, Math.PI / 2, 0));
    }
}

$("body").on('click', '#save-level', function () {
    var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.planeUserData));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "scene.json");
    dlAnchorElem.click();
})

function buildLayer(x, y, z, x2, y2, z2, height, width, side, rot) {

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
            window.instancedMesh.setMatrixAt(a, clone.matrix);

            var portal;

            if (clone.position.x <= 5 && clone.position.z >= 7 && clone.position.y <= 5) {
                portal = false;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else if (clone.position.x >= 10 && clone.position.z <= 1 && clone.position.y <= 3) {
                portal = false;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else if (clone.position.y == 8) {
                portal = false;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else {
                portal = true;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0xffffff));
            }

            var hasItem = false;
            var itemName = null;

            if (clone.position.equals(new THREE.Vector3(3, 1, 12))) {
                hasItem = true;
                itemName = "enterDoor";
            } else if (clone.position.equals(new THREE.Vector3(13, 1, 0))) {
                hasItem = true;
                itemName = "exitDoor";
            } else if (clone.position.equals(new THREE.Vector3(16, 7, 7)) ||
                clone.position.equals(new THREE.Vector3(16, 7, 5))) {
                hasItem = true;
                itemName = "window";
            }

            //ADD USERDATA TO ARRAY LINKED WITH THE INSTANCED ID
            clone.position.copy(clone.position.round());
            window.planeUserData[a] = {
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

            a++;
        }

        y = -1;
    }

    window.RENDERER.renderLists.dispose();
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

    if (window.SELECTED_ID.length > 0) {
        window.planeUserData[window.SELECTED_ID[0]].portal = !window.planeUserData[window.SELECTED_ID[0]].portal;
        console.log(window.planeUserData[window.SELECTED_ID[0]].portal);

        for (var i = 0; i < window.SELECTED_ID.length; i++) {
            window.planeUserData[window.SELECTED_ID[i]].portal = window.planeUserData[window.SELECTED_ID[0]].portal;

            if (window.planeUserData[window.SELECTED_ID[i]].portal)
                window.instancedMesh.setColorAt(window.SELECTED_ID[i], new THREE.Color(0xffffff));
            else
                window.instancedMesh.setColorAt(window.SELECTED_ID[i], new THREE.Color(0x808080));

            window.instancedMesh.instanceColor.needsUpdate = true;
        }
    }

    document.querySelector('.menu').classList.remove('menu-show');
})

window.addEventListener("contextmenu", e => e.preventDefault());

export {
    buildIniCubes,
    cubeState
};