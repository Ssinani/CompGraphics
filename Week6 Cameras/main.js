import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js/+esm'
import { RectAreaLightHelper } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/helpers/RectAreaLightHelper.js/+esm'
import { RectAreaLightUniformsLib } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/lights/RectAreaLightUniformsLib.js/+esm'
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm'

// === Canvas ===
const canvas = document.querySelector('.webgl')

// === Sizes ===
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

// === Scene ===
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x000000) // pure black

// === Object ===
const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1, 5, 5, 5),
    new THREE.MeshBasicMaterial({ color: 0xFFF8E7, wireframe: true })
)
scene.add(mesh)

// === Camera ===
// Orthographic 
const aspectRatio = sizes.width / sizes.height
const camera = new THREE.OrthographicCamera(
    -aspectRatio, // left
    aspectRatio,  // right
    1,            // top
    -1,           // bottom
    0.1,          // near
    100           // far
)
camera.position.z = 3
scene.add(camera)

// === Renderer ===
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

// === Controls ===
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// === Animation Loop ===
const animate = () => {
    controls.update()
    renderer.render(scene, camera)
    window.requestAnimationFrame(animate)
}
animate()

// === Resize Handling ===
window.addEventListener('resize', () => {
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    const aspectRatio = sizes.width / sizes.height

    // Update orthographic camera
    camera.left = -aspectRatio
    camera.right = aspectRatio
    camera.top = 1
    camera.bottom = -1
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
