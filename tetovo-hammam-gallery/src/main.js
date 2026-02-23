// src/main.js
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const BASE = import.meta.env.BASE_URL;

// ------------------------------------------------------------
// Renderer / Scene / Camera
// ------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0d12);

// Softer fog so ceiling doesn't go black
scene.fog = new THREE.Fog(0x0b0d12, 40, 120);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.05,
  260
);
camera.position.set(0, 1.7, 10);

const controls = new PointerLockControls(camera, document.body);

// ------------------------------------------------------------
// UI
// ------------------------------------------------------------
const hud = document.getElementById("hud");
const enterBtn = document.getElementById("enter");
const panel = document.getElementById("panel");
const panelTitle = document.getElementById("panelTitle");

function setHudVisible(isVisible) {
  if (!hud) return;
  hud.style.display = isVisible ? "" : "none";
  hud.style.pointerEvents = isVisible ? "auto" : "none";
}

enterBtn?.addEventListener("click", () => {
  setHudVisible(false);
  controls.lock();
});

controls.addEventListener("lock", () => setHudVisible(false));
controls.addEventListener("unlock", () => setHudVisible(true));

// ------------------------------------------------------------
// Room constants
// ------------------------------------------------------------
const ROOM = { w: 18, l: 26, h: 6 };
const Z_BACK = -ROOM.l / 2; // -13
const Z_FRONT = ROOM.l / 2; // +13
const X_LEFT = -ROOM.w / 2; // -9
const X_RIGHT = ROOM.w / 2; // +9

// corridor behind door
const CORR = {
  w: 4.6,
  h: 5.0,
  len: 7.5,
};

// ------------------------------------------------------------
// Loaders
// ------------------------------------------------------------
const texLoader = new THREE.TextureLoader();
const gltfLoader = new GLTFLoader();

// ------------------------------------------------------------
// Textures
// ------------------------------------------------------------

// ---- Plaster
const plasterColor = texLoader.load(
  `${BASE}textures/plaster/plastered_wall_02_diff_2k.jpg`
);
const plasterNormal = texLoader.load(
  `${BASE}textures/plaster/plastered_wall_02_nor_gl_2k.jpg`
);
const plasterRough = texLoader.load(
  `${BASE}textures/plaster/plastered_wall_02_rough_2k.jpg`
);
plasterColor.colorSpace = THREE.SRGBColorSpace;

[plasterColor, plasterNormal, plasterRough].forEach((tex) => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
});

// ---- Floor
const floorColor = texLoader.load(
  `${BASE}textures/stone-floor/stone_wall_05_diff_2k.jpg`
);
const floorNormal = texLoader.load(
  `${BASE}textures/stone-floor/stone_wall_05_nor_gl_2k.jpg`
);
const floorRough = texLoader.load(
  `${BASE}textures/stone-floor/stone_wall_05_rough_2k.jpg`
);
floorColor.colorSpace = THREE.SRGBColorSpace;

[floorColor, floorNormal, floorRough].forEach((tex) => {
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(6, 8);
  tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
});

// ------------------------------------------------------------
// Materials
// ------------------------------------------------------------
const plasterMat = new THREE.MeshStandardMaterial({
  map: plasterColor,
  normalMap: plasterNormal,
  roughnessMap: plasterRough,
  normalScale: new THREE.Vector2(0.9, 0.9),
  roughness: 1,
  metalness: 0,
  side: THREE.DoubleSide,
});

const stoneFloorMat = new THREE.MeshStandardMaterial({
  map: floorColor,
  normalMap: floorNormal,
  roughnessMap: floorRough,
  normalScale: new THREE.Vector2(1.1, 1.1),
  roughness: 1,
  metalness: 0,
});

// ✅ ONE ceiling material only (warm brown, not black)
const ceilingMat = new THREE.MeshStandardMaterial({
  color: 0xb49a84,
  roughness: 0.95,
  metalness: 0.0,
  side: THREE.DoubleSide,
});

