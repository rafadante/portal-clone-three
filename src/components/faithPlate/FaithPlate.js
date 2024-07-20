var launch = false;

function tractorBeam() {
  var hh = 0;

  for (let d of GLOBALS.DYNAMIC_OBJECTS) {
    let pos = new THREE.Vector3(d.position.x, d.position.y - 1, d.position.z);

    hh++;

    if (d.holding) continue;

    //FAITH PLATE

    for (var j = 0; j < GLOBALS.FAITH_PLATE_CONTACT_BOX.length; j++) {
      if (GLOBALS.FAITH_PLATE_CONTACT_BOX[j].containsPoint(pos)) {
        if (!launch) {
          launch = true;
          d.launch = true;

          setTimeout(() => {
            launch = false;
          }, 150);

          var ff = GLOBALS.FAITH_PLATE_TO_ROTATE[j];

          tweenCamera(200, ff.rotation, new THREE.Vector3(Math.PI * 0.7, 0, 0));
          setTimeout(() => {
            tweenCamera(200, ff.rotation, new THREE.Vector3(Math.PI / 2, 0, 0));
          }, 200);

          // Position
          d.previousPosition.setZero();
          d.interpolatedPosition.setZero();
          d.initPosition.setZero();

          // Velocity
          d.velocity.setZero();
          d.initVelocity.setZero();
          d.angularVelocity.setZero();
          d.initAngularVelocity.setZero();

          // Force
          d.force.setZero();
          d.torque.setZero();

          d.position.x = GLOBALS.FAITH_PLATE_CONTACT_BOX[j].position.x;
          d.position.z = GLOBALS.FAITH_PLATE_CONTACT_BOX[j].position.z;

          var up;
          var f;

          var up = new THREE.Vector3();
          GLOBALS.FAITH_PLATE_CONTACT_BOX[j].item.getWorldDirection(up);
          up.y = 1;
          up.x *= 0.55;
          up.z *= 0.55;

          if (d.name == "player") f = 53000;
          else {
            if (up.z == -0.55) f = 4325;
            else f = 4300;
          }

          if (up.x == -0.55) {
            //f = 70000;
            up.x = -1.2;
            up.y = 1.2;
          }

          d.applyImpulse(up.clone().multiplyScalar((f * 1) / 60), d.position);

          const initialPosition = new CANNON.Vec3(-15, 0, 21);

          // Set the desired final position
          const finalPosition = new CANNON.Vec3(-15, 0, -3);

          // Set the desired maximum height
          const maxHeight = 2; // meters

          // Set the gravitational acceleration
          const gravity = new CANNON.Vec3(0, -9.8, 0);

          // Calculate the required initial velocity to reach the desired maximum height
          const initialVelocity = Math.sqrt(2 * maxHeight * gravity.length());

          // Calculate the time of flight to reach the desired final position
          const timeToReachDestination = Math.sqrt(
            (2 * Math.abs(finalPosition.z - initialPosition.z)) /
            gravity.length()
          );

          // Calculate the required constant force to achieve the desired initial velocity
          const requiredForce = new CANNON.Vec3();
          gravity.scale(d.mass, requiredForce);
          requiredForce.scale(
            initialVelocity / timeToReachDestination,
            requiredForce
          );
        }
      }
    }

    pos.y += 1;

    //TRACTOR BEAM

    for (var j = 0; j < GLOBALS.TRACTOR_BEAM.length; j++) {
      if (GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j]) {
        if (d.inTractor && d.tractor != j) continue;


        if (!GLOBALS.TRACTOR_BEAM[j].item.opened) {

          if (d.inTractor) {
            if (d.name == "player") d.mass = 50;
            else d.mass = 5;

            d.inTractor = false;
            GLOBALS.TRACTOR_BEAM[j].inTractor = false;
            d.tractor = null;
            d.wakeUp()

            if (d.name == "player")
              GLOBALS.MATERIAL_TRACTOR_BEAM.side = 0;
          }

        } else if (GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].containsPoint(pos)) {
          var vec = new THREE.Vector3(0, 0, 1);
          //GLOBALS.TRACTOR_BEAM[j].getWorldDirection(vec);

          if (!d.inTractor) {

            if (d.name == "player")
              GLOBALS.MATERIAL_TRACTOR_BEAM.side = 1;

            d.inTractorPositionY = d.position.clone().y;
            d.inTractor = true;
            d.tractor = j;
            GLOBALS.TRACTOR_BEAM[j].inTractor = true;
            aa = true;
            d.mass = 0;

            // Velocity
            d.velocity.setZero();
            d.initVelocity.setZero();
            d.angularVelocity.setZero();
            d.initAngularVelocity.setZero();

            // Force
            d.force.setZero();
            d.torque.setZero();

            if (!d.inArea) {
              var center = new THREE.Vector3(
                Math.abs(vec.x - 1) * GLOBALS.TRACTOR_BEAM[j].position.x +
                d.position.x * vec.x,
                Math.abs(vec.y - 1) * GLOBALS.TRACTOR_BEAM[j].position.y +
                d.position.y * vec.y,
                Math.abs(vec.z - 1) * GLOBALS.TRACTOR_BEAM[j].position.z +
                d.position.z * vec.z
              );

              tweenCamera(500, d.position, center);
            }
          } else {
            pos.add(vec.clone().multiplyScalar(0.025)); //* GLOBALS.TRACTOR_BEAM_BOUNDING_BOX[j].side
            d.position.copy(pos);
            d.angularVelocity.setZero();
            d.velocity.setZero();
          }
        } else {
          if (d.inTractor && d.tractor == j) {
            //&& GLOBALS.TRACTOR_BEAM[j].inTractor
            if (d.name == "player") d.mass = 50;
            else d.mass = 5;

            d.inTractor = false;
            GLOBALS.TRACTOR_BEAM[j].inTractor = false;
            d.tractor = null;

            if (d.name == "player")
              GLOBALS.MATERIAL_TRACTOR_BEAM.side = 0;
          }
        }
      } else {
        if (d.inTractor && d.tractor == j) {
          //&& GLOBALS.TRACTOR_BEAM[j].inTractor
          if (d.name == "player") d.mass = 50;
          else d.mass = 5;

          d.inTractor = false;
          GLOBALS.TRACTOR_BEAM[j].inTractor = false;
          d.tractor = null;

          if (d.name == "player")
            GLOBALS.MATERIAL_TRACTOR_BEAM.side = 0;
        }
      }
    }
  }
}