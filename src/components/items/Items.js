/* eslint-disable */
import * as THREE from 'three';
import $ from 'jquery';
import {
    AddGoo
} from '../goo/Goo.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import {
    animate
} from '../../Main.js';
import {
    tweenCamera
} from '../../Main.js';
import {
    GLOBALS
} from '../../Globals.js';
import {
    removeJointConstraint
} from '../../Physics.js';

var beamType;

$("body").on('pointerdown', '.item', function (event) {
    event.preventDefault();
    GLOBALS.ITEM_HOLDED_NAME = $(this).data("name");
    beamType = $(this).data("beam");
    $("#follow").attr("src", $(this).attr("src"));
});

var raycaster = new THREE.Raycaster();

$("body").on('pointerdown', '.dispenser-once', function (event) {
    var i = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];
    i.trigger.item.item.state = "once";
    i.state = "once";

});

$("body").on('pointerdown', '.dispenser-always', function (event) {
    var i = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];
    i.trigger.item.item.state = "always";
    i.state = "always";
});

function itemUpdate() { //found, event, type

    if (GLOBALS.CURRENT_ITEM && GLOBALS.HOLDING_ITEM) {

        var target = new THREE.Vector3();
        GLOBALS.MAIN_CAMERA.getObjectByName("cubeHolder").getWorldPosition(target);

        //FRONT
        checkCollision(target, new THREE.Vector3(0, 0, -1), "z");

        if (none == 1) {
            GLOBALS.MAIN_CAMERA.getObjectByName("cubeHolder").position.z = -1;
        }
    }
}

var none = 0;

function checkCollision(target, dir, axis) {

    var vector = dir;
    vector = GLOBALS.MAIN_CAMERA.localToWorld(vector);
    vector.sub(GLOBALS.MAIN_CAMERA.position); // Now vector is a unit vector with the same direction as the camera

    raycaster.set(GLOBALS.MAIN_CAMERA.position, vector);
    raycaster.far = 1.2; // comment this line to have an infinite ray
    var intersects = raycaster.intersectObjects(GLOBALS.ITEMS_ADDED);
}

var itemCount = 0;

const materialLine = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2
});

