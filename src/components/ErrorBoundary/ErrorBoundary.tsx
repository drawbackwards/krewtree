import React from 'react'

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            fontFamily: 'sans-serif',
            gap: 12,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--kt-primary)', margin: 0 }}>
            Something went wrong
          </h1>
          <p style={{ color: 'var(--kt-text-muted)', margin: 0 }}>Refresh the page to try again.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: 8,
              padding: '9px 22px',
              cursor: 'pointer',
              background: 'var(--kt-primary)',
              color: 'var(--kt-white)',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Reload page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
