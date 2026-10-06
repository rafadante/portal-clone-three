import { traceEffectPath } from '../portal/EffectPath.js';
import { outOfTheTractor } from '../tractorBeam/TractorBeam.js';
import { Object3D, Vector3, Raycaster, BoxGeometry, CylinderGeometry, BufferAttribute, Mesh, Box3, PlaneGeometry, Color } from 'three';
import * as CANNON from 'cannon';
import { threeToCannon, ShapeType } from 'three-to-cannon';
import { GLOBALS } from '../../Globals.js';
import { respawn } from '../events/states.js';
import { getPlaneByName } from '../../Utils.js';
import { updateMaterialRepeat } from '../materials/Materials.js';
import { fizzlerTrigger } from '../test/Colliders.js';

window.glass = [];

function createLightBridges(item, rayItem, object, instanced, update, index) {

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

    if (update) {
        if (rayItem.distance == intersects[0].distance) {
            return;
        } else {
            GLOBALS.ITEMS_ADDED.remove(object.continuous);
            if (object.bodyBridge)
                GLOBALS.CANNON_WORLD.removeBody(object.bodyBridge);
            if (object.bodyLaserField)
                GLOBALS.CANNON_WORLD.removeBody(object.bodyLaserField);
        }

        rayItem.distance = intersects[0].distance;
    }

    var material = GLOBALS.MATERIAL_LIGHT_BRIDGERS;

    GLOBALS.SCENE.remove(obj);

    //CREATE CLONE
    const cloneLaserField = new Object3D();
    cloneLaserField.position.copy(object.position);
    cloneLaserField.rotation.copy(object.rotation);
    cloneLaserField.rotateX(Math.PI);
    cloneLaserField.translateY(-intersects[0].distance);

    cloneLaserField.position.copy(cloneLaserField.position.round());

    if (item == "light_bridge") {
        var geometry = new BoxGeometry(0.9, intersects[0].distance, 0.1);
    } else if (item == "glass") {
        var geometry = new BoxGeometry(2, intersects[0].distance, 0.1);
    } else if (item == "laser_field" || item == "fizzler") {


        if (item == "laser_field") {
            var geometry = new PlaneGeometry(2, intersects[0].distance);
            material = GLOBALS.MATERIAL_LASER_FIELD;
            object.cloneLaserID = object.userData.idInstanced + 10;
        } else if (item == "fizzler") {
            var geometry = new BoxGeometry(2, intersects[0].distance, 0.025);
            material = GLOBALS.MATERIAL_FIZZLER;
            object.cloneFizzlerID = object.userData.idInstanced + 10;
        }

        cloneLaserField.updateMatrix();
        instanced.setMatrixAt(object.userData.idInstanced + 10, cloneLaserField.matrix);
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();

        object.cloneLaserDistance = intersects[0].distance;
        object.cloneLaserField = cloneLaserField;
    } else if (item == "tractor_beam") {
        var geometry = new CylinderGeometry(0.8, 0.8, intersects[0].distance + 0, 32, 1, true);

        // Add custom attributes to geometry (e.g., for height)
        var vertices = geometry.attributes.position.array;
        var heights = new Float32Array(vertices.length / 3);  // Assuming height for each vertex

        for (var i = 0; i < heights.length; i++)
            heights[i] = intersects[0].distance / 5;

        geometry.setAttribute('height', new BufferAttribute(heights, 1));

        if (object.userData.reversed)
            material = GLOBALS.MATERIAL_TRACTOR_BEAM_REVERSE;
        else
            material = GLOBALS.MATERIAL_TRACTOR_BEAM;
    }

    raycaster.name = item;

    raycaster.far = intersects[0].distance + 0.1;

    if (update)
        rayItem = raycaster;
    else
        rayItem.push(raycaster);

    const plane = new Mesh(geometry, material);

    GLOBALS.ITEMS_ADDED.add(plane);

    window.uuuu = plane;

    if (item == "tractor_beam") {
        plane.updateMatrix();
        plane.geometry.applyMatrix4(plane.matrix);
    }

    plane.position.copy(obj.position);
    plane.rotation.copy(obj.rotation);
    plane.translateY(intersects[0].distance / 2);
    plane.distance = intersects[0].distance / 2;
    plane.renderOrder = -1;

    if (item == "laser_field" || item == "fizzler")
        plane.rotateX(Math.PI)

    const result = threeToCannon(plane, {
        type: ShapeType.BOX
    });

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.4; //0.01
    PHYSICS_MATERIAL.restitution = 0; //0.1

    var box = new CANNON.Body({
        shape: result.shape,
        mass: 0,
        material: PHYSICS_MATERIAL
    })
    //GLOBALS.CANNON_BODIES.push(box);
    box.position.copy(plane.position);
    box.quaternion.copy(plane.quaternion);

    object.continuous = plane;
    object.raycaster = raycaster;

    var otherSide = getPlaneByName(cloneLaserField.position.x + "/" + cloneLaserField.position.y + "/" + cloneLaserField.position.z);
    raycaster.distance = intersects[0].distance;

    if (item != "tractor_beam" && item != "light_bridge") {
        //PORTALS CAN NOT SPAWN ON ITEM POSITION
        GLOBALS.PLANE_USER_DATA[otherSide[0].id_instanced].portal = false;
        GLOBALS.PLANE_USER_DATA[otherSide[0].id_instanced].planeColor = 0x808080;
        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(otherSide[0].id_instanced, new Color(0x808080));
        //GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
    }

    if (otherSide.length > 0 && item != "tractor_beam") {
        otherSide[0].continuousEnding = true;
        plane.otherSide = otherSide[0];
    }

    if (item == "glass") {
        if (object.userData.grid) {
            updateMaterialRepeat(
                plane,
                GLOBALS.MATERIAL_GRID,
                intersects[0].distance / 3
            )
        } else {
            plane.material = GLOBALS.MATERIAL_GLASS;
        }

        window.glass.push(plane)
    }

    if (!object.userData.state)
        plane.visible = false;

    if (item == "light_bridge" || item == "glass") {
        box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC | GLOBALS.CGROUP_PLAYER;
        box.name = item;
        object.bodyBridge = box;
        GLOBALS.CANNON_BODIES_CONTINUOUS.push(box);

        if (object.userData.state)
            GLOBALS.CANNON_WORLD.addBody(box);
    } else if (item == "laser_field" || item == "fizzler") {
        box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC | GLOBALS.CGROUP_PLAYER;
        box.collisionResponse = 0;
        object.bodyLaserField = box;
        box.isItem = true;
        GLOBALS.CANNON_BODIES_CONTINUOUS.push(box);

        if (object.userData.state)
            GLOBALS.CANNON_WORLD.addBody(box);

        if (item == "laser_field") {
            box.addEventListener("collide", function (e) {
                if (e.body === GLOBALS.PLAYER) {
                    document.getElementById("death-screen").style.backgroundColor = "rgb(255 0 0)";
                    document.getElementById("death-screen").style.opacity = 1;
                    respawn(e.body);
                }
            });
        } else if (item == "fizzler") {
            box.name = "fizzler";
            fizzlerTrigger(box);
        }
    } else if (item == "tractor_beam") {

        var bb = new Box3(); // for re-use
        bb.setFromObject(plane);
        bb.side = 1;

        plane.inTractor = false;
        plane.item = object;
        plane.dir = dir;

        if (update) {
            GLOBALS.TRACTOR_BEAM[index] = plane;
            GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[index] = bb;
        } else {
            GLOBALS.TRACTOR_BEAM.push(plane);
            GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.push(bb);
        }
    }
}

