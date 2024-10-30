const { ipcRenderer } = require('electron');

function enableExportButton() {
    document.getElementById('export-results').disabled = false;
}

function getFormattedResults() {
    const connectivity = document.getElementById('connectivity-results').innerText;
    const pop = document.getElementById('pop-results').innerText;
    const traceroute = document.getElementById('traceroute-results').innerText;
    
    const timestamp = new Date().toISOString();
    return `Wistia Network Test Results
Generated: ${timestamp}

=== Connectivity Results ===
${connectivity}

=== CDN PoP Location Results ===
${pop}

=== Traceroute Results ===
${traceroute}`;
}

document.getElementById('export-results').addEventListener('click', () => {
    const results = getFormattedResults();
    ipcRenderer.send('save-results', results);
});

// Enable export button when tests complete
document.getElementById('run-tests').addEventListener('click', () => {
    enableExportButton();
});

// Listen for export requests from the menu
ipcRenderer.on('export-requested', () => {
    if (!document.getElementById('export-results').disabled) {
        const results = getFormattedResults();
        ipcRenderer.send('save-results', results);
    }
});
