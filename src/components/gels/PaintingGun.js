import { Color, Euler, Object3D } from "three";
import { GLOBALS } from "../../Globals";
import { spawnInstanced } from "./Gels";
import $ from 'jquery';

function fillPaintingGun(button, item) {

    if (button == 2)
        button = 1;

    GLOBALS.PAINTING_GUN_MODE[button] = GLOBALS.DYMANIC_ITEMS['gel_recharger'][item.instanceId].userData.gel;

    if(button == 0){
        GLOBALS.PAINT_GUN.getObjectByName("left").material.color = getGelColor(GLOBALS.PAINTING_GUN_MODE[button]);
    }else if(button == 1){
        GLOBALS.PAINT_GUN.getObjectByName("right").material.color = getGelColor(GLOBALS.PAINTING_GUN_MODE[button]);
    }
}

function shootGel(button, point, normal, body, playerUpDirection, userData) {

    var color = getGelColor(GLOBALS.PAINTING_GUN_MODE[button]);

    const item = new Object3D();
    item.position.copy(point);
    item.rotation.copy(getContactRotation(body.side));

    spawnInstanced(item, color, GLOBALS.PAINTING_GUN_MODE[button], userData.side, true, 1);
}

function getContactRotation(side) {
    if (side == "down")
        return new Euler(-Math.PI / 2, 0, 0);
    else if (side == "up")
        return new Euler(Math.PI / 2, 0, 0);
    else if (side == "front")
        return new Euler(0, 0, 0);
    else if (side == "back")
        return new Euler(Math.PI, 0, 0);
    else if (side == "left")
        return new Euler(0, Math.PI / 2, 0);
    else if (side == "right")
        return new Euler(0, -Math.PI / 2, 0);
}

function getGelColor(color) {
    if (color == "blue")
        return new Color("rgb(30,144,255)");
    else if (color == "orange")
        return new Color("rgb(255,140,0)");
    else if (color == "purple")
        return new Color("rgb(75,0,130)");
    else if (color == "white")
        return new Color(0.8, 0.8, 0.8);
    else if (color == "clear")
        return new Color(0xa7dcdd);
    else if (color == "reflection")
        return new Color("rgb(128,128,128)");
}

$("body").on('click', '.gel_recharger-type', function () {
    gelRecharger( $(this).data("gel"),GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item)
});

function gelRecharger(gel, item){
    $("#gel_recharger-type").find(".title").text("Gel type: " + gel)
    $("#gel-type").data("gel", gel)

    //const item = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item;
    item.userData.gel = gel;

    const instanced = GLOBALS.ITEMS_ADDED.getObjectByName("gel_recharger");
    instanced.setColorAt(item.userData.idInstanced, getGelColor(gel));
    //instanced.instanceColor.needsUpdate = true;
}

export { shootGel, fillPaintingGun, gelRecharger }