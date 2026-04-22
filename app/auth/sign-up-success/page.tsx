import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function SignUpSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Check your email</CardTitle>
          <CardDescription>
            {"We've sent you a confirmation link to verify your email address."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click the link in the email to activate your account and start tracking spread deviations.
          </p>
          <Button variant="outline" asChild className="w-full">
            <Link href="/auth/login">
              Back to Sign In
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
