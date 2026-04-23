import { FullTimetableApp } from './components/FullTimetableApp';

function App() {
  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>時間割プラグイン</h1>
        <p className="subtitle">フルモード</p>
      </header>

      <main className="app-main">
        <FullTimetableApp />
      </main>
    </div>
  );
}

export default App;
