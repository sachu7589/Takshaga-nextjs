"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Check for existing valid token on component mount
  useEffect(() => {
    const checkExistingToken = async () => {
      try {
        const response = await fetch("/api/auth/verify", {
          credentials: 'include', // Include cookies
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user && data.user.role === 'admin') {
            window.location.href = "/dashboard";
          }
        }
      } catch (error) {
        console.error("Token verification failed:", error);
      }
    };

    checkExistingToken();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log("Attempting login with:", formData.email);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      console.log("Login response:", data);

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        setError("Access denied. Admin role required.");
        return;
      }

      console.log("Login successful, redirecting to dashboard...");
      // Use window.location for more reliable redirect
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      console.error("Login error:", err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e0e7ff] via-[#f0f4ff] to-[#f8fafc] dark:from-[#232946] dark:via-[#1a1a2e] dark:to-[#232946] transition-colors duration-500">
      <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl shadow-2xl bg-white/70 dark:bg-[#232946]/80 backdrop-blur-lg border border-white/30 dark:border-[#232946]/40 relative">
        {/* Logo and App Name */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/logo.png"
            alt="Takshaga Logo"
            width={72}
            height={72}
            className="rounded-xl shadow-md mb-2"
            priority
          />
          <span className="text-3xl font-extrabold tracking-tight text-[#232946] dark:text-white mb-1">Takshaga</span>
          <span className="text-base text-[#6b7280] dark:text-[#b8c1ec] font-medium">Admin Login</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          {/* Email Field with Floating Label */}
          <div className="relative">
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              className="peer block w-full px-4 pt-6 pb-2 bg-white/80 dark:bg-[#232946]/80 border border-gray-300 dark:border-[#393e46] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-transparent text-gray-900 dark:text-[#b8c1ec]"
              placeholder="Email address"
              autoComplete="email"
            />
            <label htmlFor="email" className="absolute left-4 top-2 text-gray-500 dark:text-[#b8c1ec] text-sm transition-all duration-200 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-[#b8c1ec]/70 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600 dark:peer-focus:text-blue-400">
              Email address
            </label>
            <Mail className="absolute right-4 top-4 h-5 w-5 text-gray-400 dark:text-[#b8c1ec]/70 pointer-events-none" />
          </div>

          {/* Password Field with Floating Label */}
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleInputChange}
              className="peer block w-full px-4 pt-6 pb-2 bg-white/80 dark:bg-[#232946]/80 border border-gray-300 dark:border-[#393e46] rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-transparent text-gray-900 dark:text-[#b8c1ec]"
              placeholder="Password"
              autoComplete="current-password"
            />
            <label htmlFor="password" className="absolute left-4 top-2 text-gray-500 dark:text-[#b8c1ec] text-sm transition-all duration-200 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-400 dark:peer-placeholder-shown:text-[#b8c1ec]/70 peer-focus:top-2 peer-focus:text-sm peer-focus:text-blue-600 dark:peer-focus:text-blue-400">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-4"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 dark:text-[#b8c1ec]/70" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 dark:text-[#b8c1ec]/70" />
              )}
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-base shadow-lg transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
      </div>
    </div>
  );
}