import { Toaster } from 'sonner'
import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

export default function GlobalToaster() {
  const { isDark } = useContext(ThemeContext)

  return (
    <Toaster 
      position="bottom-right"
      theme={isDark ? 'dark' : 'light'}
      visibleToasts={4}
      duration={4500}
      closeButton
      toastOptions={{
        className: 'cmg-toast',
      }}
    />
  )
}
