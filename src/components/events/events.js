import * as THREE from 'three';
import {
    tweenCamera
} from '../../Main.js';
import {
    teleportPhysicalObject,
    teleportObject3D
} from '../portal/Portal.js';
import * as CANNON from 'cannon';
import {
    deletePortal
} from '../portal/CreatePortal.js';
import {
    elevator
} from '../fps/Fps.js';
import {
    GLOBALS
} from '../../Globals.js';
import {
    exitRoomCollider,
    corridorColliderNames
} from '../test/Test.js';
import {
    removeJointConstraint
} from '../../Physics.js';


var leveEntered = false;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();
var DISPENSER_COVERS = []

var jumping = false;

function updateEvents() {
    portalCollision();
    levelEnteredFunction();
    tractorBeam();
    laser();

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)

        if (pos.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
            if (!d.repawning)
                respawn(d);
        }



        if (GLOBALS.ELEVATOR_TRIGGER.containsPoint(pos) && d.name == "player") {

            if (!d.exiting) {
                d.exiting = true;
                //d.mass = 0;
                elevator();
            }
        }

        for (var j = 0; j < GLOBALS.GOO_BOXES.length; j++) {

            if (GLOBALS.GOO_BOXES[j].containsPoint(pos)) {

                if (!d.repawning) {

                    if (d.name == "player")
                        document.getElementById("death-screen").style.opacity = 1;

                    respawn(d);
                }
            }
        }

        for (let trigger of GLOBALS.TRIGGER) {
            if (trigger && d.name != "player" && !exit && !d.placed) {
                if (trigger.containsPoint(pos)) {


                    var goal = GLOBALS.PLANE_USER_DATA[trigger.id];
                    goal.circle.material.color = new THREE.Color(0xfcba03);
                    goal.check.material.color = new THREE.Color(0xfcba03);
                    goal.check.material.map = GLOBALS.IMG_CHECK;

                    d.placed = true;
                    d.goal = goal;
                    //d.mass = 0;

                    if(!goal.trigger.itemName)
                        return;

                    if (goal.trigger.itemName.includes("door")) {
                        const doorLeft = goal.trigger.item.getObjectByName("door_left");
                        const doorRight = goal.trigger.item.getObjectByName("door_right");

                        var obj = goal.trigger.item.clone();
                        obj.translateZ(-2);
                        obj.translateY(1);
                        GLOBALS.PLAYER.spawnPosition = obj.position.clone();

                        setTimeout(() => {
                            doorLeft.position.z -= 0.1;
                            doorRight.position.z -= 0.1;
                            GLOBALS.CANNON_WORLD.removeBody(goal.trigger.item.body);
                            tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x - 1, doorLeft.position.y, doorLeft.position.z))
                            tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x + 1, doorRight.position.y, doorRight.position.z))

                            deletePortal(0);
                            deletePortal(1);


                            /*setTimeout(() => {
                                GLOBALS.CANNON_WORLD.addBody(goal.trigger.item.body);
                                tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x + 1, doorLeft.position.y, doorLeft.position.z))
                                tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x - 1, doorRight.position.y, doorRight.position.z))
                            }, 10000);*/
                        }, 1000);

                    } else {
                        exit = true;
                        exitRoomCollider();
                        setTimeout(() => {

                            GLOBALS.WALL_CORRIDOR_ENTER.position.y = -2;

                            tweenCamera(500, GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation, new THREE.Vector3(Math.PI,
                                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation.y,
                                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_right_05").rotation.z))

                            tweenCamera(500, GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation, new THREE.Vector3(Math.PI,
                                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation.y,
                                GLOBALS.EXIT_DOOR.getObjectByName("central_spinner_left_07").rotation.z))

                            GLOBALS.CORRIDOR_ENTER.visible = true;
                            GLOBALS.EXIT_ROOM.visible = true;

                            GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z = -5;
                            tweenCamera(1000, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position, new THREE.Vector3(GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.x + 60, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.y, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.z))

                            GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z = -5;
                            tweenCamera(1000, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position, new THREE.Vector3(GLOBALS.EXIT_DOOR.getObjectByName("portal_door_right_04").position.x + 60, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.y, GLOBALS.EXIT_DOOR.getObjectByName("portal_door_left_06").position.z))
                        }, 1000);
                    }
                }
            }
        }
    }
}

var exit = false;

