import { supabaseAdmin } from '@/lib/supabase-admin';
import dayjs from 'dayjs';
import 'dayjs/locale/nb';
import UserActions from './UserActions';

dayjs.locale('nb');

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface HouseholdMember {
  id: string;
  household_id: string;
  user_id: string | null;
  display_name: string;
  role: string;
  household: {
    name: string;
  };
}

interface UserStatus {
  hasAccount: boolean;
  hasCompletedOnboarding: boolean;
  childCount: number;
}

interface Child {
  id: string;
  household_id: string;
  name: string;
  household: {
    name: string;
  };
}

async function getAdminData() {
  // Fetch all household members
  const { data: membersData, error: membersError } = await supabaseAdmin
    .from('household_members')
    .select(`
      *,
      household:households(name)
    `);

  if (membersError) {
    console.error('Error fetching members:', membersError);
  }

  // Fetch all children
  const { data: childrenData, error: childrenError } = await supabaseAdmin
    .from('children')
    .select(`
      *,
      household:households(name)
    `);

  if (childrenError) {
    console.error('Error fetching children:', childrenError);
  }

  // Calculate statistics
  const uniqueHouseholds = new Set(membersData?.map(m => m.household_id) || []);
  const uniqueUsers = new Set(membersData?.map(m => m.user_id).filter(Boolean) || []);

  // Calculate user status for each member
  const userStatuses: Record<string, UserStatus> = {};
  membersData?.forEach(member => {
    const childrenInHousehold = childrenData?.filter(c => c.household_id === member.household_id) || [];

    // Only admin/owner has completed onboarding (they created the household)
    // Other members are just invited
    const isAdmin = member.role === 'admin' || member.role === 'owner';
    const householdSetup = !!member.household?.name && childrenInHousehold.length > 0;

    userStatuses[member.id] = {
      hasAccount: !!member.user_id,
      hasCompletedOnboarding: !!member.user_id && isAdmin && householdSetup,
      childCount: childrenInHousehold.length,
    };
  });

  return {
    members: membersData || [],
    children: childrenData || [],
    userStatuses,
    stats: {
      totalUsers: uniqueUsers.size,
      totalHouseholds: uniqueHouseholds.size,
      totalChildren: childrenData?.length || 0,
    }
  };
}

export default async function AdminDashboard() {
  const { members, children, userStatuses, stats } = await getAdminData();

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Oversikt over brukere og statistikk</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt antall brukere</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt antall hushold</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalHouseholds}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Totalt antall barn</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalChildren}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Premium brukere</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                <p className="text-xs text-gray-500 mt-1">Kommer snart</p>
              </div>
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Brukere</h2>
            <p className="text-sm text-gray-600 mt-1">Alle registrerte brukere i systemet</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Navn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hushold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Konto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Onboarding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Barn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Premium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => {
                  const status = userStatuses[member.id];
                  const isAdmin = member.role === 'admin' || member.role === 'owner';

                  // Determine onboarding status display
                  let onboardingStatus: 'completed' | 'incomplete' | 'na' = 'na';
                  if (status?.hasCompletedOnboarding) {
                    onboardingStatus = 'completed';
                  } else if (isAdmin && status?.hasAccount) {
                    // Admin with account but no household setup = error
                    onboardingStatus = 'incomplete';
                  }

                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{member.display_name || 'Ikke satt'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.household?.name || 'Ukjent'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status && status.hasAccount && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            fontSize: '0.75rem',
                            lineHeight: '1.25rem',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}>
                            ✓ Opprettet
                          </span>
                        )}
                        {status && !status.hasAccount && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            fontSize: '0.75rem',
                            lineHeight: '1.25rem',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: '#fef3c7',
                            color: '#92400e'
                          }}>
                            ⚠ Venter
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {onboardingStatus === 'completed' && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            fontSize: '0.75rem',
                            lineHeight: '1.25rem',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: '#dcfce7',
                            color: '#166534'
                          }}>
                            ✓ Fullført
                          </span>
                        )}
                        {onboardingStatus === 'incomplete' && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            fontSize: '0.75rem',
                            lineHeight: '1.25rem',
                            fontWeight: '600',
                            borderRadius: '9999px',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b'
                          }}>
                            ✗ Ikke fullført
                          </span>
                        )}
                        {onboardingStatus === 'na' && (
                          <span style={{
                            padding: '0.25rem 0.5rem',
                            display: 'inline-flex',
                            fontSize: '0.75rem',
                            lineHeight: '1.25rem',
                            fontWeight: '500',
                            color: '#9ca3af'
                          }}>
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap" style={{ fontSize: '0.875rem', color: '#111827', fontWeight: '500' }}>
                        {status ? status.childCount : 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Free
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {status ? (
                          <UserActions
                            memberId={member.id}
                            userId={member.user_id}
                            hasAccount={status.hasAccount}
                            displayName={member.display_name}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">N/A</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Children Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Barn</h2>
            <p className="text-sm text-gray-600 mt-1">Alle barn registrert i systemet</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Navn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Hushold
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {children.map((child) => (
                  <tr key={child.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{child.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{child.household?.name || 'Ukjent'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
