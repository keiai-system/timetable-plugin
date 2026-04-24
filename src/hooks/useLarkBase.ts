import { useCallback, useEffect, useRef, useState } from 'react';
import type { Assignment } from '../types';

type LarkSdkModule = typeof import('@lark-base-open/js-sdk');

const TARGET_TABLE_ID = 'tbl0iQH2LOGFOMry';
const TARGET_TABLE_NAME = '予約管理';

const FIELD_PATIENT_NAME = '患者名';
const FIELD_PATIENT_TYPE = '患者種別';
const FIELD_PATIENT_STATUS = '新旧';
const FIELD_DOCTOR = '担当医師';
const FIELD_NURSE = '担当看護師';
const FIELD_DATE = '日付';
const FIELD_TIME = '時間帯';

const REQUIRED_FIELDS = [
  FIELD_PATIENT_NAME,
  FIELD_PATIENT_TYPE,
  FIELD_PATIENT_STATUS,
  FIELD_DOCTOR,
  FIELD_NURSE,
  FIELD_DATE,
  FIELD_TIME,
];

const DOCTOR_MASTER_TABLE = 'マスタ_医師';
const NURSE_MASTER_TABLE = 'マスタ_看護師';
const DOCTOR_CANDIDATE_FIELDS = ['医師', '氏名', '名前', '名称', '表示名', 'name'];
const NURSE_CANDIDATE_FIELDS = ['看護師', '氏名', '名前', '名称', '表示名', 'name'];

async function loadLarkSdk(): Promise<LarkSdkModule> {
  return import('@lark-base-open/js-sdk');
}

