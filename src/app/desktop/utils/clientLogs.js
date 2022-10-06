let currentLog = [];

let addLogCallbacks = [];
let clearLogCallbacks = [];

export function addLogRow(row) {
    currentLog.push(row);
    addLogCallbacks.forEach(c => c(row));
}

export function clearLogs(row) {
    currentLog = [];
    clearLogCallbacks.forEach(c => c());
    addLogCallbacks = [];
}

export function onAddLog(cb) {
    addLogCallbacks.push(cb);
}
export function clearAddLog(){
    addLogCallbacks = [];
}
export function onClearLog(cb) {
    clearLogCallbacks.push(cb);
}

export function getLogs() {
    return currentLog;
}