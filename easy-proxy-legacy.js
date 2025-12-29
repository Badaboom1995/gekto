import express from 'express';
import proxy from 'express-http-proxy';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 3200;
const TARGET_PORT = 5173;

// Read the script from file
let scriptContent;
try {
  scriptContent = fs.readFileSync('./dist/tabz-widget.iife.js', 'utf8');
  console.log('✅ Loaded script from tabz-widget.js');
} catch (err) {
  console.error('❌ Could not load tabz-widget.js:', err);
  scriptContent = '// Script file not found';
}

// Read the CSS from file
let cssContent;
try {
  cssContent = fs.readFileSync('./dist/tabz-widget.css', 'utf8');
  console.log('✅ Loaded CSS from tabz-widget.css');
} catch (err) {
  console.error('❌ Could not load tabz-widget.css:', err);
  cssContent = '/* CSS file not found */';
}

// Serve CSS file through proxy
app.get('/__widget/tabz-widget.css', (req, res) => {
  res.setHeader('Content-Type', 'text/css');
  res.setHeader('Cache-Control', 'no-cache');
  res.send(cssContent);
});

// Script to inject into HTML pages
const INJECT_SCRIPT = `
<link rel="stylesheet" href="/__widget/tabz-widget.css">
<script id="proxy-script">
${scriptContent}
</script>
`;

// Simple proxy with HTML injection
app.use(
  '/',
  proxy(`http://localhost:${TARGET_PORT}`, {
    userResDecorator: function (proxyRes, proxyResData, userReq, userRes) {
      // Log the request
      console.log(
        `[${new Date().toISOString()}] ${userReq.method} ${userReq.url}`
      );
      // Check if response is HTML
      const contentType = proxyRes.headers['content-type'] || '';
      if (contentType.includes('text/html')) {
        console.log('  → Injecting script into HTML response');

        // Convert buffer to string
        let html = proxyResData.toString('utf8');

        // Inject our script before closing body tag
        if (html.includes('</body>')) {
          html = html.replace('</body>', `${INJECT_SCRIPT}</body>`);
        } else if (html.includes('</html>')) {
          // Fallback if no body tag
          html = html.replace('</html>', `${INJECT_SCRIPT}</html>`);
        }

        // Return modified HTML as buffer
        return Buffer.from(html);
      }

      // Return other content types unchanged
      return proxyResData;
    },

    // Optional: Handle proxy errors
    proxyErrorHandler: function (err, res, next) {
      console.error('Proxy error:', err);
      res.status(500).send(`
      <html>
        <body style="font-family: system-ui; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: linear-gradient(135deg, #ff6b6b, #ff8e53);">
          <div style="text-align: center; color: white;">
            <h1>🔥 Proxy Error</h1>
            <p>Could not connect to localhost:${TARGET_PORT}</p>
            <pre style="background: rgba(0,0,0,0.2); padding: 10px; border-radius: 5px; margin-top: 20px;">${err.message}</pre>
          </div>
        </body>
      </html>
    `);
    },
  })
);

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   ✨ Easy Proxy Server Running!                       ║
║                                                        ║
║   Proxy:  http://localhost:${PORT}                     ║
║   Target: http://localhost:${TARGET_PORT}                     ║
║                                                        ║
║   Features:                                            ║
║   • Automatic HTML detection                          ║
║   • Script injection into HTML pages                  ║
║   • Request logging with timestamps                   ║
║   • Clean error handling                              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
