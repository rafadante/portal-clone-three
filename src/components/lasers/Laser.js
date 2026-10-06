import { traceEffectPath } from '../portal/EffectPath.js';
import { Object3D, Vector3, Raycaster, CylinderGeometry, MeshBasicMaterial, Mesh, Group, Color } from 'three';
import { GLOBALS } from '../../Globals.js';
//import { animate } from '../../Main.js';
import $ from 'jquery';
import { laserReceiverTrigger } from '../events/events.js';

var red = 1;

if (localStorage.getItem("quality-select") == "epic") {
    red = 10;
}

GLOBALS.SCENE_CHILDREN.add(GLOBALS.LASERS)

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
            GLOBALS.LASERS.remove(object.continuous);
            for (const clone of object.continuous.portalSegments || [object.continuous.clone]) clone.removeFromParent();
        }

        GLOBALS.LASER_EMITTER_RAYCASTER[index] = raycaster;
    } else {
        rayItem.push(raycaster);
    }

    raycaster.distance = intersects[0].distance;
    raycaster.item = object;

    const geometry = new CylinderGeometry(0.01, 0.01, 1, 8, 1, true);
    const laser = new Mesh(geometry, new MeshBasicMaterial({
        color: new Color(red, 0, 0)
    }));
    laser.translateY(0.5);

    const laserParent = new Group();
    laserParent.position.copy(object.position)
    laserParent.rotation.copy(object.rotation)
    laserParent.scale.y = intersects[0].distance;
    laserParent.add(laser);
    GLOBALS.LASERS.add(laserParent);

    const laserParentClone = laserParent.clone();
    laserParentClone.visible = false;
    laserParent.clone = laserParentClone;
    GLOBALS.LASERS.add(laserParentClone);

    object.continuous = laserParent;
    object.raycaster = raycaster;
    raycaster.laser = laserParent;

    laserParent.visible = object.userData.state;

    //console.log(object)
}

function addLaserToCube(cube) {
    const geometry = new CylinderGeometry(0.01, 0.01, 1, 8, 1, true);
    const laser = new Mesh(geometry, new MeshBasicMaterial({
        color: new Color(red, 0, 0)
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
    GLOBALS.SCENE_FPS.add(laserParentClone);

    GLOBALS.SCENE_FPS.add(laserParent);
    cube.laser = laserParent;
}

function laserObjects() {
    return ['laser_cube', 'cube', 'sphere', 'cube_2', 'scale_cube', 'laser_receiver', 'laser_relay', 'bomb_cube']
        .map(name => GLOBALS.ITEMS_ADDED.getObjectByName(name)).filter(Boolean);
}

function updateLaserPath(laser, origin, direction, fromCube) {
    const objects = laserObjects();
    const segments = traceEffectPath({
        origin, direction, portals: GLOBALS.PORTALS, shaders: GLOBALS.PORTAL_SHADER,
        obstacles: [GLOBALS.PLANE_LEVEL_INSTANCED, ...(GLOBALS.ANGLED_PANELS || []),
            ...objects.filter(object => object.name !== 'laser_relay')],
        firstNear: fromCube ? .51 : .001,
    });
    const clones = laser.portalSegments || (laser.portalSegments = [laser.clone]);
    for (const clone of clones) clone.visible = false;
    segments.forEach((segment, index) => {
        let visual = laser;
        if (index > 0) {
            if (!clones[index - 1]) {
                const clone = new Group();
                clone.add(laser.children[0].clone());
                laser.parent.add(clone);
                clones[index - 1] = clone;
            }
            visual = clones[index - 1];
        }
        visual.visible = true;
        visual.position.copy(segment.origin);
        visual.quaternion.setFromUnitVectors(new Vector3(0,1,0), segment.direction);
        visual.scale.y = segment.length;
        const hits = segment.ray.intersectObjects(objects).filter(hit => hit.distance <= segment.length + .001);
        for (const hit of hits) {
            const item = GLOBALS.DYMANIC_ITEMS[hit.object.name]?.[hit.instanceId];
            if (!item) continue;
            if (hit.object.name === 'laser_receiver' || hit.object.name === 'laser_relay') {
                item.emitterState = true;
                item.fromLaserCube = fromCube;
                laserReceiverTrigger(item, true, false);
            } else if (hit.object.name === 'laser_cube' && !item.body.laser.active) {
                item.body.laser.active = true;
                const source = new Object3D();
                source.position.copy(item.body.position);
                source.quaternion.copy(item.body.quaternion);
                updateLaserCubeRaycaster(source, item.body.laser);
            }
        }
    });
}

function updateLaserCubeRaycaster(item, laser) {
    if (!GLOBALS.LEVEL_ENTERED) return;
    laser.visible = !!laser.active;
    for (const clone of laser.portalSegments || [laser.clone]) clone.visible = false;
    if (!laser.active) return;
    const direction = new Vector3(0,0,-1).applyQuaternion(item.quaternion);
    updateLaserPath(laser, item.position, direction, true);
}

function updateLaserEmitterRaycaster() {
    if (!GLOBALS.LEVEL_ENTERED) return;
    for (const cube of GLOBALS.DYMANIC_ITEMS['laser_cube']) {
        if (cube.body?.laser) cube.body.laser.active = false;
    }
    for (const trigger of GLOBALS.LASER_TRIGGERS) {
        trigger.emitterState = false;
        trigger.fromLaserCube = false;
    }
    for (const ray of GLOBALS.LASER_EMITTER_RAYCASTER) {
        for (const clone of ray.laser.portalSegments || [ray.laser.clone]) clone.visible = false;
        if (ray.laser.visible) updateLaserPath(ray.laser, ray.ray.origin, ray.ray.direction, false);
    }
    for (const trigger of GLOBALS.LASER_TRIGGERS) {
        if (!trigger.emitterState) laserReceiverTrigger(trigger, false, false);
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
        item.initialPosition.x,
        item.initialPosition.y,
        item.initialPosition.z
    ));
    dummy.rotation.set(
        item.initialRotation.x,
        item.initialRotation.y,
        item.initialRotation.z
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
    } else if (trigger == "BottomLeft") {
        dummy.translateZ(valOffset);
        dummy.translateX(valOffset);
    } else if (trigger == "BottomRight") {
        dummy.translateZ(valOffset);
        dummy.translateX(-valOffset);
    } else if (trigger == "TopLeft") {
        dummy.translateZ(-valOffset);
        dummy.translateX(valOffset);
    } else if (trigger == "TopRight") {
        dummy.translateZ(-valOffset);
        dummy.translateX(-valOffset);
    }

    item.position.copy(dummy.position)
    item.rotation.copy(dummy.rotation)

    dummy.updateMatrix();
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);
    instanced.setMatrixAt(item.userData.idInstanced, dummy.matrix);

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();

    if (name == "laser_receiver") {
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
}

$("body").on('input', '#laser_emitter-state-input', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.state = this.checked;

    //GLOBALS.LASERS.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.clone);
    //        GLOBALS.LASERS.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous);

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.continuous.visible = this.checked;

    console.log(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item)
});

export {
    laserEmitterRaycast,
    updateLaserCubeRaycaster,
    addLaserToCube,
    updateLaserEmitterRaycaster,
    laserEmitterPosition
}
