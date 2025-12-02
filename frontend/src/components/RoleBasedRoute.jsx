export function RoleBasedRoute({ user, requiredRole, children }) {
  if (!user) {
    return (
      <div className="access-denied">
        <p>Please log in to access this page</p>
      </div>
    )
  }

  if (requiredRole && user.userType !== requiredRole) {
    return (
      <div className="access-denied">
        <p>You don't have permission to access this page</p>
        <p>Required role: {requiredRole}</p>
      </div>
    )
  }

  return children
}