// clone plaster with custom repeat (safe)
function makePlasterClone(repeatX, repeatY) {
  const mat = plasterMat.clone();
  mat.map = plasterMat.map.clone();
  mat.normalMap = plasterMat.normalMap.clone();
  mat.roughnessMap = plasterMat.roughnessMap.clone();

  mat.map.repeat.set(repeatX, repeatY);
  mat.normalMap.repeat.set(repeatX, repeatY);
  mat.roughnessMap.repeat.set(repeatX, repeatY);

  mat.map.needsUpdate = true;
  mat.normalMap.needsUpdate = true;
  mat.roughnessMap.needsUpdate = true;

  return mat;
}

// ------------------------------------------------------------
// Lighting (lantern-friendly + moodier + corridor shadows)
// ------------------------------------------------------------

// Darker ambient so lanterns matter, but not too dark
scene.add(new THREE.AmbientLight(0xfff1de, 0.35));

// soft sky/ground tint so nothing goes pure-black
const hemi = new THREE.HemisphereLight(0xfff2de, 0x1a120c, 0.30);
scene.add(hemi);

// Main warm key
const key = new THREE.SpotLight(
  0xffd3a6,
  1.85,
  85,
  Math.PI / 6.2,
  0.55,
  1.2
);
key.position.set(0, ROOM.h + 4.2, 6);
key.target.position.set(0, 1.7, 0);
key.castShadow = true;
key.shadow.mapSize.set(2048, 2048);
key.shadow.bias = -0.00025;
scene.add(key);
scene.add(key.target);

// subtle fill + rim
const fill = new THREE.PointLight(0xffe7c9, 0.55, 55, 2);
fill.position.set(-6.5, 3.0, 6.5);
scene.add(fill);

const rim = new THREE.PointLight(0xbfd0ff, 0.20, 70, 2);
rim.position.set(6.5, 3.0, -6.5);
scene.add(rim);

// ✅ Ceiling fill so ceiling is visible
const ceilingFillLight = new THREE.PointLight(0xffe6c9, 0.90, 90, 2);
ceilingFillLight.position.set(0, ROOM.h - 0.6, 0);
scene.add(ceilingFillLight);

// corridor: dim
const corridorBase = new THREE.PointLight(0xfff1d6, 0.10, 18, 2);
corridorBase.position.set(0, 2.7, Z_BACK - CORR.len * 0.55);
scene.add(corridorBase);

// breathing
let tBreath = 0;
const keyBase = key.intensity;

// ✅ IMPORTANT: declare this so animate() doesn't crash
const lanternGlows = [];

// ------------------------------------------------------------
// Floor
// ------------------------------------------------------------
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM.w, ROOM.l),
  stoneFloorMat
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// corridor floor
const floorCorr = new THREE.Mesh(
  new THREE.PlaneGeometry(CORR.w, CORR.len),
  stoneFloorMat
);
floorCorr.rotation.x = -Math.PI / 2;
floorCorr.position.set(0, 0, Z_BACK - CORR.len / 2);
floorCorr.receiveShadow = true;
scene.add(floorCorr);

// ------------------------------------------------------------
// Ceiling (ONE mesh + corridor ceiling)
// ------------------------------------------------------------
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(ROOM.w, ROOM.l),
  ceilingMat
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.y = ROOM.h;
ceiling.receiveShadow = true;
scene.add(ceiling);

// corridor ceiling
const ceilingCorr = new THREE.Mesh(
  new THREE.PlaneGeometry(CORR.w, CORR.len),
  ceilingMat
);
ceilingCorr.rotation.x = Math.PI / 2;
ceilingCorr.position.set(0, CORR.h, Z_BACK - CORR.len / 2);
ceilingCorr.receiveShadow = true;
scene.add(ceilingCorr);

