import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface HouseholdInvitationEmailProps {
  inviterName: string;
  householdName: string;
  inviteLink: string;
}

export default function HouseholdInvitationEmail({
  inviterName = 'Noen',
  householdName = 'Husstand',
  inviteLink = 'https://flytfamilie.no',
}: HouseholdInvitationEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Du er invitert til {householdName} på Flyt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Invitasjon til Flyt</Heading>

          <Text style={text}>
            Hei!
          </Text>

          <Text style={text}>
            <strong>{inviterName}</strong> har invitert deg til husstanden <strong>{householdName}</strong> på Flyt.
          </Text>

          <Text style={text}>
            Flyt hjelper familier med å koordinere henting, levering og utstyr til barnehagen –
            så dere slipper å holde alt i hodet.
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={inviteLink}>
              Godta invitasjon
            </Button>
          </Section>

          <Text style={text}>
            Eller kopier og lim inn denne lenken i nettleseren din:
          </Text>
          <Text style={link}>{inviteLink}</Text>

          <Text style={footer}>
            Hvis du ikke kjenner {inviterName} eller ikke vil bli med i {householdName},
            kan du bare ignorere denne eposten.
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
  margin: '40px 0',
  padding: '0 40px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  padding: '0 40px',
};

const buttonContainer = {
  padding: '27px 40px',
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
  fontSize: '14px',
  textDecoration: 'underline',
  padding: '0 40px',
  wordBreak: 'break-all' as const,
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  padding: '0 40px',
  marginTop: '32px',
};
