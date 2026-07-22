"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Download, Edit2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDateDDMMYYYY } from "@/app/utils/dateFormat";

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

interface FullProjectEstimate {
  _id: string;
  clientId: string;
  estimateName: string;
  estimateType: string;
  sqFeet: number;
  paymentStages: PaymentStage[];
  workDetails?: WorkDetailSection[];
  additionalWorks?: Array<{ id: string; text: string }>;
  materialsUsed?: Array<{ id: string; material: string; details: string }>;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ClientDetails {
  name: string;
}

export default function FullProjectEstimateViewPage() {
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
        console.error("Error fetching estimate:", error);
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

  const handleDownloadPDF = () => {
    if (!estimate) return;

    const doc = new jsPDF();
    const currentDate = new Date();
    const clientName = clientDetails?.name || "";

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

    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text("Website: www.takshaga.com", 105, 52, { align: "center" });
    doc.text("Email: info@takshaga.com", 105, 57, { align: "center" });
    doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: "center" });

    doc.setFillColor(245, 245, 245);
    doc.roundedRect(5, 75, 200, 45, 2, 2, "F");

    doc.setTextColor(0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("ESTIMATE DETAILS", 15, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Estimate: ${estimate.estimateName}`, 15, 95);
    doc.text(`Date: ${formatDateDDMMYYYY(currentDate)}`, 15, 105);
    doc.text(`Square Feet: ${estimate.sqFeet}`, 15, 115);

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("BILL TO", 110, 85);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(clientName, 110, 95);

    doc.setFillColor(0, 51, 102);
    doc.rect(5, 130, 200, 12, "F");
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("ARRANGEMENT OF PAYMENT FROM CLIENT", 105, 138, { align: "center" });

    const tableData = (estimate.paymentStages || []).map((stage) => [
      stage.stage,
      `Rs ${stage.amount.toLocaleString("en-IN")}`,
    ]);

    const total = (estimate.paymentStages || []).reduce((sum, s) => sum + s.amount, 0);
    tableData.push(["Total", `Rs ${total.toLocaleString("en-IN")}`]);

    autoTable(doc, {
      startY: 150,
      head: [["Payment Stage", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [248, 250, 252], textColor: [0, 0, 0], fontStyle: "bold" },
      styles: { fontSize: 8, cellPadding: 2 },
      margin: { left: 15, right: 15 },
    });

    const formattedDate = currentDate.toISOString().split("T")[0];
    const formattedClientName = (clientName || "client").replace(/\s+/g, "_");
    doc.save(`Full_Project_Estimate_${formattedClientName}_${formattedDate}.pdf`);
  };

  const handleBack = () => {
    if (estimate?.clientId) {
      router.push(
        `/dashboard/estimates?clientId=${estimate.clientId}&clientName=${clientDetails?.name || ""}`
      );
    } else {
      router.push("/dashboard/estimates");
    }
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

  const totalAmount = (estimate.paymentStages || []).reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{estimate.estimateName}</h1>
              <p className="text-gray-600 mt-1">
                {clientDetails?.name ? `Client: ${clientDetails.name}` : "Full Project Estimate"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                router.push(
                  `/dashboard/estimates/full-project/setup?clientId=${estimate.clientId}&clientName=${encodeURIComponent(clientDetails?.name || "")}&estimateId=${estimateId}`
                )
              }
              className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Pricing</span>
            </button>
            <button
              onClick={() => router.push(`/dashboard/estimates/full-project/${estimateId}/work-details`)}
              className="px-4 py-2 border border-emerald-200 text-emerald-700 rounded-lg hover:bg-emerald-50 transition-colors flex items-center space-x-2 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Work Details</span>
            </button>
            <button
              onClick={() => router.push(`/dashboard/estimates/full-project/${estimateId}/additional`)}
              className="px-4 py-2 border border-amber-200 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors flex items-center space-x-2 text-sm"
            >
              <Edit2 className="h-4 w-4" />
              <span>Edit Additional</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Square Feet</p>
              <p className="text-lg font-semibold text-gray-900">{estimate.sqFeet}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Amount</p>
              <p className="text-lg font-semibold text-emerald-700">
                ₹{totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-lg font-semibold text-gray-900">
                {formatDateDDMMYYYY(estimate.createdAt)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Arrangement of Payment from Client
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">
                    Payment Stage
                  </th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">
                    Amount (₹)
                  </th>
                </tr>
              </thead>
              <tbody>
                {(estimate.paymentStages || []).map((stage) => (
                  <tr key={stage.stage} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-black">{stage.stage}</td>
                    <td className="py-3 px-4 text-right text-black">
                      ₹{stage.amount.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
                <tr className="bg-emerald-50 font-semibold">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-emerald-700">
                    ₹{totalAmount.toLocaleString("en-IN")}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {estimate.workDetails && estimate.workDetails.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Work Details</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {estimate.workDetails.map((section) => (
                <div key={section.id} className="p-5">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">
                    {section.number}. {section.title}
                  </h3>
                  <ul className="space-y-1">
                    {section.points.map((pt) => (
                      <li key={pt.id} className="text-sm text-gray-600 flex gap-2">
                        <span className="text-emerald-500 shrink-0">•</span>
                        {pt.text}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {estimate.additionalWorks && estimate.additionalWorks.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 underline underline-offset-4">
                Additional work
              </h2>
            </div>
            <ul className="p-5 space-y-2">
              {estimate.additionalWorks.map((item) => (
                <li key={item.id} className="text-sm text-gray-700 flex gap-2">
                  <span className="text-emerald-500 shrink-0">•</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        )}

        {estimate.materialsUsed && estimate.materialsUsed.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden mt-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 underline underline-offset-4">
                Materials used
              </h2>
            </div>
            <table className="w-full border-collapse">
              <tbody>
                {estimate.materialsUsed.map((item) => (
                  <tr key={item.id} className="border-b border-gray-200">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 border-r border-gray-200 w-[40%]">
                      {item.material}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{item.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
