import { WalletProvider } from "@/context/WalletContext";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata = {
  title: "Rental DApp",
  description: "Landlord & Tenant Agreement System on Blockchain",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#1f2937",
              color: "#fff",
              border: "1px solid #374151"
            },
            success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
            error:   { iconTheme: { primary: "#ef4444", secondary: "#fff" } }
          }}
        />
          {children}
          
        </WalletProvider>
      </body>
    </html>
  );
}