function addItem(found, loaded) {


    if (GLOBALS.ITEM_HOLDED_NAME == "goo") {
        AddGoo(found, false);
        return;
    }

    if (loaded) {
        GLOBALS.ITEM_HOLDED_NAME = found.itemName.split('-')[0];
    }

    //for (var i = 0; i < found.length; i++) {
    const i = 0;

    if (GLOBALS.CONNECTING) {

        target = GLOBALS.PLANE_USER_DATA[found[i].instanceId];

        GLOBALS.SELECTED_FOR_CONNECTION.trigger = target;
        GLOBALS.SELECTED_FOR_CONNECTION.normal = found[i].normal;

        findPath(GLOBALS.SELECTED_FOR_CONNECTION.position, target.position, found[i])

        //break;
        //}
    } else {

        var userData;

        if (loaded) {
            userData = found;
        } else {
            userData = GLOBALS.PLANE_USER_DATA[found[i].instanceId];
            userData.hasItem = false; //delete here
        }

        if (!userData.hasItem || loaded) {

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var item = GLOBALS.ITEMS.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();

                item.traverse(child => {
                    if (child.name == "horizontal")
                        GLOBALS.CAMERA_OBJ_HORIZONTAL.push(child)
                    else if (child.name == "vertical")
                        GLOBALS.CAMERA_OBJ_VERTICAL.push(child)
                })
            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate" || GLOBALS.ITEM_HOLDED_NAME == "door") {
                var item = GLOBALS.ITEMS.getObjectByName(GLOBALS.ITEM_HOLDED_NAME).clone();


            } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_blue2") {
                GLOBALS.ITEM_HOLDED_NAME = "dispenser";
                var instanced = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
                var item = new THREE.Object3D();
                item.userData = instanced.userData;
            } else {
                var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.ITEM_HOLDED_NAME);
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
            userData.itemName = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;
            userData.item = item;
            userData.state = "open";

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {
                var target = new THREE.Vector3(); // create once an reuse it

                console.log(found)

                if (loaded)
                    target = found.position;
                else
                    found[i].object.getWorldPosition(target);

                item.position.copy(target);
            } else {
                item.position.copy(userData.position);
            }

            item.position.copy(userData.position);
            item.renderOrder = 2;
            item.name = GLOBALS.ITEM_HOLDED_NAME + "-" + itemCount;
            item.planeInstancedId = userData.id_instanced;

            if (loaded) {
                item.rotation.copy(userData.itemRotation);
            } else if (userData.side == "front") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.x = Math.PI / 2;
                else
                    item.rotation.y = 0;
                //item.rotation.x = Math.PI / 2;
            } else if (userData.side == "right") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.z = Math.PI / 2;
                else
                    item.rotation.y = -Math.PI / 2;
            } else if (userData.side == "back") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.x = -Math.PI / 2;
                else
                    item.rotation.y = Math.PI;
            } else if (userData.side == "left") {
                if (GLOBALS.ITEM_HOLDED_NAME == "light")
                    item.rotation.z = -Math.PI / 2;
                else
                    item.rotation.y = Math.PI / 2;
            } else if (userData.side == "down") {
                if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube")
                    item.translateY(1);
                else if (GLOBALS.ITEM_HOLDED_NAME == "radio")
                    item.translateY(0.25);

                if (GLOBALS.ITEM_HOLDED_NAME == "stripe" || GLOBALS.ITEM_HOLDED_NAME == "tractor_beam")
                    item.rotation.x = -Math.PI / 2;
            } else {
                if (GLOBALS.ITEM_HOLDED_NAME == "light" || GLOBALS.ITEM_HOLDED_NAME == "button_box")
                    item.rotation.x = Math.PI;
                else if (GLOBALS.ITEM_HOLDED_NAME == "stripe" || GLOBALS.ITEM_HOLDED_NAME == "tractor_beam")
                    item.rotation.x = Math.PI / 2;
            }

            userData.itemRotation = item.rotation;

            if (GLOBALS.ITEM_HOLDED_NAME == "button_box") {


                const geometry = new THREE.BoxGeometry(1, 1, 1);
                const material = new THREE.MeshBasicMaterial({
                    color: 0x00ff00
                });
                const cube = new THREE.Mesh(geometry, material);
                cube.position.copy(item.position)
                //GLOBALS.SCENE_CHILDREN.add(cube);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);

                if (loaded) {
                    bb.id = found.id_instanced;
                } else {
                    bb.id = found[i].instanceId;
                }


                GLOBALS.TRIGGER.push(bb);
            }

            if (GLOBALS.ITEM_HOLDED_NAME == "cube" || GLOBALS.ITEM_HOLDED_NAME == "sphere" || GLOBALS.ITEM_HOLDED_NAME == "laser_cube") {

                var idInstanced;

                for (var j = 0; j < GLOBALS.DYMANIC_ITEMS["dispenser"].length; j++) {
                    if (GLOBALS.DYMANIC_ITEMS["dispenser"][j].length == 0) {
                        GLOBALS.DYMANIC_ITEMS["dispenser"][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                var instanced2 = GLOBALS.ITEMS_ADDED.getObjectByName("dispenser");
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

            if (GLOBALS.ITEM_HOLDED_NAME == "light_bridge")
                item.position.y += 1;

            if (GLOBALS.ITEM_HOLDED_NAME == "tractor_beam")
                item.beam = beamType;

            if (GLOBALS.ITEM_HOLDED_NAME == "camera") {

                console.log(item)
                item.translateY(1)
                item.translateZ(0.3)

                const geometry = new THREE.BoxGeometry( 0.6, 0.6, 0.6 ); 
                const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} ); 
                const cube = new THREE.Mesh( geometry, material ); 
                cube.name = "camera";
                cube.visible = false;

                var holder = new THREE.Vector3();
                item.children[1].getWorldPosition(holder)
                holder.y -= 0.25;

                cube.position.copy(holder)
                GLOBALS.SCENE.add( cube );

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(cube);
                item.box3 = bb;
                item.fixed = true;
                item.cube = cube;


                GLOBALS.CAMERAS.push(item);
                GLOBALS.ITEMS_ADDED.add(item);

                console.log(GLOBALS.CAMERAS)

            } else if (GLOBALS.ITEM_HOLDED_NAME == "faith_plate") {
                item.translateY(0.025);

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(item);
                bb.side = 1;
                bb.position = item.position;
                bb.item = item;
                //bb.max.x += 0.3;
                //bb.max.z += 0.3;

                //item.rotation.y = Math.PI;

                /*if (GLOBALS.FAITH_PLATE_CONTACT_BOX.length == 0) {
                    item.rotation.y = Math.PI;
                } else if (GLOBALS.FAITH_PLATE_CONTACT_BOX.length == 2) {
                    item.rotation.y = Math.PI / 2;
                }*/

                GLOBALS.FAITH_PLATE_CONTACT_BOX.push(bb);

                item.traverse(child => {
                    if (child.name == "launch") {
                        GLOBALS.FAITH_PLATE_TO_ROTATE.push(child)
                    }
                })


                GLOBALS.ITEMS_ADDED.add(item);
            } else if (GLOBALS.ITEM_HOLDED_NAME == "door") {
                GLOBALS.ITEMS_ADDED.add(item);
                GLOBALS.DOORS.push(item)
            } else {
                var idInstanced;

                for (var j = 0; j < GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME].length; j++) {
                    if (GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME][j].length == 0) {
                        item.laser = false;
                        GLOBALS.DYMANIC_ITEMS[GLOBALS.ITEM_HOLDED_NAME][j] = item;
                        idInstanced = j;
                        break;
                    }
                }

                if (GLOBALS.ITEM_HOLDED_NAME == "dispenser") {
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

                if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_blue") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0x0000ff));
                    instanced.instanceColor.needsUpdate = true;
                } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_orange") {
                    instanced.setColorAt(idInstanced, new THREE.Color(0xffa500));
                    instanced.instanceColor.needsUpdate = true;
                } else if (GLOBALS.ITEM_HOLDED_NAME == "gel_gun_white") {
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
        GLOBALS.ITEM_HOLDED_NAME = null;
        $("#follow").css("display", "none");
        //animate()
    }
}

