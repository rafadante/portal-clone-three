import * as THREE from 'three';
import $ from 'jquery';
import {
    MeshLineGeometry,
    MeshLineMaterial,
    raycast
} from 'meshline';
import {
    AddGoo
} from '../goo/Goo.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
    Pathfinding,
    PathfindingHelper,
} from 'three-pathfinding';
import {
    animate
} from '../../Main.js';
import {
    tweenCamera
} from '../../Main.js';

$("body").on('pointerdown', '.item', function (event) {
    event.preventDefault();
    window.ITEM_HOLDED_NAME = $(this).data("name");
    window.BEAM_TYPE = $(this).data("beam");
    $("#follow").attr("src", $(this).attr("src"));
});

var raycaster = new THREE.Raycaster();

$("body").on('pointerdown', '.dispenser-once', function (event) {
    var i = window.planeUserData[window.SELECTED_ID[0]];
    i.trigger.item.item.state = "once";
    i.state = "once";
    console.log(i);

});

$("body").on('pointerdown', '.dispenser-always', function (event) {
    var i = window.planeUserData[window.SELECTED_ID[0]];
    i.trigger.item.item.state = "always";
    i.state = "always";
    console.log(i);
});

function itemUpdate() { //found, event, type

    if (window.CURRENT_ITEM && window.HOLDING_ITEM) {

        var target = new THREE.Vector3();
        window.holder.getWorldPosition(target);

        //FRONT
        checkCollision(target, new THREE.Vector3(0, 0, -1), "z");

        if (none == 1) {
            window.COL_Z = false;
            window.holder.position.z = -1;
        }
    }
}

var none = 0;

function checkCollision(target, dir, axis) {

    var vector = dir;
    vector = window.MAIN_CAMERA.localToWorld(vector);
    vector.sub(window.MAIN_CAMERA.position); // Now vector is a unit vector with the same direction as the camera

    raycaster.set(window.MAIN_CAMERA.position, vector);
    raycaster.far = 1.2; // comment this line to have an infinite ray
    var intersects = raycaster.intersectObjects(window.ITEMS_ADDED);
}

var itemCount = 0;

const materialLine = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2
});

window.lines = [];
window.checks = [];

