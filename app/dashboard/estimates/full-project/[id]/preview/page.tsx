"use client";

import { useState, useEffect } from "react";
import { Download, Edit2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateDDMMYYYY } from "@/app/utils/dateFormat";
import {
  createDefaultAdditionalWorks,
  createDefaultMaterialsUsed,
} from "@/app/lib/fullProjectExtras";
import { createDefaultWorkDetails } from "@/app/lib/fullProjectWorkDetails";

interface PaymentStage {
  stage: string;
  amount: number;
}

interface WorkDetailSection {
  id: string;
  number: number;
  title: string;
  points: Array<{ id: string; text: string }>;
}

interface ProjectCostRow {
  id: string;
  name: string;
  type: "per_sqft" | "fixed";
  rate?: number;
  fixedAmount?: number;
  itemSqFeet?: number;
}

interface ProjectCustomItem {
  id: string;
  name: string;
  type: "per_sqft" | "fixed";
  rate?: number;
  sqFeet?: number;
  fixedAmount?: number;
  totalAmount: number;
}

interface FullProjectEstimate {
  _id: string;
  clientId: string;
  estimateName: string;
  sqFeet: number;
  totalAmount: number;
  constructionCostPerSqFt?: number;
  interiorCostType?: "per_sqft" | "fixed";
  interiorCostPerSqFt?: number;
  interiorFixedCost?: number;
  projectCustomItems?: ProjectCustomItem[];
  projectCostRows?: ProjectCostRow[];
  paymentStages: PaymentStage[];
  workDetails?: WorkDetailSection[];
  additionalWorks?: Array<{ id: string; text: string }>;
  materialsUsed?: Array<{ id: string; material: string; details: string }>;
  createdAt: string;
}

interface ClientDetails {
  name: string;
  phone?: string;
  location?: string;
}

function getRowTotal(row: ProjectCostRow, sqFeet: number) {
  if (row.type === "fixed") return row.fixedAmount || 0;
  const rate = row.rate || 0;
  const rowSq = row.itemSqFeet && row.itemSqFeet > 0 ? row.itemSqFeet : sqFeet;
  return rate * rowSq;
}

/** Build full pricing list: Construction, Interior, custom — from saved rows or fallback fields */
function getAllPricingRows(estimate: FullProjectEstimate): ProjectCostRow[] {
  if (estimate.projectCostRows && estimate.projectCostRows.length > 0) {
    return estimate.projectCostRows;
  }

  const rows: ProjectCostRow[] = [];
  const sq = estimate.sqFeet || 0;
  const constructionRate = estimate.constructionCostPerSqFt || 0;

  if (constructionRate > 0) {
    rows.push({
      id: "construction",
      name: "Construction Cost",
      type: "per_sqft",
      rate: constructionRate,
      itemSqFeet: sq,
    });
  }

  const interiorType = estimate.interiorCostType || "per_sqft";
  const interiorPer = estimate.interiorCostPerSqFt || 0;
  const interiorFixed = estimate.interiorFixedCost || 0;
  if (interiorPer > 0 || interiorFixed > 0) {
    rows.push({
      id: "interior",
      name: "Interior Cost",
      type: interiorType,
      rate: interiorType === "per_sqft" ? interiorPer : undefined,
      fixedAmount: interiorType === "fixed" ? interiorFixed : undefined,
      itemSqFeet: interiorType === "per_sqft" ? sq : undefined,
    });
  }

  for (const item of estimate.projectCustomItems || []) {
    if (item.id === "construction" || item.id === "interior") continue;
    rows.push({
      id: item.id,
      name: item.name,
      type: item.type,
      rate: item.rate,
      fixedAmount: item.fixedAmount,
      itemSqFeet: item.sqFeet,
    });
  }

  return rows;
}

