import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Environment, MeshDistortMaterial } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";

function Knot() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    ref.current.rotation.x = t * 0.25;
    ref.current.rotation.y = t * 0.35;
  });
  return (
    <mesh ref={ref} scale={1.25}>
      <torusKnotGeometry args={[1, 0.32, 220, 32]} />
      <MeshDistortMaterial
        color="#3e6e9e"
        distort={0.32}
        speed={1.6}
        roughness={0.15}
        metalness={0.85}
      />
    </mesh>
  );
}

function OrbitRing({ radius = 2.4, tilt = 0, speed = 0.4, color = "#3e6e9e" }) {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    ref.current.rotation.z = s.clock.getElapsedTime() * speed;
  });
  return (
    <mesh ref={ref} rotation={[Math.PI / 2 + tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.012, 16, 200]} />
      <meshBasicMaterial color={color} transparent opacity={0.45} />
    </mesh>
  );
}

function Diamond() {
  const ref = useRef<THREE.Mesh>(null!);
  useFrame((s) => {
    const t = s.clock.getElapsedTime();
    ref.current.rotation.y = t * 0.6;
    ref.current.position.y = Math.sin(t * 1.2) * 0.15;
  });
  return (
    <mesh ref={ref} position={[2.2, 0.6, 0.5]} scale={0.35}>
      <octahedronGeometry args={[1, 0]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#3e6e9e"
        emissiveIntensity={0.4}
        roughness={0.1}
        metalness={0.9}
      />
    </mesh>
  );
}

function Particles() {
  const ref = useRef<THREE.Points>(null!);
  const count = 120;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 3 + Math.random() * 1.5;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }
  useFrame((s) => {
    ref.current.rotation.y = s.clock.getElapsedTime() * 0.05;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#3e6e9e" size={0.04} sizeAttenuation transparent opacity={0.7} />
    </points>
  );
}

export function HeroScene() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="hero-3d" />;

  return (
    <div className="hero-3d">
      <Canvas camera={{ position: [0, 0, 5.2], fov: 45 }} dpr={[1, 2]}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.2} />
          <directionalLight position={[-5, -2, -3]} intensity={0.4} color="#b5cfe4" />
          <Float speed={1.2} rotationIntensity={0.4} floatIntensity={0.6}>
            <Knot />
          </Float>
          <OrbitRing radius={2.2} tilt={0} speed={0.3} />
          <OrbitRing radius={2.6} tilt={0.6} speed={-0.25} color="#b5cfe4" />
          <OrbitRing radius={3.0} tilt={-0.4} speed={0.18} />
          <Diamond />
          <Particles />
          <Environment preset="city" />
        </Suspense>
      </Canvas>
    </div>
  );
}
