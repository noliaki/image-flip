import * as Three from 'three'
import ThreeBase from './ThreeBase'
import { TweenLite, Power0 } from 'gsap/all'
import ImageTransition from './ImageTransition'
import { loadTexture } from './helper'
;(async (): Promise<void> => {
  const threeBase = new ThreeBase()
  const light = new Three.AmbientLight(0xffffff)
  const light2 = new Three.DirectionalLight(0xffffff)
  // light.position.x = 1000
  light.position.y = -1000
  light.position.z = 1000

  // light2.position.x = 1000
  light2.position.y = 1000
  light2.position.z = 1000

  if (process.env.NODE_ENV === 'development') {
    const axes = new Three.AxesHelper(1000)
    threeBase.addToScene(axes)
  }

  threeBase.addToScene(light)
  threeBase.addToScene(light2)

  const texture1: Three.Texture = await loadTexture('cat-1.jpg')
  const texture2: Three.Texture = await loadTexture('cat-2.jpg')

  const imageTransition: ImageTransition = new ImageTransition(
    texture1,
    texture2
  )
  threeBase.addToScene(imageTransition)

  const timeline = {
    progress: 0
  }

  let forwards: boolean = false

  window.addEventListener('click', async event => {
    event.preventDefault()

    if (forwards) {
      reverseProgress()
    } else {
      forwardsProgress()
    }

    forwards = !forwards
  })

  loop()

  function loop() {
    threeBase.tick()
    requestAnimationFrame(loop)
  }

  function forwardsProgress(duration: number = 3): Promise<void> {
    return new Promise((resolve: () => void): void => {
      TweenLite.to(timeline, duration, {
        progress: 1,
        ease: Power0.easeNone,
        onUpdate(): void {
          updateParticleProgress()
        },
        onComplete(): void {
          resolve()
        }
      })
    })
  }

  function reverseProgress(duration: number = 3): Promise<void> {
    return new Promise((resolve: () => void): void => {
      TweenLite.to(timeline, duration, {
        progress: 0,
        ease: Power0.easeNone,
        onUpdate(): void {
          updateParticleProgress()
        },
        onComplete(): void {
          resolve()
        }
      })
    })
  }

  function updateParticleProgress(): void {
    imageTransition.progress = timeline.progress
  }
})()
