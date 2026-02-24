import { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Custom hook that sets up a Three.js scene with a 3D arcade cabinet.
 * Optionally uses a game canvas as a texture for the screen.
 */
export function useArcadeScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameCanvasRef?: React.RefObject<HTMLCanvasElement>
): void {
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const frameIdRef = useRef<number>(0);
  const screenTextureRef = useRef<THREE.CanvasTexture | null>(null);
  const geometriesRef = useRef<THREE.BufferGeometry[]>([]);
  const materialsRef = useRef<THREE.Material[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    sceneRef.current = scene;

    // --- Camera Setup ---
    const aspect = canvas.clientWidth / canvas.clientHeight || 1;
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    camera.position.set(0, 1.5, 5);
    camera.lookAt(0, 0.5, 0);
    cameraRef.current = camera;

    // --- Renderer Setup ---
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;

    // --- Colors ---
    const darkGrey = 0x1a1a2e;
    const accentPurple = 0x9d00ff;
    const accentCyan = 0x00ffff;
    const bezelColor = 0x0f0f1a;
    const controlPanelColor = 0x2a2a4a;

    // --- Materials ---
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: darkGrey,
      roughness: 0.7,
      metalness: 0.3,
    });
    materialsRef.current.push(bodyMaterial);

    const bezelMaterial = new THREE.MeshStandardMaterial({
      color: bezelColor,
      roughness: 0.5,
      metalness: 0.4,
    });
    materialsRef.current.push(bezelMaterial);

    const accentMaterialCyan = new THREE.MeshStandardMaterial({
      color: accentCyan,
      emissive: accentCyan,
      emissiveIntensity: 0.8,
      roughness: 0.3,
      metalness: 0.6,
    });
    materialsRef.current.push(accentMaterialCyan);

    const accentMaterialPurple = new THREE.MeshStandardMaterial({
      color: accentPurple,
      emissive: accentPurple,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.6,
    });
    materialsRef.current.push(accentMaterialPurple);

    const controlPanelMaterial = new THREE.MeshStandardMaterial({
      color: controlPanelColor,
      roughness: 0.6,
      metalness: 0.2,
    });
    materialsRef.current.push(controlPanelMaterial);

    // --- Screen Texture ---
    let screenMaterial: THREE.MeshStandardMaterial;

    if (gameCanvasRef?.current) {
      // Use game canvas as texture
      const texture = new THREE.CanvasTexture(gameCanvasRef.current);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      screenTextureRef.current = texture;

      screenMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0xffffff,
        emissiveMap: texture,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0.0,
      });
    } else {
      // Create scanline effect with offscreen canvas
      const scanlineCanvas = document.createElement('canvas');
      scanlineCanvas.width = 256;
      scanlineCanvas.height = 256;
      const ctx = scanlineCanvas.getContext('2d');

      if (ctx) {
        // Dark background
        ctx.fillStyle = '#0a0a0f';
        ctx.fillRect(0, 0, 256, 256);

        // Scanlines
        ctx.strokeStyle = 'rgba(0, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let y = 0; y < 256; y += 4) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(256, y);
          ctx.stroke();
        }

        // Add subtle noise/static
        ctx.fillStyle = 'rgba(0, 255, 255, 0.05)';
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * 256;
          const y = Math.random() * 256;
          ctx.fillRect(x, y, 2, 2);
        }

        // "INSERT COIN" text
        ctx.fillStyle = '#00ffff';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('INSERT COIN', 128, 128);
      }

      const texture = new THREE.CanvasTexture(scanlineCanvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      screenTextureRef.current = texture;

      screenMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: 0x00ffff,
        emissiveMap: texture,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.0,
      });
    }
    materialsRef.current.push(screenMaterial);

    // --- Arcade Cabinet Group ---
    const arcadeCabinet = new THREE.Group();

    // Main body (lower section)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 2.0, 0.8);
    geometriesRef.current.push(bodyGeometry);
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.set(0, 1.0, 0);
    arcadeCabinet.add(body);

    // Monitor section (upper angled part)
    const monitorBackGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.6);
    geometriesRef.current.push(monitorBackGeometry);
    const monitorBack = new THREE.Mesh(monitorBackGeometry, bodyMaterial);
    monitorBack.position.set(0, 2.4, -0.1);
    monitorBack.rotation.x = -0.15;
    arcadeCabinet.add(monitorBack);

    // Monitor bezel
    const bezelGeometry = new THREE.BoxGeometry(1.0, 0.9, 0.1);
    geometriesRef.current.push(bezelGeometry);
    const bezel = new THREE.Mesh(bezelGeometry, bezelMaterial);
    bezel.position.set(0, 2.4, 0.26);
    bezel.rotation.x = -0.15;
    arcadeCabinet.add(bezel);

    // Screen
    const screenGeometry = new THREE.BoxGeometry(0.85, 0.75, 0.02);
    geometriesRef.current.push(screenGeometry);
    const screen = new THREE.Mesh(screenGeometry, screenMaterial);
    screen.position.set(0, 2.4, 0.32);
    screen.rotation.x = -0.15;
    arcadeCabinet.add(screen);

    // Control panel (angled)
    const controlPanelGeometry = new THREE.BoxGeometry(1.2, 0.5, 0.6);
    geometriesRef.current.push(controlPanelGeometry);
    const controlPanel = new THREE.Mesh(controlPanelGeometry, controlPanelMaterial);
    controlPanel.position.set(0, 1.6, 0.5);
    controlPanel.rotation.x = 0.4;
    arcadeCabinet.add(controlPanel);

    // Joystick base
    const joystickBaseGeometry = new THREE.BoxGeometry(0.15, 0.08, 0.15);
    geometriesRef.current.push(joystickBaseGeometry);
    const joystickBase = new THREE.Mesh(joystickBaseGeometry, accentMaterialPurple);
    joystickBase.position.set(-0.2, 1.85, 0.55);
    arcadeCabinet.add(joystickBase);

    // Buttons
    const buttonGeometry = new THREE.BoxGeometry(0.1, 0.05, 0.1);
    geometriesRef.current.push(buttonGeometry);

    const button1 = new THREE.Mesh(buttonGeometry, accentMaterialCyan);
    button1.position.set(0.15, 1.85, 0.5);
    arcadeCabinet.add(button1);

    const button2 = new THREE.Mesh(buttonGeometry, accentMaterialPurple);
    button2.position.set(0.3, 1.85, 0.5);
    arcadeCabinet.add(button2);

    // Marquee top (illuminated sign area)
    const marqueeGeometry = new THREE.BoxGeometry(1.2, 0.4, 0.15);
    geometriesRef.current.push(marqueeGeometry);
    const marquee = new THREE.Mesh(marqueeGeometry, accentMaterialCyan);
    marquee.position.set(0, 3.15, 0.1);
    arcadeCabinet.add(marquee);

    // Side panel accents (left)
    const sidePanelGeometry = new THREE.BoxGeometry(0.05, 1.8, 0.7);
    geometriesRef.current.push(sidePanelGeometry);
    const leftSideAccent = new THREE.Mesh(sidePanelGeometry, accentMaterialPurple);
    leftSideAccent.position.set(-0.625, 1.8, 0);
    arcadeCabinet.add(leftSideAccent);

    // Side panel accents (right)
    const rightSideAccent = new THREE.Mesh(sidePanelGeometry, accentMaterialPurple);
    rightSideAccent.position.set(0.625, 1.8, 0);
    arcadeCabinet.add(rightSideAccent);

    // Base trim
    const baseTrimGeometry = new THREE.BoxGeometry(1.3, 0.1, 0.9);
    geometriesRef.current.push(baseTrimGeometry);
    const baseTrim = new THREE.Mesh(baseTrimGeometry, accentMaterialCyan);
    baseTrim.position.set(0, 0.05, 0);
    arcadeCabinet.add(baseTrim);

    scene.add(arcadeCabinet);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const pointLightCyan = new THREE.PointLight(accentCyan, 1.5, 10);
    pointLightCyan.position.set(2, 3, 3);
    scene.add(pointLightCyan);

    const pointLightPurple = new THREE.PointLight(accentPurple, 1.2, 10);
    pointLightPurple.position.set(-2, 2, 2);
    scene.add(pointLightPurple);

    const frontLight = new THREE.PointLight(0xffffff, 0.5, 8);
    frontLight.position.set(0, 2, 4);
    scene.add(frontLight);

    // --- Animation ---
    let time = 0;
    const baseRotationY = arcadeCabinet.rotation.y;
    const maxRotation = (5 * Math.PI) / 180; // 5 degrees in radians

    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      time += 0.01;

      // Subtle idle rotation on Y axis (±5°)
      arcadeCabinet.rotation.y = baseRotationY + Math.sin(time) * maxRotation;

      // Update screen texture if game canvas is provided
      if (gameCanvasRef?.current && screenTextureRef.current) {
        screenTextureRef.current.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // --- Resize Handling ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        }
      }
    });

    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(frameIdRef.current);
      resizeObserver.disconnect();

      // Dispose geometries
      geometriesRef.current.forEach((geometry) => geometry.dispose());
      geometriesRef.current = [];

      // Dispose materials
      materialsRef.current.forEach((material) => {
        if (material instanceof THREE.MeshStandardMaterial) {
          if (material.map) material.map.dispose();
          if (material.emissiveMap) material.emissiveMap.dispose();
        }
        material.dispose();
      });
      materialsRef.current = [];

      // Dispose texture
      if (screenTextureRef.current) {
        screenTextureRef.current.dispose();
        screenTextureRef.current = null;
      }

      // Dispose renderer
      renderer.dispose();

      // Clear refs
      sceneRef.current = null;
      rendererRef.current = null;
      cameraRef.current = null;
    };
  }, [canvasRef, gameCanvasRef]);
}
