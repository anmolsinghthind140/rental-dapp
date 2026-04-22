"use client";
import { useWallet } from "@/context/WalletContext";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Navbar from "@/components/Navbar";
import { getContract, deployContract } from "@/utils/contract";
import { useNickname } from "@/utils/useNickname";
import { ethers } from "ethers";
import {
  DocumentTextIcon,
  ArrowLeftIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarIcon,
  UserIcon,
  LinkIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function NicknameBadge({ address }) {
  const nickname = useNickname(address);
  return (
    <div>
      <p className="font-bold text-white text-lg">{nickname}</p>
      <p className="font-mono text-xs text-blue-400 break-all mt-1">{address}</p>
    </div>
  );
}

export default function AgreementDetailPage() {
  const { wallet, user } = useWallet();
  const { id } = useParams();
  const router = useRouter();
  const [agreement, setAgreement] = useState(null);
  const [payments, setPayments] = useState([]);       // ✅ payment history
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (id) {
      fetchAgreement();
      fetchPayments();   // ✅ fetch on load
    }
  }, [id]);

  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString().split("T")[0];
    setStartDate(today);
    setEndDate(nextYear);
  }, []);

  const fetchAgreement = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/agreements/${id}`);
      setAgreement(res.data.agreement);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Fetch payment history
  const fetchPayments = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/payments/agreement/${id}`);
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error("fetchPayments error:", error.message);
    }
  };

  // LANDLORD — Deploy
  const handleSendAgreement = async () => {
    if (!startDate || !endDate) {
      toast.error("Please select start and end dates");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    setActionLoading(true);
    setDeployStatus("Waiting for MetaMask approval...");
    const toastId = toast.loading("Waiting for MetaMask...");

    try {
      setDeployStatus("Deploying to Sepolia (15-30 seconds)...");
      toast.loading("Deploying to Sepolia...", { id: toastId });

      const { contractAddress, txHash } = await deployContract(
        wallet.signer,
        wallet.address,
        agreement.tenantAddress,
        agreement.rentAmount,
        agreement.depositAmount,
        startDate,
        endDate,
        `Rental agreement for ${agreement.propertyId?.address || "property"}`
      );

      setDeployStatus("Saving to database...");
      toast.loading("Saving to database...", { id: toastId });

      await axios.put(`${API_URL}/api/agreements/${id}`, {
        status: "sent",
        contractAddress,
        txHash,
        startDate,
        endDate,
      });

      setDeployStatus("Done!");
      toast.success("Agreement deployed and sent to tenant!", { id: toastId });
      fetchAgreement();
    } catch (error) {
      console.error(error);
      toast.error("Error: " + error.message, { id: toastId });
      setDeployStatus("");
    } finally {
      setActionLoading(false);
    }
  };

  // TENANT — Sign + pay deposit
  const handleSignAgreement = async () => {
    const toastId = toast.loading("Waiting for MetaMask...");
    setActionLoading(true);
    try {
      const contract = getContract(agreement.contractAddress, wallet.signer);
      const depositWei = ethers.parseEther(agreement.depositAmount.toString());

      toast.loading("Signing on Sepolia...", { id: toastId });
      const tx = await contract.signAndPayDeposit({ value: depositWei });
      await tx.wait();

      await axios.put(`${API_URL}/api/agreements/${id}`, {
        status: "active",
        signedTxHash: tx.hash,
      });

      await axios.post(`${API_URL}/api/payments`, {
        agreementId:     id,
        tenantAddress:   wallet.address,
        landlordAddress: agreement.landlordAddress,
        amount:          agreement.depositAmount,
        txHash:          tx.hash,
        type:            "deposit",
      });

      toast.success("Agreement signed! Deposit paid on Sepolia!", { id: toastId });
      fetchAgreement();
      fetchPayments();   // ✅ refresh payments
    } catch (error) {
      console.error(error);
      toast.error("Error: " + error.message, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // TENANT — Pay monthly rent
  const handlePayRent = async () => {
    const now = new Date();
    const rentMonth = now.getMonth() + 1;
    const rentYear  = now.getFullYear();
    const monthName = now.toLocaleString("default", { month: "long" });

    // Frontend duplicate check
    const alreadyPaid = payments.some(
      p => p.type === "rent" &&
           p.rentMonth === rentMonth &&
           p.rentYear  === rentYear  &&
           p.status    === "paid"
    );
    if (alreadyPaid) {
      toast.error(`Rent for ${monthName} ${rentYear} already paid!`);
      return;
    }

    const toastId = toast.loading(`Paying ${monthName} rent...`);
    setActionLoading(true);
    try {
      const contract = getContract(agreement.contractAddress, wallet.signer);
      const rentWei  = ethers.parseEther(agreement.rentAmount.toString());

      const tx = await contract.payRent({ value: rentWei });
      await tx.wait();

      await axios.post(`${API_URL}/api/payments`, {
        agreementId:     id,
        tenantAddress:   wallet.address,
        landlordAddress: agreement.landlordAddress,
        amount:          agreement.rentAmount,
        txHash:          tx.hash,
        type:            "rent",
        rentMonth,
        rentYear
      });

      toast.success(`✅ Rent paid for ${monthName} ${rentYear}!`, { id: toastId });
      fetchPayments();   // ✅ refresh
    } catch (error) {
      toast.error(error.response?.data?.message || error.message, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // TENANT — Reject
  const handleRejectAgreement = async () => {
    if (!confirm("Reject this agreement?")) return;
    const toastId = toast.loading("Rejecting...");
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/agreements/${id}`, { status: "rejected" });
      toast.success("Agreement rejected", { id: toastId });
      fetchAgreement();
    } catch (error) {
      toast.error(error.message, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  // LANDLORD — Terminate
  const handleTerminate = async () => {
    if (!confirm("Terminate this agreement on blockchain?")) return;
    const toastId = toast.loading("Terminating on Sepolia...");
    setActionLoading(true);
    try {
      const contract = getContract(agreement.contractAddress, wallet.signer);
      const tx = await contract.terminate();
      await tx.wait();

      await axios.put(`${API_URL}/api/agreements/${id}`, { status: "terminated" });

      toast.success("Agreement terminated on blockchain.", { id: toastId });
      fetchAgreement();
    } catch (error) {
      toast.error("Error: " + error.message, { id: toastId });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-gray-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-white text-xl">Agreement not found</p>
      </div>
    );
  }

  const statusColors = {
    draft:      "text-gray-400 bg-gray-500/20",
    sent:       "text-yellow-400 bg-yellow-500/20",
    active:     "text-green-400 bg-green-500/20",
    rejected:   "text-red-400 bg-red-500/20",
    terminated: "text-red-600 bg-red-800/20",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-all"
        >
          <ArrowLeftIcon className="w-5 h-5" />
          Back to Agreements
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <DocumentTextIcon className="w-8 h-8 text-blue-400" />
            <h1 className="text-3xl font-bold">Rental Agreement</h1>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${statusColors[agreement.status]}`}>
            {agreement.status}
          </span>
        </div>

        {/* Details Card */}
        <div className="bg-gray-800 p-6 rounded-xl mb-6 space-y-6">
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Property</h2>
            <p className="text-xl font-bold">{agreement.propertyId?.address || "Property"}</p>
            <p className="text-gray-400 text-sm">
              {agreement.propertyId?.city || ""}
              {agreement.propertyId?.area ? `, ${agreement.propertyId.area}` : ""}
            </p>
          </div>

          <hr className="border-gray-700" />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                <UserIcon className="w-4 h-4" /> Landlord
              </p>
              <NicknameBadge address={agreement.landlordAddress} />
            </div>
            <div>
              <p className="text-gray-400 text-sm mb-2 flex items-center gap-1">
                <UserIcon className="w-4 h-4" /> Tenant
              </p>
              <NicknameBadge address={agreement.tenantAddress} />
            </div>
          </div>

          <hr className="border-gray-700" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Monthly Rent</p>
              <p className="font-bold text-blue-400">{agreement.rentAmount} ETH</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Deposit</p>
              <p className="font-bold text-yellow-400">{agreement.depositAmount} ETH</p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Start Date</p>
              <p className="font-medium text-sm">
                {agreement.startDate
                  ? new Date(agreement.startDate).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">End Date</p>
              <p className="font-medium text-sm">
                {agreement.endDate
                  ? new Date(agreement.endDate).toLocaleDateString()
                  : "Not set"}
              </p>
            </div>
          </div>

          {agreement.contractAddress && (
            <>
              <hr className="border-gray-700" />
              <div>
                <h2 className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" /> Blockchain Details
                </h2>
                <div className="space-y-3">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">Smart Contract Address</p>
                    <p className="font-mono text-sm text-green-400 break-all">{agreement.contractAddress}</p>
                    <a href={`https://sepolia.etherscan.io/address/${agreement.contractAddress}`}
                      target="_blank" rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                      View on Sepolia Etherscan ↗
                    </a>
                  </div>
                  {agreement.txHash && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">Deploy Transaction</p>
                      <p className="font-mono text-sm text-green-400 break-all">{agreement.txHash}</p>
                      <a href={`https://sepolia.etherscan.io/tx/${agreement.txHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                        View Transaction on Etherscan ↗
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4">

          {/* Landlord: Deploy */}
          {user?.role === "landlord" && agreement.status === "draft" && (
            <div className="bg-gray-800 p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold">Set Agreement Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-1" /> Start Date
                  </label>
                  <input type="date" value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-1" /> End Date
                  </label>
                  <input type="date" value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-blue-400 text-sm font-bold mb-1">What happens next?</p>
                <p className="text-gray-300 text-sm">
                  A smart contract will be deployed on Sepolia testnet. The tenant will then
                  sign and pay the deposit of{" "}
                  <span className="text-yellow-400 font-bold">{agreement.depositAmount} ETH</span> on the blockchain.
                </p>
              </div>
              <button onClick={handleSendAgreement} disabled={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <DocumentTextIcon className="w-5 h-5" />
                {actionLoading ? deployStatus || "Deploying..." : "Deploy Contract & Send to Tenant"}
              </button>
            </div>
          )}

          {/* Tenant: Sign */}
          {user?.role === "tenant" && agreement.status === "sent" && (
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                <p className="text-yellow-400 text-sm font-bold mb-1">Action Required</p>
                <p className="text-gray-300 text-sm">
                  Sign this agreement and pay deposit of{" "}
                  <span className="text-yellow-400 font-bold">{agreement.depositAmount} ETH</span> on Sepolia blockchain.
                </p>
              </div>
              <button onClick={handleSignAgreement} disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <CheckCircleIcon className="w-5 h-5" />
                {actionLoading ? "Signing on Sepolia..." : `Sign & Pay Deposit (${agreement.depositAmount} ETH)`}
              </button>
              <button onClick={handleRejectAgreement} disabled={actionLoading}
                className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
                <XCircleIcon className="w-5 h-5" />
                Reject Agreement
              </button>
            </div>
          )}

          {/* Tenant: Pay Rent */}
          {user?.role === "tenant" && agreement.status === "active" && (
            <div className="space-y-3">
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-blue-400 text-sm font-bold mb-1">Monthly Rent Due</p>
                <p className="text-gray-300 text-sm">
                  Pay rent for{" "}
                  <span className="text-white font-bold">
                    {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>
                  {" "}— Amount:{" "}
                  <span className="text-blue-400 font-bold">{agreement.rentAmount} ETH</span>
                </p>
              </div>
              <button onClick={handlePayRent} disabled={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all">
                <CurrencyDollarIcon className="w-5 h-5" />
                {actionLoading ? "Processing..." : `Pay ${new Date().toLocaleString("default", { month: "long" })} Rent (${agreement.rentAmount} ETH)`}
              </button>
            </div>
          )}

          {/* Landlord: Terminate */}
          {user?.role === "landlord" && agreement.status === "active" && (
            <button onClick={handleTerminate} disabled={actionLoading}
              className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all">
              <XCircleIcon className="w-5 h-5" />
              {actionLoading ? "Terminating on Blockchain..." : "Terminate Agreement"}
            </button>
          )}
        </div>

        {/* ✅ Payment History */}
        {payments.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold mb-4">Payment History</h2>
            <div className="space-y-3">
              {payments.map((p) => (
                <div key={p._id}
                  className="bg-gray-800 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold capitalize ${
                      p.type === "deposit"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-blue-500/20 text-blue-400"
                    }`}>
                      {p.type}
                    </span>
                    {p.type === "rent" && p.rentMonth && p.rentYear && (
                      <p className="text-white font-bold mt-1">
                        {new Date(p.rentYear, p.rentMonth - 1)
                          .toLocaleString("default", { month: "long", year: "numeric" })}
                      </p>
                    )}
                    {p.type === "deposit" && (
                      <p className="text-white font-bold mt-1">Security Deposit</p>
                    )}
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(p.paymentDate).toLocaleDateString("en-GB", {
                        day: "2-digit", month: "short", year: "numeric"
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-400 font-bold text-lg">{p.amount} ETH</p>
                    {p.txHash && (
                      <a href={`https://sepolia.etherscan.io/tx/${p.txHash}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline">
                        View on Etherscan ↗
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}