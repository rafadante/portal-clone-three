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

var leveEntered = false;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function updateEvents() {
    portalCollision();
    levelEnteredFunction();
    tractorBeam();
    laser();

    for (let d of window.dynamicObjects) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)

        if (pos.distanceTo(new THREE.Vector3(0, 0, 0)) > 100) {
            if (!d.repawning)
                respawn(d);
        }

        for (var j = 0; j < window.gooBoxes.length; j++) {

            if (window.gooBoxes[j].containsPoint(pos)) {

                if (!d.repawning) {

                    if (d.name == "player")
                        document.getElementById("death-screen").style.opacity = 1;

                    respawn(d);
                }
            }
        }

        for (let trigger of window.TRIGGER) {
            if (trigger && d.name != "player" && !exit && !d.placed) {
                if (trigger.containsPoint(pos)) {


                    var goal = window.planeUserData[trigger.id];
                    goal.circle.material.color = new THREE.Color(0xfcba03);
                    goal.check.material.color = new THREE.Color(0xfcba03);
                    goal.check.material.map = window.CHECK;

                    d.placed = true;
                    d.goal = goal;
                    //d.mass = 0;

                    //

                    console.log(goal)

                    if (goal.trigger.itemName.includes("door")) {
                        console.log("55555555555555")
                        const doorLeft = goal.trigger.item.getObjectByName("door_left");
                        const doorRight = goal.trigger.item.getObjectByName("door_right");

                        var obj = goal.trigger.item.clone();
                        obj.translateZ(-2);
                        obj.translateY(1);
                        window.PLAYER.spawnPosition = obj.position.clone();
                        console.log(window.PLAYER.spawnPosition)

                        setTimeout(() => {
                            doorLeft.position.z -= 0.1;
                            doorRight.position.z -= 0.1;
                            window.CANNON_WORLD.removeBody(goal.trigger.item.body);
                            tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x - 1, doorLeft.position.y, doorLeft.position.z))
                            tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x + 1, doorRight.position.y, doorRight.position.z))

                            deletePortal(0);
                            deletePortal(1);


                            /*setTimeout(() => {
                                window.CANNON_WORLD.addBody(goal.trigger.item.body);
                                tweenCamera(1000, doorLeft.position, new THREE.Vector3(doorLeft.position.x + 1, doorLeft.position.y, doorLeft.position.z))
                                tweenCamera(1000, doorRight.position, new THREE.Vector3(doorRight.position.x - 1, doorRight.position.y, doorRight.position.z))
                            }, 10000);*/
                        }, 1000);

                    } else {
                        exit = true;
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
                        }, 1000);
                    }
                }
            }
        }
    }
}

var exit = false;

function respawn(d) {
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
    }, 3000);

}

var yyy;

function laser() {
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
}

var launch = false;

