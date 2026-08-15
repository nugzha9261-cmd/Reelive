import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';

const SUPPORT_EMAIL = 'admin@nexonelabs.com';
const LAST_UPDATED = 'August 15, 2026';

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="mb-6">
    <h2 className="text-base font-semibold text-foreground mb-2">{title}</h2>
    <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
  </section>
);

const Terms: React.FC = () => {
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
        <h1 className="text-2xl font-bold text-foreground">Terms of Use</h1>
      </div>

      <p className="text-xs text-muted-foreground mb-6">Last updated: {LAST_UPDATED}</p>

      <div className="bg-card rounded-3xl p-6">
        <Section title="Agreement">
          <p>
            REELIVE ("the app") is operated by Nexzone Labs. By downloading or using the app you
            agree to these Terms of Use. If you do not agree, please do not use the app.
          </p>
        </Section>

        <Section title="Your account">
          <p>
            You need an account to use the app. You are responsible for keeping your credentials
            secure and for all activity under your account. You must be at least 13 years old.
          </p>
        </Section>

        <Section title="Your content">
          <p>
            You keep all rights to the clips and reels you create. You grant us only the limited
            permission needed to store, process and compile your content so the app can work.
          </p>
          <p>
            You agree not to record or upload content that is unlawful, abusive, or that infringes
            someone else's rights. We may remove content or suspend accounts that violate this.
          </p>
        </Section>

        <Section title="Subscriptions and purchases">
          <p>
            REELIVE offers an auto-renewing Premium subscription (monthly or yearly) and an
            optional one-time Lifetime purchase. Prices are shown in the app in your local currency
            before you confirm.
          </p>
          <p>
            Payment is charged to your Apple ID account at confirmation of purchase. An
            auto-renewing subscription renews automatically for the same period unless it is
            cancelled at least 24 hours before the end of the current period. Your account is
            charged for renewal within 24 hours prior to the end of the current period.
          </p>
          <p>
            You can manage or cancel your subscription in your Apple ID Account Settings after
            purchase. The Lifetime option is a one-time purchase and does not renew.
          </p>
          <p>
            Any unused portion of a free trial period, where offered, is forfeited when you
            purchase a subscription.
          </p>
        </Section>

        <Section title="Refunds">
          <p>
            All purchases are processed by Apple. Refund requests are handled by Apple under their
            standard policy at reportaproblem.apple.com.
          </p>
        </Section>

        <Section title="Acceptable use">
          <p>
            Do not reverse engineer, resell, or attempt to disrupt the app or its services, and do
            not use it to break any law.
          </p>
        </Section>

        <Section title="Termination">
          <p>
            You may delete your account at any time from the You tab in the app. We may suspend or
            terminate access if these terms are breached.
          </p>
        </Section>

        <Section title="Disclaimer and liability">
          <p>
            The app is provided "as is" without warranties of any kind. To the maximum extent
            permitted by law, Nexzone Labs is not liable for any indirect or consequential loss,
            including loss of recordings. Please keep your own backups of anything irreplaceable.
          </p>
        </Section>

        <Section title="Changes">
          <p>
            We may update these terms. Continued use of the app after an update means you accept
            the revised terms.
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

export default Terms;
