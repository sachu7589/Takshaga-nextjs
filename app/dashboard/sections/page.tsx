"use client";

import { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  Users,
  FileText,
  Filter,
  MoreVertical,
  TrendingUp,
  Sparkles,
  X,
  Tag,
  Layers,
  Package
} from "lucide-react";

interface Section {
  id: string;
  name: string;
  description: string;
  clientCount: number;
  projectCount: number;
  status: 'active' | 'archived';
  createdAt: string;
  lastUpdated: string;
  priority?: 'high' | 'medium' | 'low';
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

interface SectionItem {
  id: string;
  categoryId: string;
  subCategoryId: string;
  material: string;
  description: string;
  amount: number;
  type: 'pieces' | 'area' | 'running_sq_feet';
}

export default function SectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [showSectionModal, setShowSectionModal] = useState(false);
  
  // Edit modal states
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [showEditSubCategoryModal, setShowEditSubCategoryModal] = useState(false);
  const [showEditSectionModal, setShowEditSectionModal] = useState(false);
  
  // Edit form states
  const [editCategoryForm, setEditCategoryForm] = useState({ id: "", name: "" });
  const [editSubCategoryForm, setEditSubCategoryForm] = useState({ 
    id: "", 
    categoryId: "", 
    subCategoryName: "" 
  });
  const [editSectionForm, setEditSectionForm] = useState({
    id: "",
    categoryId: "",
    subCategoryId: "",
    material: "",
    description: "",
    amount: "",
    type: "pieces" as 'pieces' | 'area' | 'running_sq_feet'
  });
  
  // Refs for input fields
  const categoryInputRef = useRef<HTMLInputElement>(null);
  const subCategoryInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  const amountInputRef = useRef<HTMLInputElement>(null);
  const descriptionInputRef = useRef<HTMLTextAreaElement>(null);
  
  // Form states
  const [categoryForm, setCategoryForm] = useState({ name: "" });
  const [subCategoryForm, setSubCategoryForm] = useState({ 
    categoryId: "", 
    subCategoryName: "" 
  });
  const [sectionForm, setSectionForm] = useState({
    categoryId: "",
    subCategoryId: "",
    material: "",
    description: "",
    amount: "",
    type: "pieces" as 'pieces' | 'area' | 'running_sq_feet'
  });

  // Database state for categories, sub-categories, and sections
  const [categories, setCategories] = useState<Array<{id: string, name: string}>>([]);
  const [subCategories, setSubCategories] = useState<Array<{id: string, categoryId: string, name: string}>>([]);
  const [subCategoriesForCategory, setSubCategoriesForCategory] = useState<Array<{id: string, categoryId: string, name: string}>>([]);
  const [sectionsData, setSectionsData] = useState<Array<{id: string, categoryId: string, subCategoryId: string, material: string, description: string, amount: number, type: string}>>([]);
  const [loading, setLoading] = useState(false);

  // Remove dummy sections data - we'll use sectionsData from database instead

