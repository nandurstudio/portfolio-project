const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const https = require('https');

if (process.env.SKIP_GG_SCAN === '1' || process.env.SKIP_GG_SCAN === 'true') {
  console.log('⏭️  GitGuardian Scan: Bypassed by SKIP_GG_SCAN.');
  process.exit(0);
}


// Load API key from root .env
function getApiKey() {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/^GITGUARDIAN_API_KEY\s*=\s*(.+)$/m);
    if (match) {
      return match[1].trim().replace(/['"]/g, '');
    }
  }
  return process.env.GITGUARDIAN_API_KEY;
}

const apiKey = getApiKey();
if (!apiKey) {
  console.log('⚠️  GitGuardian Scan: No GITGUARDIAN_API_KEY found in .env or environment. Skipping scan.');
  process.exit(0);
}

// Get staged files (Added, Copied, Modified)
let stagedFiles = [];
try {
  const output = execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' });
  stagedFiles = output.split('\n').map(f => f.trim()).filter(Boolean);
} catch (e) {
  console.error('❌ Failed to get staged files:', e.message);
  process.exit(1);
}

if (stagedFiles.length === 0) {
  console.log('✅ GitGuardian Scan: No staged files to scan.');
  process.exit(0);
}

// Filter out binary, node_modules, and very large files
const IGNORED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.db', '.sqlite'];
const filesToScan = stagedFiles.filter(file => {
  if (file.includes('node_modules/') || file.includes('.git/') || file.includes('vendor/')) {
    return false;
  }
  const ext = path.extname(file).toLowerCase();
  if (IGNORED_EXTENSIONS.includes(ext)) {
    return false;
  }
  try {
    const stat = fs.statSync(file);
    if (stat.size > 1024 * 1024) return false; // Skip files > 1MB
  } catch (e) {
    return false;
  }
  return true;
});

if (filesToScan.length === 0) {
  console.log('✅ GitGuardian Scan: No text files to scan.');
  process.exit(0);
}

console.log(`🔍 GitGuardian Scan: Scanning ${filesToScan.length} files...`);

// Prepare request payload for /v1/multiscan
const documents = filesToScan.map(file => {
  return {
    filename: file,
    document: fs.readFileSync(file, 'utf8')
  };
});

// GitGuardian multiscan payload limit is 20 documents per request
const CHUNK_SIZE = 20;
const chunks = [];
for (let i = 0; i < documents.length; i += CHUNK_SIZE) {
  chunks.push(documents.slice(i, i + CHUNK_SIZE));
}

let totalIncidents = 0;

function scanChunk(chunk) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(chunk);
    const options = {
      hostname: 'api.gitguardian.com',
      port: 443,
      path: '/v1/multiscan',
      method: 'POST',
      headers: {
        'Authorization': `Token ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`GitGuardian API returned status ${res.statusCode}: ${body}`));
          return;
        }
        try {
          const results = JSON.parse(body);
          resolve(results);
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', (e) => { reject(e); });
    req.write(data);
    req.end();
  });
}

async function run() {
  try {
    for (const chunk of chunks) {
      const results = await scanChunk(chunk);
      results.forEach((result, index) => {
        const file = chunk[index].filename;
        if (result.policy_break_count > 0) {
          console.error(`\n❌ SECRETS DETECTED in ${file}:`);
          result.policy_breaks.forEach(pb => {
            console.error(`   - Detector: ${pb.detector_name} (${pb.category})`);
            console.error(`   - Severity: ${pb.severity}`);
            pb.matches.forEach(m => {
              console.error(`     Match type: ${m.type || 'unknown'}`);
            });
          });
          totalIncidents += result.policy_break_count;
        }
      });
    }

    if (totalIncidents > 0) {
      console.error(`\n🚨 Commit BLOCKED: GitGuardian detected ${totalIncidents} secrets in staged changes!`);
      process.exit(1);
    } else {
      console.log('✅ GitGuardian Scan: No secrets detected. Clean commit!');
      process.exit(0);
    }
  } catch (err) {
    console.error('⚠️  GitGuardian Scan failed:', err.message);
    // Non-blocking in case of network or API issues
    process.exit(0);
  }
}

run();
