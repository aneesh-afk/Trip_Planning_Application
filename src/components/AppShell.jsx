import { useState } from "react";
import Navbar from "./Navbar";

export default function AppShell({ children }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-bg">
      <Navbar collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />
      <div
        className={`min-h-screen transition-[padding] duration-200 ${
          collapsed ? "lg:pl-[76px]" : "lg:pl-[220px]"
        }`}
      >
        {children}
      </div>
    </div>
  );
}
