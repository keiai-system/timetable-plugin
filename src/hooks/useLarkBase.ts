import { useState, useCallback, useRef } from 'react';
import type { Assignment } from '../types';

type LarkSdkModule = typeof import('@lark-base-open/js-sdk');
const TARGET_TABLE_ID = 'tbl0iQH2LOGFOMry';
const TARGET_TABLE_NAME = '予約管理';
const ACTIVE_TABLE_RETRY_DELAYS_MS = [800, 1500, 2500];
const RESOLUTION_ROUND_DELAYS_MS = [0, 1200, 2500];
const BRIDGE_WARMUP_DELAYS_MS = [0, 1200, 2500];
const REQUIRED_FIELDS = ['患者名', '患者種別', '新旧', '担当医師', '担当看護師', '日付', '時間帯'];
const DOCTOR_MASTER_TABLE = 'マスタ_医師';
const NURSE_MASTER_TABLE = 'マスタ_看護師';
const DOCTOR_CANDIDATE_FIELDS = ['医師', '氏名', '名前', '医師名', '名称', '表示名', 'name'];
const NURSE_CANDIDATE_FIELDS = ['看護師', '氏名', '名前', '看護師名', '名称', '表示名', 'name'];

async function loadLarkSdk(): Promise<LarkSdkModule> {
    return import('@lark-base-open/js-sdk');
}

async function getFieldNames(table: any): Promise<string[]> {
    const fields = await table.getFieldList();
    const names: string[] = [];

    for (const field of fields) {
        const meta = await field.getMeta();
        names.push(meta.name);
    }

    return names;
}

function isTimeoutError(error: unknown): boolean {
    return String((error as Error)?.message ?? error).includes('time out');
}

