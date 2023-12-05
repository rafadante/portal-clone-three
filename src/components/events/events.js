import * as THREE from '../../build/three.module.js';
import {
    tweenCamera
} from '../../Main.js';
import {
    teleportPhysicalObject,
    teleportObject3D
} from '../portal/Portal.js';

var leveEntered = false;
var coords = new THREE.Vector3();
var raycaster2 = new THREE.Raycaster();

function updateEvents() {
    portalCollision();
    levelEnteredFunction();
    tractorBeam();
    laser();
}

var yyy;

function laser(){
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
}

function tractorBeam() {

    var aa = false;

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

                if (dd == 0)
                    inArea++;
            } else
                d.inArea = false;

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
                            console.log("ppppppppppp")
                            for (var i = 0; i < window.BOX_BODY.length; i++) {
                                window.CANNON_WORLD.addBody(window.BOX_BODY[i])
                            }
                            for (var i = 0; i < window.SPHERE_BODY.length; i++) {
                                window.CANNON_WORLD.addBody(window.SPHERE_BODY[i])
                            }
                            window.initLevel = true;

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