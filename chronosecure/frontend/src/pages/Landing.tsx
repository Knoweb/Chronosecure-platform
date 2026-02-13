import { Link } from 'react-router-dom'
import { useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Users,
  Timer,
  Fingerprint,
  Globe2,
  Sparkles,
  BarChart3,
  Menu,
  X
} from 'lucide-react'

const stats = [
  { value: '99.9%', label: 'Uptime SLA' },
  { value: '500+', label: 'Companies' },
  { value: '50K+', label: 'Active Users' },
  { value: '30%', label: 'Time Savings' },
]

const features = [
  { title: 'Biometric Verification', desc: 'Advanced fingerprint scanning with photo capture prevents buddy punching.', Icon: Fingerprint },
  { title: 'Automated Time Tracking', desc: 'Clock in/out with overtime, breaks, and grace periods handled automatically.', Icon: Timer },
  { title: 'Payroll Integration', desc: 'Export attendance to payroll with accurate wage calculations.', Icon: BarChart3 },
  { title: 'Enterprise Security', desc: 'Bank-level encryption with GDPR, BIPA, and APP compliance, audited controls.', Icon: ShieldCheck },
  { title: 'Team Management', desc: 'Organize teams, departments, shifts, PTO, and flexible scheduling.', Icon: Users },
  { title: 'Multi-Location Support', desc: 'Manage attendance across sites with geofencing and location controls.', Icon: Globe2 },
]



