import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message: string;
};

/**
 * Catches render errors in the dashboard content area so the sidebar/header stay visible.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Unexpected error",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, message: "" });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold text-foreground">Something went wrong</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.message || "This page failed to load. Try again or reload."}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <Button type="button" variant="outline" onClick={this.handleReset}>
              Try again
            </Button>
            <Button type="button" onClick={this.handleReload}>
              Reload
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
