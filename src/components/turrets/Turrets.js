import {
    MathUtils, Vector3, Quaternion,
    Object3D
} from 'three';
import { GLOBALS } from '../../Globals';
import $ from 'jquery';

function updateTurretRaycast(body) {

    if (!body.laser)
        return;

    const holder = new Object3D();
    holder.position.copy(body.position);
    holder.quaternion.copy(body.quaternion);
    holder.translateZ(-0.1);

    body.laser.position.copy(holder.position)
    //body.laser.quaternion.copy(body.quaternion);

    //body.laser.translateZ(-0.1)

    if (isPlayerInVision(GLOBALS.PLAYER, body, 90, 10)) {

        if (!body.inVision && !body.picked) {
            playTurretVoice(body, array_found, false);

            body.fireTimeout = setTimeout(() => {
                //playTurretVoice(body, array_fire, true);
            }, 2000);
        }

        body.inVision = true;
        //console.log("Player detected!");

        const laserPos = new Vector3();
        const playerPos = new Vector3(GLOBALS.PLAYER.position.x, GLOBALS.PLAYER.position.y, GLOBALS.PLAYER.position.z);

        body.laser.getWorldPosition(laserPos); // Get world position of the laser pivot

        // Compute direction from laser to player
        const direction = new Vector3().subVectors(playerPos, laserPos).normalize();

        // Create a quaternion to rotate the laser group to face the player
        const quaternion = new Quaternion();
        quaternion.setFromUnitVectors(new Vector3(0, 1, 0), direction); // Assuming cylinder is aligned along Y

        // Apply the rotation to the group
        body.laser.quaternion.slerp(quaternion, 0.1); // Adjust 0.1 for smooth tracking
    } else {

        if (body.inVision && !body.picked) {
            clearTimeout(body.fireTimeout)
            playTurretVoice(body, array_lost, false);
        }

        body.inVision = false;
        holder.rotateX(-Math.PI / 2);
        body.laser.quaternion.slerp(holder.quaternion, 0.1); // Adjust 0.1 for smooth tracking
    }
}

function isPlayerInVision(player, enemy, fovAngle, maxDistance) {
    const enemyPos = enemy.position;
    const playerPos = player.position;

    // Vector from enemy to player
    const toPlayer = new Vector3().subVectors(playerPos, enemyPos);
    const distance = toPlayer.length();

    // Check if player is within range
    if (distance > maxDistance) return false;

    // Normalize vectors
    toPlayer.normalize();

    // Get enemy's forward direction
    const forward = new Vector3(0, 0, -1); // Assuming the enemy faces -Z
    forward.applyQuaternion(enemy.quaternion); // Rotate forward vector by enemy rotation

    // Compute dot product
    const dot = forward.dot(toPlayer);

    // Convert FOV angle to dot product range (-1 to 1)
    const angleThreshold = Math.cos(MathUtils.degToRad(fovAngle / 2));

    // If dot product is greater than threshold, player is inside the cone
    return dot > angleThreshold;
}

$("body").on('input', '#turrets-rotation-value', function () {
    var instanced = GLOBALS.ITEMS_ADDED.getObjectByName(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].instancedName);

    var dummy = new Object3D();
    dummy.position.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.position);
    dummy.rotation.copy(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.rotation);

    dummy.rotation.y = $(this).val() * (Math.PI / 180)
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.rotationY = dummy.rotation.y;

    dummy.updateMatrix();
    instanced.setMatrixAt(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.id, dummy.matrix)

    instanced.instanceMatrix.needsUpdate = true;
    instanced.computeBoundingSphere();

    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.rotation.copy(dummy.rotation);
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.cone.rotation.y = dummy.rotation.y;
});

var array_found = [
    new Audio("./audio/turrets/found/Turret_turret_active_1.wav"),
    new Audio("./audio/turrets/found/Turret_turret_active_2.wav"),
    new Audio("./audio/turrets/found/Turret_turret_active_4.wav"),
    new Audio("./audio/turrets/found/Turret_turret_active_5.wav"),
    new Audio("./audio/turrets/found/Turret_turret_active_6.wav"),
    new Audio("./audio/turrets/found/Turret_turret_active_7.wav"),
    new Audio("./audio/turrets/found/Turret_turret_active_8.wav"),
];

var array_lost = [
    new Audio("./audio/turrets/lost/Turret_turret_search_1.wav"),
    new Audio("./audio/turrets/lost/Turret_turret_search_2.wav"),
    new Audio("./audio/turrets/lost/Turret_turret_search_4.wav"),
];

var array_picked = [
    new Audio("./audio/turrets/picked/Turret_turret_pickup_1.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_3.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_4.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_6.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_7.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_8.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_9.wav"),
    new Audio("./audio/turrets/picked/Turret_turret_pickup_10.wav")
];

var array_launched = [
    new Audio("./audio/turrets/being-launched into-the-air/Turret_turretlaunched01.wav"),
    new Audio("./audio/turrets/being-launched into-the-air/Turret_turretlaunched04.wav"),
    new Audio("./audio/turrets/being-launched into-the-air/Turret_turretlaunched08.wav"),
    new Audio("./audio/turrets/being-launched into-the-air/Turret_turretlaunched11.wav"),
]

var array_desintegrated = [
    new Audio("./audio/turrets/disintegrated/Turret_turret_fizzler_1.wav")
];

var array_fire = [
    new Audio("./audio/turrets/fire/Turret_turret_fire_4x_03.wav")
];

function turretPicked(body) {
    body.picked = true;
    playTurretVoice(body, array_picked, false)
}

function turretDesintegrated(body) {
    playTurretVoice(body, array_desintegrated, false);
}

function turretLaunched(body) {
    playTurretVoice(body, array_launched, false);
}

function playTurretVoice(body, array, loop) {
    body.sound.audio.pause();
    body.sound.audio = array[getRandomInt(0, array.length - 1)];
    body.sound.audio.loop = loop;
    body.sound.audio.play();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export {
    updateTurretRaycast,
    turretPicked,
    turretDesintegrated,
    turretLaunched
}