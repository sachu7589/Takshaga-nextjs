"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Plus,
  Trash2,
  Ruler,
  IndianRupee,
  Layers,
  GripVertical,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from "sweetalert2";

interface PaymentStage {
  id: string;
  stage: string;
  amount: number;
  isCustom?: boolean;
}

const PAYMENT_STAGE_LABELS = [
  "Work starting",
  "Project management consultation fee",
  "Before cellar floor brick work",
  "Before cellar floor concrete work",
  "Before first floor brick work",
  "Before first floor concrete work",
  "Before Plastering",
  "Before Electrical and Plumbing work",
  "Before tile work",
  "Before interior work",
  "Final Painting",
];

export default function FullProjectEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get("clientId");
  const clientName = searchParams.get("clientName");
  const estimateId = searchParams.get("estimateId");

  const [loading, setLoading] = useState(true);
  const [sqFeet, setSqFeet] = useState(0);
  const [projectTotal, setProjectTotal] = useState(0);
  const [paymentStages, setPaymentStages] = useState<PaymentStage[]>([]);
  const [customStage, setCustomStage] = useState({ description: "", amount: "" });
  const [saving, setSaving] = useState(false);
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemIndex = useRef<number | null>(null);

  useEffect(() => {
    if (!estimateId) {
      router.replace(
        `/dashboard/estimates/full-project/setup?clientId=${clientId}&clientName=${encodeURIComponent(clientName || "")}`
      );
      return;
    }

    const fetchEstimate = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/general-estimates?estimateId=${estimateId}`);
        if (!response.ok) throw new Error("Failed to load estimate");
        const data = await response.json();
        const estimate = data.estimate;

        if (!estimate) throw new Error("Estimate not found");

        setSqFeet(estimate.sqFeet || 0);
        setProjectTotal(estimate.totalAmount || 0);

        if (estimate.paymentStages?.length > 0) {
          setPaymentStages(
            estimate.paymentStages.map((s: { stage: string; amount: number }, i: number) => ({
              id: `stage-${i}`,
              stage: s.stage,
              amount: s.amount,
            }))
          );
        } else {
          setPaymentStages(
            PAYMENT_STAGE_LABELS.map((stage, i) => ({
              id: `default-${i}`,
              stage,
              amount: 0,
            }))
          );
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Failed to load estimate",
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
  }, [estimateId, clientId, clientName, router]);

  const paymentTotal = paymentStages.reduce((sum, stage) => sum + (stage.amount || 0), 0);
  const balanceAmount = projectTotal - paymentTotal;
  const isBalanced = Math.abs(balanceAmount) < 0.01;
  const filledStagesCount = paymentStages.filter((s) => s.amount > 0).length;

  const moveStage = (from: number, to: number) => {
    if (from === to || to < 0 || to >= paymentStages.length) return;
    setPaymentStages((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  };

  const handleDragStart = (index: number) => {
    dragItemIndex.current = index;
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    const from = dragItemIndex.current;
    if (from == null) return;
    moveStage(from, index);
    dragItemIndex.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragItemIndex.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleStageNameChange = (index: number, value: string) => {
    setPaymentStages((prev) =>
      prev.map((stage, i) => (i === index ? { ...stage, stage: value } : stage))
    );
  };

  const handleStageAmountChange = (index: number, value: string) => {
    const amount = parseFloat(value) || 0;
    setPaymentStages((prev) =>
      prev.map((stage, i) => (i === index ? { ...stage, amount } : stage))
    );
  };

  const handleAddCustomStage = () => {
    const description = customStage.description.trim();
    const amount = parseFloat(customStage.amount) || 0;

    if (!description) {
      Swal.fire({
        icon: "warning",
        title: "Description Required",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }

    if (amount <= 0) {
      Swal.fire({
        icon: "warning",
        title: "Amount Required",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }

    setPaymentStages((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, stage: description, amount, isCustom: true },
    ]);
    setCustomStage({ description: "", amount: "" });
  };

  const handleRemoveStage = (id: string) => {
    setPaymentStages((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSave = async () => {
    if (!estimateId) return;

    if (!isBalanced) {
      Swal.fire({
        icon: "warning",
        title: "Amounts must match",
        text: `Payment stages total (₹${paymentTotal.toLocaleString("en-IN")}) must equal Total Amount (₹${projectTotal.toLocaleString("en-IN")}). Balance: ₹${balanceAmount.toLocaleString("en-IN")}`,
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 4000,
      });
      return;
    }

    if (paymentStages.some((s) => !s.stage.trim())) {
      Swal.fire({
        icon: "warning",
        title: "Stage name required",
        text: "Please fill in all stage names.",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 3000,
      });
      return;
    }

    setSaving(true);
    try {
      const stagesToSave = paymentStages.map(({ stage, amount }) => ({ stage, amount }));

      const response = await fetch(`/api/general-estimates/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStages: stagesToSave }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");

      await Swal.fire({
        icon: "success",
        title: "Payment arrangement saved!",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2000,
      });

      router.push(`/dashboard/estimates/full-project/${estimateId}/work-details`);
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
    router.push(
      `/dashboard/estimates/full-project/setup?clientId=${clientId}&clientName=${encodeURIComponent(clientName || "")}&estimateId=${estimateId}`
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <button
            onClick={handleBack}
            className="p-2.5 bg-white/80 backdrop-blur border border-white/60 rounded-xl shadow-sm hover:shadow-md hover:bg-white transition-all cursor-pointer shrink-0"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="p-3 bg-emerald-100 rounded-xl shrink-0">
              <Building2 className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Payment Arrangement</h1>
              <p className="text-sm text-gray-500 truncate">
                {clientName ? `Estimate for ${clientName}` : "Arrangement of payment from client"}
              </p>
            </div>
          </div>
          <div className="shrink-0 text-right">
            <label className="flex items-center justify-end gap-1.5 text-xs font-medium text-gray-500 mb-1">
              <Ruler className="h-3.5 w-3.5 text-emerald-600" />
              Square Feet
            </label>
            <p className="text-lg font-bold text-gray-900">{sqFeet.toLocaleString("en-IN")}</p>
            <p className="text-xs text-gray-400">sq ft</p>
          </div>
        </div>

        {/* Project total from setup */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
            <div className="p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Amount</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                ₹{projectTotal.toLocaleString("en-IN")}
              </p>
            </div>
            <div className="p-5">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Stages Total</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                ₹{paymentTotal.toLocaleString("en-IN")}
              </p>
            </div>
            <div className={`p-5 ${isBalanced ? "bg-emerald-50" : "bg-amber-50"}`}>
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Balance</p>
              <p
                className={`text-xl font-bold mt-1 ${
                  isBalanced
                    ? "text-emerald-700"
                    : balanceAmount > 0
                      ? "text-amber-700"
                      : "text-red-600"
                }`}
              >
                ₹{balanceAmount.toLocaleString("en-IN")}
              </p>
              <p className="text-xs mt-1 text-gray-500">
                {isBalanced
                  ? "Matched — ready to continue"
                  : balanceAmount > 0
                    ? "Remaining to allocate"
                    : "Over allocated"}
              </p>
            </div>
          </div>
        </div>

        {/* Payment stages */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Layers className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Arrangement of Payment from Client
                </h2>
                <p className="text-sm text-gray-500">
                  {filledStagesCount} of {paymentStages.length} stages filled · Sum must equal ₹
                  {projectTotal.toLocaleString("en-IN")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRearrangeMode((v) => !v)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer shrink-0 ${
                  rearrangeMode
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100"
                }`}
              >
                <GripVertical className="h-4 w-4" />
                {rearrangeMode ? "Done" : "Rearrange"}
              </button>
            </div>
            {rearrangeMode && (
              <p className="text-xs text-emerald-700 mt-3 bg-emerald-50 rounded-lg px-3 py-2">
                Drag the grip handle to reorder, or use ↑ ↓ buttons
              </p>
            )}
          </div>

          <div className="divide-y divide-gray-100">
            {paymentStages.map((stage, index) => (
              <div
                key={stage.id}
                draggable={rearrangeMode}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 px-6 py-4 transition-colors group ${
                  stage.isCustom ? "bg-amber-50/40" : ""
                } ${
                  rearrangeMode
                    ? "hover:bg-emerald-50/50 cursor-grab active:cursor-grabbing"
                    : "hover:bg-gray-50/60"
                } ${dragIndex === index ? "opacity-50" : ""} ${
                  dragOverIndex === index && dragIndex !== index
                    ? "border-t-2 border-emerald-500"
                    : ""
                }`}
              >
                {rearrangeMode && (
                  <div className="flex items-center gap-0.5 shrink-0">
                    <span
                      className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg cursor-grab active:cursor-grabbing"
                      title="Drag to reorder"
                    >
                      <GripVertical className="h-5 w-5" />
                    </span>
                    <div className="flex flex-col">
                      <button
                        type="button"
                        onClick={() => moveStage(index, index - 1)}
                        disabled={index === 0}
                        className="p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move up"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStage(index, index + 1)}
                        disabled={index === paymentStages.length - 1}
                        className="p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title="Move down"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )}

                {!rearrangeMode && (
                  <button
                    onClick={() => handleRemoveStage(stage.id)}
                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer shrink-0"
                    title="Remove stage"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}

                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center shrink-0 transition-colors">
                  <span className="text-xs font-bold text-gray-500 group-hover:text-emerald-700">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={stage.stage}
                    onChange={(e) => handleStageNameChange(index, e.target.value)}
                    disabled={rearrangeMode}
                    className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-black text-sm placeholder:text-gray-400 disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="Stage name"
                  />
                  {stage.isCustom && (
                    <span className="inline-block mt-1 text-xs text-amber-600 font-medium">
                      Custom stage
                    </span>
                  )}
                </div>

                <div className="relative w-40 shrink-0">
                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="number"
                    value={stage.amount > 0 ? stage.amount : ""}
                    onChange={(e) => handleStageAmountChange(index, e.target.value)}
                    disabled={rearrangeMode}
                    className="w-full pl-8 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-black text-right text-sm placeholder:text-gray-400 transition-all disabled:bg-gray-50 disabled:text-gray-600"
                    placeholder="0"
                    min="0"
                    step="1"
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className={`px-6 py-4 border-t flex items-center justify-between ${
              isBalanced ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"
            }`}
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">Stages Total</p>
              {!isBalanced && (
                <p className="text-xs text-amber-700 mt-0.5">
                  Balance left: ₹{balanceAmount.toLocaleString("en-IN")}
                </p>
              )}
            </div>
            <span
              className={`text-lg font-bold ${isBalanced ? "text-emerald-700" : "text-amber-700"}`}
            >
              ₹{paymentTotal.toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* Add custom stage */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-semibold text-gray-900">Add Custom Stage</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <input
                type="text"
                value={customStage.description}
                onChange={(e) =>
                  setCustomStage((prev) => ({ ...prev, description: e.target.value }))
                }
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-black placeholder:text-gray-400 text-sm"
                placeholder="Stage description"
              />
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="number"
                  value={customStage.amount}
                  onChange={(e) =>
                    setCustomStage((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-black placeholder:text-gray-400 text-sm"
                  placeholder="Amount ₹"
                  min="0"
                />
              </div>
            </div>
            <button
              onClick={handleAddCustomStage}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 text-sm font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Stage
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-white/80 border border-gray-200 text-gray-700 rounded-xl hover:bg-white text-sm font-medium cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isBalanced}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
            title={
              !isBalanced
                ? `Balance ₹${balanceAmount.toLocaleString("en-IN")} must be 0`
                : "Save and continue"
            }
          >
            <span>{saving ? "Saving..." : "Save and Next"}</span>
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
