import { SignupForm } from "@/components/auth/signup-form"
import { Clock } from "lucide-react"
import Link from "next/link"

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left side - Branding */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-primary text-primary-foreground">
        <div className="flex items-center gap-2">
          <Clock className="h-8 w-8" />
          <span className="font-bold text-2xl">ChronoSecure</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-balance leading-tight">Start tracking attendance in minutes</h1>
          <p className="text-lg text-primary-foreground/90 text-pretty leading-relaxed">
            Join hundreds of companies using ChronoSecure to eliminate time theft and streamline payroll.
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              <span className="text-sm">14-day free trial, no credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              <span className="text-sm">GDPR & BIPA compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary-foreground" />
              <span className="text-sm">24/7 customer support</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-primary-foreground/80">&copy; 2025 ChronoSecure. All rights reserved.</div>
      </div>

      {/* Right side - Signup Form */}
      <div className="flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2 text-center">
            <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
              <Clock className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">ChronoSecure</span>
            </div>
            <h2 className="text-3xl font-bold">Create your account</h2>
            <p className="text-muted-foreground">Start your 14-day free trial today</p>
          </div>
          <SignupForm />
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
