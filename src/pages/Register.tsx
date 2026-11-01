import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

function friendlyMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/popup-closed-by-user":
        return "Google sign-in was cancelled.";
      case "auth/popup-blocked":
        return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized for Google sign-in. Contact support.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email. Log in using its existing sign-in method.";
      case "auth/user-disabled":
        return "This account has been disabled. Contact support.";
      case "auth/network-request-failed":
        return "Network problem. Check your connection.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/operation-not-allowed":
        return "Google sign-in is not enabled for this Firebase project.";
    }
  }
  return "Could not create an account with Google. Please try again.";
}

export default function Register() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleGoogleSignUp() {
    setError("");
    setLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      navigate("/dashboard");
    } catch (err) {
      setError(friendlyMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (authLoading) {
    return <p className="mx-auto mt-10 max-w-sm p-4 text-slate-600">Checking your account...</p>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto mt-10 max-w-sm p-4">
      <h1 className="mb-4 text-2xl font-bold">Create account</h1>
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full rounded border border-slate-300 p-2 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up with Google"}
        </button>
      {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
      <p className="mt-4 text-sm text-slate-600">
        Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Log in</Link>
      </p>
    </div>
  );
}
