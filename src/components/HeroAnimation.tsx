import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const HeroAnimation = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // --- SCENE SETUP ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF7F5F0); // Match landing page background
    scene.fog = new THREE.Fog(0xF7F5F0, 10, 50);

    const camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 1000);
    camera.position.set(0, 0, 32); // Frontal view, zoomed out to fit animation
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // --- LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0xF7F5F0, 0.8);
    scene.add(ambientLight);

    // Main Sun
    const dirLight = new THREE.DirectionalLight(0xF7F5F0, 1.0);
    dirLight.position.set(5, 10, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    scene.add(dirLight);

    // Accent Light (Red Glow - matches landing page)
    const accentLight = new THREE.PointLight(0xE74C3C, 0.5, 30);
    accentLight.position.set(0, 0, 5);
    scene.add(accentLight);

    // --- MATERIALS ---
    
    // "Before" Paper (Crumpled, messy) - Dark for visibility
    const paperMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A, // Dark color matching landing page text
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide
    });

    // "After" Card (Clean, Tech) - Dark for visibility
    const cardMat = new THREE.MeshStandardMaterial({
      color: 0x1A1A1A, // Dark color matching landing page text
      roughness: 0.4,
      metalness: 0.0,
    });

    // Glass Panel (The Interface)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.0,
      metalness: 0.0,
      transmission: 0.1, // Clear glass
      opacity: 0.3,
      transparent: true,
      side: THREE.DoubleSide
    });

    // UI Accents - Match landing page colors
    const uiOrange = new THREE.MeshBasicMaterial({ color: 0xE74C3C }); // Red accent
    const uiGrey = new THREE.MeshBasicMaterial({ color: 0xF7F5F0 });
    const uiText = new THREE.MeshBasicMaterial({ color: 0x1A1A1A }); // Dark text

    // --- BUILD SCENE ELEMENTS ---

    // 1. The "Scanner/Lens" (Center)
    const lensGroup = new THREE.Group();
    scene.add(lensGroup);

    // Glass Ring - Dark for visibility
    const ringGeo = new THREE.TorusGeometry(5.5, 0.08, 16, 100);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x1A1A1A, transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    lensGroup.add(ring);

    // The "Processing Core" (Crystal inside lens) - Dark for visibility
    const coreGeo = new THREE.OctahedronGeometry(1.6, 0); // Geometric crystal shape
    const coreMat = new THREE.MeshBasicMaterial({ 
      color: 0x1A1A1A, 
      wireframe: true,
      transparent: true,
      opacity: 0.9
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    lensGroup.add(core);

    // Inner Glow Sphere
    const glowGeo = new THREE.SphereGeometry(0.8, 16, 16);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0xF7F5F0 });
    const glow = new THREE.Mesh(glowGeo, glowMat);
    lensGroup.add(glow);

    // 2. "After" Interface Plate (Right)
    const interfaceGroup = new THREE.Group();
    interfaceGroup.position.set(9, 0, 0);
    scene.add(interfaceGroup);

    // Backing Plate
    const plateGeo = new THREE.BoxGeometry(9, 13, 0.2);
    const plate = new THREE.Mesh(plateGeo, glassMat);
    plate.castShadow = true;
    interfaceGroup.add(plate);

    // --- OBJECT POOLS ---
    const flyingPapers: Array<{ mesh: THREE.Mesh; t: number; speed: number }> = [];
    const organizedCards: Array<{ mesh: THREE.Group; targetY: number }> = [];

    // GENERATORS

    function createMessyPaper() {
      const w = 1.8; const h = 2.4;
      const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.03), paperMat);
      
      // Spawn in "Chaos Zone" (Left)
      const spread = 4.5;
      mesh.position.set(
        -10 + (Math.random()-0.5)*spread,
        (Math.random()-0.5)*spread * 1.5,
        (Math.random()-0.5)*spread
      );
      
      // Random Rotation
      mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, Math.random()*Math.PI);
      
      mesh.castShadow = true;
      scene.add(mesh);
      
      return { mesh, t: 0, speed: 0.005 + Math.random() * 0.005 };
    }

    function createCleanCard() {
      const grp = new THREE.Group();
      
      // Card Body
      const card = new THREE.Mesh(new THREE.BoxGeometry(6.75, 1.2, 0.08), cardMat);
      card.castShadow = true;
      grp.add(card);

      // UI Elements (Simulated Text)
      const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.75), uiOrange);
      icon.position.set(-2.55, 0, 0.05);
      grp.add(icon);

      const title = new THREE.Mesh(new THREE.PlaneGeometry(3.75, 0.225), uiText);
      title.position.set(0, 0.15, 0.05);
      grp.add(title);

      const sub = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 0.15), uiGrey);
      sub.position.set(-0.75, -0.225, 0.05);
      grp.add(sub);
      
      // Start at Lens position
      grp.position.set(0, 0, 0); 
      grp.scale.set(0,0,0); // Grow in

      scene.add(grp);
      return { mesh: grp, targetY: 0 };
    }

    // Initialize Chaos
    for(let i=0; i<15; i++) {
      flyingPapers.push(createMessyPaper());
    }

    // Logic to stack cards
    let stackOffset = 3; 

    function spawnOrganizedCard() {
      const cardObj = createCleanCard();
      // Assign target Y (Top of list)
      cardObj.targetY = 5.5; 
      
      // Shift all existing cards down
      organizedCards.forEach(c => {
        c.targetY -= 1.5; // Shift down by card height + gap
      });

      organizedCards.push(cardObj);
    }

    // --- ANIMATION LOOP ---
    
    let frame = 0;

    function animate() {
      animationRef.current = requestAnimationFrame(animate);
      frame++;

      const time = Date.now() * 0.001;

      // 1. Animate Lens
      lensGroup.rotation.y = Math.sin(time) * 0.1;
      lensGroup.position.y = Math.cos(time * 0.5) * 0.2;

      // Animate Core
      core.rotation.x = time * 0.5;
      core.rotation.y = time * 0.8;
      glow.scale.setScalar(0.8 + Math.sin(time * 3) * 0.2); // Pulse effect

      // 2. Animate "Interface" Plate
      interfaceGroup.rotation.y = -0.1 + Math.sin(time * 0.3) * 0.05;
      interfaceGroup.position.y = Math.sin(time * 0.4) * 0.1;

      // 3. Process Papers (Left -> Center)
      flyingPapers.forEach((p) => {
        // Float in chaos
        p.mesh.rotation.x += 0.01;
        p.mesh.rotation.y += 0.01;
        
        // Move towards center (0,0,0)
        const target = new THREE.Vector3(0, 0, 0);
        const dir = new THREE.Vector3().subVectors(target, p.mesh.position).normalize();
        
        // Sucking effect speed
        const dist = p.mesh.position.length();
        let speed = 0.02;
        if(dist < 4) speed = 0.05;
        if(dist < 2) speed = 0.1;

        p.mesh.position.add(dir.multiplyScalar(speed));

        // Shrink as they enter the lens
        if(dist < 2.5) {
          p.mesh.scale.multiplyScalar(0.9);
        }

        // Reset if absorbed
        if(dist < 0.3) {
          // Respawn on left
          const spread = 4.5;
          p.mesh.position.set(
            -11 + (Math.random()-0.5)*spread,
            (Math.random()-0.5)*spread * 2,
            (Math.random()-0.5)*spread
          );
          p.mesh.scale.set(1,1,1);
          
          // Trigger a "Clean Card" creation
          spawnOrganizedCard();
        }
      });

      // 4. Process Cards (Center -> Right Stack)
      for(let i = organizedCards.length -1; i >= 0; i--) {
        const card = organizedCards[i];
        
        // 1. Move to Right Plate (x=9)
        // Lerp towards X=9, Z=0.2
        card.mesh.position.x += (9 - card.mesh.position.x) * 0.08;
        card.mesh.position.z += (0.2 - card.mesh.position.z) * 0.08;

        // 2. Move to Stack Height (TargetY)
        card.mesh.position.y += (card.targetY - card.mesh.position.y) * 0.08;

        // 3. Align Rotation to Plate
        // Plate is roughly flat, maybe slight tilt
        card.mesh.rotation.x *= 0.9;
        card.mesh.rotation.y *= 0.9;
        card.mesh.rotation.z *= 0.9;

        // 4. Scale In
        if(card.mesh.scale.x < 1) {
          card.mesh.scale.addScalar(0.05);
        }

        // 5. Scroll Down logic (List Effect)
        // If it goes below plate, remove
        if(card.mesh.position.x > 8.5) {
          // It's in the list now, move it down slowly
          card.targetY -= 0.005; // Auto scroll
        }

        if(card.mesh.position.y < -6) {
          scene.remove(card.mesh);
          organizedCards.splice(i, 1);
        }
      }

      renderer.render(scene, camera);
    }

    animate();

    // --- RESIZE ---
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      aria-hidden="true"
    />
  );
};
