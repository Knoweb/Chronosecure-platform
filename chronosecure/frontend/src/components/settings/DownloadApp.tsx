import { Download, Monitor, ShieldCheck, Terminal } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function DownloadApp() {
    const handleDownload = () => {
        // Download the installer from the public folder
        const link = document.createElement('a')
        link.href = '/ChronoSecureSetup.exe'
        link.download = 'ChronoSecureSetup.exe'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Monitor className="h-6 w-6 text-primary" />
                        Desktop Applications
                    </CardTitle>
                    <CardDescription>
                        Download the necessary tools to manage biometric devices and enroll fingerprints.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col md:flex-row gap-6 items-start">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-start gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition">
                                <div className="p-3 bg-primary/10 rounded-lg">
                                    <ShieldCheck className="h-8 w-8 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg">ChronoSecure Fingerprint Client</h3>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Required for enrolling employee fingerprints and managing device connections.
                                        Includes drivers and the local service agent.
                                    </p>
                                    <div className="flex items-center gap-4 mt-4">
                                        <Button onClick={handleDownload} className="gap-2">
                                            <Download className="h-4 w-4" />
                                            Download Installer (Windows)
                                        </Button>
                                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                                            Version 1.0.0 • 60 MB
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Alert>
                        <Terminal className="h-4 w-4" />
                        <AlertTitle>Installation Instructions</AlertTitle>
                        <AlertDescription className="mt-2 text-sm text-muted-foreground list-decimal pl-4 space-y-1">
                            <p>1. Download and run the <b>ChronoSecureSetup.exe</b> installer.</p>
                            <p>2. Follow the on-screen prompts to install the application and drivers.</p>
                            <p>3. Once installed, the <b>ChronoFingerprint Service</b> will start automatically.</p>
                            <p>4. You can then use the "Enroll Fingerprint" feature on the Employees page.</p>
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        </div>
    )
}
