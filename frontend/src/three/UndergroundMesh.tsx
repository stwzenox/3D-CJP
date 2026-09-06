import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';
import { createExtrudedFootprintGeometry, geographicToLocal } from '../utils/coordinates';

export const UndergroundMesh: React.FC = () => {
  const { undergroundAssets, layers, zMinClip, zMaxClip, selectProperty } = useCadastralStore();

  const pipeline = useMemo(() => {
    return undergroundAssets.find(u => u.asset_type.includes('Water') || u.asset_type.includes('Conduit') || u.asset_type.includes('Pipe'));
  }, [undergroundAssets]);

  const basement = useMemo(() => {
    return undergroundAssets.find(u => u.asset_type.includes('Basement'));
  }, [undergroundAssets]);

  // Basement geometry
  const basementGeometry = useMemo(() => {
    if (!basement || !basement.geometry || !basement.geometry.coordinates) return null;
    const ring = basement.geometry.coordinates[0];
    return createExtrudedFootprintGeometry(ring, basement.z_min, basement.z_max);
  }, [basement]);

  // Pipeline tube geometry
  const pipeGeometry = useMemo(() => {
    if (!pipeline || !pipeline.geometry || !pipeline.geometry.coordinates) return null;
    const coords: number[][] = pipeline.geometry.coordinates;
    const pts: THREE.Vector3[] = coords.map(([lng, lat]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      const elev = (pipeline.z_min + pipeline.z_max) / 2.0;
      return new THREE.Vector3(x, elev, z);
    });

    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 32, 1.2, 12, false);
  }, [pipeline]);

  if (!layers.underground) return null;

  return (
    <group>
      {/* Subterranean Water / Utility Pipeline */}
      {pipeGeometry && pipeline && pipeline.z_max >= zMinClip && pipeline.z_min <= zMaxClip && (
        <mesh
          geometry={pipeGeometry}
          onClick={(e) => {
            e.stopPropagation();
            selectProperty({
              type: 'Underground Pipeline',
              id: pipeline.asset_id,
              asset_type: pipeline.asset_type,
              z_min: pipeline.z_min,
              z_max: pipeline.z_max,
              owner: pipeline.owner,
              status: pipeline.status
            });
          }}
        >
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={0.8}
            roughness={0.2}
            metalness={0.8}
          />
        </mesh>
      )}

      {/* Subterranean Parking Basement */}
      {basementGeometry && basement && basement.z_max >= zMinClip && basement.z_min <= zMaxClip && (
        <mesh
          geometry={basementGeometry}
          onClick={(e) => {
            e.stopPropagation();
            selectProperty({
              type: 'Subterranean Basement',
              id: basement.asset_id,
              asset_type: basement.asset_type,
              z_min: basement.z_min,
              z_max: basement.z_max,
              owner: basement.owner,
              status: basement.status
            });
          }}
        >
          <meshStandardMaterial
            color="#6366f1"
            emissive="#4338ca"
            emissiveIntensity={0.4}
            roughness={0.5}
            metalness={0.3}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}
    </group>
  );
};
