"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import {
  PlusIcon,
  TrashIcon,
  HomeIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";


export default function AddPropertyPage() {
  const { wallet, user } = useWallet();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    city: "",
    area: "",
    address: "",
    houseNumber: ""
  });

  const [rooms, setRooms] = useState([
    { roomNumber: "", roomType: "single", rentPerPerson: "", maxPersons: 1 }
  ]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRoomChange = (index, field, value) => {
    const updated = [...rooms];
    updated[index][field] = value;
    if (field === "roomType") {
      const persons = { single: 1, double: 2, triple: 3, quad: 4 };
      updated[index].maxPersons = persons[value];
    }
    setRooms(updated);
  };

  const addRoom = () => {
    setRooms([...rooms, {
      roomNumber: "", roomType: "single",
      rentPerPerson: "", maxPersons: 1
    }]);
  };

  const removeRoom = (index) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.city || !form.address) {
      toast.error("Please fill required fields");
      return;
    }
    if (rooms.some(r => !r.rentPerPerson)) {
      toast.error("Please fill rent for all rooms");
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/properties`, {
        ...form,
        landlordAddress: wallet.address,
        rooms
      });
      router.push("/properties");
    } catch (error) {
      console.error(error);
      toast.error("Error adding property");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="flex items-center gap-3 mb-8">
          <HomeIcon className="w-8 h-8 text-blue-400" />
          <h1 className="text-4xl font-bold">Add New Property</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Property Details */}
          <div className="bg-gray-800 p-6 rounded-xl space-y-4">
            <h2 className="text-xl font-bold mb-4">Property Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">City *</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleFormChange}
                  placeholder="e.g. London"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Area</label>
                <input
                  name="area"
                  value={form.area}
                  onChange={handleFormChange}
                  placeholder="e.g. Stratford"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Address *</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleFormChange}
                  placeholder="e.g. 123 Main Street"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">House Number</label>
                <input
                  name="houseNumber"
                  value={form.houseNumber}
                  onChange={handleFormChange}
                  placeholder="e.g. 12A"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Rooms */}
          <div className="bg-gray-800 p-6 rounded-xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Rooms</h2>
              <button
                type="button"
                onClick={addRoom}
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
              >
                <PlusIcon className="w-4 h-4" />
                Add Room
              </button>
            </div>

            <div className="space-y-4">
              {rooms.map((room, index) => (
                <div key={index} className="bg-gray-700 p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">Room {index + 1}</h3>
                    {rooms.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeRoom(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Room Number</label>
                      <input
                        value={room.roomNumber}
                        onChange={(e) => handleRoomChange(index, "roomNumber", e.target.value)}
                        placeholder="e.g. 101"
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Room Type</label>
                      <select
                        value={room.roomType}
                        onChange={(e) => handleRoomChange(index, "roomType", e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="single">Single (1 person)</option>
                        <option value="double">Double (2 persons)</option>
                        <option value="triple">Triple (3 persons)</option>
                        <option value="quad">Quad (4 persons)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Rent (ETH/month)</label>
                      <input
                        type="number"
                        step="0.001"
                        value={room.rentPerPerson}
                        onChange={(e) => handleRoomChange(index, "rentPerPerson", e.target.value)}
                        placeholder="e.g. 0.05"
                        className="w-full bg-gray-600 border border-gray-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold py-4 rounded-xl text-lg transition-all"
          >
            {loading ? "Saving..." : "Save Property"}
          </button>
        </form>
      </div>
    </div>
  );
}