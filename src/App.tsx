import { useState } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { FolderScreen } from './components/FolderScreen';
import { useOfflineQueue } from './hooks/useOfflineQueue';

type Screen =
  | { type: 'home' }
  | { type: 'folder'; folderId: string };

function App() {
  const [screen, setScreen] = useState<Screen>({ type: 'home' });
  useOfflineQueue();

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
