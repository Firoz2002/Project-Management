// app/api/auth/register/route.js
import { NextResponse } from 'next/server';
import { hashPassword, signToken } from '@/lib/auth'; // Adjust path to your auth.js
// import { db } from '@/lib/db'; // Import your database client here

export async function POST(request) {
  try {
    const { name, email, password } = await request.json();

    // 1. Basic Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    /* 2. Check if user exists 
    const existingUser = await db.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }
    */

    // 3. Hash the password using your auth.js utility
    const hashedPassword = await hashPassword(password);

    /* 4. Save to Database
    const user = await db.user.create({
      data: { name, email, password: hashedPassword }
    });
    */
    
    // Mock user for demonstration if DB isn't set up yet
    const user = { id: '123', name, email };

    // 5. Generate JWT Token
    const token = await signToken({ 
      userId: user.id, 
      email: user.email 
    });

    // 6. Return response + Set Cookie (Optional but recommended for Middleware)
    const response = NextResponse.json({ 
      success: true, 
      user: { name: user.name, email: user.email },
      token 
    });

    response.cookies.set('pm_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}