import {
    Object3D,
    Vector3,
    Raycaster,
    CylinderGeometry,
    MeshBasicMaterial,
    Mesh,
    Group,
    Color,
    Quaternion,
    MathUtils,
    Matrix4
} from 'three';
import {
    GLOBALS
} from '../../Globals.js';
import { func } from 'three/examples/jsm/nodes/Nodes.js';
import { animate } from '../../Main.js';
import $ from 'jquery';
import { laserReceiverTrigger } from '../events/events.js';

function laserEmitterRaycast(object, update, rayItem, index) {

    var obj = new Object3D();
    obj.position.copy(object.position);
    obj.rotation.copy(object.rotation);

    var vector = new Vector3();
    var raycaster = new Raycaster();

    vector.copy(obj.position);

    var dir = new Vector3(); // create once and reuse it
    dir.copy(obj.up).applyQuaternion(obj.quaternion);

    raycaster.set(vector, dir);
    raycaster.item = object;
    var intersects = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

    if (intersects.length == 0)
        return;

    if (update) {
        if (rayItem.distance == intersects[0].distance) {
            return;
        } else {
            GLOBALS.SCENE_CHILDREN.remove(object.continuous);
        }

        GLOBALS.LASER_EMITTER_RAYCASTER[index] = raycaster;
    } else {
        rayItem.push(raycaster);
    }

    raycaster.distance = intersects[0].distance;
    raycaster.item = object;

    const geometry = new CylinderGeometry(0.01, 0.01, 1, 8, 1, true);
    const laser = new Mesh(geometry, new MeshBasicMaterial({
        color: new Color(8, 0, 0)
    }));
    laser.translateY(0.5);

    const laserParent = new Group();
    laserParent.position.copy(object.position)
    laserParent.rotation.copy(object.rotation)
    laserParent.scale.y = intersects[0].distance;
    laserParent.add(laser);
    GLOBALS.SCENE_CHILDREN.add(laserParent);

    const laserParentClone = laserParent.clone();
    laserParentClone.visible = false;
    laserParent.clone = laserParentClone;
    GLOBALS.SCENE_CHILDREN.add(laserParentClone);

    object.continuous = laserParent;
    object.raycaster = raycaster;
    raycaster.laser = laserParent;
}

function createLaserFromPortal(portal, rayItem) {

    if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
        return

    for (var i = 0; i < GLOBALS.LASER_EMITTER_PORTAL_CLONES.length; i++)
        GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LASER_EMITTER_PORTAL_CLONES[i]);

    GLOBALS.LASER_EMITTER_PORTAL_CLONES = [];

    for (var g = 0; g < rayItem.length; g++) {

        var intersects = rayItem[g].intersectObjects(GLOBALS.PORTAL_SHADER);

        if (intersects.length > 0) {

            if (intersects[0].object.name == "portal-0")
                portal = 1;
            else
                portal = 0;

            let dir = new Vector3()
            GLOBALS.PORTAL_SHADER[portal].getWorldDirection(dir)

            var raycasterLaserPortal = new Raycaster();
            raycasterLaserPortal.set(GLOBALS.PORTAL_SHADER[portal].position, dir);

            var intersectsInstance = raycasterLaserPortal.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

            const geometry = new CylinderGeometry(0.01, 0.01, 1, 8, 1, true);
            const laser = new Mesh(geometry, new MeshBasicMaterial({
                color: new Color(8, 0, 0)
            }));
            laser.translateY(0.5);

            const laserParent = new Object3D();
            laserParent.position.copy(GLOBALS.PORTAL_SHADER[portal].position)
            laserParent.rotation.copy(GLOBALS.PORTAL_SHADER[portal].rotation)
            laserParent.scale.y = intersectsInstance[0].distance;
            laserParent.add(laser);

            laserParent.translateY((((intersects[0].uv.y) - 0.5) * 1.8));
            laserParent.translateX(-(((intersects[0].uv.x) - 0.5) * 0.9));
            laserParent.rotateX(Math.PI / 2)
            //laserParent.rotation.x += Math.PI/2;

            GLOBALS.SCENE_CHILDREN.add(laserParent);
            GLOBALS.LASER_EMITTER_PORTAL_CLONES.push(laserParent);
        }
    }
}

