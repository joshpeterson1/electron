const traceroute = require('traceroute');
const dns = require('dns');
const axios = require('axios');
const geoip = require('geoip-lite');

const URLS = [
    'wistia.com',
    'fast.wistia.com',
    'fast.wistia.net',
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

function performTraceroute() {
    const resultsDiv = document.getElementById('traceroute-results');
    
    URLS.forEach(url => {
        const cleanUrl = url.replace('https://', '').replace('http://', '');
        
        traceroute.trace(cleanUrl, (err, hops) => {
            if (err) {
                resultsDiv.innerHTML += `
                    <div class="alert alert-danger">
                        Traceroute failed for ${url}: ${err}
                    </div>`;
                return;
            }

            let hopsList = '<ul class="list-group">';
            hops.forEach(hop => {
                hopsList += `
                    <li class="list-group-item">
                        ${hop.hop}. ${hop.ip} (${hop.rtt1}ms)
                    </li>`;
            });
            hopsList += '</ul>';

            resultsDiv.innerHTML += `
                <h6 class="mt-3">${url}</h6>
                ${hopsList}`;
        });
    });
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
