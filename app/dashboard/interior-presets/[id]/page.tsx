'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Calendar, Edit, Trash2, Download } from 'lucide-react';
import Swal from 'sweetalert2';

interface Item {
  id: string;
  sectionId: string;
  sectionName: string;
  categoryName: string;
  subCategoryName: string;
  materialName: string;
  type: 'area' | 'pieces' | 'running';
  length?: number;
  breadth?: number;
  pieces?: number;
  runningLength?: number;
  description: string;
  totalAmount: number;
}

interface InteriorPreset {
  id: string;
  name: string;
  items: Item[];
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function InteriorPresetDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [preset, setPreset] = useState<InteriorPreset | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedPreset, setEditedPreset] = useState<InteriorPreset | null>(null);

  const fetchPreset = useCallback(async (presetId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/interior-presets/${presetId}`);
      const data = await response.json();
      
      if (data.success) {
        setPreset(data.preset);
      } else {
        console.error('Failed to fetch preset:', data.message);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: 'Failed to fetch preset details',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
        router.push('/dashboard/interior-presets');
      }
    } catch (error) {
      console.error('Error fetching preset:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch preset details',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
      router.push('/dashboard/interior-presets');
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (params.id) {
      fetchPreset(params.id as string);
    }
  }, [params.id, fetchPreset]);

  const handleEditPreset = () => {
    if (isEditing) {
      // Save changes
      handleSaveChanges();
    } else {
      // Start editing
      setIsEditing(true);
      setEditedPreset({ ...preset! });
    }
  };

  const handleSaveChanges = async () => {
    if (!editedPreset) return;

    try {
      const response = await fetch(`/api/interior-presets/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedPreset.name,
          items: editedPreset.items,
          totalAmount: editedPreset.totalAmount
        })
      });

      const data = await response.json();

      if (data.success) {
        setPreset(data.preset);
        setIsEditing(false);
        setEditedPreset(null);
        Swal.fire({
          icon: 'success',
          title: 'Preset Updated!',
          text: 'Interior preset has been updated successfully.',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 3000
        });
      } else {
        throw new Error(data.message || 'Failed to update preset');
      }
    } catch (error) {
      console.error('Error updating preset:', error);
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Failed to update the preset. Please try again.',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPreset(null);
  };

  const handleDeletePreset = async () => {
    Swal.fire({
      title: 'Delete Preset?',
      text: `Are you sure you want to delete "${preset?.name}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await fetch(`/api/interior-presets/${params.id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
            }
          });

          const data = await response.json();

          if (data.success) {
            Swal.fire({
              icon: 'success',
              title: 'Preset Deleted!',
              text: 'Interior preset has been removed.',
              position: 'top-end',
              toast: true,
              showConfirmButton: false,
              timer: 3000
            });
            router.push('/dashboard/interior-presets');
          } else {
            throw new Error(data.message || 'Failed to delete preset');
          }
        } catch (error) {
          console.error('Error deleting preset:', error);
          Swal.fire({
            icon: 'error',
            title: 'Delete Failed',
            text: 'Failed to delete the preset. Please try again.',
            position: 'top-end',
            toast: true,
            showConfirmButton: false,
            timer: 3000
          });
        }
      }
    });
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading preset details...</span>
      </div>
    );
  }

  if (!preset) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Preset Not Found</h3>
        <p className="text-gray-600 mb-6">The preset you&apos;re looking for doesn&apos;t exist.</p>
        <button
          onClick={() => router.push('/dashboard/interior-presets')}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Presets
        </button>
      </div>
    );
  }

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
            {isEditing ? (
              <input
                type="text"
                value={editedPreset?.name || ''}
                onChange={(e) => setEditedPreset(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600"
              />
            ) : (
              <h1 className="text-3xl font-bold text-gray-900">{preset.name}</h1>
            )}
            <div className="flex items-center text-sm text-gray-500 mt-1">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Created on {formatDate(preset.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="flex space-x-3">
          {isEditing ? (
            <>
              <button
                onClick={handleEditPreset}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                <span>Save Changes</span>
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <span>Cancel</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEditPreset}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
              >
                <Edit className="h-4 w-4" />
                <span>Edit</span>
              </button>
              <button
                onClick={handleDeletePreset}
                className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors cursor-pointer"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Items</h3>
            <p className="text-3xl font-bold text-blue-600">
              {isEditing ? editedPreset?.items.length : preset.items.length}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Amount</h3>
            <p className="text-3xl font-bold text-green-600">
              ₹{(isEditing ? editedPreset?.totalAmount : preset.totalAmount)?.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Last Updated</h3>
            <p className="text-sm text-gray-600">{formatDate(preset.updatedAt)}</p>
          </div>
        </div>

      {/* Items Details */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Preset Items</h2>
          <button className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors cursor-pointer">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        <div className="space-y-6">
          {(() => {
            // Use editedPreset.items when in editing mode, otherwise use preset.items
            const currentItems = isEditing ? (editedPreset?.items || []) : preset.items;
            
            // Group items by category and subcategory
            const groupedItems = currentItems.reduce((acc, item) => {
              if (!acc[item.categoryName]) {
                acc[item.categoryName] = {};
              }
              if (!acc[item.categoryName][item.subCategoryName]) {
                acc[item.categoryName][item.subCategoryName] = [];
              }
              acc[item.categoryName][item.subCategoryName].push(item);
              return acc;
            }, {} as Record<string, Record<string, typeof currentItems>>);

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
                                {isEditing && (
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 border-b border-gray-200">Actions</th>
                                )}
                          </tr>
                        </thead>
                        <tbody>
                          {categoryItems.map((item) => (
                            <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                              <td className="py-3 px-4 text-sm font-medium text-gray-900 whitespace-nowrap">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedPreset?.items.find(i => i.id === item.id)?.materialName || item.materialName}
                                    onChange={(e) => {
                                      setEditedPreset(prev => {
                                        if (!prev) return null;
                                        const updatedItems = prev.items.map(i => 
                                          i.id === item.id ? { ...i, materialName: e.target.value } : i
                                        );
                                        return { ...prev, items: updatedItems };
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                  />
                                ) : (
                                  item.materialName
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm text-gray-700 max-w-xs truncate">
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editedPreset?.items.find(i => i.id === item.id)?.description || item.description}
                                    onChange={(e) => {
                                      setEditedPreset(prev => {
                                        if (!prev) return null;
                                        const updatedItems = prev.items.map(i => 
                                          i.id === item.id ? { ...i, description: e.target.value } : i
                                        );
                                        return { ...prev, items: updatedItems };
                                      });
                                    }}
                                    className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                                  />
                                ) : (
                                  item.description
                                )}
                              </td>
                              {categoryItems.some(i => i.type === 'area') && (
                                <>
                                  <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                    {isEditing && item.type === 'area' ? (
                                      <input
                                        type="number"
                                        value={editedPreset?.items.find(i => i.id === item.id)?.length || item.length || 0}
                                        onChange={(e) => {
                                          setEditedPreset(prev => {
                                            if (!prev) return null;
                                            const updatedItems = prev.items.map(i => 
                                              i.id === item.id ? { ...i, length: parseFloat(e.target.value) || 0 } : i
                                            );
                                            return { ...prev, items: updatedItems };
                                          });
                                        }}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-center"
                                      />
                                    ) : (
                                      item.type === 'area' ? (item.length || 0) : '-'
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                    {isEditing && item.type === 'area' ? (
                                      <input
                                        type="number"
                                        value={editedPreset?.items.find(i => i.id === item.id)?.breadth || item.breadth || 0}
                                        onChange={(e) => {
                                          setEditedPreset(prev => {
                                            if (!prev) return null;
                                            const updatedItems = prev.items.map(i => 
                                              i.id === item.id ? { ...i, breadth: parseFloat(e.target.value) || 0 } : i
                                            );
                                            return { ...prev, items: updatedItems };
                                          });
                                        }}
                                        className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-center"
                                      />
                                    ) : (
                                      item.type === 'area' ? (item.breadth || 0) : '-'
                                    )}
                                  </td>
                                </>
                              )}
                              {categoryItems.some(i => i.type === 'pieces') && (
                                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                  {isEditing && item.type === 'pieces' ? (
                                    <input
                                      type="number"
                                      value={editedPreset?.items.find(i => i.id === item.id)?.pieces || item.pieces || 0}
                                      onChange={(e) => {
                                        setEditedPreset(prev => {
                                          if (!prev) return null;
                                          const updatedItems = prev.items.map(i => 
                                            i.id === item.id ? { ...i, pieces: parseInt(e.target.value) || 0 } : i
                                          );
                                          return { ...prev, items: updatedItems };
                                        });
                                      }}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-center"
                                    />
                                  ) : (
                                    item.type === 'pieces' ? (item.pieces || 0) : '-'
                                  )}
                                </td>
                              )}
                              {categoryItems.some(i => i.type === 'running') && (
                                <td className="py-3 px-4 text-sm text-gray-600 text-center">
                                  {isEditing && item.type === 'running' ? (
                                    <input
                                      type="number"
                                      value={editedPreset?.items.find(i => i.id === item.id)?.runningLength || item.runningLength || 0}
                                      onChange={(e) => {
                                        setEditedPreset(prev => {
                                          if (!prev) return null;
                                          const updatedItems = prev.items.map(i => 
                                            i.id === item.id ? { ...i, runningLength: parseFloat(e.target.value) || 0 } : i
                                          );
                                          return { ...prev, items: updatedItems };
                                        });
                                      }}
                                      className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-center"
                                    />
                                  ) : (
                                    item.type === 'running' ? (item.runningLength || 0) : '-'
                                  )}
                                </td>
                              )}
                              <td className="py-3 px-4 text-sm font-medium text-blue-600 text-center">
                                {isEditing ? (
                                  <input
                                    type="number"
                                    value={editedPreset?.items.find(i => i.id === item.id)?.totalAmount || item.totalAmount}
                                    onChange={(e) => {
                                      setEditedPreset(prev => {
                                        if (!prev) return null;
                                        const updatedItems = prev.items.map(i => 
                                          i.id === item.id ? { ...i, totalAmount: parseFloat(e.target.value) || 0 } : i
                                        );
                                        return { ...prev, items: updatedItems };
                                      });
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black text-center"
                                  />
                                ) : (
                                  `₹${item.totalAmount.toLocaleString()}`
                                )}
                              </td>
                              <td className="py-3 px-4 text-sm font-semibold text-green-600 text-center">
                                ₹{item.totalAmount.toLocaleString()}
                              </td>
                              {isEditing && (
                                <td className="py-3 px-4 text-center">
                                  <button
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Remove Item?',
                                        text: `Are you sure you want to remove "${item.materialName}"?`,
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#ef4444',
                                        cancelButtonColor: '#6b7280',
                                        confirmButtonText: 'Remove',
                                        cancelButtonText: 'Cancel'
                                      }).then((result) => {
                                        if (result.isConfirmed) {
                                          setEditedPreset(prev => {
                                            if (!prev) return null;
                                            const updatedItems = prev.items.filter(i => i.id !== item.id);
                                            const newTotalAmount = updatedItems.reduce((sum, i) => sum + i.totalAmount, 0);
                                            return { 
                                              ...prev, 
                                              items: updatedItems,
                                              totalAmount: newTotalAmount
                                            };
                                          });
                                        }
                                      });
                                    }}
                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                    title="Remove Item"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              )}
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

        {/* Summary */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              <span className="font-medium">Items Count:</span> {isEditing ? editedPreset?.items.length : preset.items.length}
            </div>
            <div className="flex space-x-8">
              <div className="text-sm text-gray-600">
                <span className="font-medium">Sub Total:</span> 
                <span className="ml-2 text-blue-600 font-semibold">
                  ₹{(isEditing ? editedPreset?.totalAmount : preset.totalAmount)?.toLocaleString()}
                </span>
              </div>
              <div className="text-lg font-semibold text-green-600">
                Grand Total: ₹{(isEditing ? editedPreset?.totalAmount : preset.totalAmount)?.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 