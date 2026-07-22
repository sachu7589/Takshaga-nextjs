"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardList,
  Package,
  Plus,
  Trash2,
  Eye,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  createDefaultAdditionalWorks,
  createDefaultMaterialsUsed,
  type AdditionalWorkItem,
  type MaterialUsedItem,
} from "@/app/lib/fullProjectExtras";

export default function FullProjectAdditionalPage() {
  const router = useRouter();
  const params = useParams();
  const estimateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [additionalWorks, setAdditionalWorks] = useState<AdditionalWorkItem[]>([]);
  const [materialsUsed, setMaterialsUsed] = useState<MaterialUsedItem[]>([]);
  const [newWork, setNewWork] = useState("");
  const [newMaterial, setNewMaterial] = useState({ material: "", details: "" });

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!estimateId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/general-estimates?estimateId=${estimateId}`);
        if (!response.ok) throw new Error("Failed to fetch estimate");
        const data = await response.json();
        const estimate = data.estimate;
        if (!estimate) throw new Error("Estimate not found");

        setClientId(estimate.clientId);
        setAdditionalWorks(
          estimate.additionalWorks?.length > 0
            ? estimate.additionalWorks
            : createDefaultAdditionalWorks()
        );
        setMaterialsUsed(
          estimate.materialsUsed?.length > 0
            ? estimate.materialsUsed
            : createDefaultMaterialsUsed()
        );

        if (estimate.clientId) {
          const clientRes = await fetch(`/api/clients/${estimate.clientId}`);
          if (clientRes.ok) {
            const clientData = await clientRes.json();
            setClientName(clientData.client?.name || "");
          }
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load estimate",
          position: "top-end",
          toast: true,
          showConfirmButton: false,
          timer: 3000,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [estimateId]);

  const updateWork = (id: string, text: string) => {
    setAdditionalWorks((prev) =>
      prev.map((item) => (item.id === id ? { ...item, text } : item))
    );
  };

  const removeWork = (id: string) => {
    setAdditionalWorks((prev) => prev.filter((item) => item.id !== id));
  };

  const addWork = () => {
    const text = newWork.trim();
    if (!text) return;
    setAdditionalWorks((prev) => [
      ...prev,
      { id: `aw-custom-${Date.now()}`, text, isCustom: true },
    ]);
    setNewWork("");
  };

  const updateMaterial = (
    id: string,
    patch: Partial<Pick<MaterialUsedItem, "material" | "details">>
  ) => {
    setMaterialsUsed((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  };

  const removeMaterial = (id: string) => {
    setMaterialsUsed((prev) => prev.filter((item) => item.id !== id));
  };

  const addMaterial = () => {
    if (!newMaterial.material.trim() || !newMaterial.details.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Fill both columns",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }
    setMaterialsUsed((prev) => [
      ...prev,
      {
        id: `mu-custom-${Date.now()}`,
        material: newMaterial.material.trim(),
        details: newMaterial.details.trim(),
        isCustom: true,
      },
    ]);
    setNewMaterial({ material: "", details: "" });
  };

  const handleSaveAndNext = async () => {
    if (additionalWorks.some((w) => !w.text.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Fill all additional work items",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }
    if (materialsUsed.some((m) => !m.material.trim() || !m.details.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Fill all material rows",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        additionalWorks: additionalWorks.map((w) => ({
          id: w.id,
          text: w.text.trim(),
          isCustom: !!w.isCustom,
        })),
        materialsUsed: materialsUsed.map((m) => ({
          id: m.id,
          material: m.material.trim(),
          details: m.details.trim(),
          isCustom: !!m.isCustom,
        })),
        status: "completed" as const,
      };

      const response = await fetch(`/api/general-estimates/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");
      if (!data.estimate?.additionalWorks && !data.estimate?.materialsUsed) {
        throw new Error("Saved response missing additional details");
      }

      await Swal.fire({
        icon: "success",
        title: "Saved to database",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 1200,
      });

      router.push(`/dashboard/estimates/full-project/${estimateId}/preview`);
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
    router.push(`/dashboard/estimates/full-project/${estimateId}/work-details`);
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
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Additional Details</h1>
            <p className="text-sm text-gray-500">
              {clientName ? `${clientName} · Additional work & materials` : "Additional work & materials"}
            </p>
          </div>
        </div>

        {/* Additional work */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900 underline underline-offset-4">
              Additional work
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {additionalWorks.map((item, index) => (
              <div key={item.id} className="flex items-center gap-3 px-5 py-3">
                <span className="text-gray-400 text-sm shrink-0 w-5">{index + 1}.</span>
                <span className="text-emerald-600 shrink-0">•</span>
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => updateWork(item.id, e.target.value)}
                  className={inputClass}
                  placeholder="Additional work item"
                />
                <button
                  onClick={() => removeWork(item.id)}
                  className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer shrink-0"
                  title="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100 flex gap-2 bg-gray-50/80">
            <input
              type="text"
              value={newWork}
              onChange={(e) => setNewWork(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addWork()}
              className={inputClass}
              placeholder="Add custom additional work..."
            />
            <button
              onClick={addWork}
              className="flex items-center gap-1 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium cursor-pointer shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        {/* Materials used - 2 column */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-gray-900 underline underline-offset-4">
              Materials used
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <th className="text-left px-4 py-2 border-b border-gray-200 w-[40%]">Material</th>
                  <th className="text-left px-4 py-2 border-b border-gray-200">Details / Brand</th>
                  <th className="w-12 border-b border-gray-200" />
                </tr>
              </thead>
              <tbody>
                {materialsUsed.map((item) => (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="px-3 py-2 align-top border-r border-gray-100">
                      <input
                        type="text"
                        value={item.material}
                        onChange={(e) =>
                          updateMaterial(item.id, { material: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Material"
                      />
                    </td>
                    <td className="px-3 py-2 align-top">
                      <input
                        type="text"
                        value={item.details}
                        onChange={(e) =>
                          updateMaterial(item.id, { details: e.target.value })
                        }
                        className={inputClass}
                        placeholder="Brand / details"
                      />
                    </td>
                    <td className="px-2 py-2 align-top">
                      <button
                        onClick={() => removeMaterial(item.id)}
                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-2 bg-gray-50/80">
            <input
              type="text"
              value={newMaterial.material}
              onChange={(e) =>
                setNewMaterial((prev) => ({ ...prev, material: e.target.value }))
              }
              className={inputClass}
              placeholder="Material"
            />
            <input
              type="text"
              value={newMaterial.details}
              onChange={(e) =>
                setNewMaterial((prev) => ({ ...prev, details: e.target.value }))
              }
              onKeyDown={(e) => e.key === "Enter" && addMaterial()}
              className={inputClass}
              placeholder="Brand / details"
            />
            <button
              onClick={addMaterial}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-sm font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
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
            <Eye className="h-4 w-4" />
            <span>{saving ? "Saving..." : "Save and Preview"}</span>
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
