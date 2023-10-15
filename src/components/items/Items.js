import * as THREE from '../../build/three.module.js';
import $ from 'jquery';
import {
    MeshLineGeometry,
    MeshLineMaterial,
    raycast
} from 'meshline';

$("body").on('pointerdown', '.item', function (event) {
    event.preventDefault();
    window.ITEM_HOLDED_NAME = $(this).data("name");
    $("#follow").attr("src", $(this).attr("src"));
});

var raycaster = new THREE.Raycaster();

function itemUpdate() { //found, event, type

    if (window.CURRENT_ITEM && window.HOLDING_ITEM) {

        var target = new THREE.Vector3();
        window.holder.getWorldPosition(target);

        //DOWN/UP
        //none = 0;
        //checkCollision(target, new THREE.Vector3(0, -1, 0), "y");
        //checkCollision(target, new THREE.Vector3(0, 1, 0), "y");

        //if (none == 2)
        //    window.COL_Y = false;

        //FRONT
        checkCollision(target, new THREE.Vector3(0, 0, -1), "z");

        if (none == 1) {
            window.COL_Z = false;
            window.holder.position.z = -1;
        }

        /*checkCollision(target, new THREE.Vector3(0, 0, 1), "z");

        if (none == 2)
            window.COL_Z = false;*/

        /*//LEFT/RIGHT
        none = 0;
        checkCollision(target, new THREE.Vector3(-1, 0, 0), "x");
        checkCollision(target, new THREE.Vector3(1, 0, 0), "x");

        if (none == 2)
            window.COL_X = false;*/
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

    var inter = 0;


    /*if (intersects.length == 0) {
        none++;
    } else {
        for (let i = 0; i < intersects.length; i++) {
            if (intersects[i].object != window.CURRENT_ITEM.children[0] && intersects[i].object.visible && intersects[i].object.parent) {

                inter++;

                window.holder.position.z = -(intersects[i].distance - 0.3);

                if (Math.abs(window.holder.position.z) < 0.88) {

                    if (axis == "y") {
                        window.COL_Y = true;
                        window.COL_Y_POS = window.CURRENT_ITEM.position.y;
                    } else if (axis == "z") {

                        window.COL_Z = true;
                        window.COL_Z_POS = window.CURRENT_ITEM.position.z;

                        window.PLAYER.velocity.set(0, 0, 0);
                        window.PLAYER.angularVelocity.set(0, 0, 0);

                    } else if (axis == "x") {
                        window.COL_X = true;
                        window.COL_X_POS = window.CURRENT_ITEM.position.x;

                        window.PLAYER.velocity.set(0, 0, 0);
                        window.PLAYER.angularVelocity.set(0, 0, 0);
                    }

                    break;
                } else {
                    if (axis == "y")
                        window.COL_Y = false;
                    else if (axis == "z") {
                        window.COL_Z = false;
                        window.holder.position.z = -1;
                    } else if (axis == "x")
                        window.COL_X = false;
                }
            }
        }

        if (inter == 0) {
            if (axis == "y")
                window.COL_Y = false;
            else if (axis == "z") {
                window.COL_Z = false;
                window.holder.position.z = -1;
            } else if (axis == "x")
                window.COL_X = false;
        }
    }*/
}

var itemCount = 0;

const materialLine = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2
});

