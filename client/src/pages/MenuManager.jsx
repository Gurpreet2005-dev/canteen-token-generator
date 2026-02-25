import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMenu, addMenuItem, updateMenuItem, deleteMenuItem } from '../api';
import toast from 'react-hot-toast';

const CATEGORIES = ['Breakfast', 'Snacks', 'Meals', 'Beverages', 'General'];
const empty = { name: '', price: '', category: 'Snacks', available: true };

export default function MenuManager() {
    const [items, setItems] = useState([]);
    const [form, setForm] = useState(empty);
    const [editing, setEditing] = useState(null); // item id being edited
    const [loading, setLoading] = useState(false);

    const load = () => getMenu().then(r => setItems(r.data));
    useEffect(() => { load(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.price) { toast.error('Name and price required'); return; }
        setLoading(true);
        try {
            if (editing) {
                await updateMenuItem(editing, { ...form, price: parseFloat(form.price) });
                toast.success('Item updated!');
                setEditing(null);
            } else {
                await addMenuItem({ ...form, price: parseFloat(form.price) });
                toast.success(`${form.name} added to menu!`);
            }
            setForm(empty);
            load();
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed');
        } finally { setLoading(false); }
    };

    const startEdit = (item) => {
        setEditing(item.id);
        setForm({ name: item.name, price: item.price, category: item.category, available: item.available === 1 });
    };

    const handleDelete = async (id, name) => {
        if (!confirm(`Remove "${name}" from menu?`)) return;
        try {
            await deleteMenuItem(id);
            toast.success('Item removed');
            load();
        } catch { toast.error('Failed to remove'); }
    };

    const handleToggle = async (item) => {
        await updateMenuItem(item.id, { ...item, available: item.available === 1 ? 0 : 1 });
        load();
    };

    const grouped = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = items.filter(i => i.category === cat);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-gray-950">
            <header className="sticky top-0 z-20 glass border-b border-white/5 px-4 py-3">
                <div className="max-w-3xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/admin" className="text-gray-400 hover:text-white transition text-sm">← Dashboard</Link>
                    </div>
                    <p className="font-bold text-white">Menu Manager</p>
                    <div className="w-20" />
                </div>
            </header>

            <div className="max-w-3xl mx-auto px-4 py-5">
                {/* Add / Edit form */}
                <div className="card mb-6">
                    <h2 className="font-semibold text-white mb-4">
                        {editing ? '✏️ Edit Item' : '➕ Add Menu Item'}
                    </h2>
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs text-gray-400 block mb-1.5">Item Name</label>
                                <input className="input" placeholder="e.g. Masala Chai" value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block mb-1.5">Price (₹)</label>
                                <input className="input" type="number" placeholder="0" value={form.price}
                                    onChange={e => setForm({ ...form, price: e.target.value })} min="0" />
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 block mb-1.5">Category</label>
                            <select className="input" value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}>
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div className="flex gap-3">
                            <button type="submit" disabled={loading} className="btn-primary flex-1">
                                {loading ? 'Saving...' : editing ? 'Update Item' : 'Add to Menu'}
                            </button>
                            {editing && (
                                <button type="button" className="btn-secondary px-5"
                                    onClick={() => { setEditing(null); setForm(empty); }}>
                                    Cancel
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Menu list grouped by category */}
                {CATEGORIES.map(cat => grouped[cat]?.length > 0 && (
                    <div key={cat} className="mb-5">
                        <h3 className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-2">{cat}</h3>
                        <div className="space-y-2">
                            {grouped[cat].map(item => (
                                <div key={item.id} className={`card flex items-center justify-between gap-4 py-3
                  ${item.available ? '' : 'opacity-50'}`}>
                                    <div className="flex-1">
                                        <p className="font-medium text-white">{item.name}</p>
                                        <p className="text-brand-400 font-bold text-sm">₹{item.price}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Toggle available */}
                                        <button
                                            onClick={() => handleToggle(item)}
                                            className={`text-xs px-3 py-1.5 rounded-lg border transition ${item.available
                                                    ? 'border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10'
                                                    : 'border-red-500/40 text-red-400 hover:bg-red-500/10'
                                                }`}
                                        >
                                            {item.available ? 'Available' : 'Hidden'}
                                        </button>
                                        <button onClick={() => startEdit(item)} className="text-xs btn-secondary py-1.5 px-3">Edit</button>
                                        <button onClick={() => handleDelete(item.id, item.name)} className="text-xs btn-danger py-1.5 px-3">✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
