import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import MenuManager from './pages/MenuManager';
import OrderPage from './pages/OrderPage';
import TokenView from './pages/TokenView';

function AdminRoute({ children }) {
    const { user, loading } = useAuth();
    if (loading) return null;
    if (!user || user.role !== 'admin') return <Navigate to="/admin/login" replace />;
    return children;
}

export default function App() {
    return (
        <AuthProvider>
            <Routes>
                {/* Customer routes — no login needed */}
                <Route path="/" element={<Navigate to="/order" replace />} />
                <Route path="/order" element={<OrderPage />} />
                <Route path="/token/:id" element={<TokenView />} />

                {/* Admin routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                <Route path="/admin/menu" element={<AdminRoute><MenuManager /></AdminRoute>} />

                <Route path="*" element={<Navigate to="/order" replace />} />
            </Routes>
        </AuthProvider>
    );
}
