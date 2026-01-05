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
  Download,
  Share2,
  FileText,
  TrendingUp
} from "lucide-react";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

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

interface Bank {
  _id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
  upiId: string;
}

export default function CompletedWorkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [interiorIncomes, setInteriorIncomes] = useState<InteriorIncome[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


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

        // Fetch banks
        const banksResponse = await fetch('/api/banks');
        if (banksResponse.ok) {
          const banksData = await banksResponse.json();
          setBanks(banksData.banks || []);
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

          yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
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

  const handleDownloadAllPaymentsReceipt = async () => {
    const completedPayments = interiorIncomes.filter(income => income && income.status === 'completed');
    
    if (completedPayments.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Payments',
        text: 'There are no completed payments to generate a receipt.',
        confirmButtonText: 'OK'
      });
      return;
    }

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
      
      // Add professional receipt details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 45, 2, 2, 'F');
      
      // Add receipt details on left in a structured format
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("RECEIPT DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt No: RCP-ALL-${new Date().getFullYear()}-${String(estimate?._id || '').slice(-6).toUpperCase()}`, 15, 95);
      doc.text(`Date: ${new Date().toLocaleDateString()}`, 15, 105);
      doc.text(`Total Payments: ${completedPayments.length}`, 15, 115);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("PAID BY", 110, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (estimate?.client) {
        doc.text(estimate.client.name, 110, 95);
        doc.text(estimate.client.location || "", 110, 105);
        doc.text(estimate.client.phone || "", 110, 115);
      }
      
      // PAYMENT RECEIPT heading
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 130, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("PAYMENT RECEIPT - ALL PAYMENTS", 105, 138, { align: "center" });

      // Payment Details Table
      let yPos = 150;
      const totalProjectAmount = estimate?.totalAmount || 0;
      const totalAmountPaid = completedPayments.reduce((sum, inc) => sum + (inc?.amount || 0), 0);
      const balanceAmount = totalProjectAmount - totalAmountPaid;

      // Create table body with all payments
      const tableBody = completedPayments.map((income, index) => [
        `Phase ${interiorIncomes.indexOf(income) + 1} Payment`,
        `Rs. ${income.amount.toLocaleString()}`
      ]);

      // Add summary rows
      tableBody.push(['Total Project Amount', `Rs. ${totalProjectAmount.toLocaleString()}`]);
      tableBody.push(['Total Amount Paid', `Rs. ${totalAmountPaid.toLocaleString()}`]);
      tableBody.push(['Balance Amount', `Rs. ${balanceAmount.toLocaleString()}`]);

      // Create professional table for payment details
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Amount']],
        body: tableBody,
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9,
          textColor: 0
        },
        columnStyles: {
          0: { cellWidth: 100, fontStyle: 'bold' },
          1: { cellWidth: 90, halign: 'right' }
        },
        margin: { left: 10, right: 10 },
        didDrawPage: (data) => {
          // Add border on each page
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(5, 5, 200, 287);
        }
      });

      yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Check if we need a new page for footer
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
      }

      // Footer
      const footerY = Math.max(yPos + 10, 260);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text('Thank you for your payment!', 105, footerY, { align: 'center' });
      
      // Computer generated receipt notice at the bottom
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer generated receipt, no signature required.', 105, 285, { align: 'center' });
      
      const fileName = `Receipt_All_Payments_${estimate?.client?.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Receipt Downloaded',
        text: 'Your consolidated receipt with all payments has been downloaded successfully.',
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
        text: 'Failed to generate receipt PDF.',
      });
    }
  };

  const handleDownloadReceipt = async (income: InteriorIncome) => {
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
      
      // Add professional receipt details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 45, 2, 2, 'F');
      
      // Add receipt details on left in a structured format
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("RECEIPT DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Receipt No: RCP-${new Date().getFullYear()}-${String(income._id).slice(-6).toUpperCase()}`, 15, 95);
      doc.text(`Date: ${new Date(income.date).toLocaleDateString()}`, 15, 105);
      doc.text(`Payment Phase: Phase ${interiorIncomes.indexOf(income) + 1}`, 15, 115);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("PAID BY", 110, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (estimate?.client) {
        doc.text(estimate.client.name, 110, 95);
        doc.text(estimate.client.location || "", 110, 105);
        doc.text(estimate.client.phone || "", 110, 115);
      }
      
      // PAYMENT RECEIPT heading
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 130, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("PAYMENT RECEIPT", 105, 138, { align: "center" });

      // Payment Details Table
      let yPos = 150;
      const phaseNumber = interiorIncomes.indexOf(income) + 1;
      
      // Calculate totals
      const totalProjectAmount = estimate?.totalAmount || 0;
      const totalAmountPaid = interiorIncomes
        .filter(inc => inc && inc.status === 'completed')
        .reduce((sum, inc) => sum + (inc?.amount || 0), 0);
      const balanceAmount = totalProjectAmount - totalAmountPaid;

      // Create professional table for payment details
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Amount']],
        body: [
          [`Phase ${phaseNumber} Payment`, `Rs. ${income.amount.toLocaleString()}`],
          ['Total Project Amount', `Rs. ${totalProjectAmount.toLocaleString()}`],
          ['Total Amount Paid', `Rs. ${totalAmountPaid.toLocaleString()}`],
          ['Balance Amount', `Rs. ${balanceAmount.toLocaleString()}`]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 10,
          textColor: 0
        },
        columnStyles: {
          0: { cellWidth: 100, fontStyle: 'bold' },
          1: { cellWidth: 90, halign: 'right' }
        },
        margin: { left: 10, right: 10 }
      });

      yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Payment Method Section
      const paymentMethod = income.method || 'cash';
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Payment Method:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), 15, yPos + 10);
      
      yPos += 25;

      // Bank Details (only show if payment method is bank)
      if (paymentMethod === 'bank' && banks.length > 0) {
        const selectedBank = banks[0]; // Use first bank
        doc.setFillColor(240, 240, 240);
        doc.rect(5, yPos, 200, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(0, 51, 102);
        doc.setFont('helvetica', 'bold');
        doc.text("BANK DETAILS", 10, yPos + 5);
        
        const bankYPos = yPos + 10;
        const bankData = [
          ['Bank Name', selectedBank.bankName],
          ['Account Name', selectedBank.accountName],
          ['Account Number', selectedBank.accountNumber],
          ['IFSC Code', selectedBank.ifscCode],
          ['UPI ID', selectedBank.upiId]
        ];

        autoTable(doc, {
          startY: bankYPos,
          body: bankData,
          theme: 'grid',
          bodyStyles: {
            fontSize: 7,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 60, fontStyle: 'bold' },
            1: { cellWidth: 130 }
          },
          margin: { left: 10, right: 10 }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Footer
      const footerY = Math.max(yPos + 10, 260);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text('Thank you for your payment!', 105, footerY, { align: 'center' });
      
      // Computer generated receipt notice at the bottom
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer generated receipt, no signature required.', 105, 285, { align: 'center' });
      
      const fileName = `Receipt_Phase_${phaseNumber}_${estimate?.client?.name?.replace(/\s+/g, '_') || 'client'}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Receipt Downloaded',
        text: 'Your receipt has been downloaded successfully.',
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
        text: 'Failed to generate receipt PDF.',
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
    if (!estimate || !estimate.client) {
    Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Cannot generate report. Project information is missing.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = 210;
      const rightMargin = 15;
      const leftMargin = 15;

      // Helper function to add new page with border
      const addPageWithBorder = () => {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        yPos = 20;
      };

      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);

      // Header
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142);
      doc.rect(5, 45, 200, 20, 'F');

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", leftMargin, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", leftMargin, 30);
      doc.text("Upputhara P.O, Idukki District", leftMargin, 35);
      doc.text("Kerala – 685505, India", leftMargin, 40);

      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found');
      }

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });

      // CLIENT REPORT heading
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 75, 200, 12, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("CLIENT REPORT", 105, 83, { align: "center" });

      yPos = 100;

      // Project Information
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, yPos, 200, 35, 2, 2, 'F');
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("PROJECT INFORMATION", leftMargin, yPos + 8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${estimate.estimateName}`, leftMargin, yPos + 16);
      doc.text(`Client: ${estimate.client.name}`, leftMargin, yPos + 23);
      doc.text(`Total Project Value: Rs. ${estimate.totalAmount.toLocaleString()}`, leftMargin, yPos + 30);
      yPos += 45;

      // Payment Phases
      const completedPayments = interiorIncomes.filter(income => income && income.status === 'completed');
      if (completedPayments.length > 0) {
        if (yPos + 50 > 280) addPageWithBorder();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("PAYMENT PHASES", leftMargin, yPos);
        yPos += 10;

        const paymentData = completedPayments.map((income, index) => [
          `Phase ${interiorIncomes.indexOf(income) + 1}`,
          new Date(income.date).toLocaleDateString(),
          `Rs. ${income.amount.toLocaleString()}`,
          income.method ? income.method.charAt(0).toUpperCase() + income.method.slice(1) : 'N/A'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Phase', 'Date', 'Amount', 'Method']],
          body: paymentData,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 51, 102],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 50 },
            2: { cellWidth: 50, halign: 'right' },
            3: { cellWidth: 40 }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

        // Payment Summary
        const totalPaid = completedPayments.reduce((sum, inc) => sum + (inc?.amount || 0), 0);
        autoTable(doc, {
          startY: yPos,
          body: [
            ['Total Amount Paid', `Rs. ${totalPaid.toLocaleString()}`],
            ['Balance Amount', `Rs. ${(estimate.totalAmount - totalPaid).toLocaleString()}`]
          ],
          theme: 'plain',
          bodyStyles: {
            fontSize: 10,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Project Stages
      if (stages.length > 0) {
        if (yPos + 50 > 280) addPageWithBorder();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("PROJECT STAGES", leftMargin, yPos);
        yPos += 10;

        const stagesData = stages.map((stage, index) => [
          index + 1,
          stage.stageDesc,
          new Date(stage.date).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Stage Description', 'Date']],
          body: stagesData,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 51, 102],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 120 },
            2: { cellWidth: 45 }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Footer
      if (yPos > 270) addPageWithBorder();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text('This report is generated for client reference.', 105, 280, { align: 'center' });

      const fileName = `Client_Report_${estimate.client.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Client Report Downloaded',
        text: 'Client report has been downloaded successfully.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 3000
    });
    } catch (error) {
      console.error('Error generating client report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to generate client report.',
      });
    }
  };

  const handleOfficeReport = () => {
    if (!estimate || !estimate.client) {
    Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Cannot generate report. Project information is missing.',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      let yPos = 20;
      const pageWidth = 210;
      const rightMargin = 15;
      const leftMargin = 15;

      // Helper function to add new page with border
      const addPageWithBorder = () => {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        yPos = 20;
      };

      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);

      // Header
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 5, 200, 45, 'F');
      doc.setFillColor(0, 71, 142);
      doc.rect(5, 45, 200, 20, 'F');

      doc.setFontSize(18);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("Takshaga Spatial Solutions", leftMargin, 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", leftMargin, 30);
      doc.text("Upputhara P.O, Idukki District", leftMargin, 35);
      doc.text("Kerala – 685505, India", leftMargin, 40);

      const logoUrl = '/logo.png';
      try {
        doc.addImage(logoUrl, 'PNG', 155, 8, 50, 50);
      } catch {
        console.log('Logo not found');
      }

      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("Website: www.takshaga.com", 105, 52, { align: 'center' });
      doc.text("Email: info@takshaga.com", 105, 57, { align: 'center' });
      doc.text("+91 98466 60624 | +91 95443 44332", 105, 62, { align: 'center' });

      // OFFICE REPORT heading
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 75, 200, 12, 'F');
      doc.setFontSize(16);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("OFFICE REPORT - CONFIDENTIAL", 105, 83, { align: "center" });

      yPos = 100;

      // Project Information
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, yPos, 200, 40, 2, 2, 'F');
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("PROJECT INFORMATION", leftMargin, yPos + 8);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Project: ${estimate.estimateName}`, leftMargin, yPos + 16);
      doc.text(`Client: ${estimate.client.name}`, leftMargin, yPos + 23);
      doc.text(`Client Location: ${estimate.client.location}`, leftMargin, yPos + 30);
      doc.text(`Total Project Value: Rs. ${estimate.totalAmount.toLocaleString()}`, leftMargin, yPos + 37);
      yPos += 50;

      // Financial Summary
      const completedPayments = interiorIncomes.filter(income => income && income.status === 'completed');
      const totalReceived = completedPayments.reduce((sum, inc) => sum + (inc?.amount || 0), 0);
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const netProfit = totalReceived - totalExpenses;
      const profitMargin = totalReceived > 0 ? ((netProfit / totalReceived) * 100).toFixed(2) : '0.00';

      if (yPos + 40 > 280) addPageWithBorder();

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 51, 102);
      doc.text("FINANCIAL SUMMARY", leftMargin, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        body: [
          ['Total Project Value', `Rs. ${estimate.totalAmount.toLocaleString()}`],
          ['Total Amount Received', `Rs. ${totalReceived.toLocaleString()}`],
          ['Total Expenses', `Rs. ${totalExpenses.toLocaleString()}`],
          ['Net Profit', `Rs. ${netProfit.toLocaleString()}`],
          ['Profit Margin', `${profitMargin}%`]
        ],
        theme: 'grid',
        headStyles: {
          fillColor: [0, 51, 102],
          textColor: 255,
          fontStyle: 'bold',
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 10,
          textColor: 0
        },
        columnStyles: {
          0: { cellWidth: 100, fontStyle: 'bold' },
          1: { cellWidth: 90, halign: 'right', fontStyle: 'bold' }
        },
        margin: { left: leftMargin, right: rightMargin }
      });

      yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;

      // Payment Phases
      if (interiorIncomes.length > 0) {
        if (yPos + 50 > 280) addPageWithBorder();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("PAYMENT PHASES", leftMargin, yPos);
        yPos += 10;

        const paymentData = interiorIncomes.map((income, index) => [
          `Phase ${index + 1}`,
          new Date(income.date).toLocaleDateString(),
          `Rs. ${income.amount.toLocaleString()}`,
          income.status === 'completed' ? 'Completed' : 'Pending',
          income.method ? income.method.charAt(0).toUpperCase() + income.method.slice(1) : 'N/A',
          income.markedBy ? income.markedBy.split('@')[0] : 'N/A'
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['Phase', 'Date', 'Amount', 'Status', 'Method', 'Marked By']],
          body: paymentData,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 51, 102],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 8,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 25 },
            1: { cellWidth: 40 },
            2: { cellWidth: 40, halign: 'right' },
            3: { cellWidth: 35 },
            4: { cellWidth: 30 },
            5: { cellWidth: 30 }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Expenses Breakdown
      if (expenses.length > 0) {
        if (yPos + 60 > 280) addPageWithBorder();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("EXPENSES BREAKDOWN", leftMargin, yPos);
        yPos += 10;

        // Group by category
        const materialExpenses = expenses.filter(e => e.category === 'material');
        const labourExpenses = expenses.filter(e => e.category === 'labour');
        const otherExpenses = expenses.filter(e => e.category === 'other');

        const expensesData = [
          ...materialExpenses.map(exp => ['Material', exp.notes || 'No notes', new Date(exp.date).toLocaleDateString(), `Rs. ${exp.amount.toLocaleString()}`, exp.addedBy]),
          ...labourExpenses.map(exp => ['Labour', exp.notes || 'No notes', new Date(exp.date).toLocaleDateString(), `Rs. ${exp.amount.toLocaleString()}`, exp.addedBy]),
          ...otherExpenses.map(exp => ['Other', exp.notes || 'No notes', new Date(exp.date).toLocaleDateString(), `Rs. ${exp.amount.toLocaleString()}`, exp.addedBy])
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Category', 'Description', 'Date', 'Amount', 'Added By']],
          body: expensesData,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 51, 102],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8
          },
          bodyStyles: {
            fontSize: 8,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 30 },
            1: { cellWidth: 60 },
            2: { cellWidth: 35 },
            3: { cellWidth: 35, halign: 'right' },
            4: { cellWidth: 40 }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

        // Expenses Summary
        const materialTotal = materialExpenses.reduce((sum, e) => sum + e.amount, 0);
        const labourTotal = labourExpenses.reduce((sum, e) => sum + e.amount, 0);
        const otherTotal = otherExpenses.reduce((sum, e) => sum + e.amount, 0);

        autoTable(doc, {
          startY: yPos,
          body: [
            ['Material Expenses', `Rs. ${materialTotal.toLocaleString()}`],
            ['Labour Expenses', `Rs. ${labourTotal.toLocaleString()}`],
            ['Other Expenses', `Rs. ${otherTotal.toLocaleString()}`],
            ['Total Expenses', `Rs. ${totalExpenses.toLocaleString()}`]
          ],
          theme: 'plain',
          bodyStyles: {
            fontSize: 9,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 100, fontStyle: 'bold' },
            1: { cellWidth: 80, halign: 'right', fontStyle: 'bold' }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Project Stages
      if (stages.length > 0) {
        if (yPos + 50 > 280) addPageWithBorder();

        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 51, 102);
        doc.text("PROJECT STAGES", leftMargin, yPos);
        yPos += 10;

        const stagesData = stages.map((stage, index) => [
          index + 1,
          stage.stageDesc,
          new Date(stage.date).toLocaleDateString()
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['#', 'Stage Description', 'Date']],
          body: stagesData,
          theme: 'grid',
          headStyles: {
            fillColor: [0, 51, 102],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 9
          },
          bodyStyles: {
            fontSize: 9,
            textColor: 0
          },
          columnStyles: {
            0: { cellWidth: 15 },
            1: { cellWidth: 120 },
            2: { cellWidth: 45 }
          },
          margin: { left: leftMargin, right: rightMargin }
        });

        yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15;
      }

      // Footer
      if (yPos > 270) addPageWithBorder();
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 0, 0);
      doc.text('CONFIDENTIAL - FOR OFFICE USE ONLY', 105, 275, { align: 'center' });
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('This report contains sensitive financial information and should not be shared with clients.', 105, 280, { align: 'center' });

      const fileName = `Office_Report_${estimate.client.name.replace(/\s+/g, '_')}_${new Date().toLocaleDateString().replace(/\//g, '-')}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Office Report Downloaded',
        text: 'Office report has been downloaded successfully.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 3000
    });
    } catch (error) {
      console.error('Error generating office report:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to generate office report.',
      });
    }
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
  const totalReceived = completedPayments.reduce((sum, income) => sum + (income?.amount || 0), 0);

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
                <button
                  onClick={handleDownloadAllPaymentsReceipt}
                  className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  title="Download All Payments Receipt"
                >
                  <Download className="h-5 w-5" />
                </button>
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

                  {income.status === 'completed' && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={() => handleDownloadReceipt(income)}
                        className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                      >
                        <Download className="h-4 w-4" />
                        <span>Download Receipt</span>
                      </button>
                    </div>
                  )}
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
                        {categoryConfig && (
                          <div className={`p-2 bg-gradient-to-r ${categoryConfig.color} rounded-lg`}>
                            <span className="text-white text-lg">{categoryConfig.icon}</span>
                          </div>
                        )}
                        <div>
                          <h4 className="text-lg font-semibold text-gray-900 capitalize">{category} Expenses</h4>
                          <p className="text-sm text-gray-600">{categoryExpenses.length} expense{categoryExpenses.length !== 1 ? 's' : ''}</p>
                        </div>
                      </div>
                      <div className={`px-4 py-2 rounded-full text-sm font-semibold border ${categoryConfig?.bgColor} ${categoryConfig?.borderColor} ${categoryConfig?.textColor}`}>
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