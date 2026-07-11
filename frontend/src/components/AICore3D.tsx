import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  MeshDistortMaterial,
  Environment
} from "@react-three/drei";
import { useReducedMotion } from "framer-motion";
import * as THREE from "three";
import { EffectComposer, Bloom, ChromaticAberration, DepthOfField } from "@react-three/postprocessing";

/* ─── Inner Neural Sparks ───────────────────────────────────────────── */
function NeuralParticles({ count = 800 }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = Math.random() * 0.85;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  const colors = useMemo(() => {
    const cols = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      if (rand < 0.65) {
        // Blue energy (#4F9DFF)
        cols[i * 3] = 0.31;
        cols[i * 3 + 1] = 0.62;
        cols[i * 3 + 2] = 1.0;
      } else if (rand < 0.88) {
        // Highlight light (#D8F3FF)
        cols[i * 3] = 0.85;
        cols[i * 3 + 1] = 0.95;
        cols[i * 3 + 2] = 1.0;
      } else {
        // Orange Energy (#FF7B39)
        cols[i * 3] = 1.0;
        cols[i * 3 + 1] = 0.48;
        cols[i * 3 + 2] = 0.22;
      }
    }
    return cols;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    pointsRef.current.rotation.y = time * 0.1;
    pointsRef.current.rotation.z = time * 0.05;
    
    const geometry = pointsRef.current.geometry;
    const positionAttribute = geometry.attributes.position;
    
    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      const x = positions[idx];
      const y = positions[idx + 1];
      const z = positions[idx + 2];
      
      const offset = Math.sin(time * 0.8 + i) * 0.003;
      positionAttribute.setXYZ(
        i,
        x + offset * Math.sin(y * 4),
        y + offset * Math.cos(z * 4),
        z + offset * Math.sin(x * 4)
      );
    }
    positionAttribute.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.016}
        vertexColors
        transparent
        opacity={0.85}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Orbiting Metallic Shards ───────────────────────────────────────── */
