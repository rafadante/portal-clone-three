import {
    PlaneGeometry,
    Object3D,
    InstancedMesh,
    Color,
    BatchedMesh,
    Matrix4,
    Texture,
    ShaderMaterial,
    Mesh,
    Box3,
    Vector3,
    ClampToEdgeWrapping,
    Euler
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
import { func } from 'three/examples/jsm/nodes/Nodes.js';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';

var id = 0;

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
    var roomBack = [];
    var roomFront = [];
    var roomUp = [];
    var roomDown = [];
    var roomLeft = [];
    var roomRight = [];

    //SEPARETE MESHS FOR INSTANCING
    for (var i = 0; i < GLOBALS.PLANE_USER_DATA.length; i++) {

        if (GLOBALS.PLANE_USER_DATA[i].exists) {
            if (GLOBALS.PLANE_USER_DATA[i].itemName != "enterDoor" &&
                GLOBALS.PLANE_USER_DATA[i].itemName != "exitDoor") {

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

                if (GLOBALS.PLANE_USER_DATA[i].side == "back") {
                    roomBack.push(GLOBALS.PLANE_USER_DATA[i])
                } else if (GLOBALS.PLANE_USER_DATA[i].side == "front") {
                    roomFront.push(GLOBALS.PLANE_USER_DATA[i])
                } else if (GLOBALS.PLANE_USER_DATA[i].side == "down") {
                    roomDown.push(GLOBALS.PLANE_USER_DATA[i])
                } else if (GLOBALS.PLANE_USER_DATA[i].side == "up") {
                    roomUp.push(GLOBALS.PLANE_USER_DATA[i])
                } else if (GLOBALS.PLANE_USER_DATA[i].side == "left") {
                    roomLeft.push(GLOBALS.PLANE_USER_DATA[i])
                } else if (GLOBALS.PLANE_USER_DATA[i].side == "right") {
                    roomRight.push(GLOBALS.PLANE_USER_DATA[i])
                }
            }
        }
    }

    console.log(roomBack)

    createRoomForPaint(roomBack, "x", "y")
    createRoomForPaint(roomFront, "x", "y")
    createRoomForPaint(roomDown, "x", "z")
    createRoomForPaint(roomUp, "x", "z")
    createRoomForPaint(roomLeft, "y", "z")
    createRoomForPaint(roomRight, "y", "z")

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

    //material.visible = false;
    material.polygonOffset = true;
    material.polygonOffsetFactor = 2;

    const geometry = new PlaneGeometry(2, 2);
    geometry.computeBoundsTree();
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

window.bla = []

//
function createRoomForPaint(room, valX, valY) {
    const geometries = [];
    const geometry = new PlaneGeometry(2, 2);
    geometry.computeBoundsTree();

    console.log(room.length)

    for (var i = 0; i < room.length; i++) {
        const clone = geometry.clone();

        const pos = new Vector3(room[i].position.x, room[i].position.y, room[i].position.z);
        const rot = new Euler(room[i].rotation._x, room[i].rotation._y, room[i].rotation._z);

        applyTransformations(clone, pos, rot);
        //setPlaneUVs(clone, 2, 2);
        geometries.push(clone);
    }

    const mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries, false);
    mergedGeometry.computeBoundsTree();

    // Apply UV adjustment
    unifyUVs(mergedGeometry, valX, valY);
    normalizeUVs(mergedGeometry, valX, valY)


    // Create material with shader to handle paint
    const material = new ShaderMaterial({
        vertexShader: `
    precision mediump float;

    varying vec2 vUv;

    void main() {
      vUv = uv;
      vec4 worldPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * worldPosition;
    }
  `,
        fragmentShader: `
  precision mediump float;

  varying vec2 vUv;

  uniform sampler2D paintTexture;
  uniform vec3 brushColors[4]; // Array of brush colors (can hold up to 4 colors)

  void main() {
    // Sample the paint texture
    vec4 paintMask = texture2D(paintTexture, vUv);
    
    // Determine which color to use based on the paint mask
    vec3 finalColor = vec3(0.0);
    finalColor += brushColors[0] * paintMask.r;
    finalColor += brushColors[1] * paintMask.g;
    finalColor += brushColors[2] * paintMask.b;
    finalColor += brushColors[3] * paintMask.a;

    // Set the alpha based on the presence of paint
    float alpha = (paintMask.r + paintMask.g + paintMask.b + paintMask.a) > 0.0 ? 1.0 : 0.0;

    // Apply the calculated color
    gl_FragColor = vec4(finalColor, alpha);
  }
`,
        uniforms: {
            paintTexture: { value: null },
            brushColors: {
                value: [
                    new Color(0xff0000), // Color 1: Red
                    new Color(0x00ff00), // Color 2: Green
                    new Color(0x0000ff), // Color 3: Blue
                    new Color(0xffff00), // Color 4: Yellow
                ]
            }
        },
        side: 2, // Assuming both sides need to be visible,
        transparent: true
    });

    // Create the mesh from the unified geometry
    const unifiedMesh = new Mesh(mergedGeometry, material);

    // Add the unified mesh to the scene
    GLOBALS.SCENE_FPS.add(unifiedMesh);

    window.bla.push(unifiedMesh)

    const boundingBox = new Box3().setFromObject(unifiedMesh);
    const size = boundingBox.getSize(new Vector3());

    console.log(size)

    const aspectRatio = size[valX] / size[valY];

    const baseHeight = 512; // You can set this to any preferred base size
    const canvasWidth = baseHeight * aspectRatio;
    const canvasHeight = baseHeight;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth; // Set size for paint texture
    canvas.height = canvasHeight;
    const context = canvas.getContext('2d',{ willReadFrequently: true });

    const paintTexture = new Texture(canvas);
    paintTexture.needsUpdate = true; // Ensure texture is updated initially
    paintTexture.wrapS = ClampToEdgeWrapping; // Prevent repeating
    paintTexture.wrapT = ClampToEdgeWrapping;

    material.uniforms.paintTexture.value = paintTexture;

    unifiedMesh.canvas = canvas;
    unifiedMesh.context = context;
    unifiedMesh.paintTexture = paintTexture;
    unifiedMesh.frustumCulled = true;
}