function respawn(d) {

    if (d.name.includes("gel"))
        return;

    d.repawning = true;
    setTimeout(() => {

        d.repawning = false;

        // Velocity
        d.velocity.setZero();
        d.initVelocity.setZero();
        d.angularVelocity.setZero();
        d.initAngularVelocity.setZero();

        // Force
        d.force.setZero();
        d.torque.setZero();

        d.position.copy(d.spawnPosition);

        if (d.name != "player") {
            if (d.state == "once") {
                d.mass = 0;
            } else {
                d.mass = 5;
            }
        } else {
            document.getElementById("death-screen").style.opacity = 0;
        }
    }, 1500);

}

var yyy;

function laser() {
    for (var i = 0; i < GLOBALS.LASER_EMITTER_OBJ.length; i++) {
        //if (GLOBALS.INTERACTIVE[7]) {
        //var intersects = GLOBALS.LASER_EMITTER_OBJ[i].intersectObjects(GLOBALS.INTERACTIVE);
        //}

        var obj2 = GLOBALS.LASER_EMITTER_OBJ[i];

        if (GLOBALS.LASER_EMITTER_OBJ[i].fromCube) {
            obj2 = new THREE.Object3D();
            obj2.position.copy(GLOBALS.LASER_EMITTER_OBJ[i].position)
            obj2.rotation.copy(GLOBALS.LASER_EMITTER_OBJ[i].rotation)
            //obj2.translateY(GLOBALS.LASER_EMITTER_OBJ[i].distance / 2);
            obj2.fromCube = true;
        }

        var vector = new THREE.Vector3();
        var raycasterLaser = new THREE.Raycaster();

        vector.copy(obj2.position);

        let dir = new THREE.Vector3()
        obj2.getWorldDirection(dir)
        dir.normalize()

        raycasterLaser.set(vector, dir);
        var intersects = raycasterLaser.intersectObject(GLOBALS.LASER_CUBE);

        if (intersects.length > 0) {

            var id = intersects[0].instanceId;

            if (obj2.fromCube) {
                /*for (var h = 0; h < intersects.length; h++) {
                    if (intersects[i].instanceId != 1) {
                    }
                }*/
            } else {
                GLOBALS.LASER_EMITTER[i].rotation.set(0, 0, 0)
                GLOBALS.LASER_EMITTER[i].position.set(0, 0, 0)

                GLOBALS.LASER_EMITTER[i].geometry.dispose();
                GLOBALS.LASER_EMITTER[i].geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);
                GLOBALS.LASER_EMITTER[i].position.copy(obj2.position);
                GLOBALS.LASER_EMITTER[i].translateZ(intersects[0].distance / 2);

                GLOBALS.LASER_EMITTER[i].rotation.x = Math.PI / 2;

                //----------------------------------------------------

                var cube = GLOBALS.DYMANIC_ITEMS["laser_cube"][intersects[0].instanceId]
                yyy = cube;

                var vector = new THREE.Vector3();
                var raycasterLaser = new THREE.Raycaster();

                vector.copy(cube.position);

                let dir = new THREE.Vector3()
                cube.getWorldDirection(dir)
                dir.normalize()

                raycasterLaser.set(vector, dir);
                var intersects = raycasterLaser.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

                if (intersects.length > 0) {
                    const geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);

                    if (!cube.laser) {
                        const plane = new THREE.Mesh(geometry, GLOBALS.LASER_EMITTER[i].material); //materialBridge
                        GLOBALS.SCENE_CHILDREN.add(plane);


                        cube.laser = true;
                        cube.plane = plane;
                    } else {
                        cube.plane.rotation.set(0, 0, 0)
                        cube.plane.position.set(0, 0, 0)

                        cube.plane.geometry.dispose();
                        cube.plane.geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);

                        if (GLOBALS.HOLDING_ITEM && GLOBALS.CURRENT_ITEM_ID == id)
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

            if (GLOBALS.LASER_EMITTER[i]) {
                GLOBALS.LASER_EMITTER[i].rotation.set(0, 0, 0)
                GLOBALS.LASER_EMITTER[i].position.set(0, 0, 0)

                GLOBALS.LASER_EMITTER[i].geometry.dispose();
                GLOBALS.LASER_EMITTER[i].geometry = new THREE.CylinderGeometry(0.02, 0.02, GLOBALS.LASER_EMITTER_OBJ[i].distance, 32);
                GLOBALS.LASER_EMITTER[i].position.copy(GLOBALS.LASER_EMITTER_OBJ[i].position);
                GLOBALS.LASER_EMITTER[i].translateZ(GLOBALS.LASER_EMITTER_OBJ[i].distance / 2);

                GLOBALS.LASER_EMITTER[i].rotation.x = Math.PI / 2;
            }

            if (yyy) {
                if (yyy.laser) {
                    GLOBALS.SCENE_CHILDREN.remove(yyy.plane);
                    yyy.laser = false;
                }
            }

        }
    }
}

