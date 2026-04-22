import { ethers } from "ethers";

const ABI = [
  "constructor(address _landlord, address _tenant, uint256 _rentAmount, uint256 _depositAmount, uint256 _startDate, uint256 _endDate, string memory _terms)",
  "function signAndPayDeposit() external payable",
  "function payRent() external payable",
  "function terminate() external",
  "function isRentDue() external view returns (bool)",
  "event AgreementSigned(address indexed tenant, address indexed landlord, uint256 depositAmount, uint256 timestamp)",
  "event RentPaid(address indexed tenant, uint256 amount, uint256 timestamp)",
  "event AgreementTerminated(address indexed terminatedBy, uint256 timestamp)"
];

let cachedBytecode = null;

export const loadBytecode = async () => {
  if (cachedBytecode) return cachedBytecode;
  try {
    const res = await fetch("/RentalAgreement.json");
    if (!res.ok) throw new Error("RentalAgreement.json not found in /public folder");
    const json = await res.json();
    if (!json.bytecode || json.bytecode === "0x") {
      throw new Error("Bytecode empty — run: cd blockchain && npx hardhat compile");
    }
    cachedBytecode = json.bytecode;
    console.log("✅ Bytecode loaded, length:", cachedBytecode.length);
    return cachedBytecode;
  } catch (e) {
    console.error("❌ Bytecode error:", e.message);
    throw e;
  }
};

export const getContract = (contractAddress, signer) => {
  return new ethers.Contract(contractAddress, ABI, signer);
};

export const deployContract = async (
  signer,
  landlordAddress,
  tenantAddress,
  rentAmount,
  depositAmount,
  startDate,
  endDate,
  terms
) => {
  console.log("🚀 Starting deployment...");
  console.log("  Landlord:", landlordAddress);
  console.log("  Tenant:", tenantAddress);
  console.log("  Rent:", rentAmount, "ETH | Deposit:", depositAmount, "ETH");
  console.log("  Dates:", startDate, "→", endDate);


  const bytecode = await loadBytecode();
  const factory = new ethers.ContractFactory(ABI, bytecode, signer);


  const startTs = Math.floor(new Date(startDate).getTime() / 1000);
  const endTs = Math.floor(new Date(endDate).getTime() / 1000);


  // Send transaction
  const contract = await factory.deploy(
    landlordAddress,
    tenantAddress,
    ethers.parseEther(rentAmount.toString()),
    ethers.parseEther(depositAmount.toString()),
    startTs,
    endTs,
    terms,
    { gasLimit: 3000000 }
  );

  {<div> contract </div>}

  const deployTx = contract.deploymentTransaction();
  const txHash = deployTx.hash;
  console.log("📨 TX sent! Hash:", txHash);
  console.log("⏳ Waiting for Sepolia confirmation (15-30 seconds)...");

  // Wait with timeout — Sepolia can be slow
  const confirmed = await Promise.race([
    contract.waitForDeployment(),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Deployment timeout after 120s")), 120000)
    )
  ]);


  const contractAddress = await contract.getAddress();
  console.log("✅ Deployed at:", contractAddress);

  return { contractAddress, txHash };
};