function addItem(found, loaded) {


    if (window.ITEM_HOLDED_NAME == "goo") {
        AddGoo(found, false);
        return;
    }

    if (loaded) {
        window.ITEM_HOLDED_NAME = found.itemName.split('-')[0];
    }

    //for (var i = 0; i < found.length; i++) {
    const i = 0;

    if (window.connecting) {

        target = window.planeUserData[found[i].instanceId];

        //
        console.log("9999999999999")
        console.log(window.startItem)
        console.log(target)

        window.startItem.trigger = target;
        window.startItem.normal = found[i].normal;

        findPath(window.startItem.position, target.position, found[i])

        //break;
        //}
    } else {

        var userData;

        if (loaded) {
            userData = found;
            console.log(window.ITEM_HOLDED_NAME)
        } else {
            userData = window.planeUserData[found[i].instanceId];
        }

        //console.log(userData)

        if (!userData.hasItem || loaded) {

            if (window.ITEM_HOLDED_NAME == "camera") {
                var item = window.ITEMS.getObjectByName(window.ITEM_HOLDED_NAME).clone();

                item.traverse(child => {
                    if (child.name == "horizontal")
                        window.horizontal.push(child)
                    else if (child.name == "vertical")
                        window.vertical.push(child)
                })
            } else if (window.ITEM_HOLDED_NAME == "faith_plate" || window.ITEM_HOLDED_NAME == "door") {
                var item = window.ITEMS.getObjectByName(window.ITEM_HOLDED_NAME).clone();


            } else if (window.ITEM_HOLDED_NAME == "gel_blue_dispenser") {
                window.ITEM_HOLDED_NAME = "dispenser";
                var instanced = window.ITEMS_ADDED.getObjectByName("dispenser");
                var item = new THREE.Object3D();
                item.userData = instanced.userData;
            } else {
                var instanced = window.ITEMS_ADDED.getObjectByName(window.ITEM_HOLDED_NAME);
                var item = new THREE.Object3D();
                item.userData = instanced.userData;
            }

            if (item.userData.wall) {
                if (userData.side == "up" || userData.side == "down") {
                    //break;
                }
            } else if (item.userData.ground) {
                if (userData.side == "up") {
                    //break;
                }
            }

            userData.hasItem = true;
            userData.itemName = window.ITEM_HOLDED_NAME + "-" + itemCount;
            userData.item = item;
            userData.state = "open";

            if (window.ITEM_HOLDED_NAME == "camera") {
                var target = new THREE.Vector3(); // create once an reuse it
                found[i].object.getWorldPosition(target);
                item.position.copy(target);
            } else {
                item.position.copy(userData.position);
            }

            item.position.copy(userData.position);
            item.renderOrder = 2;
            item.name = window.ITEM_HOLDED_NAME + "-" + itemCount;
            item.planeInstancedId = userData.id_instanced;

            if (loaded) {
                item.rotation.copy(userData.itemRotation);
            } else if (userData.side == "front") {
                if (window.ITEM_HOLDED_NAME == "light")
                    item.rotation.x = Math.PI / 2;
                else
                    item.rotation.y = 0;
                //item.rotation.x = Math.PI / 2;
            } else if (userData.side == "right") {
                if (window.ITEM_HOLDED_NAME == "light")
                    item.rotation.z = Math.PI / 2;
                else
                    item.rotation.y = -Math.PI / 2;
            } else if (userData.side == "back") {
                if (window.ITEM_HOLDED_NAME == "light")
                    item.rotation.x = -Math.PI / 2;
                else
                    item.rotation.y = Math.PI;
            } else if (userData.side == "left") {
                if (window.ITEM_HOLDED_NAME == "light")
                    item.rotation.z = -Math.PI / 2;
                else
                    item.rotation.y = Math.PI / 2;
            } else if (userData.side == "down") {
                if (window.ITEM_HOLDED_NAME == "cube" || window.ITEM_HOLDED_NAME == "sphere" || window.ITEM_HOLDED_NAME == "laser_cube")
                    item.translateY(1);
                else if (window.ITEM_HOLDED_NAME == "radio")
                    item.translateY(0.25);

                if (window.ITEM_HOLDED_NAME == "stripe" || window.ITEM_HOLDED_NAME == "tractor_beam")
                    item.rotation.x = -Math.PI / 2;
            } else {
                if (window.ITEM_HOLDED_NAME == "light" || window.ITEM_HOLDED_NAME == "button_box")
                    item.rotation.x = Math.PI;
                else if (window.ITEM_HOLDED_NAME == "stripe" || window.ITEM_HOLDED_NAME == "tractor_beam")
                    item.rotation.x = Math.PI / 2;
            }

            userData.itemRotation = item.rotation;

            if (window.ITEM_HOLDED_NAME == "button_box") {


                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00
                });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(item.position)
                //window.MAIN_SCENE.add(cube);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);

                if (loaded) {
                    bb.id = found.id_instanced;
                } else {
                    bb.id = found[i].instanceId;
                }


                window.TRIGGER.push(bb);
            }

            if (window.ITEM_HOLDED_NAME == "cube" || window.ITEM_HOLDED_NAME == "sphere" || window.ITEM_HOLDED_NAME == "laser_cube") {

                var idInstanced;

                for (var j = 0; j < window.DYMANIC_ITEMS["dispenser"].length; j++) {
                    if (window.DYMANIC_ITEMS["dispenser"][j].length == 0) {
                        window.DYMANIC_ITEMS["dispenser"][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                var instanced2 = window.ITEMS_ADDED.getObjectByName("dispenser");
                var item2 = new THREE.Object3D();
                //item2.userData = instanced2.userData;
                item2.position.copy(userData.position);
                //userData.item2 = item2;

                //GET CEILING SURFACE
                for (var x = 0, j = 2; x < 100; x++, j += 2) {

                    var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                    if (boxTop.length > 0) {
                        boxTop[0].hasItem = true;
                        boxTop[0].itemName = "dispenser";
                        boxTop[0].item = item2;
                        item2.translateY(j);
                        break;
                    }
                }

                item.dispenserPosition = item2.position.clone();
                item.hasDispenser = true;
                item.dispenserID = idInstanced;
                item.state = "open";

                item2.item = item;
                item2.userData.id = idInstanced;
                item2.scale.set(1, 1, 1);
                item2.updateMatrix();
                instanced2.setMatrixAt(idInstanced, item2.matrix);
                instanced2.instanceMatrix.needsUpdate = true;
                instanced2.computeBoundingSphere();
            }

            if (window.ITEM_HOLDED_NAME == "light_bridge")
                item.position.y += 1;

            if (window.ITEM_HOLDED_NAME == "tractor_beam")
                item.beam = window.BEAM_TYPE;

            if (window.ITEM_HOLDED_NAME == "camera" || window.ITEM_HOLDED_NAME == "faith_plate") {
                item.translateY(0.025);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(item);
                bb.side = 1;

                if (window.faithBox.length == 1) {
                    item.rotation.y = Math.PI;
                } else if (window.faithBox.length == 2) {
                    item.rotation.y = Math.PI / 2;
                }

                window.faithBox.push(bb);

                item.traverse(child => {
                    if (child.name == "launch") {
                        window.faithBox2.push(child)
                    }
                })


                window.ITEMS_ADDED.add(item);
            } else if (window.ITEM_HOLDED_NAME == "door") {
                window.ITEMS_ADDED.add(item);
                window.DOORS.push(item)
            } else {
                var idInstanced;

                for (var j = 0; j < window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME].length; j++) {
                    if (window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME][j].length == 0) {
                        item.laser = false;
                        window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                if (window.ITEM_HOLDED_NAME == "dispenser") {
                    //GET CEILING SURFACE
                    for (var x = 0, j = 2; x < 100; x++, j += 2) {

                        var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                        if (boxTop.length > 0) {
                            item.translateY(j);
                            break;
                        }
                    }
                }

                item.userData.id = idInstanced;
                item.scale.set(1, 1, 1);
                item.updateMatrix();
                instanced.setMatrixAt(idInstanced, item.matrix);

                if (window.ITEM_HOLDED_NAME == "gel_gun_blue") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0x0000ff));
                    instanced.instanceColor.needsUpdate = true;
                } else if (window.ITEM_HOLDED_NAME == "gel_gun_orange") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0xffa500));
                    instanced.instanceColor.needsUpdate = true;
                } else if (window.ITEM_HOLDED_NAME == "gel_gun_white") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0xffffff));
                    instanced.instanceColor.needsUpdate = true;
                }

                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();
            }

            itemCount++;
            //break;
        }

    }
    //}

    if (loaded) {
        window.ITEM_HOLDED_NAME = null;
        $("#follow").css("display", "none");
        //animate()
    }
}

