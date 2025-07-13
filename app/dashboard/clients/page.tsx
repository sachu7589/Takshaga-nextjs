"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Swal from 'sweetalert2';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Mail,
  Phone,
  Filter,
  Star,
  X
} from "lucide-react";

interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  createdAt: string;
}

interface NewClientForm {
  name: string;
  location: string;
  phone: string;
  email: string;
}

export default function ClientsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [newClient, setNewClient] = useState<NewClientForm>({
    name: "",
    location: "",
    phone: "",
    email: ""
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filteredClients = useMemo(() => 
    clients.filter(client =>
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.location.toLowerCase().includes(searchTerm.toLowerCase())
    ), [clients, searchTerm]
  );



  const handleInputChange = (field: keyof NewClientForm, value: string) => {
    setNewClient(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/clients');
        if (!response.ok) {
          throw new Error('Failed to fetch clients');
        }
        const data = await response.json();
        setClients(data.clients);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create client');
      }

      const data = await response.json();
      
      // Add new client to the list
      setClients(prev => [data.client, ...prev]);
      
      // Reset form and close modal
      setNewClient({
        name: "",
        location: "",
        phone: "",
        email: ""
      });
      setIsModalOpen(false);

      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Client Created Successfully!',
        text: `${data.client.name} has been added to your clients list.`,
        position: 'top-end',
        toast: true,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: '#f0f9ff',
        color: '#1e40af',
        iconColor: '#10b981'
      });

      // Redirect to estimates page with client info
      router.push(`/dashboard/estimates?clientId=${data.client.id}&clientName=${encodeURIComponent(data.client.name)}`);
    } catch (error) {
      console.error('Error creating client:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to create client',
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

  const openModal = () => {
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNewClient({
      name: "",
      location: "",
      phone: "",
      email: ""
    });
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingClient(null);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingClient) return;

    try {
      const response = await fetch(`/api/clients/${editingClient._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editingClient.name,
          email: editingClient.email,
          phone: editingClient.phone,
          location: editingClient.location
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update client');
      }

      const data = await response.json();
      
      // Update client in the list
      setClients(prev => prev.map(client => 
        client._id === editingClient._id ? data.client : client
      ));
      
      closeEditModal();

      // Show success alert
      Swal.fire({
        icon: 'success',
        title: 'Client Updated Successfully!',
        text: `${data.client.name} has been updated.`,
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
      console.error('Error updating client:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error instanceof Error ? error.message : 'Failed to update client',
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

  const handleDelete = async (clientId: string, clientName: string) => {
    // Show confirmation dialog
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete ${clientName}? This action cannot be undone.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel',
      background: '#ffffff',
      color: '#374151',
      iconColor: '#f59e0b'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/clients/${clientId}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to delete client');
        }

        // Remove client from the list
        setClients(prev => prev.filter(client => client._id !== clientId));

        // Show success alert
        Swal.fire({
          icon: 'success',
          title: 'Client Deleted Successfully!',
          text: `${clientName} has been removed from your clients list.`,
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
        console.error('Error deleting client:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: error instanceof Error ? error.message : 'Failed to delete client',
          position: 'top-end',
          toast: true,
          showConfirmButton: false,
          timer: 4000,
          background: '#fef2f2',
          color: '#dc2626',
          iconColor: '#ef4444'
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your client relationships and partnerships</p>
        </div>
        <button 
          onClick={openModal}
          className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
        >
          <Plus className="h-5 w-5 mr-2" />
          Add New Client
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-spin">
            <Users className="h-8 w-8 text-white" />
          </div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      )}

      {/* Content - Only show when not loading */}
      {!loading && (
        <>
          {/* Search and Filters */}
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search clients by name, email, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-black rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm placeholder-gray-400 text-black"
              />
            </div>
          </div>
          <div className="flex gap-3">

            <button className="px-4 py-3 border border-white/20 rounded-xl hover:bg-white/50 transition-all duration-200 cursor-pointer">
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.filter(client => {
                  const clientDate = new Date(client.createdAt);
                  const currentDate = new Date();
                  return clientDate.getMonth() === currentDate.getMonth() && 
                         clientDate.getFullYear() === currentDate.getFullYear();
                }).length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <Plus className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {clients.length > 0 ? Math.floor(clients.length * 0.7) : 0}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <Star className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Clients Cards */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            All Clients ({filteredClients.length})
          </h3>
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <div key={client._id} className="bg-white/50 backdrop-blur-sm rounded-xl p-6 border border-white/20 hover:shadow-xl transition-all duration-200 hover:bg-white/70 shadow-lg">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">{client.name}</h4>
                    <p className="text-sm text-gray-500">{client.location}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => openEditModal(client)}
                    className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(client._id, client.name)}
                    className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Contact Details */}
              <div className="space-y-3 mb-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{client.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-sm text-gray-700">{client.phone}</span>
                </div>
              </div>

              {/* Date */}
              <div className="mb-4">
                <span className="text-xs text-gray-500">
                  {new Date(client.createdAt).toLocaleDateString()}
                </span>
              </div>

              {/* View Details Button */}
              <div className="flex justify-end">
                <button 
                  onClick={() => router.push(`/dashboard/estimates?clientId=${client._id}&clientName=${encodeURIComponent(client.name)}`)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer text-sm font-medium shadow-md"
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Users className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first client.</p>
          <button 
            onClick={openModal}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add First Client
          </button>
        </div>
      )}
        </>
      )}

      {/* Add New Client Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Client</h3>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={newClient.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter client name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  value={newClient.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter location"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={newClient.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={newClient.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer"
                >
                  Add Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Edit Client</h3>
              <button
                onClick={closeEditModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div>
                <label htmlFor="edit-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  id="edit-name"
                  value={editingClient.name}
                  onChange={(e) => setEditingClient({...editingClient, name: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter client name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-location" className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  id="edit-location"
                  value={editingClient.location}
                  onChange={(e) => setEditingClient({...editingClient, location: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter location"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-phone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="edit-phone"
                  value={editingClient.phone}
                  onChange={(e) => setEditingClient({...editingClient, phone: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter phone number"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="edit-email"
                  value={editingClient.email}
                  onChange={(e) => setEditingClient({...editingClient, email: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400 text-black"
                  placeholder="Enter email address"
                  required
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 cursor-pointer"
                >
                  Update Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 