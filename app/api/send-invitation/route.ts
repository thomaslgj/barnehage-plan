import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import HouseholdInvitationEmail from '@/emails/household-invitation';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, inviterName, householdName, inviteToken } = body;

    // Validate required fields
    if (!email || !inviterName || !householdName || !inviteToken) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create the invitation link
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://flytfamilie.no'}/invite/${inviteToken}`;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@flytfamilie.no',
      to: email,
      subject: `Invitasjon til ${householdName} på Flyt`,
      react: HouseholdInvitationEmail({
        inviterName,
        householdName,
        inviteLink,
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