function OrbitingFragments({ count = 10 }) {
  const groupRef = useRef<THREE.Group>(null);
  
  const fragments = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 1.35 + Math.random() * 0.35;
      const speed = (0.15 + Math.random() * 0.25) * (Math.random() > 0.5 ? 1 : -1);
      const scale = 0.04 + Math.random() * 0.06;
      return { angle, radius, speed, scale, seed: Math.random() * 100 };
    });
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.getElapsedTime();
    
    groupRef.current.children.forEach((child, idx) => {
      const frag = fragments[idx];
      const currentAngle = frag.angle + time * frag.speed;
      
      // Shards orbit and periodically drift in and out
      const drift = Math.sin(time * 0.7 + frag.seed) * 0.12;
      const currentRadius = frag.radius + drift;
      
      const x = Math.cos(currentAngle) * currentRadius;
      const z = Math.sin(currentAngle) * currentRadius;
      const y = Math.sin(time * 0.4 + frag.seed) * 0.2;
      
      child.position.set(x, y, z);
      child.rotation.x = time * 0.4 + frag.seed;
      child.rotation.y = time * 0.2 + frag.seed;
    });
  });

  return (
    <group ref={groupRef}>
      {fragments.map((frag, idx) => (
        <mesh key={idx}>
          <dodecahedronGeometry args={[frag.scale]} />
          <meshStandardMaterial
            metalness={0.95}
            roughness={0.15}
            color="#A0A0A0"
            emissive="#7CEEFF"
            emissiveIntensity={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Background Dust Particles ──────────────────────────────────────── */
function BackgroundStars({ count = 1500, scrollProgress }: { count?: number; scrollProgress: React.MutableRefObject<number> }) {
  const pointsRef = useRef<THREE.Points>(null);
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const r = 12 + Math.random() * 15;
      
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const time = state.clock.getElapsedTime();
    
    // Slow background spin
    pointsRef.current.rotation.y = time * 0.003;
    pointsRef.current.rotation.x = time * 0.001;
    
    // Parallax scrolling offset
    pointsRef.current.position.y = scrollProgress.current * 4;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.03}
        color="#7CEEFF"
        transparent
        opacity={0.35}
        sizeAttenuation={true}
        depthWrite={false}
      />
    </points>
  );
}

/* ─── Scene Logic & Controls ────────────────────────────────────────── */
interface SceneProps {
  scrollProgress: React.MutableRefObject<number>;
}

function Scene({ scrollProgress }: SceneProps) {
  const coreRef = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const reducedMotion = useReducedMotion();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const pointer = state.pointer; // Mouse range [-1, 1]

    if (!coreRef.current) return;

    // Slow ambient camera floating movement
    if (!reducedMotion) {
      camera.position.x = Math.sin(time * 0.4) * 0.12;
      camera.position.y = Math.cos(time * 0.5) * 0.12 + (scrollProgress.current * 1.2);
    } else {
      camera.position.y = scrollProgress.current * 1.2;
    }

    // Mouse tilt offset (adds up to 5 degrees rotation)
    const targetRotX = pointer.y * 0.087;
    const targetRotY = pointer.x * 0.087;
    
    coreRef.current.rotation.x = THREE.MathUtils.lerp(coreRef.current.rotation.x, targetRotX, 0.08);
    coreRef.current.rotation.y = THREE.MathUtils.lerp(coreRef.current.rotation.y, targetRotY, 0.08);

    // Continuous core rotation (~3 degrees per second + speed up on scroll)
    const scrollMultiplier = 1 + scrollProgress.current * 1.8;
    const baseRotationSpeed = 0.052 * (reducedMotion ? 0.2 : 1);
    coreRef.current.rotation.y += baseRotationSpeed * state.clock.getDelta() * scrollMultiplier;

    // Scale core smaller on scroll
    const targetScale = 1 - scrollProgress.current * 0.35;
    coreRef.current.scale.setScalar(THREE.MathUtils.lerp(coreRef.current.scale.x, targetScale, 0.1));
  });

  return (
    <group ref={coreRef}>
      {/* Internal volumetric energy glow sphere */}
      <mesh>
        <sphereGeometry args={[0.72, 32, 32]} />
        <meshBasicMaterial
          color="#4F9DFF"
          transparent
          opacity={0.12}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Main morphing transmissive core */}
      <mesh>
        <sphereGeometry args={[0.9, 64, 64]} />
        <MeshDistortMaterial
          transmission={0.8}
          roughness={0.2}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          ior={1.5}
          thickness={0.8}
          color="#ffffff"
          distort={reducedMotion ? 0 : 0.24}
          speed={1.3}
        />
      </mesh>

      {/* Internal neural particle fire */}
      <NeuralParticles count={800} />

      {/* Outer shards */}
      <OrbitingFragments count={9} />
    </group>
  );
}

/* ─── Cinematic Post-processing Composer ──────────────────────────────── */
function Effects() {
  const reducedMotion = useReducedMotion();
  if (reducedMotion) return null;

  return (
    <EffectComposer>
      <Bloom
        intensity={1.0}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.95}
      />
      <ChromaticAberration
        offset={new THREE.Vector2(0.0016, 0.0016)}
        radialModulation={false}
        modulationOffset={0}
      />
      <DepthOfField
        focusDistance={0}
        focalLength={0.02}
        bokehScale={1.2}
        height={480}
      />
    </EffectComposer>
  );
}

/* ─── Primary 3D Core Canvas ─────────────────────────────────────────── */
export default function AICore3D({ scrollProgress }: { scrollProgress: React.MutableRefObject<number> }) {
  return (
    <div className="absolute inset-0 w-full h-full pointer-events-none select-none z-0">
      <Canvas
        camera={{ position: [0, 0, 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.15} />
        {/* Soft custom key/fill/backlights */}
        <directionalLight position={[5, 5, 5]} intensity={1.6} color="#ffffff" />
        <pointLight position={[-5, 4, -4]} intensity={1.4} color="#4F9DFF" />
        <pointLight position={[2, -4, 2]} intensity={0.7} color="#FF7B39" />
        
        <Scene scrollProgress={scrollProgress} />
        <BackgroundStars count={1800} scrollProgress={scrollProgress} />
        
        <Environment preset="studio" />
        <Effects />
      </Canvas>
    </div>
  );
}
