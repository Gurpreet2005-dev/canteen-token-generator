import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function AdminLogin() {
    const [form, setForm] = useState({ phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await apiLogin(form);
            if (data.user.role !== 'admin') {
                toast.error('Admin access only');
                return;
            }
            auth.login(data.token, data.user);
            toast.success('Welcome back!');
            navigate('/admin');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -left-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>
            <div className="w-full max-w-sm slide-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/40">
                        <span className="text-3xl">🔑</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Admin Login</h1>
                    <p className="text-gray-400 text-sm mt-1">Shopkeeper access only</p>
                </div>
                <div className="card">
                    <form onSubmit={handle} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Phone Number</label>
                            <input className="input" type="tel" placeholder="Admin phone"
                                value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Password</label>
                            <input className="input" type="password" placeholder="Password"
                                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                        </div>
                        <button className="btn-primary w-full mt-2" disabled={loading}>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                    <p className="text-center text-gray-600 text-xs mt-4">
                        Default: 0000000000 / admin123
                    </p>
                </div>
            </div>
        </div>
    );
}
