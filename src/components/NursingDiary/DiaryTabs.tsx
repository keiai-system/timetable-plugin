import React from 'react';

interface DiaryTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
}

export const DiaryTabs: React.FC<DiaryTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs = [
        { id: 'timetable', label: '時間割', disabled: false },
        { id: 'staff-duty', label: '看護職員勤務状況' },
        { id: 'ward-mgmt', label: '病棟管理日誌', disabled: true },
        { id: 'nurse-mgmt', label: '看護管理日誌', disabled: true },
        { id: 'inpatient', label: '入院患者数情報', disabled: true }
    ];

    return (
        <div className="diary-tabs">
            {tabs.map(tab => (
                <button
                    key={tab.id}
                    className={`diary-tab-item ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={() => onTabChange(tab.id)}
                    disabled={tab.disabled}
                >
                    {tab.label}
                </button>
            ))}
        </div>
    );
};
