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
  pieces?: number;
  runningLength?: number;
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

export default function InteriorEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');
  const presetName = searchParams.get('presetName');
  
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
  const [editingItemData, setEditingItemData] = useState<Item | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [presets, setPresets] = useState<Array<{id: string; name: string; items: Item[]; totalAmount: number}>>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
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
    totalAmount: ""
  });

  // Fetch data from database
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSection, setSelectedSection] = useState("");



  // Fetch client details
  useEffect(() => {
    const fetchClientDetails = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/clients/${clientId}`);
        if (response.ok) {
          const data = await response.json();
          setClientDetails(data.client);
        } else {
          console.error('Failed to fetch client details');
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
        totalAmount: section.amount || 0,
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

    const updatedItem: Item = {
      ...editingItemData,
      id: itemId
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

  const handleSaveCustomItem = () => {
    if (!customItem.categoryName || !customItem.subCategoryName || !customItem.materialName || !customItem.totalAmount) {
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

    const item: Item = {
      id: Date.now().toString(),
      sectionId: 'custom',
      sectionName: customItem.materialName,
      categoryName: customItem.categoryName,
      subCategoryName: customItem.subCategoryName,
      materialName: customItem.materialName,
      type: customItem.type,
      description: customItem.description,
      totalAmount: parseFloat(customItem.totalAmount) || 0,
      ...(customItem.type === 'area' && {
        length: parseFloat(customItem.length) || 0,
        breadth: parseFloat(customItem.breadth) || 0
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
      totalAmount: ""
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

    try {
      const totalAmount = items.reduce((sum, item) => sum + item.totalAmount, 0);
      
      // Here you would typically send the data to your API
      console.log("Interior estimate data:", {
        clientId,
        clientName,
        items,
        totalAmount
      });
      
      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Interior Estimate Created!',
        text: `Estimate for ${clientName} has been prepared successfully.`,
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#f0f9ff',
        color: '#1e40af',
        iconColor: '#10b981'
      });

      // Reset items
      setItems([]);

    } catch (error) {
      console.error('Error creating estimate:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create estimate',
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
            onClick={() => {
              // For now, just show a success message
              Swal.fire({
                icon: 'success',
                title: 'Estimate Copied!',
                text: 'Estimate has been copied successfully.',
                position: 'top-end',
                toast: true,
                showConfirmButton: false,
                timer: 2000
              });
            }}
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Items</h3>
          <p className="text-3xl font-bold text-blue-600">{items.length}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Amount</h3>
          <p className="text-3xl font-bold text-green-600">
            ₹{items.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Client</h3>
          <p className="text-sm text-gray-600">{clientName}</p>
        </div>
      </div>

      {/* Category Selection */}
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
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Length</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Breadth</th>
                                </>
                              )}
                              {categoryItems.some(item => item.type === 'pieces') && (
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Pieces</th>
                              )}
                              {categoryItems.some(item => item.type === 'running') && (
                                <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Running Length</th>
                              )}
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Amount</th>
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
                                        <input
                                          type="number"
                                          value={editingItemData?.length || item.length || 0}
                                          onChange={(e) => setEditingItemData(prev => prev ? { ...prev, length: parseFloat(e.target.value) || 0 } : null)}
                                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                      ) : (
                                        item.type === 'area' ? item.length : '-'
                                      )}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {editingItem?.id === item.id && item.type === 'area' ? (
                                        <input
                                          type="number"
                                          value={editingItemData?.breadth || item.breadth || 0}
                                          onChange={(e) => setEditingItemData(prev => prev ? { ...prev, breadth: parseFloat(e.target.value) || 0 } : null)}
                                          className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                        />
                                      ) : (
                                        item.type === 'area' ? item.breadth : '-'
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
                                        onChange={(e) => setEditingItemData(prev => prev ? { ...prev, pieces: parseInt(e.target.value) || 0 } : null)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      item.type === 'pieces' ? item.pieces : '-'
                                    )}
                                  </td>
                                )}
                                {categoryItems.some(i => i.type === 'running') && (
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    {editingItem?.id === item.id && item.type === 'running' ? (
                                      <input
                                        type="number"
                                        value={editingItemData?.runningLength || item.runningLength || 0}
                                        onChange={(e) => setEditingItemData(prev => prev ? { ...prev, runningLength: parseFloat(e.target.value) || 0 } : null)}
                                        className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                                      />
                                    ) : (
                                      item.type === 'running' ? item.runningLength : '-'
                                    )}
                                  </td>
                                )}
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  {editingItem?.id === item.id ? (
                                    <input
                                      type="number"
                                      value={editingItemData?.totalAmount || item.totalAmount}
                                      onChange={(e) => setEditingItemData(prev => prev ? { ...prev, totalAmount: parseFloat(e.target.value) || 0 } : null)}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                                    />
                                  ) : (
                                    `₹${item.totalAmount.toLocaleString()}`
                                  )}
                                </td>
                                <td className="py-3 px-4 text-sm font-semibold text-green-600">
                                  ₹{(editingItemData?.totalAmount || item.totalAmount).toLocaleString()}
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
                      ₹{items.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    Grand Total: ₹{items.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Save Estimate Button */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft)</label>
                    <input
                      type="number"
                      value={customItem.length}
                      onChange={(e) => setCustomItem({...customItem, length: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter length"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadth (ft)</label>
                    <input
                      type="number"
                      value={customItem.breadth}
                      onChange={(e) => setCustomItem({...customItem, breadth: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter breadth"
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Running Length (ft)</label>
                  <input
                    type="number"
                    value={customItem.runningLength}
                    onChange={(e) => setCustomItem({...customItem, runningLength: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter running length"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹)</label>
                <input
                  type="number"
                  value={customItem.totalAmount}
                  onChange={(e) => setCustomItem({...customItem, totalAmount: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  placeholder="Enter total amount"
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
    </div>
  );
} 