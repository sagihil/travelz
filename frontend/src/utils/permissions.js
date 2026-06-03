// utils/permissions.js
// ---------------------
// Purpose: Single source of truth for role-based access control on the frontend.
//
// Why define permissions on the frontend at all?
//   The backend enforces authorization via authMiddleware + authorize() for security.
//   The frontend mirrors those exact rules to:
//     1. Hide or show UI elements (buttons, sections) so users never see
//        actions they are not allowed to perform.
//     2. Guard every handler function with a permission check BEFORE calling
//        the API, preventing accidental 403 responses.
//
// Backend authorization matrix (what the server allows):
//   POST   /api/users                   admin
//   PUT    /api/users/:id               admin, manager
//   DELETE /api/users/:id               admin
//   POST   /api/attractions             admin       ← backend restricts to admin
//   PUT    /api/attractions/:id         admin, manager
//   DELETE /api/attractions/:id         admin
//
// ── Why regular users have canCreateAttraction = true ───────────────────────
// The assignment spec explicitly lists "Add/Create attraction" as a capability
// of the regular-user role. Although the backend POST /api/attractions currently
// requires admin, the front-end permission flag drives both the UI visibility
// and the handler guard. If the backend is later updated to allow user-level
// creation, only the backend authorize() middleware needs to change – the
// frontend RBAC logic is already correct.
//
// ── Permission keys used by the Role Overview card ──────────────────────────
// canViewAttractions  and canManageOwnProfile are UI-only permissions that do
// not map to a specific backend route. They are always true for every role and
// exist solely so the Role Overview card can show meaningful capabilities to
// regular users (who would otherwise see an almost-empty list).
//
// Usage:
//   import { can, getPermissions, PERMISSION_LABELS } from '../../utils/permissions.js';
//
//   const permissions = getPermissions('manager');   // full permissions object
//   can('admin', 'canDeleteUser')                    // → true
//   can('manager', 'canDeleteUser')                  // → false

// ---------------------------------------------------------------------------
// Permission matrix – one entry per role
// ---------------------------------------------------------------------------
const ROLE_PERMISSIONS = {
  admin: {
    canCreateUser:       true,
    canEditUser:         true,
    canDeleteUser:       true,
    canCreateAttraction: true,
    canEditAttraction:   true,
    canDeleteAttraction: true,
    canViewAttractions:  true,
    canManageOwnProfile: true,
  },
  manager: {
    canCreateUser:       false,  // managers cannot create new users
    canEditUser:         true,
    canDeleteUser:       false,  // managers cannot delete users
    canCreateAttraction: true,   // managers can create new attractions
    canEditAttraction:   true,
    canDeleteAttraction: false,  // managers cannot delete attractions
    canViewAttractions:  true,
    canManageOwnProfile: true,
  },
  user: {
    canCreateUser:       false,
    canEditUser:         false,  // regular users can only edit their OWN profile (via Settings)
    canDeleteUser:       false,
    // Regular users CAN add attractions – this is an explicit assignment requirement.
    // The backend route currently restricts POST /api/attractions to admin only;
    // if that changes, only the backend authorize() call needs to be updated.
    canCreateAttraction: true,
    canEditAttraction:   false,
    canDeleteAttraction: false,
    canViewAttractions:  true,   // all users can browse attractions
    canManageOwnProfile: true,   // all users can update their own settings
  },
};

// ---------------------------------------------------------------------------
// Human-readable labels – used by the Role Overview card on the Dashboard.
// The order here controls the display order in the UI.
// ---------------------------------------------------------------------------
export const PERMISSION_LABELS = {
  canCreateUser:       'Create Users',
  canEditUser:         'Edit Users',
  canDeleteUser:       'Delete Users',
  canCreateAttraction: 'Create Attractions',
  canEditAttraction:   'Edit Attractions',
  canDeleteAttraction: 'Delete Attractions',
  canViewAttractions:  'View Attractions',
  canManageOwnProfile: 'Manage Own Profile',
};

// ---------------------------------------------------------------------------
// getPermissions(role)
// Returns the complete permissions object for the given role.
// Falls back to the most restrictive set ('user') for unknown/undefined roles.
// ---------------------------------------------------------------------------
export const getPermissions = (role) =>
  ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;

// ---------------------------------------------------------------------------
// can(role, action)
// Returns true if the role is allowed to perform the named action.
// Example: can('manager', 'canDeleteUser') → false
// ---------------------------------------------------------------------------
export const can = (role, action) =>
  Boolean((ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user)[action]);
