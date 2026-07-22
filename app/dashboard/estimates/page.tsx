"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Home, 
  ArrowLeft,
  CheckCircle,
  Building2
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { formatDateDDMMYYYY } from '@/app/utils/dateFormat';

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
  status?: 'pending' | 'approved' | 'completed';
  createdAt: string;
  updatedAt: string;
  user?: User;
}

interface GeneralEstimate {
  _id: string;
  userId: string;
  clientId: string;
  estimateName: string;
  estimateType: string;
  sqFeet?: number;
  projectCostRows?: Array<{ id: string; name: string; amount: number }>;
  paymentStages?: Array<{ stage: string; amount: number }>;
  workDetails?: Array<{ id: string; number: number; title: string; points: Array<{ id: string; text: string }> }>;
  additionalWorks?: Array<{ id: string; text: string }>;
  materialsUsed?: Array<{ id: string; material: string; details: string }>;
  items: Array<{
    id: string;
    particulars: string;
    amountPerSqFt: number;
    sqFeet: number;
    totalAmount: number;
  }>;
  totalAmount: number;
  subtotal: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  status?: 'pending' | 'approved' | 'completed';
  createdAt: string;
  updatedAt: string;
}

/** Resume full-project at the furthest incomplete step; preview if finished. */
function getFullProjectResumePath(
  estimate: GeneralEstimate,
  clientName: string | null
): string {
  const id = estimate._id;
  const name = encodeURIComponent(clientName || "");
  const clientId = estimate.clientId;

  const hasAdditional =
    estimate.status === 'completed' ||
    (estimate.additionalWorks && estimate.additionalWorks.length > 0) ||
    (estimate.materialsUsed && estimate.materialsUsed.length > 0);
  if (hasAdditional) {
    return `/dashboard/estimates/full-project/${id}/preview`;
  }

  if (estimate.workDetails && estimate.workDetails.length > 0) {
    return `/dashboard/estimates/full-project/${id}/additional`;
  }

  const hasPayment =
    estimate.paymentStages && estimate.paymentStages.some((s) => s.amount > 0);
  if (hasPayment) {
    return `/dashboard/estimates/full-project/${id}/work-details`;
  }

  const hasSetup =
    (estimate.projectCostRows && estimate.projectCostRows.length > 0) ||
    (estimate.sqFeet != null && estimate.sqFeet > 0) ||
    (estimate.totalAmount != null && estimate.totalAmount > 0);
  if (hasSetup) {
    return `/dashboard/estimates/full-project?clientId=${clientId}&clientName=${name}&estimateId=${id}`;
  }

  return `/dashboard/estimates/full-project/setup?clientId=${clientId}&clientName=${name}&estimateId=${id}`;
}

export default function EstimatesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');

  const [selectedEstimateType, setSelectedEstimateType] = useState<string | null>(null);
  const [clientEstimates, setClientEstimates] = useState<Estimate[]>([]);
  const [generalEstimates, setGeneralEstimates] = useState<GeneralEstimate[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch client estimates from API
  useEffect(() => {
    const fetchClientEstimates = async () => {
      if (!clientId) return;
      
      setLoading(true);
      try {
        // Fetch interior estimates
        const interiorResponse = await fetch(`/api/interior-estimates/client/${clientId}`);
        if (interiorResponse.ok) {
          const data = await interiorResponse.json();
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
        }
        
        // Fetch general estimates
        const generalResponse = await fetch(`/api/general-estimates?clientId=${clientId}`);
        if (generalResponse.ok) {
          const data = await generalResponse.json();
          setGeneralEstimates(data.estimates || []);
        }
      } catch (error) {
        console.error('Error fetching estimates:', error);
        setClientEstimates([]);
        setGeneralEstimates([]);
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
      id: "other",
      name: "General Estimate",
      description: "General estimates with custom items and specifications",
      icon: <FileText className="h-8 w-8" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "full-project",
      name: "Full Project Estimate",
      description: "Complete project estimation based on total square feet",
      icon: <Building2 className="h-8 w-8" />,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50"
    }
  ];

  const handleEstimateTypeSelect = (typeId: string) => {
    setSelectedEstimateType(typeId);
    
    if (typeId === 'interior') {
      router.push(`/dashboard/estimates/interior?clientId=${clientId}&clientName=${clientName}`);
    } else if (typeId === 'full-project') {
      const existing = generalEstimates
        .filter((e) => e.estimateType === 'full-project')
        .sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        })[0];

      if (existing) {
        router.push(getFullProjectResumePath(existing, clientName));
      } else {
        router.push(
          `/dashboard/estimates/full-project/setup?clientId=${clientId}&clientName=${clientName}`
        );
      }
    } else {
      router.push(`/dashboard/estimates/general?clientId=${clientId}&clientName=${clientName}&type=other`);
    }
  };

  const getGeneralEstimateLabel = (estimateType: string) => {
    switch (estimateType) {
      case 'full-project':
        return 'Full Project Estimate';
      case 'permit':
        return 'Permit Estimate';
      case 'building':
        return 'Building Estimation';
      case '3d':
        return '3D Estimate';
      default:
        return 'General Estimate';
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        ) : (clientEstimates.length > 0 || generalEstimates.length > 0) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Interior Estimates */}
            {clientEstimates.map((estimate) => (
              <div
                key={estimate._id}
                onClick={() => {
                  if (estimate.status === 'completed') {
                    router.push(`/dashboard/interior-work/completed/${estimate._id}/details`);
                  } else {
                    router.push(`/dashboard/estimates/interior/${estimate._id}`);
                  }
                }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Home className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-xs text-gray-500">
                    {estimate.createdAt ? formatDateDDMMYYYY(estimate.createdAt) : 'N/A'}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {estimate.estimateName}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      estimate.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : estimate.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {estimate.status === 'approved' ? 'Approved' : estimate.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
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
                    Updated {estimate.updatedAt ? formatDateDDMMYYYY(estimate.updatedAt) : 'N/A'}
                  </div>
                </div>
              </div>
            ))}

            {/* General Estimates */}
            {generalEstimates.map((estimate) => (
              <div
                key={estimate._id}
                onClick={() => {
                  if (estimate.estimateType === 'full-project') {
                    router.push(getFullProjectResumePath(estimate, clientName));
                  } else {
                    router.push(`/dashboard/estimates/general/${estimate._id}`);
                  }
                }}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-xs text-gray-500">
                    {estimate.createdAt ? formatDateDDMMYYYY(estimate.createdAt) : 'N/A'}
                  </div>
                </div>
                
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900 text-lg">
                      {estimate.estimateName}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      estimate.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : estimate.status === 'completed'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {estimate.status === 'approved' ? 'Approved' : estimate.status === 'completed' ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    {estimate.items.length} items • {getGeneralEstimateLabel(estimate.estimateType)}
                  </p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    ₹{Math.round(estimate.totalAmount).toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-500">
                    Updated {estimate.updatedAt ? formatDateDDMMYYYY(estimate.updatedAt) : 'N/A'}
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