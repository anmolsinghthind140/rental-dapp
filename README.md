# Rental DApp

Rental DApp is a small full-stack project combining a Next.js frontend, an Express + MongoDB backend, and Solidity smart contracts (Hardhat). The frontend connects to the backend API and to MetaMask for on-chain interactions; contracts are deployed and called via Ethers.js using an Alchemy Sepolia RPC.

## Tech Stack
- Frontend: Next.js, React, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB with Mongoose
- Blockchain: Solidity, Hardhat, Ethers.js
- Wallet: MetaMask

## Quick Start
1. Install dependencies:

```bash
cd backend && npm install
cd ../frontend && npm install
cd ../blockchain && npm install
```

2. Run services (separate terminals):

```bash
# backend
cd backend && npm run dev

# frontend
cd frontend && npm run dev

# compile contracts
cd blockchain && npx hardhat compile
```

3. Copy contract ABI to frontend (after compile):

```bash
# Windows
copy blockchain\artifacts\contracts\RentalAgreement.sol\RentalAgreement.json frontend\public\RentalAgreement.json
```

## Environment files and values (examples)

### Frontend - `frontend/.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
BYTECODE=
```

- `NEXT_PUBLIC_API_URL` is safe (local). 
- `SEPOLIA_RPC_URL` needs a Alchemy key.
- `BYTECODE` can be filled after compiling contracts.

### Blockchain - `blockchain/.env`
```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/<API_KEY>
PRIVATE_KEY=0x<your_private_key_here>   
```

- `PRIVATE_KEY` must never be committed. Use a test account for Sepolia and keep the key out of source control.

### Backend - `backend/.env`
```env
MONGO_URI=mongodb+srv://<username>:<password>@rentaldapp.ompylsm.mongodb.net/?retryWrites=true&w=majority
PORT=5000
```

- The real `MONGO_URI` may contain credentials; do not publish them. Replace `<username>`/`<password>` locally or use a secure secret store.

----

## How to get the Alchemy API key (SEPOLIA_RPC_URL)
1. Create an Alchemy account at https://www.alchemy.com and sign in.
2. Go to the Dashboard → Create App.
3. Set the network to **Sepolia** and give the app a name.
4. After creation, open the app and copy the **HTTP URL** or the API key from the dashboard.
5. Use the API key in this form:
```text
https://eth-sepolia.g.alchemy.com/v2/<YOUR_ALCHEMY_API_KEY>
```

----

## How to export your MetaMask private key (PRIVATE_KEY)
1. Open MetaMask in your browser and unlock your wallet.
2. Click the account circle → Account details → Export Private Key.
3. Enter your MetaMask password and copy the private key shown.
4. Add `0x` prefix if missing and paste into `blockchain/.env` as `PRIVATE_KEY=0x...`.

Security: never share this key. Use a throwaway account for testnets and keep keys out of source control.

----

## How to get contract bytecode and add to env (BYTECODE)
1. Compile contracts:
```bash
cd blockchain
npx hardhat compile
```
2. Open the compiled JSON:
```
blockchain/artifacts/contracts/RentalAgreement.sol/RentalAgreement.json
```
3. Inside that JSON, find the `bytecode` field (it is a long hex string starting with `0x`).
4. Copy the `bytecode` value and set `BYTECODE=` in `blockchain/.env`. Example (do not paste entire value here):
```text
BYTECODE=0x6080604052...<trimmed>...c0ffee
```

Alternative (Node): from the `blockchain/` folder run:
```bash
node -e "console.log(require('./artifacts/contracts/RentalAgreement.sol/RentalAgreement.json').bytecode)"
```

This prints the bytecode so you can redirect or copy it safely.

----

## Where to look
- Frontend: frontend/
- Backend: backend/
- Smart contracts: blockchain/contracts/


## ⚠️ Known Issues & Limitations

- **Sepolia txpool congestion** - During peak times the Sepolia testnet rejects transactions. Fix: wait 5 min, switch to `https://rpc.ankr.com/eth_sepolia`
- **MetaMask required** - App only works with MetaMask installed
- **Testnet only** - Runs on Sepolia testnet, not mainnet. Do not use real ETH
- **Single tenant per room** - Multi-tenant support is a planned feature
- **No image uploads** - Property images not supported yet

---

## 🔧 Troubleshooting

| Error | Cause | Fix |
|---|---|---|
| `txpool is full` | Sepolia congested | Wait 5 min, use Ankr RPC |
| `nonce too low` | Stuck MetaMask transaction | Settings → Advanced → Clear activity |
| `insufficient funds` | No Sepolia ETH | Use a faucet |
| `Property not found` | Wrong route order | Ensure `/landlord/:addr` before `/:id` |
| `next is not a function` | Missing error handler | Add 4-param handler in `index.js` |
| `bytecode empty` | Contract not compiled | Run `npx hardhat compile` and copy JSON |

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

Built with ❤️ by Anmol Singh using Next.js, Express, MongoDB, and Ethereum Solidity.

> **Network:** Ethereum Sepolia Testnet
> **Stack:** MERN + Blockchain (Hardhat + Ethers.js)