// Function to apply rotation and position to a geometry
function applyTransformations(geometry, position, rotation) {
    const matrix = new Matrix4();
    matrix.makeRotationFromEuler(rotation);
    matrix.setPosition(position);
    geometry.applyMatrix4(matrix);
}

function unifyUVs(geometry, valX, valY) {
    const uvAttribute = geometry.attributes.uv;

    // Set UV coordinates based on plane's size and position
    for (let i = 0; i < uvAttribute.count; i++) {

        if (valX == "x" && valY == "y") {
            var x = geometry.attributes.position.getX(i);
            var y = geometry.attributes.position.getY(i);
        } else if (valX == "x" && valY == "z") {
            var x = geometry.attributes.position.getX(i);
            var y = geometry.attributes.position.getZ(i);
        } else if (valX == "y" && valY == "z") {
            var x = geometry.attributes.position.getY(i);
            var y = geometry.attributes.position.getZ(i);
        }

        // Example UV mapping, adjust as necessary
        uvAttribute.setXY(i, x / 2.0, y / 2.0); // Adjust for UV space
    }

    uvAttribute.needsUpdate = true;
}

function normalizeUVs(geometry, valX, valY) {
    const uvAttribute = geometry.attributes.uv;
    const positionAttribute = geometry.attributes.position;

    // Calculate the bounding box of the geometry
    const boundingBox = new Box3().setFromBufferAttribute(positionAttribute);
    const size = boundingBox.getSize(new Vector3());

    // Iterate through each UV coordinate
    for (let i = 0; i < uvAttribute.count; i++) {

        if (valX == "x" && valY == "y") {
            var x = positionAttribute.getX(i);
            var y = positionAttribute.getY(i);
        } else if (valX == "x" && valY == "z") {
            var x = positionAttribute.getX(i);
            var y = positionAttribute.getZ(i);
        } else if (valX == "y" && valY == "z") {
            var x = positionAttribute.getY(i);
            var y = positionAttribute.getZ(i);
        }


        // Normalize UVs based on geometry's bounding box
        const u = (x - boundingBox.min[valX]) / size[valX];
        const v = (y - boundingBox.min[valY]) / size[valY];

        // Set normalized UVs
        uvAttribute.setXY(i, u, v);
    }

    uvAttribute.needsUpdate = true;
}

export {
    manageInstances
}