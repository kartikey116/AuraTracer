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
  Eye,
  Server,
  Database
} from 'lucide-react';

export default function SetupGuide() {
  const { currentProject } = useAuth();
  const [activeTab, setActiveTab] = useState('web');
  const [copied, setCopied] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedBackend, setCopiedBackend] = useState(false);
  const [copiedDbCurl, setCopiedDbCurl] = useState(false);

  const ingestUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/v1/ingest`;
  const backendIngestUrl = `${window.location.protocol}//${window.location.hostname}:5000/api/v1/ingest/backend`;

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

  const backendCode = `const winston = require('winston');
const axios = require('axios');

// Custom Winston Transport to stream server logs to AuraTrace
class AuraTraceTransport extends winston.Transport {
  constructor(opts) {
    super(opts);
    this.apiKey = opts.apiKey;
    this.endpoint = opts.endpoint;
  }

  log(info, callback) {
    setImmediate(() => this.emit('logged', info));

    // Stream log to AuraTrace asynchronously in the background
    axios.post(this.endpoint, {
      apiKey: this.apiKey,
      type: "server_log",
      level: info.level === "error" ? "error" : "info",
      message: info.message,
      service: "payment-gateway",
      metadata: {
        timestamp: info.timestamp || new Date().toISOString(),
        stack: info.stack || null,
        environment: {
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    }).catch(err => {
      // Fail silently to prevent crashing application
    });

    callback();
  }
}

// Instantiate winston logger
const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console(),
    new AuraTraceTransport({
      apiKey: "${currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}",
      endpoint: "${backendIngestUrl}"
    })
  ]
});

module.exports = logger;`;

  const dbCurlCode = `curl -X POST "${backendIngestUrl}?apiKey=${currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "apiKey": "${currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}",
    "type": "db_log",
    "level": "warn",
    "message": "Slow query detected: SELECT * FROM transaction_history WHERE status = \\"pending\\" LIMIT 1000",
    "path": "PostgreSQL",
    "service": "database-cluster-primary",
    "metadata": {
      "executionTimeMs": 3520,
      "rowsReturned": 45000
    }
  }'`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'web') {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'mobile') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'backend') {
      setCopiedBackend(true);
      setTimeout(() => setCopiedBackend(false), 2000);
    } else if (type === 'db') {
      setCopiedDbCurl(true);
      setTimeout(() => setCopiedDbCurl(false), 2000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight">Setup Guide</h2>
        <p className="text-zinc-400 text-sm">
          Connect your Web, Mobile, or Backend application to <span className="font-semibold text-brand-accent">AuraTrace</span>
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
        <button
          onClick={() => setActiveTab('backend')}
          className={`flex items-center gap-2 pb-3.5 text-sm font-semibold tracking-wide border-b-2 px-1 transition-all ${
            activeTab === 'backend'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Server className="h-4.5 w-4.5" />
          Backend Integration
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

      {/* Backend Integration Panel */}
      {activeTab === 'backend' && (
        <div className="space-y-6">
          {/* Winston Logger Card */}
          <div className="glass-card p-6 border-brand-border/40 hover:border-brand-border/80 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-brand-cyan" />
                <h3 className="font-bold text-lg">Server Log Integration (Winston Middleware)</h3>
              </div>
              <button
                onClick={() => copyToClipboard(backendCode, 'backend')}
                className="flex items-center gap-1.5 text-xs text-brand-cyan hover:text-brand-cyan/80 font-bold bg-brand-cyan/10 border border-brand-cyan/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedBackend ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy Code
                  </>
                )}
              </button>
            </div>
            <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
              To send server-side logs and uncaught runtime errors, integrate our ingestion pipeline as a custom transport in loggers like <code>Winston</code>. Under the hood, this posts standard JSON payloads asynchronously to the server-logs endpoint.
            </p>
            <div className="text-xs text-zinc-300 space-y-4 mb-4">
              <div>
                <strong className="text-brand-cyan">Dedicated Backend Endpoint:</strong>
                <pre className="mt-1 bg-zinc-950 border border-brand-border p-2.5 rounded font-mono select-all text-xs text-zinc-200">
                  POST {backendIngestUrl}?apiKey={currentProject?.apiKey || 'YOUR_PROJECT_API_KEY'}
                </pre>
              </div>
            </div>
            <pre className="terminal-console text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-all">
              {backendCode}
            </pre>
          </div>

          {/* DB Logger Card */}
          <div className="glass-card p-6 border-brand-border/40 hover:border-brand-border/80 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-brand-purple" />
                <h3 className="font-bold text-lg">Database Log Ingestion via HTTP API</h3>
              </div>
              <button
                onClick={() => copyToClipboard(dbCurlCode, 'db')}
                className="flex items-center gap-1.5 text-xs text-brand-purple hover:text-brand-purple/80 font-bold bg-brand-purple/10 border border-brand-purple/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedDbCurl ? (
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
              Track database metrics, slow query warnings, or failover logs by dispatching logs of type <code>db_log</code> directly to our ingestion route from database wrappers, triggers, or backend servers.
            </p>
            <pre className="terminal-console text-xs leading-relaxed max-h-64 overflow-y-auto whitespace-pre-wrap select-all">
              {dbCurlCode}
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
