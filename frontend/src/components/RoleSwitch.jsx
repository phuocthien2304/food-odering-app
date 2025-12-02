export function RoleSwitch({ userType, children }) {
  const roleMap = {
    CUSTOMER: children[0],
    RESTAURANT_STAFF: children[1],
    ADMIN: children[2],
  }

  return roleMap[userType] || null
}
