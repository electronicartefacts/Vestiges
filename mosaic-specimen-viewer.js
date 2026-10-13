import * as THREE from "/assets/vendor/three/three.module.min.js";
import { GLTFLoader } from "/assets/vendor/three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "/assets/vendor/three/addons/controls/OrbitControls.js";

export function mountSpecimenVolume(stage) {
  if (!stage || !stage.isConnected || stage.dataset.viewerReady === "true" || stage.dataset.viewerLoading === "true") return;
  const source = stage.dataset.modelSrc;
  const message = stage.querySelector(".specimen-3d-loading");
  const loadButton = stage.querySelector("[data-load-specimen]");
  if (!source) throw new Error("Fichier GLB absent");

  let disposed = false;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let visible = false;
  let frame = 0;
  let renderer;
  let camera;
  let scene;
  let controls;
  let resizeObserver;
  let visibilityObserver;
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
    if (disposed || !stage.isConnected || !visible || document.hidden || !renderer || !controls) return;
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
    if (disposed || !stage.isConnected || !stage.getClientRects().length) return;
    visible = true;
    if (!frame && stage.dataset.viewerReady === "true") render();
  };
  const handleVisibilityChange = () => {
    if (disposed || document.hidden || !stage.isConnected || !stage.getClientRects().length) { stop(); return; }
    const bounds = stage.getBoundingClientRect();
    if (bounds.bottom > -180 && bounds.top < window.innerHeight + 180) start();
  };
  const disposeScene = (root) => {
    const geometries = new Set();
    const materials = new Set();
    const textures = new Set();
    root?.traverse((object) => {
      if (object.geometry) geometries.add(object.geometry);
      for (const material of Array.isArray(object.material) ? object.material : object.material ? [object.material] : []) {
        materials.add(material);
        for (const value of Object.values(material)) if (value?.isTexture) textures.add(value);
      }
    });
    geometries.forEach(geometry => geometry.dispose());
    materials.forEach(material => material.dispose());
    textures.forEach(texture => texture.dispose());
  };
  const resetFailedAttempt = () => {
    stop();
    resizeObserver?.disconnect();
    visibilityObserver?.disconnect();
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    controls?.dispose();
    disposeScene(scene);
    if (renderer) {
      renderer.domElement.remove();
      renderer.dispose();
    }
    controls = null;
    renderer = null;
    camera = null;
    scene = null;
    stage.dataset.viewerReady = "false";
    stage.dataset.viewerLoading = "false";
    stage.dataset.mounted = "false";
  };
  const handleMotionChange = () => { if (controls) controls.autoRotate = !reduceMotion.matches; };
  const dispose = () => {
    disposed = true;
    resetFailedAttempt();
    reduceMotion.removeEventListener("change", handleMotionChange);
    stage.removeEventListener("vestiges:dispose-viewer", dispose);
  };
  stage.addEventListener("vestiges:dispose-viewer", dispose, { once: true });
  reduceMotion.addEventListener("change", handleMotionChange);
  const showRetry = (buttonText, status) => {
    dispose();
    if (loadButton) {
      loadButton.disabled = false;
      loadButton.textContent = buttonText;
    }
    showStatus(status, true);
  };

  const loadModel = () => {
    if (loadButton) {
      loadButton.disabled = true;
      loadButton.textContent = "Chargement du modèle 3D…";
    }
    showStatus("Chargement du modèle 3D…");
    if (!window.WebGLRenderingContext) {
      showRetry("Réessayer la vue 3D · ≈ 71 Mo", "La vue 3D n’est pas disponible dans ce navigateur.");
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
      controls.autoRotate = !reduceMotion.matches;
      controls.autoRotateSpeed = 0.34;

      new GLTFLoader().load(source, (gltf) => {
        if (disposed) { disposeScene(gltf.scene); return; }
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
        if (loadButton) loadButton.hidden = true;
        stage.classList.remove("is-viewer-fallback");
        if (visible) render();
      }, (event) => {
        if (!disposed && event.total) showStatus(`Chargement du modèle · ${Math.min(99, Math.round(event.loaded / event.total * 100))} %`);
      }, () => {
        if (disposed) return;
        showRetry("Réessayer le chargement · ≈ 71 Mo", "Le modèle 3D n’a pas pu être chargé.");
      });
    } catch (_error) {
      showRetry("Réessayer la vue 3D · ≈ 71 Mo", "La vue 3D n’est pas disponible dans ce navigateur.");
    }
  };

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(stage);
  if ("IntersectionObserver" in window) {
    visibilityObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) start();
      else stop();
    }, { rootMargin: "180px 0px", threshold: 0.01 });
    visibilityObserver.observe(stage);
  } else start();
  document.addEventListener("visibilitychange", handleVisibilityChange);
  loadModel();
}
