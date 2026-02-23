import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.module.js';

const scene = new THREE.Scene(); //scene constructor
scene.background = new THREE.Color(0x202020);

const camera = new THREE.PerspectiveCamera(
    75, window.innerWidth/window.innerHeight, 0.1, 1000
);

camera.position.z = 10;

const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);

document.body.appendChild(renderer.domElement);


const geometry = new THREE.BoxGeometry(2,2,2);
const material = new THREE.MeshStandardMaterial({color:0x00ff88});
const cubeMesh = new THREE.Mesh(geometry, material);
scene.add(cubeMesh);

const light = new THREE.DirectionalLight(0xffffff,1);
light.position.set(2,2,5);
scene.add(light);

function animate(){
    requestAnimationFrame(animate);
    cubeMesh.rotation.x +=0.01;
    cubeMesh.rotation.y +=0.01;
    renderer.render(scene,camera);
}

animate();