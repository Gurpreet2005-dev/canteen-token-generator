import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register as apiRegister } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Register() {
    const [form, setForm] = useState({ name: '', phone: '', password: '' });
    const [loading, setLoading] = useState(false);
    const auth = useAuth();
    const navigate = useNavigate();

    const handle = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { data } = await apiRegister(form);
            auth.login(data.token, data.user);
            toast.success(`Welcome, ${data.user.name}! 🎉`);
            navigate('/home');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-950">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
            </div>

            <div className="w-full max-w-sm slide-up">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/40">
                        <span className="text-3xl">🎟️</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">College Canteen</h1>
                    <p className="text-gray-400 text-sm mt-1">Create your account</p>
                </div>

                <div className="card">
                    <h2 className="text-lg font-semibold mb-5 text-white">Register</h2>
                    <form onSubmit={handle} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Full Name</label>
                            <input
                                className="input"
                                type="text"
                                placeholder="Your full name"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Phone Number</label>
                            <input
                                className="input"
                                type="tel"
                                placeholder="10-digit mobile number"
                                maxLength={10}
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                                required
                            />
                            <p className="text-xs text-gray-600 mt-1">SMS notifications will be sent to this number</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Password</label>
                            <input
                                className="input"
                                type="password"
                                placeholder="Create a password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required minLength={4}
                            />
                        </div>
                        <button className="btn-primary w-full mt-2" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create Account'}
                        </button>
                    </form>

                    <p className="text-center text-gray-500 text-sm mt-5">
                        Already have an account?{' '}
                        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
