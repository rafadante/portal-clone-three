import { Vector3, PlaneGeometry, MeshBasicMaterial, Mesh, TextureLoader, CatmullRomCurve3, BufferGeometry, LineBasicMaterial, Line } from "three";
import { tweenCamera } from "../../Utils.js";
import { GLOBALS } from "../../Globals.js";
import { AUDIO, fadeAudio, play } from "../audio/Audio.js";
import * as CANNON from 'cannon';
import $ from 'jquery';

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

GLOBALS.ITEMS_ADDED.add(GLOBALS.GROUP_LINE_TRAGECTORY);

function faithPlate(plate, body) {

  if (body.holding)
    return;

  if (!plate.launch) {

    plate.sound.audio.currentTime = 0;
    plate.sound.audio.play();

    plate.launch = true;
    setTimeout(() => {
      plate.launch = false;
    }, 150);

    var rotationHolder = plate.item.ToRotate.rotation;

    tweenCamera(200, rotationHolder, new Vector3(Math.PI * 0.7, 0, 0));
    setTimeout(() => {
      tweenCamera(200, rotationHolder, new Vector3(Math.PI / 2, 0, 0));
    }, 200);

    // Velocity
    body.velocity.setZero();
    body.initVelocity.setZero();
    body.angularVelocity.setZero();
    body.initAngularVelocity.setZero();

    // Force
    body.force.setZero();
    body.torque.setZero();

    const targetPos = plate.item.target.position.clone();

    var imp = calculateImpulse(
      new CANNON.Vec3(body.position.x, body.position.y, body.position.z),
      new CANNON.Vec3(targetPos.x, targetPos.y, targetPos.z),
      plate.item.userData.height,
      body.mass,
      body.name
    );
    body.applyImpulse(imp, body.position);
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
    AUDIO.AERIAL.timeout = setTimeout(() => {
      GLOBALS.BLOCK_PLAYER_MOVE = false;
      fadeAudio(AUDIO.AERIAL)
    }, t_total_vertical * 1000);
  }

  return impulse;
}

function targetFaithPlateStart(item) {

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

  const clone = target.clone();
  clone.position.copy(item.position);
  clone.rotation.copy(item.rotation);
  GLOBALS.ITEMS_ADDED.add(clone);

  GLOBALS.FAITH_PLATE_TARGET.target = clone;

  var height = 2;

  if(h)
    height = h;

  /*if (h) {
    height = h;
  } else {
    var height = GLOBALS.FAITH_PLATE_TARGET.position.y + 2;

    if (GLOBALS.FAITH_PLATE_TARGET.position.y < clone.position.y) {
      height = clone.position.y + 2;
    }
  }*/

  //GLOBALS.FAITH_PLATE_TARGET.userData.height = height;
  GLOBALS.FAITH_PLATE_TARGET.userData.targetPos = clone.position;
  GLOBALS.FAITH_PLATE_TARGET.userData.targetRot = clone.rotation;
  GLOBALS.FAITH_PLATE_TARGET.userData.target = clone;

  createCurve(GLOBALS.FAITH_PLATE_TARGET.position, clone.position, height, clone, GLOBALS.FAITH_PLATE_TARGET)

  GLOBALS.FAITH_PLATE_TARGET = null;
}

function createCurve(start, end, height, target, plate) {

  //Find the middle
  const middlePoint = new Vector3().addVectors(start, end).multiplyScalar(0.5);

  if (start.y > end.y)
    middlePoint.y = height + start.y;
  else
    middlePoint.y = height + end.y;

  plate.userData.height = Math.abs(start.y - middlePoint.y)
  plate.userData.heightLine = height;

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
  GLOBALS.GROUP_LINE_TRAGECTORY.add(curveObject);
}

$('#plate-max-height-value').on('change', function () {
  GLOBALS.GROUP_LINE_TRAGECTORY.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.target.line);
  //GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.height = parseInt(this.value);
  createCurve(
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.position,
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.target.position,
    parseInt(this.value),
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.target,
    GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item
  )
});

$('#faith-plate-line').on('change', function () {
  GLOBALS.GROUP_LINE_TRAGECTORY.visible = this.checked;
});

//RESET Target
$('#plate-change-target').on('click', function () {
  GLOBALS.SCENE.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.target);
  GLOBALS.GROUP_LINE_TRAGECTORY.remove(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item.userData.target.line);
  targetFaithPlateStart(GLOBALS.PLANE_USER_DATA[GLOBALS.SELECTED_ID[0]].item);
});

export {
  faithPlate,
  targetFaithPlateStart,
  targetFaithPlateUpdate,
  targetFaithPlateEnd
}