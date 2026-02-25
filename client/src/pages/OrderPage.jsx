import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenu, placeGuestOrder } from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['All', 'Breakfast', 'Snacks', 'Meals', 'Beverages'];

// Step 1 = name+phone, Step 2 = menu, Step 3 = UPI payment
export default function OrderPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [guest, setGuest] = useState({ name: '', phone: '' });
    const [menu, setMenu] = useState([]);
    const [cart, setCart] = useState({});
    const [activeTab, setActiveTab] = useState('All');
    const [placing, setPlacing] = useState(false);
    const [orderData, setOrderData] = useState(null); // { token_number, upi_link, upi_id, total, id }

    useEffect(() => { getMenu().then(r => setMenu(r.data)).catch(() => { }); }, []);

    const handleGuestSubmit = (e) => {
        e.preventDefault();
        if (!/^\d{10}$/.test(guest.phone)) { toast.error('Enter a valid 10-digit phone number'); return; }
        setStep(2);
    };

    const filtered = activeTab === 'All'
        ? menu.filter(i => i.available)
        : menu.filter(i => i.available && i.category === activeTab);

    const addToCart = (item) =>
        setCart(c => ({ ...c, [item.id]: { ...item, qty: (c[item.id]?.qty || 0) + 1 } }));
    const removeFromCart = (id) =>
        setCart(c => { const cur = c[id]; if (!cur || cur.qty <= 1) { const n = { ...c }; delete n[id]; return n; } return { ...c, [id]: { ...cur, qty: cur.qty - 1 } }; });

    const cartItems = Object.values(cart).filter(i => i.qty > 0);
    const total = cartItems.reduce((s, i) => s + i.price * i.qty, 0);

    const handleOrder = async () => {
        if (cartItems.length === 0) { toast.error('Add at least one item!'); return; }
        setPlacing(true);
        try {
            const { data } = await placeGuestOrder({ name: guest.name, phone: guest.phone, items: cartItems });
            setOrderData(data);
            setStep(3); // go to payment screen
        } catch (err) {
            toast.error(err.response?.data?.error || 'Order failed. Try again.');
        } finally { setPlacing(false); }
    };

    // ── Step 1: Name + Phone ────────────────────────────────
    if (step === 1) return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-950">
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
            </div>
            <div className="w-full max-w-sm slide-up">
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-brand-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-brand-500/40 token-glow">
                        <span className="text-4xl">🎟️</span>
                    </div>
                    <h1 className="text-3xl font-black text-white">College Canteen</h1>
                    <p className="text-gray-400 mt-1">Order food. Pay via UPI. Get a token.</p>
                </div>
                <div className="card">
                    <h2 className="text-lg font-semibold text-white mb-1">Quick Order</h2>
                    <p className="text-xs text-gray-500 mb-5">No signup needed</p>
                    <form onSubmit={handleGuestSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Your Name</label>
                            <input className="input" type="text" placeholder="e.g. Rahul" value={guest.name}
                                onChange={e => setGuest({ ...guest, name: e.target.value })} required autoFocus />
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 font-medium block mb-1.5">Mobile Number</label>
                            <div className="flex gap-2">
                                <span className="input w-14 flex-shrink-0 text-center text-gray-400 cursor-default">+91</span>
                                <input className="input flex-1" type="tel" inputMode="numeric" placeholder="10-digit number"
                                    maxLength={10} value={guest.phone}
                                    onChange={e => setGuest({ ...guest, phone: e.target.value.replace(/\D/g, '') })} required />
                            </div>
                            <p className="text-xs text-gray-600 mt-1.5">📱 SMS notification when order is ready</p>
                        </div>
                        <button type="submit" className="btn-primary w-full py-3 text-base mt-1">Browse Menu →</button>
                    </form>
                </div>
                <p className="text-center text-gray-700 text-xs mt-4">
                    Shopkeeper? <a href="/admin/login" className="text-gray-500 hover:text-gray-300 transition">Admin login →</a>
                </p>
            </div>
        </div>
    );

    // ── Step 2: Menu ────────────────────────────────────────
    if (step === 2) return (
        <div className="min-h-screen bg-gray-950">
            <header className="sticky top-0 z-20 glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="text-xl">🎟️</span>
                    <div>
                        <p className="font-bold text-white text-sm leading-tight">College Canteen</p>
                        <p className="text-xs text-gray-400">Hey {guest.name} 👋</p>
                    </div>
                </div>
                <button onClick={() => { setStep(1); setCart({}); }} className="text-xs text-gray-500 hover:text-gray-300 transition">← Change</button>
            </header>
            <div className="max-w-2xl mx-auto px-4 py-4 pb-36">
                <div className="flex gap-2 overflow-x-auto pb-2 mb-4 no-scrollbar">
                    {CATEGORIES.map(cat => (
                        <button key={cat} onClick={() => setActiveTab(cat)}
                            className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${activeTab === cat ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30' : 'glass text-gray-400 hover:text-white'
                                }`}>{cat}</button>
                    ))}
                </div>
                <div className="grid grid-cols-2 gap-3">
                    {filtered.map(item => (
                        <div key={item.id} className="card flex flex-col justify-between gap-3">
                            <div>
                                <p className="font-semibold text-white text-sm leading-tight">{item.name}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{item.category}</p>
                                <p className="text-brand-400 font-bold text-lg mt-2">₹{item.price}</p>
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
                {filtered.length === 0 && <div className="text-center text-gray-600 mt-20"><p className="text-5xl mb-3">🍽️</p><p>No items here</p></div>}
            </div>
            {cartItems.length > 0 && (
                <div className="fixed bottom-0 left-0 right-0 p-4 z-30">
                    <div className="max-w-2xl mx-auto">
                        <div className="glass rounded-2xl p-4 border border-brand-500/30 shadow-2xl">
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-sm text-gray-400">{cartItems.length} item{cartItems.length > 1 ? 's' : ''}</p>
                                    <div className="flex flex-wrap gap-1 mt-0.5">
                                        {cartItems.map(i => <span key={i.id} className="text-xs text-gray-500">{i.name} ×{i.qty}</span>)}
                                    </div>
                                </div>
                                <p className="text-xl font-bold text-brand-400">₹{total}</p>
                            </div>
                            <button onClick={handleOrder} disabled={placing} className="btn-primary w-full py-3 text-base">
                                {placing ? 'Placing Order...' : `💳 Pay ₹${total} via UPI & Get Token`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );

    // ── Step 3: UPI Payment Screen ──────────────────────────
    if (step === 3 && orderData) return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            <header className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-white">Pay & Confirm</span>
                <button onClick={() => navigate(`/token/${orderData.id}`, { state: orderData })}
                    className="text-xs text-gray-500 hover:text-gray-300 transition">Skip →</button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-5 gap-5 max-w-sm mx-auto w-full">
                {/* Token number */}
                <div className="token-glow w-36 h-36 rounded-2xl border-2 border-brand-500 bg-brand-500/10 flex flex-col items-center justify-center">
                    <p className="text-gray-400 text-xs font-medium uppercase tracking-widest">Token</p>
                    <p className="text-6xl font-black text-brand-400">#{orderData.token_number}</p>
                </div>

                {/* Amount */}
                <div className="text-center">
                    <p className="text-4xl font-black text-white">₹{orderData.total}</p>
                    <p className="text-sm text-gray-400 mt-1">Pay to complete your order</p>
                </div>

                {/* UPI ID display */}
                <div className="card w-full text-center">
                    <p className="text-xs text-gray-500 mb-1">UPI ID</p>
                    <p className="font-mono text-white font-semibold text-lg">{orderData.upi_id}</p>
                    <button onClick={() => { navigator.clipboard.writeText(orderData.upi_id); toast.success('UPI ID copied!'); }}
                        className="text-xs text-brand-400 hover:text-brand-300 mt-1 transition">Copy</button>
                </div>

                {/* Pay via UPI app button */}
                <a href={orderData.upi_link}
                    className="btn-primary w-full text-center py-4 text-lg block"
                    onClick={() => toast('Opening your UPI app...', { icon: '📱' })}
                >
                    📱 Pay via UPI App
                </a>

                <div className="card w-full bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-xs text-yellow-400 font-semibold mb-1">⚠️ After paying:</p>
                    <p className="text-xs text-gray-400">Your token is confirmed once the shopkeeper verifies the payment. You'll see your token status on the next screen.</p>
                </div>

                <button
                    onClick={() => navigate(`/token/${orderData.id}`, { state: orderData })}
                    className="btn-secondary w-full py-3"
                >
                    I've Paid — Show My Token 🎟️
                </button>
            </div>
        </div>
    );

    return null;
}
