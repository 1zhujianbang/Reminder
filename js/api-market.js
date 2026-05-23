// ============================================================
// Market Data API (OKX, Binance, Hyperliquid)
// ============================================================
import { state, setLastDirection, setLastPrice, candleLimit } from './state.js';

// --- Callbacks (set by main.js) ---
export let onRealtimeUpdate = null;
export function setOnRealtimeUpdate(fn) { onRealtimeUpdate = fn; }

export let onTitleUpdate = null;
export function setOnTitleUpdate(fn) { onTitleUpdate = fn; }

// ============================================================
// Exchange definitions
// ============================================================

var EXCHANGES = [];

EXCHANGES.push({
    id: 'okx', label: 'OKX', maxLimit: 2000,
    instMap: {
        'BTC-PERP': 'BTC-USDT-SWAP', 'ETH-PERP': 'ETH-USDT-SWAP', 'SOL-PERP': 'SOL-USDT-SWAP',
        'BNB-PERP': 'BNB-USDT-SWAP', 'HYPE-PERP': 'HYPE-USDT-SWAP', 'OKB-PERP': 'OKB-USDT-SWAP',
        'ZEC-PERP': 'ZEC-USDT-SWAP', 'ASTER-PERP': 'ASTER-USDT-SWAP', 'PUMP-PERP': 'PUMP-USDT-SWAP',
        'XAU-PERP': 'XAU-USDT-SWAP', 'XAG-PERP': 'XAG-USDT-SWAP', 'XPT-PERP': 'XPT-USDT-SWAP',
        'XPD-PERP': 'XPD-USDT-SWAP', 'XCU-PERP': 'XCU-USDT-SWAP', 'CL-PERP': 'CL-USDT-SWAP',
        'BZ-PERP': 'BZ-USDT-SWAP', 'NG-PERP': 'NG-USDT-SWAP',
        'SPX-PERP': 'SPX-USDT-SWAP', 'NDX-PERP': 'QQQ-USDT-SWAP',
        'AAPL-PERP': 'AAPL-USDT-SWAP', 'AMD-PERP': 'AMD-USDT-SWAP', 'AMZN-PERP': 'AMZN-USDT-SWAP',
        'ANTHROPIC-PERP': 'ANTHROPIC-USDT-SWAP', 'ARM-PERP': 'ARM-USDT-SWAP', 'AVGO-PERP': 'AVGO-USDT-SWAP',
        'BMNR-PERP': 'BMNR-USDT-SWAP', 'CBRS-PERP': 'CBRS-USDT-SWAP', 'COHR-PERP': 'COHR-USDT-SWAP',
        'COIN-PERP': 'COIN-USDT-SWAP', 'COST-PERP': 'COST-USDT-SWAP', 'CRCL-PERP': 'CRCL-USDT-SWAP',
        'CRWV-PERP': 'CRWV-USDT-SWAP', 'CSCO-PERP': 'CSCO-USDT-SWAP', 'DRAM-PERP': 'DRAM-USDT-SWAP',
        'EWJ-PERP': 'EWJ-USDT-SWAP', 'EWY-PERP': 'EWY-USDT-SWAP', 'GEV-PERP': 'GEV-USDT-SWAP',
        'GLW-PERP': 'GLW-USDT-SWAP', 'GME-PERP': 'GME-USDT-SWAP', 'GOOGL-PERP': 'GOOGL-USDT-SWAP',
        'HIMS-PERP': 'HIMS-USDT-SWAP', 'HOOD-PERP': 'HOOD-USDT-SWAP', 'INTC-PERP': 'INTC-USDT-SWAP',
        'IWM-PERP': 'IWM-USDT-SWAP', 'LITE-PERP': 'LITE-USDT-SWAP', 'LLY-PERP': 'LLY-USDT-SWAP',
        'META-PERP': 'META-USDT-SWAP', 'MRVL-PERP': 'MRVL-USDT-SWAP', 'MSFT-PERP': 'MSFT-USDT-SWAP',
        'MSTR-PERP': 'MSTR-USDT-SWAP', 'MU-PERP': 'MU-USDT-SWAP', 'NBIS-PERP': 'NBIS-USDT-SWAP',
        'NFLX-PERP': 'NFLX-USDT-SWAP', 'NVDA-PERP': 'NVDA-USDT-SWAP', 'OPENAI-PERP': 'OPENAI-USDT-SWAP',
        'ORCL-PERP': 'ORCL-USDT-SWAP', 'PLTR-PERP': 'PLTR-USDT-SWAP', 'QCOM-PERP': 'QCOM-USDT-SWAP',
        'QQQ-PERP': 'QQQ-USDT-SWAP', 'RKLB-PERP': 'RKLB-USDT-SWAP', 'SHLD-PERP': 'SHLD-USDT-SWAP',
        'SNDK-PERP': 'SNDK-USDT-SWAP', 'SOXL-PERP': 'SOXL-USDT-SWAP', 'SPACEX-PERP': 'SPACEX-USDT-SWAP',
        'SPY-PERP': 'SPY-USDT-SWAP', 'TSLA-PERP': 'TSLA-USDT-SWAP', 'TSM-PERP': 'TSM-USDT-SWAP',
        'URNM-PERP': 'URNM-USDT-SWAP', 'USAR-PERP': 'USAR-USDT-SWAP',
    },
    tfMap: { 1: '1m', 5: '5m', 15: '15m', 60: '1H', 240: '4H', 1440: '1D' },
    fetchData: async function (instId, interval, limit) {
        var allData = [];
        var maxPer = 300;
        var after = null;
        while (allData.length < limit) {
            var fl = Math.min(maxPer, limit - allData.length);
            var url = 'https://www.okx.com/api/v5/market/candles?instId=' + encodeURIComponent(instId) + '&bar=' + interval + '&limit=' + fl;
            if (after) url += '&after=' + after;
            var r = await fetch(url);
            if (!r.ok) throw new Error('HTTP ' + r.status);
            var j = await r.json();
            if (j.code !== '0') throw new Error(j.msg || 'API error');
            if (!j.data || j.data.length === 0) break;
            allData = allData.concat(j.data);
            if (j.data.length < fl) break;
            after = j.data[j.data.length - 1][0];
            await new Promise(x => setTimeout(x, 80));
        }
        return allData.map(c => ({
            time: Math.floor(Number(c[0]) / 1000), open: parseFloat(c[1]), high: parseFloat(c[2]),
            low: parseFloat(c[3]), close: parseFloat(c[4]), volume: parseFloat(c[5]),
        })).reverse().filter(d => d.time > 0 && isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close));
    },
});

