import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';

export const TerrainMesh: React.FC = () => {
  const { terrainData, layers, zMinClip, mapTheme } = useCadastralStore();
  const isLight = mapTheme === 'light';

  const geometry = useMemo(() => {
    if (!terrainData || !terrainData.points || terrainData.points.length === 0) {
      return null;
    }

    const res = terrainData.resolution;
    const size = terrainData.size;
    const planeGeom = new THREE.PlaneGeometry(size, size, res - 1, res - 1);
    
    // PlaneGeometry is on XY plane, rotate to XZ plane
    planeGeom.rotateX(-Math.PI / 2);

    const pos = planeGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const pt = terrainData.points[i];
      if (pt) {
        // Set height (Y) to elevation
        pos.setY(i, pt.elevation);
      }
    }

    planeGeom.computeVertexNormals();
    return planeGeom;
  }, [terrainData]);

  if (!layers.terrain || !geometry || zMinClip > 105) return null;

  return (
    <group>
      {/* Base Terrain Solid Mesh */}
      <mesh geometry={geometry} receiveShadow>
        <meshStandardMaterial
          color={isLight ? '#e2e8f0' : '#0f172a'}
          roughness={0.85}
          metalness={0.1}
          wireframe={false}
          flatShading={true}
        />
      </mesh>

      {/* Grid Wireframe Overlay */}
      <mesh geometry={geometry} position={[0, 0.05, 0]}>
        <meshBasicMaterial
          color={isLight ? '#94a3b8' : '#0284c7'}
          wireframe={true}
          transparent={true}
          opacity={isLight ? 0.25 : 0.18}
        />
      </mesh>
    </group>
  );
};
