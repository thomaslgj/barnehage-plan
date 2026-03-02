import { supabaseAdmin } from '@/lib/supabase-admin';
import dayjs from 'dayjs';
import 'dayjs/locale/nb';
import UserActions from './UserActions';
import AdminTabs from './AdminTabs';
import GDPRRequests from './GDPRRequests';

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
  joined_at: string;
  last_active_at?: string | null;
  is_premium?: boolean;
  email?: string;
  household: {
    name: string;
  };
}

interface UserStatus {
  hasAccount: boolean;
  hasCompletedOnboarding: boolean;
  childCount: number;
  lastActiveAt?: string;
  isPremium: boolean;
}

interface ActivityMetrics {
  dailyActiveUsers: number;
  weeklyActiveUsers: number;
  monthlyActiveUsers: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
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
  // Fetch all auth users
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers();

  if (authError) {
    console.error('Error fetching auth users:', authError);
  }

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

  // Create a map of user_id -> household_member
  const membersByUserId = new Map<string, HouseholdMember>();
  membersData?.forEach(member => {
    if (member.user_id) {
      membersByUserId.set(member.user_id, member);
    }
  });

  // Create combined user list: auth users + their household data (if any)
  const allUsers: Array<HouseholdMember & { email?: string; created_at?: string }> = [];

  // Add all auth users
  authData?.users.forEach(authUser => {
    const member = membersByUserId.get(authUser.id);
    if (member) {
      // User has a household - add their member record with email
      allUsers.push({
        ...member,
        email: authUser.email,
        created_at: authUser.created_at,
      });
    } else {
      // User has no household yet - create a temporary record
      allUsers.push({
        id: authUser.id, // Use auth user id as temporary member id
        household_id: '',
        user_id: authUser.id,
        display_name: authUser.email || 'Ukjent',
        role: 'none', // Special role for users without household
        joined_at: authUser.created_at,
        last_active_at: authUser.last_sign_in_at || null,
        is_premium: false,
        household: { name: 'Ingen husstand' },
        email: authUser.email,
        created_at: authUser.created_at,
      });
    }
  });

  // Calculate statistics
  const uniqueHouseholds = new Set(membersData?.map(m => m.household_id) || []);
  const totalAuthUsers = authData?.users.length || 0;

  // Calculate activity metrics
  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const membersWithAccounts = membersData?.filter(m => m.user_id) || [];

  // New users based on joined_at from auth
  const newUsersThisWeek = authData?.users.filter(u =>
    new Date(u.created_at) >= oneWeekAgo
  ).length || 0;

  const newUsersThisMonth = authData?.users.filter(u =>
    new Date(u.created_at) >= oneMonthAgo
  ).length || 0;

  // Premium users
  const premiumUsers = membersWithAccounts.filter(m => m.is_premium).length;

  // Active users based on last_active_at
  const dailyActiveUsers = membersWithAccounts.filter(m =>
    m.last_active_at && new Date(m.last_active_at) >= oneDayAgo
  ).length;

  const weeklyActiveUsers = membersWithAccounts.filter(m =>
    m.last_active_at && new Date(m.last_active_at) >= oneWeekAgo
  ).length;

  const monthlyActiveUsers = membersWithAccounts.filter(m =>
    m.last_active_at && new Date(m.last_active_at) >= oneMonthAgo
  ).length;

  const activityMetrics: ActivityMetrics = {
    dailyActiveUsers,
    weeklyActiveUsers,
    monthlyActiveUsers,
    newUsersThisWeek,
    newUsersThisMonth,
  };

  // Calculate user status for each user
  const userStatuses: Record<string, UserStatus> = {};
  allUsers.forEach(user => {
    const childrenInHousehold = childrenData?.filter(c => c.household_id === user.household_id) || [];

    // Only admin/owner has completed onboarding (they created the household)
    const isAdmin = user.role === 'admin' || user.role === 'owner';
    const householdSetup = !!user.household?.name && user.household.name !== 'Ingen husstand' && childrenInHousehold.length > 0;

    userStatuses[user.id] = {
      hasAccount: !!user.user_id,
      hasCompletedOnboarding: !!user.user_id && isAdmin && householdSetup,
      childCount: childrenInHousehold.length,
      lastActiveAt: user.last_active_at || undefined,
      isPremium: user.is_premium || false,
    };
  });

  // Fetch GDPR requests
  const { data: gdprRequests, error: gdprError } = await supabaseAdmin
    .from('gdpr_requests')
    .select('*')
    .order('requested_at', { ascending: false });

  if (gdprError) {
    console.error('Error fetching GDPR requests:', gdprError);
  }

  const pendingGDPRCount = gdprRequests?.filter(r => r.status === 'pending' || r.status === 'in_progress').length || 0;

  return {
    members: allUsers,
    children: childrenData || [],
    userStatuses,
    activityMetrics,
    gdprRequests: gdprRequests || [],
    stats: {
      totalUsers: totalAuthUsers,
      totalHouseholds: uniqueHouseholds.size,
      totalChildren: childrenData?.length || 0,
      premiumUsers,
      pendingGDPR: pendingGDPRCount,
    }
  };
}

