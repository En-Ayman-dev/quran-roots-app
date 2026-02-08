const http = require('http');

const makeRequest = (path, headers = {}, method = 'GET', description) => {
    return new Promise((resolve) => {
        const options = {
            hostname: 'localhost',
            port: 3002,
            path: path,
            method: method,
            headers: headers,
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                console.log(`[${description}] - Status: ${res.statusCode} ${res.statusCode === 200 || res.statusCode === 204 ? '✅' : '❌'}`);
                // console.log(`Headers:`, res.headers);
                resolve(res.statusCode);
            });
        });

        req.on('error', (e) => {
            console.error(`[${description}] - Error: ${e.message} (Code: ${e.code})`);
            if (e.cause) console.error(`[${description}] - Cause: ${e.cause}`);
            resolve(null);
        });

        req.end();
    });
};

const runVerification = async () => {
    console.log('--- Starting Security Verification ---');

    // 1. Health Check
    await makeRequest('/health', {}, 'GET', 'Health Check');

    // 2. Preflight Check (OPTIONS)
    await makeRequest('/api/resources/word-index', {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'x-app-source'
    }, 'OPTIONS', 'CORS Preflight (OPTIONS)');

    // 3. Protected Resource (No Header)
    await makeRequest('/api/resources/word-index', {}, 'GET', 'Protected Resource (No Header)');

    // 4. Protected Resource (Correct Header)
    await makeRequest('/api/resources/word-index', {
        'x-app-source': 'quran-roots-client-v1'
    }, 'GET', 'Protected Resource (Correct Header)');

    console.log('--- Verification Complete ---');
};

runVerification();
