(function () {
  // Global reference to the SDK object
  const TelemetrySDK = {
    apiKey: null,
    endpoint: 'http://localhost:5000/api/v1/ingest',
    sessionId: null,
    breadcrumbs: [],
    maxBreadcrumbs: 20,
    debug: false,

    /**
     * Initializes the Telemetry SDK.
     * @param {object} config - Configuration settings
     */
    init(config) {
      if (!config.apiKey) {
        console.error('[TelemetrySDK] API Key is required for initialization.');
        return;
      }

      this.apiKey = config.apiKey;
      if (config.endpoint) this.endpoint = config.endpoint;
      if (config.debug !== undefined) this.debug = !!config.debug;

      // Initialize or retrieve Session ID
      this.sessionId = this.getOrCreateSessionId();

      // Start listeners
      this.setupBreadcrumbListeners();
      this.setupErrorListeners();
      this.setupRouteListeners();

      // Track initial page view
      this.trackPageView();

      if (this.debug) {
        console.log(`[TelemetrySDK] Initialized with SessionID: ${this.sessionId}`);
      }
    },

    /**
     * Retrieves existing session ID from sessionStorage, or creates a new one.
     */
    getOrCreateSessionId() {
      let sessId = null;
      try {
        sessId = sessionStorage.getItem('telemetry_session_id');
        if (!sessId) {
          sessId = 'sess_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
          sessionStorage.setItem('telemetry_session_id', sessId);
        }
      } catch (e) {
        // Fallback if sessionStorage is blocked
        sessId = 'sess_temp_' + Math.random().toString(36).substring(2, 15);
      }
      return sessId;
    },

    /**
     * Helper to add a breadcrumb to our circular buffer.
     */
    addBreadcrumb(crumb) {
      this.breadcrumbs.push({
        ...crumb,
        timestamp: new Date().toISOString()
      });

      if (this.breadcrumbs.length > this.maxBreadcrumbs) {
        this.breadcrumbs.shift();
      }

      if (this.debug) {
        console.log('[TelemetrySDK] Breadcrumb added:', crumb);
      }
    },

    /**
     * Intercepts DOM click interactions.
     */
    setupBreadcrumbListeners() {
      document.addEventListener('click', (event) => {
        const target = event.target;
        if (!target) return;

        // Skip non-interactive tags if they are too generic (e.g. HTML, BODY)
        const tagName = target.tagName;
        if (tagName === 'HTML' || tagName === 'BODY') return;

        const id = target.id ? `#${target.id}` : '';
        const classes = target.className && typeof target.className === 'string'
          ? '.' + target.className.trim().split(/\s+/).join('.')
          : '';
        const text = target.innerText ? target.innerText.substring(0, 30).trim() : '';

        // Check for custom tracking attributes
        const telemetryLabel = target.getAttribute('data-telemetry-label') || '';

        const message = telemetryLabel 
          ? `Clicked "${telemetryLabel}"`
          : `Clicked <${tagName.toLowerCase()}${id}${classes.substring(0, 40)}> with text "${text}"`;

        this.addBreadcrumb({
          category: 'ui',
          type: 'click',
          message: message,
          metadata: {
            tagName,
            id: target.id || null,
            telemetryLabel: telemetryLabel || null
          }
        });
      }, true); // Capture phase to catch clicks before they might be stopped by stopPropagation()
    },

    /**
     * Hooks into global window error events.
     */
    setupErrorListeners() {
      // 1. Uncaught Runtime Errors
      window.addEventListener('error', (event) => {
        // Skip script loading errors (these don't have error objects)
        if (!event.error && !event.message) return;

        const error = event.error || {};
        const payload = {
          type: 'error',
          level: 'error',
          message: event.message || error.message || 'Unknown runtime error',
          path: window.location.pathname + window.location.search,
          metadata: {
            stack: error.stack || null,
            filename: event.filename || null,
            lineno: event.lineno || null,
            colno: event.colno || null,
            environment: this.getEnvironmentInfo()
          }
        };

        this.sendErrorImmediately(payload);
      });

      // 2. Unhandled Promise Rejections
      window.addEventListener('unhandledrejection', (event) => {
        const reason = event.reason || {};
        const message = typeof reason === 'string' 
          ? reason 
          : reason.message || 'Unhandled Promise Rejection';

        const payload = {
          type: 'error',
          level: 'error',
          message: message,
          path: window.location.pathname + window.location.search,
          metadata: {
            stack: reason.stack || null,
            isRejection: true,
            environment: this.getEnvironmentInfo()
          }
        };

        this.sendErrorImmediately(payload);
      });
    },

    /**
     * Intercepts SPA history changes.
     */
    setupRouteListeners() {
      const self = this;
      const trackNavigation = (from, to) => {
        self.addBreadcrumb({
          category: 'navigation',
          type: 'route_change',
          message: `Navigated from "${from}" to "${to}"`
        });
      };

      let currentPath = window.location.pathname;

      // Intercept History pushState
      const originalPushState = history.pushState;
      history.pushState = function (...args) {
        const from = currentPath;
        originalPushState.apply(this, args);
        currentPath = window.location.pathname;
        trackNavigation(from, currentPath);
      };

      // Intercept History replaceState
      const originalReplaceState = history.replaceState;
      history.replaceState = function (...args) {
        const from = currentPath;
        originalReplaceState.apply(this, args);
        currentPath = window.location.pathname;
        trackNavigation(from, currentPath);
      };

      // Listen to popstate (browser back/forward button clicks)
      window.addEventListener('popstate', () => {
        const from = currentPath;
        currentPath = window.location.pathname;
        trackNavigation(from, currentPath);
      });
    },

    /**
     * Helper to extract browser environment details.
     */
    getEnvironmentInfo() {
      const ua = navigator.userAgent;
      let browser = 'Unknown';
      let os = 'Unknown';

      // Simple browser parsing
      if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
      else if (ua.indexOf('Safari') > -1) browser = 'Safari';
      else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
      else if (ua.indexOf('MSIE') > -1 || !!document.documentMode) browser = 'IE';

      // Simple OS parsing
      if (ua.indexOf('Windows') > -1) os = 'Windows';
      else if (ua.indexOf('Mac') > -1) os = 'MacOS';
      else if (ua.indexOf('Linux') > -1) os = 'Linux';
      else if (ua.indexOf('Android') > -1) os = 'Android';
      else if (ua.indexOf('iPhone') > -1) os = 'iOS';

      return {
        browser,
        os,
        userAgent: ua,
        screen: `${window.screen.width}x${window.screen.height}`,
        language: navigator.language
      };
    },

    /**
     * Send standard track logs.
     */
    trackPageView() {
      this.send({
        type: 'page_view',
        level: 'info',
        message: `Page View: ${window.location.pathname}`,
        path: window.location.pathname + window.location.search
      });
    },

    /**
     * Custom manual log tracking.
     */
    log(message, type = 'click', level = 'info', metadata = {}) {
      this.send({
        type,
        level,
        message,
        path: window.location.pathname + window.location.search,
        metadata
      });
    },

    /**
     * Immediately dispatches errors by attaching the breadcrumbs timeline.
     */
    sendErrorImmediately(errorPayload) {
      // Attach the click breadcrumbs timeline to the error payload metadata!
      errorPayload.metadata.breadcrumbs = [...this.breadcrumbs];
      
      // Also add the error itself to the breadcrumb trail
      this.addBreadcrumb({
        category: 'error',
        type: 'crash',
        message: errorPayload.message
      });

      this.send(errorPayload);
    },

    /**
     * Dispatches telemetry logs using navigator.sendBeacon or fallback fetch.
     */
    send(payload) {
      const eventData = {
        apiKey: this.apiKey,
        sessionId: this.sessionId,
        timestamp: new Date().toISOString(),
        ...payload
      };

      if (this.debug) {
        console.log('[TelemetrySDK] Sending event:', eventData);
      }

      const url = `${this.endpoint}?apiKey=${this.apiKey}`;
      const payloadString = JSON.stringify(eventData);

      // Perform transport delivery using non-blocking API
      try {
        if (navigator.sendBeacon) {
          // sendBeacon sends data as text/plain to prevent triggering pre-flights
          const blob = new Blob([payloadString], { type: 'text/plain' });
          navigator.sendBeacon(url, blob);
        } else {
          fetch(url, {
            method: 'POST',
            body: payloadString,
            headers: {
              'Content-Type': 'application/json'
            },
            keepalive: true // key for making request survive page unloads
          });
        }
      } catch (err) {
        if (this.debug) {
          console.error('[TelemetrySDK] Transport error:', err);
        }
      }
    }
  };

  // Register SDK globally
  window.TelemetrySDK = TelemetrySDK;
})();
