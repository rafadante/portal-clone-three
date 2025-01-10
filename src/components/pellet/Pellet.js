import {
    Vector3, Object3D, MeshBasicMaterial, Mesh, Color, SphereGeometry, PointLight,
    CylinderGeometry, Raycaster, CircleGeometry, BoxGeometry, TextureLoader,
    MeshStandardMaterial
} from 'three';
import { GLOBALS } from '../../Globals';
import * as CANNON from 'cannon';
import $ from 'jquery';
import { respawn } from '../events/states';
import { laserReceiverTrigger } from '../events/events.js';
import { cannonToThreeVector3 } from '../../Utils.js';
import { addPositionalAudio, playVoice } from '../audio/Audio.js';
import { play } from "../audio/Audio.js";
import { InstancedMesh2 } from '@three.ez/instanced-mesh';

window.pellets = [];
var raycaster = new Raycaster();

function addPelletBall(item) {

    var color = new Color(0, 5, 0);

    if (!item.userData.pedestalInfinity)
        color = new Color(5, 0, 0);

    var origin = new Object3D();
    origin.position.copy(item.position);
    origin.quaternion.copy(item.quaternion);
    origin.translateY(1);

    //
    const geometry = new SphereGeometry(0.1, 8, 4);
    const material = new MeshStandardMaterial({ emissive: color, envMap: GLOBALS.envMap });
    const energyBall = new Mesh(geometry, material);
    energyBall.position.copy(origin.position);
    energyBall.rotation.copy(origin.rotation);
    energyBall.origin = origin;
    energyBall.time = item.userData.pedestalValue;
    energyBall.infinity = item.userData.pedestalInfinity;
    energyBall.active = true;
    GLOBALS.SCENE_FPS.add(energyBall);

    //
    const light = new PointLight(color, 0.5, 3);
    //energyBall.add(light)

    const energyBallClone = energyBall.clone();
    energyBallClone.visible = false;

    //BODY
    var shape = new CANNON.Sphere(0.1);
    var ball = new CANNON.Body({
        shape: shape,
        mass: 1,
        material: new CANNON.Material()
    });
    GLOBALS.CANNON_BODIES.push(ball);
    ball.position.copy(energyBall.position);
    ball.quaternion.copy(energyBall.quaternion);
    ball.collisionFilterGroup = GLOBALS.CGROUP_DYNAMIC;
    ball.collisionFilterMask = GLOBALS.CGROUP_ALL;
    GLOBALS.CANNON_BODIES.push(ball);
    GLOBALS.CANNON_WORLD.addBody(ball);
    energyBall.body = ball;
    energyBall.item = item;

    var direction = new Vector3(0, 1, 0).applyQuaternion(ball.quaternion);
    ball.direction = direction;
    ball.originaldirection = direction;
    ball.clone = energyBallClone;
    ball.name = "pellet";
    ball.pellet = energyBall;
    ball.previousDirection = direction;

    ball.addEventListener("collide", function (event) {

        if (!event.target.started || event.body.collisionResponse == 0)
            return

        if (!event.target.pellet.active || event.body.name == "fizzler")
            return;

        play(event.target.sound.audio);

        if (event.body.name == "wall") {
            addDecalOnHit(cannonToThreeVector3(event.target.position), event.body.wallRotation, event.target.direction);
        }

        if (event.body.name == "player") {
            clearTimeout(event.target.pellet.timeout);
            resetBall(event.target.pellet, true)
            respawn(GLOBALS.PLAYER);
            event.target.direction = event.target.originaldirection;
            return;
        } else if (event.body.name == "pellet_catcher") {

            if (!event.body.active) {
                event.body.active = true;
                event.body.item.cone.visible = false;
                laserReceiverTrigger(event.body.item, true, true);

                clearTimeout(event.target.pellet.timeout);

                if (event.target.pellet.infinity) {
                    resetBall(event.target.pellet, true);
                } else {
                    event.target.pellet.active = false;
                    event.target.pellet.position.set(100000, 10000, 10000)

                    setTimeout(() => {
                        event.target.removeEventListener("collide")
                        GLOBALS.CANNON_WORLD.removeBody(event.target);
                    }, 10);
                }

                event.target.direction = event.target.originaldirection;

                playVoice(event.body.item.userData);

                return;
            }
        }

        const contact = event.contact;
        const normal = contact.ni;  // Normal vector of the contact

        // Convert the normal vector to Three.js format if needed
        const threeNormal = new Vector3(normal.x, normal.y, normal.z).negate();

        const holder = event.target.direction;

        if (event.body.name == "panel") {
            //console.log(event.target.direction)
        }

        if (threeNormal.equals(event.target.previousDirection.round()))
            event.target.direction = threeNormal.negate();
        else
            event.target.direction = threeNormal;

        if (event.body.name == "panel") {
            //console.log(event.target.direction)

            if (Math.abs(holder.x) > Math.abs(holder.z)) {
                event.target.direction.x = 0;
            } else if (Math.abs(holder.x) < Math.abs(holder.z)) {
                event.target.direction.z = 0;
            }
        }

        event.target.previousDirection = event.target.direction;
    });

    GLOBALS.DYNAMIC_OBJECTS.push(ball);
    window.pellets.push(energyBall);

    console.log(window.pellets)

    //
    addPositionalAudio('pelletHit', ball, false, false, false, 10, 'sound');
}

