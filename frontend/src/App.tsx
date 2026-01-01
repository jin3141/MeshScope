/**
 * MeshScope メインアプリケーション
 */
import { useState } from 'react';
import { Map } from './components/Map';
import { StatsPanel } from './components/StatsPanel';
import type { MeshStatistics } from './types';

function App() {
  const [selectedMesh, setSelectedMesh] = useState<MeshStatistics | null>(null);

  return (
    <div className="flex flex-col md:flex-row w-screen h-screen">
      <StatsPanel stats={selectedMesh} />
      <div className="flex-1">
        <Map onMeshSelect={setSelectedMesh} />
      </div>
    </div>
  );
}

export default App;
