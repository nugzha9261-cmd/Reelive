import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';

const SUPPORT_EMAIL = 'admin@nexonelabs.com';
const LAST_UPDATED = 'August 12, 2026';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const Privacy: React.FC = () => {
  const navigate = useNavigate();

  return (
    <MobileLayout>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Privacy Policy</h1>
      </div>

      <p className="text-xs text-muted-foreground mb-6">Last updated: {LAST_UPDATED}</p>

      <div className="bg-card rounded-3xl p-6">
        <Section title="Overview">
          <p>
            REELIVE ("we", "us") is operated by Nexzone Labs. This policy explains what
            information the REELIVE app collects, how we use it, and the choices you have.
          </p>
        </Section>

        <Section title="Information we collect">
          <p>
            <strong className="text-foreground">Account information.</strong> When you create an
            account we store your email address and, optionally, a display name.
          </p>
          <p>
            <strong className="text-foreground">Your content.</strong> Video clips you record,
            their thumbnails, journey names, dates and any reels you compile are stored in your
            private account so they can be restored on a new device.
          </p>
          <p>
            <strong className="text-foreground">Purchase information.</strong> Subscription status
            is provided by Apple and our payments partner (RevenueCat). We never see your card
            details.
          </p>
          <p>
            <strong className="text-foreground">Basic diagnostics.</strong> Limited technical logs
            (such as errors) may be recorded to keep the service reliable.
          </p>
        </Section>

        <Section title="How we use your information">
          <p>
            To provide the app's core features: recording clips, organising journeys, compiling
            reels, syncing your library across devices, sending reminders you enable, and managing
            your subscription and support requests.
          </p>
          <p>We do not sell your personal information and we do not use your videos for advertising.</p>
        </Section>

        <Section title="Camera, microphone and photos">
          <p>
            The app requests camera and microphone access only to record your clips, and photo
            library access only when you choose to save a reel. Recording never starts without your
            action.
          </p>
        </Section>

        <Section title="Storage and sharing">
          <p>
            Your videos are stored in private cloud storage that only your account can access, and
            cached on your device for offline playback. We use service providers to operate the
            app: Supabase (database, authentication, storage), Shotstack (video compilation) and
            RevenueCat (subscriptions). They process data only on our behalf.
          </p>
        </Section>

        <Section title="Data retention and deletion">
          <p>
            Your content is kept while your account is active. You can delete individual clips,
            journeys or reels at any time from within the app. To delete your account and all
            associated data, email us at {SUPPORT_EMAIL} and we will remove it within 30 days.
          </p>
        </Section>

        <Section title="Children">
          <p>REELIVE is not intended for children under 13, and we do not knowingly collect their data.</p>
        </Section>

        <Section title="Your rights">
          <p>
            Depending on where you live, you may have the right to access, correct, export or
            delete your personal data. Contact us and we will help.
          </p>
        </Section>

        <Section title="Changes to this policy">
          <p>
            We may update this policy from time to time. Material changes will be reflected by the
            "Last updated" date above.
          </p>
        </Section>

        <Section title="Contact">
          <p className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" />
            <a href={`mailto:${SUPPORT_EMAIL}`} className="text-primary underline">
              {SUPPORT_EMAIL}
            </a>
          </p>
        </Section>
      </div>
    </MobileLayout>
  );
};

export default Privacy;
