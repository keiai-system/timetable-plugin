import React, { useState, useEffect, useCallback } from 'react';
import type { NursingDiaryData } from '../types';

type LarkSdkModule = typeof import('@lark-base-open/js-sdk');

async function loadLarkSdk(): Promise<LarkSdkModule> {
    return import('@lark-base-open/js-sdk');
}

export function useNursingDiary(date: string, ward: string) {
    const [data, setData] = useState<NursingDiaryData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const isFetchingRef = React.useRef(false);

    const fetchDiary = useCallback(async () => {
        if (!date || !ward) return;
        setLoading(true);
        isFetchingRef.current = true;
        
        // タイムアウト処理: 1.5秒待ってもLark APIから返答がない場合はサンプルを表示
        const timeoutId = setTimeout(() => {
            if (isFetchingRef.current) {
                console.warn('Lark API timeout. Falling back to sample data.');
                setSampleData(date, ward);
                setLoading(false);
                isFetchingRef.current = false;
            }
        }, 1500);

        try {
            const { bitable, FieldType } = await loadLarkSdk();
            const table = await bitable.base.getTableByName('看護日誌');
            const recordIdList = await table.getRecordIdList();
            
            // 日付と部署が一致するレコードを探す
            // 本来はフィルタリングAPIを使うべきだが、簡易的に全走査
            let foundRecord: any = null;
            const fields = await table.getFieldList();
            let dateField: any = null;
            let wardField: any = null;

            for (const field of fields) {
                const meta = await field.getMeta();
                if (!dateField && (meta.type === FieldType.DateTime || meta.name === '日付')) {
                    dateField = field;
                }
                if (!wardField && meta.name === '部署') {
                    wardField = field;
                }
            }

            if (!dateField || !wardField) {
                throw new Error('「日付」または「部署」フィールドが見つかりません。');
            }

            for (const id of recordIdList) {
                const rDateNum = await dateField.getValue(id);
                const rWard = await wardField.getCellString(id);
                
                let rDateStr = '';
                if (typeof rDateNum === 'number') {
                    const d = new Date(rDateNum);
                    rDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                }
                
                if (rDateStr === date && rWard === ward) {
                    const recordData: any = { id };
                    for (const f of fields) {
                        const meta = await f.getMeta();
                        recordData[meta.name] = await f.getCellString(id);
                    }
                    foundRecord = recordData;
                    break;
                }
            }

            if (foundRecord) {
                setData(foundRecord);
            } else {
                // レコードが見つからない場合は、空のデータ（新規作成用）をセット
                setEmptyData(date, ward);
            }
        } catch (e: any) {
            console.warn('看護日誌テーブルの読み込みに失敗しました（未作成の可能性があります）。サンプルを表示します。', e);
            setError(e ? String(e.message || e) : '看護日誌テーブルの読み込みに失敗しました。');
            setSampleData(date, ward);
        } finally {
            clearTimeout(timeoutId);
            isFetchingRef.current = false;
            setLoading(false);
        }
    }, [date, ward]);

    const setEmptyData = (date: string, ward: string) => {
        setData({
            日付: date,
            部署: ward,
            看護師_日勤: '',
            看護師_夜勤: '',
            看護師_明け: '',
            看護師_公休: '',
            看護師_有休: '',
            看護師_欠勤: '',
            准看護師_日勤: '',
            准看護師_夜勤: '',
            准看護師_明け: '',
            准看護師_公休: '',
            准看護師_有休: '',
            准看護師_欠勤: '',
            看護補助者_日勤: '',
            看護補助者_夜勤: '',
            看護補助者_明け: '',
            看護補助者_公休: '',
            看護補助者_有休: '',
            看護補助者_欠勤: '',
            "特記事項_8:30-16:45": '',
            "特記事項_16:30-9:00": '',
            "巡視_17:00": '', "巡視_18:00": '', "巡視_19:00": '', "巡視_20:00": '', "巡視_21:00": '', "巡視_22:00": '', "巡視_23:00": '', 
            "巡視_1:30": '', "巡視_4:00": '', "巡視_6:00": '', "巡視_7:00": '', "巡視_8:00": ''
        });
    }

    const setSampleData = (date: string, ward: string) => {
        setData({
            日付: date,
            部署: ward,
            看護師_日勤: '佐藤 美咲、田中 優子、鈴木 一郎',
            看護師_夜勤: '高橋 健二',
            看護師_明け: '伊藤 幸子',
            看護師_公休: '渡辺 亮',
            看護師_有休: '小林 友美',
            看護師_欠勤: '',
            准看護師_日勤: '中村 舞、加藤 浩',
            准看護師_夜勤: '木村 拓也',
            准看護師_明け: '清水 亮子',
            准看護師_公休: '',
            准看護師_有休: '',
            准看護師_欠勤: '',
            看護補助者_日勤: '山口 達也、森 喜朗',
            看護補助者_夜勤: '岡田 准一',
            看護補助者_明け: '松本 潤',
            看護補助者_公休: '',
            看護補助者_有休: '',
            看護補助者_欠勤: '',
            "特記事項_8:30-16:45": '・新人オリエンテーション実施\n・203病室 清掃完了',
            "特記事項_16:30-9:00": '・夜間急患対応あり（1名）',
            "巡視_17:00": '田中', "巡視_18:00": '田中', "巡視_19:00": '佐藤', "巡視_20:00": '佐藤', 
            "巡視_21:00": '高橋', "巡視_22:00": '高橋', "巡視_23:00": '高橋', 
            "巡視_1:30": '高橋', "巡視_4:00": '高橋', "巡視_6:00": '佐藤', "巡視_7:00": '佐藤', "巡視_8:00": '佐藤'
        });
    }

    useEffect(() => {
        fetchDiary();
    }, [fetchDiary]);

    const updateField = async (fieldName: keyof NursingDiaryData, value: string) => {
        if (!data) return;
        
        // ローカルステートを即座に更新
        const newData = { ...data, [fieldName]: value };
        setData(newData);

        try {
            const { bitable, FieldType } = await loadLarkSdk();
            const table = await bitable.base.getTableByName('看護日誌');
            const fields = await table.getFieldList();
            const field = fields.find(f => (f as any).name === fieldName);
            
            if (!field) {
                console.warn(`Field ${String(fieldName)} not found in table.`);
                return;
            }

            const fieldMeta = await field.getMeta();

            if (data.id) {
                // 既存レコード更新
                const updateObj: any = { fields: {} };
                if (fieldMeta.type === FieldType.SingleSelect) {
                    const props = (fieldMeta.property as any);
                    const opt = props.options?.find((o: any) => o.name === value);
                    updateObj.fields[fieldMeta.id] = opt ? { id: opt.id } : null;
                } else {
                    updateObj.fields[fieldMeta.id] = value;
                }
                await table.setRecord(data.id, updateObj);
            } else {
                // 新規レコード作成
                // 他のフィールドも必要なので一気に作成
                const recordFields: any = {};
                for (const f of fields) {
                    const meta = await f.getMeta();
                    const val = (newData as any)[meta.name];
                    if (val) {
                        if (meta.name === '日付') {
                           recordFields[meta.id] = new Date(val).getTime();
                        } else if (meta.type === FieldType.SingleSelect) {
                           const opt = (meta.property as any).options?.find((o: any) => o.name === val);
                           if (opt) recordFields[meta.id] = { id: opt.id };
                        } else {
                           recordFields[meta.id] = val;
                        }
                    }
                }
                const res = await table.addRecord({ fields: recordFields });
                setData({ ...newData, id: res });
            }
        } catch (e) {
            console.error('Failed to save field', e);
        }
    };

    return { data, loading, error, updateField, refresh: fetchDiary };
}
