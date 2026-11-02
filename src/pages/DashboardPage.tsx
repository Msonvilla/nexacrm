import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "../auth/AuthContext";
import { listRecentActivities } from "../services/activityService";
import { listCustomers } from "../services/customerService";
import { listDeals } from "../services/dealService";
import { listTasks } from "../services/taskService";
import type { ActivityItem, Customer, Deal, DealStage, TaskRecord } from "../types";

type DashboardData = {
  customers: Customer[];
  deals: Deal[];
  tasks: TaskRecord[];
  activities: ActivityItem[];
}

const dealStages: { stage: DealStage; label: string; color: string }[] = [
  { stage: "lead", label: "Lead", color: "#0ea5e9" },
  { stage: "qualified", label: "Qualified", color: "#0284c7" },
  { stage: "proposal", label: "Proposal", color: "#0369a1" },
  { stage: "negotiation", label: "Negotiation", color: "#075985" },
  { stage: "won", label: "Won", color: "#16a34a" },
  { stage: "lost", label: "Lost", color: "#94a3b8" },
];

function formatCompactCurrency(value: number) {
  return `$${new Intl.NumberFormat(undefined, {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value)}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData>({
    customers: [],
    deals: [],
    tasks: [],
    activities: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      if (!user) {
        setError("You must be signed in to view the dashboard.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [customers, deals, tasks, activities] = await Promise.all([
          listCustomers(user.uid),
          listDeals(user.uid),
          listTasks(user.uid),
          listRecentActivities(user.uid),
        ]);
        if (active) {
          setData({ customers, deals, tasks, activities });
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load dashboard data: ${loadError.message}`
              : "Could not load dashboard data. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadDashboard();
    return () => {
      active = false;
    };
  }, [user]);

  const customerNames = useMemo(
    () => new Map(data.customers.map((customer) => [
      customer.id,
      `${customer.firstName} ${customer.lastName}`,
    ])),
    [data.customers],
  );
  const openDeals = data.deals.filter((deal) => deal.stage !== "won" && deal.stage !== "lost");
  const openTasks = data.tasks.filter((task) => task.status !== "done");
  const pipelineValue = openDeals.reduce((sum, deal) => sum + deal.amount, 0);
  const wonValue = data.deals
    .filter((deal) => deal.stage === "won")
    .reduce((sum, deal) => sum + deal.amount, 0);
  const dealStageValues = dealStages.map(({ stage, label, color }) => ({
    stage: label,
    value: data.deals
      .filter((deal) => deal.stage === stage)
      .reduce((sum, deal) => sum + deal.amount, 0),
    color,
  }));

  const summaryCards = [
    { label: "Customers", value: String(data.customers.length), detail: "Your customer records" },
    { label: "Open pipeline", value: `$${pipelineValue.toLocaleString()}`, detail: `${openDeals.length} deals in progress` },
    { label: "Open tasks", value: String(openTasks.length), detail: "Tasks still to complete" },
    { label: "Won deals", value: `$${wonValue.toLocaleString()}`, detail: "Total value of won deals" },
  ];

  const recentCustomers = [...data.customers]
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
    .slice(0, 4);
  const upcomingTasks = [...openTasks]
    .sort((first, second) => {
      if (!first.dueDate) return 1;
      if (!second.dueDate) return -1;
      return first.dueDate.localeCompare(second.dueDate);
    })
    .slice(0, 4);
  const recentDeals = [...data.deals]
    .sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="mt-2 text-sm text-slate-600">A live snapshot of your sales pipeline and customer work.</p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{loading ? "—" : card.value}</p>
            <p className="mt-2 text-xs text-slate-500">{card.detail}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
          Loading dashboard...
        </p>
      ) : (
        <>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Deal value by stage</h2>
              <p className="mt-1 text-sm text-slate-500">A breakdown of your sales pipeline and closed deals.</p>
            </div>
            {data.deals.length === 0 && (
              <p className="mb-4 rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">
                No deals yet. Add a deal to see values in the chart.
              </p>
            )}
            <div className="h-72 min-w-0 w-full" role="img" aria-label="Deal value by stage chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dealStageValues}
                  layout="vertical"
                  margin={{ top: 8, right: 12, bottom: 4, left: 8 }}
                >
                  <CartesianGrid stroke="#e2e8f0" horizontal={false} />
                  <XAxis
                    type="number"
                    tickFormatter={(value: number) => formatCompactCurrency(value)}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="stage"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#64748b", fontSize: 12 }}
                    width={92}
                  />
                  <Tooltip
                    formatter={(value) => [`$${Number(value).toLocaleString()}`, "Deal value"]}
                    cursor={{ fill: "#f1f5f9" }}
                  />
                  <Bar dataKey="value" name="Deal value" radius={[0, 4, 4, 0]}>
                    {dealStageValues.map((entry) => (
                      <Cell key={entry.stage} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Recently updated customers</h2>
                <Link to="/customers" className="text-sm font-medium text-sky-600 hover:text-sky-500">
                  View all
                </Link>
              </div>
              {recentCustomers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  No customers yet. <Link to="/customers/new" className="font-medium text-sky-600">Add a customer</Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {recentCustomers.map((customer) => (
                    <div key={customer.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-900">
                          {customer.firstName} {customer.lastName}
                        </p>
                        <p className="truncate text-sm text-slate-500">{customer.company ?? customer.email}</p>
                      </div>
                      <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium capitalize text-slate-700">
                        {customer.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">Upcoming tasks</h2>
                <Link to="/tasks" className="text-sm font-medium text-sky-600 hover:text-sky-500">
                  View all
                </Link>
              </div>
              {upcomingTasks.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                  No open tasks. <Link to="/tasks/new" className="font-medium text-sky-600">Add a task</Link>
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingTasks.map((task) => (
                    <div key={task.id} className="rounded-lg border border-slate-200 p-3">
                      <p className="font-medium text-slate-900">{task.title}</p>
                      <div className="mt-2 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <span className="truncate">
                          {task.relatedCustomerId
                            ? customerNames.get(task.relatedCustomerId) ?? "Customer unavailable"
                            : "No customer linked"}
                        </span>
                        <span className="shrink-0">{task.dueDate ? `Due ${task.dueDate}` : "No due date"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Recently updated deals</h2>
              <Link to="/deals" className="text-sm font-medium text-sky-600 hover:text-sky-500">
                Manage deals
              </Link>
            </div>
            {recentDeals.length === 0 ? (
              <p className="rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                No deals yet. <Link to="/deals/new" className="font-medium text-sky-600">Add a deal</Link>
              </p>
            ) : (
              <div className="space-y-3">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-900">{deal.title}</p>
                      <p className="text-sm text-slate-500">
                        {customerNames.get(deal.customerId) ?? "Customer unavailable"} · <span className="capitalize">{deal.stage}</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="font-semibold text-slate-900">${deal.amount.toLocaleString()}</p>
                      <p className="text-xs text-slate-500">{deal.closeDate ? `Close ${deal.closeDate}` : "No close date"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
            {data.activities.length === 0 ? (
              <p className="mt-4 rounded-lg border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500">
                Activity will appear here as you create or update customers, deals, and tasks.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {data.activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{activity.message}</p>
                      <p className="mt-1 text-xs capitalize text-slate-500">
                        {activity.type.replaceAll("-", " ")}
                      </p>
                    </div>
                    <time
                      dateTime={activity.createdAt}
                      className="shrink-0 text-xs text-slate-500"
                    >
                      {new Date(activity.createdAt).toLocaleString()}
                    </time>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