export default async function AdminDashboard() {
  const { members, children, userStatuses, activityMetrics, gdprRequests, stats } = await getAdminData();

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Admin Dashboard</h1>
          <p className="text-muted">Oversikt over brukere, statistikk og GDPR</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Totalt antall brukere</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.totalUsers}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Totalt antall hushold</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.totalHouseholds}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Totalt antall barn</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.totalChildren}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Premium brukere</p>
                <p className="text-3xl font-bold text-foreground mt-2">{stats.premiumUsers}</p>
                <p className="text-xs text-light mt-1">{((stats.premiumUsers / stats.totalUsers) * 100).toFixed(0)}% av totalt</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-secondary-light">
                <svg className="w-6 h-6 text-secondary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Daglige aktive (DAU)</p>
                <p className="text-3xl font-bold text-foreground mt-2">{activityMetrics.dailyActiveUsers}</p>
                <p className="text-xs text-light mt-1">Siste 24 timer</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Ukentlige aktive (WAU)</p>
                <p className="text-3xl font-bold text-foreground mt-2">{activityMetrics.weeklyActiveUsers}</p>
                <p className="text-xs text-light mt-1">Siste 7 dager</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Nye brukere (7 dager)</p>
                <p className="text-3xl font-bold text-foreground mt-2">{activityMetrics.newUsersThisWeek}</p>
                <p className="text-xs text-light mt-1">Siste uke</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Nye brukere (30 dager)</p>
                <p className="text-3xl font-bold text-foreground mt-2">{activityMetrics.newUsersThisMonth}</p>
                <p className="text-xs text-light mt-1">Siste måned</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-card-elevated rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted">Månedlige aktive brukere</p>
                <p className="text-3xl font-bold text-foreground mt-2">{activityMetrics.monthlyActiveUsers}</p>
                <p className="text-xs text-light mt-1">Siste 30 dager</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center border-2 border-primary-light">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <AdminTabs
          tabs={[
            {
              id: 'users',
              label: 'Brukere & Barn',
              count: stats.totalUsers,
              content: (
                <>
                  {/* Users Table */}
                  <div className="bg-card-elevated rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Brukere</h2>
            <p className="text-sm text-muted mt-1">Alle registrerte brukere i systemet</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-card">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Navn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Hushold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Rolle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Onboarding
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Sist aktiv
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Barn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Premium
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Handlinger
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card-elevated/50 divide-y divide-border">
                {members.map((member) => {
                  const status = userStatuses[member.id];
                  const isAdmin = member.role === 'admin' || member.role === 'owner';
                  const hasNoHousehold = member.role === 'none';

                  // Determine onboarding status display
                  let onboardingStatus: 'completed' | 'incomplete' | 'na' = 'na';
                  if (status?.hasCompletedOnboarding) {
                    onboardingStatus = 'completed';
                  } else if (hasNoHousehold || (isAdmin && status?.hasAccount)) {
                    // User with no household OR admin with account but no household setup
                    onboardingStatus = 'incomplete';
                  }

                  return (
                    <tr key={member.id} className="hover:bg-card">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{member.display_name || 'Ikke satt'}</div>
                        {member.email && (
                          <div className="text-xs text-light">{member.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-foreground">{member.household?.name || 'Ukjent'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasNoHousehold ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-warning text-warning">
                            Venter
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-primary-light text-primary-light">
                            {member.role}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {onboardingStatus === 'completed' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-primary-light text-primary-light">
                            ✓ Fullført
                          </span>
                        )}
                        {onboardingStatus === 'incomplete' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-error text-error">
                            ✗ Ikke fullført
                          </span>
                        )}
                        {onboardingStatus === 'na' && (
                          <span className="px-2 inline-flex text-xs leading-5 font-medium text-light">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status?.lastActiveAt ? (
                          <div className="text-sm text-foreground">
                            {dayjs(status.lastActiveAt).format('DD.MM.YY HH:mm')}
                          </div>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-medium text-light">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                        {status ? status.childCount : 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {status?.isPremium ? (
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full border border-secondary-light text-secondary-light">
                            ⭐ Premium
                          </span>
                        ) : (
                          <span className="px-2 inline-flex text-xs leading-5 font-medium rounded-full border border-light text-light">
                            Free
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {status ? (
                          <UserActions
                            memberId={member.id}
                            userId={member.user_id}
                            hasAccount={status.hasAccount}
                            displayName={member.display_name}
                            isPremium={status.isPremium}
                          />
                        ) : (
                          <span className="text-xs text-light">N/A</span>
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
        <div className="bg-card-elevated rounded-lg shadow">
          <div className="px-6 py-4 border-b border-border">
            <h2 className="text-xl font-semibold text-foreground">Barn</h2>
            <p className="text-sm text-muted mt-1">Alle barn registrert i systemet</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-card">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted uppercase tracking-wider">
                    Navn
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-amber-dark uppercase tracking-wider">
                    Hushold
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card-elevated/50 divide-y divide-border">
                {children.map((child) => (
                  <tr key={child.id} className="hover:bg-card-hover">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-foreground">{child.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-foreground">{child.household?.name || 'Ukjent'}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
                </>
              ),
            },
            {
              id: 'gdpr',
              label: 'GDPR Requests',
              count: stats.pendingGDPR,
              content: (
                <div className="bg-card-elevated rounded-lg shadow p-6">
                  <GDPRRequests requests={gdprRequests} />
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
