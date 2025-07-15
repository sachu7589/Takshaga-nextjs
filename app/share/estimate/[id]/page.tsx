"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { 
  Download,
  Share2,
  Copy,
  Phone,
  Mail,
  Globe,
  MapPin,
  Building,
  Calendar,
  Package,
  User,
  IndianRupee,
  TrendingUp,
  Award,
  Star
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading estimate details...</span>
        </div>
      </div>
    );
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Estimate Not Found</h1>
              <p className="text-gray-600 mb-6">The estimate you are looking for does not exist.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Company Header */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-white">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
                  <img 
                    src="/logoclr.png" 
                    alt="Takshaga Spatial Solutions Logo" 
                    className="w-12 h-12 object-contain"
                  />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold">Takshaga Spatial Solutions</h1>
                  <p className="text-blue-100 text-lg">Interior Design & Construction</p>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={handleDownloadEstimate}
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 cursor-pointer text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Download</span>
                </button>
                <button
                  onClick={handleShareEstimate}
                  className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl hover:bg-white/30 transition-all duration-300 cursor-pointer text-sm font-medium"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
          
          {/* Company Details */}
          <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="text-sm font-medium text-gray-900">2nd Floor, Opp. Panchayat Building<br/>Upputhara P.O, Idukki District<br/>Kerala – 685505, India</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Website</p>
                  <a href="https://www.takshaga.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-blue-600 hover:text-blue-700">www.takshaga.com</a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href="mailto:info@takshaga.com" className="text-sm font-medium text-blue-600 hover:text-blue-700">info@takshaga.com</a>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Phone className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contact</p>
                  <p className="text-sm font-medium text-gray-900">Jinto Jose: +91 98466 60624<br/>Saneesh: +91 9544344332</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estimate Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Estimate ID</p>
                <p className="text-lg font-bold text-gray-900">{estimate._id.slice(-8)}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Created Date</p>
                <p className="text-lg font-bold text-gray-900">{new Date(estimate.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Items</p>
                <p className="text-lg font-bold text-gray-900">{estimate.items.length}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-100">Grand Total</p>
                <p className="text-2xl font-bold">₹{estimate.totalAmount.toFixed(0)}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <IndianRupee className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Client Information */}
        {clientDetails && (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Client Information</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Name</p>
                <p className="text-lg font-semibold text-gray-900">{clientDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Email</p>
                <p className="text-lg font-semibold text-gray-900">{clientDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Phone</p>
                <p className="text-lg font-semibold text-gray-900">{clientDetails.phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Location</p>
                <p className="text-lg font-semibold text-gray-900">{clientDetails.location}</p>
              </div>
            </div>
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Estimate Items</h2>
            </div>
          </div>

          <div className="p-6">
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
                  <div key={categoryName} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4">
                      <h4 className="text-lg font-semibold flex items-center">
                        <Star className="w-5 h-5 mr-2" />
                        {categoryName}
                      </h4>
                    </div>
                    
                    {Object.entries(subCategories).map(([subCategoryName, categoryItems]) => (
                      <div key={subCategoryName} className="border-b border-gray-200 last:border-b-0">
                        {/* Sub Category Header */}
                        <div className="bg-gray-50 px-6 py-3">
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

        {/* Footer */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Building className="w-6 h-6 text-blue-600" />
            <h3 className="text-xl font-bold text-gray-900">Takshaga Spatial Solutions</h3>
          </div>
          <p className="text-gray-600 mb-4">Transforming spaces with innovative interior solutions</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-500">
            <span>• Professional Interior Design</span>
            <span>• Quality Construction</span>
            <span>• Customer Satisfaction</span>
            <span>• Modern Solutions</span>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Share Estimate</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleWhatsAppShare}
                className="w-full flex items-center justify-center space-x-3 bg-green-500 text-white py-3 px-4 rounded-xl hover:bg-green-600 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.488"/>
                </svg>
                <span>Share on WhatsApp</span>
              </button>
              
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center justify-center space-x-3 bg-blue-500 text-white py-3 px-4 rounded-xl hover:bg-blue-600 transition-colors font-medium"
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