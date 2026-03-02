// electron.js
const { app: electronApp, BrowserWindow, globalShortcut, screen, ipcMain } = require("electron");
const path = require("path");

const PORT = 3000;
const OVERLAY_URL = `http://localhost:${PORT}/overlay`;

// Start Express server
const expressApp = require("./index");
let serverReady = false;
let win;

const server = expressApp.listen(PORT, () => {
    serverReady = true;
    console.log(`Express server ready on port ${PORT}`);
    if (win) win.loadURL(OVERLAY_URL);
});

let clickThrough = false;
let manualHidden = false;

let lastDotaFocusAt = 0;
const FOCUS_GRACE_MS = 300000;

let activeWin = null;
let lastIsDota = false;

async function isDotaFocused() {
    try {
        if (!activeWin) activeWin = (await import("active-win")).default;

        const aw = await activeWin();
        if (!aw) return false;

        const title = (aw.title || "").toLowerCase();
        const owner = (aw.owner?.name || "").toLowerCase();

        if (owner.includes("dota2")) return true;
        if (title.includes("dota 2")) return true;

        return false;
    } catch {
        return lastIsDota;
    }
}

function createWin() {
    win = new BrowserWindow({
        width: 420,
        height: 340,
        x: 120,
        y: 120,
        frame: false,
        transparent: true,
        resizable: true,
        alwaysOnTop: true,
        skipTaskbar: true,
        focusable: true,
        hasShadow: false,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    win.setAlwaysOnTop(true, "screen-saver");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

    setClickThrough(false);

    if (serverReady) {
        win.loadURL(OVERLAY_URL);
    }
}

function setClickThrough(v) {
    clickThrough = v;
    win.setIgnoreMouseEvents(v, { forward: true });
    win.webContents.send("overlay:clickThrough", clickThrough);
}

function getVirtualBounds() {
    const displays = screen.getAllDisplays();
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const d of displays) {
        const b = d.bounds;
        minX = Math.min(minX, b.x);
        minY = Math.min(minY, b.y);
        maxX = Math.max(maxX, b.x + b.width);
        maxY = Math.max(maxY, b.y + b.height);
    }

    return { minX, minY, maxX, maxY };
}

function clampToVirtual(bounds, margin = 20) {
    const vb = getVirtualBounds();
    const w = bounds.width;
    const h = bounds.height;

    const minX = vb.minX - (w - margin);
    const minY = vb.minY - (h - margin);
    const maxX = vb.maxX - margin;
    const maxY = vb.maxY - margin;

    return {
        ...bounds,
        x: Math.max(minX, Math.min(maxX, bounds.x)),
        y: Math.max(minY, Math.min(maxY, bounds.y)),
    };
}

function setOverlayVisible(visible) {
    if (!win) return;
    if (visible) {
        if (!win.isVisible()) win.showInactive();
    } else {
        if (win.isVisible()) win.hide();
    }
}

function toggleVisibility() {
    if (!win) return;
    if (win.isVisible()) {
        manualHidden = true;
        win.hide();
    } else {
        manualHidden = false;
        win.showInactive();
    }
}

function toggleClickThrough() {
    if (!win) return;
    setClickThrough(!clickThrough);
}

async function startFocusLoop() {
    setInterval(async () => {
        if (!win) return;

        const dotaFocused = await isDotaFocused();
        lastIsDota = dotaFocused;

        if (dotaFocused) lastDotaFocusAt = Date.now();
        if (manualHidden) return;

        const overlayFocused = win.isFocused();
        const withinGrace = (Date.now() - lastDotaFocusAt) <= FOCUS_GRACE_MS;

        const shouldShow = dotaFocused || (overlayFocused && withinGrace);
        setOverlayVisible(shouldShow);
    }, 250);
}

electronApp.whenReady().then(() => {
    createWin();

    globalShortcut.register("Control+Shift+O", toggleVisibility);
    globalShortcut.register("Control+Shift+P", toggleClickThrough);

    ipcMain.on("overlay:moveBy", (_e, dx, dy) => {
        if (!win) return;

        const b = win.getBounds();
        const next = clampToVirtual({
            x: b.x + dx,
            y: b.y + dy,
            width: b.width,
            height: b.height,
        });

        win.setBounds(next);
    });

    ipcMain.on("overlay:resizeBy", (_e, dw, dh) => {
        if (!win) return;

        const b = win.getBounds();

        const minW = 300;
        const minH = 220;

        const next = clampToVirtual({
            x: b.x,
            y: b.y,
            width: Math.max(minW, b.width + dw),
            height: Math.max(minH, b.height + dh),
        });

        win.setBounds(next);
    });

    startFocusLoop();
});

electronApp.on("will-quit", () => {
    globalShortcut.unregisterAll();
    server.close();
});
