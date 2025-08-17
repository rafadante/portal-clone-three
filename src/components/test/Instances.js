import { PlaneGeometry, Object3D, InstancedMesh, Matrix4, Color } from 'three';
import { GLOBALS } from '../../Globals.js';
import { shuffle, groupByPercentage } from '../../Utils.js';
import { colliderRoom } from './Colliders.js';
//import { InstancedMesh2 } from '@three.ez/instanced-mesh';

var id = 0;

function manageInstances() {

    //manageBatcheGlass();

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

    var enterDoor = "enterDoor";
    if (GLOBALS.ITEMS_ADDED.getObjectByName("spawn")) {
        enterDoor = ".."
    }

    //SEPARETE MESHS FOR INSTANCING
    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[i].exists) {

            if (GLOBALS.PLANE_USER_DATA[i].item) {
                if (GLOBALS.PLANE_USER_DATA[i].item.userData)
                    GLOBALS.PLANE_USER_DATA[i].item.userData.played = false;
            }

            if (GLOBALS.PLANE_USER_DATA[i].itemName != enterDoor &&
                GLOBALS.PLANE_USER_DATA[i].itemName != "exitDoor" &&
                GLOBALS.PLANE_USER_DATA[i].itemName != "gel") {

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
                else if (GLOBALS.PLANE_USER_DATA[i].side == "down")
                    sideDown.push(GLOBALS.PLANE_USER_DATA[i])
                else if (GLOBALS.PLANE_USER_DATA[i].side == "up")
                    sideUp.push(GLOBALS.PLANE_USER_DATA[i])

                if (GLOBALS.PLANE_USER_DATA[i].portal) {
                    if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                        meshesFloorPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                    } else {
                        meshesWallPortal.push(GLOBALS.PLANE_USER_DATA[i]);
                    }
                } else {
                    if (GLOBALS.PLANE_USER_DATA[i].side == "up" || GLOBALS.PLANE_USER_DATA[i].side == "down") {
                        meshesFloorNonPortal.push(GLOBALS.PLANE_USER_DATA[i])
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


    if(window.oldAperture == "old"){
        let percentages = [100, 0];
        var arr = shuffle(meshesWallPortal);
        let result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_PORTAL, 0);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_PORTAL2, 1);
        //
        percentages = [60, 30, 10];
        arr = shuffle(meshesWallNonPortal);
        result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_NON_PORTAL, 2);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_NON_PORTAL2, 3);
        createInstances(result[2], GLOBALS.MATERIAL_WALL_NON_PORTAL3, 4);
        //
        createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL, 5);
        createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL, 6);
    }else if(window.oldAperture == "1979"){
        let percentages = [100, 0];
        var arr = shuffle(meshesWallPortal);
        let result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_PORTAL, 0);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_PORTAL2, 1);
        //
        percentages = [80,20];
        arr = shuffle(meshesWallNonPortal);
        result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_NON_PORTAL, 2);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_NON_PORTAL2, 3);
        //
        createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL, 4);
        createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL, 5);
    }else{
        let percentages = [5, 85, 5, 5];
        var arr = shuffle(meshesWallPortal);
        let result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_PORTAL, 0);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_PORTAL2, 1);
        createInstances(result[2], GLOBALS.MATERIAL_WALL_PORTAL3, 2);
        createInstances(result[3], GLOBALS.MATERIAL_WALL_PORTAL4, 3);
        //
        percentages = [50, 50];
        arr = shuffle(meshesWallNonPortal);
        result = groupByPercentage(arr, percentages);
        createInstances(result[0], GLOBALS.MATERIAL_WALL_NON_PORTAL, 4);
        createInstances(result[1], GLOBALS.MATERIAL_WALL_NON_PORTAL2, 5);
        //
        createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL, 6);
        createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL, 7);
    }
    
}

window.instances = [];

function createInstances(meshes, material, index) {

    if (meshes.length == 0)
        return;

    //material.visible = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = 2;

    const geometry = new PlaneGeometry(2, 2);
    geometry.computeBoundsTree();
    var mesh = new InstancedMesh(geometry.clone(), material, meshes.length);

    /*var mesh;

    if(first){
        mesh = new InstancedMesh2(geometry.clone(), material);
        window.instances.push(mesh)
    }else{
        mesh = window.instances[index];
    }
    

    console.log(mesh)

    mesh.addInstances(meshes.length, (obj, index) => {
        obj.visible = false;
    });*/

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

        //if(meshes[i].side == "up")
        //    continue

        if (meshes[i].itemName == "window" || (
            meshes[i].position.x == Math.round(leftWindowObsRoom.position.x) &&
            meshes[i].position.y == Math.round(leftWindowObsRoom.position.y) &&
            meshes[i].position.z == Math.round(leftWindowObsRoom.position.z)
        )) {
            dummy.scale.set(0, 0, 0);
            dummy.position.set(100000, 100000, 100000);
            meshes[i].portal = false;
        }

        if (meshes[i].itemName) {
            if (meshes[i].itemName.includes("observation_room")) {
                dummy.scale.set(0, 0, 0);
                dummy.position.set(100000, 100000, 100000);
            }
        }

        dummy.rotation.set(0, 0, 0);
        dummy.position.copy(meshes[i].position);
        dummy.rotation.copy(meshes[i].rotation);
        dummy.updateMatrix();

        mesh.setColorAt(i, new Color(document.getElementById("color-wall-portal").value)); // if instances array is created

        mesh.setMatrixAt(i, dummy.matrix);
        //mesh.setVisibilityAt(i, true);
    }

    GLOBALS.SCENE.remove(leftWindowObsRoom)
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
}

export {
    manageInstances
}