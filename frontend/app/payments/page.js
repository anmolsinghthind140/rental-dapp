"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { getContract } from "@/utils/contract";
import {
  CurrencyDollarIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  LinkIcon
} from "@heroicons/react/24/outline";

const API_URL = "http://localhost:5000";

export default function PaymentsPage() {
  const { wallet, user, loading } = useWallet();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [activeAgreement, setActiveAgreement] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [paying, setPaying] = useState(false);
  const [rentDue, setRentDue] = useState(false);

  useEffect(() => {
    if (!loading && !wallet) router.push("/");
    if (user) fetchData();
  }, [wallet, user, loading]);

  const fetchData = async () => {
    try {
      const url = user.role === "landlord"
        ? `${API_URL}/api/payments/landlord/${wallet.address}`
        : `${API_URL}/api/payments/tenant/${wallet.address}`;
      const res = await axios.get(url);
      setPayments(res.data.payments);

      // Tenant: get active agreement
      if (user.role === "tenant") {
        const agRes = await axios.get(
          `${API_URL}/api/agreements/tenant/${wallet.address}`
        );
        const active = agRes.data.agreements.find(a => a.status === "active");
        if (active) {
          setActiveAgreement(active);
          // Check if rent is due on blockchain
          try {
            const contract = getContract(active.contractAddress, wallet.signer);
            const due = await contract.isRentDue();
            setRentDue(due);
          } catch (e) {
            setRentDue(true);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingData(false);
    }
  };

  const handlePayRent = async () => {
    if (!activeAgreement) return;
    setPaying(true);
    try {
      const contract = getContract(
        activeAgreement.contractAddress,
        wallet.signer
      );
      const rentWei = (activeAgreement.rentAmount * 1e18).toString();

      const tx = await contract.payRent({ value: rentWei });
      await tx.wait();

      // Record in DB
      await axios.post(`${API_URL}/api/payments`, {
        agreementId: activeAgreement._id,
        tenantAddress: wallet.address,
        landlordAddress: activeAgreement.landlordAddress,
        amount: activeAgreement.rentAmount,
        txHash: tx.hash,
        type: "rent"
      });

      alert("Rent paid successfully on blockchain!");
      fetchData();
    } catch (error) {
      console.error(error);
      alert("Error paying rent: " + error.message);
    } finally {
      setPaying(false);
    }
  };

  const totalPaid = payments
    .filter(p => p.type === "rent")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalDeposit = payments
    .filter(p => p.type === "deposit")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-4xl font-bold mb-8">
          {user?.role === "landlord" ? "Payments Received" : "My Payments"}
        </h1>

        {loadingData ? (
          <p className="text-gray-400 text-center py-20">Loading...</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-gray-800 p-6 rounded-xl">
                <CurrencyDollarIcon className="w-8 h-8 text-blue-400 mb-3" />
                <p className="text-3xl font-bold">
                  {totalPaid.toFixed(4)} ETH
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Total Rent {user?.role === "landlord" ? "Received" : "Paid"}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <CurrencyDollarIcon className="w-8 h-8 text-yellow-400 mb-3" />
                <p className="text-3xl font-bold">
                  {totalDeposit.toFixed(4)} ETH
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  Total Deposit {user?.role === "landlord" ? "Received" : "Paid"}
                </p>
              </div>
              <div className="bg-gray-800 p-6 rounded-xl">
                <CheckCircleIcon className="w-8 h-8 text-green-400 mb-3" />
                <p className="text-3xl font-bold">{payments.length}</p>
                <p className="text-gray-400 text-sm mt-1">
                  Total Transactions
                </p>
              </div>
            </div>

            {/* Pay Rent Button — Tenant Only */}
            {user?.role === "tenant" && activeAgreement && (
              <div className="bg-gray-800 p-6 rounded-xl mb-8 border border-blue-500/30">
                <h2 className="text-xl font-bold mb-2">Active Lease Payment</h2>
                <p className="text-gray-400 text-sm mb-4">
                  Property: {activeAgreement.propertyId?.address || ""}
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Monthly Rent</p>
                    <p className="text-2xl font-bold text-blue-400">
                      {activeAgreement.rentAmount} ETH
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {rentDue && (
                      <span className="flex items-center gap-1 bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-bold">
                        <ClockIcon className="w-4 h-4" />
                        Rent Due
                      </span>
                    )}
                    <button
                      onClick={handlePayRent}
                      disabled={paying}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold px-8 py-3 rounded-xl flex items-center gap-2 transition-all"
                    >
                      <CurrencyDollarIcon className="w-5 h-5" />
                      {paying ? "Processing..." : "Pay Rent"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Payment History */}
            <h2 className="text-2xl font-bold mb-6">Transaction History</h2>
            {payments.length === 0 ? (
              <div className="text-center py-20">
                <CurrencyDollarIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-xl">No transactions yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {payments.map((payment) => (
                  <div
                    key={payment._id}
                    className="bg-gray-800 p-5 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-xl ${
                        user?.role === "landlord"
                          ? "bg-green-500/20"
                          : "bg-red-500/20"
                      }`}>
                        {user?.role === "landlord"
                          ? <ArrowDownIcon className="w-5 h-5 text-green-400" />
                          : <ArrowUpIcon className="w-5 h-5 text-red-400" />
                        }
                      </div>
                      <div>
                        <p className="font-bold capitalize">{payment.type} Payment</p>
                        <p className="text-gray-400 text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </p>
                        {payment.txHash && (
                          <div className="flex items-center gap-1 mt-1">
                            <LinkIcon className="w-3 h-3 text-gray-500" />
                            <p className="font-mono text-xs text-gray-500 truncate max-w-48">
                              {payment.txHash}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${
                        user?.role === "landlord"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}>
                        {user?.role === "landlord" ? "+" : "-"}
                        {payment.amount} ETH
                      </p>
                      <span className="text-xs text-gray-500 capitalize">
                        {payment.type}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}