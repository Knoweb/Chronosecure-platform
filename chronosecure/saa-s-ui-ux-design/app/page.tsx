import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Check, Shield, Clock, Users, BarChart3, Fingerprint, Globe, Zap } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" />
            <span className="font-bold text-xl">ChronoSecure</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#security" className="text-sm font-medium hover:text-primary transition-colors">
              Security
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <Zap className="h-4 w-4" />
              Trusted by 500+ Companies Worldwide
            </div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight text-balance">
              Attendance Tracking <span className="text-primary">Reimagined</span>
            </h1>
            <p className="text-xl text-muted-foreground text-pretty leading-relaxed">
              Secure biometric time tracking with automated payroll calculations. ChronoSecure combines fingerprint
              verification and photo capture to eliminate time theft and ensure compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="text-lg h-12 px-8" asChild>
                <Link href="/signup">Start Free 14-Day Trial</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-lg h-12 px-8 bg-transparent" asChild>
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </div>
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                <span className="text-sm text-muted-foreground">GDPR & BIPA compliant</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/5 blur-3xl rounded-full" />
            <img
              src="/modern-dashboard-with-biometric-fingerprint-scanne.jpg"
              alt="ChronoSecure Dashboard"
              className="relative rounded-2xl shadow-2xl border"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y bg-muted/30">
        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="text-sm text-muted-foreground mt-2">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground mt-2">Companies</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground mt-2">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">30%</div>
              <div className="text-sm text-muted-foreground mt-2">Time Savings</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">
            Everything You Need for <span className="text-primary">Modern Attendance</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Powerful features designed to streamline workforce management and eliminate time fraud
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Fingerprint className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Biometric Verification</h3>
            <p className="text-muted-foreground leading-relaxed">
              Advanced fingerprint scanning with photo capture ensures accurate identity verification and prevents buddy
              punching
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Automated Time Tracking</h3>
            <p className="text-muted-foreground leading-relaxed">
              Real-time clock in/out with automatic overtime calculations, break tracking, and grace period management
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Payroll Integration</h3>
            <p className="text-muted-foreground leading-relaxed">
              Seamlessly export attendance data to popular payroll systems with automated wage calculations
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Enterprise Security</h3>
            <p className="text-muted-foreground leading-relaxed">
              Bank-level encryption with GDPR, BIPA, and APP compliance. Secure data storage with audit trails
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Team Management</h3>
            <p className="text-muted-foreground leading-relaxed">
              Organize employees by departments, shifts, and roles with flexible scheduling and PTO management
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Multi-Location Support</h3>
            <p className="text-muted-foreground leading-relaxed">
              Manage attendance across multiple sites with geofencing and location-based access controls
            </p>
          </Card>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section id="security" className="bg-muted/30 py-24">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <img
                src="/security-shield-with-fingerprint-biometric-complia.jpg"
                alt="Security and Compliance"
                className="rounded-2xl shadow-xl border"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-balance">
                Security & Compliance <span className="text-primary">First</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                ChronoSecure takes data protection seriously. We're fully compliant with international privacy
                regulations and employ industry-leading security measures.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">GDPR Compliant</div>
                    <div className="text-sm text-muted-foreground">
                      Full compliance with EU data protection regulations
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">BIPA Certified</div>
                    <div className="text-sm text-muted-foreground">
                      Illinois Biometric Information Privacy Act compliance
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">AES-256 Encryption</div>
                    <div className="text-sm text-muted-foreground">
                      Military-grade encryption for all biometric data
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold">SOC 2 Type II</div>
                    <div className="text-sm text-muted-foreground">Audited security controls and processes</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">
            Simple, <span className="text-primary">Transparent</span> Pricing
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your business size. All plans include core features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <Card className="p-8 space-y-6 hover:shadow-xl transition-shadow">
            <div>
              <h3 className="text-2xl font-bold">Starter</h3>
              <p className="text-muted-foreground mt-2">Perfect for small teams</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">$49</div>
              <div className="text-sm text-muted-foreground">per month, up to 25 employees</div>
            </div>
            <Button className="w-full bg-transparent" variant="outline" asChild>
              <Link href="/signup?plan=starter">Start Free Trial</Link>
            </Button>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Biometric fingerprint scanning</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Photo capture verification</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Basic reporting</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Email support</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-6 border-primary shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>
            <div>
              <h3 className="text-2xl font-bold">Professional</h3>
              <p className="text-muted-foreground mt-2">For growing businesses</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">$149</div>
              <div className="text-sm text-muted-foreground">per month, up to 100 employees</div>
            </div>
            <Button className="w-full" asChild>
              <Link href="/signup?plan=professional">Start Free Trial</Link>
            </Button>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Everything in Starter</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Advanced analytics & reporting</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Payroll integrations</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Multi-location support</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Priority support</span>
              </div>
            </div>
          </Card>

          <Card className="p-8 space-y-6 hover:shadow-xl transition-shadow">
            <div>
              <h3 className="text-2xl font-bold">Enterprise</h3>
              <p className="text-muted-foreground mt-2">For large organizations</p>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold">Custom</div>
              <div className="text-sm text-muted-foreground">Contact us for pricing</div>
            </div>
            <Button className="w-full bg-transparent" variant="outline" asChild>
              <Link href="/contact">Contact Sales</Link>
            </Button>
            <div className="space-y-3 pt-4">
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Everything in Professional</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Unlimited employees</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Custom integrations</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">Dedicated account manager</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">24/7 premium support</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-24">
        <div className="container mx-auto px-4 text-center space-y-8">
          <h2 className="text-4xl md:text-5xl font-bold text-balance">
            Ready to Transform Your Attendance Management?
          </h2>
          <p className="text-xl text-primary-foreground/90 max-w-2xl mx-auto text-pretty">
            Join hundreds of companies already saving time and reducing payroll errors with ChronoSecure
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg h-12 px-8" asChild>
              <Link href="/signup">Start Free 14-Day Trial</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="text-lg h-12 px-8 border-primary-foreground/20 hover:bg-primary-foreground/10 bg-transparent"
              asChild
            >
              <Link href="/contact">Schedule a Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl">ChronoSecure</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Modern attendance tracking with biometric security for businesses of all sizes.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="#features" className="hover:text-foreground transition-colors">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="#pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="#security" className="hover:text-foreground transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/integrations" className="hover:text-foreground transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-foreground transition-colors">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-foreground transition-colors">
                    Contact
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-foreground transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/compliance" className="hover:text-foreground transition-colors">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2025 ChronoSecure. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
