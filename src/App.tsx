import { useState, useEffect } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { FolderScreen } from './components/FolderScreen';
import { useOfflineQueue } from './hooks/useOfflineQueue';
import { startSyncListeners } from './services/sync';

type Screen =
  | { type: 'home' }
  | { type: 'folder'; folderId: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'home' });
  useOfflineQueue();

  useEffect(() => {
    // Start listening to Firestore changes (bidirectional sync)
    // Individual operations already push to Firestore on create/update/delete,
    // so we only need to listen for remote changes here.
    startSyncListeners();
  }, []);

  if (screen.type === 'home') {
    return (
      <HomeScreen
        onOpenFolder={(folderId) => setScreen({ type: 'folder', folderId })}
      />
    );
  }

  return (
    <FolderScreen
      folderId={screen.folderId}
      onBack={() => setScreen({ type: 'home' })}
    />
  );
}

export default App;
