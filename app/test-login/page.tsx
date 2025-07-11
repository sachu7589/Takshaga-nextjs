"use client";

import { useState } from "react";

export default function TestLogin() {
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult("Testing login...");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          email: "sachu7589@gmail.com",
          password: "admin123" // Try with this password
        }),
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const testVerify = async () => {
    setLoading(true);
    setResult("Testing token verification...");

    try {
      const response = await fetch("/api/auth/verify", {
        credentials: 'include',
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Login Test Page</h1>
      
      <div className="space-y-4">
        <button
          onClick={testLogin}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          Test Login
        </button>
        
        <button
          onClick={testVerify}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50 ml-4"
        >
          Test Token Verify
        </button>
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Result:</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {result}
        </pre>
      </div>
    </div>
  );
} 