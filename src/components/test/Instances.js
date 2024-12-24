import {
    PlaneGeometry,
    Object3D,
    InstancedMesh,
    Color,
    BatchedMesh,
    Matrix4,
    DynamicDrawUsage
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
import {
    MeshLineGeometry,
    MeshLineMaterial
} from 'meshline';
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

var id = 0;
var first = true;

function manageInstances() {

    manageBatchesLines();
    manageBatcheGlass();

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
    if(GLOBALS.ITEMS_ADDED.getObjectByName("spawn")){
        enterDoor = ".."
    }

    //SEPARETE MESHS FOR INSTANCING
    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[i].exists) {
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

    //

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
    createInstances(result[0], GLOBALS.MATERIAL_WALL_NON_PORTAL, 4)
    createInstances(result[1], GLOBALS.MATERIAL_WALL_NON_PORTAL2, 5)
    //
    createInstances(meshesFloorPortal, GLOBALS.MATERIAL_FLOOR_PORTAL, 6)
    createInstances(meshesFloorNonPortal, GLOBALS.MATERIAL_FLOOR_NON_PORTAL, 7)

    first = false;
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

        mesh.setMatrixAt(i, dummy.matrix);
        //mesh.setVisibilityAt(i, true);
    }

    GLOBALS.SCENE.remove(leftWindowObsRoom)
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
}

//
const material = new MeshLineMaterial({
    color: 0x0077B6,//0xffa500
    side: 2,
    depthTest: true,
    transparent: true
})
material.uniforms.alphaTest.value = 0;
material.uniforms.dashArray.value = 0.01;
material.uniforms.lineWidth.value = 0.1;
material.uniforms.useDash.value = 1;

function manageBatchesLines() {
    /*GLOBALS.BATCHED_BLUE = new BatchedMesh(100000, 100000, 100000, material);
    GLOBALS.BATCHED_BLUE.frustumCulled = false;
    //GLOBALS.SCENE_FPS.add(GLOBALS.BATCHED_BLUE);

    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
        //GLOBALS.CONNECTIONS[i]['line'].visible = false;
        batchedMesh(GLOBALS.BATCHED_BLUE, GLOBALS.CONNECTIONS[i]['line'], true)
    }

    const material2 = material.clone();
    material2.color = new Color(0xffa500);

    GLOBALS.BATCHED_ORANGE = new BatchedMesh(100000, 100000, 100000, material2);
    GLOBALS.BATCHED_ORANGE.frustumCulled = false;
    //GLOBALS.SCENE_FPS.add(GLOBALS.BATCHED_ORANGE);

    for (var i = 0; i < GLOBALS.CONNECTIONS.length; i++) {
        batchedMesh(GLOBALS.BATCHED_ORANGE, GLOBALS.CONNECTIONS[i]['line'], false)
    }*/
}

function batchedMesh(batched, line, visible) {

    line.updateMatrix();
    const geometry = line.geometry.clone()
    geometry.applyMatrix4(line.matrix);

    const matrix = new Matrix4();
    const lineGeometryId = batched.addGeometry(geometry);
    const lineInstancedId = batched.addInstance(lineGeometryId);
    batched.setMatrixAt(lineInstancedId, matrix);
    batched.setVisibleAt(lineInstancedId, visible);
    line.lineInstancedId = lineInstancedId;
}

function manageBatcheGlass() {

    GLOBALS.BATCHED_GLASS = new BatchedMesh(1000, 5000, 10000, GLOBALS.MATERIAL_GLASS.clone());
    GLOBALS.BATCHED_GLASS.frustumCulled = false;
    GLOBALS.SCENE_FPS.add(GLOBALS.BATCHED_GLASS);

    for (var i = 0; i < GLOBALS.GLASS_RAYCASTER.length; i++) {
        if (!GLOBALS.GLASS_RAYCASTER[i].item.userData.grid) {
            GLOBALS.GLASS_RAYCASTER[i].item.continuous.material.visible = false;

            GLOBALS.GLASS_RAYCASTER[i].item.continuous.updateMatrix();
            const geometry = GLOBALS.GLASS_RAYCASTER[i].item.continuous.geometry.clone()
            geometry.applyMatrix4(GLOBALS.GLASS_RAYCASTER[i].item.continuous.matrix);

            const matrix = new Matrix4();
            const lineGeometryId = GLOBALS.BATCHED_GLASS.addGeometry(geometry);
            const lineInstancedId = GLOBALS.BATCHED_GLASS.addInstance(lineGeometryId);
            GLOBALS.BATCHED_GLASS.setMatrixAt(lineInstancedId, matrix);
        }
    }

    GLOBALS.BATCHED_GRID = new BatchedMesh(1000, 5000, 10000, GLOBALS.MATERIAL_GRID.clone());
    GLOBALS.BATCHED_GRID.frustumCulled = false;
    GLOBALS.SCENE_FPS.add(GLOBALS.BATCHED_GRID);

    for (var i = 0; i < GLOBALS.GLASS_RAYCASTER.length; i++) {
        if (GLOBALS.GLASS_RAYCASTER[i].item.userData.grid) {
            GLOBALS.GLASS_RAYCASTER[i].item.continuous.material.visible = false;

            GLOBALS.GLASS_RAYCASTER[i].item.continuous.updateMatrix();
            const geometry = GLOBALS.GLASS_RAYCASTER[i].item.continuous.geometry.clone()
            geometry.applyMatrix4(GLOBALS.GLASS_RAYCASTER[i].item.continuous.matrix);

            const matrix = new Matrix4();
            const lineGeometryId = GLOBALS.BATCHED_GRID.addGeometry(geometry);
            const lineInstancedId = GLOBALS.BATCHED_GRID.addInstance(lineGeometryId);
            GLOBALS.BATCHED_GRID.setMatrixAt(lineInstancedId, matrix);
        }
    }
}

export {
    manageInstances
}