function addItem(found) {

    for (var i = 0; i < found.length; i++) {

        if (window.connecting) {


            if (found[i].object.userData.connection) {

                //

                /*var target = new THREE.Vector3();
                found[i].object.getWorldPosition(target)
                //target.y -= 1;

                //

                let vec1 = window.startItem.position;
                let vec2 = target;

                let size = new THREE.Vector3().subVectors(vec2, vec1);
                let center = new THREE.Vector3().addVectors(vec1, vec2).multiplyScalar(0.5);

                let planeWidth = Math.abs(size.x);
                let planeHeight = Math.abs(size.z);
                console.log(size)
                let planeGeom = new THREE.PlaneGeometry(planeWidth, planeHeight, planeWidth, planeHeight);
                let planeMat = new THREE.MeshBasicMaterial({
                    color: "aqua",
                    wireframe: true
                });
                let plane = new THREE.Mesh(planeGeom, planeMat);
                plane.position.copy(center);
                window.MAIN_SCENE.add(plane);*/

                //

                const geometryCheck = new THREE.PlaneGeometry(0.5, 0.5);
                const materialCheck = new THREE.MeshBasicMaterial({
                    color: 0xfcba03,
                    side: THREE.DoubleSide,
                    polygonOffset: true,
                    polygonOffsetFactor: -5,
                    map: window.CHECK,
                });
                const plane = new THREE.Mesh(geometryCheck, materialCheck);
                window.SELECTED_OBJECTS_FOR_BLOOM.add(plane);
                window.MAIN_SCENE.add(plane);

                var target = new THREE.Vector3();
                found[i].object.getWorldPosition(target)
                //plane.position.copy(target)

                if (found[i].normal.x != 0) {
                    plane.rotation.y = Math.PI / 2;
                }

                found[i].object.userData.checks++;

                if (found[i].object.userData.checks < 5) {
                    plane.position.set(found[i].normal.z * 1.3 + (target.x), 1.25 - (found[i].object.userData.checks * 0.5) + (target.y), found[i].normal.x * 1.3 + (target.z))
                } else {
                    plane.position.set(-found[i].normal.z * 1.3 + (target.x), 1.25 - ((found[i].object.userData.checks - 4) * 0.5) + (target.y), -found[i].normal.x * 1.3 + (target.z))
                }

                //

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
                window.SELECTED_OBJECTS_FOR_BLOOM.add(mesh);
                window.MAIN_SCENE.add(mesh);

                /*const points = [];
                points.push(window.startItem.position);

                var target = new THREE.Vector3();
                found[i].object.getWorldPosition(target)

                target.x -= 1;

                points.push(target);

                const geometry = new THREE.BufferGeometry().setFromPoints(points);

                const line = new THREE.Line(geometry, materialLine);

                window.SELECTED_OBJECTS_FOR_BLOOM.add(line);
                window.MAIN_SCENE.add(line);*/

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

            console.log(userData)

            if (!userData.hasItem) {

                if (window.ITEM_HOLDED_NAME == "camera") {
                    //
                    var item = window.ITEMS.getObjectByName(window.ITEM_HOLDED_NAME).clone();

                    item.traverse(child => {
                        if (child.name == "horizontal")
                            window.horizontal.push(child)
                        else if (child.name == "vertical")
                            window.vertical.push(child)
                    })

                } else {
                    //
                    var instanced = window.ITEMS_ADDED.getObjectByName(window.ITEM_HOLDED_NAME);
                    var item = new THREE.Object3D();
                    item.userData = instanced.userData;
                }

                if (item.userData.wall) {
                    if (userData.side == "up" || userData.side == "down") {
                        break;
                    }
                } else if (item.userData.ground) {
                    if (userData.side == "up") {
                        break;
                    }
                }

                userData.hasItem = true;
                userData.itemName = window.ITEM_HOLDED_NAME + "-" + itemCount;
                userData.item = item;

                if (window.ITEM_HOLDED_NAME == "camera") {
                    //
                    var target = new THREE.Vector3(); // create once an reuse it
                    found[i].object.getWorldPosition(target);
                    item.position.copy(target);
                } else {
                    //
                    item.position.copy(userData.position);
                }

                item.position.copy(userData.position);
                item.renderOrder = 2;
                item.name = window.ITEM_HOLDED_NAME + "-" + itemCount;

                if (userData.side == "front") {
                    item.rotation.y = 0;
                } else if (userData.side == "right") {
                    item.rotation.y = -Math.PI / 2;
                } else if (userData.side == "back") {
                    item.rotation.y = Math.PI;
                } else if (userData.side == "left") {
                    item.rotation.y = Math.PI / 2;
                } else if (userData.side == "down") {

                    if (window.ITEM_HOLDED_NAME == "cube" || window.ITEM_HOLDED_NAME == "sphere")
                        item.translateY(1);
                    else if (window.ITEM_HOLDED_NAME == "radio")
                        item.translateY(0.25);
                }

                if (window.ITEM_HOLDED_NAME == "cube" || window.ITEM_HOLDED_NAME == "sphere") {

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

                    console.log(idInstanced)

                    item2.userData.id = idInstanced;
                    item2.scale.set(1, 1, 1);
                    item2.updateMatrix();
                    instanced2.setMatrixAt(idInstanced, item2.matrix);
                    instanced2.instanceMatrix.needsUpdate = true;
                    instanced2.computeBoundingSphere();
                }

                if (window.ITEM_HOLDED_NAME == "camera") {
                    //
                    window.ITEMS_ADDED.add(item);
                } else {
                    //
                    var idInstanced;

                    for (var i = 0; i < window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME].length; i++) {
                        if (window.DYMANIC_ITEMS[window.ITEM_HOLDED_NAME][i].length == 0) {
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
    addPoint(window.SELECTED.parent.position.x, window.SELECTED.parent.position.y - 1, window.SELECTED.parent.position.z);
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

    //var target = new THREE.Vector3();
    //found[0].object.getWorldPosition(target);

    var userData = window.planeUserData[found[0].instanceId];

    window.ITEM_CUBE.position.copy(userData.position);
    window.ITEM_CUBE.visible = true;

    //console.log(window.ITEMS)
    //console.log(window.ITEM_HOLDED_NAME)

    /*var item = window.ITEMS.getObjectByName(window.ITEM_HOLDED_NAME).clone();

    if (item.userData.wall && (userData.side == "up" || userData.side == "down"))
        window.ITEM_CUBE.material.color = new THREE.Color(0xfc030f)
    else if (item.userData.ground && (userData.side != "up" && userData.side != "down"))
        window.ITEM_CUBE.material.color = new THREE.Color(0xfc030f)
    else if (found[0].object.userData.hasItem)
        window.ITEM_CUBE.material.color = new THREE.Color(0xfc030f)
    else
        window.ITEM_CUBE.material.color = new THREE.Color(0x00ff00)*/

}

export {
    itemUpdate,
    addItem,
    hoverItem
};