// ------------------------------------------------------------
// ✅ Ceiling edge band (ONLY ONCE)
// ------------------------------------------------------------
function addCeilingEdgeBand({
  drop = 0.6,
  thickness = 0.10,
  inset = 0.02,
  color = 0x3f2b21,
} = {}) {
  const mat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.95,
    metalness: 0.0,
  });

  const yMid = ROOM.h - drop / 2;
  const group = new THREE.Group();
  group.name = "ceilingEdgeBand";

  // FRONT
  const front = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.w - 0.02, drop, thickness),
    mat
  );
  front.position.set(0, yMid, Z_FRONT - thickness / 2 - inset);
  group.add(front);

  // BACK
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(ROOM.w - 0.02, drop, thickness),
    mat
  );
  back.position.set(0, yMid, Z_BACK + thickness / 2 + inset);
  group.add(back);

  // LEFT
  const left = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, drop, ROOM.l - 0.02),
    mat
  );
  left.position.set(X_LEFT + thickness / 2 + inset, yMid, 0);
  group.add(left);

  // RIGHT
  const right = new THREE.Mesh(
    new THREE.BoxGeometry(thickness, drop, ROOM.l - 0.02),
    mat
  );
  right.position.set(X_RIGHT - thickness / 2 - inset, yMid, 0);
  group.add(right);

  // Corner caps
  const capGeo = new THREE.BoxGeometry(thickness * 2.2, drop, thickness * 2.2);

  const c1 = new THREE.Mesh(capGeo, mat);
  c1.position.set(X_LEFT + inset, yMid, Z_FRONT - inset);
  group.add(c1);

  const c2 = new THREE.Mesh(capGeo, mat);
  c2.position.set(X_RIGHT - inset, yMid, Z_FRONT - inset);
  group.add(c2);

  const c3 = new THREE.Mesh(capGeo, mat);
  c3.position.set(X_LEFT + inset, yMid, Z_BACK + inset);
  group.add(c3);

  const c4 = new THREE.Mesh(capGeo, mat);
  c4.position.set(X_RIGHT - inset, yMid, Z_BACK + inset);
  group.add(c4);

  group.traverse((m) => {
    if (m.isMesh) {
      m.castShadow = false;
      m.receiveShadow = true;
    }
  });

  scene.add(group);
}

addCeilingEdgeBand({
  drop: 0.6,
  thickness: 0.10,
  color: 0x3f2b21,
});

// ------------------------------------------------------------
// Walls (front/left/right)
// ------------------------------------------------------------
function addWall(width, height, x, y, z, ry, repeatX, repeatY) {
  const geo = new THREE.PlaneGeometry(width, height);
  const mat = makePlasterClone(repeatX, repeatY);
  const wall = new THREE.Mesh(geo, mat);
  wall.position.set(x, y, z);
  wall.rotation.y = ry;
  wall.castShadow = true;
  wall.receiveShadow = true;
  scene.add(wall);
}

addWall(ROOM.w, ROOM.h, 0, ROOM.h / 2, Z_FRONT, Math.PI, 4, 2);
addWall(ROOM.l, ROOM.h, X_LEFT, ROOM.h / 2, 0, Math.PI / 2, 6, 2);
addWall(ROOM.l, ROOM.h, X_RIGHT, ROOM.h / 2, 0, -Math.PI / 2, 6, 2);

// ------------------------------------------------------------
// ✅ BACK wall with arched opening + corridor
// ------------------------------------------------------------
function addBackWallWithArchedOpeningAndCorridor() {
  const wallW = ROOM.w;
  const wallH = ROOM.h;
  const z = Z_BACK;

  const openingW = CORR.w;
  const openingH = 4.8;
  const cornerR = 2.1;

  const wall = new THREE.Shape();
  wall.moveTo(-wallW / 2, -wallH / 2);
  wall.lineTo(wallW / 2, -wallH / 2);
  wall.lineTo(wallW / 2, wallH / 2);
  wall.lineTo(-wallW / 2, wallH / 2);
  wall.lineTo(-wallW / 2, -wallH / 2);

  const w = openingW;
  const h = openingH;
  const r = Math.min(cornerR, w * 0.5, h * 0.5);

  const bottomY = -wallH / 2;
  const topY = bottomY + h;

  const hole = new THREE.Path();
  hole.moveTo(-w / 2, bottomY);
  hole.lineTo(-w / 2, topY - r);
  hole.quadraticCurveTo(-w / 2, topY, -w / 2 + r, topY);
  hole.lineTo(w / 2 - r, topY);
  hole.quadraticCurveTo(w / 2, topY, w / 2, topY - r);
  hole.lineTo(w / 2, bottomY);
  hole.lineTo(-w / 2, bottomY);

  wall.holes.push(hole);

  const mat = makePlasterClone(4, 2);
  const geo = new THREE.ShapeGeometry(wall);

  const backWall = new THREE.Mesh(geo, mat);
  backWall.position.set(0, wallH / 2, z);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // corridor side walls
  const corrMat = makePlasterClone(2.5, 2);
  const corrWallGeo = new THREE.PlaneGeometry(CORR.len, CORR.h);

  const cL = new THREE.Mesh(corrWallGeo, corrMat);
  cL.rotation.y = Math.PI / 2;
  cL.position.set(-CORR.w / 2, CORR.h / 2, z - CORR.len / 2);
  scene.add(cL);

  const cR = new THREE.Mesh(corrWallGeo, corrMat);
  cR.rotation.y = -Math.PI / 2;
  cR.position.set(CORR.w / 2, CORR.h / 2, z - CORR.len / 2);
  scene.add(cR);

  // corridor end wall
  const end = new THREE.Mesh(new THREE.PlaneGeometry(CORR.w, CORR.h), corrMat);
  end.position.set(0, CORR.h / 2, z - CORR.len);
  end.rotation.y = Math.PI;
  scene.add(end);

  return { endWallZ: z - CORR.len };
}
const { endWallZ } = addBackWallWithArchedOpeningAndCorridor();

