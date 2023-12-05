import * as THREE from '../../build/three.module.js';
import {
    TWEEN
} from '../../jsm/Tween.js';
import {
    PointerLockControls
} from '../../jsm/controls/PointerLockControls.js';
import {
    Portal
} from '../portal/Portal.js';
import $ from 'jquery';
import * as CANNON from 'cannon';
import nipplejs from 'nipplejs';
import {
    DeviceOrientationControls
} from '../../jsm/controls/DeviceOrientationControls.js';
import {
    DecalGeometry
} from '../../jsm/geometries/DecalGeometry.js';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import {
    createLightBridgesFromPortal
} from '../lightBridges/LightBridges.js'
import {
    MeshLineGeometry,
    MeshLineMaterial,
} from 'meshline';

// MOBILE VARIABLES

let fwdValue = 0;
let bkdValue = 0;
let rgtValue = 0;
let lftValue = 0;

if (window.mobile) {
    var controlsDevice = new DeviceOrientationControls(window.MAIN_CAMERA);
    var targetRotationX = 0;
    var targetRotationOnMouseDownX = 0;
    var targetRotationY = 0;
    var targetRotationOnMouseDownY = 0;
    var mouseX = 0;
    var mouseXOnMouseDown = 0;
    var mouseY = 0;
    var mouseYOnMouseDown = 0;
    var windowHalfX = window.innerWidth / 2;
    var windowHalfY = window.innerHeight / 2;
    var finalRotationY, outOfAngle = false;
    var info = false;

    var blocked_bottom = false,
        blocked_top = false;

    var deltaX2, touchX2;
    var vec = [],
        offsetX = 0;

    document.getElementById("camera").addEventListener('touchstart', onDocumentTouchStart, false);
    document.getElementById("camera").addEventListener('touchmove', onDocumentTouchMove, false);
    document.getElementById("camera").addEventListener('touchup', onDocumentTouchUp, false);

    var touches = 0;

    function onDocumentTouchUp(event) {
        //event.preventDefault();
        touches = 0;
    }

    function onDocumentTouchStart(event) {
        //for (var i = 0; i < event.touches.length; i++) {

        //event.preventDefault();
        if (event.touches.length > 0) {
            touches = event.touches.length - 1;

            if (touches == 0 || touches == 1) {
                mouseXOnMouseDown = event.touches[touches].pageX - windowHalfX;
                targetRotationOnMouseDownX = targetRotationX;

                mouseYOnMouseDown = event.touches[touches].pageY - windowHalfY;
                targetRotationOnMouseDownY = targetRotationY;
            }

        }

        //}
    }

    function onDocumentTouchMove(event) {
        //event.preventDefault();
        if (event.touches.length > 0 && (touches == 0 || touches == 1)) {
            mouseX = event.touches[touches].pageX - windowHalfX;
            targetRotationX = targetRotationOnMouseDownX + (mouseX - mouseXOnMouseDown) * (-0.01); //camera speed

            mouseY = event.touches[touches].pageY - windowHalfY;
            deltaX2 = event.touches[touches].pageY - touchX2;
            touchX2 = event.touches[touches].pageY;

            if (deltaX2 > 0) {
                if (!blocked_bottom) {
                    targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
                }
            } else {
                if (!blocked_top) {
                    targetRotationY = targetRotationOnMouseDownY + (mouseY - mouseYOnMouseDown) * (-0.01);
                }
            }
        }
        //for (var i = 0; i < event.touches.length; i++) {

        //}
    }

    // vars
    let joyManager, joyManager2;

    addJoystick();

    function addJoystick() {
        const options = {
            zone: document.getElementById('joystickWrapper1'),
            size: 120,
            multitouch: true,
            maxNumberOfNipples: 2,
            mode: 'static',
            restJoystick: true,
            shape: 'circle',
            // position: { top: 20, left: 20 },
            position: {
                top: '60px',
                left: '60px'
            },
            dynamicPage: true,
        }

        joyManager = nipplejs.create(options);

        joyManager['0'].on('move', function (evt, data) {

            const forward = data.vector.y
            const turn = data.vector.x

            if (forward > 0) {
                fwdValue = Math.abs(forward)
                bkdValue = 0
            } else if (forward < 0) {
                fwdValue = 0
                bkdValue = Math.abs(forward)
            }

            if (turn > 0) {
                lftValue = 0
                rgtValue = Math.abs(turn)
            } else if (turn < 0) {
                lftValue = Math.abs(turn)
                rgtValue = 0
            }

            headBobActive = true;
        })

        joyManager['0'].on('end', function (evt) {
            bkdValue = 0
            fwdValue = 0
            lftValue = 0
            rgtValue = 0
            // headBobActive = false;
            repositioningGUn = true;
            moving = false;
            headBobTimer = 0;
            //headBobActive = false;

            tweenCamera(500, window.GUN.children[0].position, new THREE.Vector3(0, 0, 0))
            setTimeout(() => {
                //repositioningGUn = false;
            }, 100);

            touches = 0;
        })
    }
}

//

let playerOnFloor = false;
let mouseTime = 0;

const keyStates = {};

const vector1 = new THREE.Vector3();
const vector2 = new THREE.Vector3();
const vector3 = new THREE.Vector3();

var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();
var crouched = false;
var moving = false;

//
var wasInJump = false;
var slipperyMaterial = new CANNON.Material();
slipperyMaterial.friction = 0.00;
window.dynamicObjects = [];

player();

if (!window.mobile)
    controlsLock();
// added joystick + movement

function player() {

    let sphereShape = new CANNON.Sphere(0.3);

    console.log(slipperyMaterial)
    //
    // define shape
    let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5 / 2, 2 / 2.3, 0.5 / 2));
    // let physicsShape = new CANNON.Box(new CANNON.Vec3(0.5, 2, 0.5)); 

    // define the physical body attributes
    window.PLAYER = new CANNON.Body({
        mass: 50,
        material: slipperyMaterial
    });
    window.PLAYER.allowSleep = false;
    window.PLAYER.addShape(physicsShape);
    window.PLAYER.position.set(5, 5, 5);
    window.PLAYER.linearDamping = 0.9;
    window.PLAYER.name = "player"

    //window.PLAYER.addShape(sphereShape, new CANNON.Vec3(0, 0, 0));
    //window.PLAYER.addShape(sphereShape, new CANNON.Vec3(0, 0.5 / 2, 0));
    //window.PLAYER.addShape(sphereShape, new CANNON.Vec3(0, -0.5 / 2, 0));

    // keep the player upright
    window.PLAYER.angularDamping = 1

    // set additional properties
    window.PLAYER.inJump = true

    // construct the physical body
    window.PLAYER.updateMassProperties()
    window.CANNON_WORLD.addBody(window.PLAYER);

    // normal collision events don't happen consistently - will stop once an object is stable on the ground
    // so need to check contacts to detect if grounded or not
    // https://github.com/schteppe/cannon.js/issues/313

    let upVector = new CANNON.Vec3(0, 1, 0);
    let contactNormal = new CANNON.Vec3(0, 0, 0);

    window.CANNON_WORLD.addEventListener("postStep", (e) => {
        window.PLAYER.inJump = true;
        if (window.CANNON_WORLD.contacts.length > 0) {

            for (let contact of window.CANNON_WORLD.contacts) {

                if (contact.bi.id == window.PLAYER.id || contact.bj.id == window.PLAYER.id) {
                    if (contact.bi.id == window.PLAYER.id) {
                        // contact.ni.negate(contactNormal);
                        contactNormal = new THREE.Vector3(contact.ni.x * -1, contact.ni.y * -1, contact.ni.z * -1)
                    } else {
                        // contact.ni.copy(contactNormal);
                        contactNormal = contact.ni
                    }

                    window.PLAYER.inJump = (contactNormal.dot(upVector) <= 0.5);
                }
            }
        }
    })

    window.dynamicObjects.push(window.PLAYER);

    for (let d of window.dynamicObjects) {
        d.collisionFilterGroup = window.CGROUP_DYNAMIC
        d.collisionFilterMask = window.CGROUP_ALL
    }
}

var controller = {
    "KeyE": {
        pressed: false
    },
    "KeyW": {
        pressed: false
    },
    "KeyS": {
        pressed: false
    },
    "KeyA": {
        pressed: false
    },
    "KeyD": {
        pressed: false
    },
    "Space": {
        pressed: false
    },
}

var itemHolder = null;

window.GUN_MODE = 1;

