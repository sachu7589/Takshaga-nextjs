"use client";

import { useState } from "react";
import { ArrowLeft, X, FileText } from "lucide-react";
import dynamic from "next/dynamic";

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

export default function WardrobePage() {
  const [furnitureInputs, setFurnitureInputs] = useState({
    height: "",
    width: "",
    depth: "",
    quantity: ""
  });

  const [materialInputs, setMaterialInputs] = useState({
    materialType: "",
    thickness: "",
    sheetWidth: "",
    sheetHeight: "",
    costPerSheet: "",
    grainDirection: "",
    laminationType: ""
  });

  const [componentConfig, setComponentConfig] = useState({
    numberOfShelves: "",
    numberOfShutters: "",
    backPanelThickness: "",
    edgeBandSides: "",
    clearanceGap: ""
  });

  // 3D view state
  const [view, setView] = useState<"front" | "side" | "top">("front");
  
  // Modal state
  const [showCuttingListModal, setShowCuttingListModal] = useState(false);

  const updateFurnitureInput = (field: string, value: number | string) => {
    setFurnitureInputs(prev => ({ ...prev, [field]: value }));
  };

  const updateMaterialInput = (field: string, value: string | number) => {
    setMaterialInputs(prev => ({ ...prev, [field]: value }));
  };

  const updateComponentConfig = (field: string, value: number | string) => {
    setComponentConfig(prev => ({ ...prev, [field]: value }));
  };

  const numberOfShelves = Number(componentConfig.numberOfShelves) || 0;
  const numberOfShutters = Number(componentConfig.numberOfShutters) || 0;
  const width = Number(furnitureInputs.width) || 0;
  const height = Number(furnitureInputs.height) || 0;
  const depth = Number(furnitureInputs.depth) || 0;
  const materialThickness = Number(materialInputs.thickness) || 18;
  const backPanelThickness = Number(componentConfig.backPanelThickness) || 6;
  
  // Check if any furniture input is provided
  const hasInputs = furnitureInputs.width || furnitureInputs.height || furnitureInputs.depth;

  // Generate cutting list
  const generateCuttingList = () => {
    if (!width || !height || !depth) return [];

    const materialThick = materialThickness || 18;
    const backThick = backPanelThickness || 6;
    const qty = Number(furnitureInputs.quantity) || 1;
    const materialType = materialInputs.materialType || "Material";
    
    // Calculate dimensions
    const interiorWidth = width - (materialThick * 2);
    const interiorHeight = height - (materialThick * 2);
    const interiorDepth = depth - backThick;

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
    addPart(topBottomWidth, depth, materialThick, qty * 2, materialType);

    // Left and Right side panels (same measurement, quantity 2)
    addPart(height, depth, materialThick, qty * 2, materialType);

    // Back Panel
    addPart(interiorHeight, interiorWidth, backThick, qty, materialType);

    // Shelves
    for (let i = 0; i < numberOfShelves; i++) {
      addPart(interiorWidth, interiorDepth, materialThick, qty, materialType);
    }

    // Shutters/Doors
    const shutterWidth = width / (numberOfShutters || 1);
    for (let i = 0; i < numberOfShutters; i++) {
      addPart(height, shutterWidth, materialThick, qty, materialType);
    }

    // Convert map to array
    return Array.from(partsMap.values()).map(item => ({
      material: item.material,
      thickness: item.thickness,
      measurement: `${item.length}×${item.width} mm`,
      quantity: item.quantity
    }));
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
          {/* Furniture-Level Inputs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Furniture-Level Inputs</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Height (H) - mm
                </label>
                <input
                  type="number"
                  value={furnitureInputs.height}
                  onChange={(e) => updateFurnitureInput("height", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Width (W) - mm
                </label>
                <input
                  type="number"
                  value={furnitureInputs.width}
                  onChange={(e) => updateFurnitureInput("width", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Depth (D) - mm
                </label>
                <input
                  type="number"
                  value={furnitureInputs.depth}
                  onChange={(e) => updateFurnitureInput("depth", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (No. of same units)
                </label>
                <input
                  type="number"
                  min="1"
                  value={furnitureInputs.quantity}
                  onChange={(e) => updateFurnitureInput("quantity", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
            </div>
          </div>

          {/* Material Inputs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Material Inputs</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material Type
                </label>
                <select
                  value={materialInputs.materialType}
                  onChange={(e) => updateMaterialInput("materialType", e.target.value)}
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
                <select
                  value={materialInputs.thickness}
                  onChange={(e) => updateMaterialInput("thickness", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select Thickness</option>
                  <option value={6}>6mm</option>
                  <option value={12}>12mm</option>
                  <option value={18}>18mm</option>
                  <option value={25}>25mm</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Width - mm
                  </label>
                  <input
                    type="number"
                    value={materialInputs.sheetWidth}
                    onChange={(e) => updateMaterialInput("sheetWidth", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sheet Height - mm
                  </label>
                  <input
                    type="number"
                    value={materialInputs.sheetHeight}
                    onChange={(e) => updateMaterialInput("sheetHeight", e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    placeholder=""
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cost per sheet
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={materialInputs.costPerSheet}
                  onChange={(e) => updateMaterialInput("costPerSheet", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grain direction
                </label>
                <select
                  value={materialInputs.grainDirection}
                  onChange={(e) => updateMaterialInput("grainDirection", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select Grain Direction</option>
                  <option value="Vertical">Vertical</option>
                  <option value="Horizontal">Horizontal</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lamination type
                </label>
                <select
                  value={materialInputs.laminationType}
                  onChange={(e) => updateMaterialInput("laminationType", e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select Lamination Type</option>
                  <option value="1 side">1 side</option>
                  <option value="2 side">2 side</option>
                </select>
              </div>
            </div>
          </div>

          {/* Component Configuration Inputs */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Component Configuration Inputs</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of shelves
                </label>
                <input
                  type="number"
                  min="0"
                  value={componentConfig.numberOfShelves}
                  onChange={(e) => updateComponentConfig("numberOfShelves", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of shutters
                </label>
                <input
                  type="number"
                  min="1"
                  value={componentConfig.numberOfShutters}
                  onChange={(e) => updateComponentConfig("numberOfShutters", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Back panel thickness - mm
                </label>
                <select
                  value={componentConfig.backPanelThickness}
                  onChange={(e) => updateComponentConfig("backPanelThickness", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select Back Panel Thickness</option>
                  <option value={3}>3mm</option>
                  <option value={6}>6mm</option>
                  <option value={9}>9mm</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edge band sides
                </label>
                <select
                  value={componentConfig.edgeBandSides}
                  onChange={(e) => updateComponentConfig("edgeBandSides", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="">Select Edge Band Sides</option>
                  <option value={0}>0 sides</option>
                  <option value={1}>1 side</option>
                  <option value={2}>2 sides</option>
                  <option value={4}>4 sides</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Clearance gaps - mm
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  value={componentConfig.clearanceGap}
                  onChange={(e) => updateComponentConfig("clearanceGap", e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder=""
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3D Preview - Fixed Position */}
        <div className="lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)] lg:overflow-hidden">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">3D Preview</h2>
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
            </div>
            <div className="flex-1 bg-gradient-to-br from-gray-50 via-gray-100 to-gray-50 rounded-lg relative overflow-hidden" style={{ minHeight: '500px', height: '100%' }}>
              {hasInputs ? (
                <Wardrobe3D
                  width={width}
                  height={height}
                  depth={depth}
                  numberOfShelves={numberOfShelves}
                  numberOfShutters={numberOfShutters}
                  view={view}
                  materialThickness={materialThickness}
                  backPanelThickness={backPanelThickness}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p className="text-sm">Enter dimensions to see 3D preview</p>
                </div>
              )}
            </div>
            
            {/* Dimensions Display */}
            <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <span className="text-gray-600 block text-xs">Height</span>
                  <span className="font-bold text-gray-900">{furnitureInputs.height || 0}mm</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600 block text-xs">Width</span>
                  <span className="font-bold text-gray-900">{furnitureInputs.width || 0}mm</span>
                </div>
                <div className="text-center">
                  <span className="text-gray-600 block text-xs">Depth</span>
                  <span className="font-bold text-gray-900">{furnitureInputs.depth || 0}mm</span>
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
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-semibold text-gray-900">Cutting List</h2>
              <button
                onClick={() => setShowCuttingListModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {cuttingList.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-lg mb-2">No cutting list available</p>
                  <p className="text-sm">Please fill in Height, Width, and Depth to generate cutting list</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary Info */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h3 className="font-semibold text-gray-900 mb-3">Project Summary</h3>
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
                        <span className="text-gray-900">Quantity:</span>
                        <span className="ml-2 font-semibold text-gray-900">{furnitureInputs.quantity || 1}</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Material:</span>
                        <span className="ml-2 font-semibold text-gray-900">{materialInputs.materialType || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Thickness:</span>
                        <span className="ml-2 font-semibold text-gray-900">{materialThickness}mm</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Shelves:</span>
                        <span className="ml-2 font-semibold text-gray-900">{numberOfShelves}</span>
                      </div>
                      <div>
                        <span className="text-gray-900">Shutters:</span>
                        <span className="ml-2 font-semibold text-gray-900">{numberOfShutters}</span>
                      </div>
                    </div>
                  </div>

                  {/* Cutting List Table */}
                  <div className="overflow-x-auto">
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
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