var launch = false;

function tractorBeam() {

    var aa = false;
    var hh = 0;

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {

        let pos = new THREE.Vector3(d.position.x, d.position.y - 1, d.position.z)

        hh++;

        if (d.holding)
            continue

        for (var j = 0; j < GLOBALS.FAITH_PLATE_CONTACT_BOX.length; j++) {

            if (GLOBALS.FAITH_PLATE_CONTACT_BOX[j].containsPoint(pos)) {

                if (!launch) {
                    launch = true;
                    d.launch = true;

                    setTimeout(() => {
                        launch = false;
                    }, 150);

                    var ff = GLOBALS.FAITH_PLATE_TO_ROTATE[j];

                    tweenCamera(200, ff.rotation, new THREE.Vector3(Math.PI * 0.7, 0, 0))
                    setTimeout(() => {
                        tweenCamera(200, ff.rotation, new THREE.Vector3(Math.PI / 2, 0, 0))
                    }, 200);

                    //const strength = 500
                    //const dt = 1 / 60

                    //const impulse = new CANNON.Vec3(-strength * dt, 0, 0)
                    //d.applyImpulse(impulse)

                    // Position
                    //d.position.setZero();
                    d.previousPosition.setZero();
                    d.interpolatedPosition.setZero();
                    d.initPosition.setZero();

                    // orientation
                    //d.quaternion.set(0, 0, 0, 1);
                    //d.initQuaternion.set(0, 0, 0, 1);
                    //d.previousQuaternion.set(0, 0, 0, 1);
                    //d.interpolatedQuaternion.set(0, 0, 0, 1);

                    // Velocity
                    d.velocity.setZero();
                    d.initVelocity.setZero();
                    d.angularVelocity.setZero();
                    d.initAngularVelocity.setZero();

                    // Force
                    d.force.setZero();
                    d.torque.setZero();

                    d.position.x = GLOBALS.FAITH_PLATE_CONTACT_BOX[j].position.x
                    d.position.z = GLOBALS.FAITH_PLATE_CONTACT_BOX[j].position.z

                    // d.linearDamping = 0.5
                    //d.angularDamping = 0.5

                    var up;
                    var f;

                    var up = new THREE.Vector3();
                    GLOBALS.FAITH_PLATE_CONTACT_BOX[j].item.getWorldDirection(up);
                    up.y = 1;
                    up.x *= 0.55;
                    up.z *= 0.55;

                    if (d.name == "player")
                        f = 53000;
                    else {
                        if (up.z == -0.55)
                            f = 4325;
                        else
                            f = 4300;
                    }

                    if (up.x == -0.55) {
                        //f = 70000;
                        up.x = -1.2;
                        up.y = 1.2;
                    }

                    /*if (j == 0 || j == 1) {
                        up = new THREE.Vector3(0, 1, 0.5);

                        if (hh == 1)
                            f = 3500;
                        else
                            f = 280; //3500
                    } else if (j == 1) {


                        up = new THREE.Vector3(0, 1, 0.5);

                        if (hh == 1)
                            f = 3500;
                        else
                            f = 280; //3500
                    } else if (j == 2) {
                        up = new THREE.Vector3(0.5, 1, 0);

                        if (hh == 1)
                            f = 3500 //2800;
                        else
                            f = 280; //3500 
                    }*/

                    d.applyImpulse(up.clone().multiplyScalar(f * 1 / 60), d.position)

                    const initialPosition = new CANNON.Vec3(-15, 0, 21);

                    // Set the desired final position
                    const finalPosition = new CANNON.Vec3(-15, 0, -3);

                    // Set the desired maximum height
                    const maxHeight = 2; // meters

                    // Set the gravitational acceleration
                    const gravity = new CANNON.Vec3(0, -9.8, 0);

                    // Calculate the required initial velocity to reach the desired maximum height
                    const initialVelocity = Math.sqrt(2 * maxHeight * gravity.length());

                    // Calculate the time of flight to reach the desired final position
                    const timeToReachDestination = Math.sqrt(2 * Math.abs(finalPosition.z - initialPosition.z) / gravity.length());

                    // Calculate the required constant force to achieve the desired initial velocity
                    const requiredForce = new CANNON.Vec3();
                    gravity.scale(d.mass, requiredForce);
                    requiredForce.scale(initialVelocity / timeToReachDestination, requiredForce);

                    // Apply the force to the body
                    //d.applyImpulse(force, d.position);

                    /*const impulse = up.clone().multiplyScalar(f * 0.25);

                    // Assuming sphereBody is your Cannon.js body

                    // Get the current position and velocity
                    const initialPosition = new CANNON.Vec3().copy(new THREE.Vector3(3, 0, 7));
                    const initialVelocity = new CANNON.Vec3().copy(d.velocity);

                    // Assume force is the impulse applied over time (F = impulse / dt)
                    const force = impulse.clone();
                    const dt = GLOBALS.CANNON_WORLD.dt; // world is your Cannon.js World object

                    // Calculate acceleration (a = F / m)
                    const acceleration = new CANNON.Vec3().copy(force).scale(1 / d.mass);

                    // Calculate displacement (s = ut + (1/2)at^2)
                    const displacement = new CANNON.Vec3();
                    displacement.copy(initialVelocity).scale(dt).vadd(acceleration.scale(0.5 * dt * dt));

                    // Calculate final position
                    const finalPosition = new CANNON.Vec3();
                    finalPosition.copy(initialPosition).vadd(displacement);*/
                }
            }
        }

        pos.y += 1;

        for (var j = 0; j < GLOBALS.TRACTOR_BEAM.length; j++) {

            if (GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j]) {

                if (d.inTractor && d.tractor != j)
                    continue;

                if (GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].containsPoint(pos)) {

                    var vec = new THREE.Vector3();
                    GLOBALS.TRACTOR_BEAM[j].getWorldDirection(vec)

                    if (!d.inTractor) {
                        d.inTractorPositionY = d.position.clone().y;
                        d.inTractor = true;
                        d.tractor = j;
                        GLOBALS.TRACTOR_BEAM[j].inTractor = true;
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

                        if (!d.inArea) {
                            var center = new THREE.Vector3((Math.abs(vec.x - 1)) * GLOBALS.TRACTOR_BEAM[j].position.x + (d.position.x * vec.x),
                                (Math.abs(vec.y - 1)) * GLOBALS.TRACTOR_BEAM[j].position.y + (d.position.y * vec.y),
                                (Math.abs(vec.z - 1)) * GLOBALS.TRACTOR_BEAM[j].position.z + (d.position.z * vec.z));

                            tweenCamera(500, d.position, center)
                        }
                    } else {

                        pos.add(vec.clone().multiplyScalar(0.04)); //* GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].side
                        d.position.copy(pos);
                        d.angularVelocity.setZero();
                        d.velocity.setZero();


                    }

                } else {
                    if (d.inTractor && d.tractor == j) { //&& GLOBALS.TRACTOR_BEAM[j].inTractor
                        if (d.name == "player")
                            d.mass = 50;
                        else
                            d.mass = 5;

                        d.inTractor = false;
                        GLOBALS.TRACTOR_BEAM[j].inTractor = false;
                        d.tractor = null;
                    }
                }
            } else {
                if (d.inTractor && d.tractor == j) { //&& GLOBALS.TRACTOR_BEAM[j].inTractor
                    if (d.name == "player")
                        d.mass = 50;
                    else
                        d.mass = 5;

                    d.inTractor = false;
                    GLOBALS.TRACTOR_BEAM[j].inTractor = false;
                    d.tractor = null;
                }
            }
        }
    }
}


