const TEXTURE_SRC =
  'https://images.unsplash.com/photo-1430285561322-7808604715df?ixlib=rb-0.3.5&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=800&fit=max&s=2d4e47f48070250751370813eb97df80' // https://unsplash.com/photos/pmhdkgRCbtE

function init(texture) {
  const image = texture.image
  const width = image.width
  const height = image.height

  const root = new THREERoot({
    cameraPosition: [0, 0, width * 1.5]
  })

  const plane = new THREE.PlaneGeometry(
    width,
    height,
    width * 0.5,
    height * 0.5
  )
  BAS.Utils.separateFaces(plane)
  const geometry = new BAS.ModelBufferGeometry(plane, {
    localizeFaces: true,
    computeCentroids: true
  })
  geometry.bufferUVs()

  const aPosition = geometry.createAttribute('aPosition', 4, (data, index) => {
    const centroid = geometry.centroids[index]
    new THREE.Vector4(
      centroid.x,
      centroid.y,
      centroid.z,
      Math.random()
    ).toArray(data)
  })

  texture.minFilter = THREE.LinearFilter

  const material = new BAS.BasicAnimationMaterial({
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { type: 'f', value: 0 },
      uSize: { type: 'vf2', value: [width, height] }
    },
    uniformValues: {
      map: texture
    },
    vertexFunctions: [
      BAS.ShaderChunk['quaternion_rotation'],
      BAS.ShaderChunk['ease_sine_out']
    ],
    vertexParameters: [
      'uniform float uTime;',
      'uniform vec2 uSize;',
      'uniform sampler2D map;',
      'attribute vec4 aPosition;',
      'const float interval = 5.;',
      'const float delay = 1.;',
      'const float speed = 5.25;',
      'const float upSpeed = 2.63;'
    ],
    vertexInit: [
      'float tSpeed = uSize.x * speed;',
      'float tUpSpeed = uSize.y * upSpeed;',
      'vec4 texelColor = texture2D(map, (aPosition.xy + uSize / 2.) / uSize);',
      'float progress = max(mod(uTime / 50., interval + delay) - delay, 0.);',
      'float colorAvg = texelColor.r * texelColor.g * texelColor.b;',
      'float target = step(1., step(colorAvg, 0.69) + step(aPosition.y, uSize.y * 0.206) * step(abs(aPosition.x), uSize.x * 0.275));',
      // rotate
      'vec4 rotate = quatFromAxisAngle(vec3(aPosition.w * target), target * PI * 4. * aPosition.w * pow(colorAvg + 1., 5.) * progress);',
      // position
      'float distance = target * pow(colorAvg + 0.2, 2.) * progress * tSpeed;',
      'float fall = target * pow(progress, 2.) * 4.9 * pow(1. - colorAvg, 10.) * 6.;',
      'float rise = target * step(0.1, (1. - texelColor.r) * (1. - texelColor.g) * texelColor.b) * tUpSpeed * progress;'
    ],
    vertexPosition: [
      // rotate
      'transformed = rotateVector(rotate, transformed);',
      // position
      'transformed.x += aPosition.x + (aPosition.w - 0.5) * distance * 0.03 + aPosition.x / uSize.x * rise * 1.5;',
      'transformed.y += aPosition.y - fall + rise;',
      'transformed.z += aPosition.z + distance;'
    ]
  })
  material.uniforms['map'].value.needsUpdate = true

  const mesh = new THREE.Mesh(geometry, material)
  mesh.frustumCulled = false

  root.add(mesh)

  let time = 0
  root.addUpdateCallback(() => {
    material.uniforms['uTime'].value = time++
  })
}

new THREE.TextureLoader().load(TEXTURE_SRC, init)

