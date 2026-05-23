# Reminder — 交易信号标注工具

## 项目概况

浏览器端 K 线图表分析 + 信号标记 + 笔记系统。通过 `server.js` 提供静态服务和 HTTP API，与 Claude 协同实现自动化分析。

## 架构

```
ES Modules:
├── config.js         常量（交易对、周期、信号配置、分类）
├── state.js          应用状态 + localStorage/服务端持久化
├── api-market.js     行情数据（OKX/Binance/Hyperliquid）+ WebSocket 实时
├── api-odaily.js     快讯/文章/搜索 API
├── chart.js          Lightweight Charts 渲染、OHLC、标记、绘制、深度图
├── ui.js             DOM 渲染（工具栏、信号列表、笔记、快讯、弹窗）
├── remote-control.js 远程轮询 + window.remote API
└── main.js           入口：初始化、回调绑定、快捷键、标切换
```

## 与 Claude 协作

通过 `node remote.js` CLI 发送命令到浏览器：

- `node remote.js signal buy` — 标记买入
- `node remote.js signal-latest sell "理由" news` — 固定最新K线+信号+笔记
- `node remote.js exec "remote.pinByIndex(10); remote.addSignal('hold', '分析')"` — 任意操作
- `node remote.js symbol BTC-PERP` — 切换标的
- `node remote.js reload` — 刷新数据
- `node remote.js exec "console.log(JSON.stringify(remote.state.data.slice(-24)))"` — 读取最近K线

浏览器端 `window.remote` 对象支持：`pinLatest()`, `pinByIndex(n)`, `addSignal(type, note, cat)`, `drawLine(price)`, `state`。

## 关键约束

- `candleLimit` 是独立变量，非 `state` 属性
- `pinnedTime` 同此，需用 `setPinnedTime()` 写入
- `drawLines` 同理
- 图表回调（onCandleClick/onCrosshairMove）通过 `setOn*()` 注册
- ES Module，`type="module"` 加载

## 数据流

1. 行情：`fetchOHLCV()` → `state.data` → `setChartData()` → 图表渲染
2. 实时：WebSocket → `updateCandleFromRealtime()` → `onRealtimeUpdate` 回调 → `updateCandleOnChart()`
3. 信号：点击/快捷键/远程 → `placeSignal()` → `saveSignals()` → `renderAll()`
4. 远程：轮询 `/api/poll` → `executeRemoteAction()` → UI 操作
5. 持久化：localStorage + HTTP POST `server.js` 写入 `.local.json`
