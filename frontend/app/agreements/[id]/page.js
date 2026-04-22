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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function NicknameBadge({ address }) {
  const nickname = useNickname(address);
  return (
    <div>
      <p className="font-bold text-white text-lg">{nickname}</p>
      <p className="font-mono text-xs text-blue-400 break-all mt-1">
        {address}
      </p>
    </div>
  );
}

export default function AgreementDetailPage() {
  const { wallet, user } = useWallet();
  const { id } = useParams();
  const router = useRouter();
  const [agreement, setAgreement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [deployStatus, setDeployStatus] = useState("");

  // Date inputs for landlord
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (id) fetchAgreement();
  }, [id]);

  // Auto set default dates
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];
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

  // LANDLORD — Deploy contract and send
  const handleSendAgreement = async () => {
    if (!startDate || !endDate) {
      alert("Please select start and end dates");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      alert("End date must be after start date");
      return;
    }

    setActionLoading(true);
    setDeployStatus("Waiting for MetaMask approval...");
    

    try {
      setDeployStatus("Deploying to Sepolia (15-30 seconds)...");
      const { contractAddress, txHash } = await deployContract(
        wallet.signer,
        wallet.address,
        agreement.tenantAddress,
        agreement.rentAmount,
        agreement.depositAmount,
        startDate,
        endDate,
        `Rental agreement for ${agreement.propertyId?.address || "property"}`,
      );

      alert(`Contract deployed at ${contractAddress} on Sepolia!\nWaiting for transaction confirmation...`);

      setDeployStatus("Saving to database...");

      const response = await axios.put(`${API_URL}/api/agreements/${id}`, {
        status: "sent",
        contractAddress,
        txHash,
        startDate,
        endDate,
      });

      alert(`Agrement Response: `, response.data.message);

      setDeployStatus("Done!");
      alert("✅ Agreement deployed!\nContract: " + contractAddress);
      fetchAgreement();
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
      setDeployStatus("");
    } finally {
      setActionLoading(false);
    }
  };

  // TENANT — Sign and pay deposit
  const handleSignAgreement = async () => {
    setActionLoading(true);
    try {
      const contract = getContract(agreement.contractAddress, wallet.signer);
      const depositWei = ethers.parseEther(agreement.depositAmount.toString());

      const tx = await contract.signAndPayDeposit({ value: depositWei });
      await tx.wait();

      await axios.put(`${API_URL}/api/agreements/${id}`, {
        status: "active",
        signedTxHash: tx.hash,
      });

      await axios.post(`${API_URL}/api/payments`, {
        agreementId: id,
        tenantAddress: wallet.address,
        landlordAddress: agreement.landlordAddress,
        amount: agreement.depositAmount,
        txHash: tx.hash,
        type: "deposit",
      });

      alert("Agreement signed! Deposit paid on Sepolia blockchain.");
      fetchAgreement();
    } catch (error) {
      console.error(error);
      alert("Error signing: " + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // TENANT — Reject
  const handleRejectAgreement = async () => {
    if (!confirm("Reject this agreement?")) return;
    setActionLoading(true);
    try {
      await axios.put(`${API_URL}/api/agreements/${id}`, {
        status: "rejected",
      });
      fetchAgreement();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  // LANDLORD — Terminate
  const handleTerminate = async () => {
    if (!confirm("Terminate this agreement on blockchain?")) return;
    setActionLoading(true);
    try {
      const contract = getContract(agreement.contractAddress, wallet.signer);
      const tx = await contract.terminate();
      await tx.wait();

      await axios.put(`${API_URL}/api/agreements/${id}`, {
        status: "terminated",
      });

      alert("Agreement terminated on blockchain.");
      fetchAgreement();
    } catch (error) {
      console.error(error);
      alert("Error: " + error.message);
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
    draft: "text-gray-400 bg-gray-500/20",
    sent: "text-yellow-400 bg-yellow-500/20",
    active: "text-green-400 bg-green-500/20",
    rejected: "text-red-400 bg-red-500/20",
    terminated: "text-red-600 bg-red-800/20",
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Navbar />
      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Back */}
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
          <span
            className={`px-4 py-2 rounded-full text-sm font-bold capitalize ${statusColors[agreement.status]}`}
          >
            {agreement.status}
          </span>
        </div>

        {/* Details Card */}
        <div className="bg-gray-800 p-6 rounded-xl mb-6 space-y-6">
          {/* Property */}
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Property</h2>
            <p className="text-xl font-bold">
              {agreement.propertyId?.address || "Property"}
            </p>
            <p className="text-gray-400 text-sm">
              {agreement.propertyId?.city || ""}
              {agreement.propertyId?.area
                ? `, ${agreement.propertyId.area}`
                : ""}
            </p>
          </div>

          <hr className="border-gray-700" />

          {/* Parties */}
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

          {/* Financial */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Monthly Rent</p>
              <p className="font-bold text-blue-400">
                {agreement.rentAmount} ETH
              </p>
            </div>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-gray-400 text-xs mb-1">Deposit</p>
              <p className="font-bold text-yellow-400">
                {agreement.depositAmount} ETH
              </p>
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

          {/* Contract Address */}
          {agreement.contractAddress && (
            <>
              <hr className="border-gray-700" />
              <div>
                <h2 className="text-sm text-gray-400 mb-3 flex items-center gap-1">
                  <LinkIcon className="w-4 h-4" /> Blockchain Details
                </h2>
                <div className="space-y-3">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-400 text-xs mb-1">
                      Smart Contract Address
                    </p>
                    <p className="font-mono text-sm text-green-400 break-all">
                      {agreement.contractAddress}
                    </p>
                    <a
                      href={`https://sepolia.etherscan.io/address/${agreement.contractAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                    >
                      View on Sepolia Etherscan
                    </a>
                  </div>
                  {agreement.txHash && (
                    <div className="bg-gray-700 p-4 rounded-lg">
                      <p className="text-gray-400 text-xs mb-1">
                        Deploy Transaction
                      </p>
                      <p className="font-mono text-sm text-green-400 break-all">
                        {agreement.txHash}
                      </p>
                      <a
                        href={`https://sepolia.etherscan.io/tx/${agreement.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-400 hover:underline mt-1 inline-block"
                      >
                        View Transaction on Etherscan
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
          {/* Landlord: Set Dates + Deploy */}
          {user?.role === "landlord" && agreement.status === "draft" && (
            <div className="bg-gray-800 p-6 rounded-xl space-y-4">
              <h2 className="text-lg font-bold">Set Agreement Dates</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">
                    <CalendarIcon className="w-4 h-4 inline mr-1" />
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-xl">
                <p className="text-blue-400 text-sm font-bold mb-1">
                  What happens next?
                </p>
                <p className="text-gray-300 text-sm">
                  A smart contract will be deployed on Sepolia testnet. The
                  tenant will then sign and pay the deposit of{" "}
                  <span className="text-yellow-400 font-bold">
                    {agreement.depositAmount} ETH
                  </span>{" "}
                  on the blockchain.
                </p>
              </div>
              <button
                onClick={handleSendAgreement}
                disabled={actionLoading}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <DocumentTextIcon className="w-5 h-5" />
                {actionLoading
                  ? deployStatus || "Deploying to Sepolia..."
                  : "Deploy Contract & Send to Tenant"}
              </button>
            </div>
          )}

          {/* Tenant: Sign */}
          {user?.role === "tenant" && agreement.status === "sent" && (
            <div className="space-y-3">
              <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                <p className="text-yellow-400 text-sm font-bold mb-1">
                  Action Required
                </p>
                <p className="text-gray-300 text-sm">
                  Sign this agreement and pay deposit of{" "}
                  <span className="text-yellow-400 font-bold">
                    {agreement.depositAmount} ETH
                  </span>{" "}
                  on Sepolia blockchain.
                </p>
              </div>
              <button
                onClick={handleSignAgreement}
                disabled={actionLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircleIcon className="w-5 h-5" />
                {actionLoading
                  ? "Signing on Sepolia..."
                  : `Sign & Pay Deposit (${agreement.depositAmount} ETH)`}
              </button>
              <button
                onClick={handleRejectAgreement}
                disabled={actionLoading}
                className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <XCircleIcon className="w-5 h-5" />
                Reject Agreement
              </button>
            </div>
          )}

          {/* Landlord: Terminate */}
          {user?.role === "landlord" && agreement.status === "active" && (
            <button
              onClick={handleTerminate}
              disabled={actionLoading}
              className="w-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <XCircleIcon className="w-5 h-5" />
              {actionLoading
                ? "Terminating on Blockchain..."
                : "Terminate Agreement"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
