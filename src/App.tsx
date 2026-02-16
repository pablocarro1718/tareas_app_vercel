import { useState, useEffect, useRef, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { FolderScreen } from './components/FolderScreen';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { startSyncListeners } from './services/sync';

type Screen =
  | { type: 'home' }
  | { type: 'folder'; folderId: string };

type TransitionState = 'idle' | 'entering-folder' | 'leaving-folder';

const TRANSITION_DURATION = 300;

function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'home' });
  const [transition, setTransition] = useState<TransitionState>('idle');
  const pendingFolderId = useRef<string | null>(null);
  useOfflineQueue();

  useEffect(() => {
    startSyncListeners();
  }, []);

  const handleOpenFolder = useCallback((folderId: string) => {
    if (transition !== 'idle') return;
    pendingFolderId.current = folderId;
    setTransition('entering-folder');
    setTimeout(() => {
      setScreen({ type: 'folder', folderId });
      setTransition('idle');
    }, TRANSITION_DURATION);
  }, [transition]);

  const handleBack = useCallback(() => {
    if (transition !== 'idle') return;
    setTransition('leaving-folder');
    setTimeout(() => {
      setScreen({ type: 'home' });
      setTransition('idle');
      pendingFolderId.current = null;
    }, TRANSITION_DURATION);
  }, [transition]);

  const isHome = screen.type === 'home';
  const isFolder = screen.type === 'folder';
  const showBoth = transition !== 'idle';

  // Animation classes
  const homeStyle = (): React.CSSProperties => {
    if (transition === 'entering-folder') {
      return { animation: `screen-fade-out ${TRANSITION_DURATION}ms ease-out forwards` };
    }
    if (transition === 'leaving-folder') {
      return { animation: `screen-fade-in ${TRANSITION_DURATION}ms ease-out forwards` };
    }
    return {};
  };

  const folderStyle = (): React.CSSProperties => {
    if (transition === 'entering-folder') {
      return { animation: `screen-fade-in ${TRANSITION_DURATION}ms ease-out forwards` };
    }
    if (transition === 'leaving-folder') {
      return { animation: `screen-fade-out ${TRANSITION_DURATION}ms ease-out forwards` };
    }
    return {};
  };

  const currentFolderId = isFolder ? screen.folderId : pendingFolderId.current;

  return (
    <div className="relative min-h-full bg-black">
      {/* Home screen */}
      {(isHome || showBoth) && (
        <div className="absolute inset-0" style={homeStyle()}>
          <HomeScreen onOpenFolder={handleOpenFolder} />
        </div>
      )}

      {/* Folder screen */}
      {(isFolder || showBoth) && currentFolderId && (
        <div className="absolute inset-0" style={folderStyle()}>
          <FolderScreen folderId={currentFolderId} onBack={handleBack} />
        </div>
      )}
    </div>
  );
}

export default App;