window.TRIGGER = [];

function findPath(ini, target, found) {

    var nodes = [];

    //
    const geometryCheck = new THREE.PlaneGeometry(0.5, 0.5);
    const materialCheck = new THREE.MeshBasicMaterial({
        color: 0x03e8fc,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -7,
        map: window.CLOSE,
    });
    const plane = new THREE.Mesh(geometryCheck, materialCheck);
    window.MAIN_SCENE.add(plane);

    var side = true;

    console.log(found.instanceId)
    console.log(window.planeUserData[found.instanceId])

    if (window.planeUserData[found.instanceId].side == "up") {
        plane.rotation.x = Math.PI / 2;
        plane.position.set(found.normal.z * 1.3 + (target.x), (target.y), found.normal.x * 1.3 + (target.z))
    } else if (window.planeUserData[found.instanceId].side == "down") {
        plane.rotation.x = -Math.PI / 2;
        plane.position.set((target.x), (target.y), (target.z))
        side = false;
    } else
        plane.position.set(found.normal.z * 1.3 + (target.x), (target.y), found.normal.x * 1.3 + (target.z))

    window.connecting = false;

    window.MATERIAL_PORTAL_EDITOR.opacity = 1;
    window.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
    window.MATERIAL_PORTAL_EDITOR.transparent = false;
    window.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

    isDrawStart = false;
    global.MAIN_SCENE.remove(lineFollow);
    count = 0;

    window.startItem.check = plane;
    window.checks.push(plane);

    for (var j = 0; j < window.planeUserData.length; j++) {
        if (window.planeUserData[j].exists) {
            nodes.push(window.planeUserData[j]);
        }
    }

    var dmap = {};

    for (var j = 0; j < nodes.length; j++) { //making the map for the shapes
        var obj = new THREE.Object3D;
        obj.position.copy(nodes[j].position);
        obj.rotation.copy(nodes[j].rotation);
        obj.name = nodes[j].name;
        scene.add(obj)
        shapes.push(obj);
    }

    for (var i = 0; i < shapes.length; i++) { //making the map for the shapes
        dmap[shapes[i].id] = {};

        for (var j = 1; j < shapes.length; j++) {
            var d = dist(shapes[i].position, shapes[j].position);
            if (shapes[i].id != shapes[j].id && d <= 2) {
                dmap[shapes[i].id][shapes[j].id] = d;
            }
        }
    }

    dgraph = new Graph(dmap);

    path2(dgraph,
        scene.getObjectByName(ini.x + '/' + ini.y + '/' + ini.z).id,
        scene.getObjectByName(target.x + '/' + target.y + '/' + target.z).id, side)
}

