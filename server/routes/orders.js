const router = require('express').Router();
const QRCode = require('qrcode');
const {
    createOrder, getActiveOrders, getUserOrders,
    getOrderById, updateOrderStatus, updatePaymentStatus
} = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const { sendSMS } = require('../sms');

// ── Helper: Build UPI deep link ────────────────────────────
function buildUpiLink(amount, tokenNumber, note) {
    const upiId = process.env.SHOP_UPI_ID || 'yourshop@upi';
    const shopName = encodeURIComponent(process.env.SHOP_NAME || 'College Canteen');
    const tn = encodeURIComponent(`Token #${tokenNumber} - ${note || 'Canteen Order'}`);
    return `upi://pay?pa=${upiId}&pn=${shopName}&am=${amount}&cu=INR&tn=${tn}`;
}

// ── GUEST: Place order (no login) ──────────────────────────
router.post('/guest', (req, res) => {
    const { name, phone, items } = req.body;
    if (!name || !phone || !items || items.length === 0)
        return res.status(400).json({ error: 'Name, phone, and items are required' });
    if (!/^\d{10}$/.test(phone))
        return res.status(400).json({ error: 'Phone must be 10 digits' });

    const total = items.reduce((s, i) => s + i.price * i.qty, 0);
    const order = createOrder(0, items, total, name, phone);

    // Build UPI link and return with order
    const upi_link = buildUpiLink(total, order.token_number, name);
    const upi_id = process.env.SHOP_UPI_ID || 'yourshop@upi';
    res.json({ ...order, upi_link, upi_id });
});

// ── GUEST: Poll order status by id (no auth) ───────────────
router.get('/status/:id', (req, res) => {
    const order = getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({
        id: order.id,
        token_number: order.token_number,
        status: order.status,
        payment_status: order.payment_status,
        items: order.items,
        total: order.total,
        created_at: order.created_at,
        guest_name: order.guest_name,
    });
});

// ── QR Code for shop ordering page ────────────────────────
router.get('/qr', async (req, res) => {
    try {
        const host = req.query.host || `${req.protocol}://${req.get('host')}`;
        const orderUrl = `${host}/order`;
        const qr = await QRCode.toDataURL(orderUrl, { width: 300, margin: 2 });
        res.json({ qr, url: orderUrl });
    } catch {
        res.status(500).json({ error: 'QR generation failed' });
    }
});

// ── ADMIN: Get all active orders ───────────────────────────
router.get('/', authMiddleware, adminOnly, (req, res) => {
    res.json(getActiveOrders());
});

// ── ADMIN: Confirm payment (after seeing UPI notification) ─
router.put('/:id/confirm-payment', authMiddleware, adminOnly, (req, res) => {
    const order = getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    updatePaymentStatus(req.params.id, 'paid');
    res.json({ success: true });
});

// ── ADMIN: Mark as ready → SMS ─────────────────────────────
router.put('/:id/ready', authMiddleware, adminOnly, async (req, res) => {
    const order = getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    updateOrderStatus(req.params.id, 'ready');
    await sendSMS(order.guest_phone || order.user_phone, order.token_number, order.guest_name);
    res.json({ success: true, token_number: order.token_number });
});

// ── ADMIN: Mark as collected ───────────────────────────────
router.put('/:id/collected', authMiddleware, adminOnly, (req, res) => {
    updateOrderStatus(req.params.id, 'collected');
    res.json({ success: true });
});

module.exports = router;