function addPelletCatcher(item) {
    //CONE LIGHT
    var direction = new Vector3(0, 1, 0).applyQuaternion(item.quaternion);
    raycaster = new Raycaster();
    raycaster.set(item.position, direction);
    var intersects = raycaster.intersectObject(GLOBALS.PLANE_LEVEL_INSTANCED);

    const parentCone = new Object3D();
    parentCone.position.copy(item.position)
    parentCone.rotation.copy(item.rotation)

    const geometryCone = new CylinderGeometry(1, 0.1, intersects[0].distance, 16, 1, true);
    const cone = new Mesh(geometryCone, GLOBALS.MATERIAL_CONE);
    parentCone.add(cone);
    cone.translateY(intersects[0].distance / 2);

    const geometryCircle = new CircleGeometry(1, 16);
    const materialCircle = new MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.05,
        side: 1,
        polygonOffset: true,
        polygonOffsetFactor: -10
    });
    const circle = new Mesh(geometryCircle, materialCircle);
    parentCone.add(circle);
    circle.rotation.x = -Math.PI / 2;
    circle.translateZ(intersects[0].distance - 0.01);

    GLOBALS.SCENE_FPS.add(parentCone);
    item.cone = parentCone;
}

function pelletUpdate() {

    if (GLOBALS.LEVEL_ENTERED) {

        for (var i = 0; i < window.pellets.length; i++) {

            if (!window.pellets[i].item.userData.isActive) {
                console.log(window.pellets[i].item.userData.isActive)
                continue;
            }

            if (window.pellets[i].body.inTractor)
                continue;

            if (!window.pellets[i].body.started) {
                resetBall(window.pellets[i], true);
            }

            if (window.pellets[i].active) {
                window.pellets[i].position.add(window.pellets[i].body.direction.clone().multiplyScalar(0.06)); //* GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].side
                window.pellets[i].body.position.copy(window.pellets[i].position);
                window.pellets[i].body.previousPosition.copy(window.pellets[i].position)
                window.pellets[i].body.angularVelocity.setZero();
                window.pellets[i].body.velocity.setZero();
                window.pellets[i].body.force.setZero();


                window.pellets[i].position.copy(window.pellets[i].body.position)
                window.pellets[i].quaternion.copy(window.pellets[i].body.quaternion)

                window.pellets[i].body.sound.position.copy(window.pellets[i].body.position);
                window.pellets[i].body.sound.quaternion.copy(window.pellets[i].body.quaternion);
            }

            window.pellets[i].body.started = true;
        }
    }
}

