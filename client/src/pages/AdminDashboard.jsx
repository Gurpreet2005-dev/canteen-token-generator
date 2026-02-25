import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminOrders, markReady, markCollected, confirmPayment, getQRCode } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const STATUS_BADGE = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    preparing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    ready: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
};

export default function AdminDashboard() {
    const { logout } = useAuth();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState(null);
    const [qrData, setQrData] = useState(null);
    const [showQR, setShowQR] = useState(false);

    const fetch = useCallback(async (showLoad = false) => {
        if (showLoad) setLoading(true);
        try { const { data } = await getAdminOrders(); setOrders(data); }
        catch { }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetch(true); }, [fetch]);
    useEffect(() => {
        const t = setInterval(() => fetch(false), 5000);
        return () => clearInterval(t);
    }, [fetch]);

    useEffect(() => {
        const host = `${window.location.protocol}//${window.location.hostname}:5173`;
        getQRCode(host).then(r => setQrData(r.data)).catch(() => { });
    }, []);

    const handleConfirmPayment = async (id) => {
        setActionId(id + '-pay');
        try { await confirmPayment(id); toast.success('Payment confirmed ✅'); fetch(false); }
        catch { toast.error('Failed'); }
        finally { setActionId(null); }
    };

    const handleReady = async (id) => {
        setActionId(id);
        try { await markReady(id); toast.success('Order ready! SMS sent 📱'); fetch(false); }
        catch { toast.error('Failed'); }
        finally { setActionId(null); }
    };

    const handleCollected = async (id) => {
        setActionId(id);
        try { await markCollected(id); fetch(false); }
        catch { toast.error('Failed'); }
        finally { setActionId(null); }
    };

    const unpaid = orders.filter(o => o.payment_status === 'payment_pending');
    const paid = orders.filter(o => o.payment_status === 'paid' && o.status === 'pending');
    const ready = orders.filter(o => o.status === 'ready');

    return (
        <div className="min-h-screen bg-gray-950">
            <header className="sticky top-0 z-20 glass border-b border-white/5 px-4 py-3">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <span className="text-xl">🍽️</span>
                        <div>
                            <p className="font-bold text-white leading-tight">Admin Dashboard</p>
                            <p className="text-xs text-gray-500">Live queue · auto-refresh 5s</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowQR(!showQR)} className="btn-secondary py-1.5 px-3 text-sm">📱 QR</button>
                        <Link to="/admin/menu" className="btn-secondary py-1.5 text-sm px-3">Menu</Link>
                        <button onClick={logout} className="text-gray-500 hover:text-gray-300 text-sm transition ml-1">Logout</button>
                    </div>
                </div>
            </header>

            <div className="max-w-4xl mx-auto px-4 py-5">
                {/* QR Panel */}
                {showQR && qrData && (
                    <div className="card mb-6 flex flex-col sm:flex-row items-center gap-5 border border-brand-500/30 slide-up">
                        <img src={qrData.qr} alt="Order QR" className="w-36 h-36 rounded-xl bg-white p-2 flex-shrink-0" />
                        <div>
                            <h3 className="font-bold text-white mb-1">Shop Order QR</h3>
                            <p className="text-gray-400 text-sm mb-3">Customers scan → order instantly, no login needed.</p>
                            <p className="text-xs text-gray-600 mb-3 font-mono break-all">{qrData.url}</p>
                            <div className="flex gap-2 flex-wrap">
                                <a href={qrData.qr} download="shop-qr.png" className="btn-primary text-sm py-2 px-4">⬇️ Download QR</a>
                                <button onClick={() => { navigator.clipboard.writeText(qrData.url); toast.success('Link copied!'); }}
                                    className="btn-secondary text-sm py-2 px-4">Copy Link</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                    {[
                        { label: 'Awaiting Pay', count: unpaid.length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                        { label: 'Paid / Queue', count: paid.length, color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
                        { label: 'Ready', count: ready.length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                        { label: 'Total Active', count: orders.length, color: 'text-brand-400', bg: 'bg-brand-500/10' },
                    ].map(s => (
                        <div key={s.label} className={`card ${s.bg} text-center`}>
                            <p className={`text-2xl font-black ${s.color}`}>{s.count}</p>
                            <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>

                {/* Ready orders */}
                {ready.length > 0 && (
                    <Section title="Ready for Collection" dotColor="bg-emerald-400">
                        {ready.map(o => <OrderCard key={o.id} order={o} onCollected={handleCollected} actionId={actionId} />)}
                    </Section>
                )}

                {/* Paid — awaiting prep */}
                {paid.length > 0 && (
                    <Section title="Paid — Start Preparing" dotColor="bg-yellow-400">
                        {paid.map(o => <OrderCard key={o.id} order={o} onReady={handleReady} actionId={actionId} />)}
                    </Section>
                )}

                {/* Awaiting payment */}
                <Section title="Awaiting UPI Payment" dotColor="bg-orange-400">
                    {loading ? (
                        <div className="text-center text-gray-600 py-10">Loading...</div>
                    ) : unpaid.length === 0 ? (
                        <div className="card text-center py-10">
                            <p className="text-3xl mb-2">✅</p>
                            <p className="text-gray-400 text-sm">No pending payments</p>
                        </div>
                    ) : (
                        unpaid.map(o => (
                            <OrderCard key={o.id} order={o} onConfirmPayment={handleConfirmPayment} actionId={actionId} />
                        ))
                    )}
                </Section>
            </div>
        </div>
    );
}

function Section({ title, dotColor, children }) {
    return (
        <div className="mb-6">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <span className={`w-2 h-2 ${dotColor} rounded-full animate-pulse inline-block`} />
                {title}
            </h2>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function OrderCard({ order, onReady, onConfirmPayment, onCollected, actionId }) {
    const busy = actionId === order.id || actionId === order.id + '-pay';
    const mins = Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000);
    const isPaid = order.payment_status === 'paid';

    return (
        <div className={`card slide-up border ${order.status === 'ready' ? 'border-emerald-500/30 bg-emerald-950/30' : isPaid ? 'border-yellow-500/20' : 'border-orange-500/20 bg-orange-950/10'}`}>
            <div className="flex items-start gap-4">
                <div className={`flex-shrink-0 w-16 h-16 rounded-2xl flex flex-col items-center justify-center
          ${order.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' : isPaid ? 'bg-brand-500/20 text-brand-400' : 'bg-orange-500/20 text-orange-400'}`}>
                    <span className="text-xs opacity-60">#</span>
                    <span className="text-2xl font-black leading-none">{order.token_number}</span>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">{order.user_name}</p>
                        <span className="text-xs text-gray-600">{order.user_phone}</span>
                        {/* Payment badge */}
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${isPaid ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                            {isPaid ? '💰 Paid' : '⏳ Awaiting Payment'}
                        </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {order.items.map((item, i) => (
                            <span key={i} className="text-xs glass px-2 py-0.5 rounded-full text-gray-300">{item.name} ×{item.qty}</span>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2">
                        <p className="text-xs text-gray-600">{mins === 0 ? 'just now' : `${mins}m ago`}</p>
                        <p className="font-bold text-white">₹{order.total}</p>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mt-4">
                {!isPaid && onConfirmPayment && (
                    <button onClick={() => onConfirmPayment(order.id)} disabled={busy}
                        className="btn-success flex-1 py-2 text-sm">
                        {busy ? '...' : '✅ Confirm Payment Received'}
                    </button>
                )}
                {isPaid && order.status === 'pending' && onReady && (
                    <button onClick={() => onReady(order.id)} disabled={busy}
                        className="btn-primary flex-1 py-2 text-sm">
                        {busy ? 'Sending SMS...' : '🍽️ Mark Ready & Notify'}
                    </button>
                )}
                {order.status === 'ready' && onCollected && (
                    <button onClick={() => onCollected(order.id)} disabled={busy}
                        className="btn-secondary flex-1 py-2 text-sm">
                        {busy ? '...' : '📦 Mark Collected'}
                    </button>
                )}
            </div>
        </div>
    );
}
