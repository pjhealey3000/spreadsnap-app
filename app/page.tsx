import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  TrendingUp, 
  Bell, 
  Zap, 
  BarChart3, 
  ArrowRight, 
  Target,
  Clock,
  Shield
} from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold">SpreadSnap</span>
            <Badge variant="outline" className="text-xs font-normal">Beta</Badge>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Get Started</Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <Badge variant="outline" className="mb-6 px-4 py-1.5">
          <Zap className="w-3.5 h-3.5 mr-1.5 text-primary" />
          Real-time Spread Deviation Alerts
        </Badge>
        
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-balance">
          Catch the regression
          <span className="text-primary"> before it happens</span>
        </h1>
        
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 text-pretty">
          Get instant alerts when live game scores deviate significantly from opening spreads. 
          Spot value betting opportunities when favorites underperform and regression to the mean is likely.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild>
            <Link href="/auth/sign-up">
              Start Tracking Free
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="#how-it-works">
              Learn How It Works
            </Link>
          </Button>
        </div>

        {/* Beta Notice */}
        <div className="mt-12 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Currently in beta - NBA and NFL supported</span>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">The Regression Edge</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            When a favorite falls behind by more than expected, history shows they often bounce back. 
            We alert you to these moments in real-time.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Track Opening Spreads</h3>
              <p className="text-sm text-muted-foreground">
                We capture the opening line before the game starts - the market{"'"}s best prediction of the final margin.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Monitor Live Deviation</h3>
              <p className="text-sm text-muted-foreground">
                During the game, we calculate how far the current score deviates from the expected margin.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card/50">
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Instant Alerts</h3>
              <p className="text-sm text-muted-foreground">
                When deviation exceeds your threshold, you get an instant push notification to explore in-game betting.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Example */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
            <CardContent className="p-8 sm:p-12">
              <Badge variant="outline" className="mb-4">Example Scenario</Badge>
              <h3 className="text-2xl font-bold mb-6">Warriors vs Trail Blazers</h3>
              
              <div className="grid sm:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground mb-1">Opening Spread</p>
                  <p className="text-3xl font-bold">GSW -2</p>
                  <p className="text-xs text-muted-foreground mt-1">Warriors favored by 2</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-background/50">
                  <p className="text-sm text-muted-foreground mb-1">2nd Quarter Score</p>
                  <p className="text-3xl font-bold text-destructive">GSW -20</p>
                  <p className="text-xs text-muted-foreground mt-1">Warriors down by 20</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Deviation</p>
                  <p className="text-3xl font-bold text-primary">+22 pts</p>
                  <p className="text-xs text-muted-foreground mt-1">Alert triggered!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-lg bg-background/50 border border-primary/20">
                <Bell className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-primary">SpreadSnap Alert</p>
                  <p className="text-sm text-muted-foreground">
                    Warriors were -2 favorites but are losing by 20. Regression opportunity detected.
                    Historically, large early deficits by favorites often narrow by game end.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Real-Time Updates</h4>
              <p className="text-sm text-muted-foreground">
                Scores update every 30 seconds during live games
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Bell className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Push Notifications</h4>
              <p className="text-sm text-muted-foreground">
                Browser alerts so you never miss an opportunity
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">Custom Thresholds</h4>
              <p className="text-sm text-muted-foreground">
                Set your own deviation trigger points
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium mb-1">NBA & NFL</h4>
              <p className="text-sm text-muted-foreground">
                Track both leagues with more coming soon
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-8 sm:p-12 text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to catch the regression?</h2>
            <p className="text-primary-foreground/80 max-w-xl mx-auto mb-8">
              Join thousands of bettors using SpreadSnap to identify value opportunities 
              when favorites underperform early in games.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/auth/sign-up">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <span>SpreadSnap</span>
            <span className="text-xs">Beta</span>
          </div>
          <p className="text-center">For entertainment purposes only. Gamble responsibly. Not financial advice.</p>
        </div>
      </footer>
    </div>
  )
}
