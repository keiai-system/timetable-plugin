import { useMemo } from 'react';
import { BridgeDiagnostic } from './components/BridgeDiagnostic';
import { FullTimetableApp } from './components/FullTimetableApp';

function App() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const isDiagnosticMode = searchParams.get('mode') === 'diagnostic';

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>時間割プラグイン</h1>
        <p className="subtitle">{isDiagnosticMode ? '最小診断モード' : 'フルモード'}</p>
      </header>

      <main className="app-main">
        {isDiagnosticMode ? <BridgeDiagnostic /> : <FullTimetableApp />}
      </main>
    </div>
  );
}

export default App;