export default function LandingPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-white text-foreground selection:bg-primary/10 selection:text-primary">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] opacity-[0.03]"></div>
      {/* Top nav */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-6xl md:max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity shrink-0">
            <div className="relative bg-slate-900 p-1.5 md:p-2 rounded-lg shadow-md">
              <CheckCircle2 className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-2xl md:text-3xl tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
              AttendWatch
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a className="text-muted-foreground hover:text-foreground transition-colors" href="#features">Features</a>
            <a className="text-muted-foreground hover:text-foreground transition-colors" href="#details">Product</a>

            <a className="text-muted-foreground hover:text-foreground transition-colors" href="#security">Security</a>
          </nav>
          <div className="flex items-center gap-2 md:gap-4 text-sm font-medium">
            <div className="hidden md:flex items-center gap-2 md:gap-4">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-3 py-1.5 md:px-6 md:py-2.5 text-xs md:text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 md:px-6 md:py-2.5 text-xs md:text-sm font-medium text-white hover:bg-slate-800 transition-colors"
              >
                <span className="hidden sm:inline">Start Free Trial</span>
                <span className="sm:hidden">Get Started</span>
                <ArrowRight className="h-3 w-3 md:h-4 md:w-4" />
              </Link>
            </div>
            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-slate-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white absolute top-full left-0 w-full shadow-lg py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2">
            <nav className="flex flex-col gap-4 text-base font-medium">
              <a className="text-muted-foreground hover:text-foreground transition-colors" href="#features" onClick={() => setIsMobileMenuOpen(false)}>Features</a>
              <a className="text-muted-foreground hover:text-foreground transition-colors" href="#details" onClick={() => setIsMobileMenuOpen(false)}>Product</a>

              <a className="text-muted-foreground hover:text-foreground transition-colors" href="#security" onClick={() => setIsMobileMenuOpen(false)}>Security</a>
            </nav>
            <div className="flex flex-col gap-3 pt-4 border-t">
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-lg bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl md:max-w-7xl mx-auto px-4 md:px-8 py-4 lg:py-8 space-y-12 md:space-y-16">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1.05fr,0.95fr] gap-10 md:gap-16 items-center pt-4 md:pt-8 pb-16">
          <div className="space-y-8 text-center lg:text-left relative z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-800 border border-slate-200 px-4 py-1.5 text-sm font-semibold shadow-sm transition-transform hover:scale-105">
              <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Trusted by 500+ companies worldwide
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-slate-900 leading-[0.9] text-balance mb-6 mt-4">
              Secure Time <br className="hidden lg:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-violet-600">Tracking</span> Simplified.
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Experience the future of workforce management with our biometric-secure platform. Precision, speed, and reliability.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Link
                to="/signup"
                className="inline-flex justify-center items-center gap-2 rounded-full border-2 border-slate-900 bg-slate-900 px-8 py-3.5 text-white text-sm font-bold hover:bg-white hover:text-slate-900 transition-all shadow-lg hover:shadow-xl"
              >
                Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/kiosk"
                className="inline-flex justify-center items-center gap-2 rounded-full border border-slate-200 bg-white px-8 py-3.5 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
              >
                Watch Demo
              </Link>
            </div>
            <div className="text-xs md:text-sm text-muted-foreground flex flex-wrap gap-4 justify-center lg:justify-start">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-primary" /> GDPR &amp; BIPA compliant</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl mx-4 lg:mx-0">
            <img
              src="/hero-biometric.jpg"
              alt="AttendWatch biometric attendance dashboard"
              className="w-full h-[240px] md:h-[400px] lg:h-[520px] object-cover"
            />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((s) => (
            <div key={s.label} className="p-4">
              <p className="text-3xl md:text-4xl font-bold">{s.value}</p>
              <p className="text-sm md:text-base text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </section>

        {/* Features */}
        <section id="features" className="py-8 md:py-16 relative">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-4">
            <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">
              Powerful Features for <br className="hidden md:block" />
              <span className="text-primary">Modern Teams</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Everything you need to streamline workforce management, eliminate time theft, and run payroll with confidence.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 max-w-6xl mx-auto px-4 md:px-0">
            {features.map(({ title, desc, Icon }) => (
              <div
                key={title}
                className="group relative bg-white p-4 md:p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col items-center text-center"
              >
                <div className="mx-auto h-10 w-10 md:h-12 md:w-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                  <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>

                <h3 className="text-sm md:text-lg font-bold mb-1 md:mb-2 text-slate-900 leading-tight">{title}</h3>
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed hidden sm:block">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Product detail rows */}
        <section id="details" className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Detailed, Compliance-First Workflow</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Biometric capture, liveness, payroll-ready exports, and audited access for GDPR, BIPA, and APPI.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 justify-center text-xs md:text-sm">
            {['GDPR', 'BIPA', 'APPI', 'APP (Australia)', 'Zero-trust JWT', 'Encrypted at rest'].map((badge) => (
              <span key={badge} className="px-3 py-1 rounded-full border bg-white">{badge}</span>
            ))}
          </div>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="p-6 bg-white border rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <Fingerprint className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Biometric + Liveness</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Capture fingerprint hash and photo with liveness checks. No raw biometrics stored; hashes are encrypted at rest.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Hash-only storage, no raw images (BIPA).</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Explicit consent + audit trail (GDPR/APPI).</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Liveness prompts to prevent spoofing.</li>
              </ul>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <Timer className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Payroll-Ready Calculations</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Clock in/out with breaks, overtime rules, weekends, and public holidays included in net-hours.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Net hours = total minus breaks, by policy.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Weekend/holiday differentials supported.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Export to payroll-ready CSV/XLSX.</li>
              </ul>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Analytics & Reporting</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Real-time dashboards, attendance status, and downloadable XLSX reports for finance and HR.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Live presence, tardiness, and absenteeism views.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Company/tenant isolation for multi-tenant safety.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> XLSX via Apache POI (backend) and CSV exports.</li>
              </ul>
            </div>
            <div className="p-6 bg-white border rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <h3 className="text-xl font-semibold">Security & Access Control</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Zero-trust APIs with JWT, RBAC (Super Admin, Company Admin, Employee), and audited access logs.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Role-based endpoints and stateless JWT.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Encrypted at rest; transport via TLS.</li>
                <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> Access logs for personal data (APPI/GDPR).</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="security" className="grid lg:grid-cols-2 gap-10 items-center">
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
            <img
              src="/security-shield.jpg"
              alt="Security and compliance"
              className="w-full h-[400px] object-cover"
            />
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-3xl font-bold">Security & Compliance First</h2>
            </div>
            <p className="text-muted-foreground">
              AttendWatch takes data protection seriously. We’re fully compliant with international privacy
              regulations and employ industry-leading security measures.
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> GDPR Compliant</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> BIPA Certified</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> AES-256 Encryption</li>
              <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> SOC 2 Type II</li>
            </ul>
          </div>
        </section>

        {/* Pricing */}


        {/* CTA banner */}
        <section className="bg-slate-900 text-white rounded-2xl p-10 md:p-12 shadow-lg text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Attendance Management?</h2>
          <p className="text-primary-foreground/90 text-sm md:text-base">
            Join hundreds of companies already saving time and reducing payroll errors with AttendWatch.
          </p>
          <div className="flex flex-wrap justify-center gap-8">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white text-slate-900 px-8 py-4 text-sm md:text-base font-semibold hover:bg-white/90 transition"
            >
              Start Free 14-Day Trial
            </Link>
            <Link
              to="/kiosk"
              className="inline-flex items-center gap-2 rounded-full border border-white px-8 py-4 text-sm md:text-base font-semibold hover:bg-white/10 transition"
            >
              Schedule a Demo
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-slate-50 pt-12 pb-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                </div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900">AttendWatch</span>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
                The modern standard for biometric time and attendance. Secure, accurate, and completely automated.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>

                <li><a href="#security" className="hover:text-primary transition-colors">Security</a></li>
                <li><Link to="/kiosk" className="hover:text-primary transition-colors">Kiosk Mode</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-slate-900 mb-4">Connect</h4>
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-slate-200 hover:bg-primary hover:text-white transition-colors cursor-pointer flex items-center justify-center text-xs">𝕏</div>
                <div className="h-8 w-8 rounded-full bg-slate-200 hover:bg-primary hover:text-white transition-colors cursor-pointer flex items-center justify-center text-xs">in</div>
                <div className="h-8 w-8 rounded-full bg-slate-200 hover:bg-primary hover:text-white transition-colors cursor-pointer flex items-center justify-center text-xs">fb</div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4 text-center md:text-left">
            <p className="text-xs text-slate-400">&copy; 2025 AttendWatch. All rights reserved.</p>
            <div className="flex justify-center md:justify-end gap-6 text-xs text-slate-400">

            </div>
          </div>
        </div>
      </footer>
    </div >
  )
}
