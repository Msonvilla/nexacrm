import { useState, type FormEvent } from "react";
import { FirebaseError } from "firebase/app";
import { sendPasswordResetEmail } from "firebase/auth";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

function resetErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/user-not-found":
        return "No account was found for that email address.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network problem. Check your connection and try again.";
    }
  }
  return "Could not send the password reset email. Please try again.";
}

export default function ForgotPassword() {
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSent(false);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (resetError) {
      setError(resetErrorMessage(resetError));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p className="font-inter min-h-screen bg-blue-50 p-8 text-center text-gray-600">Checking your account...</p>;
  }
  if (user?.emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="font-inter flex min-h-screen items-center justify-center bg-blue-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-2 text-2xl font-bold text-gray-900">Reset your password</h1>
      <p className="mb-5 text-sm text-gray-600">We’ll email you a link to choose a new password.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="reset-email">Email</label>
        <input
          id="reset-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-gray-900 outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
      </form>
      {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      {sent && (
        <p role="status" className="mt-3 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          If an account uses this email, a password reset link has been sent.
        </p>
      )}
      <Link to="/login" className="mt-5 inline-block text-sm text-blue-700 hover:underline">
        Back to login
      </Link>
      </section>
    </div>
  );
}
