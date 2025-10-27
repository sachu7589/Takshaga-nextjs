"use client";

import { useState, useEffect } from "react";
import { 
  ArrowLeft,
  Download,
  Edit,
  Trash2,
  Save,
  Plus,
  X
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
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

interface GeneralEstimate {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  estimateType: string;
  items: EstimateItem[];
  totalAmount: number;
  subtotal: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  status: 'pending' | 'approved' | 'completed';
  createdAt: string;
  updatedAt: string;
}

interface ClientDetails {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location?: string;
}

export default function GeneralEstimateViewPage() {
  const router = useRouter();
  const params = useParams();
  const estimateId = params.id as string;

  const [estimate, setEstimate] = useState<GeneralEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedEstimate, setEditedEstimate] = useState<GeneralEstimate | null>(null);
  const [editingItem, setEditingItem] = useState<EstimateItem | null>(null);
  const [editingItemData, setEditingItemData] = useState<EstimateItem | null>(null);

  useEffect(() => {
    const fetchEstimate = async () => {
      if (!estimateId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/general-estimates?estimateId=${estimateId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch estimate');
        }
        
        const data = await response.json();
        
        if (data.estimate) {
          setEstimate(data.estimate);
          
          // Fetch client details
          if (data.estimate.clientId) {
            const clientResponse = await fetch(`/api/clients/${data.estimate.clientId}`);
            if (clientResponse.ok) {
              const clientData = await clientResponse.json();
              setClientDetails(clientData.client);
            }
          }
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Estimate Not Found',
            text: 'The estimate could not be found.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      } catch (error) {
        console.error('Error fetching estimate:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to load estimate details',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      } finally {
        setLoading(false);
      }
    };

    fetchEstimate();
  }, [estimateId]);

  const getEstimateTypeInfo = () => {
    if (!estimate) return { title: 'General Estimate', shortTitle: 'General' };
    
    switch (estimate.estimateType) {
      case 'other':
        return { title: 'General Estimate', shortTitle: 'General' };
      case 'permit':
        return { title: 'Permit Estimate', shortTitle: 'Permit' };
      case 'building':
        return { title: 'Building Estimation', shortTitle: 'Building' };
      case '3d':
        return { title: '3D Estimate', shortTitle: '3D' };
      default:
        return { title: 'General Estimate', shortTitle: 'General' };
    }
  };

  const calculateGrandTotal = () => {
    if (!estimate) return { subtotal: 0, grandTotal: 0 };
    
    const subtotal = estimate.subtotal || estimate.items.reduce((sum, item) => sum + item.totalAmount, 0);
    let grandTotal = subtotal;
    
    if (estimate.discountType === 'percentage' && estimate.discount > 0) {
      grandTotal = subtotal - (subtotal * estimate.discount / 100);
    } else if (estimate.discountType === 'fixed' && estimate.discount > 0) {
      grandTotal = subtotal - estimate.discount;
    }
    
    return { subtotal, grandTotal };
  };

  const handleDownloadPDF = () => {
    if (!estimate || !clientDetails) {
      Swal.fire({
        icon: 'warning',
        title: 'Missing Information',
        text: 'Unable to generate PDF.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      return;
    }

    const doc = new jsPDF();
    const { subtotal, grandTotal } = calculateGrandTotal();

    // Add full page border
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

    // Table data
    const tableData = estimate.items.map(item => [
      item.particulars,
      item.sqFeet.toFixed(2),
      `Rs ${item.amountPerSqFt.toFixed(2)}`,
      `Rs ${item.totalAmount.toFixed(2)}`
    ]);

    // Add table
    autoTable(doc, {
      startY: yPos,
      head: [['Particulars', 'Sq Feet', 'Amount per sq ft', 'Total']],
      body: tableData,
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
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 30 }
      }
    });

    yPos = ((doc as unknown) as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;

    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(20, yPos, 190, yPos);
    yPos += 8;
    
    doc.setFontSize(10);
    doc.setTextColor(44, 62, 80);
    doc.setFont('helvetica', 'bold');
    doc.text(`Sub Total:`, 149, yPos);
    doc.text(`Rs ${subtotal.toFixed(2)}`, 191, yPos, { align: 'right' });
    
    if (estimate.discount > 0) {
      const discountAmount = estimate.discountType === 'percentage' 
        ? (subtotal * estimate.discount / 100) 
        : estimate.discount;
      yPos += 7;
      doc.text(`Discount:`, 149, yPos);
      doc.text(`- Rs ${discountAmount.toFixed(2)}`, 191, yPos, { align: 'right' });
    }
    
    yPos += 7;
    doc.setFontSize(12);
    doc.text(`Grand Total:`, 135, yPos);
    doc.text(`Rs ${grandTotal.toFixed(2)}`, 191, yPos, { align: 'right' });

    yPos += 15;
    doc.setFillColor(0, 51, 102);
    doc.rect(5, yPos, 200, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'normal');
    doc.text("This is a computer generated document and does not require a signature.", 105, yPos + 11, { align: "center" });

    // Save PDF
    doc.save(`${estimate.estimateName || 'Estimate'}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleBack = () => {
    router.push(`/dashboard/estimates?clientId=${estimate?.clientId}&clientName=${clientDetails?.name || 'client'}`);
  };

  const handleEditMode = () => {
    if (!estimate) return;
    setIsEditMode(true);
    setEditedEstimate({ ...estimate });
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedEstimate(null);
    setEditingItem(null);
    setEditingItemData(null);
  };

  const handleAddItem = () => {
    if (!editedEstimate) return;
    const newItem: EstimateItem = {
      id: Date.now().toString(),
      particulars: '',
      amountPerSqFt: 0,
      sqFeet: 0,
      totalAmount: 0
    };
    setEditedEstimate({
      ...editedEstimate,
      items: [...editedEstimate.items, newItem]
    });
    setEditingItem(newItem);
    setEditingItemData(newItem);
  };

  const handleEditItem = (item: EstimateItem) => {
    setEditingItem(item);
    setEditingItemData({ ...item });
  };

  const handleSaveEdit = (itemId: string) => {
    if (!editingItemData || !editedEstimate) return;

    const updatedItems = editedEstimate.items.map(item => {
      if (item.id === itemId) {
        return {
          ...editingItemData,
          id: itemId,
          totalAmount: editingItemData.amountPerSqFt * editingItemData.sqFeet
        };
      }
      return item;
    });

    const newSubtotal = updatedItems.reduce((sum, item) => sum + item.totalAmount, 0);
    const discount = editedEstimate.discount || 0;
    const discountType = editedEstimate.discountType || 'percentage';
    const newGrandTotal = discountType === 'percentage' && discount > 0
      ? newSubtotal - (newSubtotal * discount / 100)
      : discountType === 'fixed' && discount > 0
      ? newSubtotal - discount
      : newSubtotal;

    setEditedEstimate({
      ...editedEstimate,
      items: updatedItems,
      subtotal: newSubtotal,
      totalAmount: newGrandTotal
    });
    setEditingItem(null);
    setEditingItemData(null);
  };

  const handleRemoveItem = (itemId: string) => {
    if (!editedEstimate) return;

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
      if (result.isConfirmed && editedEstimate) {
        const updatedItems = editedEstimate.items.filter(item => item.id !== itemId);
        const newSubtotal = updatedItems.reduce((sum, item) => sum + item.totalAmount, 0);
        const discount = editedEstimate.discount || 0;
        const discountType = editedEstimate.discountType || 'percentage';
        const newGrandTotal = discountType === 'percentage' && discount > 0
          ? newSubtotal - (newSubtotal * discount / 100)
          : discountType === 'fixed' && discount > 0
          ? newSubtotal - discount
          : newSubtotal;

        setEditedEstimate({
          ...editedEstimate,
          items: updatedItems,
          subtotal: newSubtotal,
          totalAmount: newGrandTotal
        });

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

  const handleSaveEstimate = async () => {
    if (!editedEstimate) return;

    try {
      const response = await fetch(`/api/general-estimates/${estimateId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedEstimate),
      });

      if (!response.ok) {
        throw new Error('Failed to update estimate');
      }

      setEstimate(editedEstimate);
      setIsEditMode(false);
      
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Estimate has been updated successfully.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 2000
      });
    } catch (error) {
      console.error('Error updating estimate:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update estimate.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    }
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

  if (!estimate) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Estimate Not Found</h2>
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Estimates
            </button>
          </div>
        </div>
      </div>
    );
  }

  const typeInfo = getEstimateTypeInfo();
  const currentEstimate = isEditMode && editedEstimate ? editedEstimate : estimate;
  const { subtotal, grandTotal } = currentEstimate ? (() => {
    const items = currentEstimate.items;
    const sub = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const discount = currentEstimate.discount || 0;
    const discountType = currentEstimate.discountType || 'percentage';
    const grand = discountType === 'percentage' && discount > 0
      ? sub - (sub * discount / 100)
      : discountType === 'fixed' && discount > 0
      ? sub - discount
      : sub;
    return { subtotal: sub, grandTotal: grand };
  })() : { subtotal: 0, grandTotal: 0 };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{typeInfo.title}</h1>
              <p className="text-gray-600 mt-1">
                {estimate.estimateName || 'General Estimate'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {!isEditMode ? (
              <>
                <button
                  onClick={handleEditMode}
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit Estimate</span>
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={!estimate || !clientDetails}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>Download PDF</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </button>
                <button
                  onClick={handleSaveEstimate}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Client Info */}
        {clientDetails && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-lg">
                <div className="text-blue-600 text-xl font-bold">{typeInfo.shortTitle}</div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-800">Client: {clientDetails.name}</h3>
                <p className="text-gray-700">{clientDetails.email}</p>
                <p className="text-gray-700">{clientDetails.phone}</p>
              </div>
            </div>
          </div>
        )}

        {/* Estimate Details */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Estimate Details</h2>
              {!isEditMode && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  estimate.status === 'approved' 
                    ? 'bg-green-100 text-green-800' 
                    : estimate.status === 'completed'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {estimate.status === 'approved' ? 'Approved' : estimate.status === 'completed' ? 'Completed' : 'Pending'}
                </span>
              )}
              {isEditMode && (
                <button
                  onClick={handleAddItem}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Item</span>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Particulars</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Sq Feet</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Amount per sq ft</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Total</th>
                  {isEditMode && (
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {(isEditMode && editedEstimate ? editedEstimate.items : estimate.items).map((item) => (
                  <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4 text-black">
                      {isEditMode && editingItem?.id === item.id ? (
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
                      {isEditMode && editingItem?.id === item.id ? (
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
                      {isEditMode && editingItem?.id === item.id ? (
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
                    <td className="py-3 px-4 text-sm font-semibold text-green-600 text-center">
                      ₹{(isEditMode && editingItem?.id === item.id ? (editingItemData?.totalAmount || 0) : item.totalAmount).toFixed(2)}
                    </td>
                    {isEditMode && (
                      <td className="py-3 px-4">
                        <div className="flex space-x-2 justify-center">
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
                                onClick={() => {
                                  setEditingItem(null);
                                  setEditingItemData(null);
                                }}
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
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        {currentEstimate && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between text-gray-700">
                <span className="font-medium">Subtotal:</span>
                <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
              </div>
              {currentEstimate.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span className="font-medium">
                    Discount ({currentEstimate.discountType === 'percentage' ? `${currentEstimate.discount}%` : '₹' + currentEstimate.discount}):
                  </span>
                  <span className="font-semibold">
                    -₹{(currentEstimate.discountType === 'percentage' ? (subtotal * currentEstimate.discount / 100) : currentEstimate.discount).toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-xl font-bold text-blue-600 border-t pt-2 mt-2">
                <span>Grand Total:</span>
                <span>₹{grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

