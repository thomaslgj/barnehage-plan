import { redirect } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Block admin dashboard in production
  if (process.env.NODE_ENV === 'production') {
    redirect('/');
  }

  return <>{children}</>;
}
