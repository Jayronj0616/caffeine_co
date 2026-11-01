import React from 'react';
import ErrorState from './ErrorState';

/**
 * Catches render-time failures under the router, mainly a lazy route chunk
 * that didn't load. That happens when the network drops mid-navigation, or
 * after a deploy when the tab still points at chunk hashes that no longer
 * exist. Without a boundary React unmounts the whole tree and leaves a
 * blank page.
 *
 * Reset on navigation (resetKey = pathname) so one failed page doesn't
 * pin the error over every other route.
 */
class RouteErrorBoundary extends React.Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  componentDidCatch(error) {
    console.error('Route failed to render:', error);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="mx-auto max-w-xl px-6 pt-32">
        <ErrorState
          title="This page didn't load"
          message="Part of the app couldn't be downloaded. Check your connection and reload the page."
          // A full reload re-fetches index.html, which picks up current chunk hashes.
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }
}

export default RouteErrorBoundary;
