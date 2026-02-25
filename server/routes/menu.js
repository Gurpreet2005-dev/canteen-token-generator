const router = require('express').Router();
const { getAllMenu, addMenuItem, updateMenuItem, deleteMenuItem } = require('../db');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.get('/', (req, res) => {
    res.json(getAllMenu());
});

router.post('/', authMiddleware, adminOnly, (req, res) => {
    const { name, price, category } = req.body;
    if (!name || !price) return res.status(400).json({ error: 'Name and price required' });
    const item = addMenuItem(name, parseFloat(price), category || 'General');
    res.json(item);
});

router.put('/:id', authMiddleware, adminOnly, (req, res) => {
    const { name, price, category, available } = req.body;
    updateMenuItem(req.params.id, { name, price: parseFloat(price), category, available: available ? 1 : 0 });
    res.json({ success: true });
});

router.delete('/:id', authMiddleware, adminOnly, (req, res) => {
    deleteMenuItem(req.params.id);
    res.json({ success: true });
});

module.exports = router;
