import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

window.itemSelected = false;
var color = new THREE.Color();
const orange = new THREE.Color("rgb(255, 165, 0)");

window.SELECTED_ID = [];
window.SELECTED_COLOR = [];
window.SELECTED_SIDE = null;

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

    if (!window.planeUserData[instanceId].hasItem) {
        window.SELECTED_ID.push(instanceId);
        window.instancedMesh.getColorAt(instanceId, color);
        window.SELECTED_COLOR.push(color.clone());

        window.instancedMesh.setColorAt(instanceId, orange);
        window.instancedMesh.instanceColor.needsUpdate = true;
    }

    //console.log(window.planeUserData[instanceId])

    //------------------------------------------------------------------

    if (event.button == 2) {
        if (window.planeUserData[instanceId].itemName != "exitDoor" &&
            window.planeUserData[instanceId].itemName != "enterDoor" &&
            window.planeUserData[instanceId].itemName != "window") {
            console.log(window.SELECTED_ID)

            if (window.planeUserData[instanceId].hasItem && window.planeUserData[instanceId].itemName.includes("ramp")) {
                $("#rotate-item").css("display", "block");
                window.SELECTED_ID.push(instanceId);
            } else {
                $("#rotate-item").css("display", "none");
            }

            showMenu(event.pageX, event.pageY);
        }
    }
}

//UI
function showMenu(x, y) {
    var menu = document.querySelector('.menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('menu-show');
}

$("body").on('click', '#rotate-item', function () {
    for (var i = 0; i < window.SELECTED_ID.length; i++) {

        var instanced = window.ITEMS_ADDED.getObjectByName("ramp");
        //console.log(instanced)

        console.log(window.planeUserData[window.SELECTED_ID[i]])
        //trasnlatePlane(window.SELECTED_ID[i], 1, window.planeUserData[window.SELECTED_ID[i]].portal);

        var dummy = new THREE.Object3D();
        dummy.position.copy(window.planeUserData[window.SELECTED_ID[i]].item.position);
        dummy.rotation.copy(window.planeUserData[window.SELECTED_ID[i]].item.rotation);

        dummy.rotation.y += Math.PI / 2;

        dummy.updateMatrix();
        instanced.setMatrixAt(window.planeUserData[window.SELECTED_ID[i]].item.userData.id, dummy.matrix)

        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        window.planeUserData[window.SELECTED_ID[i]].item.rotation.copy(dummy.rotation);
    }
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

export {
    raycastSelected
}