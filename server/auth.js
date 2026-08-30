import crypto from 'crypto';

// Secret key for HMAC-SHA256 signing of JWT tokens.
// In production, override via process.env.JWT_SECRET
const JWT_SECRET = process.env.JWT_SECRET || 'kisanh_secret_key_2026_secure_jwt_token_auth_98765';

function base64UrlEncode(str) {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return Buffer.from(base64, 'utf-8');
}

/**
 * Creates a signed JWT session token for an authenticated user.
 * Default expiration: 7 days.
 */
export function createJWT(payload, expiresInSeconds = 7 * 24 * 3600) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const jti = crypto.randomBytes(16).toString('hex');
  const fullPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
    jti
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verifies a JWT token's signature, expiry, and revocation state.
 */
export function verifyJWT(token, isTokenInvalidatedFn) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [encodedHeader, encodedPayload, signature] = parts;
  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(signatureInput)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    return null; // Invalid signature
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }
    if (isTokenInvalidatedFn && payload.jti && isTokenInvalidatedFn(payload.jti)) {
      return null; // Invalidated / Logged out
    }
    return payload;
  } catch (e) {
    return null;
  }
}

/**
 * Express middleware to protect routes behind JWT authentication or Officer Admin PIN.
 */
export function requireAuthMiddleware(db) {
  return (req, res, next) => {
    // 1. Check Officer Admin PIN header
    const pin = req.headers['x-admin-pin'];
    if (pin && String(pin) === String(process.env.ADMIN_PIN || '1234')) {
      req.isAdmin = true;
      return next();
    }

    // 2. Extract Bearer token from Authorization header or x-auth-token header
    const authHeader = req.headers['authorization'];
    let tokenString = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      tokenString = authHeader.substring(7).trim();
    } else if (req.headers['x-auth-token']) {
      tokenString = String(req.headers['x-auth-token']).trim();
    }

    if (!tokenString) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required: Missing access token. Please log in.'
      });
    }

    const decoded = verifyJWT(tokenString, (jti) => db.isTokenInvalidated(jti));
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: 'Authentication failed: Invalid or expired session token. Please log in again.'
      });
    }

    req.user = decoded; // { id, phone, name, iat, exp, jti }
    req.tokenString = tokenString;
    req.isAdmin = false;
    next();
  };
}