function tractorBeam() {

    var aa = false;
    var hh = 0;

    for (let d of window.dynamicObjects) {

        let pos = new THREE.Vector3(d.position.x, d.position.y - 1, d.position.z)

        hh++;

        for (var j = 0; j < window.faithBox.length; j++) {

            if (window.faithBox[j].containsPoint(pos)) {

                if (!launch) {
                    launch = true;

                    setTimeout(() => {
                        launch = false;
                    }, 50);

                    console.log(j);

                    var ff = window.faithBox2[j];

                    tweenCamera(200, ff.rotation, new THREE.Vector3(Math.PI * 0.7, 0, 0))
                    setTimeout(() => {
                        tweenCamera(200, ff.rotation, new THREE.Vector3(Math.PI / 2, 0, 0))
                    }, 200);

                    console.log(d)

                    //const strength = 500
                    //const dt = 1 / 60

                    //const impulse = new CANNON.Vec3(-strength * dt, 0, 0)
                    //d.applyImpulse(impulse)

                    // Velocity
                    d.velocity.setZero();
                    d.initVelocity.setZero();
                    d.angularVelocity.setZero();
                    d.initAngularVelocity.setZero();

                    // Force
                    d.force.setZero();
                    d.torque.setZero();

                    var up;
                    var f;

                    if (j == 1) {
                        up = new THREE.Vector3(0, 1, -0.5);

                        if (hh == 1)
                            f = 3500;
                        else
                            f = 280; //3500
                    } else if (j == 0) {


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
                    }



                    d.applyImpulse(up.clone().multiplyScalar(f * 0.25), d.position)

                    const impulse = up.clone().multiplyScalar(f * 0.25);

                    // Assuming sphereBody is your Cannon.js body

                    // Get the current position and velocity
                    const initialPosition = new CANNON.Vec3().copy(new THREE.Vector3(3, 0, 7));
                    const initialVelocity = new CANNON.Vec3().copy(d.velocity);

                    // Assume force is the impulse applied over time (F = impulse / dt)
                    const force = impulse.clone();
                    const dt = window.CANNON_WORLD.dt; // world is your Cannon.js World object

                    // Calculate acceleration (a = F / m)
                    const acceleration = new CANNON.Vec3().copy(force).scale(1 / d.mass);

                    console.log(acceleration)

                    // Calculate displacement (s = ut + (1/2)at^2)
                    const displacement = new CANNON.Vec3();
                    displacement.copy(initialVelocity).scale(dt).vadd(acceleration.scale(0.5 * dt * dt));

                    console.log(displacement)
                    console.log(initialVelocity)

                    // Calculate final position
                    const finalPosition = new CANNON.Vec3();
                    finalPosition.copy(initialPosition).vadd(displacement);

                    console.log(finalPosition)
                }
                //console.log("oooooooooooooooo")
            }
        }

        pos.y += 1;

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

                        if (!d.inArea) {
                            var center = new THREE.Vector3((Math.abs(vec.x - 1)) * window.tractorBeam[j].position.x + (d.position.x * vec.x),
                                (Math.abs(vec.y - 1)) * window.tractorBeam[j].position.y + (d.position.y * vec.y),
                                (Math.abs(vec.z - 1)) * window.tractorBeam[j].position.z + (d.position.z * vec.z));

                            tweenCamera(500, d.position, center)
                        }
                    } else {

                        /*if (d.recall) {
                            //console.log("kkkkkkkkkkkkkk")
                            continue;
                        }*/

                        pos.add(vec.clone().multiplyScalar(0.02)); //* window.tractorBeamBoundingBox[j].side
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
    console.log(direction1)
    console.log(direction2)
    console.log(impulseMagnitude)

    //impulse.normalize().scale(impulseMagnitude, impulse);

    impulse.normalize();
    impulse.scale(impulseMagnitude, impulse);

    console.log(impulse)



    // Apply the impulse to the Cannon.js body
    body.applyImpulse(impulse, body.position);
}

function portalCollision() {

    if (window.PORTALS[0] === null || window.PORTALS[1] === null)
        return

    var dd = 0;

    for (let d of window.dynamicObjects) {

        let pos = new THREE.Vector3(d.position.x, d.position.y, d.position.z)

        d.collisionFilterMask = window.CGROUP_ALL
        if (window.PORTALS[0] === null || window.PORTALS[1] === null)
            continue

        var inArea = 0;

        for (let p = 0; p < window.PORTALS.length; p++) {

            // collision disable, might be partially intersecting with portal
            if (window.PORTALS[p].CDBB.containsPoint(pos)) {
                d.collisionFilterMask &= ~window.PORTALS[p].hostObjects.collisionFilterGroup;
                d.inArea = true;

                //console.log("0000000000000")

                if (dd == 0)
                    inArea++;
            } else
                d.inArea = false;

            // should teleport
            if (window.PORTALS[p].STBB.containsPoint(pos)) {

                //console.log("1111111111")

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

                    window.targetRotationX = window.MAIN_CAMERA.rotation.y;
                    window.targetRotationY = window.MAIN_CAMERA.rotation.x;

                    if (inArea > 0)
                        window.smoothness = 1;
                    else
                        window.smoothness = 0.1;
                }

                d.collisionFilterMask |= window.PORTALS[p].hostObjects.collisionFilterGroup
                d.collisionFilterMask &= ~window.PORTALS[1 - p].hostObjects.collisionFilterGroup
            }
        }

        dd++;
    }
}

function levelEnteredFunction() {
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

                        for (var i = 0; i < window.DISPENSER_COVERS.length; i++)
                            tweenCamera(300, window.DISPENSER_COVERS[i].scale, new THREE.Vector3(0, 0, 0))

                        setTimeout(() => {
                            //INITIATE BOX CANNON

                            for (var i = 0; i < window.BOX_BODY.length; i++) {

                                if (window.BOX_BODY[i].state == "open")
                                    window.BOX_BODY[i].mass = 5;
                                //window.CANNON_WORLD.addBody(window.BOX_BODY[i])
                            }
                            for (var i = 0; i < window.SPHERE_BODY.length; i++) {
                                window.SPHERE_BODY[i].mass = 5;
                                //window.CANNON_WORLD.addBody(window.SPHERE_BODY[i])
                            }
                            //window.initLevel = true;

                            setTimeout(() => {
                                for (var i = 0; i < window.DISPENSER_COVERS.length; i++)
                                    tweenCamera(100, window.DISPENSER_COVERS[i].scale, new THREE.Vector3(0.012, 0.012, 0.012))
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
}

export {
    updateEvents
};