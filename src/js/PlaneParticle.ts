import * as Three from 'Three'
import * as Bas from 'Three-bas'

import vertexParameters from './glsl/ImageTransition/vertexParameters.vert'
import vertexInit from './glsl/ImageTransition//vertexInit.vert'
import vertexPosition from './glsl/ImageTransition/vertexPosition.vert'

export default class PlainParticle extends Three.Mesh {
  public material: Three.Material
  public geometry: Three.Geometry
  private textures: Three.Texture[]
  private textureIndex: number

  constructor({ width = 1000, height = 1000 }) {
    const duration: number = 1.0
    const maxPrefabDelay: number = 0.5

    const plane: Three.PlaneGeometry = new Three.PlaneGeometry(
      width,
      height,
      width,
      height
    )

    Bas.Utils.separateFaces(plane)

    const geometry: any = new Bas.ModelBufferGeometry(plane, {
      localizeFaces: true,
      computeCentroids: true
    })
    geometry.bufferUvs()

    geometry.createAttribute('aAnimation', 2)
    geometry.createAttribute('aPosition', 4, (data, index): void => {
      const centroid = geometry.centroids[index]

      new Three.Vector4(
        centroid.x,
        centroid.y,
        centroid.z,
        Math.random() * -2 + 1
      ).toArray(data)
    })

    geometry.createAttribute('aEndPosition', 4, (data): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Math.random() * -2 + 1
      ).toArray(data)
    })

    geometry.createAttribute('aControl0', 4, (data): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Math.random() * -2 + 1
      ).toArray(data)
    })

    geometry.createAttribute('aControl1', 4, (data): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Math.random() * -2 + 1
      ).toArray(data)
    })

    geometry.createAttribute(
      'aDelayDuration',
      4,
      (data, index, faceCount): void => {
        if (index === 5) {
          console.log(data, faceCount)
        }

        new Three.Vector4(
          (index / faceCount) * maxPrefabDelay,
          duration
        ).toArray(data)
      }
    )

    const material = new Bas.BasicAnimationMaterial({
      side: Three.DoubleSide,
      vertexColors: Three.VertexColors,
      uniforms: {
        uTime: { type: 'f', value: 0 },
        uSize: { type: 'vf2', value: [width, height] },
        map: { type: 't', value: texture },
        map2: { type: 't', value: texture2 }
      },
      vertexFunctions: [
        Bas.ShaderChunk.cubic_bezier,
        Bas.ShaderChunk.ease_quad_in_out,
        Bas.ShaderChunk.quaternion_rotation
      ],
      vertexParameters,
      vertexInit,
      vertexPosition,
      vertexColor: ['vColor = vec3(texelColor);']
    })
    material.uniforms.map.value.needsUpdate = true
    material.uniforms.map2.value.needsUpdate = true

    super(geometry, material)
    this.frustumCulled = false

    this.material = material
    this.geometry = geometry

    this.textures = []
    this.textures.push(texture)
    this.textures.push(texture2)

    this.textureIndex = 0
  }

  getCentroidPoint(centroid: any): Three.Vector3 {
    const temp: Three.Vector3 = new Three.Vector3()
    const signY: number = Math.sign(centroid.y)

    temp.x = Three.Math.randFloat(0.3, 0.6) * 50
    temp.y = signY * Three.Math.randFloat(0.3, 0.6) * 70
    temp.z = Three.Math.randFloatSpread(20)

    return temp
  }

  setTexture(texture: Three.Texture): void {
    console.log((this.material as any).uniforms.map)
    ;(this.material as any).uniforms.map.value.image = texture
    ;(this.material as any).uniforms.map.value.needsUpdate = true
  }

  get time(): number {
    return (this.material as any).uniforms.uTime.value
  }

  set time(time: number) {
    ;(this.material as any).uniforms.uTime.value = time
  }
}
