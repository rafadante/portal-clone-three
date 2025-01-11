import $ from 'jquery';
import { GLOBALS } from '../../Globals';
import { Box3, Object3D, Vector3 } from 'three';
import { checkToUpdateContinuous } from '../cubeManager/UpdateRaycast';
import * as CANNON from 'cannon';

$("body").on('change', '#piston-max-height', function () {
    managePlatformRange($(this).val(), GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]])
    checkToUpdateContinuous();
});

function managePlatformRange(value, selected) {
    const platform = selected.item.platformBox;
    platform.parent.scale.y = value;
    selected.item.userData.scaleY = value;

    const index = GLOBALS.BOUNDING_BOX.indexOf(platform.bb);
    if (index > -1)
        GLOBALS.BOUNDING_BOX.splice(index, 1);

    var bb = new Box3(); // for re-use
    bb.setFromObject(platform.parent);
    bb.name = selected.itemName;

    platform.bb = bb;
    bb.platform = platform;
    GLOBALS.BOUNDING_BOX.push(bb);
}

$("body").on('change', '#state-piston', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.isActive = this.checked;
});

$("body").on('change', '#state-piston-loop', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.loop = this.checked;
});

function updatePlatformPosition(obj, instanced, i, deltaTime) {
    if (obj.body && obj.userData.isActive && obj.platformBox.parent.scale.y != 0) {

        if (!obj.userData.loop && obj.body.pistonDown) {
            return;
        }

        var offset;

        if (!obj.body.pistonDown)
            offset = 0.7;
        else
            offset = -0.7;

            //console.log(deltaTime)

        var axis = "y";
        var dir = new CANNON.Vec3(0, 1, 0);
        var position;

        if (obj.platformBox.name == "track_platforms") {
            if (obj.platformBox.side == "front" || obj.platformBox.side == "back") {
                axis = 'x';
                dir = new CANNON.Vec3(1, 0, 0);
                position = new Vector3(obj.body.position.x, obj.initialPosition.y, obj.initialPosition.z);
            } else {
                axis = 'z';
                dir = new CANNON.Vec3(0, 0, 1);
                position = new Vector3(obj.initialPosition.x, obj.initialPosition.y, obj.body.position.z);
            }

            if (obj.platformBox.parent.scale.y < 0)
                offset *= -1;
        } else {
            position = obj.body.position;
        }

        obj.body.position[axis] += offset * deltaTime;

        if (obj.platformBox.parent.scale.y > 0) {

            if (obj.body.position[axis] > obj.initialPosition[axis] + (obj.platformBox.parent.scale.y * 2)) {
                obj.body.pistonDown = true;
            } else if (obj.body.position[axis] <= obj.initialPosition[axis])
                obj.body.pistonDown = false;
        } else {

            if (obj.body.position[axis] < obj.initialPosition[axis] + (obj.platformBox.parent.scale.y * 2)) {
                obj.body.pistonDown = true;
            } else if (obj.body.position[axis] >= obj.initialPosition[axis]) {
                obj.body.pistonDown = false;
            }
        }


        var item = new Object3D();
        item.quaternion.copy(obj.body.quaternion);
        item.position.copy(position);

        item.updateMatrix();
        instanced.setMatrixAt(i, item.matrix)
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        //

        obj.body.bodiesInContact.forEach(body => {
            var offset2 = new CANNON.Vec3(offset * dir.x, offset * dir.y, offset * dir.z);
            body.position.vadd(offset2, body.position);
        });
    } else if (obj.body && !obj.userData.isActive && obj.platformBox.parent.scale.y != 0 && obj.body.pistonDown && !obj.userData.loop) {


        var offset = -0.005;

        var axis = "y";
        var dir = new CANNON.Vec3(0, 1, 0);
        var position;

        if (obj.platformBox.name == "track_platforms") {
            if (obj.platformBox.side == "front" || obj.platformBox.side == "back") {
                axis = 'x';
                dir = new CANNON.Vec3(1, 0, 0);
                position = new Vector3(obj.body.position.x, obj.initialPosition.y, obj.initialPosition.z);
            } else {
                axis = 'z';
                dir = new CANNON.Vec3(0, 0, 1);
                position = new Vector3(obj.initialPosition.x, obj.initialPosition.y, obj.body.position.z);
            }

            if (obj.platformBox.parent.scale.y < 0)
                offset *= -1;
        } else {
            position = obj.body.position;
        }

        console.log(offset)

        obj.body.position[axis] += offset;

        if (obj.platformBox.parent.scale.y > 0) {

            if (obj.body.position[axis] > obj.initialPosition[axis] + (obj.platformBox.parent.scale.y * 2)) {
                obj.body.pistonDown = true;
            } else if (obj.body.position[axis] <= obj.initialPosition[axis])
                obj.body.pistonDown = false;
        } else {

            if (obj.body.position[axis] < obj.initialPosition[axis] + (obj.platformBox.parent.scale.y * 2)) {
                obj.body.pistonDown = true;
            } else if (obj.body.position[axis] >= obj.initialPosition[axis]) {
                obj.body.pistonDown = false;
            }
        }


        var item = new Object3D();
        item.quaternion.copy(obj.body.quaternion);
        item.position.copy(position);

        item.updateMatrix();
        instanced.setMatrixAt(i, item.matrix)
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        //

        obj.body.bodiesInContact.forEach(body => {
            var offset2 = new CANNON.Vec3(offset * dir.x, offset * dir.y, offset * dir.z);
            body.position.vadd(offset2, body.position);
        });
    }
}

