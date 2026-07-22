"use client";

import { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Edit2,
  GripVertical,
  Plus,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import {
  createDefaultWorkDetails,
  renumberSections,
  type WorkDetailPoint,
  type WorkDetailSection,
} from "@/app/lib/fullProjectWorkDetails";

export default function FullProjectWorkDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const estimateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [sqFeet, setSqFeet] = useState(0);
  const [sections, setSections] = useState<WorkDetailSection[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionTitle, setEditingSectionTitle] = useState("");
  const [editingPointId, setEditingPointId] = useState<string | null>(null);
  const [editingPointText, setEditingPointText] = useState("");

  const [newPointText, setNewPointText] = useState<Record<string, string>>({});
  const [customSection, setCustomSection] = useState({ title: "", point: "" });
  const [rearrangeMode, setRearrangeMode] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragItemIndex = useRef<number | null>(null);

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
        setSqFeet(estimate.sqFeet || 0);

        if (estimate.workDetails?.length > 0) {
          setSections(estimate.workDetails);
        } else {
          setSections(createDefaultWorkDetails());
        }

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

  const toggleSection = (id: string) => {
    if (rearrangeMode) return;
    setExpandedId((prev) => (prev === id ? null : id));
    setEditingSectionId(null);
    setEditingPointId(null);
  };

  const moveSection = (from: number, to: number) => {
    if (from === to || to < 0 || to >= sections.length) return;
    setSections((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return renumberSections(next);
    });
  };

  const handleDragStart = (index: number, e: React.DragEvent) => {
    e.stopPropagation();
    dragItemIndex.current = index;
    setDragIndex(index);
    setExpandedId(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragOverIndex !== index) setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    const from = dragItemIndex.current;
    if (from == null) return;
    moveSection(from, index);
    dragItemIndex.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    dragItemIndex.current = null;
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const startEditSection = (section: WorkDetailSection, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSectionId(section.id);
    setEditingSectionTitle(section.title);
    setExpandedId(section.id);
  };

  const saveEditSection = (sectionId: string) => {
    const title = editingSectionTitle.trim();
    if (!title) return;
    setSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, title } : s))
    );
    setEditingSectionId(null);
    setEditingSectionTitle("");
  };

  const removeSection = (sectionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSections((prev) => renumberSections(prev.filter((s) => s.id !== sectionId)));
    if (expandedId === sectionId) setExpandedId(null);
  };

  const startEditPoint = (point: WorkDetailPoint) => {
    setEditingPointId(point.id);
    setEditingPointText(point.text);
  };

  const saveEditPoint = (sectionId: string, pointId: string) => {
    const text = editingPointText.trim();
    if (!text) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              points: s.points.map((p) => (p.id === pointId ? { ...p, text } : p)),
            }
          : s
      )
    );
    setEditingPointId(null);
    setEditingPointText("");
  };

  const removePoint = (sectionId: string, pointId: string) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? { ...s, points: s.points.filter((p) => p.id !== pointId) }
          : s
      )
    );
  };

  const addPoint = (sectionId: string) => {
    const text = (newPointText[sectionId] || "").trim();
    if (!text) return;
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              points: [
                ...s.points,
                { id: `custom-p-${Date.now()}`, text, isCustom: true },
              ],
            }
          : s
      )
    );
    setNewPointText((prev) => ({ ...prev, [sectionId]: "" }));
  };

  const addCustomSection = () => {
    const title = customSection.title.trim();
    if (!title) {
      Swal.fire({
        icon: "warning",
        title: "Section title required",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2500,
      });
      return;
    }

    const newSection: WorkDetailSection = {
      id: `custom-s-${Date.now()}`,
      number: sections.length + 1,
      title,
      isCustom: true,
      points: customSection.point.trim()
        ? [{ id: `custom-p-${Date.now()}`, text: customSection.point.trim(), isCustom: true }]
        : [],
    };

    setSections((prev) => renumberSections([...prev, newSection]));
    setExpandedId(newSection.id);
    setCustomSection({ title: "", point: "" });
  };

  const handleSaveAndNext = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/general-estimates/${estimateId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workDetails: sections }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to save");

      await Swal.fire({
        icon: "success",
        title: "Work details saved!",
        position: "top-end",
        toast: true,
        showConfirmButton: false,
        timer: 2000,
      });

      router.push(`/dashboard/estimates/full-project/${estimateId}/additional`);
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
      `/dashboard/estimates/full-project?clientId=${clientId}&clientName=${encodeURIComponent(clientName)}&estimateId=${estimateId}`
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
              <ClipboardList className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-gray-900">Work Details</h1>
              <p className="text-sm text-gray-500 truncate">
                {clientName ? `${clientName} · ${sqFeet} sq ft` : "Configure work specifications"}
              </p>
            </div>
          </div>
        </div>

        {/* Sections accordion */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
          <div className="px-6 py-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-gray-900">Work Details Sections</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {rearrangeMode
                    ? "Drag sections or use ↑ ↓ to reorder"
                    : "Click a section to view and edit its points"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setRearrangeMode((v) => !v);
                  setExpandedId(null);
                  setEditingSectionId(null);
                  setEditingPointId(null);
                }}
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
            {sections.map((section, index) => {
              const isExpanded = !rearrangeMode && expandedId === section.id;
              const isEditingSection = editingSectionId === section.id;

              return (
                <div
                  key={section.id}
                  draggable={rearrangeMode}
                  onDragStart={(e) => handleDragStart(index, e)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`${dragIndex === index ? "opacity-50" : ""} ${
                    dragOverIndex === index && dragIndex !== index
                      ? "border-t-2 border-emerald-500"
                      : ""
                  }`}
                >
                  {/* Section header */}
                  <div
                    onClick={() => toggleSection(section.id)}
                    className={`flex items-center gap-3 px-5 py-4 transition-colors ${
                      rearrangeMode
                        ? "cursor-grab active:cursor-grabbing hover:bg-emerald-50/50"
                        : isExpanded
                          ? "bg-emerald-50/60 cursor-pointer"
                          : "hover:bg-gray-50/60 cursor-pointer"
                    }`}
                  >
                    {rearrangeMode && (
                      <div
                        className="flex items-center gap-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span
                          className="p-1.5 text-gray-400 hover:text-emerald-600 rounded-lg cursor-grab active:cursor-grabbing"
                          title="Drag to reorder"
                        >
                          <GripVertical className="h-5 w-5" />
                        </span>
                        <div className="flex flex-col">
                          <button
                            type="button"
                            onClick={() => moveSection(index, index - 1)}
                            disabled={index === 0}
                            className="p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move up"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(index, index + 1)}
                            disabled={index === sections.length - 1}
                            className="p-0.5 text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                            title="Move down"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-emerald-700">{section.number}</span>
                    </div>

                    {isEditingSection ? (
                      <div
                        className="flex-1 flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          value={editingSectionTitle}
                          onChange={(e) => setEditingSectionTitle(e.target.value)}
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-emerald-500"
                          autoFocus
                        />
                        <button
                          onClick={() => saveEditSection(section.id)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg cursor-pointer"
                        >
                          <Save className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setEditingSectionId(null)}
                          className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <p className="flex-1 text-sm font-semibold text-gray-800 leading-snug">
                        {section.title}
                        {section.isCustom && (
                          <span className="ml-2 text-xs text-amber-600 font-medium">Custom</span>
                        )}
                      </p>
                    )}

                    {!rearrangeMode && (
                      <div className="flex items-center gap-1 shrink-0">
                        {!isEditingSection && (
                          <button
                            onClick={(e) => startEditSection(section, e)}
                            className="p-2 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all cursor-pointer"
                            title="Edit section"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => removeSection(section.id, e)}
                          className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Remove section"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    )}
                  </div>

                  {/* Points panel */}
                  {isExpanded && (
                    <div className="px-5 pb-5 bg-emerald-50/30 border-t border-emerald-100/60">
                      <div className="pt-4 space-y-2">
                        {section.points.length === 0 && (
                          <p className="text-sm text-gray-400 italic px-2">No points yet</p>
                        )}
                        {section.points.map((pt) => (
                          <div
                            key={pt.id}
                            className="flex items-start gap-2 bg-white rounded-xl border border-gray-100 px-4 py-3 group"
                          >
                            <span className="text-emerald-500 mt-0.5 shrink-0">•</span>
                            {editingPointId === pt.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  value={editingPointText}
                                  onChange={(e) => setEditingPointText(e.target.value)}
                                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-black focus:ring-2 focus:ring-emerald-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveEditPoint(section.id, pt.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg cursor-pointer"
                                >
                                  <Save className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => setEditingPointId(null)}
                                  className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg cursor-pointer"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <p className="flex-1 text-sm text-gray-700 leading-relaxed">{pt.text}</p>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                  <button
                                    onClick={() => startEditPoint(pt)}
                                    className="p-1.5 text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                                    title="Edit point"
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removePoint(section.id, pt.id)}
                                    className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg cursor-pointer"
                                    title="Remove point"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        ))}

                        {/* Add point */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={newPointText[section.id] || ""}
                            onChange={(e) =>
                              setNewPointText((prev) => ({
                                ...prev,
                                [section.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && addPoint(section.id)}
                            className="flex-1 px-4 py-2.5 bg-white border border-dashed border-gray-300 rounded-xl text-sm text-black placeholder:text-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                            placeholder="Add custom point..."
                          />
                          <button
                            onClick={() => addPoint(section.id)}
                            className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all cursor-pointer shrink-0"
                            title="Add point"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add custom section */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-amber-400 to-orange-400" />
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-amber-600" />
              <h3 className="text-base font-semibold text-gray-900">Add Custom Section</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  Section Title
                </label>
                <input
                  type="text"
                  value={customSection.title}
                  onChange={(e) =>
                    setCustomSection((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-black placeholder:text-gray-400 text-sm"
                  placeholder="e.g. Landscaping work"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">
                  First Point (optional)
                </label>
                <input
                  type="text"
                  value={customSection.point}
                  onChange={(e) =>
                    setCustomSection((prev) => ({ ...prev, point: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && addCustomSection()}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-400 focus:border-transparent text-black placeholder:text-gray-400 text-sm"
                  placeholder="Optional first point"
                />
              </div>
            </div>
            <button
              onClick={addCustomSection}
              className="flex items-center gap-2 px-5 py-2.5 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl hover:bg-amber-100 transition-all text-sm font-medium cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 pb-8">
          <button
            onClick={handleBack}
            className="px-5 py-2.5 bg-white/80 backdrop-blur border border-gray-200 text-gray-700 rounded-xl hover:bg-white hover:shadow-md transition-all text-sm font-medium cursor-pointer"
          >
            Back
          </button>
          <button
            onClick={handleSaveAndNext}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm font-semibold cursor-pointer"
          >
            <span>{saving ? "Saving..." : "Save and Next"}</span>
            {!saving && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
