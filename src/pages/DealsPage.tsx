import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listCustomers } from "../services/customerService";
import { deleteDeal, listDeals } from "../services/dealService";
import type { Customer, Deal, DealStage } from "../types";

const stages: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function DealsPage() {
  const { user } = useAuth();
  const [deals, setDeals] = useState<Deal[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setError("You must be signed in to view deals.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [dealResults, customerResults] = await Promise.all([
          listDeals(user.uid),
          listCustomers(user.uid),
        ]);
        if (active) {
          setDeals(dealResults);
          setCustomers(customerResults);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load deals: ${loadError.message}`
              : "Could not load deals. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [user]);

  const customerNames = useMemo(
    () => new Map(customers.map((customer) => [
      customer.id,
      `${customer.firstName} ${customer.lastName}`,
    ])),
    [customers],
  );

  const filteredDeals = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return deals;
    }
    return deals.filter((deal) =>
      `${deal.title} ${customerNames.get(deal.customerId) ?? ""} ${deal.stage}`
        .toLowerCase()
        .includes(term),
    );
  }, [customerNames, deals, search]);

  const pipelineValue = filteredDeals
    .filter((deal) => deal.stage !== "won" && deal.stage !== "lost")
    .reduce((total, deal) => total + deal.amount, 0);

  async function handleDelete(deal: Deal) {
    if (!user || !window.confirm(`Delete "${deal.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(deal.id);
    setError("");
    try {
      await deleteDeal(user.uid, deal.id);
      setDeals((current) => current.filter((item) => item.id !== deal.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Could not delete deal: ${deleteError.message}`
          : "Could not delete deal. Please try again.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Deals</h1>
          <p className="mt-2 text-sm text-gray-600">Track opportunities from first contact to close.</p>
        </div>
        <Link
          to="/deals/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          New deal
        </Link>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <label className="block w-full sm:max-w-md">
          <span className="mb-1 block text-sm font-medium text-gray-700">Search deals</span>
          <input
            type="search"
            placeholder="Deal, customer, or stage"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-gray-700 outline-none transition focus:border-gray-400 focus:bg-white"
          />
        </label>
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.12em] text-gray-600">Open pipeline</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">${pipelineValue.toLocaleString()}</p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        {stages.map((stage) => {
          const stageDeals = filteredDeals.filter((deal) => deal.stage === stage.value);
          const total = stageDeals.reduce((sum, deal) => sum + deal.amount, 0);
          return (
            <section key={stage.value} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-4 flex items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold text-gray-900">{stage.label}</h2>
                  <p className="text-xs text-gray-600">{stageDeals.length} deals · ${total.toLocaleString()}</p>
                </div>
                <span className="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                  {stageDeals.length}
                </span>
              </div>
              <div className="space-y-3">
                {stageDeals.map((deal) => (
                  <article key={deal.id} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="break-words font-medium text-gray-900">{deal.title}</h3>
                        <p className="mt-1 text-sm text-gray-600">
                          {customerNames.get(deal.customerId) ?? "Customer unavailable"}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <Link
                          to={`/deals/${deal.id}/edit`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => void handleDelete(deal)}
                          disabled={deletingId === deal.id}
                          className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                        >
                          {deletingId === deal.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                      <span className="font-semibold text-gray-900">${deal.amount.toLocaleString()}</span>
                      <span className="text-xs text-gray-600">
                        {deal.closeDate ? `Close ${deal.closeDate}` : "No close date"}
                      </span>
                    </div>
                  </article>
                ))}
                {!loading && stageDeals.length === 0 && (
                  <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-gray-600">
                    No deals in this stage.
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {loading && <p className="text-center text-sm text-gray-600">Loading deals...</p>}
      {!loading && !error && filteredDeals.length === 0 && (
        <p className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-gray-600">
          {search.trim() ? "No deals match your search." : "No deals yet. Create your first deal to get started."}
        </p>
      )}
    </div>
  );
}
