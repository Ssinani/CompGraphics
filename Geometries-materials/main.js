import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js/+esm'
import { RectAreaLightHelper } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/helpers/RectAreaLightHelper.js/+esm'
import { RectAreaLightUniformsLib } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/lights/RectAreaLightUniformsLib.js/+esm'
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm'

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x202020); 

// Camera
const camera = new THREE.PerspectiveCamera(75, 800 / 600);
camera.position.z = 3;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 600);
document.body.appendChild(renderer.domElement);
 
// const geometry = new THREE.ConeGeometry(1, 2, 32);
// const geometry = new THREE.CylinderGeometry(1, 1, 2, 32);
// const geometry = new THREE.SphereGeometry(1, 32, 32);
   const geometry = new THREE.TorusGeometry(1, 0.4, 16, 100);

// Basic material – flat color, ignores light
// const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });

// Lambert material – uses diffuse reflection only
// Good for matte surfaces (no shiny highlights)
// const material = new THREE.MeshLambertMaterial({ color: 0x8844ff });


//  Standard material – physically based (ambient + diffuse + specular)
//  Controlled by 'metalness' and 'roughness' properties
// const material = new THREE.MeshStandardMaterial({
//   color: 0x8844ff,           // Purple diffuse base
//   metalness: 0.4,            // Controls how reflective the surface is (specular strength)
//   roughness: 0.3,            // Controls smoothness (lower = more mirror-like)
//   emissive: 0x220044,        // Adds a faint self-glow
// });

// Phong material – adds specular highlights (shiny reflections)
const material = new THREE.MeshPhongMaterial({
  color: 0x8844ff,         // Base color (diffuse component)
  specular: 0xffffff,      // Highlight color
  // specular: 0x000000, 
  shininess: 100           // Size/intensity of the specular highlight
});

const object = new THREE.Mesh(geometry, material);
scene.add(object);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
directionalLight.position.set(1, 3, 5);
scene.add(directionalLight);

const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 0.5);
scene.add(lightHelper);

ambientLight.intensity = 0.4;
directionalLight.intensity = 1.2;

function animate() {
  object.rotation.y += 0.01;
  object.rotation.x += 0.005;
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();