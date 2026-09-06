import React, { useMemo } from 'react';
import * as THREE from 'three';
import { Building } from '../types';
import { createExtrudedFootprintGeometry } from '../utils/coordinates';
import { useCadastralStore } from '../state/useCadastralStore';
import { FloorMesh } from './FloorMesh';

interface BuildingMeshProps {
  building: Building;
}

export const BuildingMesh: React.FC<BuildingMeshProps> = ({ building }) => {
  const {
    floors,
    verticalProperties,
    selectedBuildingId,
    hoveredId,
    selectBuilding,
    setHoveredId,
    isFloorView,
    zMinClip,
    zMaxClip,
    isWireframe,
    isTransparent
  } = useCadastralStore();

  const isSelected = selectedBuildingId === building.building_id;
  const isHovered = hoveredId === building.building_id;

  // Filter building's floors
  const buildingFloors = useMemo(() => {
    return floors
      .filter(f => f.building_id === building.building_id)
      .sort((a, b) => a.floor_number - b.floor_number);
  }, [floors, building.building_id]);

  // Unified solid geometry and crisp architectural edge outlines
  const { solidGeometry, edgeGeometry } = useMemo(() => {
    if (isFloorView) return { solidGeometry: null, edgeGeometry: null };
    const ring = building.geometry.coordinates[0];
    const geom = createExtrudedFootprintGeometry(ring, building.ground_elevation, building.roof_elevation);
    const edges = geom ? new THREE.EdgesGeometry(geom, 25) : null;
    return { solidGeometry: geom, edgeGeometry: edges };
  }, [building, isFloorView]);

  // Z-Clipping test
  if (building.roof_elevation < zMinClip || building.ground_elevation > zMaxClip) {
    return null;
  }

  return (
    <group>
      {isFloorView ? (
        // Segmented Floor Mode
        <group>
          {buildingFloors.map((fl) => (
            <FloorMesh
              key={fl.floor_id}
              floor={fl}
              verticalParcels={verticalProperties}
              isParentSelected={isSelected}
            />
          ))}
        </group>
      ) : (
        // Solid Monolithic Building Mode with Architectural Shading & Edges
        solidGeometry && (
          <group>
            <mesh
              geometry={solidGeometry}
              castShadow
              receiveShadow
              onClick={(e) => {
                e.stopPropagation();
                selectBuilding(building.building_id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredId(building.building_id);
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                setHoveredId(null);
              }}
            >
              <meshStandardMaterial
                color={isSelected ? '#0284c7' : isHovered ? '#38bdf8' : '#334e68'}
                emissive={isSelected ? '#00f0ff' : isHovered ? '#0ea5e9' : '#102a43'}
                emissiveIntensity={isSelected ? 0.5 : isHovered ? 0.3 : 0.15}
                roughness={0.35}
                metalness={0.35}
                wireframe={isWireframe}
                transparent={isTransparent}
                opacity={isTransparent ? 0.4 : 0.95}
              />
            </mesh>

            {/* Crisp Architectural Outlines */}
            {edgeGeometry && (
              <lineSegments geometry={edgeGeometry}>
                <lineBasicMaterial
                  color={isSelected ? '#ffffff' : isHovered ? '#00f0ff' : '#60a5fa'}
                  linewidth={1.2}
                  transparent={true}
                  opacity={isSelected ? 1.0 : isHovered ? 0.9 : 0.45}
                />
              </lineSegments>
            )}
          </group>
        )
      )}
    </group>
  );
};
