import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { createToken, verifyToken } from '../auth/token-service';

const router = Router();

// Test route to check token creation and verification
router.get('/auth-test', (req, res) => {
  console.log('Running auth test...');
  const SECRET = process.env.JWT_SECRET || 'dev-secret-key';

  console.log('JWT_SECRET in auth-test:', SECRET.length > 0 ? 'Secret available (not showing full secret)' : 'No secret found');
  console.log('JWT_SECRET type:', typeof SECRET);
  console.log('JWT_SECRET length:', SECRET.length);
  
  try {
    // Create a test token
    const testToken = createToken(999, 'test@example.com');
    console.log('Created test token:', testToken.substring(0, 20) + '...');
    
    // Try to verify the token right away
    try {
      const decoded = verifyToken(testToken);
      console.log('Token verification success:', decoded);
      
      // Also try direct verification with jwt module
      const directDecoded = jwt.verify(testToken, SECRET);
      console.log('Direct JWT verification success:', directDecoded);
      
      res.json({
        success: true,
        message: 'Token creation and verification successful',
        token: testToken,
        decoded
      });
    } catch (verifyError: any) {
      console.error('Token verification error:', verifyError);
      res.status(500).json({
        success: false,
        message: 'Token creation succeeded but verification failed',
        error: verifyError.message,
        stack: verifyError.stack
      });
    }
  } catch (createError: any) {
    console.error('Token creation error:', createError);
    res.status(500).json({
      success: false,
      message: 'Token creation failed',
      error: createError.message,
      stack: createError.stack
    });
  }
});

export default router;