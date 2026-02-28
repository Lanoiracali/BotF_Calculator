import '../viewer.css';
import { GameViewer } from '../components/Viewer/GameViewer';

export function Viewer() {
    return (
        <div className="viewer-root">
            <GameViewer />
        </div>
    );
}