EXCHANGES.push({
    id: 'binance', label: 'Binance', maxLimit: 1500,
    instMap: { 'BTC-PERP': 'BTCUSDT', 'ETH-PERP': 'ETHUSDT', 'SOL-PERP': 'SOLUSDT', 'BNB-PERP': 'BNBUSDT', 'HYPE-PERP': 'HYPEUSDT', 'ZEC-PERP': 'ZECUSDT', 'XAU-PERP': 'PAXGUSDT' },
    tfMap: { 1: '1m', 5: '5m', 15: '15m', 60: '1h', 240: '4h', 1440: '1d' },
    fetchData: async function (instId, interval, limit) {
        var r = await fetch('https://fapi.binance.com/fapi/v1/klines?symbol=' + encodeURIComponent(instId) + '&interval=' + interval + '&limit=' + limit);
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var d = await r.json();
        return d.map(k => ({ time: Math.floor(k[0] / 1000), open: parseFloat(k[1]), high: parseFloat(k[2]), low: parseFloat(k[3]), close: parseFloat(k[4]), volume: parseFloat(k[5]) }))
            .filter(d => d.time > 0 && isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close));
    },
});

EXCHANGES.push({
    id: 'hyperliquid', label: 'Hyperliquid', maxLimit: 2000,
    instMap: { 'BTC-PERP': 'BTC', 'ETH-PERP': 'ETH', 'SOL-PERP': 'SOL', 'BNB-PERP': 'BNB', 'HYPE-PERP': 'HYPE', 'ZEC-PERP': 'ZEC' },
    tfMap: { 1: '1m', 5: '5m', 15: '15m', 60: '1h', 240: '4h', 1440: '1d' },
    fetchData: async function (coin, interval, limit) {
        var now = Date.now();
        var msMap = { '1m': 60000, '5m': 300000, '15m': 900000, '1h': 3600000, '4h': 14400000, '1d': 86400000 };
        var startTime = now - (limit + 5) * (msMap[interval] || 3600000);
        var r = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'candleSnapshot', req: { coin, interval, startTime, endTime: now } }),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var d = await r.json();
        if (Array.isArray(d)) {
            return d.map(c => ({ time: Math.floor((c.t || c.time || 0) / 1000), open: parseFloat(c.o || c.open || 0), high: parseFloat(c.h || c.high || 0), low: parseFloat(c.l || c.low || 0), close: parseFloat(c.c || c.close || 0), volume: parseFloat(c.v || c.volume || 0) }))
                .reverse().filter(d => d.time > 0 && isFinite(d.open) && isFinite(d.high) && isFinite(d.low) && isFinite(d.close));
        }
        throw new Error('unexpected response');
    },
});

