import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4" 
      style={{
        background: 'linear-gradient(135deg, rgba(1, 16, 57, 0.05) 0%, rgba(231, 104, 0, 0.03) 50%, rgba(1, 16, 57, 0.08) 100%)',
        backgroundColor: '#F8F9FA'
      }}
    >
      <Outlet />
    </div>
  )
}