document.addEventListener('keydown', (event) => {

    if (event.code == "ControlLeft" && !crouched) {
        //console.log(window.RENDERER.info.render.calls)
    }

    if (window.FPS && allowEnterFPS) {
        if (controller[event.code]) {
            controller[event.code].pressed = true;
        }
        headBobActive = true;

        if (event.code == "ControlLeft" && !crouched) {

            crouched = true;

            window.PLAYER.shapes[0].halfExtents.y -= 0.25;
            window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
            window.PLAYER.computeAABB();
            window.PLAYER.updateMassProperties();
        }

        //console.log(event.code)
        if (event.code == "Digit1") {
            window.GUN_MODE = 1;

            tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
                0,
                window.INK.position.z))
        } else if (event.code == "Digit2") {
            window.GUN_MODE = 2;

            tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
                0.08,
                window.INK.position.z))
        } else if (event.code == "KeyE") {
            interactWithItem();
        } else if (event.code == "KeyQ") {

            if (recalling) {
                for (var i = 0; i < timeouts.length; i++) {
                    clearTimeout(timeouts[i]);
                }
                timeouts = [];

                recallingItem.recall = false;
                //recallingItem.allowSleep = true;
                recalling = false;
                recallingItem.arrayPos = [];
                recallingItem.arrayRot = [];

                var aa = {
                    value: 1
                };

                new TWEEN.Tween(aa, false)
                    .to({
                        value: 0
                    }, 500)
                    .onUpdate(() => {
                        window.sepiaEffect.intensity = aa.value;
                        window.vig.darkness = aa.value * 0.7;
                    })
                    .start();
            } else {

                if (window.pickingToRecall) {
                    window.MAIN_SCENE.remove(window.groupRecall)
                    window.pickingToRecall = false;
                }

                var aa = {
                    value: 0
                };

                new TWEEN.Tween(aa, false)
                    .to({
                        value: 1
                    }, 500)
                    .onUpdate(() => {
                        window.sepiaEffect.intensity = aa.value;
                        window.vig.darkness = aa.value * 0.7;
                    })
                    .start();

                recall();
            }
        } else if (event.code == "KeyZ") {

            window.pickingToRecall = !window.pickingToRecall;

            if (window.pickingToRecall) {

                window.groupRecall = new THREE.Group();
                window.MAIN_SCENE.add(window.groupRecall)

                for (let d of window.dynamicObjects) {

                    if (d.name == "player")
                        continue;

                    var length = d.arrayPos.length;
                    var values = parseInt(length / 5);
                    const points = [];

                    var geometry;

                    if (d.name.includes("sphere"))
                        geometry = new THREE.SphereGeometry(0.33, 32, 16);
                    else
                        geometry = new THREE.BoxGeometry(0.66, 0.66, 0.66);

                    const material = new THREE.MeshBasicMaterial({
                        color: 0xffff00,
                        transparent: true,
                        opacity: 0.5
                    });

                    for (var i = 0, j = 0; i < 7; i++, j += values) {

                        if (d.arrayPos[j]) {

                            points.push(d.arrayPos[j].x, d.arrayPos[j].y, d.arrayPos[j].z)
                            var cube = new THREE.Mesh(geometry, material);
                            cube.position.copy(d.arrayPos[j]);
                            cube.quaternion.copy(d.arrayRot[j]);
                            window.SELECTED_OBJECTS_FOR_BLOOM.add(cube);
                            window.groupRecall.add(cube);

                        }

                    }


                    points.push(d.arrayPos[length - 1].x, d.arrayPos[length - 1].y, d.arrayPos[length - 1].z)
                    var cube = new THREE.Mesh(geometry, material);
                    cube.position.copy(d.arrayPos[length - 1]);
                    cube.quaternion.copy(d.arrayRot[length - 1]);
                    window.SELECTED_OBJECTS_FOR_BLOOM.add(cube);
                    window.groupRecall.add(cube);

                    /*const material2 = new THREE.LineBasicMaterial({
                        color: 0xffff00
                    });

                    console.log(material)


                    //points.push( new THREE.Vector3( - 10, 0, 0 ) );
                    //points.push( new THREE.Vector3( 0, 10, 0 ) );
                    //points.push( new THREE.Vector3( 10, 0, 0 ) );

                    const geometry2 = new THREE.BufferGeometry().setFromPoints(points);

                    const line = new THREE.Line(geometry2, material2);
                    window.SELECTED_OBJECTS_FOR_BLOOM.add(line);
                    window.groupRecall.add(line);*/

                    const geometry2 = new MeshLineGeometry();
                    geometry2.setPoints(points, (p) => 2 + Math.sin(50 * p));

                    var texture = new THREE.TextureLoader().load("./assets/circle.png");
                    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;

                    const material2 = new MeshLineMaterial({
                        color: new THREE.Color(0xffff00),
                        map: texture,
                        useMap: 0,
                        side: 2,
                        transparent: false,
                        lineWidth: 0.02,
                        repeat: new THREE.Vector2(50, 1),
                        dashArray: 0
                    });

                    console.log(material2)

                    const line = new THREE.Mesh(geometry2, material2)
                    window.SELECTED_OBJECTS_FOR_BLOOM.add(line);
                    window.groupRecall.add(line);

                }

            } else {
                window.MAIN_SCENE.remove(window.groupRecall)
            }
        }
    }
});

window.pickingToRecall = false;

function recall() {
    raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
    var intersects = raycaster2.intersectObjects(window.INTERACTIVE);

    if (intersects.length > 0) {
        var instancedId = intersects[0].instanceId;
        var name = intersects[0].object.name;

        //window.CURRENT_ITEM = window.DYMANIC_ITEMS[name][instancedId];
        var item = window.DYMANIC_ITEMS[name][instancedId];
        console.log(item)

        if (item.body.arrayPos.length > 0) {

            //item.body.allowSleep = false;
            recallingItem = item.body;
            item.body.recall = true;
            recalling = true;
            //window.CANNON_WORLD.removeBody(item.body);
            transport(item, item.body.arrayPos.length - 1);

        }
    }
}

function tweenCamera2(duration, ini, final, item, end2) {
    var obj = new THREE.Object3D();
    window.MAIN_SCENE.add(obj)
    obj.quaternion.copy(ini.clone());
    new TWEEN.Tween(ini).to(final, duration)
        .onUpdate((tween) => {
            obj.quaternion.slerp(final, smoothness);
            item.body.quaternion.copy(obj.quaternion);


            /*var dir = new THREE.Vector3(); // create once an reuse it
            dir.subVectors(item.body.position, end2).normalize();

            let pos = new THREE.Vector3(item.body.position.x, item.body.position.y, item.body.position.z)
            pos.add(dir.clone().multiplyScalar(0.02));
            item.body.position.copy(pos);
            item.body.angularVelocity.setZero();
            item.body.velocity.setZero();*/

            //const direction = new CANNON.Vec3()
            //endPosition.vsub(startPosition, direction)
            //const totalLength = direction.length()
            //direction.normalize()
        })
        .start();
}

/*function postStepListener() {
    // Progress is a number where 0 is at start position and 1 is at end position
    const progress = (world.time - startTime) / tweenTime

    if (progress < 1) {
        direction.scale(progress * totalLength, offset)
        startPosition.vadd(offset, body.position)
    } else {
        body.velocity.set(0, 0, 0)
        body.position.copy(endPosition)
        world.removeEventListener('postStep', postStepListener)
    }
}*/
var timeouts = [];
var recalling = false;
var recallingItem;

/*// Compute direction vector and get total length of the path
        const direction = new CANNON.Vec3()
        endPosition.vsub(startPosition, direction)
        const totalLength = direction.length()
        direction.normalize()*/

