"use client";

import { useState } from "react";
import { 
  ArrowLeft,
  FileText,
  Building,
  Star,
  Save
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Swal from 'sweetalert2';

interface GeneralEstimateForm {
  estimateType: string;
  projectScope: string;
  area: string;
  complexity: string;
  timeline: string;
  budget: string;
  description: string;
}

export default function GeneralEstimatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId');
  const clientName = searchParams.get('clientName');
  const estimateType = searchParams.get('type');

  const [estimateForm, setEstimateForm] = useState<GeneralEstimateForm>({
    estimateType: estimateType || "",
    projectScope: "",
    area: "",
    complexity: "",
    timeline: "",
    budget: "",
    description: ""
  });

  const getEstimateTypeInfo = () => {
    switch (estimateType) {
      case 'permit':
        return {
          title: 'Permit Estimate',
          icon: <FileText className="h-6 w-6" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          description: 'Building permits and regulatory compliance services'
        };
      case 'building':
        return {
          title: 'Building Estimation',
          icon: <Building className="h-6 w-6" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          description: 'Complete building construction and structural services'
        };
      case '3d':
        return {
          title: '3D Estimate',
          icon: <Star className="h-6 w-6" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          description: '3D modeling, rendering and visualization services'
        };
      default:
        return {
          title: 'General Estimate',
          icon: <FileText className="h-6 w-6" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          description: 'General estimate services'
        };
    }
  };

  const typeInfo = getEstimateTypeInfo();

  const handleInputChange = (field: keyof GeneralEstimateForm, value: string) => {
    setEstimateForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would typically send the data to your API
      console.log("General estimate data:", estimateForm);
      
      // Show success alert
      Swal.fire({
        icon: 'success',
        title: `${typeInfo.title} Created!`,
        text: `Estimate for ${clientName} has been prepared successfully.`,
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#f0f9ff',
        color: '#1e40af',
        iconColor: '#10b981'
      });

      // Reset form
      setEstimateForm({
        estimateType: estimateType || "",
        projectScope: "",
        area: "",
        complexity: "",
        timeline: "",
        budget: "",
        description: ""
      });

    } catch (error) {
      console.error('Error creating estimate:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to create estimate',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 4000,
        background: '#fef2f2',
        color: '#dc2626',
        iconColor: '#ef4444'
      });
    }
  };

  const handleBackToEstimates = () => {
    router.push(`/dashboard/estimates?clientId=${clientId}&clientName=${clientName}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBackToEstimates}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{typeInfo.title}</h1>
            <p className="text-gray-600 mt-1">
              {clientName ? `Preparing ${typeInfo.title.toLowerCase()} for ${clientName}` : `Prepare ${typeInfo.title.toLowerCase()}`}
            </p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      {clientName && (
        <div className={`${typeInfo.bgColor} border border-gray-200 rounded-xl p-6`}>
          <div className="flex items-center">
            <div className={typeInfo.color}>
              {typeInfo.icon}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-800">Client: {clientName}</h3>
              <p className="text-gray-700">{typeInfo.description}</p>
            </div>
          </div>
        </div>
      )}

      {/* Estimate Form */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">{typeInfo.title} Form</h2>
          <p className="text-gray-600">Fill in the details to prepare the estimate</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="projectScope" className="block text-sm font-medium text-gray-700 mb-2">
                Project Scope
              </label>
              <select
                id="projectScope"
                value={estimateForm.projectScope}
                onChange={(e) => handleInputChange('projectScope', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                required
              >
                <option value="">Select project scope</option>
                <option value="small">Small Project</option>
                <option value="medium">Medium Project</option>
                <option value="large">Large Project</option>
                <option value="enterprise">Enterprise Project</option>
              </select>
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Project Area
              </label>
              <input
                type="text"
                id="area"
                value={estimateForm.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                placeholder="Enter project area/size"
                required
              />
            </div>

            <div>
              <label htmlFor="complexity" className="block text-sm font-medium text-gray-700 mb-2">
                Project Complexity
              </label>
              <select
                id="complexity"
                value={estimateForm.complexity}
                onChange={(e) => handleInputChange('complexity', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                required
              >
                <option value="">Select complexity level</option>
                <option value="simple">Simple</option>
                <option value="moderate">Moderate</option>
                <option value="complex">Complex</option>
                <option value="very-complex">Very Complex</option>
              </select>
            </div>

            <div>
              <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-2">
                Project Timeline
              </label>
              <select
                id="timeline"
                value={estimateForm.timeline}
                onChange={(e) => handleInputChange('timeline', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                required
              >
                <option value="">Select timeline</option>
                <option value="1-2weeks">1-2 Weeks</option>
                <option value="1month">1 Month</option>
                <option value="2-3months">2-3 Months</option>
                <option value="3-6months">3-6 Months</option>
                <option value="6+months">6+ Months</option>
              </select>
            </div>

            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range
              </label>
              <select
                id="budget"
                value={estimateForm.budget}
                onChange={(e) => handleInputChange('budget', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                required
              >
                <option value="">Select budget range</option>
                <option value="under-10k">Under $10,000</option>
                <option value="10k-25k">$10,000 - $25,000</option>
                <option value="25k-50k">$25,000 - $50,000</option>
                <option value="50k-100k">$50,000 - $100,000</option>
                <option value="100k+">$100,000+</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Project Description
            </label>
            <textarea
              id="description"
              value={estimateForm.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
              placeholder="Describe your project requirements..."
              required
            />
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={handleBackToEstimates}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Back to Estimates
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer"
            >
              <Save className="h-5 w-5 mr-2 inline" />
              Create Estimate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 