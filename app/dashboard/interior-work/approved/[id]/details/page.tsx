"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  CheckCircle,
  DollarSign,
  User,
  Phone,
  Mail,
  MapPin,
  Clock,
  TrendingUp,
  FileText,
  Download,
  CreditCard,
  Plus,
  Circle,
  Play
} from "lucide-react";
import Swal from 'sweetalert2';
import type { SweetAlertOptions } from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { formatDateDDMMYYYY, formatDateForFileName } from '@/app/utils/dateFormat';

interface Stage {
  _id: string;
  userId: string;
  clientId: string;
  date: string;
  stageDesc: string;
  createdAt: string;
}

interface InteriorIncome {
  _id: string;
  userId: string;
  clientId: string;
  amount: number;
  status: string;
  method: string | null;
  date: string;
  createdAt: string;
  markedBy?: string;
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

interface Measurement {
  length: number;
  breadth: number;
}

interface RunningMeasurement {
  length: number;
}

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
  measurements?: Measurement[];
  pieces?: number;
  runningLength?: number;
  runningMeasurements?: RunningMeasurement[];
  description: string;
  totalAmount: number;
  amountPerSqFt?: number;
}

interface Estimate {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  items?: Item[];
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  client?: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
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

export default function ApprovedWorkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [interiorIncomes, setInteriorIncomes] = useState<InteriorIncome[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [currentUser, setCurrentUser] = useState<{ userId: string; name: string; email: string } | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workStarted, setWorkStarted] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
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
        if (estimateData.estimate?.clientId) {
          const clientResponse = await fetch(`/api/clients/${estimateData.estimate.clientId}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setEstimate(prev => prev ? { ...prev, client: clientData.client } : null);
          }
        }

        // Fetch stages for this client
        const stagesResponse = await fetch(`/api/stages?clientId=${estimateData.estimate.clientId}`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          const fetchedStages = stagesData.stages || [];
          setStages(fetchedStages);
          
          // Check if work has started (if "Work Started" stage exists)
          const hasWorkStarted = fetchedStages.some((stage: Stage) => stage.stageDesc === 'Work Started');
          setWorkStarted(hasWorkStarted);
        }

        // Fetch interior income for this client
        const incomeResponse = await fetch(`/api/interior-income?clientId=${estimateData.estimate.clientId}`);
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          console.log('Interior Income Data:', incomeData);
          setInteriorIncomes(incomeData.interiorIncomes || []);
        } else {
          console.error('Failed to fetch interior income:', incomeResponse.status, incomeResponse.statusText);
        }

        // Fetch banks
        const banksResponse = await fetch('/api/banks');
        if (banksResponse.ok) {
          const banksData = await banksResponse.json();
          setBanks(banksData.banks || []);
        }

        // Fetch current user
        try {
          const userResponse = await fetch('/api/auth/me');
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setCurrentUser(userData.user);
          }
        } catch {
          console.log('Could not fetch current user, using default');
          // Set a default user if we can't fetch the current user
          setCurrentUser({ userId: 'default', name: 'Current User', email: 'user@example.com' });
        }

        // Fetch expenses for this client
        const expensesResponse = await fetch(`/api/expenses?clientId=${estimateData.estimate.clientId}`);
        if (expensesResponse.ok) {
          const expensesData = await expensesResponse.json();
          setExpenses(expensesData.expenses || []);
        }

      } catch (error) {
        console.error('Error fetching details:', error);
        setError('Failed to load work details');
      } finally {
        setLoading(false);
      }
    };

    if (estimateId) {
      fetchDetails();
    }
  }, [estimateId]);

  const handleBackToApprovedWorks = () => {
    router.push('/dashboard/interior-work/approved');
  };

  const handleDownloadQuotation = async () => {
    if (!estimate || !estimate.client) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Unable to generate quotation PDF.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    try {
      // Fetch quotation number (count of all estimates)
      let quotationNumber = 1;
      try {
        const estimatesResponse = await fetch('/api/interior-estimates');
        if (estimatesResponse.ok) {
          const estimatesData = await estimatesResponse.json();
          quotationNumber = estimatesData.estimates?.length || 1;
        }
      } catch (error) {
        console.log('Error fetching estimate count, using default:', error);
        quotationNumber = 1;
      }
      const doc = new jsPDF();
      
      // Add full page border
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      
      // Add professional header background with gradient effect (same as estimate)
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
      doc.text("+91 90619 04333", 105, 62, { align: 'center' });
      
      let yPos = 75;
      const pageEndY = 270;

      // Main Heading
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text("INTERIOR DESIGN & EXECUTION QUOTATION", 105, yPos, { align: 'center' });
      yPos += 15;

      // Company Information Section (prefilled)
      doc.setFontSize(11);
      doc.setTextColor(0);
      
      // Company Name
      doc.setFont('helvetica', 'bold');
      doc.text("Company Name :  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text("Takshaga Spatial Solutions", 15 + doc.getTextWidth("Company Name :  "), yPos);
      yPos += 8;
      
      // Address
      doc.setFont('helvetica', 'bold');
      doc.text("Address :  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text("2nd Floor, Opp. Panchayat Building", 15 + doc.getTextWidth("Address :  "), yPos);
      yPos += 8;
      doc.text("Upputhara P.O, Idukki District", 15 + doc.getTextWidth("Address :  "), yPos);
      yPos += 8;
      doc.text("Kerala – 685505, India", 15 + doc.getTextWidth("Address :  "), yPos);
      yPos += 8;
      
      // Phone
      doc.setFont('helvetica', 'bold');
      doc.text("Phone :  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text("+91 90619 04333", 15 + doc.getTextWidth("Phone :  "), yPos);
      yPos += 8;
      
      // Email
      doc.setFont('helvetica', 'bold');
      doc.text("Email :  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text("info@takshaga.com", 15 + doc.getTextWidth("Email :  "), yPos);
      yPos += 10;
      
      // Underline below company details (low opacity)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, yPos, 195, yPos);
      yPos += 10;

      // Quotation Details
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Quotation Details", 15, yPos);
      yPos += 10;
      doc.setFontSize(10);
      
      // Quotation No
      doc.setFont('helvetica', 'bold');
      doc.text("Quotation No:  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(`${quotationNumber}`, 15 + doc.getTextWidth("Quotation No:  "), yPos);
      yPos += 8;
      
      // Date
      doc.setFont('helvetica', 'bold');
      doc.text("Date:  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(formatDateDDMMYYYY(new Date()), 15 + doc.getTextWidth("Date:  "), yPos);
      yPos += 10;
      
      // Client Name
      doc.setFont('helvetica', 'bold');
      doc.text("Client Name:  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(estimate.client.name || '', 15 + doc.getTextWidth("Client Name:  "), yPos);
      yPos += 8;
      
      // Place
      doc.setFont('helvetica', 'bold');
      doc.text("Place:  ", 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.text(estimate.client.location || '', 15 + doc.getTextWidth("Place:  "), yPos);
      yPos += 10;
      
      // Underline below Quotation Details (low opacity)
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(15, yPos, 195, yPos);
      yPos += 10;

      // Scope of Work
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Scope of Work", 15, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const scopeText = "This quotation covers comprehensive interior design and execution services as per the approved drawings, material specifications, and detailed discussions. The scope includes complete design development, material procurement, skilled craftsmanship, project management, and quality assurance throughout the execution phase. All work will be carried out in accordance with industry standards and best practices, ensuring timely completion and adherence to the agreed specifications. Site coordination, supervision, and final finishing work are included as part of this comprehensive service package.";
      const maxWidth = 180; // Maximum width for text (page width - margins)
      const scopeLines = doc.splitTextToSize(scopeText, maxWidth);
      scopeLines.forEach((line: string) => {
        doc.text(line, 15, yPos);
        yPos += 8;
      });
      yPos += 15;

      // Detailed Cost Breakdown - Start on second page
      doc.addPage();
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.rect(5, 5, 200, 287);
      yPos = 20;
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Detailed Cost Breakdown", 15, yPos);
      yPos += 10;

      // Add estimate items if available
      if (estimate.items && estimate.items.length > 0) {
        // Helper function for rounding sq feet
        const customRoundSqFeet = (value: number): number => {
          const floorValue = Math.floor(value);
          const decimal = value - floorValue;
          if (decimal >= 0.5) {
            return floorValue + 1;
          }
          return floorValue + 0.5;
        };

        // Organize items by category and subcategory (similar to estimate)
        const organizedSections: Record<string, Record<string, Item[]>> = {};
        estimate.items.forEach(item => {
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

        const minSpaceNeeded = 50;
        const categorySpacing = 20;
        const subcategorySpacing = 15;

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

            // Category header (only for first subcategory)
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

            // Subcategory header
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

                  // Handle multiple measurements
                  let measurements = '';
                  let totalSqFeet = 0;
                  
                  if (item.measurements && item.measurements.length > 0) {
                    const measurementStrings = [];
                    if (item.length && item.breadth) {
                      measurementStrings.push(`${item.length}×${item.breadth}`);
                      totalSqFeet += (item.length * item.breadth) / 929.03;
                    }
                    item.measurements.forEach((m) => {
                      measurementStrings.push(`${m.length}×${m.breadth}`);
                      totalSqFeet += (m.length * m.breadth) / 929.03;
                    });
                    measurements = measurementStrings.join('\n');
                  } else if (item.length && item.breadth) {
                    measurements = `${item.length}×${item.breadth}`;
                    totalSqFeet = (item.length * item.breadth) / 929.03;
                  }

                  const amountPerSqFt = item.amountPerSqFt || 0;
                  
                  return [
                    combinedText,
                    measurements,
                    customRoundSqFeet(totalSqFeet).toFixed(1),
                    `Rs ${amountPerSqFt.toFixed(1)}`,
                    `Rs ${item.totalAmount.toFixed(1)}`
                  ];
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
                    "4": { cellWidth: 0 }
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

                  // Handle multiple running measurements
                  let lengths = '';
                  let totalLength = 0;
                  
                  if (item.runningMeasurements && item.runningMeasurements.length > 0) {
                    const lengthStrings = [];
                    if (item.runningLength) {
                      lengthStrings.push(item.runningLength.toString());
                      totalLength += item.runningLength;
                    }
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
                  
                  return [
                    combinedText,
                    lengths,
                    totalFeet.toFixed(1),
                    `Rs ${amountPerFt.toFixed(1)}`,
                    `Rs ${item.totalAmount.toFixed(1)}`
                  ];
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

        // Add subtotal and grand total
        if (yPos > pageEndY - 40) {
          doc.addPage();
          doc.setDrawColor(0, 0, 0);
          doc.setLineWidth(0.5);
          doc.rect(5, 5, 200, 287);
          yPos = 20;
        }

        const subtotal = estimate.items.reduce((total, item) => total + (item.totalAmount || 0), 0);
        doc.setDrawColor(189, 195, 199);
        doc.setLineWidth(0.5);
        doc.line(15, yPos, 195, yPos);
        yPos += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0);
        doc.text("Subtotal: Rs  ", 15, yPos);
        doc.text(`${subtotal.toFixed(2)}`, 15 + doc.getTextWidth("Subtotal: Rs  "), yPos);
        yPos += 10;
        doc.setFontSize(11);
        doc.text("Grand Total: Rs  ", 15, yPos);
        doc.text(`${estimate.totalAmount.toFixed(2)}`, 15 + doc.getTextWidth("Grand Total: Rs  "), yPos);
        yPos += 15;
      } else {
        // If no items, just show placeholder
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text("(Estimate particulars will be listed here)", 15, yPos);
        yPos += 15;
        doc.text("Subtotal: Rs _____________", 15, yPos);
        yPos += 10;
        doc.text("Grand Total: Rs ____________", 15, yPos);
        yPos += 15;
      }

      // Payment Terms
      if (yPos > pageEndY - 80) {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Payment Terms", 15, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("50% advance on confirmation phase 1", 15, yPos);
      yPos += 8;
      doc.text("25% during execution", 15, yPos);
      yPos += 8;
      doc.text("25% on project completion", 15, yPos);
      yPos += 8;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text("(Payment terms can be customized as per agreement)", 15, yPos);
      yPos += 15;

      // Project Timeline
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Project Timeline", 15, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Estimated completion: __________ days from work commencement", 15, yPos);
      yPos += 15;

      // Terms & Conditions
      if (yPos > pageEndY - 100) {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Terms & Conditions", 15, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text("Quotation valid for ____ days from the date of issue.", 15, yPos);
      yPos += 8;
      doc.text("Any additional work will be charged separately.", 15, yPos);
      yPos += 8;
      doc.text("Electrical fittings, appliances, and loose furniture not included unless specified.", 15, yPos);
      yPos += 8;
      doc.text("Design changes after approval may affect cost and timeline.", 15, yPos);
      yPos += 8;
      doc.text("Site conditions may impact final execution.", 15, yPos);
      yPos += 15;

      // Declaration
      if (yPos > pageEndY - 80) {
        doc.addPage();
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        yPos = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text("Declaration", 15, yPos);
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const declarationText = "We confirm that the above prices are accurate and the work will be executed as per agreed specifications.";
      const declarationMaxWidth = 180; // Maximum width for text (page width - margins)
      const declarationLines = doc.splitTextToSize(declarationText, declarationMaxWidth);
      declarationLines.forEach((line: string) => {
        doc.text(line, 15, yPos);
        yPos += 8;
      });
      yPos += 12;
      
      const signatureStartY = yPos;
      
      // Company signature section (left side)
      doc.text("For Takshaga Spatial Solutions", 15, yPos);
      yPos += 15;
      doc.text("Authorized Signatory", 15, yPos);
      yPos += 10;
      doc.text("Name: ________________________", 15, yPos);
      yPos += 10;
      doc.text("Signature: ___________________", 15, yPos);
      yPos += 10;
      doc.text("Date: ________________________", 15, yPos);
      
      // Client signature section (right side)
      yPos = signatureStartY;
      const rightX = 110; // Starting x position for right side
      doc.text(`For ${estimate.client.name || 'Client'}`, rightX, yPos);
      yPos += 15;
      doc.text("Client Signatory", rightX, yPos);
      yPos += 10;
      doc.text("Name: ________________________", rightX, yPos);
      yPos += 10;
      doc.text("Signature: ___________________", rightX, yPos);
      yPos += 10;
      doc.text("Date: ________________________", rightX, yPos);
      
      yPos += 20;

      // Add page numbers
      const pageCount = (doc.internal as unknown as { getNumberOfPages: () => number }).getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        doc.rect(5, 5, 200, 287);
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      }

      const fileName = `Quotation_${estimate.client.name.replace(/\s+/g, '_')}_${formatDateForFileName(new Date())}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Quotation Downloaded',
        text: 'Your quotation has been downloaded successfully.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    } catch (error) {
      console.error('Error generating quotation PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Download Failed',
        text: 'Failed to generate quotation PDF.',
      });
    }
  };

  const handleDownloadInvoice = async (income: InteriorIncome) => {
    if (!selectedBank) {
      Swal.fire({
        icon: 'warning',
        title: 'Select Bank Account',
        text: 'Please select a bank account before downloading the invoice.',
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
      doc.text("+91 90619 04333", 105, 62, { align: 'center' });
      
      // Add professional invoice details section
      doc.setFillColor(245, 245, 245);
      doc.roundedRect(5, 75, 200, 45, 2, 2, 'F');
      
      // Add invoice details on left in a structured format
      doc.setTextColor(0);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("INVOICE DETAILS", 15, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: INV-${new Date().getFullYear()}-${String(income._id).slice(-6).toUpperCase()}`, 15, 95);
      doc.text(`Date: ${formatDateDDMMYYYY(new Date())}`, 15, 105);
      doc.text(`Payment Phase: Phase ${interiorIncomes.indexOf(income) + 1}`, 15, 115);
      
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("BILL TO", 110, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (estimate?.client) {
        doc.text(estimate.client.name, 110, 95);
        doc.text(estimate.client.location || "", 110, 105);
        doc.text(estimate.client.phone || "", 110, 115);
      }
      
      // INVOICE heading
      doc.setFillColor(0, 51, 102);
      doc.rect(5, 130, 200, 12, 'F');
      doc.setFontSize(14);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text("INVOICE", 105, 138, { align: "center" });

      // Payment Details Table
      let yPos = 150;
      const phaseNumber = interiorIncomes.indexOf(income) + 1;

      // Create professional table for payment details
      autoTable(doc, {
        startY: yPos,
        head: [['Description', 'Amount']],
        body: [
          [`Phase ${phaseNumber} Payment`, `Rs. ${income.amount.toLocaleString()}`],
          ['Total Amount', `Rs. ${income.amount.toLocaleString()}`]
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

      // Bank Details and QR Code Section (side by side) - ensure single page
      const pageWidth = 210;
      const rightMargin = 15;

      // Bank Details on the left
      doc.setFillColor(240, 240, 240);
      doc.rect(5, yPos, 95, 8, 'F');
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
          0: { cellWidth: 38, fontStyle: 'bold' },
          1: { cellWidth: 52 }
        },
        margin: { left: 10, right: 5 },
        tableWidth: 90
      });

      // QR Code on the right
      try {
        const upiId = selectedBank.upiId || '';
        const amount = income.amount.toFixed(2);
        const transactionNote = `Invoice Payment - Phase ${phaseNumber}`;
        const upiLink = `upi://pay?pa=${encodeURIComponent(upiId)}&am=${amount}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;
        
        const qrCodeDataUrl = await QRCode.toDataURL(upiLink, {
          width: 40,
          margin: 1
        });
        
        // Add QR code on the right side
        const qrSize = 40;
        const qrX = pageWidth - rightMargin - qrSize;
        const qrY = yPos + 5;
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }

      // Footer - position below bank details and QR code
      const bankTableFinalY = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
      const qrBottomY = yPos + 5 + 40; // QR code bottom position
      const footerY = Math.max(bankTableFinalY, qrBottomY) + 10;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0);
      doc.text('Thank you for your business!', 105, footerY, { align: 'center' });
      
      // Computer generated bill notice at the bottom
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100);
      doc.text('This is a computer generated bill, no signature required.', 105, 285, { align: 'center' });
      
      const fileName = `Invoice_Phase_${interiorIncomes.indexOf(income) + 1}_${estimate?.client?.name?.replace(/\s+/g, '_') || 'client'}_${formatDateForFileName(new Date())}.pdf`;
      doc.save(fileName);

      Swal.fire({
        icon: 'success',
        title: 'Invoice Downloaded',
        text: 'Your invoice has been downloaded successfully.',
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
        text: 'Failed to generate invoice PDF.',
      });
    }
  };

  const handleDownloadReceipt = async (income: InteriorIncome, paymentMethod: string) => {
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
      doc.text("+91 90619 04333", 105, 62, { align: 'center' });
      
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
      doc.text(`Date: ${formatDateDDMMYYYY(income.date)}`, 15, 105);
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
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0);
      doc.text('Payment Method:', 15, yPos);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1), 15, yPos + 10);
      
      yPos += 25;

      // Bank Details (only show if payment method is bank)
      if (paymentMethod === 'bank' && selectedBank) {
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
      
      const fileName = `Receipt_Phase_${phaseNumber}_${estimate?.client?.name?.replace(/\s+/g, '_') || 'client'}_${formatDateForFileName(new Date())}.pdf`;
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
      doc.text("+91 90619 04333", 105, 62, { align: 'center' });
      
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
      doc.text(`Date: ${formatDateDDMMYYYY(new Date())}`, 15, 105);
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
      const tableBody = completedPayments.map((income) => [
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
        didDrawPage: () => {
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
      
      const fileName = `Receipt_All_Payments_${estimate?.client?.name?.replace(/\s+/g, '_') || 'client'}_${formatDateForFileName(new Date())}.pdf`;
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

  const handleMarkAsPaid = async (income: InteriorIncome) => {
    const { value: method } = await Swal.fire({
      title: 'Mark as Paid',
      text: 'Select payment method:',
      input: 'select',
      inputOptions: {
        'cash': 'Cash',
        'bank': 'Bank'
      },
      inputPlaceholder: 'Select payment method',
      showCancelButton: true,
      confirmButtonText: 'Mark as Paid',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value) {
          return 'Please select a payment method';
        }
      }
    });

    if (method) {
      try {
        const response = await fetch(`/api/interior-income/${income._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed',
            method: method,
            markedBy: currentUser?.name || currentUser?.email || 'Unknown User'
          }),
        });

        if (response.ok) {
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Marked as Paid',
            text: 'Payment has been successfully marked as completed. You can download the receipt from the payment card.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to mark payment as paid.',
        });
      }
    }
  };

  const handleEditPayment = async (income: InteriorIncome) => {
    // Only allow editing pending payments
    if (income.status !== 'pending') {
      Swal.fire({
        icon: 'warning',
        title: 'Cannot Edit Completed Payment',
        text: 'Only pending payments can be edited. Completed payments cannot be modified.',
        confirmButtonText: 'OK'
      });
      return;
    }

    // Calculate balance amount (total - completed payments) + current pending amount
    const completedAmount = interiorIncomes
      .filter(inc => inc && inc.status === 'completed')
      .reduce((sum, inc) => sum + (inc?.amount || 0), 0);
    const otherPendingAmount = interiorIncomes
      .filter(inc => inc && inc.status === 'pending' && inc._id !== income._id)
      .reduce((sum, inc) => sum + (inc?.amount || 0), 0);
    const maxAmount = (estimate?.totalAmount ?? 0) - completedAmount - otherPendingAmount;

    const swalConfig: SweetAlertOptions = {
      title: 'Edit Payment Amount',
      text: `Enter new amount (Max: ₹${maxAmount.toLocaleString()}):`,
      input: 'number',
      inputValue: income.amount,
      inputPlaceholder: `Enter amount (0 to ₹${maxAmount.toLocaleString()})`,
      inputAttributes: {
        max: String(maxAmount),
        min: "0",
        step: "1"
      },
      showCancelButton: true,
      confirmButtonText: 'Update',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        const numValue = Number(value);
        if (!value || numValue < 0) {
          return 'Please enter a valid amount';
        }
        if (numValue > maxAmount) {
          return `Amount cannot exceed maximum of ₹${maxAmount.toLocaleString()}`;
        }
      }
    };
    const { value: amount } = await Swal.fire(swalConfig);

    if (amount && amount !== income.amount) {
      try {
        const response = await fetch(`/api/interior-income/${income._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Number(amount)
          }),
        });

        if (response.ok) {
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Updated',
            text: 'Payment amount has been updated successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      } catch (error) {
        console.error('Error updating payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to update payment amount.',
        });
      }
    }
  };

  const refetchInteriorIncomes = async () => {
    if (estimate?.clientId) {
      try {
        const incomeResponse = await fetch(`/api/interior-income?clientId=${estimate.clientId}`);
        if (incomeResponse.ok) {
          const incomeData = await incomeResponse.json();
          console.log('Refetched Interior Income Data:', incomeData);
          setInteriorIncomes(incomeData.interiorIncomes || []);
        }
      } catch (error) {
        console.error('Error refetching interior income:', error);
      }
    }
  };

  const refetchStages = async () => {
    if (estimate?.clientId) {
      try {
        const stagesResponse = await fetch(`/api/stages?clientId=${estimate.clientId}`);
        if (stagesResponse.ok) {
          const stagesData = await stagesResponse.json();
          const fetchedStages = stagesData.stages || [];
          setStages(fetchedStages);
          
          // Check if work has started (if "Work Started" stage exists)
          const hasWorkStarted = fetchedStages.some((stage: Stage) => stage.stageDesc === 'Work Started');
          setWorkStarted(hasWorkStarted);
          
          console.log('Refetched Stages Data:', stagesData);
        }
      } catch (error) {
        console.error('Error refetching stages:', error);
      }
    }
  };

  const handleWorkStarted = async () => {
    try {
      const response = await fetch('/api/stages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: estimate?.clientId ?? '',
          stageDesc: 'Work Started',
          date: new Date().toISOString()
        }),
      });

      if (response.ok) {
        const newStage = await response.json();
        console.log('New stage created:', newStage);
        
        // Refetch stages to ensure we have the latest data
        await refetchStages();
        
        Swal.fire({
          icon: 'success',
          title: 'Work Started',
          text: 'Work has been marked as started successfully.',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorData.message || 'Failed to mark work as started.',
        });
      }
    } catch (error) {
      console.error('Error marking work as started:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to mark work as started.',
      });
    }
  };

  const handleAddStage = async () => {
    const { value: stageDesc } = await Swal.fire({
      title: 'Add New Stage',
      text: 'Enter stage description:',
      input: 'text',
      inputPlaceholder: 'e.g., Foundation Complete, Walls Painted, etc.',
      showCancelButton: true,
      confirmButtonText: 'Add Stage',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Please enter a stage description';
        }
        if (value.length < 3) {
          return 'Stage description must be at least 3 characters';
        }
      }
    });

    if (stageDesc) {
      try {
        const response = await fetch('/api/stages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate?.clientId ?? '',
            stageDesc: stageDesc.trim(),
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const newStage = await response.json();
          console.log('New stage created:', newStage);
          
          // Refetch stages to ensure we have the latest data
          await refetchStages();
          
          Swal.fire({
            icon: 'success',
            title: 'Stage Added',
            text: 'New stage has been added successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.message || 'Failed to add stage.',
          });
        }
      } catch (error) {
        console.error('Error adding stage:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add stage.',
        });
      }
    }
  };

  const handleMarkAsCompleted = async () => {
    const { isConfirmed } = await Swal.fire({
      title: 'Mark Work as Completed',
      text: 'Are you sure you want to mark this work as completed? This action cannot be undone.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Mark as Completed',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280'
    });

    if (isConfirmed) {
      try {
        // First, add "Completed" stage to the database
        const stageResponse = await fetch('/api/stages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate?.clientId ?? '',
            stageDesc: 'Completed',
            date: new Date().toISOString()
          }),
        });

        if (!stageResponse.ok) {
          throw new Error('Failed to add completed stage');
        }

        // Then, update the estimate status to completed
        const estimateResponse = await fetch(`/api/interior-estimates/${estimateId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'completed'
          }),
        });

        if (estimateResponse.ok) {
          // Update local estimate state
          setEstimate(prev => prev ? { ...prev, status: 'completed' } : null);
          
          // Refetch stages to show the new "Completed" stage
          await refetchStages();
          
          Swal.fire({
            icon: 'success',
            title: 'Work Completed',
            text: 'Work has been marked as completed successfully. Redirecting to completed works...',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 2000
          });

          // Redirect to completed works details page after a short delay
          setTimeout(() => {
            router.push(`/dashboard/interior-work/completed/${estimateId}/details`);
          }, 2000);
        } else {
          throw new Error('Failed to update estimate status');
        }
      } catch (error) {
        console.error('Error marking work as completed:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to mark work as completed.',
        });
      }
    }
  };

  const handleAddPayment = async () => {
    // Calculate balance amount (total - completed payments)
    const completedAmount = interiorIncomes
      .filter(income => income && income.status === 'completed')
      .reduce((sum, income) => sum + (income?.amount || 0), 0);
    const balanceAmount = (estimate?.totalAmount ?? 0) - completedAmount;

    const { value: amount } = await Swal.fire({
      title: 'Add Payment Phase',
      text: `Enter amount for new payment phase (Max: ₹${balanceAmount.toLocaleString()}):`,
      input: 'number',
      inputPlaceholder: `Enter amount (0 to ₹${balanceAmount.toLocaleString()})`,
      inputAttributes: {
        max: String(balanceAmount),
        min: "0",
        step: "1"
      },
      showCancelButton: true,
      confirmButtonText: 'Create Phase',
      cancelButtonText: 'Cancel',
      inputValidator: (value) => {
        const numValue = Number(value);
        if (!value || numValue < 0) {
          return 'Please enter a valid amount';
        }
        if (numValue > balanceAmount) {
          return `Amount cannot exceed balance of ₹${balanceAmount.toLocaleString()}`;
        }
      }
    });

    if (amount) {
      try {
        const response = await fetch('/api/interior-income', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate?.clientId ?? '',
            amount: Number(amount),
            method: null,
            status: 'pending',
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          console.log('New income created successfully');
          
          // Refetch the latest data to ensure we have the most up-to-date information
          await refetchInteriorIncomes();
          
          Swal.fire({
            icon: 'success',
            title: 'Payment Phase Created',
            text: 'New payment phase has been created successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.message || 'Failed to create payment phase.',
          });
        }
      } catch (error) {
        console.error('Error adding payment:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to create payment phase.',
        });
      }
    }
  };

  const refetchExpenses = async () => {
    if (!estimate?.clientId) return;
    
    try {
      const response = await fetch(`/api/expenses?clientId=${estimate.clientId}`);
      if (response.ok) {
        const data = await response.json();
        setExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error('Error refetching expenses:', error);
    }
  };

  const handleAddExpense = async () => {
    if (!estimate?.clientId) return;

    const { value: formValues } = await Swal.fire({
      title: 'Add Expense',
      html: `
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select id="category" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Category</option>
              <option value="material">Material</option>
              <option value="labour">Labour</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea id="notes" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter expense notes"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
            <input type="number" id="amount" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Enter amount" min="0" step="0.01">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add Expense',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      preConfirm: () => {
        const category = (document.getElementById('category') as HTMLSelectElement)?.value;
        const notes = (document.getElementById('notes') as HTMLTextAreaElement)?.value;
        const amount = (document.getElementById('amount') as HTMLInputElement)?.value;

        if (!category) {
          Swal.showValidationMessage('Please select a category');
          return false;
        }
        if (!amount || parseFloat(amount) <= 0) {
          Swal.showValidationMessage('Please enter a valid amount');
          return false;
        }

        return { category, notes, amount };
      }
    });

    if (formValues) {
      try {
        const response = await fetch('/api/expenses', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clientId: estimate?.clientId ?? '',
            category: formValues.category,
            notes: formValues.notes,
            amount: formValues.amount,
            date: new Date().toISOString()
          }),
        });

        if (response.ok) {
          const newExpense = await response.json();
          console.log('New expense created:', newExpense);
          
          // Refetch expenses to show the new expense
          await refetchExpenses();
          
          Swal.fire({
            icon: 'success',
            title: 'Expense Added',
            text: 'Expense has been added successfully.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: errorData.message || 'Failed to add expense.',
          });
        }
      } catch (error) {
        console.error('Error adding expense:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to add expense.',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading work details...</span>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Work Details</h1>
              <p className="text-gray-600 mb-6">{error || 'Work not found'}</p>
              <button
                onClick={handleBackToApprovedWorks}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Approved Works
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
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBackToApprovedWorks}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back to Approved Works</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              Approved
            </div>
          </div>
        </div>

        {/* Work Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Work Details</h1>
            <button
              onClick={handleDownloadQuotation}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span>Download Quotation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Estimate Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <FileText className="h-5 w-5 text-blue-600" />
                <span>Estimate Information</span>
              </h3>
              
              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                  <p className="text-3xl font-bold text-green-600">₹{estimate.totalAmount.toLocaleString()}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <div className="flex items-center space-x-2 mt-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-green-700 font-medium">Approved</span>
                  </div>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Created Date:</span>
                  <p className="text-gray-900">{formatDateDDMMYYYY(estimate.createdAt)}</p>
                </div>
                
                <div>
                  <span className="text-sm font-medium text-gray-600">Last Updated:</span>
                  <p className="text-gray-900">{formatDateDDMMYYYY(estimate.updatedAt)}</p>
                </div>
              </div>
            </div>

            {/* Client Information */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <User className="h-5 w-5 text-purple-600" />
                <span>Client Information</span>
              </h3>
              
              {estimate.client ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Name:</span>
                    <span className="text-gray-900">{estimate.client.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Email:</span>
                    <span className="text-gray-900">{estimate.client.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Phone:</span>
                    <span className="text-gray-900">{estimate.client.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-600">Location:</span>
                    <span className="text-gray-900">{estimate.client.location}</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500">Client information not available</p>
              )}
            </div>
          </div>
        </div>

        {/* Financial Overview */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span>Financial Overview</span>
            </h3>
          </div>

          {/* Main Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Amount Received */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  Received
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Amount Received</p>
                <p className="text-2xl font-bold text-green-600">
                  ₹{interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {interiorIncomes.filter(income => income && income.status === 'completed').length} payment{interiorIncomes.filter(income => income && income.status === 'completed').length !== 1 ? 's' : ''} received
                </p>
              </div>
            </div>

            {/* Expenses */}
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

            {/* Balance Amount */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2 py-1 rounded-full">
                  Balance
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Balance Amount</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₹{(estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {Math.round(((estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) / estimate.totalAmount) * 100)}% remaining
                </p>
              </div>
            </div>

            {/* Pending Amount */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
                <span className="text-sm font-medium text-yellow-700 bg-yellow-100 px-2 py-1 rounded-full">
                  Pending
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  ₹{interiorIncomes.filter(income => income && income.status === 'pending').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {interiorIncomes.filter(income => income && income.status === 'pending').length} payment{interiorIncomes.filter(income => income && income.status === 'pending').length !== 1 ? 's' : ''} pending
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bars Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Payment Progress */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Payment Progress</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Amount Received</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round((interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) / estimate.totalAmount) * 100, 100)}%` 
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

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Balance Amount</span>
                    <span className="text-sm font-medium text-gray-700">
                      {Math.round(((estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) / estimate.totalAmount) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 h-3 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(((estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) / estimate.totalAmount) * 100, 100)}%` 
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
                        width: `${interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) > 0 ? (interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'bank').reduce((sum, income) => sum + (income?.amount || 0), 0) / interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) * 100 : 0}%` 
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
                        width: `${interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) > 0 ? (interiorIncomes.filter(income => income && income.status === 'completed' && income.method === 'cash').reduce((sum, income) => sum + (income?.amount || 0), 0) / interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)) * 100 : 0}%` 
                      }}
                    ></div>
                  </div>
                </div>

                {/* Payment Distribution */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Total Completed Payments</span>
                    <span className="text-sm font-bold text-gray-900">
                      ₹{interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
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

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Net Profit */}
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">
                  Net Profit
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Project Profit</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ₹{(interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0) - expenses.reduce((sum, expense) => sum + expense.amount, 0)).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Revenue - Expenses
                </p>
              </div>
            </div>

            {/* Project Value */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
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

            {/* Number of Stages */}
            <div className="bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl p-6 border border-pink-200">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Clock className="h-6 w-6 text-pink-600" />
                </div>
                <span className="text-sm font-medium text-pink-700 bg-pink-100 px-2 py-1 rounded-full">
                  Stages
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Number of Stages</p>
                <p className="text-2xl font-bold text-pink-600">
                  {stages.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stages.length > 0 ? `${stages.filter(stage => stage && stage.stageDesc === 'approved').length} Approved, ${stages.filter(stage => stage && stage.stageDesc === 'Work Started').length} Started, ${stages.filter(stage => stage && stage.stageDesc !== 'approved' && stage.stageDesc !== 'Work Started').length} Custom` : 'No stages recorded'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stage and Payment Details - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Stage Details - Timeline */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <Clock className="h-5 w-5 text-orange-600" />
                <span>Stage Details</span>
              </h3>
              <div className="flex items-center space-x-2">
                {/* Show Work Started button if work hasn't started yet */}
                {!workStarted && stages.some(stage => stage && stage.stageDesc === 'Work Started') === false && (
                  <button
                    onClick={handleWorkStarted}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <Play className="h-4 w-4" />
                    <span>Work Started</span>
                  </button>
                )}
                
                {/* Show Add Stage button only after work has started */}
                {(workStarted || stages.some(stage => stage && stage.stageDesc === 'Work Started')) && (
                  <button
                    onClick={handleAddStage}
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Stage</span>
                  </button>
                )}
                
                {/* Show Completed button if work has started and there are stages beyond Work Started */}
                {(workStarted || stages.some(stage => stage && stage.stageDesc === 'Work Started')) && 
                 stages.filter(stage => stage && stage.stageDesc !== 'Work Started' && stage.stageDesc !== 'approved').length > 0 && (
                  <button
                    onClick={handleMarkAsCompleted}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2 cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Mark as Completed</span>
                  </button>
                )}
              </div>
            </div>

            {stages.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Stages Found</h4>
                <p className="text-gray-600">No stage information available for this work.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stages.filter(Boolean).map((stage, index) => (
                  <div key={stage._id} className="relative">
                    {/* Timeline Line */}
                    {index < stages.length - 1 && (
                      <div className="absolute left-6 top-8 w-0.5 h-8 bg-gray-300"></div>
                    )}
                    
                    {/* Timeline Item */}
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                          <Circle className="h-6 w-6 text-orange-600 fill-current" />
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900">{stage.stageDesc}</h4>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Completed
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatDateDDMMYYYY(stage.date)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Payment Details */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <span>Payment Details</span>
              </h3>
              <div className="flex items-center space-x-2">
                {(() => {
                  const completedPayments = interiorIncomes.filter(income => income && income.status === 'completed');
                  if (completedPayments.length > 0) {
                    return (
                      <button
                        onClick={handleDownloadAllPaymentsReceipt}
                        className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        title="Download All Payments Receipt"
                      >
                        <Download className="h-5 w-5" />
                      </button>
                    );
                  }
                  return null;
                })()}
                {(() => {
                  // Calculate total received amount
                  const totalReceived = interiorIncomes
                    .filter(income => income && income.status === 'completed')
                    .reduce((sum, income) => sum + (income?.amount || 0), 0);
                  
                  // Show button only if:
                  // 1. No payments exist, OR
                  // 2. Last payment is completed AND total received is less than estimate total
                  const shouldShowButton = interiorIncomes.length === 0 || 
                    (interiorIncomes[interiorIncomes.length - 1] && 
                     interiorIncomes[interiorIncomes.length - 1].status === 'completed' && 
                     totalReceived < estimate.totalAmount);
                  
                  return shouldShowButton ? (
                    <button
                      onClick={handleAddPayment}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center space-x-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span>Add Payment Phase</span>
                    </button>
                  ) : null;
                })()}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm font-medium text-gray-600">Received Amount</p>
                  <p className="text-lg font-bold text-green-600">
                    ₹{interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Amount</p>
                  <p className="text-lg font-bold text-yellow-600">
                    ₹{interiorIncomes.filter(income => income && income.status === 'pending').reduce((sum, income) => sum + (income?.amount || 0), 0).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Balance Amount</p>
                  <p className="text-lg font-bold text-blue-600">
                    ₹{(estimate.totalAmount - interiorIncomes.filter(income => income && income.status === 'completed').reduce((sum, income) => sum + (income?.amount || 0), 0)).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Bank Account Selection - Only show when there are pending payments */}
            {interiorIncomes.some(income => income && income.status === 'pending') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Bank Account for Invoice
                </label>
                <select
                  value={selectedBank?._id || ''}
                  onChange={(e) => {
                    const bank = banks.find(b => b._id === e.target.value);
                    setSelectedBank(bank || null);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="" className="text-gray-900">Select a bank account</option>
                  {banks.map((bank) => (
                    <option key={bank._id} value={bank._id} className="text-gray-900">
                      {bank.bankName} - {bank.accountName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Loading Payment Records...</h4>
                <p className="text-gray-600">Fetching payment information from database.</p>
              </div>
            ) : interiorIncomes.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Payment Records Found</h4>
                <p className="text-gray-600">No payment information available for this work.</p>
                <div className="mt-4 text-sm text-gray-500">
                  <p>Client ID: {estimate?.clientId}</p>
                  <p>Total Records: {interiorIncomes.length}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {interiorIncomes.filter(income => income).map((income, index) => (
                  <div key={income._id} className={`border rounded-lg p-4 ${
                    income.status === 'pending' 
                      ? 'border-yellow-200 bg-yellow-50' 
                      : 'border-green-200 bg-green-50'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          Phase {index + 1}
                        </span>
                        <span className="text-lg font-bold text-gray-900">
                          ₹{income.amount.toLocaleString()}
                        </span>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        income.status === 'pending' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {income.status === 'pending' ? 'Pending' : 'Completed'}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600 mb-3 space-y-1">
                      <p>Date: {formatDateDDMMYYYY(income.date)}</p>
                      {income.method && <p>Payment Method: <span className="font-medium">{income.method}</span></p>}
                      {income.markedBy && <p>Marked by: <span className="font-medium text-blue-600">{income.markedBy.split('@')[0]}</span></p>}
                    </div>

                    <div className="flex items-center space-x-2">
                      {income.status === 'pending' ? (
                        <>
                          <button
                            onClick={() => handleDownloadInvoice(income)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download Invoice</span>
                          </button>
                          <button
                            onClick={() => handleMarkAsPaid(income)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CreditCard className="h-4 w-4" />
                            <span>Mark as Paid</span>
                          </button>
                          <button
                            onClick={() => handleEditPayment(income)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                          >
                            <FileText className="h-4 w-4" />
                            <span>Edit Amount</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleDownloadReceipt(income, income.method || 'cash')}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <Download className="h-4 w-4" />
                            <span>Download Receipt</span>
                          </button>
                          <div className="flex items-center space-x-2 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-sm font-medium">Payment Completed</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}


          </div>
        </div>

        {/* Expenses Details */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-red-600" />
              <span>Expenses Details</span>
            </h3>
            <button
              onClick={handleAddExpense}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              + Add Expense
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Expenses Found</h4>
              <p className="text-gray-600">No expense information available for this work.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Category-wise grouping */}
              {['material', 'labour', 'other'].map(category => {
                const categoryExpenses = expenses.filter(expense => expense.category === category);
                if (categoryExpenses.length === 0) return null;

                const categoryTotal = categoryExpenses.reduce((sum, expense) => sum + expense.amount, 0);
                const categoryColor = {
                  material: 'bg-blue-50 border-blue-200 text-blue-800',
                  labour: 'bg-green-50 border-green-200 text-green-800',
                  other: 'bg-purple-50 border-purple-200 text-purple-800'
                }[category];

                return (
                  <div key={category} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 capitalize">{category} Expenses</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${categoryColor}`}>
                        Total: ₹{categoryTotal.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {categoryExpenses.map(expense => (
                        <div key={expense._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-medium text-gray-900">{expense.notes || 'No notes'}</p>
                                <span className="text-lg font-bold text-gray-900">₹{expense.amount.toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Date: {formatDateDDMMYYYY(expense.date)}</span>
                                <span>Added by: {expense.addedBy}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Total Expenses Summary */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-gray-900">Total Expenses</h4>
                  <span className="text-2xl font-bold text-red-600">
                    ₹{expenses.reduce((sum, expense) => sum + expense.amount, 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 