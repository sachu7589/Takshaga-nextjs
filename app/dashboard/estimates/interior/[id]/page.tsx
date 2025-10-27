"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft,
  Save,
  Edit,
  Trash2,
  Copy,
  Plus,
  X,
  Download,
  Share2,
  CheckCircle
} from "lucide-react";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Category {
  id: string;
  name: string;
}

interface SubCategory {
  id: string;
  name: string;
  categoryId: string;
}

interface Section {
  id: string;
  categoryId: string;
  categoryName: string;
  subCategoryId: string;
  subCategoryName: string;
  material: string;
  description: string;
  amount: number;
  type: 'area' | 'pieces' | 'running_sq_feet';
  createdAt: string;
}

interface Measurement {
  id: string;
  length: number;
  breadth: number;
}

interface RunningMeasurement {
  id: string;
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
  items: Item[];
  totalAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  status?: 'pending' | 'approved';
  createdAt: string;
  updatedAt: string;
}

interface ClientDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  createdAt: string;
}

export default function InteriorEstimateDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const estimateId = params.id as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [estimateName, setEstimateName] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  
  // Edit mode state variables
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [editingItemData, setEditingItemData] = useState<Item | null>(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [newMeasurement, setNewMeasurement] = useState({ length: "", breadth: "" });
  
  // Data fetching state
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  // Selection state
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  
  // Custom item state
  const [customItem, setCustomItem] = useState({
    categoryId: "",
    categoryName: "",
    subCategoryId: "",
    subCategoryName: "",
    materialName: "",
    description: "",
    type: "" as 'area' | 'pieces' | 'running' | 'running_sq_feet',
    length: "",
    breadth: "",
    pieces: "",
    runningLength: "",
    totalAmount: "",
    measurements: [] as Measurement[]
  });

  // Fetch estimate details
  useEffect(() => {
    const fetchEstimateDetails = async () => {
      if (!estimateId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/interior-estimates/${estimateId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch estimate details');
        }
        
        const data = await response.json();
        setEstimate(data.estimate);
        setItems(data.estimate.items);
        setEstimateName(data.estimate.estimateName);
        setDiscount(data.estimate.discount || 0);
        setDiscountType(data.estimate.discountType || 'percentage');
        
        // Fetch client details if available
        if (data.estimate.clientId) {
          const clientResponse = await fetch(`/api/clients/${data.estimate.clientId}`);
          if (clientResponse.ok) {
            const clientData = await clientResponse.json();
            setClientDetails(clientData.client);
          }
        }
      } catch (error) {
        console.error('Error fetching estimate details:', error);
        setError('Failed to load estimate details');
      } finally {
        setLoading(false);
      }
    };

    fetchEstimateDetails();
  }, [estimateId]);

  // Fetch categories, subcategories, and sections for edit mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        setDataLoading(true);
        
        // Fetch categories
        const categoriesResponse = await fetch('/api/categories');
        const categoriesData = await categoriesResponse.json();
        setCategories(Array.isArray(categoriesData.categories) ? categoriesData.categories : []);

        // Fetch subcategories
        const subCategoriesResponse = await fetch('/api/subcategories');
        const subCategoriesData = await subCategoriesResponse.json();
        setSubCategories(Array.isArray(subCategoriesData.subCategories) ? subCategoriesData.subCategories : []);

        // Fetch sections
        const sectionsResponse = await fetch('/api/sections');
        const sectionsData = await sectionsResponse.json();
        setSections(Array.isArray(sectionsData.sections) ? sectionsData.sections : []);

      } catch (error) {
        console.error('Error fetching data:', error);
        setCategories([]);
        setSubCategories([]);
        setSections([]);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch data from database',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleBackToEstimates = () => {
    if (estimate?.clientId && clientDetails) {
      const params = new URLSearchParams();
      params.set('clientId', estimate.clientId);
      params.set('clientName', clientDetails.name);
      router.push(`/dashboard/estimates?${params.toString()}`);
    } else {
      router.push('/dashboard/estimates');
    }
  };

  const handleEditEstimate = () => {
    setIsEditMode(true);
  };





  const handleSaveWithName = async () => {
    if (!estimateName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter an estimate name',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    try {
      const response = await fetch('/api/interior-estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimateName,
          items,
          clientId: estimate?.clientId || '',
          totalAmount: calculateFinalTotal(),
          discount,
          discountType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        Swal.fire({
          icon: 'success',
          title: 'Saved!',
          text: 'Estimate has been saved successfully.',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
        setShowSaveModal(false);
        setIsEditMode(false);
        // Refresh the page with new estimate
        router.push(`/dashboard/estimates/interior/${data.estimate._id}`);
      } else {
        throw new Error('Failed to save estimate');
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save estimate',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleUpdateEstimate = () => {
    setShowUpdateModal(true);
  };

  const handleUpdateWithName = async () => {
    if (!estimateName.trim()) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter an estimate name',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    try {
      const totalAmount = calculateFinalTotal();
      
      const response = await fetch(`/api/interior-estimates/${estimateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estimateName,
          items,
          totalAmount,
          discount,
          discountType
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setEstimate(data.estimate);
        setHasChanges(false);
        setShowUpdateModal(false);
        
        Swal.fire({
          icon: 'success',
          title: 'Updated!',
          text: 'Estimate has been updated successfully.',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        throw new Error('Failed to update estimate');
      }
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update estimate',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleCancelChanges = () => {
    // Reset items to original estimate
    if (estimate) {
      setItems(estimate.items);
      setEstimateName(estimate.estimateName);
      setDiscount(estimate.discount || 0);
      setDiscountType(estimate.discountType || 'percentage');
    }
    setHasChanges(false);
    
    Swal.fire({
      icon: 'info',
      title: 'Changes Cancelled',
      text: 'All changes have been discarded.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 2000
    });
  };







  // Helper functions for edit mode
  const filteredSubCategories = Array.isArray(subCategories) ? subCategories.filter(sub => sub.categoryId === selectedCategory) : [];
  const filteredSections = Array.isArray(sections) ? sections.filter(section => 
    section.subCategoryId === selectedSubCategory
  ) : [];

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSelectedSubCategory("");
    setSelectedSection("");
  };

  const handleSubCategoryChange = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId);
    setSelectedSection("");
  };

  const handleSectionChange = (sectionId: string) => {
    setSelectedSection(sectionId);
    
    const selectedSectionData = sections.find(section => section.id === sectionId);
    if (selectedSectionData) {
      const newItem: Item = {
        id: Date.now().toString(),
        sectionId: selectedSectionData.id,
        sectionName: selectedSectionData.material,
        categoryName: selectedSectionData.categoryName,
        subCategoryName: selectedSectionData.subCategoryName,
        materialName: selectedSectionData.material,
        type: selectedSectionData.type,
        description: selectedSectionData.description,
        totalAmount: selectedSectionData.amount,
        length: 0,
        breadth: 0,
        pieces: 0,
        runningLength: 0
      };
      
      setItems([...items, newItem]);
      setHasChanges(true);
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedSection("");
    }
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setEditingItemData({ ...item });
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editingItemData) return;

    // Recalculate total amount based on the type
    const amountPerSqFt = editingItemData.amountPerSqFt || 0;
    const calculatedTotal = calculateTotalAmount(
      editingItemData.type,
      editingItemData.length || 0,
      editingItemData.breadth || 0,
      editingItemData.pieces || 0,
      editingItemData.runningLength || 0,
      amountPerSqFt,
      editingItemData.measurements,
      editingItemData.runningMeasurements
    );

    const updatedItem: Item = {
      ...editingItemData,
      id: itemId,
      amountPerSqFt: editingItemData.amountPerSqFt,
      totalAmount: calculatedTotal
    };

    setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    setEditingItem(null);
    setEditingItemData(null);
    setHasChanges(true);

    Swal.fire({
      icon: 'success',
      title: 'Item Updated!',
      text: 'Item has been updated successfully.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingItemData(null);
  };

  const handleCancelEditMode = () => {
    setIsEditMode(false);
    // Reset items to original estimate
    if (estimate) {
      setItems(estimate.items);
      setEstimateName(estimate.estimateName);
    }
  };

  const handleDownloadEstimate = () => {
    if (!estimate || !clientDetails) return;

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
      doc.text(`Estimate No: EST-${new Date(estimate.createdAt).getFullYear()}-${String(estimate._id).slice(-6).toUpperCase()}`, 15, 95);
      doc.text(`Date: ${new Date(estimate.createdAt).toLocaleDateString()}`, 15, 105);
      
      // Add client details on right with better structure
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text("BILL TO", 110, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(clientDetails.name, 110, 95);
      doc.text(clientDetails.location || "", 110, 105);
      
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

                const amountPerSqFt = item.amountPerSqFt || 0;
                
                const row = [
                  combinedText,
                  measurements,
                  customRoundSqFeet(totalSqFeet).toFixed(1),
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

      const subTotal = estimate.items.reduce((total, item) => {
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
      
      if (estimate.discount && estimate.discount > 0) {
        yPos += 7;
        const discountAmount = estimate.discountType === 'percentage' 
          ? (subTotal * estimate.discount) / 100 
          : estimate.discount;
        doc.text(`Discount:`, 149, yPos);
        doc.text(`- Rs ${discountAmount.toFixed(2)}`, 191, yPos, { align: 'right' });
      }
      
      yPos += 7;
      doc.setFontSize(12);
      doc.text(`Grand Total:`, 135, yPos);
      doc.text(`Rs ${estimate.totalAmount.toFixed(2)}`, 191, yPos, { align: 'right' });

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

      const fileName = `${clientDetails.name.trim().replace(/\s+/g, '_')}_estimate.pdf`;
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

  const handleShareEstimate = () => {
    setShowShareModal(true);
  };

  const handleApproveEstimate = async () => {
    if (!estimate) return;

    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Approve Estimate?',
      text: `Are you sure you want to approve "${estimate.estimateName}"? This will delete all other estimates for this client.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, Approve!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/interior-estimates/${estimateId}/approve`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to approve estimate');
        }

        // Update local state
        setEstimate(prev => prev ? { ...prev, status: 'approved' } : null);

        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Estimate Approved!',
          text: `Estimate "${estimate.estimateName}" has been approved successfully. ${data.deletedEstimatesCount} other estimates for this client have been deleted.`,
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 5000
        });

        // Redirect to estimates page after a short delay
        setTimeout(() => {
          if (estimate?.clientId && clientDetails) {
            const params = new URLSearchParams();
            params.set('clientId', estimate.clientId);
            params.set('clientName', clientDetails.name);
            router.push(`/dashboard/estimates?${params.toString()}`);
          } else {
            router.push('/dashboard/estimates');
          }
        }, 2000);

      } catch (error) {
        console.error('Error approving estimate:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error instanceof Error ? error.message : 'Failed to approve estimate',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      }
    }
  };

  const handleWhatsAppShare = () => {
    if (!estimate || !clientDetails) return;

    const message = `*Greetings from Takshaga Spatial Solutions*

Dear ${clientDetails.name},

Thank you for choosing *Takshaga Spatial Solutions* for your interior design project. We are pleased to present your detailed estimate.

*Estimate Summary:*
• Total Amount: ₹${estimate.totalAmount.toFixed(0)}
• Items Included: ${estimate.items.length} categories

*View Complete Estimate:*
${window.location.origin}/share/estimate/${estimateId}

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
    setShowShareModal(false);
  };

  const handleCopyLink = async () => {
    try {
      const shareUrl = `${window.location.origin}/share/estimate/${estimateId}`;
      await navigator.clipboard.writeText(shareUrl);
      Swal.fire({
        icon: 'success',
        title: 'Link Copied!',
        text: 'Estimate link has been copied to clipboard.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 2000
      });
      setShowShareModal(false);
    } catch {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to copy link.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
    setHasChanges(true);
    Swal.fire({
      icon: 'success',
      title: 'Item Removed!',
      text: 'Item has been removed from the estimate.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleAddCustomItem = () => {
    setShowCustomItemModal(true);
  };

  // Add new item function










  const addMeasurementDirectly = (item: Item) => {
    const measurement = {
      id: Date.now().toString(),
      length: 0,
      breadth: 0
    };

    const updatedMeasurements = [...(item.measurements || []), measurement];
    updateItemTotal(item.id, { measurements: updatedMeasurements });
    setEditingItemData(prev => prev ? { ...prev, measurements: updatedMeasurements } : null);
  };

  const addRunningMeasurementDirectly = (item: Item) => {
    const runningMeasurement = {
      id: Date.now().toString(),
      length: 0
    };

    const updatedRunningMeasurements = [...(item.runningMeasurements || []), runningMeasurement];
    updateItemTotal(item.id, { runningMeasurements: updatedRunningMeasurements });
    setEditingItemData(prev => prev ? { ...prev, runningMeasurements: updatedRunningMeasurements } : null);
  };

  const addMeasurementToItem = () => {
    if (!newMeasurement.length || !newMeasurement.breadth) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please enter both length and breadth.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    const measurement = {
      id: Date.now().toString(),
      length: parseFloat(newMeasurement.length) || 0,
      breadth: parseFloat(newMeasurement.breadth) || 0
    };

    if (editingItem) {
      const updatedMeasurements = [...(editingItem.measurements || []), measurement];
      updateItemTotal(editingItem.id, { measurements: updatedMeasurements });
      setEditingItemData(prev => prev ? { ...prev, measurements: updatedMeasurements } : null);
    }

    setNewMeasurement({ length: "", breadth: "" });
    setShowMeasurementModal(false);
  };

  // Conversion functions
  const cmToSqFeet = (lengthCm: number, breadthCm: number): number => {
    const sqCm = lengthCm * breadthCm;
    const result = sqCm / 929.03;
    return isFinite(result) ? result : 0;
  };

  const customRoundSqFeet = (value: number): number => {
    const floorValue = Math.floor(value);
    const decimal = value - floorValue;
    if (decimal >= 0.5) {
      return Math.ceil(value);
    } else {
      return floorValue;
    }
  };

  const calculateTotalSqFeet = (measurements: Measurement[]): number => {
    return measurements.reduce((total, measurement) => {
      return total + cmToSqFeet(measurement.length, measurement.breadth);
    }, 0);
  };

  const calculateTotalRunningFeet = (runningMeasurements: RunningMeasurement[]): number => {
    return runningMeasurements.reduce((total, measurement) => {
      return total + cmToFeet(measurement.length);
    }, 0);
  };

  const cmToFeet = (cm: number): number => {
    const result = cm / 30.48;
    return isFinite(result) ? result : 0;
  };

  // Calculate subtotal (sum of all items)
  const calculateSubtotal = (): number => {
    return items.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  // Calculate discount amount
  const calculateDiscountAmount = (): number => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * discount) / 100;
    } else {
      return discount; // Fixed amount discount
    }
  };

  // Calculate final total after discount
  const calculateFinalTotal = (): number => {
    const subtotal = calculateSubtotal();
    const discountAmount = calculateDiscountAmount();
    return subtotal - discountAmount;
  };

  const calculateTotalAmount = (type: string, length?: number, breadth?: number, pieces?: number, runningLength?: number, amountPerSqFt?: number, measurements?: Measurement[], runningMeasurements?: RunningMeasurement[]): number => {
    let total = 0;
    
    if (type === 'area') {
      const singleSqFeet = cmToSqFeet(length || 0, breadth || 0);
      const measurementsSqFeet = measurements ? calculateTotalSqFeet(measurements) : 0;
      const totalSqFeet = singleSqFeet + measurementsSqFeet;
      const roundedSqFeet = customRoundSqFeet(totalSqFeet);
      total = roundedSqFeet * (amountPerSqFt || 0);
    } else if (type === 'pieces') {
      total = (pieces || 0) * (amountPerSqFt || 0);
    } else if (type === 'running') {
      const singleFeet = cmToFeet(runningLength || 0);
      const measurementsFeet = runningMeasurements ? calculateTotalRunningFeet(runningMeasurements) : 0;
      const totalFeet = singleFeet + measurementsFeet;
      total = totalFeet * (amountPerSqFt || 0);
    }
    
    return total;
  };

  const updateItemTotal = (itemId: string, newData: Partial<Item>) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...newData };
        // Use the existing amountPerSqFt or the new one from newData
        const amountPerSqFt = updatedItem.amountPerSqFt || 0;
        const calculatedTotal = calculateTotalAmount(
          updatedItem.type,
          updatedItem.length || 0,
          updatedItem.breadth || 0,
          updatedItem.pieces || 0,
          updatedItem.runningLength || 0,
          amountPerSqFt,
          updatedItem.measurements,
          updatedItem.runningMeasurements
        );
        return { ...updatedItem, totalAmount: isFinite(calculatedTotal) ? calculatedTotal : 0 };
      }
      return item;
    }));
  };

  const handleSaveCustomItem = () => {
    if (!customItem.categoryName || !customItem.subCategoryName || !customItem.materialName) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'Please fill in all required fields.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Validate area type inputs
    if (customItem.type === 'area' && !customItem.totalAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'For area type, please fill in amount per sq ft.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Validate pieces type inputs
    if (customItem.type === 'pieces' && (!customItem.pieces || !customItem.totalAmount)) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'For pieces type, please fill in number of pieces and amount per piece.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Validate running type inputs
    if (customItem.type === 'running' && (!customItem.runningLength || !customItem.totalAmount)) {
      Swal.fire({
        icon: 'error',
        title: 'Missing Information',
        text: 'For running type, please fill in running length and amount per sq ft.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    const amountPerSqFt = parseFloat(customItem.totalAmount) || 0;
    const calculatedTotal = calculateTotalAmount(
      customItem.type,
      parseFloat(customItem.length) || 0,
      parseFloat(customItem.breadth) || 0,
      parseInt(customItem.pieces) || 0,
      parseFloat(customItem.runningLength) || 0,
      amountPerSqFt,
      customItem.measurements
    );

    const item: Item = {
      id: Date.now().toString(),
      sectionId: 'custom',
      sectionName: customItem.materialName,
      categoryName: customItem.categoryName,
      subCategoryName: customItem.subCategoryName,
      materialName: customItem.materialName,
      type: customItem.type,
      description: customItem.description,
      totalAmount: calculatedTotal,
      ...(customItem.type === 'area' && {
        length: parseFloat(customItem.length) || 0,
        breadth: parseFloat(customItem.breadth) || 0,
        measurements: customItem.measurements.length > 0 ? customItem.measurements : undefined
      }),
      ...(customItem.type === 'pieces' && {
        pieces: parseInt(customItem.pieces) || 0
      }),
      ...((customItem.type === 'running' || customItem.type === 'running_sq_feet') && {
        runningLength: parseFloat(customItem.runningLength) || 0
      })
    };

    setItems(prev => [...prev, item]);
    setHasChanges(true);
    setShowCustomItemModal(false);
    setCustomItem({
      categoryId: "",
      categoryName: "",
      subCategoryId: "",
      subCategoryName: "",
      materialName: "",
      description: "",
      type: "" as 'area' | 'pieces' | 'running' | 'running_sq_feet',
      length: "",
      breadth: "",
      pieces: "",
      runningLength: "",
      totalAmount: "",
      measurements: []
    });

    Swal.fire({
      icon: 'success',
      title: 'Custom Item Added!',
      text: 'Custom item has been added to the estimate.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 2000
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading estimate details...</span>
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
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Estimate Not Found</h1>
              <p className="text-gray-600 mb-6">{error || 'The estimate you are looking for does not exist.'}</p>
              <button
                onClick={handleBackToEstimates}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Estimates
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
              onClick={handleBackToEstimates}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interior Estimate Details</h1>
              <p className="text-gray-600 mt-1">
                {estimate.estimateName}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            {!isEditMode && (
              <>
                {estimate.status !== 'approved' && (
                  <button
                    onClick={handleApproveEstimate}
                    className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors cursor-pointer text-sm"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>Approve</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadEstimate}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleShareEstimate}
                  className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-sm"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
                <button
                  onClick={handleEditEstimate}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Estimate</span>
                </button>
              </>
            )}
            {isEditMode && (
              <>
                <button
                  onClick={hasChanges ? handleCancelChanges : handleCancelEditMode}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                {hasChanges && (
                  <button
                    onClick={handleUpdateEstimate}
                    className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm"
                  >
                    <Save className="h-4 w-4" />
                    <span>Update Estimate</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Estimate Info */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Estimate Info</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium text-blue-700">Name:</span>
                  <p className="text-blue-900">{estimate.estimateName}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Created:</span>
                  <p className="text-blue-900">{new Date(estimate.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">Status:</span>
                  <div className="flex items-center mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      estimate.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {estimate.status === 'approved' ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {clientDetails && (
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-green-900 mb-2">Client Info</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-green-700">Name:</span>
                    <p className="text-green-900">{clientDetails.name}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Email:</span>
                    <p className="text-green-900">{clientDetails.email}</p>
                  </div>
                  <div>
                    <span className="font-medium text-green-700">Phone:</span>
                    <p className="text-green-900">{clientDetails.phone}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-purple-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">Total Amount</h3>
              
              {/* Subtotal */}
              <div className="flex justify-between items-center mb-2">
                <span className="text-purple-700 font-medium">Subtotal:</span>
                <span className="text-purple-900 font-semibold">
                  ₹{isEditMode ? calculateSubtotal().toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : (estimate.discount && estimate.discount > 0 ? (estimate.discountType === 'percentage' ? (estimate.totalAmount / (1 - estimate.discount / 100)) : (estimate.totalAmount + estimate.discount)) : estimate.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              </div>

              {/* Discount Section */}
              {isEditMode && (
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-purple-700 font-medium">Discount:</span>
                    <select
                      value={discountType}
                      onChange={(e) => {
                        setDiscountType(e.target.value as 'percentage' | 'fixed');
                        setHasChanges(true);
                      }}
                      className="px-2 py-1 border border-purple-300 rounded text-sm text-purple-900"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">₹</option>
                    </select>
                    <input
                      type="number"
                      value={discount}
                      onChange={(e) => {
                        const newDiscount = parseFloat(e.target.value) || 0;
                        setDiscount(newDiscount);
                        setHasChanges(true);
                      }}
                      className="w-20 px-2 py-1 border border-purple-300 rounded text-sm text-purple-900"
                      min="0"
                      max={discountType === 'percentage' ? "100" : undefined}
                      step="0.1"
                    />
                  </div>
                  <span className="text-purple-900 font-semibold">
                    -₹{calculateDiscountAmount().toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </div>
              )}

              {/* Show discount in view mode */}
              {!isEditMode && estimate.discount && estimate.discount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-700 font-medium">
                    Discount ({estimate.discountType === 'percentage' ? `${estimate.discount}%` : `₹${estimate.discount}`}):
                  </span>
                  <span className="text-purple-900 font-semibold">
                    -₹{estimate.discountType === 'percentage' ? ((estimate.totalAmount * estimate.discount) / 100).toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : estimate.discount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </div>
              )}

              {/* Final Total */}
              <div className="border-t border-purple-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-900 font-bold text-lg">Grand Total:</span>
                  <span className="text-purple-600 font-bold text-2xl">
                    ₹{isEditMode ? calculateFinalTotal().toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : estimate.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditMode ? 'Edit Estimate Items' : 'Estimate Items'}
            </h2>
          </div>

          {isEditMode ? (
            <>
              {/* Category Selection */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Items</h2>
                
                {dataLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 text-gray-600">Loading data...</span>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => handleCategoryChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                        >
                          <option value="" className="text-gray-500">Select Category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id} className="text-black">
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                        <select
                          value={selectedSubCategory}
                          onChange={(e) => handleSubCategoryChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          disabled={!selectedCategory}
                        >
                          <option value="" className="text-gray-500">Select Sub Category</option>
                          {filteredSubCategories.map(subCategory => (
                            <option key={subCategory.id} value={subCategory.id} className="text-black">
                              {subCategory.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                        <select
                          value={selectedSection}
                          onChange={(e) => handleSectionChange(e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                          disabled={!selectedSubCategory}
                        >
                          <option value="" className="text-gray-500">Select Section</option>
                          {filteredSections.map(section => (
                            <option key={section.id} value={section.id} className="text-black">
                              {section.material} - {section.description} ({section.type})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Add Custom Item Button */}
                    <button
                      onClick={handleAddCustomItem}
                      className="flex items-center space-x-2 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition-colors cursor-pointer text-sm w-auto"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add Custom Item</span>
                    </button>
                  </>
                )}
              </div>

              {/* Items List */}
              {items.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Estimate Items</h2>
                  </div>

                  <div className="space-y-6">
                    {(() => {
                      // Group items by category and subcategory
                      const groupedItems = items.reduce((acc, item) => {
                        if (!acc[item.categoryName]) {
                          acc[item.categoryName] = {};
                        }
                        if (!acc[item.categoryName][item.subCategoryName]) {
                          acc[item.categoryName][item.subCategoryName] = [];
                        }
                        acc[item.categoryName][item.subCategoryName].push(item);
                        return acc;
                      }, {} as Record<string, Record<string, typeof items>>);

                      return Object.entries(groupedItems).map(([categoryName, subCategories]) => (
                        <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Category Header */}
                          <div className="bg-blue-600 text-white px-6 py-4">
                            <h4 className="text-lg font-semibold">{categoryName}</h4>
                          </div>
                          
                          {Object.entries(subCategories).map(([subCategoryName, categoryItems]) => (
                            <div key={subCategoryName} className="border-b border-gray-200 last:border-b-0">
                              {/* Sub Category Header */}
                              <div className="bg-gray-100 px-6 py-3">
                                <h5 className="text-md font-medium text-gray-800">{subCategoryName}</h5>
                              </div>
                              
                              {/* Sections Table */}
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Material Name</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Description</th>
                                      {categoryItems.some(item => item.type === 'area') && (
                                        <>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Length (cm)</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200"></th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Breadth (cm)</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sq Feet</th>
                                        </>
                                      )}
                                      {categoryItems.some(item => item.type === 'pieces') && (
                                        <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Pieces</th>
                                      )}
                                      {categoryItems.some(item => item.type === 'running') && (
                                        <>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Running Length (cm)</th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200"></th>
                                          <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Feet</th>
                                        </>
                                      )}
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Amount per sq ft</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Total</th>
                                      <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {categoryItems.map((item) => (
                                      <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                        <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                          {editingItem?.id === item.id ? (
                                            <input
                                              type="text"
                                              value={editingItemData?.materialName || item.materialName}
                                              onChange={(e) => setEditingItemData(prev => prev ? { ...prev, materialName: e.target.value } : null)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                          ) : (
                                            item.materialName
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                          {editingItem?.id === item.id ? (
                                            <input
                                              type="text"
                                              value={editingItemData?.description || item.description}
                                              onChange={(e) => setEditingItemData(prev => prev ? { ...prev, description: e.target.value } : null)}
                                              className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                          ) : (
                                            item.description
                                          )}
                                        </td>
                                        {categoryItems.some(i => i.type === 'area') && (
                                          <>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'area' ? (
                                                <div className="space-y-2">
                                                  <div className="flex justify-end">
                                                    <input
                                                      type="number"
                                                      value={editingItemData?.length || item.length || 0}
                                                      onChange={(e) => {
                                                        const newLength = parseFloat(e.target.value) || 0;
                                                        setEditingItemData(prev => prev ? { ...prev, length: newLength } : null);
                                                        updateItemTotal(item.id, { length: newLength });
                                                      }}
                                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                      placeholder="Length"
                                                    />
                                                  </div>
                                                  {/* Show added measurements */}
                                                  {editingItemData?.measurements && editingItemData.measurements.length > 0 && (
                                                    <div className="space-y-1">
                                                      {editingItemData.measurements.map((measurement) => (
                                                        <div key={measurement.id} className="flex justify-end">
                                                          <input
                                                            type="number"
                                                            value={measurement.length}
                                                            onChange={(e) => {
                                                              const newMeasurements = editingItemData.measurements?.map(m => 
                                                                m.id === measurement.id ? { ...m, length: parseFloat(e.target.value) || 0 } : m
                                                              ) || [];
                                                              setEditingItemData(prev => prev ? { ...prev, measurements: newMeasurements } : null);
                                                              updateItemTotal(item.id, { measurements: newMeasurements });
                                                            }}
                                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            placeholder="Length"
                                                          />
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                item.type === 'area' ? (
                                                  item.measurements && item.measurements.length > 0 ? (
                                                    <div className="space-y-1">
                                                      <div className="text-center">{item.length || 0}</div>
                                                      {item.measurements.map((measurement) => (
                                                        <div key={measurement.id} className="text-center text-xs text-gray-500">
                                                          {measurement.length}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <div className="text-center">{item.length || 0}</div>
                                                  )
                                                ) : '-'
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'area' ? (
                                                <div className="space-y-2">
                                                  {/* Empty space for first row */}
                                                  <div className="h-8"></div>
                                                  {/* Cross icons for each measurement */}
                                                  {editingItemData?.measurements && editingItemData.measurements.length > 0 && (
                                                    <div className="space-y-1">
                                                      {editingItemData.measurements.map((measurement) => (
                                                        <div key={measurement.id} className="flex justify-center">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const newMeasurements = editingItemData.measurements?.filter(m => m.id !== measurement.id) || [];
                                                              setEditingItemData(prev => prev ? { ...prev, measurements: newMeasurements } : null);
                                                              updateItemTotal(item.id, { measurements: newMeasurements });
                                                            }}
                                                            className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600 transition-colors"
                                                            title="Remove Measurement"
                                                          >
                                                            ×
                                                          </button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {/* Add button in 3rd row */}
                                                  <div className="flex justify-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => addMeasurementDirectly(item)}
                                                      className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
                                                      title="Add Measurement"
                                                    >
                                                      <Plus className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                '-'
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'area' ? (
                                                <div className="space-y-2">
                                                  <div className="flex justify-center">
                                                    <input
                                                      type="number"
                                                      value={editingItemData?.breadth || item.breadth || 0}
                                                      onChange={(e) => {
                                                        const newBreadth = parseFloat(e.target.value) || 0;
                                                        setEditingItemData(prev => prev ? { ...prev, breadth: newBreadth } : null);
                                                        updateItemTotal(item.id, { breadth: newBreadth });
                                                      }}
                                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                      placeholder="Breadth"
                                                    />
                                                  </div>
                                                  {/* Show added measurements */}
                                                  {editingItemData?.measurements && editingItemData.measurements.length > 0 && (
                                                    <div className="space-y-1">
                                                      {editingItemData.measurements.map((measurement) => (
                                                        <div key={measurement.id} className="flex justify-center">
                                                          <input
                                                            type="number"
                                                            value={measurement.breadth}
                                                            onChange={(e) => {
                                                              const newMeasurements = editingItemData.measurements?.map(m => 
                                                                m.id === measurement.id ? { ...m, breadth: parseFloat(e.target.value) || 0 } : m
                                                              ) || [];
                                                              setEditingItemData(prev => prev ? { ...prev, measurements: newMeasurements } : null);
                                                              updateItemTotal(item.id, { measurements: newMeasurements });
                                                            }}
                                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            placeholder="Breadth"
                                                          />
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                item.type === 'area' ? (
                                                  item.measurements && item.measurements.length > 0 ? (
                                                    <div className="space-y-1">
                                                      <div className="text-center">{item.breadth || 0}</div>
                                                      {item.measurements.map((measurement) => (
                                                        <div key={measurement.id} className="text-center text-xs text-gray-500">
                                                          {measurement.breadth}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <div className="text-center">{item.breadth || 0}</div>
                                                  )
                                                ) : '-'
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'area' ? (
                                                <div className="text-sm font-medium text-blue-600">
                                                  {(() => {
                                                    const singleSqFeet = cmToSqFeet(editingItemData?.length || 0, editingItemData?.breadth || 0);
                                                    const measurementsSqFeet = editingItemData?.measurements ? calculateTotalSqFeet(editingItemData.measurements) : 0;
                                                    const total = singleSqFeet + measurementsSqFeet;
                                                    return customRoundSqFeet(total).toFixed(2);
                                                  })()} sq ft
                                                </div>
                                              ) : (
                                                item.type === 'area' ? (
                                                  <div className="text-center">
                                                    {(() => {
                                                      const singleSqFeet = cmToSqFeet(item.length || 0, item.breadth || 0);
                                                      const measurementsSqFeet = item.measurements ? calculateTotalSqFeet(item.measurements) : 0;
                                                      const total = singleSqFeet + measurementsSqFeet;
                                                      return customRoundSqFeet(total).toFixed(2);
                                                    })()}
                                                  </div>
                                                ) : '-'
                                              )}
                                            </td>
                                          </>
                                        )}
                                        {categoryItems.some(i => i.type === 'pieces') && (
                                          <td className="py-3 px-4 text-sm text-gray-600">
                                            {editingItem?.id === item.id && item.type === 'pieces' ? (
                                              <input
                                                type="number"
                                                value={editingItemData?.pieces || item.pieces || 0}
                                                onChange={(e) => {
                                                  const newPieces = parseInt(e.target.value) || 0;
                                                  setEditingItemData(prev => prev ? { ...prev, pieces: newPieces } : null);
                                                  updateItemTotal(item.id, { pieces: newPieces });
                                                }}
                                                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                              />
                                            ) : (
                                              item.type === 'pieces' ? (
                                                <div className="text-center">{item.pieces}</div>
                                              ) : '-'
                                            )}
                                          </td>
                                        )}
                                        {categoryItems.some(i => i.type === 'running') && (
                                          <>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'running' ? (
                                                <div className="space-y-2">
                                                  <div className="flex justify-center">
                                                    <input
                                                      type="number"
                                                      value={editingItemData?.runningLength || item.runningLength || 0}
                                                      onChange={(e) => {
                                                        const newRunningLength = parseFloat(e.target.value) || 0;
                                                        setEditingItemData(prev => prev ? { ...prev, runningLength: newRunningLength } : null);
                                                        updateItemTotal(item.id, { runningLength: newRunningLength });
                                                      }}
                                                      className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                      placeholder="Length"
                                                    />
                                                  </div>
                                                  {/* Show added running measurements */}
                                                  {editingItemData?.runningMeasurements && editingItemData.runningMeasurements.length > 0 && (
                                                    <div className="space-y-1">
                                                      {editingItemData.runningMeasurements.map((measurement) => (
                                                        <div key={measurement.id} className="flex justify-center">
                                                          <input
                                                            type="number"
                                                            value={measurement.length}
                                                            onChange={(e) => {
                                                              const newRunningMeasurements = editingItemData.runningMeasurements?.map(m => 
                                                                m.id === measurement.id ? { ...m, length: parseFloat(e.target.value) || 0 } : m
                                                              ) || [];
                                                              setEditingItemData(prev => prev ? { ...prev, runningMeasurements: newRunningMeasurements } : null);
                                                              updateItemTotal(item.id, { runningMeasurements: newRunningMeasurements });
                                                            }}
                                                            className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                                            placeholder="Length"
                                                          />
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                item.type === 'running' ? (
                                                  item.runningMeasurements && item.runningMeasurements.length > 0 ? (
                                                    <div className="space-y-1">
                                                      <div className="text-center">{item.runningLength || 0}</div>
                                                      {item.runningMeasurements.map((measurement) => (
                                                        <div key={measurement.id} className="text-center text-xs text-gray-500">
                                                          {measurement.length}
                                                        </div>
                                                      ))}
                                                    </div>
                                                  ) : (
                                                    <div className="text-center">{item.runningLength || 0}</div>
                                                  )
                                                ) : '-'
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'running' ? (
                                                <div className="space-y-2">
                                                  {/* Empty space for first row */}
                                                  <div className="h-8"></div>
                                                  {/* Cross icons for each running measurement */}
                                                  {editingItemData?.runningMeasurements && editingItemData.runningMeasurements.length > 0 && (
                                                    <div className="space-y-1">
                                                      {editingItemData.runningMeasurements.map((measurement) => (
                                                        <div key={measurement.id} className="flex justify-center">
                                                          <button
                                                            type="button"
                                                            onClick={() => {
                                                              const newRunningMeasurements = editingItemData.runningMeasurements?.filter(m => m.id !== measurement.id) || [];
                                                              setEditingItemData(prev => prev ? { ...prev, runningMeasurements: newRunningMeasurements } : null);
                                                              updateItemTotal(item.id, { runningMeasurements: newRunningMeasurements });
                                                            }}
                                                            className="w-6 h-6 bg-red-500 text-white rounded flex items-center justify-center hover:bg-red-600 transition-colors"
                                                            title="Remove Measurement"
                                                          >
                                                            ×
                                                          </button>
                                                        </div>
                                                      ))}
                                                    </div>
                                                  )}
                                                  {/* Add button in 3rd row */}
                                                  <div className="flex justify-center">
                                                    <button
                                                      type="button"
                                                      onClick={() => addRunningMeasurementDirectly(item)}
                                                      className="w-6 h-6 bg-blue-600 text-white rounded flex items-center justify-center hover:bg-blue-700 transition-colors"
                                                      title="Add Measurement"
                                                    >
                                                      <Plus className="h-3 w-3" />
                                                    </button>
                                                  </div>
                                                </div>
                                              ) : (
                                                '-'
                                              )}
                                            </td>
                                            <td className="py-3 px-4 text-sm text-gray-600">
                                              {editingItem?.id === item.id && item.type === 'running' ? (
                                                <div className="text-sm font-medium text-blue-600">
                                                  {(() => {
                                                    const singleFeet = cmToFeet(editingItemData?.runningLength || 0);
                                                    const measurementsFeet = editingItemData?.runningMeasurements ? calculateTotalRunningFeet(editingItemData.runningMeasurements) : 0;
                                                    const total = singleFeet + measurementsFeet;
                                                    return total.toFixed(2);
                                                  })()} ft
                                                </div>
                                              ) : (
                                                item.type === 'running' ? (
                                                  (() => {
                                                    const singleFeet = cmToFeet(item.runningLength || 0);
                                                    const measurementsFeet = item.runningMeasurements ? calculateTotalRunningFeet(item.runningMeasurements) : 0;
                                                    const total = singleFeet + measurementsFeet;
                                                    return total.toFixed(2);
                                                  })()
                                                ) : '-'
                                              )}
                                            </td>
                                          </>
                                        )}
                                        <td className="py-3 px-4 text-sm text-gray-600">
                                          {editingItem?.id === item.id ? (
                                            <input
                                              type="number"
                                              value={editingItemData?.amountPerSqFt ?? item.amountPerSqFt ?? 0}
                                              onChange={(e) => {
                                                const newAmountPerSqFt = parseFloat(e.target.value) || 0;
                                                setEditingItemData(prev => prev ? { ...prev, amountPerSqFt: newAmountPerSqFt } : null);
                                                updateItemTotal(item.id, { amountPerSqFt: newAmountPerSqFt });
                                              }}
                                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                            />
                                          ) : (
                                            <div className="text-center">
                                              ₹{(() => {
                                                let amount = 0;
                                                if (item.type === 'area') {
                                                  amount = item.amountPerSqFt || 0;
                                                } else if (item.type === 'pieces') {
                                                  amount = (item.pieces || 0) > 0 ? (item.totalAmount / (item.pieces || 1)) : 0;
                                                } else {
                                                  amount = item.amountPerSqFt || 0;
                                                }
                                                return isFinite(amount) ? amount.toFixed(2) : '0.00';
                                              })().toLocaleString()}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-3 px-4 text-sm font-semibold text-green-600">
                                          <div className="text-center">
                                            ₹{(() => {
                                              const amount = editingItemData?.totalAmount || item.totalAmount;
                                              return isFinite(amount) ? amount.toFixed(1) : '0.0';
                                            })()}
                                          </div>
                                        </td>
                                        <td className="py-3 px-4">
                                          <div className="flex space-x-2">
                                            {editingItem?.id === item.id ? (
                                              <>
                                                <button
                                                  onClick={() => handleSaveEdit(item.id)}
                                                  className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors cursor-pointer"
                                                  title="Save Changes"
                                                >
                                                  <Save className="h-4 w-4" />
                                                </button>
                                                <button
                                                  onClick={handleCancelEdit}
                                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                  title="Cancel Edit"
                                                >
                                                  <X className="h-4 w-4" />
                                                </button>
                                              </>
                                            ) : (
                                              <>
                                                <button
                                                  onClick={() => handleEditItem(item)}
                                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                                  title="Edit Item"
                                                >
                                                  <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                  onClick={() => handleRemoveItem(item.id)}
                                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                                  title="Remove Item"
                                                >
                                                  <Trash2 className="h-4 w-4" />
                                                </button>
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}
            </>
          ) : (
            // View mode - show original estimate items
            <div className="space-y-6">
              {(() => {
                // Group items by category and subcategory
                const groupedItems = estimate.items.reduce((acc, item) => {
                  if (!acc[item.categoryName]) {
                    acc[item.categoryName] = {};
                  }
                  if (!acc[item.categoryName][item.subCategoryName]) {
                    acc[item.categoryName][item.subCategoryName] = [];
                  }
                  acc[item.categoryName][item.subCategoryName].push(item);
                  return acc;
                }, {} as Record<string, Record<string, typeof estimate.items>>);

                return Object.entries(groupedItems).map(([categoryName, subCategories]) => (
                  <div key={categoryName} className="border border-gray-200 rounded-lg overflow-hidden">
                    {/* Category Header */}
                    <div className="bg-blue-600 text-white px-6 py-4">
                      <h4 className="text-lg font-semibold">{categoryName}</h4>
                    </div>
                    
                    {Object.entries(subCategories).map(([subCategoryName, categoryItems]) => (
                      <div key={subCategoryName} className="border-b border-gray-200 last:border-b-0">
                        {/* Sub Category Header */}
                        <div className="bg-gray-100 px-6 py-3">
                          <h5 className="text-md font-medium text-gray-800">{subCategoryName}</h5>
                        </div>
                        
                        {/* Sections Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Material Name</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Description</th>
                                {categoryItems.some(item => item.type === 'area') && (
                                  <>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Length (cm)</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200"></th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Breadth (cm)</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sq Feet</th>
                                  </>
                                )}
                                {categoryItems.some(item => item.type === 'pieces') && (
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Pieces</th>
                                )}
                                {categoryItems.some(item => item.type === 'running') && (
                                  <>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Running Length (cm)</th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200"></th>
                                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Feet</th>
                                  </>
                                )}
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Amount per sq ft</th>
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryItems.map((item) => (
                                <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                                  <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                    {item.materialName}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    {item.description}
                                  </td>
                                  {categoryItems.some(i => i.type === 'area') && (
                                    <>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {item.type === 'area' ? (
                                          item.measurements && item.measurements.length > 0 ? (
                                            <div className="space-y-1">
                                              <div className="text-center">{item.length || 0}</div>
                                              {item.measurements.map((measurement) => (
                                                <div key={measurement.id} className="text-center text-xs text-gray-500">
                                                  {measurement.length}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center">{item.length || 0}</div>
                                          )
                                        ) : '-'
                                      }
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">-</td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {item.type === 'area' ? (
                                          item.measurements && item.measurements.length > 0 ? (
                                            <div className="space-y-1">
                                              <div className="text-center">{item.breadth || 0}</div>
                                              {item.measurements.map((measurement) => (
                                                <div key={measurement.id} className="text-center text-xs text-gray-500">
                                                  {measurement.breadth}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center">{item.breadth || 0}</div>
                                          )
                                        ) : '-'
                                      }
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {item.type === 'area' ? (
                                          <div className="text-center">
                                            {(() => {
                                              const singleSqFeet = cmToSqFeet(item.length || 0, item.breadth || 0);
                                              const measurementsSqFeet = item.measurements ? 
                                                item.measurements.reduce((total, m) => total + cmToSqFeet(m.length, m.breadth), 0) : 0;
                                              const total = singleSqFeet + measurementsSqFeet;
                                              return customRoundSqFeet(total).toFixed(1);
                                            })()}
                                          </div>
                                        ) : '-'
                                      }
                                      </td>
                                    </>
                                  )}
                                  {categoryItems.some(i => i.type === 'pieces') && (
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'pieces' ? (
                                        <div className="text-center">{item.pieces}</div>
                                      ) : '-'
                                    }
                                    </td>
                                  )}
                                  {categoryItems.some(i => i.type === 'running') && (
                                    <>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {item.type === 'running' ? (
                                          item.runningMeasurements && item.runningMeasurements.length > 0 ? (
                                            <div className="space-y-1">
                                              <div className="text-center">{item.runningLength || 0}</div>
                                              {item.runningMeasurements.map((measurement) => (
                                                <div key={measurement.id} className="text-center text-xs text-gray-500">
                                                  {measurement.length}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div className="text-center">{item.runningLength || 0}</div>
                                          )
                                        ) : '-'
                                      }
                                      </td>
                                      <td className="py-3 px-4 text-sm text-gray-600">-</td>
                                      <td className="py-3 px-4 text-sm text-gray-600">
                                        {item.type === 'running' ? (
                                          <div className="text-center">
                                            {(() => {
                                              const singleFeet = cmToFeet(item.runningLength || 0);
                                              const measurementsFeet = item.runningMeasurements ? 
                                                item.runningMeasurements.reduce((total, m) => total + cmToFeet(m.length), 0) : 0;
                                              const total = singleFeet + measurementsFeet;
                                              return total.toFixed(1);
                                            })()}
                                          </div>
                                        ) : '-'
                                      }
                                      </td>
                                    </>
                                  )}
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    <div className="text-center">
                                      ₹{(() => {
                                        let amount = 0;
                                        if (item.type === 'area') {
                                          amount = item.amountPerSqFt || 0;
                                        } else if (item.type === 'pieces') {
                                          amount = (item.pieces || 0) > 0 ? (item.totalAmount / (item.pieces || 1)) : 0;
                                        } else {
                                          amount = item.amountPerSqFt || 0;
                                        }
                                        return isFinite(amount) ? amount.toFixed(1) : '0.0';
                                      })().toLocaleString()}
                                    </div>
                                  </td>
                                  <td className="py-3 px-4 text-sm font-semibold text-green-600">
                                    <div className="text-center">
                                      ₹{item.totalAmount.toFixed(1)}
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                ));
              })()}
            </div>
          )}
        </div>
      </div>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Estimate</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimate Name
              </label>
              <input
                type="text"
                value={estimateName}
                onChange={(e) => setEstimateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter estimate name"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWithName}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Modal */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Estimate</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimate Name
              </label>
              <input
                type="text"
                value={estimateName}
                onChange={(e) => setEstimateName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="Enter estimate name"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowUpdateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateWithName}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Item Modal */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Custom Item</h3>
              <button
                onClick={() => setShowCustomItemModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <input
                  type="text"
                  value={customItem.categoryName}
                  onChange={(e) => setCustomItem({...customItem, categoryName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sub Category</label>
                <input
                  type="text"
                  value={customItem.subCategoryName}
                  onChange={(e) => setCustomItem({...customItem, subCategoryName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter sub category name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Material</label>
                <input
                  type="text"
                  value={customItem.materialName}
                  onChange={(e) => setCustomItem({...customItem, materialName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter material name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <input
                  type="text"
                  value={customItem.description}
                  onChange={(e) => setCustomItem({...customItem, description: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={customItem.type}
                  onChange={(e) => setCustomItem({...customItem, type: e.target.value as 'area' | 'pieces' | 'running'})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="" className="text-gray-500">Select Type</option>
                  <option value="area" className="text-black">Area</option>
                  <option value="pieces" className="text-black">Pieces</option>
                  <option value="running" className="text-black">Running sq feet</option>
                </select>
              </div>

              {customItem.type === 'area' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length (cm) - Optional</label>
                    <input
                      type="number"
                      value={customItem.length}
                      onChange={(e) => setCustomItem({...customItem, length: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter length in cm (optional)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadth (cm) - Optional</label>
                    <input
                      type="number"
                      value={customItem.breadth}
                      onChange={(e) => setCustomItem({...customItem, breadth: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter breadth in cm (optional)"
                    />
                  </div>
                </div>
              )}

              {customItem.type === 'pieces' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pieces</label>
                  <input
                    type="number"
                    value={customItem.pieces}
                    onChange={(e) => setCustomItem({...customItem, pieces: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter number of pieces"
                  />
                </div>
              )}

              {customItem.type === 'running' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Running Length (cm)</label>
                  <input
                    type="number"
                    value={customItem.runningLength}
                    onChange={(e) => setCustomItem({...customItem, runningLength: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter running length in cm"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {customItem.type === 'area' ? 'Amount per sq ft (₹)' : 
                   customItem.type === 'pieces' ? 'Amount per piece (₹)' : 
                   'Amount per sq ft (₹)'}
                </label>
                <input
                  type="number"
                  value={customItem.totalAmount}
                  onChange={(e) => setCustomItem({...customItem, totalAmount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder={customItem.type === 'area' ? 'Enter amount per sq ft' : 
                             customItem.type === 'pieces' ? 'Enter amount per piece' : 
                             'Enter amount per sq ft'}
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowCustomItemModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Measurement Modal */}
      {showMeasurementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Measurement</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Length (cm)</label>
                <input
                  type="number"
                  value={newMeasurement.length}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, length: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Breadth (cm)</label>
                <input
                  type="number"
                  value={newMeasurement.breadth}
                  onChange={(e) => setNewMeasurement(prev => ({ ...prev, breadth: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addMeasurementToItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Add Measurement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Share Estimate</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center space-x-3 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>Share on WhatsApp</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center space-x-3 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Copy className="w-5 h-5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 