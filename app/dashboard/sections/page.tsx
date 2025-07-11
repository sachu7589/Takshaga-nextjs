"use client";

import { useState } from "react";
import { 
  FolderOpen, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Calendar,
  Users,
  FileText,
  Filter,
  MoreVertical,
  TrendingUp,
  Sparkles
} from "lucide-react";

interface Section {
  id: string;
  name: string;
  description: string;
  clientCount: number;
  projectCount: number;
  status: 'active' | 'archived';
  createdAt: string;
  lastUpdated: string;
  priority?: 'high' | 'medium' | 'low';
}

export default function SectionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sections] = useState<Section[]>([
    {
      id: "1",
      name: "Website Development",
      description: "All website development projects and related tasks",
      clientCount: 5,
      projectCount: 12,
      status: "active",
      createdAt: "2024-01-15",
      lastUpdated: "2024-01-25",
      priority: "high"
    },
    {
      id: "2",
      name: "Mobile Apps",
      description: "Mobile application development projects",
      clientCount: 3,
      projectCount: 8,
      status: "active",
      createdAt: "2024-01-20",
      lastUpdated: "2024-01-28",
      priority: "medium"
    },
    {
      id: "3",
      name: "Marketing",
      description: "Digital marketing campaigns and strategies",
      clientCount: 7,
      projectCount: 15,
      status: "active",
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-30",
      priority: "high"
    },
    {
      id: "4",
      name: "Legacy Projects",
      description: "Older projects and maintenance work",
      clientCount: 2,
      projectCount: 4,
      status: "archived",
      createdAt: "2023-12-01",
      lastUpdated: "2024-01-15",
      priority: "low"
    }
  ]);

  const filteredSections = sections.filter(section =>
    section.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Sections</h1>
          <p className="text-gray-600 mt-1">Organize your projects by sections and categories</p>
        </div>
        <button className="mt-4 sm:mt-0 inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
          <Plus className="h-5 w-5 mr-2" />
          Create New Section
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search sections by name or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <select className="px-4 py-3 border border-white/20 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 backdrop-blur-sm">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
            <button className="px-4 py-3 border border-white/20 rounded-xl hover:bg-white/50 transition-all duration-200">
              <Filter className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sections</p>
              <p className="text-2xl font-bold text-gray-900">{sections.length}</p>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
              <FolderOpen className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Sections</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.filter(s => s.status === 'active').length}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.reduce((sum, s) => sum + s.projectCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
              <FileText className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
        
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Clients</p>
              <p className="text-2xl font-bold text-gray-900">
                {sections.reduce((sum, s) => sum + s.clientCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSections.map((section) => (
          <div key={section.id} className="group relative bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{section.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        section.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {section.status}
                      </span>
                      {section.priority && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          getPriorityColor(section.priority)
                        }`}>
                          {section.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm leading-relaxed">
                {section.description}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                  <Users className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{section.clientCount}</p>
                    <p className="text-xs text-gray-500">clients</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 bg-white/50 rounded-lg">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{section.projectCount}</p>
                    <p className="text-xs text-gray-500">projects</p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-white/20">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Created {new Date(section.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span>Updated {new Date(section.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <FolderOpen className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sections found</h3>
          <p className="text-gray-500 mb-6">Get started by creating your first section.</p>
          <button className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl">
            <Plus className="h-5 w-5 mr-2" />
            Create First Section
          </button>
        </div>
      )}

      {/* Section Overview */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Section Overview</h3>
          <Sparkles className="h-5 w-5 text-yellow-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <div className="text-2xl font-bold text-blue-600">{sections.length}</div>
            <div className="text-sm text-gray-600">Total Sections</div>
          </div>
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <div className="text-2xl font-bold text-green-600">
              {sections.filter(s => s.status === 'active').length}
            </div>
            <div className="text-sm text-gray-600">Active Sections</div>
          </div>
          <div className="text-center p-4 bg-white/50 rounded-xl">
            <div className="text-2xl font-bold text-purple-600">
              {sections.reduce((sum, s) => sum + s.projectCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Projects</div>
          </div>
        </div>
      </div>
    </div>
  );
} 