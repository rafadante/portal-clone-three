import {
    MeshLineGeometry,
    MeshLineMaterial
} from 'meshline';
import {
    GLOBALS
} from '../../Globals.js';
import {
    Mesh,
    Color,
    Vector3
} from 'three';
import $ from 'jquery';
import { animate } from '../../Main';
import { findPath } from '../findPath/FindPath.js';

function manageConnection(instanceId, from) {
    GLOBALS.CONNECTING = false;

    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;
    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CURRENT_LINE);

    if (GLOBALS.PLANE_USER_DATA[instanceId].allowconnection) {

        GLOBALS.PLANE_USER_DATA[instanceId].item.userData.connections += 1;

        var endPos = new Vector3(
            GLOBALS.PLANE_USER_DATA[instanceId].position.x,
            GLOBALS.PLANE_USER_DATA[instanceId].position.y,
            GLOBALS.PLANE_USER_DATA[instanceId].position.z
        );

        if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") || GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere"))
            endPos = GLOBALS.PLANE_USER_DATA[instanceId].item.dispenserPosition

        const points = [];
        points.push(new Vector3(
            from.position.x,
            from.position.y,
            from.position.z
        ));
        points.push(endPos);

        const geometry = new MeshLineGeometry()
        geometry.setPoints(points)
        const material = new MeshLineMaterial({
            color: 0xffa500,
            side: 2,
            depthTest: true,
            transparent: true
        })
        material.uniforms.alphaTest.value = 0;
        material.uniforms.dashArray.value = 0.01;
        material.uniforms.lineWidth.value = 0.1;
        material.uniforms.useDash.value = 1;
        const line = new Mesh(geometry, material)

        /*GLOBALS.SCENE_CHILDREN.add(line);

        GLOBALS.CONNECTIONS.push({
            line: line,
            from: from,
            to:  GLOBALS.PLANE_USER_DATA[instanceId]
        });*/

        from.item.userData.connectedTo.push(instanceId);

        findPath(from.position, GLOBALS.PLANE_USER_DATA[instanceId].position, GLOBALS.PLANE_USER_DATA[instanceId], from)
    }

    GLOBALS.ITEM_CUBE.visible = false;
    GLOBALS.CURRENT_LINE = null;
}

$("body").on('click', '.removeConnection', function () {

    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CONNECTIONS[$(this).data("id")]["line"]);
    GLOBALS.CONNECTIONS[$(this).data("id")]["to"].item.userData.connections -= 1;

    //
    GLOBALS.CONNECTIONS[$(this).data("id")]["from"].item.userData.connectedTo.splice($(this).data("id"), 1);

    //RESET UI
    GLOBALS.CONNECTIONS.splice($(this).data("id"), 1);
    $("#connections").empty();
    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {

        if (GLOBALS.CONNECTIONS[i]['from'].itemName == GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].itemName) {
            var elem = '<li data-id="' + i + '" class="menu-item removeConnection">' +
                '<button type="button" class="menu-btn">' +
                '<i class="fas fa-times"></i>' +
                '<span class="menu-text">' + GLOBALS.CONNECTIONS[i]["to"].itemName + '</span>' +
                '</button>' +
                '</li>';

            $("#connections").append(elem);
        }
    }

    animate();
});

$("body").on('mouseenter', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.position.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].position);
    GLOBALS.ITEM_CUBE.rotation.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].rotation);
    GLOBALS.ITEM_CUBE.translateZ(1)
    GLOBALS.ITEM_CUBE.material.color = new Color(0xff0000);
    GLOBALS.ITEM_CUBE.visible = true;
    animate();
});

$("body").on('mouseleave', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.visible = false;
});

export {
    manageConnection
}