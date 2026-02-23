"use client";

import React from "react";

type Piece = {
  length: number;
  width: number;
  quantity: number;
  material: string;
  thickness: number;
  id: string;
};

type PlacedPiece = {
  piece: Piece;
  x: number;
  y: number;
  rotated: boolean;
};

type Sheet = {
  pieces: PlacedPiece[];
  width: number;
  height: number;
};

interface SheetArrangementProps {
  pieces: Piece[];
  sheetWidth: number;
  sheetHeight: number;
  cuttingWidth: number;
}

// Bottom-left fill bin packing algorithm
function arrangePieces(
  pieces: Piece[],
  sheetWidth: number,
  sheetHeight: number,
  cuttingWidth: number
): Sheet[] {
  const sheets: Sheet[] = [];
  
  // Expand pieces by quantity
  const expandedPieces: Piece[] = [];
  pieces.forEach(piece => {
    for (let i = 0; i < piece.quantity; i++) {
      expandedPieces.push({ ...piece, id: `${piece.id}_${i}` });
    }
  });
  
  // Sort pieces by area (largest first) for better packing
  expandedPieces.sort((a, b) => (b.length * b.width) - (a.length * a.width));
  
  let currentSheet: Sheet = {
    pieces: [],
    width: sheetWidth,
    height: sheetHeight
  };
  
  // Track occupied areas using a simple grid approach
  const occupiedAreas: Array<{ x: number; y: number; width: number; height: number }> = [];
  
  for (const piece of expandedPieces) {
    let placed = false;
    
    // Try both orientations
    for (const rotated of [false, true]) {
      const pieceWidth = rotated ? piece.width : piece.length;
      const pieceHeight = rotated ? piece.length : piece.width;
      
      // Add cutting width to dimensions
      const totalWidth = pieceWidth + cuttingWidth;
      const totalHeight = pieceHeight + cuttingWidth;
      
      // Try to place at bottom-left positions
      for (let y = 0; y <= currentSheet.height - totalHeight; y += 10) {
        for (let x = 0; x <= currentSheet.width - totalWidth; x += 10) {
          // Check if this position overlaps with existing pieces
          const overlaps = occupiedAreas.some(area => {
            return !(
              x + totalWidth <= area.x ||
              x >= area.x + area.width ||
              y + totalHeight <= area.y ||
              y >= area.y + area.height
            );
          });
          
          if (!overlaps) {
            // Place the piece
            currentSheet.pieces.push({
              piece,
              x,
              y,
              rotated
            });
            
            occupiedAreas.push({
              x,
              y,
              width: totalWidth,
              height: totalHeight
            });
            
            placed = true;
            break;
          }
        }
        if (placed) break;
      }
      
      if (placed) break;
    }
    
    // If couldn't place, create new sheet
    if (!placed) {
      sheets.push(currentSheet);
      currentSheet = {
        pieces: [],
        width: sheetWidth,
        height: sheetHeight
      };
      occupiedAreas.length = 0;
      
      // Try to place on new sheet (same logic)
      for (const rotated of [false, true]) {
        const pieceWidth = rotated ? piece.width : piece.length;
        const pieceHeight = rotated ? piece.length : piece.width;
        const totalWidth = pieceWidth + cuttingWidth;
        const totalHeight = pieceHeight + cuttingWidth;
        
        if (totalWidth <= currentSheet.width && totalHeight <= currentSheet.height) {
          currentSheet.pieces.push({
            piece,
            x: 0,
            y: 0,
            rotated
          });
          occupiedAreas.push({
            x: 0,
            y: 0,
            width: totalWidth,
            height: totalHeight
          });
          placed = true;
          break;
        }
      }
    }
  }
  
  // Add the last sheet if it has pieces
  if (currentSheet.pieces.length > 0) {
    sheets.push(currentSheet);
  }
  
  return sheets;
}

