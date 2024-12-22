import * as THREE from 'three'
import { createElement } from 'react'
import { extend, createRoot, flushGlobalEffects } from '@react-three/fiber'
import { Perf as R3FPerf } from 'r3f-perf'

export class Perf {
  constructor(renderer, scene, camera) {
    extend(THREE)
    createRoot(renderer.domElement)
      .configure({
        frameloop: 'never',
        gl: renderer,
        camera,
        scene
      })
      .render(createElement(R3FPerf))
  }

  start(timestamp) {
    flushGlobalEffects('before', timestamp)
  }
  end(timestamp) {
    flushGlobalEffects('after', timestamp)
  }
}
