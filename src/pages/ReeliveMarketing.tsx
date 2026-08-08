import React from 'react';
import { Apple, Heart, Camera, Film, Clock, Lock } from 'lucide-react';
import reeliveLogo from '@/assets/reelive-logo.png';

// Replace this with your real App Store URL once it is live.
const APP_STORE_URL = '#';

const FeatureCard: React.FC<{ icon: React.ReactNode; title: string; description: string }> = ({
  icon,
  title,
  description,
}) => (
  <div className="bg-card/80 border border-border rounded-3xl p-6 flex flex-col items-start gap-3">
    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
      {icon}
    </div>
    <h3 className="font-semibold text-foreground text-lg">{title}</h3>
    <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

const ReeliveMarketing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative px-6 pt-16 pb-20 md:pt-24 md:pb-28 max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-8">
          <img
            src={reeliveLogo}
            alt="REELIVE"
            className="w-40 h-16 object-contain"
          />
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
          Your whole year,
          <br />
          <span className="text-primary">in seconds.</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto leading-relaxed mb-8">
          Capture one tiny moment every day. REELIVE turns it into a beautiful film you'll want to watch forever.
        </p>
        <a
          href={APP_STORE_URL}
          className="inline-flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg active:scale-95"
        >
          <Apple className="w-6 h-6" />
          Download on the App Store
        </a>
        <p className="mt-4 text-sm text-muted-foreground">Free to start. One journey, one compilation included.</p>
      </section>

      {/* Emotional hook */}
      <section className="px-6 py-16 bg-secondary/50">
        <div className="max-w-2xl mx-auto text-center">
          <Heart className="w-8 h-8 text-primary mx-auto mb-4" />
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            We film everything. We keep almost nothing.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-6">
            Our camera rolls are full of moments that never get watched. Stories get buried. Years blur together. REELIVE gives your days a purpose: one short clip, one living story.
          </p>
          <p className="font-[Caveat,cursive] text-2xl md:text-3xl text-foreground/90">
            "Because one day, you'll want to remember how it felt."
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-20 max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-12">
          Three small steps. One big story.
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={<Film className="w-6 h-6" />}
            title="Pick a journey"
            description="A trip, a baby, a fitness goal, or simply your year. Every journey is its own story."
          />
          <FeatureCard
            icon={<Camera className="w-6 h-6" />}
            title="Capture 1-2 seconds"
            description="Open the camera, record a single breath of your day, and save it. That's it."
          />
          <FeatureCard
            icon={<Clock className="w-6 h-6" />}
            title="Relive the magic"
            description="At the end of your journey, watch your life unfold into a beautiful highlight reel."
          />
        </div>
      </section>

      {/* Why REELIVE */}
      <section className="px-6 py-16 bg-accent text-accent-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Built for memories, not algorithms.
          </h2>
          <div className="grid gap-6 md:grid-cols-2 text-left">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-foreground/10 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Private by default</h3>
                <p className="text-sm text-accent-foreground/80">Your clips are stored securely in the cloud. You own them. We never sell or share your data.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-accent-foreground/10 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Takes 4 seconds a day</h3>
                <p className="text-sm text-accent-foreground/80">No editing. No overwhelm. Just a tiny habit that becomes a lifetime of memories.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          Start today. Thank yourself later.
        </h2>
        <p className="text-base md:text-lg text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
          Your future self is already asking why you didn't start sooner. Give them something beautiful to look back on.
        </p>
        <a
          href={APP_STORE_URL}
          className="inline-flex items-center gap-3 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-semibold text-lg px-8 py-4 rounded-2xl shadow-lg active:scale-95"
        >
          <Apple className="w-6 h-6" />
          Get REELIVE on the App Store
        </a>
        <p className="mt-6 text-sm text-muted-foreground">
          Questions? Contact us at <a href="mailto:admin@nexonelabs.com" className="text-primary underline">admin@nexonelabs.com</a>
        </p>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} REELIVE. All rights reserved.</p>
        <p className="mt-2">A product of Nexzone Labs.</p>
      </footer>
    </div>
  );
};

export default ReeliveMarketing;
