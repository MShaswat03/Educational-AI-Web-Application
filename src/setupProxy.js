const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/auth',
    createProxyMiddleware({
      target: 'http://localhost:5400',
      changeOrigin: true,
    })
  );
  app.use(
    '/student',
    createProxyMiddleware({
      target: 'http://localhost:5200',
      changeOrigin: true,
    })
  );
  app.use(
    '/rag',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
    })
  );
};
