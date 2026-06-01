"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Award,
  Edit,
  Ban,
  CheckCircle2,
  X,
  Copy,
  Search,
  Calendar,
  User as UserIcon,
  Briefcase,
  FileText,
} from "lucide-react";
import Swal from "sweetalert2";

type CertificateType = "experience" | "internship";
type ValidityType = "lifelong" | "date";
type CertificateStatus = "active" | "disabled";

interface Certificate {
  _id: string;
  certId: string;
  certificateType: CertificateType;
  fromDate: string;
  toDate: string;
  validityType: ValidityType;
  validityDate?: string | null;
  name: string;
  jobDesignation: string;
  content: string;
  status: CertificateStatus;
  createdAt: string;
  updatedAt: string;
}

interface FormState {
  certificateType: CertificateType | "";
  fromDate: string;
  toDate: string;
  validityType: ValidityType;
  validityDate: string;
  name: string;
  jobDesignation: string;
  content: string;
}

const emptyForm: FormState = {
  certificateType: "",
  fromDate: "",
  toDate: "",
  validityType: "lifelong",
  validityDate: "",
  name: "",
  jobDesignation: "",
  content: "",
};

const toInputDate = (value?: string | null) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().split("T")[0];
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Certificate | null>(null);
  const [selected, setSelected] = useState<Certificate | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CertificateStatus>("all");

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/certificates");
      const data = await res.json();
      if (res.ok && data.success) {
        setCertificates(data.certificates);
      }
    } catch (err) {
      console.error("Error fetching certificates:", err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const openEdit = (c: Certificate) => {
    setEditing(c);
    setForm({
      certificateType: c.certificateType,
      fromDate: toInputDate(c.fromDate),
      toDate: toInputDate(c.toDate),
      validityType: c.validityType,
      validityDate: toInputDate(c.validityDate),
      name: c.name,
      jobDesignation: c.jobDesignation,
      content: c.content,
    });
    setShowForm(true);
    setSelected(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.certificateType) {
      Swal.fire({ icon: "warning", title: "Select certificate type" });
      return;
    }
    if (form.validityType === "date" && !form.validityDate) {
      Swal.fire({ icon: "warning", title: "Provide validity date" });
      return;
    }
    if (form.content.length > 1000) {
      Swal.fire({ icon: "warning", title: "Content too long", text: "Max 1000 characters" });
      return;
    }

    setSubmitting(true);
    try {
      const url = editing ? `/api/certificates/${editing.certId}` : "/api/certificates";
      const method = editing ? "PUT" : "POST";

      const payload = {
        certificateType: form.certificateType,
        fromDate: form.fromDate,
        toDate: form.toDate,
        validityType: form.validityType,
        validityDate: form.validityType === "date" ? form.validityDate : null,
        name: form.name,
        jobDesignation: form.jobDesignation,
        content: form.content,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        await Swal.fire({
          icon: "success",
          title: editing ? "Certificate updated" : "Certificate issued",
          text: editing ? undefined : `Cert ID: ${data.certificate.certId}`,
          confirmButtonColor: "#3B82F6",
        });
        setShowForm(false);
        resetForm();
        fetchAll();
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: data.message || "Operation failed",
          confirmButtonColor: "#EF4444",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Network error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (c: Certificate) => {
    const nextStatus: CertificateStatus = c.status === "active" ? "disabled" : "active";
    const result = await Swal.fire({
      title: nextStatus === "disabled" ? "Disable this certificate?" : "Re-activate this certificate?",
      text: nextStatus === "disabled"
        ? "Disabled certificates will not be returned by the public lookup."
        : "It will be available again via the public lookup.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: nextStatus === "disabled" ? "#EF4444" : "#10B981",
      cancelButtonColor: "#6B7280",
      confirmButtonText: nextStatus === "disabled" ? "Yes, disable" : "Yes, activate",
    });
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`/api/certificates/${c.certId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: data.message,
          timer: 1600,
          showConfirmButton: false,
        });
        setSelected((prev) => (prev && prev.certId === c.certId ? { ...prev, status: nextStatus } : prev));
        fetchAll();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: data.message });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Network error" });
    }
  };

  const copyCertId = async (certId: string) => {
    try {
      await navigator.clipboard.writeText(certId);
      Swal.fire({
        icon: "success",
        title: "Copied!",
        timer: 1000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });
    } catch {
      // ignore
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return certificates.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return (
        c.certId.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.jobDesignation.toLowerCase().includes(q) ||
        c.certificateType.toLowerCase().includes(q)
      );
    });
  }, [certificates, search, statusFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Issue Certificate</h1>
          <p className="text-gray-600 mt-1">Generate and manage experience / internship certificates.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Issue Certificate</span>
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Cert ID, name, designation, type..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as "all" | CertificateStatus)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editing ? `Edit Certificate (${editing.certId})` : "Issue New Certificate"}
            </h2>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                resetForm();
              }}
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Certificate Type</label>
                <select
                  value={form.certificateType}
                  onChange={(e) =>
                    setForm({ ...form, certificateType: e.target.value as CertificateType })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                >
                  <option value="">Select type</option>
                  <option value="experience">Experience Certificate</option>
                  <option value="internship">Internship Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="Recipient full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Designation</label>
                <input
                  type="text"
                  value={form.jobDesignation}
                  onChange={(e) => setForm({ ...form, jobDesignation: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                  placeholder="e.g. Frontend Developer Intern"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={form.fromDate}
                    onChange={(e) => setForm({ ...form, fromDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={form.toDate}
                    onChange={(e) => setForm({ ...form, toDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Validity</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="validityType"
                      value="lifelong"
                      checked={form.validityType === "lifelong"}
                      onChange={() => setForm({ ...form, validityType: "lifelong", validityDate: "" })}
                    />
                    Lifelong
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="radio"
                      name="validityType"
                      value="date"
                      checked={form.validityType === "date"}
                      onChange={() => setForm({ ...form, validityType: "date" })}
                    />
                    Valid until
                  </label>
                </div>
                {form.validityType === "date" && (
                  <input
                    type="date"
                    value={form.validityDate}
                    onChange={(e) => setForm({ ...form, validityDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    required
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Content <span className="text-gray-500">({form.content.length}/1000)</span>
              </label>
              <textarea
                value={form.content}
                onChange={(e) => {
                  if (e.target.value.length <= 1000) {
                    setForm({ ...form, content: e.target.value });
                  }
                }}
                rows={6}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder-gray-500"
                placeholder="Certificate body / description (max 1000 characters)"
                required
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {submitting ? "Saving..." : editing ? "Update Certificate" : "Issue Certificate"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Issued Certificates</h3>
          <span className="text-sm text-gray-500">{filtered.length} record(s)</span>
        </div>

        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">No certificates found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filtered.map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => setSelected(c)}
                className="w-full text-left p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-700 uppercase">
                        {c.certificateType}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                          c.status === "active"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {c.status}
                      </span>
                      <code className="text-xs font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                        {c.certId}
                      </code>
                    </div>
                    <h4 className="text-base font-semibold text-gray-900 truncate">
                      {c.name} <span className="text-gray-500 font-normal">— {c.jobDesignation}</span>
                    </h4>
                    <div className="mt-1 text-sm text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(c.fromDate)} → {formatDate(c.toDate)}
                      </span>
                      <span>
                        Validity:{" "}
                        {c.validityType === "lifelong" ? "Lifelong" : formatDate(c.validityDate)}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between p-5 border-b border-gray-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Award className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">Certificate Details</h2>
                </div>
                <div className="flex items-center gap-2">
                  <code className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded">
                    {selected.certId}
                  </code>
                  <button
                    onClick={() => copyCertId(selected.certId)}
                    className="text-gray-500 hover:text-blue-600"
                    title="Copy Cert ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded uppercase ${
                      selected.status === "active"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {selected.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <UserIcon className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="text-sm font-medium text-gray-900">{selected.name}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Briefcase className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Job Designation</div>
                    <div className="text-sm font-medium text-gray-900">{selected.jobDesignation}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Type</div>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {selected.certificateType}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Period</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(selected.fromDate)} → {formatDate(selected.toDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Validity</div>
                    <div className="text-sm font-medium text-gray-900">
                      {selected.validityType === "lifelong"
                        ? "Lifelong"
                        : formatDate(selected.validityDate)}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 mt-0.5 text-gray-400" />
                  <div>
                    <div className="text-xs text-gray-500">Issued On</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(selected.createdAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500 mb-1">Content</div>
                <div className="text-sm text-gray-800 whitespace-pre-wrap bg-gray-50 border border-gray-200 rounded-lg p-3">
                  {selected.content}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end p-5 border-t border-gray-200">
              <button
                onClick={() => handleToggleStatus(selected)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  selected.status === "active"
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : "bg-green-600 text-white hover:bg-green-700"
                }`}
              >
                {selected.status === "active" ? (
                  <>
                    <Ban className="h-4 w-4" /> Disable
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Activate
                  </>
                )}
              </button>
              <button
                onClick={() => openEdit(selected)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <Edit className="h-4 w-4" /> Update
              </button>
              <button
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