export default function SheetArrangement({
  pieces,
  sheetWidth,
  sheetHeight,
  cuttingWidth
}: SheetArrangementProps) {
  const sheets = arrangePieces(pieces, sheetWidth, sheetHeight, cuttingWidth);
  
  // Calculate scale for visualization
  const maxDimension = Math.max(sheetWidth, sheetHeight);
  const viewBoxSize = 800;
  const scale = viewBoxSize / maxDimension;
  
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 mb-2">Sheet Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-700">Sheet Size: </span>
            <span className="font-semibold text-blue-900">{sheetWidth}mm × {sheetHeight}mm</span>
          </div>
          <div>
            <span className="text-blue-700">Cutting Width: </span>
            <span className="font-semibold text-blue-900">{cuttingWidth}mm</span>
          </div>
          <div>
            <span className="text-blue-700">Total Sheets Needed: </span>
            <span className="font-semibold text-blue-900 text-lg">{sheets.length}</span>
          </div>
          <div>
            <span className="text-blue-700">Total Pieces: </span>
            <span className="font-semibold text-blue-900">
              {pieces.reduce((sum, p) => sum + p.quantity, 0)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="space-y-8">
        {sheets.map((sheet, sheetIndex) => (
          <div key={sheetIndex} className="border border-gray-300 rounded-lg p-4 bg-white">
            <h4 className="font-semibold text-gray-900 mb-4">
              Sheet {sheetIndex + 1} ({sheet.pieces.length} pieces)
            </h4>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <svg
                viewBox={`0 0 ${viewBoxSize} ${(sheetHeight / sheetWidth) * viewBoxSize}`}
                className="w-full h-auto border border-gray-300 bg-white rounded"
                style={{ maxHeight: '600px' }}
              >
                {/* Sheet outline */}
                <rect
                  x={0}
                  y={0}
                  width={sheetWidth * scale}
                  height={sheetHeight * scale}
                  fill="#f9fafb"
                  stroke="#374151"
                  strokeWidth={2}
                />
                
                {/* Pieces */}
                {sheet.pieces.map((placedPiece, pieceIndex) => {
                  const pieceWidth = placedPiece.rotated 
                    ? placedPiece.piece.width 
                    : placedPiece.piece.length;
                  const pieceHeight = placedPiece.rotated 
                    ? placedPiece.piece.length 
                    : placedPiece.piece.width;
                  
                  const x = placedPiece.x * scale;
                  const y = placedPiece.y * scale;
                  const width = pieceWidth * scale;
                  const height = pieceHeight * scale;
                  
                  // Color based on material (simple hash)
                  const materialHash = placedPiece.piece.material.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                  const hue = materialHash % 360;
                  const color = `hsl(${hue}, 70%, 80%)`;
                  
                  return (
                    <g key={pieceIndex}>
                      <rect
                        x={x}
                        y={y}
                        width={width}
                        height={height}
                        fill={color}
                        stroke="#1f2937"
                        strokeWidth={1.5}
                        opacity={0.8}
                      />
                      {/* Cutting line (outer border) */}
                      <rect
                        x={x - cuttingWidth * scale / 2}
                        y={y - cuttingWidth * scale / 2}
                        width={width + cuttingWidth * scale}
                        height={height + cuttingWidth * scale}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth={1}
                        strokeDasharray="4,4"
                        opacity={0.6}
                      />
                      {/* Dimensions label */}
                      <text
                        x={x + width / 2}
                        y={y + height / 2}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fontSize={Math.min(width, height) * 0.15}
                        fill="#1f2937"
                        fontWeight="bold"
                        className="select-none"
                      >
                        {placedPiece.rotated ? `${placedPiece.piece.width}×${placedPiece.piece.length}` : `${placedPiece.piece.length}×${placedPiece.piece.width}`}
                      </text>
                      {placedPiece.rotated && (
                        <text
                          x={x + width / 2}
                          y={y + height / 2 + Math.min(width, height) * 0.2}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fontSize={Math.min(width, height) * 0.1}
                          fill="#6b7280"
                          className="select-none"
                        >
                          R
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
              
              {/* Piece list for this sheet */}
              <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {Array.from(new Set(sheet.pieces.map(p => p.piece.id.split('_')[0]))).map(pieceId => {
                  const piece = pieces.find(p => p.id === pieceId);
                  if (!piece) return null;
                  const count = sheet.pieces.filter(p => p.piece.id.startsWith(pieceId)).length;
                  return (
                    <div key={pieceId} className="bg-gray-100 rounded px-2 py-1">
                      <span className="font-medium">{piece.length}×{piece.width}mm</span>
                      <span className="text-gray-600 ml-1">(×{count})</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { arrangePieces };
export type { Piece, Sheet, PlacedPiece };

