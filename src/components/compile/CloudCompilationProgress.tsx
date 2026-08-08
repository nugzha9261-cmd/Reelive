import React from 'react';
import { Cloud, Loader2, CheckCircle2, XCircle, X } from 'lucide-react';
import type { CloudCompilationProgress as ProgressType } from '@/hooks/useCloudCompilation';

interface CloudCompilationProgressProps {
  progress: ProgressType;
  onDismiss?: () => void;
}

export const CloudCompilationProgress: React.FC<CloudCompilationProgressProps> = ({ progress, onDismiss }) => {
  if (progress.stage === 'idle' || progress.stage === 'completed') return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-8">
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Close"
          className="absolute right-4 w-10 h-10 rounded-full bg-muted flex items-center justify-center"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <X className="w-5 h-5 text-foreground" />
        </button>
      )}
      <div className="w-full max-w-sm text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          {progress.stage === 'failed' ? (
            <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
          ) : (
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              {progress.stage === 'processing' ? (
                <Cloud className="w-10 h-10 text-primary animate-pulse" />
              ) : (
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              )}
            </div>
          )}
        </div>

        {/* Title */}
        <div>
          <h2 className="text-xl font-bold text-foreground mb-1">
            {progress.stage === 'failed' ? 'Compilation Failed' : 'Cloud Compilation'}
          </h2>
          <p className="text-sm text-muted-foreground">{progress.message}</p>
        </div>

        {/* Cloud info */}
        {progress.stage !== 'failed' && (
          <div className="space-y-3">
            {/* Animated dots */}
            <div className="flex justify-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-xs text-muted-foreground">
              ☁️ Your video is being compiled in the cloud. You can leave this screen — we'll notify you when it's ready.
            </p>
          </div>
        )}

        {progress.stage === 'failed' && onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium"
          >
            Close
          </button>
        )}
      </div>
    </div>
  );
};
