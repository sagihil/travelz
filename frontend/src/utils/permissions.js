// utils/permissions.js
// Single source of truth for role-based access control on the frontend.
// The backend enforces the same rules via authMiddleware + ownership checks.
// The frontend mirrors them to hide/show UI elements and guard handlers.

const ROLE_PERMISSIONS = {
  admin: {
    canCreateUser:        true,
    canEditUser:          true,
    canDeleteUser:        true,
    canCreateAttraction:  true,
    canEditAttraction:    true,
    canDeleteAttraction:  true,
    canViewAttractions:   true,
    canManageOwnProfile:  true,
    canViewAllTrips:      true,
    canViewOwnTrips:      true,
    canManageOwnTrips:    true,
    canEditAnyTrip:       true,
    canDeleteAnyTrip:     true,
    canAddToTrip:         true,
  },
  manager: {
    canCreateUser:        false,
    canEditUser:          true,
    canDeleteUser:        false,
    canCreateAttraction:  true,
    canEditAttraction:    true,
    canDeleteAttraction:  false,
    canViewAttractions:   true,
    canManageOwnProfile:  true,
    canViewAllTrips:      true,   // can see all trips for monitoring
    canViewOwnTrips:      true,
    canManageOwnTrips:    true,   // can create/edit/delete own trips
    canEditAnyTrip:       false,  // cannot edit other users' trips
    canDeleteAnyTrip:     false,  // cannot delete other users' trips
    canAddToTrip:         true,   // can add/remove attractions in own trips
  },
  user: {
    canCreateUser:        false,
    canEditUser:          false,
    canDeleteUser:        false,
    canCreateAttraction:  true,   // any logged-in user may add a new attraction
    canEditAttraction:    false,
    canDeleteAttraction:  false,
    canViewAttractions:   true,   // browse the attractions list
    canManageOwnProfile:  true,   // update own settings / profile
    canViewAllTrips:      false,  // only sees own trips
    canViewOwnTrips:      true,
    canManageOwnTrips:    true,   // create, edit, delete own trips
    canEditAnyTrip:       false,
    canDeleteAnyTrip:     false,
    canAddToTrip:         true,   // add attractions to own trips
  },
};

// Human-readable labels for the Role Overview card.
// Only keys that are true for a role will appear.
export const PERMISSION_LABELS = {
  canViewAttractions:   'View Attractions',
  canCreateAttraction:  'Create Attractions',
  canEditAttraction:    'Edit Attractions',
  canDeleteAttraction:  'Delete Attractions',
  canCreateUser:        'Create Users',
  canEditUser:          'Edit Users',
  canDeleteUser:        'Delete Users',
  canManageOwnProfile:  'Manage Own Profile',
  canViewAllTrips:      'View All Trips',
  canViewOwnTrips:      'View Own Trips',
  canManageOwnTrips:    'Create / Edit / Delete Own Trips',
  canEditAnyTrip:       'Edit Any Trip',
  canDeleteAnyTrip:     'Delete Any Trip',
  canAddToTrip:         'Add Attractions to Own Trips',
};

export const getPermissions = (role) =>
  ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user;

export const can = (role, action) =>
  Boolean((ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.user)[action]);

// Returns true if the given role can edit the specified trip.
// Admin can edit any trip. User and manager can only edit their own.
export const canEditTrip = (role, tripUserId, currentUserId) => {
  if (role === 'admin') return true;
  return Number(tripUserId) === Number(currentUserId);
};

// Returns true if the given role can delete the specified trip.
// Admin can delete any trip. User and manager can only delete their own.
export const canDeleteTrip = (role, tripUserId, currentUserId) => {
  if (role === 'admin') return true;
  return Number(tripUserId) === Number(currentUserId);
};

// Returns true if the given role can add/remove attractions for the specified trip.
export const canModifyTripAttractions = (role, tripUserId, currentUserId) => {
  if (role === 'admin') return true;
  return Number(tripUserId) === Number(currentUserId);
};
