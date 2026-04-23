import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')

function showBootMessage(message: string, details?: string) {
  const target = rootElement ?? document.body
  if (!target) return

  target.innerHTML = `
    <div style="padding:24px;font-family:Inter,'Noto Sans JP',sans-serif;color:#0f172a;">
      <div style="font-size:20px;font-weight:700;margin-bottom:12px;">時間割プラグイン</div>
      <div style="margin-bottom:8px;">${message}</div>
      ${details ? `<pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;padding:12px;border-radius:8px;">${details}</pre>` : ''}
    </div>
  `
}

if (!rootElement) {
  showBootMessage('描画先の root 要素が見つかりません。')
} else {
  try {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  } catch (error) {
    const details = error instanceof Error ? `${error.message}\n${error.stack ?? ''}` : String(error)
    showBootMessage('React の初期化に失敗しました。', details)
  }
}
