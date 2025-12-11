import './style.css'

// ==========================================
// 1. CONFIGURATION
// ==========================================
// ✅ UPDATED: Your Team's Real Backend URL
const CONVEX_URL = "https://festive-bobcat-708.convex.cloud";

// ==========================================
// 2. HELPER: CONVEX FETCHER (The Connector)
// ==========================================
async function convexQuery(functionName, args = {}) {
  try {
    const response = await fetch(`${CONVEX_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: functionName, args: args }),
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.status === "success" ? json.value : null;
  } catch (e) {
    console.error("Convex Query Error:", e);
    return null;
  }
}

async function convexMutation(functionName, args = {}) {
  try {
    fetch(`${CONVEX_URL}/api/mutation`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: functionName, args: args }),
    });
  } catch (e) {
    console.error("Convex Mutation Error:", e);
  }
}

// ==========================================
// 3. LOGIC: TARGETING & FREQUENCY
// ==========================================
function shouldShowTour(targeting) {
  if (!targeting) return true;
  
  // A. URL Check
  const currentUrl = window.location.href;
  if (targeting.urlPattern) {
    if (targeting.urlMatchType === "exact" && currentUrl !== targeting.urlPattern) return false;
    if (targeting.urlMatchType === "contains" && !currentUrl.includes(targeting.urlPattern)) return false;
  }
  return true;
}

function hasSeenTour(tourId, frequency) {
  const key = `walkmanjs_${tourId}`;
  if (frequency === "always") return false;
  if (frequency === "session") return sessionStorage.getItem(key) !== null;
  // Default to "once"
  return localStorage.getItem(key) !== null;
}

function markTourSeen(tourId, frequency) {
  const key = `walkmanjs_${tourId}`;
  if (frequency === "session") sessionStorage.setItem(key, "true");
  else localStorage.setItem(key, "true"); // "once"
}

function getVisitorId() {
  let id = localStorage.getItem("walkman_visitor_id");
  if (!id) {
    id = `visitor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("walkman_visitor_id", id);
  }
  return id;
}

// ==========================================
// 4. MAIN ENGINE
// ==========================================
let currentTour = null;
let tourSteps = [];
let currentStepIndex = 0;
let visitorId = getVisitorId();

async function initWalkman() {
  // 1. Get Config from Script Tag
  const scriptTag = document.currentScript || document.querySelector('script[src*="tour.js"]') || document.querySelector('script[src*="main.js"]');
  const tourId = scriptTag?.getAttribute('data-tour-id');
  const apiKey = scriptTag?.getAttribute('data-api-key');

  // --- FALLBACK FOR LOCAL TESTING (Use if no ID provided) ---
  if (!tourId) {
    console.warn("WalkmanJS: No Tour ID found. (Running in Demo Mode?)");
    // If you want to test locally without an ID, uncomment the next line:
    // return runDemoMode(); 
    return;
  }

  // 2. Validate API Key
  const isValid = await convexQuery("api.apiKeys.validate", { key: apiKey });
  if (!isValid) {
    console.error("WalkmanJS: Invalid API Key.");
    return;
  }

  // 3. Fetch Tour Config
  const tour = await convexQuery("api.tours.get", { tourId });
  if (!tour || tour.status !== "active") {
    console.log("WalkmanJS: Tour not active or found.");
    return;
  }

  // 4. Check Targeting
  if (!shouldShowTour(tour.targeting)) {
    console.log("WalkmanJS: URL targeting not matched.");
    return;
  }
  if (hasSeenTour(tourId, tour.targeting?.frequency || "once")) {
    console.log("WalkmanJS: Tour already seen.");
    return;
  }

  // 5. Fetch Steps
  const steps = await convexQuery("api.steps.list", { tourId });
  if (!steps || steps.length === 0) {
    console.log("WalkmanJS: No steps found.");
    return;
  }

  // 6. Apply Theming
  if (tour.theme) {
    const root = document.documentElement;
    if (tour.theme.primaryColor) root.style.setProperty('--wjs-primary', tour.theme.primaryColor);
    if (tour.theme.backgroundColor) root.style.setProperty('--wjs-bg', tour.theme.backgroundColor);
    if (tour.theme.textColor) root.style.setProperty('--wjs-text', tour.theme.textColor);
    if (tour.theme.borderRadius) root.style.setProperty('--wjs-radius', `${tour.theme.borderRadius}px`);
    if (tour.theme.overlayOpacity) root.style.setProperty('--wjs-overlay-opacity', tour.theme.overlayOpacity);
  }

  // 7. Start Tour
  currentTour = tour;
  tourSteps = steps;
  
  // Handle Trigger (Delay)
  const delay = (tour.targeting?.triggerDelay || 0) * 1000;
  setTimeout(() => {
    trackEvent("tour_started");
    renderWidget();
  }, delay);
}

// ==========================================
// 5. ANALYTICS & UI
// ==========================================

function trackEvent(eventName, stepId = null) {
  if (!currentTour) return;
  convexMutation("api.analytics.track", {
    tourId: currentTour._id,
    visitorId: visitorId,
    event: eventName,
    stepId: stepId
  });
}

function updateSpotlight(targetElement) {
  // Use the theme's overlay setting (default to true if not specified)
  if (currentTour?.theme?.overlayEnabled === false) return; 

  let overlay = document.getElementById('walkman-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'walkman-overlay';
    overlay.className = 'walkman-overlay'; 
    document.body.appendChild(overlay);
    setTimeout(() => overlay.classList.add('active'), 10);
  }
  
  document.querySelectorAll('.walkman-highlight').forEach(el => el.classList.remove('walkman-highlight'));
  
  if (targetElement && targetElement.tagName !== 'BODY') {
    targetElement.classList.add('walkman-highlight');
  }
}

function renderWidget() {
  const existingWidget = document.getElementById('walkman-widget');
  if (existingWidget) existingWidget.remove();

  if (!tourSteps[currentStepIndex]) return;

  const step = tourSteps[currentStepIndex];
  // Look for selector
  const targetElement = document.querySelector(step.targetSelector || step.target); 
  const isMobile = window.innerWidth < 768;

  trackEvent("step_viewed", step._id); 
  updateSpotlight(targetElement);

  const widget = document.createElement('div');
  widget.id = 'walkman-widget';
  widget.className = 'walkman-card'; 
  
  widget.innerHTML = `
    <div class="walkman-header">
      <h3>${step.title}</h3>
      <span class="walkman-step-count">Step ${currentStepIndex + 1}/${tourSteps.length}</span>
    </div>
    <div class="walkman-body"><p>${step.content || step.description}</p></div> 
    <div class="walkman-footer">
      <div class="walkman-nav-group">
        ${currentStepIndex > 0 ? '<button id="walkman-prev">Back</button>' : ''}
        <button id="walkman-next" class="walkman-btn-primary">${currentStepIndex === tourSteps.length - 1 ? 'Finish' : 'Next'}</button>
      </div>
      <button id="walkman-skip">Skip</button>
    </div>
  `;

  document.body.appendChild(widget);

  // Positioning Logic
  if (targetElement && (step.targetSelector !== 'body' && step.target !== 'body')) {
    if (isMobile) {
      widget.style.position = ''; 
      setTimeout(() => targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    } else {
      const rect = targetElement.getBoundingClientRect();
      const widgetRect = widget.getBoundingClientRect();
      let topPos = rect.bottom + window.scrollY + 15;
      let leftPos = rect.left + window.scrollX;

      if (leftPos + widgetRect.width > window.innerWidth) leftPos = window.innerWidth - widgetRect.width - 20;
      if (leftPos < 20) leftPos = 20;

      widget.style.position = 'absolute';
      widget.style.top = `${topPos}px`;
      widget.style.left = `${leftPos}px`;
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    widget.style.position = 'fixed';
    widget.style.bottom = '20px';
    widget.style.right = '20px';
  }

  // Button Listeners
  document.getElementById('walkman-skip').addEventListener('click', () => {
    trackEvent("step_skipped", step._id);
    trackEvent("tour_exited");
    closeTour();
  });

  const nextBtn = document.getElementById('walkman-next');
  if(nextBtn) nextBtn.addEventListener('click', nextStep);

  const prevBtn = document.getElementById('walkman-prev');
  if(prevBtn) prevBtn.addEventListener('click', prevStep);
}

function nextStep() {
  const step = tourSteps[currentStepIndex];
  trackEvent("step_completed", step._id);

  if (currentStepIndex < tourSteps.length - 1) {
    currentStepIndex++;
    renderWidget();
  } else {
    finishTour();
  }
}

function prevStep() {
  if (currentStepIndex > 0) {
    currentStepIndex--;
    renderWidget();
  }
}

function finishTour() {
  trackEvent("tour_completed");
  if (currentTour) {
    markTourSeen(currentTour._id, currentTour.targeting?.frequency || "once");
  }
  closeTour();
}

function closeTour() {
  const widget = document.getElementById('walkman-widget');
  if (widget) widget.remove();
  
  const overlay = document.getElementById('walkman-overlay');
  if (overlay) {
    overlay.classList.remove('active'); 
    setTimeout(() => overlay.remove(), 400); 
  }
  
  document.querySelectorAll('.walkman-highlight').forEach(el => el.classList.remove('walkman-highlight'));
}

// ==========================================
// 6. DEMO MODE (Localhost Testing)
// ==========================================
function runDemoMode() {
  console.log("WalkmanJS: Running Demo Mode");
  // FAKE DATA for testing
  tourSteps = [
    { _id: "d1", title: "Welcome", content: "This is a demo tour.", targetSelector: "body" },
    { _id: "d2", title: "Features", content: "Click here!", targetSelector: "#features-link" },
    { _id: "d3", title: "Get Started", content: "Sign up now.", targetSelector: "#cta-btn" }
  ];
  currentTour = { _id: "demo_tour", theme: { overlayEnabled: true } };
  renderWidget();
}

// Start Engine
initWalkman();