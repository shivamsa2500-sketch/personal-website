import React from 'react'
import { renderToString } from 'react-dom/server'
import App, { formatPrice, templatePages, templatePath, templates, type Template } from './App'

export { formatPrice, templatePages, templatePath, templates }
export type { Template }

export function render(path: string): string {
  return renderToString(
    <React.StrictMode>
      <App path={path} />
    </React.StrictMode>,
  )
}
