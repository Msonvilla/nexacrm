import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="font-inter min-h-screen bg-blue-50 p-8 text-gray-900">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Signed in as {user?.email}</p>
      <button
        onClick={() => signOut(auth)}
        className="mt-4 rounded bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
      >
        Log out
      </button>
    </div>
  );
}