// --------------------
// Three.js Wrapper
// forked from https://github.com/zadvorsky/three.bas/blob/86931253240abadf68b7c62edb934b994693ed4a/examples/_js/root.js
// --------------------
class THREERoot {
  constructor(params) {
    // defaults
    params = Object.assign(
      {
        container: document.body,
        fov: 45,
        zNear: 1,
        zFar: 10000,
        cameraPosition: [0, 0, 30],
        createCameraControls: false,
        autoStart: true,
        pixelRatio: window.devicePixelRatio,
        antialias: window.devicePixelRatio === 1,
        alpha: false,
        clearColor: 0x000000
      },
      params
    )

    // maps and arrays
    this.updateCallbacks = []
    this.resizeCallbacks = []
    this.objects = {}

    // renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: params.antialias,
      alpha: params.alpha
    })
    this.renderer.setPixelRatio(params.pixelRatio)
    this.renderer.setClearColor(params.clearColor)
    this.canvas = this.renderer.domElement

    // container
    this.container =
      typeof params.container === 'string'
        ? document.querySelector(params.container)
        : params.container
    this.container.appendChild(this.canvas)

    this.width = this.container.clientWidth
    this.height = this.container.clientHeight

    // camera
    this.camera = new THREE.PerspectiveCamera(
      params.fov,
      this.width / this.height,
      params.zNear,
      params.zFar
    )
    this.camera.position.set(...params.cameraPosition)

    // scene
    this.scene = new THREE.Scene()

    // resize handling
    this.resize()
    window.addEventListener('resize', () => {
      this.resize()
    })

    // tick / update / render
    params.autoStart && this.tick()

    // optional camera controls
    params.createCameraControls && this.createOrbitControls()

    // pointer
    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
  }

  createOrbitControls() {
    if (!THREE.TrackballControls) {
      console.error('TrackballControls.js file is not loaded.')
      return
    }

    this.controls = new THREE.TrackballControls(this.camera, this.canvas)
    this.addUpdateCallback(() => {
      this.controls.update()
    })
  }

  start() {
    this.tick()
  }

  stop() {
    cancelAnimationFrame(this.animationFrameId)
  }

  addUpdateCallback(callback) {
    this.updateCallbacks.push(callback)
  }

  addResizeCallback(callback) {
    this.resizeCallbacks.push(callback)
  }

  add(object, key) {
    key && (this.objects[key] = object)
    this.scene.add(object)
  }

  addTo(object, parentKey, key) {
    key && (this.objects[key] = object)
    this.get(parentKey).add(object)
  }

  get(key) {
    return this.objects[key]
  }

  remove(o) {
    let object

    if (typeof o === 'string') {
      object = this.objects[o]
    } else {
      object = o
    }

    if (object) {
      object.parent.remove(object)
      delete this.objects[o]
    }
  }

  tick(time) {
    this.update(time)
    this.render()
    this.animationFrameId = requestAnimationFrame(time => {
      this.tick(time)
    })
  }

  update(time) {
    this.updateCallbacks.forEach(callback => {
      callback(time)
    })
  }

  render() {
    this.renderer.render(this.scene, this.camera)
  }

  resize() {
    this.container.style.width = ''
    this.container.style.height = ''
    this.width = this.container.clientWidth
    this.height = this.container.clientHeight

    this.camera.aspect = this.width / this.height
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.width, this.height)
    this.resizeCallbacks.forEach(callback => {
      callback()
    })
  }

  initPostProcessing(passes) {
    const size = this.renderer.getSize()
    const pixelRatio = this.renderer.getPixelRatio()
    size.width *= pixelRatio
    size.height *= pixelRatio

    const composer = (this.composer = new THREE.EffectComposer(
      this.renderer,
      new THREE.WebGLRenderTarget(size.width, size.height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        stencilBuffer: false
      })
    ))

    const renderPass = new THREE.RenderPass(this.scene, this.camera)
    composer.addPass(renderPass)

    for (let i = 0; i < passes.length; i++) {
      const pass = passes[i]
      pass.renderToScreen = i === passes.length - 1
      composer.addPass(pass)
    }

    this.renderer.autoClear = false
    this.render = () => {
      this.renderer.clear()
      composer.render()
    }

    this.addResizeCallback(() => {
      composer.setSize(
        window.innerWidth * pixelRatio,
        window.innerHeight * pixelRatio
      )
    })
  }

  checkPointer({ x, y }, meshs, handler, nohandler) {
    this.pointer.x = (x / this.canvas.clientWidth) * 2 - 1
    this.pointer.y = -(y / this.canvas.clientHeight) * 2 + 1

    this.raycaster.setFromCamera(this.pointer, this.camera)
    const intersects = this.raycaster.intersectObjects(meshs)

    if (intersects.length > 0) {
      handler(intersects[0].object)

      return true
    } else {
      nohandler && nohandler()

      return false
    }
  }
}
