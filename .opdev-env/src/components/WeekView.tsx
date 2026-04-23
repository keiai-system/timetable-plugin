import React from 'react';
import type { Assignment, UnavailableSlot } from '../types';
import { TimeSlot } from './TimeSlot';
import { ScheduleCard } from './ScheduleCard';
import { format, parseISO, startOfWeek, addDays, isBefore } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
    currentDate: Date;
    times: string[];
    assignments: Assignment[];
    unavailabilities: UnavailableSlot[];
    onAddSlot: (date: string, time: string) => void;
    onClickCard: (assignment: Assignment) => void;
}

export const WeekView: React.FC<Props> = ({ currentDate, times, assignments, unavailabilities, onAddSlot, onClickCard }) => {
    const startDay = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDates = Array.from({ length: 7 }).map((_, i) => format(addDays(startDay, i), 'yyyy-MM-dd'));
    const now = new Date();

    return (
        <div className="timetable-container">
            <div className="timetable-grid" style={{ gridTemplateColumns: `auto repeat(7, 1fr)` }}>
                <div className="timetable-header-cell empty-corner"></div>
                {weekDates.map((date) => (
                    <div key={date} className={`timetable-header-cell column-date ${format(parseISO(date), 'E') === 'Sat' ? 'saturday' : ''} ${format(parseISO(date), 'E') === 'Sun' ? 'sunday' : ''}`}>
                        <span className="date-weekday">{format(parseISO(date), 'E', { locale: ja })}</span>
                        <span className="date-value">{format(parseISO(date), 'M/d')}</span>
                    </div>
                ))}

                {times.map((time) => (
                    <React.Fragment key={time}>
                        <div className="timetable-row-header">{time}</div>
                        {weekDates.map((date) => {
                            const unavail = unavailabilities.find((u) => u.date === date && u.time === time);
                            const slotAssignments = assignments.filter((a) => a.date === date && a.time === time);

                            // Calculate past
                            const slotDatetime = parseISO(`${date}T${time}:00`);
                            const isPast = isBefore(slotDatetime, now);

                            return (
                                <TimeSlot
                                    key={`${date}-${time}`}
                                    date={date}
                                    time={time}
                                    isUnavailable={!!unavail}
                                    isPast={isPast}
                                    unavailableReason={unavail?.reason}
                                    onAddClick={() => onAddSlot(date, time)}
                                >
                                    {slotAssignments.map((assignment) => (
                                        <ScheduleCard
                                            key={assignment.id}
                                            assignment={assignment}
                                            onClick={() => onClickCard(assignment)}
                                        />
                                    ))}
                                </TimeSlot>
                            );
                        })}
                    </React.Fragment>
                ))}
            </div>
        </div>
    );
};
