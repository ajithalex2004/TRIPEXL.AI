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
 */
export function verifyToken(token: string): any {
  console.log(`Verifying token`);
  console.log(`Using JWT secret: ${JWT_SECRET}`);
  
  return jwt.verify(token, JWT_SECRET);
}