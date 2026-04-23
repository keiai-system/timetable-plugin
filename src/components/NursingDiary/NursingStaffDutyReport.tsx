import React from 'react';
import type { NursingDiaryData } from '../../types';
import './NursingDiary.css';

interface NursingStaffDutyReportProps {
    data: NursingDiaryData;
    onUpdate: (field: keyof NursingDiaryData, value: string) => void;
}

export const NursingStaffDutyReport: React.FC<NursingStaffDutyReportProps> = ({ data, onUpdate }) => {
    const handleBlur = (field: keyof NursingDiaryData, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onUpdate(field, e.target.value);
    };

    return (
        <div className="nursing-diary-render">
            <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>看護職員勤務状況</h2>
            
            {/* 上部テーブル: 日勤 */}
            <table className="diary-report-table">
                <thead>
                    <tr>
                        <th className="header-cell" style={{ width: '10%' }}></th>
                        <th className="header-cell">日勤</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td className="header-cell">看<br/>護<br/>師</td>
                        <td>
                            <textarea 
                                className="diary-textarea small-height" 
                                defaultValue={data.看護師_日勤} 
                                onBlur={(e) => handleBlur('看護師_日勤', e)}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="header-cell">准<br/>看<br/>護<br/>師</td>
                        <td>
                            <textarea 
                                className="diary-textarea small-height" 
                                defaultValue={data.准看護師_日勤} 
                                onBlur={(e) => handleBlur('准看護師_日勤', e)}
                            />
                        </td>
                    </tr>
                    <tr>
                        <td className="header-cell">看<br/>護<br/>補<br/>助<br/>者</td>
                        <td>
                            <textarea 
                                className="diary-textarea small-height" 
                                defaultValue={data.看護補助者_日勤} 
                                onBlur={(e) => handleBlur('看護補助者_日勤', e)}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 中部テーブル: シフト別 */}
            <table className="diary-report-table">
                <thead>
                    <tr>
                        <th className="header-cell" style={{ width: '15%' }}></th>
                        <th className="header-cell">夜勤</th>
                        <th className="header-cell">明け</th>
                        <th className="header-cell">公休</th>
                        <th className="header-cell">有休</th>
                        <th className="header-cell">欠勤</th>
                    </tr>
                </thead>
                <tbody>
                    {(['看護師', '准看護師', '看護補助者'] as const).map(role => (
                        <tr key={role}>
                            <td className="header-cell">
                                {role === '准看護師' ? <>准<br/>看護師</> : 
                                 role === '看護補助者' ? <>看護<br/>補助者</> : role}
                            </td>
                            <td><textarea className="diary-textarea mid-height" defaultValue={data[`${role}_夜勤` as keyof NursingDiaryData]} onBlur={(e) => handleBlur(`${role}_夜勤` as keyof NursingDiaryData, e)} /></td>
                            <td><textarea className="diary-textarea mid-height" defaultValue={data[`${role}_明け` as keyof NursingDiaryData]} onBlur={(e) => handleBlur(`${role}_明け` as keyof NursingDiaryData, e)} /></td>
                            <td><textarea className="diary-textarea mid-height" defaultValue={data[`${role}_公休` as keyof NursingDiaryData]} onBlur={(e) => handleBlur(`${role}_公休` as keyof NursingDiaryData, e)} /></td>
                            <td><textarea className="diary-textarea mid-height" defaultValue={data[`${role}_有休` as keyof NursingDiaryData]} onBlur={(e) => handleBlur(`${role}_有休` as keyof NursingDiaryData, e)} /></td>
                            <td><textarea className="diary-textarea mid-height" defaultValue={data[`${role}_欠勤` as keyof NursingDiaryData]} onBlur={(e) => handleBlur(`${role}_欠勤` as keyof NursingDiaryData, e)} /></td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* 特記事項 */}
            <div className="section-title">特記事項</div>
            <table className="diary-report-table">
                <thead>
                    <tr>
                        <th className="header-cell" style={{ width: '50%' }}>8:30〜16:45</th>
                        <th className="header-cell" style={{ width: '50%' }}>16:30〜9:00</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <textarea 
                                className="diary-textarea small-height" 
                                defaultValue={data["特記事項_8:30-16:45"]} 
                                onBlur={(e) => handleBlur("特記事項_8:30-16:45", e)}
                            />
                        </td>
                        <td>
                            <textarea 
                                className="diary-textarea small-height" 
                                defaultValue={data["特記事項_16:30-9:00"]} 
                                onBlur={(e) => handleBlur("特記事項_16:30-9:00", e)}
                            />
                        </td>
                    </tr>
                </tbody>
            </table>

            {/* 夜間巡視サイン */}
            <table className="diary-report-table">
                <tbody>
                    <tr>
                        <td rowSpan={4} className="header-cell" style={{ width: '15%' }}>夜間巡視<br/>サイン</td>
                        <td className="header-cell">17:00</td>
                        <td className="header-cell">18:00</td>
                        <td className="header-cell">19:00</td>
                        <td className="header-cell">20:00</td>
                        <td className="header-cell">21:00</td>
                        <td className="header-cell">22:00</td>
                        <td className="header-cell">23:00</td>
                    </tr>
                    <tr>
                        <td><input className="diary-input" defaultValue={data["巡視_17:00"]} onBlur={(e) => handleBlur("巡視_17:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_18:00"]} onBlur={(e) => handleBlur("巡視_18:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_19:00"]} onBlur={(e) => handleBlur("巡視_19:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_20:00"]} onBlur={(e) => handleBlur("巡視_20:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_21:00"]} onBlur={(e) => handleBlur("巡視_21:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_22:00"]} onBlur={(e) => handleBlur("巡視_22:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_23:00"]} onBlur={(e) => handleBlur("巡視_23:00", e)} /></td>
                    </tr>
                    <tr>
                        <td className="header-cell">1:30</td>
                        <td className="header-cell">4:00</td>
                        <td className="header-cell">6:00</td>
                        <td className="header-cell">7:00</td>
                        <td className="header-cell">8:00</td>
                        <td className="header-cell"></td>
                        <td className="header-cell"></td>
                    </tr>
                    <tr>
                        <td><input className="diary-input" defaultValue={data["巡視_1:30"]} onBlur={(e) => handleBlur("巡視_1:30", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_4:00"]} onBlur={(e) => handleBlur("巡視_4:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_6:00"]} onBlur={(e) => handleBlur("巡視_6:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_7:00"]} onBlur={(e) => handleBlur("巡視_7:00", e)} /></td>
                        <td><input className="diary-input" defaultValue={data["巡視_8:00"]} onBlur={(e) => handleBlur("巡視_8:00", e)} /></td>
                        <td></td>
                        <td></td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};
