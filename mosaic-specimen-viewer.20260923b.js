import * as THREE from "/assets/vendor/three/three.module.min.js";
import { GLTFLoader } from "/assets/vendor/three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "/assets/vendor/three/addons/controls/OrbitControls.js";

export function mountSpecimenVolume(stage) {
  if (!stage || stage.dataset.viewerReady === "true" || stage.dataset.viewerLoading === "true") return;
  const source = stage.dataset.modelSrc;
  const message = stage.querySelector(".specimen-3d-loading");
  if (!source) throw new Error("Fichier GLB absent");

  let visible = false;
  let started = false;
  let frame = 0;
  let renderer;
  let camera;
  let scene;
  let controls;
  stage.dataset.viewerLoading = "true";

  const showStatus = (text, failed = false) => {
    if (message) {
      message.textContent = text;
      message.hidden = false;
    }
    stage.classList.toggle("is-viewer-fallback", failed);
  };

  const render = () => {
    frame = 0;
    if (!visible || document.hidden || !renderer || !controls) return;
    frame = window.requestAnimationFrame(render);
    controls.update();
    renderer.render(scene, camera);
  };
  const stop = () => {
    visible = false;
    if (frame) window.cancelAnimationFrame(frame);
    frame = 0;
  };
  const resize = () => {
    if (!renderer || !camera) return;
    const width = Math.max(1, stage.clientWidth);
    const height = Math.max(1, stage.clientHeight);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    if (visible) renderer.render(scene, camera);
  };
  const start = () => {
    visible = true;
    if (!started) loadModel();
    if (!frame && stage.dataset.viewerReady === "true") render();
  };

  const loadModel = () => {
    started = true;
    showStatus("Chargement du modèle 3D…");
    if (!window.WebGLRenderingContext) {
      stage.dataset.viewerLoading = "false";
      showStatus("La vue 3D n’est pas disponible dans ce navigateur.", true);
      return;
    }

    try {
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(34, 1, 0.01, 100);
      camera.position.set(3.15, 2.1, 4.4);
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      renderer.domElement.setAttribute("role", "img");
      renderer.domElement.setAttribute("aria-label", "Modèle 3D interactif de Bois flotté 01. Glissez pour tourner, molette ou pincement pour zoomer.");
      stage.append(renderer.domElement);

      scene.add(new THREE.HemisphereLight(0xf3efe4, 0x30394a, 2.7));
      const key = new THREE.DirectionalLight(0xffffff, 3.4);
      key.position.set(3, 5, 4);
      scene.add(key);
      const rim = new THREE.DirectionalLight(0xb8c5df, 2.1);
      rim.position.set(-4, 1, -3);
      scene.add(rim);

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.055;
      controls.enablePan = false;
      controls.minDistance = 2.2;
      controls.maxDistance = 7;
      controls.autoRotate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      controls.autoRotateSpeed = 0.34;

      new GLTFLoader().load(source, (gltf) => {
        const model = gltf.scene;
        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        const scale = 2.65 / Math.max(size.x, size.y, size.z);
        model.position.sub(center);
        model.scale.setScalar(scale);
        model.rotation.y = -0.45;
        scene.add(model);
        const framed = new THREE.Box3().setFromObject(model);
        controls.target.copy(framed.getCenter(new THREE.Vector3()));
        controls.update();
        resize();
        stage.dataset.viewerReady = "true";
        stage.dataset.viewerLoading = "false";
        if (message) message.hidden = true;
        stage.classList.remove("is-viewer-fallback");
        if (visible) render();
      }, (event) => {
        if (event.total) showStatus(`Chargement du modèle · ${Math.min(99, Math.round(event.loaded / event.total * 100))} %`);
      }, () => {
        stage.dataset.viewerLoading = "false";
        showStatus("Le modèle 3D n’a pas pu être chargé.", true);
      });
    } catch (_error) {
      stage.dataset.viewerLoading = "false";
      showStatus("La vue 3D n’est pas disponible dans ce navigateur.", true);
    }
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  if ("IntersectionObserver" in window) {
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, { rootMargin: "180px 0px", threshold: 0.01 });
    visibilityObserver.observe(stage);
  } else start();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { stop(); return; }
    const bounds = stage.getBoundingClientRect();
    if (bounds.bottom > -180 && bounds.top < window.innerHeight + 180) start();
  });
}
