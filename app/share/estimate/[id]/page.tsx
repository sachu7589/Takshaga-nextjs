"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  Download,
  Share2,
  Copy,
} from "lucide-react";
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

interface Estimate {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  items: Item[];
  totalAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
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

export default function PublicEstimatePage() {
  const params = useParams();
  const estimateId = params.id as string;
  
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [clientDetails, setClientDetails] = useState<ClientDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  
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

  const handleDownloadEstimate = () => {
    if (!estimate || !clientDetails) return;

    // Calculate subtotal and discount
    const subtotal = estimate.items.reduce((sum, item) => sum + item.totalAmount, 0);
    const discountAmount = estimate.discount && estimate.discount > 0 
      ? (estimate.discountType === 'percentage' 
          ? (subtotal * estimate.discount) / 100 
          : estimate.discount)
      : 0;

    // Create professional estimate content
    const estimateContent = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                              INTERIOR ESTIMATE                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

ESTIMATE DETAILS:
─────────────────────────────────────────────────────────────────────────────────
Estimate Name: ${estimate.estimateName}
Created Date: ${new Date(estimate.createdAt).toLocaleDateString()}
Estimate ID: ${estimate._id}

CLIENT INFORMATION:
─────────────────────────────────────────────────────────────────────────────────
Name: ${clientDetails.name}
Email: ${clientDetails.email}
Phone: ${clientDetails.phone}
Location: ${clientDetails.location}

ESTIMATE ITEMS:
─────────────────────────────────────────────────────────────────────────────────
${estimate.items.map((item, index) => {
  const itemNumber = (index + 1).toString().padStart(2, '0');
  const itemName = item.materialName.padEnd(30);
  
  let dimensions = '';
  if (item.type === 'area') {
    dimensions = `${item.length}cm x ${item.breadth}cm`;
  } else if (item.type === 'pieces') {
    dimensions = `${item.pieces} pieces`;
  } else if (item.type === 'running') {
    dimensions = `${item.runningLength}cm running`;
  }
  
  return `${itemNumber}. ${itemName} | ${dimensions}
        Description: ${item.description}
        Amount: ₹${item.totalAmount.toFixed(2)}
`;
}).join('')}

SUMMARY:
─────────────────────────────────────────────────────────────────────────────────
Subtotal: ₹${subtotal.toFixed(2)}
${estimate.discount && estimate.discount > 0 ? `Discount (${estimate.discountType === 'percentage' ? `${estimate.discount}%` : `₹${estimate.discount}`}): -₹${discountAmount.toFixed(2)}` : ''}
─────────────────────────────────────────────────────────────────────────────────
GRAND TOTAL: ₹${estimate.totalAmount.toFixed(2)}
─────────────────────────────────────────────────────────────────────────────────

Generated on: ${new Date().toLocaleString()}
Shared via: ${window.location.origin}
    `.trim();

    // Create and download file
    const blob = new Blob([estimateContent], { type: 'text/plain; charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${estimate.estimateName.replace(/[^a-zA-Z0-9]/g, '_')}_estimate.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    Swal.fire({
      icon: 'success',
      title: 'Estimate Downloaded!',
      text: 'Your estimate has been downloaded successfully.',
      position: 'top-end',
      toast: true,
      showConfirmButton: false,
      timer: 2000
    });
  };

  const handleShareEstimate = () => {
    setShowShareModal(true);
  };

  const handleWhatsAppShare = () => {
    if (!estimate || !clientDetails) return;

    const message = `Interior Estimate - ${estimate.estimateName}

Client: ${clientDetails.name}
Total Amount: ₹${estimate.totalAmount.toFixed(2)}

View full estimate: ${window.location.href}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShowShareModal(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
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

  const handleBackToHome = () => {
    window.location.href = '/';
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
              <p className="text-gray-600 mb-6">{'The estimate you are looking for does not exist.'}</p>
              <button
                onClick={handleBackToHome}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Back to Home
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
              onClick={handleBackToHome}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Interior Estimate</h1>
              <p className="text-gray-600 mt-1">
                {estimate.estimateName}
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
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
                  <span className="font-medium text-blue-700">Items:</span>
                  <p className="text-blue-900">{estimate.items.length}</p>
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
                  ₹{(estimate.discount && estimate.discount > 0 ? (estimate.discountType === 'percentage' ? (estimate.totalAmount / (1 - estimate.discount / 100)) : (estimate.totalAmount + estimate.discount)) : estimate.totalAmount).toFixed(1)}
                </span>
              </div>

              {/* Show discount */}
              {estimate.discount && estimate.discount > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-purple-700 font-medium">
                    Discount ({estimate.discountType === 'percentage' ? `${estimate.discount}%` : `₹${estimate.discount}`}):
                  </span>
                  <span className="text-purple-900 font-semibold">
                    -₹{estimate.discountType === 'percentage' ? ((estimate.totalAmount * estimate.discount) / 100).toFixed(1) : estimate.discount.toFixed(1)}
                  </span>
                </div>
              )}

              {/* Final Total */}
              <div className="border-t border-purple-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-purple-900 font-bold text-lg">Grand Total:</span>
                  <span className="text-purple-600 font-bold text-2xl">
                    ₹{estimate.totalAmount.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Estimate Items</h2>
          </div>

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
                      
                      {/* Items */}
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
                                      {item.type === 'area' ? item.length : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'area' ? 'x' : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'area' ? item.breadth : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'area' ? ((item.length || 0) * (item.breadth || 0) / 929.03).toFixed(2) : '-'}
                                    </td>
                                  </>
                                )}
                                {categoryItems.some(i => i.type === 'pieces') && (
                                  <td className="py-3 px-4 text-sm text-gray-600">
                                    {item.type === 'pieces' ? item.pieces : '-'}
                                  </td>
                                )}
                                {categoryItems.some(i => i.type === 'running') && (
                                  <>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'running' ? item.runningLength : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'running' ? '=' : '-'}
                                    </td>
                                    <td className="py-3 px-4 text-sm text-gray-600">
                                      {item.type === 'running' ? ((item.runningLength || 0) / 30.48).toFixed(2) : '-'}
                                    </td>
                                  </>
                                )}
                                <td className="py-3 px-4 text-sm text-gray-600">
                                  ₹{item.totalAmount.toFixed(2)}
                                </td>
                                <td className="py-3 px-4 text-sm font-semibold text-gray-900">
                                  ₹{item.totalAmount.toFixed(2)}
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
      </div>

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