var visited = {};
var shapes = [];
var scene = new THREE.Group();

function path2(dgraph, start, end, side) {

    var shortestpath = dgraph.findShortestPath(start, end);

    var d = 0;
    var pathPoints = [];
    var rotPoints = [];
    var direction;
    var points = [];
    var nodesPos = [];
    var nodesRot = [];

    for (var i = 0; i < shortestpath.length - 1; i++) {
        var from = shortestpath[i];
        if (!(shortestpath[i] in visited)) {
            visited[shortestpath[i]] = true;
        }
        var to = shortestpath[i + 1];
        if (!(shortestpath[i + 1] in visited)) {
            visited[shortestpath[i + 1]] = true;
        }
        var fromObj = scene.getObjectById(parseInt(from), true);
        var toObj = scene.getObjectById(parseInt(to), true);
        d += dist(fromObj.position, toObj.position);

        points.push(fromObj.position)
        rotPoints.push(fromObj.rotation)

        if (i >= shortestpath.length - 2) {
            points.push(toObj.position)
            rotPoints.push(toObj.rotation)
        }
    }

    pathPoints.push(points[0])

    for (var j = 1; j < points.length; j++) {

        if (points[j - 1].distanceTo(points[j]) != 2) {

            var dir = new THREE.Vector3(); // create once an reuse it
            dir.subVectors(points[j], points[j - 1]).normalize();

            if (direction.z != 0) {
                if (dir.round().z == 0) {
                    direction.x = direction.z;
                    direction.z = 0;
                }
            }

            var val = points[j - 1].clone();
            val.x -= direction.round().x;
            val.y -= direction.round().y;
            val.z -= direction.round().z;

            pathPoints.push(val)

            rotPoints.push(fromObj.rotation)
            pathPoints.push(points[j])
        } else {
            pathPoints.push(points[j])
        }

        var direction = new THREE.Vector3(); // create once an reuse it
        direction.subVectors(pathPoints[j - 1], points[j]).normalize();
    }

    //
    var dir = new THREE.Vector3(); // create once an reuse it
    dir.subVectors(pathPoints[pathPoints.length - 2], pathPoints[pathPoints.length - 1]).normalize();

    if (side) {
        pathPoints[pathPoints.length - 1].x += dir.x;
        pathPoints[pathPoints.length - 1].y += dir.y;
        pathPoints[pathPoints.length - 1].z += dir.z;
    }

    // Calculate total length of the path
    let totalLength = 0;
    for (let i = 0; i < pathPoints.length - 1; i++) {
        totalLength += pathPoints[i].distanceTo(pathPoints[i + 1]);
    }

    // Number of circles to create
    const numberOfCircles = totalLength * 4;

    // Create circles evenly spaced along the path
    const circleGeometry = new THREE.CircleGeometry(0.05, 32);
    const circleMaterial = new THREE.MeshBasicMaterial({
        side: 2,
        color: 0x03e8fc,
        emissiveIntensity: 100,
        polygonOffset: true,
        polygonOffsetFactor: -5,
    });

    for (let i = 0; i < numberOfCircles; i++) {
        const targetDistance = (i / (numberOfCircles - 1)) * totalLength;
        let currentDistance = 0;

        for (let j = 0; j < pathPoints.length - 1; j++) {
            //console.log(pathPoints[j])
            //console.log(pathPoints[j + 1])


            const segmentLength = pathPoints[j].distanceTo(pathPoints[j + 1]);

            if (currentDistance + segmentLength >= targetDistance) {
                const t = (targetDistance - currentDistance) / segmentLength;
                const point = new THREE.Vector3().lerpVectors(pathPoints[j], pathPoints[j + 1], t);

                nodesPos.push(point);
                nodesRot.push(rotPoints[j]);

                break;
            }

            currentDistance += segmentLength;
        }
    }

    const matrix = new THREE.Matrix4();
    const geometries = [];

    for (let j = 0; j < nodesPos.length; j++) {

        var dummy = new THREE.Object3D();
        dummy.position.copy(nodesPos[j]);
        dummy.rotation.copy(nodesRot[j])
        dummy.updateMatrix();

        matrix.compose(dummy.position, dummy.quaternion, dummy.scale);

        const instanceGeometry = circleGeometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        geometries.push(instanceGeometry);

    }

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);

    var circlePAth = new THREE.Mesh(mergedGeometry, circleMaterial);

    window.MAIN_SCENE.add(circlePAth);
    window.lines.push(circlePAth);
    window.startItem.circle = circlePAth;
}

