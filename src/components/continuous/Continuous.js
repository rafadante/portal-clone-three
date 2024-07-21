import * as THREE from 'three';
import * as CANNON from 'cannon';
import {
    threeToCannon,
    ShapeType
} from 'three-to-cannon';
import {
    GLOBALS
} from '../../Globals.js';
import { respawn } from '../events/events.js';

function createLightBridges(item, rayItem, object, instanced) {


    var obj = new THREE.Object3D();
    obj.position.copy(object.position);
    obj.rotation.copy(object.rotation);

    var vector = new THREE.Vector3();
    var raycaster = new THREE.Raycaster();

    vector.copy(obj.position);

    var dir = new THREE.Vector3(); // create once and reuse it

    dir.copy(obj.up).applyQuaternion(obj.quaternion);

    console.log(dir);

    raycaster.set(vector, dir);
    raycaster.item = object;
    var intersects = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

    var material = GLOBALS.MATERIAL_LIGHT_BRIDGERS;

    GLOBALS.SCENE.remove(obj)

    if (item == "light_bridge") {
        var geometry = new THREE.BoxGeometry(0.9, intersects[0].distance, 0.025);
        raycaster.name = "light_bridge";
        rayItem.push(raycaster);
    } else if (item == "laser_field") {
        var geometry = new THREE.BoxGeometry(2, intersects[0].distance, 0.025);
        raycaster.name = "light_bridge";
        rayItem.push(raycaster);
        material = GLOBALS.MATERIAL_LASER_FIELD;

        //CREATE CLONE
        const cloneLaserField = new THREE.Object3D();
        cloneLaserField.position.copy(object.position);
        cloneLaserField.rotation.copy(object.rotation);
        cloneLaserField.rotateX(Math.PI);
        cloneLaserField.translateY(-intersects[0].distance);

        cloneLaserField.updateMatrix();
        instanced.setMatrixAt(object.idInstanced + 10, cloneLaserField.matrix);
        instanced.instanceMatrix.needsUpdate = true;
        instanced.computeBoundingSphere();
        object.cloneLaserID = object.idInstanced + 10;
        object.cloneLaserDistance = intersects[0].distance;
    } else if (item == "tractor_beam") {
        var geometry = new THREE.CylinderGeometry(0.9, 0.9, intersects[0].distance + 0, 32, 1, true);
        raycaster.name = "tractor_beam";
        rayItem.push(raycaster);
        raycaster.beam = "blue";

        if (object.beam == "orange") {
            material = null; //materialBridgeOrange
            raycaster.beam = "orange";
        } else {
            material = GLOBALS.MATERIAL_TRACTOR_BEAM;
        }
    } else if (item == "laser_emitter") {
        var geometry = new THREE.CylinderGeometry(0.02, 0.02, intersects[0].distance, 32);
        raycaster.name = "laser_emitter";
        rayItem.push(raycaster);

        material = new THREE.MeshBasicMaterial({
            color: new THREE.Color(1, 0.15, 0)
        })
    }

    console.log(intersects[0].distance)

    const plane = new THREE.Mesh(geometry, material);
    GLOBALS.SCENE_CHILDREN.add(plane);

    if (item == "tractor_beam" || item == "laser_emitter") {
        //plane.rotation.x = Math.PI / 2;
        plane.updateMatrix();
        plane.geometry.applyMatrix4(plane.matrix);
    }

    plane.position.copy(obj.position);
    plane.rotation.copy(obj.rotation);
    plane.translateY(intersects[0].distance / 2);
    plane.distance = intersects[0].distance / 2;

    if (item == "laser_emitter") {
        plane.translateY(-0.6)
    }

    if (item == "laser_field") {
        plane.rotateX(Math.PI)
    }

    const result = threeToCannon(plane, {
        type: ShapeType.BOX
    });

    let PHYSICS_MATERIAL = new CANNON.Material();
    PHYSICS_MATERIAL.friction = 0.4; //0.01
    PHYSICS_MATERIAL.restitution = 0; //0.1

    var box = new CANNON.Body({
        shape: result.shape,
    })

    box.position.copy(plane.position);
    box.quaternion.copy(plane.quaternion);

    object.continuous = plane;
    object.raycaster = raycaster;

    if (item == "light_bridge") {
        box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
        /*box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
            box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC*/
        object.bodyBridge = box;
        GLOBALS.CANNON_WORLD.addBody(box);
    } else if (item == "laser_field") {
        box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
        box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
        box.collisionResponse = 0;
        object.bodyLaserField = box;
        GLOBALS.CANNON_WORLD.addBody(box);
        box.addEventListener("collide", function (e) {
            console.log(e);
            if (e.body === GLOBALS.PLAYER) {
                console.log('The sphere entered the trigger!', e);
                document.getElementById("death-screen").style.backgroundColor = "rgb(255 0 0)";
                document.getElementById("death-screen").style.opacity = 1;
                respawn(e.body);
            }
        });
    } else if (item == "tractor_beam") {
        var bb = new THREE.Box3(); // for re-use
        bb.setFromObject(plane);
        bb.side = 1;

        if (object.beam == "orange")
            bb.side = -1;

        plane.inTractor = false;
        plane.item = object;
        plane.dir = dir;
        GLOBALS.TRACTOR_BEAM.push(plane);
        GLOBALS.TRACTOR_BEAM_BOUNDING_BOX.push(bb);
    } else if (item == "laser_emitter") {

        //var clone = plane.clone();
        //plane.scale.set(10,10,10);

        //var bb = new THREE.Box3(); // for re-use
        //bb.setFromObject(plane);

        //plane.inTractor = false;
        GLOBALS.LASER_EMITTER.push(plane);
        //obj.position.copy(plane.position);
        //obj.rotation.copy(plane.rotation);

        obj.position.y = plane.position.y;
        obj.distance = intersects[0].distance;
        GLOBALS.LASER_EMITTER_OBJ.push(obj);
    }
}

