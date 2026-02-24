import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

// Screen position constants for camera animation target
const SCREEN_POSITION = { x: 0, y: 2.35, z: 0.27 };
const INITIAL_CAMERA = { x: 0, y: 2.5, z: 6 };
const ZOOMED_CAMERA = { x: 0, y: 2.35, z: 2.2 };

// Easing function for smooth animation
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function useDetailedArcadeScene(
  canvasRef: React.RefObject<HTMLCanvasElement>,
  gameCanvasRef?: React.RefObject<HTMLCanvasElement>,
  gameId?: string,
  gameStarted?: boolean
): void {
  const geometriesRef = useRef<THREE.BufferGeometry[]>([]);
  const materialsRef = useRef<THREE.Material[]>([]);
  const texturesRef = useRef<THREE.Texture[]>([]);

  // Use refs for animation state to persist across re-renders
  const cameraAnimationProgressRef = useRef(0);
  const animationStartTimeRef = useRef<number | null>(null);
  const gameStartedRef = useRef(gameStarted);

  // Update gameStarted ref when prop changes (without triggering effect re-run)
  gameStartedRef.current = gameStarted;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    // Animation state for camera fly-in (use refs to persist across re-renders)
    const hasGame = !!gameId;
    const animationDuration = 2000; // 2 seconds for camera fly-in

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);

    // Camera - start from initial position
    const camera = new THREE.PerspectiveCamera(
      50,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      100
    );
    camera.position.set(INITIAL_CAMERA.x, INITIAL_CAMERA.y, INITIAL_CAMERA.z);
    camera.lookAt(SCREEN_POSITION.x, SCREEN_POSITION.y - 0.5, SCREEN_POSITION.z);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);

    // OrbitControls
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 1.5, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = 0.2;
    controls.maxPolarAngle = Math.PI * 0.75;

    // If we have a game, start with controls disabled for fly-in animation
    if (hasGame) {
      controls.enabled = false;
      controls.minDistance = 1.5;
      controls.maxDistance = 4;
    }

    // Cabinet Group
    const cabinetGroup = new THREE.Group();
    scene.add(cabinetGroup);

    // Helper function to track geometry
    const trackGeometry = <T extends THREE.BufferGeometry>(geo: T): T => {
      geometries.push(geo);
      return geo;
    };

    // Helper function to track material
    const trackMaterial = <T extends THREE.Material>(mat: T): T => {
      materials.push(mat);
      return mat;
    };

    // Helper function to track texture
    const trackTexture = <T extends THREE.Texture>(tex: T): T => {
      textures.push(tex);
      return tex;
    };

    // --- Cabinet Geometry ---

    // Lower body
    const lowerBodyGeo = trackGeometry(new THREE.BoxGeometry(1.2, 1.8, 0.75));
    const lowerBodyMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    const lowerBody = new THREE.Mesh(lowerBodyGeo, lowerBodyMat);
    lowerBody.position.set(0, 0.9, 0);
    cabinetGroup.add(lowerBody);

    // Upper monitor housing
    const upperHousingGeo = trackGeometry(new THREE.BoxGeometry(1.2, 1.3, 0.6));
    const upperHousingMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    const upperHousing = new THREE.Mesh(upperHousingGeo, upperHousingMat);
    upperHousing.position.set(0, 2.35, -0.08);
    upperHousing.rotation.x = -0.12;
    cabinetGroup.add(upperHousing);

    // Bezel
    const bezelGeo = trackGeometry(new THREE.BoxGeometry(1.05, 0.95, 0.08));
    const bezelMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
    const bezel = new THREE.Mesh(bezelGeo, bezelMat);
    bezel.position.set(0, 2.35, 0.22);
    bezel.rotation.x = -0.12;
    cabinetGroup.add(bezel);

    // CRT Screen - create a canvas for the screen display
    const screenCanvas = document.createElement('canvas');
    screenCanvas.width = 512;
    screenCanvas.height = 448;
    const screenCtx = screenCanvas.getContext('2d');

    // Function to draw the default "INSERT COIN" screen
    const drawDefaultScreen = () => {
      if (!screenCtx) return;

      // Dark background
      screenCtx.fillStyle = '#001a1a';
      screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);

      // Scanlines
      screenCtx.fillStyle = 'rgba(0, 255, 255, 0.03)';
      for (let y = 0; y < screenCanvas.height; y += 2) {
        screenCtx.fillRect(0, y, screenCanvas.width, 1);
      }

      // Game title if we have a gameId
      if (gameId) {
        const title = gameId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        screenCtx.fillStyle = '#00ffff';
        screenCtx.font = 'bold 48px monospace';
        screenCtx.textAlign = 'center';
        screenCtx.textBaseline = 'middle';
        screenCtx.fillText(title.toUpperCase(), screenCanvas.width / 2, screenCanvas.height / 2 - 60);

        // "PRESS START" blinking text
        screenCtx.fillStyle = '#ffff00';
        screenCtx.font = 'bold 32px monospace';
        screenCtx.fillText('PRESS START', screenCanvas.width / 2, screenCanvas.height / 2 + 20);

        // Controls hint
        screenCtx.fillStyle = '#888888';
        screenCtx.font = '20px monospace';
        screenCtx.fillText('Press ENTER or SPACE', screenCanvas.width / 2, screenCanvas.height / 2 + 80);
      } else {
        // Default INSERT COIN text
        screenCtx.fillStyle = '#00ffff';
        screenCtx.font = 'bold 48px monospace';
        screenCtx.textAlign = 'center';
        screenCtx.textBaseline = 'middle';
        screenCtx.fillText('INSERT COIN', screenCanvas.width / 2, screenCanvas.height / 2);
      }

      // Additional scanline overlay
      screenCtx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      for (let y = 0; y < screenCanvas.height; y += 4) {
        screenCtx.fillRect(0, y, screenCanvas.width, 2);
      }
    };

    // Function to draw the game canvas onto the screen with CRT effects
    const drawGameScreen = () => {
      if (!screenCtx) return;

      const gameCanvas = gameCanvasRef?.current;
      if (gameCanvas && gameCanvas.width > 0 && gameCanvas.height > 0) {
        // Clear screen
        screenCtx.fillStyle = '#000000';
        screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);

        // Draw the game canvas scaled to fit the screen
        const scale = Math.min(
          screenCanvas.width / gameCanvas.width,
          screenCanvas.height / gameCanvas.height
        );
        const scaledWidth = gameCanvas.width * scale;
        const scaledHeight = gameCanvas.height * scale;
        const offsetX = (screenCanvas.width - scaledWidth) / 2;
        const offsetY = (screenCanvas.height - scaledHeight) / 2;

        screenCtx.drawImage(gameCanvas, offsetX, offsetY, scaledWidth, scaledHeight);

        // Add CRT scanline effect overlay
        screenCtx.fillStyle = 'rgba(0, 0, 0, 0.08)';
        for (let y = 0; y < screenCanvas.height; y += 3) {
          screenCtx.fillRect(0, y, screenCanvas.width, 1);
        }

        // Add subtle screen glow/bloom effect at edges
        const gradient = screenCtx.createRadialGradient(
          screenCanvas.width / 2, screenCanvas.height / 2, 0,
          screenCanvas.width / 2, screenCanvas.height / 2, screenCanvas.width / 1.5
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        screenCtx.fillStyle = gradient;
        screenCtx.fillRect(0, 0, screenCanvas.width, screenCanvas.height);
      } else {
        drawDefaultScreen();
      }
    };

    // Initial screen draw
    drawDefaultScreen();

    const screenTexture = trackTexture(new THREE.CanvasTexture(screenCanvas));
    screenTexture.colorSpace = THREE.SRGBColorSpace;
    screenTexture.minFilter = THREE.LinearFilter;
    screenTexture.magFilter = THREE.LinearFilter;

    const screenGeo = trackGeometry(new THREE.PlaneGeometry(0.82, 0.72));
    const screenMat = trackMaterial(new THREE.MeshStandardMaterial({
      map: screenTexture,
      emissive: 0x00ffff,
      emissiveIntensity: 1.8,
      emissiveMap: screenTexture
    }));
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(SCREEN_POSITION.x, SCREEN_POSITION.y, SCREEN_POSITION.z);
    screen.rotation.x = -0.12;
    cabinetGroup.add(screen);

    // Marquee
    const marqueeGeo = trackGeometry(new THREE.BoxGeometry(1.2, 0.38, 0.18));
    const marqueeMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 1.2
    }));
    const marquee = new THREE.Mesh(marqueeGeo, marqueeMat);
    marquee.position.set(0, 3.2, 0.05);
    cabinetGroup.add(marquee);

    // Control panel
    const controlPanelGeo = trackGeometry(new THREE.BoxGeometry(1.2, 0.45, 0.65));
    const controlPanelMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1a1a2e }));
    const controlPanel = new THREE.Mesh(controlPanelGeo, controlPanelMat);
    controlPanel.position.set(0, 1.6, 0.48);
    controlPanel.rotation.x = 0.42;
    cabinetGroup.add(controlPanel);

    // Joystick shaft
    const joystickShaftGeo = trackGeometry(new THREE.CylinderGeometry(0.025, 0.025, 0.22, 10));
    const joystickShaftMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x888888,
      metalness: 0.8,
      roughness: 0.2
    }));
    const joystickShaft = new THREE.Mesh(joystickShaftGeo, joystickShaftMat);
    joystickShaft.position.set(-0.22, 1.9, 0.52);
    cabinetGroup.add(joystickShaft);

    // Joystick ball
    const joystickBallGeo = trackGeometry(new THREE.SphereGeometry(0.055, 12, 12));
    const joystickBallMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 0.5
    }));
    const joystickBall = new THREE.Mesh(joystickBallGeo, joystickBallMat);
    joystickBall.position.set(-0.22, 1.9 + 0.12, 0.52);
    cabinetGroup.add(joystickBall);

    // Six action buttons (2 rows of 3)
    const buttonGeo = trackGeometry(new THREE.CylinderGeometry(0.04, 0.04, 0.04, 16));
    const buttonXPositions = [0.12, 0.25, 0.38];
    const buttonRows = [
      { yOffset: 0, zOffset: 0 },
      { yOffset: -0.08, zOffset: 0.06 }
    ];

    const cyanButtonMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    }));
    const purpleButtonMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 0.5
    }));

    buttonRows.forEach((row, rowIndex) => {
      buttonXPositions.forEach((x, colIndex) => {
        const button = new THREE.Mesh(buttonGeo, (rowIndex + colIndex) % 2 === 0 ? cyanButtonMat : purpleButtonMat);
        button.position.set(x, 1.85 + row.yOffset, 0.55 + row.zOffset);
        button.rotation.x = 0.42; // Match control panel tilt
        cabinetGroup.add(button);
      });
    });

    // Coin slot
    const coinSlotGeo = trackGeometry(new THREE.BoxGeometry(0.12, 0.03, 0.02));
    const coinSlotMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x0a0a0a }));
    const coinSlot = new THREE.Mesh(coinSlotGeo, coinSlotMat);
    coinSlot.position.set(0, 1.28, 0.38);
    cabinetGroup.add(coinSlot);

    // Speaker grille (4 strips)
    const speakerStripGeo = trackGeometry(new THREE.BoxGeometry(0.5, 0.015, 0.02));
    const speakerStripMat = trackMaterial(new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
    for (let i = 0; i < 4; i++) {
      const strip = new THREE.Mesh(speakerStripGeo, speakerStripMat);
      strip.position.set(0, 1.05 + i * 0.06, 0.38);
      cabinetGroup.add(strip);
    }

    // Side panels (left and right)
    const sidePanelGeo = trackGeometry(new THREE.BoxGeometry(0.04, 1.75, 0.72));
    const sidePanelMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x9d00ff,
      emissive: 0x9d00ff,
      emissiveIntensity: 0.3
    }));
    const leftPanel = new THREE.Mesh(sidePanelGeo, sidePanelMat);
    leftPanel.position.set(-0.62, 0.9, 0);
    cabinetGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(sidePanelGeo, sidePanelMat);
    rightPanel.position.set(0.62, 0.9, 0);
    cabinetGroup.add(rightPanel);

    // Base trim
    const baseTrimGeo = trackGeometry(new THREE.BoxGeometry(1.3, 0.1, 0.85));
    const baseTrimMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.5
    }));
    const baseTrim = new THREE.Mesh(baseTrimGeo, baseTrimMat);
    baseTrim.position.set(0, 0.05, 0);
    cabinetGroup.add(baseTrim);

    // --- Lighting ---

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);

    // Under-cabinet neon lights
    const cyanNeonLight = new THREE.PointLight(0x00ffff, 2.0, 8);
    cyanNeonLight.position.set(1.5, 0.3, 1);
    scene.add(cyanNeonLight);

    const purpleNeonLight = new THREE.PointLight(0x9d00ff, 1.8, 8);
    purpleNeonLight.position.set(-1.5, 0.3, 1);
    scene.add(purpleNeonLight);

    // Front fill light
    const frontFillLight = new THREE.PointLight(0xffffff, 0.6, 10);
    frontFillLight.position.set(0, 3, 4);
    scene.add(frontFillLight);

    // Marquee backlight
    const marqueeLight = new THREE.PointLight(0x00ffff, 1.5, 5);
    marqueeLight.position.set(0, 3.3, 0.3);
    scene.add(marqueeLight);

    // --- Ground ---

    const groundGeo = trackGeometry(new THREE.PlaneGeometry(10, 10));
    const groundMat = trackMaterial(new THREE.MeshStandardMaterial({
      color: 0x0a0a0f,
      roughness: 0.8,
      metalness: 0.2
    }));
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    scene.add(ground);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0x9d00ff, 0x1a1a3a);
    gridHelper.position.y = 0;
    scene.add(gridHelper);

    // Store refs for cleanup
    geometriesRef.current = geometries;
    materialsRef.current = materials;
    texturesRef.current = textures;

    // --- Animation Loop ---

    let animationFrameId: number;

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);

      // Initialize animation start time (using ref to persist across re-renders)
      if (animationStartTimeRef.current === null) {
        animationStartTimeRef.current = currentTime;
      }

      // Camera fly-in animation when a game is selected
      if (hasGame && cameraAnimationProgressRef.current < 1) {
        const elapsed = currentTime - animationStartTimeRef.current;
        cameraAnimationProgressRef.current = Math.min(elapsed / animationDuration, 1);
        const easedProgress = easeInOutCubic(cameraAnimationProgressRef.current);

        // Interpolate camera position
        camera.position.x = INITIAL_CAMERA.x + (ZOOMED_CAMERA.x - INITIAL_CAMERA.x) * easedProgress;
        camera.position.y = INITIAL_CAMERA.y + (ZOOMED_CAMERA.y - INITIAL_CAMERA.y) * easedProgress;
        camera.position.z = INITIAL_CAMERA.z + (ZOOMED_CAMERA.z - INITIAL_CAMERA.z) * easedProgress;

        // Update controls target to follow the screen
        controls.target.x = SCREEN_POSITION.x;
        controls.target.y = SCREEN_POSITION.y + (1.5 - SCREEN_POSITION.y) * (1 - easedProgress);
        controls.target.z = SCREEN_POSITION.z * easedProgress;

        // Disable controls during animation
        controls.enabled = cameraAnimationProgressRef.current >= 1;
      }

      // Update screen texture with game canvas content (only when game is started)
      // Use ref to check gameStarted to avoid effect re-runs
      const gameCanvas = gameCanvasRef?.current;
      if (gameStartedRef.current && gameCanvas && gameCanvas.width > 0 && gameCanvas.height > 0) {
        drawGameScreen();
        screenTexture.needsUpdate = true;
      } else if (gameId) {
        // Blink the "PRESS START" text
        const blinkOn = Math.floor(currentTime / 500) % 2 === 0;
        if (screenCtx) {
          drawDefaultScreen();
          if (!blinkOn) {
            // Hide "PRESS START" by covering it
            screenCtx.fillStyle = '#001a1a';
            screenCtx.fillRect(screenCanvas.width / 2 - 150, screenCanvas.height / 2 - 10, 300, 60);
          }
          screenTexture.needsUpdate = true;
        }
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate(performance.now());

    // --- Resize Observer ---

    const resizeObserver = new ResizeObserver(() => {
      const parent = canvas.parentElement;
      if (!parent) return;

      const width = parent.clientWidth;
      const height = parent.clientHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    // --- Cleanup ---

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      controls.dispose();

      // Dispose geometries
      geometriesRef.current.forEach((geo) => geo.dispose());

      // Dispose materials and their textures
      materialsRef.current.forEach((mat) => {
        if (mat instanceof THREE.MeshStandardMaterial) {
          if (mat.map) mat.map.dispose();
          if (mat.emissiveMap) mat.emissiveMap.dispose();
        }
        mat.dispose();
      });

      // Dispose tracked textures
      texturesRef.current.forEach((tex) => tex.dispose());

      renderer.dispose();
    };
  }, [canvasRef, gameCanvasRef, gameId]);
}
