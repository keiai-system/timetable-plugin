import React, { useState, useEffect } from 'react';
import type { Assignment } from '../types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Omit<Assignment, 'id'>) => void;
    onDelete?: () => void;
    onCopy?: (data: Omit<Assignment, 'id'>) => void;
    initialData?: Assignment | null;
    defaultDate?: string;
    defaultTime?: string;

    // Dynamic Options from Lark Base
    doctorOptions: string[];
    nurseOptions: string[];
    patientOptions: string[];
    timeOptions: string[];
    patientTypeOptions: string[];
    patientStatusOptions: string[];
}

export const ScheduleModal: React.FC<Props> = ({
    isOpen, onClose, onSave, onDelete, onCopy, initialData, defaultDate, defaultTime,
    doctorOptions, nurseOptions, patientOptions, timeOptions, patientTypeOptions, patientStatusOptions
}) => {
    const [patientName, setPatientName] = useState('');
    const [patientType, setPatientType] = useState<'病棟' | '外来' | string>('');
    const [patientStatus, setPatientStatus] = useState<'新患' | '再来' | string>('');
    const [doctorName, setDoctorName] = useState('');
    const [nurseName, setNurseName] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');

    useEffect(() => {
        if (initialData) {
            setPatientName(initialData.patientName);
            setPatientType(initialData.patientType);
            setPatientStatus(initialData.patientStatus);
            setDoctorName(initialData.doctorName);
            setNurseName(initialData.nurseName);
            setDate(initialData.date);
            setTime(initialData.time);
        } else {
            setPatientName('');
            setPatientType(patientTypeOptions[0] || '外来');
            setPatientStatus(patientStatusOptions[0] || '新患');
            setDoctorName('');
            setNurseName('');
            setDate(defaultDate || '');
            setTime(defaultTime || timeOptions[0] || '09:00');
        }
    }, [initialData, defaultDate, defaultTime, isOpen, patientTypeOptions, patientStatusOptions, timeOptions]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ patientName, patientType, patientStatus, doctorName, nurseName, date, time });
    };

    const handleCopy = () => {
        if (onCopy) {
            onCopy({ patientName, patientType, patientStatus, doctorName, nurseName, date, time });
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h2>{initialData ? '予定の編集' : '新規予定の追加'}</h2>
                <form onSubmit={handleSubmit} className="modal-form">
                    <div className="form-group">
                        <label>患者名</label>
                        {patientOptions && patientOptions.length > 0 ? (
                            <select required value={patientName} onChange={e => setPatientName(e.target.value)}>
                                <option value="" disabled>選択してください</option>
                                {patientOptions.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        ) : (
                            <>
                                <input
                                    required
                                    value={patientName}
                                    onChange={e => setPatientName(e.target.value)}
                                    placeholder="手入力、または過去の患者から選択"
                                />
                                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                    ※Lark側で「患者名」が単一選択フィールドになっていないため、テキスト入力となっています。
                                </div>
                            </>
                        )}
                    </div>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>患者種別</label>
                            <select required value={patientType} onChange={e => setPatientType(e.target.value)}>
                                {patientTypeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>新旧</label>
                            <select required value={patientStatus} onChange={e => setPatientStatus(e.target.value)}>
                                {patientStatusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="form-group">
                        <label>担当医師</label>
                        <select
                            required
                            value={doctorName}
                            onChange={e => setDoctorName(e.target.value)}
                            disabled={doctorOptions.length === 0}
                        >
                            <option value="" disabled>
                                {doctorOptions.length > 0 ? '選択してください' : 'マスタ_医師 読み込み中'}
                            </option>
                            {doctorOptions.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        {doctorOptions.length === 0 ? (
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                ※マスタ_医師 から候補取得中です。少し待ってから開き直してください。
                            </div>
                        ) : null}
                    </div>
                    <div className="form-group">
                        <label>担当看護師</label>
                        <select
                            required
                            value={nurseName}
                            onChange={e => setNurseName(e.target.value)}
                            disabled={nurseOptions.length === 0}
                        >
                            <option value="" disabled>
                                {nurseOptions.length > 0 ? '選択してください' : 'マスタ_看護師 読み込み中'}
                            </option>
                            {nurseOptions.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                        {nurseOptions.length === 0 ? (
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                                ※マスタ_看護師 から候補取得中です。少し待ってから開き直してください。
                            </div>
                        ) : null}
                    </div>
                    <div className="form-group-row">
                        <div className="form-group">
                            <label>日付</label>
                            <input type="date" required value={date} onChange={e => setDate(e.target.value)} />
                        </div>
                        <div className="form-group">
                            <label>時間</label>
                            <select required value={time} onChange={e => setTime(e.target.value)}>
                                {timeOptions.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="modal-actions">
                        <div className="modal-actions-left" style={{ display: 'flex', gap: '8px' }}>
                            {initialData && onDelete && (
                                <button type="button" className="btn btn-danger" onClick={onDelete}>削除</button>
                            )}
                            {initialData && onCopy && (
                                <button type="button" className="btn btn-outline" onClick={handleCopy}>複製して追加</button>
                            )}
                        </div>
                        <div className="modal-actions-right">
                            <button type="button" className="btn btn-outline" onClick={onClose}>キャンセル</button>
                            <button type="submit" className="btn btn-primary">保存</button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};