export { EXCHANGES };

// ============================================================
// Data fetching
// ============================================================

var fetchGen = 0;

export async function fetchOHLCV(symbol, tfMin, limit) {
    var errors = [];
    for (var i = 0; i < EXCHANGES.length; i++) {
        var ex = EXCHANGES[i];
        var instId = ex.instMap[symbol];
        if (!instId) { errors.push(ex.id + ': no mapping'); continue; }
        var interval = ex.tfMap[tfMin];
        if (!interval) { errors.push(ex.id + ': no tf'); continue; }
        try {
            var l = Math.min(limit || candleLimit || 300, ex.maxLimit || 500);
            var data = await ex.fetchData(instId, interval, l);
            if (data && data.length > 10) {
                state.activeExchange = ex.label;
                return data;
            }
            errors.push(ex.id + ': short data (' + (data ? data.length : 0) + ')');
        } catch (err) { errors.push(ex.id + ': ' + (err.message || err)); }
    }
    throw new Error(errors.join(' | '));
}

export function isStale(gen) { return gen !== fetchGen; }
export function bumpGen() { return ++fetchGen; }
export function getGen() { return fetchGen; }

// ============================================================
// Real-time (WebSocket + fallback polling)
// ============================================================

var ws = null;
var wsReconnectTimer = null;
var WS_RECONNECT_DELAY = 3000;
var realtimeSource = null;
export function getRealtimeSource() { return realtimeSource; }

// --- Shared candle update ---

function updateCandleFromRealtime(candle) {
    var gen = fetchGen;
    var data = state.data;
    var last = data[data.length - 1];
    var ts = candle.time;
    var updated = false;
    if (last && last.time === ts) {
        last.open = candle.open; last.high = candle.high; last.low = candle.low;
        last.close = candle.close; last.volume = candle.volume;
        updated = true;
    } else if (ts > (last ? last.time : 0)) {
        data.push(candle);
        updated = true;
    }
    if (!updated || gen !== fetchGen) return;
    if (onRealtimeUpdate) onRealtimeUpdate(data, last, candle);
    var tip = data[data.length - 1];
    var dir = tip.close > tip.open ? '↑' : tip.close < tip.open ? '↓' : '→';
    setLastDirection(dir);
    setLastPrice(formatPrice(tip.close));
    if (onTitleUpdate) onTitleUpdate();
}

