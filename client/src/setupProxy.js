const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Check if we're running with Netlify CLI
  const isNetlifyDev = process.env.NETLIFY_DEV === 'true' || process.env.REACT_APP_NETLIFY_DEV === 'true';
  
  if (isNetlifyDev) {
    // Proxy to Netlify Functions in development
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:8888',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/.netlify/functions/api'
        }
      })
    );
  } else {
    // Proxy to Express server in traditional development
    app.use(
      '/api',
      createProxyMiddleware({
        target: 'http://localhost:5001',
        changeOrigin: true
      })
    );
  }
};