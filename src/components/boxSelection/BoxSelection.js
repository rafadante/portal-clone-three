import * as THREE from '../../build/three.module.js';
import $ from 'jquery';

window.itemSelected = false;
var color = new THREE.Color();
const orange = new THREE.Color("rgb(255, 165, 0)");

window.SELECTED_ID = [];
window.SELECTED_COLOR = [];
window.SELECTED_SIDE = null;

function raycastSelected(found, event, type) {

    document.querySelector('.menu').classList.remove('menu-show')

    if (type == "down" && window.SELECTED_ID.length > 0) {
        
        for (var i = 0; i < window.SELECTED_ID.length; i++) {
            window.instancedMesh.setColorAt(window.SELECTED_ID[i], window.SELECTED_COLOR[i]);
            window.instancedMesh.instanceColor.needsUpdate = true;
            window.planeUserData[window.SELECTED_ID[i]].selected = false;
        }

        window.SELECTED_ID = [];
        window.SELECTED_COLOR = [];

    }

    const instanceId = found.instanceId;

    window.SELECTED_ID.push(instanceId);
    window.instancedMesh.getColorAt(instanceId, color);
    window.SELECTED_COLOR.push(color.clone());

    window.instancedMesh.setColorAt(instanceId, orange);
    window.instancedMesh.instanceColor.needsUpdate = true;

    console.log(window.planeUserData[instanceId].side)
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