import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Code, 
  Copy, 
  Check, 
  Shield, 
  Zap, 
  Lock, 
  HelpCircle, 
  Globe, 
  Smartphone,
  Eye
} from 'lucide-react';

export default function SetupGuide() {
  const { currentProject } = useAuth();
  const [activeTab, setActiveTab] = useState('web');
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  const ingestUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/v1/ingest`;

  const webCode = `<!-- AuraTrace Observability Platform SDK -->
<script src="${window.location.origin}/telemetry.js"></script>
<script>
  window.addEventListener('load', () => {
    TelemetrySDK.init({
      apiKey: "${currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}",
      endpoint: "${ingestUrl}",
      debug: true
    });
  });
</script>`;

  const curlCode = `curl -X POST "${ingestUrl}?apiKey=${currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}",
    "sessionId": "session_mobile_123",
    "timestamp": "${new Date().toISOString()}",
    "type": "error",
    "level": "error",
    "message": "Uncaught ReferenceError: deviceLocation is not defined",
    "path": "MainActivity.kt",
    "metadata": {
      "stack": "ReferenceError: deviceLocation is not defined\\n  at com.myapp.MainActivity.init(MainActivity.kt:42)",
      "environment": {
        "browser": "MobileApp",
        "os": "Android 14",
        "userAgent": "AppVersion/1.0.0",
        "screen": "1080x2400",
        "language": "en"
      }
    }
  }'`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'web') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Setup Guide</h2>
        <p className="text-zinc-400 text-sm">
          Connect your Web or Mobile application to <span className="font-semibold text-brand-accent">AuraTrace</span>
        </p>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-brand-border/60 pb-px shrink-0">
        <button
          onClick={() => setActiveTab('web')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-semibold tracking-wide border-b-2 px-1 transition-all ${
            activeTab === 'web'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Globe className="h-4.5 w-4.5" />
          Web Integration
        </button>
        <button
          onClick={() => setActiveTab('mobile')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-semibold tracking-wide border-b-2 px-1 transition-all ${
            activeTab === 'mobile'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Smartphone className="h-4.5 w-4.5" />
          Mobile Integration
        </button>
      </div>

      {/* Web Integration Panel */}
      {activeTab === 'web' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border-brand-border/40 hover:border-brand-border/80 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-brand-accent" />
                <h3 className="font-bold text-lg">Embed SDK in index.html</h3>
              </div>
              <button
                onClick={() => copyToClipboard(webCode, 'web')}
                className="flex items-center gap-1.5 text-xs text-brand-accent hover:text-brand-accent/80 font-bold bg-brand-accent/10 border border-brand-accent/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Script
                  </>
                )}
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              Paste this block into your website's <code className="text-brand-accent bg-zinc-950 px-1 py-0.5 rounded">&lt;head&gt;</code> tags. Put it at the very top so that it is the first script to run. This allows the SDK to monitor clicks, navigations, and uncaught browser errors dynamically.
            </p>
            <pre className="terminal-console text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-all">
              {webCode}
            </pre>
          </div>
        </div>
      )}

      {/* Mobile Integration Panel */}
      {activeTab === 'mobile' && (
        <div className="space-y-6">
          <div className="glass-card p-6 border-brand-border/40 hover:border-brand-border/80 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Code className="h-5 w-5 text-brand-accent" />
                <h3 className="font-bold text-lg">Send Crashes via HTTP API</h3>
              </div>
              <button
                onClick={() => copyToClipboard(curlCode, 'mobile')}
                className="flex items-center gap-1.5 text-xs text-brand-accent hover:text-brand-accent/80 font-bold bg-brand-accent/10 border border-brand-accent/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedCurl ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Payload
                  </>
                )}
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              Mobile apps do not run in HTML browsers, so script tags will not work. Instead, catch your mobile exceptions globally (e.g. in Flutter, React Native, Kotlin, or Swift) and dispatch them via a standard HTTP <code>POST</code> payload directly to the AuraTrace ingestion route.
            </p>
            <div className="text-xs text-zinc-300 space-y-4 mb-4">
              <div>
                <strong className="text-brand-accent">Inbound Endpoint:</strong>
                <pre className="mt-1 bg-zinc-950 border border-brand-border p-2.5 rounded font-mono select-all text-xs text-zinc-200">
                  POST {ingestUrl}?apiKey={currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}
                </pre>
              </div>
            </div>
            <pre className="terminal-console text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-all">
              {curlCode}
            </pre>
          </div>
        </div>
      )}

      {/* How It Monitors Section */}
      <div className="glass-card p-6 border-brand-border/40 hover:border-brand-border/60 transition-all bg-gradient-to-br from-brand-dark to-brand-accent/5">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-5 w-5 text-brand-cyan" />
          <h3 className="font-bold text-lg">How AuraTrace Monitors Your Application</h3>
        </div>
        <p className="text-zinc-400 text-sm mb-6 max-w-3xl leading-relaxed">
          AuraTrace runs quietly in the background without affecting your users' app loading speeds or performance:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-zinc-300">
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-brand-border/20">
            <div className="flex items-center gap-2 text-brand-cyan">
              <span className="font-mono font-bold text-xs bg-brand-cyan/15 px-2 py-0.5 rounded">1</span>
              <h4 className="font-bold">Tracks Locally First</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every button click and navigation change is recorded inside a tiny, local list (circular buffer) stored in the browser/app memory. No APIs are hit for clicks.
            </p>
          </div>
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-brand-border/20">
            <div className="flex items-center gap-2 text-brand-purple">
              <span className="font-mono font-bold text-xs bg-brand-purple/15 px-2 py-0.5 rounded">2</span>
              <h4 className="font-bold">Zero Network Bloat</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We do not flood the network or block your user UI. The SDK sits idle and behaves as an invisible, offline logger until an exception occurs.
            </p>
          </div>
          <div className="space-y-2 bg-zinc-950 p-4 rounded-xl border border-brand-border/20">
            <div className="flex items-center gap-2 text-brand-green">
              <span className="font-mono font-bold text-xs bg-brand-green/15 px-2 py-0.5 rounded">3</span>
              <h4 className="font-bold">Immediate Crash Flush</h4>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              If an uncaught JavaScript or Native error triggers, the SDK gathers the local buffer actions (breadcrumbs) and pushes them alongside the error to our servers.
            </p>
          </div>
        </div>
      </div>

      {/* Developer Concerns & FAQs */}
      <div className="glass-card p-6 border-brand-border/40">
        <div className="flex items-center gap-2 mb-6">
          <HelpCircle className="h-5 w-5 text-brand-cyan" />
          <h3 className="font-bold text-lg">Developer Concerns & FAQs</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Speed Card */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-brand-border/40 hover:border-zinc-800 transition-colors space-y-3">
            <div className="flex items-center gap-2 text-brand-accent">
              <Zap className="h-4.5 w-4.5" />
              <h4 className="font-bold text-sm">Will this slow down my app?</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              <strong>No.</strong> The Web SDK is extremely lightweight (~9KB) and runs asynchronously. It utilizes the browser's native <code>sendBeacon</code> API to flush telemetry logs in the background, meaning it never blocks page load, user clicks, or UI rendering.
            </p>
          </div>

          {/* Privacy Card */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-brand-border/40 hover:border-zinc-800 transition-colors space-y-3">
            <div className="flex items-center gap-2 text-brand-green">
              <Shield className="h-4.5 w-4.5" />
              <h4 className="font-bold text-sm">Is sensitive user data safe?</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              <strong>Yes.</strong> AuraTrace respects privacy. Before sending any error trace to the server, the SDK automatically scrubs sensitive personal details (such as emails, phone numbers, and potential credit card numbers) using local regex patterns.
            </p>
          </div>

          {/* Security Card */}
          <div className="p-5 rounded-xl bg-zinc-950 border border-brand-border/40 hover:border-zinc-800 transition-colors space-y-3">
            <div className="flex items-center gap-2 text-brand-cyan">
              <Lock className="h-4.5 w-4.5" />
              <h4 className="font-bold text-sm">How secure is the platform?</h4>
            </div>
            <p className="text-zinc-400 text-xs leading-relaxed">
              <strong>Very secure.</strong> All user sessions, project creation, and logs are protected using <code>httpOnly</code> cookies. This makes it impossible for malicious client scripts to access credentials, fully securing your platform's ingestion pipeline.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
