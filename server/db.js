/**
 * Pure JS JSON file-based data store.
 * No native dependencies — works on any OS without build tools.
 * Data persisted to canteen-db.json in project root.
 */

const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_FILE = path.join(__dirname, '..', 'canteen-db.json');

function readDB() {
    if (!fs.existsSync(DB_FILE)) return null;
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function initDB() {
    let db = readDB();
    if (db) return db;

    const adminHash = bcrypt.hashSync('admin123', 10);
    db = {
        users: [
            { id: 1, name: 'Admin', phone: '0000000000', password_hash: adminHash, role: 'admin' }
        ],
        menu_items: [
            { id: 1, name: 'Samosa', price: 10, category: 'Snacks', available: 1 },
            { id: 2, name: 'Poha', price: 20, category: 'Breakfast', available: 1 },
            { id: 3, name: 'Dosa', price: 30, category: 'Breakfast', available: 1 },
            { id: 4, name: 'Tea', price: 10, category: 'Beverages', available: 1 },
            { id: 5, name: 'Coffee', price: 15, category: 'Beverages', available: 1 },
            { id: 6, name: 'Veg Sandwich', price: 25, category: 'Snacks', available: 1 },
            { id: 7, name: 'Maggi', price: 30, category: 'Snacks', available: 1 },
            { id: 8, name: 'Thali', price: 60, category: 'Meals', available: 1 },
            { id: 9, name: 'Dal Rice', price: 50, category: 'Meals', available: 1 },
            { id: 10, name: 'Cold Drink', price: 20, category: 'Beverages', available: 1 },
        ],
        orders: [],
        _counters: { user: 1, menu: 10, order: 0 }
    };

    writeDB(db);
    console.log('✅ DB initialised — admin: 0000000000 / admin123');
    return db;
}

// ── Users ─────────────────────────────────────────────────
function findUserByPhone(phone) {
    return readDB().users.find(u => u.phone === phone) || null;
}

function createUser(name, phone, password_hash, role = 'user') {
    const db = readDB();
    db._counters.user += 1;
    const id = db._counters.user;
    db.users.push({ id, name, phone, password_hash, role });
    writeDB(db);
    return id;
}

// ── Menu ──────────────────────────────────────────────────
function getAllMenu() {
    return readDB().menu_items;
}

function addMenuItem(name, price, category) {
    const db = readDB();
    db._counters.menu += 1;
    const id = db._counters.menu;
    const item = { id, name, price, category, available: 1 };
    db.menu_items.push(item);
    writeDB(db);
    return item;
}

function updateMenuItem(id, fields) {
    const db = readDB();
    const idx = db.menu_items.findIndex(i => i.id === Number(id));
    if (idx === -1) return false;
    db.menu_items[idx] = { ...db.menu_items[idx], ...fields };
    writeDB(db);
    return true;
}

function deleteMenuItem(id) {
    const db = readDB();
    db.menu_items = db.menu_items.filter(i => i.id !== Number(id));
    writeDB(db);
}

// ── Orders ────────────────────────────────────────────────
function getNextToken() {
    const db = readDB();
    const today = new Date().toISOString().slice(0, 10);
    const todayOrders = db.orders.filter(o => o.created_at.startsWith(today));
    return todayOrders.length + 1;
}

/**
 * Create an order.
 * For guest orders: user_id = 0, guest_name and guest_phone are stored directly.
 * For logged-in users (admin testing): user_id > 0.
 */
function createOrder(user_id, items, total, guest_name = null, guest_phone = null) {
    const db = readDB();
    db._counters.order += 1;
    const id = db._counters.order;
    const token_number = getNextToken();
    const order = {
        id,
        user_id,
        guest_name,
        guest_phone,
        token_number,
        status: 'pending',
        payment_status: 'payment_pending', // 'payment_pending' | 'paid'
        items,
        total,
        created_at: new Date().toISOString(),
    };
    db.orders.push(order);
    writeDB(db);
    return order;
}

function getActiveOrders() {
    const db = readDB();
    return db.orders
        .filter(o => ['pending', 'preparing', 'ready'].includes(o.status))
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
        .map(o => {
            // Support both guest and registered user orders
            if (o.user_id === 0 || o.guest_phone) {
                return { ...o, user_name: o.guest_name, user_phone: o.guest_phone };
            }
            const user = db.users.find(u => u.id === o.user_id) || {};
            return { ...o, user_name: user.name, user_phone: user.phone };
        });
}

function getUserOrders(user_id) {
    const db = readDB();
    return db.orders
        .filter(o => o.user_id === user_id)
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 10);
}

function getOrderById(id) {
    const db = readDB();
    const order = db.orders.find(o => o.id === Number(id));
    if (!order) return null;
    if (order.user_id === 0 || order.guest_phone) return order;
    const user = db.users.find(u => u.id === order.user_id) || {};
    return { ...order, user_phone: user.phone };
}

function updateOrderStatus(id, status) {
    const db = readDB();
    const idx = db.orders.findIndex(o => o.id === Number(id));
    if (idx === -1) return false;
    db.orders[idx].status = status;
    writeDB(db);
    return true;
}

function updatePaymentStatus(id, payment_status) {
    const db = readDB();
    const idx = db.orders.findIndex(o => o.id === Number(id));
    if (idx === -1) return false;
    db.orders[idx].payment_status = payment_status;
    writeDB(db);
    return true;
}

// Initialise on require
initDB();

module.exports = {
    findUserByPhone, createUser,
    getAllMenu, addMenuItem, updateMenuItem, deleteMenuItem,
    createOrder, getActiveOrders, getUserOrders, getOrderById,
    updateOrderStatus, updatePaymentStatus,
};
