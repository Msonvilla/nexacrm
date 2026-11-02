import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="font-inter min-h-screen bg-gray-100 p-8 text-gray-900">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Signed in as {user?.email}</p>
      <button
        onClick={() => signOut(auth)}
        className="mt-4 rounded px-3 py-2"
      >
        Log out
      </button>
    </div>
  );
}