function findPath(ini, target, found) {

    var nodes = [];

    //
    const geometryCheck = new THREE.PlaneGeometry(0.5, 0.5);
    const materialCheck = new THREE.MeshBasicMaterial({
        color: 0x03e8fc,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: -7,
        map: GLOBALS.IMG_CLOSE,
    });
    const plane = new THREE.Mesh(geometryCheck, materialCheck);
    GLOBALS.SCENE_CHILDREN.add(plane);

    var side = true;

    if (GLOBALS.PLANE_USER_DATA[found.instanceId].side == "up") {
        plane.rotation.x = Math.PI / 2;
        plane.position.set(found.normal.z * 1.3 + (target.x), (target.y), found.normal.x * 1.3 + (target.z))
    } else if (GLOBALS.PLANE_USER_DATA[found.instanceId].side == "down") {
        plane.rotation.x = -Math.PI / 2;
        plane.position.set((target.x), (target.y), (target.z))
        side = false;
    } else
        plane.position.set(found.normal.z * 1.3 + (target.x), (target.y), found.normal.x * 1.3 + (target.z))

    GLOBALS.CONNECTING = false;

    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

    isDrawStart = false;
    GLOBALS.SCENE_CHILDREN.remove(lineFollow);
    count = 0;

    GLOBALS.SELECTED_FOR_CONNECTION.check = plane;

    for (var j = 0; j < GLOBALS.PLANE_USER_DATA.length; j++) {
        if (GLOBALS.PLANE_USER_DATA[j].exists) {
            nodes.push(GLOBALS.PLANE_USER_DATA[j]);
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

    GLOBALS.SCENE_CHILDREN.add(circlePAth);
    GLOBALS.SELECTED_FOR_CONNECTION.circle = circlePAth;
}

var dgraph;

function dist(t0, t1) {
    var deltaX = t1.x - t0.x;
    var deltaY = t1.y - t0.y;
    var deltaZ = t1.z - t0.z;

    var distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

    return distance;
}

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
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
        GLOBALS.SCENE_CHILDREN.remove(lineFollow);

        GLOBALS.CONNECTING = false;

        GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
        GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = false;
        GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

        count = 0;
    }
});



