import * as Three from 'three'
import * as Bas from 'three-bas'

import vertexParameters from './glsl/vertexParameters.vert'
import vertexInit from './glsl/vertexInit.vert'
import vertexPosition from './glsl/vertexPosition.vert'

import { Position } from './StringToImageData'

export default class Particle extends Three.Mesh {
  public material: any
  public endPosition: any
  private count: number
  public geometry: any

  constructor({ count = 200000 } = {}) {
    const duration: number = 0.5
    const maxDelay: number = 0.5
    const prefabGeometry = new Three.PlaneGeometry()
    const geometry = new Bas.PrefabBufferGeometry(prefabGeometry, count)

    geometry.createAttribute('aStagger', 4, (data, index, sizeCount): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(360),
        Three.Math.randFloat(
          Three.Math.randFloat(-800, -300),
          Three.Math.randFloat(300, 800)
        ),
        index / sizeCount,
        Three.Math.randFloatSpread(300)
      ).toArray(data)
    })

    geometry.createAttribute('aDelayDuration', 2, (data): void => {
      data[0] = Math.random() * maxDelay
      data[1] = duration
    })

    geometry.createAttribute('aScale', 4, (data): void => {
      new Three.Vector4(
        Math.random() * 20 + 5,
        Three.Math.randFloat(10, 50),
        Math.random(),
        Three.Math.randFloat(1, 5)
      ).toArray(data)
    })

    geometry.createAttribute('aStartPosition', 3, (data): void => {
      const position = getRandomPointOnSphere(Math.random() * 5000)

      new Three.Vector3(position.x, position.y, position.z).toArray(data)
    })

    const aEndPosition = geometry.createAttribute(
      'aEndPosition',
      3,
      (data): void => {
        new Three.Vector3(
          Three.Math.randFloatSpread(1000),
          Three.Math.randFloatSpread(1000),
          0
        ).toArray(data)
      }
    )

    geometry.createAttribute('aAxisAngle', 4, (data): void => {
      const vec3: Three.Vector3 = new Three.Vector3(
        Three.Math.randFloatSpread(1),
        Three.Math.randFloatSpread(1),
        Three.Math.randFloatSpread(1)
      )
      vec3.normalize().toArray(data)
      data[3] = Math.random() * 360
    })

    const material = new Bas.StandardAnimationMaterial({
      side: Three.DoubleSide,
      flatShading: true,
      vertexColors: Three.VertexColors,
      uniforms: {
        uTime: { type: 'f', value: 0 },
        uProgress: { type: 'f', value: 0 },
        uLoudness: { type: 'f', value: 0 }
      },
      vertexFunctions: [
        Bas.ShaderChunk.ease_circ_in_out,
        Bas.ShaderChunk.ease_elastic_in_out,
        Bas.ShaderChunk.ease_quad_out,
        Bas.ShaderChunk.quaternion_rotation
      ],
      vertexParameters,
      vertexInit,
      vertexNormal: [],
      vertexPosition,
      vertexColor: ['vColor = color;']
    })

    super(geometry, material)
    this.frustumCulled = false
    this.material = material
    this.geometry = geometry
    this.count = count
    this.endPosition = aEndPosition
  }

  get time() {
    return this.material.uniforms.uTime.value
  }

  set time(time: number) {
    this.material.uniforms.uTime.value = time
  }

  get progress() {
    return this.material.uniforms.uProgress.value
  }

  set progress(progress: number) {
    this.material.uniforms.uProgress.value = progress
  }

  set loudness(loudness: number) {
    this.material.uniforms.uLoudness.value = loudness
  }

  setEndPosition(position: Position[], width: number, height: number): void {
    const ratio: number = height / width
    const positionLen: number = position.length
    const len: number = this.count
    const size: number = 2000

    for (let i: number = 0; i < len; i++) {
      const index: number = i % positionLen

      this.geometry.setPrefabData('aEndPosition', i, [
        position[index].x * size,
        position[index].y * (size * ratio),
        0
      ])
    }

    this.endPosition.needsUpdate = true
  }
}

function getRandomPointOnSphere(
  r: number
): { x: number; y: number; z: number } {
  const u: number = Three.Math.randFloat(0, 1)
  const v: number = Three.Math.randFloat(0, 1)
  const theta: number = 2 * Math.PI * u
  const phi: number = Math.acos(2 * v - 1)
  const x: number = r * Math.sin(theta) * Math.sin(phi)
  const y: number = r * Math.cos(theta) * Math.sin(phi)
  const z: number = r * Math.cos(phi)

  return {
    x,
    y,
    z
  }
}
