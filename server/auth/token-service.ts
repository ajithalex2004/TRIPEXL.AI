import jwt from 'jsonwebtoken';

// Consistent secret key using const
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

/**
 * Creates a JWT token with consistent secret key
 */
export function createToken(userId: number, email: string): string {
  console.log(`Creating token for user ${userId} with email ${email}`);
  console.log(`Using JWT secret: ${JWT_SECRET}`);
  
  return jwt.sign(
    {
      userId,
      email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

/**
 * Verifies a JWT token
 * More flexible to handle tokens with different structures
 */
export function verifyToken(token: string): any {
  console.log(`Verifying token`);
  console.log(`Using JWT secret: ${JWT_SECRET}`);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log(`Token verified successfully:`, decoded);
    return decoded;
  } catch (error) {
    console.error(`Token verification failed:`, error);
    throw error;
  }
}