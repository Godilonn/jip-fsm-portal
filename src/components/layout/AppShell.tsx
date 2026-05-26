import React from "react";
import Header from "./Header";
import RbacDock from "./RbacDock";
import Footer from "./Footer";
import ToastContainer from "./ToastContainer";
import MobileMenu from "./MobileMenu";
import { useApp } from "../../store/AppContext";

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const { mobileMenuOpen, setMobileMenuOpen } = useApp();

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* RBAC dock — dark bar at the very top */}
      <RbacDock />

      {/* Header — sticky nav */}
      <Header />

      {/* Mobile slide-out menu */}
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      {/* Main content */}
      <main className="flex-1 max-w-screen-2xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Footer */}
      <Footer />

      {/* Floating toasts */}
      <ToastContainer />
    </div>
  );
}
