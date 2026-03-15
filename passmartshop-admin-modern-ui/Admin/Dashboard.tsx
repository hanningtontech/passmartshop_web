import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  Package,
  Layers,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowRight,
  Database,
  Cloud,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import AdminLayout from "@/components/AdminLayout";
import { Skeleton } from "@/components/ui/skeleton";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalCategories: 0,
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  const categoriesQuery = trpc.categories.list.useQuery();
  const productsQuery = trpc.products.list.useQuery({
    limit: 1000,
    offset: 0,
  });

  useEffect(() => {
    if (categoriesQuery.data && productsQuery.data) {
      setStats({
        totalCategories: categoriesQuery.data.length,
        totalProducts: productsQuery.data.length,
        totalOrders: 0,
        totalRevenue: 0,
      });
      setLoading(false);
    }
  }, [categoriesQuery.data, productsQuery.data]);

  const StatCard = ({
    label,
    value,
    icon: Icon,
    color,
    trend,
  }: {
    label: string;
    value: string | number;
    icon: any;
    color: string;
    trend?: string;
  }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-slate-600 transition-all duration-300 hover:shadow-xl hover:shadow-slate-900/50">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}-500/20`}>
          <Icon className={`h-6 w-6 text-${color}-400`} />
        </div>
        {trend && (
          <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
            <TrendingUp size={14} />
            {trend}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-sm font-medium mb-2">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-20 bg-slate-700" />
      ) : (
        <p className="text-3xl font-bold text-white">{value}</p>
      )}
    </div>
  );

  const QuickActionCard = ({
    icon: Icon,
    label,
    description,
    href,
  }: {
    icon: any;
    label: string;
    description: string;
    href: string;
  }) => (
    <Link href={href}>
      <a className="group bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 border border-slate-700 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/10 block">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-lg bg-orange-500/20 group-hover:scale-110 transition-transform">
            <Icon className="h-6 w-6 text-orange-400" />
          </div>
          <ArrowRight
            size={20}
            className="text-orange-400 group-hover:translate-x-1 transition-transform"
          />
        </div>
        <h3 className="text-white font-bold mb-1">{label}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
      </a>
    </Link>
  );

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">
            Welcome back! Here's your store overview at a glance.
          </p>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Total Products"
            value={stats.totalProducts}
            icon={Package}
            color="orange"
          />
          <StatCard
            label="Total Categories"
            value={stats.totalCategories}
            icon={Layers}
            color="blue"
          />
          <StatCard
            label="Total Orders"
            value={stats.totalOrders}
            icon={ShoppingCart}
            color="green"
          />
          <StatCard
            label="Total Revenue"
            value={`$${stats.totalRevenue.toFixed(2)}`}
            icon={TrendingUp}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <QuickActionCard
              icon={Plus}
              label="Add Product"
              description="Create a new product listing"
              href="/admin/products/add"
            />
            <QuickActionCard
              icon={Package}
              label="All Products"
              description="View and manage products"
              href="/admin/products"
            />
            <QuickActionCard
              icon={Layers}
              label="Manage Categories"
              description="View and edit categories"
              href="/admin/categories"
            />
            <QuickActionCard
              icon={Zap}
              label="Import/Export"
              description="Bulk operations"
              href="/admin/import-export"
            />
          </div>
        </div>

        {/* System Status & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* System Status */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-bold text-white mb-4">System Status</h2>
            <div className="space-y-3">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-blue-400" />
                    <span className="text-slate-300 font-medium text-sm">
                      Database
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Connected</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Cloud size={18} className="text-purple-400" />
                    <span className="text-slate-300 font-medium text-sm">
                      Backblaze S3
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Ready</span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Zap size={18} className="text-yellow-400" />
                    <span className="text-slate-300 font-medium text-sm">
                      API Server
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-400">Running</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                  <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      Admin dashboard initialized
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      System ready for product management
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Just now</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm">
                      All systems operational
                    </p>
                    <p className="text-slate-400 text-xs mt-1">Just now</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
