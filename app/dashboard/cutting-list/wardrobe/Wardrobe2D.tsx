"use client";

import React from "react";

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

interface Wardrobe2DProps {
  width: number;
  height: number;
  depth: number;
  numberOfShelves: number;
  materialThickness?: number;
  backPanelThickness?: number;
  partitionType?: "VERTICAL" | "HORIZONTAL" | "";
  partitionThickness?: number;
  columnWidths?: string[];
  rowHeights?: string[];
  columns?: ColumnData[];
  rows?: RowData[];
}

export default function Wardrobe2D({
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
  rows
}: Wardrobe2DProps) {
  // Don't show preview if no inputs
  if (!width || !height || !depth || (width === 1000 && height === 2000 && depth === 600)) {
    return null;
  }

  const scale = 0.3; // Scale factor for SVG
  const padding = 40;
  
  // Calculate dimensions
  const interiorWidth = width - (materialThickness * 2);
  const interiorHeight = height - (materialThickness * 2);
  
  const svgWidth = width * scale + padding * 2;
  const svgHeight = height * scale + padding * 2;
  
  const startX = padding;
  const startY = padding;
  const scaledWidth = width * scale;
  const scaledHeight = height * scale;
  const scaledThickness = materialThickness * scale;
  const scaledInteriorWidth = interiorWidth * scale;
  const scaledInteriorHeight = interiorHeight * scale;

  // Calculate partition positions
  const getVerticalPartitionPositions = () => {
    if (partitionType !== "VERTICAL" || !columnWidths || columnWidths.length === 0) return [];
    
    const partThickness = partitionThickness * scale;
    let currentX = startX + scaledThickness;
    const positions: Array<{ x: number; width: number; colIndex: number }> = [];
    
    columnWidths.forEach((colWidth, index) => {
      const colWidthScaled = Number(colWidth) * scale;
      if (index < columnWidths.length - 1) {
        currentX += colWidthScaled;
        positions.push({ x: currentX, width: partThickness, colIndex: index });
        currentX += partThickness;
      }
    });
    
    return positions;
  };

  const getHorizontalPartitionPositions = () => {
    if (partitionType !== "HORIZONTAL" || !rowHeights || rowHeights.length === 0) return [];
    
    const partThickness = partitionThickness * scale;
    let currentY = startY + scaledThickness;
    const positions: Array<{ y: number; height: number; rowIndex: number }> = [];
    
    rowHeights.forEach((rowHeight, index) => {
      const rowHeightScaled = Number(rowHeight) * scale;
      if (index < rowHeights.length - 1) {
        currentY += rowHeightScaled;
        positions.push({ y: currentY, height: partThickness, rowIndex: index });
        currentY += partThickness;
      }
    });
    
    return positions;
  };

  const verticalPartitions = getVerticalPartitionPositions();
  const horizontalPartitions = getHorizontalPartitionPositions();

  // Render nested partitions recursively
  const renderNestedPartitions = (
    nested: NestedPartition,
    startX: number,
    startY: number,
    availableWidth: number,
    availableHeight: number,
    depth: number
  ): React.ReactNode[] => {
    if (!nested || !nested.numberOfPartitions || Number(nested.numberOfPartitions) === 0) return [];
    
    const nestedThickness = Number(nested.thickness) * scale;
    const elements: React.ReactNode[] = [];
    
    if (nested.type === "HORIZONTAL" && nested.rows) {
      let currentY = startY;
      nested.rows.forEach((row, index) => {
        const rowHeight = Number(row.height) * scale;
        const rowStartY = currentY; // Track the start position of this row
        if (index < nested.rows!.length - 1) {
          currentY += rowHeight;
          elements.push(
            <line
              key={`nested-h-${depth}-${index}`}
              x1={startX}
              y1={currentY}
              x2={startX + availableWidth}
              y2={currentY}
              stroke="#9b59b6"
              strokeWidth={nestedThickness}
              strokeLinecap="round"
              strokeDasharray="3,3"
            />
          );
          currentY += nestedThickness;
        }
        // Recursively render nested partitions within this row
        if (row.nestedPartitions) {
          // Use the tracked row start position
          elements.push(...renderNestedPartitions(
            row.nestedPartitions,
            startX,
            rowStartY, // Use the tracked start position
            availableWidth, // This is already the column width when row is inside a column
            rowHeight,
            depth + 1
          ));
        }
      });
    } else if (nested.type === "VERTICAL" && nested.columns) {
      let currentX = startX;
      nested.columns.forEach((col, index) => {
        const colWidth = Number(col.width) * scale;
        const colStartX = currentX; // Track the start position of this column
        if (index < nested.columns!.length - 1) {
          currentX += colWidth;
          elements.push(
            <line
              key={`nested-v-${depth}-${index}`}
              x1={currentX}
              y1={startY}
              x2={currentX}
              y2={startY + availableHeight}
              stroke="#9b59b6"
              strokeWidth={nestedThickness}
              strokeLinecap="round"
              strokeDasharray="3,3"
            />
          );
          currentX += nestedThickness;
        }
        // Recursively render nested partitions within this column
        if (col.nestedPartitions) {
          // Use the tracked column start position
          elements.push(...renderNestedPartitions(
            col.nestedPartitions,
            colStartX, // Use the tracked start position
            startY,
            colWidth, // Use column width, not full availableWidth
            availableHeight,
            depth + 1
          ));
        }
      });
    }
    
    return elements;
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="max-w-full max-h-full"
      >
        {/* Outer border (material thickness) */}
        <rect
          x={startX}
          y={startY}
          width={scaledWidth}
          height={scaledHeight}
          fill="none"
          stroke="#a0a0a0"
          strokeWidth={scaledThickness}
        />
        
        {/* Interior area (lighter fill) */}
        <rect
          x={startX + scaledThickness}
          y={startY + scaledThickness}
          width={scaledInteriorWidth}
          height={scaledInteriorHeight}
          fill="#f0f0f0"
          stroke="#d3d3d3"
          strokeWidth="1"
        />

        {/* Shelves */}
        {Array.from({ length: numberOfShelves || 0 }).map((_, i) => {
          const shelfY = startY + scaledThickness + ((i + 1) * scaledInteriorHeight) / ((numberOfShelves || 0) + 1);
          return (
            <line
              key={`shelf-${i}`}
              x1={startX + scaledThickness}
              y1={shelfY}
              x2={startX + scaledThickness + scaledInteriorWidth}
              y2={shelfY}
              stroke="#d3d3d3"
              strokeWidth="2"
            />
          );
        })}

        {/* Vertical Partitions */}
        {verticalPartitions.map((partition, index) => {
          const colStartX = index === 0 ? startX + scaledThickness : verticalPartitions[index - 1].x + (partitionThickness * scale);
          const colWidth = Number(columnWidths[partition.colIndex]) * scale;
          return (
            <g key={`vertical-partition-${index}`}>
              <line
                x1={partition.x}
                y1={startY + scaledThickness}
                x2={partition.x}
                y2={startY + scaledThickness + scaledInteriorHeight}
                stroke="#8b9dc3"
                strokeWidth={partition.width}
                strokeLinecap="round"
              />
              {/* Column labels */}
              {columnWidths[partition.colIndex] && (
                <text
                  x={partition.x - Number(columnWidths[partition.colIndex]) * scale / 2}
                  y={startY - 5}
                  fontSize="10"
                  fill="#7c3aed"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  Col {partition.colIndex + 1}: {columnWidths[partition.colIndex]}mm
                </text>
              )}
              {/* Render nested partitions in this column */}
              {columns && columns[partition.colIndex]?.nestedPartitions && (
                <g>
                  {renderNestedPartitions(
                    columns[partition.colIndex].nestedPartitions,
                    colStartX,
                    startY + scaledThickness,
                    colWidth,
                    scaledInteriorHeight,
                    0
                  )}
                </g>
              )}
            </g>
          );
        })}
        
        {/* Last column label and nested partitions */}
        {partitionType === "VERTICAL" && columnWidths && columnWidths.length > 0 && columnWidths[columnWidths.length - 1] && (
          <g>
            <text
              x={startX + scaledThickness + scaledInteriorWidth - Number(columnWidths[columnWidths.length - 1]) * scale / 2}
              y={startY - 5}
              fontSize="10"
              fill="#7c3aed"
              fontWeight="bold"
              textAnchor="middle"
            >
              Col {columnWidths.length}: {columnWidths[columnWidths.length - 1]}mm
            </text>
            {/* Render nested partitions in the last column */}
            {columns && columns[columnWidths.length - 1]?.nestedPartitions && (() => {
              // Calculate the start X position for the last column
              let lastColStartX = startX + scaledThickness;
              columnWidths.forEach((colWidth, idx) => {
                if (idx < columnWidths.length - 1) {
                  lastColStartX += Number(colWidth) * scale;
                  lastColStartX += (partitionThickness * scale);
                }
              });
              const lastColWidth = Number(columnWidths[columnWidths.length - 1]) * scale;
              return (
                <g>
                  {renderNestedPartitions(
                    columns[columnWidths.length - 1].nestedPartitions,
                    lastColStartX,
                    startY + scaledThickness,
                    lastColWidth,
                    scaledInteriorHeight,
                    0
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* Horizontal Partitions */}
        {horizontalPartitions.map((partition, index) => {
          const rowStartY = index === 0 ? startY + scaledThickness : horizontalPartitions[index - 1].y + (partitionThickness * scale);
          const rowHeight = Number(rowHeights[partition.rowIndex]) * scale;
          return (
            <g key={`horizontal-partition-${index}`}>
              <line
                x1={startX + scaledThickness}
                y1={partition.y}
                x2={startX + scaledThickness + scaledInteriorWidth}
                y2={partition.y}
                stroke="#8b9dc3"
                strokeWidth={partition.height}
                strokeLinecap="round"
              />
              {/* Row labels */}
              {rowHeights[partition.rowIndex] && (
                <text
                  x={startX + scaledThickness + scaledInteriorWidth + 5}
                  y={partition.y - Number(rowHeights[partition.rowIndex]) * scale / 2}
                  fontSize="10"
                  fill="#7c3aed"
                  fontWeight="bold"
                  transform={`rotate(90 ${startX + scaledThickness + scaledInteriorWidth + 5} ${partition.y - Number(rowHeights[partition.rowIndex]) * scale / 2})`}
                >
                  Row {partition.rowIndex + 1}: {rowHeights[partition.rowIndex]}mm
                </text>
              )}
              {/* Render nested partitions in this row */}
              {rows && rows[partition.rowIndex]?.nestedPartitions && (
                <g>
                  {renderNestedPartitions(
                    rows[partition.rowIndex].nestedPartitions,
                    startX + scaledThickness,
                    rowStartY,
                    scaledInteriorWidth,
                    rowHeight,
                    0
                  )}
                </g>
              )}
            </g>
          );
        })}
        
        {/* Last row label and nested partitions */}
        {partitionType === "HORIZONTAL" && rowHeights && rowHeights.length > 0 && rowHeights[rowHeights.length - 1] && (
          <g>
            <text
              x={startX + scaledThickness + scaledInteriorWidth + 5}
              y={startY + scaledThickness + scaledInteriorHeight - Number(rowHeights[rowHeights.length - 1]) * scale / 2}
              fontSize="10"
              fill="#7c3aed"
              fontWeight="bold"
              transform={`rotate(90 ${startX + scaledThickness + scaledInteriorWidth + 5} ${startY + scaledThickness + scaledInteriorHeight - Number(rowHeights[rowHeights.length - 1]) * scale / 2})`}
            >
              Row {rowHeights.length}: {rowHeights[rowHeights.length - 1]}mm
            </text>
            {/* Render nested partitions in the last row */}
            {rows && rows[rowHeights.length - 1]?.nestedPartitions && (() => {
              // Calculate the start Y position for the last row
              let lastRowStartY = startY + scaledThickness;
              rowHeights.forEach((rowHeight, idx) => {
                if (idx < rowHeights.length - 1) {
                  lastRowStartY += Number(rowHeight) * scale;
                  lastRowStartY += (partitionThickness * scale);
                }
              });
              const lastRowHeight = Number(rowHeights[rowHeights.length - 1]) * scale;
              return (
                <g>
                  {renderNestedPartitions(
                    rows[rowHeights.length - 1].nestedPartitions,
                    startX + scaledThickness,
                    lastRowStartY,
                    scaledInteriorWidth,
                    lastRowHeight,
                    0
                  )}
                </g>
              );
            })()}
          </g>
        )}

        {/* Dimension labels */}
        {/* Width label (bottom) */}
        <g>
          <line
            x1={startX}
            y1={startY + scaledHeight + 10}
            x2={startX + scaledWidth}
            y2={startY + scaledHeight + 10}
            stroke="#3b82f6"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
            markerStart="url(#arrowhead)"
          />
          <text
            x={startX + scaledWidth / 2}
            y={startY + scaledHeight + 25}
            fontSize="12"
            fill="#1e40af"
            fontWeight="bold"
            textAnchor="middle"
          >
            W: {width - (materialThickness * 2)}mm
          </text>
        </g>

        {/* Height label (left) */}
        <g>
          <line
            x1={startX - 10}
            y1={startY}
            x2={startX - 10}
            y2={startY + scaledHeight}
            stroke="#3b82f6"
            strokeWidth="1.5"
            markerEnd="url(#arrowhead)"
            markerStart="url(#arrowhead)"
          />
          <text
            x={startX - 25}
            y={startY + scaledHeight / 2}
            fontSize="12"
            fill="#1e40af"
            fontWeight="bold"
            textAnchor="middle"
            transform={`rotate(-90 ${startX - 25} ${startY + scaledHeight / 2})`}
          >
            H: {height}mm
          </text>
        </g>

        {/* Material thickness label */}
        <text
          x={startX + scaledWidth - scaledThickness / 2}
          y={startY + scaledThickness / 2}
          fontSize="10"
          fill="#16a34a"
          fontWeight="bold"
          textAnchor="middle"
        >
          Thickness: {materialThickness}mm
        </text>

        {/* Arrow markers */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="5"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#3b82f6" />
          </marker>
        </defs>
      </svg>
    </div>
  );
}