$("body").on('click', '#conection', function (event) {

    GLOBALS.CONNECTING = true;
    GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 0.25;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 0.25;
    GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = true;
    GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = true;

    $(".menu").removeClass("menu-show");

    //LINE FOLLOWS MOUSE WHILE CONNECTING

    var geometry = new THREE.BufferGeometry();
    var MAX_POINTS = 500;
    positions = new Float32Array(MAX_POINTS * 3);
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    lineFollow = new THREE.Line(geometry, materialLine);
    GLOBALS.SCENE_CHILDREN.add(lineFollow);

    isDrawStart = true;

    GLOBALS.SELECTED_FOR_CONNECTION = GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]];

    addPoint(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.x,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.y,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.z);

    addPoint(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.x,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.y,
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].position.z);

    //addPoint(GLOBALS.SELECTED.parent.position.x, GLOBALS.SELECTED.parent.position.y - 1, GLOBALS.SELECTED.parent.position.z);
    //addPoint(GLOBALS.SELECTED.parent.position.x, GLOBALS.SELECTED.parent.position.y - 1, GLOBALS.SELECTED.parent.position.z);
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

    if (!GLOBALS.CONNECTING)
        return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.z = 0;
    mouse.unproject(GLOBALS.MAIN_CAMERA);
    if (count !== 0 && GLOBALS.CONNECTING) {
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

    if (found.length == 0) {
        return
    }

    var userData = GLOBALS.PLANE_USER_DATA[found[0].instanceId];

    GLOBALS.ITEM_CUBE.position.copy(userData.position);
    GLOBALS.ITEM_CUBE.visible = true;
}

