import * as CANNON from 'cannon';
import CannonDebugger from 'cannon-es-debugger';
import {
    GLOBALS
} from './Globals.js';
import * as THREE from 'three';
import $ from 'jquery';

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
world.allowSleep = false;
world.broadphase = new CANNON.NaiveBroadphase();

//PHYSICS INTERACTIONS
var getObject = false;
var recordingPosition = true;
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
jointBody.collisionFilterGroup = 0
jointBody.collisionFilterMask = 0
world.addBody(jointBody)

// Movement plane when dragging
const planeGeometry = new THREE.PlaneGeometry(100, 100)
movementPlane = new THREE.Mesh(planeGeometry, new THREE.MeshBasicMaterial())
movementPlane.visible = false // Hide it..
//GLOBALS.SCENE.add(movementPlane)

const cannonDebugger = new CannonDebugger(GLOBALS.SCENE, world, {
    onInit(body, mesh) {
        mesh.visible = false;
        $("body").on('input', '#debug-input', function () {
            debugColision = this.checked;
            mesh.visible = this.checked;
        })
    }
})

function updatePhysics() {
    if (GLOBALS.HOLDING_ITEM) {
        // Project the mouse onto the movement plane
        var hitPoint = new THREE.Vector3(); // create once an reuse it
        GLOBALS.MAIN_CAMERA.getObjectByName("cubeHolder").getWorldPosition(hitPoint);

        if (!getObject) {
            getObject = true;

            // Move the movement plane on the z-plane of the hit
            moveMovementPlane(hitPoint, GLOBALS.MAIN_CAMERA)

            // Create the constraint between the cube body and the joint body
            addJointConstraint(hitPoint, GLOBALS.CURRENT_ITEM.body)
        }

        // Move the cannon constraint on the contact point
        //if (!GLOBALS.CURRENT_ITEM.body.inArea)
            moveJoint(hitPoint);
    }

    for (const property in GLOBALS.DYMANIC_ITEMS) {

        var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(property);

        if (property == "gel_gun_blue" || property == "gel_gun_orange" || property == "gel_gun_white" ||
            property == "pedestal_button" || property == "button_weight" || property == "button_box" ||
            property == "button_circle" || property == "dispenser" || property == "ramp" ||
            property == "ramp_half" || property == "ramp_half2" || property == "stairs" ||
            property == "light_bridge" | property == "tractor_beam" || property == "laser_emitter" ||
            property == "door" || property == "light" || property == "stripe" || property == "gel_blue" ||
            property == "gel_orange")
            continue;

        for (var i = 0; i < GLOBALS.DYMANIC_ITEMS[property].length; i++) {

            if (GLOBALS.DYMANIC_ITEMS[property][i].length != 0) {

                /*if (i == GLOBALS.CURRENT_ITEM_ID) {
                    if (GLOBALS.CURRENT_INSTANCED.name == property)
                        continue;
                }*/

                var item = new THREE.Object3D();
                item.position.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.position);
                item.quaternion.copy(GLOBALS.DYMANIC_ITEMS[property][i].body.quaternion);

                if (GLOBALS.DYMANIC_ITEMS[property][i].body.arrayPos) {
                    if (recordingPosition && !GLOBALS.DYMANIC_ITEMS[property][i].body.recall) {
                        if (!GLOBALS.DYMANIC_ITEMS[property][i].body.sleeping || GLOBALS.DYMANIC_ITEMS[property][i].body.inTractor) {
                            GLOBALS.DYMANIC_ITEMS[property][i].body.arrayPos.push(item.position.clone())
                            GLOBALS.DYMANIC_ITEMS[property][i].body.arrayRot.push(item.quaternion.clone())
                        }
                    }
                }


                item.updateMatrix();
                instanced.setMatrixAt(i, item.matrix)
                instanced.instanceMatrix.needsUpdate = true;
                instanced.computeBoundingSphere();
            }

        }
    }

    if (recordingPosition) {
        recordingPosition = false;
        setTimeout(() => {
            recordingPosition = true;
        }, 10);
    }

    if (debugColision)
        cannonDebugger.update();
}

// This functions moves the joint body to a new postion in space
// and updates the constraint
function moveJoint(position) {
    jointBody.position.copy(position)
    jointConstraint.update()
}

// This function moves the virtual movement plane for the mouseJoint to move in
function moveMovementPlane(point, camera) {
    // Center at mouse position
    movementPlane.position.copy(point)

    // Make it face toward the camera
    movementPlane.quaternion.copy(camera.quaternion)
}

// Add a constraint between the cube and the jointBody
// in the initeraction position
function addJointConstraint(position, constrainedBody) {
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
    world.addConstraint(jointConstraint)
}

// Remove constraint from world
function removeJointConstraint() {
    world.removeConstraint(jointConstraint)
    jointConstraint = undefined;
    getObject = false;
}

GLOBALS.CANNON_WORLD = world;

export {
    updatePhysics,
    removeJointConstraint
}