function resetPlatforms(obj, i, name) {

    const instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);

    var item = new Object3D();
    item.position.copy(obj.initialPosition);
    item.quaternion.copy(obj.quaternion);

    item.updateMatrix();
    instanced.setMatrixAt(i, item.matrix)
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
}

// Keep track of objects colliding with the platform
const collisions = new Map(); // Map platform body -> Set of colliding bodies

// Function to track start of collisions
function handleCollisionStart(event) {
    const { body, target } = event; // 'target' is the body the event is attached to

    if (!collisions.has(target)) {
        collisions.set(target, new Set());
    }

    // Add the colliding body to the set
    collisions.get(target).add(body.id);

    if (!target.bodiesInContact.includes(body)) {
        target.bodiesInContact.push(body);
    }
}

// Function to detect end of collisions
function handleCollisionEnd(platformBody) {
    const activeBodies = collisions.get(platformBody);
    if (!activeBodies) return;

    // Detect which bodies are no longer in contact
    const bodiesStillInContact = new Set();
    GLOBALS.CANNON_WORLD.contacts.forEach(contact => {
        if ((contact.bi === platformBody || contact.bj === platformBody) &&
            (activeBodies.has(contact.bi.id) || activeBodies.has(contact.bj.id))) {
            const otherBodyId = contact.bi === platformBody ? contact.bj.id : contact.bi.id;
            bodiesStillInContact.add(otherBodyId);
        }
    });

    // Find bodies that are no longer in contact
    activeBodies.forEach(bodyId => {
        if (!bodiesStillInContact.has(bodyId)) {
            console.log(`Body ${bodyId} is no longer colliding with the platform`);
            activeBodies.delete(bodyId);

            platformBody.bodiesInContact.forEach(body => {
                if (body.id == bodyId) {
                    const index = platformBody.bodiesInContact.indexOf(body);
                    if (index > -1) { // only splice array when item is found
                        platformBody.bodiesInContact.splice(index, 1); // 2nd parameter means remove one item only
                    }
                }
            });
        }
    });

    // If no more bodies are colliding, remove the entry
    if (activeBodies.size === 0) {
        collisions.delete(platformBody);
    }
}

function addColliderEvent(body) {
    body.bodiesInContact = [];
    GLOBALS.PLATFORM_BODIES.push(body);
    body.addEventListener('collide', handleCollisionStart);
}

function platformPostStep() {
    GLOBALS.PLATFORM_BODIES.forEach(platformBody => handleCollisionEnd(platformBody));
}

export {
    updatePlatformPosition,
    addColliderEvent,
    platformPostStep,
    resetPlatforms,
    managePlatformRange
}