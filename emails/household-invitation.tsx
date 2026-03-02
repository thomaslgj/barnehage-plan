import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface HouseholdInvitationEmailProps {
  inviterName: string;
  partnerName: string;
  inviteCode: string;
  landingPageLink: string;
  deepLink: string;
}

export default function HouseholdInvitationEmail({
  inviterName = 'Noen',
  partnerName = 'du',
  inviteCode = 'abc-def',
  landingPageLink = 'https://flytfamilie.no',
  deepLink = 'flyt://onboarding?code=abc-def',
}: HouseholdInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{inviterName} inviterer deg til Flyt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Hei {partnerName}!</Heading>

          <Text style={text}>
            <strong>{inviterName}</strong> vil gjerne dele hverdagen med deg i Flyt.
          </Text>

          <Text style={text}>
            Flyt gir familien en felles oversikt over hvem som henter, leverer og hva som trengs
            – så dere slipper å holde alt i hodet.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={landingPageLink}>
              Last ned Flyt
            </Button>
          </Section>

          <Text style={textSmall}>
            Har du allerede appen?{' '}
            <Link style={link} href={deepLink}>
              Åpne direkte i Flyt
            </Link>
          </Text>

          <Section style={codeContainer}>
            <Text style={codeLabel}>Invitasjonskode</Text>
            <Text style={codeText}>{inviteCode}</Text>
            <Text style={codeHint}>
              Bruk denne koden når du åpner appen og velger «Bli med»
            </Text>
          </Section>

          <Text style={footer}>
            Hvis du ikke kjenner {inviterName} kan du trygt ignorere denne e-posten.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0 16px',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const textSmall = {
  color: '#555',
  fontSize: '14px',
  lineHeight: '22px',
  padding: '0 40px',
  textAlign: 'center' as const,
};

const buttonContainer = {
  padding: '27px 40px',
  textAlign: 'center' as const,
};

const button = {
  backgroundColor: '#7fa884',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '12px 20px',
};

const link = {
  color: '#7fa884',
  textDecoration: 'underline',
};

const codeContainer = {
  backgroundColor: '#f0f7f1',
  borderRadius: '12px',
  margin: '24px 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const codeLabel = {
  color: '#7fa884',
  fontSize: '12px',
  fontWeight: '600',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '0 0 8px',
};

const codeText = {
  color: '#333',
  fontSize: '32px',
  fontWeight: 'bold',
  letterSpacing: '2px',
  margin: '0 0 8px',
};

const codeHint = {
  color: '#888',
  fontSize: '12px',
  margin: '0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '32px',
};
