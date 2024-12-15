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
    Vector3,
    BufferGeometry,
    LineBasicMaterial,
    Line,
    AdditiveBlending,
    Float32BufferAttribute,
    MathUtils
} from 'three';
import $ from 'jquery';
import { animate } from '../../Main';
import { findPath } from '../findPath/FindPath.js';
import { targetFaithPlateEnd } from '../faithPlate/FaithPlate.js';

function manageConnection(instanceId, from) {
    GLOBALS.CONNECTING = false;

    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;
    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.CURRENT_LINE);

    if (GLOBALS.FAITH_PLATE_TARGET) {
        targetFaithPlateEnd(GLOBALS.PLANE_USER_DATA[instanceId])
    } else if (GLOBALS.PLANE_USER_DATA[instanceId].allowconnection) {

        GLOBALS.PLANE_USER_DATA[instanceId].item.userData.connections += 1;

        var endPos = new Vector3(
            GLOBALS.PLANE_USER_DATA[instanceId].position.x,
            GLOBALS.PLANE_USER_DATA[instanceId].position.y,
            GLOBALS.PLANE_USER_DATA[instanceId].position.z
        );

        if (GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("cube") || GLOBALS.PLANE_USER_DATA[instanceId].itemName.includes("sphere"))
            endPos = GLOBALS.PLANE_USER_DATA[instanceId].item.dispenserPosition

        const line = addLine(from.position, endPos);

        GLOBALS.SCENE_CHILDREN.add(line);

        GLOBALS.CONNECTIONS.push({
            line: line,
            from: from,
            line2: null,
            to: GLOBALS.PLANE_USER_DATA[instanceId]
        });

        from.item.userData.connectedTo.push(instanceId);

        //findPath(from.position, GLOBALS.PLANE_USER_DATA[instanceId].position, GLOBALS.PLANE_USER_DATA[instanceId], from)
    }

    GLOBALS.ITEM_CUBE.visible = false;
    GLOBALS.CURRENT_LINE = null;
}

function addLine(position, endPos) {

    // Two points for the line
    const pointA = new Vector3(
        position.x,
        position.y,
        position.z
    ); // Starting point
    const pointB = endPos;  // Ending point
    const N = 100; // Number of vertices along the line

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
        color.setHSL( 0.6, 1, (1-i/(N-1))**4 );
		colors.push( color.r, color.g, color.b );
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
    line.color = color;

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
    manageConnection,
    addLine
}