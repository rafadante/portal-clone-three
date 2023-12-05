import * as THREE from '../../build/three.module.js';
import $ from 'jquery';
import {
    MeshLineGeometry,
    MeshLineMaterial,
    raycast
} from 'meshline';
import {
    AddGoo
} from '../goo/Goo.js';

$("body").on('pointerdown', '.item', function (event) {
    event.preventDefault();
    window.ITEM_HOLDED_NAME = $(this).data("name");
    window.BEAM_TYPE = $(this).data("beam");
    $("#follow").attr("src", $(this).attr("src"));
});

var raycaster = new THREE.Raycaster();

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

function addItem(found) {

    if (window.ITEM_HOLDED_NAME == "goo") {
        AddGoo(found);
        return;
    }

    for (var i = 0; i < found.length; i++) {

        if (window.connecting) {

            if (found[i].object.userData.connection) {

                const geometryCheck = new THREE.PlaneGeometry(0.5, 0.5);
                const materialCheck = new THREE.MeshBasicMaterial({
                    color: 0xfcba03,
                    side: THREE.DoubleSide,
                    polygonOffset: true,
                    polygonOffsetFactor: -5,
                    map: window.CHECK,
                });
                const plane = new THREE.Mesh(geometryCheck, materialCheck);
                window.MAIN_SCENE.add(plane);

                var target = new THREE.Vector3();
                found[i].object.getWorldPosition(target)

                if (found[i].normal.x != 0)
                    plane.rotation.y = Math.PI / 2;

                found[i].object.userData.checks++;

                if (found[i].object.userData.checks < 5)
                    plane.position.set(found[i].normal.z * 1.3 + (target.x), 1.25 - (found[i].object.userData.checks * 0.5) + (target.y), found[i].normal.x * 1.3 + (target.z))
                else
                    plane.position.set(-found[i].normal.z * 1.3 + (target.x), 1.25 - ((found[i].object.userData.checks - 4) * 0.5) + (target.y), -found[i].normal.x * 1.3 + (target.z))

                const geometry = new MeshLineGeometry()
                const points = [];
                points.push(window.startItem.position.x, window.startItem.position.y, window.startItem.position.z);
                points.push(plane.position.x, plane.position.y, plane.position.z);

                geometry.setPoints(points)

                var texture = new THREE.TextureLoader().load("./assets/circle.png");
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                const material = new MeshLineMaterial({
                    color: new THREE.Color(0xfcba03),
                    map: texture,
                    useMap: 1,
                    side: 2,
                    transparent: true,
                    lineWidth: 0.1,
                    repeat: new THREE.Vector2(50, 1)
                })

                const mesh = new THREE.Mesh(geometry, material)
                mesh.raycast = raycast;
                window.MAIN_SCENE.add(mesh);

                window.connecting = false;

                window.MATERIAL_PORTAL_EDITOR.opacity = 1;
                window.MATERIAL_NON_PORTAL_EDITOR.opacity = 1;
                window.MATERIAL_PORTAL_EDITOR.transparent = false;
                window.MATERIAL_NON_PORTAL_EDITOR.transparent = false;

                isDrawStart = false;
                global.MAIN_SCENE.remove(lineFollow);
                count = 0;

                break;
            }
        } else {

            var userData = window.planeUserData[found[i].instanceId];

            if (!userData.hasItem) {

                if (window.ITEM_HOLDED_NAME == "camera") {
                    var item = window.ITEMS.getObjectByName(window.ITEM_HOLDED_NAME).clone();

                    item.traverse(child => {
                        if (child.name == "horizontal")
                            window.horizontal.push(child)
                        else if (child.name == "vertical")
                            window.vertical.push(child)
                    })
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

                if (userData.side == "front") {
                    item.rotation.y = 0;
                    //item.rotation.x = Math.PI / 2;
                } else if (userData.side == "right") {
                    item.rotation.y = -Math.PI / 2;
                } else if (userData.side == "back") {
                    item.rotation.y = Math.PI;
                } else if (userData.side == "left") {
                    item.rotation.y = Math.PI / 2;
                } else if (userData.side == "down") {
                    if (window.ITEM_HOLDED_NAME == "cube" || window.ITEM_HOLDED_NAME == "sphere" || window.ITEM_HOLDED_NAME == "laser_cube")
                        item.translateY(3);
                    else if (window.ITEM_HOLDED_NAME == "radio")
                        item.translateY(0.25);
                } else {
                }

                if (window.ITEM_HOLDED_NAME == "cube" || window.ITEM_HOLDED_NAME == "sphere" || window.ITEM_HOLDED_NAME == "laser_cube") {

                    var idInstanced;

                    for (var i = 0; i < window.DYMANIC_ITEMS["dispenser"].length; i++) {
                        if (window.DYMANIC_ITEMS["dispenser"][i].length == 0) {
                            window.DYMANIC_ITEMS["dispenser"][i] = item;
                            idInstanced = i;
                            break;
                        }
                    }

                    var instanced2 = window.ITEMS_ADDED.getObjectByName("dispenser");
                    console.log(instanced2)
                    var item2 = new THREE.Object3D();
                    //item2.userData = instanced2.userData;
                    item2.position.copy(userData.position.clone());
                    //userData.item2 = item2;

                    //GET CEILING SURFACE
                    for (var x = 0, j = 2; x < 100; x++, j += 2) {

                        var boxTop = getPlaneByName(userData.position.x + "/" + (userData.position.y + j) + "/" + userData.position.z);

                        if (boxTop.length > 0) {
                            item2.translateY(j);
                            break;
                        }
                    }

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

                if (window.ITEM_HOLDED_NAME == "camera") {
                    window.ITEMS_ADDED.add(item);
                } else {
                    var idInstanced;

                    for (var i = 0; i < window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME].length; i++) {
                        if (window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME][i].length == 0) {
                            item.laser = false;
                            window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME][i] = item;
                            idInstanced = i;
                            break;
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
                break;
            }

        }
    }
}

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
})

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
    global.MAIN_SCENE.add(lineFollow);

    isDrawStart = true;
    addPoint(window.SELECTED.parent.position.x, window.SELECTED.parent.position.y - 1, window.SELECTED.parent.position.z);
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

    if (!isDrawStart)
        return;

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    mouse.z = 0;
    mouse.unproject(window.MAIN_CAMERA);
    if (count !== 0 && isDrawStart) {
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
            }
        }
    }

    window.lightningStrikeMesh.visible = window.HOLDING_ITEM;
    window.lightningStrikeMesh2.visible = window.HOLDING_ITEM;
    window.lightningStrikeMesh3.visible = window.HOLDING_ITEM;
}

export {
    itemUpdate,
    addItem,
    hoverItem,
    interactWithItem
};