function addLaserToCube(cube) {
    const geometry = new CylinderGeometry(0.01, 0.01, 1, 8, 1, true);
    const laser = new Mesh(geometry, new MeshBasicMaterial({
        color: new Color(8, 0, 0)
    }));
    laser.translateY(0.5);

    const laserParent = new Object3D();
    laserParent.position.copy(cube.position)
    laserParent.quaternion.copy(cube.quaternion)
    laserParent.add(laser);
    laserParent.visible = false;

    const laserParentClone = laserParent.clone();
    laserParentClone.visible = false;
    laserParent.clone = laserParentClone;
    GLOBALS.SCENE_CHILDREN.add(laserParentClone);

    GLOBALS.SCENE_CHILDREN.add(laserParent);
    cube.laser = laserParent;
}

function updateLaserCubeRaycaster(item, laser) {

    laser.visible = laser.active;
    laser.clone.visible = false;

    if (!laser.active) {
        if (laser.trigger) {
            laserReceiverTrigger(laser.trigger, false);
            laser.trigger = null;
        }
        if (laser.clone.trigger) {
            laserReceiverTrigger(laser.clone.trigger, false);
            laser.clone.trigger = null;
        }
        return;
    }

    let dir = new Vector3();
    item.getWorldDirection(dir);

    var raycasterLaserCube = new Raycaster();
    dir.negate();
    raycasterLaserCube.set(item.position, dir);

    var laserCubeRayIntersects = raycasterLaserCube.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

    laser.position.copy(item.position);
    laser.rotation.copy(item.rotation);
    laser.rotateX(-Math.PI / 2)
    laser.scale.y = laserCubeRayIntersects[0].distance;

    var array = [
        GLOBALS.ITEMS_ADDED.getObjectByName("laser_cube"),
        GLOBALS.ITEMS_ADDED.getObjectByName("cube"),
        GLOBALS.ITEMS_ADDED.getObjectByName("sphere"),
        GLOBALS.ITEMS_ADDED.getObjectByName("cube_2"),
        GLOBALS.ITEMS_ADDED.getObjectByName("laser_receiver"),
    ]

    var laserCubeRayIntersects = raycasterLaserCube.intersectObjects(array);
    var emitterState = false;

    for (var i = 0; i < laserCubeRayIntersects.length; i++) {
        if (laserCubeRayIntersects[i].distance > 0.5) {

            if (laserCubeRayIntersects[i].object.name == "laser_receiver") {
                emitterState = true;
                laser.trigger = GLOBALS.DYMANIC_ITEMS['laser_receiver'][laserCubeRayIntersects[i].instanceId];
                laserReceiverTrigger(GLOBALS.DYMANIC_ITEMS['laser_receiver'][laserCubeRayIntersects[i].instanceId], true);
            }


            if (laserCubeRayIntersects[i].object.name == "laser_cube") {
                const cube = GLOBALS.DYMANIC_ITEMS['laser_cube'][laserCubeRayIntersects[i].instanceId];

                if (!cube.body.laser.active) {
                    cube.body.laser.active = true;
                    var item2 = new Object3D();
                    item2.position.copy(cube.body.position);
                    item2.quaternion.copy(cube.body.quaternion);
                    updateLaserCubeRaycaster(item2, cube.body.laser)
                }
            }

            laser.scale.y = laserCubeRayIntersects[i].distance;
            //break;
            return;
        }
    }

    if (laser.trigger && !emitterState) {
        laserReceiverTrigger(laser.trigger, false);
        laser.trigger = null;
    }

    if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
        return

    var laserCubeRayIntersectsWithPortals = raycasterLaserCube.intersectObjects(GLOBALS.PORTAL_SHADER);
    if (laserCubeRayIntersectsWithPortals.length > 0) {

        var portal, portal2;
        if (laserCubeRayIntersectsWithPortals[0].object.name == "portal-0") {
            portal = 1;
            portal2 = 0
        } else {
            portal = 0;
            portal2 = 1
        }

        laser.clone.position.copy(GLOBALS.PORTAL_SHADER[portal].position)
        //

        const portalARotation = GLOBALS.PORTALS[portal2].mesh.quaternion.clone();
        const portalBRotation = GLOBALS.PORTALS[portal].mesh.quaternion.clone();

        // Compute the difference Quaternion
        const differenceQuaternion = new Quaternion().copy(portalARotation).multiply(portalBRotation.invert());

        // Extract the angle and axis from the difference Quaternion
        var angle = 2 * Math.acos(MathUtils.clamp(differenceQuaternion.w, -1, 1));
        const axis = new Vector3(differenceQuaternion.x, differenceQuaternion.y, differenceQuaternion.z).normalize();

        // Define a reference direction (e.g., positive Y direction)
        const referenceDirection = new Vector3(0, 1, 0);

        // Project the rotation axis onto the reference direction
        const projection = axis.dot(referenceDirection);

        // Determine the sign based on the projection
        const sign = Math.sign(projection);

        angle *= sign;

        if (angle == 0 || Math.abs(angle) == Math.PI) {
            laser.clone.rotation.copy(laser.rotation)
            laser.clone.rotateZ(angle - Math.PI)

            laser.clone.translateZ(-(((laserCubeRayIntersectsWithPortals[0].uv.y) - 0.5) * 1.8));
            laser.clone.translateX(-(((laserCubeRayIntersectsWithPortals[0].uv.x) - 0.5) * 0.9));
        } else if (Math.abs(angle).toFixed(2) == (Math.PI / 2).toFixed(2)) {
            laser.clone.rotation.copy(laser.rotation)
            laser.clone.rotateZ(angle)

            laser.clone.translateZ(-(((laserCubeRayIntersectsWithPortals[0].uv.y) - 0.5) * 1.8));
            laser.clone.translateX(-(((laserCubeRayIntersectsWithPortals[0].uv.x) - 0.5) * 0.9));
        } else {
            //console.log("------------------")
            //console.log(angle)
            //console.log(GLOBALS.PORTALS[portal].mesh.rotation)
            laser.clone.rotation.copy(GLOBALS.PORTALS[portal].mesh.rotation)
            //laser.clone.rotateZ(angle + (Math.PI * 2))

            laser.clone.translateZ(-(((laserCubeRayIntersectsWithPortals[0].uv.y) - 0.5) * 1.8));
            laser.clone.translateX(-(((laserCubeRayIntersectsWithPortals[0].uv.x) - 0.5) * 0.9));
        }





        laser.clone.visible = true;

        //
        var direction = new Vector3(0, 1, 0).applyQuaternion(laser.clone.quaternion);

        var raycasterLaserOtherPortal = new Raycaster();
        raycasterLaserOtherPortal.set(laser.clone.position, direction);

        var intersectsInstanceOtherPortalWall = raycasterLaserOtherPortal.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

        if (intersectsInstanceOtherPortalWall.length > 0) {
            laser.clone.scale.y = intersectsInstanceOtherPortalWall[0].distance;
        }

        var intersectsInstanceOtherPortalObj = raycasterLaserOtherPortal.intersectObjects(array);
        emitterState = false;
        if (intersectsInstanceOtherPortalObj.length > 0) {

            if (intersectsInstanceOtherPortalObj[0].object.name == "laser_receiver") {
                emitterState = true;
                laser.clone.trigger = GLOBALS.DYMANIC_ITEMS['laser_receiver'][intersectsInstanceOtherPortalObj[0].instanceId];
                laserReceiverTrigger(GLOBALS.DYMANIC_ITEMS['laser_receiver'][intersectsInstanceOtherPortalObj[0].instanceId], true);
            }

            if (intersectsInstanceOtherPortalObj[0].object.name == "laser_cube") {
                const cube = GLOBALS.DYMANIC_ITEMS['laser_cube'][intersectsInstanceOtherPortalObj[0].instanceId];
                if (!cube.body.laser.active) {
                    cube.body.laser.active = true;
                    var item = new Object3D();
                    item.position.copy(cube.body.position);
                    item.quaternion.copy(cube.body.quaternion);
                    updateLaserCubeRaycaster(item, cube.body.laser)
                }
            }

            laser.clone.scale.y = intersectsInstanceOtherPortalObj[0].distance;
            laser.clone.visible = true;
        }

        if (laser.clone.trigger && !emitterState) {
            laserReceiverTrigger(laser.clone.trigger, false);
            laser.clone.trigger = null;
        }
    }
}

