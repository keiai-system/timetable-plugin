import { useDraggable } from '@dnd-kit/core';
import type { Assignment } from '../types';
import { User, Stethoscope, Syringe } from 'lucide-react';

interface Props {
    assignment: Assignment;
    onClick?: () => void;
    compact?: boolean;
}

export const ScheduleCard: React.FC<Props> = ({ assignment, onClick, compact }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: assignment.id,
        data: assignment,
    });

    const style: React.CSSProperties = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        zIndex: isDragging ? 2 : 1,
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0px 10px 20px rgba(0,0,0,0.15)' : undefined,
        scale: isDragging ? '1.02' : '1',
    };

    if (compact) {
        // 全角スペースや半角スペースで分割して1つめを取得 (姓のみ)
        const docSurname = assignment.doctorName.split(/[\s　]+/)[0];
        const nurseSurname = assignment.nurseName.split(/[\s　]+/)[0];

        return (
            <div
                ref={setNodeRef}
                style={style}
                {...listeners}
                {...attributes}
                className={`schedule-card compact-card ${isDragging ? 'dragging' : ''}`}
                onClick={() => {
                    if (onClick) onClick();
                }}
                title={`${assignment.time} ${assignment.patientName} (${assignment.patientType}/${assignment.patientStatus}) 医:${docSurname} 看:${nurseSurname}`}
            >
                <div className="compact-content">
                    <span className="compact-time">{assignment.time}</span>
                    <span className="compact-name">{assignment.patientName}</span>
                    <span className="compact-staff">医:{docSurname} 看:{nurseSurname}</span>
                </div>
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`schedule-card ${isDragging ? 'dragging' : ''}`}
            onClick={() => {
                if (onClick) onClick();
            }}
        >
            <div className="schedule-card-header">
                <User size={14} className="icon-user" />
                <span className="patient-name">{assignment.patientName}</span>
            </div>
            <div className="schedule-card-badges">
                <span className={`badge badge-type ${assignment.patientType === '外来' ? 'badge-outpatient' : 'badge-ward'}`}>
                    {assignment.patientType}
                </span>
                <span className={`badge badge-status ${assignment.patientStatus === '新患' ? 'badge-new' : 'badge-old'}`}>
                    {assignment.patientStatus}
                </span>
            </div>
            <div className="schedule-card-body">
                <div className="staff-item">
                    <Stethoscope size={12} className="icon-staff" />
                    <span>{assignment.doctorName}</span>
                </div>
                <div className="staff-item">
                    <Syringe size={12} className="icon-staff" />
                    <span>{assignment.nurseName}</span>
                </div>
            </div>
        </div>
    );
};
