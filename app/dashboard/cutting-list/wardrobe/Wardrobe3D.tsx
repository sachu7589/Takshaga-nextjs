"use client";

import React, { useRef, useEffect, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

type NestedPartition = {
  type: "VERTICAL" | "HORIZONTAL";
  numberOfPartitions: string;
  material: string;
  thickness: string;
  columns?: ColumnData[];
  rows?: RowData[];
} | null;

type ColumnData = {
  width: string;
  nestedPartitions: NestedPartition;
};

type RowData = {
  height: string;
  nestedPartitions: NestedPartition;
};

interface Wardrobe3DProps {
  width: number;
  height: number;
  depth: number;
  numberOfShelves: number;
  numberOfShutters: number;
  view: "front" | "side" | "top";
  materialThickness?: number;
  backPanelThickness?: number;
  partitionType?: "VERTICAL" | "HORIZONTAL" | "";
  partitionThickness?: number;
  columnWidths?: string[];
  rowHeights?: string[];
  columns?: ColumnData[];
  rows?: RowData[];
}

function Wardrobe({ 
  width, 
  height, 
  depth, 
  numberOfShelves, 
  materialThickness = 18, 
  backPanelThickness = 6,
  partitionType,
  partitionThickness = 0,
  columnWidths = [],
  rowHeights = [],
  columns,
  rows,
  showMeasurements = true
}: Omit<Wardrobe3DProps, "view" | "numberOfShutters"> & { showMeasurements?: boolean }) {
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

  // Render nested partitions recursively
  const renderNestedPartitions = (
    nested: NestedPartition,
    startX: number,
    startY: number,
    availableWidth: number,
    availableHeight: number,
    depthLevel: number
  ): React.ReactNode[] => {
    if (!nested || !nested.numberOfPartitions || Number(nested.numberOfPartitions) === 0) return [];
    
    const nestedThickness = Number(nested.thickness) * scale;
    const elements: React.ReactNode[] = [];
    
    if (nested.type === "HORIZONTAL" && nested.rows) {
      // startY is the top of the available area (matching 2D view)
      let currentY = startY;
      nested.rows.forEach((row, index) => {
        const rowHeight = Number(row.height) * scale;
        const rowStartY = currentY; // Track the top position of this row
        // Draw partition at the bottom of this row (between this row and next row)
        // Only draw if this is not the last row
        if (index < nested.rows!.length - 1) {
          // Move down by row height
          currentY -= rowHeight;
          // Draw partition at this boundary (mesh center is at currentY)
          elements.push(
            <mesh
              key={`nested-h-${depthLevel}-${index}`}
              position={[startX + availableWidth / 2, currentY, 0]}
            >
              <boxGeometry args={[availableWidth, nestedThickness, interiorDepth]} />
              <meshStandardMaterial 
                color="#9b59b6" 
                metalness={0} 
                roughness={1} 
                flatShading={true}
              />
            </mesh>
          );
          // Move past the partition thickness (downward)
          currentY -= nestedThickness;
        }
        // Recursively render nested partitions within this row
        if (row.nestedPartitions) {
          elements.push(...renderNestedPartitions(
            row.nestedPartitions,
            startX,
            rowStartY, // Use the tracked top position of this row
            availableWidth,
            rowHeight,
            depthLevel + 1
          ));
        }
      });
    } else if (nested.type === "VERTICAL" && nested.columns) {
      let currentX = startX;
      nested.columns.forEach((col, index) => {
        const colWidth = Number(col.width) * scale;
        const colStartX = currentX;
        if (index < nested.columns!.length - 1) {
          currentX += colWidth;
          // For vertical partitions: startY is the top, availableHeight extends downward
          // Mesh center should be at startY - availableHeight/2 (middle of the height range)
          // But since startY is top and we go downward, center is startY - availableHeight/2
          const centerY = startY - availableHeight / 2;
          elements.push(
            <mesh
              key={`nested-v-${depthLevel}-${index}`}
              position={[currentX, centerY, 0]}
            >
              <boxGeometry args={[nestedThickness, availableHeight, interiorDepth]} />
              <meshStandardMaterial 
                color="#9b59b6" 
                metalness={0} 
                roughness={1} 
                flatShading={true}
              />
            </mesh>
          );
          currentX += nestedThickness;
        }
        // Recursively render nested partitions within this column
        if (col.nestedPartitions) {
          elements.push(...renderNestedPartitions(
            col.nestedPartitions,
            colStartX,
            startY, // Top of the column/row
            colWidth,
            availableHeight,
            depthLevel + 1
          ));
        }
      });
    }
    
    return elements;
  };

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

        {/* Back Panel - Light gray, no shadow, no pattern (at back position) - Using interior dimensions */}
        <mesh position={[0, 0, -d / 2 + backThickness / 2]}>
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

      {/* Partitions */}
      {partitionType && partitionThickness > 0 && (
        <group>
          {partitionType === "VERTICAL" && columnWidths && columnWidths.length > 0 && (() => {
            const partThickness = partitionThickness * scale;
            let currentX = -interiorWidth / 2;
            const partitionData: Array<{ x: number; colIndex: number; colStartX: number; colWidth: number }> = [];
            
            // Calculate partition positions based on column widths
            columnWidths.forEach((colWidth, index) => {
              const width = Number(colWidth) * scale;
              const colStartX = currentX;
              if (index < columnWidths.length - 1) {
                currentX += width;
                partitionData.push({ 
                  x: currentX, 
                  colIndex: index,
                  colStartX: colStartX,
                  colWidth: width
                });
                currentX += partThickness;
              } else {
                // Last column
                partitionData.push({ 
                  x: currentX + width, 
                  colIndex: index,
                  colStartX: currentX,
                  colWidth: width
                });
              }
            });

            return (
              <>
                {partitionData.filter(p => p.colIndex < columnWidths.length - 1).map(({ x, colIndex, colStartX, colWidth }, index) => (
                  <group key={`vertical-partition-${index}`}>
                    <mesh position={[x, 0, 0]}>
                      <boxGeometry args={[partThickness, interiorHeight, interiorDepth]} />
                      <meshStandardMaterial 
                        color="#8b9dc3" 
                        metalness={0} 
                        roughness={1} 
                        flatShading={true}
                      />
                    </mesh>
                    {/* Label for column width */}
                    {showMeasurements && columnWidths[colIndex] && (
                      <Html position={[x - partThickness / 2 - Number(columnWidths[colIndex]) * scale / 2, interiorHeight / 2 + 0.2, 0]} center>
                        <div className="bg-purple-100 px-2 py-1 rounded shadow-lg border border-purple-300 text-xs font-bold text-purple-900 whitespace-nowrap">
                          Col {colIndex + 1}: {columnWidths[colIndex]}mm
                        </div>
                      </Html>
                    )}
                    {/* Render nested partitions in this column */}
                    {columns && columns[colIndex]?.nestedPartitions && (
                      <group>
                        {renderNestedPartitions(
                          columns[colIndex].nestedPartitions,
                          colStartX,
                          interiorHeight / 2, // Start from top (matching 2D)
                          colWidth,
                          interiorHeight,
                          0
                        ).map((element, idx) => (
                          <React.Fragment key={`nested-col-${colIndex}-${idx}`}>
                            {element}
                          </React.Fragment>
                        ))}
                      </group>
                    )}
                  </group>
                ))}
                {/* Label and nested partitions for last column */}
                {columnWidths[columnWidths.length - 1] && (() => {
                  const lastColData = partitionData.find(p => p.colIndex === columnWidths.length - 1);
                  if (!lastColData) return null;
                  return (
                    <group>
                      {showMeasurements && (
                        <Html position={[interiorWidth / 2 - Number(columnWidths[columnWidths.length - 1]) * scale / 2, interiorHeight / 2 + 0.2, 0]} center>
                          <div className="bg-purple-100 px-2 py-1 rounded shadow-lg border border-purple-300 text-xs font-bold text-purple-900 whitespace-nowrap">
                            Col {columnWidths.length}: {columnWidths[columnWidths.length - 1]}mm
                          </div>
                        </Html>
                      )}
                      {/* Render nested partitions in the last column */}
                      {columns && columns[columnWidths.length - 1]?.nestedPartitions && (
                        <group>
                          {renderNestedPartitions(
                            columns[columnWidths.length - 1].nestedPartitions,
                            lastColData.colStartX,
                            interiorHeight / 2, // Start from top (matching 2D)
                            lastColData.colWidth,
                            interiorHeight,
                            0
                          ).map((element, idx) => (
                            <React.Fragment key={`nested-col-last-${idx}`}>
                              {element}
                            </React.Fragment>
                          ))}
                        </group>
                      )}
                    </group>
                  );
                })()}
              </>
            );
          })()}

          {partitionType === "HORIZONTAL" && rowHeights && rowHeights.length > 0 && (() => {
            const partThickness = partitionThickness * scale;
            // Start from top (like 2D view) and work downward
            let currentY = interiorHeight / 2;
            const partitionData: Array<{ y: number; rowIndex: number; rowStartY: number; rowHeight: number }> = [];
            
            // Calculate partition positions based on row heights (from top to bottom, matching 2D)
            rowHeights.forEach((rowHeight, index) => {
              const height = Number(rowHeight) * scale;
              const rowStartY = currentY; // Top of this row
              if (index < rowHeights.length - 1) {
                // Move down by row height
                currentY -= height;
                // Partition is at the bottom of this row (boundary with next row)
                partitionData.push({ 
                  y: currentY, 
                  rowIndex: index,
                  rowStartY: rowStartY, // Top of this row
                  rowHeight: height
                });
                // Move past partition thickness
                currentY -= partThickness;
              } else {
                // Last row - just track its position
                partitionData.push({ 
                  y: currentY - height, 
                  rowIndex: index,
                  rowStartY: currentY,
                  rowHeight: height
                });
              }
            });

            return (
              <>
                {partitionData.filter(p => p.rowIndex < rowHeights.length - 1).map(({ y, rowIndex, rowStartY, rowHeight }, index) => (
                  <group key={`horizontal-partition-${index}`}>
                    <mesh position={[0, y, 0]}>
                      <boxGeometry args={[interiorWidth, partThickness, interiorDepth]} />
                      <meshStandardMaterial 
                        color="#8b9dc3" 
                        metalness={0} 
                        roughness={1} 
                        flatShading={true}
                      />
                    </mesh>
                    {/* Label for row height */}
                    {showMeasurements && rowHeights[rowIndex] && (
                      <Html position={[interiorWidth / 2 + 0.2, y - partThickness / 2 - Number(rowHeights[rowIndex]) * scale / 2, 0]} center>
                        <div className="bg-purple-100 px-2 py-1 rounded shadow-lg border border-purple-300 text-xs font-bold text-purple-900 whitespace-nowrap transform -rotate-90">
                          Row {rowIndex + 1}: {rowHeights[rowIndex]}mm
                        </div>
                      </Html>
                    )}
                    {/* Render nested partitions in this row */}
                    {rows && rows[rowIndex]?.nestedPartitions && (
                      <group>
                        {renderNestedPartitions(
                          rows[rowIndex].nestedPartitions,
                          -interiorWidth / 2,
                          rowStartY,
                          interiorWidth,
                          rowHeight,
                          0
                        ).map((element, idx) => (
                          <React.Fragment key={`nested-row-${rowIndex}-${idx}`}>
                            {element}
                          </React.Fragment>
                        ))}
                      </group>
                    )}
                  </group>
                ))}
                {/* Label and nested partitions for last row */}
                {rowHeights[rowHeights.length - 1] && (() => {
                  const lastRowData = partitionData.find(p => p.rowIndex === rowHeights.length - 1);
                  if (!lastRowData) return null;
                  return (
                    <group>
                      {showMeasurements && (
                        <Html position={[interiorWidth / 2 + 0.2, interiorHeight / 2 - Number(rowHeights[rowHeights.length - 1]) * scale / 2, 0]} center>
                          <div className="bg-purple-100 px-2 py-1 rounded shadow-lg border border-purple-300 text-xs font-bold text-purple-900 whitespace-nowrap transform -rotate-90">
                            Row {rowHeights.length}: {rowHeights[rowHeights.length - 1]}mm
                          </div>
                        </Html>
                      )}
                      {/* Render nested partitions in the last row */}
                      {rows && rows[rowHeights.length - 1]?.nestedPartitions && (
                        <group>
                          {renderNestedPartitions(
                            rows[rowHeights.length - 1].nestedPartitions,
                            -interiorWidth / 2,
                            lastRowData.rowStartY,
                            interiorWidth,
                            lastRowData.rowHeight,
                            0
                          ).map((element, idx) => (
                            <React.Fragment key={`nested-row-last-${idx}`}>
                              {element}
                            </React.Fragment>
                          ))}
                        </group>
                      )}
                    </group>
                  );
                })()}
              </>
            );
          })()}
        </group>
      )}

      {/* Measurement Labels - Width minus thickness, Height is full height */}
      {showMeasurements && (
        <>
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
        </>
      )}
    </group>
  );
}

function CameraController({ view, maxDim, controlsRef }: { view: "front" | "side" | "top"; maxDim: number; controlsRef: React.RefObject<React.ComponentRef<typeof OrbitControls> | null> }) {
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

export default function Wardrobe3D({ width, height, depth, numberOfShelves, view, materialThickness, backPanelThickness, ...props }: Wardrobe3DProps) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const [showMeasurements, setShowMeasurements] = useState(false);
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
      {/* Toggle Measurements Button */}
      <button
        onClick={() => setShowMeasurements(!showMeasurements)}
        className="absolute top-2 right-2 z-10 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 shadow-md text-sm font-medium text-gray-700 transition-colors"
        title={showMeasurements ? "Hide Measurements" : "Show Measurements"}
      >
        {showMeasurements ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
            Hide Measurements
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Show Measurements
          </span>
        )}
      </button>

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
        materialThickness={materialThickness || 18}
        backPanelThickness={backPanelThickness || 6}
        partitionType={props.partitionType}
        partitionThickness={props.partitionThickness}
        columnWidths={props.columnWidths}
        rowHeights={props.rowHeights}
        columns={props.columns}
        rows={props.rows}
        showMeasurements={showMeasurements}
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

