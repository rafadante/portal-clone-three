import { Vector3 } from "three";
import { tweenCamera } from "../../Utils.js";
import { GLOBALS } from "../../Globals.js";
import { AUDIO, play } from "../audio/Audio.js";

function tractorBeam() {

    for (let d of GLOBALS.DYNAMIC_OBJECTS) {

        let pos = new Vector3(d.position.x, d.position.y - 1, d.position.z);

        if (d.holding) continue;

        pos.y += 1;

        //TRACTOR BEAM

        for (var j = 0; j < GLOBALS.TRACTOR_BEAM.length; j++) {
            if (GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j]) {

                if (!GLOBALS.TRACTOR_BEAM[j].item.state) {
                    continue;
                }

                if (d.inTractor && d.tractor != j) continue;

                if (!GLOBALS.TRACTOR_BEAM[j].item.opened) {
                    if (d.inTractor) {
                        outOfTheTractor(d, j);
                    }
                } else if (GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].containsPoint(pos)) {
                    var vec = GLOBALS.TRACTOR_BEAM[j].dir;

                    if (d.tractorID != GLOBALS.TRACTOR_BEAM[j].id) {//!d.inTractor

                        if (d.name == "player") {

                            AUDIO.PLAYER_INSIDE_TRACTOR_BEAM.currentTime = 0;
                            play(AUDIO.PLAYER_INSIDE_TRACTOR_BEAM)

                            if (GLOBALS.TRACTOR_BEAM[j].item.reversed)
                                document.getElementById("panel-top").style.backgroundColor = "#ff80004a";
                            else
                                document.getElementById("panel-top").style.backgroundColor = "#0035ff4a";

                            //GLOBALS.MATERIAL_TRACTOR_BEAM.side = 1;
                            //document.getElementById("panel-top").style.background = "";
                            //document.getElementById("panel-top").style.opacity = 1;
                        }

                        d.inTractorPositionY = d.position.clone().y;
                        d.inTractor = true;
                        d.tractor = j;
                        d.tractorID = GLOBALS.TRACTOR_BEAM[j].id;
                        GLOBALS.TRACTOR_BEAM[j].inTractor = true;
                        d.mass = 0;

                        // Velocity
                        d.velocity.setZero();
                        d.initVelocity.setZero();
                        d.angularVelocity.setZero();
                        d.initAngularVelocity.setZero();

                        // Force
                        d.force.setZero();
                        d.torque.setZero();

                        d.allowSleep = false;
                        d.wakeUp();

                        if (!d.inArea) {
                            var center = new Vector3(
                                Math.abs(Math.abs(vec.x) - 1) * GLOBALS.TRACTOR_BEAM[j].position.x +
                                d.position.x * Math.abs(vec.x),
                                Math.abs(Math.abs(vec.y) - 1) * GLOBALS.TRACTOR_BEAM[j].position.y +
                                d.position.y * Math.abs(vec.y),
                                Math.abs(Math.abs(vec.z) - 1) * GLOBALS.TRACTOR_BEAM[j].position.z +
                                d.position.z * Math.abs(vec.z)
                            );

                            tweenCamera(500, d.position, center);
                        }
                    } else {

                        var val = 0.025;
                        if (GLOBALS.TRACTOR_BEAM[j].item.reversed)
                            val = -0.025;

                        pos.add(vec.clone().multiplyScalar(val)); //* GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].side
                        d.position.copy(pos);
                        d.angularVelocity.setZero();
                        d.velocity.setZero();
                    }
                } else {
                    if (d.inTractor && d.tractor == j) {
                        outOfTheTractor(d, j);
                    }
                }
            } else {
                if (d.inTractor && d.tractor == j) {
                    outOfTheTractor(d, j);
                }
            }
        }
    }
}

function outOfTheTractor(d, j) {
    if (d.name == "player") d.mass = 50;
    else d.mass = 5;

    d.inTractor = false;
    GLOBALS.TRACTOR_BEAM[j].inTractor = false;
    d.tractor = null;
    d.tractorID = null;

    if (d.name == "player") {
        document.getElementById("panel-top").style.opacity = 0;
        AUDIO.PLAYER_INSIDE_TRACTOR_BEAM.pause();
    } else {
        d.allowSleep = true;
    }
}

export { tractorBeam }