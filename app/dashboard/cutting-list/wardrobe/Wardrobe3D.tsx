"use client";

import { useRef, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Text, Html } from "@react-three/drei";
import * as THREE from "three";

interface Wardrobe3DProps {
  width: number;
  height: number;
  depth: number;
  numberOfShelves: number;
  numberOfShutters: number;
  view: "front" | "side" | "top";
  materialThickness?: number;
  backPanelThickness?: number;
}

function Wardrobe({ width, height, depth, numberOfShelves, numberOfShutters, materialThickness = 18, backPanelThickness = 6 }: Omit<Wardrobe3DProps, "view">) {
  const meshRef = useRef<THREE.Group>(null);

  // Calculate dimensions in 3D space (convert mm to units, scale down)
  const scale = 0.01;
  const w = width * scale;
  const h = height * scale;
  const d = depth * scale;
  const thickness = materialThickness * scale; // Material thickness (visible border)
  const backThickness = backPanelThickness * scale; // Back panel thickness
  
  // Interior dimensions (subtract material thickness from height and width)
  const interiorWidth = w - (thickness * 2);
  const interiorHeight = h - (thickness * 2);
  const interiorDepth = d - backThickness; // Back panel reduces interior depth

  return (
    <group ref={meshRef}>
      {/* Main Cabinet Body */}
      <group>
        {/* Front Face - OPEN (removed to show interior) */}
        {/* No front face - keeping it open to view interior */}

        {/* Shelves - Light gray, no shadow - Using interior dimensions */}
        {Array.from({ length: numberOfShelves || 0 }).map((_, i) => {
          const shelfY = -interiorHeight / 2 + ((i + 1) * interiorHeight) / ((numberOfShelves || 0) + 1);
          return (
            <mesh
              key={`shelf-${i}`}
              position={[0, shelfY, 0]}
            >
              <boxGeometry args={[interiorWidth, thickness, interiorDepth]} />
              <meshStandardMaterial color="#d3d3d3" metalness={0} roughness={1} flatShading={true} />
            </mesh>
          );
        })}

        {/* Top Face - Material thickness border - Darker gray to show thickness */}
        <mesh position={[0, h / 2 - thickness / 2, 0]}>
          <boxGeometry args={[w, thickness, d]} />
          <meshStandardMaterial 
            color="#a0a0a0" 
            metalness={0} 
            roughness={1} 
            flatShading={true}
          />
        </mesh>

        {/* Bottom Face - Material thickness border */}
        <mesh position={[0, -h / 2 + thickness / 2, 0]}>
          <boxGeometry args={[w, thickness, d]} />
          <meshStandardMaterial 
            color="#a0a0a0" 
            metalness={0} 
            roughness={1} 
            flatShading={true}
          />
        </mesh>

        {/* Left Side - Material thickness border */}
        <mesh position={[-w / 2 + thickness / 2, 0, 0]}>
          <boxGeometry args={[thickness, h, d]} />
          <meshStandardMaterial 
            color="#a0a0a0" 
            metalness={0} 
            roughness={1} 
            flatShading={true}
          />
        </mesh>

        {/* Right Side - Material thickness border */}
        <mesh position={[w / 2 - thickness / 2, 0, 0]}>
          <boxGeometry args={[thickness, h, d]} />
          <meshStandardMaterial 
            color="#a0a0a0" 
            metalness={0} 
            roughness={1} 
            flatShading={true}
          />
        </mesh>

        {/* Back Panel - Light gray, no shadow, no pattern (now at front position) - Using interior dimensions */}
        <mesh position={[0, 0, d / 2 - backThickness / 2]}>
          <boxGeometry args={[interiorWidth, interiorHeight, backThickness]} />
          <meshStandardMaterial 
            color="#d3d3d3" 
            opacity={1} 
            transparent={false}
            metalness={0}
            roughness={1}
            flatShading={true}
          />
        </mesh>
      </group>

      {/* Measurement Labels - Width minus thickness, Height is full height */}
      {width > 0 && (
        <Html position={[0, -h / 2 - 0.3, 0]} center>
          <div className="bg-blue-100 px-2 py-1 rounded shadow-lg border border-blue-300 text-xs font-bold text-blue-900 whitespace-nowrap">
            W: {width - (materialThickness * 2)}mm
          </div>
        </Html>
      )}

      {height > 0 && (
        <Html position={[-w / 2 - 0.3, 0, 0]} center>
          <div className="bg-blue-100 px-2 py-1 rounded shadow-lg border border-blue-300 text-xs font-bold text-blue-900 whitespace-nowrap transform -rotate-90">
            H: {height}mm
          </div>
        </Html>
      )}

      {depth > 0 && (
        <Html position={[0, h / 2 + 0.3, 0]} center>
          <div className="bg-blue-100 px-2 py-1 rounded shadow-lg border border-blue-300 text-xs font-bold text-blue-900 whitespace-nowrap">
            D: {depth}mm
          </div>
        </Html>
      )}

      {/* Material Thickness Label */}
      {materialThickness > 0 && (
        <Html position={[w / 2 - thickness / 2, h / 2 - thickness / 2, 0]} center>
          <div className="bg-green-100 px-2 py-1 rounded shadow-lg border border-green-300 text-xs font-bold text-green-900 whitespace-nowrap">
            Material Thickness: {materialThickness}mm
          </div>
        </Html>
      )}
    </group>
  );
}

