const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// টেলিগ্রাম বট টোকেন (Render Environment থেকে আসবে)
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = "-1003120065348";
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

// সার্ভারের নিজস্ব মেমরি (alwaysOn: true করে দেওয়া হয়েছে)
let botSettings = { masterOn: true, alwaysOn: true, slots: [] };

let lastFetchedPeriod = null, currentSignalPeriod = null, currentSignalResult = null;
let targetNums = [], currentLevel = 1;

function isBackendTimeActive() {
    if (!botSettings.masterOn) return false;
    if (botSettings.alwaysOn) return true;

    const now = new Date();
    const bdtTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
    const currentMins = bdtTime.getHours() * 60 + bdtTime.getMinutes();

    for (let slot of botSettings.slots) {
        if (slot.start && slot.end) {
            let sMins = parseInt(slot.start.split(':')[0]) * 60 + parseInt(slot.start.split(':')[1]);
            let eMins = parseInt(slot.end.split(':')[0]) * 60 + parseInt(slot.end.split(':')[1]);

            if (sMins <= eMins) {
                if (currentMins >= sMins && currentMins < eMins) return true;
            } else {
                if (currentMins >= sMins || currentMins < eMins) return true;
            }
        }
    }
    return false;
}

function getUnicodeNumber(str) {
    const map = {'0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'};
    return str.split('').map(c => map[c] || c).join('');
}
function getUnicodeResult(res) {
    return res === "BIG" ? "𝐁𝐈𝐆" : "𝐒𝐌𝐀𝐋𝐋";
}

async function sendTelegramMessage(text) {
    if (!BOT_TOKEN) {
        console.log("❌ Error: BOT_TOKEN Render এ বসানো হয়নি!");
        return;
    }
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try { 
        await axios.post(url, { chat_id: CHAT_ID, text: text }); 
        console.log("✅ Telegram এ মেসেজ পাঠানো হয়েছে!");
    } catch (error) { 
        console.log("❌ Telegram Error:", error.response ? error.response.data : error.message); 
    }
}

async function runBotEngine() {
    try {
        const response = await axios.get(API_URL + '?t=' + Date.now());
        const list = response.data.data.list;
        const latestData = list[0];
        
        if (lastFetchedPeriod !== latestData.issueNumber) {
            console.log(`🔄 নতুন গেম পাওয়া গেছে: Period ${latestData.issueNumber}`);
            lastFetchedPeriod = latestData.issueNumber;
            const number = parseInt(latestData.number);
            const actualResult = number >= 5 ? "BIG" : "SMALL";
            const finishedPeriodLast3 = latestData.issueNumber.slice(-3);
            
            // Win/Loss Check
            if (currentSignalPeriod && currentSignalPeriod === latestData.issueNumber) {
                const isWin = (currentSignalResult === actualResult) || targetNums.includes(number);
                if(isWin) { currentLevel = 1; } else { currentLevel++; if(currentLevel > 4) currentLevel = 1; }
                
                let winLossMsg = isWin ? 
                    `🌐 𝐏𝐄𝐑𝐈𝐎𝐃:-${getUnicodeNumber(finishedPeriodLast3)} 👑\n\n🏆 𝐑𝐄𝐒𝐔𝐋𝐓𝐒:-𝐖𝐈𝐍𝐍 💯\n     \n  💥 𝐊𝐔𝐏 𝐌𝐀𝐌𝐀 ☠️` : 
                    `🌐 𝐏𝐄𝐑𝐈𝐎𝐃:-${getUnicodeNumber(finishedPeriodLast3)} 👑\n\n🚫 𝐑𝐄𝐒𝐔𝐋𝐓𝐒:-𝐋𝐎𝐒𝐒 ❌\n     \n     💔 𝐍𝐎 𝐏𝐄𝐑𝐀 🛑`;
                    
                if (isBackendTimeActive()) sendTelegramMessage(winLossMsg);
            }
            
            // Next Prediction
            const nextPeriodNum = (BigInt(latestData.issueNumber) + 1n).toString();
            const nextPeriodLast3 = nextPeriodNum.slice(-3);
            const last5 = list.slice(0, 5).map(x => parseInt(x.number) >= 5 ? "BIG" : "SMALL");
            const lastNums = list.slice(0, 5).map(x => parseInt(x.number));

            let nextPred = (last5[0] === last5[1] && last5[1] === last5[2]) ? last5[0] : ((last5[0] === "BIG") ? "SMALL" : "BIG");
            const sum = lastNums.reduce((a, b) => a + b, 0);
            
            if (nextPred === "BIG") { targetNums = (sum > 20) ? [0, 2] : [1, 3]; } 
            else { targetNums = (sum < 25) ? [7, 9] : [6, 8]; }

            currentSignalPeriod = nextPeriodNum;
            currentSignalResult = nextPred;
            
            let signalMsg = `🟣 𝐖𝐈𝐍𝐆𝐎 𝟏 𝐌𝐈𝐍𝐔𝐓𝐄𝐒 🟢 \n   \n🌐 𝟒-𝟓 𝐒𝐓𝐀𝐏 𝐅𝐎𝐋𝐋𝐎𝐖 🌐\n\n      🔰 𝐏𝐄𝐑𝐈𝐎𝐃:-${getUnicodeNumber(nextPeriodLast3)} 🔔\n\n        📣 𝐁𝐄𝐓:-${getUnicodeResult(currentSignalResult)} ✅\n\n ➡️ 𝐍𝐔𝐌𝐁𝐄𝐑 𝐁𝐄𝐓:-${getUnicodeNumber(targetNums[0].toString())}-${getUnicodeNumber(targetNums[1].toString())} 🛑`;
            
            if (isBackendTimeActive()) {
                setTimeout(() => { sendTelegramMessage(signalMsg); }, 2000); 
            }
        }
    } catch (e) {
        console.log("❌ API বা লটারি ওয়েবসাইট থেকে ডাটা আসছে না! Error:", e.message);
    }
}

// এই ইঞ্জিন প্রতি ২ সেকেন্ড পর পর সার্ভারে নিজে নিজে ঘুরবে
setInterval(runBotEngine, 2000);

// HTML Routing (Frontend)
app.post('/api/sync', (req, res) => {
    botSettings = req.body;
    res.json({status: "ok"});
});

app.get('/', (req, res) => {
    res.send("<h1>Server is Running. Web UI is disabled in this version to test Telegram.</h1>");
});

app.listen(PORT, () => { console.log("✅ Server running perfectly on Port: " + PORT); });