// ------------------------------------------------------------
// Niche placement helpers
// ------------------------------------------------------------
const NICHE_Z = Z_BACK + 0.02;
const DOOR_HALF = CORR.w / 2;
const WALL_HALF = ROOM.w / 2;
const SIDE_SPACE = WALL_HALF - DOOR_HALF;
const NICHE_X_LEFT = -(DOOR_HALF + SIDE_SPACE / 2) - 0.9;
const NICHE_X_RIGHT = (DOOR_HALF + SIDE_SPACE / 2) + 0.2;

// ------------------------------------------------------------
// Models
// ------------------------------------------------------------
function addNicheModel({
  url = `${BASE}models/niche/prayer_niche_mihrab.glb`,
  x = 0,
  y = 0,
  z = 0,
  rotationY = 0,
  targetHeight = 4.0,
  embed = -0.18,
} = {}) {
  gltfLoader.load(
    url,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;

      const s = targetHeight / (size.y || 1);
      model.scale.setScalar(s);

      model.position.add(new THREE.Vector3(x, y, z));
      model.rotation.y = rotationY;

      const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotationY
      );
      model.position.add(forward.multiplyScalar(embed));

      scene.add(model);
      console.log("✅ Niche added", { x, y, z });
    },
    undefined,
    (err) => console.error("❌ Failed to load niche:", err)
  );
}

addNicheModel({
  x: NICHE_X_LEFT,
  y: -0.22,
  z: NICHE_Z,
  rotationY: 0,
  targetHeight: 4.0,
  embed: -1.75,
});

addNicheModel({
  x: NICHE_X_RIGHT,
  y: -0.22,
  z: NICHE_Z,
  rotationY: 0,
  targetHeight: 4.0,
  embed: -1.75,
});

function addWindowModel({
  url = `${BASE}models/windows/ottoman_window.glb`,
  x = 0,
  y = 0,
  z = 0,
  rotationY = 0,
  targetHeight = 2.2,
  push = 0.06,
} = {}) {
  new GLTFLoader().load(
    url,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;

      const s = targetHeight / (size.y || 1);
      model.scale.setScalar(s);

      model.position.add(new THREE.Vector3(x, y, z));
      model.rotation.set(0, rotationY, 0);

      const wallNormal = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotationY
      );
      model.position.add(wallNormal.multiplyScalar(push));

      scene.add(model);
      console.log("✅ Window added", { x, y, z });
    },
    undefined,
    (err) => console.error("❌ Failed to load window:", url, err)
  );
}

// RIGHT wall window
addWindowModel({
  x: X_RIGHT - 0.30,
  y: 2.2,
  z: 0.0,
  rotationY: -Math.PI,
  targetHeight: 4.1,
  push: 0.02,
});

// LEFT wall window
addWindowModel({
  x: X_LEFT,
  y: 2.2,
  z: 0.0,
  rotationY: Math.PI,
  targetHeight: 4.1,
  push: 0.0,
});

// front wall small windows
addWindowModel({
  x: -6.5,
  y: 2.2,
  z: Z_FRONT - 0.1,
  rotationY: Math.PI / 2,
  targetHeight: 3.0,
  push: 0.0,
});

