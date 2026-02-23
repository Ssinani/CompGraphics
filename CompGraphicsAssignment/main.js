import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/+esm';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js/+esm';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.18/+esm';

// === GUI ===
const gui = new GUI();

// === Scene ===
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xb5e0ff); // soft sky blue

// === Camera ===
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(10, 8, 12);

// === Renderer ===
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// === Controls ===
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// === Lights ===
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
gui.add(ambientLight, 'intensity').min(0).max(2).step(0.01).name('Ambient Light');

const sunLight = new THREE.DirectionalLight(0xffffff, 1.4);
sunLight.position.set(8, 15, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(4096, 4096); // higher quality shadows
sunLight.shadow.camera.left = -30;
sunLight.shadow.camera.right = 30;
sunLight.shadow.camera.top = 30;
sunLight.shadow.camera.bottom = -30;
scene.add(sunLight);
gui.add(sunLight, 'intensity').min(0).max(3).step(0.01).name('Sun Intensity');

// === Ground (grass + roads) ===
const grassMaterial = new THREE.MeshLambertMaterial({ color: 0x6ab36a });
const grassGeometry = new THREE.PlaneGeometry(40, 40);
const grass = new THREE.Mesh(grassGeometry, grassMaterial);
grass.rotation.x = -Math.PI / 2;
grass.receiveShadow = true;
scene.add(grass);

gui.addColor({ grassColor: 0x6ab36a }, 'grassColor')
  .name('Grass Color')
  .onChange(c => grassMaterial.color.set(c));

const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.8 });
gui.add(roadMaterial, 'roughness').min(0).max(1).step(0.01).name('Road Roughness');

function makeRoad(width, height, x, z) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(width, height), roadMaterial);
  road.rotation.x = -Math.PI / 2;
  road.position.set(x, 0.01, z);
  road.receiveShadow = true;
  scene.add(road);
}
makeRoad(18, 3, 0, 0);
makeRoad(3, 18, 0, 0);

// === Buildings ===
const whiteMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff, shininess: 80 });
const blueMaterial = new THREE.MeshStandardMaterial({ color: 0x1e90ff, metalness: 0.3, roughness: 0.4 });

const whiteGeo = new THREE.BoxGeometry(3, 2, 3);
const blueGeo = new THREE.BoxGeometry(6, 2, 2); // rectangular building

const buildings = [
  { geo: whiteGeo, mat: whiteMaterial, x: -6, y: 1, z: 6 },
  { geo: whiteGeo, mat: whiteMaterial, x: 6, y: 1, z: 6 },
  { geo: blueGeo, mat: blueMaterial, x: 0, y: 1, z: -6 },
];
buildings.forEach(b => {
  const mesh = new THREE.Mesh(b.geo, b.mat);
  mesh.position.set(b.x, b.y, b.z);
  mesh.castShadow = true;
  scene.add(mesh);
});

// === Trees (Green Cones) ===
const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x1e7a3e });

function createTree(x, z, height = 2) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.5, 8), trunkMaterial);
  trunk.position.set(x, 0.25, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(new THREE.ConeGeometry(0.6, height, 8), leavesMaterial);
  leaves.position.set(x, 0.8 + height / 2, z);
  leaves.castShadow = true;
  scene.add(leaves);
}

const treePositions = [
  // left side row
  [-10, 9], [-10, 1], [-10, -3],
  // right side row
  [10, 9], [10, 5], [10, 1], [10, -3],
  // top side near white buildings
  [-6, 9], [0, 9], [6, 9],
  // bottom side near blue building
  [-6, -9], [0, -9], [6, -9],
  // scattered trees
  [-3, 4], [3, -4]
];

treePositions.forEach(([x, z]) => createTree(x, z));

// === Pink Blossom (Sakura) Trees ===
const blossomMaterial = new THREE.MeshLambertMaterial({ color: 0xffa6f9 });
function createBlossom(x, z) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.6, 8), trunkMaterial);
  trunk.position.set(x, 0.3, z);
  trunk.castShadow = true;
  scene.add(trunk);

  const leaves = new THREE.Mesh(new THREE.SphereGeometry(1.2, 16, 16), blossomMaterial);
  leaves.position.set(x, 1.3, z);
  leaves.castShadow = true;
  scene.add(leaves);
}
// repositioned blossoms away from buildings
createBlossom(-10, 5);
createBlossom(8, -6);

// === Benches ===
function createBench(x, z) {
  const legMaterial = new THREE.MeshStandardMaterial({ color: 0x8b5a2b });
  const seatMaterial = new THREE.MeshStandardMaterial({ color: 0xb58b56 });

  const leg1 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), legMaterial);
  leg1.position.set(x - 0.4, 0.2, z);
  const leg2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.4, 0.1), legMaterial);
  leg2.position.set(x + 0.4, 0.2, z);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.3), seatMaterial);
  seat.position.set(x, 0.45, z);
  [leg1, leg2, seat].forEach(obj => { obj.castShadow = true; scene.add(obj); });
}
createBench(2, -2);
createBench(-2, -2);

// === Animation Loop ===
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();

// === Resize ===
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
