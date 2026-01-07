(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))s(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const n of r.addedNodes)n.tagName==="LINK"&&n.rel==="modulepreload"&&s(n)}).observe(document,{childList:!0,subtree:!0});function t(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function s(i){if(i.ep)return;i.ep=!0;const r=t(i);fetch(i.href,r)}})();class c{static instance;storageKey="mergeLab_analytics";MAX_EVENTS=1e3;currentSession={levelId:null,startTime:null};constructor(){this.loadCurrentSession()}static getInstance(){return c.instance||(c.instance=new c),c.instance}logLevelStart(e){const t=Date.now();this.currentSession={levelId:e,startTime:t},this.saveCurrentSession(),this.saveEvent({eventType:"level_start",levelId:e,timestamp:t,metadata:{}})}logMoveUsed(e,t){this.saveEvent({eventType:"move_used",levelId:e,timestamp:Date.now(),metadata:{moveIndex:t}})}logMerge(e,t,s){this.saveEvent({eventType:"merge",levelId:e,timestamp:Date.now(),metadata:{fromTier:t,toTier:s}})}logOrderProgress(e,t,s){this.saveEvent({eventType:"order_progress",levelId:e,timestamp:Date.now(),metadata:{tier:t,remaining:s}})}logLevelEnd(e,t,s,i,r){const n={result:t,durationSec:i,movesUsed:s};r&&(n.failReason=r),this.saveEvent({eventType:"level_end",levelId:e,timestamp:Date.now(),metadata:n}),this.currentSession={levelId:null,startTime:null},this.saveCurrentSession()}getEvents(){return this.loadData().events}getEventsByLevel(e){return this.getEvents().filter(t=>t.levelId===e)}getInsightsForLevel(e){const s=this.getEventsByLevel(e).filter(a=>a.eventType==="level_end");if(s.length===0)return null;const i=s.filter(a=>a.metadata.result==="win").length,r=s.filter(a=>a.metadata.result==="fail").length,n=i+r,o=s.reduce((a,h)=>a+h.metadata.durationSec,0),d=s.reduce((a,h)=>a+h.metadata.movesUsed,0),v={};return s.filter(a=>a.metadata.result==="fail"&&a.metadata.failReason).forEach(a=>{const h=a.metadata.failReason;v[h]=(v[h]||0)+1}),{levelId:e,attempts:n,wins:i,fails:r,winRate:n>0?i/n*100:0,avgDuration:n>0?o/n:0,avgMovesUsed:n>0?d/n:0,failReasons:v}}getAllInsights(){const e=new Set(this.getEvents().map(s=>s.levelId)),t=[];for(const s of e){const i=this.getInsightsForLevel(s);i&&t.push(i)}return t.sort((s,i)=>s.levelId-i.levelId)}exportEventsAsCSV(){const e=this.getEvents(),t=["Timestamp","Level ID","Event Type","Metadata"],s=e.map(r=>[new Date(r.timestamp).toISOString(),r.levelId.toString(),r.eventType,JSON.stringify(r.metadata)]);return[t.join(","),...s.map(r=>r.map(n=>`"${n.replace(/"/g,'""')}"`).join(","))].join(`
`)}exportInsightsAsCSV(){const e=this.getAllInsights(),t=["Level ID","Attempts","Wins","Fails","Win Rate","Avg Duration","Avg Moves Used","Fail Reasons"],s=e.map(r=>[r.levelId.toString(),r.attempts.toString(),r.wins.toString(),r.fails.toString(),`${r.winRate.toFixed(2)}%`,r.avgDuration.toFixed(1),r.avgMovesUsed.toFixed(1),JSON.stringify(r.failReasons)]);return[t.join(","),...s.map(r=>r.map(n=>`"${n.replace(/"/g,'""')}"`).join(","))].join(`
`)}exportLevelInsightsAsCSV(e){const t=this.getInsightsForLevel(e);if(!t)return"";const s=["Level ID","Attempts","Wins","Fails","Win Rate","Avg Duration","Avg Moves Used","Fail Reasons"],i=[t.levelId.toString(),t.attempts.toString(),t.wins.toString(),t.fails.toString(),`${t.winRate.toFixed(2)}%`,t.avgDuration.toFixed(1),t.avgMovesUsed.toFixed(1),JSON.stringify(t.failReasons)];return[s.join(","),i.map(n=>`"${n.replace(/"/g,'""')}"`).join(",")].join(`
`)}clearAllData(){localStorage.removeItem(this.storageKey),this.currentSession={levelId:null,startTime:null}}getCurrentStartTime(){return this.currentSession.startTime||Date.now()}saveEvent(e){const t=this.loadData();t.events.push(e),this.trimEvents(t),this.saveData(t)}trimEvents(e){e.events.length>this.MAX_EVENTS&&(e.events=e.events.slice(-this.MAX_EVENTS))}loadData(){try{const e=localStorage.getItem(this.storageKey);if(e)return JSON.parse(e)}catch(e){console.error("Failed to load analytics data:",e)}return{events:[],currentSession:{levelId:null,startTime:null}}}saveData(e){try{localStorage.setItem(this.storageKey,JSON.stringify(e))}catch(t){console.error("Failed to save analytics data:",t)}}loadCurrentSession(){const e=this.loadData();this.currentSession=e.currentSession}saveCurrentSession(){const e=this.loadData();e.currentSession=this.currentSession,this.saveData(e)}}const m=6,f={1:"#00fff5",2:"#ff00ff",3:"#ffff00",4:"#00ff00",5:"#ff8800",6:"#ffd700"};class L{grid;containerEl;movesEl=null;ordersEl=null;level=null;movesRemaining=0;orderProgress=new Map;isGameOver=!1;onComplete=null;analytics;levelStartTime=0;constructor(e){const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} not found`);this.containerEl=t,this.grid=this.createEmptyGrid(),this.analytics=c.getInstance()}createEmptyGrid(){return Array.from({length:m},()=>Array.from({length:m},()=>null))}getTierColor(e){return f[Math.min(e,6)]||f[6]}loadLevel(e,t){this.level=e,this.movesRemaining=e.moveLimit,this.orderProgress=new Map,this.isGameOver=!1,this.onComplete=t||null,this.grid=this.createEmptyGrid();for(const s of e.orders)this.orderProgress.set(s.tier,0);this.levelStartTime=Date.now(),this.analytics.logLevelStart(e.id),this.render()}render(){if(!this.level){this.containerEl.innerHTML="<p>No level loaded</p>";return}this.containerEl.innerHTML=`
      <div class="game-header">
        <span class="level-info">Level ${this.level.id}</span>
        <span class="moves-counter">Moves: ${this.movesRemaining}</span>
        <button class="reset-btn">Restart</button>
      </div>
      <div class="orders-panel"></div>
      <div class="game-grid-wrapper">
        <div class="game-grid"></div>
      </div>
    `,this.movesEl=this.containerEl.querySelector(".moves-counter"),this.ordersEl=this.containerEl.querySelector(".orders-panel");const e=this.containerEl.querySelector(".game-grid");this.containerEl.querySelector(".reset-btn").addEventListener("click",()=>this.restart()),this.renderOrders();for(let s=0;s<m;s++)for(let i=0;i<m;i++){const r=this.grid[s][i],n=document.createElement("div");n.className="cell",n.dataset.row=String(s),n.dataset.col=String(i),r&&(n.textContent=String(r.tier),n.style.color=this.getTierColor(r.tier),n.style.textShadow=`0 0 10px ${this.getTierColor(r.tier)}`),n.addEventListener("click",()=>this.handleCellClick(s,i)),e.appendChild(n)}}renderOrders(){!this.ordersEl||!this.level||(this.ordersEl.innerHTML=this.level.orders.map(e=>{const t=this.orderProgress.get(e.tier)||0;return`
        <div class="order-item ${t>=e.qty?"complete":""}">
          <span class="order-tier" style="color: ${this.getTierColor(e.tier)}; text-shadow: 0 0 8px ${this.getTierColor(e.tier)}">${e.tier}</span>
          <span class="order-progress">${Math.min(t,e.qty)}/${e.qty}</span>
        </div>
      `}).join(""))}updateMovesDisplay(){this.movesEl&&(this.movesEl.textContent=`Moves: ${this.movesRemaining}`)}handleCellClick(e,t){if(!this.isGameOver&&this.grid[e][t]===null&&!(this.movesRemaining<=0)){if(this.grid[e][t]={tier:1},this.movesRemaining--,this.updateMovesDisplay(),this.level){const s=this.level.moveLimit-this.movesRemaining;this.analytics.logMoveUsed(this.level.id,s)}this.checkAndMerge(e,t)}}checkAndMerge(e,t){const s=this.grid[e][t];if(!s)return;const i=[[-1,0],[1,0],[0,-1],[0,1]];for(const[r,n]of i){const o=e+r,d=t+n;if(o<0||o>=m||d<0||d>=m)continue;const v=this.grid[o][d];if(v&&v.tier===s.tier){const a=s.tier+1;this.grid[o][d]=null,this.grid[e][t]={tier:a},this.level&&this.analytics.logMerge(this.level.id,s.tier,a),this.trackOrder(a),this.renderCell(e,t,!0),this.renderCell(o,d,!1),setTimeout(()=>{this.checkWin()?this.showWinScreen():this.checkAndMerge(e,t)},150);return}}this.renderCell(e,t,!1),setTimeout(()=>{!this.isGameOver&&this.checkLose()&&this.showLoseScreen()},50)}trackOrder(e){if(!this.level)return;const t=this.level.orders.find(s=>s.tier===e);if(t){const s=this.orderProgress.get(e)||0;this.orderProgress.set(e,s+1);const i=t.qty-(s+1);this.analytics.logOrderProgress(this.level.id,e,i),this.renderOrders()}}checkWin(){if(!this.level)return!1;for(const e of this.level.orders)if((this.orderProgress.get(e.tier)||0)<e.qty)return!1;return!0}checkLose(){return!this.level||this.checkWin()?!1:this.movesRemaining<=0}showWinScreen(){if(this.level){const s=this.level.moveLimit-this.movesRemaining,i=Math.round((Date.now()-this.levelStartTime)/1e3);this.analytics.logLevelEnd(this.level.id,"win",s,i)}this.isGameOver=!0;const e=document.createElement("div");e.className="game-overlay win",e.innerHTML=`
      <div class="overlay-content">
        <h2 class="overlay-title">Level Complete!</h2>
        <p class="overlay-subtitle">You completed all orders</p>
        <button class="overlay-btn primary">Next Level</button>
        <button class="overlay-btn">Replay</button>
      </div>
    `;const t=this.containerEl.querySelector(".game-grid-wrapper");t&&t.appendChild(e),e.querySelector(".overlay-btn.primary")?.addEventListener("click",()=>{this.onComplete&&this.onComplete()}),e.querySelector(".overlay-btn:not(.primary)")?.addEventListener("click",()=>{this.restart()})}showLoseScreen(){if(this.level){const s=this.level.moveLimit-this.movesRemaining,i=Math.round((Date.now()-this.levelStartTime)/1e3),n=Array.from(this.orderProgress.values()).some(o=>o>0)?"orders_not_completed":"out_of_moves";this.analytics.logLevelEnd(this.level.id,"fail",s,i,n)}this.isGameOver=!0;const e=document.createElement("div");e.className="game-overlay lose",e.innerHTML=`
      <div class="overlay-content">
        <h2 class="overlay-title">Out of Moves!</h2>
        <p class="overlay-subtitle">Try again</p>
        <button class="overlay-btn primary">Retry</button>
      </div>
    `;const t=this.containerEl.querySelector(".game-grid-wrapper");t&&t.appendChild(e),e.querySelector(".overlay-btn")?.addEventListener("click",()=>{this.restart()})}restart(){this.level&&this.loadLevel(this.level,this.onComplete||void 0)}renderCell(e,t,s){const i=this.containerEl.querySelector(`.cell[data-row="${e}"][data-col="${t}"]`);if(!i)return;const r=this.grid[e][t];r?(i.textContent=String(r.tier),i.style.color=this.getTierColor(r.tier),i.style.textShadow=`0 0 10px ${this.getTierColor(r.tier)}`,s&&(i.classList.remove("merging"),i.offsetWidth,i.classList.add("merging"))):(i.textContent="",i.style.color="",i.style.textShadow="",i.classList.remove("merging"))}}const u=[{id:1,moveLimit:10,orders:[{tier:2,qty:3}]},{id:2,moveLimit:12,orders:[{tier:2,qty:4}]},{id:3,moveLimit:10,orders:[{tier:2,qty:2},{tier:3,qty:1}]},{id:4,moveLimit:14,orders:[{tier:2,qty:3},{tier:3,qty:1}]},{id:5,moveLimit:12,orders:[{tier:3,qty:2}]},{id:6,moveLimit:15,orders:[{tier:2,qty:4},{tier:3,qty:1}]},{id:7,moveLimit:14,orders:[{tier:3,qty:2},{tier:2,qty:2}]},{id:8,moveLimit:16,orders:[{tier:3,qty:3}]},{id:9,moveLimit:15,orders:[{tier:2,qty:3},{tier:3,qty:2}]},{id:10,moveLimit:18,orders:[{tier:3,qty:3},{tier:2,qty:2}]},{id:11,moveLimit:16,orders:[{tier:3,qty:2},{tier:4,qty:1}]},{id:12,moveLimit:18,orders:[{tier:4,qty:2}]},{id:13,moveLimit:17,orders:[{tier:3,qty:3},{tier:4,qty:1}]},{id:14,moveLimit:20,orders:[{tier:3,qty:2},{tier:4,qty:2}]},{id:15,moveLimit:18,orders:[{tier:4,qty:2},{tier:3,qty:2}]},{id:16,moveLimit:20,orders:[{tier:3,qty:3},{tier:4,qty:2}]},{id:17,moveLimit:22,orders:[{tier:4,qty:3}]},{id:18,moveLimit:20,orders:[{tier:3,qty:2},{tier:4,qty:2},{tier:2,qty:3}]},{id:19,moveLimit:22,orders:[{tier:4,qty:3},{tier:3,qty:2}]},{id:20,moveLimit:24,orders:[{tier:4,qty:4}]},{id:21,moveLimit:22,orders:[{tier:4,qty:2},{tier:5,qty:1}]},{id:22,moveLimit:24,orders:[{tier:5,qty:2}]},{id:23,moveLimit:22,orders:[{tier:4,qty:3},{tier:5,qty:1}]},{id:24,moveLimit:25,orders:[{tier:4,qty:2},{tier:5,qty:2}]},{id:25,moveLimit:24,orders:[{tier:5,qty:2},{tier:4,qty:3}]},{id:26,moveLimit:26,orders:[{tier:4,qty:3},{tier:5,qty:2},{tier:3,qty:2}]},{id:27,moveLimit:28,orders:[{tier:5,qty:3}]},{id:28,moveLimit:26,orders:[{tier:4,qty:2},{tier:5,qty:2},{tier:3,qty:3}]},{id:29,moveLimit:28,orders:[{tier:5,qty:3},{tier:4,qty:3}]},{id:30,moveLimit:30,orders:[{tier:5,qty:4},{tier:4,qty:2}]}],y="mergeLab_levelOverrides";function p(){try{const l=localStorage.getItem(y);return l?JSON.parse(l):{}}catch{return{}}}function b(l){const e=p();e[l.id]=l,localStorage.setItem(y,JSON.stringify(e))}function E(l){const e=p();delete e[l],localStorage.setItem(y,JSON.stringify(e))}function g(l){const e=p();if(e[l])return e[l];const t=u.find(s=>s.id===l);if(!t)throw new Error(`Level ${l} not found`);return t}function S(l){const e=u.find(t=>t.id===l);if(!e)throw new Error(`Level ${l} not found`);return{...e,orders:e.orders.map(t=>({...t}))}}class q{containerEl;selectedLevelId=1;editedLevel;onPlayLevel=null;constructor(e,t){const s=document.getElementById(e);if(!s)throw new Error(`Container ${e} not found`);this.containerEl=s,this.onPlayLevel=t||null,this.editedLevel=this.cloneLevel(g(1)),this.render()}cloneLevel(e){return{id:e.id,moveLimit:e.moveLimit,orders:e.orders.map(t=>({...t}))}}render(){const e=p(),t=!!e[this.selectedLevelId];this.containerEl.innerHTML=`
      <div class="editor-container">
        <h2 class="editor-title">Level Editor</h2>

        <div class="editor-section">
          <label class="editor-label">Select Level</label>
          <select class="editor-select level-select">
            ${u.map(s=>`
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
    `,this.setupEventListeners()}setupEventListeners(){const e=this.containerEl.querySelector(".level-select");e?.addEventListener("change",()=>{this.selectedLevelId=parseInt(e.value),this.editedLevel=this.cloneLevel(g(this.selectedLevelId)),this.render()});const t=this.containerEl.querySelector(".move-limit-input");t?.addEventListener("input",()=>{this.editedLevel.moveLimit=parseInt(t.value)||1}),this.containerEl.querySelectorAll(".order-row").forEach((s,i)=>{const r=s.querySelector(".order-tier"),n=s.querySelector(".order-qty"),o=s.querySelector(".remove-order-btn");r?.addEventListener("input",()=>{this.editedLevel.orders[i].tier=parseInt(r.value)||2}),n?.addEventListener("input",()=>{this.editedLevel.orders[i].qty=parseInt(n.value)||1}),o?.addEventListener("click",()=>{this.editedLevel.orders.splice(i,1),this.render()})}),this.containerEl.querySelector(".add-order-btn")?.addEventListener("click",()=>{this.editedLevel.orders.push({tier:2,qty:1}),this.render()}),this.containerEl.querySelector(".save-btn")?.addEventListener("click",()=>{b(this.editedLevel),this.render(),this.showToast("Level saved!")}),this.containerEl.querySelector(".reset-btn")?.addEventListener("click",()=>{E(this.selectedLevelId),this.editedLevel=this.cloneLevel(S(this.selectedLevelId)),this.render(),this.showToast("Reset to default")}),this.containerEl.querySelector(".play-btn")?.addEventListener("click",()=>{this.onPlayLevel&&this.onPlayLevel(this.cloneLevel(this.editedLevel))})}showToast(e){const t=this.containerEl.querySelector(".editor-toast");t&&t.remove();const s=document.createElement("div");s.className="editor-toast",s.textContent=e,this.containerEl.appendChild(s),setTimeout(()=>s.remove(),2e3)}}class w{containerEl;analytics;selectedLevelId=null;constructor(e){const t=document.getElementById(e);if(!t)throw new Error(`Container ${e} not found`);this.containerEl=t,this.analytics=c.getInstance(),this.render()}refresh(){this.render()}render(){const e=this.analytics.getAllInsights();if(e.length===0){this.containerEl.innerHTML=this.renderEmptyState();return}this.containerEl.innerHTML=`
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
    `}renderOverview(e){const t=e.reduce((o,d)=>o+d.attempts,0),s=e.reduce((o,d)=>o+d.wins,0),i=t>0?s/t*100:0,r=e.reduce((o,d)=>d.attempts>o.attempts?d:o,e[0]),n=e.reduce((o,d)=>d.winRate<o.winRate?d:o,e[0]);return`
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
          <span class="stat-value">Level ${r.levelId} (${r.attempts} attempts)</span>
        </div>
        <div class="insights-stat">
          <span class="stat-label">Hardest Level</span>
          <span class="stat-value">Level ${n.levelId} (${n.winRate.toFixed(1)}% win rate)</span>
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
    `}renderLevelDetails(e){const t=this.analytics.getInsightsForLevel(e);if(!t)return"";const s=Object.keys(t.failReasons).length>0?Object.entries(t.failReasons).map(([i,r])=>`
          <div class="fail-reason-item">
            <span class="fail-reason-label">${this.formatFailReason(i)}</span>
            <span class="fail-reason-count">${r} time${r>1?"s":""}</span>
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
    `}setupEventListeners(){const e=document.getElementById("level-selector");e&&e.addEventListener("change",()=>{const n=e.value;this.selectedLevelId=n?parseInt(n):null,this.render()});const t=document.getElementById("export-level-csv");t&&t.addEventListener("click",()=>{this.selectedLevelId&&this.exportLevelCSV(this.selectedLevelId)});const s=document.getElementById("export-all-csv");s&&s.addEventListener("click",()=>{this.exportAllCSV()});const i=document.getElementById("refresh-btn");i&&i.addEventListener("click",()=>{this.refresh(),this.showToast("Data refreshed")});const r=document.getElementById("clear-data-btn");r&&r.addEventListener("click",()=>{this.clearData()})}exportLevelCSV(e){const t=this.analytics.exportLevelInsightsAsCSV(e);t?(this.downloadCSV(t,`merge-lab-level-${e}-insights.csv`),this.showToast(`Level ${e} insights exported`)):this.showToast("No data to export")}exportAllCSV(){const e=this.analytics.exportInsightsAsCSV();e?(this.downloadCSV(e,"merge-lab-all-insights.csv"),this.showToast("All insights exported")):this.showToast("No data to export")}downloadCSV(e,t){const s=new Blob([e],{type:"text/csv;charset=utf-8;"}),i=document.createElement("a"),r=URL.createObjectURL(s);i.setAttribute("href",r),i.setAttribute("download",t),i.style.display="none",document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(r)}clearData(){confirm("Are you sure you want to clear all analytics data? This cannot be undone.")&&(this.analytics.clearAllData(),this.selectedLevelId=null,this.render(),this.showToast("Analytics data cleared"))}showToast(e){const t=document.createElement("div");t.className="insights-toast",t.textContent=e,document.body.appendChild(t),setTimeout(()=>{document.body.removeChild(t)},2e3)}formatFailReason(e){return{out_of_moves:"Out of Moves",orders_not_completed:"Orders Not Completed"}[e]||e}}class I{game=null;editor=null;insightsDashboard=null;currentLevelId=1;isPlaying=!1;constructor(){this.render(),this.setupNavigation(),this.navigateTo("home")}render(){const e=document.querySelector("#app");e.innerHTML=`
      <header>
        <h1>Merge Lab</h1>
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
    `}setupNavigation(){document.querySelectorAll(".nav-btn").forEach(t=>{t.addEventListener("click",()=>{const s=t.dataset.screen;this.navigateTo(s)})})}navigateTo(e){document.querySelectorAll(".screen").forEach(i=>i.classList.remove("active")),document.getElementById(e)?.classList.add("active"),document.querySelectorAll(".nav-btn").forEach(i=>{i.dataset.screen===e?i.classList.add("active"):i.classList.remove("active")}),e==="play"?this.initPlayScreen():e==="editor"?this.initEditor():e==="insights"&&this.initInsights()}initPlayScreen(){this.game||(this.game=new L("game-container")),this.isPlaying||this.showLevelSelect()}showLevelSelect(){const e=document.getElementById("game-container");e&&(e.innerHTML=`
      <div class="level-select-screen">
        <h2>Select Level</h2>
        <div class="level-grid">
          ${u.map(t=>`
            <button class="level-btn" data-level="${t.id}">
              ${t.id}
            </button>
          `).join("")}
        </div>
      </div>
    `,e.querySelectorAll(".level-btn").forEach(t=>{t.addEventListener("click",()=>{const s=parseInt(t.dataset.level||"1");this.startLevel(s)})}))}startLevel(e,t){this.currentLevelId=e,this.isPlaying=!0,this.game||(this.game=new L("game-container"));const s=t||g(e);this.game.loadLevel(s,()=>this.onLevelComplete())}onLevelComplete(){this.currentLevelId<30?this.startLevel(this.currentLevelId+1):(this.isPlaying=!1,this.showLevelSelect())}initEditor(){this.editor||(this.editor=new q("editor-container",e=>{this.playLevelFromEditor(e)}))}initInsights(){this.insightsDashboard?this.insightsDashboard.refresh():this.insightsDashboard=new w("insights")}playLevelFromEditor(e){this.navigateTo("play"),this.startLevel(e.id,e)}}new I;
