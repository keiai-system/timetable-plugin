import React from 'react';
import type { Assignment, UnavailableSlot } from '../types';
import { TimeSlot } from './TimeSlot';
import { ScheduleCard } from './ScheduleCard';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Props {
    dates: string[];
    times: string[];
    assignments: Assignment[];
    unavailabilities: UnavailableSlot[];
}

export const Timetable: React.FC<Props> = ({ dates, times, assignments, unavailabilities }) => {
    return (
        <div className="timetable-container">
            <div className="timetable-grid" style={{ gridTemplateColumns: `auto repeat(${dates.length}, 1fr)` }}>
                {/* Header Row (Dates) */}
                <div className="timetable-header-cell empty-corner"></div>
                {dates.map((date) => (
                    <div key={date} className="timetable-header-cell column-date">
                        <span className="date-weekday">{format(parseISO(date), 'E', { locale: ja })}</span>
                        <span className="date-value">{format(parseISO(date), 'M/d')}</span>
                    </div>
                ))}

                {/* Time Rows */}
                {times.map((time) => (
                    <React.Fragment key={time}>
                        {/* Row Header (Time) */}
                        <div className="timetable-row-header">{time}</div>

                        {/* Cells for each Date on this Time */}
                        {dates.map((date) => {
                            // Check if unavailable
                            const unavail = unavailabilities.find((u) => u.date === date && u.time === time);

                            // Get assignments for this slot
                            const slotAssignments = assignments.filter((a) => a.date === date && a.time === time);

                            return (
                                <TimeSlot
                                    key={`${date}-${time}`}
                                    date={date}
                                    time={time}
                                    isUnavailable={!!unavail}
                                    unavailableReason={unavail?.reason}
                                >
                                    {slotAssignments.map((assignment) => (
                                        <ScheduleCard key={assignment.id} assignment={assignment} />
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
