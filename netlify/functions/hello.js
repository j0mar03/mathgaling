// Netlify Function for hello endpoint
exports.handler = async (event, context) => {
  console.log('Hello function called:', event.httpMethod, event.path);
  
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };
  
  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }
  
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({
      message: 'Hello from Netlify Functions!',
      method: event.httpMethod,
      path: event.path,
      timestamp: new Date().toISOString()
    })
  };
};