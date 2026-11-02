import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { FirebaseError } from "firebase/app";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { useAuth } from "../auth/AuthContext";
import { auth } from "../firebase";

function emailSignUpErrorMessage(err: unknown) {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "Enter a valid email address.";
      case "auth/email-already-in-use":
        return "An account already exists with this email. Log in instead.";
      case "auth/weak-password":
        return "Choose a stronger password with at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Wait a moment and try again.";
      case "auth/network-request-failed":
        return "Network problem. Check your connection.";
      case "auth/operation-not-allowed":
        return "Email and password sign-up is not enabled for this Firebase project.";
    }
  }
  return "Could not create your account. Please try again.";
}

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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEmailSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      setError(emailSignUpErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

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
    return <p className="font-inter min-h-screen bg-blue-50 p-8 text-center text-gray-600">Checking your account...</p>;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="font-inter flex min-h-screen items-center justify-center bg-blue-50 px-4 py-10">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Create account</h1>
      <form onSubmit={handleEmailSignUp} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-gray-700" htmlFor="register-email">Email</label>
        <input
          id="register-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          autoComplete="email"
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-gray-900 outline-none focus:border-gray-400"
        />
        <label className="text-sm font-medium text-gray-700" htmlFor="register-password">Password</label>
        <input
          id="register-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-gray-900 outline-none focus:border-gray-400"
        />
        <label className="text-sm font-medium text-gray-700" htmlFor="register-confirm-password">
          Confirm password
        </label>
        <input
          id="register-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-gray-900 outline-none focus:border-gray-400"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <div className="my-5 flex items-center gap-3 text-sm text-gray-600">
        <span className="h-px flex-1 bg-slate-200" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
      <button
        type="button"
        onClick={handleGoogleSignUp}
        disabled={loading}
        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-gray-700 hover:bg-slate-50 disabled:opacity-50"
      >
        {loading ? "Creating account..." : "Sign up with Google"}
      </button>
      {error && <p role="alert" className="mt-3 text-red-600">{error}</p>}
      <p className="mt-5 text-sm text-gray-600">
        Already have an account? <Link to="/login" className="text-blue-700 hover:underline">Log in</Link>
      </p>
      </section>
    </div>
  );
}
