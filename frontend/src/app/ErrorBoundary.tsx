import { Component, type ErrorInfo, type PropsWithChildren } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {
      hasError: true,
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled frontend error", {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  handleReset = () => {
    this.setState({ hasError: false });
    window.location.assign("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error" role="alert">
          <h1>Application error</h1>
          <p>The operations console encountered an unexpected problem.</p>
          <button type="button" onClick={this.handleReset}>
            Return to overview
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}
