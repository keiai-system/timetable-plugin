import { useState } from 'react';
import { DndContext, type DragEndEvent } from '@dnd-kit/core';
import { HeaderControls } from './HeaderControls';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { ScheduleModal } from './ScheduleModal';
import type { Assignment, UnavailableSlot } from '../types';

type TimetableWorkspaceProps = {
  assignments: Assignment[];
  doctorOptions: string[];
  nurseOptions: string[];
  patientOptions: string[];
  timeOptions: string[];
  patientTypeOptions: string[];
  patientStatusOptions: string[];
  addAssignment: (data: Omit<Assignment, 'id'>) => Promise<void>;
  updateAssignment: (id: string, data: Partial<Assignment>) => Promise<void>;
  deleteAssignment: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const DEFAULT_UNAVAILABLES: UnavailableSlot[] = [];

export function TimetableWorkspace(props: TimetableWorkspaceProps) {
  const {
    assignments,
    doctorOptions,
    nurseOptions,
    patientOptions,
    timeOptions,
    patientTypeOptions,
    patientStatusOptions,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    refresh,
  } = props;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<Assignment | null>(null);
  const [defaultDate, setDefaultDate] = useState('');
  const [defaultTime, setDefaultTime] = useState('09:00');

  const openCreateModal = async (date: string, time: string) => {
    if (doctorOptions.length === 0 || nurseOptions.length === 0) {
      await refresh();
    }
    setModalData(null);
    setDefaultDate(date);
    setDefaultTime(time);
    setIsModalOpen(true);
  };

  const openEditModal = async (assignment: Assignment) => {
    if (doctorOptions.length === 0 || nurseOptions.length === 0) {
      await refresh();
    }
    setModalData(assignment);
    setDefaultDate(assignment.date);
    setDefaultTime(assignment.time);
    setIsModalOpen(true);
  };

  const handleSaveAssignment = async (data: Omit<Assignment, 'id'>) => {
    if (modalData) {
      await updateAssignment(modalData.id, data);
    } else {
      await addAssignment(data);
    }
    setIsModalOpen(false);
  };

  const handleCopyAssignment = async (data: Omit<Assignment, 'id'>) => {
    await addAssignment(data);
    setIsModalOpen(false);
  };

  const handleDeleteAssignment = async () => {
    if (!modalData) return;
    await deleteAssignment(modalData.id);
    setIsModalOpen(false);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const assignment = assignments.find((item) => item.id === active.id);
    if (!assignment) return;

    const overId = String(over.id);
    const [date, time] = overId.split('|');
    if (!date || !time || time === 'month') return;
    if (assignment.date === date && assignment.time === time) return;

    await updateAssignment(assignment.id, { date, time });
  };

  return (
    <div className="no-print">
      <HeaderControls
        currentDate={currentDate}
        viewMode={viewMode}
        onChangeDate={setCurrentDate}
        onChangeView={setViewMode}
      />

      <DndContext onDragEnd={handleDragEnd}>
        {viewMode === 'week' ? (
          <WeekView
            currentDate={currentDate}
            times={timeOptions}
            assignments={assignments}
            unavailabilities={DEFAULT_UNAVAILABLES}
            onAddSlot={openCreateModal}
            onClickCard={openEditModal}
          />
        ) : (
          <MonthView
            currentDate={currentDate}
            assignments={assignments}
            onAddSlot={openCreateModal}
            onClickCard={openEditModal}
          />
        )}
      </DndContext>

      <div style={{ marginTop: '16px' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '8px 16px',
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          印刷
        </button>
      </div>

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveAssignment}
        onDelete={modalData ? handleDeleteAssignment : undefined}
        onCopy={modalData ? handleCopyAssignment : undefined}
        initialData={modalData}
        defaultDate={defaultDate}
        defaultTime={defaultTime}
        doctorOptions={doctorOptions}
        nurseOptions={nurseOptions}
        patientOptions={patientOptions}
        timeOptions={timeOptions}
        patientTypeOptions={patientTypeOptions.length > 0 ? patientTypeOptions : ['外来', '病棟']}
        patientStatusOptions={patientStatusOptions.length > 0 ? patientStatusOptions : ['新患', '再来']}
      />
    </div>
  );
}
