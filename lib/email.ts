/**
 * Send a household invitation email
 */
export async function sendHouseholdInvitation({
  email,
  inviterName,
  householdName,
  inviteToken,
}: {
  email: string;
  inviterName: string;
  householdName: string;
  inviteToken: string;
}) {
  try {
    const response = await fetch('/api/send-invitation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        inviterName,
        householdName,
        inviteToken,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send invitation');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending invitation:', error);
    throw error;
  }
}
