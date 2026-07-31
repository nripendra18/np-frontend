import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    this.setState({ error, info });
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="app-shell" style={{ paddingTop: 32 }}>
          <div className="card">
            <h2 style={{ fontSize: 20 }}>Something went wrong</h2>
            <p className="error-text">{String(this.state.error?.message || this.state.error)}</p>
            <details style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>
              {this.state.info?.componentStack}
            </details>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
