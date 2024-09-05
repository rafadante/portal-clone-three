import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';
import { Color, InstancedMesh, MeshStandardMaterial, PlaneGeometry, Object3D, TextureLoader, Vector3, Euler } from 'three';
import CANNON from 'cannon';
import { cannonToThreeVector3, threeToCannonVector3, tweenCamera } from '../../Utils.js';
import { AUDIO } from '../audio/Audio.js';
import { addGelBlob } from './GelDispenser.js';
import { animate } from '../../Main';

//
const geometryGel = new PlaneGeometry(2, 2);
const materialGel = new MeshStandardMaterial({
    roughness: 0.2,
    normalMap: new TextureLoader().load("./assets/textures/decal/normal.jpg"),
    polygonOffset: true,
    polygonOffsetFactor: 1
});

const instancedGelPlane = new InstancedMesh(geometryGel, materialGel, 1000);
instancedGelPlane.current = 0;
instancedGelPlane.frustumCulled = true;

var dummy = new Object3D();
for (var i = 0; i < 1000; i++) {
    dummy.position.set(100000, 100000, 100000);
    dummy.updateMatrix();
    instancedGelPlane.setMatrixAt(i, dummy.matrix);
}

instancedGelPlane.instanceMatrix.needsUpdate = true;
instancedGelPlane.computeBoundingSphere();

//
const geometryGelDynamic = new PlaneGeometry(3, 3);
const materialGelDynamic = new MeshStandardMaterial({
    roughness: 0.2,
    normalMap: new TextureLoader().load("./assets/textures/decal/decal-normal.jpg"),
    map: new TextureLoader().load("./assets/textures/decal/decal-diffuse.png"),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1
});

const instancedGelPlaneDynamic = new InstancedMesh(geometryGelDynamic, materialGelDynamic, 1000);
instancedGelPlaneDynamic.current = 0;
instancedGelPlaneDynamic.frustumCulled = true;

var dummy = new Object3D();
for (var i = 0; i < 1000; i++) {
    dummy.position.set(100000, 100000, 100000);
    dummy.updateMatrix();
    instancedGelPlaneDynamic.setMatrixAt(i, dummy.matrix);
}

instancedGelPlaneDynamic.instanceMatrix.needsUpdate = true;
instancedGelPlaneDynamic.computeBoundingSphere();

//REFLECTION INSTANCES
const geometryGelDynamicReflection = new PlaneGeometry(2, 2);
const materialGelDynamicReflection = new MeshStandardMaterial({
    roughness: 0.2,
    normalMap: new TextureLoader().load("./assets/textures/decal/decal-normal.jpg"),
    map: new TextureLoader().load("./assets/textures/decal/decal-diffuse.png"),
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    metalness: 1,
    roughness: 0.25
});

const instancedGelPlaneDynamicReflection = new InstancedMesh(geometryGelDynamicReflection, materialGelDynamicReflection, 1000);
instancedGelPlaneDynamicReflection.current = 0;
instancedGelPlaneDynamicReflection.frustumCulled = true;

var dummy = new Object3D();
for (var i = 0; i < 1000; i++) {
    dummy.position.set(100000, 100000, 100000);
    dummy.updateMatrix();
    instancedGelPlaneDynamicReflection.setMatrixAt(i, dummy.matrix);
}

instancedGelPlaneDynamicReflection.instanceMatrix.needsUpdate = true;
instancedGelPlaneDynamicReflection.computeBoundingSphere();

//WHITE GEL INSTANCES
GLOBALS.INSTANCED_WHITE_GEL = new InstancedMesh(geometryGelDynamic, materialGelDynamic, 1000);
GLOBALS.INSTANCED_WHITE_GEL.current = 0;
GLOBALS.INSTANCED_WHITE_GEL.frustumCulled = true;
GLOBALS.INSTANCED_WHITE_GEL.array = [];

var dummy = new Object3D();
for (var i = 0; i < 1000; i++) {
    dummy.position.set(100000, 100000, 100000);
    dummy.updateMatrix();
    GLOBALS.INSTANCED_WHITE_GEL.setMatrixAt(i, dummy.matrix);
}