// Function to apply impulse to follow trajectory through points
function applyImpulseToFollowTrajectory(start, middle, end, body) {
    // Calculate initial velocity to reach the middle point
    const g = 9.82; // gravitational acceleration
    const d1 = middle.y - start.y;
    const v1 = Math.sqrt(2 * g * d1);

    // Calculate the time to reach the middle point
    const t1 = v1 / g;

    // Calculate the distance to the end point from the middle point
    const d2 = end.distanceTo(new THREE.Vector3(middle.x, middle.y, middle.z));

    // Calculate the final velocity for the end point
    const v2 = Math.sqrt(2 * g * d2);

    // Calculate the total time of flight
    const totalTime = t1 + v2 / g;

    // Calculate the average velocity
    const averageVelocity = d2 / totalTime;

    // Calculate the direction vectors
    const direction1 = new THREE.Vector3();
    //middle.sub(start).normalize();
    direction1.subVectors(start, middle).normalize();

    const direction2 = new THREE.Vector3();
    //end.sub(middle).normalize();
    direction2.subVectors(middle, end).normalize();

    // Calculate the total impulse needed
    const impulseMagnitude = averageVelocity * body.mass * 5;
    const impulse = new CANNON.Vec3();
    impulse.x = direction1.x + direction2.x;
    impulse.y = direction1.y - direction2.y;
    impulse.z = direction1.z + direction2.z;


    impulse.y *= -2;
    impulse.z *= -1;

    //impulse.normalize().scale(impulseMagnitude, impulse);

    impulse.normalize();
    impulse.scale(impulseMagnitude, impulse);


    // Apply the impulse to the Cannon.js body
    body.applyImpulse(impulse, body.position);
}

