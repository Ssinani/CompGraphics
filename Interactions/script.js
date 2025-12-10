console.log("🚀 script.js LOADED");

// ================= IMPORT MODULES =================
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.157.0/+esm'
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.157.0/examples/jsm/controls/OrbitControls.js/+esm'

// ================= SCENE =================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// ================= CAMERA + RENDERER =================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(800, 600);
document.getElementById("scene").appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 100);
camera.position.set(0, 0, 8);
scene.add(camera);

// ================= LIGHT =================
scene.add(new THREE.AmbientLight(0xffffff, 2));

// ================= CONTROLS =================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// ================= CUBES =================
const cubes = [];
for (let i = 0; i < 30; i++) {
    const size = Math.random() * 1 + 0.6;
    const cube = new THREE.Mesh(
        new THREE.BoxGeometry(size,size,size),
        new THREE.MeshStandardMaterial({ color: Math.random()*0xffffff })
    );
    cube.position.set(Math.random()*10-5, Math.random()*8-4, Math.random()*5);
    cube.userData.size = size;
    scene.add(cube);
    cubes.push(cube);
}

// ================= RAYCAST =================
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let lastCube = null, lastColor = null;

window.addEventListener("click", (e)=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x =  ((e.clientX-rect.left)/rect.width)*2-1;
    mouse.y = -((e.clientY-rect.top )/rect.height)*2+1;

    raycaster.setFromCamera(mouse,camera);
    const hit = raycaster.intersectObjects(cubes);

    if(hit.length===0){
        resetCube();
        setText("No object selected");
        return;
    }
    
    const cube = hit[0].object;
    resetCube();
    lastCube = cube;
    lastColor = cube.material.color.getHex();
    cube.material.color.set(0x000000);
    animateCube(cube);
    setText(`Cube selected<br>Pos: ${cube.position.x.toFixed(2)}, ${cube.position.y.toFixed(2)}, ${cube.position.z.toFixed(2)}<br>Size: ${cube.userData.size.toFixed(2)}`);
});

function resetCube(){
    if(lastCube){
        lastCube.material.color.set(lastColor);
        lastCube.scale.set(1,1,1);
    }
}
function animateCube(cube){
    let t=0;
    const anim=setInterval(()=>{
        t+=0.1;
        cube.scale.set(1+Math.sin(t)*0.3,1+Math.sin(t)*0.3,1+Math.sin(t)*0.3);
        if(t>Math.PI){ cube.scale.set(1,1,1); clearInterval(anim); }
    },16);
}
function setText(t){ document.getElementById("infoBox").innerHTML=t; }

// ================= LOOP =================
function animate(){
    controls.update();
    renderer.render(scene,camera);
    requestAnimationFrame(animate);
}
animate();
