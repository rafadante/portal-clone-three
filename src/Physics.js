import * as CANNON from 'cannon';
import CannonDebugger from 'cannon-es-debugger';
import { GLOBALS } from './Globals.js';
import { PlaneGeometry, Mesh, MeshBasicMaterial, Vector3, Object3D, Raycaster } from 'three';
import $ from 'jquery';
import { updateLaserCubeRaycaster, updateLaserEmitterRaycaster } from './components/lasers/Laser.js';
import { laserReceiverTrigger } from './components/events/events.js';
import { applyCustomGravity } from './components/gels/Gels.js';
import { updateGelBlob } from './components/gels/GelDispenser.js';
import { updatePlatformPosition } from './components/platforms/Platform.js';

// return the cannon world
// Setup our world
let world = new CANNON.World();
world.quatNormalizeSkip = 0;
world.quatNormalizeFast = false;

var solver = new CANNON.GSSolver();

world.defaultContactMaterial.contactEquationStiffness = 1e9;
world.defaultContactMaterial.contactEquationRelaxation = 4;

solver.iterations = 10;
solver.tolerance = 0.1;
let split = true;
if (split)
    world.solver = new CANNON.SplitSolver(solver);
else
    world.solver = solver;

world.gravity.set(0, -9.8, 0);
world.allowSleep = true;
world.broadphase = new CANNON.NaiveBroadphase();

//PHYSICS INTERACTIONS
var getObject = false;
var debugColision = true;
let jointBody;
let jointConstraint;
let movementPlane;

// Joint body, to later constraint the cube
const jointShape = new CANNON.Sphere(0.1)
jointBody = new CANNON.Body({
    mass: 0
})
jointBody.addShape(jointShape)
jointBody.collisionFilterGroup = 0;
jointBody.collisionFilterMask = GLOBALS.CGROUP_ENVIRONMENT | GLOBALS.CGROUP_DYNAMIC;;
world.addBody(jointBody)

// Movement plane when dragging
const planeGeometry = new PlaneGeometry(100, 100)
movementPlane = new Mesh(planeGeometry, new MeshBasicMaterial())
movementPlane.visible = false // Hide it..

const cannonDebugger = new CannonDebugger(GLOBALS.DEBUGGER_GROUP, world, {
    onInit(body, mesh) {
        mesh.visible = false;
        $("body").on('input', '#debug-input', function () {
            debugColision = this.checked;
            mesh.visible = this.checked;
        })
    }
})

var coords = new Vector3();
var raycaster = new Raycaster();
var updateLasers = true;


