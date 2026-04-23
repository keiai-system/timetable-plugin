import { useMemo } from 'react';
import { useLarkBase } from '../hooks/useLarkBase';
import { TimetableWorkspace } from './TimetableWorkspace';

const DEFAULT_TIME_OPTIONS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export function FullTimetableApp() {
  const {
    assignments,
    loading: loadingBase,
    isLarkEnv,
    isSupportedContext,
    unsupportedReason,
    errorMsg,
    warningMsg,
    detectedFields,
    doctorOptions,
    nurseOptions,
    patientOptions,
    timeOptions,
    patientTypeOptions,
    patientStatusOptions,
    debugLines,
    isFetching,
    hasAttemptedConnection,
    hasResolvedContext,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    refresh,
  } = useLarkBase();

  const effectiveTimeOptions = useMemo(
    () => (timeOptions.length > 0 ? timeOptions : DEFAULT_TIME_OPTIONS),
    [timeOptions],
  );

  const statusText = isFetching || loadingBase
    ? 'Lark Base 接続中'
    : !hasAttemptedConnection
      ? 'Base API 未接続（接続を試してください）'
      : hasResolvedContext
        ? 'Lark Base 接続あり'
        : 'Base API 未接続';

  const showConnectionWarning = isLarkEnv && !hasResolvedContext;

  return (
    <>
      <div className="no-print" style={{ padding: '0 16px' }}>
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 14px',
            borderRadius: '8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            fontSize: '13px',
            color: '#475569',
          }}
        >
          <div>画面描画: React 起動済み</div>
          <div>接続状態: {statusText}</div>
          {errorMsg ? <div style={{ color: '#b91c1c', marginTop: '4px' }}>詳細: {errorMsg}</div> : null}
          {warningMsg ? <div style={{ color: '#b45309', marginTop: '4px' }}>補足: {warningMsg}</div> : null}
          {detectedFields.length > 0 ? (
            <div style={{ marginTop: '4px' }}>検出フィールド: {detectedFields.join(', ')}</div>
          ) : null}
          {debugLines.length > 0 ? (
            <div style={{ marginTop: '8px', fontSize: '12px', color: '#334155' }}>
              <div>診断ログ:</div>
              {debugLines.map((line) => (
                <div key={line}>{line}</div>
              ))}
            </div>
          ) : null}
          <div style={{ marginTop: '10px' }}>
            <button
              onClick={() => void refresh()}
              disabled={isFetching}
              style={{
                padding: '6px 12px',
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '6px',
                cursor: isFetching ? 'wait' : 'pointer',
                fontWeight: '600',
                opacity: isFetching ? 0.7 : 1,
              }}
            >
              {isFetching ? '接続中...' : hasAttemptedConnection ? '再取得' : '接続を試す'}
            </button>
          </div>
        </div>
      </div>

      {!isSupportedContext && isLarkEnv ? (
        <div
          style={{
            margin: '0 16px 16px',
            padding: '24px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        >
          <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>このタブでは利用できません</h2>
          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            このプラグインは指定された時間割 Base での利用を想定しています。
          </p>
          {unsupportedReason ? (
            <div style={{ marginTop: '12px', color: '#b91c1c' }}>詳細: {unsupportedReason}</div>
          ) : null}
        </div>
      ) : null}

      {showConnectionWarning ? (
        <div
          style={{
            margin: '0 16px 16px',
            padding: '24px',
            background: '#fff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        >
          <h2 style={{ marginBottom: '8px', fontSize: '20px' }}>Base 接続を待っています</h2>
          <p style={{ color: '#475569', lineHeight: 1.6 }}>
            予約管理テーブルへ接続できるまで、データ保存は行えません。レイアウト確認はこのまま可能です。
          </p>
        </div>
      ) : null}

      <TimetableWorkspace
        assignments={assignments}
        doctorOptions={doctorOptions}
        nurseOptions={nurseOptions}
        patientOptions={patientOptions}
        timeOptions={effectiveTimeOptions}
        patientTypeOptions={patientTypeOptions}
        patientStatusOptions={patientStatusOptions}
        addAssignment={addAssignment}
        updateAssignment={updateAssignment}
        deleteAssignment={deleteAssignment}
        refresh={refresh}
      />

      {!isLarkEnv ? (
        <div style={{ padding: '16px', color: '#b45309' }}>
          GitHub Pages などの単体表示では Base 連携なしで時間割レイアウトのみ表示します。
        </div>
      ) : null}
    </>
  );
}
