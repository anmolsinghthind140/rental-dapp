"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { ethers } from "ethers";
import axios from "axios";

const API_URL = "http://localhost:5000";
const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
  const [wallet, setWallet] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkWalletConnection();
  }, []);

  const checkWalletConnection = async () => {
    try {
      if (typeof window.ethereum !== "undefined") {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });
        if (accounts.length > 0) await connectWallet();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const getBalance = async (provider, address) => {
    const bal = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(bal)).toFixed(4);
  };

  const connectWallet = async () => {
    try {
      if (typeof window.ethereum === "undefined") {
        alert("Please install MetaMask!");
        return null;
      }

      // Check if on Sepolia (chainId 11155111 = 0xaa36a7)
      const chainId = await window.ethereum.request({
        method: "eth_chainId",
      });

      if (chainId !== "0xaa36a7") {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: "0xaa36a7" }],
          });
        } catch (switchError) {
          // Add Sepolia if not added
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0xaa36a7",
                chainName: "Sepolia Testnet",
                nativeCurrency: {
                  name: "ETH",
                  symbol: "ETH",
                  decimals: 18,
                },
                rpcUrls: [`${process.env.SEPOLIA_RPC_URL}`],
                blockExplorerUrls: ["https://sepolia.etherscan.io"],
              },
            ],
          });
        }
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = await provider.getSigner();
      const address = await signer.getAddress();
      const balance = await getBalance(provider, address);

      const walletData = {
        address: address.toLowerCase(),
        balance,
        signer,
        provider,
      };

      setWallet(walletData);

      window.ethereum.on("accountsChanged", () => disconnectWallet());
      window.ethereum.on("chainChanged", () => window.location.reload());

      try {
        const response = await axios.get(
          `${API_URL}/api/users/${address.toLowerCase()}`,
        );
        if (response.data.exists) {
          setUser(response.data.user);
          return { walletData, user: response.data.user, isNew: false };
        } else {
          return { walletData, user: null, isNew: true };
        }
      } catch (apiError) {
        if (apiError.response?.status === 404) {
          return { walletData, user: null, isNew: true };
        }
        throw apiError;
      }
    } catch (error) {
      console.error("Wallet connection error:", error);
      return null;
    }
  };

  const refreshBalance = async () => {
    if (!wallet?.provider || !wallet?.address) return;
    try {
      const balance = await getBalance(wallet.provider, wallet.address);
      setWallet((prev) => ({ ...prev, balance }));
    } catch (error) {
      console.error("Balance refresh error:", error);
    }
  };

  const disconnectWallet = () => {
    setWallet(null);
    setUser(null);
  };

  const registerUser = async (nickname, role) => {
    try {
      const response = await axios.post(`${API_URL}/api/users/register`, {
        walletAddress: wallet.address,
        nickname,
        role,
      });
      setUser(response.data.user);
      return response.data.user;
    } catch (error) {
      console.error("Register error:", error);
      return null;
    }
  };

  return (
    <WalletContext.Provider
      value={{
        wallet,
        user,
        setUser,
        loading,
        connectWallet,
        disconnectWallet,
        registerUser,
        refreshBalance,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);