function updatePhysics(deltatime) {

    applyCustomGravity();
    updateGelBlob();

    if (GLOBALS.HOLDING_ITEM) {
        // Project the mouse onto the movement plane
        var hitPoint = new Vector3(); // create once an reuse it
        GLOBALS.MAIN_CAMERA.getObjectByName("cubeHolder").getWorldPosition(hitPoint);

        var portalInFront = false;

        raycaster.setFromCamera(coords, GLOBALS.MAIN_CAMERA);

        //DETECT IF THE CAMERA IS IN FRONT OF A PORTAL
        if (GLOBALS.PORTAL_INNER_BOX[0] != null && GLOBALS.PORTAL_INNER_BOX[1] != null) {
            var intersectPortal = raycaster.intersectObjects(GLOBALS.PORTAL_INNER_BOX);
            if (intersectPortal.length > 0) {
                if (intersectPortal[0].distance < 1.25)
                    portalInFront = true;
            }
        }

        //TO AVOID THE HOLDING OBJECT TO GO OFF WALLS, DETECT IF THE CAMERA IS CLOSE TO A WALL
        //IF TRUE, PLACE THE HOLDING ITEM AT A FIXED POSITION
        var intersectWall = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);
        if (intersectWall.length > 0) {//&& !GLOBALS.CURRENT_ITEM.body.teleportingHolding && !ff

            if (intersectWall[0].distance < 1.25 && !portalInFront) {

                var point = intersectWall[0].point;

                var pLocal = new Vector3(0, 0, -1);
                var pWorld = pLocal.applyMatrix4(GLOBALS.MAIN_CAMERA.matrixWorld);
                var dir = pWorld.sub(GLOBALS.MAIN_CAMERA.position).normalize();

                point.add(dir.clone().multiplyScalar(-GLOBALS.CURRENT_ITEM.body.offset));
                hitPoint = point;

                GLOBALS.CURRENT_ITEM.body.position.copy(point);
            }
        }

        var intersectWall = raycaster.intersectObjects(window.glass);
        if (intersectWall.length > 0) {//&& !GLOBALS.CURRENT_ITEM.body.teleportingHolding && !ff

            if (intersectWall[0].distance < 1.25 && !portalInFront) {

                var point = intersectWall[0].point;

                var pLocal = new Vector3(0, 0, -1);
                var pWorld = pLocal.applyMatrix4(GLOBALS.MAIN_CAMERA.matrixWorld);
                var dir = pWorld.sub(GLOBALS.MAIN_CAMERA.position).normalize();

                point.add(dir.clone().multiplyScalar(-GLOBALS.CURRENT_ITEM.body.offset));
                hitPoint = point;

                GLOBALS.CURRENT_ITEM.body.position.copy(point);
            }
        }

        if (!getObject) {
            getObject = true;
            // Create the constraint between the cube body and the joint body
            addJointConstraint(hitPoint, GLOBALS.CURRENT_ITEM.body)
        }

        // Move the cannon constraint on the contact point
        moveJoint(hitPoint);
    }

    if (updateLasers)
        updateLaserEmitterRaycaster();

    for (const property in GLOBALS.DYMANIC_ITEMS) {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(property);

        if (property == "gel_gun_blue" || property == "gel_gun_orange" || property == "gel_gun_white" ||
            property == "pedestal_button" || property == "button_weight" || property == "button_box" ||
            property == "button_sphere" || property == "dispenser" || property == "ramp" ||
            property == "ramp_half" || property == "ramp_half2" || property == "stairs" ||
            property == "light_bridge" || property == "laser_emitter" || property == "angled_panel" ||
            property == "door" || property == "light" || property == "stripe" || property == "gel_blue" ||
            property == "gel_orange" || property == "laser_field" || property == "fizzler" ||
            property == "portal_0" || property == "portal_1" || property == "pellet_launcher" ||
            property == "gel_recharger" ||
            property == "gel_white" || property == "gel_clear" || property == "gel_reflection" ||
            property == "pellet_catcher" || property == "faith_plate" || property == "gel_purple" ||
            property == "bed" || property == "toilet" || property == "desk" || property == "cabinet" ||
            property == "sign" || property == "incinerator"|| property == "step")
            continue;

        for (var i = 0; i < GLOBALS.DYMANIC_ITEMS[property].length; i++) {

            if (GLOBALS.DYMANIC_ITEMS[property][i].length != 0) {

                if (GLOBALS.DYMANIC_ITEMS[property][i].body) {
                    if (GLOBALS.DYMANIC_ITEMS[property][i].body.sound) {
                        GLOBALS.DYMANIC_ITEMS[property][i].body.sound.position.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.position);
                        GLOBALS.DYMANIC_ITEMS[property][i].body.sound.quaternion.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.quaternion);
                    }
                }

                if (property == "piston_platforms" || property == "track_platforms") {
                    updatePlatformPosition(GLOBALS.DYMANIC_ITEMS[property][i], instanced, i, deltatime);
                } else {

                    if (property == "tractor_beam" || property == "laser_receiver" || property == "laser_relay") {
                        if (GLOBALS.DYMANIC_ITEMS[property][i].userData.state) {
                            if (property == "tractor_beam")
                                rotateInstanced(instanced, GLOBALS.DYMANIC_ITEMS[property][i], i, 0.05)
                            else if (property == "laser_receiver" || property == "laser_relay")
                                rotateInstanced(instanced, GLOBALS.DYMANIC_ITEMS[property][i], i, -0.075)
                        }
                    } else {

                        var item = new Object3D();
                        item.position.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.position);
                        item.quaternion.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.quaternion);

                        item.updateMatrix();
                        instanced.setMatrixAt(i, item.matrix)
                        instanced.instanceMatrix.needsUpdate = true;
                        instanced.computeBoundingSphere();

                        if (property == "laser_cube" && updateLasers)
                            updateLaserCubeRaycaster(item, GLOBALS.DYMANIC_ITEMS[property][i].body.laser);
                    }
                }
            }
        }
    }

    for (var i = 0; i < GLOBALS.LASER_TRIGGERS.length; i++) {
        if (!GLOBALS.LASER_TRIGGERS[i].emitterState && GLOBALS.LASER_TRIGGERS[i].fromLaserCube)
            laserReceiverTrigger(GLOBALS.LASER_TRIGGERS[i], false);
    }

    for (var i = 0; i < GLOBALS.CAMERAS.length; i++) {
        if (!GLOBALS.CAMERAS[i].fixed) {
            GLOBALS.CAMERAS[i].position.copy(GLOBALS.CAMERAS[i].body.position);
            GLOBALS.CAMERAS[i].quaternion.copy(GLOBALS.CAMERAS[i].body.quaternion);
            GLOBALS.CAMERAS[i].cube.position.copy(GLOBALS.CAMERAS[i].body.position);
            GLOBALS.CAMERAS[i].cube.quaternion.copy(GLOBALS.CAMERAS[i].body.quaternion);
        }
    }

    if (debugColision)
        cannonDebugger.update();

    if (GLOBALS.HOLDING_ITEM) {
        updateLasers = true;
    } else {
        if (updateLasers) {
            updateLasers = false;
            setTimeout(() => {
                updateLasers = true;
            }, 100);
        }
    }
}

