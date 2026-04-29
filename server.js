const express = require('express');
const axios = require('axios');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

process.on('unhandledRejection', (reason, promise) => {});
process.on('uncaughtException', (err) => {});

const BOT_TOKEN = process.env.BOT_TOKEN;
const API_URL = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";

let botSettings = { masterOn: true, alwaysOn: false, chatId: "", slots: [] };

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
    if (!BOT_TOKEN) return;
    const targetChat = botSettings.chatId && botSettings.chatId.trim() !== "" ? botSettings.chatId : "-1003120065348";
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
    try { 
        await axios.post(url, { chat_id: targetChat, text: text }, { timeout: 5000 }); 
    } catch (error) {
        console.log("Telegram Error:", error.response?.data?.description || error.message);
    }
}

async function runBotEngine() {
    try {
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Referer': 'https://draw.ar-lottery01.com/'
        };

        const response = await axios.get(API_URL + '?t=' + Date.now(), { headers: headers, timeout: 5000 });
        if (!response.data || !response.data.data || !response.data.data.list) return;

        const list = response.data.data.list;
        const latestData = list[0];
        
        if (lastFetchedPeriod !== latestData.issueNumber) {
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
        console.log("API Fetch Error");
    }
}

setInterval(runBotEngine, 2000);

// API Routes
app.get('/ping', (req, res) => { res.status(200).send("Bot is Alive!"); });

app.post('/api/sync', (req, res) => {
    botSettings = req.body; 
    res.json({status: "ok"});
});

// ==========================================
// TEST TELEGRAM ROUTE
// ==========================================
app.post('/api/test-tg', async (req, res) => {
    if (!BOT_TOKEN) return res.json({success: false, error: "BOT_TOKEN is missing in Render Settings!"});
    const targetChat = req.body.chatId && req.body.chatId.trim() !== "" ? req.body.chatId : "-1003120065348";
    
    try {
        await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            chat_id: targetChat,
            text: "✅ [TEST SUCCESS] Your Bot is connected and working perfectly!"
        });
        res.json({success: true});
    } catch (err) {
        res.json({success: false, error: err.response?.data?.description || err.message});
    }
});