var itemHolder = null;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function interactWithItem() {
    raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(GLOBALS.INTERACTIVE);

    if (GLOBALS.HOLDING_ITEM) {

        GLOBALS.HOLDING_ITEM = false;

        /*
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

        itemHolder.position.copy(GLOBALS.CURRENT_ITEM.position);
        itemHolder.quaternion.copy(GLOBALS.CURRENT_ITEM.quaternion);

        GLOBALS.PLAYER.velocity.set(0, 0, 0);
        GLOBALS.PLAYER.angularVelocity.set(0, 0, 0);*/

        console.log(GLOBALS.CURRENT_ITEM)

        if(itemHolder){
            itemHolder.gelJumping = false;
            itemHolder.sleeping = false;
        }
        

        //GLOBALS.CANNON_WORLD.addBody(itemHolder);
        GLOBALS.CURRENT_ITEM.body.holding = false;
        GLOBALS.CURRENT_ITEM.body.angularDamping = 0;
        GLOBALS.CURRENT_ITEM.body.allowSleep = true;
        GLOBALS.CURRENT_ITEM = null;
        GLOBALS.CURRENT_ITEM_ID = null;
        itemHolder = null;
        //GLOBALS.MAIN_CAMERA.getObjectByName("cubeHolder").position.z = -1;

        removeJointConstraint();

        
    } else if (intersects.length > 0) {

        if (intersects[0].object.name == "pedestal_button") {

            if (intersects[0].distance < 1) {
                var item = GLOBALS.DYMANIC_ITEMS[intersects[0].object.name][intersects[0].instanceId];
                var goal = GLOBALS.PLANE_USER_DATA[item.planeInstancedId];

                if (goal.trigger.itemName.includes("exitDoor")) {

                } else if (goal.trigger.itemName.includes("dispenser")) {
                    GLOBALS.BOX_BODY[goal.trigger.item.userData.id].mass = 5;
                }

                goal.circle.material.color = new THREE.Color(0xfcba03);
                goal.check.material.color = new THREE.Color(0xfcba03);
                goal.check.material.map = GLOBALS.IMG_CHECK;

                setTimeout(() => {
                    goal.circle.material.color = new THREE.Color(0x03e8fc);
                    goal.check.material.color = new THREE.Color(0x03e8fc);
                    goal.check.material.map = GLOBALS.CLOSE;
                }, 2000);
            }
        } else {
            if (intersects[0].distance < 2) {
                GLOBALS.HOLDING_ITEM = true;

                console.log(intersects[0].object.name)

                if(intersects[0].object.name != "camera"){
                    var instancedId = intersects[0].instanceId;
                    var name = intersects[0].object.name;
    
                    GLOBALS.CURRENT_ITEM = GLOBALS.DYMANIC_ITEMS[name][instancedId];
                    GLOBALS.CURRENT_INSTANCED = GLOBALS.ITEMS_ADDED.getObjectByName(name);
                    GLOBALS.CURRENT_ITEM_ID = instancedId;
    
                    itemHolder = GLOBALS.DYMANIC_ITEMS[name][instancedId].body;
                    //GLOBALS.CANNON_WORLD.removeBody(GLOBALS.DYMANIC_ITEMS[name][instancedId].body);
                    GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
                    GLOBALS.CURRENT_ITEM.body.allowSleep = false;
                    GLOBALS.CURRENT_ITEM.body.holding = true;
                    //GLOBALS.CURRENT_ITEM.body.quaternion.setZero();
    
                    if (GLOBALS.DYMANIC_ITEMS[name][instancedId].body.placed) {
                        revert(GLOBALS.DYMANIC_ITEMS[name][instancedId].body)
                    }
                }else{
                    GLOBALS.CURRENT_ITEM = intersects[0].object;
                    GLOBALS.CURRENT_ITEM.body.angularDamping = 1;
                    GLOBALS.CURRENT_ITEM.body.allowSleep = false;
                    GLOBALS.CURRENT_ITEM.body.holding = true;
                }

                
            }
        }
    }

    GLOBALS.LIGHTNIN_STRIKE_1.visible = GLOBALS.HOLDING_ITEM;
    GLOBALS.LIGHTNIN_STRIKE_2.visible = GLOBALS.HOLDING_ITEM;
    GLOBALS.LIGHTNIN_STRIKE_3.visible = GLOBALS.HOLDING_ITEM;
}

function revert(d) {
    var goal = d.goal;
    goal.circle.material.color = new THREE.Color(0x03e8fc);
    goal.check.material.color = new THREE.Color(0x03e8fc);
    goal.check.material.map = GLOBALS.IMG_CLOSE;

    setTimeout(() => {
        d.placed = false;
        d.goal = null;
    }, 5000);

    if (goal.trigger.itemName.includes("door")) {
        const doorLeft = goal.trigger.item.getObjectByName("door_left");
        const doorRight = goal.trigger.item.getObjectByName("door_right");

        setTimeout(() => {
            //doorLeft.position.z += 0.1;
            //doorRight.position.z += 0.1;
            GLOBALS.CANNON_WORLD.addBody(goal.trigger.item.body);
            tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x + 1, doorLeft.position.y, doorLeft.position.z))
            tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x - 1, doorRight.position.y, doorRight.position.z))
        }, 1000);

    } else {
        /*exit = true;
        setTimeout(() => {
            tweenCamera(500, GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation, new THREE.Vector3(Math.PI,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation.y,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation.z))

            tweenCamera(500, GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation, new THREE.Vector3(Math.PI,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation.y,
                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation.z))

            GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z = -5;
            tweenCamera(1000, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position, new THREE.Vector3(GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.x + 60, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.y, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z))

            GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z = -5;
            tweenCamera(1000, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position, new THREE.Vector3(GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.x + 60, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.y, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z))
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