var dgraph;

function dist(t0, t1) {
    var deltaX = t1.x - t0.x;
    var deltaY = t1.y - t0.y;
    var deltaZ = t1.z - t0.z;

    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    return distance;
}

window.faithBox = [];
window.faithBox2 = [];

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

let lineFollow;
let isDrawStart = false;
var count = 0;
var mouse = new THREE.Vector3();
var positions;

document.addEventListener('keydown', (event) => {

    if (event.code == "Escape" && isDrawStart) {

        isDrawStart = false;
        global.MAIN_SCENE.remove(lineFollow);

        window.connecting = false;

        window.MATERIAL_PORTAL_EDITOR.opacity = 1;
        window.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        window.MATERIAL_PORTAL_EDITOR.transparent = false;
        window.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

        count = 0;
    }
});



$("body").on('click', '#conection', function (event) {

    window.connecting = true;
    window.MATERIAL_PORTAL_EDITOR.opacity = 0.25;
    window.MATERIAL_NON_PORTAL_EDITOR.opacity = 0.25;
    window.MATERIAL_PORTAL_EDITOR.transparent = true;
    window.MATERIAL_NON_PORTAL_EDITOR.transparent = true;

    $(".menu").removeClass("menu-show");

    //LINE FOLLOWS MOUSE WHILE CONNECTING

    var geometry = new THREE.BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    lineFollow = new THREE.Line(geometry, materialLine);
    window.MAIN_SCENE.add(lineFollow);

    isDrawStart = true;

    window.startItem = window.planeUserData[window.SELECTED_ID[0]];

    addPoint(window.planeUserData[window.SELECTED_ID[0]].position.x,
        window.planeUserData[window.SELECTED_ID[0]].position.y,
        window.planeUserData[window.SELECTED_ID[0]].position.z);

    addPoint(window.planeUserData[window.SELECTED_ID[0]].position.x,
        window.planeUserData[window.SELECTED_ID[0]].position.y,
        window.planeUserData[window.SELECTED_ID[0]].position.z);

    //addPoint(window.SELECTED.parent.position.x, window.SELECTED.parent.position.y - 1, window.SELECTED.parent.position.z);
    //addPoint(window.SELECTED.parent.position.x, window.SELECTED.parent.position.y - 1, window.SELECTED.parent.position.z);
})

