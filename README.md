
-----

# 🎧 WalkmanJS - Embeddable Product Tour Widget

**WalkmanJS** is a lightweight, framework-agnostic widget that allows website owners to easily embed guided product tours on their applications. This is the **Embeddable Element** component of the WalkmanJS ecosystem.

📦 **Script URL:** `https://walkmanjs-widget.netlify.app/walkman.js`

-----

## ✨ Key Features

  * **⚡ Lightweight & Fast:** Built with Vite and Vanilla JavaScript (no heavy framework dependencies).
  * **🧠 Smart Positioning:** Automatically calculates position to avoid screen edges (Collision Detection).
  * **📱 Mobile Optimized:** Transforms into a "Focus Mode" bottom sheet on smaller screens.
  * **🔦 Spotlight Effect:** Dims the background and highlights the target element for better focus.
  * **🔄 Resume Capability:** Remembers the user's progress via `localStorage` if they reload the page.
  * **🎨 Themeable:** Fully customizable via CSS Variables (colors, radius, opacity).
  * **📊 Analytics Ready:** Tracks views, skips, and completions directly to the backend.
  * **🛡️ Secure:** Validates API keys with the backend before initializing.

-----

## 🚀 Integration Guide

To add the tour to any website, simply add the following code snippet.

### 1\. Add Styles

Add this line to the `<head>` of your HTML document:

```html
<link rel="stylesheet" href="https://walkmanjs-widget.netlify.app/walkman.css">
```

### 2\. Add Script

Add this script tag at the end of your `<body>`. Replace the placeholders with your actual IDs.

```html
<script 
  src="https://walkman-widget.netlify.app/tour.js" 
  data-tour-id="YOUR_TOUR_ID" 
  data-api-key="YOUR_API_KEY">
</script>
```

| Attribute | Description | Required |
| :--- | :--- | :--- |
| `data-tour-id` | The unique ID of the tour created in the Dashboard. | ✅ Yes |
| `data-api-key` | The public API key for your WalkmanJS account. | ✅ Yes |

-----

## 🛠️ Configuration & Theming

The widget automatically inherits styles defined in the Dashboard. However, you can override them manually using CSS variables in your site's CSS:

```css
:root {
  --wjs-primary: #6366f1;       /* Main Button/Header Color */
  --wjs-bg: #ffffff;            /* Widget Background */
  --wjs-text: #1f2937;          /* Text Color */
  --wjs-radius: 12px;           /* Corner Radius */
  --wjs-overlay-opacity: 0.7;   /* Spotlight Darkness (0-1) */
}
```

-----

## 🏗️ Development Setup

This project is built using **Vite**. To run it locally:

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/walkmanjs-widget.git
    cd walkmanjs-widget
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Start the development server:**

    ```bash
    npm run dev
    ```

    Visit `http://localhost:5173` to see the demo site.

4.  **Build for Production:**

    ```bash
    npm run build
    ```

    The output files will be in the `dist/` folder.

-----

## 📂 Project Structure

```text
/
├── dist/                # Production build (tour.js + tour.css)
├── src/
│   ├── main.js          # Core logic (Targeting, Fetching, UI)
│   ├── style.css        # Widget styling + Mobile responsiveness
│   
├── index.html           # Demo "Host" page for testing integration
├── package.json         # Project dependencies
└── vite.config.js       # Build configuration
```

-----

## 🔗 Backend Connection

This widget connects to a **Convex** backend.

  * **Query Method:** `tours:getPublicTour`
  * **Analytics Method:** `analytics:trackEvent`

-----