  const filteredSections = sectionsData.filter(section =>
    section.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryForm),
      });

      const data = await response.json();
      if (data.success) {
        setCategoryForm({ name: "" });
        setShowCategoryModal(false);
        fetchCategories(); // Refresh categories list
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Category created successfully!',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || 'Failed to create category'
        });
      }
    } catch (error) {
      console.error('Error creating category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to create category'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/subcategories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: subCategoryForm.subCategoryName,
          categoryId: subCategoryForm.categoryId
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSubCategoryForm({ categoryId: "", subCategoryName: "" });
        setShowSubCategoryModal(false);
        fetchSubCategories(); // Refresh subcategories list
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Sub category created successfully!',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || 'Failed to create sub category'
        });
      }
    } catch (error) {
      console.error('Error creating sub category:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to create sub category'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch('/api/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: sectionForm.material,
          categoryId: sectionForm.categoryId,
          subCategoryId: sectionForm.subCategoryId,
          material: sectionForm.material,
          description: sectionForm.description,
          amount: sectionForm.amount,
          type: sectionForm.type
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSectionForm({
          categoryId: "",
          subCategoryId: "",
          material: "",
          description: "",
          amount: "",
          type: "pieces"
        });
        setShowSectionModal(false);
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Section created successfully!',
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false
        });
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: data.error || 'Failed to create section'
        });
      }
    } catch (error) {
      console.error('Error creating section:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Failed to create section'
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit functions
  const handleEditCategory = (category: any) => {
    setEditCategoryForm({ id: category.id, name: category.name });
    setShowEditCategoryModal(true);
  };

  const handleEditSubCategory = (subCategory: any) => {
    setEditSubCategoryForm({ 
      id: subCategory.id, 
      categoryId: subCategory.categoryId, 
      subCategoryName: subCategory.name 
    });
    setShowEditSubCategoryModal(true);
  };

  const handleEditSection = (section: any) => {
    setEditSectionForm({
      id: section.id,
      categoryId: section.categoryId,
      subCategoryId: section.subCategoryId,
      material: section.material,
      description: section.description,
      amount: section.amount.toString(),
      type: section.type
    });
    setShowEditSectionModal(true);
    // Fetch subcategories for the selected category
    fetchSubCategoriesForCategory(section.categoryId);
  };

  // Delete functions
  const handleDeleteCategory = async (categoryId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/categories/${categoryId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          Swal.fire('Deleted!', 'Category has been deleted.', 'success');
          fetchCategories();
        } else {
          Swal.fire('Error!', data.error || 'Failed to delete category', 'error');
        }
      } catch (error) {
        console.error('Error deleting category:', error);
        Swal.fire('Error!', 'Failed to delete category', 'error');
      }
    }
  };

  const handleDeleteSubCategory = async (subCategoryId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/subcategories/${subCategoryId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          Swal.fire('Deleted!', 'Sub category has been deleted.', 'success');
          fetchSubCategories();
        } else {
          Swal.fire('Error!', data.error || 'Failed to delete sub category', 'error');
        }
      } catch (error) {
        console.error('Error deleting sub category:', error);
        Swal.fire('Error!', 'Failed to delete sub category', 'error');
      }
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/sections/${sectionId}`, {
          method: 'DELETE',
        });
        const data = await response.json();
        if (data.success) {
          Swal.fire('Deleted!', 'Section has been deleted.', 'success');
          fetchSections();
        } else {
          Swal.fire('Error!', data.error || 'Failed to delete section', 'error');
        }
      } catch (error) {
        console.error('Error deleting section:', error);
        Swal.fire('Error!', 'Failed to delete section', 'error');
      }
    }
  };

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch sub-categories from database
  const fetchSubCategories = async (categoryId?: string) => {
    try {
      const url = categoryId 
        ? `/api/subcategories?categoryId=${categoryId}`
        : '/api/subcategories';
      const response = await fetch(url);
      const data = await response.json();
      if (data.success) {
        setSubCategories(data.subCategories);
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error);
    }
  };

  // Fetch sub-categories for a specific category (for edit modals)
  const fetchSubCategoriesForCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/subcategories?categoryId=${categoryId}`);
      const data = await response.json();
      if (data.success) {
        setSubCategoriesForCategory(data.subCategories);
      }
    } catch (error) {
      console.error('Error fetching subcategories for category:', error);
    }
  };

  // Fetch sections from database
  const fetchSections = async () => {
    try {
      const response = await fetch('/api/sections');
      const data = await response.json();
      if (data.success) {
        setSectionsData(data.sections);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  // Get filtered sub-categories based on selected category
  const getFilteredSubCategories = (categoryId: string) => {
    return subCategories.filter(sub => sub.categoryId === categoryId);
  };

  // Helper functions to get names by IDs
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown Category';
  };

  const getSubCategoryName = (subCategoryId: string) => {
    const subCategory = subCategories.find(sub => sub.id === subCategoryId);
    return subCategory ? subCategory.name : 'Unknown Sub Category';
  };

  // Filter data based on search term
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSubCategories = subCategories.filter(subCategory =>
    subCategory.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(subCategory.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSectionsData = sectionsData.filter(section =>
    section.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCategoryName(section.categoryId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getSubCategoryName(section.subCategoryId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load data on component mount
  useEffect(() => {
    fetchCategories();
    fetchSubCategories();
    fetchSections();
  }, []);

  // Focus management functions
  const handleInputFocus = (ref: React.RefObject<HTMLInputElement | HTMLTextAreaElement>) => {
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
      }
    }, 100);
  };

  const handleInputChange = (
    value: string, 
    setter: (value: any) => void, 
    ref?: React.RefObject<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setter(value);
    // Maintain focus after state update
    if (ref && ref.current) {
      setTimeout(() => {
        ref.current?.focus();
        // Set cursor position to end of text
        const length = ref.current.value.length;
        ref.current.setSelectionRange(length, length);
      }, 0);
    }
  };

  // Auto-focus first input when modal opens
  useEffect(() => {
    if (showCategoryModal && categoryInputRef.current) {
      setTimeout(() => {
        categoryInputRef.current?.focus();
      }, 100);
    }
  }, [showCategoryModal]);

  useEffect(() => {
    if (showSubCategoryModal && subCategoryInputRef.current) {
      setTimeout(() => {
        subCategoryInputRef.current?.focus();
      }, 100);
    }
  }, [showSubCategoryModal]);

  useEffect(() => {
    if (showSectionModal && materialInputRef.current) {
      setTimeout(() => {
        materialInputRef.current?.focus();
      }, 100);
    }
  }, [showSectionModal]);

  const Modal = ({ 
    isOpen, 
    onClose, 
    title, 
    children 
  }: { 
    isOpen: boolean; 
    onClose: () => void; 
    title: string; 
    children: React.ReactNode; 
  }) => {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    };

    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" onMouseDown={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
          <p className="text-gray-600 mt-1">Organize materials by sections and categories</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-3">
          <button 
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Tag className="h-4 w-4 mr-2" />
            Add Category
          </button>
          <button 
            onClick={() => setShowSubCategoryModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Layers className="h-4 w-4 mr-2" />
            Add Sub Category
          </button>
          <button 
            onClick={() => setShowSectionModal(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Package className="h-4 w-4 mr-2" />
            Add Section
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-black" />
              <input
                type="text"
                placeholder="Search sections by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm placeholder:text-black text-black"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select 
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm text-black"
            >
              <option value="all" className="text-black">All Types</option>
              <option value="category" className="text-black">Category</option>
              <option value="subcategory" className="text-black">Sub Category</option>
              <option value="sections" className="text-black">Sections</option>
            </select>
            <button className="px-4 py-3 border border-black rounded-xl hover:bg-white/50 transition-all duration-200 cursor-pointer">
              <Filter className="h-5 w-5 text-black" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Tag className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sub Categories</p>
              <p className="text-2xl font-bold text-gray-900">{subCategories.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Layers className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sections</p>
              <p className="text-2xl font-bold text-gray-900">{sectionsData.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Package className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Data Display Section */}
      {selectedFilter && (
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            {selectedFilter === 'category' ? 'Categories' : 
             selectedFilter === 'subcategory' ? 'Sub Categories' : 
             selectedFilter === 'sections' ? 'Sections' : 
             selectedFilter === 'all' ? 'All Types' : 'All Types'}
          </h3>
          
          {selectedFilter === 'category' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <div key={category.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Tag className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Category
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Layers className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sub Categories</p>
                          <p className="text-xs text-gray-500">{subCategories.filter(sub => sub.categoryId === category.id).length} items</p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFilter === 'subcategory' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubCategories.map((subCategory) => (
                <div key={subCategory.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Layers className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{subCategory.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Sub Category
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditSubCategory(subCategory)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubCategory(subCategory.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Tag className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Parent Category</p>
                          <p className="text-xs text-gray-500">{getCategoryName(subCategory.categoryId)}</p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFilter === 'sections' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSectionsData.map((section) => (
                <div key={section.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{section.material}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {section.type}
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {section.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditSection(section)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {section.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Tag className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Category</p>
                          <p className="text-xs text-gray-500">{getCategoryName(section.categoryId)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Layers className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sub Category</p>
                          <p className="text-xs text-gray-500">{getSubCategoryName(section.subCategoryId)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>Amount: {section.amount} {section.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedFilter === 'all' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Categories */}
              {filteredCategories.map((category) => (
                <div key={category.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Tag className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              Category
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditCategory(category)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Layers className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sub Categories</p>
                          <p className="text-xs text-gray-500">{subCategories.filter(sub => sub.categoryId === category.id).length} items</p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}

              {/* Sub Categories */}
              {filteredSubCategories.map((subCategory) => (
                <div key={subCategory.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Layers className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{subCategory.name}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                              Sub Category
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditSubCategory(subCategory)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubCategory(subCategory.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Tag className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Parent Category</p>
                          <p className="text-xs text-gray-500">{getCategoryName(subCategory.categoryId)}</p>
                        </div>
                      </div>
                    </div>
                    
                  </div>
                </div>
              ))}

              {/* Sections */}
              {filteredSectionsData.map((section) => (
                <div key={section.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{section.material}</h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {section.type}
                            </span>
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                              {section.amount}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        <button 
                          onClick={() => handleEditSection(section)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteSection(section.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                      {section.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Tag className="h-4 w-4 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Category</p>
                          <p className="text-xs text-gray-500">{getCategoryName(section.categoryId)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                        <Layers className="h-4 w-4 text-purple-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Sub Category</p>
                          <p className="text-xs text-gray-500">{getSubCategoryName(section.subCategoryId)}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-white/20">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>Amount: {section.amount} {section.type}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Category Modal */}
      <Modal
        key="category-modal"
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        title="Add Category"
      >
        <form onSubmit={handleCategorySubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-2">
              Category Name
            </label>
                          <input
                ref={categoryInputRef}
                type="text"
                id="categoryName"
                value={categoryForm.name}
                onChange={(e) => handleInputChange(e.target.value, (value) => setCategoryForm({ name: value }), categoryInputRef)}
                onFocus={() => handleInputFocus(categoryInputRef)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500 text-black"
                placeholder="Enter category name"
                required
                autoComplete="off"
                spellCheck="false"
              />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowCategoryModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Add Category"}
            </button>
          </div>
        </form>
      </Modal>

                   {/* Sub Category Modal */}
      <Modal
        key="subcategory-modal"
        isOpen={showSubCategoryModal}
        onClose={() => setShowSubCategoryModal(false)}
        title="Add Sub Category"
      >
         <form onSubmit={handleSubCategorySubmit} className="space-y-4">
           <div>
             <label htmlFor="categorySelect" className="block text-sm font-medium text-gray-700 mb-2">
               Category
             </label>
                            <select
                 id="categorySelect"
                 value={subCategoryForm.categoryId}
                 onChange={(e) => {
                   const categoryId = e.target.value;
                   setSubCategoryForm({ ...subCategoryForm, categoryId, subCategoryName: "" });
                   if (categoryId) {
                     fetchSubCategories(categoryId);
                   }
                 }}
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                 required
               >
                 <option value="" className="text-gray-500">Select a category</option>
                 {categories.map((category) => (
                   <option key={category.id} value={category.id} className="text-black">
                     {category.name}
                   </option>
                 ))}
               </select>
           </div>
           <div>
             <label htmlFor="subCategoryName" className="block text-sm font-medium text-gray-700 mb-2">
               Sub Category Name
             </label>
                           <input
                ref={subCategoryInputRef}
                type="text"
                id="subCategoryName"
                value={subCategoryForm.subCategoryName}
                onChange={(e) => handleInputChange(e.target.value, (value) => setSubCategoryForm({ ...subCategoryForm, subCategoryName: value }), subCategoryInputRef)}
                onFocus={() => handleInputFocus(subCategoryInputRef)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500 text-black"
                placeholder="Enter sub category name"
                required
                autoComplete="off"
                spellCheck="false"
              />
           </div>
           <div className="flex gap-3 pt-4">
                         <button
              type="button"
              onClick={() => setShowSubCategoryModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Add Sub Category"}
            </button>
           </div>
         </form>
       </Modal>

      {/* Section Modal */}
      <Modal
        key="section-modal"
        isOpen={showSectionModal}
        onClose={() => setShowSectionModal(false)}
        title="Add Section"
      >
        <form onSubmit={handleSectionSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="sectionCategorySelect" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
                             <select
                 id="sectionCategorySelect"
                 value={sectionForm.categoryId}
                 onChange={(e) => {
                   const categoryId = e.target.value;
                   setSectionForm({ 
                     ...sectionForm, 
                     categoryId,
                     subCategoryId: "" // Reset sub-category when category changes
                   });
                   if (categoryId) {
                     fetchSubCategories(categoryId);
                   }
                 }}
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                 required
               >
                 <option value="" className="text-gray-500">Select a category</option>
                 {categories.map((category) => (
                   <option key={category.id} value={category.id} className="text-black">
                     {category.name}
                   </option>
                 ))}
               </select>
            </div>
            <div>
              <label htmlFor="sectionSubCategorySelect" className="block text-sm font-medium text-gray-700 mb-2">
                Sub Category
              </label>
                             <select
                 id="sectionSubCategorySelect"
                 value={sectionForm.subCategoryId}
                 onChange={(e) => setSectionForm({ ...sectionForm, subCategoryId: e.target.value })}
                 className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-black"
                 required
                 disabled={!sectionForm.categoryId}
               >
                 <option value="" className="text-gray-500">Select a sub category</option>
                 {getFilteredSubCategories(sectionForm.categoryId).map((subCategory) => (
                   <option key={subCategory.id} value={subCategory.id} className="text-black">
                     {subCategory.name}
                   </option>
                 ))}
               </select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-2">
                Material
              </label>
              <input
                ref={materialInputRef}
                type="text"
                id="material"
                value={sectionForm.material}
                onChange={(e) => handleInputChange(e.target.value, (value) => setSectionForm({ ...sectionForm, material: value }), materialInputRef)}
                onFocus={() => handleInputFocus(materialInputRef)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500 text-black"
                placeholder="Enter material"
                required
                autoComplete="off"
                spellCheck="false"
              />
            </div>
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                Amount
              </label>
              <input
                ref={amountInputRef}
                type="number"
                id="amount"
                value={sectionForm.amount}
                onChange={(e) => handleInputChange(e.target.value, (value) => setSectionForm({ ...sectionForm, amount: value }), amountInputRef)}
                onFocus={() => handleInputFocus(amountInputRef)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500 text-black"
                placeholder="Enter amount"
                required
                autoComplete="off"
                spellCheck="false"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              ref={descriptionInputRef}
              id="description"
              value={sectionForm.description}
              onChange={(e) => handleInputChange(e.target.value, (value) => setSectionForm({ ...sectionForm, description: value }), descriptionInputRef)}
              onFocus={() => handleInputFocus(descriptionInputRef)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-500 text-black"
              placeholder="Enter description"
              rows={3}
              required
              autoComplete="off"
              spellCheck="false"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Type
            </label>
            <div className="grid grid-cols-3 gap-4">
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="pieces"
                  checked={sectionForm.type === "pieces"}
                  onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value as 'pieces' | 'area' | 'running_sq_feet' })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Pieces</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="area"
                  checked={sectionForm.type === "area"}
                  onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value as 'pieces' | 'area' | 'running_sq_feet' })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Area</span>
              </label>
              <label className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="running_sq_feet"
                  checked={sectionForm.type === "running_sq_feet"}
                  onChange={(e) => setSectionForm({ ...sectionForm, type: e.target.value as 'pieces' | 'area' | 'running_sq_feet' })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-sm text-gray-700">Running Sq Feet</span>
              </label>
            </div>
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setShowSectionModal(false)}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Add Section"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Category Modal */}
      {showEditCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Category</h3>
              <button
                onClick={() => setShowEditCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const response = await fetch(`/api/categories/${editCategoryForm.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ name: editCategoryForm.name }),
                });
                const data = await response.json();
                if (data.success) {
                  setShowEditCategoryModal(false);
                  Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Category updated successfully!',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false
                  });
                  fetchCategories();
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.error || 'Failed to update category'
                  });
                }
              } catch (error) {
                console.error('Error updating category:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Failed to update category'
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  value={editCategoryForm.name}
                  onChange={(e) => setEditCategoryForm({ ...editCategoryForm, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditCategoryModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Update Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Sub Category Modal */}
      {showEditSubCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Sub Category</h3>
              <button
                onClick={() => setShowEditSubCategoryModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const response = await fetch(`/api/subcategories/${editSubCategoryForm.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ 
                    name: editSubCategoryForm.subCategoryName,
                    categoryId: editSubCategoryForm.categoryId 
                  }),
                });
                const data = await response.json();
                if (data.success) {
                  setShowEditSubCategoryModal(false);
                  Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Sub category updated successfully!',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false
                  });
                  fetchSubCategories();
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.error || 'Failed to update sub category'
                  });
                }
              } catch (error) {
                console.error('Error updating sub category:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Failed to update sub category'
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editSubCategoryForm.categoryId}
                  onChange={(e) => setEditSubCategoryForm({ ...editSubCategoryForm, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Category Name
                </label>
                <input
                  type="text"
                  value={editSubCategoryForm.subCategoryName}
                  onChange={(e) => setEditSubCategoryForm({ ...editSubCategoryForm, subCategoryName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditSubCategoryModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Update Sub Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Section Modal */}
      {showEditSectionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Edit Section</h3>
              <button
                onClick={() => setShowEditSectionModal(false)}
                className="text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              setLoading(true);
              try {
                const response = await fetch(`/api/sections/${editSectionForm.id}`, {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    name: editSectionForm.material,
                    categoryId: editSectionForm.categoryId,
                    subCategoryId: editSectionForm.subCategoryId,
                    material: editSectionForm.material,
                    description: editSectionForm.description,
                    amount: editSectionForm.amount,
                    type: editSectionForm.type
                  }),
                });
                const data = await response.json();
                if (data.success) {
                  setShowEditSectionModal(false);
                  Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: 'Section updated successfully!',
                    timer: 3000,
                    timerProgressBar: true,
                    showConfirmButton: false
                  });
                  fetchSections();
                } else {
                  Swal.fire({
                    icon: 'error',
                    title: 'Error!',
                    text: data.error || 'Failed to update section'
                  });
                }
              } catch (error) {
                console.error('Error updating section:', error);
                Swal.fire({
                  icon: 'error',
                  title: 'Error!',
                  text: 'Failed to update section'
                });
              } finally {
                setLoading(false);
              }
            }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={editSectionForm.categoryId}
                  onChange={(e) => {
                    setEditSectionForm({ ...editSectionForm, categoryId: e.target.value, subCategoryId: "" });
                    fetchSubCategoriesForCategory(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sub Category
                </label>
                <select
                  value={editSectionForm.subCategoryId}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, subCategoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="">Select Sub Category</option>
                  {subCategoriesForCategory.map((subCategory) => (
                    <option key={subCategory.id} value={subCategory.id}>
                      {subCategory.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Material
                </label>
                <input
                  type="text"
                  value={editSectionForm.material}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, material: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editSectionForm.description}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  rows={3}
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  value={editSectionForm.amount}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  value={editSectionForm.type}
                  onChange={(e) => setEditSectionForm({ ...editSectionForm, type: e.target.value as 'pieces' | 'area' | 'running_sq_feet' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  required
                >
                  <option value="pieces">Pieces</option>
                  <option value="area">Area</option>
                  <option value="running_sq_feet">Running Sq Feet</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditSectionModal(false)}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 cursor-pointer"
                >
                  {loading ? 'Updating...' : 'Update Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 