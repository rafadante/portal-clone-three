import {
    Vector3,
    Vector4
} from 'three';
import { GLOBALS } from "./Globals";
import $ from 'jquery';
import {
    TWEEN
} from './Tween.js';
import * as CANNON from "cannon";

function getPlaneByName(name) {
    return GLOBALS.PLANE_USER_DATA.filter(
        function (data) {
            return data.name == name
        }
    );
}

function warning(text) {
    $("#warning span").text(text);
    $("#warning").css("opacity", 1);
    setTimeout(() => {
        $("#warning").css("opacity", 0);
    }, 2000);
}

function groupByPercentage(users, percentages) {
    // Get percentage for 1 user:
    let unit = 100 / users.length;
    // Sort percentages by decreasing remainder (modulo unit) 
    //   and get number of units covered by each percentage
    let sorted = percentages.map((p, i) => [i, Math.floor(p / unit), p % unit])
        .sort((a, b) => b[2] - a[2]);
    // Get how many units are not yet distributed:
    let remain = users.length - sorted.reduce((sum, a) => sum += a[1], 0);
    // Distribute those, giving priority to groups where the remainders are greatest
    for (let i = 0; i < remain; i++) sorted[i][1]++;
    // Build and return the chunks by filling the groups in their 
    //    original order
    let i = 0;
    return sorted.sort((a, b) => a[0] - b[0]).map(a => users.slice(i, i += a[1]));
}

function shuffle(array) {
    var array = array.slice(0);
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array
}

function tweenCamera(duration, ini, final) {
    new TWEEN.Tween(ini).to(final, duration)
        //.easing(TWEEN.Easing.Quadratic.Out)
        .start();
}

function hideMaterial(obj, transparent, opacity) {
    obj.traverse(c => {
        if (c.material) {
            c.material.transparent = transparent;
            c.material.opacity = opacity;
            c.material.colorWrite = !transparent;
            c.material.depthWrite = !transparent;
        }
    })
}

function threeToCannonVector3(v3) {
    return new CANNON.Vec3().copy(v3)
}

function cannonToThreeVector3(v3) {
    return new Vector3().copy(v3)
}

// convert vector3 to vector4
function threeToFour(v) {
    return new Vector4(v.x, v.y, v.z, 1)
}

function fourToThree(v) {
    return new Vector3(v.x, v.y, v.z).multiplyScalar(1 / v.w)
}

export {
    getPlaneByName,
    warning,
    groupByPercentage,
    shuffle,
    tweenCamera,
    hideMaterial,
    threeToCannonVector3,
    cannonToThreeVector3,
    threeToFour,
    fourToThree
}