function formatPrice(val) {
    if (val === undefined || val === null) return '--';
    return val >= 100 ? val.toFixed(1) : val.toPrecision(4);
}

export function formatPriceStatic(val) {
    return formatPrice(val);
}

// --- OKX WebSocket ---

function wsChannelFor(symbol, tfMin) {
    var ex = EXCHANGES[0];
    var instId = ex.instMap[symbol];
    if (!instId) return null;
    var interval = ex.tfMap[tfMin];
    if (!interval) return null;
    return [instId, 'candle' + interval];
}

function connectOKXWS() {
    if (ws) return;
    var ch = wsChannelFor(state.symbol, state.timeframe);
    if (!ch) return;
    var instId = ch[0], channel = ch[1];
    var wsUrl = 'wss://ws.okx.com:8443/ws/v5/public';
    try { ws = new WebSocket(wsUrl); } catch (e) { return; }
    var connTimer = setTimeout(function () {
        if (ws && ws.readyState <= 1) {
            ws.onclose = null; ws.close(); ws = null;
            if (state.realtime) connectBinanceWS();
        }
    }, 5000);
    ws.onopen = function () {
        clearTimeout(connTimer);
        realtimeSource = 'okx-ws';
        ws.send(JSON.stringify({ op: 'subscribe', args: [{ channel, instId }] }));
    };
    ws.onmessage = function (ev) {
        try {
            var msg = JSON.parse(ev.data);
            if (msg.event === 'subscribe' || msg.event === 'error') return;
            if (msg.arg && msg.data && msg.data[0]) {
                var arr = msg.data[0];
                var candle = {
                    time: Math.floor(Number(arr[0]) / 1000), open: parseFloat(arr[1]),
                    high: parseFloat(arr[2]), low: parseFloat(arr[3]),
                    close: parseFloat(arr[4]), volume: parseFloat(arr[5]),
                };
                if (isFinite(candle.open)) updateCandleFromRealtime(candle);
            }
        } catch (e) { console.log('[OKX WS] parse error:', e); }
    };
    ws.onclose = function () {
        clearTimeout(connTimer); ws = null;
        if (state.realtime) {
            if (realtimeSource !== 'okx-ws') connectBinanceWS();
            else wsReconnectTimer = setTimeout(connectOKXWS, WS_RECONNECT_DELAY);
        }
    };
    ws.onerror = function () {};
}

// --- Binance WebSocket ---

import { BINANCE_WS_SYMBOLS, BINANCE_WS_TF } from './config.js';

function connectBinanceWS() {
    if (ws) return;
    var bSymbol = BINANCE_WS_SYMBOLS[state.symbol];
    var bInterval = BINANCE_WS_TF[state.timeframe];
    if (!bSymbol || !bInterval) return;
    var stream = bSymbol + '@kline_' + bInterval;
    try { ws = new WebSocket('wss://fstream.binance.com/ws/' + stream); } catch (e) { return; }
    ws.onopen = function () { realtimeSource = 'binance-ws'; };
    ws.onmessage = function (ev) {
        try {
            var msg = JSON.parse(ev.data);
            if (msg.e !== 'kline' || !msg.k) return;
            var k = msg.k;
            updateCandleFromRealtime({
                time: Math.floor(k.t / 1000), open: parseFloat(k.o), high: parseFloat(k.h),
                low: parseFloat(k.l), close: parseFloat(k.c), volume: parseFloat(k.v),
            });
        } catch (e) { console.log('[Binance WS] parse error:', e); }
    };
    ws.onclose = function () { ws = null; if (state.realtime) wsReconnectTimer = setTimeout(connectBinanceWS, WS_RECONNECT_DELAY); };
    ws.onerror = function () {};
}

function disconnectWS() {
    if (wsReconnectTimer) { clearTimeout(wsReconnectTimer); wsReconnectTimer = null; }
    if (ws) { ws.onclose = null; ws.close(); ws = null; }
    realtimeSource = null;
}

