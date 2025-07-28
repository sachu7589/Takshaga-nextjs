"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle,
  Calendar,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Eye,
  Download,
  Share2,
  FileText
} from "lucide-react";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Item {
  id: string;
  sectionId: string;
  sectionName: string;
  categoryName: string;
  subCategoryName: string;
  materialName: string;
  type: 'area' | 'pieces' | 'running' | 'running_sq_feet';
  length?: number;
  breadth?: number;
  measurements?: { length: number; breadth: number }[];
  pieces?: number;
  runningLength?: number;
  runningMeasurements?: { length: number }[];
  description: string;
  totalAmount: number;
}

interface ApprovedWork {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  items: Item[];
  totalAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  status: string;
  createdAt: string;
  updatedAt: string;
  client?: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  user?: {
    name: string;
    email: string;
  };
}

export default function ApprovedWorksPage() {
  const router = useRouter();
  const [approvedWorks, setApprovedWorks] = useState<ApprovedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApprovedWorks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/interior-estimates?status=approved');
        
        if (!response.ok) {
          throw new Error('Failed to fetch approved works');
        }
        
        const data = await response.json();
        const estimates = data.estimates || [];
        
        // Fetch client details for each estimate
        const estimatesWithClients = await Promise.all(
          estimates.map(async (estimate: ApprovedWork) => {
            try {
              const clientResponse = await fetch(`/api/clients/${estimate.clientId}`);
              if (clientResponse.ok) {
                const clientData = await clientResponse.json();
                return {
                  ...estimate,
                  client: clientData.client
                };
              }
            } catch (error) {
              console.error('Error fetching client details:', error);
            }
            return estimate;
          })
        );
        
        setApprovedWorks(estimatesWithClients);
      } catch (error) {
        console.error('Error fetching approved works:', error);
        setError('Failed to load approved works');
      } finally {
        setLoading(false);
      }
    };

    fetchApprovedWorks();
  }, []);

  const handleViewDetails = (workId: string) => {
    router.push(`/dashboard/interior-work/approved/${workId}/details`);
  };

  const handleViewEstimate = (workId: string) => {
    window.open(`/dashboard/estimates/interior/${workId}`, '_blank');
  };

  const handleDownloadEstimate = (work: ApprovedWork) => {
    if (!work || !work.client) return;

    try {
      const doc = new jsPDF();
      
      // Add full page border - only 4 sides
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect
      doc.setFillColor(0, 51, 102); // Dark blue
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142); // Lighter blue for accent
      doc.rect(5, 45, 200, 20, 'F');
      
      // Add company details on left side with professional styling
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", 15, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
      doc.text("Upputhara P.O, Idukki District", 15, 35);
      doc.text("Kerala – 685505, India", 15, 40);

      // Add logo on right side
      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found, continuing without logo');
      }

      // Add contact details in light blue area
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });
      
      // Add professional estimate details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 45, 2, 2, 'F');
      
      // Add estimate details on left in a structured format
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("ESTIMATE DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Estimate No: EST-${new Date(work.createdAt).getFullYear()}-${String(work._id).slice(-6).toUpperCase()}`, 15, 95);
      doc.text(`Date: ${new Date(work.createdAt).toLocaleDateString()}`, 15, 105);
      
      // Add client details on right with better structure
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("BILL TO", 110, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(work.client.name, 110, 95);
      doc.text(work.client.location || "", 110, 105);
      
      // Add ESTIMATE heading with professional styling
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 130, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("ESTIMATE", 105, 138, { align: "center" });

      let yPos = 150;
      const pageEndY = 280;
      const minSpaceNeeded = 50;
      const categorySpacing = 20;
      const subcategorySpacing = 15;

      // Organize items by category and subcategory
      const organizedSections: Record<string, Record<string, Item[]>> = {};
      work.items.forEach(item => {
        const categoryName = item.categoryName || 'Uncategorized';
        const subcategoryName = item.subCategoryName || 'Other';
        if (!organizedSections[categoryName]) {
          organizedSections[categoryName] = {};
        }
        if (!organizedSections[categoryName][subcategoryName]) {
          organizedSections[categoryName][subcategoryName] = [];
        }
        organizedSections[categoryName][subcategoryName].push(item);
      });

      Object.entries(organizedSections).forEach(([category, subcategories]) => {
        Object.entries(subcategories).forEach(([subcategory, items], subIndex) => {
          const estimatedTableHeight = items.length * 12 + subcategorySpacing;
          const totalBlockHeight = estimatedTableHeight + 20;

          const remainingSpace = pageEndY - yPos;
          if (remainingSpace < totalBlockHeight || (subIndex === 0 && remainingSpace < minSpaceNeeded)) {
            doc.addPage();
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(5, 5, 200, 287);
            yPos = 20;
          }

          if (subIndex === 0) {
            yPos += 5;
            doc.setFillColor(0, 51, 102);
            doc.rect(10, yPos - 5, 190, 10, 'F');
            doc.setFontSize(11);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text(category, 20, yPos);
            yPos += categorySpacing;
          }

          doc.setFillColor(236, 240, 241);
          doc.rect(15, yPos - 5, 180, 8, 'F');
          doc.setFontSize(10);
          doc.setTextColor(44, 62, 80);
          doc.text(subcategory, 25, yPos);
          yPos += 10;

          // Generate table based on item type
          const getTableStructure = (items: Item[]) => {
            if (!items || items.length === 0) {
              throw new Error('No items to generate table structure');
            }
            const firstItem = items[0];
            
            if (firstItem.type === 'area') {
              // Area type: Description, Measurement, Sq Feet, Amount per sq ft, Total
              const tableData = items.map(item => {
                const descriptionText = item.description || '';
                const materialText = item.materialName || '';
                let combinedText = descriptionText;
                if (materialText) {
                  combinedText = descriptionText ? `${descriptionText}\nMaterial: ${materialText}` : `Material: ${materialText}`;
                }

                // Handle multiple measurements - match page display logic
                let measurements = '';
                let totalSqFeet = 0;
                
                if (item.measurements && item.measurements.length > 0) {
                  // Include item-level dimensions first, then measurements array (matching page display)
                  const measurementStrings = [];
                  
                  // Add item-level dimensions if they exist
                  if (item.length && item.breadth) {
                    measurementStrings.push(`${item.length}×${item.breadth}`);
                    totalSqFeet += (item.length * item.breadth) / 929.03;
                  }
                  
                  // Add measurements array
                  item.measurements.forEach((m) => {
                    measurementStrings.push(`${m.length}×${m.breadth}`);
                    totalSqFeet += (m.length * m.breadth) / 929.03;
                  });
                  
                  measurements = measurementStrings.join('\n');
                } else if (item.length && item.breadth) {
                  measurements = `${item.length}×${item.breadth}`;
                  totalSqFeet = (item.length * item.breadth) / 929.03;
                }

                const amountPerSqFt = totalSqFeet > 0 ? item.totalAmount / totalSqFeet : 0;
                
                const row = [
                  combinedText,
                  measurements,
                  totalSqFeet.toFixed(1),
                  `Rs ${amountPerSqFt.toFixed(1)}`,
                  `Rs ${item.totalAmount.toFixed(1)}`
                ];
                
                return row;
              });

              return {
                head: [['Description', 'Measurement', 'Sq Feet', 'Amount per sq ft', 'Total']],
                body: tableData,
                columnStyles: {
                  "0": { cellWidth: 70 },
                  "1": { cellWidth: 30 },
                  "2": { cellWidth: 25 },
                  "3": { cellWidth: 30 },
                  "4": { cellWidth: 25 }
                }
              };
            } else if (firstItem.type === 'pieces') {
              // Pieces type: Description, No of Pieces, Amount per piece, Total
              const tableData = items.map(item => {
                const descriptionText = item.description || '';
                const materialText = item.materialName || '';
                let combinedText = descriptionText;
                if (materialText) {
                  combinedText = descriptionText ? `${descriptionText}\nMaterial: ${materialText}` : `Material: ${materialText}`;
                }

                const quantity = item.pieces || 1;
                const amountPerPiece = item.totalAmount / quantity;
                
                return [
                  combinedText,
                  quantity.toString(),
                  `Rs ${amountPerPiece.toFixed(1)}`,
                  `Rs ${item.totalAmount.toFixed(1)}`
                ];
              });

              return {
                head: [['Description', 'No of Pieces', 'Amount per piece', 'Total']],
                body: tableData,
                columnStyles: {
                  "0": { cellWidth: 90 },
                  "1": { cellWidth: 30 },
                  "2": { cellWidth: 35 },
                  "3": { cellWidth: 25 },
                  "4": { cellWidth: 0 } // Dummy property to match type signature
                }
              };
            } else if (firstItem.type === 'running' || firstItem.type === 'running_sq_feet') {
              // Running type: Description, Length, Feet, Amount per ft, Total
              const tableData = items.map(item => {
                const descriptionText = item.description || '';
                const materialText = item.materialName || '';
                let combinedText = descriptionText;
                if (materialText) {
                  combinedText = descriptionText ? `${descriptionText}\nMaterial: ${materialText}` : `Material: ${materialText}`;
                }

                // Handle multiple running measurements - match page display logic
                let lengths = '';
                let totalLength = 0;
                
                if (item.runningMeasurements && item.runningMeasurements.length > 0) {
                  // Include item-level runningLength first, then runningMeasurements array (matching page display)
                  const lengthStrings = [];
                  
                  // Add item-level runningLength if it exists
                  if (item.runningLength) {
                    lengthStrings.push(item.runningLength.toString());
                    totalLength += item.runningLength;
                  }
                  
                  // Add runningMeasurements array
                  item.runningMeasurements.forEach((m) => {
                    lengthStrings.push(m.length.toString());
                    totalLength += m.length;
                  });
                  
                  lengths = lengthStrings.join('\n');
                } else if (item.runningLength) {
                  lengths = item.runningLength.toString();
                  totalLength = item.runningLength;
                }

                const totalFeet = totalLength / 30.48;
                const amountPerFt = totalFeet > 0 ? item.totalAmount / totalFeet : 0;
                
                const row = [
                  combinedText,
                  lengths,
                  totalFeet.toFixed(1),
                  `Rs ${amountPerFt.toFixed(1)}`,
                  `Rs ${item.totalAmount.toFixed(1)}`
                ];
                
                return row;
              });

              return {
                head: [['Description', 'Length', 'Feet', 'Amount per ft', 'Total']],
                body: tableData,
                columnStyles: {
                  "0": { cellWidth: 70 },
                  "1": { cellWidth: 30 },
                  "2": { cellWidth: 25 },
                  "3": { cellWidth: 30 },
                  "4": { cellWidth: 25 }
                }
              };
            } else {
              throw new Error('Unknown item type for table structure');
            }
          };

          const tableStructure = getTableStructure(items);
          
          autoTable(doc, {
            startY: yPos,
            head: tableStructure.head,
            body: tableStructure.body,
            theme: 'grid',
            headStyles: {
              fillColor: [248, 250, 252],
              textColor: [0, 0, 0],
              fontStyle: 'bold'
            },
            bodyStyles: {
              fillColor: [255, 255, 255],
              textColor: [0, 0, 0]
            },
            styles: { fontSize: 8, cellPadding: 2 },
            margin: { left: 15, right: 15 },
            columnStyles: tableStructure.columnStyles,
            didDrawCell: function(data) {
              // Handle multi-line text in cells
              if (data.section === 'body') {
                if (data.column.index === 1) {
                  // Measurement/Length column - ensure proper line breaks
                  let cellValue = '';
                  if (Array.isArray(data.cell.text)) {
                    cellValue = data.cell.text.join('\n');
                  } else if (typeof data.cell.text === 'string') {
                    cellValue = data.cell.text;
                  } else if (data.cell.text !== null && data.cell.text !== undefined) {
                    cellValue = String(data.cell.text);
                  } else {
                    cellValue = '';
                  }
                  
                  // Split by newlines to ensure all measurements are shown
                  if (cellValue.includes('×') || cellValue.includes('\n')) {
                    const lines = cellValue.split('\n').filter(line => line.trim() !== '');
                    data.cell.text = lines;
                  }
                }
              }
            }
          });
          
          yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
        });
      });

      const subTotal = work.items.reduce((total, item) => {
        return total + parseFloat(item.totalAmount.toString() || '0');
      }, 0);

      if (pageEndY - yPos < 40) {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        yPos = 20;
      }

      doc.setDrawColor(189, 195, 199);
      doc.setLineWidth(0.5);
      doc.line(20, yPos, 190, yPos);
      yPos += 8;
      
      doc.setFontSize(10);
      doc.setTextColor(44, 62, 80);
      doc.setFont('helvetica', 'bold');
      doc.text(`Sub Total:`, 149, yPos);
      doc.text(`Rs ${subTotal.toFixed(2)}`, 191, yPos, { align: 'right' });
      
      if (work.discount && work.discount > 0) {
        yPos += 7;
        const discountAmount = work.discountType === 'percentage' 
          ? (subTotal * work.discount) / 100 
          : work.discount;
        doc.text(`Discount:`, 149, yPos);
        doc.text(`- Rs ${discountAmount.toFixed(2)}`, 191, yPos, { align: 'right' });
      }
      
      yPos += 7;
      doc.setFontSize(12);
      doc.text(`Grand Total:`, 135, yPos);
      doc.text(`Rs ${work.totalAmount.toFixed(2)}`, 191, yPos, { align: 'right' });

      yPos += 15;
      doc.setFillColor(0, 51, 102);
      doc.rect(10, yPos - 5, 190, 10, 'F');
      doc.setFontSize(12);
      doc.setTextColor(255, 255, 255);
      doc.text("Notes & Terms", 20, yPos);
      yPos += 12;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(44, 62, 80);

      const standardTerms = [
        "• Price includes materials, transport, labor and service",
        "• 50% payment needed upfront with order",
        "• 25% payment after basic structure work",
        "• Final 25% payment after finishing work",
        "• Extra work costs extra"
      ];

      standardTerms.forEach(term => {
        doc.text(term, 25, yPos);
        yPos += 7;
      });

      yPos += 12;
      doc.line(20, yPos, 80, yPos);
      doc.line(120, yPos, 180, yPos);
      yPos += 7;
      doc.setFontSize(10);
      doc.text("Customer Signature", 20, yPos);
      doc.text("For Takshaga", 120, yPos);

      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        doc.setFontSize(8);
        doc.setTextColor(44, 62, 80);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      const fileName = `${work.client.name.trim().replace(/\s+/g, '_')}_estimate.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'PDF Downloaded!',
        text: 'Your estimate has been downloaded successfully.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error("Error generating PDF:", error);
      Swal.fire({
        title: 'Error!',
        text: 'Failed to generate PDF',
        icon: 'error',
        confirmButtonText: 'OK'
      });
    }
  };

  const handleShareEstimate = (work: ApprovedWork) => {
    if (!work || !work.client) return;

    const message = `*Greetings from Takshaga Spatial Solutions*

Dear ${work.client.name},

Thank you for choosing *Takshaga Spatial Solutions* for your interior design project. We are pleased to present your detailed estimate.

*Estimate Summary:*
• Total Amount: ₹${work.totalAmount.toFixed(0)}
• Items Included: ${work.items.length} categories

*View Complete Estimate:*
${window.location.origin}/share/estimate/${work._id}

*Takshaga Spatial Solutions*
Interior Design & Construction
Address: 2nd Floor, Opp. Panchayat Building, Upputhara P.O, Idukki District, Kerala – 685505
Website: www.takshaga.com
Email: info@takshaga.com
Contact: Jinto Jose: +91 98466 60624
Contact: Saneesh: +91 9544344332

We look forward to bringing your vision to life!

*Thank you for your trust in our expertise.*`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading approved works...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Approved Works</h1>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Approved Works</h1>
            <p className="text-gray-600 mt-1">
              View all approved interior design projects
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {approvedWorks.length} Approved
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Approved</p>
                <p className="text-2xl font-bold text-gray-900">{approvedWorks.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{approvedWorks.reduce((sum, work) => sum + work.totalAmount, 0).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {approvedWorks.filter(work => {
                    const workDate = new Date(work.createdAt);
                    const now = new Date();
                    return workDate.getMonth() === now.getMonth() && workDate.getFullYear() === now.getFullYear();
                  }).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <User className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(approvedWorks.map(work => work.clientId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Approved Works List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Approved Projects</h2>
          </div>

          {approvedWorks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Approved Works Yet</h3>
              <p className="text-gray-600">Approved interior design projects will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {approvedWorks.map((work) => (
                <div
                  key={work._id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 relative"
                >
                  {/* Status and Date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Approved</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(work.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Client Information - Highlighted */}
                  {work.client && (
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-3">
                        <User className="h-5 w-5 text-blue-600" />
                        <h3 className="text-xl font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-lg">
                          {work.client.name}
                        </h3>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{work.client.email}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{work.client.phone}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-600">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{work.client.location}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Amount */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-green-600">
                      ₹{work.totalAmount.toLocaleString()}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewDetails(work._id)}
                      className="flex-1 flex items-center justify-center space-x-2 bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm cursor-pointer"
                    >
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </button>
                    
                    {/* Icon-only buttons */}
                    <button
                      onClick={() => handleViewEstimate(work._id)}
                      className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="View Estimate"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDownloadEstimate(work)}
                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Download Estimate"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    
                    <button
                      onClick={() => handleShareEstimate(work)}
                      className="p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                      title="Share Estimate"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 