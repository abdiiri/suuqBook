import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

export function useDashboardStats() {
  const { user, role } = useAuth();
  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async () => {
      const since = daysAgo(30).toISOString();

      const [productsRes, salesRes, customersRes, suppliersRes] = await Promise.all([
        supabase.from("products").select("id,name,stock,low_stock_threshold,buy_price,sell_price"),
        supabase
          .from("sales")
          .select(
            "id,qty,unit_price,discount,total,commission_amount,employee_id,created_at,product_id,products(name,buy_price)",
          )
          .gte("created_at", since)
          .order("created_at", { ascending: false }),
        supabase.from("customers").select("id,balance"),
        supabase.from("suppliers").select("id"),
      ]);

      if (productsRes.error) throw productsRes.error;
      if (salesRes.error) throw salesRes.error;
      if (customersRes.error) throw customersRes.error;
      if (suppliersRes.error) throw suppliersRes.error;

      const products = productsRes.data ?? [];
      const sales = (salesRes.data ?? []) as Array<{
        id: string;
        qty: number;
        unit_price: number;
        discount: number;
        total: number;
        commission_amount: number;
        employee_id: string;
        created_at: string;
        product_id: string;
        products: { name: string; buy_price: number } | null;
      }>;
      const customers = customersRes.data ?? [];
      const suppliers = suppliersRes.data ?? [];

      const today = startOfDay(new Date());
      const todaySales = sales.filter((s) => new Date(s.created_at) >= today);
      const todaysSales = todaySales.reduce((a, s) => a + Number(s.total), 0);
      const todaysProfit = todaySales.reduce((a, s) => {
        const cost = (s.products?.buy_price ?? 0) * s.qty;
        return a + (Number(s.total) - cost);
      }, 0);

      const stockValue = products.reduce((a, p) => a + p.stock * Number(p.buy_price), 0);
      const lowStock = products.filter((p) => p.stock <= p.low_stock_threshold);
      const amountOwed = customers.reduce((a, c) => a + Number(c.balance), 0);

      // Commission — "mine" for an employee, team-wide for an owner.
      const myCommissionToday = user
        ? todaySales.filter((s) => s.employee_id === user.id).reduce((a, s) => a + Number(s.commission_amount), 0)
        : 0;
      const myCommissionWindow = user
        ? sales.filter((s) => s.employee_id === user.id).reduce((a, s) => a + Number(s.commission_amount), 0)
        : 0;
      const teamCommissionToday = todaySales.reduce((a, s) => a + Number(s.commission_amount), 0);
      const teamCommissionWindow = sales.reduce((a, s) => a + Number(s.commission_amount), 0);

      let commissionByEmployee: { employeeId: string; name: string; amount: number }[] = [];
      if (role === "business_owner" || role === "super_admin") {
        const byId = new Map<string, number>();
        for (const s of sales) {
          if (Number(s.commission_amount) <= 0) continue;
          byId.set(s.employee_id, (byId.get(s.employee_id) ?? 0) + Number(s.commission_amount));
        }
        const employeeIds = Array.from(byId.keys());
        if (employeeIds.length > 0) {
          const { data: names } = await supabase.from("profiles").select("id,full_name").in("id", employeeIds);
          const nameMap = new Map((names ?? []).map((n) => [n.id, n.full_name]));
          commissionByEmployee = employeeIds
            .map((id) => ({ employeeId: id, name: nameMap.get(id) || "Unknown", amount: byId.get(id) ?? 0 }))
            .sort((a, b) => b.amount - a.amount);
        }
      }

      // Last 7 days chart
      const salesChart = Array.from({ length: 7 }).map((_, i) => {
        const day = daysAgo(6 - i);
        const dayStart = startOfDay(day);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const total = sales
          .filter((s) => {
            const t = new Date(s.created_at);
            return t >= dayStart && t < dayEnd;
          })
          .reduce((a, s) => a + Number(s.total), 0);
        return { day: day.toLocaleDateString("en-KE", { weekday: "short" }), sales: total };
      });

      // Top selling (last 30 days)
      const soldByProduct = new Map<string, { name: string; sold: number }>();
      for (const s of sales) {
        const name = s.products?.name ?? "Unknown";
        const existing = soldByProduct.get(s.product_id) ?? { name, sold: 0 };
        existing.sold += s.qty;
        soldByProduct.set(s.product_id, existing);
      }
      const topSelling = Array.from(soldByProduct.values())
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 4);
      const maxSold = topSelling[0]?.sold ?? 1;

      const recentSales = sales.slice(0, 5).map((s) => ({
        id: s.id,
        product: s.products?.name ?? "Unknown",
        qty: s.qty,
        price: Number(s.unit_price),
        total: Number(s.total),
        time: new Date(s.created_at).toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" }),
      }));

      return {
        stats: {
          todaysSales,
          todaysProfit,
          amountOwed,
          stockValue,
          lowStockCount: lowStock.length,
          totalProducts: products.length,
          suppliers: suppliers.length,
          myCommissionToday,
          myCommissionWindow,
          teamCommissionToday,
          teamCommissionWindow,
        },
        salesChart,
        recentSales,
        topSelling: topSelling.map((t) => ({ ...t, pct: Math.round((t.sold / maxSold) * 100) })),
        lowStockItems: lowStock,
        commissionByEmployee,
      };
    },
  });
}

export function useMonthlyReport() {
  return useQuery({
    queryKey: ["monthly-report"],
    queryFn: async () => {
      const since = daysAgo(240).toISOString(); // ~8 months
      const [salesRes, purchasesRes] = await Promise.all([
        supabase
          .from("sales")
          .select("total,created_at,qty,product_id,products(buy_price)")
          .gte("created_at", since),
        supabase.from("purchases").select("total,created_at").gte("created_at", since),
      ]);
      if (salesRes.error) throw salesRes.error;
      if (purchasesRes.error) throw purchasesRes.error;

      const sales = (salesRes.data ?? []) as Array<{
        total: number;
        created_at: string;
        qty: number;
        product_id: string;
        products: { buy_price: number } | null;
      }>;
      const purchases = purchasesRes.data ?? [];

      const monthKey = (d: Date) => d.toLocaleDateString("en-KE", { month: "short" });
      const months: { m: string; sales: number }[] = [];
      for (let i = 7; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        months.push({ m: monthKey(d), sales: 0 });
      }
      for (const s of sales) {
        const m = monthKey(new Date(s.created_at));
        const bucket = months.find((x) => x.m === m);
        if (bucket) bucket.sales += Number(s.total);
      }

      const now = new Date();
      const thisMonthSales = sales.filter((s) => {
        const d = new Date(s.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const thisMonthPurchases = purchases.filter((p) => {
        const d = new Date(p.created_at);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });

      const totalSales = thisMonthSales.reduce((a, s) => a + Number(s.total), 0);
      const totalPurchases = thisMonthPurchases.reduce((a, p) => a + Number(p.total), 0);
      const totalProfit = thisMonthSales.reduce((a, s) => {
        const cost = (s.products?.buy_price ?? 0) * s.qty;
        return a + (Number(s.total) - cost);
      }, 0);

      return {
        monthly: months,
        summary: {
          totalSales,
          totalProfit,
          totalPurchases,
          netProfit: totalProfit,
        },
      };
    },
  });
}
