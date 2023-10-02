import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

var limit = false;

function cubeState(button) {

    var toRemove = [];

    if (button == "plus") {
        //
        for (var i = 0; i < window.SELECTED_ID.length; i++) {

            trasnlatePlane(window.SELECTED_ID[i], 1);

        }
    } else if (button == "minus") {
        //
        for (var i = 0; i < window.SELECTED_ID.length; i++) {

            trasnlatePlane(window.SELECTED_ID[i], -1);

        }
    }

    //console.log(IndexArray)

    for (var i = 0; i < IndexArray.length; i++) {

        var erase = new THREE.Object3D();
        erase.position.set(0, 10000, 0);

        erase.updateMatrix();
        window.instancedMesh.setMatrixAt(IndexArray[i], erase.matrix);
        window.planeUserData[IndexArray[i]] = {};
        window.instancedMesh.instanceMatrix.needsUpdate = true;
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

function trasnlatePlane(id, val) {

    var dummy = new THREE.Object3D();
    dummy.position.copy(window.planeUserData[id].position);
    dummy.rotation.copy(window.planeUserData[id].rotation);

    //-----------------------------------------------------

    dummy.translateZ(val * 2);
    dummy.position.copy(dummy.position.round());

    var frontExists = getPlaneByName(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z);

    var clone = dummy.clone();

    clone.translateZ(-val * 2);

    checkSides(clone.clone(), val, id, "left");
    checkSides(clone.clone(), val, id, "right");
    checkSides(clone.clone(), val, id, "up");
    checkSides(clone.clone(), val, id, "down");

    //------------------------------------------------

    //console.log(frontExists)
    //console.log(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z)

    if (frontExists.length > 0) {

        window.instancedMesh.setColorAt(id, new THREE.Color(0xffffff));
        window.instancedMesh.instanceColor.needsUpdate = true;

        var erase = new THREE.Object3D();
        erase.position.set(0, 10000, 0);
        erase.updateMatrix();
        window.instancedMesh.setMatrixAt(id, erase.matrix);
        window.planeUserData[id] = {};

        window.instancedMesh.setColorAt(frontExists[0].id_instanced, new THREE.Color(0xffffff));
        window.instancedMesh.instanceColor.needsUpdate = true;

        //---------------------------------------

        var erase = new THREE.Object3D();
        erase.position.set(0, 10000, 0);
        erase.updateMatrix();
        window.instancedMesh.setMatrixAt(frontExists[0].id_instanced, erase.matrix);
        window.planeUserData[frontExists[0].id_instanced] = {};
        window.instancedMesh.instanceMatrix.needsUpdate = true;
        //

        limit = true;

    } else {

        window.planeUserData[id].position = dummy.position.clone();
        window.planeUserData[id].rotation = dummy.rotation.clone();
        window.planeUserData[id].name = dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z;

        dummy.updateMatrix();
        window.instancedMesh.setMatrixAt(id, dummy.matrix)

        window.instancedMesh.instanceMatrix.needsUpdate = true;

    }

    //----------------------------------------------------

    
}

var IndexArray = [];

function checkSides(dummy, val, id, side) {

    dummy.translateZ(val);

    if (side == "left")
        dummy.translateX(-1 * val);
    else if (side == "right")
        dummy.translateX(1 * val);
    else if (side == "up")
        dummy.translateY(1 * val);
    else if (side == "down")
        dummy.translateY(-1 * val);

    dummy.position.copy(dummy.position.round());

    var sideExists = getPlaneByName(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z);

    //console.log(sideExists.length)
    //console.log(dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z)

    if (sideExists.length == 0) { //if there is no face create one

        if (side == "left") {

            if (window.planeUserData[id].side == "back")
                dummy.rotation.y += Math.PI / 2;
            else
                dummy.rotation.y -= Math.PI / 2;

        } else if (side == "right") {

            if (window.planeUserData[id].side == "back")
                dummy.rotation.y -= Math.PI / 2;
            else
                dummy.rotation.y += Math.PI / 2;

        } else if (side == "up") {

            if (window.planeUserData[id].side == "back")
                dummy.rotation.x += Math.PI / 2;
            else if (window.planeUserData[id].side == "right" ||
                window.planeUserData[id].side == "left") {
                dummy.rotation.set(-Math.PI / 2, 0, 0)
            } else
                dummy.rotation.x -= Math.PI / 2;

        } else if (side == "down") {

            if (window.planeUserData[id].side == "back")
                dummy.rotation.x -= Math.PI / 2;
            else if (window.planeUserData[id].side == "right" ||
                window.planeUserData[id].side == "left") {
                dummy.rotation.set(Math.PI / 2, 0, 0)
            } else
                dummy.rotation.x += Math.PI / 2;

        }

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
        window.instancedMesh.setColorAt(idEmptyToFill, new THREE.Color().setHex(0xffffff));

        window.instancedMesh.instanceMatrix.needsUpdate = true;
        window.instancedMesh.instanceColor.needsUpdate = true;

        dummy.position.copy(dummy.position.round());

        window.planeUserData[idEmptyToFill] = {
            iniPos: dummy.position.clone(),
            base: true,
            side: side,
            name: dummy.position.x + "/" + dummy.position.y + "/" + dummy.position.z,
            selected: false,
            position: dummy.position.clone(),
            rotation: dummy.rotation.clone(),
            exists: true,
            id_instanced: idEmptyToFill
        };

    } else { //if there is a face delete it

        //const index = window.planeUserData.indexOf(sideExists[0]);
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
for (var i = 0; i < 3000; i++) {
    window.planeUserData.push({})
}

function buildIniCubes(obj) {

    const geometry = new THREE.PlaneGeometry(2, 2);

    window.instancedMesh = new THREE.InstancedMesh(geometry.clone(), window.MATERIAL_PORTAL_EDITOR, 3000);
    window.instancedMesh.position.y = 10000;
    window.instancedMesh.castShadow = true;
    window.instancedMesh.receiveShadow = true;
    window.instancedMesh.name = "cube-parent";
    window.CUBES.add(window.instancedMesh);

    //GROUND
    buildLayer(-1, -1, -10000, 'x', 'z', 'y', 6, 8, "down", new THREE.Vector3(-Math.PI / 2, 0, 0));
    //CEILING
    buildLayer(-1, -1, -9992, 'x', 'z', 'y', 6, 8, "up", new THREE.Vector3(Math.PI / 2, 0, 0));
    //WALL FRONT
    buildLayer(-1, -10001, 0, 'x', 'y', 'z', 4, 8, "front", new THREE.Vector3(0, 0, 0));
    //WALL BACK
    buildLayer(-1, -10001, 12, 'x', 'y', 'z', 4, 8, "back", new THREE.Vector3(0, Math.PI, 0));
    //WALL RIGHT
    buildLayer(-1, -10001, 16, 'z', 'y', 'x', 4, 6, "right", new THREE.Vector3(0, -Math.PI / 2, 0));
    //WALL LEFT
    buildLayer(-1, -10001, 0, 'z', 'y', 'x', 4, 6, "left", new THREE.Vector3(0, Math.PI / 2, 0));

    //console.log(window.instancedMesh);
    //console.log(window.planeUserData);

    /*var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.planeUserData));
    var dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "scene.json");
    dlAnchorElem.click();*/
}

function buildLayer(x, y, z, x2, y2, z2, height, width, side, rot) {

    var clone = new THREE.Object3D();

    for (var i = 0; i < width; i++) {

        x += 2;

        for (var j = 0; j < height; j++) {

            y += 2;

            clone.rotation.set(rot.x, rot.y, rot.z);

            clone.position[x2] = x;
            clone.position[y2] = y;
            clone.position[z2] = z;

            clone.updateMatrix();
            window.instancedMesh.setMatrixAt(a, clone.matrix);

            var target = new THREE.Vector3();
            clone.getWorldPosition(target);
            var portal;

            if (clone.position.x <= 5 && clone.position.z >= 7 && clone.position.y <= -10000 + 5) {
                portal = false;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else if (clone.position.x >= 10 && clone.position.z <= 1 && clone.position.y <= -10000 + 3) {
                portal = false;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0x808080));
            } else {
                portal = true;
                window.instancedMesh.setColorAt(a, new THREE.Color().setHex(0xffffff));
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
                portal: portal
            }

            a++;
        }

        if (side == "up" || side == "down")
            y = -1;
        else
            y = -10001;
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
    window.SELECTED.userData.portal = !window.SELECTED.userData.portal;
    for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
        window.CUBE_SELECTION_ARRAY[i].selected.userData.portal = window.SELECTED.userData.portal;
    }

    if (window.SELECTED.userData.portal) {
        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            window.CUBE_SELECTION_ARRAY[i].selected.material = window.MATERIAL_PORTAL_EDITOR;
        }
    } else {
        for (var i = 0; i < window.CUBE_SELECTION_ARRAY.length; i++) {
            window.CUBE_SELECTION_ARRAY[i].selected.material = window.MATERIAL_NON_PORTAL_EDITOR;;
        }
    }
    document.querySelector('.menu').classList.remove('menu-show')
})

window.addEventListener("contextmenu", e => e.preventDefault());

export {
    buildIniCubes,
    cubeState
};