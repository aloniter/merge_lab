(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const n of i)if(n.type==="childList")for(const r of n.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function t(i){const n={};return i.integrity&&(n.integrity=i.integrity),i.referrerPolicy&&(n.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?n.credentials="include":i.crossOrigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function s(i){if(i.ep)return;i.ep=!0;const n=t(i);fetch(i.href,n)}})();const g=[{id:1,moveLimit:10,orders:[{tier:2,qty:3}]},{id:2,moveLimit:12,orders:[{tier:2,qty:4}]},{id:3,moveLimit:10,orders:[{tier:2,qty:2},{tier:3,qty:1}]},{id:4,moveLimit:14,orders:[{tier:2,qty:3},{tier:3,qty:1}]},{id:5,moveLimit:12,orders:[{tier:3,qty:2}]},{id:6,moveLimit:15,orders:[{tier:2,qty:4},{tier:3,qty:1}]},{id:7,moveLimit:14,orders:[{tier:3,qty:2},{tier:2,qty:2}]},{id:8,moveLimit:16,orders:[{tier:3,qty:3}]},{id:9,moveLimit:15,orders:[{tier:2,qty:3},{tier:3,qty:2}]},{id:10,moveLimit:18,orders:[{tier:3,qty:3},{tier:2,qty:2}]},{id:11,moveLimit:16,orders:[{tier:3,qty:2},{tier:4,qty:1}]},{id:12,moveLimit:18,orders:[{tier:4,qty:2}]},{id:13,moveLimit:17,orders:[{tier:3,qty:3},{tier:4,qty:1}]},{id:14,moveLimit:20,orders:[{tier:3,qty:2},{tier:4,qty:2}]},{id:15,moveLimit:18,orders:[{tier:4,qty:2},{tier:3,qty:2}]},{id:16,moveLimit:20,orders:[{tier:3,qty:3},{tier:4,qty:2}]},{id:17,moveLimit:22,orders:[{tier:4,qty:3}]},{id:18,moveLimit:20,orders:[{tier:3,qty:2},{tier:4,qty:2},{tier:2,qty:3}]},{id:19,moveLimit:22,orders:[{tier:4,qty:3},{tier:3,qty:2}]},{id:20,moveLimit:24,orders:[{tier:4,qty:4}]},{id:21,moveLimit:22,orders:[{tier:4,qty:2},{tier:5,qty:1}]},{id:22,moveLimit:24,orders:[{tier:5,qty:2}]},{id:23,moveLimit:22,orders:[{tier:4,qty:3},{tier:5,qty:1}]},{id:24,moveLimit:25,orders:[{tier:4,qty:2},{tier:5,qty:2}]},{id:25,moveLimit:24,orders:[{tier:5,qty:2},{tier:4,qty:3}]},{id:26,moveLimit:26,orders:[{tier:4,qty:3},{tier:5,qty:2},{tier:3,qty:2}]},{id:27,moveLimit:28,orders:[{tier:5,qty:3}]},{id:28,moveLimit:26,orders:[{tier:4,qty:2},{tier:5,qty:2},{tier:3,qty:3}]},{id:29,moveLimit:28,orders:[{tier:5,qty:3},{tier:4,qty:3}]},{id:30,moveLimit:30,orders:[{tier:5,qty:4},{tier:4,qty:2}]}],L="mergeLab_levelOverrides";function y(){try{const a=localStorage.getItem(L);return a?JSON.parse(a):{}}catch{return{}}}function I(a){const e=y();e[a.id]=a,localStorage.setItem(L,JSON.stringify(e))}function C(a){const e=y();delete e[a],localStorage.setItem(L,JSON.stringify(e))}function f(a){const e=y();if(e[a])return e[a];const t=g.find(s=>s.id===a);if(!t)throw new Error(`Level ${a} not found`);return t}function T(a){const e=g.find(t=>t.id===a);if(!e)throw new Error(`Level ${a} not found`);return{...e,orders:e.orders.map(t=>({...t}))}}const w="mergeLab_completedLevels";function q(){try{const a=localStorage.getItem(w);return a?new Set(JSON.parse(a)):new Set}catch{return new Set}}function $(a){const e=q();e.add(a),localStorage.setItem(w,JSON.stringify(Array.from(e)))}function b(a){return q().has(a)}class h{static instance;storageKey="mergeLab_analytics";MAX_EVENTS=1e3;currentSession={levelId:null,startTime:null};constructor(){this.loadCurrentSession()}static getInstance(){return h.instance||(h.instance=new h),h.instance}logLevelStart(e){const t=Date.now();this.currentSession={levelId:e,startTime:t},this.saveCurrentSession(),this.saveEvent({eventType:"level_start",levelId:e,timestamp:t,metadata:{}})}logMoveUsed(e,t){this.saveEvent({eventType:"move_used",levelId:e,timestamp:Date.now(),metadata:{moveIndex:t}})}logMerge(e,t,s){this.saveEvent({eventType:"merge",levelId:e,timestamp:Date.now(),metadata:{fromTier:t,toTier:s}})}logOrderProgress(e,t,s){this.saveEvent({eventType:"order_progress",levelId:e,timestamp:Date.now(),metadata:{tier:t,remaining:s}})}logLevelEnd(e,t,s,i,n){const r={result:t,durationSec:i,movesUsed:s};n&&(r.failReason=n),this.saveEvent({eventType:"level_end",levelId:e,timestamp:Date.now(),metadata:r}),this.currentSession={levelId:null,startTime:null},this.saveCurrentSession()}getEvents(){return this.loadData().events}getEventsByLevel(e){return this.getEvents().filter(t=>t.levelId===e)}getInsightsForLevel(e){const s=this.getEventsByLevel(e).filter(c=>c.eventType==="level_end");if(s.length===0)return null;const i=s.filter(c=>c.metadata.result==="win").length,n=s.filter(c=>c.metadata.result==="fail").length,r=i+n,o=s.reduce((c,m)=>c+m.metadata.durationSec,0),l=s.reduce((c,m)=>c+m.metadata.movesUsed,0),d={};return s.filter(c=>c.metadata.result==="fail"&&c.metadata.failReason).forEach(c=>{const m=c.metadata.failReason;d[m]=(d[m]||0)+1}),{levelId:e,attempts:r,wins:i,fails:n,winRate:r>0?i/r*100:0,avgDuration:r>0?o/r:0,avgMovesUsed:r>0?l/r:0,failReasons:d}}getAllInsights(){const e=new Set(this.getEvents().map(s=>s.levelId)),t=[];for(const s of e){const i=this.getInsightsForLevel(s);i&&t.push(i)}return t.sort((s,i)=>s.levelId-i.levelId)}exportEventsAsCSV(){const e=this.getEvents(),t=["Timestamp","Level ID","Event Type","Metadata"],s=e.map(n=>[new Date(n.timestamp).toISOString(),n.levelId.toString(),n.eventType,JSON.stringify(n.metadata)]);return[t.join(","),...s.map(n=>n.map(r=>`"${r.replace(/"/g,'""')}"`).join(","))].join(`
`)}exportInsightsAsCSV(){const e=this.getAllInsights(),t=["Level ID","Attempts","Wins","Fails","Win Rate","Avg Duration","Avg Moves Used","Fail Reasons"],s=e.map(n=>[n.levelId.toString(),n.attempts.toString(),n.wins.toString(),n.fails.toString(),`${n.winRate.toFixed(2)}%`,n.avgDuration.toFixed(1),n.avgMovesUsed.toFixed(1),JSON.stringify(n.failReasons)]);return[t.join(","),...s.map(n=>n.map(r=>`"${r.replace(/"/g,'""')}"`).join(","))].join(`
`)}exportLevelInsightsAsCSV(e){const t=this.getInsightsForLevel(e);if(!t)return"";const s=["Level ID","Attempts","Wins","Fails","Win Rate","Avg Duration","Avg Moves Used","Fail Reasons"],i=[t.levelId.toString(),t.attempts.toString(),t.wins.toString(),t.fails.toString(),`${t.winRate.toFixed(2)}%`,t.avgDuration.toFixed(1),t.avgMovesUsed.toFixed(1),JSON.stringify(t.failReasons)];return[s.join(","),i.map(r=>`"${r.replace(/"/g,'""')}"`).join(",")].join(`
`)}clearAllData(){localStorage.removeItem(this.storageKey),this.currentSession={levelId:null,startTime:null}}getCurrentStartTime(){return this.currentSession.startTime||Date.now()}saveEvent(e){const t=this.loadData();t.events.push(e),this.trimEvents(t),this.saveData(t)}trimEvents(e){e.events.length>this.MAX_EVENTS&&(e.events=e.events.slice(-this.MAX_EVENTS))}loadData(){try{const e=localStorage.getItem(this.storageKey);if(e)return JSON.parse(e)}catch(e){console.error("Failed to load analytics data:",e)}return{events:[],currentSession:{levelId:null,startTime:null}}}saveData(e){try{localStorage.setItem(this.storageKey,JSON.stringify(e))}catch(t){console.error("Failed to save analytics data:",t)}}loadCurrentSession(){const e=this.loadData();this.currentSession=e.currentSession}saveCurrentSession(){const e=this.loadData();e.currentSession=this.currentSession,this.saveData(e)}}class v{static instance;static STORAGE_KEY="mergeLab_soundEnabled";audioContext=null;enabled=!0;sounds={tap:{frequencies:[440],duration:.08},merge:{frequencies:[523,659,784],duration:.15},win:{frequencies:[523,659,784,1047],duration:.4}};constructor(){this.loadPreference()}static getInstance(){return v.instance||(v.instance=new v),v.instance}loadPreference(){const e=localStorage.getItem(v.STORAGE_KEY);this.enabled=e!=="false"}savePreference(){localStorage.setItem(v.STORAGE_KEY,String(this.enabled))}isEnabled(){return this.enabled}toggle(){return this.enabled=!this.enabled,this.savePreference(),this.enabled}play(e){if(!this.enabled)return;this.audioContext||(this.audioContext=new(window.AudioContext||window.webkitAudioContext));const{frequencies:t,duration:s}=this.sounds[e],i=this.audioContext,n=i.currentTime;t.forEach((r,o)=>{const l=i.createOscillator(),d=i.createGain();l.connect(d),d.connect(i.destination),l.type="sine",l.frequency.value=r,d.gain.setValueAtTime(.12,n),d.gain.exponentialRampToValueAtTime(.01,n+s),l.start(n+o*.05),l.stop(n+s+o*.05)})}}const u=6,E={1:"#00fff5",2:"#ff00ff",3:"#ffff00",4:"#00ff00",5:"#ff8800",6:"#ffd700"};class S{grid;containerEl;movesEl=null;ordersEl=null;level=null;movesRemaining=0;orderProgress=new Map;isGameOver=!1;onComplete=null;onExit=null;analytics;sound;levelStartTime=0;constructor(e){const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} not found`);this.containerEl=t,this.grid=this.createEmptyGrid(),this.analytics=h.getInstance(),this.sound=v.getInstance()}createEmptyGrid(){return Array.from({length:u},()=>Array.from({length:u},()=>null))}getTierColor(e){return E[Math.min(e,6)]||E[6]}loadLevel(e,t,s){this.level=e,this.movesRemaining=e.moveLimit,this.orderProgress=new Map,this.isGameOver=!1,this.onComplete=t||null,this.onExit=s||null,this.grid=this.createEmptyGrid();for(const i of e.orders)this.orderProgress.set(i.tier,0);this.levelStartTime=Date.now(),this.analytics.logLevelStart(e.id),this.render()}render(){if(!this.level){this.containerEl.innerHTML="<p>No level loaded</p>";return}this.containerEl.innerHTML=`
      <div class="game-header">
        <button class="back-btn">← Back</button>
        <span class="level-info">Level ${this.level.id}</span>
        <span class="moves-counter">Moves: ${this.movesRemaining}</span>
        <button class="reset-btn">Restart</button>
      </div>
      <div class="orders-panel"></div>
      <div class="game-grid-wrapper">
        <div class="game-grid"></div>
      </div>
    `,this.movesEl=this.containerEl.querySelector(".moves-counter"),this.ordersEl=this.containerEl.querySelector(".orders-panel");const e=this.containerEl.querySelector(".game-grid"),t=this.containerEl.querySelector(".reset-btn"),s=this.containerEl.querySelector(".back-btn");t.addEventListener("click",()=>this.restart()),s.addEventListener("click",()=>{this.onExit&&this.onExit()}),this.renderOrders();for(let i=0;i<u;i++)for(let n=0;n<u;n++){const r=this.grid[i][n],o=document.createElement("div");o.className="cell",o.dataset.row=String(i),o.dataset.col=String(n),r&&(o.textContent=String(r.tier),o.style.color=this.getTierColor(r.tier),o.style.textShadow=`0 0 10px ${this.getTierColor(r.tier)}`),o.addEventListener("click",()=>this.handleCellClick(i,n)),e.appendChild(o)}}renderOrders(){!this.ordersEl||!this.level||(this.ordersEl.innerHTML=this.level.orders.map(e=>{const t=this.orderProgress.get(e.tier)||0;return`
        <div class="order-item ${t>=e.qty?"complete":""}">
          <span class="order-tier" style="color: ${this.getTierColor(e.tier)}; text-shadow: 0 0 8px ${this.getTierColor(e.tier)}">${e.tier}</span>
          <span class="order-progress">${Math.min(t,e.qty)}/${e.qty}</span>
        </div>
      `}).join(""))}updateMovesDisplay(){this.movesEl&&(this.movesEl.textContent=`Moves: ${this.movesRemaining}`)}handleCellClick(e,t){if(!this.isGameOver&&this.grid[e][t]===null&&!(this.movesRemaining<=0)){if(this.grid[e][t]={tier:1},this.movesRemaining--,this.updateMovesDisplay(),this.sound.play("tap"),this.level){const s=this.level.moveLimit-this.movesRemaining;this.analytics.logMoveUsed(this.level.id,s)}this.checkAndMerge(e,t)}}checkAndMerge(e,t){const s=this.grid[e][t];if(!s)return;const i=[[-1,0],[1,0],[0,-1],[0,1]];for(const[n,r]of i){const o=e+n,l=t+r;if(o<0||o>=u||l<0||l>=u)continue;const d=this.grid[o][l];if(d&&d.tier===s.tier){const c=s.tier+1;this.grid[o][l]=null,this.grid[e][t]={tier:c},this.sound.play("merge"),this.level&&this.analytics.logMerge(this.level.id,s.tier,c),this.trackOrder(c),this.renderCell(e,t,!0),this.renderCell(o,l,!1),setTimeout(()=>{this.checkWin()?this.showWinScreen():this.checkAndMerge(e,t)},150);return}}this.renderCell(e,t,!1),setTimeout(()=>{!this.isGameOver&&this.checkLose()&&this.showLoseScreen()},50)}trackOrder(e){if(!this.level)return;const t=this.level.orders.find(s=>s.tier===e);if(t){const s=this.orderProgress.get(e)||0;this.orderProgress.set(e,s+1);const i=t.qty-(s+1);this.analytics.logOrderProgress(this.level.id,e,i),this.renderOrders()}}checkWin(){if(!this.level)return!1;for(const e of this.level.orders)if((this.orderProgress.get(e.tier)||0)<e.qty)return!1;return!0}checkLose(){return!this.level||this.checkWin()?!1:this.movesRemaining<=0}showWinScreen(){const e=this.level?this.level.moveLimit-this.movesRemaining:0,t=Math.round((Date.now()-this.levelStartTime)/1e3);this.level&&(this.analytics.logLevelEnd(this.level.id,"win",e,t),$(this.level.id)),this.sound.play("win"),this.isGameOver=!0;const i=`I beat Level ${this.level?.id||0} in ${e} moves (${t}s) on Merge Lab!`,n=document.createElement("div");n.className="game-overlay win",n.innerHTML=`
      <div class="overlay-content">
        <h2 class="overlay-title">Level Complete!</h2>
        <p class="overlay-subtitle">You completed all orders</p>

        <div class="win-stats">
          <div class="win-stat">
            <span class="win-stat-value">${e}</span>
            <span class="win-stat-label">Moves</span>
          </div>
          <div class="win-stat">
            <span class="win-stat-value">${t}s</span>
            <span class="win-stat-label">Time</span>
          </div>
        </div>

        <button class="overlay-btn primary next-btn">Next Level</button>
        <button class="overlay-btn replay-btn">Replay</button>
        <button class="overlay-btn share-btn" data-share="${encodeURIComponent(i)}">Share Result</button>
      </div>
    `;const r=this.containerEl.querySelector(".game-grid-wrapper");r&&r.appendChild(n),n.querySelector(".next-btn")?.addEventListener("click",()=>{this.onComplete&&this.onComplete()}),n.querySelector(".replay-btn")?.addEventListener("click",()=>{this.restart()}),n.querySelector(".share-btn")?.addEventListener("click",o=>{const l=o.target,d=decodeURIComponent(l.dataset.share||"");this.copyToClipboard(d)})}copyToClipboard(e){navigator.clipboard.writeText(e).then(()=>{this.showShareToast("Copied to clipboard!")}).catch(()=>{this.showShareToast("Could not copy")})}showShareToast(e){const t=this.containerEl.querySelector(".share-toast");t&&t.remove();const s=document.createElement("div");s.className="share-toast",s.textContent=e,this.containerEl.appendChild(s),setTimeout(()=>s.remove(),2e3)}showLoseScreen(){if(this.level){const s=this.level.moveLimit-this.movesRemaining,i=Math.round((Date.now()-this.levelStartTime)/1e3),r=Array.from(this.orderProgress.values()).some(o=>o>0)?"orders_not_completed":"out_of_moves";this.analytics.logLevelEnd(this.level.id,"fail",s,i,r)}this.isGameOver=!0;const e=document.createElement("div");e.className="game-overlay lose",e.innerHTML=`
      <div class="overlay-content">
        <h2 class="overlay-title">Out of Moves!</h2>
        <p class="overlay-subtitle">Try again</p>
        <button class="overlay-btn primary">Retry</button>
      </div>
    `;const t=this.containerEl.querySelector(".game-grid-wrapper");t&&t.appendChild(e),e.querySelector(".overlay-btn")?.addEventListener("click",()=>{this.restart()})}restart(){this.level&&this.loadLevel(this.level,this.onComplete||void 0)}renderCell(e,t,s){const i=this.containerEl.querySelector(`.cell[data-row="${e}"][data-col="${t}"]`);if(!i)return;const n=this.grid[e][t];n?(i.textContent=String(n.tier),i.style.color=this.getTierColor(n.tier),i.style.textShadow=`0 0 10px ${this.getTierColor(n.tier)}`,s&&(i.classList.remove("merging"),i.offsetWidth,i.classList.add("merging"))):(i.textContent="",i.style.color="",i.style.textShadow="",i.classList.remove("merging"))}}class x{containerEl;selectedLevelId=1;editedLevel;onPlayLevel=null;constructor(e,t){const s=document.getElementById(e);if(!s)throw new Error(`Container ${e} not found`);this.containerEl=s,this.onPlayLevel=t||null,this.editedLevel=this.cloneLevel(f(1)),this.render()}cloneLevel(e){return{id:e.id,moveLimit:e.moveLimit,orders:e.orders.map(t=>({...t}))}}render(){const e=y(),t=!!e[this.selectedLevelId];this.containerEl.innerHTML=`
      <div class="editor-container">
        <h2 class="editor-title">Level Editor</h2>

        <div class="editor-section">
          <label class="editor-label">Select Level</label>
          <select class="editor-select level-select">
            ${g.map(s=>`
              <option value="${s.id}" ${s.id===this.selectedLevelId?"selected":""}>
                Level ${s.id} ${e[s.id]?"(modified)":""}
              </option>
            `).join("")}
          </select>
        </div>

        <div class="editor-section">
          <label class="editor-label">Move Limit</label>
          <input type="number" class="editor-input move-limit-input"
                 value="${this.editedLevel.moveLimit}" min="1" max="99">
        </div>

        <div class="editor-section">
          <label class="editor-label">Orders</label>
          <div class="orders-list">
            ${this.editedLevel.orders.map((s,i)=>`
              <div class="order-row" data-index="${i}">
                <div class="order-field">
                  <span class="order-field-label">Tier</span>
                  <input type="number" class="editor-input order-tier"
                         value="${s.tier}" min="2" max="10">
                </div>
                <div class="order-field">
                  <span class="order-field-label">Qty</span>
                  <input type="number" class="editor-input order-qty"
                         value="${s.qty}" min="1" max="20">
                </div>
                <button class="editor-btn danger remove-order-btn">X</button>
              </div>
            `).join("")}
          </div>
          <button class="editor-btn add-order-btn">+ Add Order</button>
        </div>

        <div class="editor-actions">
          <button class="editor-btn primary save-btn">Save Changes</button>
          <button class="editor-btn reset-btn" ${t?"":"disabled"}>
            Reset to Default
          </button>
        </div>

        <div class="editor-section play-section">
          <button class="editor-btn success play-btn">Play This Level</button>
        </div>
      </div>
    `,this.setupEventListeners()}setupEventListeners(){const e=this.containerEl.querySelector(".level-select");e?.addEventListener("change",()=>{this.selectedLevelId=parseInt(e.value),this.editedLevel=this.cloneLevel(f(this.selectedLevelId)),this.render()});const t=this.containerEl.querySelector(".move-limit-input");t?.addEventListener("input",()=>{this.editedLevel.moveLimit=parseInt(t.value)||1}),this.containerEl.querySelectorAll(".order-row").forEach((s,i)=>{const n=s.querySelector(".order-tier"),r=s.querySelector(".order-qty"),o=s.querySelector(".remove-order-btn");n?.addEventListener("input",()=>{this.editedLevel.orders[i].tier=parseInt(n.value)||2}),r?.addEventListener("input",()=>{this.editedLevel.orders[i].qty=parseInt(r.value)||1}),o?.addEventListener("click",()=>{this.editedLevel.orders.splice(i,1),this.render()})}),this.containerEl.querySelector(".add-order-btn")?.addEventListener("click",()=>{this.editedLevel.orders.push({tier:2,qty:1}),this.render()}),this.containerEl.querySelector(".save-btn")?.addEventListener("click",()=>{I(this.editedLevel),this.render(),this.showToast("Level saved!")}),this.containerEl.querySelector(".reset-btn")?.addEventListener("click",()=>{C(this.selectedLevelId),this.editedLevel=this.cloneLevel(T(this.selectedLevelId)),this.render(),this.showToast("Reset to default")}),this.containerEl.querySelector(".play-btn")?.addEventListener("click",()=>{this.onPlayLevel&&this.onPlayLevel(this.cloneLevel(this.editedLevel))})}showToast(e){const t=this.containerEl.querySelector(".editor-toast");t&&t.remove();const s=document.createElement("div");s.className="editor-toast",s.textContent=e,this.containerEl.appendChild(s),setTimeout(()=>s.remove(),2e3)}}class A{containerEl;analytics;selectedLevelId=null;constructor(e){const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} not found`);this.containerEl=t,this.analytics=h.getInstance(),this.render()}refresh(){this.render()}render(){const e=this.analytics.getAllInsights();if(e.length===0){this.containerEl.innerHTML=this.renderEmptyState();return}this.containerEl.innerHTML=`
      <div class="insights-container">
        <h2 class="insights-title">Analytics Insights</h2>
        ${this.renderOverview(e)}
        ${this.renderLevelSelector(e)}
        ${this.selectedLevelId?this.renderLevelDetails(this.selectedLevelId):""}
        ${this.renderActions()}
      </div>
    `,this.setupEventListeners()}renderEmptyState(){return`
      <div class="insights-empty-state">
        <h3>No Analytics Data Yet</h3>
        <p>Play some levels to start tracking your progress!</p>
      </div>
    `}renderOverview(e){const t=e.reduce((o,l)=>o+l.attempts,0),s=e.reduce((o,l)=>o+l.wins,0),i=t>0?s/t*100:0,n=e.reduce((o,l)=>l.attempts>o.attempts?l:o,e[0]),r=e.reduce((o,l)=>l.winRate<o.winRate?l:o,e[0]);return`
      <div class="insights-section insights-overview">
        <h3>Overview</h3>
        <div class="insights-stat">
          <span class="stat-label">Total Attempts</span>
          <span class="stat-value">${t}</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Overall Win Rate</span>
          <span class="stat-value">${i.toFixed(1)}%</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Most Played Level</span>
          <span class="stat-value">Level ${n.levelId} (${n.attempts} attempts)</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Hardest Level</span>
          <span class="stat-value">Level ${r.levelId} (${r.winRate.toFixed(1)}% win rate)</span>
        </div>
      </div>
    `}renderLevelSelector(e){return`
      <div class="insights-section">
        <h3>Level Statistics</h3>
        <select class="insights-level-select" id="level-selector">
          <option value="">Select a level...</option>
          ${e.map(t=>`
            <option value="${t.levelId}" ${t.levelId===this.selectedLevelId?"selected":""}>
              Level ${t.levelId} - ${t.attempts} attempts, ${t.winRate.toFixed(1)}% win rate
            </option>
          `).join("")}
        </select>
      </div>
    `}renderLevelDetails(e){const t=this.analytics.getInsightsForLevel(e);if(!t)return"";const s=Object.keys(t.failReasons).length>0?Object.entries(t.failReasons).map(([i,n])=>`
          <div class="fail-reason-item">
            <span class="fail-reason-label">${this.formatFailReason(i)}</span>
            <span class="fail-reason-count">${n} time${n>1?"s":""}</span>
          </div>
        `).join(""):'<p style="color: #64748b; font-size: 0.875rem;">No failures recorded</p>';return`
      <div class="insights-section insights-level-details">
        <h3>Level ${e} Details</h3>
        <div class="insights-metric">
          <span class="metric-label">Attempts</span>
          <span class="metric-value">${t.attempts}</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Win Rate</span>
          <span class="metric-value">${t.winRate.toFixed(1)}%</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Wins / Fails</span>
          <span class="metric-value">${t.wins} / ${t.fails}</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Avg Duration</span>
          <span class="metric-value">${t.avgDuration.toFixed(1)}s</span>
        </div>
        <div class="insights-metric">
          <span class="metric-label">Avg Moves Used</span>
          <span class="metric-value">${t.avgMovesUsed.toFixed(1)}</span>
        </div>
        <div class="fail-reasons-breakdown">
          <h4 style="margin: 0 0 0.5rem 0; font-size: 0.875rem; color: #64748b;">Fail Reasons</h4>
          ${s}
        </div>
        <button class="insights-btn primary" id="export-level-csv">Export Level CSV</button>
      </div>
    `}renderActions(){return`
      <div class="insights-section insights-actions">
        <h3>Actions</h3>
        <button class="insights-btn primary" id="export-all-csv">Export All Insights CSV</button>
        <button class="insights-btn" id="refresh-btn">Refresh Data</button>
        <button class="insights-btn danger" id="clear-data-btn">Clear All Analytics</button>
      </div>
    `}setupEventListeners(){const e=document.getElementById("level-selector");e&&e.addEventListener("change",()=>{const r=e.value;this.selectedLevelId=r?parseInt(r):null,this.render()});const t=document.getElementById("export-level-csv");t&&t.addEventListener("click",()=>{this.selectedLevelId&&this.exportLevelCSV(this.selectedLevelId)});const s=document.getElementById("export-all-csv");s&&s.addEventListener("click",()=>{this.exportAllCSV()});const i=document.getElementById("refresh-btn");i&&i.addEventListener("click",()=>{this.refresh(),this.showToast("Data refreshed")});const n=document.getElementById("clear-data-btn");n&&n.addEventListener("click",()=>{this.clearData()})}exportLevelCSV(e){const t=this.analytics.exportLevelInsightsAsCSV(e);t?(this.downloadCSV(t,`merge-lab-level-${e}-insights.csv`),this.showToast(`Level ${e} insights exported`)):this.showToast("No data to export")}exportAllCSV(){const e=this.analytics.exportInsightsAsCSV();e?(this.downloadCSV(e,"merge-lab-all-insights.csv"),this.showToast("All insights exported")):this.showToast("No data to export")}downloadCSV(e,t){const s=new Blob([e],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a"),n=URL.createObjectURL(s);i.setAttribute("href",n),i.setAttribute("download",t),i.style.display="none",document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(n)}clearData(){confirm("Are you sure you want to clear all analytics data? This cannot be undone.")&&(this.analytics.clearAllData(),this.selectedLevelId=null,this.render(),this.showToast("Analytics data cleared"))}showToast(e){const t=document.createElement("div");t.className="insights-toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>{document.body.removeChild(t)},2e3)}formatFailReason(e){return{out_of_moves:"Out of Moves",orders_not_completed:"Orders Not Completed"}[e]||e}}class p{static STORAGE_KEY="mergeLab_tutorialSeen";currentStep=0;overlay=null;onComplete=null;steps=[{title:"Place Tiles",description:"Tap any empty cell to place a tile",icon:"1"},{title:"Merge Adjacent",description:"Match adjacent tiles to merge them into higher tiers",icon:"2"},{title:"Complete Orders",description:"Complete all orders before you run out of moves",icon:"3"}];static hasSeenTutorial(){return localStorage.getItem(this.STORAGE_KEY)==="true"}static markAsSeen(){localStorage.setItem(this.STORAGE_KEY,"true")}show(e,t){this.onComplete=t,this.currentStep=0,this.render(e)}render(e){this.overlay?.remove();const t=this.steps[this.currentStep],s=this.currentStep===this.steps.length-1;this.overlay=document.createElement("div"),this.overlay.className="tutorial-overlay",this.overlay.innerHTML=`
      <div class="tutorial-content">
        <div class="tutorial-step-icon">${t.icon}</div>
        <h2 class="tutorial-title">${t.title}</h2>
        <p class="tutorial-desc">${t.description}</p>

        <div class="tutorial-dots">
          ${this.steps.map((i,n)=>`
            <div class="tutorial-dot ${n===this.currentStep?"active":""}"></div>
          `).join("")}
        </div>

        <button class="tutorial-btn">${s?"Start Playing":"Next"}</button>
        ${s?"":'<button class="tutorial-skip">Skip tutorial</button>'}
      </div>
    `,e.appendChild(this.overlay),this.overlay.querySelector(".tutorial-btn")?.addEventListener("click",()=>{s?this.completeTutorial():this.nextStep(e)}),this.overlay.querySelector(".tutorial-skip")?.addEventListener("click",()=>{this.completeTutorial()})}nextStep(e){this.currentStep++,this.render(e)}completeTutorial(){p.markAsSeen(),this.overlay?.remove(),this.overlay=null,this.onComplete&&this.onComplete()}}class O{game=null;editor=null;insightsDashboard=null;currentLevelId=1;isPlaying=!1;constructor(){this.render(),this.setupNavigation(),this.navigateTo("home")}render(){const e=document.querySelector("#app"),t=v.getInstance().isEnabled();e.innerHTML=`
      <header>
        <h1>Merge Lab</h1>
        <button class="sound-toggle" aria-label="Toggle sound">
          <span class="sound-icon">${t?"🔊":"🔇"}</span>
        </button>
      </header>

      <main>
        <div id="home" class="screen">
          <h2>Welcome to Merge Lab</h2>
          <p>A mobile-first casual merge game prototype.</p>
          <p>Navigate using the tabs below to explore different sections.</p>
        </div>

        <div id="play" class="screen">
          <div id="game-container"></div>
        </div>

        <div id="editor" class="screen">
          <div id="editor-container"></div>
        </div>

        <div id="insights" class="screen">
          <!-- Content populated by InsightsDashboard -->
        </div>
      </main>

      <footer>
        <button class="nav-btn" data-screen="home">Home</button>
        <button class="nav-btn" data-screen="play">Play</button>
        <button class="nav-btn" data-screen="editor">Editor</button>
        <button class="nav-btn" data-screen="insights">Insights</button>
      </footer>
    `}setupNavigation(){document.querySelectorAll(".nav-btn").forEach(s=>{s.addEventListener("click",()=>{const i=s.dataset.screen;this.navigateTo(i)})});const t=document.querySelector(".sound-toggle");t?.addEventListener("click",()=>{const s=v.getInstance().toggle(),i=t.querySelector(".sound-icon");i&&(i.textContent=s?"🔊":"🔇")})}navigateTo(e){document.querySelectorAll(".screen").forEach(i=>i.classList.remove("active")),document.getElementById(e)?.classList.add("active"),document.querySelectorAll(".nav-btn").forEach(i=>{i.dataset.screen===e?i.classList.add("active"):i.classList.remove("active")}),e==="play"?this.initPlayScreen():e==="editor"?this.initEditor():e==="insights"&&this.initInsights()}initPlayScreen(){if(this.game||(this.game=new S("game-container")),!this.isPlaying)if(p.hasSeenTutorial())this.showLevelSelect();else{const e=document.getElementById("game-container");e&&new p().show(e,()=>this.showLevelSelect())}}showLevelSelect(){const e=document.getElementById("game-container");e&&(e.innerHTML=`
      <div class="level-select-screen">
        <h2>Select Level</h2>
        <div class="level-grid">
          ${g.map(t=>`
            <button class="level-btn ${b(t.id)?"completed":""}" data-level="${t.id}">
              <span class="level-number">${t.id}</span>
              ${b(t.id)?'<span class="completion-check">✓</span>':""}
            </button>
          `).join("")}
        </div>
      </div>
    `,e.querySelectorAll(".level-btn").forEach(t=>{t.addEventListener("click",()=>{const s=parseInt(t.dataset.level||"1");this.startLevel(s)})}))}startLevel(e,t){this.currentLevelId=e,this.isPlaying=!0,this.game||(this.game=new S("game-container"));const s=t||f(e);this.game.loadLevel(s,()=>this.onLevelComplete(),()=>this.exitLevel())}onLevelComplete(){this.currentLevelId<30?this.startLevel(this.currentLevelId+1):(this.isPlaying=!1,this.showLevelSelect())}initEditor(){this.editor||(this.editor=new x("editor-container",e=>{this.playLevelFromEditor(e)}))}initInsights(){this.insightsDashboard?this.insightsDashboard.refresh():this.insightsDashboard=new A("insights")}playLevelFromEditor(e){this.navigateTo("play"),this.startLevel(e.id,e)}exitLevel(){this.isPlaying=!1,this.showLevelSelect()}}new O;
