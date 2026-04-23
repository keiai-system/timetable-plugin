import { useEffect, useState } from 'react';

type DiagnosticState = {
  status: 'idle' | 'running' | 'success' | 'error';
  summary: string;
  lines: string[];
};

type LarkSdkModule = typeof import('@lark-base-open/js-sdk');

const INITIAL_LINES = ['React は起動しました。Base bridge の疎通だけを確認します。'];

async function loadLarkSdk(): Promise<LarkSdkModule> {
  return import('@lark-base-open/js-sdk');
}

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

function describeError(error: unknown): string {
  if (error && typeof error === 'object') {
    const maybeError = error as { code?: unknown; message?: unknown; name?: unknown };
    const parts = [
      maybeError.code !== undefined ? `code=${String(maybeError.code)}` : '',
      maybeError.name ? `name=${String(maybeError.name)}` : '',
      maybeError.message ? `message=${String(maybeError.message)}` : '',
    ].filter(Boolean);

    if (parts.length > 0) {
      return parts.join(', ');
    }
  }

  return stringifyError(error);
}

export function BridgeDiagnostic() {
  const [diagnostic, setDiagnostic] = useState<DiagnosticState>({
    status: 'idle',
    summary: '診断待機中',
    lines: INITIAL_LINES,
  });

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const lines: string[] = [];
      const push = (line: string) => {
        lines.push(line);
        if (!cancelled) {
          setDiagnostic((current) => ({
            ...current,
            lines: [...lines],
          }));
        }
      };

      if (!cancelled) {
        setDiagnostic({
          status: 'running',
          summary: 'Base bridge 診断中',
          lines: [...INITIAL_LINES],
        });
      }

      try {
        push('SDK import 開始');
        const { bitable } = await loadLarkSdk();
        push('SDK import 成功');

        try {
          const env = await bitable.bridge.getEnv();
          push(`bridge.getEnv 成功: ${JSON.stringify(env)}`);
        } catch (error) {
          push(`bridge.getEnv 失敗: ${describeError(error)}`);
          console.error('bridge.getEnv error', error);
        }

        try {
          const language = await bitable.bridge.getLanguage();
          push(`bridge.getLanguage 成功: ${language}`);
        } catch (error) {
          push(`bridge.getLanguage 失敗: ${describeError(error)}`);
          console.error('bridge.getLanguage error', error);
        }

        try {
          const selection = await bitable.base.getSelection();
          push(`getSelection 成功: base=${selection.baseId || 'null'}, table=${selection.tableId || 'null'}, view=${selection.viewId || 'null'}`);
        } catch (error) {
          push(`getSelection 失敗: ${describeError(error)}`);
          console.error('getSelection error', error);
        }

        try {
          const activeTable = await bitable.base.getActiveTable();
          const meta = await activeTable.getMeta();
          push(`getActiveTable 成功: ${meta.name} (${meta.id})`);
        } catch (error) {
          push(`getActiveTable 失敗: ${describeError(error)}`);
          console.error('getActiveTable error', error);
        }

        try {
          const tableMetas = await bitable.base.getTableMetaList();
          push(`getTableMetaList 成功: ${tableMetas.length} tables`);
          tableMetas.forEach((meta: any) => {
            push(`table: ${meta.name} (${meta.id})`);
          });
        } catch (error) {
          push(`getTableMetaList 失敗: ${describeError(error)}`);
          console.error('getTableMetaList error', error);
        }

        const hasBaseApiSuccess = lines.some(
          (line) =>
            line.startsWith('getSelection 成功') ||
            line.startsWith('getActiveTable 成功') ||
            line.startsWith('getTableMetaList 成功'),
        );
        if (!cancelled) {
          setDiagnostic({
            status: hasBaseApiSuccess ? 'success' : 'error',
            summary: hasBaseApiSuccess
              ? '少なくとも一部の Base API は応答しました'
              : '拡張は起動しましたが、Base bridge には接続できていません',
            lines,
          });
        }
      } catch (error) {
        push(`診断全体が失敗: ${stringifyError(error)}`);
        if (!cancelled) {
          setDiagnostic({
            status: 'error',
            summary: '診断起動に失敗しました',
            lines,
          });
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, []);

  const statusColor =
    diagnostic.status === 'success'
      ? '#166534'
      : diagnostic.status === 'error'
        ? '#b91c1c'
        : '#475569';

  return (
    <div
      style={{
        maxWidth: '960px',
        margin: '0 auto',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        padding: '24px',
      }}
    >
      <div style={{ fontSize: '14px', color: '#475569', marginBottom: '8px' }}>画面描画: React 起動済み</div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: statusColor, marginBottom: '16px' }}>
        {diagnostic.summary}
      </div>
      <div style={{ fontSize: '13px', color: '#334155', display: 'grid', gap: '8px' }}>
        {diagnostic.lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  );
}
