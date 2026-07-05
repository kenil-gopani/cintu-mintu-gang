import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { useTheme } from './hooks/useTheme'
import { ErrorBoundary } from './components/common/ErrorBoundary'
import CustomCursor from './components/common/CustomCursor'
import { PageSpinner } from './components/common/Skeletons'

// Lazy Load Pages
const Landing           = lazy(() => import('./pages/Landing'))
const Login             = lazy(() => import('./pages/Login'))
const Register          = lazy(() => import('./pages/Register'))
const ForgotPassword    = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword     = lazy(() => import('./pages/ResetPassword'))
const EmailVerification = lazy(() => import('./pages/EmailVerification'))
const OtpVerification   = lazy(() => import('./pages/OtpVerification'))
const Home              = lazy(() => import('./pages/Home'))
const Gallery           = lazy(() => import('./pages/Gallery'))
const Chat              = lazy(() => import('./pages/Chat'))
const Events            = lazy(() => import('./pages/Events'))
const Members           = lazy(() => import('./pages/Members'))
const FamilyTree        = lazy(() => import('./pages/FamilyTree'))
const Profile           = lazy(() => import('./pages/Profile'))
const Birthdays         = lazy(() => import('./pages/Birthdays'))
const Games             = lazy(() => import('./pages/Games'))
const Admin             = lazy(() => import('./pages/Admin'))
const NotFound          = lazy(() => import('./pages/NotFound'))

// Layout (Not lazy loaded to ensure fast shell rendering)
import MainLayout     from './components/common/MainLayout'
import ProtectedRoute from './components/common/ProtectedRoute'
import RoleGuard      from './components/common/RoleGuard'

export default function App() {
  const { isDark } = useTheme()

  return (
    <div className={isDark ? 'dark' : ''}>
      <ErrorBoundary>
        <div className="min-h-screen bg-light-bg dark:bg-dark-bg text-light-text dark:text-dark-text transition-colors duration-300 overflow-x-hidden">
          <CustomCursor />
          <AnimatePresence mode="wait">
            <Suspense fallback={<PageSpinner />}>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/"                 element={<Landing />} />
                <Route path="/login"            element={<Login />} />
                <Route path="/register"         element={<Register />} />
                <Route path="/forgot-password"  element={<ForgotPassword />} />
                <Route path="/reset-password"   element={<ResetPassword />} />
                <Route path="/verify-email"     element={<EmailVerification />} />
                <Route path="/verify-otp"       element={<OtpVerification />} />

                {/* Private — wrapped in MainLayout (Navbar + Sidebar) */}
                <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                  
                  {/* Accessible by everyone */}
                  <Route path="/home"         element={<Home />} />
                  <Route path="/gallery"      element={<Gallery />} />
                  <Route path="/events"       element={<Events />} />
                  <Route path="/members"      element={<Members />} />
                  <Route path="/tree"         element={<FamilyTree />} />
                  <Route path="/profile/:id?" element={<Profile />} />

                  {/* Accessible by members and admins only */}
                  <Route element={<RoleGuard allowedRoles={['admin', 'member']} />}>
                    <Route path="/chat"      element={<Chat />} />
                    <Route path="/birthday"  element={<Birthdays />} />
                    <Route path="/games"     element={<Games />} />
                  </Route>

                  {/* Accessible by admins only */}
                  <Route element={<RoleGuard allowedRoles={['admin']} />}>
                    <Route path="/admin" element={<Admin />} />
                  </Route>
                  
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </div>
      </ErrorBoundary>
    </div>
  )
}
