import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const [protectedData, setProtectedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Example of accessing a protected API endpoint
    const fetchProtectedData = async () => {
      try {
        const response = await axios.get("http://localhost:8000/api/protected");
        setProtectedData(response.data.message);
      } catch (err) {
        setError("Failed to fetch protected data");
        console.error("Error fetching protected data:", err);
      }
    };

    fetchProtectedData();
  }, []);

  const handleLogout = async () => {
    await logout();
    // Navigation will be handled by protected route
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 mr-4">
                Welcome, {user?.fullName}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white py-1 px-3 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-gray-200 rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Protected Content</h2>

            {error && (
              <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
                {error}
              </div>
            )}

            {protectedData && (
              <div className="bg-green-50 text-green-700 p-3 rounded">
                {protectedData}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;