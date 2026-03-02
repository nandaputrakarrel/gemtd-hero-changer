// preload.js
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("overlayAPI", {
    moveBy: (dx, dy) => ipcRenderer.send("overlay:moveBy", dx, dy),
    resizeBy: (dw, dh) => ipcRenderer.send("overlay:resizeBy", dw, dh),
    onClickThrough: (cb) => ipcRenderer.on("overlay:clickThrough", (_e, v) => cb(v)),
});
