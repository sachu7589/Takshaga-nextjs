"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  BarChart3, 
  Calendar,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  const [dashboardData, setDashboardData] = useState<{ stats?: { totalUsers?: number; activeUsers?: number; totalProjects?: number } } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch("/api/dashboard", {
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }

        const data = await response.json();
        setDashboardData(data.dashboard);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-3xl"></div>
        <div className="relative p-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-600">System Online</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Here&apos;s what&apos;s happening with your Takshaga management system today.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData?.stats?.totalUsers || 0}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+12%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData?.stats?.activeUsers || 0}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+8%</span>
                <span className="text-sm text-gray-500 ml-1">from last week</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900">
                {dashboardData?.stats?.totalProjects || 0}
              </p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+15%</span>
                <span className="text-sm text-gray-500 ml-1">from last month</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="group relative bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Growth Rate</p>
              <p className="text-3xl font-bold text-gray-900">+24%</p>
              <div className="flex items-center mt-2">
                <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-sm text-green-600 font-medium">+6%</span>
                <span className="text-sm text-gray-500 ml-1">from last quarter</span>
              </div>
            </div>
            <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-lg">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/50 transition-colors">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New user registered - John Doe</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/50 transition-colors">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Project &quot;Website Redesign&quot; completed</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="flex items-center space-x-4 p-3 rounded-xl hover:bg-white/50 transition-colors">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New section &quot;Marketing&quot; created</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-lg border border-white/20">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
              <Sparkles className="h-5 w-5 text-yellow-500" />
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4">
              <a
                href="/dashboard/clients"
                className="group flex items-center p-4 border border-white/20 rounded-xl hover:bg-white/50 transition-all duration-200 hover:shadow-md"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Manage Clients</h4>
                  <p className="text-sm text-gray-500">View and manage your client relationships</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </a>
              
              <a
                href="/dashboard/sections"
                className="group flex items-center p-4 border border-white/20 rounded-xl hover:bg-white/50 transition-all duration-200 hover:shadow-md"
              >
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">View Sections</h4>
                  <p className="text-sm text-gray-500">Organize and manage project sections</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </a>
              
              <button className="group flex items-center p-4 border border-white/20 rounded-xl hover:bg-white/50 transition-all duration-200 hover:shadow-md">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mr-4 group-hover:scale-110 transition-transform">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h4 className="font-medium text-gray-900">Generate Report</h4>
                  <p className="text-sm text-gray-500">Create comprehensive system reports</p>
                </div>
                <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 