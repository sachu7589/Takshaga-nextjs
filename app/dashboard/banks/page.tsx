"use client";

import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, CreditCard, User, Hash, Type, Code, Smartphone } from "lucide-react";
import Swal from 'sweetalert2';

interface BankDetails {
  _id: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  accountType: string;
  ifscCode: string;
  upiId: string;
  createdAt: string;
  updatedAt: string;
}



export default function BanksPage() {
  const [banks, setBanks] = useState<BankDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState<BankDetails | null>(null);
  const [formData, setFormData] = useState({
    bankName: "",
    accountName: "",
    accountNumber: "",
    accountType: "",
    ifscCode: "",
    upiId: "",
  });

  useEffect(() => {
    fetchBanks();
  }, []);

  const fetchBanks = async () => {
    try {
      const response = await fetch("/api/banks");
      if (response.ok) {
        const data = await response.json();
        setBanks(data.banks);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    } finally {
      setLoading(false);
    }
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingBank ? `/api/banks/${editingBank._id}` : "/api/banks";
      const method = editingBank ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowForm(false);
        setEditingBank(null);
        resetForm();
        fetchBanks();
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: editingBank ? 'Bank details updated successfully!' : 'Bank details added successfully!',
          confirmButtonColor: '#3B82F6',
          timer: 2000,
          showConfirmButton: false
        });
      } else {
        const error = await response.json();
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: error.message || "Error saving bank details",
          confirmButtonColor: '#EF4444'
        });
      }
    } catch (error) {
      console.error("Error saving bank:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error!',
        text: "Error saving bank details",
        confirmButtonColor: '#EF4444'
      });
    }
  };

  const handleEdit = (bank: BankDetails) => {
    setEditingBank(bank);
    setFormData({
      bankName: bank.bankName,
      accountName: bank.accountName,
      accountNumber: bank.accountNumber,
      accountType: bank.accountType,
      ifscCode: bank.ifscCode,
      upiId: bank.upiId,
    });
    setShowForm(true);
  };

  const handleDelete = async (bankId: string) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/banks/${bankId}`, {
          method: "DELETE",
        });

        if (response.ok) {
          fetchBanks();
          
          // Show success message
          Swal.fire({
            icon: 'success',
            title: 'Deleted!',
            text: 'Bank details have been deleted.',
            confirmButtonColor: '#3B82F6',
            timer: 2000,
            showConfirmButton: false
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: "Error deleting bank details",
            confirmButtonColor: '#EF4444'
          });
        }
      } catch (error) {
        console.error("Error deleting bank:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error!',
          text: "Error deleting bank details",
          confirmButtonColor: '#EF4444'
        });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      bankName: "",
      accountName: "",
      accountNumber: "",
      accountType: "",
      ifscCode: "",
      upiId: "",
    });
  };



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
          <h1 className="text-2xl font-bold text-gray-900">Bank Details</h1>
          <p className="text-gray-600 mt-1">Manage bank account information</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingBank(null);
            resetForm();
          }}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Add Bank</span>
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingBank ? "Edit Bank Details" : "Add New Bank Details"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                  placeholder="Enter bank name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Name
                </label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                  placeholder="Enter account holder name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                  placeholder="Enter account number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Type
                </label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData({ ...formData, accountType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  required
                >
                  <option value="" className="text-gray-600">Select Account Type</option>
                  <option value="Savings" className="text-black">Savings</option>
                  <option value="Current" className="text-black">Current</option>
                  <option value="Fixed Deposit" className="text-black">Fixed Deposit</option>
                  <option value="Recurring Deposit" className="text-black">Recurring Deposit</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code
                </label>
                <input
                  type="text"
                  value={formData.ifscCode}
                  onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                  placeholder="Enter IFSC code"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI ID
                </label>
                <input
                  type="text"
                  value={formData.upiId}
                  onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-600 text-black"
                  placeholder="Enter UPI ID"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-4">
              <button
                type="submit"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingBank ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingBank(null);
                  resetForm();
                }}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Bank Details List */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
        </div>
        
        {banks.length === 0 ? (
          <div className="p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No bank details found</p>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingBank(null);
                resetForm();
              }}
              className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
            >
              Add your first bank detail
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {banks.map((bank) => (
              <div key={bank._id} className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      </div>
                                             <div>
                         <h4 className="text-lg font-semibold text-gray-900">{bank.bankName}</h4>
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Account Name:</span> {bank.accountName}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Hash className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Account Number:</span> {bank.accountNumber}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Type className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">Account Type:</span> {bank.accountType}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Code className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">IFSC Code:</span> {bank.ifscCode}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Smartphone className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          <span className="font-medium">UPI ID:</span> {bank.upiId}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleEdit(bank)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(bank._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 