addWindowModel({
  x: 6.5,
  y: 2.2,
  z: Z_FRONT - 0.1,
  rotationY: Math.PI / 2,
  targetHeight: 3.0,
  push: 0.0,
});

function addLanternModel({
  url = `${BASE}models/lanterns/lantern.glb`,
  x = 0,
  y = 0,
  z = 0,
  rotationY = 0,
  targetHeight = 1.4,
  offsetFromWall = 0.04,
  lightIntensity = 1.2,
} = {}) {
  new GLTFLoader().load(
    url,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
        }
      });

      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;

      const s = targetHeight / (size.y || 1);
      model.scale.setScalar(s);

      model.position.add(new THREE.Vector3(x, y, z));
      model.rotation.y = rotationY;

      const wallNormal = new THREE.Vector3(0, 0, 1).applyAxisAngle(
        new THREE.Vector3(0, 1, 0),
        rotationY
      );
      model.position.add(wallNormal.multiplyScalar(offsetFromWall));

      scene.add(model);

      // Lantern glow + flicker registration
      const glow = new THREE.PointLight(0xffc58f, lightIntensity, 12);
      glow.position.copy(model.position);
      glow.position.y += targetHeight * 0.4;
      glow.decay = 2;
      scene.add(glow);

      lanternGlows.push({
        light: glow,
        base: lightIntensity,
        phase: Math.random() * Math.PI * 2,
        speed: 2.0 + Math.random() * 1.5,
        amp: 0.08 + Math.random() * 0.10,
      });
    },
    undefined,
    (err) => console.error("❌ Lantern failed:", err)
  );
}

// ✅ YOU WERE MISSING THESE CALLS (put lanterns back!)
addLanternModel({
  x: NICHE_X_LEFT,
  y: 3.8,
  z: Z_BACK + 0.05,
  rotationY: 0,
});

addLanternModel({
  x: NICHE_X_RIGHT,
  y: 3.8,
  z: Z_BACK + 0.05,
  rotationY: 0,
});

addLanternModel({
  x: -CORR.w / 2,
  y: 4.2,
  z: Z_BACK - 3.2,
  rotationY: Math.PI / 2,
  targetHeight: 0.8,
  offsetFromWall: 0.8,
});

addLanternModel({
  x: CORR.w / 2,
  y: 4.2,
  z: Z_BACK - 3.2,
  rotationY: -Math.PI / 2,
  targetHeight: 0.8,
  offsetFromWall: 0.8,
});

function addCarpetModel({
  url = `${BASE}models/carpets/ottoman_carpet.glb`,
  x = 0,
  z = 0,
  y = 0.005,
  rotationY = 0,
  targetWidth = 7.0,
  targetLength = 10.0,
} = {}) {
  new GLTFLoader().load(
    url,
    (gltf) => {
      const model = gltf.scene;

      model.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = false;
          o.receiveShadow = true;
        }
      });

      model.position.set(0, 0, 0);
      model.rotation.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      model.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      model.position.x -= center.x;
      model.position.z -= center.z;
      model.position.y -= box.min.y;

      const sx = targetWidth / (size.x || 1);
      const sz = targetLength / (size.z || 1);
      const s = Math.min(sx, sz);
      model.scale.setScalar(s);

      model.rotation.y = rotationY;
      model.position.add(new THREE.Vector3(x, y, z));

      scene.add(model);
      console.log("✅ Carpet added", { x, y, z });
    },
    undefined,
    (err) => console.error("❌ Failed to load carpet:", url, err)
  );
}

// ✅ corridor carpet
addCarpetModel({
  x: 0,
  z: Z_BACK - CORR.len / 2,
  y: 0.005,
  rotationY: 0,
  targetWidth: CORR.w - 0.6,
  targetLength: CORR.len - 1.2,
});

