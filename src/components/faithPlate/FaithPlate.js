import {
  Vector3,
  PlaneGeometry,
  MeshBasicMaterial,
  Mesh,
  TextureLoader,
  Quaternion,
  CatmullRomCurve3,
  BufferGeometry,
  LineBasicMaterial,
  Line
} from "three";
import { tweenCamera } from "../../Utils.js";
import { GLOBALS } from "../../Globals.js";
import { AUDIO, play } from "../audio/Audio.js";
import * as CANNON from 'cannon';
import { vec3 } from "three/examples/jsm/nodes/Nodes.js";
import $ from 'jquery';
import { animate } from "../../Main.js";

//TARGET
const map = new TextureLoader().load('./assets/textures/target.png');

const geometry = new PlaneGeometry(2, 2);
const material = new MeshBasicMaterial({
  map: map,
  transparent: true,
  polygonOffset: true,
  polygonOffsetUnits: -10
});
const target = new Mesh(geometry, material);

var launch = false;

function faithPlate() {

  for (let d of GLOBALS.DYNAMIC_OBJECTS) {

    let pos = new Vector3(d.position.x, d.position.y - 1, d.position.z);

    if (d.holding) continue;

    for (var j = 0; j < GLOBALS.FAITH_PLATE_CONTACT_BOX.length; j++) {
      if (GLOBALS.FAITH_PLATE_CONTACT_BOX[j].containsPoint(pos)) {
        if (!launch) {
          launch = true;
          d.launch = true;

          setTimeout(() => {
            launch = false;
          }, 150);

          var rotationHolder = GLOBALS.FAITH_PLATE_TO_ROTATE[j].rotation;

          tweenCamera(200, rotationHolder, new Vector3(Math.PI * 0.7, 0, 0));
          setTimeout(() => {
            tweenCamera(200, rotationHolder, new Vector3(Math.PI / 2, 0, 0));
          }, 200);

          // Velocity
          d.velocity.setZero();
          d.initVelocity.setZero();
          d.angularVelocity.setZero();
          d.initAngularVelocity.setZero();

          // Force
          d.force.setZero();
          d.torque.setZero();

          const s = 1;

          const targetPos = GLOBALS.FAITH_PLATE_CONTACT_BOX[j].item.target.position.clone();
          targetPos.multiplyScalar(s);

          if (d.name == "player")
            GLOBALS.PLAYER.inJump = true;

          var imp = calculateImpulse(
            new CANNON.Vec3(d.position.x * s, d.position.y * s, d.position.z * s),
            new CANNON.Vec3(targetPos.x, targetPos.y, targetPos.z),
            GLOBALS.FAITH_PLATE_CONTACT_BOX[j].item.userData.height * s,
            d.mass,
            d.name
          );
          d.applyImpulse(imp, d.position);
        }
      }
    }
  }
}

function calculateImpulse(initialPosition, finalPosition, maxHeight, mass, name) {

  const g = 9.81; // gravity

  // Calculate the horizontal distance and direction (ignoring y)
  const direction = new CANNON.Vec3(
    finalPosition.x - initialPosition.x,
    0, // Ignoring y for horizontal direction
    finalPosition.z - initialPosition.z
  );

  // Normalize the direction vector to get unit direction
  direction.normalize();

  const horizontalDistance = Math.sqrt(
    Math.pow(finalPosition.x - initialPosition.x, 2) +
    Math.pow(finalPosition.z - initialPosition.z, 2)
  );

  // Calculate the total vertical displacement
  const totalVerticalDisplacement = finalPosition.y - initialPosition.y;

  // Time to reach max height
  const t_up = Math.sqrt(2 * maxHeight / g);

  // Total time of flight considering the vertical displacement
  const t_total_vertical = t_up + Math.sqrt(2 * (maxHeight - totalVerticalDisplacement) / g);

  // Horizontal velocity needed to cover the distance in time t_total_vertical
  const vx = (horizontalDistance / t_total_vertical) * direction.x;
  const vz = (horizontalDistance / t_total_vertical) * direction.z;

  // Initial vertical velocity to reach max height
  const vy = Math.sqrt(2 * g * maxHeight);

  // Impulse vector with direction
  const impulse = new CANNON.Vec3(
    mass * vx,
    mass * vy,
    mass * vz
  );

  if (name == "player") {
    console.log(t_total_vertical)
    GLOBALS.BLOCK_PLAYER_MOVE = true;
    setTimeout(() => {
      GLOBALS.BLOCK_PLAYER_MOVE = false;
    }, t_total_vertical * 1000);
  }

  return impulse;
}

function targetFaithPlateStart(item) {

  console.log(item)
  GLOBALS.FAITH_PLATE_TARGET = item;

  GLOBALS.CONNECTING = true;
  GLOBALS.MATERIAL_PORTAL_EDITOR.opacity = 0.25;
  GLOBALS.MATERIAL_NON_PORTAL_EDITOR.opacity = 0.25;
  GLOBALS.MATERIAL_PORTAL_EDITOR.transparent = true;
  GLOBALS.MATERIAL_NON_PORTAL_EDITOR.transparent = true;
}

function targetFaithPlateUpdate(target) {
  //ROTATE FAITH PLATE IN THE DIRECTION OF THE TARGET
  const targetPosition = new Vector3(target.position.x, GLOBALS.FAITH_PLATE_TARGET.position.y, target.position.z)
  GLOBALS.FAITH_PLATE_TARGET.lookAt(targetPosition);
}

function targetFaithPlateEnd(item, h) {
  console.log(item);
  const clone = target.clone();
  clone.position.copy(item.position);
  clone.rotation.copy(item.rotation);
  GLOBALS.SCENE.add(clone);

  GLOBALS.FAITH_PLATE_TARGET.target = clone;

  if (h) {
    height = h;
  } else {
    var height = GLOBALS.FAITH_PLATE_TARGET.position.y + 2;

    if (GLOBALS.FAITH_PLATE_TARGET.position.y < clone.position.y) {
      height = clone.position.y + 2;
    }
  }

  console.log(height)


  GLOBALS.FAITH_PLATE_TARGET.userData.height = height;
  GLOBALS.FAITH_PLATE_TARGET.userData.targetPos = clone.position;
  GLOBALS.FAITH_PLATE_TARGET.userData.targetRot = clone.rotation;

  createCurve(GLOBALS.FAITH_PLATE_TARGET.position, clone.position, height, clone)

  GLOBALS.FAITH_PLATE_TARGET = null;
}

function createCurve(start, end, height, target) {

  //Find the middle
  const middlePoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);
  middlePoint.y = height;

  //Create a closed wavey loop
  const curve = new CatmullRomCurve3([
    start,
    middlePoint,
    end
  ]);

  const points = curve.getPoints(50);
  const geometry = new BufferGeometry().setFromPoints(points);

  const material = new LineBasicMaterial({ color: 0xff0000 });

  // Create the final object to add to the scene
  const curveObject = new Line(geometry, material);
  target.line = curveObject;
  GLOBALS.SCENE.add(curveObject);
}

$('#plate-max-height-value').on('change', function () {
  GLOBALS.SCENE.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.target.line);
  GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.height = parseInt(this.value);
  createCurve(
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.position,
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.target.position,
    parseInt(this.value),
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.target
  )

  animate();
});

export {
  faithPlate,
  targetFaithPlateStart,
  targetFaithPlateUpdate,
  targetFaithPlateEnd
}