import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { deleteCustomer, listCustomers } from "../services/customerService";
import type { Customer } from "../types";

const statusStyles: Record<Customer["status"], string> = {
  new: "bg-sky-100 text-sky-700",
  active: "bg-emerald-100 text-emerald-700",
  inactive: "bg-slate-200 text-slate-700",
  "at-risk": "bg-amber-100 text-amber-700",
};

export default function CustomersPage() {
  const { user } = useAuth();
  const [customerList, setCustomerList] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCustomers() {
      if (!user) {
        setError("You must be signed in to view customers.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const results = await listCustomers(user.uid);
        if (active) {
          setCustomerList(results);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load customers: ${loadError.message}`
              : "Could not load customers. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadCustomers();
    return () => {
      active = false;
    };
  }, [user]);

  const filteredCustomers = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) {
      return customerList;
    }

    return customerList.filter((customer) => {
      const values = [
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.company ?? "",
      ].join(" ");

      return values.toLowerCase().includes(term);
    });
  }, [customerList, search]);

  async function handleDelete(customer: Customer) {
    if (!user || !window.confirm(`Delete ${customer.firstName} ${customer.lastName}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(customer.id);
    setError("");
    try {
      await deleteCustomer(user.uid, customer.id);
      setCustomerList((current) => current.filter((item) => item.id !== customer.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete customer. Please try again.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Customers</h1>
          <p className="mt-2 text-sm text-slate-600">Track prospects, active clients, and renewal opportunities.</p>
        </div>

        <Link
          to="/customers/new"
          className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          New customer
        </Link>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <input
          type="search"
          placeholder="Search customers"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-sky-400 focus:bg-white"
        />
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Company</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Value</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {loading && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-sm text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              )}
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {customer.firstName} {customer.lastName}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{customer.company ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-slate-600">{customer.email}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[customer.status]}`}>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    {customer.value ? `$${customer.value.toLocaleString()}` : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Link to={`/customers/${customer.id}/edit`} className="text-sm font-medium text-sky-600 hover:text-sky-500">
                        Edit
                      </Link>
                      <button
                        type="button"
                        onClick={() => void handleDelete(customer)}
                        disabled={deletingId === customer.id}
                        className="text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                      >
                        {deletingId === customer.id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!loading && !error && filteredCustomers.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-500">
            {search.trim() ? "No customers match your search." : "No customers yet. Create one to get started."}
          </div>
        )}
      </div>
    </div>
  );
}