function transport(item, i) {
    tweenCamera(10, item.body.position, item.body.arrayPos[i])

    var obj = new THREE.Object3D();
    obj.quaternion.copy(item.body.quaternion);
    tweenCamera2(10, obj.quaternion, item.body.arrayRot[i], item, item.body.arrayPos[i])
    //item.body.mass = 0;
    /*const tweenTime = 0.4;
    const startPosition = new CANNON.Vec3(item.body.position.x, item.body.position.y, item.body.position.z);
    const endPosition = new CANNON.Vec3(item.body.arrayPos[i].x, item.body.arrayPos[i].y, item.body.arrayPos[i].z);

    // Compute direction vector and get total length of the path
    const direction = new CANNON.Vec3()
    endPosition.vsub(startPosition, direction)
    const totalLength = direction.length()
    direction.normalize()

    const speed = totalLength / tweenTime
    direction.scale(speed, item.body.velocity)

    // Save the start time
    const startTime = window.CANNON_WORLD.time;

    const offset = new CANNON.Vec3()

    function postStepListener() {
        // Progress is a number where 0 is at start position and 1 is at end position
        const progress = (window.CANNON_WORLD.time - startTime) / tweenTime

        if (progress < 1) {
            direction.scale(progress * totalLength, offset)
            startPosition.vadd(offset, item.body.position)
        } else {
            item.body.mass = 5;
            item.body.velocity.set(0, 0, 0)
            item.body.position.copy(endPosition)
            window.CANNON_WORLD.removeEventListener('postStep', postStepListener)
        }
    }

    window.CANNON_WORLD.addEventListener('postStep', postStepListener)

    console.log(direction);
    console.log(totalLength)*/

    if (i > 0) {
        timeouts.push(setTimeout(() => {
            transport(item, i -= 1)
        }, 10))
    } else {
        item.body.recall = false;
        //item.body.allowSleep = true;
        recalling = false;
        item.body.arrayPos = [];
        item.body.arrayRot = [];

        var aa = {
            value: 1
        };

        new TWEEN.Tween(aa, false)
            .to({
                value: 0
            }, 500)
            .onUpdate(() => {
                window.sepiaEffect.intensity = aa.value;
                window.vig.darkness = aa.value * 0.7;
            })
            .start();


        setTimeout(() => {
            // Sleep state reset
            item.body.sleepState = 0;
            item.body.timeLastSleepy = 0;
            item.body._wakeUpAfterNarrowphase = false;
        }, 2000)

    }
}

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

        // orientation
        //itemHolder.quaternion.set(0, 0, 0, 1);
        //itemHolder.initQuaternion.set(0, 0, 0, 1);
        //body.previousQuaternion.set(0, 0, 0, 1);
        //itemHolder.interpolatedQuaternion.set(0, 0, 0, 1);

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

        //itemHolder.velocity.set(0, 0, 0);
        //itemHolder.angularVelocity.set(0, 0, 0);
        itemHolder.position.copy(window.CURRENT_ITEM.position);
        itemHolder.quaternion.copy(window.CURRENT_ITEM.quaternion);

        window.PLAYER.velocity.set(0, 0, 0);
        window.PLAYER.angularVelocity.set(0, 0, 0);

        itemHolder.gelJumping = false;

        itemHolder.sleeping = false;
        itemHolder.recall = false;
        recalling = false;
        //itemHolder.arrayPos = [];
        //itemHolder.arrayRot = [];

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

var allowPlacePortals = false;

//
var allowEnterFPS = true;
var openedDoor = false;

//MENU
$("body").on('click', '#close', function () {
    $("#blocker").css("display", "block");
    //$("#mobile-controls").css("display", "none");
    $("#container").css("filter", "blur(2px)");
    //window.paused = true;
    //openFullscreen();
})


$("body").on('click', '#settings-close', function () {
    if (window.FPS && allowEnterFPS) {

        window.paused = false;

        if (!window.mobile) {
            document.body.requestPointerLock();
        } else {
            $("#blocker").css("display", "none");
            $("#mobile-controls").css("display", "block");
            openFullscreen();
        }

        mouseTime = performance.now();
        //

        $("#container").css("filter", "none");

        if (!openedDoor) {
            openedDoor = true;

            setTimeout(() => {

                tweenCamera(500, window.enter_door_right_spinner.rotation, new THREE.Vector3(Math.PI,
                    window.enter_door_right_spinner.rotation.y,
                    window.enter_door_right_spinner.rotation.z))

                tweenCamera(500, window.enter_door_left_spinner.rotation, new THREE.Vector3(Math.PI,
                    window.enter_door_left_spinner.rotation.y,
                    window.enter_door_left_spinner.rotation.z))

                setTimeout(() => {
                    window.enter_door_right.position.z = -4;
                    tweenCamera(1000, window.enter_door_right.position, new THREE.Vector3(25, window.enter_door_right.position.y, window.enter_door_right.position.z))

                    window.enter_door_left.position.z = -4;
                    tweenCamera(1000, window.enter_door_left.position, new THREE.Vector3(-25, window.enter_door_left.position.y, window.enter_door_left.position.z))
                }, 500);

            }, 1000);
        }
    }
})

function openFullscreen() {
    if (document.body.requestFullscreen) {
        document.body.requestFullscreen();
    } else if (document.body.mozRequestFullScreen) {
        /* Firefox */
        document.body.mozRequestFullScreen();
    } else if (document.body.webkitRequestFullscreen) {
        /* Chrome, Safari and Opera */
        document.body.webkitRequestFullscreen();
    } else if (document.body.msRequestFullscreen) {
        /* IE/Edge */
        document.body.msRequestFullscreen();
    }
}

function controlsLock() {
    window.PointerControls = new PointerLockControls(window.MAIN_CAMERA, document.body);
    window.PointerControls.pointerSpeed = 0.5;

    window.PointerControls.addEventListener('lock', function () {

        document.getElementById('blocker').style.display = 'none';

        setTimeout(() => {
            allowPlacePortals = true;
        }, 1000);

    });

    window.PointerControls.addEventListener('unlock', function () {

        $("#container").css("filter", "blur(2px)")
        document.getElementById('blocker').style.display = 'block';
        allowPlacePortals = false;
        allowEnterFPS = false;

        setTimeout(() => {
            allowEnterFPS = true;
        }, 1500);
    });
}

document.addEventListener('keyup', (event) => {

    if (window.FPS && allowEnterFPS) {

        if (controller[event.code]) {
            controller[event.code].pressed = false;
        }

        repositioningGUn = true;
        moving = false;
        headBobTimer = 0;
        //headBobActive = false;

        tweenCamera(500, window.GUN.children[0].position, new THREE.Vector3(0, 0, 0))
        setTimeout(() => {
            //repositioningGUn = false;
        }, 100);

        if (crouched) {

            crouched = false;

            /*tweenCamera(250, window.PLAYER_COLLIDER.end, new THREE.Vector3(
                window.PLAYER_COLLIDER.end.x,
                window.PLAYER_COLLIDER.end.y + 0.5,
                window.PLAYER_COLLIDER.end.z))*/

            window.PLAYER.shapes[0].halfExtents.y += 0.25;
            window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
            window.PLAYER.computeAABB();
            window.PLAYER.updateMassProperties();

        }
    }
});

$("body").on('pointerdown', '#crouch', function () {
    crouched = true;
    window.PLAYER.shapes[0].halfExtents.y -= 0.25;
    window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    window.PLAYER.computeAABB();
    window.PLAYER.updateMassProperties();
})

$("body").on('pointerup', '#crouch', function () {
    window.PLAYER.shapes[0].halfExtents.y += 0.25;
    window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
    window.PLAYER.computeAABB();
    window.PLAYER.updateMassProperties();
})

document.addEventListener('mousedown', (event) => {

    if (!window.mobile && document.pointerLockElement !== null)
        portalButton(event.button)

});

//LEFT PORTAL MOBILE
document.getElementById("portal_l").addEventListener('pointerdown', portal_l_Touch, false);

function portal_l_Touch() {
    allowPlacePortals = true;
    portalButton(0);
}
//RIGHT PORTAL MOBILE
document.getElementById("portal_r").addEventListener('pointerdown', portal_r_Touch, false);

function portal_r_Touch() {
    allowPlacePortals = true;
    portalButton(2)
}
//JUMP MOBILE
document.getElementById("jump").addEventListener('pointerdown', jumpTouch, false);

function jumpTouch() {
    // handle jumping when space bar is pressed
    if (!window.PLAYER.inJump)
        shouldJump = true;
}

function getPlaneByName(name) {
    return window.planeUserData.filter(
        function (data) {
            return data.name == name
        }
    );
}

var gels = 0;
var gelOrange = false;

