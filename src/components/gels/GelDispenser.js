
import { Color, Euler, Mesh, MeshBasicMaterial, Object3D, SphereGeometry, Vector3 } from "three";
import { GLOBALS } from "../../Globals";
import CANNON from "cannon";
import { spawnInstanced } from "./Gels";
import { cannonToThreeVector3 } from "../../Utils";

const geometry = new SphereGeometry(0.6, 8, 4);
const materialBlue = new MeshBasicMaterial({ color: new Color('rgb(30,144,255)') });
const materialOrange = new MeshBasicMaterial({ color: new Color('rgb(255,140,0)') });
const materialPurple = new MeshBasicMaterial({ color: new Color('rgb(75,0,130)') });
const sphere = new Mesh(geometry, materialBlue);
var spheres = [];

function addGelBlob() {

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_blue'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_blue'][i].length != 0) {
            addBody(GLOBALS.DYMANIC_ITEMS['gel_blue'][i], "blue", new Color('rgb(30,144,255)'), materialBlue);
        }
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_orange'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_orange'][i].length != 0) {
            addBody(GLOBALS.DYMANIC_ITEMS['gel_orange'][i], "orange", new Color('rgb(255,140,0)'), materialOrange);
        }
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_purple'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_purple'][i].length != 0) {
            addBody(GLOBALS.DYMANIC_ITEMS['gel_purple'][i], "purple", new Color('rgb(75,0,130)'), materialPurple);
        }
    }
}

let PHYSICS_MATERIAL = new CANNON.Material();
PHYSICS_MATERIAL.friction = 0.4; //0.01

function addBody(obj, type, color, material) {

    const sphereClone = sphere.clone();
    GLOBALS.SCENE_FPS.add(sphereClone);
    spheres.push(sphereClone);
    sphereClone.material = material;

    var gelBlob = new CANNON.Body({
        shape: new CANNON.Sphere(0.3),
        mass: 20,
        material: PHYSICS_MATERIAL
    })

    sphereClone.body = gelBlob;
    gelBlob.sphereClone = sphereClone;

    gelBlob.position.copy(obj.position);
    gelBlob.position.y -= 0.5;
    gelBlob.quaternion.copy(obj.quaternion);
    gelBlob.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    gelBlob.collisionFilterMask = GLOBALS.CGROUP_ALL;
    gelBlob.item = obj;
    gelBlob.updateMassProperties();
    gelBlob.clone = new Object3D();

    GLOBALS.CANNON_WORLD.addBody(gelBlob);
    GLOBALS.CANNON_BODIES.push(gelBlob);
    GLOBALS.DYNAMIC_OBJECTS.push(gelBlob);

    gelBlob.addEventListener("collide", function (event) {

        if (event.body.name != "wall")
            return;

        gelBlob.sphereClone.visible = false;
        gelBlob.mass = 0;
        gelBlob.updateMassProperties();
        gelBlob.position.copy(gelBlob.item.position)
        gelBlob.position.y -= 0.5;
        gelBlob.quaternion.copy(gelBlob.item.quaternion)

        // Velocity
        gelBlob.velocity.setZero();
        gelBlob.initVelocity.setZero();
        gelBlob.angularVelocity.setZero();
        gelBlob.initAngularVelocity.setZero();

        // Force
        gelBlob.force.setZero();
        gelBlob.torque.setZero();

        setTimeout(() => {
            gelBlob.mass = 20;
            gelBlob.updateMassProperties();
            gelBlob.wakeUp();
            gelBlob.sphereClone.visible = true;
        }, 2000);

        const item = new Object3D();
        item.position.copy(cannonToThreeVector3(getContactPosition(event.contact)));
        item.rotation.copy(getContactRotation(event.body.side));

        spawnInstanced(item, color, type, event.body.side, true, 1)
    });
}

function getContactPosition(contact) {
    // Contact point relative to body B
    const relB = contact.rj;

    // Convert relative contact point to world coordinates
    const worldPositionB = new CANNON.Vec3();

    contact.bj.pointToWorldFrame(relB, worldPositionB);

    return worldPositionB;
}

function getContactRotation(side) {
    if (side == "down")
        return new Euler(-Math.PI / 2, 0, 0);
    else if (side == "up")
        return new Euler(Math.PI / 2, 0, 0);
    else if (side == "front")
        return new Euler(0, 0, 0);
    else if (side == "back")
        return new Euler(Math.PI, 0, 0);
    else if (side == "left")
        return new Euler(0, Math.PI / 2, 0);
    else if (side == "right")
        return new Euler(0, -Math.PI / 2, 0);
}

function updateGelBlob() {
    for (var i = 0; i < spheres.length; i++) {
        spheres[i].position.copy(spheres[i].body.position);
        spheres[i].quaternion.copy(spheres[i].body.quaternion);
    }
}

export {
    addGelBlob,
    updateGelBlob
}