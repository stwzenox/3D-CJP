import React, { useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useCadastralStore, CameraPreset } from '../state/useCadastralStore';
import { TerrainMesh } from './TerrainMesh';
import { ParcelGroundMesh } from './ParcelGroundMesh';
import { BuildingMesh } from './BuildingMesh';
import { UndergroundMesh } from './UndergroundMesh';
import { ElevatedStructureMesh } from './ElevatedStructureMesh';
import { LidarPointCloud } from './LidarPointCloud';
import { GnssMarkers } from './GnssMarkers';

// Camera controller component responding to preset changes
const CameraController: React.FC = () => {
  const { cameraPreset } = useCadastralStore();
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    if (!camera) return;

    if (cameraPreset === 'top') {
      camera.position.set(0, 320, 0.1);
      camera.lookAt(0, 98, 0);
    } else if (cameraPreset === 'side') {
      camera.position.set(0, 105, 300);
      camera.lookAt(0, 105, 0);
    } else if (cameraPreset === 'isometric') {
      camera.position.set(220, 240, 220);
      camera.lookAt(0, 100, 0);
    } else if (cameraPreset === 'default') {
      camera.position.set(-160, 210, 220);
      camera.lookAt(0, 100, 0);
    }

    if (controlsRef.current) {
      controlsRef.current.target.set(0, 100, 0);
      controlsRef.current.update();
    }
  }, [cameraPreset, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.05}
      maxPolarAngle={Math.PI / 2 + 0.1} // Allow viewing slightly beneath horizon for underground inspection
      minDistance={10}
      maxDistance={650}
    />
  );
};

export const Scene3D: React.FC = () => {
  const { buildings, layers } = useCadastralStore();

  return (
    <div className="w-full h-full relative bg-[#07090e]">
      <Canvas
        camera={{ position: [-160, 210, 220], fov: 45, near: 1, far: 2000 }}
        shadows
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      >
        <color attach="background" args={['#07090e']} />
        <fog attach="fog" args={['#07090e', 480, 1400]} />

        {/* Ambient & Balanced Architectural Lighting */}
        <ambientLight intensity={0.75} />
        <hemisphereLight
          args={['#bae6fd', '#0f172a', 0.95]}
        />
        {/* Primary Sun/Key Light */}
        <directionalLight
          position={[200, 320, 160]}
          intensity={1.4}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-far={700}
          shadow-camera-left={-250}
          shadow-camera-right={250}
          shadow-camera-top={250}
          shadow-camera-bottom={-250}
        />
        {/* Secondary Sky/Fill Light for Soft Shadow Illumination */}
        <directionalLight
          position={[-180, 200, -140]}
          intensity={0.85}
          color="#93c5fd"
        />
        {/* Front Warm Accent Light */}
        <directionalLight
          position={[0, 150, 250]}
          intensity={0.5}
          color="#e0f2fe"
        />

        {/* Camera Orbit Controls */}
        <CameraController />

        {/* Reference Scale Grid */}
        <Grid
          position={[0, 97.9, 0]}
          args={[500, 500]}
          cellSize={25}
          cellThickness={0.8}
          cellColor="#0284c7"
          sectionSize={100}
          sectionThickness={1.5}
          sectionColor="#00f0ff"
          fadeDistance={480}
          fadeStrength={1.2}
        />

        {/* 3D Terrain */}
        <TerrainMesh />

        {/* 2D Cadastral Parcel Footprints on 3D Ground */}
        <ParcelGroundMesh />

        {/* 3D Buildings & Vertical Floors */}
        {layers.buildings && (
          <group>
            {buildings.map((b) => (
              <BuildingMesh key={b.building_id} building={b} />
            ))}
          </group>
        )}

        {/* Subsurface Utilities & Basements */}
        <UndergroundMesh />

        {/* Elevated Rapid Transit Flyover */}
        <ElevatedStructureMesh />

        {/* Synthetic LiDAR Point Cloud */}
        <LidarPointCloud />

        {/* GNSS / CORS Stations */}
        <GnssMarkers />
      </Canvas>
    </div>
  );
};
