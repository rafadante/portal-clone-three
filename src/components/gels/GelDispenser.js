
import { Color, Euler, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, SphereGeometry, Vector3 } from "three";
import { GLOBALS } from "../../Globals";
import CANNON, { Quaternion } from "cannon";
import { spawnInstanced } from "./Gels";
import { cannonToThreeVector3 } from "../../Utils";

const geometry = new SphereGeometry(0.6, 8, 4);
const materialBlue = new MeshBasicMaterial({ color: new Color('rgb(30,144,255)') });
const materialOrange = new MeshBasicMaterial({ color: new Color('rgb(255,140,0)') });
const materialPurple = new MeshBasicMaterial({ color: new Color('rgb(75,0,130)') });
const materialWhite = new MeshBasicMaterial({ color: new Color(0.8, 0.8, 0.8) });
const materialClear = new MeshBasicMaterial({ color: new Color(0xa7dcdd), transparent: true, opacity: 0.5 });
const materialReflection = new MeshStandardMaterial({ metalness: 1, roughness: 0.25});
const sphere = new Mesh(geometry, materialBlue);
var spheres = [];

function addGelBlob() {

    materialReflection.envMap = GLOBALS.ENV_MAP;

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

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_white'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_white'][i].length != 0) {
            addBody(GLOBALS.DYMANIC_ITEMS['gel_white'][i], "white", new Color(0.8, 0.8, 0.8), materialWhite);
        }
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_clear'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_clear'][i].length != 0) {
            addBody(GLOBALS.DYMANIC_ITEMS['gel_clear'][i], "clear", new Color(0xa7dcdd), materialClear);
        }
    }

    for (var i = 0; i < GLOBALS.DYMANIC_ITEMS['gel_reflection'].length; i++) {
        if (GLOBALS.DYMANIC_ITEMS['gel_reflection'][i].length != 0) {
            addBody(GLOBALS.DYMANIC_ITEMS['gel_reflection'][i], "reflection", new Color("rgb(128,128,128)"), materialReflection);
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
    gelBlob.spawnPositions = [];
    gelBlob.typeGel = type;
    gelBlob.colorGel = color;

    GLOBALS.CANNON_WORLD.addBody(gelBlob);
    GLOBALS.CANNON_BODIES.push(gelBlob);
    GLOBALS.DYNAMIC_OBJECTS.push(gelBlob);

    gelBlob.addEventListener("collide", function (event) {

        if (gelBlob.inArea)
            return;

        if (event.body.dynamic) {
            const instanced = GLOBALS.ITEMS_ADDED.getObjectByName(event.body.item.userData.instancedName);

            if (gelBlob.typeGel == "clear")
                instanced.setColorAt(event.body.item.userData.idInstanced, new Color(1, 1, 1));
            else
                instanced.setColorAt(event.body.item.userData.idInstanced, gelBlob.colorGel);

            instanced.instanceColor.needsUpdate = true;
        }

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
        }, 1000);

        //
        

        if (event.body.name != "wall" && event.body.name != "panel")
            return;

        const item = new Object3D();
        item.position.copy(cannonToThreeVector3(getContactPosition(event.contact)));

        if (event.body.name == "wall")
            item.rotation.copy(getContactRotation(event.body.side));
        else {
            item.quaternion.copy(event.body.quaternion);
            item.rotateY(Math.PI)

            var worldPos = new Vector3();
            event.body.panel.getWorldPosition(worldPos);
            item.position.copy(worldPos);
        }

        const contactPosition = cannonToThreeVector3(getContactPosition(event.contact));
        if (isVectorInArray(contactPosition, gelBlob.spawnPositions)) {
            return;
        }

        spawnInstanced(item, color, type, event.body.side, true, 1.5);
        gelBlob.spawnPositions.push(contactPosition);
    });
}

function isVectorInArray(vector, array) {
    return array.some(v => v.equals(vector))
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