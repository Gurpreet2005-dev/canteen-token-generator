const axios = require('axios');

async function sendSMS(phone, tokenNumber, name = '') {
    const key = process.env.FAST2SMS_API_KEY;
    if (!key || key === 'YOUR_FAST2SMS_API_KEY_HERE') {
        console.log(`📵 SMS skipped (no API key). Would have sent to ${phone}: Hi ${name}, Token #${tokenNumber} is ready!`);
        return;
    }

    const greeting = name ? `Hi ${name}, ` : '';
    const message = `${greeting}your canteen order Token #${tokenNumber} is ready! Please collect it. - College Canteen`;

    try {
        await axios.post(
            'https://www.fast2sms.com/dev/bulkV2',
            {
                route: 'q',
                message,
                language: 'english',
                flash: 0,
                numbers: phone,
            },
            {
                headers: {
                    authorization: key,
                    'Content-Type': 'application/json',
                },
            }
        );
        console.log(`✅ SMS sent to ${phone} for token #${tokenNumber}`);
    } catch (err) {
        console.error('❌ SMS failed:', err?.response?.data || err.message);
    }
}

module.exports = { sendSMS };
