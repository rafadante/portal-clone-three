import $ from 'jquery';
import { GLOBALS } from '../../Globals.js';
import { Color, InstancedMesh, Mesh, MeshStandardMaterial, PlaneGeometry, Object3D, TextureLoader, Vector3, Euler, Group, Quaternion } from 'three';
import CANNON from 'cannon';
import { cannonToThreeVector3, threeToCannonVector3, tweenCamera } from '../../Utils.js';
import { tweenBack } from '../../Utils.js';
import { AUDIO } from '../audio/Audio.js';
import { addGelBlob } from './GelDispenser.js';



//
const geometryGel = new PlaneGeometry(2, 2);
const materialGel = new MeshStandardMaterial({
    roughness: 0.2,
    normalMap: new TextureLoader().load("./assets/textures/decal/normal.jpg")
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
const geometryGelDynamic = new PlaneGeometry(2, 2);
const materialGelDynamic = new MeshStandardMaterial({
    roughness: 0.2,
    normalMap: new TextureLoader().load("./assets/textures/decal/decal-normal.jpg"),
    map: new TextureLoader().load("./assets/textures/decal/decal-diffuse.png"),
    transparent: true,
    depthWrite: false
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


console.log(instancedGelPlaneDynamic)

function addGel() {

    instancedGelPlane.material.envMap = GLOBALS.ENV_MAP;
    GLOBALS.SCENE_FPS.add(instancedGelPlane);

    instancedGelPlaneDynamic.material.envMap = GLOBALS.ENV_MAP;
    GLOBALS.SCENE_FPS.add(instancedGelPlaneDynamic);

    for (var i = 0; i < GLOBALS.GELS.length; i++) {
        spawnInstanced(GLOBALS.GELS[i], GLOBALS.GELS[i].planeColor, GLOBALS.GELS[i].gelType, GLOBALS.GELS[i].side, false, 1)
    }

    addGelBlob();
}

function spawnInstanced(item, color, gelType, side, dynamic, size) {

    var instanced;

    if (dynamic)
        instanced = instancedGelPlaneDynamic;
    else
        instanced = instancedGelPlane;

    var dummy = new Object3D();
    dummy.position.copy(item.position);
    dummy.rotation.copy(item.rotation);
    dummy.updateMatrix();

    instanced.setMatrixAt(instanced.current, dummy.matrix);
    instanced.setColorAt(instanced.current, color);
    instanced.current += 1;

    gelCollider(dummy, gelType, side, size);

    instanced.instanceColor.needsUpdate = true;
    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();
}

function gelCollider(dummy, type, side, size) {
    var shape = new CANNON.Box(new CANNON.Vec3(size, size, 0.05));
    var gel = new CANNON.Body({
        shape: shape,
        mass: 0,
        material: GLOBALS.PHYSICS_MATERIAL
    });

    gel.position.copy(dummy.position);
    gel.quaternion.copy(dummy.quaternion);

    if (type == "purple")
        gel.collisionResponse = 1;
    else
        gel.collisionResponse = 0;

    gel.name = "gel";
    gel.type = type;
    gel.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    gel.collisionFilterMask = GLOBALS.CGROUP_ALL;
    gel.side = side;

    if (side == "down")
        gel.normal = new Vector3(0, 1, 0)

    GLOBALS.CANNON_BODIES.push(gel);
    GLOBALS.CANNON_WORLD.addBody(gel);
}

function gelTrigger(event) {

    if (event.body.type == "blue" && !event.target.gelJumping) {

        clearTimeout(event.target.timeout)

        event.target.firstCollisionHandled = true;
        event.target.gelJumping = true;
        const holder = event.target;
        setTimeout(() => {
            holder.gelJumping = false;
        }, 100);

        if (!event.target.verticalVelocity) {
            if (event.target.velocity.y < 0.1 && event.target.velocity.y > -8) {
                event.target.verticalVelocity = -8;
                event.target.velocity.y = -8;
            } else
                event.target.verticalVelocity = event.target.velocity.y * 1.05;
        }

        // Apply impulse only if the object is moving downwards
        if (event.target.verticalVelocity < 0) {
            // The impulse should reverse the current downward velocity
            const impulseStrength = -2 * event.target.mass * event.target.verticalVelocity;
            const impulse = new CANNON.Vec3(0, impulseStrength, 0);

            console.log(impulse)

            event.target.applyImpulse(impulse, event.target.position);
        }
    } else if (event.body.type == "orange") {
        if (!event.target.OrangeContact) {
            AUDIO.PROPULSION.currentTime = 0;
            AUDIO.PROPULSION.play();
            AUDIO.WALK.volume = 0;
        }

        event.target.OrangeContact = true;
    } else if (event.body.type == "purple") {

        clearTimeout(event.target.timeout);

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
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].hasItem = true;
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].itemName = "gel";
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].gelType = $("#gel-type").data("gel");
        GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].planeColor = new Color($("#gel-type").data("color"));
        GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], new Color($("#gel-type").data("color")));
        GLOBALS.PLANE_LEVEL_INSTANCED.instanceColor.needsUpdate = true;
        GLOBALS.GELS.push(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]]);
    }
});

$("body").on('click', '#remove-gel', function () {
    for (var i = 0; i < GLOBALS.SELECTED_ID.length; i++) {
        if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].gelType) {
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].hasItem = false;
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].itemName = null;
            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].gelType = null;

            var color;
            if (GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].portal)
                color = new Color(0xffffff);
            else
                color = new Color(0x808080)

            GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[i]].planeColor = color;
            GLOBALS.PLANE_LEVEL_INSTANCED.setColorAt(GLOBALS.SELECTED_ID[i], color);
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
    spawnInstanced
}