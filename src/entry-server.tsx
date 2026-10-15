import React from 'react'
import { renderToString } from 'react-dom/server'
import App, { socialLinks, templatePages, templatePath, templates, type Template } from './App'

export { socialLinks, templatePages, templatePath, templates }
export type { Template }

export function render(path: string): string {
  return renderToString(
    <React.StrictMode>
      <App path={path} />
    </React.StrictMode>,
  )
}