function portalButton(button) {

    if (window.FPS && (button == 2 || button == 0 || button == 1) && allowPlacePortals) {

        raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(window.instancedMesh);

        if (intersects.length > 0) {

            var userData = window.planeUserData[intersects[0].instanceId];

            //

            if (window.GUN_MODE == 2) {

                if (button == 1 && !window.INK_WHITE)
                    return;
                else if (button == 0 && !window.INK_ORANGE)
                    return;
                else if (button == 2 && !window.INK_BLUE)
                    return;

                var id;

                for (var i = 0; i < window.GELS.length; i++) {
                    if (!window.GELS[i]) {
                        window.GELS[i] = true;
                        id = i;
                        break;
                    }
                }

                var gel = new THREE.Object3D();
                gel.renderOrder = gels;
                gels++;
                gel.scale.set(1, 1, 1);
                gel.position.copy(intersects[0].point);

                //

                let PHYSICS_MATERIAL = new CANNON.Material();
                PHYSICS_MATERIAL.friction = 0.01; //0.01
                PHYSICS_MATERIAL.restitution = 0.1; //0.1

                var shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.01));

                var box = new CANNON.Body({
                    shape: shape,
                    mass: 0,
                    material: PHYSICS_MATERIAL
                })

                //

                if (userData.side == "down") {
                    gel.rotation.x = -Math.PI / 2;
                    box.up = new THREE.Vector3(0, 1, 0)
                    box.vel = new THREE.Vector3(1, 0, 1)
                } else if (userData.side == "up") {
                    gel.rotation.x = Math.PI / 2;
                    box.up = new THREE.Vector3(0, -1, 0)
                    box.vel = new THREE.Vector3(1, 0, 1)
                } else if (userData.side == "back") {
                    gel.rotation.y = Math.PI;
                    box.up = new THREE.Vector3(0, 0, -1)
                    box.vel = new THREE.Vector3(1, 1, 0)
                } else if (userData.side == "left") {
                    gel.rotation.y = Math.PI / 2;
                    box.up = new THREE.Vector3(1, 0, 0)
                    box.vel = new THREE.Vector3(0, 1, 1)
                } else if (userData.side == "right") {
                    gel.rotation.y = -Math.PI / 2;
                    box.up = new THREE.Vector3(-1, 0, 0)
                    box.vel = new THREE.Vector3(0, 1, 1)
                } else if (userData.side == "front") {
                    box.up = new THREE.Vector3(0, 0, 1)
                    box.vel = new THREE.Vector3(1, 1, 0)
                }

                gel.updateMatrix();
                window.instancedMeshGel.setMatrixAt(id, gel.matrix);

                if (button == 1)
                    window.instancedMeshGel.setColorAt(id, new THREE.Color(0xffffff));
                else if (button == 2)
                    window.instancedMeshGel.setColorAt(id, new THREE.Color(0x0000FF));
                else if (button == 0)
                    window.instancedMeshGel.setColorAt(id, new THREE.Color(0xFFA500));

                window.instancedMeshGel.instanceColor.needsUpdate = true;
                window.instancedMeshGel.instanceMatrix.needsUpdate = true;
                window.instancedMeshGel.computeBoundingSphere();

                box.position.copy(intersects[0].point);
                box.quaternion.copy(gel.quaternion)
                box.collisionFilterGroup = window.CGROUP_DYNAMIC
                box.collisionFilterMask = window.CGROUP_ALL
                box.linearDamping = 0.01;

                console.log(box)

                if (button == 1) {
                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 1.0, 1.0);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }
                    box.name = "gel-white";
                } else if (button == 0) {
                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 1.0, 0.5);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }
                    box.name = "gel-orange";
                } else if (button == 2) {
                    window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.0, 0.0, 1.0);
                    if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                        new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                            value: 0.5
                        }, 300).start();
                    }
                    box.name = "gel-blue";

                    // When a body collides with another body, they both dispatch the "collide" event.
                    box.addEventListener('collide', (event) => {

                        if (!event.body.gelJumping) {

                            var relativeVelocity = event.contact.getImpactVelocityAlongNormal();
                            event.body.gelJumping = true;

                            var holder = event.body;

                            setTimeout(() => {
                                holder.gelJumping = false;
                            }, 10);

                            console.log(event.target.up)
                            console.log(relativeVelocity)


                            //shouldJump = true;
                            //window.PLAYER.inJump = true
                            event.body.velocity.set(event.body.velocity.x * event.target.vel.x,
                                event.body.velocity.y * event.target.vel.y,
                                event.body.velocity.z * event.target.vel.z);
                            event.body.applyImpulse(event.target.up.clone().multiplyScalar(8 * event.body.mass * Math.abs((relativeVelocity * 0.045) + 1)), event.body.position)
                        }
                    })
                }

                window.CANNON_WORLD.addBody(box);

                window.PLAYER.addEventListener('collide', (event) => {
                    //console.log('The sphere just collided with the ground!')
                    //console.log('Collided with body:', event.body)
                    //console.log('Contact between bodies:', event.contact)

                    if (event.body.name == "gel-orange") {
                        gelOrange = true;
                    } else {
                        gelOrange = false;
                    }

                    /*if (event.body.name == "gel-blue") {
                        var relativeVelocity = event.contact.getImpactVelocityAlongNormal();
                        window.PLAYER.velocity.set(window.PLAYER.velocity.x, 0, window.PLAYER.velocity.z);
                        window.PLAYER.applyImpulse(new THREE.Vector3(0, 1, 0).multiplyScalar(7 * window.PLAYER.mass * Math.abs((relativeVelocity * 0.045) + 1)), window.PLAYER.position)
                    }*/
                })

            } else if (window.GUN_MODE == 1) {

                if (userData.portal) {

                    var obj = intersects[0].object;
                    var target = new THREE.Vector3(); // create once an reuse it
                    intersects[0].object.getWorldPosition(target);
                    window.wallName = userData.name;

                    var direction = new THREE.Vector3(0, 1, 0).applyQuaternion(obj.quaternion);
                    var offsetVector = new THREE.Vector3(0.0 * direction.x, 0.0 * direction.y, 0.0 * direction.z);

                    var x = intersects[0].point.x + offsetVector.x;
                    var y = intersects[0].point.y + offsetVector.y;
                    var z = intersects[0].point.z + offsetVector.z;

                    //-------------------------------------------------
                    var boxUpName = userData.position.x + "/" +
                        (userData.position.y + 2) + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxUpName).length == 0) {
                        if (intersects[0].uv.y >= 0.5)
                            y = userData.position.y;
                    } else {
                        if (intersects[0].uv.y >= 0.5 && !getPlaneByName(boxUpName)[0].portal)
                            y = userData.position.y;
                    }
                    //-------------------------------------------------
                    var boxDownName = userData.position.x + "/" +
                        (userData.position.y - 2) + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxDownName).length == 0) {
                        if (intersects[0].uv.y <= 0.5)
                            y = userData.position.y;
                    } else {
                        if (intersects[0].uv.y <= 0.5 && !getPlaneByName(boxDownName)[0].portal)
                            y = userData.position.y;
                    }
                    //-------------------------------------------------
                    var boxLeftName = (userData.position.x + 2) + "/" +
                        userData.position.y + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxLeftName).length == 0) {
                        if (userData.side == "front") {
                            if (intersects[0].uv.x >= 0.75)
                                x = userData.position.x + 0.5;
                        } else if (userData.side == "back") {
                            if (intersects[0].uv.x <= 0.25)
                                x = userData.position.x + 0.5;
                        } else {
                            x = userData.position.x;
                        }
                    }
                    //-------------------------------------------------
                    var boxRightName = (userData.position.x - 2) + "/" +
                        userData.position.y + "/" +
                        userData.position.z;

                    if (getPlaneByName(boxRightName).length == 0) {
                        if (userData.side == "front") {
                            if (intersects[0].uv.x <= 0.25)
                                x = userData.position.x - 0.5;
                        } else if (userData.side == "back") {
                            if (intersects[0].uv.x >= 0.75)
                                x = userData.position.x - 0.5;
                        } else {
                            x = userData.position.x;
                        }
                    }
                    //-------------------------------------------------
                    var boxFrontName = userData.position.x + "/" +
                        userData.position.y + "/" +
                        (userData.position.z + 2);

                    if (getPlaneByName(boxFrontName).length == 0) {
                        if (userData.side == "left") {
                            if (intersects[0].uv.x <= 0.25)
                                z = userData.position.z + 0.5;
                        } else if (userData.side == "right") {
                            if (intersects[0].uv.x >= 0.75)
                                z = userData.position.z + 0.5;
                        } else {
                            z = userData.position.z;
                        }
                    }
                    //-------------------------------------------------
                    var boxBackName = userData.position.x + "/" +
                        userData.position.y + "/" +
                        (userData.position.z - 2);

                    if (getPlaneByName(boxBackName).length == 0) {
                        if (userData.side == "left") {
                            if (intersects[0].uv.x >= 0.75)
                                z = userData.position.z - 0.5;
                        } else if (userData.side == "right") {
                            if (intersects[0].uv.x <= 0.25)
                                z = userData.position.z - 0.5;
                        } else {
                            z = userData.position.z;
                        }
                    }
                    //-------------------------------------------------
                    const point = new THREE.Vector3(x, y, z);
                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    // define playerUpDirection
                    let playerUpDirection = new THREE.Vector3(0, 1, 0)

                    var normal;
                    if (userData.side == "front")
                        normal = new THREE.Vector3(0, 0, 1)
                    else if (userData.side == "back")
                        normal = new THREE.Vector3(0, 0, -1)
                    else if (userData.side == "right")
                        normal = new THREE.Vector3(-1, 0, 0)
                    else if (userData.side == "left")
                        normal = new THREE.Vector3(1, 0, 0)
                    else if (userData.side == "up") {
                        playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)
                        normal = new THREE.Vector3(0, -1, 0)
                    } else if (userData.side == "down") {
                        playerUpDirection.applyQuaternion(window.MAIN_CAMERA.quaternion)
                        normal = new THREE.Vector3(0, 1, 0)
                    }

                    var pLocal = new THREE.Vector3(0, 0, -1);
                    var pWorld = pLocal.applyMatrix4(window.MAIN_CAMERA.matrixWorld);
                    var dir = pWorld.sub(window.MAIN_CAMERA.position).normalize();

                    point.add(dir.clone().multiplyScalar(-0.01));

                    // https://stackoverflow.com/questions/39082673/get-face-global-normal-in-three-js
                    //const objectMatrix = new THREE.Matrix3().getNormalMatrix(intersects[0].object.matrixWorld)
                    //const normal = intersects[0].face.normal.clone().applyMatrix3(objectMatrix).normalize()
                    const depthDir = playerUpDirection.clone().projectOnPlane(normal).normalize()
                    const widthDir = depthDir.clone().cross(normal)
                    const portal_width = window.PORTAL_WIDTH
                    const portal_depth = window.PORTAL_DEPTH

                    let EPS = window.PORTAL_EPS * 3;
                    let portalPoints = [point.clone().add(depthDir.clone().multiplyScalar(portal_depth / 2 + EPS).add(widthDir.clone().multiplyScalar(portal_width / 2 + EPS))),
                        point.clone().add(depthDir.clone().multiplyScalar(-portal_depth / 2 - EPS).add(widthDir.clone().multiplyScalar(portal_width / 2 + EPS))),
                        point.clone().add(depthDir.clone().multiplyScalar(-portal_depth / 2 - EPS).add(widthDir.clone().multiplyScalar(-portal_width / 2 - EPS))),
                        point.clone().add(depthDir.clone().multiplyScalar(portal_depth / 2 + EPS).add(widthDir.clone().multiplyScalar(-portal_width / 2 - EPS)))
                    ]

                    if (button == 0) { // left click

                        if (window.PORTALS[1] === null) {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairOrange.png';
                        } else {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                            if (point.distanceTo(window.PORTALS[1].pos) < 1)
                                return;
                        }

                        // delete the old portal this new one is replacing
                        if (window.PORTALS[0] !== null)
                            deletePortal(0);

                        createPortal(0, 1, point, normal, userData.body, playerUpDirection, portalPoints)

                        window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(1.0, 0.25, 0.0);
                        if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                            new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }
                    } else if (button == 2) { // left click

                        if (window.PORTALS[0] === null) {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBlue.png';
                        } else {
                            document.getElementById("reticle-img").src = './assets/textures/crosshairBoth.png';

                            if (point.distanceTo(window.PORTALS[0].pos) < 1)
                                return;
                        }

                        // delete the old portal this new one is replacing
                        if (window.PORTALS[1] !== null) {
                            deletePortal(1);
                        }

                        createPortal(1, 0, point, normal, userData.body, playerUpDirection, userData.rotation)

                        window.uniformShaderPortalGunBallEnergy.iColor.value = new THREE.Vector3(0.0, 0.3, 1.0);
                        if (window.uniformShaderPortalGunBallEnergy.iAlpha.value == 0.0) {
                            new TWEEN.Tween(window.uniformShaderPortalGunBallEnergy.iAlpha).to({
                                value: 0.5
                            }, 300).start();
                        }
                    }

                    setTimeout(() => {
                        if (button == 0) {
                            createLightBridgesFromPortal(1, window.raycastLightBridge);
                            createLightBridgesFromPortal(1, window.raycastTractorBeam);
                            createLightBridgesFromPortal(1, window.raycastLaserEmitter);
                        } else if (button == 2) {
                            createLightBridgesFromPortal(0, window.raycastLightBridge);
                            createLightBridgesFromPortal(0, window.raycastTractorBeam);
                            createLightBridgesFromPortal(0, window.raycastLaserEmitter);
                        }
                    }, 300);
                } else {
                    //NONPORTABLE WALL
                }
            }
        }
    }
}

