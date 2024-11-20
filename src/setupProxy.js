const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'https://aishah.jdn.gov.my',
      changeOrigin: true,
      secure: false,
      pathRewrite: {
        '^/api': '/api', // rewrite path
      },
      headers: {
        'Connection': 'keep-alive'
      }
    })
  );
};
