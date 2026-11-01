import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider";
import { useAuth } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppShell from "./components/AppShell";
import DealFormPage from "./pages/DealFormPage";
import DealsPage from "./pages/DealsPage";
import CustomerFormPage from "./pages/CustomerFormPage";
import CustomersPage from "./pages/CustomersPage";
import DashboardPage from "./pages/DashboardPage";
import ForgotPassword from "./pages/ForgotPassword";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TaskFormPage from "./pages/TaskFormPage";
import TasksPage from "./pages/TasksPage";

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return <Navigate to={user ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<HomeRedirect />} />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/customers/new" element={<CustomerFormPage />} />
            <Route path="/customers/:id/edit" element={<CustomerFormPage />} />
            <Route path="/deals" element={<DealsPage />} />
            <Route path="/deals/new" element={<DealFormPage />} />
            <Route path="/deals/:id/edit" element={<DealFormPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/tasks/new" element={<TaskFormPage />} />
            <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}