function portalCollision() {

    if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
        return

    var dd = 0;

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)

        d.collisionFilterMask = GLOBALS.CGROUP_ALL
        if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
            continue

        var inArea = 0;

        GLOBALS.PLAYER_MODEL_CLONE.visible = false;
        GLOBALS.GUN_CLONE.visible = false;
        let CDBB_isOverlap = false;

        for (let p = 0; p < GLOBALS.PORTALS.length; p++) {

            // collision disable, might be partially intersecting with portal
            if (GLOBALS.PORTALS[p].CDBB.containsPoint(pos)) {

                if(d.name != "player"){
                    //d.allowSleep = false;
                    //console.log("9999999999999")
                }

                if ((d.name == "gel" || d.name == "gel-orange") && !d.disabled) {
                    d.disabled = true;
                    GLOBALS.CANNON_WORLD.removeBody(d);
                    //d.position.y = d.posMinus;
                }

                d.collisionFilterMask &= ~GLOBALS.PORTALS[p].hostObjects.collisionFilterGroup;
                d.inArea = true;

                if (dd == 0) {

                    inArea++;

                    // show the clone
                    if (p == 0 || (p > 0 && !CDBB_isOverlap)) {
                        CDBB_isOverlap = true;
                        teleportObject3D(GLOBALS.PLAYER_MODEL_CLONE, GLOBALS.PORTALS[p])
                        //GLOBALS.PLAYER_MODEL_CLONE.visible = true;

                        GLOBALS.PLAYER_MODEL_CLONE.traverse(c => {
                            if (c.isBone) {
                                if (c.name == "wrist_R") {
                                    window.hand2 = c;
                                    //console.log("1111111111111")
                                    //window.hand2.add(GLOBALS.GUN_CLONE);
                                }
                            }
                        })

                        //GLOBALS.GUN_CLONE.visible = true;
                    }
                }


            } else {
                if ((d.name == "gel" || d.name == "gel-orange") && d.disabled) {
                    //d.position.y = d.posIni;
                    d.disabled = false;
                    GLOBALS.CANNON_WORLD.addBody(d);
                }

                d.inArea = false;

                if(d.name != "player"){
                    //d.allowSleep = true;
                }
            }

            if (d.name == "gel") {
                continue;
            }

            // should teleport
            if (GLOBALS.PORTALS[p].STBB.containsPoint(pos)) {

                if(d.name != "player"){
                    //d.allowSleep = false;
                    console.log("777777777777")
                }

                //GLOBALS.CURRENT_ITEM.body.holding
                if(d.holding){
                    d.teleportingHolding = true;
                }else{
                    teleportPhysicalObject(d, GLOBALS.PORTALS[p])

                    if (dd == 0) {
                        removeJointConstraint();
                        teleportObject3D(GLOBALS.MAIN_CAMERA, GLOBALS.PORTALS[p])
    
                        // fix camera rotation
                        // create a new basis with up as the up
                        // https://danielilett.com/2020-01-03-tut4-4-portal-momentum/
                        let up = new THREE.Vector3(0, 1, 0)
                        let cameraForward = new THREE.Vector3()
                        GLOBALS.MAIN_CAMERA.getWorldDirection(cameraForward)
                        cameraForward.normalize()
                        let cameraRight = cameraForward.clone().cross(up).normalize()
                        let cameraUp = cameraRight.clone().cross(cameraForward).normalize()
                        let cameraMat = new THREE.Matrix4().makeBasis(cameraRight, cameraUp, cameraForward.negate())
                        GLOBALS.MAIN_CAMERA.quaternion.setFromRotationMatrix(cameraMat)
    
                        GLOBALS.TARGET_ROTATION_X = GLOBALS.MAIN_CAMERA.rotation.y;
                        GLOBALS.TARGET_ROTATION_Y = GLOBALS.MAIN_CAMERA.rotation.x;
    
                        GLOBALS.GUN.quaternion.copy(GLOBALS.MAIN_CAMERA.quaternion);
                    }
    
                    d.collisionFilterMask |= GLOBALS.PORTALS[p].hostObjects.collisionFilterGroup
                    d.collisionFilterMask &= ~GLOBALS.PORTALS[1 - p].hostObjects.collisionFilterGroup
                }
            }
        }
        dd++;
    }
}

