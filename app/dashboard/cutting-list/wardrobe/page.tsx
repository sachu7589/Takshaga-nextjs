"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowLeft, X, FileText, Plus, Trash2, Download } from "lucide-react";
import dynamic from "next/dynamic";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Wardrobe2D from "./Wardrobe2D";
import SheetArrangement, { type Piece, arrangePieces } from "./SheetArrangement";

// Nested partition structure
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

const Wardrobe3D = dynamic(() => import("./Wardrobe3D"), { 
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading 3D Preview...</p>
      </div>
    </div>
  )
});

// Nested Partition Configuration Component
function NestedPartitionConfig({
  parentType,
  parentIndex,
  nested,
  onUpdate,
  defaultMaterial,
  defaultThickness,
  parentWidth,
  parentHeight,
  materialThickness,
  wardrobeHeight,
  parentColumnWidth
}: {
  parentType: "VERTICAL" | "HORIZONTAL";
  parentIndex: number;
  nested: NestedPartition;
  onUpdate: (nested: NestedPartition) => void;
  defaultMaterial: string;
  defaultThickness: string;
  parentWidth?: number;
  parentHeight?: number;
  materialThickness?: number;
  wardrobeHeight?: number;
  parentColumnWidth?: number; // For rows inside columns - the column width
}) {
  const [localNested, setLocalNested] = useState<NestedPartition>(nested);
  const [expandedNested, setExpandedNested] = useState<number | null>(null);

  // Sync localNested when nested prop changes
  useEffect(() => {
    setLocalNested(nested);
  }, [nested]);

  // Validation for nested partitions
  const getNestedValidation = () => {
    if (!localNested || !localNested.numberOfPartitions || Number(localNested.numberOfPartitions) === 0) {
      return { isValid: true, message: "" };
    }

    const nestedThickness = Number(localNested.thickness) || 0;
    const numPartitions = Number(localNested.numberOfPartitions) || 0;

    if (localNested.type === "HORIZONTAL" && localNested.rows) {
      // For horizontal partitions in a column: 
      // - If parentHeight is provided (nested in a nested column inside a row), use parentHeight (nested column width)
      // - If parentWidth is provided (nested in a main column), use parentWidth (column width = available height)
      // - Otherwise use wardrobeHeight - materialThickness * 2 (first level nested in main column)
      let availableHeight: number;
      let validationMessage: string;
      
      if (parentHeight !== undefined && parentHeight > 0 && parentType === "VERTICAL") {
        // Nested inside a nested column (which is inside a row) - use the nested column width
        availableHeight = parentHeight;
        validationMessage = `Sum of row heights (Xmm) + partition thickness (Ymm) = Zmm, but should equal column width ${availableHeight}mm`;
      } else if (parentWidth !== undefined && parentWidth > 0 && parentType === "VERTICAL") {
        // Nested inside a main column - use the column width as available height
        availableHeight = parentWidth;
        validationMessage = `Sum of row heights (Xmm) + partition thickness (Ymm) = Zmm, but should equal column width ${availableHeight}mm`;
      } else if (wardrobeHeight !== undefined && materialThickness !== undefined) {
        // First level nested - use interior height
        const materialThick = materialThickness || 18;
        availableHeight = wardrobeHeight - (materialThick * 2);
        validationMessage = `Sum of row heights (Xmm) + partition thickness (Ymm) = Zmm, but should equal interior height ${availableHeight}mm (wardrobe height ${wardrobeHeight}mm - material thickness ${materialThick * 2}mm)`;
      } else {
        return { isValid: true, message: "" };
      }
      
      const rowHeightsSum = localNested.rows.reduce((sum, row) => sum + (Number(row.height) || 0), 0);
      const partitionThicknessTotal = nestedThickness * numPartitions;
      const calculatedHeight = rowHeightsSum + partitionThicknessTotal;
      
      if (Math.abs(calculatedHeight - availableHeight) > 0.1) {
        return {
          isValid: false,
          message: validationMessage
            .replace('Xmm', `${rowHeightsSum}mm`)
            .replace('Ymm', `${partitionThicknessTotal}mm`)
            .replace('Zmm', `${calculatedHeight}mm`)
        };
      }
    } else if (localNested.type === "VERTICAL" && localNested.columns) {
      // For vertical partitions in a row: 
      // - If parentColumnWidth is provided (row is inside a column), use parentColumnWidth
      // - Otherwise if parentHeight is provided (first level nested in main row), use parentHeight
      let availableWidth: number;
      let validationMessage: string;
      
      if (parentColumnWidth !== undefined && parentColumnWidth > 0) {
        // Nested inside a row that's inside a column - use the parent column width
        availableWidth = parentColumnWidth;
        validationMessage = `Sum of column widths (Xmm) + partition thickness (Ymm) = Zmm, but should equal column width ${availableWidth}mm`;
      } else if (parentHeight !== undefined && parentHeight > 0) {
        // First level nested in a main row - use row height
        availableWidth = parentHeight;
        validationMessage = `Sum of column widths (Xmm) + partition thickness (Ymm) = Zmm, but should equal row height ${availableWidth}mm`;
      } else {
        return { isValid: true, message: "" };
      }
      
      const columnWidthsSum = localNested.columns.reduce((sum, col) => sum + (Number(col.width) || 0), 0);
      const partitionThicknessTotal = nestedThickness * numPartitions;
      const calculatedWidth = columnWidthsSum + partitionThicknessTotal;
      
      if (Math.abs(calculatedWidth - availableWidth) > 0.1) {
        return {
          isValid: false,
          message: validationMessage
            .replace('Xmm', `${columnWidthsSum}mm`)
            .replace('Ymm', `${partitionThicknessTotal}mm`)
            .replace('Zmm', `${calculatedWidth}mm`)
        };
      }
    }

    return { isValid: true, message: "" };
  };

  const nestedValidation = getNestedValidation();

  const updateLocalNested = (updates: Partial<NestedPartition>) => {
    const updated = { ...localNested, ...updates } as NestedPartition;
    setLocalNested(updated);
    onUpdate(updated);
  };

  const handleTypeChange = (type: string) => {
    updateLocalNested({
      type: type as "VERTICAL" | "HORIZONTAL",
      numberOfPartitions: "",
      material: defaultMaterial,
      thickness: defaultThickness,
      columns: undefined,
      rows: undefined
    });
  };

  const handleNumberOfPartitionsChange = (num: number) => {
    const numRowsOrCols = num + 1;
    if (localNested?.type === "VERTICAL") {
      updateLocalNested({
        ...localNested,
        numberOfPartitions: num.toString(),
        columns: Array(numRowsOrCols).fill(null).map(() => ({ width: "", nestedPartitions: null }))
      });
    } else if (localNested?.type === "HORIZONTAL") {
      updateLocalNested({
        ...localNested,
        numberOfPartitions: num.toString(),
        rows: Array(numRowsOrCols).fill(null).map(() => ({ height: "", nestedPartitions: null }))
      });
    }
  };

  if (!localNested) {
    return (
      <button
        onClick={() => {
          const newNested: NestedPartition = {
            type: parentType === "VERTICAL" ? "HORIZONTAL" : "VERTICAL",
            numberOfPartitions: "",
            material: defaultMaterial,
            thickness: defaultThickness,
            columns: undefined,
            rows: undefined
          };
          setLocalNested(newNested);
          onUpdate(newNested);
        }}
        className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        Add Partitions
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-semibold text-gray-900">
          {parentType === "VERTICAL" ? "Horizontal" : "Vertical"} Partitions
        </h4>
        <button
          onClick={() => {
            setLocalNested(null);
            onUpdate(null);
          }}
          className="text-red-600 hover:text-red-800"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Partition Type
        </label>
        <select
          value={localNested.type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="VERTICAL">Vertical</option>
          <option value="HORIZONTAL">Horizontal</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Number of Partitions
        </label>
        <input
          type="number"
          min="0"
          value={localNested.numberOfPartitions}
          onChange={(e) => handleNumberOfPartitionsChange(Number(e.target.value) || 0)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material Type
          </label>
          <select
            value={localNested.material}
            onChange={(e) => updateLocalNested({ material: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="">Select Material Type</option>
            <option value="Plywood">Plywood</option>
            <option value="MDF">MDF</option>
            <option value="Particle board">Particle board</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Thickness - mm
          </label>
          <input
            type="number"
            value={localNested.thickness}
            onChange={(e) => updateLocalNested({ thickness: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
      </div>

      {localNested.type === "VERTICAL" && localNested.columns && localNested.columns.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Enter Width of Each Column</h5>
          <div className="space-y-2">
            {localNested.columns.map((col, index) => (
              <div key={index}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Column {index + 1} - mm
                </label>
                <input
                  type="number"
                  value={col.width}
                  onChange={(e) => {
                    const newColumns = [...localNested.columns!];
                    newColumns[index] = { ...newColumns[index], width: e.target.value };
                    updateLocalNested({ columns: newColumns });
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {localNested.type === "HORIZONTAL" && localNested.rows && localNested.rows.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Enter Height of Each Row</h5>
          <div className="space-y-2">
            {localNested.rows.map((row, index) => (
              <div key={index}>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Row {index + 1} - mm
                </label>
                <input
                  type="number"
                  value={row.height}
                  onChange={(e) => {
                    const newRows = [...localNested.rows!];
                    newRows[index] = { ...newRows[index], height: e.target.value };
                    updateLocalNested({ rows: newRows });
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nested Arrangements */}
      {localNested && 
       ((localNested.type === "VERTICAL" && localNested.columns && localNested.columns.every(col => col.width)) ||
        (localNested.type === "HORIZONTAL" && localNested.rows && localNested.rows.every(row => row.height))) && (
        <div className="pt-4 border-t border-gray-300">
          <h5 className="text-sm font-semibold text-gray-900 mb-3">Nested Arrangements</h5>
          {localNested.type === "VERTICAL" && localNested.columns && (
            <div className="flex flex-wrap gap-2">
              {localNested.columns.map((col, index) => (
                <button
                  key={index}
                  onClick={() => setExpandedNested(expandedNested === index ? null : index)}
                  className={`px-3 py-2 rounded-lg border-2 text-xs transition-all ${
                    expandedNested === index
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white hover:border-purple-300"
                  }`}
                >
                  <div className="font-medium">Col {index + 1}</div>
                  <div className="text-xs text-gray-600">{col.width || "?"}mm</div>
                </button>
              ))}
            </div>
          )}
          {localNested.type === "HORIZONTAL" && localNested.rows && (
            <div className="space-y-2">
              {localNested.rows.map((row, index) => (
                <button
                  key={index}
                  onClick={() => setExpandedNested(expandedNested === index ? null : index)}
                  className={`w-full px-3 py-2 rounded-lg border-2 text-xs transition-all ${
                    expandedNested === index
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-gray-300 bg-white hover:border-purple-300"
                  }`}
                >
                  <div className="font-medium">Row {index + 1}</div>
                  <div className="text-xs text-gray-600">{row.height || "?"}mm</div>
                </button>
              ))}
            </div>
          )}

          {expandedNested !== null && (
            <div className="mt-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
              {localNested.type === "VERTICAL" && localNested.columns && localNested.columns[expandedNested] && (
                <NestedPartitionConfig
                  parentType="VERTICAL"
                  parentIndex={expandedNested}
                  nested={localNested.columns[expandedNested].nestedPartitions}
                  onUpdate={(nested) => {
                    const newColumns = [...localNested.columns!];
                    newColumns[expandedNested] = {
                      ...newColumns[expandedNested],
                      nestedPartitions: nested
                    };
                    updateLocalNested({ columns: newColumns });
                  }}
                  defaultMaterial={localNested.material}
                  defaultThickness={localNested.thickness}
                  parentHeight={Number(localNested.columns[expandedNested].width) || 0}
                  materialThickness={materialThickness}
                  wardrobeHeight={wardrobeHeight}
                  parentColumnWidth={parentWidth} // Pass parent column width for nested columns inside rows
                />
              )}
              {localNested.type === "HORIZONTAL" && localNested.rows && localNested.rows[expandedNested] && (
                <NestedPartitionConfig
                  parentType="HORIZONTAL"
                  parentIndex={expandedNested}
                  nested={localNested.rows[expandedNested].nestedPartitions}
                  onUpdate={(nested) => {
                    const newRows = [...localNested.rows!];
                    newRows[expandedNested] = {
                      ...newRows[expandedNested],
                      nestedPartitions: nested
                    };
                    updateLocalNested({ rows: newRows });
                  }}
                  defaultMaterial={localNested.material}
                  defaultThickness={localNested.thickness}
                  parentWidth={Number(localNested.rows[expandedNested].height) || 0}
                  materialThickness={materialThickness}
                  wardrobeHeight={wardrobeHeight}
                  parentColumnWidth={parentWidth} // Pass parent column width for rows inside columns
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WardrobePage() {
  const [boxInputs, setBoxInputs] = useState({
    width: "",
    height: "",
    depth: "",
    material: "",
    thickness: "",
    backPanelMaterial: "",
    backPanelThickness: ""
  });

  const [partitionInputs, setPartitionInputs] = useState<{
    type: "" | "VERTICAL" | "HORIZONTAL";
    numberOfPartitions: string;
    material: string;
    thickness: string;
    columns?: ColumnData[];
    rows?: RowData[];
  }>({
    type: "",
    numberOfPartitions: "",
    material: "",
    thickness: "",
  });

  // Preview mode state (2D or 3D)
  const [previewMode, setPreviewMode] = useState<"2D" | "3D">("2D");
  
  // 3D view state
  const [view, setView] = useState<"front" | "side" | "top">("front");
  
  // Modal state
  const [showCuttingListModal, setShowCuttingListModal] = useState(false);
  
  // Sheet arrangement state
  const [sheetLength, setSheetLength] = useState("");
  const [sheetBreadth, setSheetBreadth] = useState("");
  const [cuttingWidth, setCuttingWidth] = useState("");
  const [showSheetArrangement, setShowSheetArrangement] = useState(false);
  
  // Refs for capturing images
  const wardrobe2DRef = useRef<HTMLDivElement>(null);

  // Expanded arrangement state
  const [expandedArrangement, setExpandedArrangement] = useState<number | null>(null);

  const updateBoxInput = (field: string, value: number | string) => {
    setBoxInputs(prev => ({ ...prev, [field]: value }));
  };

  const updatePartitionInput = (field: string, value: number | string) => {
    setPartitionInputs(prev => ({ ...prev, [field]: value }));
  };

  const updatePartitionType = (type: string) => {
    setPartitionInputs(prev => ({
      ...prev,
      type: type as "VERTICAL" | "HORIZONTAL" | "",
      numberOfPartitions: "",
      columns: undefined,
      rows: undefined
    }));
  };

  const updateNumberOfPartitions = (num: number) => {
    const numPartitions = num || 0;
    const numColumnsOrRows = numPartitions + 1;
    
    if (partitionInputs.type === "VERTICAL") {
      setPartitionInputs(prev => ({
        ...prev,
        numberOfPartitions: num.toString(),
        columns: Array(numColumnsOrRows).fill(null).map(() => ({
          width: "",
          nestedPartitions: null
        }))
      }));
    } else if (partitionInputs.type === "HORIZONTAL") {
      setPartitionInputs(prev => ({
        ...prev,
        numberOfPartitions: num.toString(),
        rows: Array(numColumnsOrRows).fill(null).map(() => ({
          height: "",
          nestedPartitions: null
        }))
      }));
    }
  };

  const updateColumnWidth = (index: number, value: string) => {
    setPartitionInputs(prev => {
      if (!prev.columns) return prev;
      const newColumns = [...prev.columns];
      newColumns[index] = { ...newColumns[index], width: value };
      return { ...prev, columns: newColumns };
    });
  };

  const updateRowHeight = (index: number, value: string) => {
    setPartitionInputs(prev => {
      if (!prev.rows) return prev;
      const newRows = [...prev.rows];
      newRows[index] = { ...newRows[index], height: value };
      return { ...prev, rows: newRows };
    });
  };

  // Nested partition functions
  const addNestedPartition = (parentType: "VERTICAL" | "HORIZONTAL", parentIndex: number) => {
    setPartitionInputs(prev => {
      if (parentType === "VERTICAL" && prev.columns) {
        const newColumns = [...prev.columns];
        newColumns[parentIndex] = {
          ...newColumns[parentIndex],
          nestedPartitions: {
            type: "HORIZONTAL",
            numberOfPartitions: "",
            material: prev.material || "",
            thickness: prev.thickness || "",
            rows: []
          }
        };
        return { ...prev, columns: newColumns };
      } else if (parentType === "HORIZONTAL" && prev.rows) {
        const newRows = [...prev.rows];
        newRows[parentIndex] = {
          ...newRows[parentIndex],
          nestedPartitions: {
            type: "VERTICAL",
            numberOfPartitions: "",
            material: prev.material || "",
            thickness: prev.thickness || "",
            columns: []
          }
        };
        return { ...prev, rows: newRows };
      }
      return prev;
    });
  };

  const removeNestedPartition = (parentType: "VERTICAL" | "HORIZONTAL", parentIndex: number) => {
    setPartitionInputs(prev => {
      if (parentType === "VERTICAL" && prev.columns) {
        const newColumns = [...prev.columns];
        newColumns[parentIndex] = { ...newColumns[parentIndex], nestedPartitions: null };
        return { ...prev, columns: newColumns };
      } else if (parentType === "HORIZONTAL" && prev.rows) {
        const newRows = [...prev.rows];
        newRows[parentIndex] = { ...newRows[parentIndex], nestedPartitions: null };
        return { ...prev, rows: newRows };
      }
      return prev;
    });
  };

  const updateNestedPartitionNumberOfPartitions = (
    parentType: "VERTICAL" | "HORIZONTAL",
    parentIndex: number,
    num: number
  ) => {
    setPartitionInputs(prev => {
      if (parentType === "VERTICAL" && prev.columns?.[parentIndex]?.nestedPartitions) {
        const newColumns = [...prev.columns];
        const nested = newColumns[parentIndex].nestedPartitions!;
        const numRowsOrCols = num + 1;
        newColumns[parentIndex] = {
          ...newColumns[parentIndex],
          nestedPartitions: {
            ...nested,
            numberOfPartitions: num.toString(),
            rows: nested.type === "HORIZONTAL" 
              ? Array(numRowsOrCols).fill(null).map(() => ({ height: "", nestedPartitions: null }))
              : undefined,
            columns: nested.type === "VERTICAL"
              ? Array(numRowsOrCols).fill(null).map(() => ({ width: "", nestedPartitions: null }))
              : undefined
          }
        };
        return { ...prev, columns: newColumns };
      } else if (parentType === "HORIZONTAL" && prev.rows?.[parentIndex]?.nestedPartitions) {
        const newRows = [...prev.rows];
        const nested = newRows[parentIndex].nestedPartitions!;
        const numRowsOrCols = num + 1;
        newRows[parentIndex] = {
          ...newRows[parentIndex],
          nestedPartitions: {
            ...nested,
            numberOfPartitions: num.toString(),
            rows: nested.type === "HORIZONTAL"
              ? Array(numRowsOrCols).fill(null).map(() => ({ height: "", nestedPartitions: null }))
              : undefined,
            columns: nested.type === "VERTICAL"
              ? Array(numRowsOrCols).fill(null).map(() => ({ width: "", nestedPartitions: null }))
              : undefined
          }
        };
        return { ...prev, rows: newRows };
      }
      return prev;
    });
  };

  const updateNestedColumnWidth = (
    parentType: "VERTICAL" | "HORIZONTAL",
    parentIndex: number,
    colIndex: number,
    value: string
  ) => {
    setPartitionInputs(prev => {
      if (parentType === "VERTICAL" && prev.columns?.[parentIndex]?.nestedPartitions?.columns) {
        const newColumns = [...prev.columns];
        const nestedCols = [...newColumns[parentIndex].nestedPartitions!.columns!];
        nestedCols[colIndex] = { ...nestedCols[colIndex], width: value };
        newColumns[parentIndex] = {
          ...newColumns[parentIndex],
          nestedPartitions: {
            ...newColumns[parentIndex].nestedPartitions!,
            columns: nestedCols
          }
        };
        return { ...prev, columns: newColumns };
      } else if (parentType === "HORIZONTAL" && prev.rows?.[parentIndex]?.nestedPartitions?.columns) {
        const newRows = [...prev.rows];
        const nestedCols = [...newRows[parentIndex].nestedPartitions!.columns!];
        nestedCols[colIndex] = { ...nestedCols[colIndex], width: value };
        newRows[parentIndex] = {
          ...newRows[parentIndex],
          nestedPartitions: {
            ...newRows[parentIndex].nestedPartitions!,
            columns: nestedCols
          }
        };
        return { ...prev, rows: newRows };
      }
      return prev;
    });
  };

  const updateNestedRowHeight = (
    parentType: "VERTICAL" | "HORIZONTAL",
    parentIndex: number,
    rowIndex: number,
    value: string
  ) => {
    setPartitionInputs(prev => {
      if (parentType === "VERTICAL" && prev.columns?.[parentIndex]?.nestedPartitions?.rows) {
        const newColumns = [...prev.columns];
        const nestedRows = [...newColumns[parentIndex].nestedPartitions!.rows!];
        nestedRows[rowIndex] = { ...nestedRows[rowIndex], height: value };
        newColumns[parentIndex] = {
          ...newColumns[parentIndex],
          nestedPartitions: {
            ...newColumns[parentIndex].nestedPartitions!,
            rows: nestedRows
          }
        };
        return { ...prev, columns: newColumns };
      } else if (parentType === "HORIZONTAL" && prev.rows?.[parentIndex]?.nestedPartitions?.rows) {
        const newRows = [...prev.rows];
        const nestedRows = [...newRows[parentIndex].nestedPartitions!.rows!];
        nestedRows[rowIndex] = { ...nestedRows[rowIndex], height: value };
        newRows[parentIndex] = {
          ...newRows[parentIndex],
          nestedPartitions: {
            ...newRows[parentIndex].nestedPartitions!,
            rows: nestedRows
          }
        };
        return { ...prev, rows: newRows };
      }
      return prev;
    });
  };

  // Recursive function to add nested partition at any level
  const addNestedPartitionRecursive = (
    path: Array<{ type: "VERTICAL" | "HORIZONTAL"; index: number }>,
    targetType: "VERTICAL" | "HORIZONTAL",
    targetIndex: number
  ) => {
    setPartitionInputs(prev => {
      const updateNested = (nested: NestedPartition, pathIndex: number): NestedPartition => {
        if (pathIndex >= path.length) {
          // We've reached the target level
          if (pathIndex === path.length) {
            // Add partition to the target
            if (targetType === "VERTICAL" && nested?.type === "HORIZONTAL" && nested.rows) {
              const newRows = [...nested.rows];
              newRows[targetIndex] = {
                ...newRows[targetIndex],
                nestedPartitions: {
                  type: "VERTICAL",
                  numberOfPartitions: "",
                  material: nested.material || "",
                  thickness: nested.thickness || "",
                  columns: []
                }
              };
              return { ...nested, rows: newRows };
            } else if (targetType === "HORIZONTAL" && nested?.type === "VERTICAL" && nested.columns) {
              const newColumns = [...nested.columns];
              newColumns[targetIndex] = {
                ...newColumns[targetIndex],
                nestedPartitions: {
                  type: "HORIZONTAL",
                  numberOfPartitions: "",
                  material: nested.material || "",
                  thickness: nested.thickness || "",
                  rows: []
                }
              };
              return { ...nested, columns: newColumns };
            }
          }
          return nested;
        }

        const current = path[pathIndex];
        if (current.type === "VERTICAL" && nested?.columns) {
          const newColumns = [...nested.columns];
          newColumns[current.index] = {
            ...newColumns[current.index],
            nestedPartitions: updateNested(newColumns[current.index].nestedPartitions, pathIndex + 1)
          };
          return { ...nested, columns: newColumns };
        } else if (current.type === "HORIZONTAL" && nested?.rows) {
          const newRows = [...nested.rows];
          newRows[current.index] = {
            ...newRows[current.index],
            nestedPartitions: updateNested(newRows[current.index].nestedPartitions, pathIndex + 1)
          };
          return { ...nested, rows: newRows };
        }
        return nested;
      };

      if (prev.type === "VERTICAL" && prev.columns) {
        const newColumns = [...prev.columns];
        newColumns[path[0].index] = {
          ...newColumns[path[0].index],
          nestedPartitions: updateNested(newColumns[path[0].index].nestedPartitions, 1)
        };
        return { ...prev, columns: newColumns };
      } else if (prev.type === "HORIZONTAL" && prev.rows) {
        const newRows = [...prev.rows];
        newRows[path[0].index] = {
          ...newRows[path[0].index],
          nestedPartitions: updateNested(newRows[path[0].index].nestedPartitions, 1)
        };
        return { ...prev, rows: newRows };
      }
      return prev;
    });
  };

  const width = Number(boxInputs.width) || 0;
  const height = Number(boxInputs.height) || 0;
  const depth = Number(boxInputs.depth) || 0;
  const materialThickness = Number(boxInputs.thickness) || 18;
  const backPanelThickness = Number(boxInputs.backPanelThickness) || 6;
  const material = boxInputs.material || "Material";
  const backPanelMaterial = boxInputs.backPanelMaterial || "Material";
  
  // Check if any box input is provided
  const hasInputs = boxInputs.width || boxInputs.height || boxInputs.depth;

  // Partition validation
  const partitionThickness = Number(partitionInputs.thickness) || 0;
  const numPartitions = Number(partitionInputs.numberOfPartitions) || 0;
  const partitionMaterial = partitionInputs.material || "Material";

  let partitionValidation: { isValid: boolean; message: string } = { isValid: true, message: "" };

  if (partitionInputs.type && numPartitions > 0) {
    if (partitionInputs.type === "VERTICAL" && partitionInputs.columns) {
      const columnWidthsSum = partitionInputs.columns.reduce((sum, col) => sum + (Number(col.width) || 0), 0);
      const partitionThicknessTotal = partitionThickness * numPartitions;
      const calculatedWidth = columnWidthsSum + partitionThicknessTotal;
      const expectedWidth = width - (materialThickness * 2); // Interior width
      
      if (Math.abs(calculatedWidth - expectedWidth) > 0.1) {
        partitionValidation = {
          isValid: false,
          message: `Sum of column widths (${columnWidthsSum}mm) + partition thickness (${partitionThicknessTotal}mm) = ${calculatedWidth}mm, but should equal interior width ${expectedWidth}mm`
        };
      }
    } else if (partitionInputs.type === "HORIZONTAL" && partitionInputs.rows) {
      const rowHeightsSum = partitionInputs.rows.reduce((sum, row) => sum + (Number(row.height) || 0), 0);
      const partitionThicknessTotal = partitionThickness * numPartitions;
      const calculatedHeight = rowHeightsSum + partitionThicknessTotal;
      const expectedHeight = height - (materialThickness * 2); // Interior height
      
      if (Math.abs(calculatedHeight - expectedHeight) > 0.1) {
        partitionValidation = {
          isValid: false,
          message: `Sum of row heights (${rowHeightsSum}mm) + partition thickness (${partitionThicknessTotal}mm) = ${calculatedHeight}mm, but should equal interior height ${expectedHeight}mm`
        };
      }
    }
  }

  // Generate cutting list for open box
  const generateCuttingList = () => {
    if (!width || !height || !depth) return [];

    const materialThick = materialThickness || 18;
    const backThick = backPanelThickness || 6;
    
    // Calculate interior dimensions
    const interiorWidth = width - (materialThick * 2);
    const interiorHeight = height - (materialThick * 2);

    // Store parts with key for grouping
    const partsMap = new Map<string, {
      material: string;
      thickness: number;
      length: number;
      width: number;
      quantity: number;
    }>();

    // Helper function to add or update part
    const addPart = (length: number, width: number, thickness: number, quantity: number, material: string) => {
      const key = `${length}_${width}_${thickness}_${material}`;
      if (partsMap.has(key)) {
        const existing = partsMap.get(key)!;
        existing.quantity += quantity;
      } else {
        partsMap.set(key, {
          material,
          thickness,
          length,
          width,
          quantity
        });
      }
    };

    // Top and Bottom panels - Width minus thickness of 2 sides (same measurement, quantity 2)
    const topBottomWidth = width - (materialThick * 2);
    addPart(topBottomWidth, depth, materialThick, 2, material);

    // Left and Right side panels (same measurement, quantity 2)
    addPart(height, depth, materialThick, 2, material);

    // Back Panel
    const backMaterial = boxInputs.backPanelMaterial || material;
    addPart(interiorHeight, interiorWidth, backThick, 1, backMaterial);

    // Recursive function to process nested partitions
    const processNestedPartitions = (
      nested: NestedPartition,
      availableWidth: number,
      availableHeight: number,
      depth: number
    ) => {
      if (!nested || !nested.numberOfPartitions || Number(nested.numberOfPartitions) === 0) return;
      
      const nestedThickness = Number(nested.thickness) || 0;
      const nestedNumPartitions = Number(nested.numberOfPartitions) || 0;
      const nestedMaterial = nested.material || partitionMaterial;
      const nestedDepth = depth - backThick;
      
      if (nested.type === "VERTICAL" && nested.columns) {
        // Vertical nested partitions
        const nestedPartitionHeight = availableHeight;
        addPart(nestedPartitionHeight, nestedDepth, nestedThickness, nestedNumPartitions, nestedMaterial);
        
        // Process nested partitions within each column
        nested.columns.forEach((col) => {
          if (col.nestedPartitions) {
            processNestedPartitions(
              col.nestedPartitions,
              Number(col.width) || 0,
              availableHeight,
              depth
            );
          }
        });
      } else if (nested.type === "HORIZONTAL" && nested.rows) {
        // Horizontal nested partitions
        const nestedPartitionWidth = availableWidth;
        addPart(nestedPartitionWidth, nestedDepth, nestedThickness, nestedNumPartitions, nestedMaterial);
        
        // Process nested partitions within each row
        nested.rows.forEach((row) => {
          if (row.nestedPartitions) {
            processNestedPartitions(
              row.nestedPartitions,
              availableWidth,
              Number(row.height) || 0,
              depth
            );
          }
        });
      }
    };

    // Main partitions
    if (partitionInputs.type && numPartitions > 0 && partitionThickness > 0) {
      // Partition depth is depth minus back panel thickness
      const partitionDepth = depth - backThick;
      if (partitionInputs.type === "VERTICAL" && partitionInputs.columns) {
        // Vertical partitions: height × (depth - back panel thickness) × thickness
        const partitionHeight = interiorHeight;
        addPart(partitionHeight, partitionDepth, partitionThickness, numPartitions, partitionMaterial);
        
        // Process nested partitions in each column
        partitionInputs.columns.forEach((col) => {
          if (col.nestedPartitions) {
            processNestedPartitions(
              col.nestedPartitions,
              Number(col.width) || 0,
              interiorHeight,
              depth
            );
          }
        });
      } else if (partitionInputs.type === "HORIZONTAL" && partitionInputs.rows) {
        // Horizontal partitions: width × (depth - back panel thickness) × thickness
        const partitionWidth = interiorWidth;
        addPart(partitionWidth, partitionDepth, partitionThickness, numPartitions, partitionMaterial);
        
        // Process nested partitions in each row
        partitionInputs.rows.forEach((row) => {
          if (row.nestedPartitions) {
            processNestedPartitions(
              row.nestedPartitions,
              interiorWidth,
              Number(row.height) || 0,
              depth
            );
          }
        });
      }
    }

    // Convert map to array
    return Array.from(partsMap.values()).map((item, index) => ({
      material: item.material,
      thickness: item.thickness,
      measurement: `${item.length}×${item.width} mm`,
      quantity: item.quantity,
      length: item.length,
      width: item.width
    }));
  };
  
  // Convert cutting list to pieces for sheet arrangement
  const getPiecesForArrangement = (): Piece[] => {
    return cuttingList.map((item, index) => ({
      length: item.length,
      width: item.width,
      quantity: item.quantity,
      material: item.material,
      thickness: item.thickness,
      id: `piece_${index}`
    }));
  };
  
  // Download PDF function
  const handleDownloadPDF = async () => {
    if (cuttingList.length === 0) {
      alert("No cutting list available to download");
      return;
    }
    
    try {
      const doc = new jsPDF();
      let yPos = 20;
      
      // Title
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text("Wardrobe Cutting List", 105, yPos, { align: 'center' });
      yPos += 15;
      
      // Box Summary
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Box Summary", 15, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Height: ${height}mm`, 15, yPos);
      doc.text(`Width: ${width}mm`, 60, yPos);
      doc.text(`Depth: ${depth}mm`, 105, yPos);
      doc.text(`Material: ${material || "N/A"}`, 150, yPos);
      yPos += 7;
      doc.text(`Thickness: ${materialThickness}mm`, 15, yPos);
      doc.text(`Back Panel Material: ${backPanelMaterial || "N/A"}`, 60, yPos);
      doc.text(`Back Panel Thickness: ${backPanelThickness}mm`, 150, yPos);
      yPos += 15;
      
      // Cutting List Table
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Cutting List", 15, yPos);
      yPos += 5;
      
      const tableData = cuttingList.map(item => [
        item.material,
        `${item.thickness}mm`,
        item.measurement,
        item.quantity.toString()
      ]);
      
      autoTable(doc, {
        startY: yPos,
        head: [['Material', 'Thickness (mm)', 'Measurement', 'Quantity']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [66, 139, 202], textColor: 255, fontStyle: 'bold' },
        styles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
      });
      
      yPos = (doc as any).lastAutoTable.finalY + 15;
      
      // 2D Preview Section - Calculate image size first to determine page placement
      let imageAdded = false;
      let imageHeight = 0;
      
      try {
        // Small delay to ensure SVG is rendered
        await new Promise(resolve => setTimeout(resolve, 100));
        
        if (wardrobe2DRef.current) {
          const svgElement = wardrobe2DRef.current.querySelector('svg');
          if (svgElement) {
            // Get SVG dimensions first to calculate space needed
            const viewBox = svgElement.getAttribute('viewBox');
            const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
            const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
            
            let width = svgWidth;
            let height = svgHeight;
            
            if (viewBox) {
              const vb = viewBox.split(' ');
              width = parseFloat(vb[2]) || width;
              height = parseFloat(vb[3]) || height;
            }
            
            if (width > 0 && height > 0) {
              // Calculate PDF dimensions
              const maxWidth = 180;
              const aspectRatio = height / width;
              imageHeight = maxWidth * aspectRatio;
            }
          }
        }
      } catch (error) {
        console.error("Error calculating image size:", error);
      }
      
      // Check if we need a new page for heading + image
      const headingHeight = 8;
      const spaceNeeded = headingHeight + imageHeight + 10;
      if (yPos + spaceNeeded > 280 && imageHeight > 0) {
        doc.addPage();
        yPos = 20;
      }
      
      // Add heading (centered)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("2D Preview", 105, yPos, { align: 'center' });
      yPos += 8;
      
      // Try to capture and add 2D preview SVG
      try {
        if (wardrobe2DRef.current) {
          const svgElement = wardrobe2DRef.current.querySelector('svg');
          if (svgElement) {
            // Wait for image to load before continuing
            await new Promise<void>((resolve, reject) => {
              // Serialize SVG to string
              const svgData = new XMLSerializer().serializeToString(svgElement);
              
              // Get SVG dimensions from viewBox or width/height
              const viewBox = svgElement.getAttribute('viewBox');
              const svgWidth = parseFloat(svgElement.getAttribute('width') || '0');
              const svgHeight = parseFloat(svgElement.getAttribute('height') || '0');
              
              let width = svgWidth;
              let height = svgHeight;
              
              if (viewBox) {
                const vb = viewBox.split(' ');
                width = parseFloat(vb[2]) || width;
                height = parseFloat(vb[3]) || height;
              }
              
              // Ensure we have valid dimensions
              if (width === 0 || height === 0) {
                reject(new Error('Invalid SVG dimensions'));
                return;
              }
              
              // Create canvas to render SVG
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
              }
              
              // Set canvas size (scale up for better quality)
              const scale = 2;
              canvas.width = width * scale;
              canvas.height = height * scale;
              
              // Create data URL directly from SVG (more reliable)
              const svgBase64 = btoa(unescape(encodeURIComponent(svgData)));
              const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
              
              const img = new Image();
              img.crossOrigin = 'anonymous';
              
              img.onload = () => {
                try {
                  // Draw SVG to canvas
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  
                  // Convert canvas to data URL
                  const imgData = canvas.toDataURL('image/png');
                  
                  // Calculate dimensions to fit in PDF (max width 180mm)
                  const maxWidth = 180;
                  const aspectRatio = height / width;
                  let pdfWidth = maxWidth;
                  let pdfHeight = maxWidth * aspectRatio;
                  
                  // Check if we need a new page (double check in case calculation was off)
                  if (yPos + pdfHeight > 280) {
                    doc.addPage();
                    yPos = 20;
                    // Re-add heading on new page (centered)
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text("2D Preview", 105, yPos, { align: 'center' });
                    yPos += 8;
                  }
                  
                  // Add image to PDF
                  doc.addImage(imgData, 'PNG', 15, yPos, pdfWidth, pdfHeight);
                  imageAdded = true;
                  yPos += pdfHeight + 10;
                  resolve();
                } catch (err) {
                  console.error("Error adding image to PDF:", err);
                  reject(err);
                }
              };
              
              img.onerror = (err) => {
                console.error("Error loading SVG image:", err);
                reject(new Error('Failed to load SVG image'));
              };
              
              img.src = svgDataUrl;
            });
          } else {
            console.log("SVG element not found in wardrobe2DRef");
          }
        } else {
          console.log("wardrobe2DRef.current is null");
        }
      } catch (error) {
        console.error("Error capturing 2D preview:", error);
      }
      
      // Fallback if SVG not found or error
      if (!imageAdded) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("2D preview is available in the application interface.", 15, yPos);
        yPos += 15;
      }
      
      continueWithSheetArrangements(doc, yPos);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    }
  };
  
  const continueWithSheetArrangements = (doc: jsPDF, yPos: number) => {
    // Add sheet arrangement summary on first page if configured
    if (sheetLength && sheetBreadth && cuttingWidth) {
      const pieces = getPiecesForArrangement();
      const sheets = arrangePieces(
        pieces,
        Number(sheetBreadth),
        Number(sheetLength),
        Number(cuttingWidth)
      );
      
      // Sheet Arrangement Summary Section (on first page)
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Sheet Arrangement", 15, yPos);
      yPos += 8;
      
      // Sheet Summary
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Sheet Size: ${sheetBreadth}mm × ${sheetLength}mm`, 15, yPos);
      yPos += 6;
      doc.text(`Cutting Width: ${cuttingWidth}mm`, 15, yPos);
      yPos += 6;
      doc.text(`Total Sheets Needed: ${sheets.length}`, 15, yPos);
      yPos += 6;
      doc.text(`Total Pieces: ${pieces.reduce((sum, p) => sum + p.quantity, 0)}`, 15, yPos);
      
      // Add each sheet arrangement on separate pages (starting from page 2)
      addSheetArrangementsToPDF(doc, sheets);
    } else {
      doc.text("Sheet arrangement not configured", 15, yPos);
      doc.save("wardrobe_cutting_list.pdf");
    }
  };
  
  const addSheetArrangementsToPDF = (doc: jsPDF, sheets: Array<{ pieces: Array<{ piece: Piece; x: number; y: number; rotated: boolean }>; width: number; height: number }>) => {
    // Add each sheet on its own page, starting from page 2
    sheets.forEach((sheet, sheetIndex) => {
      // Always add a new page for each sheet arrangement (starting from page 2)
      doc.addPage();
      
      let yPos = 20;
      
      // Sheet title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sheet ${sheetIndex + 1} (${sheet.pieces.length} pieces)`, 105, yPos, { align: 'center' });
      yPos += 15;
      
      // Draw sheet outline - make it larger to fill most of the page
      const maxWidth = 180;
      const maxHeight = 250 - yPos;
      const sheetAspectRatio = sheet.height / sheet.width;
      let sheetWidth = maxWidth;
      let sheetHeight = sheetWidth * sheetAspectRatio;
      
      // If height exceeds max, scale down
      if (sheetHeight > maxHeight) {
        sheetHeight = maxHeight;
        sheetWidth = sheetHeight / sheetAspectRatio;
      }
      
      // Center the sheet on the page
      const startX = (210 - sheetWidth) / 2;
      const scale = sheetWidth / sheet.width;
      
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(1);
      doc.rect(startX, yPos, sheetWidth, sheetHeight);
      
      // Draw pieces
      sheet.pieces.forEach((placedPiece) => {
        const pieceWidth = placedPiece.rotated 
          ? placedPiece.piece.width 
          : placedPiece.piece.length;
        const pieceHeight = placedPiece.rotated 
          ? placedPiece.piece.length 
          : placedPiece.piece.width;
        
        const x = startX + placedPiece.x * scale;
        const y = yPos + placedPiece.y * scale;
        const w = pieceWidth * scale;
        const h = pieceHeight * scale;
        
        // Draw piece
        doc.setFillColor(200, 220, 240);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(x, y, w, h, 'FD');
        
        // Draw cutting line (red border)
        doc.setDrawColor(255, 0, 0);
        doc.setLineWidth(0.3);
        const cuttingW = Number(cuttingWidth) * scale;
        doc.rect(x - cuttingW/2, y - cuttingW/2, w + cuttingW, h + cuttingW);
        
        // Add dimensions text if space allows
        if (w > 15 && h > 10) {
          doc.setFontSize(Math.max(6, Math.min(10, Math.min(w, h) * 0.15)));
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          const dimText = placedPiece.rotated 
            ? `${placedPiece.piece.width}×${placedPiece.piece.length}`
            : `${placedPiece.piece.length}×${placedPiece.piece.width}`;
          doc.text(dimText, x + w/2, y + h/2, { align: 'center' });
          
          // Add rotation indicator if rotated
          if (placedPiece.rotated && w > 25 && h > 15) {
            doc.setFontSize(Math.max(5, Math.min(w, h) * 0.1));
            doc.setTextColor(100, 100, 100);
            doc.text("R", x + w/2, y + h/2 + Math.min(w, h) * 0.15, { align: 'center' });
          }
        }
      });
    });
    
    doc.save("wardrobe_cutting_list.pdf");
  };

  const cuttingList = generateCuttingList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <a href="/dashboard/cutting-list" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </a>
          <h1 className="text-3xl font-bold text-gray-900">Wardrobe Cutting List</h1>
        </div>
        <button
          onClick={() => setShowCuttingListModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <FileText className="h-5 w-5" />
          <span>View Cutting List</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
        {/* Input Form */}
        <div className="space-y-6 lg:pr-6">
          {/* Box Dimensions & Material */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Box Dimensions & Material</h2>
            <div className="space-y-4">
              {/* Box Dimensions in single row */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Width (W) - mm
                  </label>
                  <input
                    type="number"
                    value={boxInputs.width}
                    onChange={(e) => updateBoxInput("width", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Height (H) - mm
                  </label>
                  <input
                    type="number"
                    value={boxInputs.height}
                    onChange={(e) => updateBoxInput("height", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Total Depth (D) - mm
                  </label>
                  <input
                    type="number"
                    value={boxInputs.depth}
                    onChange={(e) => updateBoxInput("depth", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Material Type and Thickness */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Material Type
                  </label>
                  <select
                    value={boxInputs.material}
                    onChange={(e) => updateBoxInput("material", e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select Material Type</option>
                    <option value="Plywood">Plywood</option>
                    <option value="MDF">MDF</option>
                    <option value="Particle board">Particle board</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Thickness - mm
                  </label>
                  <input
                    type="number"
                    value={boxInputs.thickness}
                    onChange={(e) => updateBoxInput("thickness", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                </div>
              </div>

              {/* Back Panel */}
              <div className="pt-4 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Back Panel</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Material Type
                    </label>
                    <select
                      value={boxInputs.backPanelMaterial}
                      onChange={(e) => updateBoxInput("backPanelMaterial", e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">Select Material Type</option>
                      <option value="Plywood">Plywood</option>
                      <option value="MDF">MDF</option>
                      <option value="Particle board">Particle board</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thickness - mm
                    </label>
                    <input
                      type="number"
                      value={boxInputs.backPanelThickness}
                      onChange={(e) => updateBoxInput("backPanelThickness", e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder=""
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Partitions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Partitions</h2>
            <div className="space-y-4">
              {/* Partition Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Partition Type
                </label>
                <select
                  value={partitionInputs.type}
                  onChange={(e) => updatePartitionType(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select Partition Type</option>
                  <option value="VERTICAL">Vertical</option>
                  <option value="HORIZONTAL">Horizontal</option>
                </select>
              </div>

              {/* Number of Partitions */}
              {partitionInputs.type && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Partitions
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={partitionInputs.numberOfPartitions}
                    onChange={(e) => updateNumberOfPartitions(Number(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                  {partitionInputs.numberOfPartitions && (
                    <p className="mt-1 text-xs text-gray-600">
                      Total {partitionInputs.type === "VERTICAL" ? "columns" : "rows"}: {Number(partitionInputs.numberOfPartitions) + 1}
                    </p>
                  )}
                </div>
              )}

              {/* Partition Material and Thickness */}
              {partitionInputs.type && partitionInputs.numberOfPartitions && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Material Type
                      </label>
                      <select
                        value={partitionInputs.material}
                        onChange={(e) => updatePartitionInput("material", e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      >
                        <option value="">Select Material Type</option>
                        <option value="Plywood">Plywood</option>
                        <option value="MDF">MDF</option>
                        <option value="Particle board">Particle board</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Thickness - mm
                      </label>
                      <input
                        type="number"
                        value={partitionInputs.thickness}
                        onChange={(e) => updatePartitionInput("thickness", e.target.value === "" ? "" : Number(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder=""
                      />
                    </div>
                  </div>

                  {/* Vertical Partitions - Column Widths */}
                  {partitionInputs.type === "VERTICAL" && partitionInputs.columns && partitionInputs.columns.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Enter Width of Each Column
                      </h3>
                      <div className="space-y-3">
                        {partitionInputs.columns.map((col, index) => (
                          <div key={index}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Column {index + 1} - mm
                            </label>
                            <input
                              type="number"
                              value={col.width}
                              onChange={(e) => updateColumnWidth(index, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              placeholder=""
                            />
                          </div>
                        ))}
                        {partitionValidation && !partitionValidation.isValid && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{partitionValidation.message}</p>
                          </div>
                        )}
                        {partitionValidation && partitionValidation.isValid && partitionInputs.columns.every(col => col.width) && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">✓ Validation passed</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Horizontal Partitions - Row Heights */}
                  {partitionInputs.type === "HORIZONTAL" && partitionInputs.rows && partitionInputs.rows.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Enter Height of Each Row
                      </h3>
                      <div className="space-y-3">
                        {partitionInputs.rows.map((row, index) => (
                          <div key={index}>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Row {index + 1} - mm
                            </label>
                            <input
                              type="number"
                              value={row.height}
                              onChange={(e) => updateRowHeight(index, e.target.value)}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                              placeholder=""
                            />
                          </div>
                        ))}
                        {partitionValidation && !partitionValidation.isValid && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{partitionValidation.message}</p>
                          </div>
                        )}
                        {partitionValidation && partitionValidation.isValid && partitionInputs.rows.every(row => row.height) && (
                          <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-600">✓ Validation passed</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Arrangements Section */}
                  {partitionInputs.type && 
                   ((partitionInputs.type === "VERTICAL" && partitionInputs.columns && partitionInputs.columns.every(col => col.width)) ||
                    (partitionInputs.type === "HORIZONTAL" && partitionInputs.rows && partitionInputs.rows.every(row => row.height))) && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Arrangements</h3>
                      {partitionInputs.type === "VERTICAL" && partitionInputs.columns && (
                        <div className="flex flex-wrap gap-2">
                          {partitionInputs.columns.map((col, index) => (
                            <div key={index} className="flex-1 min-w-[120px]">
                              <button
                                onClick={() => setExpandedArrangement(expandedArrangement === index ? null : index)}
                                className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                                  expandedArrangement === index
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50"
                                }`}
                              >
                                <div className="text-sm font-medium">Column {index + 1}</div>
                                <div className="text-xs text-gray-600 mt-1">{col.width}mm</div>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      {partitionInputs.type === "HORIZONTAL" && partitionInputs.rows && (
                        <div className="space-y-2">
                          {partitionInputs.rows.map((row, index) => (
                            <button
                              key={index}
                              onClick={() => setExpandedArrangement(expandedArrangement === index ? null : index)}
                              className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                                expandedArrangement === index
                                  ? "border-blue-500 bg-blue-50 text-blue-700"
                                  : "border-gray-300 bg-white hover:border-blue-300 hover:bg-gray-50"
                              }`}
                            >
                              <div className="text-sm font-medium">Row {index + 1}</div>
                              <div className="text-xs text-gray-600 mt-1">{row.height}mm</div>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Expanded Arrangement Details */}
                      {expandedArrangement !== null && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                          {partitionInputs.type === "VERTICAL" && partitionInputs.columns && partitionInputs.columns[expandedArrangement] && (
                            <NestedPartitionConfig
                              parentType="VERTICAL"
                              parentIndex={expandedArrangement}
                              nested={partitionInputs.columns[expandedArrangement].nestedPartitions}
                              onUpdate={(nested) => {
                                setPartitionInputs(prev => {
                                  if (!prev.columns) return prev;
                                  const newColumns = [...prev.columns];
                                  newColumns[expandedArrangement] = {
                                    ...newColumns[expandedArrangement],
                                    nestedPartitions: nested
                                  };
                                  return { ...prev, columns: newColumns };
                                });
                              }}
                              defaultMaterial={partitionInputs.material}
                              defaultThickness={partitionInputs.thickness}
                              parentWidth={Number(partitionInputs.columns[expandedArrangement].width) || 0}
                              materialThickness={materialThickness}
                              wardrobeHeight={height}
                            />
                          )}
                          {partitionInputs.type === "HORIZONTAL" && partitionInputs.rows && partitionInputs.rows[expandedArrangement] && (
                            <NestedPartitionConfig
                              parentType="HORIZONTAL"
                              parentIndex={expandedArrangement}
                              nested={partitionInputs.rows[expandedArrangement].nestedPartitions}
                              onUpdate={(nested) => {
                                setPartitionInputs(prev => {
                                  if (!prev.rows) return prev;
                                  const newRows = [...prev.rows];
                                  newRows[expandedArrangement] = {
                                    ...newRows[expandedArrangement],
                                    nestedPartitions: nested
                                  };
                                  return { ...prev, rows: newRows };
                                });
                              }}
                              defaultMaterial={partitionInputs.material}
                              defaultThickness={partitionInputs.thickness}
                              parentHeight={Number(partitionInputs.rows[expandedArrangement].height) || 0}
                              materialThickness={materialThickness}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Preview - Fixed Position */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-hidden">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
              <div className="flex items-center gap-3">
                {/* 2D/3D Toggle */}
                <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewMode("2D")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      previewMode === "2D"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    2D
                  </button>
                  <button
                    onClick={() => setPreviewMode("3D")}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                      previewMode === "3D"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    3D
                  </button>
                </div>
                {/* 3D View Controls (only show in 3D mode) */}
                {previewMode === "3D" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setView("front")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        view === "front"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Front
                    </button>
                    <button
                      onClick={() => setView("side")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        view === "side"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Side
                    </button>
                    <button
                      onClick={() => setView("top")}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                        view === "top"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Top
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 rounded-lg relative overflow-hidden" style={{ minHeight: '500px', height: '100%' }}>
              {hasInputs ? (
                previewMode === "2D" ? (
                  <div ref={wardrobe2DRef}>
                    <Wardrobe2D
                      width={width}
                      height={height}
                      depth={depth}
                      numberOfShelves={0}
                      materialThickness={materialThickness}
                      backPanelThickness={backPanelThickness}
                      partitionType={partitionInputs.type as "VERTICAL" | "HORIZONTAL" | ""}
                      partitionThickness={partitionThickness}
                      columnWidths={partitionInputs.columns?.map(col => col.width) || []}
                      rowHeights={partitionInputs.rows?.map(row => row.height) || []}
                      columns={partitionInputs.columns}
                      rows={partitionInputs.rows}
                    />
                  </div>
                ) : (
                  <Wardrobe3D
                    width={width}
                    height={height}
                    depth={depth}
                    numberOfShelves={0}
                    numberOfShutters={0}
                    view={view}
                    materialThickness={materialThickness}
                    backPanelThickness={backPanelThickness}
                    partitionType={partitionInputs.type as "VERTICAL" | "HORIZONTAL" | ""}
                    partitionThickness={partitionThickness}
                    columnWidths={partitionInputs.columns?.map(col => col.width) || []}
                    rowHeights={partitionInputs.rows?.map(row => row.height) || []}
                    columns={partitionInputs.columns}
                    rows={partitionInputs.rows}
                  />
                )
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">Enter dimensions to see preview</p>
                </div>
              )}
            </div>
            
            {/* Dimensions Display */}
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <span className="text-gray-600 block text-xs">Height</span>
                  <span className="font-bold text-gray-900">{boxInputs.height || 0}mm</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600 block text-xs">Width</span>
                  <span className="font-bold text-gray-900">{boxInputs.width || 0}mm</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600 block text-xs">Depth</span>
                  <span className="font-bold text-gray-900">{boxInputs.depth || 0}mm</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cutting List Modal */}
      {showCuttingListModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCuttingListModal(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-2xl">
              <h2 className="text-2xl font-semibold text-gray-900">Cutting List</h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  title="Download PDF"
                >
                  <Download className="h-4 w-4" />
                  Download PDF
                </button>
                <button
                  onClick={() => setShowCuttingListModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1 rounded-b-2xl">
              {cuttingList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No cutting list available</p>
                  <p className="text-sm">Please fill in Height, Width, and Depth to generate cutting list</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Box Summary</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-900">Height:</span>
                        <span className="ml-2 font-semibold text-gray-900">{height}mm</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Width:</span>
                        <span className="ml-2 font-semibold text-gray-900">{width}mm</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Depth:</span>
                        <span className="ml-2 font-semibold text-gray-900">{depth}mm</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Material:</span>
                        <span className="ml-2 font-semibold text-gray-900">{material || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Thickness:</span>
                        <span className="ml-2 font-semibold text-gray-900">{materialThickness}mm</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Back Panel Material:</span>
                        <span className="ml-2 font-semibold text-gray-900">{backPanelMaterial || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Back Panel Thickness:</span>
                        <span className="ml-2 font-semibold text-gray-900">{backPanelThickness}mm</span>
                      </div>
                    </div>
                  </div>

                  {/* Cutting List Table */}
                  <div className="overflow-x-auto mb-6">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Material</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Thickness (mm)</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Measurement</th>
                          <th className="border border-gray-300 px-4 py-3 text-left font-semibold text-gray-900">Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {cuttingList.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="border border-gray-300 px-4 py-3 text-gray-900 font-medium">{item.material}</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.thickness}</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-700 font-medium">{item.measurement}</td>
                            <td className="border border-gray-300 px-4 py-3 text-gray-700">{item.quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Sheet Arrangement Section */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Sheet Arrangement</h3>
                      <button
                        onClick={() => setShowSheetArrangement(!showSheetArrangement)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                      >
                        {showSheetArrangement ? "Hide Arrangement" : "Arrange on Sheets"}
                      </button>
                    </div>
                    
                    {!showSheetArrangement ? (
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sheet Length (mm)
                            </label>
                            <input
                              type="number"
                              value={sheetLength}
                              onChange={(e) => setSheetLength(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                              placeholder="e.g., 2440"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Sheet Breadth (mm)
                            </label>
                            <input
                              type="number"
                              value={sheetBreadth}
                              onChange={(e) => setSheetBreadth(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                              placeholder="e.g., 1220"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Cutting Width (mm)
                            </label>
                            <input
                              type="number"
                              value={cuttingWidth}
                              onChange={(e) => setCuttingWidth(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                              placeholder="e.g., 3"
                            />
                          </div>
                        </div>
                        <p className="text-sm text-gray-600">
                          Enter sheet dimensions and cutting width, then click "Arrange on Sheets" to see the optimal arrangement.
                        </p>
                      </div>
                    ) : (
                      sheetLength && sheetBreadth && cuttingWidth ? (
                        <SheetArrangement
                          pieces={getPiecesForArrangement()}
                          sheetWidth={Number(sheetBreadth)}
                          sheetHeight={Number(sheetLength)}
                          cuttingWidth={Number(cuttingWidth)}
                        />
                      ) : (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <p className="text-yellow-800 text-sm">
                            Please enter sheet length, breadth, and cutting width to see the arrangement.
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

