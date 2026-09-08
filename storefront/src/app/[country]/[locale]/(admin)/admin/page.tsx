"use client";

import {
  AlertCircle,
  Boxes,
  Database,
  DollarSign,
  Eye,
  EyeOff,
  LogOut,
  Package,
  RefreshCw,
  Search,
  ShieldCheck,
  ShoppingBag,
  Store,
  Users,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { extractBasePath } from "@/lib/utils/path";

interface AdminStats {
  revenue: number;
  orders_count: number;
  products_count: number;
  users_count: number;
  recent_orders: Array<{
    number: string;
    email: string;
    total: string;
    currency: string;
    state: string;
    completed_at: string;
  }>;
}

interface AdminOrder {
  id: number;
  number: string;
  email: string;
  total: string;
  currency: string;
  state: string;
  payment_state: string;
  shipment_state: string;
  items_count: number;
  items: Array<{ name?: string; quantity?: number }>;
  completed_at: string;
}

interface AdminInventoryItem {
  product_id: number;
  product_name: string;
  slug: string;
  price: string;
  thumbnail_url: string;
  variant_id: number;
  sku: string;
  size_option: string;
  count_on_hand: number;
}

interface AdminCustomer {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  orders_count: number;
  lifetime_spend: number;
  created_at: string;
}

export default function AdminConsolePage() {
  const { user, login, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const basePath = extractBasePath(pathname);

  // Admin login form state
  const [adminEmail, setAdminEmail] = useState("admin@mirzafootwear.com");
  const [adminPassword, setAdminPassword] = useState("MirzaAdmin2026!");
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Dashboard active tab: 'overview' | 'orders' | 'inventory' | 'customers'
  const [activeTab, setActiveTab] = useState<
    "overview" | "orders" | "inventory" | "customers"
  >("overview");

  // Live data states
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [inventory, setInventory] = useState<AdminInventoryItem[]>([]);
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);

  const apiHost =
    process.env.NEXT_PUBLIC_SPREE_API_HOST ||
    "https://backend-two-eta-91.vercel.app";

  const fetchAdminData = useCallback(async () => {
    setDataLoading(true);
    try {
      const [statsRes, ordersRes, invRes, custRes] = await Promise.all([
        fetch(`${apiHost}/api/v3/admin/stats`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${apiHost}/api/v3/admin/orders`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${apiHost}/api/v3/admin/inventory`)
          .then((r) => r.json())
          .catch(() => null),
        fetch(`${apiHost}/api/v3/admin/customers`)
          .then((r) => r.json())
          .catch(() => null),
      ]);

      if (statsRes) setStats(statsRes);
      if (ordersRes?.data) setOrders(ordersRes.data);
      if (invRes?.data) setInventory(invRes.data);
      if (custRes?.data) setCustomers(custRes.data);
    } catch (err) {
      console.error("Failed to load admin data:", err);
    } finally {
      setDataLoading(false);
    }
  }, [apiHost]);

  useEffect(() => {
    if (user?.role === "admin") {
      void fetchAdminData();
    }
  }, [user?.role, fetchAdminData]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError(null);
    try {
      const res = await login(adminEmail, adminPassword);
      if (!res.success) {
        setLoginError(res.error || "Invalid admin credentials");
      }
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleStockUpdate = async (variantId: number, delta: number) => {
    const current = inventory.find((i) => i.variant_id === variantId);
    if (!current) return;
    const newCount = Math.max(0, current.count_on_hand + delta);

    // Optimistic UI update
    setInventory((prev) =>
      prev.map((item) =>
        item.variant_id === variantId
          ? { ...item, count_on_hand: newCount }
          : item,
      ),
    );

    setUpdatingId(variantId);
    try {
      await fetch(`${apiHost}/api/v3/admin/inventory/${variantId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count_on_hand: newCount }),
      });
    } catch (err) {
      console.error("Failed to update stock:", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleOrderStatusUpdate = async (
    orderNumber: string,
    newState: string,
  ) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.number === orderNumber ? { ...o, state: newState } : o,
      ),
    );
    try {
      await fetch(`${apiHost}/api/v3/admin/orders/${orderNumber}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: newState }),
      });
    } catch (err) {
      console.error("Failed to update order state:", err);
    }
  };

  // If not logged in as Admin, show the Admin Login Gate
  if (!authLoading && user?.role !== "admin") {
    return (
      <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-stone-50/50">
        <div className="max-w-md w-full space-y-6">
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-amber-900/10 border border-amber-900/20 flex items-center justify-center text-amber-900 mb-4 shadow-sm">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 tracking-tight">
              Mirza Footwear Admin
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              Authorized personnel access to live store inventory, orders, and
              database.
            </p>
          </div>

          <Card className="border-gray-200/80 shadow-md bg-white">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Administrator Sign In</CardTitle>
              <CardDescription>
                Sign in with your seeded administrator credentials.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loginError && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Admin Email
                  </label>
                  <Input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    required
                    placeholder="admin@mirzafootwear.com"
                    className="h-11 border-gray-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      required
                      placeholder="••••••••••••"
                      className="h-11 pr-10 border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-lg text-xs text-amber-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-amber-700" />
                    Supabase Mumbai Seeded Admin:
                  </p>
                  <p className="font-mono text-[11px] text-amber-800">
                    Email:{" "}
                    <span className="font-bold">admin@mirzafootwear.com</span>
                  </p>
                  <p className="font-mono text-[11px] text-amber-800">
                    Pass: <span className="font-bold">MirzaAdmin2026!</span>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full h-11 bg-stone-900 hover:bg-stone-800 text-white font-medium"
                >
                  {loginLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  Access Admin Console
                </Button>
              </form>

              <div className="mt-4 pt-4 border-t border-gray-100 text-center">
                <Link
                  href={`${basePath}/`}
                  className="text-xs text-gray-500 hover:text-gray-900 transition-colors inline-flex items-center gap-1"
                >
                  ← Return to Storefront
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Filtered lists for search
  const filteredOrders = orders.filter(
    (o) =>
      o.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredInventory = inventory.filter(
    (i) =>
      i.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.sku.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCustomers = customers.filter(
    (c) =>
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${c.first_name} ${c.last_name}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="min-h-screen bg-stone-50/50 pb-16">
      {/* Top Admin Bar */}
      <header className="bg-stone-900 text-white sticky top-0 z-40 border-b border-stone-800 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-600 flex items-center justify-center font-serif font-bold text-white shadow-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-base sm:text-lg tracking-wider uppercase">
                  Mirza Admin Console
                </span>
                <span className="hidden sm:inline-flex text-[10px] font-semibold tracking-wider uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Live Production
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-stone-300 bg-stone-800/80 px-3 py-1.5 rounded-lg border border-stone-700">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Supabase Mumbai (PostgreSQL)</span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              disabled={dataLoading}
              className="text-stone-900 border-stone-700 hover:bg-stone-800 hover:text-white h-9"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 mr-1.5 ${dataLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Link href={`${basePath}/`} target="_blank">
              <Button
                variant="outline"
                size="sm"
                className="text-stone-900 border-stone-700 hover:bg-stone-800 hover:text-white h-9"
              >
                <Store className="w-3.5 h-3.5 mr-1.5" />
                Storefront
              </Button>
            </Link>

            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                router.replace(`${basePath}/account`);
              }}
              className="text-stone-400 hover:text-white hover:bg-stone-800 h-9"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Admin Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-stone-200 pb-4 mb-8">
          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "overview"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <Boxes className="w-4 h-4" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "orders"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("inventory")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "inventory"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <Package className="w-4 h-4" />
              Inventory ({inventory.length})
            </button>
            <button
              onClick={() => setActiveTab("customers")}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${
                activeTab === "customers"
                  ? "bg-stone-900 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              <Users className="w-4 h-4" />
              Customers ({customers.length})
            </button>
          </div>

          {activeTab !== "overview" && (
            <div className="relative w-48 sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 h-9 text-xs bg-white border-stone-300"
              />
            </div>
          )}
        </div>

        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <Card className="bg-white border-stone-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Gross Revenue
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-serif font-bold text-stone-900">
                      ${stats?.revenue?.toFixed(2) || "0.00"}
                    </span>
                    <span className="block text-xs text-stone-500 mt-1">
                      From completed orders
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-stone-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Orders Processed
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-serif font-bold text-stone-900">
                      {stats?.orders_count ?? orders.length}
                    </span>
                    <span className="block text-xs text-stone-500 mt-1">
                      Total store orders
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-stone-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Catalog Models
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                      <Package className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-serif font-bold text-stone-900">
                      {stats?.products_count || 12}
                    </span>
                    <span className="block text-xs text-stone-500 mt-1">
                      Traditional & formal models
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-stone-200/80 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                      Registered Patrons
                    </span>
                    <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-3xl font-serif font-bold text-stone-900">
                      {stats?.users_count ?? customers.length}
                    </span>
                    <span className="block text-xs text-stone-500 mt-1">
                      In Supabase database
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Overview Table: Recent Orders */}
            <Card className="bg-white border-stone-200/80 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-lg font-serif">
                    Recent Store Orders
                  </CardTitle>
                  <CardDescription>
                    Live incoming customer transactions
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("orders")}
                  className="text-xs h-8"
                >
                  View All Orders →
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase font-semibold">
                        <th className="py-3 px-4">Order Number</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {(stats?.recent_orders || orders.slice(0, 5)).map(
                        (ord) => (
                          <tr key={ord.number} className="hover:bg-stone-50/80">
                            <td className="py-3 px-4 font-mono font-medium text-stone-900">
                              {ord.number}
                            </td>
                            <td className="py-3 px-4 text-stone-600">
                              {ord.email}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 capitalize">
                                {ord.state || "complete"}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-stone-500 text-xs">
                              {new Date(
                                ord.completed_at || Date.now(),
                              ).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 font-semibold text-stone-900 text-right">
                              ${parseFloat(ord.total || "0").toFixed(2)}
                            </td>
                          </tr>
                        ),
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 2. ORDERS TAB */}
        {activeTab === "orders" && (
          <Card className="bg-white border-stone-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">
                Customer Orders
              </CardTitle>
              <CardDescription>
                Full order lifecycle management directly connected to Supabase
                orders table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase font-semibold">
                      <th className="py-3 px-4">Order</th>
                      <th className="py-3 px-4">Customer Email</th>
                      <th className="py-3 px-4">Items</th>
                      <th className="py-3 px-4">Payment</th>
                      <th className="py-3 px-4">Fulfillment</th>
                      <th className="py-3 px-4">Order State</th>
                      <th className="py-3 px-4 text-right">Total</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td
                          colSpan={8}
                          className="py-8 text-center text-stone-500"
                        >
                          No orders found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((ord) => (
                        <tr key={ord.number} className="hover:bg-stone-50/80">
                          <td className="py-3 px-4 font-mono font-medium text-stone-900">
                            {ord.number}
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {ord.email}
                          </td>
                          <td className="py-3 px-4 text-stone-600">
                            {ord.items_count} item(s)
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {ord.payment_state || "paid"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              {ord.shipment_state || "ready"}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-800 capitalize">
                              {ord.state}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900 text-right">
                            ${parseFloat(ord.total || "0").toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            {ord.state !== "shipped" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOrderStatusUpdate(ord.number, "shipped")
                                }
                                className="h-7 text-xs bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                              >
                                Mark Shipped
                              </Button>
                            )}
                            {ord.state !== "canceled" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleOrderStatusUpdate(
                                    ord.number,
                                    "canceled",
                                  )
                                }
                                className="h-7 text-xs text-red-700 border-red-200 hover:bg-red-50"
                              >
                                Cancel
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 3. INVENTORY TAB */}
        {activeTab === "inventory" && (
          <Card className="bg-white border-stone-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">
                Product Inventory & Stock Management
              </CardTitle>
              <CardDescription>
                Live stock-on-hand tracking for all Mirza Footwear sizes and
                models. Changes persist immediately to Supabase Mumbai.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase font-semibold">
                      <th className="py-3 px-4">Product</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Size Variant</th>
                      <th className="py-3 px-4">Price</th>
                      <th className="py-3 px-4 text-center">In-Stock Status</th>
                      <th className="py-3 px-4 text-center">Stock On Hand</th>
                      <th className="py-3 px-4 text-right">
                        Quick Stock Adjustment
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredInventory.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-stone-500"
                        >
                          No inventory items found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredInventory.map((item) => (
                        <tr
                          key={item.variant_id}
                          className="hover:bg-stone-50/80"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              {item.thumbnail_url && (
                                <Image
                                  src={item.thumbnail_url}
                                  alt={item.product_name}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 object-cover rounded-md border border-stone-200"
                                />
                              )}
                              <span className="font-medium text-stone-900">
                                {item.product_name}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-stone-600">
                            {item.sku}
                          </td>
                          <td className="py-3 px-4 text-stone-700 font-medium">
                            {item.size_option}
                          </td>
                          <td className="py-3 px-4 font-semibold text-stone-900">
                            ${parseFloat(item.price || "0").toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {item.count_on_hand > 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                In Stock
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Out of Stock
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-base text-stone-900">
                              {item.count_on_hand}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={
                                  item.count_on_hand <= 0 ||
                                  updatingId === item.variant_id
                                }
                                onClick={() =>
                                  handleStockUpdate(item.variant_id, -1)
                                }
                                className="h-7 w-7 p-0 text-stone-700 border-stone-300"
                              >
                                -1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === item.variant_id}
                                onClick={() =>
                                  handleStockUpdate(item.variant_id, 1)
                                }
                                className="h-7 w-7 p-0 text-stone-700 border-stone-300"
                              >
                                +1
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={updatingId === item.variant_id}
                                onClick={() =>
                                  handleStockUpdate(item.variant_id, 10)
                                }
                                className="h-7 px-2 text-xs text-stone-700 border-stone-300"
                              >
                                +10
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 4. CUSTOMERS TAB */}
        {activeTab === "customers" && (
          <Card className="bg-white border-stone-200/80 shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-serif">
                Registered Patrons & Accounts
              </CardTitle>
              <CardDescription>
                View all registered store users from the Supabase spree_users
                table.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-stone-200 text-stone-500 text-xs uppercase font-semibold">
                      <th className="py-3 px-4">User ID</th>
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Orders</th>
                      <th className="py-3 px-4 text-right">Joined Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filteredCustomers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="py-8 text-center text-stone-500"
                        >
                          No customer accounts found matching your search.
                        </td>
                      </tr>
                    ) : (
                      filteredCustomers.map((cust) => (
                        <tr key={cust.id} className="hover:bg-stone-50/80">
                          <td className="py-3 px-4 font-mono text-xs text-stone-500">
                            #{cust.id}
                          </td>
                          <td className="py-3 px-4 font-medium text-stone-900">
                            {cust.first_name} {cust.last_name}
                          </td>
                          <td className="py-3 px-4 text-stone-600 font-mono text-xs">
                            {cust.email}
                          </td>
                          <td className="py-3 px-4">
                            {cust.role === "admin" ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                                Administrator
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
                                Customer
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-stone-600 text-xs">
                            {cust.phone || "—"}
                          </td>
                          <td className="py-3 px-4 text-stone-900 font-medium">
                            {cust.orders_count || 0} order(s)
                          </td>
                          <td className="py-3 px-4 text-stone-500 text-xs text-right">
                            {new Date(
                              cust.created_at || Date.now(),
                            ).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
