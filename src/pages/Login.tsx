import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

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
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verificationNotice] = useState(() => {
    const message = (location.state as { message?: unknown } | null)?.message;
    return typeof message === "string" ? message : "";
  });

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
    return <p className="mx-auto mt-10 max-w-sm p-4 text-slate-600">Checking your account...</p>;
  }
  if (user?.emailVerified) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto mt-10 max-w-sm p-4">
      <h1 className="mb-4 text-2xl font-bold">Log in</h1>
      {verificationNotice && (
        <p role="status" className="mb-3 rounded border border-sky-200 bg-sky-50 p-3 text-sm text-sky-800">
          {verificationNotice}
        </p>
      )}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full rounded border border-slate-300 p-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Continue with Google"}
      </button>
      {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
      <div className="mt-4 flex justify-between text-sm">
        <Link to="/forgot-password" className="text-blue-700 hover:underline">Forgot password?</Link>
        <Link to="/register" className="text-blue-700 hover:underline">Create account</Link>
      </div>
    </div>
  );
}