GLOBALS.INSTANCED_WHITE_GEL.instanceMatrix.needsUpdate = true;
GLOBALS.INSTANCED_WHITE_GEL.computeBoundingSphere();

function addGel() {

    instancedGelPlane.material.envMap = GLOBALS.ENV_MAP;
    GLOBALS.SCENE_FPS.add(instancedGelPlane);

    instancedGelPlaneDynamic.material.envMap = GLOBALS.ENV_MAP;
    GLOBALS.SCENE_FPS.add(instancedGelPlaneDynamic);

    instancedGelPlaneDynamicReflection.material.envMap = GLOBALS.ENV_MAP;
    GLOBALS.SCENE_FPS.add(instancedGelPlaneDynamicReflection);

    GLOBALS.INSTANCED_WHITE_GEL.material.envMap = GLOBALS.ENV_MAP;
    GLOBALS.SCENE_FPS.add(GLOBALS.INSTANCED_WHITE_GEL);

    for (var i = 0; i < GLOBALS.GELS.length; i++) {
        spawnInstanced(GLOBALS.GELS[i], GLOBALS.GELS[i].planeColor, GLOBALS.GELS[i].gelType, GLOBALS.GELS[i].side, false, 1)
    }

    addGelBlob();
}

function spawnInstanced(item, color, gelType, side, dynamic, size) {

    var instanced;

    if (gelType == "white")
        instanced = GLOBALS.INSTANCED_WHITE_GEL;
    else if (gelType == "reflection")
        instanced = instancedGelPlaneDynamicReflection;
    else if (dynamic)
        instanced = instancedGelPlaneDynamic;
    else
        instanced = instancedGelPlane;

    var dummy = new Object3D();
    dummy.position.copy(item.position);
    dummy.rotation.copy(item.rotation);
    dummy.updateMatrix();

    instanced.setMatrixAt(instanced.current, dummy.matrix);
    instanced.setColorAt(instanced.current, new Color(color));

    gelCollider(dummy, gelType, side, size, instanced, color);

    instanced.instanceColor.needsUpdate = true;
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
    instanced.current += 1;
}

function gelCollider(dummy, type, side, size, instanced, color) {
    var shape = new CANNON.Box(new CANNON.Vec3(size, size, 0.025));
    var gel = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: GLOBALS.PHYSICS_MATERIAL
    });
    gel.position.copy(dummy.position);
    gel.quaternion.copy(dummy.quaternion);
    //gel.collisionResponse = 0;

    gel.name = "gel";
    gel.type = type;
    gel.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    gel.collisionFilterMask = GLOBALS.CGROUP_ALL;
    gel.side = side;
    gel.color = color;

    dummy.gelBody = gel;
    GLOBALS.GEL_TRIGGER.push(dummy);

    if (side == "front")
        gel.normal = new Vector3(0, 0, 1)
    else if (side == "back")
        gel.normal = new Vector3(0, 0, -0.01)
    else if (side == "right")
        gel.normal = new Vector3(-0.01, 0, 0)
    else if (side == "left")
        gel.normal = new Vector3(1, 0, 0)
    else if (side == "up")
        gel.normal = new Vector3(0, -0.01, 0)
    else if (side == "down")
        gel.normal = new Vector3(0, 1.01, 0)

    GLOBALS.CANNON_BODIES.push(gel);
    GLOBALS.CANNON_WORLD.addBody(gel);

    if (type == "white") {
        instanced.array.push(gel);
    }
}