function normalizeDateString(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const matched = trimmed.match(/^(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!matched) return trimmed;
  const [, year, month, day] = matched;
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
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

async function resolveScheduleTable(bitable: LarkSdkModule['bitable']) {
  const searchParams = new URLSearchParams(window.location.search);
  const tableIdFromUrl = searchParams.get('table');

  const candidates: Array<() => Promise<any>> = [];

  if (tableIdFromUrl) {
    candidates.push(() => bitable.base.getTableById(tableIdFromUrl));
  }

  candidates.push(async () => {
    const selection = await bitable.base.getSelection();
    if (!selection.tableId) {
      throw new Error('selection.tableId is empty');
    }
    return bitable.base.getTableById(selection.tableId);
  });

  candidates.push(() => bitable.base.getTableById(TARGET_TABLE_ID));
  candidates.push(() => bitable.base.getTableByName(TARGET_TABLE_NAME));
  candidates.push(() => bitable.base.getActiveTable());

  let lastError: unknown = null;

  for (const candidate of candidates) {
    try {
      const table = await candidate();
      const meta = await table.getMeta();
      if (meta.id === TARGET_TABLE_ID || meta.name === TARGET_TABLE_NAME) {
        return table;
      }
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('予約管理テーブルに接続できませんでした。');
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
  const [errorMsg, setErrorMsg] = useState('');
  const [warningMsg, setWarningMsg] = useState('');
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
  const initializedRef = useRef(false);

  const fetchData = useCallback(async () => {
    if (isFetching) return;

    setIsFetching(true);
    setLoading(true);
    setHasAttemptedConnection(true);

    try {
      const { bitable, FieldType } = await loadLarkSdk();
      const table = await resolveScheduleTable(bitable);
      const fields = await table.getFieldList();
      const fieldNames = await getFieldNames(table);
      const fieldMap: Record<string, any> = {};

      for (const field of fields) {
        const meta = await field.getMeta();
        fieldMap[meta.name] = field;

        if (meta.type === FieldType.SingleSelect || meta.type === FieldType.MultiSelect) {
          const options = ((meta.property as any)?.options ?? []).map((option: any) => option.name);
          if (meta.name === FIELD_DOCTOR) setDoctorOptions(options);
          if (meta.name === FIELD_NURSE) setNurseOptions(options);
          if (meta.name === FIELD_PATIENT_NAME) setPatientOptions(options);
          if (meta.name === FIELD_TIME) setTimeOptions(options);
          if (meta.name === FIELD_PATIENT_TYPE) setPatientTypeOptions(options);
          if (meta.name === FIELD_PATIENT_STATUS) setPatientStatusOptions(options);
        }
      }

      const missingFields = REQUIRED_FIELDS.filter((name) => !fieldNames.includes(name));
      if (missingFields.length > 0) {
        throw new Error(`必須フィールドが不足しています: ${missingFields.join(', ')}`);
      }

      try {
        const [doctorMasterOptions, nurseMasterOptions] = await Promise.all([
          readMasterOptions(bitable, DOCTOR_MASTER_TABLE, DOCTOR_CANDIDATE_FIELDS),
          readMasterOptions(bitable, NURSE_MASTER_TABLE, NURSE_CANDIDATE_FIELDS),
        ]);

        if (doctorMasterOptions.length > 0) setDoctorOptions(doctorMasterOptions);
        if (nurseMasterOptions.length > 0) setNurseOptions(nurseMasterOptions);
      } catch {
        setWarningMsg('医師・看護師マスタの候補取得に失敗しました。予約管理テーブルの選択肢を利用します。');
      }

      const recordIdList = await table.getRecordIdList();

      const getStr = async (fieldName: string, recordId: string) => {
        const field = fieldMap[fieldName];
        if (!field) return '';

        if (fieldName === FIELD_DATE) {
          const rawValue = await field.getValue(recordId);
          if (typeof rawValue === 'number') {
            const date = new Date(rawValue);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
          }
        }

        const value = await field.getCellString(recordId);
        return fieldName === FIELD_DATE ? normalizeDateString(value || '') : (value || '');
      };

      const loaded: Assignment[] = [];
      for (const recordId of recordIdList) {
        const assignment: Assignment = {
          id: recordId,
          patientName: await getStr(FIELD_PATIENT_NAME, recordId),
          patientType: await getStr(FIELD_PATIENT_TYPE, recordId),
          patientStatus: await getStr(FIELD_PATIENT_STATUS, recordId),
          doctorName: await getStr(FIELD_DOCTOR, recordId),
          nurseName: await getStr(FIELD_NURSE, recordId),
          date: await getStr(FIELD_DATE, recordId),
          time: await getStr(FIELD_TIME, recordId),
        };

        if (
          assignment.patientName &&
          assignment.patientType &&
          assignment.patientStatus &&
          assignment.doctorName &&
          assignment.nurseName &&
          assignment.date &&
          assignment.time
        ) {
          loaded.push(assignment);
        }
      }

      setAssignments(loaded);
      setDetectedFields(fieldNames);
      setDebugLines([]);
      setErrorMsg('');
      setWarningMsg((current) => current);
      setHasResolvedContext(true);
      setIsLarkEnv(true);
      setIsSupportedContext(true);
      setUnsupportedReason('');
    } catch (error) {
      const message = String((error as Error)?.message ?? error);
      setErrorMsg(message);
      setHasResolvedContext(false);
      setAssignments([]);
      setDebugLines([message]);
      setIsLarkEnv(true);
      setIsSupportedContext(true);
      setUnsupportedReason('');
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  }, [isFetching]);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;
    void fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const buildFieldPayload = async (table: any, record: Omit<Assignment, 'id'> | Partial<Assignment>) => {
    const { FieldType } = await loadLarkSdk();
    const fieldList = await table.getFieldList();
    const fieldIdMap: Record<string, string> = {};
    const fieldMetaMap: Record<string, any> = {};

    for (const field of fieldList) {
      const meta = await field.getMeta();
      fieldIdMap[meta.name] = meta.id;
      fieldMetaMap[meta.name] = meta;
    }

    const pairs: Array<[string, string | undefined]> = [
      [FIELD_PATIENT_NAME, record.patientName],
      [FIELD_PATIENT_TYPE, record.patientType],
      [FIELD_PATIENT_STATUS, record.patientStatus],
      [FIELD_DOCTOR, record.doctorName],
      [FIELD_NURSE, record.nurseName],
      [FIELD_DATE, record.date],
      [FIELD_TIME, record.time],
    ];

    const payload: Record<string, any> = {};

    for (const [fieldName, value] of pairs) {
      if (!value) continue;

      const fieldId = fieldIdMap[fieldName];
      const meta = fieldMetaMap[fieldName];
      if (!fieldId || !meta) continue;

      if (fieldName === FIELD_DATE) {
        payload[fieldId] = new Date(value).getTime();
        continue;
      }

      if (meta.type === FieldType.SingleSelect || meta.type === FieldType.MultiSelect) {
        const options = ((meta.property as any)?.options ?? []);
        const matched = options.find((option: any) => option.name === value);
        if (matched) {
          payload[fieldId] = { id: matched.id };
        }
        continue;
      }

      payload[fieldId] = value;
    }

    return payload;
  };

  const addAssignment = async (data: Omit<Assignment, 'id'>) => {
    try {
      const { bitable } = await loadLarkSdk();
      const table = await resolveScheduleTable(bitable);
      const fields = await buildFieldPayload(table, data);
      await table.addRecord({ fields });
      await fetchData();
    } catch (error) {
      setWarningMsg(String((error as Error)?.message ?? error));
    }
  };

  const updateAssignment = async (id: string, data: Partial<Assignment>) => {
    try {
      const { bitable } = await loadLarkSdk();
      const table = await resolveScheduleTable(bitable);
      const fields = await buildFieldPayload(table, data);
      await table.setRecord(id, { fields });
      await fetchData();
    } catch (error) {
      setWarningMsg(String((error as Error)?.message ?? error));
    }
  };

  const deleteAssignment = async (id: string) => {
    try {
      const { bitable } = await loadLarkSdk();
      const table = await resolveScheduleTable(bitable);
      await table.deleteRecord(id);
      await fetchData();
    } catch (error) {
      setWarningMsg(String((error as Error)?.message ?? error));
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
