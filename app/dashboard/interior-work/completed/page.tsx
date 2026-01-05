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
import { formatDateDDMMYYYY, formatDateForFileName } from '@/app/utils/dateFormat';

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

interface CompletedWork {
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

export default function CompletedWorksPage() {
  const router = useRouter();
  const [completedWorks, setCompletedWorks] = useState<CompletedWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompletedWorks = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/interior-estimates?status=completed');
        
        if (!response.ok) {
          throw new Error('Failed to fetch completed works');
        }
        
        const data = await response.json();
        const estimates = data.estimates || [];
        
        // Fetch client details for each estimate
        const estimatesWithClients = await Promise.all(
          estimates.map(async (estimate: CompletedWork) => {
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
        
        setCompletedWorks(estimatesWithClients);
      } catch (error) {
        console.error('Error fetching completed works:', error);
        setError('Failed to load completed works');
      } finally {
        setLoading(false);
      }
    };

    fetchCompletedWorks();
  }, []);

  const handleViewDetails = (workId: string) => {
    router.push(`/dashboard/interior-work/completed/${workId}/details`);
  };

  const handleViewEstimate = (workId: string) => {
    window.open(`/dashboard/estimates/interior/${workId}`, '_blank');
  };

  const handleDownloadEstimate = (work: CompletedWork) => {
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
      doc.text(`Date: ${formatDateDDMMYYYY(work.createdAt)}`, 15, 105);
      
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

      // Group items by section
      const groupedItems = work.items.reduce((acc, item) => {
        if (!acc[item.sectionName]) {
          acc[item.sectionName] = [];
        }
        acc[item.sectionName].push(item);
        return acc;
      }, {} as Record<string, Item[]>);

      // Process each section
      Object.entries(groupedItems).forEach(([sectionName, items]) => {
        // Check if we need a new page
        if (yPos + minSpaceNeeded > pageEndY) {
          doc.addPage();
          yPos = 20;
          
          // Add border to new page
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(5, 5, 200, 287);
        }

        // Add section header
        doc.setFillColor(240, 240, 240);
        doc.rect(5, yPos - 5, 200, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        doc.text(sectionName.toUpperCase(), 10, yPos);
        yPos += 15;

        // Group items by category within section
        const categoryGroups = items.reduce((acc, item) => {
          const categoryKey = `${item.categoryName} - ${item.subCategoryName}`;
          if (!acc[categoryKey]) {
            acc[categoryKey] = [];
          }
          acc[categoryKey].push(item);
          return acc;
        }, {} as Record<string, Item[]>);

        // Process each category
        Object.entries(categoryGroups).forEach(([categoryName, categoryItems]) => {
          // Check if we need a new page
          if (yPos + minSpaceNeeded > pageEndY) {
            doc.addPage();
            yPos = 20;
            
            // Add border to new page
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(5, 5, 200, 287);
          }

          // Add category header
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(categoryName, 10, yPos);
          yPos += 8;

          // Prepare table data for this category
          const tableData = categoryItems.map(item => {
            const description = item.description || `${item.materialName} - ${item.type}`;
            const measurements = item.measurements || [];
            const runningMeasurements = item.runningMeasurements || [];
            
            let details = '';
            if (item.type === 'area' && item.length && item.breadth) {
              details = `${item.length}' × ${item.breadth}' = ${(item.length * item.breadth).toFixed(2)} sq.ft`;
            } else if (item.type === 'pieces' && item.pieces) {
              details = `${item.pieces} pieces`;
            } else if (item.type === 'running' && item.runningLength) {
              details = `${item.runningLength}' running`;
            } else if (item.type === 'running_sq_feet' && runningMeasurements.length > 0) {
              const totalRunningLength = runningMeasurements.reduce((sum, m) => sum + m.length, 0);
              details = `${totalRunningLength.toFixed(2)} ft running`;
            } else if (measurements.length > 0) {
              const totalSqFt = measurements.reduce((sum, m) => sum + (m.length * m.breadth), 0);
              details = `${totalSqFt.toFixed(2)} sq.ft`;
            }

            return [
              description,
              details,
              `₹${item.totalAmount.toLocaleString()}`
            ];
          });

          // Add table for this category
          autoTable(doc, {
            startY: yPos,
            head: [['Description', 'Details', 'Amount']],
            body: tableData,
            theme: 'grid',
            headStyles: {
              fillColor: [0, 51, 102],
              textColor: 255,
              fontStyle: 'bold',
              fontSize: 9
            },
            bodyStyles: {
              fontSize: 8,
              textColor: 0
            },
            columnStyles: {
              0: { cellWidth: 80 },
              1: { cellWidth: 50 },
              2: { cellWidth: 30, halign: 'right' }
            },
            margin: { left: 10, right: 10 }
          });

          yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
        });

        yPos += categorySpacing;
      });

      // Add total section
      if (yPos + 30 > pageEndY) {
        doc.addPage();
        yPos = 20;
        
        // Add border to new page
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
      }

      // Calculate totals
      const subtotal = work.items.reduce((sum, item) => sum + item.totalAmount, 0);
      const discount = work.discount || 0;
      const discountAmount = work.discountType === 'percentage' ? (subtotal * discount / 100) : discount;
      const total = subtotal - discountAmount;

      // Add totals table
      autoTable(doc, {
        startY: yPos,
        body: [
          ['Subtotal', `₹${subtotal.toLocaleString()}`],
          ['Discount', `₹${discountAmount.toLocaleString()}`],
          ['Total', `₹${total.toLocaleString()}`]
        ],
        theme: 'plain',
        bodyStyles: {
          fontSize: 10,
          textColor: 0
        },
        columnStyles: {
          0: { cellWidth: 120, fontStyle: 'bold' },
          1: { cellWidth: 50, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: 10, right: 10 }
      });

      // Save the PDF
      const fileName = `Estimate_${work.client.name.replace(/\s+/g, '_')}_${formatDateForFileName(work.createdAt)}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Estimate Downloaded',
        text: 'Your estimate has been downloaded successfully.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });

    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to generate estimate PDF.',
      });
    }
  };

  const handleShareEstimate = (work: CompletedWork) => {
    if (!work || !work.client) return;

    const estimateUrl = `${window.location.origin}/dashboard/estimates/interior/${work._id}`;
    const message = `Check out this completed interior design estimate for ${work.client.name}!\n\nProject Value: ₹${work.totalAmount.toLocaleString()}\n\nView Estimate: ${estimateUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    Swal.fire({
      icon: 'success',
      title: 'Estimate Shared',
      text: 'Estimate has been shared via WhatsApp.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 3000
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading completed works...</span>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Completed Works</h1>
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
            <h1 className="text-3xl font-bold text-gray-900">Completed Works</h1>
            <p className="text-gray-600 mt-1">
              View all completed interior design projects
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              {completedWorks.length} Completed
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Completed</p>
                <p className="text-2xl font-bold text-gray-900">{completedWorks.length}</p>
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
                  ₹{completedWorks.reduce((sum, work) => sum + work.totalAmount, 0).toLocaleString()}
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
                  {completedWorks.filter(work => {
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
                <p className="text-sm font-medium text-gray-600">Satisfied Clients</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(completedWorks.map(work => work.clientId)).size}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Completed Works List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Completed Projects</h2>
          </div>

          {completedWorks.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Completed Works Yet</h3>
              <p className="text-gray-600">Completed interior design projects will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedWorks.map((work) => (
                <div
                  key={work._id}
                  className="bg-gray-50 rounded-xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-200 relative"
                >
                  {/* Status and Date */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm font-medium text-green-700">Completed</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDateDDMMYYYY(work.createdAt)}
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