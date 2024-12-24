import {
    GLOBALS
} from '../../Globals.js';
import {
    Color,
    Vector3,
    BufferGeometry,
    LineBasicMaterial,
    Line,
    AdditiveBlending,
    Float32BufferAttribute,
    MathUtils,
    Object3D,
    SphereGeometry,
    MeshBasicMaterial,
    MeshStandardMaterial
} from 'three';
import $ from 'jquery';
import { findPath } from '../findPath/FindPath.js';
import { targetFaithPlateEnd } from '../faithPlate/FaithPlate.js';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

const geometry = new SphereGeometry(0.1, 8, 4);
const material = new MeshStandardMaterial({ color: 0xffffff, depthTest: false, transparent: true });
console.log(material)
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

    if (GLOBALS.FAITH_PLATE_TARGET) {
        targetFaithPlateEnd(GLOBALS.PLANE_USER_DATA[instanceId])
    } else if (GLOBALS.PLANE_USER_DATA[instanceId].allowconnection &&
        !GLOBALS.SELECTED_FOR_CONNECTION.item.userData.connectedTo.includes(GLOBALS.PLANE_USER_DATA[instanceId].id_instanced) &
        GLOBALS.PLANE_USER_DATA[instanceId].item.userData.connections < 10) {


        GLOBALS.PLANE_USER_DATA[instanceId].item.userData.connections += 1;

        var endPos, checker, clone;

        for (var i = 0; i < 10; i++) {

            console.log(GLOBALS.PLANE_USER_DATA[instanceId])

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

        const line = addLine(from.position, endPos);

        GLOBALS.SCENE_CHILDREN.add(line);

        GLOBALS.CONNECTIONS.push({
            line: line,
            from: from,
            line2: null,
            to: GLOBALS.PLANE_USER_DATA[instanceId],
            checker: checker,
            clone: clone
        });

        from.item.userData.connectedTo.push(instanceId);
        //findPath(from.position, GLOBALS.PLANE_USER_DATA[instanceId].position, GLOBALS.PLANE_USER_DATA[instanceId], from)

        console.log(from)
        console.log(line)

        if(from.instancedName == "trigger_area")
            line.visible = false;
    }

    GLOBALS.ITEM_CUBE.visible = false;
    GLOBALS.CURRENT_LINE = null;
}

function addLine(position, endPos, index) {

    /*if (index) {
        window.checkers.instances[index].position.copy(endPos);
        window.checkers.instances[index].updateMatrix(); // necessary after transformations
        window.checkers.computeBoundingSphere();
    }*/

    const points = [];
    points.push(position);
    points.push(endPos);

    const geometry = new BufferGeometry().setFromPoints(points);
    const materialLine = new LineBasicMaterial({
        transparent: true, // Enable transparency
        color: colorInnactive
    });
    const line = new Line(geometry, materialLine);

    /*// Two points for the line
    const pointA = new Vector3(
        position.x,
        position.y,
        position.z
    ); // Starting point
    const pointB = endPos;  // Ending point
    const N = 10; // Number of vertices along the line

    // Create a line with interpolated vertices
    const positions = [];
    for (let i = 0; i <= N; i++) {
        const t = i / N; // Interpolation factor (0 to 1)
        const x = MathUtils.lerp(pointA.x, pointB.x, t);
        const y = MathUtils.lerp(pointA.y, pointB.y, t);
        const z = MathUtils.lerp(pointA.z, pointB.z, t);
        positions.push(x, y, z);
    }

    // Define initial vertex colors for the trail effect
    const colors = [];
    const color = new Color();
    for (let i = 0; i <= N; i++) {
        color.setHSL(0.6, 1, (1 - i / (N - 1)) ** 4);
        colors.push(color.r, color.g, color.b);
    }

    // Create the geometry and material for the line
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
    geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));

    const material = new LineBasicMaterial({
        vertexColors: true, // Use the colors defined above
        blending: AdditiveBlending, // Additive blending for a glow-like effect
        transparent: true, // Enable transparency
        opacity: 0.8, // Optional opacity control
    });

    const line = new Line(geometry, material);

    // Get references to the geometry attributes
    line.colorAttribute = geometry.getAttribute("color");
    line.color = color;*/

    window.lines.push(line);

    return line;
}

window.lines = [];

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
});

$("body").on('mouseenter', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.position.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].position);
    GLOBALS.ITEM_CUBE.rotation.copy(GLOBALS.CONNECTIONS[$(this).data("id")]["to"].rotation);
    GLOBALS.ITEM_CUBE.translateZ(1)
    GLOBALS.ITEM_CUBE.material.color = new Color(0xff0000);
    GLOBALS.ITEM_CUBE.visible = true;
});

$("body").on('mouseleave', '.removeConnection', function () {
    GLOBALS.ITEM_CUBE.visible = false;
});

export {
    manageConnection,
    addLine
}