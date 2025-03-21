import {
    MathUtils,Clock
} from 'three';

const minAngle = -Math.PI/4;
const maxAngle = Math.PI/4;
const speed = 0.002;

let clock = new Clock();

function updateTurretRaycast(body) {
    //console.log(position)

    body.laser.position.set(body.position.x, body.position.y, body.position.z)
    body.laser.quaternion.copy(body.quaternion);

    let time = clock.getElapsedTime();
    let t = (Math.sin(time) + 1) / 2; // Normalized value between 0 and 1

    let angle = MathUtils.lerp(minAngle, maxAngle, t); // Interpolates between min and max

    body.laser.children[0].rotation.y = angle;
}

export {
    updateTurretRaycast
}