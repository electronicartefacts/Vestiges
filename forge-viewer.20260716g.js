import * as THREE from "/assets/vendor/three/three.module.min.js";
import { GLTFLoader } from "/assets/vendor/three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "/assets/vendor/three/addons/controls/OrbitControls.js";

function mountModelProjections(model) {
  const stages = document.querySelectorAll("[data-model-projection]");
  if (!stages.length) return;

  const views = {
    front: { position: [0, 0, 6], up: [0, 1, 0], label: "Vue de face du modèle numérique" },
    side: { position: [6, 0, 0], up: [0, 1, 0], label: "Vue de profil du modèle numérique" },
    top: { position: [0, 6, 0], up: [0, 0, -1], label: "Vue du dessus du modèle numérique" }
  };

  stages.forEach((stage) => {
    if (stage.dataset.projectionMounted === "true") return;
    stage.dataset.projectionMounted = "true";
    const view = views[stage.dataset.modelProjection] || views.front;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-2, 2, 2, -2, .01, 20);
    camera.position.set(...view.position);
    camera.up.set(...view.up);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.setAttribute("aria-label", view.label);
    stage.querySelector("span")?.remove();
    stage.append(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 3));
    const light = new THREE.DirectionalLight(0xffffff, 3.2);
    light.position.set(3, 5, 4);
    scene.add(light);
    const clone = model.clone(true);
    clone.rotation.set(0, 0, 0);
    const cloneCenter = new THREE.Box3().setFromObject(clone).getCenter(new THREE.Vector3());
    clone.position.sub(cloneCenter);
    scene.add(clone);

    const renderProjection = () => {
      const width = Math.max(1, stage.clientWidth);
      const height = Math.max(1, stage.clientHeight);
      const aspect = width / height;
      const extent = 1.75;
      if (aspect >= 1) {
        camera.left = -extent * aspect;
        camera.right = extent * aspect;
        camera.top = extent;
        camera.bottom = -extent;
      } else {
        camera.left = -extent;
        camera.right = extent;
        camera.top = extent / aspect;
        camera.bottom = -extent / aspect;
      }
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };
    const observer = new ResizeObserver(renderProjection);
    observer.observe(stage);
    renderProjection();
  });
}

export function mountForgeViewer(root) {
  if (!root || root.dataset.viewerMounted === "true") return;
  root.dataset.viewerMounted = "true";

  const stage = root.querySelector("[data-viewer-stage]");
  const poster = root.querySelector("[data-viewer-poster]");
  const status = root.querySelector("[data-viewer-status]");
  const modelUrl = root.dataset.modelSrc;
  if (!stage || !modelUrl) return;

  if (!window.WebGLRenderingContext) {
    status.textContent = "La vue 3D n’est pas disponible dans ce navigateur. Le dossier reste lisible ci-dessous.";
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
  camera.position.set(3.15, 2.1, 4.4);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute("aria-label", "Modèle 3D interactif du bois flotté. Glissez pour tourner, pincez ou utilisez la molette pour zoomer.");
  stage.append(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.055;
  controls.enablePan = false;
  controls.minDistance = 2.2;
  controls.maxDistance = 7;
  controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  controls.autoRotateSpeed = 0.42;

  scene.add(new THREE.HemisphereLight(0xf3efe4, 0x30394a, 2.7));
  const key = new THREE.DirectionalLight(0xffffff, 3.4);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xb8c5df, 2.1);
  rim.position.set(-4, 1, -3);
  scene.add(rim);

  let visible = true;
  let loaded = false;
  const resize = () => {
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(stage);
  resize();

  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0.01 });
    visibilityObserver.observe(root);
  }

  const render = () => {
    window.requestAnimationFrame(render);
    if (!loaded || !visible || document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  };
  render();

  new GLTFLoader().load(modelUrl, (gltf) => {
    const model = gltf.scene;
    const bounds = new THREE.Box3().setFromObject(model);
    const size = bounds.getSize(new THREE.Vector3());
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 2.8 / Math.max(size.x, size.y, size.z);
    model.position.sub(center);
    model.scale.setScalar(scale);
    model.rotation.y = -0.45;
    scene.add(model);
    mountModelProjections(model);

    const framedBounds = new THREE.Box3().setFromObject(model);
    controls.target.copy(framedBounds.getCenter(new THREE.Vector3()));
    controls.update();
    loaded = true;
    root.classList.add("is-model-loaded");
    if (poster) poster.hidden = true;
    status.textContent = "Objet chargé — glissez pour tourner, molette ou pincement pour zoomer.";
    renderer.render(scene, camera);
  }, (event) => {
    if (!event.total) {
      status.textContent = "Chargement de l’objet 3D haute définition…";
      return;
    }
    const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));
    status.textContent = `Chargement du modèle 8K — ${percent} %`;
  }, () => {
    status.textContent = "Le modèle n’a pas pu être chargé. L’image et le dossier restent disponibles.";
    root.classList.add("has-viewer-error");
  });
}
