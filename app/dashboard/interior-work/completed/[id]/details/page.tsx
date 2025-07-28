"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  User,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  Plus,
  Download,
  Share2,
  FileText,
  Play,
  TrendingUp
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
  measurements?: any[];
  pieces?: number;
  runningLength?: number;
  runningMeasurements?: any[];
  description: string;
  totalAmount: number;
}

interface Estimate {
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

interface Stage {
  _id: string;
  userId: string;
  clientId: string;
  stageDesc: string;
  date: string;
  createdAt: string;
}

interface InteriorIncome {
  _id: string;
  userId: string;
  clientId: string;
  amount: number;
  status: 'pending' | 'completed';
  method: 'cash' | 'bank' | null;
  markedBy?: string;
  date: string;
  createdAt: string;
}

interface Expense {
  _id: string;
  userId: string;
  clientId: string;
  category: 'material' | 'labour' | 'other';
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function CompletedWorkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [interiorIncomes, setInteriorIncomes] = useState<InteriorIncome[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workStarted, setWorkStarted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch estimate details
        const estimateResponse = await fetch(`/api/interior-estimates/${estimateId}`);
        if (!estimateResponse.ok) {
          throw new Error('Failed to fetch estimate details');
        }
        const estimateData = await estimateResponse.json();
        setEstimate(estimateData.estimate);

        // Fetch client details
        if (estimateData.estimate.clientId) {
          const clientResponse = await fetch(`/api/clients/${estimateData.estimate.clientId}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setEstimate(prev => prev ? { ...prev, client: clientData.client } : null);
          }
        }

        // Fetch stages
        const stagesResponse = await fetch(`/api/stages?clientId=${estimateData.estimate.clientId}`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          setStages(stagesData.stages || []);
          setWorkStarted(stagesData.stages?.some((stage: Stage) => stage && stage.stageDesc === 'Work Started') || false);
        }

        // Fetch interior incomes
        const incomesResponse = await fetch(`/api/interior-income?clientId=${estimateData.estimate.clientId}`);
        if (incomesResponse.ok) {
          const incomesData = await incomesResponse.json();
          setInteriorIncomes(incomesData.interiorIncomes || []);
        }

        // Fetch expenses
        const expensesResponse = await fetch(`/api/expenses?clientId=${estimateData.estimate.clientId}`);
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData.expenses || []);
        }

      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load work details');
      } finally {
        setLoading(false);
      }
    };

    if (estimateId) {
      fetchData();
    }
  }, [estimateId]);

  const refetchStages = async () => {
    if (!estimate?.clientId) return;
    
    try {
      const response = await fetch(`/api/stages?clientId=${estimate.clientId}`);
      if (response.ok) {
        const data = await response.json();
        setStages(data.stages || []);
        setWorkStarted(data.stages?.some((stage: Stage) => stage && stage.stageDesc === 'Work Started') || false);
      }
    } catch (error) {
      console.error('Error refetching stages:', error);
    }
  };

  const refetchInteriorIncomes = async () => {
    if (!estimate?.clientId) return;
    
    try {
      const response = await fetch(`/api/interior-income?clientId=${estimate.clientId}`);
      if (response.ok) {
        const data = await response.json();
        setInteriorIncomes(data.interiorIncomes || []);
      }
    } catch (error) {
      console.error('Error refetching interior incomes:', error);
    }
  };

  const handleBackToCompletedWorks = () => {
    router.push('/dashboard/interior-work/completed');
  };

  const handleViewEstimate = () => {
    window.open(`/dashboard/estimates/interior/${estimateId}`, '_blank');
  };

  const handleDownloadEstimate = () => {
    if (!estimate || !estimate.client) return;

    try {
      const doc = new jsPDF();
      
      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142);
      doc.rect(5, 45, 200, 20, 'F');
      
      // Company details
      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", 15, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", 15, 30);
      doc.text("Upputhara P.O, Idukki District", 15, 35);
      doc.text("Kerala – 685505, India", 15, 40);

      // Logo
      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found, continuing without logo');
      }

      // Contact details
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'normal');
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });
      
      // Estimate details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 45, 2, 2, 'F');
      
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("ESTIMATE DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Estimate No: EST-${new Date(estimate.createdAt).getFullYear()}-${String(estimate._id).slice(-6).toUpperCase()}`, 15, 95);
      doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 15, 105);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("BILL TO", 110, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(estimate.client.name, 110, 95);
      doc.text(estimate.client.location || "", 110, 105);
      
      // ESTIMATE heading
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
      const groupedItems = estimate.items.reduce((acc, item) => {
        if (!acc[item.sectionName]) {
          acc[item.sectionName] = [];
        }
        acc[item.sectionName].push(item);
        return acc;
      }, {} as Record<string, Item[]>);

      // Process each section
      Object.entries(groupedItems).forEach(([sectionName, items]) => {
        if (yPos + minSpaceNeeded > pageEndY) {
          doc.addPage();
          yPos = 20;
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(5, 5, 200, 287);
        }

        // Section header
        doc.setFillColor(240, 240, 240);
        doc.rect(5, yPos - 5, 200, 8, 'F');
        doc.setFontSize(12);
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        doc.text(sectionName.toUpperCase(), 10, yPos);
        yPos += 15;

        // Group items by category
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
          if (yPos + minSpaceNeeded > pageEndY) {
            doc.addPage();
            yPos = 20;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.rect(5, 5, 200, 287);
          }

          // Category header
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'bold');
          doc.text(categoryName, 10, yPos);
          yPos += 8;

          // Table data
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
              const totalSqFt = runningMeasurements.reduce((sum, m) => sum + (m.length * m.breadth), 0);
              details = `${totalSqFt.toFixed(2)} sq.ft running`;
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

          // Add table
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

          yPos = (doc as any).lastAutoTable.finalY + 10;
        });

        yPos += categorySpacing;
      });

