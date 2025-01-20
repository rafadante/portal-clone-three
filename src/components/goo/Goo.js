import { PlaneGeometry, Matrix4, Mesh, Object3D, MeshBasicMaterial, Color, TextureLoader, RepeatWrapping, Vector3, Box3, MeshStandardMaterial } from 'three';
import * as BufferGeometryUtils from 'three/addons/utils/BufferGeometryUtils.js';
import { GLOBALS } from '../../Globals.js';
import { Water } from '../Water.js';
import { getPlaneByName } from '../../Utils.js';
//import { MeshBVH } from 'three-mesh-bvh';

var water, lava;
var water2 = [];
var goo = [];
var ids = [];

const AddGoo = function (userData) {

    goo = [];
    ids = [];

    checkSides(userData);

    const geometry = new PlaneGeometry(2, 2);
    const geometries = [];

    for (let i = 0; i < goo.length; i++) {

        const matrix = new Matrix4();

        var dummy = new Object3D();

        dummy.rotation.set(0, 0, 0);
        dummy.rotation.x = -Math.PI / 2;

        dummy.position.copy(goo[i]);
        dummy.translateZ(1.79);
        dummy.updateMatrix();

        matrix.compose(dummy.position, dummy.quaternion, dummy.scale);
        //randomizeMatrix(matrix);

        const instanceGeometry = geometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        const plane = new Mesh(geometry.clone(), new MeshBasicMaterial());
        plane.rotation.set(0, 0, 0);
        plane.rotation.x = -Math.PI / 2;

        plane.position.copy(goo[i]);
        plane.translateZ(1);

        var bb = new Box3(); // for re-use
        bb.setFromObject(plane);

        // Change the height (Y-axis)
        const newHeight = 1.5;
        const centerY = (bb.min.y + bb.max.y) / 2; // Get the center
        const halfHeight = newHeight / 2;

        // Update the min and max Y values
        bb.min.y = centerY - halfHeight;
        bb.max.y = centerY + halfHeight;

        bb.idPlane = userData.id_instanced;

        GLOBALS.GOO_BOXES.push(bb);

        geometries.push(instanceGeometry);
    }

    var mergedGeometry;

    if (geometries.length > 0)
        mergedGeometry = BufferGeometryUtils.mergeGeometries(geometries);
    else {

        const matrix = new Matrix4();

        var dummy = new Object3D();
        dummy.rotation.set(0, 0, 0);
        dummy.rotation.x = -Math.PI / 2;

        dummy.position.copy(userData.position);
        dummy.translateZ(1.79);
        dummy.updateMatrix();

        matrix.compose(dummy.position, dummy.quaternion, dummy.scale);

        const instanceGeometry = geometry.clone();
        instanceGeometry.applyMatrix4(matrix);

        mergedGeometry = instanceGeometry;
    }

    mergedGeometry.computeBoundingBox();

    lava = new Mesh(mergedGeometry, new MeshStandardMaterial({
        color: new Color(0x7c3f00),
        envMap: GLOBALS.ENV_MAP,
        roughness: 0.2,
        transparent: true,
        opacity: 0.8
    })); //material

    console.log(lava)

    if (geometries.length == 0) {
        var bb = new Box3(); // for re-use
        bb.setFromObject(lava);

        // Change the height (Y-axis)
        const newHeight = 1.5;
        const centerY = (bb.min.y + bb.max.y) / 2; // Get the center
        const halfHeight = newHeight / 2;

        // Update the min and max Y values
        bb.min.y = centerY - halfHeight;
        bb.max.y = centerY + halfHeight;

        bb.idPlane = userData.id_instanced;

        GLOBALS.GOO_BOXES.push(bb);
    }

    water = new Water(
        mergedGeometry, {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: new TextureLoader().load('assets/textures/waternormals.jpg', function (texture) {

            texture.wrapS = texture.wrapT = RepeatWrapping;

        }),
        sunDirection: new Vector3(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 0.2,
        alpha: 0.8
    }
    );

    water2.push(water)
    water.updateMatrixWorld();
    water.material.transparent = true;

    GLOBALS.SCENE_CHILDREN.add(water);
    GLOBALS.SCENE_CHILDREN.add(lava);

    userData.item.lava = lava;
    userData.item.water = water;
    userData.item.ids = ids;

    GLOBALS.GOO_PLANES.push(userData)
};

function checkSides(userData) {

    var box1 = getPlaneByName((userData.position.x + 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
    if (box1.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position)) {
            goo.push(userData.position)
            ids.push(userData.id_instanced)
        }

        var userData2 = getPlaneByName((userData.position.x + 2) + "/" + userData.position.y + "/" + userData.position.z);
        if (userData2.length > 0) {
            if (!ids.includes(userData2[0].id_instanced))
                checkSides(userData2[0])
        }
    }

    var box2 = getPlaneByName((userData.position.x - 1) + "/" + (userData.position.y + 1) + "/" + userData.position.z);
    if (box2.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position)) {
            goo.push(userData.position)
            ids.push(userData.id_instanced)
        }

        var userData2 = getPlaneByName((userData.position.x - 2) + "/" + userData.position.y + "/" + userData.position.z);
        if (userData2.length > 0) {
            if (!ids.includes(userData2[0].id_instanced))
                checkSides(userData2[0])
        }
    }

    var box3 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z + 1));
    if (box3.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position)) {
            goo.push(userData.position)
            ids.push(userData.id_instanced)
        }

        var userData2 = getPlaneByName(userData.position.x + "/" + userData.position.y + "/" + (userData.position.z + 2));
        if (userData2.length > 0) {
            if (!ids.includes(userData2[0].id_instanced))
                checkSides(userData2[0])
        }
    }

    var box4 = getPlaneByName(userData.position.x + "/" + (userData.position.y + 1) + "/" + (userData.position.z - 1));
    if (box4.length == 0) {
        userData.hasGoo = true;

        if (!goo.includes(userData.position)) {
            goo.push(userData.position)
            ids.push(userData.id_instanced)
        }

        var userData2 = getPlaneByName(userData.position.x + "/" + userData.position.y + "/" + (userData.position.z - 2));
        if (userData2.length > 0) {
            if (!ids.includes(userData2[0].id_instanced))
                checkSides(userData2[0])
        }
    }
}

function renderGoo() {
    renderGoo2();
}

function renderGoo2() {
    if (water) {
        for (var i = 0; i < water2.length; i++) {
            water2[i].material.uniforms['time'].value += 1.0 / 2000.0;
        }
    }
}

export {
    AddGoo,
    renderGoo
};