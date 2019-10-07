import * as Three from 'three'
import * as Bas from 'three-bas'

import vertexParameters from './glsl/Points/vertexParameters.vert'
import vertexInit from './glsl/Points/vertexInit.vert'
import vertexPosition from './glsl/Points/vertexPosition.vert'
import vertexColor from './glsl/Points/vertexColor.vert'
import fragmentShape from './glsl/Points/fragmentShape.frag'

import { PointData } from './helper'

export default class Point extends Three.Points {
  public aEndPos: any
  public aEndColor: any
  public material: any
  public count: number
  public scaleOffset: number

  constructor(count: number = 20000) {
    const radius: number = 700

    const geometry = new Bas.PointBufferGeometry(count)

    geometry.createAttribute('aStartPos', 3, data => {
      const startVec3: Three.Vector3 = new Three.Vector3()
      const randSphere: {
        x: number
        y: number
        z: number
      } = getRandomPointOnSphere(radius)
      startVec3.x = randSphere.x
      startVec3.y = randSphere.y
      startVec3.z = randSphere.z
      startVec3.toArray(data)
    })

    const color: Three.Color = new Three.Color()

    geometry.createAttribute('aStartColor', 3, (data, index, count) => {
      const h: number = index / count
      const s: number = Three.Math.randFloat(0.4, 0.6)
      const l: number = Three.Math.randFloat(0.4, 0.6)

      color.setHSL(h, s, l)
      color.toArray(data)
    })

    const aEndPos = geometry.createAttribute('aEndPos', 3)
    const aEndColor = geometry.createAttribute('aEndColor', 3)

    for (let i: number = 0; i < count; i++) {
      aEndPos.array[i * 3 + 0] = 0
      aEndPos.array[i * 3 + 1] = 0
      aEndPos.array[i * 3 + 2] = 0

      aEndColor.array[i * 3 + 0] = 0
      aEndColor.array[i * 3 + 1] = 0
      aEndColor.array[i * 3 + 2] = 0
    }

    const duration: number = 1
    const maxPointDelay: number = 0.3

    geometry.createAttribute('aDelayDuration', 3, (data, index, num) => {
      for (var i = 0; i < num; i++) {
        data[0] = Math.random() * maxPointDelay
        data[1] = duration
      }
    })

    const material = new Bas.PointsAnimationMaterial({
      transparent: true,
      blending: Three.AdditiveBlending,
      vertexColors: Three.VertexColors,
      depthWrite: false,
      uniforms: {
        uTime: { type: 'f', value: 0 }
      },
      uniformValues: {
        size: 5.0,
        sizeAttenuation: true
      },
      vertexFunctions: [Bas.ShaderChunk.ease_expo_in_out],
      vertexParameters,
      vertexInit,
      vertexPosition,
      vertexColor,
      fragmentShape
    })

    super(geometry, material)

    this.frustumCulled = false
    this.count = count
    this.material = material
    this.aEndPos = aEndPos
    this.aEndColor = aEndColor
    this.scaleOffset = 1000
  }

  get time(): number {
    return this.material.uniforms.uTime.value
  }

  set time(val: number) {
    this.material.uniforms.uTime.value = val
  }

  setEndPointData(pointData: PointData[]): void {
    for (let i: number = 0, len: number = this.count; i < len; i++) {
      const data: PointData | undefined = pointData[i]

      if (data) {
        this.aEndPos.array[i * 3 + 0] = data.x * this.scaleOffset
        this.aEndPos.array[i * 3 + 1] = data.y * this.scaleOffset
        this.aEndPos.array[i * 3 + 2] = data.z * this.scaleOffset

        this.aEndColor.array[i * 3 + 0] = data.r
        this.aEndColor.array[i * 3 + 1] = data.g
        this.aEndColor.array[i * 3 + 2] = data.b
      } else {
        this.aEndPos.array[i * 3 + 0] = 0
        this.aEndPos.array[i * 3 + 1] = 0
        this.aEndPos.array[i * 3 + 2] = 0

        this.aEndColor.array[i * 3 + 0] = 0
        this.aEndColor.array[i * 3 + 1] = 0
        this.aEndColor.array[i * 3 + 2] = 0
      }
    }

    this.aEndPos.needsUpdate = true
    this.aEndColor.needsUpdate = true
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
