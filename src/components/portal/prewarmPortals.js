import { CylinderGeometry, Mesh, Plane, Scene, Vector3, WebGLRenderTarget, PointLight } from 'three';
import { getPortalViewMaterial } from './PortalViewMaterial';

export async function prewarmPortals({ renderer, scene, camera, shaders, count, targets, width, height }) {
  const warmScene = new Scene();
  warmScene.environment = scene.environment; warmScene.fog = scene.fog;
  const geometry = new CylinderGeometry(width, width, height);
  for (let i = 0; i < count; i++) {
    const view = new Mesh(geometry, getPortalViewMaterial(renderer, i));
    view.position.copy(camera.position); view.position.z -= 2; view.frustumCulled = false;
    warmScene.add(view);
    if (shaders[i]) {
      const ring = new Mesh(shaders[i].geometry, shaders[i].material);
      ring.position.copy(view.position); ring.frustumCulled = false;
      warmScene.add(ring);
    }
  }
  const target = new WebGLRenderTarget(32, 32, { stencilBuffer: true });
  const saved = { target: renderer.getRenderTarget(), clipping: renderer.clippingPlanes, local: renderer.localClippingEnabled };
  const compile = (objects, lights = scene) => renderer.compileAsync
    ? renderer.compileAsync(objects, camera, lights) : Promise.resolve(renderer.compile(objects, camera, lights));
  // Change renderer state only synchronously: animation frames may run while compilation is awaited.
  const prime = (planes, lights = scene, screenOutput = false) => {
    try {
      renderer.localClippingEnabled = true; renderer.clippingPlanes = planes;
      renderer.setRenderTarget(target);
      renderer.render(warmScene, camera);
      // The screen and portal textures use different output color-space programs.
      if (screenOutput) renderer.setRenderTarget(saved.target);
      const pending = compile(scene, lights);
      return pending;
    } finally {
      renderer.setRenderTarget(saved.target);
      renderer.clippingPlanes = saved.clipping; renderer.localClippingEnabled = saved.local;
    }
  };
  try {
    const { width: pixelsWide, height: pixelsHigh } = renderer.domElement;
    for (const buffer of targets) {
      buffer.setSize(pixelsWide, pixelsHigh);
      renderer.initRenderTarget(buffer);
    }
    await compile(warmScene);
    await prime([], scene, true);
    await prime([]);
    await prime([new Plane(new Vector3(0,0,1), 10000)]);
    // Cooperative portals introduce one then two additional point lights.
    if (count === 4) {
      const lights = scene.clone(false);
      for (let i = 0; i < 2; i++) {
        lights.add(new PointLight(0xffffff, 3, 2));
        await prime([], lights, true);
        await prime([], lights);
        await prime([new Plane(new Vector3(0,0,1), 10000)], lights);
      }
    }
  } finally {
    geometry.dispose(); target.dispose();
    // Materials stay alive and are reused by real portals, preserving compiled programs.
  }
}
