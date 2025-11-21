import { useState } from 'react'
import { motion } from 'framer-motion'
import { GoogleLogin, CredentialResponse } from '@react-oauth/google'
import { jwtDecode } from 'jwt-decode'
import ChariotLoader from '../components/ChariotLoader'

interface LoginPageProps {
  onLoginSuccess?: (userData: any) => void
}

export default function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleSuccess = (credentialResponse: CredentialResponse) => {
    setIsLoading(true)
    
    try {
      // Decode the JWT token to get user info
      const decoded: any = jwtDecode(credentialResponse.credential!)
      
      const userData = {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name,
        picture: decoded.picture,
      }
      
      console.log('Login successful:', userData)
      
      // Simulate a brief loading animation
      setTimeout(() => {
        setIsLoading(false)
        onLoginSuccess?.(userData)
      }, 1500)
    } catch (error) {
      console.error('Login failed:', error)
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('Google login failed')
    setIsLoading(false)
  }

  const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY || ''

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Blurred Map Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(https://api.maptiler.com/maps/voyager/static/0,20,2/1200x800@2x.png?key=${MAPTILER_KEY})`,
          filter: 'blur(8px)',
          transform: 'scale(1.1)',
        }}
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-slate-800/30 to-blue-800/40" />

      {/* Login Card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-md"
        >
          <div className="bg-white/90 backdrop-blur-md shadow-2xl rounded-3xl border border-white/20 p-8 md:p-12">
            
            {isLoading ? (
              // Loading State
              <div className="flex flex-col items-center justify-center py-12">
                <ChariotLoader size="lg" />
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="mt-6 text-slate-600 font-medium"
                >
                  Signing you in...
                </motion.p>
              </div>
            ) : (
              // Login Form
              <>
                {/* Logo Animation */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="flex justify-center mb-8"
                >
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <svg 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="w-12 h-12"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2 v 7" />
                      <path d="M12 15 v 7" />
                      <path d="M22 12 h -7" />
                      <path d="M9 12 h -7" />
                      <path d="m19.07 4.93-5 5" />
                      <path d="m9.93 14.07-5 5" />
                      <path d="m4.93 4.93 5 5" />
                      <path d="m14.07 14.07 5 5" />
                    </svg>
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-slate-800 tracking-tight text-center mb-3"
                >
                  Welcome to Chariot
                </motion.h1>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-600 text-center mb-8"
                >
                  Track global crises and find ways to help
                </motion.p>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-3 mb-6"
                >
                  <div className="h-px flex-1 bg-slate-200" />
                  <span className="text-xs text-slate-500 font-medium">
                    SECURE AUTHENTICATION
                  </span>
                  <div className="h-px flex-1 bg-slate-200" />
                </motion.div>

                {/* Google Login Button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="flex justify-center"
                >
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    useOneTap
                    theme="outline"
                    size="large"
                    text="signin_with"
                    shape="rectangular"
                  />
                </motion.div>

                {/* Terms */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="text-xs text-slate-500 text-center mt-8"
                >
                  By signing in, you agree to our{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms of Service
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </motion.p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
