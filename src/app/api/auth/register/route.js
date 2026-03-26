import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Use your actual prisma client
import { hashPassword, signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, role } = await request.json();

    // 1. Basic Validation
    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // 3. Hash the password
    const hashedPassword = await hashPassword(password);

    // 4. Save to Database (Actually creating the user now)
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        isActive: true, // Matching the 'isActive' check in your login logic
        role: role,
        initials: name.split(' ').map(n => n[0]).join('').toUpperCase(), // Optional: generate initials
      },
    });

    // 5. Generate JWT Token
    const token = await signToken({ 
      sub: user.id, 
      email: user.email,
      role: user.role 
    });

    // 6. Return response + Set Cookie
    const { password: _pw, ...safeUser } = user;
    const response = NextResponse.json({ 
      success: true, 
      user: safeUser,
      token 
    });

    response.cookies.set('pm_token', token, {
      httpOnly: false, // Set to false if your frontend needs to read it, matching your login setup
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, 
      path: '/',
    });

    return response;

  } catch (error) {
    console.error('Registration Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}