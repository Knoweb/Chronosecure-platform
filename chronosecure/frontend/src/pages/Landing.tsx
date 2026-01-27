import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock,
  Fingerprint,
  Globe2,
  ShieldCheck,
  Sparkles,
  Timer,
  Users,
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

const pricing = [
  {
    name: 'Starter',
    price: '$49',
    note: 'per month, up to 25 employees',
    features: ['Biometric fingerprint scanning', 'Photo capture verification', 'Basic reporting', 'Email support'],
    cta: 'Start Free Trial',
    popular: false,
  },
  {
    name: 'Professional',
    price: '$149',
    note: 'per month, up to 100 employees',
    features: [
      'Everything in Starter',
      'Advanced analytics & reporting',
      'Payroll integrations',
      'Multi-location support',
      'Priority support',
    ],
    cta: 'Start Free Trial',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    note: 'Contact us for pricing',
    features: [
      'Everything in Professional',
      'Unlimited employees',
      'Custom integrations',
      'Dedicated account manager',
      '24/7 premium support',
    ],
    cta: 'Contact Sales',
    popular: false,
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white text-foreground">
      {/* Top nav */}
      <header className="border-b bg-white sticky top-0 z-20">
        <div className="max-w-6xl md:max-w-7xl mx-auto px-6 md:px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ChronoSecure</span>
          </div>
          <nav className="hidden md:flex items-center gap-10 text-sm font-medium">
            <a className="text-muted-foreground hover:text-foreground" href="#features">Features</a>
            <a className="text-muted-foreground hover:text-foreground" href="#details">Product</a>
            <a className="text-muted-foreground hover:text-foreground" href="#pricing">Pricing</a>
            <a className="text-muted-foreground hover:text-foreground" href="#security">Security</a>
          </nav>
          <div className="flex items-center gap-3 text-sm font-medium">
            <Link to="/login" className="hover:underline">Sign In</Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 transition"
            >
              Start Free Trial <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl md:max-w-7xl mx-auto px-6 md:px-8 py-14 lg:py-18 space-y-16">
        {/* Hero */}
        <section className="grid lg:grid-cols-[1.05fr,0.95fr] gap-16 items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold">
              Trusted by 500+ companies worldwide
            </div>
            <h1 className="text-4xl md:text-5xl xl:text-[58px] font-bold leading-[1.05]">
              Attendance Tracking <span className="block text-primary">Reimagined</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              Secure biometric time tracking with automated payroll calculations. ChronoSecure combines
              fingerprint verification and photo capture to eliminate time theft and ensure compliance.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-primary-foreground text-sm md:text-base font-semibold hover:bg-primary/90 transition"
              >
                Start Free 14-Day Trial <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/kiosk"
                className="inline-flex items-center gap-2 rounded-full border px-7 py-3.5 text-sm md:text-base font-semibold hover:bg-accent transition"
              >
                Watch Demo
              </Link>
            </div>
            <div className="text-sm md:text-base text-muted-foreground flex flex-wrap gap-5">
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> No credit card required</span>
              <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" /> GDPR &amp; BIPA compliant</span>
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border bg-card shadow-xl">
            <img
              src="/hero-biometric.jpg"
              alt="ChronoSecure biometric attendance dashboard"
              className="w-full h-[520px] object-cover"
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
        <section id="features" className="space-y-8">
          <div className="text-center space-y-3">
            <Sparkles className="h-5 w-5 text-primary mx-auto" />
            <h2 className="text-3xl font-bold">Everything You Need for Modern Attendance</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Powerful features designed to streamline workforce management and eliminate time fraud.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map(({ title, desc, Icon }) => (
              <div key={title} className="p-6 bg-white border rounded-xl shadow-sm hover:shadow-md transition min-h-[240px]">
                <div className="h-11 w-11 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-5">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
              ChronoSecure takes data protection seriously. We’re fully compliant with international privacy
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
        <section id="pricing" className="space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground text-sm md:text-base">
              Choose the plan that fits your business size. All plans include core features.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {pricing.map((tier) => (
              <div
                key={tier.name}
                className={`p-6 bg-white border rounded-2xl shadow-sm hover:shadow-md transition ${tier.popular ? 'border-primary shadow-primary/20' : ''
                  }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">{tier.name}</h3>
                  {tier.popular && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
                      Popular
                    </span>
                  )}
                </div>
                <div className="text-4xl font-bold mb-1">{tier.price}</div>
                <p className="text-sm text-muted-foreground mb-4">{tier.note}</p>
                <button
                  className={`w-full rounded-full h-12 px-4 py-2 font-semibold text-sm transition ${tier.popular ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'border hover:bg-accent'
                    }`}
                >
                  {tier.cta}
                </button>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="bg-primary text-primary-foreground rounded-2xl p-10 md:p-12 shadow-lg text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-bold">Ready to Transform Your Attendance Management?</h2>
          <p className="text-primary-foreground/90 text-sm md:text-base">
            Join hundreds of companies already saving time and reducing payroll errors with ChronoSecure.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-full bg-white text-primary px-6 py-3 text-sm md:text-base font-semibold hover:bg-white/90 transition"
            >
              Start Free 14-Day Trial
            </Link>
            <Link
              to="/kiosk"
              className="inline-flex items-center gap-2 rounded-full border border-white px-6 py-3 text-sm md:text-base font-semibold hover:bg-white/10 transition"
            >
              Schedule a Demo
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t bg-white">
        <div className="max-w-6xl mx-auto px-6 py-8 text-sm text-muted-foreground flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">ChronoSecure</span>
          </div>
          <div className="flex items-center gap-6">
            <a className="hover:underline" href="#features">Features</a>
            <a className="hover:underline" href="#pricing">Pricing</a>
            <a className="hover:underline" href="#security">Security</a>
          </div>
          <span className="text-xs">&copy; 2025 ChronoSecure. All rights reserved.</span>
        </div>
      </footer>
    </div>
  )
}