// deletes the portal with index portalIndex from the scene
function deletePortal(portalIndex) {
    window.PORTALS[portalIndex].mesh.geometry.dispose();
    window.PORTALS[portalIndex].mesh.material.dispose();
    if (window.PORTALS[portalIndex].hostObjects !== null) {
        // mark this object as collideable with portal 0 bb objects
        window.PORTALS[portalIndex].hostObjects.collisionFilterGroup &= ~window.CGROUP_PORTAL_HOST_CDISABLE[portalIndex]
        // add back to environment group only if collideable with both portal objects
        if (!(window.PORTALS[portalIndex].hostObjects.collisionFilterGroup & window.CGROUP_PORTAL_HOST_CDISABLE[0]) &&
            !(window.PORTALS[portalIndex].hostObjects.collisionFilterGroup & window.CGROUP_PORTAL_HOST_CDISABLE[1])) {
            window.PORTALS[portalIndex].hostObjects.collisionFilterGroup |= window.CGROUP_ENVIRONMENT
        }
    }
    window.MAIN_SCENE.remove(window.PORTALS[portalIndex]);
    window.PORTALS[portalIndex] = null
}

// creates a new portal and adds it to the scene
function createPortal(thisPortalIndex, otherPortalIndex, point, normal, hostObject, playerUpDirection, portalPoints) {
    let color = window.PORTAL_COLORS[thisPortalIndex]

    window.PORTALS[thisPortalIndex] = new Portal(
        point,
        normal, // normal of surface
        playerUpDirection,
        window.PORTALS[otherPortalIndex],
        hostObject,
        color,
        thisPortalIndex,
        portalPoints)
    window.PORTALS[thisPortalIndex].mesh.scale.set(0, 0, 0);
    window.PORTALS[thisPortalIndex].portalShader.scale.set(0, 0, 0);

    window.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup |= window.CGROUP_PORTAL_HOST_CDISABLE[thisPortalIndex]
    // remove this object from the environment group
    window.PORTALS[thisPortalIndex].hostObjects.collisionFilterGroup &= ~window.CGROUP_ENVIRONMENT

    if (window.PORTALS[otherPortalIndex] !== null)
        window.PORTALS[otherPortalIndex].output = window.PORTALS[thisPortalIndex]

    window.MAIN_SCENE.add(window.PORTALS[thisPortalIndex])
    tweenCamera(300, window.PORTALS[thisPortalIndex].mesh.scale, new THREE.Vector3(0.5, 1, 1))
    tweenCamera(300, window.PORTALS[thisPortalIndex].portalShader.scale, new THREE.Vector3(0.5, 1, 1))

    if (window.PORTALS[otherPortalIndex] !== null)
        window.PORTALS[otherPortalIndex].output = window.PORTALS[thisPortalIndex]

    if (window.PORTALS[0] !== null && window.PORTALS[1] !== null) {
        window.PORTALS[0].portalShader.material = window.materialLeftOpened
        window.PORTALS[1].portalShader.material = window.materialRightOpened
    }

    var pLocal = new THREE.Vector3(0, 0, -1);
    var pWorld = pLocal.applyMatrix4(window.MAIN_CAMERA.matrixWorld);
    var dir = pWorld.sub(window.MAIN_CAMERA.position).normalize();
    //window.PORTALS[thisPortalIndex].position.add(dir.clone().multiplyScalar(-0.02));
}

let shouldJump = false;
window.rotationMobile = 0.1;
var gamepadButton1 = false;
var gamepadButton3 = false;
var gamepadButton5 = false;
var gamepadButton6 = false;
var gamepadButton7 = false;
var gamepadButton12 = false;
var gamepadButton15 = false;
var vv = false;


var yyy;

