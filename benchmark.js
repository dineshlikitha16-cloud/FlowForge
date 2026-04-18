const fs = require('fs');
const path = require('path');
const http = require('http');

async function measureFrontendBuild() {
  console.log('\n--- Frontend Bundle Size ---');
  const distDir = path.join(__dirname, 'dist', 'assets');
  if (fs.existsSync(distDir)) {
    const files = fs.readdirSync(distDir);
    let totalSize = 0;
    files.forEach(f => {
      const stats = fs.statSync(path.join(distDir, f));
      totalSize += stats.size;
    });
    console.log(`Total Frontend Assets Size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`Total Chunks: ${files.length}`);
  } else {
    console.log('Frontend dist folder not found. Run npm run build first.');
  }
}

async function measureBackend() {
  console.log('\n--- Backend API Performance ---');
  const start = Date.now();
  const iter = 10;
  
  for (let i = 0; i < iter; i++) {
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:5000/health', {
        headers: { 'Accept-Encoding': 'gzip' }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          resolve({ headers: res.headers, size: data.length });
        });
      });
      req.on('error', reject);
    });
  }
  
  const end = Date.now();
  console.log(`Average Response Time over ${iter} requests: ${((end - start) / iter).toFixed(2)} ms`);
  
  // Do one request to check headers
  const req = http.get('http://localhost:5000/health', {
    headers: { 'Accept-Encoding': 'gzip' }
  }, (res) => {
    console.log(`Compression active: ${res.headers['content-encoding'] === 'gzip'}`);
    res.resume();
  });
}

async function run() {
  await measureFrontendBuild();
  try {
    await measureBackend();
  } catch (e) {
    console.log("Ensure backend server is running on port 5000 to test API performance.");
  }
}

run();