function gelTrigger(event) {

    if (event.body.collisionResponse == 0)
        return;

    if (event.body.type == "blue" && !event.target.gelJumping) {

        clearTimeout(event.target.timeout)

        event.target.firstCollisionHandled = true;
        event.target.gelJumping = true;
        const holder = event.target;
        setTimeout(() => {
            holder.gelJumping = false;
        }, 100);

        //NORMAL
        var normalContact = event.body.normal;

        if (event.target.impactSide != event.body.side) {

            if (Math.abs(normalContact.x) > 0) {
                event.target.axisImpact = "x";
            } else if (Math.abs(normalContact.y) > 0) {
                event.target.axisImpact = "y";
            } else if (Math.abs(normalContact.z) > 0) {
                event.target.axisImpact = "z";
            }

            if (Math.abs(event.target.velocity[event.target.axisImpact]) < 1 &&
                event.target.name == "player" &&
                event.body.side == "down") {
                event.target.jumpVelocity = -7;
                event.target.impactVelocity = -7;
                return;
            } else if ((Math.abs(event.target.velocity[event.target.axisImpact]) < 7))
                event.target.impactVelocity = -7;
            else
                event.target.impactVelocity = -Math.abs(event.target.velocity[event.target.axisImpact]);

            event.target.impactSide = event.body.side;
        } else if (event.target.jumpVelocity) {
            return;
        }

        event.target.velocity[event.target.axisImpact] = event.target.impactVelocity;

        // Apply impulse only if the object is moving downwards
        if (event.target.impactVelocity < 0) {
            // The impulse should reverse the current downward velocity
            const impulseStrength = -2.1 * event.target.mass * event.target.impactVelocity;

            var impulse = new CANNON.Vec3(
                impulseStrength * normalContact.x,
                impulseStrength * normalContact.y,
                impulseStrength * normalContact.z
            );

            if (event.body.side != "down") {
                event.target.velocity.y = 0.65;
                impulse.y = 85;
            }

            event.target.applyImpulse(impulse, event.target.position);
        }
    } else if (event.body.type == "orange") {
        /*if (!event.target.OrangeContact) {
            AUDIO.PROPULSION.currentTime = 0;
            AUDIO.PROPULSION.play();
            AUDIO.WALK.volume = 0;
        }*/

        event.target.OrangeContact = true;
    } else if (event.body.type == "purple") {

        if (event.body.side == "down")
            return;

        clearTimeout(event.target.timeout);
        event.target.gelPurple = event.body;

        const normalThree = cannonToThreeVector3(event.contact.ni).round().negate();
        const normalCannon = threeToCannonVector3(normalThree);

        if (event.target.name == "player") {
            if (event.target.side != event.body.side) {

                GLOBALS.HEAD_BOB_SPEED = 3;
                GLOBALS.PLAYER.PURPLE_CONTACT = false;
                GLOBALS.PLAYER.ROTATING = true;
                setTimeout(() => {
                    GLOBALS.PLAYER.ROTATING = false;;
                    GLOBALS.PLAYER.PURPLE_CONTACT = true;
                }, 400);

                event.target.side = event.body.side;
                event.target.customGravity = new CANNON.Vec3(normalCannon.x * -9.8, normalCannon.y * -9.8, normalCannon.z * -9.8);

                GLOBALS.PLAYER.upVector = normalCannon;
                GLOBALS.PLAYER.upVectorThree = normalThree;

                if (!GLOBALS.PLAYER.EULER) {
                    GLOBALS.MAIN_CAMERA_GROUP.position.copy(GLOBALS.MAIN_CAMERA.position);
                    GLOBALS.MAIN_CAMERA.position.set(0, 0, 0);
                    GLOBALS.PIVOT = GLOBALS.MAIN_CAMERA_GROUP;
                    GLOBALS.CUSTOM_GRAVITY.push(event.target);
                }

                window.direction = 1;

                if (event.body.side == "front") {
                    GLOBALS.PLAYER.EULER = new Euler(Math.PI / 2, 0, 0, 'XYZ');
                    tweenCamera(400, GLOBALS.MAIN_CAMERA_GROUP.rotation, new Vector3(Math.PI / 2, 0, 0))
                    GLOBALS.PLAYER.DIR = 1;
                } else if (event.body.side == "back") {
                    GLOBALS.PLAYER.EULER = new Euler(-Math.PI / 2, 0, 0, 'XYZ');
                    tweenCamera(400, GLOBALS.MAIN_CAMERA_GROUP.rotation, new Vector3(-Math.PI / 2, 0, 0))
                    GLOBALS.PLAYER.DIR = -1;
                } else if (event.body.side == "up") {
                    GLOBALS.PLAYER.EULER = new Euler(Math.PI * GLOBALS.PLAYER.DIR, 0, 0, 'XYZ');
                    tweenCamera(400, GLOBALS.MAIN_CAMERA_GROUP.rotation, new Vector3(Math.PI * GLOBALS.PLAYER.DIR, 0, 0))
                } else if (event.body.side == "left") {
                    GLOBALS.PLAYER.EULER = new Euler(0, 0, -Math.PI / 2, 'XYZ');
                    tweenCamera(400, GLOBALS.MAIN_CAMERA_GROUP.rotation, new Vector3(0, 0, -Math.PI / 2))
                    GLOBALS.PLAYER.DIR = -1;
                } else if (event.body.side == "right") {
                    GLOBALS.PLAYER.EULER = new Euler(0, 0, Math.PI / 2, 'XYZ');
                    tweenCamera(400, GLOBALS.MAIN_CAMERA_GROUP.rotation, new Vector3(0, 0, Math.PI / 2))
                    GLOBALS.PLAYER.DIR = 1;
                }

                window.nnn = true;
                GLOBALS.SPEED = 0.75;
                AUDIO.WALK_NORMAL.pause();
                AUDIO.WALK = AUDIO.WALK_PAINT;
            }
        } else {
            if (!event.target.customGravity) {
                GLOBALS.CUSTOM_GRAVITY.push(event.target);
                event.target.customGravity = new CANNON.Vec3(normalCannon.x * -9.8, normalCannon.y * -9.8, normalCannon.z * -9.8);
            }
        }
    }
}

