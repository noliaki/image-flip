import * as Three from 'Three'
import * as Bas from 'Three-bas'

import vertexParameters from './glsl/vertexParameters.vert'
import vertexInit from './glsl//vertexInit.vert'
import vertexPosition from './glsl/vertexPosition.vert'

export default class ImageTransition extends Three.Mesh {
  public material: Three.Material
  public geometry: Three.Geometry
  private textures: Three.Texture[]
  private textureIndex: number

  constructor(texture: Three.Texture, texture2: Three.Texture) {
    const image: any = texture.image
    const width: number = image.width
    const height: number = image.height

    const duration: number = 0.5
    const maxPrefabDelay: number = 0.5

    const plane: Three.PlaneGeometry = new Three.PlaneGeometry(
      width,
      height,
      width,
      height
    )

    Bas.Utils.separateFaces(plane)

    const imageGeo: any = new Bas.ModelBufferGeometry(plane, {
      localizeFaces: true,
      computeCentroids: true
    })
    imageGeo.bufferUvs()

    imageGeo.createAttribute('aAnimation', 2)

    const aPosition = imageGeo.createAttribute(
      'aPosition',
      4,
      (data, index): void => {
        const centroid = imageGeo.centroids[index]

        new Three.Vector4(centroid.x, centroid.y, centroid.z, 0).toArray(data)
      }
    )

    imageGeo.createAttribute('aEndPosition', 4, (data): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Math.random() * -2 + 1
      ).toArray(data)
    })

    imageGeo.createAttribute('aControl0', 4, (data): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Math.random() * -2 + 1
      ).toArray(data)
    })

    imageGeo.createAttribute('aControl1', 4, (data): void => {
      new Three.Vector4(
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Three.Math.randFloatSpread(1000),
        Math.random() * -2 + 1
      ).toArray(data)
    })

    const aDelayDuration = imageGeo.createAttribute(
      'aDelayDuration',
      2,
      (data, index, faceCount): void => {
        if (index) data[0] = ((index % width) / width) * maxPrefabDelay
        data[1] = duration
      }
    )

    console.log(imageGeo)

    for (
      let i: number = 0, len: number = imageGeo.vertexCount;
      i < len;
      i += 2
    ) {
      for (let j: number = 0; j < 3; j++) {
        aDelayDuration.array[i * 2 + j + 0] =
          Math.abs(((i % width) * 2 - width) / width) * maxPrefabDelay
        aDelayDuration.array[i * 2 + j + 1] = duration
      }
    }

    texture.minFilter = Three.LinearFilter

    const material = new Bas.BasicAnimationMaterial({
      side: Three.DoubleSide,
      vertexColors: Three.VertexColors,
      uniforms: {
        uProgress: { type: 'f', value: 0 },
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

    super(imageGeo, material)
    this.frustumCulled = false

    this.material = material
    this.geometry = imageGeo

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

  get progress(): number {
    return (this.material as any).uniforms.uProgress.value
  }

  set progress(time: number) {
    ;(this.material as any).uniforms.uProgress.value = time
  }
}
