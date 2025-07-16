"use client";

import { useState, useEffect, useMemo } from "react";
import Swal from 'sweetalert2';
import { 
  MessageSquare, 
  Search, 
  Phone,
  User,
  Calendar,
  Home,
  Building,
  Factory,
  Star,
  Clock,
  Trash2
} from "lucide-react";

interface QuoteEnquiry {
  _id: string;
  name: string;
  phone: string;
  request_call: boolean;
  service_interest: string;
  sq_feet: number;
  package: string;
  additional_info?: string;
  createdAt: string;
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<QuoteEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterService, setFilterService] = useState("all");
  const [filterPackage, setFilterPackage] = useState("all");

  // Get unique services and packages from enquiries
  const uniqueServices = useMemo(() => {
    const services = [...new Set(enquiries.map(enquiry => enquiry.service_interest))];
    return services.filter(service => service && service.trim() !== '');
  }, [enquiries]);

  const uniquePackages = useMemo(() => {
    const packages = [...new Set(enquiries.map(enquiry => enquiry.package))];
    return packages.filter(pkg => pkg && pkg.trim() !== '');
  }, [enquiries]);

  // Fetch enquiries from API
  useEffect(() => {
    const fetchEnquiries = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/quote');
        if (!response.ok) {
          throw new Error('Failed to fetch enquiries');
        }
        const data = await response.json();
        setEnquiries(data.quotes || []);
      } catch (err) {
        console.error('Error fetching enquiries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchEnquiries();
  }, []);

  // Filter enquiries based on search and filters
  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(enquiry => {
      const matchesSearch = 
        enquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.phone.includes(searchTerm) ||
        enquiry.service_interest.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enquiry.package.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesService = filterService === "all" || enquiry.service_interest === filterService;
      const matchesPackage = filterPackage === "all" || enquiry.package === filterPackage;

      return matchesSearch && matchesService && matchesPackage;
    });
  }, [enquiries, searchTerm, filterService, filterPackage]);

  const getServiceIcon = (service: string) => {
    switch (service.toLowerCase()) {
      case 'residential':
        return <Home className="h-4 w-4" />;
      case 'commercial':
        return <Building className="h-4 w-4" />;
      case 'industrial':
        return <Factory className="h-4 w-4" />;
      default:
        return <Home className="h-4 w-4" />;
    }
  };

  const getPackageColor = (packageType: string) => {
    switch (packageType.toLowerCase()) {
      case 'basic':
        return 'bg-gray-100 text-gray-800';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'luxury':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (enquiryId: string, enquiryName: string) => {
    // Show confirmation dialog with SweetAlert
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete the enquiry from "${enquiryName}"? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/quote/${enquiryId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete enquiry');
      }

      // Remove the deleted enquiry from the state
      setEnquiries(prev => prev.filter(enquiry => enquiry._id !== enquiryId));
      
      // Show success message with SweetAlert toast
      Swal.fire({
        icon: 'success',
        title: 'Enquiry Deleted!',
        text: `Enquiry from "${enquiryName}" has been deleted successfully.`,
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#f0f9ff',
        color: '#1e40af',
        iconColor: '#10b981'
      });
    } catch (error) {
      console.error('Error deleting enquiry:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to delete enquiry. Please try again.',
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quote Enquiries</h1>
          <p className="text-gray-600 mt-1">Manage and view all quote requests from your website</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 bg-blue-50 px-3 py-2 rounded-lg">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">
              {enquiries.length} Total Enquiries
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search enquiries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500"
            />
          </div>

          {/* Service Filter */}
          <div>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all" className="text-gray-500">All Services</option>
              {uniqueServices.map((service) => (
                <option key={service} value={service} className="text-black capitalize">
                  {service}
                </option>
              ))}
            </select>
          </div>

          {/* Package Filter */}
          <div>
            <select
              value={filterPackage}
              onChange={(e) => setFilterPackage(e.target.value)}
              className="w-full px-3 py-2 border border-black rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
            >
              <option value="all" className="text-gray-500">All Packages</option>
              {uniquePackages.map((pkg) => (
                <option key={pkg} value={pkg} className="text-black capitalize">
                  {pkg}
                </option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => {
              setSearchTerm("");
              setFilterService("all");
              setFilterPackage("all");
            }}
            className="px-4 py-2 text-sm font-medium bg-gray-700 text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Enquiries Grid */}
      {filteredEnquiries.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No enquiries found</h3>
          <p className="text-gray-600">No enquiries match your current filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEnquiries.map((enquiry) => (
            <div
              key={enquiry._id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{enquiry.name}</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <Phone className="h-3 w-3" />
                      <span>{enquiry.phone}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {enquiry.request_call && (
                    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                      <Clock className="h-3 w-3" />
                      <span>Call Request</span>
                    </div>
                  )}
                  <button
                    onClick={() => handleDelete(enquiry._id, enquiry.name)}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete enquiry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Service & Package */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center space-x-2">
                  {getServiceIcon(enquiry.service_interest)}
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {enquiry.service_interest}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Package:</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getPackageColor(enquiry.package)}`}>
                    {enquiry.package}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Area:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {enquiry.sq_feet.toLocaleString()} sq ft
                  </span>
                </div>
              </div>

              {/* Additional Info */}
              {enquiry.additional_info && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {enquiry.additional_info}
                  </p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <Calendar className="h-3 w-3" />
                  <span>{formatDate(enquiry.createdAt)}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  <span className="text-xs text-gray-500">New</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 