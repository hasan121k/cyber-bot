const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
    
    // Render এর Environment থেকে আপনার টোকেনটি সিকিউর ভাবে এখানে আসবে
    const SECRET_TOKEN = process.env.BOT_TOKEN || "";

    const htmlCode = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>REAL OWNER 1 MIN - CYBER ENGINE</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        :root { 
            --glass: rgba(0, 255, 255, 0.08);
            --border: rgba(0, 255, 255, 0.35);
            --neon-cyan: #00ffff;
            --neon-violet: #8a2be2;
            --cyber-lime: #ccff00;
            --deep-dark: #0b0c1e;
            --electric-pink: #ff10f0; 
        }

        body, html {
            height: 100%; margin: 0; font-family: 'Segoe UI', system-ui, sans-serif;
            background: var(--deep-dark); color: #e0f0ff; overflow-x: hidden; user-select: none;
        }

        #introScreen {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: var(--deep-dark); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 10000;
            transition: opacity 0.8s ease-out;
        }
        .intro-line {
            font-size: clamp(26px, 8vw, 46px); font-weight: 800; letter-spacing: 5px; white-space: nowrap;
            text-transform: uppercase; border-right: 4px solid var(--neon-cyan); padding-right: 12px; 
            animation: typing 2s steps(22), blink 0.5s step-end infinite; overflow: hidden; 
            text-shadow: 0 0 20px var(--neon-violet), 0 0 40px var(--neon-cyan); color: #ffffff;
        }
        .intro-line span { color: var(--neon-cyan); text-shadow: 0 0 15px var(--neon-cyan); }
        @keyframes typing { from { width: 0 } to { width: 100% } }
        @keyframes blink { from, to { border-color: transparent } 50% { border-color: var(--neon-cyan) } }

        .app-frame { max-width: 480px; margin: auto; padding: 15px; }
        .glass-card {
            background: rgba(10, 20, 30, 0.5); backdrop-filter: blur(16px) saturate(180%);
            border: 1px solid var(--border); border-radius: 24px;
            padding: 20px; margin-bottom: 20px; box-shadow: 0 10px 35px -5px rgba(0, 255, 255, 0.3);
        }

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

        .history-wrap { max-height: 400px; overflow-y: auto; border-radius: 16px; padding-right: 5px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; text-align: center; }
        th { color: var(--neon-cyan); padding: 10px 4px; border-bottom: 1px solid var(--neon-violet); }
        td { padding: 8px 4px; border-bottom: 1px solid rgba(0, 255, 255, 0.1); }
        .win { color: #ccff00; font-weight: bold; text-shadow: 0 0 5px lime; }
        .loss { color: #ff10f0; font-weight: bold; text-shadow: 0 0 5px magenta; }
        .hidden { display: none !important; }
        #pID { color: rgba(200, 230, 255, 0.7); font-size: 12px; font-weight: bold; }

        /* Switches & Time Inputs */
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

            <div class="tg-switch-card">
                <span><i class="fab fa-telegram"></i> MAIN TG FORWARD</span>
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
                <button class="btn-glow" onclick="saveSchedules()">💾 SAVE SCHEDULE</button>
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
    // ⚠️ আপনার টোকেনটি সার্ভার থেকে ডাইনামিকভাবে এখানে বসবে (গিটহাবে দেখা যাবে না)
    const BOT_TOKEN = "\${SECRET_TOKEN}";
    const CHAT_ID = "-1003120065348"; 

    const API = "https://draw.ar-lottery01.com/WinGo/WinGo_1M/GetHistoryIssuePage.json";
    
    let lastFetchedPeriod = null, currentSignalPeriod = null, currentSignalResult = null; 
    let targetNums = [], currentLevel = 1, historyLogs = [];

    const sWin = new Audio('https://assets.mixkit.co/active_storage/sfx/2019/2019-preview.mp3');
    const sLoss = new Audio('https://assets.mixkit.co/active_storage/sfx/951/951-preview.mp3');
    const sDing = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

    function loadSchedules() {
        for(let i=1; i<=6; i++) {
            let start = localStorage.getItem(\`tg_start_\${i}\`);
            let end = localStorage.getItem(\`tg_end_\${i}\`);
            if(start) document.getElementById(\`start_\${i}\`).value = start;
            if(end) document.getElementById(\`end_\${i}\`).value = end;
        }
        let alwaysOn = localStorage.getItem('tg_always_on');
        if(alwaysOn !== null) {
            document.getElementById('alwaysOnToggle').checked = (alwaysOn === 'true');
        }
    }

    function saveSchedules() {
        for(let i=1; i<=6; i++) {
            let start = document.getElementById(\`start_\${i}\`).value;
            let end = document.getElementById(\`end_\${i}\`).value;
            localStorage.setItem(\`tg_start_\${i}\`, start);
            localStorage.setItem(\`tg_end_\${i}\`, end);
        }
        localStorage.setItem('tg_always_on', document.getElementById('alwaysOnToggle').checked);
        alert("✅ Schedule Saved Successfully!");
    }

    function isTimeActive() {
        const masterOn = document.getElementById('masterToggle').checked;
        const alwaysOn = document.getElementById('alwaysOnToggle').checked;
        const logText = document.getElementById('tgLogText');

        if (!masterOn) {
            logText.innerText = "❌ MAIN SWITCH IS OFF";
            logText.style.color = "#ff10f0";
            return false;
        }

        if (alwaysOn) {
            logText.innerText = "✅ 24/7 FORWARDING ACTIVE";
            logText.style.color = "#00ffff";
            return true;
        }

        const now = new Date();
        const bdtTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Dhaka"}));
        const currentMins = bdtTime.getHours() * 60 + bdtTime.getMinutes();

        for(let i=1; i<=6; i++) {
            let start = document.getElementById(\`start_\${i}\`).value;
            let end = document.getElementById(\`end_\${i}\`).value;
            
            if(start && end) {
                let sMins = parseInt(start.split(':')[0])*60 + parseInt(start.split(':')[1]);
                let eMins = parseInt(end.split(':')[0])*60 + parseInt(end.split(':')[1]);

                if (sMins <= eMins) {
                    if (currentMins >= sMins && currentMins < eMins) {
                        logText.innerText = \`✅ BDT SCHEDULE ACTIVE (SLOT \${i})\`;
                        logText.style.color = "#ccff00";
                        return true;
                    }
                } else {
                    if (currentMins >= sMins || currentMins < eMins) {
                        logText.innerText = \`✅ BDT SCHEDULE ACTIVE (SLOT \${i})\`;
                        logText.style.color = "#ccff00";
                        return true;
                    }
                }
            }
        }

        logText.innerText = "⏳ WAITING FOR NEXT SCHEDULE TIME...";
        logText.style.color = "orange";
        return false;
    }

    setInterval(isTimeActive, 1000);

    function sendTelegramMessage(text) {
        if (!isTimeActive() || !BOT_TOKEN) return; 
        let url = \`https://api.telegram.org/bot\${BOT_TOKEN}/sendMessage\`;
        fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: CHAT_ID, text: text })
        }).catch(err => console.error(err));
    }

    function getUnicodeNumber(str) {
        const map = {'0':'𝟎','1':'𝟏','2':'𝟐','3':'𝟑','4':'𝟒','5':'𝟓','6':'𝟔','7':'𝟕','8':'𝟖','9':'𝟗'};
        return str.split('').map(c => map[c] || c).join('');
    }

    function getUnicodeResult(res) {
        return res === "BIG" ? "𝐁𝐈𝐆" : "𝐒𝐌𝐀𝐋 পরীক্ষামূলক";
    }

    window.onload = () => {
        loadSchedules(); 
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

    function clearHistory() {
        historyLogs = [];
        document.getElementById('logs').innerHTML = '';
    }

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
            
            if(isWin) { sWin.play().catch(()=>{}); currentLevel = 1; } 
            else { sLoss.play().catch(()=>{}); currentLevel++; if(currentLevel > 4) currentLevel = 1; }
            
            const multiplier = currentLevel === 1 ? "1X" : (currentLevel === 2 ? "3X" : (currentLevel === 3 ? "9X" : "27X"));
            document.getElementById('mLevel').innerText = \`MARTINGALE: LEVEL \${currentLevel} (\${multiplier})\`;
            
            const entry = {
                period: finishedPeriodLast3, pred: currentSignalResult,
                result: \`\${actualResult}(\${number})\`,
                status: isWin ? 'WIN' : 'LOSS', winClass: isWin ? 'win' : 'loss'
            };
            
            historyLogs.unshift(entry);
            if (historyLogs.length > 100) historyLogs = historyLogs.slice(0, 100);
            
            const row = \`<tr><td>\${entry.period}</td><td>\${entry.pred}</td><td>\${entry.result}</td><td class="\${entry.winClass}">\${entry.status}</td></tr>\`;
            document.getElementById('logs').innerHTML = row + document.getElementById('logs').innerHTML;

            if (isTimeActive()) {
                const boldFinishedPeriod = getUnicodeNumber(finishedPeriodLast3);
                let winLossMsg = isWin ? 
                    \`🌐 𝐏𝐄𝐑𝐈𝐎𝐃:-\${boldFinishedPeriod} 👑\\n\\n🏆 𝐑𝐄𝐒𝐔𝐋𝐓𝐒:-𝐖𝐈𝐍𝐍 💯\\n     \\n  💥 𝐊𝐔𝐏 𝐌𝐀𝐌𝐀 ☠️\` : 
                    \`🌐 𝐏𝐄𝐑𝐈𝐎𝐃:-\${boldFinishedPeriod} 👑\\n\\n🚫 𝐑𝐄𝐒𝐔𝐋𝐓𝐒:-𝐋𝐎𝐒𝐒 ❌\\n     \\n     💔 𝐍𝐎 𝐏𝐄𝐑𝐀 🛑\`;
                sendTelegramMessage(winLossMsg);
            }
        }
        
        const nextPeriodNum = (BigInt(finishedPeriod) + 1n).toString();
        const nextPeriodLast3 = nextPeriodNum.slice(-3);
        
        const last5 = list.slice(0, 5).map(x => parseInt(x.number) >= 5 ? "BIG" : "SMALL");
        const lastNums = list.slice(0, 5).map(x => parseInt(x.number));
        const stratDisp = document.getElementById('stratDisplay');

        let nextPred;
        if (last5[0] === last5[1] && last5[1] === last5[2]) {
            nextPred = last5[0]; stratDisp.innerText = "MODE: DRAGON PULSE";
        } else {
            nextPred = (last5[0] === "BIG") ? "SMALL" : "BIG"; stratDisp.innerText = "MODE: NEURAL REVERSE";
        }

        const sum = lastNums.reduce((a, b) => a + b, 0);
        if (nextPred === "BIG") { targetNums = (sum > 20) ? [0, 2] : [1, 3]; } 
        else { targetNums = (sum < 25) ? [7, 9] : [6, 8]; }

        currentSignalPeriod = nextPeriodNum;
        currentSignalResult = nextPred;
        
        document.getElementById('pID').innerText = "PERIOD: " + currentSignalPeriod;
        document.getElementById('pRes').innerText = currentSignalResult;
        document.getElementById('pRes').style.color = currentSignalResult === "BIG" ? "#00ffff" : "#ccff00";
        document.getElementById('numRow').innerHTML = \`<div class="num-circle">\${targetNums[0]}</div><div class="num-circle">\${targetNums[1]}</div>\`;

        if (isTimeActive()) {
            const boldNextPeriod = getUnicodeNumber(nextPeriodLast3);
            const fontResult = getUnicodeResult(currentSignalResult);
            const boldNum1 = getUnicodeNumber(targetNums[0].toString());
            const boldNum2 = getUnicodeNumber(targetNums[1].toString());
            
            let signalMsg = \`🟣 𝐖𝐈𝐍𝐆𝐎 𝟏 𝐌𝐈𝐍𝐔𝐓𝐄𝐒 🟢 \\n    \\n🌐 𝟒-𝟓 𝐒𝐓𝐀𝐏 𝐅𝐎𝐋𝐋𝐎𝐖 🌐\\n\\n      🔰 𝐏𝐄𝐑𝐈𝐎𝐃:-\${boldNextPeriod} 🔔\\n\\n        📣 𝐁𝐄𝐓:-\${fontResult} ✅\\n\\n ➡️ 𝐍𝐔𝐌𝐁𝐄𝐑 𝐁𝐄𝐓:-\${boldNum1}-\${boldNum2} 🛑\`;
            
            setTimeout(() => { sendTelegramMessage(signalMsg); }, 2000); 
        }
    }
</script>

</body>
</html>
    `;
    
    res.send(htmlCode);
});

app.listen(PORT, () => {
    console.log("✅ Server running perfectly!");
});
