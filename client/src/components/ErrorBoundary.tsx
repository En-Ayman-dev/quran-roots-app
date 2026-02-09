import { Component, ReactNode } from "react";
import { ServerError } from "./errors/ServerError";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ServerError
          error={this.state.error || undefined}
          onRetry={() => window.location.reload()}
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
