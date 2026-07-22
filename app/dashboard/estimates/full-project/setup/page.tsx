"use client";

import { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Plus,
  Trash2,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";
import { type ProjectCostItem } from "@/app/lib/fullProjectPricing";

type CostType = "per_sqft" | "fixed";

interface CostRow {
  id: string;
  name: string;
  type: CostType;
  rate: string;
  fixedAmount: string;
  itemSqFeet: string;
  isCore?: "construction" | "interior";
}

const DEFAULT_ROWS: CostRow[] = [
  {
    id: "construction",
    name: "Construction Cost",
    type: "per_sqft",
    rate: "",
    fixedAmount: "",
    itemSqFeet: "",
    isCore: "construction",
  },
  {
    id: "interior",
    name: "Interior Cost",
    type: "per_sqft",
    rate: "",
    fixedAmount: "",
    itemSqFeet: "",
    isCore: "interior",
  },
];

function rowsFromEstimate(estimate: {
  constructionCostPerSqFt?: number;
  interiorCostType?: CostType;
  interiorCostPerSqFt?: number;
  interiorFixedCost?: number;
  projectCustomItems?: ProjectCostItem[];
  projectCostRows?: Array<{
    id: string;
    name: string;
    type: CostType;
    rate?: number;
    fixedAmount?: number;
    itemSqFeet?: number;
    isCore?: "construction" | "interior";
  }>;
}): CostRow[] {
  if (estimate.projectCostRows && estimate.projectCostRows.length > 0) {
    return estimate.projectCostRows.map((r) => ({
      id: r.id,
      name: r.name || "",
      type: r.type || "fixed",
      rate: r.rate ? String(r.rate) : "",
      fixedAmount: r.fixedAmount ? String(r.fixedAmount) : "",
      itemSqFeet: r.itemSqFeet ? String(r.itemSqFeet) : "",
      isCore: r.isCore,
    }));
  }

  // Fallback for older estimates without projectCostRows
  const loaded: CostRow[] = [];
  const constructionRate = estimate.constructionCostPerSqFt || 0;
  if (constructionRate > 0) {
    loaded.push({
      id: "construction",
      name: "Construction Cost",
      type: "per_sqft",
      rate: String(constructionRate),
      fixedAmount: "",
      itemSqFeet: "",
      isCore: "construction",
    });
  }

  const interiorType = estimate.interiorCostType || "per_sqft";
  const interiorPer = estimate.interiorCostPerSqFt || 0;
  const interiorFixed = estimate.interiorFixedCost || 0;
  if (interiorPer > 0 || interiorFixed > 0) {
    loaded.push({
      id: "interior",
      name: "Interior Cost",
      type: interiorType,
      rate: interiorType === "per_sqft" && interiorPer ? String(interiorPer) : "",
      fixedAmount: interiorType === "fixed" && interiorFixed ? String(interiorFixed) : "",
      itemSqFeet: "",
      isCore: "interior",
    });
  }

  for (const item of estimate.projectCustomItems || []) {
    // Skip construction fixed items that were already folded (id construction)
    if (item.id === "construction" && loaded.some((r) => r.isCore === "construction")) continue;
    loaded.push({
      id: item.id,
      name: item.name,
      type: item.type,
      rate: item.rate ? String(item.rate) : "",
      fixedAmount: item.fixedAmount ? String(item.fixedAmount) : "",
      itemSqFeet: item.sqFeet ? String(item.sqFeet) : "",
      isCore: item.id === "construction" ? "construction" : item.id === "interior" ? "interior" : undefined,
    });
  }

  return loaded.length > 0 ? loaded : DEFAULT_ROWS;
}

export default function FullProjectSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const clientName = searchParams.get("clientName");
  const estimateIdParam = searchParams.get("estimateId");

  const [estimateId, setEstimateId] = useState<string | null>(estimateIdParam);
  const [loading, setLoading] = useState(!!estimateIdParam);
  const [sqFeet, setSqFeet] = useState("");
  const [rows, setRows] = useState<CostRow[]>(DEFAULT_ROWS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!estimateIdParam) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/general-estimates?estimateId=${estimateIdParam}`);
        if (!response.ok) throw new Error("Failed to load estimate");
        const data = await response.json();
        const estimate = data.estimate;
        if (!estimate) throw new Error("Estimate not found");

        setEstimateId(estimate._id);
        setSqFeet(estimate.sqFeet ? String(estimate.sqFeet) : "");
        setRows(rowsFromEstimate(estimate));
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Failed to load saved estimate",
          position: "top-end",
          toast: true,
          showConfirmButton: false,
          timer: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [estimateIdParam]);

  const parsedSqFeet = parseFloat(sqFeet) || 0;

  const getRowTotal = (row: CostRow) => {
    if (row.type === "fixed") return parseFloat(row.fixedAmount) || 0;
    const rate = parseFloat(row.rate) || 0;
    const rowSq =
      row.itemSqFeet.trim() !== ""
        ? parseFloat(row.itemSqFeet) || 0
        : parsedSqFeet;
    return rate * rowSq;
  };

  const projectTotal = useMemo(() => {
    return rows.reduce((sum, row) => sum + getRowTotal(row), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, parsedSqFeet]);

  const updateRow = (id: string, patch: Partial<CostRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const handleAddRow = () => {
    setRows((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        name: "",
        type: "fixed",
        rate: "",
        fixedAmount: "",
        itemSqFeet: "",
      },
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) {
      Swal.fire({
        icon: "warning",
        title: "At least one item required",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleSaveAndNext = async () => {
    if (!parsedSqFeet || parsedSqFeet <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Square Feet Required",
        text: "Please enter a valid square feet value.",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    if (!clientId) {
      Swal.fire({
        icon: "error",
        title: "Client ID missing",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    const construction = rows.find((r) => r.isCore === "construction");
    const interior = rows.find((r) => r.isCore === "interior");
    const customRows = rows.filter((r) => !r.isCore);

    for (const row of rows) {
      if (!row.name.trim()) {
        Swal.fire({
          icon: "warning",
          title: "Item name required",
          text: "Fill name for every item row.",
          position: "top-end",
          toast: true,
          showConfirmButton: false,
          timer: 2500,
        });
        return;
      }
    }

    const constructionCostPerSqFt =
      construction?.type === "per_sqft" ? parseFloat(construction.rate) || 0 : 0;
    const interiorCostType: CostType = interior?.type || "per_sqft";
    const interiorCostPerSqFt =
      interior?.type === "per_sqft" ? parseFloat(interior.rate || "") || 0 : 0;
    const interiorFixedCost =
      interior?.type === "fixed" ? parseFloat(interior.fixedAmount || "") || 0 : 0;

    const toCustomItem = (row: CostRow): ProjectCostItem => {
      if (row.type === "fixed") {
        const fixedAmount = parseFloat(row.fixedAmount) || 0;
        return {
          id: row.id,
          name: row.name.trim(),
          type: "fixed",
          fixedAmount,
          totalAmount: fixedAmount,
        };
      }
      const rate = parseFloat(row.rate) || 0;
      const itemSqFeet =
        row.itemSqFeet.trim() !== ""
          ? parseFloat(row.itemSqFeet) || 0
          : parsedSqFeet;
      return {
        id: row.id,
        name: row.name.trim(),
        type: "per_sqft",
        rate,
        sqFeet: itemSqFeet,
        totalAmount: rate * itemSqFeet,
      };
    };

    const customItems: ProjectCostItem[] = [
      ...customRows.map(toCustomItem),
      ...(construction?.type === "fixed" ? [toCustomItem(construction)] : []),
    ];

    const projectCostRows = rows.map((r) => ({
      id: r.id,
      name: r.name.trim(),
      type: r.type,
      rate: parseFloat(r.rate) || 0,
      fixedAmount: parseFloat(r.fixedAmount) || 0,
      itemSqFeet: r.itemSqFeet.trim() !== "" ? parseFloat(r.itemSqFeet) || 0 : undefined,
      isCore: r.isCore,
    }));

    const payload = {
      clientId,
      estimateName: "Full Project Estimate",
      estimateType: "full-project",
      sqFeet: parsedSqFeet,
      constructionCostPerSqFt,
      interiorCostType,
      interiorCostPerSqFt,
      interiorFixedCost,
      projectCustomItems: customItems,
      projectCostRows,
      items: [],
      totalAmount: projectTotal,
      subtotal: projectTotal,
      discount: 0,
      discountType: "percentage",
    };

    setSaving(true);
    try {
      let savedId = estimateId;

      if (estimateId) {
        const response = await fetch(`/api/general-estimates/${estimateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to update");
        savedId = data.estimate._id;
      } else {
        const response = await fetch("/api/general-estimates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, paymentStages: [] }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to save");
        savedId = data.estimate._id;
        setEstimateId(savedId);
      }

      router.push(
        `/dashboard/estimates/full-project?clientId=${clientId}&clientName=${encodeURIComponent(clientName || "")}&estimateId=${savedId}`
      );
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error instanceof Error ? error.message : "Failed to save",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 3000,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push(`/dashboard/estimates?clientId=${clientId}&clientName=${clientName}`);
  };

  const inputClass =
    "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2.5 bg-emerald-100 rounded-lg">
              <Building2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Full Project Estimate</h1>
              <p className="text-sm text-gray-500">
                {clientName ? `Project pricing for ${clientName}` : "Enter project costs"}
                {estimateId ? " · Editing saved estimate" : ""}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100">
            <span className="w-40 shrink-0 text-sm font-semibold text-gray-700">Square Feet</span>
            <input
              type="number"
              value={sqFeet}
              onChange={(e) => setSqFeet(e.target.value)}
              className={`${inputClass} max-w-[200px]`}
              placeholder="Enter sq feet"
              min="0"
              step="0.01"
            />
            <span className="text-sm text-gray-400">sq ft</span>
          </div>

          <div className="hidden sm:grid grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1fr)_minmax(0,0.8fr)_100px_40px] gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            <span>Item Name</span>
            <span>Type</span>
            <span>Rate / Amount</span>
            <span>Sq Feet</span>
            <span className="text-right">Total</span>
            <span />
          </div>

          <div className="divide-y divide-gray-100">
            {rows.map((row) => {
              const total = getRowTotal(row);
              return (
                <div
                  key={row.id}
                  className="grid grid-cols-1 sm:grid-cols-[minmax(0,1.4fr)_110px_minmax(0,1fr)_minmax(0,0.8fr)_100px_40px] gap-2 px-4 py-3 items-center"
                >
                  <input
                    type="text"
                    value={row.name}
                    onChange={(e) => updateRow(row.id, { name: e.target.value })}
                    className={inputClass}
                    placeholder="Item name"
                  />

                  <select
                    value={row.type}
                    onChange={(e) => updateRow(row.id, { type: e.target.value as CostType })}
                    className={inputClass}
                  >
                    <option value="per_sqft">Per sq ft</option>
                    <option value="fixed">Fixed</option>
                  </select>

                  {row.type === "per_sqft" ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        value={row.rate}
                        onChange={(e) => updateRow(row.id, { rate: e.target.value })}
                        className={`${inputClass} pl-7`}
                        placeholder="Per sq ft"
                        min="0"
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                      <input
                        type="number"
                        value={row.fixedAmount}
                        onChange={(e) => updateRow(row.id, { fixedAmount: e.target.value })}
                        className={`${inputClass} pl-7`}
                        placeholder="Amount"
                        min="0"
                      />
                    </div>
                  )}

                  {row.type === "per_sqft" ? (
                    <input
                      type="number"
                      value={row.itemSqFeet}
                      onChange={(e) => updateRow(row.id, { itemSqFeet: e.target.value })}
                      className={inputClass}
                      placeholder={parsedSqFeet ? String(parsedSqFeet) : "Sq ft"}
                      min="0"
                      step="0.01"
                      title="Leave empty to use total sq feet"
                    />
                  ) : (
                    <span className="text-sm text-gray-300 px-2">—</span>
                  )}

                  <span className="text-sm font-semibold text-emerald-700 text-right">
                    ₹{total.toLocaleString("en-IN")}
                  </span>

                  <button
                    onClick={() => handleRemoveRow(row.id)}
                    disabled={rows.length <= 1}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer justify-self-end disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-gray-300 disabled:hover:bg-transparent"
                    title={rows.length <= 1 ? "At least one item is required" : "Remove"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/80">
            <button
              onClick={handleAddRow}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 rounded-lg cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Item
            </button>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600">Total Amount</span>
              <span className="text-lg font-bold text-emerald-700">
                ₹{projectTotal.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            onClick={handleBack}
            className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white text-sm font-medium cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleSaveAndNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm font-semibold cursor-pointer"
          >
            <span>{saving ? "Saving..." : "Save and Next"}</span>
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
