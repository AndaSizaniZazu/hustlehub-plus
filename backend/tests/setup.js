process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-only-used-by-jest';
process.env.JWT_EXPIRES_IN = '1h';
process.env.AUTH_RATE_LIMIT = '100'; // so lockout tests are not stopped by the IP limiter first
process.env.LOCKOUT_THRESHOLD = '5';
process.env.LOCKOUT_MINUTES = '15';
