import { GLOBALS } from '../../Globals.js';
import { Color, BufferGeometry, LineBasicMaterial, Line, SphereGeometry, MeshStandardMaterial } from 'three';
import $ from 'jquery';
//import { findPath } from '../findPath/FindPath.js';
import { targetFaithPlateEnd } from '../faithPlate/FaithPlate.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

const geometry = new SphereGeometry(0.1, 8, 4);
const material = new MeshStandardMaterial({ color: 0xffffff, depthTest: false, transparent: true });
window.checkers = new InstancedMesh2(geometry, material, { createInstances: true });
window.checkers.addInstances(1000, (obj, index) => {
    obj.color = "white";
    obj.visible = false;
});
window.checkers.instanceMatrix.needsUpdate = true;
GLOBALS.SCENE.add(window.checkers);

window.checkersIndexes = [];

for (var i = 0; i < 1000; i++)
    window.checkersIndexes.push(false);

const colorInnactive = new Color(0, 2.0, 5.0);

function manageConnection(instanceId, from) {
    GLOBALS.CONNECTING = false;

    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;
    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CURRENT_LINE);

    if(GLOBALS.PLANE_USER_DATA[instanceId].item){
        if(!GLOBALS.PLANE_USER_DATA[instanceId].item.userData)
            return;
    }

    //console.log(GLOBALS.SELECTED_FOR_CONNECTION.item.userData.connectedTo)

    if(!GLOBALS.SELECTED_FOR_CONNECTION.item.userData.connectedTo)
        return;
    

    if (GLOBALS.FAITH_PLATE_TARGET) {
        targetFaithPlateEnd(GLOBALS.PLANE_USER_DATA[instanceId])
    } else if (GLOBALS.PLANE_USER_DATA[instanceId].allowconnection &&
        !GLOBALS.SELECTED_FOR_CONNECTION.item.userData.connectedTo.includes(GLOBALS.PLANE_USER_DATA[instanceId].id_instanced) &
        GLOBALS.PLANE_USER_DATA[instanceId].item.userData.connections < 10) {

        GLOBALS.PLANE_USER_DATA[instanceId].item.userData.connections += 1;

        var endPos, checker, clone;

        for (var i = 0; i < 10; i++) {

            clone = GLOBALS.PLANE_USER_DATA[instanceId].item.checkersSlots[i]

            if (!clone.visible) {

                clone.visible = true;
                endPos = clone.position;

                //GET INSTANCE INDEX
                for (var j = 0; j < window.checkersIndexes.length; j++) {
                    if (!window.checkersIndexes[j]) {

                        window.checkersIndexes[j] = true;
                        //window.checkers.instances[j].customData = {};
                        window.checkers.instances[j].position.copy(endPos);
                        window.checkers.setVisibilityAt(j, true);
                        window.checkers.setColorAt(j, colorInnactive);
                        window.checkers.instances[j].updateMatrix(); // necessary after transformations
                        window.checkers.computeBoundingSphere();
                        checker = j;
                        break;
                    }
                }

                break;
            }
        }

        const line = addLine(from, endPos);

        GLOBALS.LINES.add(line);

        GLOBALS.CONNECTIONS.push({
            line: line,
            from: from,
            line2: null,
            to: GLOBALS.PLANE_USER_DATA[instanceId],
            checker: checker,
            clone: clone
        });

        from.item.userData.connectedTo.push(instanceId);

        //if (from.instancedName == "trigger_area")
        //    line.visible = false;
    }

    GLOBALS.ITEM_CUBE.visible = false;
    GLOBALS.CURRENT_LINE = null;
}

function addLine(from, endPos) {

    const points = [];
    points.push(from.position);
    points.push(endPos);

    const geometry = new BufferGeometry().setFromPoints(points);
    const materialLine = new LineBasicMaterial({
        transparent: true, // Enable transparency
        color: colorInnactive
    });
    const line = new Line(geometry, materialLine);
    line.visible = from.item.userData.showLines;

    return line;
}

$("body").on('click', '.removeConnection', function () {

    GLOBALS.LINES.remove(GLOBALS.CONNECTIONS[$(this).data("id")]["line"]);
    window.checkers.instances[GLOBALS.CONNECTIONS[$(this).data("id")]["checker"]].visible = false;
    window.checkersIndexes[GLOBALS.CONNECTIONS[$(this).data("id")]["checker"]] = false;
    GLOBALS.CONNECTIONS[$(this).data("id")]["clone"].visible = false;
    GLOBALS.CONNECTIONS[$(this).data("id")]["to"].item.userData.connections -= 1;

    const index = GLOBALS.CONNECTIONS[$(this).data("id")]["from"].item.userData.connectedTo.indexOf(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].id_instanced);
    if (index > -1) { // only splice array when item is found
        GLOBALS.CONNECTIONS[$(this).data("id")]["from"].item.userData.connectedTo.splice(index, 1); // 2nd parameter means remove one item only
    }

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
});

$("body").on('mouseenter', '.removeConnection', function () {
    if (GLOBALS.CONNECTIONS[$(this).data("id")]) {
        GLOBALS.ITEM_CUBE.position.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].position);
        GLOBALS.ITEM_CUBE.rotation.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].rotation);
        GLOBALS.ITEM_CUBE.translateZ(1)
        GLOBALS.ITEM_CUBE.material.color = new Color(0xff0000);
        GLOBALS.ITEM_CUBE.visible = true;
    }
});

$("body").on('mouseleave', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.visible = false;
});

export {
    manageConnection,
    addLine
}