function addPoint(x, y, z) {

    positions[count * 3 + 0] = x;
    positions[count * 3 + 1] = y;
    positions[count * 3 + 2] = z;
    count++;
    lineFollow.geometry.setDrawRange(0, count);

}

document.body.addEventListener('mousemove', onPointerMove);

function onPointerMove(event) {

    if (!window.connecting)
        return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.z = 0;
    mouse.unproject(window.MAIN_CAMERA);
    if (count !== 0 && window.connecting) {
        updateLine();
    }
}

function updateLine() {

    positions[count * 3 - 3] = mouse.x;
    positions[count * 3 - 2] = mouse.y;
    positions[count * 3 - 1] = mouse.z;
    lineFollow.geometry.attributes.position.needsUpdate = true;

}

function hoverItem(found) {

    if (found.length == 0 && !window.itemSelected) {
        return
    }

    var userData = window.planeUserData[found[0].instanceId];

    window.ITEM_CUBE.position.copy(userData.position);
    window.ITEM_CUBE.visible = true;
}

var itemHolder = null;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function interactWithItem() {
    raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(window.INTERACTIVE);

    if (window.HOLDING_ITEM) {
        window.HOLDING_ITEM = false;

        // Position
        itemHolder.position.setZero();
        itemHolder.previousPosition.setZero();
        itemHolder.interpolatedPosition.setZero();
        itemHolder.initPosition.setZero();

        // Velocity
        itemHolder.velocity.setZero();
        itemHolder.initVelocity.setZero();
        itemHolder.angularVelocity.setZero();
        itemHolder.initAngularVelocity.setZero();

        // Force
        itemHolder.force.setZero();
        itemHolder.torque.setZero();

        // Sleep state reset
        itemHolder.sleepState = 0;
        itemHolder.timeLastSleepy = 0;
        itemHolder._wakeUpAfterNarrowphase = false;

        itemHolder.position.copy(window.CURRENT_ITEM.position);
        itemHolder.quaternion.copy(window.CURRENT_ITEM.quaternion);

        window.PLAYER.velocity.set(0, 0, 0);
        window.PLAYER.angularVelocity.set(0, 0, 0);

        itemHolder.gelJumping = false;

        itemHolder.sleeping = false;
        itemHolder.recall = false;
        window.recalling = false;

        window.CANNON_WORLD.addBody(itemHolder);

        window.CURRENT_ITEM = null;
        window.CURRENT_ITEM_ID = null;
        itemHolder = null;
        window.COL_Z = false;
        window.holder.position.z = -1;
    } else if (intersects.length > 0) {

        if (intersects[0].object.name == "gel_gun_blue" ||
            intersects[0].object.name == "gel_gun_orange" ||
            intersects[0].object.name == "gel_gun_white") {

            if (window.GUN_MODE == 2) {
                for (var i = 2; i >= 0; i--) {
                    if (!window.INK.children[i].visible) {

                        window.INK.children[i].visible = true;
                        window.INK.children[i].name = intersects[0].object.name;

                        if (intersects[0].object.name == "gel_gun_blue") {
                            window.INK.children[i].material.color = new THREE.Color(0x0000ff)
                            window.INK_BLUE = true;
                        } else if (intersects[0].object.name == "gel_gun_orange") {
                            window.INK.children[i].material.color = new THREE.Color(0xffa500)
                            window.INK_ORANGE = true;
                        } else if (intersects[0].object.name == "gel_gun_white") {
                            window.INK.children[i].material.color = new THREE.Color(0xffffff)
                            window.INK_WHITE = true;
                        }

                        break;
                    } else {
                        if (window.INK.children[i].name == intersects[0].object.name)
                            break;
                    }
                }
            }
        } else if (intersects[0].object.name == "pedestal_button") {

            if (intersects[0].distance < 1) {
                var item = window.DYMANIC_ITEMS[intersects[0].object.name][intersects[0].instanceId];
                var goal = window.planeUserData[item.planeInstancedId];
                console.log(goal);

                if (goal.trigger.itemName.includes("exitDoor")) {

                } else if (goal.trigger.itemName.includes("dispenser")) {
                    window.BOX_BODY[goal.trigger.item.userData.id].mass = 5;
                }

                goal.circle.material.color = new THREE.Color(0xfcba03);
                goal.check.material.color = new THREE.Color(0xfcba03);
                goal.check.material.map = window.CHECK;

                setTimeout(() => {
                    goal.circle.material.color = new THREE.Color(0x03e8fc);
                    goal.check.material.color = new THREE.Color(0x03e8fc);
                    goal.check.material.map = window.CLOSE;
                }, 2000);
            }

            //planeInstancedId

            /*var plane = getPlaneByName(name)
            console.log(plane);

            */

            /*for (var i = 0; i < window.BOX_BODY.length; i++) {
                window.BOX_BODY[i].mass = 5;

                window.lines[1].material.color = new THREE.Color(0xfcba03);
                window.checks[1].material.color = new THREE.Color(0xfcba03);

                setTimeout(() => {
                    window.lines[1].material.color = new THREE.Color(0x03e8fc);
                    window.checks[1].material.color = new THREE.Color(0x03e8fc);
                }, 2000);
                //window.CANNON_WORLD.addBody(window.BOX_BODY[i])
            }*/
        } else {
            if (intersects[0].distance < 2) {
                window.HOLDING_ITEM = true;
                var instancedId = intersects[0].instanceId;
                var name = intersects[0].object.name;

                window.CURRENT_ITEM = window.DYMANIC_ITEMS[name][instancedId];
                window.CURRENT_INSTANCED = window.ITEMS_ADDED.getObjectByName(name);
                window.CURRENT_ITEM_ID = instancedId;

                itemHolder = window.DYMANIC_ITEMS[name][instancedId].body;
                window.CANNON_WORLD.removeBody(window.DYMANIC_ITEMS[name][instancedId].body);

                console.log(window.DYMANIC_ITEMS[name][instancedId].body)
                if (window.DYMANIC_ITEMS[name][instancedId].body.placed) {
                    revert(window.DYMANIC_ITEMS[name][instancedId].body)
                }
            }
        }
    }

    window.lightningStrikeMesh.visible = window.HOLDING_ITEM;
    window.lightningStrikeMesh2.visible = window.HOLDING_ITEM;
    window.lightningStrikeMesh3.visible = window.HOLDING_ITEM;
}

