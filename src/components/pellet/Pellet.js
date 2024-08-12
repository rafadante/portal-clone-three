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
    PlaneGeometry,
    Euler,
    BoxGeometry,
    InstancedMesh,
    TextureLoader
} from 'three';
import { GLOBALS } from '../../Globals';
import * as CANNON from 'cannon';
import $ from 'jquery';
import { respawn } from '../events/states';
import { laserReceiverTrigger } from '../events/events.js';
import { Group } from 'three/examples/jsm/libs/tween.module.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { cannonToThreeVector3 } from '../../Utils.js';

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

        if (event.body.name == "wall") {
            const obj = new Object3D();
            obj.quaternion.copy(event.body.quaternion);
            obj.updateMatrix();

            // The contact position in the world coordinate
            var contactPoint = new CANNON.Vec3();
            event.contact.bi.position.vadd(event.contact.rj, contactPoint)

            //console.log(contactPoint)
            checkRotation(event.contact)
            addDecalOnHit(cannonToThreeVector3(event.target.position), obj.rotation, new Vector3(10, 10, 10));
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

        /*        console.log("--------------------------")
                console.log(threeNormal)
                console.log(event.target.previousDirection.round())*/

        if (threeNormal.equals(event.target.previousDirection.round()))
            event.target.direction = threeNormal.negate();
        else
            event.target.direction = threeNormal;

        event.target.previousDirection = event.target.direction;
    });

    GLOBALS.DYNAMIC_OBJECTS.push(ball);
    pellets.push(energyBall);

    /*if (!item.userData.pedestalInfinity) {
        setTimeout(() => {
            resetBall(energyBall, true)
        }, energyBall.time * 1000);
    }*/
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
        ball.position.copy(ball.origin.position);
        ball.rotation.copy(ball.origin.rotation);
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

const geometryHit = new PlaneGeometry(0.6, 0.6);
const map = new TextureLoader().load('./assets/textures/burn01a.png');
const instancePelletHit = new InstancedMesh(geometryHit, new MeshBasicMaterial({
    side: 1,
    map: map,
    transparent: true,
    opacity: 1,
    color: new Color(0,0,0)
}), 1000);
instancePelletHit.current = 0;


console.log(instancePelletHit)

function addDecalOnHit(position, orientation, size) {

    console.log("-------------------")
    console.log(position)
    console.log(orientation)

    if (!instancePelletHit.parent) {
        GLOBALS.SCENE_FPS.add(instancePelletHit);
    }

    const dummy = new Object3D();
    dummy.position.copy(position);
    dummy.rotation.copy(orientation);
    dummy.updateMatrix();
    instancePelletHit.setMatrixAt(instancePelletHit.current, dummy.matrix);
    instancePelletHit.current += 1;
    instancePelletHit.needsUpdate = true;
    instancePelletHit.computeBoundingBox();
}

function checkRotation(contact) {
    // Get the bodies involved in the collision
    var bodyA = contact.bi;
    var bodyB = contact.bj;

    // Get the rotation quaternion of body A
    var rotationA = bodyA.quaternion;
    console.log('Rotation of body A:', rotationA);

    // Get the rotation quaternion of body B
    var rotationB = bodyB.quaternion;
    console.log('Rotation of body B:', rotationB);

    // If you want the orientation of a particular contact point in the world space:
    var contactPointA = new CANNON.Vec3();
    rotationA.vmult(contact.ri, contactPointA); // Apply rotation to the local contact point on body A
    contactPointA.vadd(bodyA.position, contactPointA); // Convert to world coordinates
    console.log('Contact point on body A in world coordinates:', contactPointA);

    var contactPointB = new CANNON.Vec3();
    rotationB.vmult(contact.rj, contactPointB); // Apply rotation to the local contact point on body B
    contactPointB.vadd(bodyB.position, contactPointB); // Convert to world coordinates
    console.log('Contact point on body B in world coordinates:', contactPointB);
}

export {
    pelletUpdate,
    addPelletBall,
    resetBall,
    addPelletCatcher
}