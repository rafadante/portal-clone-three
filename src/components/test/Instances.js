import {
    PlaneGeometry,
    Object3D,
    InstancedMesh
} from 'three';
import {
    GLOBALS
} from '../../Globals.js';
import {
    shuffle,
    groupByPercentage
} from '../../Utils.js';
import {
    colliderRoom
} from './Colliders.js';

var id = 0;

function manageInstances() {

    var meshesWallPortal = [];
    var meshesWallNonPortal = [];
    var meshesFloorPortal = [];
    var meshesFloorNonPortal = [];
    var sideDown = [];
    var sideUp = [];
    var sideFront = [];
    var sideBack = [];
    var sideRight = [];
    var sideLeft = [];

    //SEPARETE MESHS FOR INSTANCING
    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[i].exists) {
            if (GLOBALS.PLANE_USER_DATA[i].name != GLOBALS.ENTER_DOOR.namePosition &&
                GLOBALS.PLANE_USER_DATA[i].name != GLOBALS.EXIT_DOOR.namePosition) {

                GLOBALS.PLANE_USER_DATA[i].checked = false;
                GLOBALS.PLANE_USER_DATA[i].position.checked = false;

                if (GLOBALS.PLANE_USER_DATA[i].side == "front")
                    sideFront.push(GLOBALS.PLANE_USER_DATA[i])
                else if (GLOBALS.PLANE_USER_DATA[i].side == "back")
                    sideBack.push(GLOBALS.PLANE_USER_DATA[i])
                else if (GLOBALS.PLANE_USER_DATA[i].side == "right")
                    sideRight.push(GLOBALS.PLANE_USER_DATA[i])
                else if (GLOBALS.PLANE_USER_DATA[i].side == "left")
                    sideLeft.push(GLOBALS.PLANE_USER_DATA[i])

                if (GLOBALS.PLANE_USER_DATA[i].portal) {
                    if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                        sideUp.push(GLOBALS.PLANE_USER_DATA[i])
                        meshesFloorPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                    } else {
                        meshesWallPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                    }
                } else {
                    if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                        meshesFloorNonPortal.push(GLOBALS.PLANE_USER_DATA[i])
                        sideUp.push(GLOBALS.PLANE_USER_DATA[i])
                    } else {
                        meshesWallNonPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                    }
                }
            }
        }
    }

    colliderRoom(sideDown, "down", "z", "x", "y", "x");
    colliderRoom(sideUp, "up", "z", "x", "y", "x");
    colliderRoom(sideFront, "front", "y", "x", "z", "x");
    colliderRoom(sideBack, "back", "y", "x", "z", "x");
    colliderRoom(sideRight, "right", "y", "z", "x", "z");
    colliderRoom(sideLeft, "left", "y", "z", "x", "z");

    //

    let percentages = [5, 85, 5, 5];
    var arr = shuffle(meshesWallPortal);
    let result = groupByPercentage(arr, percentages);
    createInstances(result[0], GLOBALS.MATERIAL_WALL_PORTAL);
    createInstances(result[1], GLOBALS.MATERIAL_WALL_PORTAL2);
    createInstances(result[2], GLOBALS.MATERIAL_WALL_PORTAL3);
    createInstances(result[3], GLOBALS.MATERIAL_WALL_PORTAL4);
    //
    percentages = [50, 50];
    arr = shuffle(meshesWallNonPortal);
    result = groupByPercentage(arr, percentages);
    createInstances(result[0], GLOBALS.MATERIAL_WALL_NON_PORTAL)
    createInstances(result[1], GLOBALS.MATERIAL_WALL_NON_PORTAL2)
    //
    createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL)
    createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL)
}

function createInstances(meshes, material) {

    if (meshes.length == 0)
        return;

    //material.depthWrite = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = 2;

    const geometry = new PlaneGeometry(2, 2);
    var mesh = new InstancedMesh(geometry.clone(), material, meshes.length);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "Instanced-" + id;
    mesh.frustumCulled = true;
    GLOBALS.SCENE_FPS.add(mesh);
    id++;

    var leftWindowObsRoom = new Object3D();
    leftWindowObsRoom.position.copy(GLOBALS.OBSERVATION_ROOM_IMG.position);
    leftWindowObsRoom.rotation.copy(GLOBALS.OBSERVATION_ROOM_IMG.rotation);
    GLOBALS.SCENE.add(leftWindowObsRoom)
    leftWindowObsRoom.translateX(-2);

    for (var i = 0; i < meshes.length; i++) {

        var dummy = new Object3D();

        if (meshes[i].itemName == "window" || (
            meshes[i].position.x == Math.round(leftWindowObsRoom.position.x) &&
            meshes[i].position.y == Math.round(leftWindowObsRoom.position.y) &&
            meshes[i].position.z == Math.round(leftWindowObsRoom.position.z)
        )) {
            dummy.scale.set(0, 0, 0);
            meshes[i].portal = false;
        }

        if (meshes[i].itemName) {
            if (meshes[i].itemName.includes("observation_room"))
                dummy.scale.set(0, 0, 0);
        }

        dummy.rotation.set(0, 0, 0);
        dummy.position.copy(meshes[i].position);
        dummy.rotation.copy(meshes[i].rotation);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
    }

    GLOBALS.SCENE.remove(leftWindowObsRoom)
}

export {manageInstances}