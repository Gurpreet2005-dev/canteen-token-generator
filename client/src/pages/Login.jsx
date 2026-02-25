import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
    const [form, setForm] = useState({ phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await apiLogin(form);
            auth.login(data.token, data.user);
            toast.success(`Welcome back, ${data.user.name}!`);
            navigate(data.user.role === 'admin' ? '/admin' : '/home');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            {/* Background orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm slide-up">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/40">
                        <span className="text-3xl">🎟️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">College Canteen</h1>
                    <p className="text-gray-400 text-sm mt-1">Token Order System</p>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold mb-5 text-white">Sign In</h2>
                    <form onSubmit={handle} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Phone Number</label>
                            <input
                                className="input"
                                type="tel"
                                placeholder="10-digit mobile number"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Enter password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                            />
                        </div>
                        <button className="btn-primary w-full mt-2" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-5">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-brand-400 hover:text-brand-300 font-medium">Register</Link>
                    </p>
                </div>

                <p className="text-center text-gray-600 text-xs mt-4">
                    Admin login: <span className="text-gray-500">0000000000 / admin123</span>
                </p>
            </div>
        </div>
    );
}
