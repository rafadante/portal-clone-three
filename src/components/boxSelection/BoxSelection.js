import * as THREE from 'three';
import $ from 'jquery';

window.itemSelected = false;
var color = new THREE.Color();
const orange = new THREE.Color("rgb(255, 165, 0)");

window.SELECTED_ID = [];
window.SELECTED_COLOR = [];
window.SELECTED_SIDE = null;
window.SELECTED_MATRIX = [];

var initialPosition = null;
var planeSelection = null;

window.SELECTED_ID_ORANGE = [];
var dir;
var currentID = null;

function raycastSelected(found, event, type) {

    document.querySelector('.menu').classList.remove('menu-show');

    const instanceId = found.instanceId;

    if (type == "down" && window.SELECTED_ID.length > 0 && event.button == 0) {

        for (var i = 0; i < window.SELECTED_ID.length; i++) {

            if (window.planeUserData[window.SELECTED_ID[i]].portal)
                window.instancedMesh.setColorAt(window.SELECTED_ID[i], new THREE.Color(0xffffff));
            else
                window.instancedMesh.setColorAt(window.SELECTED_ID[i], new THREE.Color(0x808080));

            window.instancedMesh.instanceColor.needsUpdate = true;
            window.planeUserData[window.SELECTED_ID[i]].selected = false;
        }

        window.SELECTED_ID = [];
        window.SELECTED_COLOR = [];

    }

    /*if (window.connecting) {
        window.connecting = false;

        window.MATERIAL_PORTAL_EDITOR.opacity = 1;
        window.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        window.MATERIAL_PORTAL_EDITOR.transparent = false;
        window.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

        return;
    }*/

    if (currentID != instanceId) { //!window.planeUserData[instanceId].hasItem

        currentID = instanceId;

        for (var i = 0; i < window.SELECTED_ID_ORANGE.length; i++) {
            if (window.SELECTED_ID_ORANGE[i].portal)
                window.instancedMesh.setColorAt(window.SELECTED_ID_ORANGE[i].id_instanced, new THREE.Color(0xffffff));
            else
                window.instancedMesh.setColorAt(window.SELECTED_ID_ORANGE[i].id_instanced, new THREE.Color(0x808080));
        }

        window.SELECTED_ID_ORANGE = [];

        if (window.SELECTED_ID.length == 0) {
           // console.log(window.planeUserData)
            //console.log(instanceId)
           // console.log(window.planeUserData[instanceId])
            initialPosition = window.planeUserData[instanceId].position;
            window.SELECTED_ID.push(instanceId);
            window.instancedMesh.setColorAt(window.planeUserData[instanceId].id_instanced, orange);
        } else {

            window.SELECTED_ID = [];

            let vec1 = initialPosition;
            let vec2 = window.planeUserData[instanceId].position;

            var xDir = Math.sign(vec1.x - vec2.x) * (-1);
            var yDir = Math.sign(vec1.y - vec2.y) * (-1);
            var zDir = Math.sign(vec1.z - vec2.z) * (-1);

            let size = new THREE.Vector3().subVectors(vec2, vec1);
            let center = new THREE.Vector3().addVectors(vec1, vec2).multiplyScalar(0.5);

            let planeWidth = Math.abs(size.x);
            let planeHeight = Math.abs(size.y);
            let planeDepth = Math.abs(size.z);

            let planeGeom = new THREE.BoxGeometry(planeWidth, planeHeight, planeDepth);
            let planeMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color("rgb(0, 0, 255)")
            });
            var planeSelection = new THREE.Mesh(planeGeom, planeMat);
            planeSelection.position.copy(center);

            var direction = new THREE.Vector3();
            planeSelection.getWorldDirection(direction);
            direction = new THREE.Vector3(Math.abs(direction.x - 1), Math.abs(direction.y - 1), Math.abs(direction.z - 1))
            //xDir *= direction.x;
            //yDir *= direction.y;
            //zDir *= direction.z;

            for (var w = 0, i = 0; w <= planeWidth / 2; w++, i += 2) {

                for (var h = 0, j = 0; h <= planeHeight / 2; h++, j += 2) {

                    for (var d = 0, k = 0; d <= planeDepth / 2; d++, k += 2) {

                        var plane = getPlaneByName((vec1.x + (i * xDir)) + "/" + (vec1.y + (j * yDir)) + "/" + (vec1.z + (k * zDir)));

                        if (plane[0]) {
                            window.instancedMesh.setColorAt(plane[0].id_instanced, orange);
                            window.SELECTED_ID_ORANGE.push(plane[0]);
                            window.SELECTED_ID.push(plane[0].id_instanced);
                        }
                    }
                }
            }
        }

        window.instancedMesh.instanceColor.needsUpdate = true;
    }

    //console.log(window.planeUserData[instanceId])

    if (event.button == 2) {
        if (window.planeUserData[instanceId].itemName != "exitDoor" &&
            window.planeUserData[instanceId].itemName != "enterDoor" &&
            window.planeUserData[instanceId].itemName != "window") {

            if (window.planeUserData[instanceId].hasItem &&
                (window.planeUserData[instanceId].itemName.includes("sphere") ||
                    window.planeUserData[instanceId].itemName.includes("cube") ||
                    window.planeUserData[instanceId].itemName.includes("laser_cube"))) {
                $("#dispenser-state").css("display", "block");
            } else {
                $("#dispenser-state").css("display", "none");
            }

            if (window.planeUserData[instanceId].hasItem && window.planeUserData[instanceId].itemName.includes("door")) {
                $("#rotate-item").css("display", "block");
            } else {
                $("#rotate-item").css("display", "none");
            }

            window.SELECTED_ID.push(instanceId);

            showMenu(event.pageX, event.pageY);
        }
    }
}

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

