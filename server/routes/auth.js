const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByPhone, createUser } = require('../db');

router.post('/register', (req, res) => {
    const { name, phone, password } = req.body;
    if (!name || !phone || !password)
        return res.status(400).json({ error: 'All fields required' });
    if (!/^\d{10}$/.test(phone))
        return res.status(400).json({ error: 'Phone must be 10 digits' });
    if (findUserByPhone(phone))
        return res.status(409).json({ error: 'Phone already registered' });

    const hash = bcrypt.hashSync(password, 10);
    const id = createUser(name, phone, hash, 'user');
    const token = jwt.sign({ id, name, phone, role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id, name, phone, role: 'user' } });
});

router.post('/login', (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'All fields required' });

    const user = findUserByPhone(phone);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
        return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
        { id: user.id, name: user.name, phone: user.phone, role: user.role },
        process.env.JWT_SECRET, { expiresIn: '7d' }
    );
    res.json({ token, user: { id: user.id, name: user.name, phone: user.phone, role: user.role } });
});

module.exports = router;
