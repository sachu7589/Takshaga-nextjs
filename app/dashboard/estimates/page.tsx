"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Home, 
  Building, 
  ArrowLeft,
  CheckCircle,
  Star
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface EstimateType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface Estimate {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  items: Array<{
    id: string;
    sectionName: string;
    categoryName: string;
    subCategoryName: string;
    materialName: string;
    description: string;
    totalAmount: number;
  }>;
  totalAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export default function EstimatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');

  const [selectedEstimateType, setSelectedEstimateType] = useState<string | null>(null);
  const [clientEstimates, setClientEstimates] = useState<Estimate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch client estimates from API
  useEffect(() => {
    const fetchClientEstimates = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        const response = await fetch(`/api/interior-estimates/client/${clientId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch estimates');
        }
        
        const data = await response.json();
        const estimates = data.estimates || [];
        
        // Fetch user details for each estimate
        const estimatesWithUsers = await Promise.all(
          estimates.map(async (estimate: Estimate) => {
            try {
              const userResponse = await fetch(`/api/users/${estimate.userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return { ...estimate, user: userData.user };
              }
            } catch (error) {
              console.error('Error fetching user details:', error);
            }
            return estimate;
          })
        );
        
        setClientEstimates(estimatesWithUsers);
      } catch (error) {
        console.error('Error fetching client estimates:', error);
        setClientEstimates([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClientEstimates();
  }, [clientId]);

  const estimateTypes: EstimateType[] = [
    {
      id: "interior",
      name: "Interior",
      description: "Complete interior design and decoration services",
      icon: <Home className="h-8 w-8" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      id: "permit",
      name: "Permit",
      description: "Building permits and regulatory compliance services",
      icon: <FileText className="h-8 w-8" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "building",
      name: "Building Estimation",
      description: "Complete building construction and structural services",
      icon: <Building className="h-8 w-8" />,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "3d",
      name: "3D",
      description: "3D modeling, rendering and visualization services",
      icon: <Star className="h-8 w-8" />,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  const handleEstimateTypeSelect = (typeId: string) => {
    setSelectedEstimateType(typeId);
    
    // Redirect based on estimate type
    if (typeId === 'interior') {
      // Redirect to interior estimate page
      router.push(`/dashboard/estimates/interior?clientId=${clientId}&clientName=${clientName}`);
    } else {
      // Redirect to general estimate page for permit, building, and 3d
      router.push(`/dashboard/estimates/general?clientId=${clientId}&clientName=${clientName}&type=${typeId}`);
    }
  };

  const handleBackToClients = () => {
    router.push('/dashboard/clients');
  };



  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToClients}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Prepare Estimate</h1>
            <p className="text-gray-600 mt-1">
              {clientName ? `Creating estimate for ${clientName}` : "Select estimate type"}
            </p>
          </div>
        </div>
      </div>

      {/* Success Message */}
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Client Created Successfully!</h3>
            <p className="text-green-700 mt-1">
              {clientName ? `Now let's prepare an estimate for ${clientName}` : "Now let's prepare an estimate"}
            </p>
          </div>
        </div>
      </div>

      {/* Estimate Types */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Select Estimate Type</h2>
          <p className="text-gray-600">Choose the type of estimate you want to prepare</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {estimateTypes.map((type) => (
            <div
              key={type.id}
              onClick={() => handleEstimateTypeSelect(type.id)}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedEstimateType === type.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white/50 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-xl ${type.bgColor}`}>
                  <div className={type.color}>
                    {type.icon}
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {type.name}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Client Estimates */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Client Estimates</h3>
          <p className="text-gray-600 text-sm">
            {clientName ? `Estimates for ${clientName}` : "Loading estimates..."}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading estimates...</span>
          </div>
        ) : clientEstimates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clientEstimates.map((estimate) => (
            <div
              key={estimate._id}
              onClick={() => router.push(`/dashboard/estimates/interior/${estimate._id}`)}
              className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Home className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-xs text-gray-500">
                  {estimate.createdAt ? new Date(estimate.createdAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 text-lg mb-2">
                  {estimate.estimateName}
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  {estimate.items.length} items • Interior Estimate
                </p>
                {estimate.user && (
                  <p className="text-xs text-gray-500">
                    Created by: {estimate.user.name || estimate.user.email}
                  </p>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-gray-900">
                  ₹{Math.round(estimate.totalAmount).toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  Updated {estimate.updatedAt ? new Date(estimate.updatedAt).toLocaleDateString() : 'N/A'}
                </div>
              </div>
            </div>
          ))}
        </div>
        ) : (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No estimates found</h4>
            <p className="text-gray-600">This client doesn&apos;t have any estimates yet.</p>
          </div>
        )}
      </div>
    </div>
  );
} 