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
        var geometry = new BoxGeometry(0.9, intersects[0].distance, 0.025);
    } else if (item == "glass") {
        var geometry = new BoxGeometry(2, intersects[0].distance, 0.025);
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
        box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
        box.name = item;
        object.bodyBridge = box;
        GLOBALS.CANNON_BODIES.push(box);
        GLOBALS.CANNON_WORLD.addBody(box);
    } else if (item == "laser_field" || item == "fizzler") {
        box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
        box.collisionResponse = 0;
        object.bodyLaserField = box;
        box.isItem = true;
        GLOBALS.CANNON_BODIES.push(box);
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

        console.log(GLOBALS.TRACTOR_BEAM)
        console.log(GLOBALS.TRACTOR_BEAM_BOUNDING_BOX)
    }
}

function createLightBridgesFromPortal(portal, rayItem) {

    if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
        return

    for (var g = 0; g < rayItem.length; g++) {

        var intersects = rayItem[g].intersectObjects(GLOBALS.PORTAL_SHADER);

        if (intersects.length > 0) {

            if (intersects[0].object.name == "portal-0")
                portal = 1;
            else
                portal = 0;

            if (rayItem[g].name == "light_bridge") {
                if (GLOBALS.LIGHT_BRIDGE_CLONE[g]) {
                    GLOBALS.ITEMS_ADDED.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
                    GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);
                    GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;
                }
            } else if (rayItem[g].name == "tractor_beam") {
                if (GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]) {
                    GLOBALS.ITEMS_ADDED.remove(GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]);
                    GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = null;
                }
            }

            let dir = new Vector3()
            GLOBALS.PORTAL_SHADER[portal].getWorldDirection(dir)

            var raycasterBridge = new Raycaster();
            raycasterBridge.set(GLOBALS.PORTAL_SHADER[portal].position, dir);

            var intersectsInstance = raycasterBridge.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

            if (intersects.length > 0) {
                if (rayItem[g].name == "light_bridge") {
                    if (intersects[0].uv.x > 0.3 && intersects[0].uv.x < 0.7) {
                        if (GLOBALS.LIGHT_BRIDGE_CLONE[g]) {
                            GLOBALS.ITEMS_ADDED.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
                            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);
                            GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;
                        }
                    } else {
                        return;
                    }
                } else if (rayItem[g].name == "tractor_beam") {
                    if (intersects[0].uv.x > 0.3 && intersects[0].uv.x < 0.7 &&
                        intersects[0].uv.y > 0.3 && intersects[0].uv.y < 0.7
                    ) {
                        if (GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]) {
                            GLOBALS.ITEMS_ADDED.remove(GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]);
                            GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = null;
                        }
                    } else {
                        return;
                    }
                }
            }

            var material = GLOBALS.MATERIAL_LIGHT_BRIDGERS;

            if (rayItem[g].name == "light_bridge") {
                var geometry = new BoxGeometry(0.9, 0.025, intersectsInstance[0].distance);
            } else if (rayItem[g].name == "tractor_beam") {
                var geometry = new CylinderGeometry(0.9, 0.9, intersectsInstance[0].distance + 0, 32, 1, true);

                // Add custom attributes to geometry (e.g., for height)
                var vertices = geometry.attributes.position.array;
                var heights = new Float32Array(vertices.length / 3);  // Assuming height for each vertex

                for (var i = 0; i < heights.length; i++) {
                    heights[i] = intersectsInstance[0].distance / 5;
                }

                geometry.setAttribute('height', new BufferAttribute(heights, 1));
                material = GLOBALS.MATERIAL_TRACTOR_BEAM;
            }

            const plane = new Mesh(geometry, material);
            GLOBALS.SCENE_FPS.add(plane);

            if (rayItem[g].name == "tractor_beam") {
                plane.rotation.x = Math.PI / 2;
                plane.updateMatrix();
                plane.geometry.applyMatrix4(plane.matrix);
            }

            plane.position.copy(GLOBALS.PORTAL_SHADER[portal].position);
            plane.rotation.copy(GLOBALS.PORTAL_SHADER[portal].rotation);

            var vertical = false;

            if (rayItem[g].name == "light_bridge") {

                var dummy = new Object3D();
                dummy.rotation.copy(plane.rotation);
                dummy.position.copy(plane.position);

                if (rayItem[g].item.userData.triggers == "Middle Vertical") {
                    dummy.rotateZ(Math.PI / 2);
                    vertical = true;
                } else if (rayItem[g].item.userData.triggers == "Left") {
                    dummy.rotateZ(Math.PI / 2);
                    vertical = true;
                } else if (rayItem[g].item.userData.triggers == "Right") {
                    dummy.rotateZ(Math.PI / 2);
                    vertical = true;
                }

                plane.rotation.copy(dummy.rotation);
            }

            plane.translateZ(intersectsInstance[0].distance / 2);

            if (vertical) {
                plane.translateX((((intersects[0].uv.y) - 0.5) * 1.8));
                plane.translateY((((intersects[0].uv.x) - 0.5) * 0.9));
            } else {
                plane.translateY((((intersects[0].uv.y) - 0.5) * 1.8));
                plane.translateX(-(((intersects[0].uv.x) - 0.5) * 0.9));
            }

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

            plane.visible = rayItem[g].item.continuous.visible;
            plane.material = rayItem[g].item.continuous.material;
            plane.item = rayItem[g].item;

            rayItem[g].item.clone = plane;

            GLOBALS.PORTALS[portal].field = plane;

            if (rayItem[g].name == "light_bridge") {
                box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
                box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
                GLOBALS.CANNON_BODIES.push(box);
                GLOBALS.CANNON_WORLD.addBody(box);

                GLOBALS.LIGHT_BRIDGE_CLONE[g] = plane;
                GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g] = box;

                rayItem[g].item.clone.bodyBridge = box;

                GLOBALS.PORTALS[portal].fieldBody = box;
                GLOBALS.PORTALS[portal].fieldBodyClone = rayItem[g].item.clone;
            } else if (rayItem[g].name == "tractor_beam") {

                var bb = new Box3(); // for re-use
                bb.setFromObject(plane);
                bb.side = 1;

                plane.inTractor = false;
                plane.dir = dir;

                GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g] = plane;
                GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = bb;
                GLOBALS.PORTALS[portal].fieldTrigger = bb;
            }
        } else {
            if (rayItem[g].name == "light_bridge") {
                if (GLOBALS.LIGHT_BRIDGE_CLONE[g]) {
                    GLOBALS.ITEMS_ADDED.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
                    GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);

                    GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;
                }
            } else if (rayItem[g].name == "tractor_beam") {
                if (GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]) {
                    GLOBALS.ITEMS_ADDED.remove(GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]);
                    GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = null;
                }
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