function revert(d) {
    console.log("ppppppppppppppp")
    var goal = d.goal;
    goal.circle.material.color = new THREE.Color(0x03e8fc);
    goal.check.material.color = new THREE.Color(0x03e8fc);
    goal.check.material.map = window.CLOSE;

    setTimeout(() => {
        d.placed = false;
        d.goal = null;
    }, 5000);

    if (goal.trigger.itemName.includes("door")) {
        console.log("55555555555555")
        const doorLeft = goal.trigger.item.getObjectByName("door_left");
        const doorRight = goal.trigger.item.getObjectByName("door_right");

        setTimeout(() => {
            //doorLeft.position.z += 0.1;
            //doorRight.position.z += 0.1;
            window.CANNON_WORLD.addBody(goal.trigger.item.body);
            tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x + 1, doorLeft.position.y, doorLeft.position.z))
            tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x - 1, doorRight.position.y, doorRight.position.z))
        }, 1000);

    } else {
        /*exit = true;
        setTimeout(() => {
            tweenCamera(500, window.exit_door_right_spinner.rotation, new THREE.Vector3(Math.PI,
                window.exit_door_right_spinner.rotation.y,
                window.exit_door_right_spinner.rotation.z))

            tweenCamera(500, window.exit_door_left_spinner.rotation, new THREE.Vector3(Math.PI,
                window.exit_door_left_spinner.rotation.y,
                window.exit_door_left_spinner.rotation.z))

            window.CORRIDOR_EXIT.visible = true;

            window.exit_door_right.position.z = -5;
            tweenCamera(1000, window.exit_door_right.position, new THREE.Vector3(window.exit_door_right.position.x + 60, window.exit_door_right.position.y, window.exit_door_right.position.z))

            window.exit_door_left.position.z = -5;
            tweenCamera(1000, window.exit_door_left.position, new THREE.Vector3(window.exit_door_right.position.x + 60, window.exit_door_left.position.y, window.exit_door_left.position.z))
        }, 1000);*/
    }
}

