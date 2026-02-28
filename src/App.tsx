import { Component } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Admin } from './pages/Admin';
import { Viewer } from './pages/Viewer';

class ErrorBoundary extends Component<{ children: any }, { error: Error | null }> {
    state = { error: null as Error | null };
    static getDerivedStateFromError(e: Error) { return { error: e }; }
    render() {
        if (this.state.error) {
            return (
                <pre style={{ color: 'red', background: '#111', padding: 20, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {String(this.state.error)}{'\n'}{this.state.error?.stack}
                </pre>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    return (
        <ErrorBoundary>
            <BrowserRouter>
                <Routes>
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/" element={<Viewer />} />
                </Routes>
            </BrowserRouter>
        </ErrorBoundary>
    );
}