function applyCustomGravity() {
    for (var i = 0; i < GLOBALS.CUSTOM_GRAVITY.length; i++) {

        const customGravity = GLOBALS.CUSTOM_GRAVITY[i].customGravity;
        const body = GLOBALS.CUSTOM_GRAVITY[i];

        // Calculate the difference between the global gravity and custom gravity
        const gravityDifference = new CANNON.Vec3(
            customGravity.x - GLOBALS.CANNON_WORLD.gravity.x,
            customGravity.y - GLOBALS.CANNON_WORLD.gravity.y,
            customGravity.z - GLOBALS.CANNON_WORLD.gravity.z
        );

        // Apply this difference as an additional force
        const additionalForce = new CANNON.Vec3(
            gravityDifference.x * body.mass,
            gravityDifference.y * body.mass,
            gravityDifference.z * body.mass
        );

        body.applyForce(additionalForce, body.position);
    }
}

//UI STUFF

$("body").on('click', '#add-gel', function () {

    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        addTileGel(
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]],
            $("#gel-type").data("gel"),
            $("#gel-type").data("color"),
            GLOBALS.SELECTED_ID[i]
        );
    }

    animate();
});

function addTileGel(item, type, color, id) {

    if (type == "blue")
        color = "rgb(30,144,255)"
    else if (type == "orange")
        color = "rgb(255,140,0)"
    else if (type == "purple")
        color = "rgb(75,0,130)"

    item.hasItem = true;
    item.itemName = "gel";
    item.gelType = type;
    item.planeColor = color;
    GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(id, new Color(color));
    GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

    const index = GLOBALS.GELS.indexOf(item);
    if (index <= -1) { // only splice array when item is found
        GLOBALS.GELS.push(item);
    }
}

$("body").on('click', '#remove-gel', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].gelType) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].hasItem = false;
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].itemName = null;
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].gelType = null;

            var color;
            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
                color = 0xffffff;
            else
                color = 0x808080;

            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].planeColor = color;
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color(color));
            GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;

            const index = GLOBALS.GELS.indexOf(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]]);
            if (index > -1) {
                GLOBALS.GELS.splice(index, 1);
            }
        }
    }
});

$("body").on('click', '.gel-type', function () {
    $("#gel-type").find(".title").text("Gel type: " + $(this).data("gel"))
    $("#gel-type").data("gel", $(this).data("gel"))
    $("#gel-type").data("color", $(this).data("color"))
});

export {
    addGel,
    gelTrigger,
    applyCustomGravity,
    spawnInstanced,
    addTileGel
}