<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Card Game Digital Nusantara - ONLINE MODE</title>
    <script type="module">
        // Firebase akan di-import sebagai module, 
        // tapi karena game pakai vanilla JS, kita pakai CDN compat version
    </script>

    <!-- Firebase Compat SDK (lebih mudah dipakai dengan vanilla JS) -->
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: #fff;
            overflow-y: auto;
        }

        /* ============================================ */
        /* PRE-LOADING SCREEN */
        /* ============================================ */
        #pre-loading-screen {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            padding: 20px;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 20000;
            transition: opacity 0.5s ease-out;
        }
        #pre-loading-screen.hidden { opacity: 0; pointer-events: none; }

        .pre-loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 30px;
        }
        .pre-loading-title {
            font-size: 3em;
            font-weight: bold;
            text-shadow: 0 4px 20px rgba(0,0,0,0.3);
            animation: titlePulse 2s ease-in-out infinite;
            margin: 0;
        }
        .pre-loading-subtitle {
            font-size: 1.2em;
            opacity: 0.9;
            margin: 0;
        }
        .pre-loading-spinner {
            width: 80px; height: 80px;
            border: 8px solid rgba(255,255,255,0.3);
            border-top: 8px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        .pre-loading-info {
            font-size: 1.1em;
            opacity: 0.8;
            margin: 0;
            min-height: 30px;
            animation: fadeInOut 2s ease-in-out infinite;
        }
        @keyframes fadeInOut { 0%,100%{opacity:0.8;} 50%{opacity:0.4;} }

        .btn-play {
            padding: 20px 80px;
            font-size: 2em;
            font-weight: bold;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4);
            transition: all 0.3s ease;
            text-transform: uppercase;
            letter-spacing: 3px;
            display: none;
            animation: playButtonAppear 0.5s ease-out;
        }
        @keyframes playButtonAppear { from{transform:scale(0);opacity:0;} to{transform:scale(1);opacity:1;} }
        .btn-play:hover { transform: translateY(-5px) scale(1.05); box-shadow: 0 15px 40px rgba(0,0,0,0.5); }

        /* ============================================ */
        /* MATCHMAKING SCREEN */
        /* ============================================ */
        #matchmaking-screen {
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            padding: 20px;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 10000;
        }
        #matchmaking-screen.active { display: flex; }
        #matchmaking-screen.hidden { display: none; }

        .matchmaking-container {
            background: rgba(255,255,255,0.1);
            padding: 50px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .matchmaking-title {
            font-size: 2.5em;
            margin-bottom: 20px;
            animation: titlePulse 2s ease-in-out infinite;
        }
        .matchmaking-spinner {
            width: 80px; height: 80px;
            border: 8px solid rgba(255,255,255,0.3);
            border-top: 8px solid #fff;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 30px auto;
        }
        .matchmaking-status { font-size: 1.3em; margin: 20px 0; min-height: 30px; }
        .btn-cancel {
            margin-top: 20px; padding: 15px 40px;
            font-size: 1.1em;
            background: rgba(244,67,54,0.8);
            color: white; border: none; border-radius: 10px;
            cursor: pointer; transition: all 0.3s;
        }
        .btn-cancel:hover { background: rgba(244,67,54,1); transform: translateY(-2px); }
        .btn-start {
            padding: 20px 60px; font-size: 1.5em; font-weight: bold;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white; border: none; border-radius: 50px; cursor: pointer;
            box-shadow: 0 10px 30px rgba(0,0,0,0.4); transition: all 0.3s ease;
            text-transform: uppercase; letter-spacing: 2px;
        }
        .btn-start:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(0,0,0,0.5); }

        /* ============================================ */
        /* GAME CONTAINER */
        /* ============================================ */
        .game-container {
            display: none;
            min-height: 100vh;
            flex-direction: column;
            max-width: 1800px;
            margin: 0 auto;
            padding: 10px;
        }
        .game-container.active { display: flex; }

        .main-content {
            display: grid;
            grid-template-columns: 200px 1fr;
            gap: 10px;
            flex: 0 0 auto;
            margin-bottom: 10px;
            width: 100%;
            box-sizing: border-box;
            align-items: start;
        }

        /* OPPONENTS PANEL */
        .opponents-panel {
            background: rgba(255,255,255,0.1);
            padding: 10px; border-radius: 10px;
            backdrop-filter: blur(10px);
            overflow-y: auto;
            max-height: calc(100vh - 10px);
            height: fit-content;
        }
		
        .opponents-title {
            font-size: 1.1em; font-weight: bold;
            margin-bottom: 10px; text-align: center;
            padding-bottom: 8px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
        }
        .opponent-item {
            background: rgba(0,0,0,0.2);
            padding: 10px; border-radius: 8px; margin-bottom: 8px;
        }
        .opponent-item.active { background: rgba(76,175,80,0.3); border: 2px solid #4caf50; }
        .opponent-item.warning { background: rgba(244,67,54,0.3); border: 2px solid #f44336; }
        .opponent-item.human-player { border-left: 3px solid #4caf50; }
        .opponent-item.bot-player { border-left: 3px solid #ffc107; }
        .opponent-name { font-weight: bold; font-size: 1em; margin-bottom: 6px; display: flex; align-items: center; gap: 6px; }
        .opponent-stats { display: flex; gap: 8px; font-size: 0.85em; }
        .stat-badge { background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 10px; flex: 1; text-align: center; }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .status-dot.done { background: #4caf50; }
        .status-dot.waiting { background: #ffc107; animation: pulseDot 1s infinite; }
        @keyframes pulseDot { 0%,100%{transform:scale(1);opacity:1;} 50%{transform:scale(1.05);opacity:0.9;} }

        /* RIGHT PANEL */
        .right-panel {
            display: flex; flex-direction: column; gap: 10px;
            width: 100%; box-sizing: border-box; min-height: 600px;
        }

        /* TOP CARD AREA */
        .top-card-area {
            background: rgba(255,255,255,0.1);
            padding: 15px; border-radius: 10px;
            backdrop-filter: blur(10px);
            flex-shrink: 0; min-height: 225px; height: 225px;
            position: relative;
        }
        .province-label {
            text-align: center; font-size: 1.3em; font-weight: bold;
            margin-bottom: 10px; padding: 8px;
            background: rgba(255,255,255,0.2); border-radius: 8px;
        }
        .top-cards {
            display: flex; flex-wrap: wrap; gap: 10px;
            justify-content: center; align-items: center;
            min-height: 100px; width: 100%; padding: 2px; box-sizing: border-box;
        }

        /* PLAYER AREA */
        .player-area {
            background: rgba(255,255,255,0.15);
            padding: 15px; border-radius: 10px;
            backdrop-filter: blur(10px);
            display: flex; flex-direction: column;
            width: 100%; box-sizing: border-box;
        }
        .player-header {
            display: flex; justify-content: flex-start; align-items: center;
            margin-bottom: 10px; padding-bottom: 10px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
            width: 100%; box-sizing: border-box;
            flex-wrap: wrap; gap: 8px;
        }
        .player-stats { display: flex; gap: 12px; font-size: 0.95em; flex-wrap: wrap; align-items: center; }
        .player-stat { background: rgba(0,0,0,0.3); padding: 5px 12px; border-radius: 15px; }
        .player-deck-container {
            flex: 1; overflow-y: auto; overflow-x: hidden;
            min-height: 150px; max-height: 250px;
            width: 100%; box-sizing: border-box; padding: 0; margin: 0;
        }
        .player-deck {
            display: flex; gap: 10px; justify-content: center;
            flex-wrap: wrap; padding: 5px; min-height: 140px;
            align-items: flex-start; width: 100%; box-sizing: border-box;
        }

        /* CARDS */
        .card {
            width: 100px; height: 140px; background: white;
            border-radius: 10px; padding: 6px;
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
            cursor: pointer; transition: all 0.2s; color: #333;
            display: flex; flex-direction: column;
            position: relative; overflow: hidden;
            flex-shrink: 0;
            min-width: 100px; max-width: 100px;
            min-height: 140px; max-height: 140px;
        }
        .card:hover { transform: translateY(-8px) scale(1.05); box-shadow: 0 10px 20px rgba(0,0,0,0.5); }
        .card.legendary { border: 2px solid #ffd700; background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%); }
        .card.epic { border: 2px solid #9c27b0; background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%); }
        .card.rare { border: 2px solid #2196f3; background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%); }
        .card.uncommon { border: 2px solid #4caf50; background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%); }
        .card.common { border: 2px solid #9e9e9e; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); }

        .card.selectable {
            box-shadow: 0 0 25px rgba(236,72,153,0.8), 0 0 40px rgba(236,72,153,0.6);
            border: 3px solid rgba(236,72,153,0.9);
            animation: shakePause 3s ease-in-out infinite;
            animation-delay: 10s;
            pointer-events: auto !important;
            cursor: pointer !important;
            z-index: 10;
        }
        .card.selectable:hover { transform: translateY(-8px) scale(1.05) !important; animation: none; }
        .card.disabled { cursor: default; opacity: 1; }
        .card.locked { cursor: not-allowed; }
        .card.zoom-in { animation: cardZoomIn 0.4s ease-out forwards; }
        .card.zoom-out { animation: cardZoomOut 0.3s ease-in forwards !important; pointer-events: none !important; }
        .card.fly-to-top { animation: cardFlyToTop 0.5s ease-out forwards; position: absolute; z-index: 999; }
        .card.shake { animation: cardShake 0.3s ease-in-out; }
        .card.wrong-card { animation: cardShake 0.3s; border: 3px solid #f44336 !important; }
        .card.zoom-in, .card.zoom-out, .card.fly-to-top { pointer-events: none !important; }

        @keyframes shakePause {
            0%,10%{transform:translateX(0) rotate(0deg);}
            12%{transform:translateX(-8px) rotate(-3deg);}
            14%{transform:translateX(8px) rotate(3deg);}
            16%{transform:translateX(-8px) rotate(-3deg);}
            18%{transform:translateX(8px) rotate(3deg);}
            20%{transform:translateX(-6px) rotate(-2deg);}
            22%{transform:translateX(6px) rotate(2deg);}
            24%{transform:translateX(-4px) rotate(-1deg);}
            26%{transform:translateX(4px) rotate(1deg);}
            28%{transform:translateX(-2px) rotate(-0.5deg);}
            30%,100%{transform:translateX(0) rotate(0deg);}
        }
        @keyframes cardShake { 0%,100%{transform:translateX(0);} 25%{transform:translateX(-10px);} 75%{transform:translateX(10px);} }
        @keyframes cardZoomIn { from{transform:scale(0);opacity:0;} to{transform:scale(1);opacity:1;} }
        @keyframes cardZoomOut { from{transform:scale(1);opacity:1;} to{transform:scale(0);opacity:0;} }
        @keyframes cardFlyToTop {
            0%{transform:scale(1) translateY(0);opacity:1;}
            50%{transform:scale(0.5) translateY(-100px);opacity:0.7;}
            100%{transform:scale(1) translateY(-200px);opacity:0;}
        }

        .card-image {
            width: 100%; height: 60px; background: rgba(0,0,0,0.1);
            border-radius: 6px; margin-bottom: 5px;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; font-size: 2em;
        }
        .card-image img { width:100%; height:100%; object-fit:contain; object-position:center; border-radius:4px; }
        .card-rarity { position: absolute; top: 4px; right: 4px; font-size: 1.1em; }
        .card-name {
            font-size: 0.75em; font-weight: bold; text-align: center;
            line-height: 1.1; flex-grow: 1;
            display: flex; align-items: center; justify-content: center;
            overflow: hidden; text-overflow: ellipsis; word-wrap: break-word;
        }
        .card-type {
            font-size: 0.6em; text-align: center; color: #666;
            margin-top: 3px; padding-top: 3px;
            border-top: 1px solid rgba(0,0,0,0.1);
        }

        /* BUTTONS */
        button {
            padding: 10px 25px; font-size: 0.95em; font-weight: bold;
            border: none; border-radius: 8px; cursor: pointer;
            transition: all 0.3s; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        button:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 6px 14px rgba(0,0,0,0.4); }
        button:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-draw { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }

        /* LOG AREA */
        .log-area {
            background: rgba(0,0,0,0.3); padding: 10px; border-radius: 8px;
            max-height: 100px; overflow-y: auto; flex-shrink: 0;
            width: 100%; box-sizing: border-box; margin: 0;
        }
        .log-entry {
            padding: 4px 8px; margin: 2px 0;
            background: rgba(255,255,255,0.1); border-radius: 4px;
            font-size: 0.85em; border-left: 3px solid #667eea;
            animation: fadeInLog 0.3s ease-out;
        }
        @keyframes fadeInLog { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }

        /* BUTTONS (info & refresh) */
        .province-info-btn {
            position: absolute; top: 68px; left: 8px;
            width: 40px; height: 40px;
            background: rgba(255,255,255,0.3); border: 2px solid rgba(255,255,255,0.5);
            border-radius: 8px; display: none; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.4em; transition: all 0.3s;
            backdrop-filter: blur(5px); z-index: 5; padding: 0; line-height: 1;
        }
        .province-info-btn:hover { background: rgba(255,255,255,0.5); transform: scale(1.1); }

        .sync-refresh-btn {
            position: absolute; top: 68px; right: 8px;
            width: 40px; height: 40px;
            background: rgba(102,126,234,0.8); border: 2px solid rgba(255,255,255,0.6);
            border-radius: 8px; display: none; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.4em; transition: all 0.3s;
            backdrop-filter: blur(5px); z-index: 5; padding: 0; line-height: 1;
        }
        .sync-refresh-btn:hover { background: rgba(102,126,234,1); transform: scale(1.1) rotate(180deg); }
        .sync-refresh-btn.urgent { background: rgba(244,67,54,0.9); border-color: #fff; animation: pulseUrgent 1s ease-in-out infinite; }
        .sync-refresh-btn.success { background: rgba(76,175,80,0.9); border-color: #fff; }
        @keyframes pulseUrgent { 0%,100%{box-shadow:0 4px 10px rgba(244,67,54,0.4);transform:scale(1);} 50%{box-shadow:0 8px 25px rgba(244,67,54,0.8);transform:scale(1.05);} }

        /* PROCESSING NOTIFICATION */
        .processing-notification {
            display: none; position: fixed;
            top: 50%; left: 50%; transform: translate(-50%,-50%);
            background: rgba(0,0,0,0.95);
            padding: 30px 50px; border-radius: 15px;
            border: 3px solid #ffc107; z-index: 999;
            text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.8);
        }
        .processing-notification.active { display: block; animation: fadeInNotif 0.3s; }
        @keyframes fadeInNotif { from{opacity:0;transform:translate(-50%,-60%);} to{opacity:1;transform:translate(-50%,-50%);} }
        .processing-notification h3 { font-size: 1.5em; margin-bottom: 15px; color: #ffc107; }
        .processing-notification p { font-size: 1.1em; color: #fff; margin: 5px 0; }
        .spinner {
            border: 4px solid rgba(255,193,7,0.3); border-top: 4px solid #ffc107;
            border-radius: 50%; width: 50px; height: 50px;
            animation: spin 1s linear infinite; margin: 20px auto;
        }

        /* PROVINCE INFO MODAL */
        .province-info-modal {
            display: none; position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            justify-content: center; align-items: center;
            z-index: 2000; padding: 20px;
        }
        .province-info-modal.active { display: flex; }
        .province-info-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px; border-radius: 20px;
            max-width: 800px; width: 90%; max-height: 80vh; overflow-y: auto;
            box-shadow: 0 10px 50px rgba(0,0,0,0.5);
            position: relative; animation: slideIn 0.4s;
        }
        .province-info-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 20px; padding-bottom: 15px;
            border-bottom: 2px solid rgba(255,255,255,0.3);
        }
        .province-info-header h2 { font-size: 1.8em; color: #fff; margin: 0; }
        .province-info-close {
            width: 40px; height: 40px;
            background: rgba(255,255,255,0.2); border: 2px solid rgba(255,255,255,0.4);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            cursor: pointer; font-size: 1.5em; color: #fff; transition: all 0.3s;
        }
        .province-info-close:hover { background: rgba(255,255,255,0.4); transform: rotate(90deg); }
        .province-cards-grid { display: flex; flex-wrap: wrap; gap: 15px; justify-content: center; padding: 20px 10px 10px; }
        .province-info-card {
            width: 100px; height: 140px; background: white; border-radius: 10px;
            padding: 6px; box-shadow: 0 6px 12px rgba(0,0,0,0.4); cursor: pointer;
            transition: all 0.3s; color: #333; display: flex; flex-direction: column;
            position: relative; overflow: visible; flex-shrink: 0; margin-top: 15px;
        }
        .province-info-card:hover { transform: translateY(-8px) scale(1.05); }
        .province-info-card.legendary { border: 2px solid #ffd700; background: linear-gradient(135deg, #fff9c4 0%, #fff59d 100%); }
        .province-info-card.epic { border: 2px solid #9c27b0; background: linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%); }
        .province-info-card.rare { border: 2px solid #2196f3; background: linear-gradient(135deg, #bbdefb 0%, #90caf9 100%); }
        .province-info-card.uncommon { border: 2px solid #4caf50; background: linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%); }
        .province-info-card.common { border: 2px solid #9e9e9e; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); }
        .province-info-card-rarity { position: absolute; top: 4px; right: 4px; font-size: 1.1em; }
        .province-info-card-image { width:100%; height:60px; background:rgba(0,0,0,0.1); border-radius:6px; margin-bottom:5px; display:flex; align-items:center; justify-content:center; overflow:hidden; font-size:2em; }
        .province-info-card-image img { width:100%; height:100%; object-fit:contain; border-radius:4px; }
        .province-info-card-name { font-size:0.75em; font-weight:bold; text-align:center; line-height:1.1; flex-grow:1; display:flex; align-items:center; justify-content:center; overflow:hidden; text-overflow:ellipsis; word-wrap:break-word; }
        .province-info-card-type { font-size:0.6em; text-align:center; color:#666; margin-top:3px; padding-top:3px; border-top:1px solid rgba(0,0,0,0.1); }
        .province-info-card-owned {
            position: absolute; top: -35px; left: 50%; transform: translateX(-50%);
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white; padding: 4px 10px; border-radius: 12px;
            font-size: 0.7em; font-weight: bold; box-shadow: 0 3px 10px rgba(76,175,80,0.5);
            z-index: 10; white-space: nowrap; border: 2px solid #2e7d32;
        }

        /* GAME OVER MODAL */
        .modal {
            display: none; position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            justify-content: center; align-items: center; z-index: 1000;
        }
        .modal.active { display: flex; }
        .modal-content {
            background: white; padding: 40px; border-radius: 20px;
            text-align: center; color: #333; max-width: 500px;
            animation: slideIn 0.4s;
        }
        @keyframes slideIn { from{transform:translateY(-50px);opacity:0;} to{transform:translateY(0);opacity:1;} }
        .modal-content h2 { font-size: 2.5em; margin-bottom: 20px; color: #667eea; }
        .rankings { margin: 20px 0; font-size: 1.1em; }
        .ranking-item { padding: 12px; margin: 6px 0; background: #f5f5f5; border-radius: 8px; font-weight: bold; }
        .ranking-item.winner { background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%); }
        .ranking-item.loser { background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); }

        /* BADGES & NOTIFICATIONS */
        .warning-badge {
            background: #f44336; color: white;
            padding: 3px 10px; border-radius: 12px;
            font-size: 0.8em; font-weight: bold;
            animation: blink 1s infinite;
        }
        @keyframes blink { 0%,50%,100%{opacity:1;} 25%,75%{opacity:0.6;} }

        .game-notification {
            font-family: 'Segoe UI', sans-serif; font-size: 14px; line-height: 1.4;
        }

        @keyframes slideInRight { from{transform:translateX(400px);opacity:0;} to{transform:translateX(0);opacity:1;} }
        @keyframes slideOutRight { from{transform:translateX(0);opacity:1;} to{transform:translateX(400px);opacity:0;} }
        @keyframes spin { 0%{transform:rotate(0deg);} 100%{transform:rotate(360deg);} }
        @keyframes titlePulse { 0%,100%{transform:scale(1);} 50%{transform:scale(1.05);} }

        /* ============================================ */
        /* AUTH SCREEN (Login & Register) */
        /* ============================================ */
        #auth-screen {
            display: none;   /* ← Diubah agar tersembunyi secara default */
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            padding: 20px;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 30000;
        }
        .auth-container {
            background: rgba(255,255,255,0.15);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            width: 100%;
            max-width: 400px;
        }
        .auth-title { font-size: 2em; font-weight: bold; margin-bottom: 30px; }
        .auth-tabs { display: flex; margin-bottom: 25px; background: rgba(0,0,0,0.2); border-radius: 10px; padding: 4px; }
        .auth-tab {
            flex: 1; padding: 10px; border: none; border-radius: 8px;
            cursor: pointer; font-size: 1em; font-weight: bold;
            background: transparent; color: rgba(255,255,255,0.7); transition: all 0.3s;
        }
        .auth-tab.active { background: rgba(255,255,255,0.3); color: #fff; }
        .auth-input {
            width: 100%; padding: 14px 18px; margin-bottom: 15px;
            border: 2px solid rgba(255,255,255,0.3); border-radius: 10px;
            background: rgba(255,255,255,0.15); color: #fff;
            font-size: 1em; outline: none; box-sizing: border-box;
            transition: border-color 0.3s;
        }
        .auth-input::placeholder { color: rgba(255,255,255,0.6); }
        .auth-input:focus { border-color: rgba(255,255,255,0.7); background: rgba(255,255,255,0.2); }
        .btn-auth {
            width: 100%; padding: 15px; font-size: 1.1em; font-weight: bold;
            background: linear-gradient(135deg, #4caf50 0%, #66bb6a 100%);
            color: white; border: none; border-radius: 10px;
            cursor: pointer; transition: all 0.3s; margin-top: 5px;
        }
        .btn-auth:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(76,175,80,0.4); }
        .auth-error {
            background: rgba(244,67,54,0.3); border: 1px solid rgba(244,67,54,0.6);
            padding: 10px 15px; border-radius: 8px; margin-bottom: 15px;
            font-size: 0.9em; display: none;
        }
        .auth-loading { font-size: 0.95em; opacity: 0.8; margin-top: 15px; display: none; }

        /* ============================================ */
        /* NICKNAME SCREEN */
        /* ============================================ */
        #nickname-screen {
            display: none;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            text-align: center;
            padding: 20px;
            position: fixed;
            top: 0; left: 0;
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 30000;
        }
        .nickname-container {
            background: rgba(255,255,255,0.15);
            padding: 40px;
            border-radius: 20px;
            backdrop-filter: blur(10px);
            box-shadow: 0 10px 40px rgba(0,0,0,0.3);
            width: 100%; max-width: 400px;
        }
        .nickname-title { font-size: 2em; font-weight: bold; margin-bottom: 10px; }
        .nickname-subtitle { font-size: 1em; opacity: 0.8; margin-bottom: 25px; }
        .nickname-rule {
            background: rgba(0,0,0,0.2); padding: 10px 15px; border-radius: 8px;
            font-size: 0.85em; opacity: 0.8; margin-bottom: 20px; text-align: left;
            line-height: 1.6;
        }

        /* ============================================ */
        /* PROFILE BADGE (pojok kanan atas) */
        /* ============================================ */
        #profile-badge {
            display: none;
            position: fixed;
            top: 12px; right: 15px;
            background: rgba(0,0,0,0.6);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(255,255,255,0.3);
            border-radius: 12px;
            padding: 8px 14px;
            z-index: 10001;
            cursor: pointer;
            transition: all 0.3s;
            min-width: 160px;
        }
        #profile-badge:hover { background: rgba(0,0,0,0.8); border-color: rgba(255,255,255,0.5); }
        .profile-badge-inner { display: flex; align-items: center; gap: 10px; }
        .profile-avatar {
            width: 36px; height: 36px;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            border-radius: 50%; display: flex; align-items: center; justify-content: center;
            font-size: 1.2em; font-weight: bold; flex-shrink: 0;
        }
        .profile-info { display: flex; flex-direction: column; align-items: flex-start; }
        .profile-nickname { font-size: 0.95em; font-weight: bold; color: #fff; line-height: 1.2; }
        .profile-id { font-size: 0.7em; color: rgba(255,255,255,0.6); font-family: monospace; }
        .profile-status {
            width: 8px; height: 8px; border-radius: 50%;
            background: #4caf50; margin-left: auto; flex-shrink: 0;
            box-shadow: 0 0 6px rgba(76,175,80,0.8);
        }

        /* ============================================ */
        /* AUTO MODE INDICATOR */
        /* ============================================ */
        #auto-mode-indicator {
            display: none;
            position: fixed;
            bottom: 20px; right: 20px;
            background: rgba(244,67,54,0.9);
            border: 2px solid #f44336;
            border-radius: 12px;
            padding: 10px 18px;
            z-index: 9998;
            font-weight: bold;
            font-size: 0.9em;
            animation: pulseUrgent 1.5s ease-in-out infinite;
        }
        /* ============================================ */
        /* ENSIKLOPEDIA */
        /* ============================================ */
        .btn-encyclopedia {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: #fff; font-size: 1em; font-weight: bold;
            padding: 14px 32px; border-radius: 14px;
            margin-top: 16px; display: block;
            width: 100%; max-width: 280px; border: none;
            box-shadow: 0 6px 20px rgba(240,147,251,0.4);
            letter-spacing: 0.3px;
        }
        .btn-encyclopedia:hover { transform: translateY(-3px); box-shadow: 0 10px 28px rgba(240,147,251,0.6); }

        #encyclopedia-screen {
            display: none; position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            z-index: 15000; overflow-y: auto;
        }
        .enc-header {
            background: rgba(255,255,255,0.15); backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(255,255,255,0.25);
            padding: 16px 20px; display: flex; align-items: center;
            justify-content: space-between; position: sticky; top: 0; z-index: 100;
        }
        .enc-title { font-size: 1.4em; font-weight: bold; color: #fff; }
        .btn-enc-close {
            background: rgba(244,67,54,0.85); color: #fff;
            border: 1px solid rgba(255,255,255,0.3); border-radius: 10px;
            padding: 8px 18px; font-size: 0.9em; font-weight: bold;
        }
        .btn-enc-close:hover { background: #f44336; transform: none; box-shadow: none; }

        .enc-tabs { display: flex; gap: 8px; padding: 20px 20px 0; }
        .enc-tab {
            flex: 1; max-width: 200px; padding: 12px 10px;
            border-radius: 14px 14px 0 0; font-size: 1em; font-weight: bold;
            cursor: pointer; border: none;
            background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.65);
            transition: all 0.2s; box-shadow: none;
        }
        .enc-tab.active { background: rgba(255,255,255,0.30); color: #fff; box-shadow: 0 4px 15px rgba(0,0,0,0.2); }
        .enc-tab:hover:not(.active) { background: rgba(255,255,255,0.22); color: #fff; transform: none; box-shadow: none; }

        .enc-tab-content { display: none; padding: 20px; }
        .enc-tab-content.active { display: block; }

        .enc-province-filter { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
        .enc-prov-btn {
            background: rgba(255,255,255,0.15); color: rgba(255,255,255,0.9);
            border: 1px solid rgba(255,255,255,0.3); border-radius: 20px;
            padding: 7px 16px; font-size: 0.8em; font-weight: bold;
            cursor: pointer; transition: all 0.2s; box-shadow: none;
        }
        .enc-prov-btn:hover { background: rgba(255,255,255,0.25); color: #fff; transform: none; box-shadow: none; }
        .enc-prov-btn.active { background: linear-gradient(135deg,#f093fb 0%,#f5576c 100%); color: #fff; border-color: transparent; box-shadow: 0 3px 10px rgba(0,0,0,0.25); }

        .enc-province-section { margin-bottom: 36px; }
        .enc-province-name {
            font-size: 1.15em; font-weight: bold; color: #fff;
            margin-bottom: 14px; padding: 10px 16px;
            background: rgba(255,255,255,0.15); border-radius: 10px;
            border-left: 4px solid rgba(255,255,255,0.6);
            display: flex; align-items: center; gap: 10px;
            backdrop-filter: blur(5px);
        }
        .enc-province-img {
            height: 48px;
            width: auto;
            max-width: 90px;
            border-radius: 6px;
            object-fit: contain;
            flex-shrink: 0;
            background: rgba(255,255,255,0.1);
        }
        .enc-cards-row { display: flex; flex-wrap: wrap; gap: 14px; padding-left: 4px; }
        .enc-card-wrapper { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .enc-power-badge {
            font-size: 0.72em; background: rgba(255,255,255,0.2); color: #fff;
            border: 1px solid rgba(255,255,255,0.35); border-radius: 8px;
            padding: 3px 10px; font-weight: bold;
        }
        .enc-rarity-badge {
            font-size: 0.68em; font-weight: bold;
            border-radius: 8px; padding: 3px 10px;
            border: 1px solid transparent;
        }
        .enc-rarity-badge.legendary { background: linear-gradient(135deg,#fff9c4,#ffd700); color: #5d4037; border-color: #ffd700; }
        .enc-rarity-badge.epic      { background: linear-gradient(135deg,#e1bee7,#9c27b0); color: #fff; border-color: #9c27b0; }
        .enc-rarity-badge.rare      { background: linear-gradient(135deg,#bbdefb,#2196f3); color: #fff; border-color: #2196f3; }
        .enc-rarity-badge.uncommon  { background: linear-gradient(135deg,#c8e6c9,#4caf50); color: #1b5e20; border-color: #4caf50; }
        .enc-rarity-badge.common    { background: linear-gradient(135deg,#f5f5f5,#9e9e9e); color: #424242; border-color: #9e9e9e; }

        .enc-rules-container { max-width: 680px; margin: 0 auto; }
        .enc-rules-title { text-align: center; font-size: 1.5em; font-weight: bold; margin-bottom: 8px; color: #fff; }
        .enc-rules-subtitle { text-align: center; font-size: 0.9em; color: rgba(255,255,255,0.7); margin-bottom: 28px; }
        .enc-rule-card {
            background: rgba(255,255,255,0.15); border-radius: 16px;
            padding: 20px 22px; margin-bottom: 14px;
            border-left: 5px solid rgba(255,255,255,0.5);
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }
        .enc-rule-icon { font-size: 2em; margin-bottom: 8px; display: block; }
        .enc-rule-heading { font-size: 1.05em; font-weight: bold; color: #fff; margin-bottom: 8px; }
        .enc-rule-text { font-size: 0.92em; color: rgba(255,255,255,0.88); line-height: 1.8; }
        .enc-rarity-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
        .enc-rarity-chip { padding: 5px 14px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }

    </style>
</head>
<body>

    <!-- TAMBAH di paling awal <body> -->
    <div id="firebase-loading" style="
        position:fixed; top:0; left:0; width:100%; height:100%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display:flex; justify-content:center; align-items:center;
        z-index: 99999; flex-direction:column; gap:20px;">
        <div style="font-size:2.5em; font-weight:bold;">🗺️ Card Game Nusantara</div>
        <div style="width:60px;height:60px;border:6px solid rgba(255,255,255,0.3);
                    border-top:6px solid #fff;border-radius:50%;
                    animation:spin 1s linear infinite;"></div>
        <div style="font-size:1em;opacity:0.8;">Memuat...</div>
    </div>


    <!-- TAMBAH di awal <body>, SEBELUM pre-loading screen (HTML) -->

    <!-- PROFILE BADGE (pojok kanan atas) -->
    <!-- AUTO MODE INDICATOR -->
    <div id="auto-mode-indicator">🤖 Mode Otomatis Aktif</div>

    <!-- AUTH SCREEN -->
    <div id="auth-screen">
        <div class="auth-container">
            <h1 class="auth-title">🗺️ Card Game<br>Nusantara</h1>
            <div class="auth-tabs">
                <button class="auth-tab active" onclick="switchAuthTab('login')">🔐 Login</button>
                <button class="auth-tab" onclick="switchAuthTab('register')">📝 Daftar</button>
            </div>
            <div id="auth-error" class="auth-error"></div>
            
            <!-- Login Form -->
            <div id="login-form">
                <input type="email" class="auth-input" id="login-email" placeholder="📧 Email" autocomplete="email">
                <input type="password" class="auth-input" id="login-password" placeholder="🔑 Password" autocomplete="current-password">
                <button class="btn-auth" onclick="doLogin()">🚀 Masuk</button>
            </div>
            
            <!-- Register Form -->
            <div id="register-form" style="display:none;">
                <div style="background:rgba(255,193,7,0.2);border:1px solid rgba(255,193,7,0.5);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:0.85em;text-align:left;line-height:1.6;">
                    ℹ️ Format email: <strong>namakamu@cardgame.local</strong><br>
                    Contoh: <em>glory@cardgame.local</em>
                </div>
                <input type="text" class="auth-input" id="reg-email" placeholder="📧 Email (@cardgame.local)" autocomplete="off">
                <input type="password" class="auth-input" id="reg-password" placeholder="🔑 Password (min 6 karakter)">
                <input type="password" class="auth-input" id="reg-confirm" placeholder="🔑 Konfirmasi Password">
                <button class="btn-auth" onclick="doRegister()">✨ Buat Akun</button>
            </div>
            
            <div class="auth-loading" id="auth-loading">⏳ Memproses...</div>
        </div>
    </div>

    <!-- NICKNAME SCREEN -->
    <div id="nickname-screen">
        <div class="nickname-container">
            <h1 class="nickname-title">🎭 Pilih Nickname</h1>
            <p class="nickname-subtitle">Nickname akan ditampilkan kepada pemain lain</p>
            <div class="nickname-rule">
                ✅ 3–20 karakter<br>
                ✅ Huruf, angka, spasi, underscore<br>
                ❌ Tidak boleh mengandung kata kasar
            </div>
            <div id="nickname-error" class="auth-error"></div>
            <input type="text" class="auth-input" id="nickname-input" 
                   placeholder="🎮 Nickname kamu..." maxlength="20"
                   oninput="previewNickname(this.value)">
            <div style="margin-bottom:15px; font-size:0.9em; opacity:0.7;">
                Preview: <strong id="nickname-preview">...</strong>
            </div>
            <button class="btn-auth" onclick="saveNickname()">✅ Simpan & Lanjutkan</button>
        </div>
    </div>

    <!-- PRE-LOADING SCREEN -->
    <div id="pre-loading-screen" style="display:none;">
        <div class="pre-loading-content">
            <h1 class="pre-loading-title">🗺️ Card Game Nusantara</h1>
            <p class="pre-loading-subtitle">Kenali budaya Indonesia melalui permainan kartu!</p>
            <div class="pre-loading-spinner" id="pre-loading-spinner"></div>
            <p class="pre-loading-info" id="pre-loading-info">Memuat aset...</p>
            <button class="btn-play" id="btn-play" onclick="goToMatchmaking()">▶ PLAY</button>
        </div>
    </div>

    <!-- PROFILE BADGE (standalone, hanya muncul di halaman matchmaking) -->
    <div id="profile-badge" title="Klik untuk logout">
        <div class="profile-badge-inner">
            <div class="profile-avatar" id="profile-avatar">👤</div>
            <div class="profile-info">
                <div class="profile-nickname" id="profile-nickname-display">-</div>
                <div class="profile-id" id="profile-id-display">-</div>
            </div>
            <div class="profile-status"></div>
        </div>
    </div>

    <!-- MATCHMAKING SCREEN -->
    <div id="matchmaking-screen">
        <div class="matchmaking-container">
            <h1 class="matchmaking-title">🎮 Card Game Online</h1>

            <div id="matchmaking-idle" style="display:flex;flex-direction:column;align-items:center;">
                <p style="font-size:1.2em; margin-bottom:30px;">Main dengan pemain lain secara online!</p>
                <button class="btn-start" onclick="startMatchmaking()">🎮 MAIN ONLINE</button>
                <button class="btn-encyclopedia" onclick="showEncyclopedia()">🧭 &nbsp; Ensiklopedia &nbsp; 🧭</button>
            </div>

            <div id="matchmaking-waiting" style="display:none;">
                <h2>🔍 Mencari Lawan...</h2>
                <div class="matchmaking-spinner"></div>
                <p class="matchmaking-status" id="queue-status">Menunggu pemain lain...</p>
                <button class="btn-cancel" onclick="cancelMatchmaking()">❌ Batal</button>
            </div>

            <div id="match-starting" style="display:none;">
                <h2>✅ Lawan Ditemukan!</h2>
                <p id="match-info" style="font-size:1.3em; margin:20px 0;"></p>
                <p style="font-size:1.1em;">Game akan dimulai dalam 3 detik...</p>
            </div>
        </div>
    </div>

    <!-- ENCYCLOPEDIA SCREEN -->
    <div id="encyclopedia-screen">
        <div class="enc-header">
            <div class="enc-title">🧭 Ensiklopedia Nusantara</div>
            <button class="btn-enc-close" onclick="hideEncyclopedia()">✖ Tutup</button>
        </div>

        <div class="enc-tabs">
            <button class="enc-tab active" id="enc-tab-btn-cards" onclick="showEncTab('cards')">🔶 Kartu</button>
            <button class="enc-tab" id="enc-tab-btn-rules" onclick="showEncTab('rules')">📖 Aturan</button>
        </div>

        <!-- TAB KARTU -->
        <div class="enc-tab-content active" id="enc-tab-cards">
            <div class="enc-province-filter" id="enc-prov-filter"></div>
            <div id="enc-cards-container"></div>
        </div>

        <!-- TAB ATURAN -->
        <div class="enc-tab-content" id="enc-tab-rules">
            <div class="enc-rules-container">
                <div class="enc-rules-title">📖 Cara Main Card Game Nusantara</div>
                <div class="enc-rules-subtitle">Mudah dipahami, seru dimainkan! 🎉</div>

                <div class="enc-rule-card" style="border-color:#667eea;">
                    <span class="enc-rule-icon">🎯</span>
                    <div class="enc-rule-heading">Tujuan Permainan</div>
                    <div class="enc-rule-text">
                        Tujuannya sederhana — <strong>habiskan kartumu secepat mungkin!</strong> Pemain yang <strong>kartunya paling cepat habis</strong> akan jadi pemenang. Setiap ronde, kamu bermain kartu dari tanganmu, jadi semakin banyak kartu yang kamu mainkan, semakin dekat kamu ke kemenangan!
                    </div>
                </div>

                <div class="enc-rule-card" style="border-color:#f093fb;">
                    <span class="enc-rule-icon">🔶</span>
                    <div class="enc-rule-heading">Jenis Kartu & Kekuatannya</div>
                    <div class="enc-rule-text">Setiap provinsi punya 5 kartu dengan kekuatan berbeda:</div>
                    <div class="enc-rarity-row">
                        <span class="enc-rarity-chip" style="background:linear-gradient(135deg,#fff9c4,#fff59d);color:#5d4037;">👑 Ibu Kota — Power 5</span>
                        <span class="enc-rarity-chip" style="background:linear-gradient(135deg,#e1bee7,#ce93d8);color:#4a148c;">💜 Rumah Adat — Power 4</span>
                        <span class="enc-rarity-chip" style="background:linear-gradient(135deg,#bbdefb,#90caf9);color:#0d47a1;">💠 Pakaian Adat — Power 3</span>
                        <span class="enc-rarity-chip" style="background:linear-gradient(135deg,#c8e6c9,#a5d6a7);color:#1b5e20;">🟢 Tarian — Power 2</span>
                        <span class="enc-rarity-chip" style="background:linear-gradient(135deg,#f5f5f5,#e0e0e0);color:#424242;">⚪ Makanan Khas — Power 1</span>
                    </div>
                </div>

                <div class="enc-rule-card" style="border-color:#f5576c;">
                    <span class="enc-rule-icon">⚔️</span>
                    <div class="enc-rule-heading">Tahap 1 — Siapa yang Jatuhkan Kartu Pertama?</div>
                    <div class="enc-rule-text">
                        Di setiap ronde, hanya <strong>1 pemain</strong> yang boleh jatuhkan kartu di Tahap 1. Kartu itu menentukan <strong>provinsi</strong> yang harus diikuti semua pemain lain.<br><br>
                        🔵 <strong>Ronde pertama:</strong> Komputer yang jatuhkan kartu pertama secara otomatis.<br>
                        🔴 <strong>Ronde berikutnya:</strong> Pemain yang memiliki <strong>kartu power tertinggi</strong> di ronde sebelumnya yang mendapat giliran jatuhkan kartu pertama!
                    </div>
                </div>

                <div class="enc-rule-card" style="border-color:#38ef7d;">
                    <span class="enc-rule-icon">🔄</span>
                    <div class="enc-rule-heading">Tahap 2 — Giliran Semua Pemain Lain</div>
                    <div class="enc-rule-text">
                        Setelah Tahap 1, semua pemain <strong>selain yang sudah jatuhkan kartu di Tahap 1</strong> harus ikut bermain dengan kartu dari <strong>provinsi yang sama</strong>.<br><br>
                        ✅ <strong>Punya kartu provinsinya?</strong> Langsung jatuhkan!<br>
                        🟡 <strong>Tidak punya, tapi Kartu Tersisa masih ada?</strong> Lakukan <strong>Draw Card</strong> dulu.<br>
                        🔴 <strong>Tidak punya dan Kartu Tersisa sudah habis?</strong> Masuk mode <strong>Ambil Kartu</strong> dari meja!
                    </div>
                </div>

                <div class="enc-rule-card" style="border-color:#ffd700;">
                    <span class="enc-rule-icon">⚡</span>
                    <div class="enc-rule-heading">Ambil Kartu dari Meja — Kapan & Siapa yang Bebas?</div>
                    <div class="enc-rule-text">
                        Mode <strong>Ambil Kartu</strong> terjadi saat kamu tidak punya kartu provinsi yang dimainkan dan tumpukan sudah habis. Kamu harus ambil salah satu kartu yang ada di meja.<br><br>
                        🎉 <strong>Tapi ada kondisi BEBAS!</strong> Kamu bisa bebas dari kewajiban ambil kartu jika:<br>
                        Jumlah pemain yang berhasil jatuhkan kartu di ronde ini <strong>lebih sedikit</strong> dari jumlah pemain yang kena mode Ambil Kartu.<br><br>
                        Contoh: 3 pemain kena Ambil Kartu, tapi hanya 1 pemain yang berhasil jatuhkan kartu → <strong>2 pemain dibebaskan!</strong><br><br>
                        Yang dibebaskan adalah pemain dengan <strong>kartu paling banyak di tangan</strong> — supaya permainan tetap adil! 😊
                    </div>
                </div>

                <div class="enc-rule-card" style="border-color:#ff9800;">
                    <span class="enc-rule-icon">🏆</span>
                    <div class="enc-rule-heading">Pemenang Ronde & Juara Akhir</div>
                    <div class="enc-rule-text">
                        Di setiap ronde, <strong>kartu dengan power tertinggi</strong> menentukan siapa yang mulai ronde berikutnya. Tapi pemenang game bukan yang menang ronde terbanyak — melainkan <strong>siapa yang paling cepat menghabiskan semua kartunya! 🥇</strong> Urutan juara ditentukan dari siapa yang kartunya habis lebih dulu.
                    </div>
                </div>

                <div class="enc-rule-card" style="border-color:#4dd0e1;">
                    <span class="enc-rule-icon">💡</span>
                    <div class="enc-rule-heading">Tips Jago Main!</div>
                    <div class="enc-rule-text">
                        ✅ <strong>Utamakan buang kartu power kecil di awal game</strong> — simpan kartu power besar untuk late game!<br>
                        ✅ Di late game, kartu power besar memberi keunggulan ganda: lebih sering jadi yang mulai ronde <em>dan</em> kartumu lebih cepat habis.<br>
                        ✅ Kalau Ambil Kartu dari meja, pilih kartu dengan <strong>power paling tinggi</strong> agar manfaatnya maksimal.<br>
                        ✅ Kalau kamu duluan abis kartunya — kamu menang! 🚀
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- GAME CONTAINER -->
    <div class="game-container" id="game-container">
        <div class="main-content">

            <!-- PANEL KIRI: LAWAN -->
            <div class="opponents-panel" id="opponents-panel">
                <div class="opponents-title">🤖 Lawan</div>
                <div style="margin-bottom:8px; padding:10px; background:rgba(0,0,0,0.2); border-radius:8px; text-align:center;">
                    <div style="font-size:0.85em; margin-bottom:5px;">📋 Tersisa: <strong id="draw-pile-count-2">0</strong></div>
                    <div style="font-size:0.85em;">📥 Terpakai: <strong id="discard-pile-count-2">0</strong></div>
                </div>
            </div>

            <!-- PANEL KANAN -->
            <div class="right-panel">

                <!-- AREA KARTU ATAS -->
                <div class="top-card-area" style="position:relative;">
                    <div class="province-label" id="province-label">Menunggu kartu...</div>
                    <button class="sync-refresh-btn" id="sync-refresh-btn" title="Refresh & sinkronisasi">🔄</button>
                    <button class="province-info-btn" id="province-info-btn" title="Lihat semua kartu provinsi">ℹ️</button>
                    <div class="top-cards" id="top-cards"></div>
                </div>

                <!-- AREA PEMAIN -->
                <div class="player-area">
                    <h2 style="margin:0 0 10px 0; text-align:left;" id="player-header-name">👤 ANDA</h2>
                    <div class="player-header">
                        <div class="player-stats">
                            <div class="player-stat">📇 Kartu: <strong id="player-cards">0</strong></div>
                            <div class="player-stat">⚡ Power: <strong id="player-power">0</strong></div>
                            <button class="btn-draw" id="btn-draw" disabled style="margin-left:15px;">🎴 Draw Card</button>
                            <div style="margin-left:15px; padding:8px 15px; background:rgba(255,255,255,0.2); border-radius:8px;">
                                <span style="font-weight:bold; font-size:0.9em;">🎮 Ronde: <strong id="round-number">1</strong></span>
                            </div>
                            <div style="margin-left:15px; padding:8px 15px; background:rgba(255,255,255,0.2); border-radius:8px;">
                                <span style="font-weight:bold; font-size:0.9em;">🕹️ Tahap: <strong id="phase-name">1</strong></span>
                            </div>
                            <div id="player-turn-notification" style="display:none; margin-left:15px; padding:8px 15px; background:#4caf50; border:2px solid #2e7d32; border-radius:8px;">
                                <span style="font-weight:bold; font-size:0.9em;">✅ Pilih kartu di bawah</span>
                            </div>
                            <div id="player-penalty" style="display:none; margin-left:15px; padding:8px 15px; background:rgba(244,67,54,0.9); border:2px solid #f44336; border-radius:8px;">
                                <span style="font-weight:bold; font-size:0.9em;" id="penalty-text">⚠️ Anda harus draw card</span>
                            </div>
                            <div id="player-freed-notification" style="display:none; margin-left:15px; padding:8px 15px; background:#4caf50; border:2px solid #2e7d32; border-radius:8px;">
                                <span style="font-weight:bold; font-size:0.9em;">✅ Dibebaskan</span>
                            </div>
                        </div>
                    </div>
                    <div class="player-deck-container">
                        <div class="player-deck" id="player-deck"></div>
                    </div>
                    <div class="log-area" id="game-log" style="margin-top:10px;">
                        <div class="log-entry">🎮 Menghubungkan ke server...</div>
                    </div>
                    <div style="margin-top:15px; text-align:center; padding-top:10px; border-top:2px solid rgba(255,255,255,0.15); display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
                        <button id="btn-surrender" onclick="doSurrender()"
                            style="padding:12px 30px; font-size:1em; font-weight:bold;
                                   background:linear-gradient(135deg, #f44336 0%, #e53935 100%); color:#fff;
                                   border:2px solid #ef5350; border-radius:10px;
                                   cursor:pointer; transition:all 0.3s; box-shadow:0 4px 14px rgba(244,67,54,0.5);">
                            🏳️ Menyerah
                        </button>
                        <button id="btn-show-result" onclick="showMatchResult()"
                            style="display:none; padding:12px 30px; font-size:1em; font-weight:bold;
                                   background:linear-gradient(135deg,#667eea,#764ba2);
                                   color:white; border:none; border-radius:10px;
                                   cursor:pointer; transition:all 0.3s; box-shadow:0 4px 14px rgba(102,126,234,0.4);">
                            🏆 Hasil Pertandingan
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- PROCESSING NOTIFICATION -->
    <div class="processing-notification" id="processing-notification">
        <h3>⏳ MEMPROSES FORCE PICK...</h3>
        <div class="spinner"></div>
        <p id="processing-message">Menentukan siapa yang dibebaskan...</p>
    </div>

    <!-- PROVINCE INFO MODAL -->
    <div class="province-info-modal" id="province-info-modal">
        <div class="province-info-content">
            <div class="province-info-header">
                <h2 id="province-info-title">📍 Provinsi</h2>
                <div class="province-info-close" id="province-info-close">✕</div>
            </div>
            <div class="province-cards-grid" id="province-cards-grid"></div>
        </div>
    </div>

    <!-- SURRENDER CHOICE MODAL -->
    <div class="modal" id="surrender-choice-modal">
        <div class="modal-content" style="max-width:420px; text-align:center;">
            <h2 style="color:#e53935; font-size:2em; margin-bottom:8px;">🏳️ Kamu Menyerah</h2>
            <p style="color:#555; margin-bottom:24px; font-size:1em;">Pertandingan masih berlangsung.<br>Apa yang ingin kamu lakukan?</p>
            <div style="display:flex; flex-direction:column; gap:14px;">
                <button onclick="continueWatching()"
                    style="padding:14px 20px; font-size:1em; font-weight:bold;
                           background:linear-gradient(135deg,#667eea,#764ba2);
                           color:white; border:none; border-radius:12px; cursor:pointer;
                           transition:transform 0.15s; box-shadow:0 4px 15px rgba(102,126,234,0.4);"
                    onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    👀 Lanjut Menonton
                </button>
                <button onclick="showMatchResult()"
                    style="padding:14px 20px; font-size:1em; font-weight:bold;
                           background:linear-gradient(135deg,#f6d365,#fda085);
                           color:white; border:none; border-radius:12px; cursor:pointer;
                           transition:transform 0.15s; box-shadow:0 4px 15px rgba(253,160,133,0.4);"
                    onmouseover="this.style.transform='scale(1.03)'" onmouseout="this.style.transform='scale(1)'">
                    🏆 Hasil Pertandingan
                </button>
            </div>
        </div>
    </div>

    <!-- MATCH RESULT MODAL -->
    <div class="modal" id="match-result-modal">
        <div class="modal-content" style="max-width:520px;">
            <h2 style="font-size:2em; margin-bottom:4px;">📊 Hasil Pertandingan</h2>
            <p id="match-result-round" style="color:#888; font-size:0.9em; margin-bottom:16px;"></p>
            <div id="match-result-rankings" class="rankings" style="text-align:left; max-height:300px; overflow-y:auto;"></div>
            <div id="match-result-stats"
                style="margin-top:12px; padding:10px 14px; background:#f0f4ff;
                       border-radius:8px; font-size:0.85em; color:#555; text-align:left;"></div>
            <button onclick="goToHome()"
                style="margin-top:20px; width:100%; padding:14px; font-size:1.1em; font-weight:bold;
                       background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
                       color:white; border:none; border-radius:12px; cursor:pointer;
                       box-shadow:0 4px 15px rgba(102,126,234,0.4); transition:transform 0.15s;"
                onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='scale(1)'">
                🎮 Kembali ke Home
            </button>
        </div>
    </div>

    <!-- GAME OVER MODAL -->
    <div class="modal" id="game-over-modal">
        <div class="modal-content">
            <h2>🏆 GAME OVER! 🏆</h2>
            <div class="rankings" id="rankings"></div>
            <div style="display:flex; gap:12px; margin-top:18px; justify-content:center; flex-wrap:wrap;">
                <button class="btn-draw" onclick="location.reload()" style="font-size:1em;">🔄 Main Lagi</button>
                <button class="btn-draw" onclick="goToHome()"
                    style="font-size:1em; background:linear-gradient(135deg,#667eea 0%,#764ba2 100%); border-color:transparent;">
                    🎮 Kembali ke Home
                </button>
            </div>
        </div>
    </div>

    <script>
        // =============================================
        // FIREBASE INITIALIZATION
        // =============================================
        const firebaseConfig = {
            apiKey: "AIzaSyDPxYUUHC9zr8W38qV2dbrYNH7fo_PyhTQ",
            authDomain: "rex-server-8a176.firebaseapp.com",
            databaseURL: "https://rex-server-8a176-default-rtdb.asia-southeast1.firebasedatabase.app",
            projectId: "rex-server-8a176",
            storageBucket: "rex-server-8a176.firebasestorage.app",
            messagingSenderId: "614405006496",
            appId: "1:614405006496:web:e33c399adac1b6735e55c5",
            measurementId: "G-XG6V4Z07BZ"
        };
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.database();

        // =============================================
        // LOCALSTORAGE KEYS
        // =============================================
        const LS = {
            ROOM_ID:     'cgn_roomId',
            PLAYER_ID:   'cgn_playerId',
            NICKNAME:    'cgn_nickname',
            USER_UID:    'cgn_userUid',
            USER_EMAIL:  'cgn_userEmail',
            GAME_ACTIVE: 'cgn_gameActive',
        };

        function lsSet(key, value) { try { localStorage.setItem(key, value); } catch(e) {} }
        function lsGet(key) { try { return localStorage.getItem(key); } catch(e) { return null; } }
        function lsDel(key) { try { localStorage.removeItem(key); } catch(e) {} }
        function lsClear() { Object.values(LS).forEach(k => lsDel(k)); }

        // =============================================
        // AUTH STATE - Firebase login checker
        // =============================================
        let currentUser = null;
        let currentNickname = null;

        auth.onAuthStateChanged(async (user) => {
            // Sembunyikan loading overlay Firebase
            document.getElementById('firebase-loading').style.display = 'none';
            
            if (user) {
                currentUser = user;
                lsSet(LS.USER_UID, user.uid);
                lsSet(LS.USER_EMAIL, user.email);
                
                // Cek apakah sudah punya nickname di DB
                const snap = await db.ref(`users/${user.uid}/nickname`).get();
                if (snap.exists()) {
                    currentNickname = snap.val();
                    lsSet(LS.NICKNAME, currentNickname);
                    onAuthAndNicknameReady(user, currentNickname);
                } else {
                    // Belum punya nickname, tampilkan nickname screen
                    hideAuthScreen();
                    showNicknameScreen();
                }
            } else {
                currentUser = null;
                currentNickname = null;
                showAuthScreen();
            }
        });

        // =============================================
        // AUTH SCREEN FUNCTIONS
        // =============================================
        function showAuthScreen() {
            document.getElementById('auth-screen').style.display = 'flex';
            document.getElementById('nickname-screen').style.display = 'none';
            document.getElementById('pre-loading-screen').style.display = 'none';
            document.getElementById('matchmaking-screen').classList.remove('active');
            document.getElementById('game-container').classList.remove('active');
            // Reset state UI agar tidak "stuck" dari sesi sebelumnya
            setAuthLoading(false);
            showAuthError('');
            switchAuthTab('login');
        }

        function hideAuthScreen() {
            document.getElementById('auth-screen').style.display = 'none';
        }

        function showNicknameScreen() {
            document.getElementById('nickname-screen').style.display = 'flex';
            document.getElementById('pre-loading-screen').style.display = 'none';
        }

        function hideNicknameScreen() {
            document.getElementById('nickname-screen').style.display = 'none';
        }

        function switchAuthTab(tab) {
            document.getElementById('login-form').style.display = tab === 'login' ? 'block' : 'none';
            document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';
            document.querySelectorAll('.auth-tab').forEach((el, i) => {
                el.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'register'));
            });
            showAuthError('');
        }

        function showAuthError(msg) {
            const el = document.getElementById('auth-error');
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
        }

        function setAuthLoading(show) {
            document.getElementById('auth-loading').style.display = show ? 'block' : 'none';
        }

        // =============================================
        // LOGIN
        // =============================================
        async function doLogin() {
            const email = document.getElementById('login-email').value.trim();
            const pass  = document.getElementById('login-password').value;
            if (!email || !pass) { showAuthError('⚠️ Email dan password tidak boleh kosong!'); return; }
            setAuthLoading(true); showAuthError('');
            try {
                await auth.signInWithEmailAndPassword(email, pass);
                // onAuthStateChanged akan otomatis terpanggil
            } catch (e) {
                const msgs = {
                    'auth/user-not-found':           '❌ Akun tidak ditemukan!',
                    'auth/wrong-password':           '❌ Password salah!',
                    'auth/invalid-email':            '❌ Format email tidak valid!',
                    'auth/too-many-requests':        '❌ Terlalu banyak percobaan, coba lagi nanti!',
                    // Firebase baru menggabungkan user-not-found + wrong-password menjadi satu kode:
                    'auth/invalid-credential':       '❌ Email atau password salah!',
                    'auth/invalid-login-credentials':'❌ Email atau password salah!',
                    'auth/network-request-failed':   '❌ Gagal terhubung ke server! Periksa koneksi internet.',
                    'auth/user-disabled':            '❌ Akun ini telah dinonaktifkan.',
                };
                showAuthError(msgs[e.code] || `❌ Login gagal: ${e.message}`);
                setAuthLoading(false);
            }
        }

        // =============================================
        // REGISTER
        // =============================================
        async function doRegister() {
            const email   = document.getElementById('reg-email').value.trim().toLowerCase();
            const pass    = document.getElementById('reg-password').value;
            const confirm = document.getElementById('reg-confirm').value;
            if (!email || !pass) { showAuthError('⚠️ Email dan password tidak boleh kosong!'); return; }
            if (!email.endsWith('@cardgame.local')) { showAuthError('⚠️ Email harus berformat: namakamu@cardgame.local'); return; }
            if (email === '@cardgame.local') { showAuthError('⚠️ Bagian sebelum @ tidak boleh kosong!'); return; }
            if (pass.length < 6) { showAuthError('⚠️ Password minimal 6 karakter!'); return; }
            if (pass !== confirm) { showAuthError('⚠️ Konfirmasi password tidak cocok!'); return; }
            setAuthLoading(true); showAuthError('');
            try {
                await auth.createUserWithEmailAndPassword(email, pass);
            } catch (e) {
                const msgs = {
                    'auth/email-already-in-use': '❌ Email sudah digunakan!',
                    'auth/invalid-email': '❌ Format email tidak valid!',
                    'auth/weak-password': '❌ Password terlalu lemah!',
                };
                showAuthError(msgs[e.code] || `❌ Error: ${e.message}`);
                setAuthLoading(false);
            }
        }

        // =============================================
        // NICKNAME
        // =============================================
        function previewNickname(val) {
            document.getElementById('nickname-preview').textContent = val || '...';
        }

        function showNicknameError(msg) {
            const el = document.getElementById('nickname-error');
            el.textContent = msg;
            el.style.display = msg ? 'block' : 'none';
        }

        async function saveNickname() {
            const nick = document.getElementById('nickname-input').value.trim();
            if (!nick) { showNicknameError('⚠️ Nickname tidak boleh kosong!'); return; }
            if (nick.length < 3) { showNicknameError('⚠️ Nickname minimal 3 karakter!'); return; }
            if (nick.length > 20) { showNicknameError('⚠️ Nickname maksimal 20 karakter!'); return; }
            if (!/^[a-zA-Z0-9 _]+$/.test(nick)) { showNicknameError('⚠️ Hanya huruf, angka, spasi, underscore!'); return; }
            
            showNicknameError('');
            try {
                await db.ref(`users/${currentUser.uid}`).set({
                    nickname: nick,
                    email: currentUser.email,
                    createdAt: Date.now()
                });
                currentNickname = nick;
                lsSet(LS.NICKNAME, nick);
                hideNicknameScreen();
                onAuthAndNicknameReady(currentUser, nick);
            } catch(e) {
                showNicknameError('❌ Gagal menyimpan nickname: ' + e.message);
            }
        }

        // =============================================
        // AFTER LOGIN + NICKNAME READY
        // =============================================
        function onAuthAndNicknameReady(user, nickname) {
            setAuthLoading(false);
            hideAuthScreen();        // ← pastikan form login tertutup sebelum tampilkan layar berikutnya
            hideNicknameScreen();    // ← pastikan nickname screen juga tertutup

            showProfileBadge(user.uid, nickname);

            // Cek & tandai presence (deteksi login di device lain)
            setupPresence(user, nickname);
            
            // Cek localStorage apakah ada sesi pertandingan aktif
            const savedRoomId   = lsGet(LS.ROOM_ID);
            const savedPlayerId = lsGet(LS.PLAYER_ID);
            const gameActive    = lsGet(LS.GAME_ACTIVE);
            const savedUid      = lsGet(LS.USER_UID);
            
            // Validasi: pastikan playerId ini milik user yang sedang login
            if (savedRoomId && savedPlayerId && gameActive === 'true' && savedUid === user.uid) {
                // Langsung reconnect otomatis, tidak perlu tombol
                showPreloadingScreen(false); // ← false, jangan tampilkan animasi loading
                setTimeout(() => {
                    reconnectToGame(savedRoomId, savedPlayerId);
                }, 1500);
            } else {
                // Hapus sesi lama yang bukan milik user ini
                lsDel(LS.ROOM_ID);
                lsDel(LS.PLAYER_ID);
                lsDel(LS.GAME_ACTIVE);
                showPreloadingScreen(true); // ← true, tampilkan animasi loading normal
            }
        }

        // =============================================
        // PROFILE BADGE
        // =============================================
        function showProfileBadge(uid, nickname) {
            document.getElementById('profile-nickname-display').textContent = nickname;
            
            // Tampilkan ID pendek (6 karakter terakhir UID)
            const shortId = uid.slice(-6).toUpperCase();
            document.getElementById('profile-id-display').textContent = `ID: #${shortId}`;
            
            // Avatar huruf pertama nickname
            document.getElementById('profile-avatar').textContent = nickname.charAt(0).toUpperCase();
            
            // Klik badge untuk logout
            document.getElementById('profile-badge').onclick = confirmLogout;
        }

        // =============================================
        // ONLINE PRESENCE (deteksi multi-device)
        // =============================================
        let _presenceRef = null;
        let _connectedRef = null;

        /**
         * Tulis status online ke Firebase Realtime DB.
         * Jika akun sudah online di device lain → tampilkan notifikasi.
         */
        async function setupPresence(user, nickname) {
            clearPresence(); // bersihkan listener lama jika ada

            const uid = user.uid;
            _presenceRef = db.ref(`presence/${uid}`);

            // Deteksi jenis perangkat
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const deviceLabel = isMobile ? '📱 HP/Tablet' : '💻 PC/Laptop';

            // ── Cek apakah sudah ada sesi lain yang aktif ──
            try {
                const snap = await _presenceRef.get();
                if (snap.exists()) {
                    const other = snap.val();
                    // Tampilkan peringatan sesi lain (hanya jika data ada)
                    showOnlineElsewhereNotification(other.device || 'perangkat lain', other.nickname || nickname);
                }
            } catch(e) { /* network issue — abaikan */ }

            // ── Pasang listener koneksi Firebase ──
            // Saat terkoneksi: tulis presence + jadwalkan hapus saat disconnect
            _connectedRef = db.ref('.info/connected');
            _connectedRef.on('value', (snap) => {
                if (snap.val() !== true) return;
                _presenceRef.onDisconnect().remove();
                _presenceRef.set({
                    nickname,
                    device:   deviceLabel,
                    loginAt:  Date.now(),
                });
            });
        }

        /** Hapus presence dan lepas listener saat logout/tutup. */
        function clearPresence() {
            if (_connectedRef) {
                _connectedRef.off();
                _connectedRef = null;
            }
            if (_presenceRef) {
                _presenceRef.onDisconnect().cancel();
                _presenceRef.remove().catch(() => {});
                _presenceRef = null;
            }
        }

        /**
         * Tampilkan toast peringatan akun sedang online di device lain.
         * Toast menutup otomatis setelah 8 detik.
         */
        function showOnlineElsewhereNotification(device, nickname) {
            // Hapus notifikasi lama jika ada
            const old = document.getElementById('online-elsewhere-notif');
            if (old) old.remove();

            const notif = document.createElement('div');
            notif.id = 'online-elsewhere-notif';
            notif.style.cssText = `
                position:fixed; top:20px; left:50%; transform:translateX(-50%);
                background:linear-gradient(135deg,#ff6f00,#e53935);
                color:white; padding:14px 22px; border-radius:14px;
                box-shadow:0 6px 24px rgba(0,0,0,0.45); z-index:99999;
                font-size:0.95em; text-align:center; max-width:340px; width:90%;
                animation:slideInRight 0.4s ease;
            `;
            notif.innerHTML = `
                <div style="font-size:1.3em; margin-bottom:4px;">⚠️ Akun Aktif di Tempat Lain</div>
                <div style="font-weight:normal; opacity:0.92; font-size:0.88em;">
                    <b>${nickname}</b> terdeteksi sedang online di <b>${device}</b>.<br>
                    Sesi lama akan digantikan oleh login ini.
                </div>
                <button onclick="document.getElementById('online-elsewhere-notif').remove()"
                    style="margin-top:10px; padding:5px 18px; background:rgba(255,255,255,0.25);
                           border:1px solid rgba(255,255,255,0.5); border-radius:8px;
                           color:white; cursor:pointer; font-size:0.85em;">
                    OK, Mengerti
                </button>
            `;
            document.body.appendChild(notif);

            // Auto-tutup setelah 8 detik
            setTimeout(() => {
                if (notif.parentElement) {
                    notif.style.animation = 'slideOutRight 0.4s ease forwards';
                    setTimeout(() => notif.remove(), 400);
                }
            }, 8000);
        }

        function confirmLogout() {
            if (confirm('🚪 Yakin ingin logout?\n\n⚠️ Jika sedang dalam pertandingan, aksi akan dijalankan otomatis sampai game selesai.')) {
                doLogout();
            }
        }

        async function doLogout() {
            stopClientKeepAlive();

            // Kirim auto mode ke server jika sedang bermain
            if (ws && currentRoomId) {
                try { ws.send(JSON.stringify({ type: 'SET_AUTO_MODE', roomId: currentRoomId, enabled: true })); } catch(e) {}
            }

            // Tutup WebSocket dengan bersih (null handler dulu agar tidak trigger reconnect)
            if (ws) {
                ws.onclose = null;
                ws.onerror = null;
                ws.onmessage = null;
                try { ws.close(); } catch(e) {}
                ws = null;
            }

            // Hapus presence dari Firebase sebelum signOut
            clearPresence();

            await auth.signOut();

            // Jangan hapus ROOM_ID dan PLAYER_ID agar bisa reconnect nanti jika ada sesi
            lsDel(LS.USER_UID);
            lsDel(LS.USER_EMAIL);
            lsDel(LS.NICKNAME);

            // Reset variabel game
            currentRoomId = null;
            myPlayerId = null;
            gameState = null;
            deckInitialized = false;
            reconnectAttempts = 0;

            // Reset form login agar tidak auto-isi dari sesi lama
            const loginEmail = document.getElementById('login-email');
            const loginPass  = document.getElementById('login-password');
            if (loginEmail) loginEmail.value = '';
            if (loginPass)  loginPass.value  = '';

            document.getElementById('game-container').classList.remove('active');
            document.getElementById('pre-loading-screen').style.display = 'none';
            // showAuthScreen() akan dipanggil otomatis oleh onAuthStateChanged(null)
        }

        // =============================================
        // RECONNECT BANNER
        // =============================================
        function showReconnectBanner() {
            // Tidak dipakai lagi - reconnect sekarang otomatis
            showPreloadingScreen();
        }

        function reconnectToGame(roomId, playerId) {
            if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
                addLog('❌ Gagal reconnect setelah 3 percobaan. Kembali ke menu.');
                lsDel(LS.ROOM_ID); lsDel(LS.PLAYER_ID); lsDel(LS.GAME_ACTIVE);
                reconnectAttempts = 0;
                showPreloadingScreen();
                return;
            }

            reconnectAttempts++;
            addLog(`🔄 Menyambung kembali... (percobaan ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`);
            
            if (ws) { try { ws.close(); } catch(e) {} ws = null; }

            // Tampilkan game container agar log terlihat
            document.getElementById('pre-loading-screen').style.display = 'none';
            document.getElementById('matchmaking-screen').classList.remove('active');
            document.getElementById('profile-badge').style.display = 'none';
            document.getElementById('game-container').classList.add('active');
            
            ws = new WebSocket(SERVER_URL);

            ws.onopen = () => {
                startClientKeepAlive(); // ← TAMBAHKAN INI
                ws.send(JSON.stringify({
                    type: 'REJOIN_ROOM',
                    roomId: roomId,
                    playerId: playerId,
                    playerName: currentNickname || lsGet(LS.NICKNAME) || 'Player',
                    userUid: currentUser ? currentUser.uid : (lsGet(LS.USER_UID) || '') // ← TAMBAHKAN INI
                }));
            };

            let reconnected = false;

            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.type === 'GAME_STATE_UPDATE') {
                    reconnected = true;
                    reconnectAttempts = 0; // reset karena berhasil
                    currentRoomId = roomId;
                    myPlayerId = playerId;
                    updateGameUI(data.state);
                    addLog('✅ Berhasil tersambung kembali!');
                    ws.send(JSON.stringify({ type: 'PLAYER_ACTIVE', roomId: currentRoomId }));
                    // Putar bgMusic2 saat reconnect berhasil
                    try {
                        soundEffects.bgMusic.pause();
                        soundEffects.bgMusic2.currentTime = 0;
                        soundEffects.bgMusic2.play().catch(() => {
                            // Autoplay diblokir browser, tunggu interaksi pertama user
                            document.addEventListener('click', function playOnFirstClick() {
                                soundEffects.bgMusic2.play().catch(() => {});
                                document.removeEventListener('click', playOnFirstClick);
                            });
                        });
                    } catch(e) {}
                    // Pindah ke onmessage normal
                    ws.onmessage = (ev) => handleServerMessage(JSON.parse(ev.data));
                } else if (data.type === 'ERROR') {
                    addLog('❌ ' + data.message);
                    lsDel(LS.ROOM_ID); lsDel(LS.PLAYER_ID); lsDel(LS.GAME_ACTIVE);
                    reconnectAttempts = 0;
                    showPreloadingScreen();
                } else {
                    // Pesan lain (misal LOG) tiba sebelum GAME_STATE_UPDATE.
                    // Set ID sementara agar handleServerMessage bisa render UI,
                    // tapi JANGAN ganti ws.onmessage — tunggu GAME_STATE_UPDATE.
                    currentRoomId = roomId;
                    myPlayerId = playerId;
                    handleServerMessage(data);
                }
            };

            ws.onerror = () => {
                addLog('⚠️ Koneksi gagal, mencoba lagi...');
                if (reconnectTimer) clearTimeout(reconnectTimer);
                reconnectTimer = setTimeout(() => reconnectToGame(roomId, playerId), 3000);
            };

            ws.onclose = (e) => {
                stopClientKeepAlive();
                // Gunakan flag `reconnected` (bukan currentRoomId) karena
                // currentRoomId bisa di-set lebih awal oleh pesan LOG.
                if (!reconnected && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                    if (reconnectTimer) clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(() => reconnectToGame(roomId, playerId), 3000);
                } else if (reconnected) {
                    sendAutoMode(true);
                }
            };
        }

        // =============================================
        // PRELOADING SCREEN (hanya tampil setelah login)
        // =============================================
        function showPreloadingScreen(withLoading = true) {
            document.getElementById('pre-loading-screen').style.display = 'flex';
            document.getElementById('pre-loading-screen').classList.remove('hidden');
            if (withLoading) startPreLoading();
        }

        // =============================================
        // AUTO MODE CLIENT-SIDE
        // =============================================
        let isAutoMode = false;
        let autoModeTimer = null;
        const AUTO_MODE_DELAY = 60000; // 60 detik sebelum auto mode aktif

        function sendAutoMode(enabled) {
            if (ws && currentRoomId) {
                try {
                    ws.send(JSON.stringify({ type: 'SET_AUTO_MODE', roomId: currentRoomId, enabled }));
                } catch(e) {}
            }
            isAutoMode = enabled;
            document.getElementById('auto-mode-indicator').style.display = enabled ? 'block' : 'none';
        }

        function startAutoModeTimer() {
            stopAutoModeTimer();
            autoModeTimer = setTimeout(() => {
                if (!document.hidden && document.hasFocus()) return; // Masih aktif
                sendAutoMode(true);
            }, AUTO_MODE_DELAY);
        }

        function stopAutoModeTimer() {
            if (autoModeTimer) { clearTimeout(autoModeTimer); autoModeTimer = null; }
        }

        // Event: Tab/window tidak aktif
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) {
                if (currentRoomId) startAutoModeTimer();
            } else {
                stopAutoModeTimer();
                // Reset auto mode jika aktif
                if (isAutoMode && currentRoomId && ws) {
                    sendAutoMode(false);
                    ws.send(JSON.stringify({ type: 'PLAYER_ACTIVE', roomId: currentRoomId }));
                }
                // Restore force pick interaction jika perlu
                if (gameState && myPlayerId) {
                    const player = gameState.players.find(p => p.id === myPlayerId);
                    if (player && gameState.forcePickMode && 
                        gameState.forcePickPlayers.some(p => p.id === player.id) && 
                        !player.hasPlayed) {
                        player.isProcessingAction = false;
                        forcePickClickDebounce = false;
                        setTimeout(() => enableForcePickInteraction(), 300);
                    }
                }
            }
        });

        // Event: Window blur (pindah tab/app)
        window.addEventListener('blur', () => {
            if (currentRoomId) startAutoModeTimer();
        });

        window.addEventListener('focus', () => {
            stopAutoModeTimer();
            if (isAutoMode && currentRoomId && ws) {
                sendAutoMode(false);
                ws.send(JSON.stringify({ type: 'PLAYER_ACTIVE', roomId: currentRoomId }));
            }
        });

        // Event: Sebelum tutup browser/tab
        window.addEventListener('beforeunload', () => {
            if (currentRoomId) {
                sendAutoMode(true);
                // Simpan sesi ke localStorage
                lsSet(LS.ROOM_ID, currentRoomId);
                lsSet(LS.PLAYER_ID, myPlayerId);
                lsSet(LS.GAME_ACTIVE, 'true');
            }
        });

        // Setiap interaksi user di area game → matikan auto mode
        document.addEventListener('click', () => {
            if (isAutoMode && currentRoomId && ws) {
                sendAutoMode(false);
                ws.send(JSON.stringify({ type: 'PLAYER_ACTIVE', roomId: currentRoomId }));
            }
            stopAutoModeTimer();
        });

        // =============================================
        // CARD IMAGES — menggunakan file lokal
        // Path: gambar/provinsi/(nama provinsi)/(nama kartu).png
        // =============================================

        // =============================================
        // DATA PROVINSI
        // =============================================
        const provinces = [
            { name: "Aceh", cards: [
                { name: "Banda Aceh", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumoh Aceh", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Ulee Balang", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Saman", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Mie Aceh", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sumatera Utara", cards: [
                { name: "Medan", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Bolon", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Ulos", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Tor-Tor", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Bika Ambon", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sumatera Barat", cards: [
                { name: "Padang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Gadang", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Bundo Kanduang", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Piring", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Rendang", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Riau", cards: [
                { name: "Pekanbaru", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Selaso Jatuh Kembar", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Teluk Belanga", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Zapin", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Gulai Belacan", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Kepulauan Riau", cards: [
                { name: "Tanjungpinang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Belah Bubung", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Kebaya Labuh", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Tandak", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Otak-otak", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Jambi", cards: [
                { name: "Jambi", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Panggung", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Baju Kurung Tanggung", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Sekapur Sirih", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Tempoyak", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Bengkulu", cards: [
                { name: "Bengkulu", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Bubungan Lima", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Rejang Lebong", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Andun", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Pendap", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sumatera Selatan", cards: [
                { name: "Palembang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Limas", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Aesan Gede", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Tanggai", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Pempek", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Bangka Belitung", cards: [
                { name: "Pangkalpinang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Rakit", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Pakaian Seting", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Sepen", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Lempah Kuning", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Lampung", cards: [
                { name: "Bandar Lampung", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Nuwou Sesat", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Tulang Bawang", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Sigeh Penguten", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Seruit", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "DKI Jakarta", cards: [
                { name: "Jakarta", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Kebaya", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Kebaya Encim", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Yapong", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Kerak Telor", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Jawa Barat", cards: [
                { name: "Bandung", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Kasepuhan", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Kebaya Sunda", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Jaipong", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Seblak", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Banten", cards: [
                { name: "Serang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Baduy", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Pakaian Pangsi", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Cokek", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Sate Bandeng", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Jawa Tengah", cards: [
                { name: "Semarang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Joglo", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Kebaya Jawa", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Serimpi", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Lumpia", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "DI Yogyakarta", cards: [
                { name: "Yogyakarta", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Bangsal Kencono", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Kebaya Kesatrian", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Kumbang", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Gudeg", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Jawa Timur", cards: [
                { name: "Surabaya", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Situbondo", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Pesa'an", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Remo", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Rujak Cingur", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Bali", cards: [
                { name: "Denpasar", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Gapura Candi Bentar", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Payas Agung", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Pendet", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Ayam Betutu", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Nusa Tenggara Barat", cards: [
                { name: "Mataram", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Dalam Loka", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Lambung", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Gandrung", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Ayam Taliwang", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Nusa Tenggara Timur", cards: [
                { name: "Kupang", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Musalaki", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Amarasi", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Caci", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Se'i", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Kalimantan Barat", cards: [
                { name: "Pontianak", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Panjang", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "King Baba", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Monong", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Bubur Pedas", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Kalimantan Tengah", cards: [
                { name: "Palangkaraya", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Betang", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Sangkarut", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Giring-giring", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Juhu Singkah", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Kalimantan Selatan", cards: [
                { name: "Banjarmasin", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Bubungan Tinggi", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Babaju Kun Galung Pacinan", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Baksa Kembang", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Soto Banjar", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Kalimantan Timur", cards: [
                { name: "Samarinda", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Lamin", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Kustin", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Gong", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Nasi Kuning", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Kalimantan Utara", cards: [
                { name: "Tanjung Selor", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Baloy", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Ta'a", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Jepen", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Kepiting Soka", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sulawesi Utara", cards: [
                { name: "Manado", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Walewangko", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Laku Tepu", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Maengket", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Bubur Manado", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Gorontalo", cards: [
                { name: "Gorontalo", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Dulohupa", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Biliu", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Polopalo", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Binte Biluhuta", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sulawesi Tengah", cards: [
                { name: "Palu", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Tambi", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Koje", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Lumense", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Kaledo", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sulawesi Barat", cards: [
                { name: "Mamuju", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Boyang", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Pattuqduq Towaine", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Patuddu", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Bau Peapi", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sulawesi Selatan", cards: [
                { name: "Makassar", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Tongkonan", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Baju Bodo", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Kipas Pakarena", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Coto Makassar", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Sulawesi Tenggara", cards: [
                { name: "Kendari", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Istana Buton", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Babu Nggawi", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Lulo", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Lapa-lapa", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Maluku", cards: [
                { name: "Ambon", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Baileo", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Baju Cele", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Cakalele", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Papeda", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Maluku Utara", cards: [
                { name: "Sofifi", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Sasadu", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Manteren Lamo", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Lenso", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Gohu Ikan", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Papua", cards: [
                { name: "Jayapura", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Honai", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Koteka", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Musyoh", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Papeda Papua", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Papua Barat", cards: [
                { name: "Manokwari", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Mod Aki Aksa", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Ewer", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Suanggi", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Ikan Bakar Manokwari", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Papua Selatan", cards: [
                { name: "Merauke", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Gotad", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Pummi", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Gatzi", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Sagu Sep", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Papua Tengah", cards: [
                { name: "Nabire", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Karapao", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Sali", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Yuw", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Ayam Bunaken", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Papua Pegunungan", cards: [
                { name: "Wamena", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Honai Pegunungan", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Yokal", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Selamat Datang", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Udang Selingkuh", type: "Makanan Khas", rarity: "common", power: 1 }
            ]},
            { name: "Papua Barat Daya", cards: [
                { name: "Sorong", type: "Ibu Kota", rarity: "legendary", power: 5 },
                { name: "Rumah Kambik", type: "Rumah Adat", rarity: "epic", power: 4 },
                { name: "Boe", type: "Pakaian Adat", rarity: "rare", power: 3 },
                { name: "Tari Aluyen", type: "Tarian", rarity: "uncommon", power: 2 },
                { name: "Udang Karang", type: "Makanan Khas", rarity: "common", power: 1 }
            ]}
        ];

        // =============================================
        // SOUND EFFECTS
        // =============================================
        const soundEffects = {
            zoomIn:    new Audio('sounds/zoom_in.mp3'),
            zoomOut:   new Audio('sounds/zoom_out.mp3'),
            forcePick: new Audio('sounds/force_pick.mp3'),
            drawCard:  new Audio('sounds/draw_card.mp3'),
            bgMusic:   new Audio('sounds/bg_music.mp3'),
            bgMusic2:  new Audio('sounds/bg_music2.mp3')
        };

        soundEffects.bgMusic.loop = true;
        soundEffects.bgMusic.volume = 0.3;
        soundEffects.bgMusic2.loop = true;
        soundEffects.bgMusic2.volume = 0.3;
        soundEffects.zoomIn.volume = 0.5;
        soundEffects.zoomOut.volume = 0.5;
        soundEffects.forcePick.volume = 0.6;
        soundEffects.drawCard.volume = 0.5;

        Object.values(soundEffects).forEach(s => s.load());

        let audioUnlocked = false;
        document.addEventListener('click', function unlockAudio() {
            if (!audioUnlocked) {
                Object.values(soundEffects).forEach(s => {
                    if (s === soundEffects.bgMusic || s === soundEffects.bgMusic2) return;
                    s.play().then(() => { s.pause(); s.currentTime = 0; }).catch(() => {});
                });
                audioUnlocked = true;
            }
        }, { once: true });

        function playSound(soundType) {
            try {
                const s = soundEffects[soundType];
                if (s) {
                    s.currentTime = 0;
                    const p = s.play();
                    if (p) p.catch(() => {});
                }
            } catch(e) {}
        }

        function ensureBgMusic2() {
            try {
                if (soundEffects.bgMusic2.paused) {
                    soundEffects.bgMusic.pause();
                    soundEffects.bgMusic2.play().catch(() => {});
                }
            } catch(e) {}
        }

        // =============================================
        // WEBSOCKET & GAME STATE
        // =============================================
        const SERVER_URL = "wss://server-card-game-production.up.railway.app";

        let ws = null;
        let currentRoomId = null;
        let myPlayerId = null;
        let gameState = null;

        let forcePickClickDebounce = false;
        let forcePickHeartbeat = null;
        let autoForcePickTimer = null;
        let refreshButtonTimer = null;

        let reconnectAttempts = 0;
        let reconnectTimer = null;
        const MAX_RECONNECT_ATTEMPTS = 3;
        let clientKeepAliveInterval = null;
        let deckInitialized = false;

        // Nama bot langsung dari server (sudah konsisten, tidak berubah saat refresh)
        const botNameMap = {}; // tetap ada agar referensi lain tidak error

        function getBotDisplayName(player) {
            return player.name;
        }

        // Tambahkan ini setelah baris "let refreshButtonTimer = null;"
        const DOM = {
            matchmakingScreen: document.getElementById('matchmaking-screen'),
            gameContainer:     document.getElementById('game-container'),
            gameOverModal:     document.getElementById('game-over-modal'),
            rankings:          document.getElementById('rankings'),
        };

        // =============================================
        // PRE-LOADING
        // =============================================
        function startPreLoading() {
            const infoEl = document.getElementById('pre-loading-info');
            const spinnerEl = document.getElementById('pre-loading-spinner');
            const subtitleEl = document.querySelector('.pre-loading-subtitle');
            const playBtn = document.getElementById('btn-play');

            const steps = [
                "Memuat 190 kartu provinsi...",
                "Memuat gambar dan aset...",
                "Menyiapkan sound effects...",
                "Mempersiapkan sistem game...",
                "Validasi data kartu...",
                "Hampir selesai..."
            ];
            let i = 0;
            const iv = setInterval(() => {
                if (i < steps.length) {
                    infoEl.textContent = steps[i++];
                } else {
                    clearInterval(iv);
                    infoEl.style.display = 'none';
                    subtitleEl.style.display = 'none';
                    spinnerEl.style.display = 'none';
                    playBtn.style.display = 'block';
                }
            }, 800);
        }

        function goToMatchmaking() {
            // Try to start bg music on user gesture
            try {
                soundEffects.bgMusic.currentTime = 0;
                soundEffects.bgMusic.play().catch(() => {});
            } catch(e) {}

            const preScreen = document.getElementById('pre-loading-screen');
            preScreen.classList.add('hidden');
            setTimeout(() => {
                preScreen.style.display = 'none';
                document.getElementById('matchmaking-screen').classList.add('active');
                document.getElementById('profile-badge').style.display = 'block';
            }, 500);
        }

        // =============================================
        // MATCHMAKING
        // =============================================
        function startMatchmaking() {
            soundEffects.bgMusic.pause();
            try {
                soundEffects.bgMusic2.currentTime = 0;
                soundEffects.bgMusic2.play().catch(() => {});
            } catch(e) {}
            DOM.matchmakingScreen.querySelector('#matchmaking-idle').style.display = 'none';
            DOM.matchmakingScreen.querySelector('#matchmaking-waiting').style.display = 'block';

            ws = new WebSocket(SERVER_URL);

            ws.onopen = () => {
                startClientKeepAlive(); // ← TAMBAHKAN INI
			    console.log("✅ WebSocket connected!"); // ← TAMBAHKAN INI
                const playerName = currentNickname || lsGet(LS.NICKNAME) || 'Player ' + Math.floor(Math.random() * 1000);
                ws.send(JSON.stringify({
                    type: 'JOIN_MATCHMAKING',
                    playerName: playerName,
                    userUid: currentUser ? currentUser.uid : (lsGet(LS.USER_UID) || '') // ← TAMBAHKAN INI
                }));
			    console.log("📤 Sent JOIN_MATCHMAKING as", playerName);
            };

            ws.onmessage = (event) => {
			    console.log("📨 RAW MESSAGE:", event.data); // ← TAMBAHKAN INI
                const data = JSON.parse(event.data);
                handleServerMessage(data);
            };

            ws.onerror = () => {
                alert("Gagal connect ke server! Coba lagi.");
                cancelMatchmaking();
            };

            ws.onclose = () => {
                console.log("🔌 Disconnected from server");
                stopClientKeepAlive(); // ← TAMBAHKAN INI
                // Jika koneksi terputus saat sudah di dalam game,
                // simpan sesi ke localStorage agar bisa reconnect nanti.
                if (currentRoomId) {
                    lsSet(LS.ROOM_ID, currentRoomId);
                    lsSet(LS.PLAYER_ID, myPlayerId);
                    lsSet(LS.GAME_ACTIVE, 'true');
                }
            };
        }

        function cancelMatchmaking() {
            if (ws) {
                try { ws.send(JSON.stringify({ type: 'LEAVE_QUEUE' })); } catch(e) {}
                ws.close();
            }
            DOM.matchmakingScreen.querySelector('#matchmaking-idle').style.display = 'flex';
            DOM.matchmakingScreen.querySelector('#matchmaking-waiting').style.display = 'none';
            DOM.matchmakingScreen.querySelector('#match-starting').style.display = 'none';
            soundEffects.bgMusic2.pause();
            soundEffects.bgMusic2.currentTime = 0;
            soundEffects.bgMusic.play().catch(() => {});
        }

        function handleServerMessage(data) {
		    console.log("📩 RECEIVED FROM SERVER:", data); // ← TAMBAHKAN INI
			
            switch (data.type) {
                case 'QUEUE_STATUS':
                    DOM.matchmakingScreen.querySelector('#queue-status').textContent = data.message;
                    break;

                case 'MATCH_STARTING':
                    DOM.matchmakingScreen.querySelector('#matchmaking-waiting').style.display = 'none';
                    DOM.matchmakingScreen.querySelector('#match-starting').style.display = 'block';
                    DOM.matchmakingScreen.querySelector('#match-info').textContent = 'Menyiapkan pertandingan...';
                    break;

                case 'GAME_STARTED':
                    currentRoomId = data.roomId;
                    myPlayerId = data.playerId;
                    
                    // ← TAMBAH: Simpan sesi ke localStorage untuk keperluan reconnect
                    lsSet(LS.ROOM_ID, data.roomId);
                    lsSet(LS.PLAYER_ID, data.playerId);
                    lsSet(LS.GAME_ACTIVE, 'true');

                    setTimeout(() => {
                        DOM.matchmakingScreen.classList.remove('active');
                        document.getElementById('profile-badge').style.display = 'none';
                        DOM.gameContainer.classList.add('active');
                        updateGameUI(data.state);
                        addLog('🎮 Game dimulai! Selamat bermain!');
                    }, 3000);
                    break;

                case 'GAME_STATE_UPDATE':
				    console.log("🔄 STATE UPDATE received!", data.state); // ← TAMBAHKAN INI
                    updateGameUI(data.state);
                    break;

                case 'GAME_OVER':
                    endGame(data.players);
                    break;

                case 'LOG':
                    if (data.message) addLog(data.message);
                    break;

                case 'ERROR':
                    alert("❌ Error: " + data.message);
                    break;

                case 'PING':
                    if (ws && ws.readyState === WebSocket.OPEN) {
                        try { ws.send(JSON.stringify({ type: 'PONG' })); } catch(e) {}
                    }
                    break;
            }
        }

        function updateGameUI(newState) {
            gameState = newState;
            updateUI();
        }

        // =============================================
        // PLAYER ACTIONS (Send to Server)
        // =============================================
        function playerPlayPhase1(card) {
            if (!ws || !currentRoomId) return;
            ensureBgMusic2();
            ws.send(JSON.stringify({
                type: 'PLAY_CARD',
                roomId: currentRoomId,
                cardId: card.id
            }));
        }

        function playerPlayCard(card) {
            if (!ws || !currentRoomId) return;
            ensureBgMusic2();
            ws.send(JSON.stringify({
                type: 'PLAY_CARD',
                roomId: currentRoomId,
                cardId: card.id
            }));
        }

        function playerDrawCard() {
            const player = gameState && gameState.players.find(p => p.id === myPlayerId);
            if (!player || !player.mustDraw || !ws || !currentRoomId) return;
            ensureBgMusic2();
            playSound('drawCard');
            ws.send(JSON.stringify({
                type: 'DRAW_CARD',
                roomId: currentRoomId
            }));
        }

        function playerSelectForcePickCard(card) {
            const player = gameState && gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;

            if (forcePickClickDebounce || player.isProcessingAction) return;
            ensureBgMusic2();

            if (autoForcePickTimer) { clearTimeout(autoForcePickTimer); autoForcePickTimer = null; }
            if (player.emergencyTimeoutId) { clearTimeout(player.emergencyTimeoutId); player.emergencyTimeoutId = null; }

            forcePickClickDebounce = true;
            player.isProcessingAction = true;

            const cardIndex = gameState.topCard.findIndex(c => c.id === card.id);
            if (cardIndex === -1) {
                forcePickClickDebounce = false;
                player.isProcessingAction = false;
                return;
            }

            playSound('forcePick');

            // Disable all selectable cards in UI immediately for feedback
            const topCardsDiv = document.getElementById('top-cards');
            topCardsDiv.querySelectorAll('.card.selectable').forEach(cardEl => {
                cardEl.classList.remove('selectable');
                cardEl.classList.add('disabled');
                cardEl.style.pointerEvents = 'none';
                cardEl.onclick = null;
                if (cardEl._forcePickHandler) {
                    cardEl.removeEventListener('click', cardEl._forcePickHandler);
                }
            });

            // Send to server
            ws.send(JSON.stringify({
                type: 'FORCE_PICK_CARD',
                roomId: currentRoomId,
                cardId: card.id
            }));

            // Reset debounce after short delay (server will update state)
            setTimeout(() => {
                forcePickClickDebounce = false;
                player.isProcessingAction = false;
            }, 1000);
        }

        // =============================================
        // UTILITY
        // =============================================
        function addLog(message) {
            const logContainer = document.getElementById('game-log');
            if (!logContainer) return;
            const logEntry = document.createElement('div');
            logEntry.classList.add('log-entry');
            logEntry.textContent = message;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;

            const isImportant = message.includes('MENANG') || message.includes('dibebaskan') ||
                message.includes('Force Pick') || message.includes('harus ambil');
            if (isImportant) showNotification(message);
        }

        function showNotification(message) {
            const n = document.createElement('div');
            n.className = 'game-notification';
            n.textContent = message;
            n.style.cssText = `
                position:fixed; top:20px; right:20px;
                background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);
                color:white; padding:15px 25px; border-radius:10px;
                box-shadow:0 4px 15px rgba(0,0,0,0.3); z-index:10000;
                font-weight:bold; animation:slideInRight 0.3s ease-out; max-width:300px;
            `;
            document.body.appendChild(n);
            setTimeout(() => {
                n.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => n.remove(), 300);
            }, 3000);
        }

        // =============================================
        // CARD ELEMENT CREATION
        // =============================================
        function createCardElement(card) {
            const div = document.createElement('div');
            div.className = `card ${card.rarity}`;
            div.dataset.cardId = card.id;

            const rarityEmojis = { legendary:'👑', epic:'💜', rare:'💠', uncommon:'🟢', common:'⚪' };
            const emojiMap = { 'Ibu Kota':'🏛️', 'Rumah Adat':'🏠', 'Pakaian Adat':'👘', 'Tarian':'💃', 'Makanan Khas':'🍜' };

            const fallbackEmoji = emojiMap[card.type] || '🎴';
            let imageContent = '';
            if (card.province) {
                const imgSrc = `gambar/provinsi/${card.province}/${card.name}.png`;
                imageContent = `<img src="${imgSrc}" alt="${card.name}" onerror="this.parentElement.innerHTML='${fallbackEmoji}';">`;
            } else {
                imageContent = fallbackEmoji;
            }

            div.innerHTML = `
                <div class="card-rarity">${rarityEmojis[card.rarity] || ''}</div>
                <div class="card-image">${imageContent}</div>
                <div class="card-name">${card.name}</div>
                <div class="card-type">${card.type}</div>
            `;
            return div;
        }

        // =============================================
        // PROVINCE INFO MODAL
        // =============================================
        function showProvinceInfo() {
            if (!gameState || !gameState.currentProvince) return;
            const provinceData = provinces.find(p => p.name === gameState.currentProvince);
            if (!provinceData) return;

            document.getElementById('province-info-title').textContent = `📍 ${gameState.currentProvince}`;

            const gridDiv = document.getElementById('province-cards-grid');
            gridDiv.innerHTML = '';

            const player = gameState.players.find(p => p.id === myPlayerId);
            const playerCardIds = player ? player.hand.map(c => c.id) : [];

            const rarityEmojis = { legendary:'👑', epic:'💜', rare:'💠', uncommon:'🟢', common:'⚪' };
            const emojiMap = { 'Ibu Kota':'🏛️', 'Rumah Adat':'🏠', 'Pakaian Adat':'👘', 'Tarian':'💃', 'Makanan Khas':'🍜' };

            provinceData.cards.forEach(card => {
                const cardDiv = document.createElement('div');
                const isOwned = playerCardIds.includes(`${gameState.currentProvince}-${card.name}`);
                cardDiv.className = `province-info-card ${card.rarity}`;

                const fallbackEmoji = emojiMap[card.type] || '🎴';
                let imageContent = '';
                const imgSrc = `gambar/provinsi/${gameState.currentProvince}/${card.name}.png`;
                imageContent = `<img src="${imgSrc}" alt="${card.name}" onerror="this.parentElement.innerHTML='${fallbackEmoji}';">`;

                cardDiv.innerHTML = `
                    <div class="province-info-card-rarity">${rarityEmojis[card.rarity] || ''}</div>
                    ${isOwned ? '<div class="province-info-card-owned">✅ Dimiliki</div>' : ''}
                    <div class="province-info-card-image">${imageContent}</div>
                    <div class="province-info-card-name">${card.name}</div>
                    <div class="province-info-card-type">${card.type}</div>
                `;
                gridDiv.appendChild(cardDiv);
            });

            document.getElementById('province-info-modal').classList.add('active');
        }

        function closeProvinceInfo() {
            document.getElementById('province-info-modal').classList.remove('active');
        }

        // =============================================
        // FORCE PICK INTERACTION
        // =============================================
        function enableForcePickInteraction() {
            if (!gameState || !myPlayerId) return;
            const player = gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;

            if (!gameState.forcePickMode || player.hasPlayed) return;
            if (!gameState.forcePickPlayers.some(p => p.id === player.id)) return;

            const topCardsDiv = document.getElementById('top-cards');

            gameState.topCard.forEach(card => {
                const cardEl = topCardsDiv.querySelector(`[data-card-id="${card.id}"]`);
                if (!cardEl) return;

                if (cardEl._forcePickHandler) {
                    cardEl.removeEventListener('click', cardEl._forcePickHandler);
                }

                cardEl.classList.remove('zoom-in', 'zoom-out', 'fly-to-top', 'locked', 'disabled');
                cardEl.classList.add('selectable');
                cardEl.style.pointerEvents = 'auto';
                cardEl.style.cursor = 'pointer';
                cardEl.style.zIndex = '10';

                const handler = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                    playerSelectForcePickCard(card);
                };
                cardEl._forcePickHandler = handler;
                cardEl.addEventListener('click', handler);
            });

            const penalty = document.getElementById('player-penalty');
            const penaltyText = document.getElementById('penalty-text');
            penalty.style.display = 'block';
            penaltyText.textContent = '⚠️ Ambil Kartu Di Atas';

            startForcePickHeartbeat();
            checkAndShowRefreshButton();
        }

        function startForcePickHeartbeat() {
            if (forcePickHeartbeat) { clearInterval(forcePickHeartbeat); forcePickHeartbeat = null; }

            forcePickHeartbeat = setInterval(() => {
                if (!gameState || !myPlayerId) return;
                const player = gameState.players.find(p => p.id === myPlayerId);
                if (!player) return;

                if (gameState.forcePickMode && gameState.forcePickPlayers.some(p => p.id === player.id) && !player.hasPlayed) {
                    const topCardsDiv = document.getElementById('top-cards');
                    if (!topCardsDiv) return;
                    const selectableCards = topCardsDiv.querySelectorAll('.card.selectable');
                    if (selectableCards.length === 0 && gameState.topCard.length > 0) {
                        player.isProcessingAction = false;
                        forcePickClickDebounce = false;
                        enableForcePickInteraction();
                    }
                } else {
                    clearInterval(forcePickHeartbeat);
                    forcePickHeartbeat = null;
                }
            }, 3000);
        }

        function stopForcePickHeartbeat() {
            if (forcePickHeartbeat) { clearInterval(forcePickHeartbeat); forcePickHeartbeat = null; }
        }

        function checkAndShowRefreshButton() {
            if (!gameState || !myPlayerId) return;
            const player = gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;
            const btn = document.getElementById('sync-refresh-btn');
            if (!btn) return;

            if (gameState.forcePickMode && gameState.forcePickPlayers.some(p => p.id === player.id) && !player.hasPlayed && gameState.topCard.length > 0) {
                if (refreshButtonTimer) clearTimeout(refreshButtonTimer);
                refreshButtonTimer = setTimeout(() => {
                    btn.style.display = 'flex';
                    setTimeout(() => { if (btn.style.display === 'flex') btn.classList.add('urgent'); }, 7000);
                }, 15000);
            } else {
                btn.style.display = 'none';
                btn.classList.remove('urgent');
                if (refreshButtonTimer) { clearTimeout(refreshButtonTimer); refreshButtonTimer = null; }
            }
        }

        function hideRefreshButton() {
            const btn = document.getElementById('sync-refresh-btn');
            btn.style.display = 'none';
            btn.classList.remove('urgent', 'success');
            btn.textContent = '🔄';
            if (refreshButtonTimer) { clearTimeout(refreshButtonTimer); refreshButtonTimer = null; }
            if (autoForcePickTimer) { clearTimeout(autoForcePickTimer); autoForcePickTimer = null; }
        }

        function syncRefresh() {
            if (!gameState || !myPlayerId) return;
            const player = gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;
            const btn = document.getElementById('sync-refresh-btn');

            btn.style.transform = 'rotate(360deg)';
            btn.style.transition = 'transform 0.5s ease-in-out';

            player.isProcessingAction = false;
            forcePickClickDebounce = false;

            stopForcePickHeartbeat();

            document.querySelectorAll('.card').forEach(cardEl => {
                cardEl.classList.remove('zoom-in', 'zoom-out', 'fly-to-top', 'shake', 'wrong-card');
            });

            if (gameState.forcePickMode && gameState.forcePickPlayers.some(p => p.id === player.id) && !player.hasPlayed) {
                setTimeout(() => enableForcePickInteraction(), 300);
            }

            updateUI();
            addLog('✅ Sinkronisasi selesai!');

            setTimeout(() => {
                btn.style.transform = 'rotate(0deg)';
                btn.classList.remove('urgent');
                btn.classList.add('success');
                btn.textContent = '✅';
                setTimeout(() => { btn.classList.remove('success'); btn.textContent = '🔄'; }, 2000);
            }, 500);
        }

        // =============================================
        // GAME OVER
        // =============================================
        function endGame(finalRankings) {
            lsClear();

            // Tutup surrender-choice & match-result modal jika masih terbuka
            document.getElementById('surrender-choice-modal').classList.remove('active');
            document.getElementById('match-result-modal').classList.remove('active');

            // Identifikasi nama pemain lokal untuk sorotan "← Kamu"
            const myPlayer = gameState && gameState.players.find(p => p.id === myPlayerId);
            const myName = myPlayer ? myPlayer.name : null;

            const modal = DOM.gameOverModal;
            const rankings = DOM.rankings;
            rankings.innerHTML = '';
            const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3', '💀 Kalah'];
            [...finalRankings].sort((a, b) => a.rank - b.rank).forEach(p => {
                const div = document.createElement('div');
                const isMe = myName && p.name === myName;
                div.className = p.rank <= 3 ? 'ranking-item winner' : 'ranking-item loser';
                if (isMe) div.style.cssText = 'outline: 2px solid #ffd700; outline-offset: 2px;';
                div.textContent = `${medals[p.rank - 1] || '🎖️'} - ${getBotDisplayName(p)} (${p.hand ? p.hand.length : p.cardsLeft || 0} kartu tersisa)${isMe ? '  ← Kamu' : ''}`;
                rankings.appendChild(div);
            });
            modal.classList.add('active');
        }

        // =============================================
        // SURRENDER CHOICE ACTIONS
        // =============================================

        /** Tutup popup pilihan → pemain lanjut menonton tanpa interaksi */
        function continueWatching() {
            document.getElementById('surrender-choice-modal').classList.remove('active');
        }

        /** Tutup popup pilihan → tampilkan popup hasil pertandingan saat ini */
        function showMatchResult() {
            document.getElementById('surrender-choice-modal').classList.remove('active');
            if (!gameState) return;

            const resultRankDiv = document.getElementById('match-result-rankings');
            const resultStatsDiv = document.getElementById('match-result-stats');
            const roundEl = document.getElementById('match-result-round');

            resultRankDiv.innerHTML = '';
            const statusLabel = gameState.gameOver ? '✅ Pertandingan Selesai' : '⚔️ Masih Berlangsung';
            roundEl.textContent = `Ronde ${gameState.round}  |  Fase ${gameState.phase}  |  ${statusLabel}`;

            const medals = ['🥇 Juara 1', '🥈 Juara 2', '🥉 Juara 3', '🎖️ Peringkat 4'];

            // Urutkan: yang sudah menang (berdasar rank), lalu yang masih main (kartu sedikit duluan)
            const sorted = [...gameState.players].sort((a, b) => {
                if (a.winner && b.winner) return a.rank - b.rank;
                if (a.winner) return -1;
                if (b.winner) return 1;
                return a.hand.length - b.hand.length;
            });

            sorted.forEach(p => {
                const div = document.createElement('div');
                const isMe = p.id === myPlayerId;
                const rankLabel = p.winner
                    ? (medals[p.rank - 1] || `🎖️ Peringkat ${p.rank}`)
                    : '⚔️ Masih bermain';
                div.className = `ranking-item ${p.winner && p.rank <= 3 ? 'winner' : p.winner ? 'loser' : ''}`;
                if (isMe) {
                    div.style.cssText = 'outline: 2px solid #ffd700; outline-offset:2px; background: linear-gradient(135deg,#fff9e6,#ffe082);';
                }
                div.innerHTML = `${rankLabel} &mdash; <strong>${getBotDisplayName(p)}</strong> `
                    + `👤 `
                    + `<span style="font-weight:normal;color:#666">(${p.hand.length} kartu | ⚡${p.totalPower})</span>`
                    + (isMe ? ' <span style="color:#e65100;font-weight:bold">← Kamu</span>' : '');
                resultRankDiv.appendChild(div);
            });

            resultStatsDiv.innerHTML = `
                <span>📋 Ronde ke-${gameState.round}</span>&nbsp;&nbsp;|&nbsp;&nbsp;
                <span>🔶 Kartu Tersisa: ${gameState.drawPile ? gameState.drawPile.length : 0} kartu</span>&nbsp;&nbsp;|&nbsp;&nbsp;
                <span>🗑️ Kartu Terpakai: ${gameState.discardPile ? gameState.discardPile.length : 0} kartu</span>
            `;

            document.getElementById('match-result-modal').classList.add('active');
        }

        /** Kembali ke halaman home: tutup semua modal, putar bgMusic, reset ke pre-loading screen */
        function goToHome() {
            // Tutup semua overlay/modal
            ['surrender-choice-modal', 'match-result-modal', 'game-over-modal'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.remove('active');
            });

            // Hentikan bgMusic2 (musik matchmaking) jika masih berjalan
            try {
                soundEffects.bgMusic2.pause();
                soundEffects.bgMusic2.currentTime = 0;
            } catch(e) {}

            // Putar bgMusic (user gesture sudah terjadi karena klik tombol)
            try {
                soundEffects.bgMusic.currentTime = 0;
                soundEffects.bgMusic.play().catch(() => {});
            } catch(e) {}

            // Simpan ref ws & roomId sebelum di-null, lalu kirim LEAVE_MATCH ke server.
            // ws.close() dipanggil 200ms setelah send agar pesan sempat terkirim dulu.
            const _ws = ws;
            const _roomId = currentRoomId;
            stopClientKeepAlive();
            ws = null; // null-kan segera agar tidak ada handler lain yang pakai
            if (_ws && _ws.readyState === WebSocket.OPEN && _roomId) {
                try { _ws.send(JSON.stringify({ type: 'LEAVE_MATCH', roomId: _roomId })); } catch(e) {}
                setTimeout(() => { try { _ws.close(); } catch(e) {} }, 200);
            } else if (_ws) {
                try { _ws.close(); } catch(e) {}
            }

            // Reset semua state game
            currentRoomId = null;
            myPlayerId = null;
            gameState = null;
            deckInitialized = false;
            lsClear();
            Object.keys(botNameMap).forEach(k => delete botNameMap[k]);

            // Sembunyikan layar game & matchmaking
            DOM.gameContainer.classList.remove('active');
            DOM.matchmakingScreen.classList.remove('active');
            // Reset matchmaking UI ke idle
            const idle = DOM.matchmakingScreen.querySelector('#matchmaking-idle');
            const waiting = DOM.matchmakingScreen.querySelector('#matchmaking-waiting');
            const starting = DOM.matchmakingScreen.querySelector('#match-starting');
            if (idle) idle.style.display = 'flex';
            if (waiting) waiting.style.display = 'none';
            if (starting) starting.style.display = 'none';

            // Sembunyikan pre-loading screen, tampilkan matchmaking-screen (layar utama)
            const preScreen = document.getElementById('pre-loading-screen');
            preScreen.style.display = 'none';
            preScreen.classList.remove('hidden');
            DOM.matchmakingScreen.classList.add('active');
            document.getElementById('profile-badge').style.display = 'block';
        }

        // =============================================
        // UI UPDATE FUNCTIONS
        // =============================================
        function updateUI() {
            if (!gameState || !myPlayerId) return;
            const player = gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;

            // Stats
            document.getElementById('round-number').textContent = gameState.round || 1;
            document.getElementById('phase-name').textContent = gameState.phase || 1;
            document.getElementById('draw-pile-count-2').textContent = gameState.drawPile ? gameState.drawPile.length : 0;
            document.getElementById('discard-pile-count-2').textContent = gameState.discardPile ? gameState.discardPile.length : 0;

            // Province label
            const provinceLabel = document.getElementById('province-label');
            provinceLabel.textContent = gameState.currentProvince ? `📍 ${gameState.currentProvince}` : 'Menunggu kartu...';

            // Province info button
            const infoBtn = document.getElementById('province-info-btn');
            infoBtn.style.display = gameState.currentProvince ? 'flex' : 'none';
            if (!infoBtn._listenerAdded) {
                infoBtn.addEventListener('click', showProvinceInfo);
                infoBtn._listenerAdded = true;
            }

            // Refresh button listener
            const refreshBtn = document.getElementById('sync-refresh-btn');
            if (!refreshBtn._listenerAdded) {
                refreshBtn.addEventListener('click', syncRefresh);
                refreshBtn._listenerAdded = true;
            }

            // Close province info modal
            const closeBtn = document.getElementById('province-info-close');
            if (!closeBtn._listenerAdded) {
                closeBtn.addEventListener('click', closeProvinceInfo);
                closeBtn._listenerAdded = true;
            }

            // Turn notification
            const notification = document.getElementById('player-turn-notification');
            const hasMatchingCard = player.hand.some(c => c.province === gameState.currentProvince);
            if (gameState.forcePickProcessing || player.mustForcePick) {
                notification.style.display = 'none';
            } else if (gameState.phase === 1 && gameState.phase1Player === player.id && !player.hasPlayed) {
                notification.style.display = 'block';
            } else if (gameState.phase === 2 && !player.hasPlayed && !player.mustDraw && !player.mustForcePick && hasMatchingCard) {
                notification.style.display = 'block';
            } else {
                notification.style.display = 'none';
            }

            updateTopCardsUI();
            updatePlayerUI();
            updateBotsUI();
            updateButtons();
        }

        function updateTopCardsUI() {
            if (!gameState) return;
            const topCardsDiv = document.getElementById('top-cards');
            const player = gameState.players.find(p => p.id === myPlayerId);

            // Remove cards no longer in topCard
            if (gameState.topCard.length === 0) {
                Array.from(topCardsDiv.children).forEach(el => {
                    if (!el.classList.contains('zoom-out')) {
                        el.classList.add('zoom-out');
                        playSound('zoomOut');
                        setTimeout(() => { if (el.parentNode) el.remove(); }, 300);
                    }
                });
                return;
            }

            const currentIds = gameState.topCard.map(c => c.id);
            Array.from(topCardsDiv.children).forEach(el => {
                if (!currentIds.includes(el.dataset.cardId) && !el.classList.contains('zoom-out')) {
                    el.classList.add('zoom-out');
                    playSound('zoomOut');
                    setTimeout(() => { if (el.parentNode) el.remove(); }, 300);
                }
            });

            // Add new cards
            gameState.topCard.forEach(card => {
                let existing = topCardsDiv.querySelector(`[data-card-id="${card.id}"]`);
                if (!existing) {
                    const cardEl = createCardElement(card);
                    cardEl.classList.add('locked');
                    cardEl.style.cursor = 'not-allowed';
                    topCardsDiv.appendChild(cardEl);

                    requestAnimationFrame(() => {
                        cardEl.classList.add('zoom-in');
                        playSound('zoomIn');
                    });

                    setTimeout(() => {
                        cardEl.classList.remove('zoom-in');
                        if (gameState.forcePickMode && player && gameState.forcePickPlayers.some(p => p.id === player.id) && !player.hasPlayed) {
                            setTimeout(() => enableForcePickInteraction(), 100);
                        }
                    }, 450);
                } else {
                    // Update interactivity on existing card
                    if (gameState.forcePickMode && player && gameState.forcePickPlayers.some(p => p.id === player.id) && !player.hasPlayed) {
                        setTimeout(() => enableForcePickInteraction(), 100);
                    } else {
                        existing.classList.remove('selectable');
                        existing.classList.add('locked');
                        existing.style.cursor = 'not-allowed';
                        if (existing._forcePickHandler) {
                            existing.removeEventListener('click', existing._forcePickHandler);
                        }
                        existing.onclick = null;
                    }
                }
            });
        }

        function updatePlayerUI() {
            if (!gameState || !myPlayerId) return;
            const player = gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;

            document.getElementById('player-header-name').textContent = `👤 ${player.name}`;
            document.getElementById('player-cards').textContent = player.hand.length;
            document.getElementById('player-power').textContent = player.totalPower || 0;

            const deckDiv = document.getElementById('player-deck');
            const sortedHand = [...player.hand].sort((a, b) => b.power - a.power);
            const newIds = sortedHand.map(c => c.id);

            // 1. Hapus kartu yang sudah tidak ada di tangan
            Array.from(deckDiv.children).forEach(el => {
                if (!newIds.includes(el.dataset.cardId) && !el.classList.contains('fly-to-top') && !el.classList.contains('zoom-out')) {
                    el.classList.add('zoom-out');
                    if (deckInitialized) playSound('zoomOut');
                    setTimeout(() => { if (el.parentNode) el.remove(); }, 300);
                }
            });

            // 2. Tambah kartu baru & update interaktivitas
            sortedHand.forEach(card => {
                let existing = deckDiv.querySelector(`[data-card-id="${card.id}"]`);
                if (!existing) {
                    const cardEl = createCardElement(card);
                    deckDiv.appendChild(cardEl);
                    cardEl.classList.add('zoom-in');
                    if (deckInitialized) playSound('zoomIn');
                    setTimeout(() => cardEl.classList.remove('zoom-in'), 400);
                    existing = cardEl;
                }

                // 3. Update interaktivitas
                const isPhase1Turn = gameState.phase === 1 && gameState.phase1Player === player.id && !player.hasPlayed && !player.isProcessingAction;
                const isPhase2Turn = gameState.phase === 2 && !player.hasPlayed && !player.mustDraw && !player.mustForcePick && !player.isProcessingAction;
                const matchesProvince = card.province === gameState.currentProvince;

                existing.classList.remove('selectable', 'disabled', 'locked');
                existing.onclick = null;

                if (isPhase1Turn) {
                    existing.classList.add('selectable');
                    existing.style.cursor = 'pointer';
                    existing.onclick = (e) => { e.stopPropagation(); playerPlayPhase1(card); };
                } else if (isPhase2Turn && matchesProvince) {
                    existing.classList.add('selectable');
                    existing.style.cursor = 'pointer';
                    existing.onclick = (e) => { e.stopPropagation(); playerPlayCard(card); };
                } else if (isPhase2Turn && !matchesProvince) {
                    existing.classList.add('disabled');
                    existing.style.cursor = 'not-allowed';
                    existing.onclick = (e) => {
                        e.stopPropagation();
                        addLog(`❌ ${card.name} bukan dari provinsi ${gameState.currentProvince}!`);
                        existing.classList.add('shake');
                        setTimeout(() => existing.classList.remove('shake'), 300);
                    };
                } else {
                    existing.classList.add('disabled');
                    existing.style.cursor = 'default';
                    existing.onclick = (e) => {
                        e.stopPropagation();
                        if (player.hasPlayed) addLog('❌ Anda sudah bermain di ronde ini!');
                        else if (player.mustDraw) addLog('❌ Anda harus Draw Card terlebih dahulu!');
                        else if (player.mustForcePick) addLog('⏳ Tunggu proses Ambil Kartu selesai!');
                        else addLog('❌ Kartu tidak bisa dimainkan saat ini!');
                    };
                }
            });

            // 4. Fix urutan kartu sesuai sortedHand
            sortedHand.forEach(card => {
                const el = deckDiv.querySelector(`[data-card-id="${card.id}"]`);
                if (el) deckDiv.appendChild(el);
            });

            // 5. Penalty & Freed notifications
            const penalty = document.getElementById('player-penalty');
            const penaltyText = document.getElementById('penalty-text');
            const freedNotif = document.getElementById('player-freed-notification');
            const topCardsDiv = document.getElementById('top-cards');
            const hasClickableCards = topCardsDiv.querySelector('.card.selectable') !== null;

            if (player.hasPlayed) {
                penalty.style.display = 'none';
            } else if (player.freed && gameState.phase === 2) {
                penalty.style.display = 'none';
            } else if (player.mustForcePick && !player.freed && hasClickableCards) {
                penalty.style.display = 'block';
                penaltyText.textContent = '⚠️ Ambil Kartu Di Atas';
            } else if (player.mustDraw) {
                penalty.style.display = 'block';
                penaltyText.textContent = '⚠️ Anda harus draw card';
            } else {
                penalty.style.display = 'none';
            }

            if (player.freed && gameState.phase === 2 && !gameState.forcePickProcessing) {
                freedNotif.style.display = 'block';
            } else {
                freedNotif.style.display = 'none';
            }

            deckInitialized = true; // ← selalu di paling akhir
        }
		
        function updateBotsUI() {
            if (!gameState) return;
            const panel = document.getElementById('opponents-panel');
            const title = panel.querySelector('.opponents-title');
    
            // Hapus opponent items lama
            panel.querySelectorAll('.opponent-item').forEach(el => el.remove());

            gameState.players.forEach(p => {
                if (p.id === myPlayerId) return;
                const div = document.createElement('div');
                const isDone = p.hasPlayed || p.winner;
                const isFP = p.mustForcePick;
                div.className = `opponent-item ${isDone ? 'active' : ''} ${isFP ? 'warning' : ''} human-player`;
                div.innerHTML = `
                    <div class="opponent-name">
                        <span class="status-dot ${isDone ? 'done' : 'waiting'}"></span>
                        👤 ${getBotDisplayName(p)}
                        ${p.winner ? ` 🏆#${p.rank}` : ''}
                    </div>
                    <div class="opponent-stats">
                        <div class="stat-badge">📇 ${p.hand ? p.hand.length : 0}</div>
                        <div class="stat-badge">⚡ ${p.totalPower || 0}</div>
                    </div>
                `;
                panel.appendChild(div);
            });
        }

        function updateButtons() {
            if (!gameState || !myPlayerId) return;
            const player = gameState.players.find(p => p.id === myPlayerId);
            if (!player) return;

            const btnDraw       = document.getElementById('btn-draw');
            const btnSurrender  = document.getElementById('btn-surrender');
            const btnShowResult = document.getElementById('btn-show-result');

            btnDraw.disabled = !player.mustDraw || player.hasPlayed;
            btnDraw.onclick  = player.mustDraw ? playerDrawCard : null;

            if (player.winner) {
                // Sudah selesai (menang atau menyerah) → sembunyikan surrender, tampilkan hasil
                if (btnSurrender)  { btnSurrender.style.display  = 'none'; }
                if (btnShowResult) { btnShowResult.style.display = 'inline-block'; }
            } else {
                if (btnSurrender)  { btnSurrender.style.display  = 'inline-block'; }
                if (btnShowResult) { btnShowResult.style.display = 'none'; }
            }
        }

        // Pre-loading dimulai setelah login (lihat onAuthAndNicknameReady)

        function doSurrender() {
            // Guard 1: pastikan ada room dan WebSocket benar-benar terbuka
            if (!currentRoomId || !ws || ws.readyState !== WebSocket.OPEN) {
                addLog('❌ Tidak bisa menyerah: koneksi ke server terputus.');
                return;
            }
            // Guard 2: cegah jika player sudah winner (misal double-click cepat)
            if (gameState && myPlayerId) {
                const p = gameState.players.find(p => p.id === myPlayerId);
                if (p && p.winner) return;
            }

            if (!confirm('🏳️ Yakin ingin menyerah?\n\nKartu yang kamu miliki akan masuk ke tumpukan terpakai.\nKamu akan mendapat peringkat terakhir yang tersedia.')) return;

            // Disable tombol langsung agar tidak bisa diklik 2x
            const btn = document.getElementById('btn-surrender');
            if (btn) { btn.disabled = true; btn.style.opacity = '0.4'; }

            // Kirim ke server dengan try/catch agar error koneksi tidak meledak
            try {
                ws.send(JSON.stringify({
                    type: 'SURRENDER',
                    roomId: currentRoomId
                }));
                addLog('🏳️ Kamu menyerah...');
            } catch(e) {
                addLog('❌ Gagal mengirim surrender: koneksi terputus. Coba lagi.');
                if (btn) { btn.disabled = false; btn.style.opacity = '1'; }
                return;
            }

            // Tampilkan pilihan: lanjut menonton atau lihat hasil
            setTimeout(() => {
                document.getElementById('surrender-choice-modal').classList.add('active');
            }, 600);
        }

        function startClientKeepAlive() {
            if (clientKeepAliveInterval) clearInterval(clientKeepAliveInterval);
            clientKeepAliveInterval = setInterval(() => {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    try { ws.send(JSON.stringify({ type: 'PONG' })); } catch(e) {}
                } else {
                    stopClientKeepAlive();
                }
            }, 20000);
        }

        function stopClientKeepAlive() {
            if (clientKeepAliveInterval) {
                clearInterval(clientKeepAliveInterval);
                clientKeepAliveInterval = null;
            }
        }

        // ============================================================
        // ENSIKLOPEDIA
        // ============================================================
        function showEncyclopedia() {
            document.getElementById('encyclopedia-screen').style.display = 'block';
            document.body.style.overflow = 'hidden';
            renderEncFilter();
            renderEncCards('Semua');
        }

        function hideEncyclopedia() {
            document.getElementById('encyclopedia-screen').style.display = 'none';
            document.body.style.overflow = '';
        }

        function showEncTab(tab) {
            document.getElementById('enc-tab-btn-cards').classList.toggle('active', tab === 'cards');
            document.getElementById('enc-tab-btn-rules').classList.toggle('active', tab === 'rules');
            document.getElementById('enc-tab-cards').classList.toggle('active', tab === 'cards');
            document.getElementById('enc-tab-rules').classList.toggle('active', tab === 'rules');
        }

        function renderEncFilter() {
            const filterDiv = document.getElementById('enc-prov-filter');
            if (!filterDiv) return;
            filterDiv.innerHTML = '';

            const allBtn = document.createElement('button');
            allBtn.className = 'enc-prov-btn active';
            allBtn.textContent = '🌏 Semua Provinsi';
            allBtn.onclick = () => {
                document.querySelectorAll('.enc-prov-btn').forEach(b => b.classList.remove('active'));
                allBtn.classList.add('active');
                renderEncCards('Semua');
            };
            filterDiv.appendChild(allBtn);

            provinces.forEach(prov => {
                const btn = document.createElement('button');
                btn.className = 'enc-prov-btn';
                btn.textContent = prov.name;
                btn.onclick = () => {
                    document.querySelectorAll('.enc-prov-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    renderEncCards(prov.name);
                };
                filterDiv.appendChild(btn);
            });
        }

        function renderEncCards(filter) {
            const container = document.getElementById('enc-cards-container');
            if (!container) return;
            container.innerHTML = '';

            const toShow = filter === 'Semua' ? provinces : provinces.filter(p => p.name === filter);

            toShow.forEach(prov => {
                const section = document.createElement('div');
                section.className = 'enc-province-section';

                const header = document.createElement('div');
                header.className = 'enc-province-name';
                const imgSrc = `gambar/provinsi/${prov.name}/peta (${prov.name}).png`;
                header.innerHTML = `<img src="${imgSrc}" alt="Peta ${prov.name}" class="enc-province-img" onerror="this.style.display='none'">${prov.name} <span style="font-size:0.72em;opacity:0.55;font-weight:normal;margin-left:4px;">(${prov.cards.length} kartu)</span>`;
                section.appendChild(header);

                const cardsRow = document.createElement('div');
                cardsRow.className = 'enc-cards-row';

                prov.cards.forEach(cardData => {
                    const fullCard = { ...cardData, id: 'enc_' + cardData.name, province: prov.name };
                    const cardEl = createCardElement(fullCard);
                    cardEl.style.cursor = 'default';
                    cardEl.classList.add('locked');

                    const wrapper = document.createElement('div');
                    wrapper.className = 'enc-card-wrapper';

                    const powerBadge = document.createElement('div');
                    powerBadge.className = 'enc-power-badge';
                    powerBadge.textContent = '⚡ Power ' + cardData.power;

                    const rarityLabels = {
                        legendary: '👑 Legendary',
                        epic:      '💜 Epic',
                        rare:      '💠 Rare',
                        uncommon:  '🟢 Uncommon',
                        common:    '⚪ Common'
                    };
                    const rarityBadge = document.createElement('div');
                    rarityBadge.className = `enc-rarity-badge ${cardData.rarity}`;
                    rarityBadge.textContent = rarityLabels[cardData.rarity] || cardData.rarity;

                    wrapper.appendChild(cardEl);
                    wrapper.appendChild(powerBadge);
                    wrapper.appendChild(rarityBadge);
                    cardsRow.appendChild(wrapper);
                });

                section.appendChild(cardsRow);
                container.appendChild(section);
            });
        }
    </script>
</body>
</html>
