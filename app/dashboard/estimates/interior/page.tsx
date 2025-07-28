"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Home,
  Plus,
  Save,
  FileText,
  Mail,
  Phone,
  MapPin,
  X,
  Edit,
  Trash2,
  Copy
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';

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
}

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

interface ClientDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  createdAt: string;
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

export default function InteriorEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');
  const presetName = searchParams.get('presetName');
  
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasApprovedEstimate, setHasApprovedEstimate] = useState(false);
  const [approvedEstimate, setApprovedEstimate] = useState<Estimate | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [editingItemData, setEditingItemData] = useState<Item | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showCopyEstimateModal, setShowCopyEstimateModal] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [showEstimateNameModal, setShowEstimateNameModal] = useState(false);
  const [estimateName, setEstimateName] = useState("");
  const [newMeasurement, setNewMeasurement] = useState({ length: "", breadth: "" });
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [presets, setPresets] = useState<Array<{id: string; name: string; items: Item[]; totalAmount: number}>>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [clientEstimates, setClientEstimates] = useState<Array<{_id: string; estimateName: string; items: Item[]; totalAmount: number; createdAt: string}>>([]);
  const [estimatesLoading, setEstimatesLoading] = useState(false);
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

  // Fetch data from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSection, setSelectedSection] = useState("");



  // Fetch client details and check for approved estimates
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        // Fetch client details
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setClientDetails(data.client);
        } else {
          console.error('Failed to fetch client details');
        }

        // Check for approved estimates
        const estimatesResponse = await fetch(`/api/interior-estimates/client/${clientId}`);
        if (estimatesResponse.ok) {
          const estimatesData = await estimatesResponse.json();
          const approvedEst = estimatesData.estimates?.find((est: Estimate) => est.status === 'approved');
          
          if (approvedEst) {
            setHasApprovedEstimate(true);
            setApprovedEstimate(approvedEst);
          }
        }
      } catch (error) {
        console.error('Error fetching client details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClientDetails();
  }, [clientId]);

  // Fetch categories, subcategories, and sections
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

  const filteredSubCategories = Array.isArray(subCategories) ? subCategories.filter(sub => sub.categoryId === selectedCategory) : [];
  const filteredSections = Array.isArray(sections) ? sections.filter(section => 
    section.subCategoryId === selectedSubCategory && 
    section.categoryId === selectedCategory
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
    const section = sections.find(s => s.id === sectionId);
    if (section) {
      // Directly add the item without showing the form
      const category = categories.find(c => c.id === selectedCategory);
      const subCategory = subCategories.find(sc => sc.id === selectedSubCategory);

      const item: Item = {
        id: Date.now().toString(),
        sectionId: sectionId,
        sectionName: section.description || section.material,
        categoryName: category?.name || "",
        subCategoryName: subCategory?.name || "",
        materialName: section.material || "",
        type: section.type,
        description: section.description || "",
        totalAmount: 0, // Will be calculated when user inputs dimensions
        ...(section.type === 'area' && {
          length: 0,
          breadth: 0
        }),
        ...(section.type === 'pieces' && {
          pieces: 0
        }),
        ...(section.type === 'running_sq_feet' && {
          runningLength: 0
        })
      };

      setItems(prev => [...prev, item]);
      
      // Reset selections
      setSelectedCategory("");
      setSelectedSubCategory("");
      setSelectedSection("");

      Swal.fire({
        icon: 'success',
        title: 'Item Added!',
        text: 'Item has been added to the estimate.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 2000
      });
    }
  };



  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setEditingItemData({ ...item });
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editingItemData) return;

    // Recalculate total amount based on the type
    const amountPerSqFt = editingItemData.totalAmount;
    const calculatedTotal = calculateTotalAmount(
      editingItemData.type,
      editingItemData.length || 0,
      editingItemData.breadth || 0,
      editingItemData.pieces || 0,
      editingItemData.runningLength || 0,
      amountPerSqFt,
      editingItemData.measurements
    );

    const updatedItem: Item = {
      ...editingItemData,
      id: itemId,
      totalAmount: calculatedTotal
    };

    setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    setEditingItem(null);
    setEditingItemData(null);

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



  const handleRemoveItem = (itemId: string) => {
    setItems(prev => prev.filter(item => item.id !== itemId));
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

  // Function to convert cm to sq feet
  const cmToSqFeet = (lengthCm: number, breadthCm: number): number => {
    // 1 sq ft = 929.03 sq cm
    const sqCm = lengthCm * breadthCm;
    const result = sqCm / 929.03;
    return isFinite(result) ? result : 0;
  };

  // Function to calculate total sq feet from multiple measurements
  const calculateTotalSqFeet = (measurements: Measurement[]): number => {
    return measurements.reduce((total, measurement) => {
      return total + cmToSqFeet(measurement.length, measurement.breadth);
    }, 0);
  };

  // Function to calculate total running feet from multiple running measurements
  const calculateTotalRunningFeet = (runningMeasurements: RunningMeasurement[]): number => {
    return runningMeasurements.reduce((total, measurement) => {
      return total + cmToFeet(measurement.length);
    }, 0);
  };

  // Function to convert cm to feet
  const cmToFeet = (cm: number): number => {
    // 1 ft = 30.48 cm
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

  // Function to calculate total amount based on type
  const calculateTotalAmount = (type: string, length?: number, breadth?: number, pieces?: number, runningLength?: number, amountPerSqFt?: number, measurements?: Measurement[], runningMeasurements?: RunningMeasurement[]): number => {
    switch (type) {
      case 'area':
        if (amountPerSqFt) {
          let totalSqFeet = 0;
          if (measurements && measurements.length > 0) {
            // Use multiple measurements if available
            totalSqFeet = calculateTotalSqFeet(measurements);
          } else if (length && breadth) {
            // Fallback to single length/breadth
            totalSqFeet = cmToSqFeet(length, breadth);
          }
          const result = totalSqFeet * amountPerSqFt;
          return isFinite(result) ? result : 0;
        }
        return 0;
      case 'pieces':
        if (pieces && amountPerSqFt) {
          const result = pieces * amountPerSqFt;
          return isFinite(result) ? result : 0;
        }
        return 0;
      case 'running':
      case 'running_sq_feet':
        if (amountPerSqFt) {
          let totalFeet = 0;
          if (runningMeasurements && runningMeasurements.length > 0) {
            // Use multiple running measurements if available
            totalFeet = calculateTotalRunningFeet(runningMeasurements);
          } else if (runningLength) {
            // Fallback to single running length
            totalFeet = cmToFeet(runningLength);
          }
          const result = totalFeet * amountPerSqFt;
          return isFinite(result) ? result : 0;
        }
        return 0;
      default:
        return 0;
    }
  };

  // Function to update item total when dimensions change
  const updateItemTotal = (itemId: string, newData: Partial<Item>) => {
    setItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, ...newData };
        const amountPerSqFt = updatedItem.totalAmount;
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



  const handleSaveEstimate = async () => {
    if (items.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Items',
        text: 'Please add at least one item to the estimate.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Show the estimate name modal
    setShowEstimateNameModal(true);
  };

  const handleSaveEstimateWithName = async () => {
    if (!estimateName.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Estimate Name Required',
        text: 'Please enter a name for the estimate.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    try {
      const totalAmount = calculateFinalTotal();
      
      // Send data to API
      const response = await fetch('/api/interior-estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          estimateName: estimateName.trim(),
          items,
          totalAmount,
          discount,
          discountType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save estimate');
      }
      
      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Interior Estimate Created!',
        text: `Estimate "${estimateName}" for ${clientName} has been saved successfully.`,
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#f0f9ff',
        color: '#1e40af',
        iconColor: '#10b981'
      });

      // Reset items and close modal
      setItems([]);
      setEstimateName("");
      setShowEstimateNameModal(false);

      // Redirect to estimate details page
      router.push(`/dashboard/estimates/interior/${data.estimateId}`);

    } catch (error) {
      console.error('Error creating estimate:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to create estimate',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 4000,
        background: '#fef2f2',
        color: '#dc2626',
        iconColor: '#ef4444'
      });
    }
  };

  const handleBackToEstimates = () => {
    router.push(`/dashboard/estimates?clientId=${clientId}&clientName=${clientName}`);
  };

  const handleShowPresetModal = async () => {
    setShowPresetModal(true);
    setPresetsLoading(true);
    try {
      const res = await fetch('/api/interior-presets');
      const data = await res.json();
      setPresets(Array.isArray(data.presets) ? data.presets : []);
    } catch {
      setPresets([]);
    } finally {
      setPresetsLoading(false);
    }
  };

  const handleShowCopyEstimateModal = async () => {
    if (!clientId) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Client ID is required to copy estimates',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    setShowCopyEstimateModal(true);
    setEstimatesLoading(true);
    try {
      const res = await fetch(`/api/interior-estimates/client/${clientId}`);
      const data = await res.json();
      setClientEstimates(Array.isArray(data.estimates) ? data.estimates : []);
    } catch (error) {
      console.error('Error fetching client estimates:', error);
      setClientEstimates([]);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch client estimates',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setEstimatesLoading(false);
    }
  };

  return (
    <div className="space-y-8">
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
            <h1 className="text-3xl font-bold text-gray-900">Interior Estimate</h1>
            <p className="text-gray-600 mt-1">
              {clientName ? `Preparing interior estimate for ${clientName}` : "Prepare interior design estimate"}
            </p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleShowPresetModal}
            className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-sm"
          >
            <FileText className="h-4 w-4" />
            <span>Use Preset</span>
          </button>
          <button
            onClick={handleShowCopyEstimateModal}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer text-sm"
          >
            <Copy className="h-4 w-4" />
            <span>Copy Estimate</span>
          </button>
        </div>
      </div>

      {/* Client Info */}
      {clientId && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          {loading ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-3"></div>
              <p className="text-blue-700">Loading client details...</p>
            </div>
          ) : clientDetails ? (
            <div className="space-y-4">
              <div className="flex items-center">
                <Home className="h-6 w-6 text-blue-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-blue-800">Client Details</h3>
                  <p className="text-blue-700">Interior Design Services</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Name</p>
                    <p className="text-blue-800 font-semibold">{clientDetails.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MapPin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Location</p>
                    <p className="text-blue-800 font-semibold">{clientDetails.location}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Phone</p>
                    <p className="text-blue-800 font-semibold">{clientDetails.phone}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Mail className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 font-medium">Email</p>
                    <p className="text-blue-800 font-semibold">{clientDetails.email}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center">
              <Home className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-blue-800">Client: {clientName}</h3>
                <p className="text-blue-700">Interior Design Services</p>
                <p className="text-sm text-blue-600 mt-1">Unable to load full details</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Approved Estimate Warning */}
      {hasApprovedEstimate && approvedEstimate && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Estimate Already Approved</h3>
                <p className="text-red-700">
                  An interior estimate has already been approved for this client: <strong>{approvedEstimate.estimateName}</strong>
                </p>
                <p className="text-sm text-red-600 mt-1">
                  You cannot create new interior estimates for this client. Please view the approved estimate instead.
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/dashboard/estimates/interior/${approvedEstimate._id}`)}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-sm"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>View Approved Estimate</span>
            </button>
          </div>
        </div>
      )}

      {/* Preset Info */}
      {presetName && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Using Preset: {presetName}</h3>
                <p className="text-green-700">Preset configuration has been loaded</p>
              </div>
            </div>
            <button
              onClick={() => {
                setItems([]);
                // Remove preset parameters from URL
                const params = new URLSearchParams();
                if (clientId) params.set('clientId', clientId);
                if (clientName) params.set('clientName', clientName);
                router.replace(`/dashboard/estimates/interior?${params.toString()}`);
              }}
              className="text-sm text-green-600 hover:text-green-800 underline"
            >
              Clear Preset
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {!hasApprovedEstimate && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Items</h3>
          <p className="text-3xl font-bold text-blue-600">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Amount</h3>
          
          {/* Subtotal */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 font-medium">Subtotal:</span>
            <span className="text-gray-900 font-semibold">
              ₹{calculateSubtotal().toLocaleString()}
            </span>
          </div>

          {/* Discount Section */}
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-gray-700 font-medium">Discount:</span>
              <select
                value={discountType}
                onChange={(e) => {
                  setDiscountType(e.target.value as 'percentage' | 'fixed');
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
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
                }}
                className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-gray-900"
                min="0"
                max={discountType === 'percentage' ? "100" : undefined}
                step="0.1"
              />
            </div>
            <span className="text-gray-900 font-semibold">
              -₹{calculateDiscountAmount().toLocaleString()}
            </span>
          </div>

          {/* Final Total */}
          <div className="border-t border-gray-200 pt-2 mt-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-bold text-lg">Grand Total:</span>
              <span className="text-green-600 font-bold text-2xl">
                ₹{calculateFinalTotal().toLocaleString()}
              </span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Client</h3>
          <p className="text-sm text-gray-600">{clientName}</p>
        </div>
      </div>
      )}

      {/* Category Selection */}

      {/* Category Selection */}
      {!hasApprovedEstimate && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
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
      )}



      {/* Items List */}
      {!hasApprovedEstimate && items.length > 0 && (
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
                                          {/* Show added measurements */}
                                          {editingItemData?.measurements && editingItemData.measurements.length > 0 && (
                                            <div className="space-y-1">
                                              {editingItemData.measurements.map((measurement) => (
                                                <div key={measurement.id}>
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
                                            return total.toFixed(2);
                                          })()} sq ft
                                        </div>
                                      ) : (
                                        item.type === 'area' ? (
                                          <div className="text-center">
                                            {(() => {
                                              const singleSqFeet = cmToSqFeet(item.length || 0, item.breadth || 0);
                                              const measurementsSqFeet = item.measurements ? calculateTotalSqFeet(item.measurements) : 0;
                                              const total = singleSqFeet + measurementsSqFeet;
                                              return total.toFixed(2);
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
                                      value={editingItemData?.totalAmount || item.totalAmount}
                                      onChange={(e) => {
                                        const newAmount = parseFloat(e.target.value) || 0;
                                        setEditingItemData(prev => prev ? { ...prev, totalAmount: newAmount } : null);
                                        updateItemTotal(item.id, { totalAmount: newAmount });
                                      }}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  ) : (
                                    <div className="text-center">
                                      ₹{(() => {
                                        let amount = 0;
                                        if (item.type === 'area') {
                                          const sqFeet = cmToSqFeet(item.length || 0, item.breadth || 0);
                                          amount = sqFeet > 0 ? (item.totalAmount / sqFeet) : 0;
                                        } else if (item.type === 'pieces') {
                                          amount = (item.pieces || 0) > 0 ? (item.totalAmount / (item.pieces || 1)) : 0;
                                        } else {
                                          amount = item.totalAmount;
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
                                          <Save className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={handleCancelEdit}
                                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded transition-colors cursor-pointer"
                                          title="Cancel Edit"
                                        >
                                          <X className="h-3 w-3" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() => handleEditItem(item)}
                                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                                          title="Edit Item"
                                        >
                                          <Edit className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveItem(item.id)}
                                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                          title="Remove Item"
                                        >
                                          <Trash2 className="h-3 w-3" />
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
          
          {items.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Items Count:</span> {items.length}
                </div>
                <div className="flex space-x-8">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Sub Total:</span> 
                    <span className="ml-2 text-blue-600 font-semibold">
                      ₹{(() => {
                        const total = items.reduce((sum, item) => sum + (isFinite(item.totalAmount) ? item.totalAmount : 0), 0);
                        return isFinite(total) ? total.toFixed(1) : '0.0';
                      })()}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    Grand Total: ₹{(() => {
                      const total = items.reduce((sum, item) => sum + (isFinite(item.totalAmount) ? item.totalAmount : 0), 0);
                      return isFinite(total) ? Math.round(total).toLocaleString() : '0';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Estimate Button */}
      {!hasApprovedEstimate && (
        <div className="flex gap-4">
        <button
          onClick={handleBackToEstimates}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-sm w-40"
        >
          Back to Estimates
        </button>
        <button
          onClick={handleSaveEstimate}
          className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer text-sm w-40"
        >
          <Save className="h-4 w-4 mr-2 inline" />
          Save Estimate
        </button>
      </div>
      )}

      {/* Add Custom Item Modal */}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Measurement</h3>
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Length (cm)</label>
                  <input
                    type="number"
                    value={newMeasurement.length}
                    onChange={(e) => setNewMeasurement({...newMeasurement, length: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter length in cm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Breadth (cm)</label>
                  <input
                    type="number"
                    value={newMeasurement.breadth}
                    onChange={(e) => setNewMeasurement({...newMeasurement, breadth: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter breadth in cm"
                  />
                </div>
              </div>

              {newMeasurement.length && newMeasurement.breadth && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800">
                    Square Feet: {cmToSqFeet(parseFloat(newMeasurement.length) || 0, parseFloat(newMeasurement.breadth) || 0).toFixed(2)} sq ft
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={addMeasurementToItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Add Measurement
              </button>
            </div>
          </div>
        </div>
      )}

      {showPresetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select a Preset</h3>
              <button
                onClick={() => setShowPresetModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {presetsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading presets...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {presets.length === 0 ? (
                  <div className="text-gray-500 text-center py-6">No presets found.</div>
                ) : (
                  presets.map((preset: {id: string; name: string; items: Item[]}) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setItems(preset.items || []);
                        setShowPresetModal(false);
                        Swal.fire({
                          icon: 'success',
                          title: 'Preset Applied!',
                          text: `Preset "${preset.name}" has been applied to the estimate.`,
                          position: 'top-end',
                          toast: true,
                          showConfirmButton: false,
                          timer: 2000
                        });
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-purple-50 transition-colors cursor-pointer text-gray-900 font-medium"
                    >
                      {preset.name}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Copy Estimate Modal */}
      {showCopyEstimateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Copy Existing Estimate</h3>
              <button
                onClick={() => setShowCopyEstimateModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {estimatesLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-3 text-gray-600">Loading estimates...</span>
              </div>
            ) : (
              <div className="space-y-2">
                {clientEstimates.length === 0 ? (
                  <div className="text-gray-500 text-center py-6">No estimates found for this client.</div>
                ) : (
                  clientEstimates.map((estimate) => (
                    <button
                      key={estimate._id}
                      onClick={() => {
                        setItems(estimate.items || []);
                        setShowCopyEstimateModal(false);
                        Swal.fire({
                          icon: 'success',
                          title: 'Estimate Copied!',
                          text: `Estimate "${estimate.estimateName}" has been copied to the current estimate.`,
                          position: 'top-end',
                          toast: true,
                          showConfirmButton: false,
                          timer: 2000
                        });
                      }}
                      className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:bg-blue-50 transition-colors cursor-pointer text-gray-900 font-medium"
                    >
                      <div className="flex justify-between items-center">
                        <span>{estimate.estimateName}</span>
                        <span className="text-sm text-gray-500">
                          ₹{estimate.totalAmount?.toLocaleString() || '0'}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(estimate.createdAt).toLocaleDateString()}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Estimate Name Modal */}
      {showEstimateNameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Save Estimate</h3>
              <button
                onClick={() => setShowEstimateNameModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estimate Name</label>
                <input
                  type="text"
                  value={estimateName}
                  onChange={(e) => setEstimateName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter estimate name"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowEstimateNameModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEstimateWithName}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                Save Estimate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 