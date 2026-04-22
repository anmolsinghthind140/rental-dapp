const hre = require("hardhat");

async function main() {
  console.log("Deploying RentalAgreement contract...");

  const [deployer, tenant] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);

  const rentAmount = hre.ethers.parseEther("0.01");
  const depositAmount = hre.ethers.parseEther("0.02");
  const startDate = Math.floor(Date.now() / 1000);
  const endDate = startDate + (365 * 24 * 60 * 60);
  const terms = "Standard rental agreement terms";

  const RentalAgreement = await hre.ethers.getContractFactory("RentalAgreement");

  const contract = await RentalAgreement.deploy(
    deployer.address,
    tenant.address,
    rentAmount,
    depositAmount,
    startDate,
    endDate,
    terms
  );

  await contract.waitForDeployment();
  console.log("RentalAgreement deployed to:", await contract.getAddress());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });