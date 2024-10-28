const { exec } = require('node:child_process');
const dns = require('node:dns');
const axios = require('axios');
const geoip = require('geoip-lite');

const URLS = [
    'https://wistia.com',
    'https://fast.wistia.com',
    'https://fast.wistia.net',
    'https://www.google-analytics.com/collect',
    'https://track.hubspot.com'
];

document.getElementById('run-tests').addEventListener('click', runAllTests);

async function runAllTests() {
    clearResults();
    await checkConnectivity();
    await performTraceroute();
    await checkPoPLocation();
}

async function checkConnectivity() {
    const resultsDiv = document.getElementById('connectivity-results');
    
    for (const url of URLS) {
        try {
            const startTime = Date.now();
            await axios.get(url);
            const endTime = Date.now();
            
            resultsDiv.innerHTML += `
                <div class="alert alert-success">
                    ${url}: Reachable (${endTime - startTime}ms)
                </div>`;
        } catch (error) {
            resultsDiv.innerHTML += `
                <div class="alert alert-danger">
                    ${url}: Not reachable - ${error.message}
                </div>`;
        }
    }
}

async function performTraceroute() {
    const resultsDiv = document.getElementById('traceroute-results');
    
    for (const url of URLS) {
        try {
            const cleanUrl = url.replace('https://', '').replace('http://', '');
            const cmd = process.platform === 'win32' ? 
                `tracert -h 30 ${cleanUrl}` : 
                `traceroute -I -m 30 ${cleanUrl}`;
            
            // Show "in progress" message with spinner
            resultsDiv.innerHTML += `
                <h6 class="mt-3">${url}</h6>
                <div class="alert alert-info" id="trace-${cleanUrl}">
                    <div class="d-flex align-items-center">
                        <div class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                        Traceroute in progress...
                    </div>
                </div>`;

            const output = await new Promise((resolve, reject) => {
                exec(cmd, {timeout: 30000}, (error, stdout, stderr) => {
                    if (error && error.code === 'ENOENT') {
                        reject(new Error('Traceroute command not found. Please ensure it is installed.'));
                    } else if (error && error.code === 'EACCES') {
                        reject(new Error('Permission denied. Try running the app with administrator privileges.'));
                    } else if (error) {
                        // Some errors are expected and contain useful output
                        resolve(stdout || stderr);
                    } else {
                        resolve(stdout);
                    }
                });
            });

            // Update the progress message with results
            const resultDiv = document.getElementById(`trace-${cleanUrl}`);
            if (resultDiv) {
                resultDiv.className = 'alert alert-success';
                resultDiv.innerHTML = `<pre>${output}</pre>`;
            }

        } catch (error) {
            const resultDiv = document.getElementById(`trace-${cleanUrl}`);
            if (resultDiv) {
                resultDiv.className = 'alert alert-danger';
                resultDiv.textContent = `Error: ${error.message}`;
            }
        }
    }
}

async function checkPoPLocation() {
    const resultsDiv = document.getElementById('pop-results');
    
    for (const url of URLS) {
        try {
            const cleanUrl = url.replace('https://', '').replace('http://', '');
            const ip = await new Promise((resolve, reject) => {
                dns.resolve4(cleanUrl, (err, addresses) => {
                    if (err) reject(err);
                    else resolve(addresses[0]);
                });
            });

            const geo = geoip.lookup(ip);
            
            resultsDiv.innerHTML += `
                <div class="alert alert-info">
                    ${url}<br>
                    IP: ${ip}<br>
                    Location: ${geo ? `${geo.city}, ${geo.country}` : 'Unknown'}
                </div>`;
        } catch (error) {
            resultsDiv.innerHTML += `
                <div class="alert alert-danger">
                    ${url}: Failed to get location - ${error.message}
                </div>`;
        }
    }
}

function clearResults() {
    document.getElementById('connectivity-results').innerHTML = '';
    document.getElementById('traceroute-results').innerHTML = '';
    document.getElementById('pop-results').innerHTML = '';
}