function rotateInstanced(instanced, item, i, speed) {
    var dir = new Vector3(); // create once and reuse it
    dir.copy(item.up).applyQuaternion(item.quaternion);

    if (item.userData.reversed)
        speed = -speed;

    if (Math.round(Math.abs(dir.z)) == 1)
        item.rotation.y += speed;
    else if (Math.round(Math.abs(dir.x)) == 1)
        item.rotation.x += speed;
    else if (Math.round(Math.abs(dir.y)) == 1)
        item.rotation.y += speed;

    var dummy = new Object3D();
    dummy.position.copy(item.position);
    dummy.rotation.copy(item.rotation);

    dummy.updateMatrix();
    instanced.setMatrixAt(i, dummy.matrix)
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
}

// This functions moves the joint body to a new postion in space
// and updates the constraint
function moveJoint(position) {
    jointBody.position.copy(position);
    GLOBALS.CURRENT_ITEM.body.quaternion.copy(GLOBALS.PLAYER.quaternion);
    jointConstraint.update();
}

// Add a constraint between the cube and the jointBody
// in the initeraction position
function addJointConstraint(position, constrainedBody) {

    constrainedBody.position.copy(position)
    // Vector that goes from the body to the clicked point
    const vector = new CANNON.Vec3().copy(position).vsub(constrainedBody.position)

    // Apply anti-quaternion to vector to tranform it into the local body coordinate system
    const antiRotation = constrainedBody.quaternion.inverse()
    const pivot = antiRotation.vmult(vector) // pivot is not in local body coordinates

    // Move the cannon click marker body to the click position
    jointBody.position.copy(position)

    // Create a new constraint
    // The pivot for the jointBody is zero
    jointConstraint = new CANNON.PointToPointConstraint(constrainedBody, pivot, jointBody, new CANNON.Vec3(0, 0, 0))

    // Add the constraint to world
    world.addConstraint(jointConstraint);
}

// Remove constraint from world
function removeJointConstraint() {
    world.removeConstraint(jointConstraint)
    jointConstraint = undefined;
    getObject = false;
    jointBody.position.set(10000, 1000, 1000)
}

GLOBALS.CANNON_WORLD = world;

export {
    updatePhysics,
    removeJointConstraint
}