function CameraController({ view, maxDim, controlsRef }: { view: "front" | "side" | "top"; maxDim: number; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();

  useEffect(() => {
    const baseDistance = maxDim * 3;
    let position: [number, number, number];
    
    switch (view) {
      case "front":
        position = [0, maxDim * 0.5, baseDistance];
        break;
      case "side":
        position = [baseDistance, maxDim * 0.5, 0];
        break;
      case "top":
        position = [0, baseDistance, 0];
        break;
      default:
        position = [baseDistance * 0.7, baseDistance * 0.7, baseDistance * 0.7];
    }

    camera.position.set(...position);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [view, maxDim, camera, controlsRef]);

  return null;
}

export default function Wardrobe3D({ width, height, depth, numberOfShelves, numberOfShutters, view, materialThickness, backPanelThickness }: Wardrobe3DProps) {
  const controlsRef = useRef<any>(null);
  const scale = 0.01;
  
  // Ensure minimum dimensions
  const safeWidth = Math.max(width || 1000, 100);
  const safeHeight = Math.max(height || 2000, 100);
  const safeDepth = Math.max(depth || 600, 100);
  
  const maxDim = Math.max(safeWidth * scale, safeHeight * scale, safeDepth * scale) || 10;

  // Calculate initial camera position based on view
  const getInitialCameraPosition = (): [number, number, number] => {
    const baseDistance = Math.max(maxDim * 3, 5);
    switch (view) {
      case "front":
        return [0, maxDim * 0.5, baseDistance];
      case "side":
        return [baseDistance, maxDim * 0.5, 0];
      case "top":
        return [0, baseDistance, 0];
      default:
        return [baseDistance * 0.7, baseDistance * 0.7, baseDistance * 0.7];
    }
  };

  // Don't show preview if no inputs
  if (!width || !height || !depth || width === 1000 && height === 2000 && depth === 600) {
    return null;
  }

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <Canvas
        camera={{ position: getInitialCameraPosition(), fov: 50 }}
        style={{ width: "100%", height: "100%", display: "block" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
        dpr={[1, 2]}
      >
      <CameraController view={view} maxDim={maxDim} controlsRef={controlsRef} />
      {/* Lighting - Flat, no shadows */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 5]} intensity={0.3} />
      <directionalLight position={[-10, 5, -5]} intensity={0.3} />

      {/* Wardrobe */}
      <Wardrobe
        width={safeWidth}
        height={safeHeight}
        depth={safeDepth}
        numberOfShelves={numberOfShelves || 0}
        numberOfShutters={numberOfShutters || 1}
        materialThickness={materialThickness || 18}
        backPanelThickness={backPanelThickness || 6}
      />

      {/* Controls */}
      <OrbitControls
        ref={controlsRef}
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={maxDim * 1.5}
        maxDistance={maxDim * 8}
        autoRotate={false}
        target={[0, 0, 0]}
      />
      </Canvas>
    </div>
  );
}

