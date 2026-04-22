"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import {
  MapPinIcon,
  HomeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  PencilIcon,
  TrashIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function PropertyDetailPage() {
  const { wallet, user } = useWallet();
  const router = useRouter();
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    moveInDate: "",
    message: ""
  });

  useEffect(() => {
    if (id) fetchProperty();
  }, [id]);

 const fetchProperty = async () => {
  try {
    console.log("📡 Fetching:", `${API_URL}/api/properties/${id}`);
    const res = await axios.get(`${API_URL}/api/properties/${id}`);
    console.log("✅ Full response data:", JSON.stringify(res.data));

    // Handle all possible response formats
    const prop = res.data.property || res.data.data || res.data;

    if (prop && prop._id) {
      setProperty(prop);
    } else {
      console.error("❌ No property found in response:", res.data);
    }
  } catch (error) {
    console.error("❌ Fetch error:", error.response?.data || error.message);
  } finally {
    setLoading(false);
  }
};

  const handleDeleteProperty = async () => {
    if (!confirm("Are you sure you want to delete this property?")) return;
    try {
      await axios.delete(`${API_URL}/api/properties/${id}`);
      router.push("/properties");
    } catch (error) {
      console.error(error);
    }
  };

  const handleRequestRoom = (room) => {
    setSelectedRoom(room);
    setShowRequestModal(true);
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (!requestForm.moveInDate) return toast.error("Please select move-in date");
    setRequesting(true);
    try {
      await axios.post(`${API_URL}/api/requests`, {
        tenantAddress: wallet.address,
        landlordAddress: property.landlordAddress,
        propertyId: property._id,
        roomId: selectedRoom._id,
        roomType: selectedRoom.roomType,
        moveInDate: requestForm.moveInDate,
        message: requestForm.message
      });
      setShowRequestModal(false);
      toast.success("Request sent successfully!");
      router.push("/requests");
    } catch (error) {
      console.error(error);
      toast.error("Error sending request");
    } finally {
      setRequesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Loading...</p>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Property not found</p>
      </div>
    );
  }

  const isOwner = user?.role === "landlord" &&
    property.landlordAddress === wallet?.address;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Properties
        </button>

        {/* Property Header */}
        <div className="bg-gray-800 p-8 rounded-xl mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <HomeIcon className="w-8 h-8 text-blue-400" />
                <h1 className="text-3xl font-bold">{property.address}</h1>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <MapPinIcon className="w-5 h-5" />
                <span>
                  {property.city}
                  {property.area ? `, ${property.area}` : ""}
                  {property.houseNumber ? ` — House No. ${property.houseNumber}` : ""}
                </span>
              </div>
            </div>

            {/* Owner Actions */}
            {isOwner && (
              <div className="flex gap-3">
                <Link
                  href={`/properties/${id}/edit`}
                  className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-all"
                >
                  <PencilIcon className="w-5 h-5" />
                </Link>
                <button
                  onClick={handleDeleteProperty}
                  className="bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white p-2 rounded-lg transition-all"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Property Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <UserGroupIcon className="w-6 h-6 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">{property.rooms?.length}</p>
              <p className="text-gray-400 text-sm">Total Rooms</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <CheckCircleIcon className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {property.rooms?.filter(r => !r.isOccupied).length}
              </p>
              <p className="text-gray-400 text-sm">Vacant Rooms</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg text-center">
              <CurrencyDollarIcon className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
              <p className="text-2xl font-bold">
                {property.rooms?.length > 0
                  ? Math.min(...property.rooms.map(r => r.rentPerPerson))
                  : 0} ETH
              </p>
              <p className="text-gray-400 text-sm">Starting Rent</p>
            </div>
          </div>
        </div>

        {/* Rooms List */}
        <h2 className="text-2xl font-bold mb-6">Available Rooms</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {property.rooms?.map((room, index) => (
            <div
              key={room._id}
              className={`bg-gray-800 p-6 rounded-xl border ${
                room.isOccupied
                  ? "border-gray-700 opacity-60"
                  : "border-gray-700 hover:border-blue-500"
              } transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold">
                    Room {room.roomNumber || index + 1}
                  </h3>
                  <span className="text-sm text-gray-400 capitalize">
                    {room.roomType} sharing
                  </span>
                </div>
                {room.isOccupied ? (
                  <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                    <XCircleIcon className="w-4 h-4" />
                    Occupied
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-xs font-bold">
                    <CheckCircleIcon className="w-4 h-4" />
                    Vacant
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400">
                  <CurrencyDollarIcon className="w-5 h-5" />
                  <span className="text-xl font-bold">
                    {room.rentPerPerson} ETH
                  </span>
                  <span className="text-gray-400 text-sm">/month</span>
                </div>
                <div className="flex items-center gap-2 text-gray-400 text-sm">
                  <UserGroupIcon className="w-4 h-4" />
                  Max {room.maxPersons} person(s)
                </div>
              </div>

              {/* Request Button — Tenant Only */}
              {user?.role === "tenant" && !room.isOccupied && (
                <button
                  onClick={() => handleRequestRoom(room)}
                  className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition-all"
                >
                  Request This Room
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Request Modal */}
      {showRequestModal && selectedRoom && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4">
          <div className="bg-gray-800 p-8 rounded-2xl w-full max-w-md">
            <h2 className="text-2xl font-bold mb-2">Request Room</h2>
            <p className="text-gray-400 mb-6">
              Room {selectedRoom.roomNumber || ""} —
              {selectedRoom.roomType} sharing —
              {selectedRoom.rentPerPerson} ETH/month
            </p>

            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Preferred Move-in Date
                </label>
                <input
                  type="date"
                  value={requestForm.moveInDate}
                  onChange={(e) => setRequestForm({
                    ...requestForm, moveInDate: e.target.value
                  })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Message to Landlord (optional)
                </label>
                <textarea
                  value={requestForm.message}
                  onChange={(e) => setRequestForm({
                    ...requestForm, message: e.target.value
                  })}
                  placeholder="Tell the landlord about yourself..."
                  rows={3}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={requesting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold py-3 rounded-xl transition-all"
                >
                  {requesting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}