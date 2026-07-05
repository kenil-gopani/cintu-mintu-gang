import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

/**
 * A guard to wrap routes that require specific roles.
 * Usage: <RoleGuard allowedRoles={['admin', 'member']}> <Component /> </RoleGuard>
 * Or as a route element: <Route element={<RoleGuard allowedRoles={['admin']} />}> ... </Route>
 */
export default function RoleGuard({ children, allowedRoles }) {
  const { user } = useAuth()
  
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!allowedRoles.includes(user.role)) {
    // If not allowed, redirect to home with a subtle block or to a 403 page.
    // For now, redirect to home.
    return <Navigate to="/home" replace />
  }

  return children ? children : <Outlet />
}
