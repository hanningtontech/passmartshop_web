import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  BarChart3,
  Package,
  Layers,
  LogOut,
  Menu,
  X,
  Settings,
  FileUp,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { label: "Dashboard", path: "/admin", icon: BarChart3 },
    { label: "Categories", path: "/admin/categories", icon: Layers },
    { label: "Product Types", path: "/admin/product-types", icon: Settings },
    { label: "Products", path: "/admin/products", icon: Package },
    { label: "Import/Export", path: "/admin/import-export", icon: FileUp },
  ];

  const handleLogout = async () => {
    await logout();
    window.location.href = "/";
  };

  const isActive = (path: string) => location === path;

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } bg-gradient-to-b from-slate-900 to-slate-950 border-r border-slate-800 transition-all duration-300 flex flex-col shadow-2xl`}
      >
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-between px-4 border-b border-slate-800 bg-slate-900/50">
          {sidebarOpen && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                PS
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">Passmartshop</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
          >
            {sidebarOpen ? (
              <X size={20} className="text-slate-400" />
            ) : (
              <Menu size={20} className="text-slate-400" />
            )}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link key={item.path} href={item.path}>
                <a
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                    active
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {sidebarOpen && (
                    <>
                      <span className="flex-1 font-medium text-sm">
                        {item.label}
                      </span>
                      {active && (
                        <ChevronRight size={16} className="text-orange-400" />
                      )}
                    </>
                  )}
                </a>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="border-t border-slate-800 p-4 space-y-3 bg-slate-900/50">
          {sidebarOpen && user && (
            <div className="px-2 py-2 bg-slate-800/50 rounded-lg">
              <p className="text-xs text-slate-400">Logged in as</p>
              <p className="text-sm font-medium text-white truncate">
                {user.name || user.email || "Admin"}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors ${
              !sidebarOpen && "justify-center"
            }`}
          >
            <LogOut size={18} />
            {sidebarOpen && <span className="text-sm font-medium">Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between px-8 shadow-lg">
          <div>
            <h2 className="text-2xl font-bold text-white">
              passmartshop-admin
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Manage your store efficiently
            </p>
          </div>
          <Link href="/">
            <a className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg transition-colors border border-orange-500/30">
              <span className="text-sm font-medium">View Store</span>
              <ChevronRight size={16} />
            </a>
          </Link>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-slate-950">
          <div className="p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
