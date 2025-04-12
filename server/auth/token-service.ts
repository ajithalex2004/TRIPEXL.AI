import jwt from 'jsonwebtoken';

// Consistent secret key using const
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

// Interface for our token payloads
export interface TokenPayload {
  userId?: number;
  user_id?: number;
  email?: string;
  id?: number;
  sub?: string;
  iat: number;
  exp: number;
}

/**
 * Creates a JWT token with consistent secret key
 */
export function createToken(userId: number, email?: string): string {
  console.log(`Creating token for user ${userId}` + (email ? ` with email ${email}` : ''));
  
  // Only add email if it's provided, to maintain backward compatibility
  const payload: any = { userId };
  if (email) {
    payload.email = email;
  }
  
  return jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verifies a JWT token
 * More flexible to handle tokens with different structures
 */
export function verifyToken(token: string): TokenPayload {
  console.log(`Verifying token: ${token.substring(0, 15)}...`);
  console.log(`JWT_SECRET length: ${JWT_SECRET.length}, first 5 chars: ${JWT_SECRET.substring(0, 5)}`);
  
  try {
    // Enhanced debugging - print the full token for debugging
    console.log(`Full token being verified:`, token);
    console.log(`Current timestamp:`, Math.floor(Date.now() / 1000));
    
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    
    // Log token structure for debugging
    console.log(`Token payload structure:`, Object.keys(decoded).join(', '));
    console.log(`Token full decoded payload:`, JSON.stringify(decoded));
    console.log(`Token exp:`, decoded.exp, `iat:`, decoded.iat);
    
    // Extract and normalize any user ID field to userId
    if (decoded.user_id && !decoded.userId) {
      decoded.userId = decoded.user_id;
      console.log(`Normalized user_id to userId:`, decoded.userId);
    } else if (decoded.id && !decoded.userId) {
      decoded.userId = decoded.id;
      console.log(`Normalized id to userId:`, decoded.userId);
    } else if (decoded.sub && !decoded.userId && !isNaN(Number(decoded.sub))) {
      decoded.userId = Number(decoded.sub);
      console.log(`Normalized sub to userId:`, decoded.userId);
    }
    
    // IMPORTANT: Check for token expiration explicitly
    const now = Math.floor(Date.now() / 1000);
    console.log(`Current time (epoch):`, now, `Token expiry:`, decoded.exp, `Difference:`, decoded.exp - now);
    
    if (decoded.exp && decoded.exp < now) {
      console.error(`Token expired at ${new Date(decoded.exp * 1000).toISOString()}, current time is ${new Date().toISOString()}`);
      throw new Error('Token expired');
    }
    
    return decoded;
  } catch (error) {
    console.error(`Token verification failed:`, error);
    // Print more detail about the error
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}, message: ${error.message}`, error.stack);
    }
    throw error;
  }
}

/**
 * Checks if a token has the minimum required fields
 */
export function isValidTokenPayload(decoded: TokenPayload): boolean {
  // Must have some kind of user identifier
  return !!(decoded && 
    (decoded.userId || decoded.user_id || decoded.id || 
     (decoded.sub && !isNaN(Number(decoded.sub))))
  );
}