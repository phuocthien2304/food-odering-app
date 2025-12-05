export function RoleBasedRoute({ user, requiredRole, children }) {
  if (!user) {
    return (
      <div className="access-denied">
        <p>Vui lòng đăng nhập để truy cập trang này</p>
      </div>
    )
  }

  if (requiredRole && user.userType !== requiredRole) {
    return (
      <div className="access-denied">
        <p>Bạn không có quyền truy cập trang này</p>
        <p>Vai trò yêu cầu: {requiredRole}</p>
      </div>
    )
  }

  return children
}