function addFountainModel({
  url = `${BASE}models/fountain/ottoman_fountain.glb`,
  x = 0,
  y = 0,
  z = 0,
  rotationY = 0,
  targetHeight = 1.6,
} = {}) {
  gltfLoader.load(
    url,
    (gltf) => {
      const root = gltf.scene;

      root.traverse((o) => {
        if (o.isMesh) {
          o.castShadow = true;
          o.receiveShadow = true;
          o.frustumCulled = false;
        }
      });

      const pivot = new THREE.Group();
      pivot.add(root);

      root.position.set(0, 0, 0);
      root.rotation.set(0, 0, 0);
      root.scale.set(1, 1, 1);

      pivot.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(pivot);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      pivot.position.x -= center.x;
      pivot.position.z -= center.z;
      pivot.position.y -= box.min.y;

      let s = targetHeight / (size.y || 1);
      s = THREE.MathUtils.clamp(s, 0.001, 50);
      pivot.scale.setScalar(s);

      pivot.position.add(new THREE.Vector3(x, y, z));
      pivot.rotation.y = rotationY;

      scene.add(pivot);
      console.log("✅ Fountain added", { x, y, z, scale: s });
    },
    undefined,
    (err) => console.error("❌ Fountain failed:", err)
  );
}
addFountainModel({ x: 0, y: 0, z: 0, targetHeight: 1.5 });

// ------------------------------------------------------------
// Lantern light tuning (upgrade glow lights)
// ------------------------------------------------------------
let _lanternTuneTimer = 0;

function tuneLanternLights() {
  scene.traverse((o) => {
    if (o.isPointLight && o.color?.getHex?.() === 0xffc58f) {
      o.decay = 2;
      o.distance = 12;
      o.castShadow = true;
      o.shadow.mapSize.set(512, 512);
      o.shadow.bias = -0.00035;
    }
  });
}

// ------------------------------------------------------------
// Artworks
// ------------------------------------------------------------
const artworks = [];

function loadArtworkTexture(n) {
  const url = `${BASE}artworks/${n}.jpg`;
  const t = texLoader.load(url, undefined, undefined, () =>
    console.warn("❌ Missing artwork:", url)
  );
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return t;
}

function addArtwork({ n, x, y, z, ry, w = 2.4, h = 1.55 }) {
  const tex = loadArtworkTexture(n);

  const paintMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
  const painting = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintMat);
  painting.rotation.y = ry;

  const normal = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), ry);
  painting.position.set(x, y, z);
  painting.position.add(normal.clone().multiplyScalar(0.08));

  painting.userData = { id: n, title: `Artwork ${n}` };

  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1a1714,
    roughness: 0.9,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });

  const frame = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.18, h + 0.18), frameMat);
  frame.rotation.y = ry;
  frame.position.copy(painting.position);
  frame.position.add(normal.clone().multiplyScalar(-0.06));

  const target = new THREE.Object3D();
  target.position.copy(painting.position);
  scene.add(target);

  const spot = new THREE.SpotLight(0xffe6bf, 1.2, 18, Math.PI / 7.5, 0.55, 1);
  spot.position.copy(painting.position)
    .add(new THREE.Vector3(0, 1.2, 0))
    .add(normal.clone().multiplyScalar(2.2));
  spot.target = target;
  spot.castShadow = false;
  scene.add(spot);

  scene.add(frame);
  scene.add(painting);

  artworks.push(painting);
}

// layout
let idx = 0;
for (let i = -1.35; i <= 1.35; i += 0.9) {
  addArtwork({ n: idx++, x: X_LEFT, y: 2.65, z: i * 6.0, ry: Math.PI / 2 });
}
for (let i = -1.35; i <= 1.35; i += 0.9) {
  addArtwork({ n: idx++, x: X_RIGHT, y: 2.65, z: i * 6.0, ry: -Math.PI / 2 });
}
addArtwork({ n: idx++, x: -2.2, y: 2.85, z: Z_FRONT, ry: Math.PI, w: 2.8, h: 1.8 });
addArtwork({ n: idx++, x: 2.2, y: 2.85, z: Z_FRONT, ry: Math.PI, w: 2.8, h: 1.8 });

// corridor end wall art
const CORR_ART_ID = 0;
addArtwork({
  n: CORR_ART_ID,
  x: 0,
  y: 2.6,
  z: endWallZ + 0.02,
  ry: 0,
  w: 2.8,
  h: 1.8,
});

// ------------------------------------------------------------
// Focus on click
// ------------------------------------------------------------
const raycaster = new THREE.Raycaster();
const center = new THREE.Vector2(0, 0);

const focus = {
  active: false,
  t: 0,
  duration: 0.65,
  fromPos: new THREE.Vector3(),
  toPos: new THREE.Vector3(),
  fromQuat: new THREE.Quaternion(),
  toQuat: new THREE.Quaternion(),
};

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

