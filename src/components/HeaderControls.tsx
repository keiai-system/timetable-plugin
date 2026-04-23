import React from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Grid } from 'lucide-react';
import { format, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
    currentDate: Date;
    viewMode: 'week' | 'month';
    onChangeDate: (date: Date) => void;
    onChangeView: (mode: 'week' | 'month') => void;
}

export const HeaderControls: React.FC<Props> = ({ currentDate, viewMode, onChangeDate, onChangeView }) => {
    const handlePrev = () => {
        if (viewMode === 'week') onChangeDate(subWeeks(currentDate, 1));
        else onChangeDate(subMonths(currentDate, 1));
    };

    const handleNext = () => {
        if (viewMode === 'week') onChangeDate(addWeeks(currentDate, 1));
        else onChangeDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        onChangeDate(new Date());
    };

    const displayDate = viewMode === 'week'
        ? `${format(currentDate, 'yyyy年 M月', { locale: ja })}`
        : `${format(currentDate, 'yyyy年 M月', { locale: ja })}`;

    return (
        <div className="header-controls">
            <div className="nav-buttons">
                <button className="btn btn-outline" onClick={handleToday}>今日</button>
                <div className="arrow-nav">
                    <button className="btn btn-icon" onClick={handlePrev}><ChevronLeft size={20} /></button>
                    <span className="current-date-display">{displayDate}</span>
                    <button className="btn btn-icon" onClick={handleNext}><ChevronRight size={20} /></button>
                </div>
            </div>
            <div className="view-toggles">
                <button
                    className={`btn btn-toggle ${viewMode === 'week' ? 'active' : ''}`}
                    onClick={() => onChangeView('week')}
                >
                    <Grid size={16} /> 週
                </button>
                <button
                    className={`btn btn-toggle ${viewMode === 'month' ? 'active' : ''}`}
                    onClick={() => onChangeView('month')}
                >
                    <CalendarIcon size={16} /> 月
                </button>
            </div>
        </div>
    );
};
