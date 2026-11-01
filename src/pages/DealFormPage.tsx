import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listCustomers } from "../services/customerService";
import { createDeal, getDeal, updateDeal } from "../services/dealService";
import type { Customer, Deal, DealStage } from "../types";

type DealFormState = {
  title: string;
  customerId: string;
  stage: DealStage;
  amount: string;
  closeDate: string;
  notes: string;
};

const emptyForm: DealFormState = {
  title: "",
  customerId: "",
  stage: "lead",
  amount: "",
  closeDate: "",
  notes: "",
};

const stageOptions: { value: DealStage; label: string }[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "proposal", label: "Proposal" },
  { value: "negotiation", label: "Negotiation" },
  { value: "won", label: "Won" },
  { value: "lost", label: "Lost" },
];

export default function DealFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [existingDeal, setExistingDeal] = useState<Deal | null>(null);
  const [form, setForm] = useState<DealFormState>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadFormData() {
      if (!user) {
        setError("You must be signed in to manage deals.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [customerResults, dealResult] = await Promise.all([
          listCustomers(user.uid),
          id ? getDeal(user.uid, id) : Promise.resolve(null),
        ]);

        if (!active) {
          return;
        }
        setCustomers(customerResults);
        if (id && !dealResult) {
          setError("Deal not found or you do not have permission to edit it.");
          return;
        }
        if (dealResult) {
          setExistingDeal(dealResult);
          setForm({
            title: dealResult.title,
            customerId: dealResult.customerId,
            stage: dealResult.stage,
            amount: String(dealResult.amount),
            closeDate: dealResult.closeDate ?? "",
            notes: dealResult.notes ?? "",
          });
        } else {
          setExistingDeal(null);
          setForm({
            ...emptyForm,
            customerId: customerResults[0]?.id ?? "",
          });
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load deal form: ${loadError.message}`
              : "Could not load deal form. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadFormData();
    return () => {
      active = false;
    };
  }, [id, user]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user) {
      setError("You must be signed in to save a deal.");
      return;
    }

    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      setError("Enter a valid deal amount greater than or equal to zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const deal = {
        title: form.title.trim(),
        customerId: form.customerId,
        stage: form.stage,
        amount,
        closeDate: form.closeDate || undefined,
        notes: form.notes.trim() || undefined,
      };
      if (id) {
        await updateDeal(user.uid, id, deal);
      } else {
        await createDeal(user.uid, deal);
      }
      navigate("/deals");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Could not save deal: ${saveError.message}`
          : "Could not save deal. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            {existingDeal ? "Edit deal" : "Add deal"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">Record the opportunity and keep its pipeline details up to date.</p>
        </div>
        <Link to="/deals" className="text-sm font-medium text-slate-600 hover:text-slate-500">
          Back to deals
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        {error && (
          <p role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}
        {loading ? (
          <p className="py-8 text-center text-sm text-slate-500">Loading deal...</p>
        ) : (
          <>
            {customers.length === 0 && (
              <div className="mb-5 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                Create a customer before adding a deal.{" "}
                <Link to="/customers/new" className="font-semibold underline">
                  Add customer
                </Link>
              </div>
            )}
            <div className="grid gap-5 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Deal name</span>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  required
                  maxLength={120}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Customer</span>
                <select
                  name="customerId"
                  value={form.customerId}
                  onChange={handleChange}
                  required
                  disabled={customers.length === 0}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400 disabled:bg-slate-100"
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}{customer.company ? ` — ${customer.company}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Stage</span>
                <select
                  name="stage"
                  value={form.stage}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
                >
                  {stageOptions.map((stage) => (
                    <option key={stage.value} value={stage.value}>{stage.label}</option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Amount</span>
                <input
                  type="number"
                  name="amount"
                  value={form.amount}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  required
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-sm font-medium text-slate-700">Expected close date</span>
                <input
                  type="date"
                  name="closeDate"
                  value={form.closeDate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
                />
              </label>

              <label className="block md:col-span-2">
                <span className="mb-1 block text-sm font-medium text-slate-700">Notes</span>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={handleChange}
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-sky-400"
                />
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Link
                to="/deals"
                className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving || customers.length === 0 || Boolean(id && !existingDeal)}
                className="rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? "Saving..." : existingDeal ? "Save changes" : "Create deal"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
