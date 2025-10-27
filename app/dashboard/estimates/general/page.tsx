"use client";

import { useState } from "react";
import { 
  ArrowLeft,
  Plus,
  Trash2,
  Edit,
  Save,
  Download,
  X
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface EstimateItem {
  id: string;
  particulars: string;
  amountPerSqFt: number;
  sqFeet: number;
  totalAmount: number;
}

export default function GeneralEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');
  const estimateType = searchParams.get('type');

  const [estimateName, setEstimateName] = useState('');
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
  const [editingItemData, setEditingItemData] = useState<EstimateItem | null>(null);
  const [discount, setDiscount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const getEstimateTypeInfo = () => {
    switch (estimateType) {
      case 'other':
        return {
          title: 'General Estimate',
          shortTitle: 'General'
        };
      case 'permit':
        return {
          title: 'Permit Estimate',
          shortTitle: 'Permit'
        };
      case 'building':
        return {
          title: 'Building Estimation',
          shortTitle: 'Building'
        };
      case '3d':
        return {
          title: '3D Estimate',
          shortTitle: '3D'
        };
      default:
        return {
          title: 'General Estimate',
          shortTitle: 'General'
        };
    }
  };

  const typeInfo = getEstimateTypeInfo();

  const handleAddItem = () => {
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      particulars: '',
      amountPerSqFt: 0,
      sqFeet: 0,
      totalAmount: 0
    };
    setItems([...items, newItem]);
    setEditingItem(newItem);
    setEditingItemData(newItem);
  };

  const handleEditItem = (item: EstimateItem) => {
    setEditingItem(item);
    setEditingItemData({ ...item });
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editingItemData) return;

    const updatedItem: EstimateItem = {
      ...editingItemData,
      id: itemId,
      totalAmount: editingItemData.amountPerSqFt * editingItemData.sqFeet
    };

    setItems(prev => prev.map(item => item.id === itemId ? updatedItem : item));
    setEditingItem(null);
    setEditingItemData(null);
  };

  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditingItemData(null);
  };

  const handleRemoveItem = (itemId: string) => {
    Swal.fire({
      title: 'Are you sure?',
      text: 'This action cannot be undone',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        setItems(prev => prev.filter(item => item.id !== itemId));
      Swal.fire({
        icon: 'success',
          title: 'Removed!',
          text: 'Item has been removed.',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 2000
        });
      }
    });
  };

  const calculateGrandTotal = () => {
    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    let grandTotal = subtotal;
    
    if (discountType === 'percentage' && discount > 0) {
      grandTotal = subtotal - (subtotal * discount / 100);
    } else if (discountType === 'fixed' && discount > 0) {
      grandTotal = subtotal - discount;
    }
    
    return { subtotal, grandTotal };
  };

  const handleDownloadPDF = async () => {
    if (!clientName || items.length === 0 || !clientId) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Please add client details and at least one item to download.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    // Save to database first
    try {
      const { subtotal, grandTotal } = calculateGrandTotal();
      
      const response = await fetch('/api/general-estimates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          estimateName: estimateName || `${typeInfo.title}`,
          items,
          totalAmount: grandTotal,
          subtotal,
          discount,
          discountType,
          estimateType: estimateType || 'other'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save estimate');
      }

      // Show success message
      await Swal.fire({
        icon: 'success',
        title: 'Saved!',
        text: 'Estimate has been saved to database.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error('Error saving estimate:', error);
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to save estimate to database. Proceeding with download.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    }

    // Now download PDF
    const doc = new jsPDF();
    const { subtotal, grandTotal } = calculateGrandTotal();

    // Header
    doc.setFontSize(20);
    doc.text(`${typeInfo.title}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Client: ${clientName}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);
    
    if (estimateName) {
      doc.text(`Estimate Name: ${estimateName}`, 14, 42);
    }

    // Table data
    const tableData = items.map(item => [
      item.particulars,
      item.sqFeet.toFixed(2),
      `₹${item.amountPerSqFt.toFixed(2)}`,
      `₹${item.totalAmount.toFixed(2)}`
    ]);

    // Add table
    autoTable(doc, {
      head: [['Particulars', 'Sq Feet', 'Amount per sq ft', 'Total']],
      body: tableData,
      startY: estimateName ? 48 : 42,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 25 },
        2: { cellWidth: 35 },
        3: { cellWidth: 35 }
      }
    });

    // Get final Y position after table
    let finalY = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;

    // Totals
    finalY += 10;
    doc.setFontSize(12);
    doc.text(`Subtotal: ₹${subtotal.toFixed(2)}`, 150, finalY);
    
    if (discount > 0) {
      const discountAmount = discountType === 'percentage' 
        ? (subtotal * discount / 100) 
        : discount;
      finalY += 6;
      doc.text(`Discount: -₹${discountAmount.toFixed(2)}`, 150, finalY);
    }
    
    finalY += 6;
    doc.setFontSize(14);
    doc.text(`Grand Total: ₹${grandTotal.toFixed(2)}`, 150, finalY);

    // Save PDF
    doc.save(`${typeInfo.shortTitle}_Estimate_${clientName}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleBackToEstimates = () => {
    router.push(`/dashboard/estimates?clientId=${clientId}&clientName=${clientName}`);
  };

  const { subtotal, grandTotal } = calculateGrandTotal();

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
      {/* Header */}
        <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToEstimates}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typeInfo.title}</h1>
              <p className="text-gray-600 mt-1">{clientName ? `Estimate for ${clientName}` : 'Prepare Estimate'}</p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      {clientName && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
          <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="text-blue-600 text-xl font-bold">{typeInfo.shortTitle}</div>
            </div>
              <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-800">Client: {clientName}</h3>
                <p className="text-gray-700">{typeInfo.title}</p>
            </div>
          </div>
        </div>
      )}

        {/* Estimate Name and Discount */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimate Name
              </label>
              <input
                type="text"
                value={estimateName}
                onChange={(e) => setEstimateName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black placeholder:text-gray-400"
                placeholder="Enter estimate name"
              />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Discount</h3>
              <div className="grid grid-cols-2 gap-4">
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percentage' | 'fixed')}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed</option>
              </select>
            </div>
            <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {discountType === 'percentage' ? '(%)' : '(₹)'}
              </label>
                  <input
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-black placeholder:text-gray-400"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            </div>
          </div>
            </div>

        {/* Items Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Estimate Items</h2>
              <button
                onClick={handleAddItem}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Item</span>
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">No items added yet. Click &quot;Add Item&quot; to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Particulars</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sq Feet</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Amount per sq ft</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Total</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 text-black">
                        {editingItem?.id === item.id ? (
                          <input
                            type="text"
                            value={editingItemData?.particulars || ''}
                            onChange={(e) => setEditingItemData(prev => prev ? { ...prev, particulars: e.target.value } : null)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black"
                          />
                        ) : (
                          item.particulars || '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-black text-center">
                        {editingItem?.id === item.id ? (
                          <input
                            type="number"
                            value={editingItemData?.sqFeet || 0}
                            onChange={(e) => {
                              const newSqFeet = parseFloat(e.target.value) || 0;
                              const amountPerSqFt = editingItemData?.amountPerSqFt || 0;
                              const newTotal = newSqFeet * amountPerSqFt;
                              setEditingItemData(prev => prev ? { ...prev, sqFeet: newSqFeet, totalAmount: newTotal } : null);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black text-center"
                          />
                        ) : (
                          item.sqFeet.toFixed(2)
                        )}
                      </td>
                      <td className="py-3 px-4 text-black text-center">
                        {editingItem?.id === item.id ? (
                          <input
                            type="number"
                            value={editingItemData?.amountPerSqFt || 0}
                            onChange={(e) => {
                              const newAmountPerSqFt = parseFloat(e.target.value) || 0;
                              const sqFeet = editingItemData?.sqFeet || 0;
                              const newTotal = sqFeet * newAmountPerSqFt;
                              setEditingItemData(prev => prev ? { ...prev, amountPerSqFt: newAmountPerSqFt, totalAmount: newTotal } : null);
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm text-black text-center"
                          />
                        ) : (
                          `₹${item.amountPerSqFt.toFixed(2)}`
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm font-semibold text-green-600">
                        <div className="text-center">
                          ₹{(editingItemData?.totalAmount || item.totalAmount).toFixed(2)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          {editingItem?.id === item.id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(item.id)}
                                className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                title="Save Changes"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="Cancel Edit"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEditItem(item)}
                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="Edit Item"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
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
          )}
        </div>

        {/* Totals */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="space-y-2">
            <div className="flex justify-between text-gray-700">
              <span className="font-medium">Subtotal:</span>
              <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span className="font-medium">
                  Discount ({discountType === 'percentage' ? `${discount}%` : '₹' + discount}):
                </span>
                <span className="font-semibold">
                  -₹{(discountType === 'percentage' ? (subtotal * discount / 100) : discount).toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold text-blue-600 border-t pt-2 mt-2">
              <span>Grand Total:</span>
              <span>₹{grandTotal.toFixed(2)}</span>
            </div>
          </div>
          </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
            <button
              onClick={handleBackToEstimates}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Back to Estimates
            </button>
            <button
            onClick={handleDownloadPDF}
            disabled={items.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
            >
            <Download className="h-4 w-4" />
            <span>Save and Download</span>
            </button>
          </div>
      </div>
    </div>
  );
} 