function startFocus(painting) {
  focus.active = true;
  focus.t = 0;

  focus.fromPos.copy(camera.position);
  focus.fromQuat.copy(camera.quaternion);

  const p = painting.getWorldPosition(new THREE.Vector3());
  const q = painting.getWorldQuaternion(new THREE.Quaternion());
  const normal = new THREE.Vector3(0, 0, 1).applyQuaternion(q);

  const dist = 2.1;
  focus.toPos.copy(p).add(normal.multiplyScalar(dist));
  focus.toPos.y += 0.12;

  const temp = camera.clone();
  temp.position.copy(focus.toPos);
  temp.lookAt(p);
  focus.toQuat.copy(temp.quaternion);

  if (panelTitle) panelTitle.textContent = painting.userData.title || "Artwork";
  panel?.classList.remove("hidden");
}

function stopFocus() {
  focus.active = false;
  panel?.classList.add("hidden");
}

window.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" && focus.active) stopFocus();
});

window.addEventListener("click", () => {
  if (!controls.isLocked) return;
  if (focus.active) return;

  raycaster.setFromCamera(center, camera);
  const hits = raycaster.intersectObjects(artworks, false);
  if (hits.length > 0) startFocus(hits[0].object);
});

// ------------------------------------------------------------
// Movement
// ------------------------------------------------------------
const keys = { w: false, a: false, s: false, d: false };

addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = true;
});

addEventListener("keyup", (e) => {
  const k = e.key.toLowerCase();
  if (k in keys) keys[k] = false;
});

function clampToWorld(pos) {
  const hallX = 7.8;
  const hallZFront = 11.8;
  const hallZBack = 11.8;

  const inDoorX = CORR.w / 2 - 0.25;
  const corrZMin = Z_BACK - CORR.len + 0.35;
  const corrZMax = -11.8;

  if (pos.z < corrZMax) {
    pos.x = THREE.MathUtils.clamp(pos.x, -inDoorX, inDoorX);
    pos.z = THREE.MathUtils.clamp(pos.z, corrZMin, corrZMax);
  } else {
    pos.x = THREE.MathUtils.clamp(pos.x, -hallX, hallX);
    pos.z = THREE.MathUtils.clamp(pos.z, -hallZBack, hallZFront);
  }

  pos.y = 1.7;
}

// ------------------------------------------------------------
// Render Loop
// ------------------------------------------------------------
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(0.033, clock.getDelta());

  tBreath += dt;
  key.intensity = keyBase * (1 + 0.07 * Math.sin(tBreath * 1.1));

  // ✅ Lantern flicker animation (safe now because lanternGlows exists)
  for (const g of lanternGlows) {
    const t = performance.now() * 0.001 * g.speed + g.phase;
    const flick =
      1 +
      g.amp * Math.sin(t) +
      (g.amp * 0.5) * Math.sin(t * 2.3 + 1.7);

    g.light.intensity = g.base * THREE.MathUtils.clamp(flick, 0.7, 1.3);
  }

  if (controls.isLocked && !focus.active) {
    const speed = 6.2;

    const right = (keys.d ? 1 : 0) - (keys.a ? 1 : 0);
    const forward = (keys.w ? 1 : 0) - (keys.s ? 1 : 0);

    let mag = Math.hypot(right, forward);
    let rx = right,
      fz = forward;
    if (mag > 0) {
      rx /= mag;
      fz /= mag;
    }

    controls.moveRight(rx * speed * dt);
    controls.moveForward(-fz * speed * dt);

    clampToWorld(camera.position);
  }

  if (focus.active) {
    focus.t += dt;
    const u = Math.min(1, focus.t / focus.duration);
    const s = smoothstep(u);
    camera.position.lerpVectors(focus.fromPos, focus.toPos, s);
    camera.quaternion.slerpQuaternions(focus.fromQuat, focus.toQuat, s);
  }

  // Lantern tuning
  _lanternTuneTimer += dt;
  if (_lanternTuneTimer > 1.0) {
    _lanternTuneTimer = 0;
    tuneLanternLights();
  }

  renderer.render(scene, camera);
}
animate();

// ------------------------------------------------------------
// Resize
// ------------------------------------------------------------
addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
