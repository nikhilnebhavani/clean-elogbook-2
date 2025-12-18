import { Inter } from "next/font/google";
import "./globals.css";
import Authprovider from "../components/Authprovider/Authprovider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});
export const metadata = {
  title: "Elogbook - Parul University",
  description:
    "It is a elogbook system for medical students. Created for Parul University",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Authprovider>{children}</Authprovider>
      </body>
    </html>
  );
}
