import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

const root = document.getElementById('root')!
const app = (
  <React.StrictMode>
    <App path={window.location.pathname} />
  </React.StrictMode>
)

// Pages are prerendered at build time (scripts/prerender.mjs), so hydrate them;
// the dev server serves an empty #root, so render from scratch there.
if (root.hasChildNodes()) {
  ReactDOM.hydrateRoot(root, app)
} else {
  ReactDOM.createRoot(root).render(app)
}
