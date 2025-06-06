// Vercel API function (CommonJS format)
module.exports = (req, res) => {
  console.log(`API request: ${req.method} ${req.url}`);
  
  res.status(200).json({
    message: 'Hello from Vercel API!',
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};