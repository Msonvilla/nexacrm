import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../auth/AuthContext";

export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-2">Signed in as {user?.email}</p>
      <button
        onClick={() => signOut(auth)}
        className="mt-4 rounded bg-gray-800 px-3 py-2 text-white"
      >
        Log out
      </button>
    </div>
  );
}