// HTML
app.get('/', (req, res) => {
    const htmlCode = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REAL OWNER 1 MIN - CYBER ENGINE</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root { --glass: rgba(0,255,255,0.08); --border: rgba(0,255,255,0.35); --neon-cyan: #00ffff; --neon-violet: #8a2be2; --cyber-lime: #ccff00; --deep-dark: #0b0c1e; }
        body, html { height: 100%; margin: 0; font-family: 'Segoe UI', system-ui, sans-serif; background: var(--deep-dark); color: #e0f0ff; overflow-x: hidden; user-select: none; }
        #introScreen { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: var(--deep-dark); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 10000; transition: opacity 0.8s ease-out; }
        .intro-line { font-size: clamp(26px, 8vw, 46px); font-weight: 800; letter-spacing: 5px; white-space: nowrap; text-transform: uppercase; border-right: 4px solid var(--neon-cyan); padding-right: 12px; animation: typing 2s steps(22), blink 0.5s step-end infinite; overflow: hidden; text-shadow: 0 0 20px var(--neon-violet), 0 0 40px var(--neon-cyan); color: #ffffff; }
        .intro-line span { color: var(--neon-cyan); text-shadow: 0 0 15px var(--neon-cyan); }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes blink { from, to { border-color: transparent } 50% { border-color: var(--neon-cyan) } }
        .app-frame { max-width: 480px; margin: auto; padding: 15px; }
        .glass-card { background: rgba(10, 20, 30, 0.5); backdrop-filter: blur(16px) saturate(180%); border: 1px solid var(--border); border-radius: 24px; padding: 20px; margin-bottom: 20px; box-shadow: 0 10px 35px -5px rgba(0, 255, 255, 0.3); }
        .header { text-align: center; border-bottom: 2px solid var(--neon-cyan); padding-bottom: 10px; margin-bottom: 20px; }
        .header span:first-child { color: #ffffff; font-weight: 800; letter-spacing: 2px; }
        .header span:last-child { color: var(--neon-cyan); font-weight: 400; }
        .pred-val { font-size: 75px; font-weight: 900; text-shadow: 0 0 25px var(--neon-violet), 0 0 45px var(--neon-cyan); margin: 10px 0; color: #fff; }
        .timer-display { font-size: 26px; color: var(--cyber-lime); font-weight: bold; text-shadow: 0 0 10px #ccff00; }
        .status-info { display: flex; justify-content: space-between; font-size: 11px; color: var(--neon-cyan); margin-bottom: 10px; letter-spacing: 0.5px;}
        .strat-mode { font-size: 10px; background: rgba(138, 43, 226, 0.25); padding: 4px 14px; border-radius: 30px; color: var(--cyber-lime); border: 1px solid var(--neon-cyan); margin-bottom: 12px; display: inline-block; font-weight: 600; }
        .lvl-badge { background: rgba(0, 255, 255, 0.1); border: 1px solid var(--neon-cyan); padding: 8px; border-radius: 40px; font-weight: bold; margin: 15px 0; font-size: 13px; color: #fff; box-shadow: 0 0 8px var(--neon-cyan); }
        .num-row { display: flex; justify-content: center; gap: 30px; }
        .num-circle { width: 50px; height: 50px; line-height: 50px; border: 2px solid var(--cyber-lime); border-radius: 50%; font-weight: 900; background: rgba(0,0,0,0.5); color: var(--cyber-lime); font-size: 22px; box-shadow: 0 0 15px var(--cyber-lime); }
        .btn-clear { width: 100%; padding: 12px; background: linear-gradient(90deg, #ff2a5e, #b030b0); border: none; border-radius: 40px; color: white; font-weight: 800; cursor: pointer; box-shadow: 0 0 15px rgba(255, 42, 94, 0.6); font-size: 11px; margin-top: 10px; }
        .btn-glow { width: 100%; padding: 12px; background: linear-gradient(115deg, #00c8ff, #8a2be2); border: none; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; box-shadow: 0 0 15px #00ffff; text-transform: uppercase; margin-top: 10px;}
        .btn-test { width: 100%; padding: 12px; background: linear-gradient(115deg, #00d2ff, #3a7bd5); border: none; border-radius: 12px; color: white; font-weight: 800; cursor: pointer; box-shadow: 0 0 15px #00d2ff; text-transform: uppercase; margin-top: 10px;}
        .history-wrap { max-height: 400px; overflow-y: auto; border-radius: 16px; padding-right: 5px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; }
        th { color: var(--neon-cyan); padding: 10px 4px; border-bottom: 1px solid var(--neon-violet); }
        td { padding: 8px 4px; border-bottom: 1px solid rgba(0, 255, 255, 0.1); }
        .win { color: #ccff00; font-weight: bold; text-shadow: 0 0 5px lime; }
        .loss { color: #ff10f0; font-weight: bold; text-shadow: 0 0 5px magenta; }
        .hidden { display: none !important; }
        #pID { color: rgba(200, 230, 255, 0.7); font-size: 12px; font-weight: bold; }
        .tg-switch-card { display: flex; justify-content: space-between; align-items: center; background: rgba(0, 0, 0, 0.6); padding: 12px 15px; border-radius: 15px; border: 1px solid var(--neon-cyan); margin-bottom: 10px; }
        .tg-switch-card span { color: var(--neon-cyan); font-weight: 800; font-size: 12px; letter-spacing: 1px;}
        .switch { position: relative; display: inline-block; width: 44px; height: 22px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #333; transition: .4s; border-radius: 34px; border: 1px solid #555; }
        .slider:before { position: absolute; content: ""; height: 14px; width: 14px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: var(--cyber-lime); border-color: var(--cyber-lime); box-shadow: 0 0 10px var(--cyber-lime); }
        input:checked + .slider:before { transform: translateX(22px); background-color: #000; }
        #tgLogText { font-size: 12px; text-align: center; margin-bottom: 15px; font-weight: bold; text-transform: uppercase; }
        .time-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; font-size: 11px; color: #fff;}
        input[type="time"] { background: rgba(0, 20, 30, 0.9); border: 1px solid var(--neon-cyan); border-radius: 6px; color: var(--cyber-lime); padding: 5px; outline: none; font-weight: bold; text-align: center; width: 100px; font-family: inherit;}
        input[type="time"]::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer;}
        .chat-id-input { width: 100%; background: rgba(0,20,30,0.9); border: 1px solid var(--neon-cyan); border-radius: 8px; color: var(--cyber-lime); padding: 10px; outline: none; font-weight: bold; box-sizing: border-box; text-align: center; margin-top: 5px; }
        .chat-id-input::placeholder { color: rgba(204, 255, 0, 0.4); }
    </style>
</head>
<body>

    <div id="introScreen">
        <div class="intro-line"><span>REAL</span> PRO</div>
        <p style="color: var(--neon-violet); letter-spacing: 3px; margin-top: 22px; font-size: 11px;">⚡ TG:- @ONLEYCHAT ⚡</p>
    </div>

    <div id="mainWrapper" class="hidden">
        <div class="app-frame">
            <div class="header">
                <span style="font-size: 26px; font-weight: 800;">REAL OWNER  </span><span style="font-size: 22px; color: var(--neon-cyan);">PRO</span>
            </div>

            <div class="tg-switch-card" style="flex-direction: column; align-items: stretch; gap: 5px;">
                <span style="text-align: center;"><i class="fab fa-telegram"></i> TARGET CHAT ID / USER CODE</span>
                <input type="text" id="tgChatIdInput" class="chat-id-input" placeholder="Enter Chat ID (e.g. -1003120...)">
            </div>

            <div class="tg-switch-card">
                <span><i class="fas fa-paper-plane"></i> MAIN TG FORWARD</span>
                <label class="switch">
                    <input type="checkbox" id="masterToggle" checked>
                    <span class="slider"></span>
                </label>
            </div>

            <div class="tg-switch-card" style="border-color: var(--neon-violet);">
                <span style="color: var(--neon-violet);"><i class="fas fa-infinity"></i> 24/7 ALWAYS ON (No Time)</span>
                <label class="switch">
                    <input type="checkbox" id="alwaysOnToggle">
                    <span class="slider"></span>
                </label>
            </div>
            
            <div id="tgLogText" style="color: #ccff00;">✅ CHECKING STATUS...</div>

            <div class="glass-card" style="padding: 15px; margin-bottom: 20px;" id="scheduleBox">
                <div style="font-size: 12px; color: var(--neon-cyan); margin-bottom: 12px; font-weight: bold; text-align: center;">📅 BDT TIME SCHEDULE (12 HOURS)</div>
                
                <div id="timeSlotsContainer">
                    <script>
                        for(let i=1; i<=6; i++) {
                            document.write(\`
                                <div class="time-row">
                                    <span>SLOT \${i}:</span>
                                    <input type="time" id="start_\${i}">
                                    <span>TO</span>
                                    <input type="time" id="end_\${i}">
                                </div>
                            \`);
                        }
                    </script>
                </div>
                <button class="btn-glow" onclick="saveSchedules()">💾 SAVE SETTINGS</button>
                <button class="btn-test" onclick="triggerTestMessage()">🚀 TEST TELEGRAM MESSAGE</button>
            </div>

            <div id="hackSection">
                <div class="status-info">
                    <span>🔷 SERVER: CYBERLINK (1 MIN)</span>
                    <span id="pingVal">PING: 12MS</span>
                </div>

                <div class="glass-card" style="text-align: center;">
                    <div id="stratDisplay" class="strat-mode">MODE: REAL OWNER SCAN</div>
                    <div id="timer" class="timer-display">00:60</div>
                    <div id="pID" style="margin-bottom: 6px;">PERIOD: ---</div>
                    <div id="pRes" class="pred-val">WAIT</div>
                    <div id="mLevel" class="lvl-badge">MARTINGALE: LEVEL 1 (1X)</div>
                    <div style="font-size: 11px; color: var(--cyber-lime); margin-bottom: 5px;">⟁ OPPOSITE NUMBERS ⟁</div>
                    <div class="num-row" id="numRow">
                        <div class="num-circle">?</div>
                        <div class="num-circle">?</div>
                    </div>
                </div>

                <div class="glass-card">
                    <div style="font-size: 12px; color: var(--neon-cyan); margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
                        <span>🌀 NEURAL HISTORY</span>
                        <button class="btn-clear" style="width: auto; margin-top:0;" onclick="clearHistory()">🗑️ CLEAR</button>
                    </div>
                    <div class="history-wrap">
                        <table>
                            <thead><tr><th>PERIOD</th><th>PRED</th><th>RESULT</th><th>STATUS</th></tr></thead>
                            <tbody id="logs"></tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>

<script>
    const API = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";
    let lastFetchedPeriod = null, currentSignalPeriod = null, currentSignalResult = null; 
    let targetNums = [], currentLevel = 1, historyLogs = [];

    const sWin = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    const sLoss = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
    const sDing = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    function loadSchedules() {
        for(let i=1; i<=6; i++) {
            let start = localStorage.getItem('tg_start_'+i);
            let end = localStorage.getItem('tg_end_'+i);
            if(start) document.getElementById('start_'+i).value = start;
            if(end) document.getElementById('end_'+i).value = end;
        }
        let alwaysOn = localStorage.getItem('tg_always_on');
        if(alwaysOn !== null) {
            document.getElementById('alwaysOnToggle').checked = (alwaysOn === 'true');
        }
        let savedChatId = localStorage.getItem('tg_chat_id');
        if(savedChatId) {
            document.getElementById('tgChatIdInput').value = savedChatId;
        }
    }

    function saveSchedules() {
        for(let i=1; i<=6; i++) {
            localStorage.setItem('tg_start_'+i, document.getElementById('start_'+i).value);
            localStorage.setItem('tg_end_'+i, document.getElementById('end_'+i).value);
        }
        localStorage.setItem('tg_always_on', document.getElementById('alwaysOnToggle').checked);
        localStorage.setItem('tg_chat_id', document.getElementById('tgChatIdInput').value);
        
        syncWithServer();
        alert("✅ Settings Saved Successfully!");
    }

    async function triggerTestMessage() {
        const chatId = document.getElementById('tgChatIdInput').value;
        alert("⏳ Sending Test Message... Please check your Telegram!");
        try {
            const res = await fetch('/api/test-tg', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ chatId: chatId })
            });
            const data = await res.json();
            if(data.success) {
                alert("✅ Success! Test message sent to Telegram.");
            } else {
                alert("❌ Error: " + data.error);
            }
        } catch(e) {
            alert("❌ Server Error!");
        }
    }

    function syncWithServer() {
        let slots = [];
        for(let i=1; i<=6; i++) {
            slots.push({
                start: document.getElementById('start_'+i).value || "",
                end: document.getElementById('end_'+i).value || ""
            });
        }
        fetch('/api/sync', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                masterOn: document.getElementById('masterToggle').checked,
                alwaysOn: document.getElementById('alwaysOnToggle').checked,
                chatId: document.getElementById('tgChatIdInput').value, 
                slots: slots
            })
        }).catch(err => {});
    }

    setInterval(syncWithServer, 3000);

    function isTimeActive() {
        const masterOn = document.getElementById('masterToggle').checked;
        const alwaysOn = document.getElementById('alwaysOnToggle').checked;
        const logText = document.getElementById('tgLogText');

        if (!masterOn) { logText.innerText = "❌ MAIN SWITCH IS OFF"; logText.style.color = "#ff10f0"; return; }
        if (alwaysOn) { logText.innerText = "✅ 24/7 FORWARDING ACTIVE"; logText.style.color = "#00ffff"; return; }
        
        logText.innerText = "✅ SETTINGS SENT TO SERVER"; logText.style.color = "#ccff00";
    }

    setInterval(isTimeActive, 1000);

    window.onload = () => {
        loadSchedules(); 
        setTimeout(() => syncWithServer(), 1000);
        setTimeout(() => {
            document.getElementById('introScreen').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('introScreen').classList.add('hidden');
                document.getElementById('mainWrapper').classList.remove('hidden');
                syncEngine();
                setInterval(syncEngine, 2000);
                startClock();
            }, 800);
        }, 2000); 
    };

    function clearHistory() { historyLogs = []; document.getElementById('logs').innerHTML = ''; }

    function startClock() {
        setInterval(() => {
            const rem = 60 - new Date().getSeconds();
            let displayRem = rem === 60 ? "00" : (rem < 10 ? '0' + rem : rem);
            document.getElementById('timer').innerText = \`00:\${displayRem}\`;
            if(rem === 5) sDing.play().catch(()=>{});
            document.getElementById('timer').style.color = rem <= 5 ? "#ff10f0" : "#ccff00";
        }, 1000);
    }

    async function syncEngine() {
        try {
            const r = await fetch(API + '?t=' + Date.now());
            const d = await r.json();
            if(!d || !d.data || !d.data.list) return;
            const latestData = d.data.list[0];
            if (lastFetchedPeriod !== latestData.issueNumber) {
                processHybrid(latestData.issueNumber, parseInt(latestData.number), d.data.list);
                lastFetchedPeriod = latestData.issueNumber;
            }
        } catch (e) {}
    }

    function processHybrid(finishedPeriod, number, list) {
        const actualResult = number >= 5 ? "BIG" : "SMALL";
        const finishedPeriodLast3 = finishedPeriod.slice(-3); 
        
        if (currentSignalPeriod && currentSignalPeriod === finishedPeriod) {
            const isWin = (currentSignalResult === actualResult) || targetNums.includes(number);
            if(isWin) { sWin.play().catch(()=>{}); currentLevel = 1; } else { sLoss.play().catch(()=>{}); currentLevel++; if(currentLevel > 4) currentLevel = 1; }
            const multiplier = currentLevel === 1 ? "1X" : (currentLevel === 2 ? "3X" : (currentLevel === 3 ? "9X" : "27X"));
            document.getElementById('mLevel').innerText = \`MARTINGALE: LEVEL \${currentLevel} (\${multiplier})\`;
            
            const entry = { period: finishedPeriodLast3, pred: currentSignalResult, result: \`\${actualResult}(\${number})\`, status: isWin ? 'WIN' : 'LOSS', winClass: isWin ? 'win' : 'loss' };
            historyLogs.unshift(entry);
            if (historyLogs.length > 100) historyLogs = historyLogs.slice(0, 100);
            const row = \`<tr><td>\${entry.period}</td><td>\${entry.pred}</td><td>\${entry.result}</td><td class="\${entry.winClass}">\${entry.status}</td></tr>\`;
            document.getElementById('logs').innerHTML = row + document.getElementById('logs').innerHTML;
        }
        
        const nextPeriodNum = (BigInt(finishedPeriod) + 1n).toString();
        const nextPeriodLast3 = nextPeriodNum.slice(-3);
        const last5 = list.slice(0, 5).map(x => parseInt(x.number) >= 5 ? "BIG" : "SMALL");
        const lastNums = list.slice(0, 5).map(x => parseInt(x.number));
        const stratDisp = document.getElementById('stratDisplay');

        let nextPred;
        if (last5[0] === last5[1] && last5[1] === last5[2]) { nextPred = last5[0]; stratDisp.innerText = "MODE: DRAGON PULSE"; } 
        else { nextPred = (last5[0] === "BIG") ? "SMALL" : "BIG"; stratDisp.innerText = "MODE: NEURAL REVERSE"; }

        const sum = lastNums.reduce((a, b) => a + b, 0);
        if (nextPred === "BIG") { targetNums = (sum > 20) ? [0, 2] : [1, 3]; } else { targetNums = (sum < 25) ? [7, 9] : [6, 8]; }

        currentSignalPeriod = nextPeriodNum;
        currentSignalResult = nextPred;
        
        document.getElementById('pID').innerText = "PERIOD: " + currentSignalPeriod;
        document.getElementById('pRes').innerText = currentSignalResult;
        document.getElementById('pRes').style.color = currentSignalResult === "BIG" ? "#00ffff" : "#ccff00";
        document.getElementById('numRow').innerHTML = \`<div class="num-circle">\${targetNums[0]}</div><div class="num-circle">\${targetNums[1]}</div>\`;
    }
</script>
</body>
</html>`;
    res.send(htmlCode);
});

app.listen(PORT, () => { console.log(`✅ Server is perfectly Live!`); });