//graph.js
//data structure to hold a weighted graph
//based off of http://graphdracula.net code but without jquery

var Graph = (function (undefined) {

    var extractKeys = function (obj) {
        var keys = [],
            key;
        for (key in obj) {
            Object.prototype.hasOwnProperty.call(obj, key) && keys.push(key);
        }
        return keys;
    }

    var sorter = function (a, b) {
        return parseFloat(a) - parseFloat(b);
    }

    var findPaths = function (map, start, end, infinity) {
        infinity = infinity || Infinity;
        console.log(this)
        this.start = start;
        this.end = end;

        var costs = {},
            open = {
                '0': [start]
            },
            predecessors = {},
            keys;

        var addToOpen = function (cost, vertex) {
            var key = "" + cost;
            if (!open[key]) open[key] = [];
            open[key].push(vertex);
        }

        costs[start] = 0;

        while (open) {
            if (!(keys = extractKeys(open)).length) break;

            keys.sort(sorter);

            var key = keys[0],
                bucket = open[key],
                node = bucket.shift(),
                currentCost = parseFloat(key),
                adjacentNodes = map[node] || {};

            if (!bucket.length) delete open[key];

            for (var vertex in adjacentNodes) {
                if (Object.prototype.hasOwnProperty.call(adjacentNodes, vertex)) {
                    var cost = adjacentNodes[vertex],
                        totalCost = cost + currentCost,
                        vertexCost = costs[vertex];

                    if ((vertexCost === undefined) || (vertexCost > totalCost)) {
                        costs[vertex] = totalCost;
                        addToOpen(totalCost, vertex);
                        predecessors[vertex] = node;
                    }
                }
            }
        }

        if (costs[end] === undefined) {
            return null;
        } else {
            return predecessors;
        }

    }

    var extractShortest = function (predecessors, end) {
        var nodes = [],
            u = end;

        while (u) {
            nodes.push(u);
            u = predecessors[u];
        }

        nodes.reverse();
        return nodes;
    }

    var findShortestPath = function (map, nodes) {
        var start = nodes.shift(),
            end,
            predecessors,
            path = [],
            shortest;

        while (nodes.length) {
            end = nodes.shift();
            predecessors = new findPaths(map, start, end);

            if (predecessors) {
                shortest = extractShortest(predecessors, end);
                if (nodes.length) {
                    path.push.apply(path, shortest.slice(0, -1));
                } else {
                    return path.concat(shortest);
                }
            } else {
                return null;
            }

            start = end;
        }
    }

    var toArray = function (list, offset) {
        try {
            return Array.prototype.slice.call(list, offset);
        } catch (e) {
            var a = [];
            for (var i = offset || 0, l = list.length; i < l; ++i) {
                a.push(list[i]);
            }
            return a;
        }
    }

    var Graph = function (map) {
        this.map = map;
        this.keys = Object.keys(map);
        var values = this.keys.map(function (v) {
            return map[v];
        });
        var connectors = [];
        for (var i = 0; i < this.keys.length; i++) {
            var vkeys = Object.keys(values[i]);
            var weights = vkeys.map(function (vv) {
                return values[i][vv].toString();
            });
            for (var j = 0; j < vkeys.length; j++) {
                connectors.push([this.keys[i], vkeys[j], weights[j]]);
            }
        }
        this.connectors = connectors;
    }

    Graph.prototype.findShortestPath = function (start, end) {
        if (Object.prototype.toString.call(start) === '[object Array]') {
            return findShortestPath(this.map, start);
        } else if (arguments.length === 2) {
            return findShortestPath(this.map, [start, end]);
        } else {
            return findShortestPath(this.map, toArray(arguments));
        }
    }

    Graph.prototype.map = function () {
        return this.map;
    }

    Graph.prototype.nodes = function () {
        return this.keys;
    }
    Graph.prototype.edges = function () {
        return this.connectors;

    }
    return Graph;

})();

export {
    itemUpdate,
    addItem,
    hoverItem,
    interactWithItem,
    findPath
};