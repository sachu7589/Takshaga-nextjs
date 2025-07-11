"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Users, 
  FolderOpen, 
  LogOut, 
  Menu,
  X,
  User,
  Settings,
  Bell
} from "lucide-react";
import Image from "next/image";

interface UserData {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          credentials: 'include',
        });

        if (!response.ok) {
          window.location.href = "/";
          return;
        }

        const data = await response.json();
        
        if (data.user.role !== 'admin') {
          window.location.href = "/";
          return;
        }

        setUser(data.user);
      } catch (error) {
        console.error("Authentication check failed:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: 'include',
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      window.location.href = "/";
    }
  };

  const menuItems = [
    {
      name: "Home",
      icon: Home,
      href: "/dashboard",
      active: pathname === "/dashboard"
    },
    {
      name: "Clients",
      icon: Users,
      href: "/dashboard/clients",
      active: pathname === "/dashboard/clients"
    },
    {
      name: "Sections",
      icon: FolderOpen,
      href: "/dashboard/sections",
      active: pathname === "/dashboard/sections"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed lg:static h-screen w-72 z-50 bg-white border-r border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Header */}
        <Image
          src="/logoclr.png"
          alt="Takshaga Logo"
          width={96}
          height={106}
          className="mx-auto my-8 rounded-2xl shadow-lg"
        />
        <div className="border-b border-gray-200 w-full my-4"></div>
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.name}
                href={item.href}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  item.active
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-blue-600'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.name}</span>
              </a>
            );
          })}
        </nav>
        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  {menuItems.find(item => item.active)?.name || 'Dashboard'}
                </h1>
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all relative">
                <Bell className="h-5 w-5" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              </button>
              <button className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all">
                <Settings className="h-5 w-5" />
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:flex flex-col">
                  <span className="text-sm font-medium text-gray-700">{user.name || user.email}</span>
                  <span className="text-xs text-gray-500 capitalize">{user.role}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Page content */}
        <main className="flex-1 p-6 bg-white overflow-y-auto">{children}</main>
      </div>
    </div>
  );
} 