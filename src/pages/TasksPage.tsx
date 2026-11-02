import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listCustomers } from "../services/customerService";
import { deleteTask, listTasks, updateTask } from "../services/taskService";
import type { Customer, TaskRecord, TaskStatus } from "../types";

const statuses: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "All tasks" },
  { value: "todo", label: "To do" },
  { value: "in-progress", label: "In progress" },
  { value: "done", label: "Done" },
];

const statusStyles: Record<TaskStatus, string> = {
  todo: "bg-slate-100 text-gray-700",
  "in-progress": "bg-slate-100 text-gray-700",
  done: "bg-emerald-100 text-emerald-700",
};

export default function TasksPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState("");
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      if (!user) {
        setError("You must be signed in to view tasks.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const [taskResults, customerResults] = await Promise.all([
          listTasks(user.uid),
          listCustomers(user.uid),
        ]);
        if (active) {
          setTasks(taskResults);
          setCustomers(customerResults);
        }
      } catch (loadError) {
        if (active) {
          setError(
            loadError instanceof Error
              ? `Could not load tasks: ${loadError.message}`
              : "Could not load tasks. Please try again.",
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
  const visibleTasks = filter === "all" ? tasks : tasks.filter((task) => task.status === filter);

  async function changeStatus(task: TaskRecord, status: TaskStatus) {
    if (!user) return;
    setUpdatingId(task.id);
    setError("");
    try {
      const update = {
        title: task.title,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        relatedCustomerId: task.relatedCustomerId,
        status,
      };
      await updateTask(user.uid, task.id, update);
      setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? `Could not update task: ${updateError.message}`
          : "Could not update task. Please try again.",
      );
    } finally {
      setUpdatingId("");
    }
  }

  async function handleDelete(task: TaskRecord) {
    if (!user || !window.confirm(`Delete "${task.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(task.id);
    setError("");
    try {
      await deleteTask(user.uid, task.id);
      setTasks((current) => current.filter((item) => item.id !== task.id));
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? `Could not delete task: ${deleteError.message}`
          : "Could not delete task. Please try again.",
      );
    } finally {
      setDeletingId("");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Tasks</h1>
          <p className="mt-2 text-sm text-gray-600">Keep follow-ups and customer work moving forward.</p>
        </div>
        <Link
          to="/tasks/new"
          className="crm-button min-h-11 px-4 py-2.5 text-sm sm:min-h-10"
        >
          New task
        </Link>
      </div>

      <label className="block max-w-xs rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <span className="mb-1 block text-sm font-medium text-gray-700">Filter by status</span>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value as TaskStatus | "all")}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-gray-400"
        >
          {statuses.map((status) => (
            <option key={status.value} value={status.value}>{status.label}</option>
          ))}
        </select>
      </label>

      {error && (
        <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-8 text-center text-sm text-gray-600">Loading tasks...</p>
        ) : visibleTasks.length === 0 ? (
          <p className="p-8 text-center text-sm text-gray-600">
            {tasks.length === 0 ? "No tasks yet. Create a task to get started." : "No tasks in this status."}
          </p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {visibleTasks.map((task) => (
              <li key={task.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <h2 className="break-words font-semibold text-gray-900">{task.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                    <span>
                      {task.relatedCustomerId
                        ? customerNames.get(task.relatedCustomerId) ?? "Customer unavailable"
                        : "No customer linked"}
                    </span>
                    <span>{task.dueDate ? `Due ${task.dueDate}` : "No due date"}</span>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyles[task.status]}`}>
                    {task.status === "in-progress" ? "In progress" : task.status === "todo" ? "To do" : "Done"}
                  </span>
                  <select
                    aria-label={`Update status for ${task.title}`}
                    value={task.status}
                    disabled={updatingId === task.id || deletingId === task.id}
                    onChange={(event) => void changeStatus(task, event.target.value as TaskStatus)}
                    className="rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-gray-400 disabled:opacity-50"
                  >
                    {statuses.filter((status) => status.value !== "all").map((status) => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                  <Link to={`/tasks/${task.id}/edit`} className="crm-button min-h-9 px-3 py-1.5 text-sm">
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => void handleDelete(task)}
                    disabled={deletingId === task.id || updatingId === task.id}
                    className="crm-delete text-sm font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                  >
                    {deletingId === task.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
