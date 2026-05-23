/**
 * Remote control server for Reminder trading tool.
 * Run: node server.js
 * Then open http://localhost:3456 in your browser.
 */
var http = require('http');
var fs = require('fs');
var path = require('path');

var PORT = 3456;
var pendingActions = [];
var appStatus = {};  // latest snapshot from browser
var MIME = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
};

var server = http.createServer(function (req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    var url = new URL(req.url, 'http://localhost:' + PORT);
    var pathname = url.pathname;

    // POST /api — enqueue action from me (CLI)
    if (req.method === 'POST' && pathname === '/api') {
        var body = '';
        req.on('data', function (chunk) { body += chunk; });
        req.on('end', function () {
            try {
                var action = JSON.parse(body);
                pendingActions.push(action);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: true, queue: pendingActions.length }));
            } catch (e) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: e.message }));
            }
        });
        return;
    }

    // GET /api/poll — browser polls for actions
    if (req.method === 'GET' && pathname === '/api/poll') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        var actions = pendingActions;
        pendingActions = [];
        res.end(JSON.stringify(actions));
        return;
    }

    // GET /api/status — read current app state
    if (req.method === 'GET' && pathname === '/api/status') {
        // Browser-side will push status here on each poll
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, status: appStatus || {} }));
        return;
    }

    // POST /api/status — browser pushes its state on each poll
    if (req.method === 'POST' && pathname === '/api/status') {
        var body = '';
        req.on('data', function (chunk) { body += chunk; });
        req.on('end', function () {
            try { appStatus = JSON.parse(body); } catch (_) {}
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        });
        return;
    }

    // GET /api/data/:name — read a local json file
    var dataMatch = pathname.match(/^\/api\/data\/(\w+)$/);
    if (req.method === 'GET' && dataMatch) {
        var fileName = dataMatch[1] + '.local.json';
        var filePath2 = path.join(__dirname, fileName);
        fs.readFile(filePath2, 'utf8', function (err, data) {
            if (err) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end('{}');
            } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(data);
            }
        });
        return;
    }

    // POST /api/data/:name — write a local json file
    if (req.method === 'POST' && dataMatch) {
        var fileName = dataMatch[1] + '.local.json';
        var filePath2 = path.join(__dirname, fileName);
        var body = '';
        req.on('data', function (chunk) { body += chunk; });
        req.on('end', function () {
            fs.writeFile(filePath2, body, 'utf8', function (err) {
                res.writeHead(err ? 500 : 200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: !err }));
            });
        });
        return;
    }

    // GET /api/health
    if (req.method === 'GET' && pathname === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
        return;
    }

    // Serve static files
    var filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
    var ext = path.extname(filePath);
    fs.readFile(filePath, function (err, data) {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    });
});

server.listen(PORT, function () {
    console.log('┌─────────────────────────────────────────┐');
    console.log('│  Reminder Remote Control Server        │');
    console.log('│  Open: http://localhost:' + PORT + '          │');
    console.log('│  API:  POST /api  (send command)       │');
    console.log('└─────────────────────────────────────────┘');
});
