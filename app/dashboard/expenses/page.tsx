"use client";

import { useState, useEffect, useMemo } from "react";
import { Plus, Receipt, DollarSign, Calendar, FileText, User, Briefcase, X, Search, Filter, ChevronLeft, ChevronRight, Download } from "lucide-react";
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';

interface CommonExpense {
  _id: string;
  userId: string;
  category: string;
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectExpense {
  _id: string;
  userId: string;
  clientId: string;
  category: string;
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Client {
  _id: string;
  name: string;
}

interface CombinedExpense {
  _id: string;
  type: 'common' | 'project';
  userId: string;
  clientId?: string;
  clientName?: string;
  category: string;
  notes: string;
  amount: number;
  date: string;
  addedBy: string;
  createdAt: string;
  updatedAt: string;
}

export default function ExpensesPage() {
  const [commonExpenses, setCommonExpenses] = useState<CommonExpense[]>([]);
  const [projectExpenses, setProjectExpenses] = useState<ProjectExpense[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [filterClient, setFilterClient] = useState<string>("");
  const [filterDateFrom, setFilterDateFrom] = useState<string>("");
  const [filterDateTo, setFilterDateTo] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    notes: "",
    date: new Date().toISOString().split('T')[0]
  });

  const categories = [
    "rent",
    "electricity",
    "wifi",
    "employee salary",
    "traveling",
    "others"
  ];

  useEffect(() => {
    fetchAllData();
  }, []);

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c._id === clientId);
    return client?.name || 'Unknown Client';
  };

  // Combine and filter expenses
  const combinedExpenses = useMemo(() => {
    const common = commonExpenses.map(exp => ({
      ...exp,
      type: 'common' as const,
      clientName: undefined
    }));
    
    const project = projectExpenses.map(exp => ({
      ...exp,
      type: 'project' as const,
      clientName: getClientName(exp.clientId)
    }));

    let combined: CombinedExpense[] = [...common, ...project];

    // Apply filters
    if (filterType) {
      combined = combined.filter(exp => exp.type === filterType);
    }

    if (filterClient) {
      combined = combined.filter(exp => 
        exp.type === 'project' && exp.clientId === filterClient
      );
    }

    if (filterCategory) {
      combined = combined.filter(exp => 
        exp.category.toLowerCase() === filterCategory.toLowerCase()
      );
    }

    if (filterDateFrom) {
      combined = combined.filter(exp => 
        new Date(exp.date) >= new Date(filterDateFrom)
      );
    }

    if (filterDateTo) {
      combined = combined.filter(exp => 
        new Date(exp.date) <= new Date(filterDateTo)
      );
    }

    // Apply search
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      combined = combined.filter(exp => 
        exp.category.toLowerCase().includes(searchLower) ||
        exp.notes.toLowerCase().includes(searchLower) ||
        exp.addedBy.toLowerCase().includes(searchLower) ||
        (exp.clientName && exp.clientName.toLowerCase().includes(searchLower)) ||
        formatCurrency(exp.amount).toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    return combined.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [commonExpenses, projectExpenses, clients, filterClient, filterDateFrom, filterDateTo, filterType, filterCategory, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(combinedExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedExpenses = combinedExpenses.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterClient, filterDateFrom, filterDateTo, filterType, filterCategory, searchTerm]);

  const fetchAllData = async () => {
    try {
      const [commonRes, projectRes, clientsRes] = await Promise.all([
        fetch("/api/common-expenses"),
        fetch("/api/expenses"),
        fetch("/api/clients")
      ]);

      if (commonRes.ok) {
        const commonData = await commonRes.json();
        setCommonExpenses(commonData.expenses || []);
      }

      if (projectRes.ok) {
        const projectData = await projectRes.json();
        // Filter only expenses with clientId (project expenses)
        const filtered = (projectData.expenses || []).filter((exp: ProjectExpense) => exp.clientId);
        setProjectExpenses(filtered);
      }

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json();
        setClients(clientsData.clients || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCommonExpenses = async () => {
    try {
      const response = await fetch("/api/common-expenses");
      if (response.ok) {
        const data = await response.json();
        setCommonExpenses(data.expenses || []);
      }
    } catch (error) {
      console.error("Error fetching common expenses:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.amount || !formData.category) {
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: 'Please fill in all required fields',
        confirmButtonColor: '#EF4444'
      });
      return;
    }

    // Always use current date
    const expenseData = {
      ...formData,
      date: new Date().toISOString().split('T')[0]
    };

    try {
      const response = await fetch("/api/common-expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (response.ok) {
        setShowForm(false);
        resetForm();
        fetchCommonExpenses();
        
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: 'Common expense added successfully!',
          confirmButtonColor: '#3B82F6',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const error = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error.error || "Error adding expense",
          confirmButtonColor: '#EF4444'
        });
      }
    } catch (error) {
      console.error("Error adding expense:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: "Error adding expense",
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      category: "",
      notes: "",
      date: new Date().toISOString().split('T')[0]
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Excel download
  const handleDownloadExcel = () => {
    if (combinedExpenses.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data',
        text: 'No expenses to download',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }

    const data = combinedExpenses.map(exp => ({
      'Date': formatDate(exp.date),
      'Type': exp.type === 'common' ? 'Common Expense' : 'Project Expense',
      'Client': exp.clientName || '-',
      'Category': exp.category,
      'Amount': exp.amount,
      'Notes': exp.notes || '-',
      'Added By': exp.addedBy
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');

    // Auto-size columns
    ws['!cols'] = [{ wch: 12 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }, { wch: 15 }];

    const fileName = `expenses_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);

    Swal.fire({
      icon: 'success',
      title: 'Downloaded!',
      text: 'Expenses exported to Excel successfully',
      confirmButtonColor: '#3B82F6',
      timer: 2000,
      showConfirmButton: false
    });
  };

  const commonTotal = commonExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const projectTotal = projectExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const grandTotal = commonTotal + projectTotal;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
          <p className="text-gray-600 mt-1">Manage and track your expenses</p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Common Expense</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Expenses</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(grandTotal)}</p>
            </div>
            <DollarSign className="h-12 w-12 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Common Expenses</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(commonTotal)}</p>
            </div>
            <Receipt className="h-12 w-12 text-green-200" />
          </div>
        </div>
        <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Project Expenses</p>
              <p className="text-3xl font-bold mt-1">{formatCurrency(projectTotal)}</p>
            </div>
            <Briefcase className="h-12 w-12 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Add Common Expense Modal */}
      {showForm && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              resetForm();
              setShowForm(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Add Common Expense</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                      placeholder="Enter amount"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                      required
                    >
                      <option value="" className="text-gray-600">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat} className="text-black capitalize">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                      placeholder="Enter notes (optional)"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      resetForm();
                      setShowForm(false);
                    }}
                    className="flex-1 bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        {/* Search Bar */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by category, notes, client, amount, or added by..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="">All Types</option>
                <option value="common" className="text-black">Common Expense</option>
                <option value="project" className="text-black">Project Expense</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat} className="text-black capitalize">
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Client
              </label>
              <select
                value={filterClient}
                onChange={(e) => setFilterClient(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              >
                <option value="">All Clients</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id} className="text-black">
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date From
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date To
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setFilterClient("");
                setFilterDateFrom("");
                setFilterDateTo("");
                setFilterType("");
                setFilterCategory("");
                setSearchTerm("");
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-700"
            >
              Clear Filters
            </button>
            <button
              onClick={handleDownloadExcel}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Combined Expenses Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {startIndex + 1}-{Math.min(endIndex, combinedExpenses.length)} of {combinedExpenses.length} expenses
              </p>
            </div>
          </div>
        </div>
        
        {combinedExpenses.length === 0 ? (
          <div className="p-8 text-center">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No expenses found</p>
            {!filterClient && !filterDateFrom && !filterDateTo && (
              <button
                onClick={() => {
                  setShowForm(true);
                  resetForm();
                }}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Add your first expense
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added By
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedExpenses.map((expense) => (
                    <tr key={`${expense.type}-${expense._id}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{formatDate(expense.date)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          expense.type === 'common' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-purple-100 text-purple-800'
                        }`}>
                          {expense.type === 'common' ? 'Common' : 'Project'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {expense.type === 'project' ? (
                          <div className="flex items-center">
                            <Briefcase className="h-4 w-4 text-gray-400 mr-2" />
                            <span className="text-sm font-medium text-gray-900">
                              {expense.clientName || '-'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 capitalize">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(expense.amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <FileText className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {expense.notes || '-'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {expense.addedBy || '-'}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    <span>Previous</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    <span>Next</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