const updatePlayer = function (deltaTime) {

    raycast();

    var velocity = 1100;

    if (window.mobile) {
        //
        velocity = 900;
        window.MAIN_CAMERA.rotation.y += (targetRotationX - window.MAIN_CAMERA.rotation.y) * window.rotationMobile;

        //vertical rotation 
        finalRotationY = (targetRotationY - window.MAIN_CAMERA.rotation.x);
        if (window.MAIN_CAMERA.rotation.x <= 1 && window.MAIN_CAMERA.rotation.x >= -1) {
            window.MAIN_CAMERA.rotation.x += finalRotationY * window.rotationMobile;
        }

        if (window.MAIN_CAMERA.rotation.x > 1) {
            blocked_top = true;
            window.MAIN_CAMERA.rotation.x = 1
        } else
            blocked_top = false;

        if (window.MAIN_CAMERA.rotation.x < -1) {
            blocked_bottom = true;
            window.MAIN_CAMERA.rotation.x = -1
        } else
            blocked_bottom = false;

        if (window.gyro) {
            controlsDevice.update();
            window.MAIN_CAMERA.rotation.z = 0
        }
    }

    // gives a bit of air control
    // define directions
    let cameraDirection = new THREE.Vector3()
    window.MAIN_CAMERA.getWorldDirection(cameraDirection)
    const up = new THREE.Vector3(0, 1, 0)
    const forward = cameraDirection.projectOnPlane(up).normalize()
    const backward = forward.clone().negate()
    const left = up.clone().cross(forward).normalize()
    const right = left.clone().negate()

    // physics changes while jumping
    let jumpMultiplier = 1
    if (window.PLAYER.inJump)
        jumpMultiplier = 0.05

    if (!window.PLAYER.inJump)
        window.PLAYER.linearDamping = 0.999
    else
        window.PLAYER.linearDamping = 0.01

    // regulates speed when multiple directions are pressed 
    //let movementDirections = controller["KeyW"].pressed + controller["KeyS"].pressed + controller["KeyA"].pressed + controller["KeyD"].pressed;
    let movementDirections = fwdValue + bkdValue + lftValue + rgtValue;
    let movementMultiplier = 1
    if (movementDirections == 2) {
        movementMultiplier = (1 / Math.sqrt(movementDirections))
    }

    // apply forces in WASD directions when pressed

    var mass = 50;

    if (window.PLAYER.mass == 0) {
        mass = 10;
    }

    const f = velocity * window.PLAYER.mass * jumpMultiplier * deltaTime; //window.PLAYER.mass
    var aa = false;

    for (var i = 0; i < window.laserEmitterRaycaster.length; i++) {
        //console.log(window.laser_cube)
        //if (window.INTERACTIVE[7]) {
        //var intersects = window.laserEmitterRaycaster[i].intersectObjects(window.INTERACTIVE);
        //console.log(intersects)
        //}

        var obj2 = window.laserEmitterRaycaster[i];

        if (window.laserEmitterRaycaster[i].fromCube) {
            obj2 = new THREE.Object3D();
            obj2.position.copy(window.laserEmitterRaycaster[i].position)
            obj2.rotation.copy(window.laserEmitterRaycaster[i].rotation)
            //obj2.translateY(window.laserEmitterRaycaster[i].distance / 2);
            obj2.fromCube = true;
        }

        var vector = new THREE.Vector3();
        var raycasterLaser = new THREE.Raycaster();

        vector.copy(obj2.position);

        let dir = new THREE.Vector3()
        obj2.getWorldDirection(dir)
        dir.normalize()

        raycasterLaser.set(vector, dir);
        var intersects = raycasterLaser.intersectObject(window.laser_cube);

        if (intersects.length > 0) {

            var id = intersects[0].instanceId;

            if (obj2.fromCube) {
                /*for (var h = 0; h < intersects.length; h++) {
                    if (intersects[i].instanceId != 1) {
                        //console.log("ttttttttttttt")
                    }
                }*/
            } else {
                window.laserEmitter[i].rotation.set(0, 0, 0)
                window.laserEmitter[i].position.set(0, 0, 0)

                window.laserEmitter[i].geometry.dispose();
                window.laserEmitter[i].geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);
                window.laserEmitter[i].position.copy(obj2.position);
                window.laserEmitter[i].translateZ(intersects[0].distance / 2);

                window.laserEmitter[i].rotation.x = Math.PI / 2;

                //----------------------------------------------------

                var cube = window.DYMANIC_ITEMS["laser_cube"][intersects[0].instanceId]
                yyy = cube;

                var vector = new THREE.Vector3();
                var raycasterLaser = new THREE.Raycaster();

                vector.copy(cube.position);

                let dir = new THREE.Vector3()
                cube.getWorldDirection(dir)
                dir.normalize()

                raycasterLaser.set(vector, dir);
                var intersects = raycasterLaser.intersectObject(window.instancedMesh);

                if (intersects.length > 0) {
                    //console.log("Iiiiiiiiiiiiiiiiiii")
                    const geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);

                    if (!cube.laser) {
                        const plane = new THREE.Mesh(geometry, window.laserEmitter[i].material); //materialBridge
                        window.SELECTED_OBJECTS_FOR_BLOOM.add(plane);
                        window.MAIN_SCENE.add(plane);


                        cube.laser = true;
                        cube.plane = plane;


                        //cube.fromCube = true;
                        //window.laserEmitterRaycaster.push(cube)
                    } else {
                        cube.plane.rotation.set(0, 0, 0)
                        cube.plane.position.set(0, 0, 0)

                        cube.plane.geometry.dispose();
                        cube.plane.geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);

                        if (window.HOLDING_ITEM && window.CURRENT_ITEM_ID == id)
                            cube.plane.position.copy(cube.position);
                        else
                            cube.plane.position.copy(cube.body.position);
                        ///cube.plane.translateZ(intersects[0].distance / 2);
                        //cube.plane.rotation.copy(cube.rotation);
                        //cube.plane.translateZ(intersects[0].distance / 2);
                        //cube.plane.rotation.x +=cube.rotation.x;
                        //cube.plane.rotation.y = cube.rotation.y;
                        //cube.plane.rotation.y += Math.PI / 2;
                        cube.plane.rotation.x += Math.PI / 2;
                        cube.plane.rotation.z = -cube.rotation.y;


                        //cube.plane.updateMatrix();
                        //cube.plane.geometry.applyMatrix4(cube.plane.matrix);
                        cube.plane.distance = intersects[0].distance;
                        cube.plane.translateY(-intersects[0].distance / 2);
                    }

                    //cube.plane.position.copy(cube.position);
                    //cube.plane.rotation.copy(cube.rotation);

                } else {

                }
            }


        } else {

            if (window.laserEmitter[i]) {
                window.laserEmitter[i].rotation.set(0, 0, 0)
                window.laserEmitter[i].position.set(0, 0, 0)

                window.laserEmitter[i].geometry.dispose();
                window.laserEmitter[i].geometry = new THREE.CylinderGeometry(0.02, 0.02, window.laserEmitterRaycaster[i].distance, 32);
                window.laserEmitter[i].position.copy(window.laserEmitterRaycaster[i].position);
                window.laserEmitter[i].translateZ(window.laserEmitterRaycaster[i].distance / 2);

                window.laserEmitter[i].rotation.x = Math.PI / 2;
            }

            if (yyy) {
                if (yyy.laser) {
                    console.log("111111111111111")
                    window.MAIN_SCENE.remove(yyy.plane);
                    yyy.laser = false;
                }
            }

        }
    }


    for (let d of window.dynamicObjects) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)

        for (var j = 0; j < window.tractorBeam.length; j++) {

            if (window.tractorBeamBoundingBox[j]) {

                if (d.inTractor && d.tractor != j)
                    continue;

                if (window.tractorBeamBoundingBox[j].containsPoint(pos)) {

                    var vec = new THREE.Vector3();
                    window.tractorBeam[j].getWorldDirection(vec)

                    if (!d.inTractor) {
                        d.inTractorPositionY = d.position.clone().y;
                        d.inTractor = true;
                        d.tractor = j;
                        window.tractorBeam[j].inTractor = true;
                        aa = true;
                        d.mass = 0;

                        // Velocity
                        d.velocity.setZero();
                        d.initVelocity.setZero();
                        d.angularVelocity.setZero();
                        d.initAngularVelocity.setZero();

                        // Force
                        d.force.setZero();
                        d.torque.setZero();

                        // Sleep state reset
                        d.sleepState = 0;
                        d.timeLastSleepy = 0;
                        d._wakeUpAfterNarrowphase = false;
                        d.angularDamping = 1;

                        if (!d.inArea) {
                            var center = new THREE.Vector3((Math.abs(vec.x - 1)) * window.tractorBeam[j].position.x + (d.position.x * vec.x),
                                (Math.abs(vec.y - 1)) * window.tractorBeam[j].position.y + (d.position.y * vec.y),
                                (Math.abs(vec.z - 1)) * window.tractorBeam[j].position.z + (d.position.z * vec.z));

                            tweenCamera(500, d.position, center)
                        }
                    } else {

                        if (d.recall) {
                            //console.log("kkkkkkkkkkkkkk")
                            continue;
                        }

                        pos.add(vec.clone().multiplyScalar(0.02 * window.tractorBeamBoundingBox[j].side));
                        d.position.copy(pos);
                        d.angularVelocity.setZero();
                        d.velocity.setZero();
                    }

                } else {
                    if (d.inTractor && d.tractor == j) { //&& window.tractorBeam[j].inTractor
                        if (d.name == "player")
                            d.mass = 50;
                        else
                            d.mass = 5;

                        d.inTractor = false;
                        window.tractorBeam[j].inTractor = false;
                        d.tractor = null;
                    }
                }
            } else {
                if (d.inTractor && d.tractor == j) { //&& window.tractorBeam[j].inTractor
                    if (d.name == "player")
                        d.mass = 50;
                    else
                        d.mass = 5;

                    d.inTractor = false;
                    window.tractorBeam[j].inTractor = false;
                    d.tractor = null;
                }
            }
        }
    }

    if (gelOrange)
        window.PLAYER.applyForce(forward.clone().multiplyScalar(f * 3), window.PLAYER.position)

    if (window.mobile) {

        if (fwdValue > 0) {
            window.PLAYER.applyForce(forward.clone().multiplyScalar(f * fwdValue), window.PLAYER.position)
            moving = true;
        }

        if (bkdValue > 0) {
            window.PLAYER.applyForce(backward.clone().multiplyScalar(f * bkdValue), window.PLAYER.position)
            moving = true;
        }

        if (lftValue > 0) {
            window.PLAYER.applyForce(left.clone().multiplyScalar(f * lftValue), window.PLAYER.position)
            moving = true;
        }

        if (rgtValue > 0) {
            window.PLAYER.applyForce(right.clone().multiplyScalar(f * rgtValue), window.PLAYER.position)
            moving = true;
        }

        // update lastTimeStampInJump
        wasInJump = window.PLAYER.inJump;

        if (shouldJump) {
            window.PLAYER.inJump = true
            window.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.25), window.PLAYER.position)
        }

        shouldJump = false;

    } else {
        var gamepad;
        if (controllerIndex !== null) {
            gamepad = navigator.getGamepads()[controllerIndex];

            if (!vv)
                console.log(gamepad.buttons)

            vv = true;

            if (gamepad.buttons[5].value == 1 && !gamepadButton5) {

                portalButton(1);

                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: 200,
                    weakMagnitude: 1.0,
                    strongMagnitude: 1.0,
                });
                gamepadButton5 = true;
            } else if (gamepad.buttons[5].value == 0) {
                gamepadButton5 = false;
            }

            if (gamepad.buttons[6].value == 1 && !gamepadButton6) {

                portalButton(0);

                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: 200,
                    weakMagnitude: 1.0,
                    strongMagnitude: 1.0,
                });
                gamepadButton6 = true;
            } else if (gamepad.buttons[6].value == 0) {
                gamepadButton6 = false;
            }

            if (gamepad.buttons[7].value == 1 && !gamepadButton7) {

                portalButton(2);

                gamepad.vibrationActuator.playEffect("dual-rumble", {
                    startDelay: 0,
                    duration: 200,
                    weakMagnitude: 1.0,
                    strongMagnitude: 1.0,
                });
                gamepadButton7 = true;
            } else if (gamepad.buttons[7].value == 0) {
                gamepadButton7 = false;
            }

            if (gamepad.buttons[3].value == 1 && !gamepadButton3) {

                crouched = true;

                window.PLAYER.shapes[0].halfExtents.y -= 0.25;
                window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
                window.PLAYER.computeAABB();
                window.PLAYER.updateMassProperties();

                gamepadButton3 = true;
            } else if (gamepad.buttons[3].value == 0) {

                if (crouched) {
                    window.PLAYER.shapes[0].halfExtents.y += 0.25;
                    window.PLAYER.shapes[0].updateConvexPolyhedronRepresentation();
                    window.PLAYER.computeAABB();
                    window.PLAYER.updateMassProperties();
                }

                gamepadButton3 = false;
                crouched = false;
            }

            if (gamepad.buttons[1].value == 1 && !gamepadButton1) {
                interactWithItem();
                gamepadButton1 = true;
            } else if (gamepad.buttons[1].value == 0) {
                gamepadButton1 = false;
            }

            if (gamepad.buttons[12].value == 1 && !gamepadButton12) {
                window.GUN_MODE = 1;
                tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
                    0,
                    window.INK.position.z))

                gamepadButton12 = true;
            } else if (gamepad.buttons[12].value == 0) {
                gamepadButton12 = false;
            }

            if (gamepad.buttons[15].value == 1 && !gamepadButton15) {
                window.GUN_MODE = 2;
                tweenCamera(500, window.INK.position, new THREE.Vector3(window.INK.position.x,
                    0.08,
                    window.INK.position.z))

                gamepadButton15 = true;
            } else if (gamepad.buttons[15].value == 0) {
                gamepadButton15 = false;
            }


            if (gamepad.axes[2] > 0.5)
                window.MAIN_CAMERA.rotation.y -= 0.05;

            if (gamepad.axes[2] < -0.5)
                window.MAIN_CAMERA.rotation.y += 0.05;

            if (gamepad.axes[3] < -0.5)
                window.MAIN_CAMERA.rotation.x += 0.025;

            if (gamepad.axes[3] > 0.5)
                window.MAIN_CAMERA.rotation.x -= 0.025;

            //
            var gamepadPressed = 0;

            if (gamepad.axes[1] < -0.5) {
                window.PLAYER.applyForce(forward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepad.axes[1] > 0.5) {
                window.PLAYER.applyForce(backward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepad.axes[0] < -0.5) {
                window.PLAYER.applyForce(left.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepad.axes[0] > 0.5) {
                window.PLAYER.applyForce(right.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
                moving = true;
                gamepadPressed++;
                headBobActive = true;
            }

            if (gamepadPressed == 0) {
                moving = false;
                headBobActive = false;
            }

        }

        var posPlayer = new THREE.Vector3(window.PLAYER.position.x, window.PLAYER.position.y, window.PLAYER.position.z)

        if (controller["KeyW"].pressed && !window.COL_Z) {

            moving = true;

            if (window.PLAYER.mass == 0) {
                posPlayer.add(forward.clone().multiplyScalar(0.02));
                window.PLAYER.position.copy(posPlayer);
            } else {
                window.PLAYER.applyForce(forward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            }
        }
        if (controller["KeyS"].pressed) {

            moving = true;

            if (window.PLAYER.mass == 0) {
                posPlayer.add(backward.clone().multiplyScalar(0.02));
                window.PLAYER.position.copy(posPlayer);
            } else {
                window.PLAYER.applyForce(backward.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            }
        }
        if (controller["KeyA"].pressed) {

            moving = true;

            if (window.PLAYER.mass == 0) {
                posPlayer.add(left.clone().multiplyScalar(0.02));
                window.PLAYER.position.copy(posPlayer);
            } else {
                window.PLAYER.applyForce(left.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            }
        }
        if (controller["KeyD"].pressed) {

            moving = true;

            if (window.PLAYER.mass == 0) {
                posPlayer.add(right.clone().multiplyScalar(0.02));
                window.PLAYER.position.copy(posPlayer);
            } else {
                window.PLAYER.applyForce(right.clone().multiplyScalar(f * movementMultiplier), window.PLAYER.position)
            }
        }

        shouldJump = false;
        // handle jumping when space bar is pressed

        if (controllerIndex !== null) {
            if (gamepad.buttons[0].value > 0 && !window.PLAYER.inJump) {
                shouldJump = true;
            }
        } else if (controller["Space"].pressed && !window.PLAYER.inJump) {
            shouldJump = true;
        }
        // update lastTimeStampInJump
        wasInJump = window.PLAYER.inJump;

        if (shouldJump) {
            window.PLAYER.inJump = true
            window.PLAYER.applyImpulse(up.clone().multiplyScalar(f * 0.2), window.PLAYER.position)
        }
    }

    // always look where the camera points
    window.PLAYER.quaternion.copy(window.MAIN_CAMERA.quaternion)
    window.PLAYER.quaternion.x = 0
    window.PLAYER.quaternion.z = 0
    window.PLAYER.quaternion.normalize()

    // set camera position to be at player
    window.MAIN_CAMERA.position.copy(window.PLAYER.position)
    window.GUN.position.copy(window.MAIN_CAMERA.position);

    if (moving) {
        // window.GUN.translateX(Math.sin(headBobTimer * headBobSpeed) * headBobHeight)
        window.GUN.children[0].position.x += Math.sin(headBobTimer * headBobSpeed) * headBobHeight;
    }

    //smoothness = 0.1; // 0 to 1 only
    const targetPosition = window.MAIN_CAMERA.quaternion.clone();

    window.GUN.quaternion.slerp(targetPosition, smoothness);
    updateHeadBob(deltaTime);

    if (window.MAIN_CAMERA.position.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
        window.PLAYER.position.copy(window.SPAWN_POSITION);
    }
}

var headBobTimer = 0;
var headBobSpeed = 3;
var headBobHeight = 0.00005;
var headBobActive = false;
var repositioningGUn = false;
var smoothness = 0.1;

const updateHeadBob = function (deltaTime) {
    if (headBobActive && moving) {
        const wavLength = Math.PI;
        const nextStep = 1 + Math.floor(((headBobTimer + 0.0000001) * headBobSpeed) / wavLength);
        const nextStepTime = nextStep * wavLength / headBobSpeed;
        headBobTimer = Math.min(headBobTimer + deltaTime, nextStepTime);
    }
}

var levelCompleted = false;
var leveEntered = false;

var moving = false;
window.initLevel = false;

function raycast() {

    if (!leveEntered) {
        raycaster2.setFromCamera(coords, window.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(window.planeEnterDoor);

        if (intersects.length > 0) {
            if (intersects[0].distance < 0.1) {
                leveEntered = true;

                setTimeout(() => {
                    window.wallCorridorEnter.position.y = 0;
                    window.wallCorridorExit.position.y = 0;
                }, 200);


                setTimeout(() => {
                    window.spotLight.intensity = 20;
                    window.lightRoom.intensity = 50;

                    setTimeout(() => {

                        for (var i = 0; i < window.DISPENSER_COVERS.length; i++) {
                            tweenCamera(300, window.DISPENSER_COVERS[i].scale, new THREE.Vector3(0, 0, 0))
                        }

                        setTimeout(() => {
                            //INITIATE BOX CANNON
                            for (var i = 0; i < window.BOX_BODY.length; i++) {
                                window.CANNON_WORLD.addBody(window.BOX_BODY[i])
                            }
                            for (var i = 0; i < window.SPHERE_BODY.length; i++) {
                                window.CANNON_WORLD.addBody(window.SPHERE_BODY[i])
                            }
                            window.initLevel = true;

                            setTimeout(() => {
                                for (var i = 0; i < window.DISPENSER_COVERS.length; i++) {
                                    tweenCamera(100, window.DISPENSER_COVERS[i].scale, new THREE.Vector3(0.012, 0.012, 0.012))
                                }
                            }, 1000);
                        }, 300);

                    }, 1000);
                }, 1000);

                setTimeout(() => {

                    window.enter_door_right.position.z = -4;
                    tweenCamera(1000, window.enter_door_right.position, new THREE.Vector3(-65, window.enter_door_right.position.y, window.enter_door_right.position.z))

                    window.enter_door_left.position.z = -4;
                    tweenCamera(1000, window.enter_door_left.position, new THREE.Vector3(65, window.enter_door_left.position.y, window.enter_door_left.position.z))

                    setTimeout(() => {
                        tweenCamera(500, window.enter_door_right_spinner.rotation, new THREE.Vector3(0,
                            window.enter_door_right_spinner.rotation.y,
                            window.enter_door_right_spinner.rotation.z))

                        tweenCamera(500, window.enter_door_left_spinner.rotation, new THREE.Vector3(0,
                            window.enter_door_left_spinner.rotation.y,
                            window.enter_door_left_spinner.rotation.z))


                        setTimeout(() => {
                            window.CORRIDOR_ENTER.visible = false;
                        }, 500);
                    }, 1000);

                }, 3000);
            }
        }
    }

    if (window.PORTALS[0] === null || window.PORTALS[1] === null)
        return

    var dd = 0;

    for (let d of window.dynamicObjects) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)
        let bb = new THREE.Box3(new THREE.Vector3().copy(d.aabb.lowerBound), new THREE.Vector3().copy(d.aabb.upperBound))
        d.collisionFilterMask = window.CGROUP_ALL
        if (window.PORTALS[0] === null || window.PORTALS[1] === null)
            continue

        var inArea = 0;

        for (let p = 0; p < window.PORTALS.length; p++) {

            // collision disable, might be partially intersecting with portal
            if (window.PORTALS[p].CDBB.containsPoint(pos)) {
                d.collisionFilterMask &= ~window.PORTALS[p].hostObjects.collisionFilterGroup;
                d.inArea = true;

                if (dd == 0)
                    inArea++;
            } else {
                d.inArea = false;
            }

            // should teleport
            if (window.PORTALS[p].STBB.containsPoint(pos)) {

                teleportPhysicalObject(d, window.PORTALS[p])

                if (dd == 0) {
                    teleportObject3D(window.MAIN_CAMERA, window.PORTALS[p])

                    // fix camera rotation
                    // create a new basis with up as the up
                    // https://danielilett.com/2020-01-03-tut4-4-portal-momentum/
                    let up = new THREE.Vector3(0, 1, 0)
                    let cameraForward = new THREE.Vector3()
                    window.MAIN_CAMERA.getWorldDirection(cameraForward)
                    cameraForward.normalize()
                    let cameraRight = cameraForward.clone().cross(up).normalize()
                    let cameraUp = cameraRight.clone().cross(cameraForward).normalize()
                    let cameraMat = new THREE.Matrix4().makeBasis(cameraRight, cameraUp, cameraForward.negate())
                    window.MAIN_CAMERA.quaternion.setFromRotationMatrix(cameraMat)

                    targetRotationX = window.MAIN_CAMERA.rotation.y;
                    targetRotationY = window.MAIN_CAMERA.rotation.x;

                    if (inArea > 0)
                        smoothness = 1;
                    else
                        smoothness = 0.1;
                }

                d.collisionFilterMask |= window.PORTALS[p].hostObjects.collisionFilterGroup
                d.collisionFilterMask &= ~window.PORTALS[1 - p].hostObjects.collisionFilterGroup
            }
        }

        dd++;
    }
}

// teleport a 3D object directly, returns nothing
// Object3D includes camera, meshes
function teleportObject3D(object, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    object.applyMatrix4(m)
}

function teleportPhysicalObject(object, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    //object.mesh.applyMatrix4(m)
    let position = cannonToThreeVector3(object.position)
    let previousPosition = cannonToThreeVector3(object.position)
    let velocity = cannonToThreeVector3(object.velocity)
    let force = cannonToThreeVector3(object.force)

    let orientation = new THREE.Quaternion().copy(object.quaternion)
    let mquat = new THREE.Quaternion().setFromRotationMatrix(m)
    orientation.premultiply(mquat)

    position = getTeleportedPositionalVector(position, portal)
    previousPosition = getTeleportedPositionalVector(previousPosition, portal)
    velocity = getTeleportedDirectionalVector(velocity, portal)
    force = getTeleportedDirectionalVector(force, portal)

    object.position.copy(position)
    object.previousPosition.copy(previousPosition)
    object.velocity.copy(velocity)
    object.force.copy(force)
    object.quaternion.copy(orientation)
}

function threeToCannonVector3(v3) {
    return new CANNON.Vec3().copy(v3)
}

function cannonToThreeVector3(v3) {
    return new THREE.Vector3().copy(v3)
}

// apply teleportation to the output portal to the vector
// no side effects
function getTeleportedPositionalVector(v, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let m = portal.CDBB.inverse_t.clone().premultiply(f).premultiply(portal.output.CDBB.t)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// for directional vectors, it doesn't make sense to translate them
// we only apply the rotational component of the matrix
function getTeleportedDirectionalVector(v, portal) {
    let f = new THREE.Matrix4().makeScale(-1, -1, 1)
    let it = new THREE.Matrix4()
    it.extractRotation(portal.CDBB.inverse_t)
    let to = new THREE.Matrix4()
    to.extractRotation(portal.output.CDBB.t)

    let m = it.clone().premultiply(f).premultiply(to)
    let v4 = threeToFour(v).applyMatrix4(m)
    return fourToThree(v4)
}

// convert vector3 to vector4
function threeToFour(v) {
    return new THREE.Vector4(v.x, v.y, v.z, 1)
}

function fourToThree(v) {
    return new THREE.Vector3(v.x, v.y, v.z).multiplyScalar(1 / v.w)
}

function tweenCamera(duration, ini, final) {
    new TWEEN.Tween(ini).to(final, duration)
        //.easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

let controllerIndex = null;

window.addEventListener("gamepadconnected", (event) => {
    const gamepad = event.gamepad;
    controllerIndex = gamepad.index;
    console.log("connected");
});

window.addEventListener("gamepaddisconnected", (event) => {
    controllerIndex = null;
    console.log("disconnected");
});

export {
    updatePlayer
};