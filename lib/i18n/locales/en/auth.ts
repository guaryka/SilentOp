export const auth = {
  login: {
    title: 'Sign In',
    subtitle: 'Access your trading dashboard',
    welcomeBack: 'Welcome Back to SilentOp',
    welcomeDesc: 'Access your trading analytics, journal daily sessions, and track your prop firm performance.'
  },
  register: {
    title: 'Create Account',
    subtitle: 'Join our trading ecosystem',
    welcomeTitle: 'Start Your Trading Journal',
    welcomeDesc: 'Log your setups, spot bad habits, and build an institutional-grade track record today.'
  },
  fields: {
    email: 'Email address',
    emailPlaceholder: 'trader@example.com',
    password: 'Password',
    passwordPlaceholder: '••••••••',
    confirmPassword: 'Confirm Password',
    displayName: 'Display Name',
    displayNamePlaceholder: 'John Trader',
    forgotPassword: 'Forgot password?',
    agreeTerms: 'I agree to the',
    termsAndConditions: 'Terms & Conditions'
  },
  validation: {
    emailRequired: 'Email is required',
    emailInvalid: 'Invalid email address',
    passwordRequired: 'Password is required',
    passwordMinLength: 'Password must be at least 6 characters',
    displayNameRequired: 'Display Name is required',
    displayNameMinLength: 'Name must be at least 2 characters',
    passwordMismatch: 'Passwords do not match',
    termsRequired: 'You must agree to the Terms & Conditions'
  },
  success: {
    title: 'Check your email!',
    desc: 'We\'ve sent an activation link to {email}. Please click it to verify your account.',
    backToLogin: 'Back to Sign In'
  },
  error: {
    failed: 'Authentication failed. Please try again.'
  }
}