window.tractorClones = [];

function createLightBridgesFromPortal(portal, rayItem) {
    const bridge = rayItem === GLOBALS.LIGHT_BRIDGE_RAYCASTER || rayItem[0]?.name === 'light_bridge';
    const old = bridge ? GLOBALS.LIGHT_BRIDGE_CLONE : GLOBALS.TRACTOR_BEAM.slice(GLOBALS.TRACTOR_BEAM_LENGTH);
    for (const plane of old || []) {
        if (!plane) continue;
        GLOBALS.ITEMS_ADDED.remove(plane);
        plane.geometry.dispose();
        if (plane.bodyBridge) {
            GLOBALS.CANNON_WORLD.removeBody(plane.bodyBridge);
            const index = GLOBALS.CANNON_BODIES_CONTINUOUS.indexOf(plane.bodyBridge);
            if (index >= 0) GLOBALS.CANNON_BODIES_CONTINUOUS.splice(index, 1);
        } else {
            const index = GLOBALS.TRACTOR_BEAM.indexOf(plane);
            for (const body of GLOBALS.DYNAMIC_OBJECTS || []) {
                if (body.inTractor && body.tractor === index) outOfTheTractor(body, index);
            }
        }
        plane.item.portalClones = [];
        plane.item.clone = null;
    }
    if (bridge) {
        GLOBALS.LIGHT_BRIDGE_CLONE = [];
        GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE = [];
    } else {
        GLOBALS.TRACTOR_BEAM.length = GLOBALS.TRACTOR_BEAM_LENGTH;
        GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.length = GLOBALS.TRACTOR_BEAM_LENGTH;
    }
    GLOBALS.PLANE_LEVEL_INSTANCED.updateWorldMatrix(true, false);
    for (const ray of rayItem) {
        const item = ray.item;
        item.portalClones = [];
        item.clone = null;
        const segments = traceEffectPath({
            origin: ray.ray.origin, direction: ray.ray.direction,
            portals: GLOBALS.PORTALS, shaders: GLOBALS.PORTAL_SHADER,
            obstacles: [GLOBALS.PLANE_LEVEL_INSTANCED, ...(GLOBALS.ANGLED_PANELS || [])],
            acceptPortal: hit => hit.uv && hit.uv.x > .3 && hit.uv.x < .7 &&
                (bridge || (hit.uv.y > .3 && hit.uv.y < .7)),
        });
        const source = item.continuous;
        const first = segments[0];
        source.scale.y = first.length / ray.distance;
        source.position.copy(first.origin).addScaledVector(first.direction, first.length / 2);
        if (bridge && item.bodyBridge) {
            item.bodyBridge.position.copy(source.position);
            item.bodyBridge.shapes[0].halfExtents.y = first.length / 2;
            item.bodyBridge.shapes[0].updateConvexPolyhedronRepresentation();
            item.bodyBridge.updateBoundingRadius();
            item.bodyBridge.aabbNeedsUpdate = true;
        } else if (!bridge) {
            const index = GLOBALS.TRACTOR_BEAM.indexOf(source);
            if (index >= 0) GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[index] = new Box3().setFromObject(source, true);
        }
        for (const segment of segments.slice(1)) {
            // Do not create physical fields outside the chamber when an exit ray misses it.
            if (!segment.hit) continue;
            let geometry;
            if (bridge) geometry = new BoxGeometry(.9, segment.length, .1);
            else {
                geometry = new CylinderGeometry(.9, .9, segment.length, 32, 1, true);
                const heights = new Float32Array(geometry.attributes.position.count).fill(segment.length / 5);
                geometry.setAttribute('height', new BufferAttribute(heights, 1));
            }
            const plane = new Mesh(geometry, source.material);
            plane.position.copy(segment.origin).addScaledVector(segment.direction, segment.length / 2);
            plane.quaternion.copy(source.quaternion).premultiply(segment.rotation);
            plane.visible = source.visible;
            plane.item = item;
            plane.renderOrder = -1;
            GLOBALS.ITEMS_ADDED.add(plane);
            item.portalClones.push(plane);
            item.clone = item.portalClones[0];
            if (bridge) {
                const result = threeToCannon(plane, { type: ShapeType.BOX });
                const material = new CANNON.Material();
                material.friction = .4; material.restitution = 0;
                const body = new CANNON.Body({ shape: result.shape, mass: 0, material });
                body.position.copy(plane.position); body.quaternion.copy(plane.quaternion);
                body.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT;
                body.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC | GLOBALS.CGROUP_PLAYER;
                plane.bodyBridge = body;
                GLOBALS.CANNON_BODIES_CONTINUOUS.push(body);
                if (plane.visible) GLOBALS.CANNON_WORLD.addBody(body);
                GLOBALS.LIGHT_BRIDGE_CLONE.push(plane);
                GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE.push(body);
            } else {
                plane.dir = segment.direction;
                plane.inTractor = false;
                GLOBALS.TRACTOR_BEAM.push(plane);
                GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.push(new Box3().setFromObject(plane, true));
            }
        }
    }
}
function ContinuousTrigger(item, trigger, elem, name) {

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

    var valOffset = 0.8;

    if (name == "glass")
        valOffset = 0.99;

    if (trigger == "Middle Vertical") {
        dummy.rotateY(Math.PI / 2);
    } else if (trigger == "Top") {
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


    if (name != "light") {
        item.raycaster.ray.origin = dummy.position;
        item.continuous.position.copy(dummy.position)
        item.continuous.rotation.copy(dummy.rotation)
        item.continuous.translateY(item.continuous.distance);

        if (name == "light_bridge" || name == "glass") {
            item.bodyBridge.position.copy(item.continuous.position);
            item.bodyBridge.quaternion.copy(dummy.quaternion);
        }

        if (name == "glass") {
            return;
        }
    } else {
        item.positionLight.copy(new Vector3(
            dummy.position.x,
            dummy.position.y,
            dummy.position.z
        ));
        item.rotationLight.set(
            dummy.rotation.x,
            dummy.rotation.y,
            dummy.rotation.z
        );
    }


    dummy.updateMatrix();
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(name);
    instanced.setMatrixAt(item.userData.idInstanced, dummy.matrix);

    if (name == "laser_field" || name == "fizzler") {
        item.bodyLaserField.position.copy(item.continuous.position)
        item.bodyLaserField.quaternion.copy(dummy.quaternion)

        dummy.rotateX(Math.PI);
        dummy.translateY(-item.cloneLaserDistance);

        dummy.updateMatrix();

        if (name == "laser_field")
            instanced.setMatrixAt(item.cloneLaserID, dummy.matrix);
        else if (name == "fizzler")
            instanced.setMatrixAt(item.cloneFizzlerID, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
}

export {
    createLightBridges,
    createLightBridgesFromPortal,
    ContinuousTrigger
};
