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
            const cmd = process.platform === 'win32' ? `tracert ${cleanUrl}` : `traceroute ${cleanUrl}`;
            
            const output = await new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) reject(error);
                    else resolve(stdout);
                });
            });

            // Parse the output into a more readable format
            const hops = output.split('\n')
                .filter(line => line.match(/^\s*\d+/)) // Only lines starting with numbers
                .map(line => {
                    const parts = line.trim().split(/\s+/);
                    return {
                        hop: parts[0],
                        ip: parts[1],
                        time: parts[parts.length - 1]
                    };
                });

            let hopsList = '<ul class="list-group">';
            hops.forEach(hop => {
                hopsList += `
                    <li class="list-group-item">
                        ${hop.hop}. ${hop.ip} (${hop.time})
                    </li>`;
            });
            hopsList += '</ul>';

            resultsDiv.innerHTML += `
                <h6 class="mt-3">${url}</h6>
                ${hopsList}`;
        } catch (error) {
            resultsDiv.innerHTML += `
                <div class="alert alert-danger">
                    Traceroute failed for ${url}: ${error.message}
                </div>`;
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