function updateLaserEmitterRaycaster() {

    if (!GLOBALS.LEVEL_ENTERED)
        return;

    for (var j = 0; j < GLOBALS.DYMANIC_ITEMS['laser_cube'].length; j++) {
        if (GLOBALS.DYMANIC_ITEMS['laser_cube'][j].length != 0) {
            GLOBALS.DYMANIC_ITEMS['laser_cube'][j].body.laser.active = false;
        }
    }

    for (var i = 0; i < GLOBALS.LASER_EMITTER_RAYCASTER.length; i++) {

        GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.visible = false;

        //CHECK FOR WALL INTERSECTION
        var intersectsWall = GLOBALS.LASER_EMITTER_RAYCASTER[i].intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);
        if (intersectsWall.length > 0) {
            GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.scale.y = intersectsWall[0].distance;
        }

        var array = [
            GLOBALS.ITEMS_ADDED.getObjectByName("laser_cube"),
            GLOBALS.ITEMS_ADDED.getObjectByName("cube"),
            GLOBALS.ITEMS_ADDED.getObjectByName("sphere"),
            GLOBALS.ITEMS_ADDED.getObjectByName("cube_2"),
            GLOBALS.ITEMS_ADDED.getObjectByName("laser_receiver"),
        ]

        //CHECK FOR LASER CUBE INTERSECTION
        var intersectsLaserCube = GLOBALS.LASER_EMITTER_RAYCASTER[i].intersectObjects(array);

        var emitterState = false;
        var blocked = false;

        if (intersectsLaserCube.length > 0) {

            if (intersectsLaserCube[0].object.name == "laser_receiver") {
                emitterState = true;
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.trigger = GLOBALS.DYMANIC_ITEMS['laser_receiver'][intersectsLaserCube[0].instanceId];
                laserReceiverTrigger(GLOBALS.DYMANIC_ITEMS['laser_receiver'][intersectsLaserCube[0].instanceId], true);
            }

            if (intersectsLaserCube[0].object.name == "laser_cube") {
                const cube = GLOBALS.DYMANIC_ITEMS['laser_cube'][intersectsLaserCube[0].instanceId];
                cube.body.laser.active = true;
            }

            GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.scale.y = intersectsLaserCube[0].distance;
            blocked = true;
        }

        if (GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.trigger && !emitterState) {
            laserReceiverTrigger(GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.trigger, false);
            GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.trigger = null;
        }

        if (blocked)
            continue

        if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
            return

        //CHECK FOR PORTAL INTERSECTION
        var intersectsWithPortals = GLOBALS.LASER_EMITTER_RAYCASTER[i].intersectObjects(GLOBALS.PORTAL_SHADER);
        if (intersectsWithPortals.length > 0) {
            var portal;
            if (intersectsWithPortals[0].object.name == "portal-0")
                portal = 1;
            else
                portal = 0;

            let dir = new Vector3()
            GLOBALS.PORTAL_SHADER[portal].getWorldDirection(dir)

            var raycasterLaserOtherPortal = new Raycaster();
            raycasterLaserOtherPortal.set(GLOBALS.PORTAL_SHADER[portal].position, dir);

            var intersectsInstanceOtherPortalWall = raycasterLaserOtherPortal.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);
            if (intersectsInstanceOtherPortalWall.length > 0) {
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.scale.y = intersectsInstanceOtherPortalWall[0].distance;
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.position.copy(GLOBALS.PORTAL_SHADER[portal].position)
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.rotation.copy(GLOBALS.PORTAL_SHADER[portal].rotation)
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.translateY((((intersectsWithPortals[0].uv.y) - 0.5) * 1.8));
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.translateX(-(((intersectsWithPortals[0].uv.x) - 0.5) * 0.9));
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.rotateX(Math.PI / 2)
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.visible = true;
            }

            raycasterLaserOtherPortal.set(GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.position, dir);
            var intersectsInstanceOtherPortalObj = raycasterLaserOtherPortal.intersectObjects(array);
            emitterState = false;

            if (intersectsInstanceOtherPortalObj.length > 0) {

                if (intersectsInstanceOtherPortalObj[0].object.name == "laser_receiver") {
                    emitterState = true;
                    GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.trigger = GLOBALS.DYMANIC_ITEMS['laser_receiver'][intersectsInstanceOtherPortalObj[0].instanceId];
                    laserReceiverTrigger(GLOBALS.DYMANIC_ITEMS['laser_receiver'][intersectsInstanceOtherPortalObj[0].instanceId], true);
                }

                if (intersectsInstanceOtherPortalObj[0].object.name == "laser_cube") {
                    const cube = GLOBALS.DYMANIC_ITEMS['laser_cube'][intersectsInstanceOtherPortalObj[0].instanceId];
                    //cube.body.laser.active = true;
                    if (!cube.body.laser.active) {
                        cube.body.laser.active = true;
                        var item = new Object3D();
                        item.position.copy(cube.body.position);
                        item.quaternion.copy(cube.body.quaternion);
                        updateLaserCubeRaycaster(item, cube.body.laser)
                    }
                }

                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.scale.y = intersectsInstanceOtherPortalObj[0].distance;
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.visible = true;
            }

            if (GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.trigger && !emitterState) {
                laserReceiverTrigger(GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.trigger, false);
                GLOBALS.LASER_EMITTER_RAYCASTER[i].laser.clone.trigger = null;
            }
        }
    }
}

