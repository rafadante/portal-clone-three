function laser() {
    for (var i = 0; i < GLOBALS.LASER_EMITTER_OBJ.length; i++) {
  
      var obj2 = GLOBALS.LASER_EMITTER_OBJ[i];
  
      if (GLOBALS.LASER_EMITTER_OBJ[i].fromCube) {
        obj2 = new THREE.Object3D();
        obj2.position.copy(GLOBALS.LASER_EMITTER_OBJ[i].position);
        obj2.rotation.copy(GLOBALS.LASER_EMITTER_OBJ[i].rotation);
        //obj2.translateY(GLOBALS.LASER_EMITTER_OBJ[i].distance / 2);
        obj2.fromCube = true;
      }
  
      var vector = new THREE.Vector3();
      var raycasterLaser = new THREE.Raycaster();
  
      vector.copy(obj2.position);
  
      let dir = new THREE.Vector3();
      obj2.getWorldDirection(dir);
      dir.normalize();
  
      raycasterLaser.set(vector, dir);
      var intersects = raycasterLaser.intersectObject(GLOBALS.LASER_CUBE);
  
      if (intersects.length > 0) {
        var id = intersects[0].instanceId;
  
        if (obj2.fromCube) {
  
        } else {
          GLOBALS.LASER_EMITTER[i].rotation.set(0, 0, 0);
          GLOBALS.LASER_EMITTER[i].position.set(0, 0, 0);
  
          GLOBALS.LASER_EMITTER[i].geometry.dispose();
          GLOBALS.LASER_EMITTER[i].geometry = new THREE.CylinderGeometry(
            0.02,
            0.02,
            intersects[0].distance,
            32
          );
          GLOBALS.LASER_EMITTER[i].position.copy(obj2.position);
          GLOBALS.LASER_EMITTER[i].translateZ(intersects[0].distance / 2);
  
          GLOBALS.LASER_EMITTER[i].rotation.x = Math.PI / 2;
  
          //----------------------------------------------------
  
          var cube =
            GLOBALS.DYMANIC_ITEMS["laser_cube"][intersects[0].instanceId];
          yyy = cube;
  
          var vector = new THREE.Vector3();
          var raycasterLaser = new THREE.Raycaster();
  
          vector.copy(cube.position);
  
          let dir = new THREE.Vector3();
          cube.getWorldDirection(dir);
          dir.normalize();
  
          raycasterLaser.set(vector, dir);
          var intersects = raycasterLaser.intersectObject(
            GLOBALS.PLANE_LEVEL_INSTANCED
          );
  
          if (intersects.length > 0) {
            const geometry = new THREE.CylinderGeometry(
              0.02,
              0.02,
              intersects[0].distance,
              32
            );
  
            if (!cube.laser) {
              const plane = new THREE.Mesh(
                geometry,
                GLOBALS.LASER_EMITTER[i].material
              ); //materialBridge
              GLOBALS.SCENE_CHILDREN.add(plane);
  
              cube.laser = true;
              cube.plane = plane;
            } else {
              cube.plane.rotation.set(0, 0, 0);
              cube.plane.position.set(0, 0, 0);
  
              cube.plane.geometry.dispose();
              cube.plane.geometry = new THREE.CylinderGeometry(
                0.02,
                0.02,
                intersects[0].distance,
                32
              );
  
              if (GLOBALS.HOLDING_ITEM && GLOBALS.CURRENT_ITEM_ID == id)
                cube.plane.position.copy(cube.position);
              else cube.plane.position.copy(cube.body.position);
              cube.plane.rotation.x += Math.PI / 2;
              cube.plane.rotation.z = -cube.rotation.y;
              cube.plane.distance = intersects[0].distance;
              cube.plane.translateY(-intersects[0].distance / 2);
            }
          } else {
          }
        }
      } else {
        if (GLOBALS.LASER_EMITTER[i]) {
          GLOBALS.LASER_EMITTER[i].rotation.set(0, 0, 0);
          GLOBALS.LASER_EMITTER[i].position.set(0, 0, 0);
  
          GLOBALS.LASER_EMITTER[i].geometry.dispose();
          GLOBALS.LASER_EMITTER[i].geometry = new THREE.CylinderGeometry(
            0.02,
            0.02,
            GLOBALS.LASER_EMITTER_OBJ[i].distance,
            32
          );
          GLOBALS.LASER_EMITTER[i].position.copy(
            GLOBALS.LASER_EMITTER_OBJ[i].position
          );
          GLOBALS.LASER_EMITTER[i].translateZ(
            GLOBALS.LASER_EMITTER_OBJ[i].distance / 2
          );
  
          GLOBALS.LASER_EMITTER[i].rotation.x = Math.PI / 2;
        }
  
        if (yyy) {
          if (yyy.laser) {
            GLOBALS.SCENE_CHILDREN.remove(yyy.plane);
            yyy.laser = false;
          }
        }
      }
    }
  }