//UI
function showMenu(x, y) {
    var menu = document.querySelector('.menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('menu-show');
}

$("body").on('click', '#rotate-item', function () {
    /*for (var i = 0; i < window.SELECTED_ID.length; i++) {

        var instanced = window.ITEMS_ADDED.getObjectByName("door");

        console.log(instanced)

        var dummy = new THREE.Object3D();
        dummy.position.copy(window.planeUserData[window.SELECTED_ID[i]].item.position);
        dummy.rotation.copy(window.planeUserData[window.SELECTED_ID[i]].item.rotation);

        dummy.rotation.y += Math.PI / 2;

        dummy.updateMatrix();
        instanced.setMatrixAt(window.planeUserData[window.SELECTED_ID[i]].item.userData.id, dummy.matrix)

        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        window.planeUserData[window.SELECTED_ID[i]].item.rotation.copy(dummy.rotation);
    }*/

    console.log(window.planeUserData[window.SELECTED_ID[0]])
    console.log(window.ITEMS_ADDED)

    var door = window.ITEMS_ADDED.getObjectByName(window.planeUserData[window.SELECTED_ID[0]].itemName);
    door.rotation.y += Math.PI / 2;
    console.log(door)
});

$("body").on('click', '#delete', function () {

    window.SELECTED.userData.hasItem = false;
    window.SELECTED.userData.itemName = null;

    window.ITEMS_ADDED.remove(window.SELECTED.item);
    window.SELECTED.item = null;

    if (window.SELECTED.item2) {
        window.ITEMS_ADDED.remove(window.SELECTED.item2);
        window.SELECTED.item2 = null;
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '.tile-nonPortal', function () {
    for (var i = 0; i < window.SELECTED_ID.length; i++) {
        if (!window.planeUserData[window.SELECTED_ID[i]].portal) {
            window.planeUserData[window.SELECTED_ID[i]].tile = $(this).data("id");
        }
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '.tile-portal', function () {
    for (var i = 0; i < window.SELECTED_ID.length; i++) {
        if (window.planeUserData[window.SELECTED_ID[i]].portal) {
            window.planeUserData[window.SELECTED_ID[i]].tile = $(this).data("id");
        }
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '#dispenser-state', function () {

    for (var i = 0; i < window.SELECTED_ID.length; i++) {

        window.planeUserData[window.SELECTED_ID[i]].item.hasDispenser = !window.planeUserData[window.SELECTED_ID[i]].item.hasDispenser;

        var instanced = window.ITEMS_ADDED.getObjectByName("dispenser");
        var item = new THREE.Object3D();
        item.position.copy(window.planeUserData[window.SELECTED_ID[i]].item.dispenserPosition);

        if (window.planeUserData[window.SELECTED_ID[i]].item.hasDispenser) {
            item.scale.set(1, 1, 1);
        } else {
            item.scale.set(0, 0, 0);
        }

        item.updateMatrix();
        instanced.setMatrixAt(window.planeUserData[window.SELECTED_ID[i]].item.dispenserID, item.matrix);
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();
    }
});

export {
    raycastSelected
}