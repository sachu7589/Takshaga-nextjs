"use client";

import { useState, useEffect } from "react";
import { 
  Plus,
  Edit,
  Trash2,
  Save,
  ArrowLeft,
  X
} from "lucide-react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';

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

export default function CreateInteriorPresetPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [showCustomItemModal, setShowCustomItemModal] = useState(false);
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
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
        // Set empty arrays on error to prevent filter errors
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
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const [newItem, setNewItem] = useState({
    length: "",
    breadth: "",
    pieces: "",
    runningLength: "",
    description: "",
    materialName: "",
    totalAmount: ""
  });

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
      setNewItem({
        length: "",
        breadth: "",
        pieces: "",
        runningLength: "",
        description: section.description || "",
        materialName: section.material || "",
        totalAmount: section.amount?.toString() || ""
      });
      setShowAddItem(true);
    }
  };

  const handleAddItem = () => {
    if (!selectedSection) return;

    const section = sections.find(s => s.id === selectedSection);
    if (!section) return;

    const category = categories.find(c => c.id === selectedCategory);
    const subCategory = subCategories.find(sc => sc.id === selectedSubCategory);

    const item: Item = {
      id: Date.now().toString(),
      sectionId: selectedSection,
      sectionName: section.description || section.material,
      categoryName: category?.name || "",
      subCategoryName: subCategory?.name || "",
      materialName: newItem.materialName,
      type: section.type,
      description: newItem.description,
      totalAmount: parseFloat(newItem.totalAmount) || 0,
      ...(section.type === 'area' && {
        length: parseFloat(newItem.length) || 0,
        breadth: parseFloat(newItem.breadth) || 0
      }),
      ...(section.type === 'pieces' && {
        pieces: parseInt(newItem.pieces) || 0
      }),
      ...(section.type === 'running_sq_feet' && {
        runningLength: parseFloat(newItem.runningLength) || 0
      })
    };

    setItems([...items, item]);
    setNewItem({
      length: "",
      breadth: "",
      pieces: "",
      runningLength: "",
      description: "",
      materialName: "",
      totalAmount: ""
    });
    setShowAddItem(false);
    setSelectedSection("");
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    setNewItem({
      length: item.length?.toString() || "",
      breadth: item.breadth?.toString() || "",
      pieces: item.pieces?.toString() || "",
      runningLength: item.runningLength?.toString() || "",
      description: item.description,
      materialName: item.materialName,
      totalAmount: item.totalAmount?.toString() || ""
    });
    setShowAddItem(true);
  };

  const handleUpdateItem = () => {
    if (!editingItem) return;

    const updatedItem: Item = {
      ...editingItem,
      description: newItem.description,
      materialName: newItem.materialName,
      totalAmount: parseFloat(newItem.totalAmount) || 0,
      ...(editingItem.type === 'area' && {
        length: parseFloat(newItem.length) || 0,
        breadth: parseFloat(newItem.breadth) || 0
      }),
      ...(editingItem.type === 'pieces' && {
        pieces: parseInt(newItem.pieces) || 0
      }),
      ...(editingItem.type === 'running' && {
        runningLength: parseFloat(newItem.runningLength) || 0
      })
    };

    setItems(items.map(item => item.id === editingItem.id ? updatedItem : item));
    setEditingItem(null);
    setNewItem({
      length: "",
      breadth: "",
      pieces: "",
      runningLength: "",
      description: "",
      materialName: "",
      totalAmount: ""
    });
    setShowAddItem(false);
  };

  const handleRemoveItem = (itemId: string) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleAddCustomItem = () => {
    setShowCustomItemModal(true);
  };

  const handleSaveCustomItem = () => {
    if (!customItem.categoryName || !customItem.subCategoryName || !customItem.materialName || !customItem.description || !customItem.type || !customItem.totalAmount) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: 'Please fill in all required fields',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    const newCustomItem: Item = {
      id: Date.now().toString(),
      sectionId: "custom",
      sectionName: "Custom Item",
      type: customItem.type,
      description: customItem.description,
      categoryName: customItem.categoryName,
      subCategoryName: customItem.subCategoryName,
      materialName: customItem.materialName,
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

    setItems([...items, newCustomItem]);
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
  };



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Interior Preset</h1>
            <p className="text-gray-600 mt-1">Create a new interior estimate preset</p>
          </div>
        </div>
        <button
          onClick={() => {
            if (items.length === 0) {
              Swal.fire({
                icon: 'warning',
                title: 'No Items',
                text: 'Please add at least one item before saving the preset.',
                position: 'top-end',
                toast: true,
                showConfirmButton: false,
                timer: 3000
              });
              return;
            }

            Swal.fire({
              title: 'Save Interior Preset',
              input: 'text',
              inputLabel: 'Preset Name',
              inputPlaceholder: 'Enter preset name...',
              showCancelButton: true,
              confirmButtonText: 'Save',
              cancelButtonText: 'Cancel',
              inputValidator: (value) => {
                if (!value) {
                  return 'You need to enter a preset name!';
                }
              }
            }).then((result) => {
              if (result.isConfirmed) {
                const presetName = result.value;
                
                // Save to database
                fetch('/api/interior-presets', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: presetName,
                    items: items,
                    totalAmount: items.reduce((sum, item) => sum + item.totalAmount, 0),
                    createdAt: new Date().toISOString()
                  })
                })
                .then(response => response.json())
                .then(data => {
                  if (data.success) {
                    Swal.fire({
                      icon: 'success',
                      title: 'Preset Saved!',
                      text: `Interior preset "${presetName}" has been saved successfully.`,
                      position: 'top-end',
                      toast: true,
                      showConfirmButton: false,
                      timer: 3000
                    });
                    // Optionally redirect to presets list
                    // router.push('/dashboard/interior-presets');
                  } else {
                    throw new Error(data.message || 'Failed to save preset');
                  }
                })
                .catch(error => {
                  console.error('Error saving preset:', error);
                  Swal.fire({
                    icon: 'error',
                    title: 'Save Failed',
                    text: 'Failed to save the preset. Please try again.',
                    position: 'top-end',
                    toast: true,
                    showConfirmButton: false,
                    timer: 3000
                  });
                });
              }
            });
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Save className="h-5 w-5" />
          <span>Save Preset</span>
        </button>
      </div>

      {/* Category Selection */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Items</h2>
        
        {loading ? (
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
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Custom Item</span>
            </button>
          </>
        )}
      </div>

      {/* Add Item Form */}
      {showAddItem && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingItem ? 'Edit Item' : 'Add Item'}
            </h3>
            <button
              onClick={() => {
                setShowAddItem(false);
                setEditingItem(null);
                setNewItem({
                  length: "",
                  breadth: "",
                  pieces: "",
                  runningLength: "",
                  description: "",
                  materialName: "",
                  totalAmount: ""
                });
              }}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {selectedSection && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {sections.find(s => s.id === selectedSection)?.type === 'area' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft)</label>
                    <input
                      type="number"
                      value={newItem.length}
                      onChange={(e) => setNewItem({...newItem, length: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter length"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Breadth (ft)</label>
                    <input
                      type="number"
                      value={newItem.breadth}
                      onChange={(e) => setNewItem({...newItem, breadth: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      placeholder="Enter breadth"
                    />
                  </div>
                </>
              )}

              {sections.find(s => s.id === selectedSection)?.type === 'pieces' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Number of Pieces</label>
                  <input
                    type="number"
                    value={newItem.pieces}
                    onChange={(e) => setNewItem({...newItem, pieces: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter number of pieces"
                  />
                </div>
              )}

              {sections.find(s => s.id === selectedSection)?.type === 'running_sq_feet' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Length (ft)</label>
                  <input
                    type="number"
                    value={newItem.runningLength}
                    onChange={(e) => setNewItem({...newItem, runningLength: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                    placeholder="Enter length"
                  />
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Material Name</label>
              <input
                type="text"
                value={newItem.materialName}
                onChange={(e) => setNewItem({...newItem, materialName: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter material name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount (₹)</label>
              <input
                type="number"
                value={newItem.totalAmount}
                onChange={(e) => setNewItem({...newItem, totalAmount: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                placeholder="Enter total amount"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <input
              type="text"
              value={newItem.description}
              onChange={(e) => setNewItem({...newItem, description: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              placeholder="Enter description"
            />
          </div>

          <button
            onClick={editingItem ? handleUpdateItem : handleAddItem}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{editingItem ? 'Update Item' : 'Add Item'}</span>
          </button>
        </div>
      )}

      {/* Items Table */}
      {items.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Added Items ({items.length})</h3>
            <div className="text-sm text-gray-500">
              Total Amount: <span className="font-semibold text-green-600">₹{items.reduce((sum, item) => sum + item.totalAmount, 0).toLocaleString()}</span>
            </div>
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
                              {categoryItems.some(item => item.type === 'running' || item.type === 'running_sq_feet') && (
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
                                  {item.materialName}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">
                                  {item.description}
                                </td>
                                {categoryItems.some(i => i.type === 'area') && (
                                  <>
                                    <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                      {item.type === 'area' ? (item.length || 0) : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                      {item.type === 'area' ? (item.breadth || 0) : '-'}
                                    </td>
                                  </>
                                )}
                                {categoryItems.some(i => i.type === 'pieces') && (
                                  <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                    {item.type === 'pieces' ? (item.pieces || 0) : '-'}
                                  </td>
                                )}
                                {categoryItems.some(i => i.type === 'running' || i.type === 'running_sq_feet') && (
                                  <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                    {item.type === 'running' || item.type === 'running_sq_feet' ? (item.runningLength || 0) : '-'}
                                  </td>
                                )}
                                <td className="py-3 px-4 text-sm font-medium text-blue-600 text-center">
                                  ₹{item.totalAmount.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-sm font-semibold text-green-600 text-center">
                                  ₹{item.totalAmount.toLocaleString()}
                                </td>
                                <td className="py-3 px-4 text-center">
                                  <div className="flex space-x-1 justify-center">
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
                  onChange={(e) => setCustomItem({...customItem, type: e.target.value as 'area' | 'pieces' | 'running' | 'running_sq_feet'})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                >
                  <option value="" className="text-gray-500">Select Type</option>
                  <option value="area" className="text-black">Area</option>
                  <option value="pieces" className="text-black">Pieces</option>
                  <option value="running" className="text-black">Running</option>
                  <option value="running_sq_feet" className="text-black">Running sq feet</option>
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

              {(customItem.type === 'running' || customItem.type === 'running_sq_feet') && (
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
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomItem}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 