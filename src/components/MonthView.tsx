import React from 'react';
import type { Assignment } from '../types';
import { ScheduleCard } from './ScheduleCard';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isBefore, endOfDay } from 'date-fns';
import { useDroppable } from '@dnd-kit/core';

interface Props {
    currentDate: Date;
    assignments: Assignment[];
    onAddSlot: (date: string, time: string) => void;
    onClickCard: (assignment: Assignment) => void;
}

const MonthCell: React.FC<{ day: Date; isCurrentMonth: boolean; isPast: boolean; assignments: Assignment[]; onClickCard: any; onAddSlot: any }> = ({ day, isCurrentMonth, isPast, assignments, onClickCard, onAddSlot }) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const id = `${dateStr}|month`; // Month drop zone
    const { isOver, setNodeRef } = useDroppable({ id });

    return (
        <div
            ref={setNodeRef}
            className={`month-cell ${!isCurrentMonth ? 'different-month' : ''} ${isOver ? 'drag-over' : ''} ${isPast ? 'past-time' : ''}`}
            onClick={(e) => {
                if (e.target === e.currentTarget) onAddSlot(dateStr, '09:00');
            }}
        >
            <div className="month-cell-header">{format(day, 'd')}</div>
            <div className="month-cell-content">
                {assignments.map(a => (
                    <ScheduleCard key={a.id} assignment={a} onClick={() => onClickCard(a)} compact={true} />
                ))}
            </div>
        </div>
    );
};

export const MonthView: React.FC<Props> = ({ currentDate, assignments, onAddSlot, onClickCard }) => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['月', '火', '水', '木', '金', '土', '日'];
    const now = new Date();

    return (
        <div className="timetable-container month-container">
            <div className="month-grid">
                {weekDays.map(wd => (
                    <div key={wd} className={`month-header-cell ${wd === '土' ? 'saturday' : ''} ${wd === '日' ? 'sunday' : ''}`}>
                        {wd}
                    </div>
                ))}
                {days.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const dayAssignments = assignments.filter(a => a.date === dateStr);
                    const isPast = isBefore(endOfDay(day), now);

                    return (
                        <MonthCell
                            key={dateStr}
                            day={day}
                            isCurrentMonth={isSameMonth(day, monthStart)}
                            isPast={isPast}
                            assignments={dayAssignments}
                            onClickCard={onClickCard}
                            onAddSlot={onAddSlot}
                        />
                    );
                })}
            </div>
        </div>
    );
};
