import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

console.log('[MindCurrent] main.tsx loaded')

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: '#dc3545', color: 'white', padding: '40px', height: '100%', fontFamily: 'monospace' }}>
          <h1 style={{ fontSize: '20px', marginBottom: '16px' }}>React 渲染错误</h1>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: '14px' }}>
            {this.state.error?.message}
            {'\n\n'}
            {this.state.error?.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

// Load real app
import App from './App'

const rootEl = document.getElementById('root')
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  )
  console.log('[MindCurrent] React rendered App with ErrorBoundary')
}
