export default function handler(req: any, res: any) {
  try {
    // Handle preflight OPTIONS requests
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      res.setHeader('Access-Control-Allow-Credentials', 'false');
      res.status(200).end();
      return;
    }

    if (req.method === 'GET') {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'false');
      res.status(200).json({
        status: 'ok',
        message: 'Backend API is running',
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      });
    } else {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'false');
      res.status(405).json({
        error: 'Method not allowed',
        allowed: ['GET', 'OPTIONS']
      });
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    });
  }
}