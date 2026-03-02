import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { supabaseAdmin } from '@/lib/supabase-admin';
import HouseholdInvitationEmail from '@/emails/household-invitation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviterName, inviteCode, partnerName } = body;

    // Validate required fields
    if (!email || !inviterName || !inviteCode || !partnerName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if email is already registered
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const emailTaken = existingUsers?.users?.some(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );
    if (emailTaken) {
      return NextResponse.json(
        { error: 'Denne e-postadressen er allerede registrert i Flyt' },
        { status: 409 }
      );
    }

    // Build links
    const landingPageLink = 'https://flytfamilie.no';
    const deepLink = `flyt://onboarding?code=${encodeURIComponent(inviteCode)}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@flytfamilie.no',
      to: email,
      subject: `${inviterName} inviterer deg til Flyt`,
      react: HouseholdInvitationEmail({
        inviterName,
        partnerName,
        inviteCode,
        landingPageLink,
        deepLink,
      }),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      messageId: data?.id,
    });
  } catch (error) {
    console.error('Error sending invitation email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
