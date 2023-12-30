import * as THREE from 'three';
import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';

var color = new THREE.Color();
const orange = new THREE.Color("rgb(255, 165, 0)");

var initialPosition = null;
var planeSelection = null;

var dir;
var currentID = null;

function raycastSelected(found, event, type) {

    document.querySelector('.menu').classList.remove('menu-show');

    const instanceId = found.instanceId;

    if (type == "down" && GLOBALS.SELECTED_ID.length > 0 && event.button == 0) {

        for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new THREE.Color(0xffffff));
            else
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new THREE.Color(0x808080));

            GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].selected = false;
        }

        GLOBALS.SELECTED_ID = [];
        GLOBALS.SELECTED_COLOR = [];

    }

    /*if (GLOBALS.CONNECTING) {
        GLOBALS.CONNECTING = false;

        GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

        return;
    }*/

    if (currentID != instanceId) { //!GLOBALS.PLANE_USER_DATA[instanceId].hasItem

        currentID = instanceId;

        for (var i = 0; i < GLOBALS.SELECTED_ID_ORANGE.length; i++) {
            if (GLOBALS.SELECTED_ID_ORANGE[i].portal)
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID_ORANGE[i].id_instanced, new THREE.Color(0xffffff));
            else
                GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID_ORANGE[i].id_instanced, new THREE.Color(0x808080));
        }

        GLOBALS.SELECTED_ID_ORANGE = [];

        if (GLOBALS.SELECTED_ID.length == 0) {
           // console.log(GLOBALS.PLANE_USER_DATA)
            //console.log(instanceId)
           // console.log(GLOBALS.PLANE_USER_DATA[instanceId])
            initialPosition = GLOBALS.PLANE_USER_DATA[instanceId].position;
            GLOBALS.SELECTED_ID.push(instanceId);
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.PLANE_USER_DATA[instanceId].id_instanced, orange);
        } else {

            GLOBALS.SELECTED_ID = [];

            let vec1 = initialPosition;
            let vec2 = GLOBALS.PLANE_USER_DATA[instanceId].position;

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
                            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(plane[0].id_instanced, orange);
                            GLOBALS.SELECTED_ID_ORANGE.push(plane[0]);
                            GLOBALS.SELECTED_ID.push(plane[0].id_instanced);
                        }
                    }
                }
            }
        }

        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
    }

    //console.log(GLOBALS.PLANE_USER_DATA[instanceId])

    if (event.button == 2) {
        if (GLOBALS.PLANE_USER_DATA[instanceId].itemName != "exitDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "enterDoor" &&
            GLOBALS.PLANE_USER_DATA[instanceId].itemName != "window") {

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem &&
                (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") ||
                    GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("laser_cube"))) {
                $("#dispenser-state").css("display", "block");
            } else {
                $("#dispenser-state").css("display", "none");
            }

            if (GLOBALS.PLANE_USER_DATA[instanceId].hasItem && GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("door")) {
                $("#rotate-item").css("display", "block");
            } else {
                $("#rotate-item").css("display", "none");
            }

            GLOBALS.SELECTED_ID.push(instanceId);

            showMenu(event.pageX, event.pageY);
        }
    }
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
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
    /*for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("door");

        console.log(instanced)

        var dummy = new THREE.Object3D();
        dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.position);
        dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.rotation);

        dummy.rotation.y += Math.PI / 2;

        dummy.updateMatrix();
        instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.userData.id, dummy.matrix)

        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.rotation.copy(dummy.rotation);
    }*/

    console.log(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]])
    console.log(GLOBALS.ITEMS_ADDED)

    var door = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName);
    door.rotation.y += Math.PI / 2;
    console.log(door)
});

$("body").on('click', '#delete', function () {

    GLOBALS.SELECTED.userData.hasItem = false;
    GLOBALS.SELECTED.userData.itemName = null;

    GLOBALS.ITEMS_ADDED.remove(GLOBALS.SELECTED.item);
    GLOBALS.SELECTED.item = null;

    if (GLOBALS.SELECTED.item2) {
        GLOBALS.ITEMS_ADDED.remove(GLOBALS.SELECTED.item2);
        GLOBALS.SELECTED.item2 = null;
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '.tile-nonPortal', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (!GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].tile = $(this).data("id");
        }
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '.tile-portal', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].tile = $(this).data("id");
        }
    }

    $(".menu").removeClass("menu-show");
});

$("body").on('click', '#dispenser-state', function () {

    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {

        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.hasDispenser = !GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.hasDispenser;

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
        var item = new THREE.Object3D();
        item.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.dispenserPosition);

        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.hasDispenser) {
            item.scale.set(1, 1, 1);
        } else {
            item.scale.set(0, 0, 0);
        }

        item.updateMatrix();
        instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].item.dispenserID, item.matrix);
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();
    }
});

export {
    raycastSelected
}