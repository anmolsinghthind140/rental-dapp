"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  HomeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";

const API_URL = "http://localhost:5000";

export default function PropertiesPage() {
  const { wallet, user, loading } = useWallet();
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [search, setSearch] = useState("");
  const [roomType, setRoomType] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !wallet) router.push("/");
    if (user) fetchProperties();
  }, [wallet, user, loading]);

  const fetchProperties = async () => {
    try {
      let url = `${API_URL}/api/properties`;
      if (user.role === "landlord") {
        url = `${API_URL}/api/properties/landlord/${wallet.address}`;
      }
      const res = await axios.get(url);
      setProperties(res.data.properties);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleSearch = async () => {
    try {
      setLoadingData(true);

      // If no search terms — fetch all
      if (!search && !roomType) {
        await fetchProperties();
        return;
      }

      const params = new URLSearchParams();
      if (search) params.append("city", search);
      if (roomType) params.append("roomType", roomType);

      const res = await axios.get(`${API_URL}/api/properties?${params}`);
      setProperties(res.data.properties || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">
            {user?.role === "landlord" ? "My Properties" : "Search Properties"}
          </h1>
          {user?.role === "landlord" && (
            <Link
              href="/properties/new"
              className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 transition-all"
            >
              <PlusIcon className="w-5 h-5" />
              Add Property
            </Link>
          )}
        </div>

        {/* Search Bar — Tenant Only */}
        {user?.role === "tenant" && (
          <div className="bg-gray-800 p-6 rounded-xl mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-3.5 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Search by city or area..."
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Room Types</option>
                <option value="single">Single</option>
                <option value="double">Double Sharing</option>
                <option value="triple">Triple Sharing</option>
                <option value="quad">Quad Sharing</option>
              </select>
              <button
                onClick={handleSearch}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-bold transition-all"
              >
                Search
              </button>
            </div>
          </div>
        )}

        {/* Properties Grid */}
        {loadingData ? (
          <p className="text-gray-400 text-center py-20">Loading...</p>
        ) : properties.length === 0 ? (
          <div className="text-center py-20">
            <HomeIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-xl">No properties found</p>
            {user?.role === "landlord" && (
              <Link
                href="/properties/new"
                className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-bold transition-all"
              >
                Add Your First Property
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((property) => (
              <Link
                key={property._id}
                href={`/properties/${property._id}`}
                className="bg-gray-800 hover:bg-gray-750 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <HomeIcon className="w-8 h-8 text-blue-400" />
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      !property.rooms || property.rooms.length === 0
                        ? "bg-gray-500/20 text-gray-400"
                        : property.rooms.every((r) => r.isOccupied)
                          ? "bg-red-500/20 text-red-400"
                          : property.rooms.some((r) => !r.isOccupied)
                            ? "bg-green-500/20 text-green-400"
                            : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {!property.rooms || property.rooms.length === 0
                      ? "No rooms"
                      : property.rooms.every((r) => r.isOccupied)
                        ? "Full"
                        : `${property.rooms.filter((r) => !r.isOccupied).length} Vacant`}
                  </span>
                </div>
                <h3 className="text-lg font-bold mb-2">{property.address}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <MapPinIcon className="w-4 h-4" />
                  {property.city}
                  {property.area ? `, ${property.area}` : ""}
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <UserGroupIcon className="w-4 h-4" />
                  {property.rooms?.length} room(s) available
                </div>
                {property.rooms?.length > 0 && (
                  <div className="flex items-center gap-2 text-blue-400 text-sm font-bold">
                    <CurrencyDollarIcon className="w-4 h-4" />
                    From {property.rooms[0].rentPerPerson} ETH/month
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