function createLightBridgesFromPortal(portal, rayItem) {

    console.log(rayItem)

    if (GLOBALS.PORTALS[0] === null || GLOBALS.PORTALS[1] === null)
        return

    for (var g = 0; g < rayItem.length; g++) {

        var intersects = rayItem[g].intersectObjects(GLOBALS.PORTAL_SHADER);

        if (intersects.length > 0) {

            console.log("11111111111111111111")

            if (intersects[0].object.name == "portal-0")
                portal = 1;
            else
                portal = 0;

            if (rayItem[g].name == "light_bridge") {
                if (GLOBALS.LIGHT_BRIDGE_CLONE[g]) {
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
                    GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);
                    GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;
                }
            } else if (rayItem[g].name == "tractor_beam") {
                if (GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]) {
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]);
                    GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = null;
                }
            } else if (rayItem[g].name == "laser_emitter") {
                if (GLOBALS.LASER_EMITTER[GLOBALS.LASER_EMITTER_LENGTH + g]) {
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LASER_EMITTER[GLOBALS.LASER_EMITTER_LENGTH + g]);
                    GLOBALS.LASER_EMITTER_BOUNDING_BOX[GLOBALS.LASER_EMITTER_LENGTH + g] = null;
                }
            }

            let dir = new THREE.Vector3()
            GLOBALS.PORTAL_SHADER[portal].getWorldDirection(dir)

            var raycasterBridge = new THREE.Raycaster();
            raycasterBridge.set(GLOBALS.PORTAL_SHADER[portal].position, dir);

            var intersectsInstance = raycasterBridge.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

            /*if (intersects.length > 0) {
                if (intersects[0].uv.x > 0.3 && intersects[0].uv.x < 0.7) {
                    if (rayItem[g].name == "light_bridge") {
                        if (GLOBALS.LIGHT_BRIDGE_CLONE[g]) {
                            GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
                            GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);
                            GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;

                            console.log("wwwwwwwwwwwwwwwwwwww")
                        }
                    } else if (rayItem[g].name == "tractor_beam") {
                        if (GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]) {
                            GLOBALS.SCENE_CHILDREN.remove(GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]);
                            GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = null;
                        }
                    } else if (rayItem[g].name == "laser_emitter") {
                        if (GLOBALS.LASER_EMITTER[GLOBALS.LASER_EMITTER_LENGTH + g]) {
                            GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LASER_EMITTER[GLOBALS.LASER_EMITTER_LENGTH + g]);
                            GLOBALS.LASER_EMITTER_BOUNDING_BOX[GLOBALS.LASER_EMITTER_LENGTH + g] = null;
                        }
                    }
                } else {
                    console.log("2222222222222222")
                    continue;
                    
                }
            }*/

            console.log("333333333333333")

            //---------------------------------------------------------------------

            var material = GLOBALS.MATERIAL_LIGHT_BRIDGERS;

            if (rayItem[g].name == "light_bridge") {
                var geometry = new THREE.BoxGeometry(0.9, 0.025, intersectsInstance[0].distance);
            } else if (rayItem[g].name == "tractor_beam") {
                var geometry = new THREE.CylinderGeometry(0.9, 0.9, intersectsInstance[0].distance + 0, 32, 1, true);

                if (rayItem[g].beam == "orange")
                    material = null; //materialBridgeOrange
                else {
                    material = GLOBALS.MATERIAL_TRACTOR_BEAM;
                }
            } else if (rayItem[g].name == "laser_emitter") {
                var geometry = new THREE.CylinderGeometry(0.02, 0.02, intersectsInstance[0].distance, 32);

                material = new THREE.MeshBasicMaterial({
                    color: new THREE.Color(1, 0.15, 0)
                })
            }


            const plane = new THREE.Mesh(geometry, material);
            GLOBALS.SCENE_CHILDREN.add(plane);

            if (rayItem[g].name == "tractor_beam" || rayItem[g].name == "laser_emitter") {
                plane.rotation.x = Math.PI / 2;
                plane.updateMatrix();
                plane.geometry.applyMatrix4(plane.matrix);
            }

            plane.position.copy(GLOBALS.PORTAL_SHADER[portal].position);
            plane.rotation.copy(GLOBALS.PORTAL_SHADER[portal].rotation);

            var vertical = false;

            if (rayItem[g].name == "light_bridge") {

                var dummy = new THREE.Object3D();
                dummy.rotation.copy(plane.rotation);
                dummy.position.copy(plane.position);

                if (rayItem[g].item.triggers == "Middle Vertical") {
                    dummy.rotateZ(Math.PI / 2);
                    vertical = true;
                } else if (rayItem[g].item.triggers == "Left") {
                    dummy.rotateZ(Math.PI / 2);
                    vertical = true;
                } else if (rayItem[g].item.triggers == "Right") {
                    dummy.rotateZ(Math.PI / 2);
                    vertical = true;
                }

                plane.rotation.copy(dummy.rotation);
            }

            plane.translateZ(intersectsInstance[0].distance / 2);

            if (vertical) {
                plane.translateX((((intersects[0].uv.y) - 0.5) * 2));
                plane.translateY((((intersects[0].uv.x) - 0.5) * 1));
            } else {
                plane.translateY((((intersects[0].uv.y) - 0.5) * 2));
                plane.translateX(-(((intersects[0].uv.x) - 0.5) * 1));
            }


            const result = threeToCannon(plane, {
                type: ShapeType.BOX
            });

            if (rayItem[g].name == "laser_emitter") {
                plane.translateY(0.6)
            }

            let PHYSICS_MATERIAL = new CANNON.Material();
            PHYSICS_MATERIAL.friction = 0.4; //0.01
            PHYSICS_MATERIAL.restitution = 0; //0.1

            var box = new CANNON.Body({
                shape: result.shape,
                mass: 0,
                material: PHYSICS_MATERIAL
            })

            box.position.copy(plane.position);
            box.quaternion.copy(plane.quaternion);

            //obj.continuous = plane;

            plane.visible = rayItem[g].item.continuous.visible;
            plane.material = rayItem[g].item.continuous.material;
            plane.item = rayItem[g].item;

            console.log(plane.id)

            rayItem[g].item.clone = plane;

            if (rayItem[g].name == "light_bridge") {
                box.collisionFilterGroup = GLOBALS.CGROUP_ENVIRONMENT
                box.collisionFilterMask = GLOBALS.CGROUP_DYNAMIC;
                GLOBALS.CANNON_WORLD.addBody(box);

                GLOBALS.LIGHT_BRIDGE_CLONE[g] = plane;
                GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g] = box;

                rayItem[g].item.clone.bodyBridge = box;
            } else if (rayItem[g].name == "tractor_beam") {

                var bb = new THREE.Box3(); // for re-use
                bb.setFromObject(plane);
                bb.side = 1;

                if (rayItem[g].beam == "orange")
                    bb.side = -1;

                rayItem[g].opened = true;
                plane.inTractor = false;
                plane.dir = dir;



                //setTimeout(() => {
                GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g] = plane;
                GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = bb;
                console.log(GLOBALS.TRACTOR_BEAM)
                //}, 300);


            } else if (rayItem[g].name == "laser_emitter") {

                var obj = new THREE.Object3D();
                obj.position.copy(GLOBALS.PORTAL_SHADER[portal].position);
                obj.rotation.copy(GLOBALS.PORTAL_SHADER[portal].rotation);

                //var clone = plane.clone();
                //plane.scale.set(10,10,10);

                //var bb = new THREE.Box3(); // for re-use
                //bb.setFromObject(plane);

                //plane.inTractor = false;
                GLOBALS.LASER_EMITTER.push(plane);
                //obj.position.copy(plane.position);
                //obj.rotation.copy(plane.rotation);

                obj.position.y = plane.position.y;
                obj.distance = intersects[0].distance;
                GLOBALS.LASER_EMITTER_OBJ.push(obj);
            }
        } else {

            if (rayItem[g].name == "light_bridge") {
                if (GLOBALS.LIGHT_BRIDGE_CLONE[g]) {
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LIGHT_BRIDGE_CLONE[g]);
                    GLOBALS.CANNON_WORLD.removeBody(GLOBALS.LIGHT_BRIDGE_COLLIDER_CLONE[g]);

                    GLOBALS.LIGHT_BRIDGE_CLONE[g].item.clone = null;

                    console.log("jjjjjjjjjjjjjjjjjjj")
                }
            } else if (rayItem[g].name == "tractor_beam") {
                if (GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]) {
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.TRACTOR_BEAM[GLOBALS.TRACTOR_BEAM_LENGTH + g]);
                    GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[GLOBALS.TRACTOR_BEAM_LENGTH + g] = null;
                }
            } else if (rayItem[g].name == "laser_emitter") {
                if (GLOBALS.LASER_EMITTER[GLOBALS.LASER_EMITTER_LENGTH + g]) {
                    GLOBALS.SCENE_CHILDREN.remove(GLOBALS.LASER_EMITTER[GLOBALS.LASER_EMITTER_LENGTH + g]);
                    GLOBALS.LASER_EMITTER_BOUNDING_BOX[GLOBALS.LASER_EMITTER_LENGTH + g] = null;
                }
            }
        }
    }
}

export {
    createLightBridges,
    createLightBridgesFromPortal
};