function resetBall(ball, translate) {

    if (!GLOBALS.FPS_MODE)
        return;

    if (translate) {

        play(ball.body.sound.audio);

        ball.visible = false;
        ball.active = false;

        ball.position.copy(ball.origin.position);
        ball.rotation.copy(ball.origin.rotation);

        //ball.body.position.copy(ball.origin.position);
        //ball.body.quaternion.copy(ball.quaternion);

        //ball.body.started = false;
        ball.body.direction = ball.body.originaldirection;

        setTimeout(() => {
            ball.visible = true;
            ball.active = true;
        }, 1000);
    }

    if (!ball.infinity) {
        ball.timeout = setTimeout(() => {
            resetBall(ball, true)
        }, ball.time * 1000);
    }
}

//UI STUFF
$("body").on('input', '#state-pellet-infinity', function () {
    if (this.checked)
        $("#pellet-timer").addClass("disabled");
    else
        $("#pellet-timer").removeClass("disabled");

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.pedestalInfinity = this.checked;
});

$("body").on('input', '#pellet-timer-value', function () {
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.pedestalValue = parseInt(this.value);
});

const geometryHit = new BoxGeometry(0.6, 0.01, 0.6);
const map = new TextureLoader().load('./assets/textures/burn01a.webp');
const instancePelletHit = new InstancedMesh2(geometryHit, new MeshBasicMaterial({
    side: 0,
    map: map,
    transparent: true,
    opacity: 1,
    color: new Color(0, 0, 0),
    polygonOffset: true,
    polygonOffsetFactor: -10
}), { createInstances: true });
instancePelletHit.current = 0;
instancePelletHit.addInstances(1000, (obj, index) => {
    obj.visible = false;
    obj.position.set(100000, 100000, 100000);
});
instancePelletHit.raycastOnlyFrustum = true;
instancePelletHit.computeBVH();
instancePelletHit.instanceMatrix.needsUpdate = true;

function addDecalOnHit(position, orientation, direction) {

    if (!instancePelletHit.parent) {
        GLOBALS.SCENE_FPS.add(instancePelletHit);
    }

    raycaster.set(position, direction);
    var intersects = raycaster.intersectObject(instancePelletHit);

    if (intersects.length > 0)
        return;

    const dummy = new Object3D();
    dummy.scale.set(1, 1, 1)
    dummy.position.copy(position);
    dummy.rotation.set(orientation.x, orientation.y, orientation.z);
    dummy.translateY(-0.01)
    dummy.updateMatrix();
    instancePelletHit.setMatrixAt(instancePelletHit.current, dummy.matrix);
    instancePelletHit.setVisibilityAt(instancePelletHit.current, true);
    instancePelletHit.instanceMatrix.needsUpdate = true;
    instancePelletHit.computeBoundingSphere();

    if (instancePelletHit.current <= 1000)
        instancePelletHit.current += 1;
    else
        instancePelletHit.current = 0;
}

function removePelletHitInstances() {

    GLOBALS.SCENE_FPS.remove(instancePelletHit);

    instancePelletHit.current = 0;
    for (var i = 0; i < instancePelletHit.instances.length; i++) {
        instancePelletHit.instances[i].position.x = 100000;
        instancePelletHit.instances[i].position.y = 100000;
        instancePelletHit.instances[i].position.z = 100000;
        instancePelletHit.instances[i].scale.x = 0;
        instancePelletHit.instances[i].scale.y = 0;
        instancePelletHit.instances[i].scale.z = 0;
        instancePelletHit.instances[i].visible = false;
        instancePelletHit.instances[i].updateMatrix();
    }

    instancePelletHit.instanceMatrix.needsUpdate = true;
    instancePelletHit.computeBoundingSphere();
}

export {
    pelletUpdate,
    addPelletBall,
    resetBall,
    addPelletCatcher,
    removePelletHitInstances
}