$("body").on('click', '.laser_emitter-triggers', function () {
    GLOBALS.LASER_EMITTER_TRIGGER = $(this).data("trigger");
    laserEmitterPosition(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#laser_emitter-trigger"), "laser_emitter")
});

$("body").on('click', '.laser_receiver-triggers', function () {
    GLOBALS.LASER_RECEIVER_TRIGGER = $(this).data("trigger");
    laserEmitterPosition(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item,
        $(this).data("trigger"), $("#laser_receiver-trigger"), "laser_receiver")
});

function laserEmitterPosition(item, trigger, elem, name) {
    item.userData.triggers = trigger;
    elem.data("trigger", trigger)
    elem.find(".title").text(trigger);

    var dummy = new Object3D();
    dummy.position.copy(new Vector3(
        item.position.x,
        item.position.y,
        item.position.z
    ));
    dummy.rotation.set(
        item.rotation.x,
        item.rotation.y,
        item.rotation.z
    );

    var valOffset = 0.6;

    if (trigger == "Top") {
        dummy.translateZ(-valOffset);
    } else if (trigger == "Bottom") {
        dummy.translateZ(valOffset);
    } else if (trigger == "Left") {
        dummy.rotateY(Math.PI / 2);
        dummy.translateZ(-valOffset);
    } else if (trigger == "Right") {
        dummy.rotateY(Math.PI / 2);
        dummy.translateZ(valOffset);
    }

    item.position.copy(dummy.position)
    item.rotation.copy(dummy.rotation)

    dummy.updateMatrix();
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);
    instanced.setMatrixAt(item.userData.idInstanced, dummy.matrix);

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();

    if (name == "laser_receiver") {
        animate();
        return;
    }

    for (var i = 0; i < GLOBALS.LASER_EMITTER_RAYCASTER.length; i++) {
        GLOBALS.LASER_EMITTER_RAYCASTER[i].distance = null;
        laserEmitterRaycast(
            GLOBALS.LASER_EMITTER_RAYCASTER[i].item,
            true,
            GLOBALS.LASER_EMITTER_RAYCASTER[i],
            i);
    }

    animate();
}

export {
    laserEmitterRaycast,
    createLaserFromPortal,
    updateLaserCubeRaycaster,
    addLaserToCube,
    updateLaserEmitterRaycaster,
    laserEmitterPosition
}