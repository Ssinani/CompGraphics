import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

// Scene setup
const scene = new THREE.Scene();

// Dark gradient background
const canvas = document.createElement('canvas');
canvas.width = 1;
canvas.height = 256;
const ctx = canvas.getContext('2d');
const gradient = ctx.createLinearGradient(0,0,0,256);
gradient.addColorStop(0, "#1a1a1a"); // top
gradient.addColorStop(1, "#000000"); // bottom
ctx.fillStyle = gradient;
ctx.fillRect(0,0,1,256);
scene.background = new THREE.CanvasTexture(canvas);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight);
camera.position.set(4,3,8);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias:true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Floor
const plane = new THREE.Mesh(
  new THREE.PlaneGeometry(12,12),
  new THREE.MeshStandardMaterial({ color: 0x303030 })
);
plane.rotation.x = -Math.PI/2;
plane.receiveShadow = true;
scene.add(plane);

// Objects
const cube = new THREE.Mesh(
  new THREE.BoxGeometry(1,1,1),
  new THREE.MeshStandardMaterial({ color: 0xff5555, roughness: 0.4 })
);
cube.position.set(-2,0.5,0);
cube.castShadow = true;
scene.add(cube);

const cone = new THREE.Mesh(
  new THREE.ConeGeometry(0.8,1.5,32),
  new THREE.MeshStandardMaterial({ color: 0x55ff55, roughness:0.4, metalness:0.2 })
);
cone.position.set(0,0.75,0);
cone.castShadow = true;
scene.add(cone);

const torus = new THREE.Mesh(
  new THREE.TorusGeometry(0.6,0.2,16,100),
  new THREE.MeshStandardMaterial({ color: 0x5555ff, roughness:0.4, metalness:0.3 })
);
torus.position.set(2,0.6,0);
torus.castShadow = true;
scene.add(torus);

// Left light
const leftLight = new THREE.DirectionalLight(0xffffff, 1);
leftLight.position.set(0, 5, 2); // left, above
leftLight.target.position.set(0,0,0);
leftLight.castShadow = true;

// Shadow settings
leftLight.shadow.mapSize.width = 2048;
leftLight.shadow.mapSize.height = 2048;
leftLight.shadow.camera.near = 0.5;
leftLight.shadow.camera.far = 20;
leftLight.shadow.camera.left = -6;
leftLight.shadow.camera.right = 6;
leftLight.shadow.camera.top = 6;
leftLight.shadow.camera.bottom = -6;
leftLight.shadow.bias = -0.001;

scene.add(leftLight);
scene.add(leftLight.target);

// Right light (fill)
const rightLight = new THREE.DirectionalLight(0xffffff, 0.8);
rightLight.position.set(5,4,-5);
rightLight.target.position.set(0,0,0);
rightLight.castShadow = false;
scene.add(rightLight);
scene.add(rightLight.target);

// Ambient light
scene.add(new THREE.AmbientLight(0xffffff, 0.2));

// Sphere geometry & material for visualizing lights
const lightSphereGeom = new THREE.SphereGeometry(0.2, 32, 32);
const lightSphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

// Left sphere
const leftSphere = new THREE.Mesh(lightSphereGeom, lightSphereMat);
leftSphere.position.copy(leftLight.position);
scene.add(leftSphere);

// Right sphere
const rightSphere = new THREE.Mesh(lightSphereGeom, lightSphereMat);
rightSphere.position.copy(rightLight.position);
scene.add(rightSphere);

// Animate
function animate() {
  requestAnimationFrame(animate);

  cube.rotation.y += 0.01;
  cone.rotation.y += 0.01;
  torus.rotation.y += 0.01;

  renderer.render(scene, camera);
}
animate();
