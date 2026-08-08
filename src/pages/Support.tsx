import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react';
import { MobileLayout } from '@/components/layout/MobileLayout';
import { IOSButton } from '@/components/ui/ios-button';

const SUPPORT_EMAIL = 'admin@nexonelabs.com';

const Support: React.FC = () => {
  const navigate = useNavigate();

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=REELIVE%20Support%20Request`;
  };

  return (
    <MobileLayout>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full bg-card flex items-center justify-center active:scale-95 transition-transform"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground">Help & Support</h1>
      </div>

      {/* Intro */}
      <div className="mb-6">
        <p className="text-muted-foreground leading-relaxed">
          Questions, feedback, or bug reports? We're here to help. Reach out anytime and our team will get back to you as soon as possible.
        </p>
      </div>

      {/* Contact card */}
      <div className="bg-card rounded-3xl p-6 mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
          <MessageCircle className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-lg font-semibold text-foreground mb-1">Contact us</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Tap the button below to send us an email directly from your device.
        </p>
        <IOSButton
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleEmail}
        >
          <Mail className="w-5 h-5" />
          Email Support
        </IOSButton>
        <p className="text-center text-sm text-muted-foreground mt-4">
          {SUPPORT_EMAIL}
        </p>
      </div>

      {/* FAQ hint */}
      <div className="bg-card/50 rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-2">Common topics</h3>
        <ul className="text-sm text-muted-foreground space-y-2">
          <li>• How to create and manage journeys</li>
          <li>• Compiling clips into a reel</li>
          <li>• Premium subscription and billing</li>
          <li>• Camera, microphone, or storage issues</li>
        </ul>
      </div>
    </MobileLayout>
  );
};

export default Support;
