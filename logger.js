/**
 * logger.js — Low-storage logcat-style logger for codegencc
 * - Max 100 lines = ~10KB (low storage)
 * - Circular buffer like Android logcat
 * - Stored in localStorage: codegen_logs (not a real file, so no git bloat)
 * - Can export to codegen.log Blob when you need a file
 * 
 * Usage:
 *   Log.i("Created org", slug)        // info
 *   Log.w("Slug taken")               // warn
 *   Log.e("Auth failed", reason)      // error
 *   Log.export()                      // downloads codegen.log (10KB max)
 */

const Log = (() => {
  const KEY = 'codegen_logs';
  const MAX_LINES = 100; // low storage = 100 lines ~10KB
  const MAX_CHARS_PER_LINE = 120;

  function now() {
    const d = new Date();
    return d.toISOString().slice(11,19) + '.' + String(d.getMilliseconds()).padStart(3,'0');
  }

  function push(level, msg, extra) {
    try {
      let line = `[${now()}] ${level}: ${msg}`;
      if (extra) {
        let extraStr = typeof extra === 'string' ? extra : JSON.stringify(extra);
        extraStr = extraStr.slice(0, 60); // truncate extra to save storage
        line += ` | ${extraStr}`;
      }
      line = line.slice(0, MAX_CHARS_PER_LINE);

      let logs = JSON.parse(localStorage.getItem(KEY) || '[]');
      logs.push(line);
      // circular buffer - keep only last MAX_LINES (like logcat -t 100)
      if (logs.length > MAX_LINES) {
        logs = logs.slice(-MAX_LINES);
      }
      localStorage.setItem(KEY, JSON.stringify(logs));
      
      // also console for dev (can be disabled in prod)
      if (level === 'E') console.error(line);
      else if (level === 'W') console.warn(line);
      // console.log(line); // uncomment if you want console too
    } catch(e) {
      // storage full? clear and retry
      localStorage.setItem(KEY, JSON.stringify([`[${now()}] W: Log storage full, cleared`]));
    }
  }

  return {
    i: (msg, extra) => push('I', msg, extra),
    w: (msg, extra) => push('W', msg, extra),
    e: (msg, extra) => push('E', msg, extra),
    d: (msg, extra) => push('D', msg, extra),

    getAll: () => {
      return JSON.parse(localStorage.getItem(KEY) || '[]');
    },

    getSize: () => {
      const logs = localStorage.getItem(KEY) || '[]';
      return new Blob([logs]).size; // bytes
    },

    clear: () => {
      localStorage.removeItem(KEY);
      push('I', 'Logs cleared');
    },

    // Export to a real *.log file when you need it (download)
    export: (filename = 'codegen.log') => {
      const logs = JSON.parse(localStorage.getItem(KEY) || '[]');
      const content = logs.join('\n') + `\n--- Exported ${new Date().toISOString()} ---\nSize: ${new Blob([logs.join('\n')]).size} bytes / ${MAX_LINES} lines max\n`;
      const blob = new Blob([content], {type: 'text/plain'});
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      push('I', `Exported ${filename}`, `${blob.size} bytes`);
      return content;
    },

    // For dash.html viewer - returns HTML
    render: () => {
      const logs = JSON.parse(localStorage.getItem(KEY) || '[]');
      const size = new Blob([logs.join('\n')]).size;
      return `<div style="font-size:10px;color:#666;margin-bottom:6px">${logs.length}/${MAX_LINES} lines • ${size} bytes • low storage mode (logcat style)</div>` +
             `<div class="code-block" style="max-height:200px;overflow:auto;white-space:pre-wrap;font-size:11px">${logs.slice().reverse().join('\n') || 'No logs yet'}</div>`;
    }
  };
})();

window.Log = Log;
