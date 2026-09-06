import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useCadastralStore } from '../state/useCadastralStore';
import { geographicToLocal } from '../utils/coordinates';

export const ElevatedStructureMesh: React.FC = () => {
  const { undergroundAssets, layers, zMinClip, zMaxClip, selectedProperty, selectProperty } = useCadastralStore();

  const flyover = useMemo(() => {
    return undergroundAssets.find(u => u.asset_type.includes('Flyover') || u.asset_id.includes('ELEV'));
  }, [undergroundAssets]);

  const isSelected = selectedProperty?.id === flyover?.asset_id;

  // Generate realistic architectural bridge deck, parapets, and support piers
  const bridgeData = useMemo(() => {
    if (!flyover || !flyover.geometry || !flyover.geometry.coordinates) {
      return null;
    }

    const coords: number[][] = flyover.geometry.coordinates;
    const pts: THREE.Vector3[] = coords.map(([lng, lat]) => {
      const [x, , z] = geographicToLocal(lat, lng, 0);
      const elev = (flyover.z_min + flyover.z_max) / 2.0;
      return new THREE.Vector3(x, elev, z);
    });

    if (pts.length < 2) return null;

    const curve = new THREE.CatmullRomCurve3(pts);
    const SAMPLES = 50;
    const ROAD_WIDTH = 8.0; // 8 meters wide (2 lanes)
    const HALF_W = ROAD_WIDTH / 2.0;
    const DECK_THICKNESS = 0.6;
    const BARRIER_HEIGHT = 0.75;
    const BARRIER_WIDTH = 0.3;

    // Construct Road Surface Mesh (Asphalt Deck)
    const roadVertices: number[] = [];
    const roadIndices: number[] = [];
    const roadNormals: number[] = [];
    const roadUvs: number[] = [];

    // Construct Parapets / Concrete Guardrails
    const barrierVertices: number[] = [];
    const barrierIndices: number[] = [];

    // Centerline points for road markings
    const centerLinePts: THREE.Vector3[] = [];

    for (let i = 0; i <= SAMPLES; i++) {
      const t = i / SAMPLES;
      const pt = curve.getPoint(t);
      const tangent = curve.getTangent(t).normalize();
      // Sideway perpendicular horizontal vector
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();

      centerLinePts.push(new THREE.Vector3(pt.x, pt.y + 0.05, pt.z));

      // Left and right road surface vertices
      const pLeft = pt.clone().addScaledVector(side, -HALF_W);
      const pRight = pt.clone().addScaledVector(side, HALF_W);

      roadVertices.push(pLeft.x, pLeft.y, pLeft.z);
      roadNormals.push(0, 1, 0);
      roadUvs.push(0, t * 10);

      roadVertices.push(pRight.x, pRight.y, pRight.z);
      roadNormals.push(0, 1, 0);
      roadUvs.push(1, t * 10);

      if (i < SAMPLES) {
        const base = i * 2;
        // Two triangles per quad segment
        roadIndices.push(base, base + 1, base + 2);
        roadIndices.push(base + 1, base + 3, base + 2);
      }

      // Concrete side barrier left
      const bL1 = pLeft.clone();
      const bL2 = pLeft.clone().add(new THREE.Vector3(0, BARRIER_HEIGHT, 0));
      const bR1 = pRight.clone();
      const bR2 = pRight.clone().add(new THREE.Vector3(0, BARRIER_HEIGHT, 0));

      barrierVertices.push(bL1.x, bL1.y, bL1.z);
      barrierVertices.push(bL2.x, bL2.y, bL2.z);
      barrierVertices.push(bR1.x, bR1.y, bR1.z);
      barrierVertices.push(bR2.x, bR2.y, bR2.z);

      if (i < SAMPLES) {
        const bBase = i * 4;
        // Left barrier quad
        barrierIndices.push(bBase, bBase + 1, bBase + 4);
        barrierIndices.push(bBase + 1, bBase + 5, bBase + 4);
        // Right barrier quad
        barrierIndices.push(bBase + 2, bBase + 6, bBase + 3);
        barrierIndices.push(bBase + 3, bBase + 6, bBase + 7);
      }
    }

    const roadGeom = new THREE.BufferGeometry();
    roadGeom.setAttribute('position', new THREE.Float32BufferAttribute(roadVertices, 3));
    roadGeom.setAttribute('normal', new THREE.Float32BufferAttribute(roadNormals, 3));
    roadGeom.setAttribute('uv', new THREE.Float32BufferAttribute(roadUvs, 2));
    roadGeom.setIndex(roadIndices);

    const barrierGeom = new THREE.BufferGeometry();
    barrierGeom.setAttribute('position', new THREE.Float32BufferAttribute(barrierVertices, 3));
    barrierGeom.setIndex(barrierIndices);
    barrierGeom.computeVertexNormals();

    const centerLineGeom = new THREE.BufferGeometry().setFromPoints(centerLinePts);

    // Support piers / pylons placed evenly along curve
    const piers: { pos: [number, number, number]; height: number; capPos: [number, number, number] }[] = [];
    const pierTValues = [0.15, 0.35, 0.55, 0.75, 0.90];

    pierTValues.forEach(t => {
      const p = curve.getPoint(t);
      const groundY = 98.2;
      const h = p.y - groundY;
      piers.push({
        pos: [p.x, groundY + h / 2.0, p.z],
        height: h,
        capPos: [p.x, p.y - 0.3, p.z]
      });
    });

    return { roadGeom, barrierGeom, centerLineGeom, piers };
  }, [flyover]);

  const centerLineObj = useMemo(() => {
    if (!bridgeData?.centerLineGeom) return null;
    const mat = new THREE.LineBasicMaterial({
      color: isSelected ? '#ffffff' : '#fbbf24',
      linewidth: 2,
      transparent: true,
      opacity: 0.85
    });
    return new THREE.Line(bridgeData.centerLineGeom, mat);
  }, [bridgeData?.centerLineGeom, isSelected]);

  if (!layers.elevated || !flyover || !bridgeData) return null;
  if (flyover.z_max < zMinClip || flyover.z_min > zMaxClip) return null;

  const handleClick = (e: any) => {
    e.stopPropagation();
    selectProperty({
      type: 'Elevated Infrastructure',
      id: flyover.asset_id,
      asset_type: flyover.asset_type,
      z_min: flyover.z_min,
      z_max: flyover.z_max,
      owner: flyover.owner,
      status: flyover.status
    });
  };

  return (
    <group onClick={handleClick}>
      {/* Asphalt Highway Deck Surface */}
      <mesh geometry={bridgeData.roadGeom} castShadow receiveShadow>
        <meshStandardMaterial
          color={isSelected ? '#0284c7' : '#1e293b'}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      {/* Concrete Crash Barriers / Parapets along both edges */}
      <mesh geometry={bridgeData.barrierGeom} castShadow>
        <meshStandardMaterial
          color={isSelected ? '#38bdf8' : '#64748b'}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Center Lane Road Marking */}
      {centerLineObj && <primitive object={centerLineObj} />}

      {/* Heavy Civil Concrete Piers & Cap Beams */}
      {bridgeData.piers.map((p, idx) => (
        <group key={idx}>
          {/* Main Column */}
          <mesh position={p.pos} castShadow>
            <cylinderGeometry args={[0.9, 1.1, p.height, 16]} />
            <meshStandardMaterial
              color="#475569"
              roughness={0.8}
              metalness={0.2}
            />
          </mesh>

          {/* Pier Cap Beam under road deck */}
          <mesh position={p.capPos}>
            <boxGeometry args={[7.5, 0.6, 2.2]} />
            <meshStandardMaterial
              color="#334155"
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
};