      // Add totals
      if (yPos + 30 > pageEndY) {
        doc.addPage();
        yPos = 20;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
      }

      const subtotal = estimate.items.reduce((sum, item) => sum + item.totalAmount, 0);
      const discount = estimate.discount || 0;
      const discountAmount = estimate.discountType === 'percentage' ? (subtotal * discount / 100) : discount;
      const total = subtotal - discountAmount;

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

      const fileName = `Completed_Estimate_${estimate.client.name.replace(/\s+/g, '_')}_${new Date(estimate.createdAt).toLocaleDateString().replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Estimate Downloaded',
        text: 'Your completed work estimate has been downloaded successfully.',
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

  const handleShareEstimate = () => {
    if (!estimate || !estimate.client) return;

    const estimateUrl = `${window.location.origin}/dashboard/estimates/interior/${estimateId}`;
    const message = `Check out this completed interior design project for ${estimate.client.name}!\n\nProject Value: ₹${estimate.totalAmount.toLocaleString()}\nStatus: Completed\n\nView Estimate: ${estimateUrl}`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    Swal.fire({
      icon: 'success',
      title: 'Estimate Shared',
      text: 'Completed work estimate has been shared via WhatsApp.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleClientReport = () => {
    Swal.fire({
      icon: 'info',
      title: 'Client Report',
      text: 'Client report generation functionality will be implemented here.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 3000
    });
  };

  const handleOfficeReport = () => {
    Swal.fire({
      icon: 'info',
      title: 'Office Report',
      text: 'Office report generation functionality will be implemented here.',
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
          <span className="ml-4 text-gray-600">Loading completed work details...</span>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Completed Work</h1>
              <p className="text-gray-600 mb-6">{error || 'Work not found'}</p>
              <button
                onClick={handleBackToCompletedWorks}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Completed Works
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate financial summary
  const completedPayments = interiorIncomes.filter(income => income && income.status === 'completed');
  const pendingPayments = interiorIncomes.filter(income => income && income.status === 'pending');
  const totalReceived = completedPayments.reduce((sum, income) => sum + (income?.amount || 0), 0);
  const totalPending = pendingPayments.reduce((sum, income) => sum + (income?.amount || 0), 0);
  const balanceAmount = estimate.totalAmount - totalReceived;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToCompletedWorks}
              className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Completed Work Details</h1>
              <p className="text-gray-600 mt-1">
                Project completed successfully
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handleViewEstimate}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>View Estimate</span>
            </button>
            
            <button
              onClick={handleDownloadEstimate}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download</span>
            </button>
            
            <button
              onClick={handleShareEstimate}
              className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Share2 className="h-4 w-4" />
              <span>Share</span>
            </button>

            <button
              onClick={handleClientReport}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <User className="h-4 w-4" />
              <span>Client Report</span>
            </button>

            <button
              onClick={handleOfficeReport}
              className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FileText className="h-4 w-4" />
              <span>Office Report</span>
            </button>
          </div>
        </div>

        {/* Project Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Project Overview</h2>
            <div className="flex items-center space-x-2">
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                Completed
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Project Value */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-purple-700 bg-purple-100 px-2 py-1 rounded-full">
                  Project Value
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Project Value</p>
                <p className="text-2xl font-bold text-purple-600">
                  ₹{estimate.totalAmount.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Original estimate amount
                </p>
              </div>
            </div>

            {/* Amount Received */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  Received
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Amount Received</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{totalReceived.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {completedPayments.length} payment{completedPayments.length !== 1 ? 's' : ''} received
                </p>
              </div>
            </div>

            {/* Total Expenses */}
            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="h-6 w-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-orange-700 bg-orange-100 px-2 py-1 rounded-full">
                  Expenses
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Expenses</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
                </p>
              </div>
            </div>

            {/* Net Profit */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  Net Profit
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Project Profit</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{(totalReceived - expenses.reduce((sum, expense) => sum + expense.amount, 0)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Revenue - Expenses
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Payment Progress */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Amount Received</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round((totalReceived / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((totalReceived / estimate.totalAmount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Expenses</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round((expenses.reduce((sum, expense) => sum + expense.amount, 0) / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((expenses.reduce((sum, expense) => sum + expense.amount, 0) / estimate.totalAmount) * 100, 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Analytics */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Method Analytics</h4>
              <div className="space-y-4">
                {/* Bank Payments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Bank Amount</span>
                    <span className="text-sm font-medium text-gray-700">
                      ₹{interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${totalReceived > 0 ? (interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').reduce((sum, income) => sum + (income?.amount || 0), 0) / totalReceived) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Cash Payments */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Cash Amount</span>
                    <span className="text-sm font-medium text-gray-700">
                      ₹{interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${totalReceived > 0 ? (interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').reduce((sum, income) => sum + (income?.amount || 0), 0) / totalReceived) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Payment Distribution */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Completed Payments</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{totalReceived.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-500">Bank: {interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').length} payments</span>
                    <span className="text-xs text-gray-500">Cash: {interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').length} payments</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stage Details and Payment Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Project Timeline</h2>
                  <p className="text-sm text-gray-600">Complete project journey</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  Completed
                </div>
              </div>
            </div>

            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>
              
              <div className="space-y-6">
                {stages.filter(stage => stage).map((stage, index) => (
                  <div key={stage._id} className="relative flex items-start space-x-6">
                    {/* Timeline Dot */}
                    <div className="flex-shrink-0 relative">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                        <CheckCircle className="h-6 w-6 text-white" />
                      </div>
                      {index < stages.length - 1 && (
                        <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-green-500 to-emerald-500"></div>
                      )}
                    </div>
                    
                    {/* Content Card */}
                    <div className="flex-1 bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-lg font-semibold text-gray-900">{stage.stageDesc}</h4>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                          Completed
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(stage.date).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>{new Date(stage.date).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Payment Details</h2>
                  <p className="text-sm text-gray-600">Transaction history & status</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {completedPayments.length} Paid
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              {interiorIncomes.filter(income => income).map((income, index) => (
                <div key={income._id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        income.status === 'completed' 
                          ? 'bg-green-500' 
                          : 'bg-yellow-500'
                      }`}></div>
                      <h3 className="text-lg font-semibold text-gray-900">Phase {index + 1}</h3>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      income.status === 'completed' 
                        ? 'bg-green-100 text-green-800 border border-green-200' 
                        : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {income.status === 'completed' ? '✓ Paid' : '⏳ Pending'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Amount</span>
                        <span className="text-lg font-bold text-gray-900">₹{income.amount.toLocaleString()}</span>
                      </div>
                    </div>
                    
                    {income.status === 'completed' && (
                      <>
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Method</span>
                            <span className="text-sm font-semibold text-gray-900 capitalize">{income.method}</span>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-4 border border-gray-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Marked by</span>
                            <span className="text-sm font-semibold text-gray-900">{income.markedBy?.split('@')[0] || 'Unknown'}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    <div className="bg-white rounded-lg p-4 border border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-600">Date</span>
                        <span className="text-sm font-semibold text-gray-900">{new Date(income.date).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Expenses Details</h2>
                <p className="text-sm text-gray-600">Project cost breakdown</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
              </div>
            </div>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No Expenses Recorded</h4>
              <p className="text-gray-600">No expense information available for this project.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Category-wise grouping */}
              {['material', 'labour', 'other'].map(category => {
                const categoryExpenses = expenses.filter(expense => expense.category === category);
                if (categoryExpenses.length === 0) return null;

                const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                const categoryConfig = {
                  material: {
                    color: 'from-blue-500 to-indigo-500',
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    textColor: 'text-blue-800',
                    icon: '🔧'
                  },
                  labour: {
                    color: 'from-green-500 to-emerald-500',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    textColor: 'text-green-800',
                    icon: '👷'
                  },
                  other: {
                    color: 'from-purple-500 to-pink-500',
                    bgColor: 'bg-purple-50',
                    borderColor: 'border-purple-200',
                    textColor: 'text-purple-800',
                    icon: '📋'
                  }
                }[category];

                return (
                  <div key={category} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 bg-gradient-to-r ${categoryConfig.color} rounded-lg`}>
                          <span className="text-white text-lg">{categoryConfig.icon}</span>
                        </div>
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">{category} Expenses</h4>
                          <p className="text-sm text-gray-600">{categoryExpenses.length} expense{categoryExpenses.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${categoryConfig.bgColor} ${categoryConfig.borderColor} ${categoryConfig.textColor}`}>
                        ₹{categoryTotal.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {categoryExpenses.map(expense => (
                        <div key={expense._id} className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h5 className="font-semibold text-gray-900 mb-1">{expense.notes || 'No notes'}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-600">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>{new Date(expense.date).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                  })}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <User className="h-4 w-4" />
                                  <span>{expense.addedBy}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-gray-900">₹{expense.amount.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Total Expenses Summary */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">Total Expenses</h4>
                      <p className="text-sm text-gray-600">Complete project cost</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-red-600">
                      ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 