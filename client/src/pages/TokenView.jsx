import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { pollOrderStatus } from '../api';

const STATUS_CONFIG = {
    pending: { label: 'Order Received', emoji: '⏳', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    preparing: { label: 'Being Prepared', emoji: '👨‍🍳', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    ready: { label: 'Ready! Collect Now 🔔', emoji: '✅', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30', glow: true },
    collected: { label: 'Collected — Thanks!', emoji: '🎉', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/30' },
};

export default function TokenView() {
    const location = useLocation();
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(location.state || null);
    const prevStatusRef = useRef(order?.status);

    // Poll every 5s using the public /status endpoint (no auth needed)
    useEffect(() => {
        if (!id) return;
        const poll = setInterval(async () => {
            try {
                const { data } = await pollOrderStatus(id);
                if (prevStatusRef.current !== 'ready' && data.status === 'ready') {
                    // Play a gentle chime via Web Audio API
                    try {
                        const ctx = new AudioContext();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        osc.frequency.setValueAtTime(880, ctx.currentTime);
                        osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
                        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.3);
                        gain.gain.setValueAtTime(0.3, ctx.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
                        osc.start();
                        osc.stop(ctx.currentTime + 0.5);
                    } catch { }
                }
                prevStatusRef.current = data.status;
                setOrder(prev => ({ ...prev, ...data }));
            } catch { }
        }, 5000);
        return () => clearInterval(poll);
    }, [id]);

    if (!order) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-950">
                <p className="text-gray-400">No order found.</p>
                <button onClick={() => navigate('/order')} className="btn-primary">Place an Order</button>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
    const isReady = order.status === 'ready';

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="glass border-b border-white/5 px-4 py-3 flex items-center justify-between">
                <span className="font-bold text-white">Your Token</span>
                <button onClick={() => navigate('/order')} className="text-xs text-gray-500 hover:text-gray-300 transition">
                    New Order →
                </button>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
                {/* Big Glowing Token */}
                <div className={`w-60 h-60 rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-700
          ${isReady
                        ? 'ready-glow bg-emerald-900/30 border-emerald-500'
                        : 'token-glow bg-brand-500/10 border-brand-500'
                    }`}>
                    <p className="text-gray-400 text-sm font-medium uppercase tracking-[0.2em]">Token</p>
                    <p className={`text-8xl font-black leading-none ${isReady ? 'text-emerald-400' : 'text-brand-400'}`}>
                        #{order.token_number}
                    </p>
                    {order.guest_name && (
                        <p className="text-gray-500 text-xs mt-2">{order.guest_name}</p>
                    )}
                </div>

                {/* Status badge */}
                <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${cfg.bg} slide-up`}>
                    <span className="text-2xl">{cfg.emoji}</span>
                    <div>
                        <p className={`font-semibold ${cfg.color}`}>{cfg.label}</p>
                        {order.status === 'pending' && (
                            <p className="text-xs text-gray-600">Auto-updates every 5s</p>
                        )}
                        {isReady && (
                            <p className="text-xs text-emerald-600">Please go to the counter now!</p>
                        )}
                    </div>
                </div>

                {/* Order summary card */}
                <div className="card w-full max-w-sm">
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Order Summary</p>
                    {(order.items || []).map((item, i) => (
                        <div key={i} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                            <span className="text-sm text-gray-300">{item.name} <span className="text-gray-600">×{item.qty}</span></span>
                            <span className="text-sm text-white">₹{item.price * item.qty}</span>
                        </div>
                    ))}
                    <div className="flex justify-between mt-3 pt-3 border-t border-white/10">
                        <span className="font-semibold text-white">Total</span>
                        <span className="font-bold text-brand-400">₹{order.total}</span>
                    </div>
                </div>

                {order.status === 'collected' && (
                    <button onClick={() => navigate('/order')} className="btn-primary">Order Again 🍽️</button>
                )}
            </div>
        </div>
    );
}
