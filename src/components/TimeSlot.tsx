import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';

interface Props {
    date: string;
    time: string;
    isUnavailable: boolean;
    isPast?: boolean;
    unavailableReason?: string;
    onAddClick?: () => void;
    children: React.ReactNode;
}

export const TimeSlot: React.FC<Props> = ({ date, time, isUnavailable, isPast, unavailableReason, onAddClick, children }) => {
    const id = `${date}|${time}`;
    const { isOver, setNodeRef } = useDroppable({
        id,
        disabled: isUnavailable,
    });

    return (
        <div
            ref={setNodeRef}
            className={`time-slot ${isOver && !isUnavailable ? 'drag-over' : ''} ${isUnavailable ? 'unavailable' : ''} ${isPast ? 'past-time' : ''}`}
        >
            {isUnavailable ? (
                <div className="unavailable-content">
                    <span className="unavailable-text">対応不可</span>
                    {unavailableReason && <span className="unavailable-reason">({unavailableReason})</span>}
                </div>
            ) : (
                <div className="slot-content-wrapper">
                    <div className="slot-children">{children}</div>
                    {onAddClick && (
                        <button className="btn-add-slot" onClick={onAddClick}>
                            <Plus size={16} />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};