function SectionHeading({
  title,
  editLabel,
  onEdit,
}: {
  title: string;
  editLabel?: string;
  onEdit?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b-2 border-[#003366] pb-2 mb-4">
      <h2 className="text-lg font-bold text-black">{title}</h2>
      {onEdit && (
        <button
          onClick={onEdit}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003366] bg-blue-50 border border-[#003366]/20 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <Edit2 className="h-3 w-3" />
          {editLabel || "Edit"}
        </button>
      )}
    </div>
  );
}

export default function FullProjectPreviewPage() {
  const router = useRouter();
  const params = useParams();
  const estimateId = params.id as string;

  const [estimate, setEstimate] = useState<FullProjectEstimate | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!estimateId) return;
      setLoading(true);
      try {
        const response = await fetch(`/api/general-estimates?estimateId=${estimateId}`);
        if (!response.ok) throw new Error("Failed to fetch estimate");
        const data = await response.json();
        if (data.estimate) {
          setEstimate(data.estimate);
          if (data.estimate.clientId) {
            const clientResponse = await fetch(`/api/clients/${data.estimate.clientId}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              setClientDetails(clientData.client);
            }
          }
        }
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to load preview",
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

  const handleDownloadPDF = async () => {
    if (!estimate) return;

    const doc = new jsPDF();
    const clientName = clientDetails?.name || "";
    const currentDate = new Date();

    const workDetailsPdf =
      estimate.workDetails && estimate.workDetails.length > 0
        ? estimate.workDetails
        : createDefaultWorkDetails();
    const additionalWorksPdf =
      estimate.additionalWorks && estimate.additionalWorks.length > 0
        ? estimate.additionalWorks
        : createDefaultAdditionalWorks();
    const materialsUsedPdf =
      estimate.materialsUsed && estimate.materialsUsed.length > 0
        ? estimate.materialsUsed
        : createDefaultMaterialsUsed();

    // Full page border (same as interior)
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    // Header background
    doc.setFillColor(0, 51, 102);
    doc.rect(5, 5, 200, 45, "F");
    doc.setFillColor(0, 71, 142);
    doc.rect(5, 45, 200, 20, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Takshaga Spatial Solutions", 15, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
    doc.text("Upputhara P.O, Idukki District", 15, 35);
    doc.text("Kerala – 685505, India", 15, 40);

    try {
      doc.addImage("/logo.png", "PNG", 155, 8, 50, 50);
    } catch {
      console.log("Logo not found");
    }

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Website: www.takshaga.com", 105, 52, { align: "center" });
    doc.text("Email: info@takshaga.com", 105, 57, { align: "center" });
    doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: "center" });

    // Estimate details box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(5, 75, 200, 40, 2, 2, "F");

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ESTIMATE DETAILS", 15, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Estimate No: EST-${currentDate.getFullYear()}-${Date.now().toString().slice(-6).toUpperCase()}`,
      15,
      95
    );
    doc.text(`Date: ${formatDateDDMMYYYY(currentDate)}`, 15, 105);
    doc.text(`Square Feet: ${estimate.sqFeet.toLocaleString("en-IN")}`, 15, 112);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 110, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(clientName || "", 110, 95);
    if (clientDetails?.location) doc.text(clientDetails.location, 110, 105);

    // Title bar
    doc.setFillColor(0, 51, 102);
    doc.rect(5, 125, 200, 12, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("PROJECT ESTIMATE", 105, 133, { align: "center" });

    let y = 145;
    const ensureSpace = (needed = 40) => {
      if (y > 287 - needed) {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        y = 20;
      }
    };

    // Payment arrangement (pricing is only in Download Pricing PDF)
    if (estimate.paymentStages?.length) {
      ensureSpace(50);
      doc.setFillColor(0, 51, 102);
      doc.rect(5, y, 200, 10, "F");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("ARRANGEMENT OF PAYMENT FROM CLIENT", 105, y + 7, { align: "center" });
      y += 14;

      const payTotal = estimate.paymentStages.reduce((s, p) => s + p.amount, 0);
      autoTable(doc, {
        startY: y,
        head: [["Payment Stage", "Amount"]],
        body: [
          ...estimate.paymentStages.map((p) => [
            p.stage,
            `Rs ${p.amount.toLocaleString("en-IN")}`,
          ]),
          ["Total", `Rs ${payTotal.toLocaleString("en-IN")}`],
        ],
        theme: "grid",
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [0, 0, 0],
          fontStyle: "bold",
        },
        bodyStyles: { textColor: [0, 0, 0] },
        styles: { fontSize: 8, cellPadding: 2 },
        margin: { left: 15, right: 15 },
      });
      y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
    }

    // Work details
    ensureSpace(40);
    doc.setFillColor(0, 51, 102);
    doc.rect(5, y, 200, 10, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("WORK DETAILS", 105, y + 7, { align: "center" });
    y += 14;
    doc.setTextColor(0);
    doc.setFontSize(8);

    for (const section of workDetailsPdf) {
      ensureSpace(25);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(153, 0, 0);
      doc.text(`${section.number}. ${section.title}`, 15, y);
      y += 5;
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0);
      for (const pt of section.points) {
        ensureSpace(15);
        const lines = doc.splitTextToSize(`* ${pt.text}`, 175);
        doc.text(lines, 18, y);
        y += lines.length * 4 + 1;
      }
      y += 3;
    }

    // Additional work
    ensureSpace(40);
    doc.setFillColor(0, 51, 102);
    doc.rect(5, y, 200, 10, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("ADDITIONAL WORK", 105, y + 7, { align: "center" });
    y += 14;
    doc.setTextColor(0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    for (const item of additionalWorksPdf) {
      ensureSpace(12);
      doc.text(`* ${item.text}`, 18, y);
      y += 5;
    }
    y += 8;

    // Materials used
    ensureSpace(50);
    doc.setFillColor(0, 51, 102);
    doc.rect(5, y, 200, 10, "F");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("MATERIALS USED", 105, y + 7, { align: "center" });
    y += 14;
    autoTable(doc, {
      startY: y,
      head: [["Material", "Details / Brand"]],
      body: materialsUsedPdf.map((m) => [m.material, m.details]),
      theme: "grid",
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      bodyStyles: { textColor: [0, 0, 0] },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 15, right: 15 },
    });
    y = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

    // Footer bar
    ensureSpace(20);
    doc.setFillColor(0, 51, 102);
    doc.rect(5, y, 200, 15, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This is a computer generated document and does not require a signature.",
      105,
      y + 9,
      { align: "center" }
    );

    const formattedDate = currentDate.toISOString().split("T")[0];
    const formattedClientName = (clientName || "client").replace(/\s+/g, "_");
    doc.save(`Project_Estimate_${formattedClientName}_${formattedDate}.pdf`);
  };

  const handleDownloadPricingPDF = () => {
    if (!estimate) return;
    const doc = new jsPDF();
    const clientName = clientDetails?.name || "";
    const currentDate = new Date();
    const rows = getAllPricingRows(estimate);
    const sq = estimate.sqFeet || 0;
    const pricingTotal = rows.reduce((sum, r) => sum + getRowTotal(r, sq), 0);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.rect(5, 5, 200, 287);

    doc.setFillColor(0, 51, 102);
    doc.rect(5, 5, 200, 45, "F");
    doc.setFillColor(0, 71, 142);
    doc.rect(5, 45, 200, 20, "F");

    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Takshaga Spatial Solutions", 15, 20);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
    doc.text("Upputhara P.O, Idukki District", 15, 35);
    doc.text("Kerala – 685505, India", 15, 40);

    try {
      doc.addImage("/logo.png", "PNG", 155, 8, 50, 50);
    } catch {
      console.log("Logo not found");
    }

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Website: www.takshaga.com", 105, 52, { align: "center" });
    doc.text("Email: info@takshaga.com", 105, 57, { align: "center" });
    doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: "center" });

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(5, 75, 200, 35, 2, 2, "F");
    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("PRICING DETAILS", 15, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${formatDateDDMMYYYY(currentDate)}`, 15, 95);
    doc.text(`Square Feet: ${sq.toLocaleString("en-IN")}`, 15, 105);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 110, 85);
    doc.setFont("helvetica", "normal");
    doc.text(clientName || "", 110, 95);
    if (clientDetails?.location) doc.text(clientDetails.location, 110, 105);

    doc.setFillColor(0, 51, 102);
    doc.rect(5, 120, 200, 12, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("PROJECT PRICING", 105, 128, { align: "center" });

    const tableBody = rows.map((r) => {
      const amount = getRowTotal(r, sq);
      if (r.type === "per_sqft") {
        const itemSq = r.itemSqFeet && r.itemSqFeet > 0 ? r.itemSqFeet : sq;
        return [
          r.name,
          `Rs ${(r.rate || 0).toLocaleString("en-IN")}`,
          itemSq.toLocaleString("en-IN"),
          `Rs ${amount.toLocaleString("en-IN")}`,
        ];
      }
      return [
        r.name,
        "Fixed",
        "—",
        `Rs ${amount.toLocaleString("en-IN")}`,
      ];
    });

    tableBody.push([
      "Grand Total",
      "",
      "",
      `Rs ${(pricingTotal || estimate.totalAmount).toLocaleString("en-IN")}`,
    ]);

    autoTable(doc, {
      startY: 140,
      head: [["Particulars", "Rate / Type", "Sq Feet", "Amount"]],
      body: tableBody,
      theme: "grid",
      headStyles: {
        fillColor: [248, 250, 252],
        textColor: [0, 0, 0],
        fontStyle: "bold",
      },
      bodyStyles: { textColor: [0, 0, 0] },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 30, halign: "right" },
        3: { cellWidth: 40, halign: "right" },
      },
      margin: { left: 15, right: 15 },
      didParseCell: (data) => {
        if (data.section === "body" && data.row.index === tableBody.length - 1) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [240, 253, 244];
        }
      },
    });

    const y =
      ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
    doc.setFillColor(0, 51, 102);
    doc.rect(5, Math.min(y, 270), 200, 15, "F");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.text(
      "This is a computer generated document and does not require a signature.",
      105,
      Math.min(y, 270) + 9,
      { align: "center" }
    );

    const formattedDate = currentDate.toISOString().split("T")[0];
    const formattedClientName = (clientName || "client").replace(/\s+/g, "_");
    doc.save(`Project_Pricing_${formattedClientName}_${formattedDate}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
      </div>
    );
  }

  if (!estimate) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Estimate not found</p>
      </div>
    );
  }

  const paymentTotal = (estimate.paymentStages || []).reduce((sum, s) => sum + s.amount, 0);
  const costRows = getAllPricingRows(estimate);
  const workDetails =
    estimate.workDetails && estimate.workDetails.length > 0
      ? estimate.workDetails
      : createDefaultWorkDetails();
  const additionalWorks =
    estimate.additionalWorks && estimate.additionalWorks.length > 0
      ? estimate.additionalWorks
      : createDefaultAdditionalWorks();
  const materialsUsed =
    estimate.materialsUsed && estimate.materialsUsed.length > 0
      ? estimate.materialsUsed
      : createDefaultMaterialsUsed();

  const goPricing = () =>
    router.push(
      `/dashboard/estimates/full-project/setup?clientId=${estimate.clientId}&clientName=${encodeURIComponent(clientDetails?.name || "")}&estimateId=${estimateId}`
    );
  const goPayment = () =>
    router.push(
      `/dashboard/estimates/full-project?clientId=${estimate.clientId}&clientName=${encodeURIComponent(clientDetails?.name || "")}&estimateId=${estimateId}`
    );
  const goWork = () =>
    router.push(`/dashboard/estimates/full-project/${estimateId}/work-details`);
  const goAdditional = () =>
    router.push(`/dashboard/estimates/full-project/${estimateId}/additional`);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Preview card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden">
          <div className="bg-gradient-to-r from-[#003366] to-[#00478e] text-white px-8 py-7">
            <h1 className="text-2xl font-bold tracking-tight">Takshaga Spatial Solutions</h1>
            <p className="text-sm text-blue-100 mt-1">Full Project Estimate Preview</p>
          </div>

          <div className="px-8 py-7 space-y-10 text-black">
            {/* Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-slate-200">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Client</p>
                <p className="mt-1 text-lg font-semibold">{clientDetails?.name || "—"}</p>
                {clientDetails?.location && (
                  <p className="text-sm text-slate-600 mt-0.5">{clientDetails.location}</p>
                )}
              </div>
              <div className="sm:text-right space-y-2">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Date</p>
                  <p className="font-semibold">{formatDateDDMMYYYY(estimate.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Square Feet
                  </p>
                  <p className="font-semibold">
                    {estimate.sqFeet.toLocaleString("en-IN")} sq ft
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Total Amount
                  </p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ₹{estimate.totalAmount.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>
            </div>

            {/* Project Cost — Pricing edit + downloads on right */}
            <section>
              <div className="flex items-center justify-between gap-3 flex-wrap border-b-2 border-[#003366] pb-2 mb-4">
                <h2 className="text-lg font-bold text-black">Project Cost</h2>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={goPricing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#003366] bg-blue-50 border border-[#003366]/20 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    <Edit2 className="h-3 w-3" />
                    Pricing
                  </button>
                  <button
                    onClick={handleDownloadPricingPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Download Pricing
                  </button>
                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#003366] rounded-lg hover:bg-[#00478e] transition-colors cursor-pointer"
                  >
                    <Download className="h-3 w-3" />
                    Download PDF
                  </button>
                </div>
              </div>
              {costRows.length > 0 ? (
                <table className="w-full text-sm border-collapse border border-black">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2.5 px-3 border border-black font-semibold">
                        Item Name
                      </th>
                      <th className="text-left py-2.5 px-3 border border-black font-semibold">
                        Rate / Type
                      </th>
                      <th className="text-right py-2.5 px-3 border border-black font-semibold">
                        Sq Feet
                      </th>
                      <th className="text-right py-2.5 px-3 border border-black font-semibold">
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {costRows.map((row) => {
                      const amount = getRowTotal(row, estimate.sqFeet);
                      const itemSq =
                        row.type === "per_sqft"
                          ? row.itemSqFeet && row.itemSqFeet > 0
                            ? row.itemSqFeet
                            : estimate.sqFeet
                          : null;
                      return (
                        <tr key={row.id}>
                          <td className="py-2 px-3 border border-black">{row.name}</td>
                          <td className="py-2 px-3 border border-black">
                            {row.type === "per_sqft"
                              ? `₹${(row.rate || 0).toLocaleString("en-IN")}`
                              : "Fixed"}
                          </td>
                          <td className="py-2 px-3 border border-black text-right">
                            {itemSq !== null ? itemSq.toLocaleString("en-IN") : "—"}
                          </td>
                          <td className="py-2 px-3 border border-black text-right font-medium">
                            {amount.toLocaleString("en-IN")}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-emerald-50 font-semibold">
                      <td className="py-2.5 px-3 border border-black" colSpan={3}>
                        Total
                      </td>
                      <td className="py-2.5 px-3 border border-black text-right text-emerald-800">
                        ₹{estimate.totalAmount.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-500">No pricing items yet.</p>
              )}
            </section>

            {/* Payment */}
            {(estimate.paymentStages || []).length > 0 && (
              <section>
                <SectionHeading
                  title="Arrangement of Payment from Client"
                  editLabel="Payment"
                  onEdit={goPayment}
                />
                <table className="w-full text-sm border-collapse border border-black">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left py-2.5 px-3 border border-black font-semibold">
                        Payment Stage
                      </th>
                      <th className="text-right py-2.5 px-3 border border-black font-semibold">
                        Amount (₹)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {estimate.paymentStages.map((stage, i) => (
                      <tr key={`${stage.stage}-${i}`}>
                        <td className="py-2 px-3 border border-black">{stage.stage}</td>
                        <td className="py-2 px-3 border border-black text-right">
                          {stage.amount.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-emerald-50 font-semibold">
                      <td className="py-2.5 px-3 border border-black">Total</td>
                      <td className="py-2.5 px-3 border border-black text-right text-emerald-800">
                        ₹{paymentTotal.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {/* Work Details */}
            <section>
              <SectionHeading title="Work Details" editLabel="Work" onEdit={goWork} />
              <div className="space-y-4">
                {workDetails.map((section) => (
                  <div key={section.id}>
                    <h3 className="text-sm font-bold text-red-700 mb-1">
                      {section.number}. {section.title}
                    </h3>
                    <ul className="space-y-0.5 pl-1">
                      {section.points.map((pt) => (
                        <li key={pt.id} className="text-sm flex gap-2">
                          <span className="shrink-0">•</span>
                          <span>{pt.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section>
              <SectionHeading
                title="Additional work"
                editLabel="Additional"
                onEdit={goAdditional}
              />
              <ul className="space-y-1">
                {additionalWorks.map((item) => (
                  <li key={item.id} className="text-sm flex gap-2">
                    <span className="shrink-0">•</span>
                    <span>{item.text}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <SectionHeading
                title="Materials used"
                editLabel="Additional"
                onEdit={goAdditional}
              />
              <table className="w-full text-sm border-collapse border border-black">
                <tbody>
                  {materialsUsed.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2 px-3 border border-black font-medium w-[40%]">
                        {item.material}
                      </td>
                      <td className="py-2 px-3 border border-black">{item.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <p className="pt-4 border-t border-slate-200 text-center text-xs text-slate-400">
              This is a computer generated document from Takshaga Spatial Solutions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
