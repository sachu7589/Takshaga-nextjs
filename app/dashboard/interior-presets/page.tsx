'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Calendar, Eye, Search } from 'lucide-react';
import Swal from 'sweetalert2';

interface InteriorPreset {
  id: string;
  name: string;
  items: Array<{id: string; sectionId: string; sectionName: string; categoryName: string; subCategoryName: string; materialName: string; type: string; description: string; totalAmount: number}>;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function InteriorPresetsPage() {
  const router = useRouter();
  const [presets, setPresets] = useState<InteriorPreset[]>([]);
  const [filteredPresets, setFilteredPresets] = useState<InteriorPreset[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresets();
  }, []);

  useEffect(() => {
    // Filter presets based on search term
    if (searchTerm.trim() === '') {
      setFilteredPresets(presets);
    } else {
      const filtered = presets.filter(preset =>
        preset.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPresets(filtered);
    }
  }, [searchTerm, presets]);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/interior-presets');
      const data = await response.json();
      
      if (data.success) {
        setPresets(data.presets);
        setFilteredPresets(data.presets);
      } else {
        console.error('Failed to fetch presets:', data.message);
      }
    } catch (error) {
      console.error('Error fetching presets:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to fetch interior presets',
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (presetId: string) => {
    router.push(`/dashboard/interior-presets/${presetId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interior Presets</h1>
          <p className="text-gray-600 mt-1">Manage your interior estimate presets</p>
        </div>
        <button
          onClick={() => router.push('/dashboard/interior-presets/create')}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors cursor-pointer"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Preset</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="Search presets by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
        />
      </div>

      {/* Presets Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading presets...</span>
        </div>
      ) : filteredPresets.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-gray-50 rounded-2xl p-8">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              {searchTerm ? (
                <Search className="h-8 w-8 text-gray-400" />
              ) : (
                <Plus className="h-8 w-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {searchTerm ? 'No Presets Found' : 'No Presets Yet'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? `No presets found matching "${searchTerm}". Try a different search term.`
                : 'Create your first interior preset to get started'
              }
            </p>
            {!searchTerm && (
              <button
                onClick={() => router.push('/dashboard/interior-presets/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Your First Preset
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPresets.map((preset) => (
            <div key={preset.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {preset.name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mb-3">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{formatDate(preset.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">{preset.items.length}</span> items
                    </div>
                    <div className="text-lg font-semibold text-green-600">
                      ₹{preset.totalAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => handleViewDetails(preset.id)}
                  className="w-full flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
                >
                  <Eye className="h-4 w-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 