function normalizeDateString(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const matched = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
    if (!matched) return trimmed;
    const [, year, month, day] = matched;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function wait(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}

async function resolveScheduleTable(bitable: LarkSdkModule['bitable']) {
    let table: any;
    const debugLines: string[] = [];
    const searchParams = new URLSearchParams(window.location.search);
    const tableIdFromUrl = searchParams.get('table');
    let lastError: unknown = null;
    let tableMetas: Array<{ id: string; name: string }> = [];

    for (let roundIndex = 0; roundIndex < RESOLUTION_ROUND_DELAYS_MS.length && !table; roundIndex += 1) {
        const delayMs = RESOLUTION_ROUND_DELAYS_MS[roundIndex];
        if (delayMs > 0) {
            debugLines.push(`retry resolution after ${delayMs}ms`);
            await wait(delayMs);
        }

        try {
            tableMetas = await bitable.base.getTableMetaList();
            debugLines.push(`getTableMetaList succeeded: ${tableMetas.length} tables`);
        } catch (metaError) {
            debugLines.push(`getTableMetaList failed: ${String((metaError as Error)?.message ?? metaError)}`);
            lastError = metaError;
        }

        const candidates: Array<{
            label: string;
            resolve: () => Promise<any>;
        }> = [
            tableIdFromUrl
                ? {
                    label: `getTableById(url:${tableIdFromUrl})`,
                    resolve: () => bitable.base.getTableById(tableIdFromUrl),
                }
                : null,
            {
                label: 'getSelection',
                resolve: async () => {
                    const selection = await bitable.base.getSelection();
                    debugLines.push(
                        `selection: base=${selection.baseId}, table=${selection.tableId}, view=${selection.viewId}`,
                    );
                    if (!selection.tableId) {
                        throw new Error('selection.tableId is empty');
                    }
                    return bitable.base.getTableById(selection.tableId);
                },
            },
            {
                label: `getTableById(${TARGET_TABLE_ID})`,
                resolve: () => bitable.base.getTableById(TARGET_TABLE_ID),
            },
            tableMetas.some((meta) => meta.id === TARGET_TABLE_ID)
                ? {
                    label: `meta matched id ${TARGET_TABLE_ID}`,
                    resolve: () => bitable.base.getTableById(TARGET_TABLE_ID),
                }
                : null,
            tableMetas.some((meta) => meta.name === TARGET_TABLE_NAME)
                ? {
                    label: `meta matched name ${TARGET_TABLE_NAME}`,
                    resolve: () => bitable.base.getTableByName(TARGET_TABLE_NAME),
                }
                : null,
            {
                label: `getTableByName(${TARGET_TABLE_NAME})`,
                resolve: () => bitable.base.getTableByName(TARGET_TABLE_NAME),
            },
            {
                label: 'getActiveTable',
                resolve: async () => {
                    try {
                        return await bitable.base.getActiveTable();
                    } catch (error) {
                        debugLines.push(`getActiveTable initial failed: ${String((error as Error)?.message ?? error)}`);
                        if (!isTimeoutError(error)) {
                            throw error;
                        }

                        for (const activeDelayMs of ACTIVE_TABLE_RETRY_DELAYS_MS) {
                            debugLines.push(`retry getActiveTable after ${activeDelayMs}ms`);
                            await wait(activeDelayMs);
                            try {
                                const activeTable = await bitable.base.getActiveTable();
                                debugLines.push(`getActiveTable recovered after ${activeDelayMs}ms wait`);
                                return activeTable;
                            } catch (retryError) {
                                debugLines.push(`retry failed: ${String((retryError as Error)?.message ?? retryError)}`);
                            }
                        }

                        throw new Error('time out');
                    }
                },
            },
        ].filter(Boolean) as Array<{ label: string; resolve: () => Promise<any> }>;

        for (const candidate of candidates) {
            try {
                table = await candidate.resolve();
                debugLines.push(`${candidate.label} succeeded`);
                break;
            } catch (error) {
                debugLines.push(`${candidate.label} failed: ${String((error as Error)?.message ?? error)}`);
                lastError = error;
            }
        }
    }

    if (!table) {
        throw Object.assign(lastError instanceof Error ? lastError : new Error(String(lastError ?? 'time out')), {
            debugLines,
        });
    }

    const meta = await table.getMeta();
    const fieldNames = await getFieldNames(table);
    const missingFields = REQUIRED_FIELDS.filter((name) => !fieldNames.includes(name));

    const resolvedDebugLines = [
        ...debugLines,
        `activeTable: ${meta.name} (${meta.id})`,
        `fields: ${fieldNames.join(', ')}`,
    ];

    const matchesTarget = meta.id === TARGET_TABLE_ID || meta.name === TARGET_TABLE_NAME;

    if (!matchesTarget) {
        throw Object.assign(
            new Error(`現在のテーブルは予約管理ではありません。active=${meta.name} (${meta.id})`),
            { debugLines: resolvedDebugLines },
        );
    }

    if (missingFields.length > 0) {
        throw Object.assign(
            new Error(`予約管理テーブルの必須列が不足しています: ${missingFields.join(', ')}`),
            { debugLines: [...resolvedDebugLines, `missing: ${missingFields.join(', ')}`] },
        );
    }

    return { table, fieldNames, debugLines: resolvedDebugLines };
}

async function warmupBaseBridge(bitable: LarkSdkModule['bitable']): Promise<{ success: boolean; debugLines: string[] }> {
    const debugLines: string[] = [];

    for (let roundIndex = 0; roundIndex < BRIDGE_WARMUP_DELAYS_MS.length; roundIndex += 1) {
        const delayMs = BRIDGE_WARMUP_DELAYS_MS[roundIndex];
        if (delayMs > 0) {
            debugLines.push(`warmup retry after ${delayMs}ms`);
            await wait(delayMs);
        }

        const attempts = await Promise.allSettled([
            bitable.base.getSelection(),
            bitable.base.getActiveTable(),
            bitable.base.getTableMetaList(),
        ]);

        const [selectionResult, activeTableResult, tableMetaResult] = attempts;

        if (selectionResult.status === 'fulfilled') {
            debugLines.push(
                `warmup getSelection succeeded: table=${selectionResult.value.tableId || 'null'}, view=${selectionResult.value.viewId || 'null'}`,
            );
            return { success: true, debugLines };
        }
        debugLines.push(`warmup getSelection failed: ${String(selectionResult.reason?.message ?? selectionResult.reason)}`);

        if (activeTableResult.status === 'fulfilled') {
            const activeMeta = await activeTableResult.value.getMeta();
            debugLines.push(`warmup getActiveTable succeeded: ${activeMeta.name} (${activeMeta.id})`);
            return { success: true, debugLines };
        }
        debugLines.push(`warmup getActiveTable failed: ${String(activeTableResult.reason?.message ?? activeTableResult.reason)}`);

        if (tableMetaResult.status === 'fulfilled') {
            debugLines.push(`warmup getTableMetaList succeeded: ${tableMetaResult.value.length} tables`);
            return { success: true, debugLines };
        }
        debugLines.push(`warmup getTableMetaList failed: ${String(tableMetaResult.reason?.message ?? tableMetaResult.reason)}`);
    }

    return { success: false, debugLines };
}

async function readMasterOptions(
    bitable: LarkSdkModule['bitable'],
    tableName: string,
    candidateFields: string[],
): Promise<string[]> {
    const table = await bitable.base.getTableByName(tableName);
    const fields = await table.getFieldList();
    const recordIds = await table.getRecordIdList();

    let targetField: any = null;
    let fallbackField: any = null;

    for (const field of fields) {
        const meta = await field.getMeta();
        if (!fallbackField) {
            fallbackField = field;
        }
        if (candidateFields.includes(meta.name)) {
            targetField = field;
            break;
        }
    }

    const sourceField = targetField ?? fallbackField;
    if (!sourceField) {
        return [];
    }

    const options: string[] = [];
    for (const recordId of recordIds) {
        const value = (await sourceField.getCellString(recordId)).trim();
        if (value) {
            options.push(value);
        }
    }

    return [...new Set(options)];
}

export function useLarkBase() {
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [loading, setLoading] = useState(false);
    const [isLarkEnv, setIsLarkEnv] = useState(true);
    const [isSupportedContext, setIsSupportedContext] = useState(true);
    const [unsupportedReason, setUnsupportedReason] = useState('');
    const [detectedFields, setDetectedFields] = useState<string[]>([]);
    const [errorMsg, setErrorMsg] = useState<string>('');
    const [warningMsg, setWarningMsg] = useState<string>('');
    // Field Options from Single Selects
    const [doctorOptions, setDoctorOptions] = useState<string[]>([]);
    const [nurseOptions, setNurseOptions] = useState<string[]>([]);
    const [patientOptions, setPatientOptions] = useState<string[]>([]);
    const [timeOptions, setTimeOptions] = useState<string[]>([]);
    const [patientTypeOptions, setPatientTypeOptions] = useState<string[]>([]);
    const [patientStatusOptions, setPatientStatusOptions] = useState<string[]>([]);
    const [debugLines, setDebugLines] = useState<string[]>([]);
    const [isFetching, setIsFetching] = useState(false);
    const [hasAttemptedConnection, setHasAttemptedConnection] = useState(false);
    const [hasResolvedContext, setHasResolvedContext] = useState(false);
    const hasLoadedDataRef = useRef(false);
    const stageRef = useRef('idle');

    const ensureSupportedContext = useCallback(async () => {
        const { bitable } = await loadLarkSdk();
        const warmup = await warmupBaseBridge(bitable);
        setDebugLines(warmup.debugLines);
        const { table, fieldNames, debugLines: resolutionDebugLines } = await resolveScheduleTable(bitable);
        setDebugLines([...warmup.debugLines, ...resolutionDebugLines]);

        return { bitable, table, fieldNames };
    }, []);

    const fetchData = useCallback(async () => {
        if (isFetching) {
            return;
        }
        setHasAttemptedConnection(true);
        setIsFetching(true);
        setLoading(true);
        try {
            stageRef.current = 'sdk import';
            const { FieldType } = await loadLarkSdk();
            stageRef.current = 'resolve active table';
            const { bitable, table, fieldNames } = await ensureSupportedContext();
            stageRef.current = 'load field list';
            const fields = await table.getFieldList();
            const foundFields: string[] = [...fieldNames];
            const fieldObjMap: Record<string, any> = {}; // 実際のIFieldオブジェクトを保持

            for (const f of fields) {
                const meta = await f.getMeta();
                fieldObjMap[meta.name] = f;

                // Extract Single Select Options
                if (meta.type === FieldType.SingleSelect || meta.type === FieldType.MultiSelect) {
                    const opts = (meta.property as any)?.options?.map((opt: any) => opt.name) || [];
                    if (meta.name === '担当医師') setDoctorOptions(opts);
                    if (meta.name === '担当看護師') setNurseOptions(opts);
                    if (meta.name === '患者名') setPatientOptions(opts);
                    if (meta.name === '時間帯') setTimeOptions(opts);
                    if (meta.name === '患者種別') setPatientTypeOptions(opts);
                    if (meta.name === '新旧') setPatientStatusOptions(opts);
                }
            }

            try {
                stageRef.current = 'load doctor/nurse masters';
                const [doctorMasterOptions, nurseMasterOptions] = await Promise.all([
                    readMasterOptions(bitable, DOCTOR_MASTER_TABLE, DOCTOR_CANDIDATE_FIELDS),
                    readMasterOptions(bitable, NURSE_MASTER_TABLE, NURSE_CANDIDATE_FIELDS),
                ]);

                if (doctorMasterOptions.length > 0) {
                    setDoctorOptions(doctorMasterOptions);
                }
                if (nurseMasterOptions.length > 0) {
                    setNurseOptions(nurseMasterOptions);
                }
            } catch (masterError) {
                setWarningMsg('マスタ_医師 / マスタ_看護師 の候補取得に失敗しました。予約管理テーブルの選択肢を使用します。');
            }

            // Load Records Safely via recordIdList and getCellString
            stageRef.current = 'load record ids';
            const recordIdList = await table.getRecordIdList();
            const loaded: Assignment[] = [];

            const getStr = async (name: string, id: string) => {
                const f = fieldObjMap[name];
                if (!f) return '';
                try {
                    // Date field expects strict YYYY-MM-DD
                    if (name === '日付') {
                        const rawVal = await f.getValue(id);
                        if (typeof rawVal === 'number') {
                            const d = new Date(rawVal);
                            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                        }
                    }
                    const val = await f.getCellString(id);
                    if (name === '譌･莉・) {
                        return normalizeDateString(val || '');
                    }
                    return val || '';
                } catch (e) {
                    return '';
                }
            };

            for (const id of recordIdList) {
                stageRef.current = `read record ${id}`;
                const patientName = await getStr('患者名', id);
                const patientType = await getStr('患者種別', id);
                const patientStatus = await getStr('新旧', id);
                const doctorName = await getStr('担当医師', id);
                const nurseName = await getStr('担当看護師', id);
                const date = await getStr('日付', id);
                const time = await getStr('時間帯', id);

                if (patientName && patientType && patientStatus && doctorName && nurseName && date && time) {
                    loaded.push({
                        id,
                        patientName,
                        patientType: (patientType || '外来') as '病棟' | '外来',
                        patientStatus: (patientStatus || '新患') as '再来' | '新患',
                        doctorName,
                        nurseName,
                        date,
                        time
                    });
                }
            }
            setDetectedFields(foundFields);
            setAssignments(loaded);
            setLoading(false);
            hasLoadedDataRef.current = true;
            setHasResolvedContext(true);
            setIsLarkEnv(true);
            setIsSupportedContext(true);
            setUnsupportedReason('');
            setErrorMsg('');
            stageRef.current = 'completed';
        } catch (e: any) {
            const message = e ? String(e.message || e) : 'Unknown Error';
            const stageLine = `stage: ${stageRef.current}`;
            if (Array.isArray(e?.debugLines) && e.debugLines.length > 0) {
                setDebugLines([stageLine, ...e.debugLines]);
            } else {
                setDebugLines([stageLine, `error: ${message}`]);
            }
            if (message.includes('time out')) {
                setErrorMsg(`予約管理テーブルとの接続待ちです。停止箇所: ${stageRef.current}`);
                setWarningMsg('Base API の初期化待ちです。自動再試行は止めています。必要なら再取得してください。');
                setLoading(false);
                setHasResolvedContext(false);
                setIsLarkEnv(true);
                setIsSupportedContext(true);
                setUnsupportedReason('');
            } else {
                setErrorMsg(message);
                setHasResolvedContext(false);
                setIsLarkEnv(false);
                setIsSupportedContext(false);
                setUnsupportedReason(message);
                setLoading(!hasLoadedDataRef.current);
            }
        } finally {
            setIsFetching(false);
        }
    }, [ensureSupportedContext, isFetching]);

    const refresh = useCallback(async () => {
        setDebugLines((current) => [...current, 'schedule refresh after click unwind']);
        await new Promise((resolve) => window.setTimeout(resolve, 150));
        await fetchData();
    }, [fetchData]);

    const addAssignment = async (data: Omit<Assignment, 'id'>) => {
        if (!isLarkEnv || !isSupportedContext) {
            return;
        }
        try {
            const { table } = await ensureSupportedContext();
            const { FieldType } = await loadLarkSdk();
            const fieldIdMap: Record<string, string> = {};
            const fieldMetaMap: Record<string, any> = {};
            const fieldsList = await table.getFieldList();
            for (const f of fieldsList) {
                const meta = await f.getMeta();
                fieldIdMap[meta.name] = meta.id;
                fieldMetaMap[meta.name] = meta;
            }

            const buildField = async (name: string, val: string | undefined) => {
                if (!val) return null;
                const fid = fieldIdMap[name];
                const meta = fieldMetaMap[name];
                if (!fid || !meta) return null;

                if (name === '日付') return new Date(val).getTime();

                // Explicitly send Single Select object to prevent dropping
                if (meta.type === FieldType.SingleSelect || meta.type === FieldType.MultiSelect) {
                    const opts = (meta.property as any)?.options || [];
                    const matchedOpt = opts.find((o: any) => o.name === val);
                    if (matchedOpt) {
                        return { id: matchedOpt.id };
                    }
                    return null;
                }

                // Any other field (Text) takes the raw string value safely
                return val;
            };

            const recordFields: Record<string, any> = {};
            const pairs: Array<[string, string | undefined]> = [
                ['患者名', data.patientName],
                ['患者種別', data.patientType],
                ['新旧', data.patientStatus],
                ['担当医師', data.doctorName],
                ['担当看護師', data.nurseName],
                ['日付', data.date],
                ['時間帯', data.time]
            ];

            for (const [name, val] of pairs) {
                if (val && fieldIdMap[name]) {
                    const built = await buildField(name, val);
                    if (built !== null) recordFields[fieldIdMap[name]] = built;
                }
            }

            if (Object.keys(recordFields).length > 0) {
                await table.addRecord({ fields: recordFields });
                await fetchData();
            }
        } catch (e) {
            setWarningMsg('保存時にエラーが発生しました。接続状態を確認して再取得してください。');
        }
    };

    const updateAssignment = async (id: string, data: Partial<Assignment>) => {
        if (!isLarkEnv || !isSupportedContext) {
            return;
        }
        try {
            const { table } = await ensureSupportedContext();
            const { FieldType } = await loadLarkSdk();
            const fieldIdMap: Record<string, string> = {};
            const fieldMetaMap: Record<string, any> = {};
            const fieldsList = await table.getFieldList();
            for (const f of fieldsList) {
                const meta = await f.getMeta();
                fieldIdMap[meta.name] = meta.id;
                fieldMetaMap[meta.name] = meta;
            }

            const buildField = async (name: string, val: string | undefined) => {
                if (!val) return null;
                const fid = fieldIdMap[name];
                const meta = fieldMetaMap[name];
                if (!fid || !meta) return null;

                if (name === '日付') return new Date(val).getTime();

                // Explicitly send Single Select object
                if (meta.type === FieldType.SingleSelect || meta.type === FieldType.MultiSelect) {
                    const opts = (meta.property as any)?.options || [];
                    const matchedOpt = opts.find((o: any) => o.name === val);
                    if (matchedOpt) {
                        return { id: matchedOpt.id };
                    }
                    return null;
                }

                return val;
            };

            const recordFields: Record<string, any> = {};
            const pairs: Array<[string, string | undefined]> = [
                ['患者名', data.patientName],
                ['患者種別', data.patientType],
                ['新旧', data.patientStatus],
                ['担当医師', data.doctorName],
                ['担当看護師', data.nurseName],
                ['日付', data.date],
                ['時間帯', data.time]
            ];

            for (const [name, val] of pairs) {
                if (val && fieldIdMap[name]) {
                    const built = await buildField(name, val);
                    if (built !== null) recordFields[fieldIdMap[name]] = built;
                }
            }

            if (Object.keys(recordFields).length > 0) {
                await table.setRecord(id, { fields: recordFields });
                await fetchData();
            }
        } catch (e) {
            setWarningMsg('更新時にエラーが発生しました。接続状態を確認して再取得してください。');
        }
    };

    const deleteAssignment = async (id: string) => {
        if (!isLarkEnv || !isSupportedContext) {
            return;
        }
        try {
            const { table } = await ensureSupportedContext();
            await table.deleteRecord(id);
            await fetchData();
        } catch (e) {
            setWarningMsg('削除時にエラーが発生しました。接続状態を確認して再取得してください。');
        }
    };

    return {
        assignments,
        loading,
        isLarkEnv,
        isSupportedContext,
        unsupportedReason,
        detectedFields,
        errorMsg,
        warningMsg,
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
    };
}
