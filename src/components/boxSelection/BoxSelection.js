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

    console.log(window.planeUserData[instanceId])

    //------------------------------------------------------------------

    if (event.button == 2) {
        if (window.planeUserData[instanceId].itemName != "exitDoor" &&
            window.planeUserData[instanceId].itemName != "enterDoor" &&
            window.planeUserData[instanceId].itemName != "window")
            showMenu(event.pageX, event.pageY);
    }

    /*if (window.SELECTED && event.button == 2) {
        $(".hasItem").css("display", "none");
        $(".noItem").css("opacity", "1");
        $(".noItem").css("pointer-events", "all");
        $(".noItem a").css("pointer-events", "all");
        $(".noItem button").css("pointer-events", "all");

        if (window.SELECTED.userData.itemName != "exitDoor" &&
            window.SELECTED.userData.itemName != "enterDoor" &&
            window.SELECTED.userData.itemName != "window")
            showMenu(event.pageX, event.pageY);
    }

    for (var i = 0; i < found.length; i++) {
        if (found[i].object.userData.hasItem && event.button == 2 && window.SELECTED) {

            console.log(window.SELECTED)

            if (window.SELECTED.item.userData.trigger) {
                $(".hasItem").css("display", "flex");
            }

            $(".noItem").css("opacity", "0.5");
            $(".noItem").css("pointer-events", "none");
            $(".noItem a").css("pointer-events", "none");
            $(".noItem button").css("pointer-events", "none");

            window.startItem = window.SELECTED.item;

            if (found[i].object.userData.itemName != "exitDoor" &&
                found[i].object.userData.itemName != "enterDoor" &&
                found[i].object.userData.itemName != "window")
                showMenu(event.pageX, event.pageY);

            break;
        }
    }*/
}

//UI
function showMenu(x, y) {
    var menu = document.querySelector('.menu');
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.classList.add('menu-show');
}

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
})

export {
    raycastSelected
}