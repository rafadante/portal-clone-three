import {
    Vector3,
    Object3D,
    MeshBasicMaterial,
    Mesh,
    Color,
    SphereGeometry,
    PointLight,
    CylinderGeometry,
    Raycaster,
    CircleGeometry,
    BoxGeometry,
    InstancedMesh,
    TextureLoader
} from 'three';
import { GLOBALS } from '../../Globals';
import * as CANNON from 'cannon';
import $ from 'jquery';
import { respawn } from '../events/states';
import { laserReceiverTrigger } from '../events/events.js';
import { cannonToThreeVector3 } from '../../Utils.js';
import { addPositionalAudio } from '../audio/Audio.js';
import { play } from "../audio/Audio.js";

var pellets = [];
var raycaster = new Raycaster();

function addPelletBall(item) {

    var color = new Color(0, 5, 0);

    if (!item.userData.pedestalInfinity) {
        color = new Color(8, 5, 0);
    }

    var origin = new Object3D();
    origin.position.copy(item.position);
    origin.quaternion.copy(item.quaternion);
    origin.translateY(0.7);

    //
    const geometry = new SphereGeometry(0.1, 8, 4);
    const material = new MeshBasicMaterial({ color: color });
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
    energyBall.add(light)

    const energyBallClone = energyBall.clone();
    energyBallClone.visible = false;
    //GLOBALS.SCENE_FPS.add(energyBallClone);

    //BODY
    var shape = new CANNON.Sphere(0.05);
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
    GLOBALS.CANNON_WORLD.addBody(ball);
    energyBall.body = ball;

    var direction = new Vector3(0, 1, 0).applyQuaternion(ball.quaternion);
    ball.direction = direction;
    ball.originaldirection = direction;
    ball.clone = energyBallClone;
    ball.name = "pellet";
    ball.pellet = energyBall;
    ball.previousDirection = new Vector3(0, 0, 0);

    ball.addEventListener("collide", function (event) {

        if (!event.target.pellet.active)
            return;

        play(event.target.sound.audio);

        if (event.body.name == "wall") {
            addDecalOnHit(cannonToThreeVector3(event.target.position), event.body.wallRotation);
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
                return;
            }
        }

        const contact = event.contact;
        const normal = contact.ni;  // Normal vector of the contact

        // Convert the normal vector to Three.js format if needed
        const threeNormal = new Vector3(normal.x, normal.y, normal.z).negate();

        if (threeNormal.equals(event.target.previousDirection.round()))
            event.target.direction = threeNormal.negate();
        else
            event.target.direction = threeNormal;

        event.target.previousDirection = event.target.direction;
    });

    GLOBALS.DYNAMIC_OBJECTS.push(ball);
    pellets.push(energyBall);

    //
    addPositionalAudio('pelletHit', ball, false, false, false, 20);
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
    circle.translateZ(intersects[0].distance);

    GLOBALS.SCENE_FPS.add(parentCone);
    item.cone = parentCone;
}

var first = true;

function pelletUpdate() {

    if (GLOBALS.LEVEL_ENTERED) {
        for (var i = 0; i < pellets.length; i++) {

            if (pellets[i].body.inTractor)
                continue;

            if (first) {
                resetBall(pellets[i], true)
            }

            if (pellets[i].active) {
                pellets[i].position.add(pellets[i].body.direction.clone().multiplyScalar(0.08)); //* GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].side
                pellets[i].body.position.copy(pellets[i].position);
                pellets[i].body.previousPosition.copy(pellets[i].position)
                pellets[i].body.angularVelocity.setZero();
                pellets[i].body.velocity.setZero();
                pellets[i].body.force.setZero();


                pellets[i].position.copy(pellets[i].body.position)
                pellets[i].quaternion.copy(pellets[i].body.quaternion)

                pellets[i].body.sound.position.copy(pellets[i].body.position);
                pellets[i].body.sound.quaternion.copy(pellets[i].body.quaternion);
            } else {

            }
        }

        first = false;
    } else {
        for (var i = 0; i < pellets.length; i++) {
            pellets[i].body.position.copy(pellets[i].position)
            pellets[i].body.quaternion.copy(pellets[i].quaternion)
        }
    }

}

function resetBall(ball, translate) {

    if (translate) {

        play(ball.body.sound.audio);

        ball.visible = false;
        ball.active = false;

        ball.position.copy(ball.origin.position);
        ball.rotation.copy(ball.origin.rotation);

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
const map = new TextureLoader().load('./assets/textures/burn01a.png');
const instancePelletHit = new InstancedMesh(geometryHit, new MeshBasicMaterial({
    side: 0,
    map: map,
    transparent: true,
    opacity: 1,
    color: new Color(0, 0, 0),
    polygonOffset: true,
    polygonOffsetFactor: -10
}), 100);
instancePelletHit.current = 0;

var dummy = new Object3D();
for (var i = 0; i < 100; i++) {
    dummy.position.set(100000, 100000, 100000);
    dummy.updateMatrix();
    instancePelletHit.setMatrixAt(i, dummy.matrix);
}

instancePelletHit.instanceMatrix.needsUpdate = true;
instancePelletHit.computeBoundingSphere();

function addDecalOnHit(position, orientation) {

    if (!instancePelletHit.parent)
        GLOBALS.SCENE_FPS.add(instancePelletHit);

    const dummy = new Object3D();
    dummy.position.copy(position);
    dummy.rotation.set(orientation.x, orientation.y, orientation.z);
    dummy.updateMatrix();
    instancePelletHit.setMatrixAt(instancePelletHit.current, dummy.matrix);
    instancePelletHit.instanceMatrix.needsUpdate = true;
    instancePelletHit.computeBoundingSphere();

    if (instancePelletHit.current <= 100)
        instancePelletHit.current += 1;
    else
        instancePelletHit.current = 0;
}

export {
    pelletUpdate,
    addPelletBall,
    resetBall,
    addPelletCatcher
}