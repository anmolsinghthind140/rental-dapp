import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";

export const metadata = {
  title: "Rental DApp",
  description: "Landlord & Tenant Agreement System on Blockchain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}