import { useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

function emailLoginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/invalid-credential":
      case "auth/user-not-found":
      case "auth/wrong-password":
        return "Email or password is incorrect.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network problem. Check your connection and try again.";
      case "auth/operation-not-allowed":
        return "Email and password sign-in is not enabled for this Firebase project.";
    }
  }
  return "Could not sign in. Please try again.";
}

function loginErrorMessage(error: unknown) {
  if (error instanceof FirebaseError) {
    switch (error.code) {
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for Google sign-in. Contact support.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network problem. Check your connection and try again.";
      case "auth/operation-not-allowed":
        return "Google sign-in is not enabled for this Firebase project.";
    }
  }
  return "Could not sign in with Google. Please try again.";
}

export default function Login() {
  const navigate  = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationNotice] = useState(() => {
    const message = (location.state as { message?: unknown } | null)?.message;
    return typeof message === "string" ? message : "";
  });

  async function handleEmailSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (loginError) {
      setError(emailLoginErrorMessage(loginError));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/dashboard");
    } catch (loginError) {
      setError(loginErrorMessage(loginError));
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
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Log in</h1>
      {verificationNotice && (
        <p role="status" className="mb-3 rounded border border-slate-200 bg-slate-50 p-3 text-sm text-gray-600">
          {verificationNotice}
        </p>
      )}
      <form onSubmit={handleEmailSignIn} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-gray-900 outline-none focus:border-gray-400"
        />
        <label className="text-sm font-medium text-gray-700" htmlFor="login-password">Password</label>
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="current-password"
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-gray-900 outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Log in"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-sm text-gray-600">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
      {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
      <div className="mt-5 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-blue-700 hover:underline">Forgot password?</Link>
        <Link to="/register" className="text-blue-700 hover:underline">Create account</Link>
      </div>
      </section>
    </div>
  );
}