function levelEnteredFunction() {
    if (!leveEntered) {
        raycaster2.setFromCamera(coords, GLOBALS.MAIN_CAMERA);
        var intersects = raycaster2.intersectObject(GLOBALS.ENTER_DOOR);

        if (intersects.length > 0) {
            if (intersects[0].distance < 0.1) {
                leveEntered = true;

                setTimeout(() => {
                    GLOBALS.WALL_CORRIDOR_ENTER.position.y = 0;
                }, 200);

                setTimeout(() => {
                    GLOBALS.SPOTLIGHT.intensity = 20;
                    GLOBALS.RENDERER.shadowMap.autoUpdate = true;

                    setTimeout(() => {
                        GLOBALS.RENDERER.shadowMap.autoUpdate = false;

                        for (var i = 0; i < DISPENSER_COVERS.length; i++)
                            tweenCamera(300, DISPENSER_COVERS[i].scale, new THREE.Vector3(0, 0, 0))

                        setTimeout(() => {
                            //INITIATE BOX CANNON

                            for (var i = 0; i < GLOBALS.BOX_BODY.length; i++) {

                                if (GLOBALS.BOX_BODY[i].state == "open") {
                                    GLOBALS.BOX_BODY[i].mass = 5;
                                    GLOBALS.BOX_BODY[i].allowSleep = true;
                                }
                            }
                            for (var i = 0; i < GLOBALS.SPHERE_BODY.length; i++) {
                                GLOBALS.SPHERE_BODY[i].mass = 5;
                                GLOBALS.SPHERE_BODY[i].allowSleep = true;
                            }

                            setTimeout(() => {
                                for (var i = 0; i < DISPENSER_COVERS.length; i++)
                                    tweenCamera(100, DISPENSER_COVERS[i].scale, new THREE.Vector3(0.012, 0.012, 0.012))
                            }, 1000);
                        }, 300);
                    }, 1000);
                }, 1000);

                setTimeout(() => {

                    GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.z = -4;
                    tweenCamera(1000, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position, new THREE.Vector3(-65, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.y, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_right_04").position.z))

                    GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.z = -4;
                    tweenCamera(1000, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position, new THREE.Vector3(65, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.y, GLOBALS.ENTER_DOOR.getObjectByName("portal_door_left_06").position.z))

                    setTimeout(() => {
                        tweenCamera(500, GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_right_05").rotation, new THREE.Vector3(0,
                            GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_right_05").rotation.y,
                            GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_right_05").rotation.z))

                        tweenCamera(500, GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_left_07").rotation, new THREE.Vector3(0,
                            GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_left_07").rotation.y,
                            GLOBALS.ENTER_DOOR.getObjectByName("central_spinner_left_07").rotation.z))

                        setTimeout(() => {
                            GLOBALS.CORRIDOR_ENTER.visible = false;
                            GLOBALS.EXIT_DOOR.add(GLOBALS.CORRIDOR_ENTER);
                            corridorColliderNames(false);
                        }, 500);
                    }, 1000);

                }, 3000);
            }
        }
    }
}

export {
    updateEvents
};