// --- REST polling fallback ---

var pollTimer = null;

async function restPollUpdate() {
    try {
        var gen = fetchGen;
        var newData = await fetchOHLCV(state.symbol, state.timeframe, state.candleLimit || 300);
        if (gen !== fetchGen) return;
        if (!newData || newData.length < 10) return;
        var oldLast = state.data[state.data.length - 1];
        var newLast = newData[newData.length - 1];
        if (oldLast && newLast && oldLast.time === newLast.time &&
            oldLast.close === newLast.close && oldLast.high === newLast.high && oldLast.low === newLast.low) return;
        var tip = { time: newLast.time, open: newLast.open, high: newLast.high, low: newLast.low, close: newLast.close, volume: newLast.volume };
        if (oldLast && oldLast.time === tip.time) state.data[state.data.length - 1] = tip;
        else state.data.push(tip);
        var dir = tip.close > tip.open ? '↑' : tip.close < tip.open ? '↓' : '→';
        setLastDirection(dir);
        setLastPrice(formatPrice(tip.close));
        if (onRealtimeUpdate) onRealtimeUpdate(state.data, oldLast, tip);
        if (onTitleUpdate) onTitleUpdate();
    } catch (_) {}
}

export function startRealtime() {
    if (state.realtime) return;
    state.realtime = true;
    realtimeSource = null;
    connectOKXWS();
    restPollUpdate();
    pollTimer = setInterval(restPollUpdate, 500);
}

export function stopRealtime() {
    disconnectWS();
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    state.realtime = false;
}

export function restartRealtime() {
    if (state.realtime) { stopRealtime(); startRealtime(); }
}

// ============================================================
// Order Book / Depth
// ============================================================

export async function fetchOrderBook(symbol) {
    var spotId = symbol.replace('-PERP', '-USDT');
    try {
        var r = await fetch('https://www.okx.com/api/v5/market/books?instId=' + encodeURIComponent(spotId) + '&sz=200');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        var j = await r.json();
        if (j.code === '0' && j.data && j.data[0]) {
            var asks = j.data[0].asks.map(a => ({ price: parseFloat(a[0]), size: parseFloat(a[1]) })).filter(a => a.price > 0 && a.size > 0);
            var bids = j.data[0].bids.map(b => ({ price: parseFloat(b[0]), size: parseFloat(b[1]) })).filter(b => b.price > 0 && b.size > 0);
            return processDepth(asks, bids);
        }
    } catch (err) { throw new Error('深度图加载失败: ' + err.message); }
    return null;
}

function processDepth(asks, bids) {
    asks.sort((a, b) => a.price - b.price);
    bids.sort((a, b) => b.price - a.price);
    var askCum = [], total = 0;
    for (var i = asks.length - 1; i >= 0; i--) { total += asks[i].size; askCum.unshift({ price: asks[i].price, total: total }); }
    var bidCum = []; total = 0;
    for (var i = 0; i < bids.length; i++) { total += bids[i].size; bidCum.push({ price: bids[i].price, total: total }); }
    return { asks: askCum, bids: bidCum };
}

// ============================================================
// Swing points (structure)
// ============================================================

export function findSwingPoints(data, lookback) {
    lookback = lookback || 2;
    var points = [];
    for (var i = lookback; i < data.length - lookback; i++) {
        var c = data[i];
        var isHigh = true, isLow = true;
        for (var j = 1; j <= lookback; j++) {
            if (!data[i - j] || !data[i + j]) continue;
            if (data[i - j].high >= c.high || data[i + j].high >= c.high) isHigh = false;
            if (data[i - j].low <= c.low || data[i + j].low <= c.low) isLow = false;
        }
        if (isHigh && c.high !== c.low) points.push({ time: c.time, type: 'high', price: c.high });
        if (isLow && c.high !== c.low) points.push({ time: c.time, type: 'low', price: c.low });
    }
    return points;
}
