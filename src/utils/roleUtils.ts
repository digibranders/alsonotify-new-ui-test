export type UserRole = 'Admin' | 'Manager' | 'Leader' | 'Employee';

/**
 * Minimal type for user objects passed to getRoleFromUser.
 * Only includes properties that the function actually accesses.
 */
interface RoleLike {
  id?: number;
  name?: string;
}

interface UserLike {
  role?: RoleLike | null;
  role_id?: number | null;
  user_employee?: {
    role?: RoleLike | null;
    role_id?: number | null;
  } | null;
}

export const getRoleFromUser = (user: UserLike | null | undefined): UserRole => {
    if (!user) return 'Employee';

    // 1. Try Role Name (Most reliable)
    const roleName = user?.role?.name || user?.user_employee?.role?.name;
    if (roleName) {
        const roleLower = roleName.toLowerCase();
        if (roleLower.includes('admin')) return 'Admin';
        if (roleLower.includes('manager')) return 'Manager';
        if (roleLower.includes('leader')) return 'Leader';
        if (roleLower.includes('hr')) return 'Employee'; // HR maps to Employee access level in current UI
        if (roleLower.includes('finance')) return 'Employee'; // Finance maps to Employee in current UI
    }

    // 2. Try Role ID (Fallback / Legacy)
    const roleId = user?.role_id ||
        user?.user_employee?.role_id ||
        user?.role?.id;

    if (roleId) {
        const roleIdMapping: Record<number, UserRole> = {
            1: 'Admin',
            2: 'Employee',
            3: 'Employee', // HR
            4: 'Admin',
            5: 'Leader',
            6: 'Employee', // Finance
            7: 'Manager',
        };
        if (roleIdMapping[roleId]) {
            return roleIdMapping[roleId];
        }
    }

    return 'Employee';
};
