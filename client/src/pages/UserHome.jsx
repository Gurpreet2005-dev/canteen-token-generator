import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenu, placeOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Breakfast', 'Snacks', 'Meals', 'Beverages'];

export default function UserHome() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState({});
    const [activeTab, setActiveTab] = useState('All');
    const [placing, setPlacing] = useState(false);

    useEffect(() => {
        getMenu().then(r => setMenu(r.data)).catch(() => toast.error('Failed to load menu'));
    }, []);

    const filtered = activeTab === 'All'
        ? menu.filter(i => i.available)
        : menu.filter(i => i.available && i.category === activeTab);

    const addToCart = (item) => {
        setCart(c => ({ ...c, [item.id]: { ...item, qty: (c[item.id]?.qty || 0) + 1 } }));
    };
    const removeFromCart = (id) => {
        setCart(c => {
            const cur = c[id];
            if (!cur || cur.qty <= 1) { const n = { ...c }; delete n[id]; return n; }
            return { ...c, [id]: { ...cur, qty: cur.qty - 1 } };
        });
    };

    const cartItems = Object.values(cart).filter(i => i.qty > 0);
    const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

    const handleOrder = async () => {
        if (cartItems.length === 0) { toast.error('Cart is empty!'); return; }
        setPlacing(true);
        try {
            const { data } = await placeOrder({ items: cartItems });
            toast.success(`Token #${data.token_number} generated!`);
            navigate(`/token/${data.id}`, { state: data });
        } catch (err) {
            toast.error(err.response?.data?.error || 'Order failed');
        } finally {
            setPlacing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-20 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-2xl">🎟️</span>
                    <div>
                        <p className="font-bold text-white leading-tight">College Canteen</p>
                        <p className="text-xs text-gray-400">Hey, {user?.name} 👋</p>
                    </div>
                </div>
                <button onClick={logout} className="text-gray-500 hover:text-gray-300 text-sm transition">Logout</button>
            </header>

            <div className="max-w-2xl mx-auto px-4 py-4 pb-36">
                {/* Category tabs */}
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setActiveTab(cat)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === cat
                                    ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                                    : 'glass text-gray-400 hover:text-white'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {/* Menu grid */}
                <div className="grid grid-cols-2 gap-3">
                    {filtered.map(item => (
                        <div key={item.id} className="card flex flex-col justify-between gap-3">
                            <div>
                                <p className="font-semibold text-white text-sm leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                <p className="text-brand-400 font-bold mt-2">₹{item.price}</p>
                            </div>
                            {cart[item.id]?.qty > 0 ? (
                                <div className="flex items-center justify-between glass rounded-xl px-3 py-1.5">
                                    <button onClick={() => removeFromCart(item.id)} className="text-gray-300 hover:text-white text-xl font-bold w-6">−</button>
                                    <span className="font-bold text-white">{cart[item.id].qty}</span>
                                    <button onClick={() => addToCart(item)} className="text-brand-400 hover:text-brand-300 text-xl font-bold w-6">+</button>
                                </div>
                            ) : (
                                <button onClick={() => addToCart(item)} className="btn-primary w-full py-2 text-sm">Add</button>
                            )}
                        </div>
                    ))}
                </div>

                {filtered.length === 0 && (
                    <div className="text-center text-gray-600 mt-16">
                        <p className="text-4xl mb-3">🍽️</p>
                        <p>No items in this category right now</p>
                    </div>
                )}
            </div>

            {/* Floating Cart */}
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-30">
                    <div className="max-w-2xl mx-auto">
                        <div className="glass rounded-2xl p-4 border border-brand-500/30 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-400">{cartItems.length} item{cartItems.length > 1 ? 's' : ''} in cart</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {cartItems.map(i => (
                                            <span key={i.id} className="text-xs text-gray-400">{i.name} ×{i.qty}</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-brand-400">₹{total}</p>
                            </div>
                            <button
                                onClick={handleOrder}
                                disabled={placing}
                                className="btn-primary w-full py-3 text-base"
                            >
                                {placing ? 'Placing Order...' : `Place Order & Get Token`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
