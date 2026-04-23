import { useMemo } from 'react';
import { useLarkBase } from '../hooks/useLarkBase';
import { TimetableWorkspace } from './TimetableWorkspace';

const DEFAULT_TIME_OPTIONS = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'];

export function FullTimetableApp() {
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
  } = useLarkBase();

  const effectiveTimeOptions = useMemo(
    () => (timeOptions.length > 0 ? timeOptions : DEFAULT_TIME_OPTIONS),
    [timeOptions],
  );

  return (
    <TimetableWorkspace
      assignments={assignments}
      doctorOptions={doctorOptions}
      nurseOptions={nurseOptions}
      patientOptions={patientOptions}
      timeOptions={effectiveTimeOptions}
      patientTypeOptions={patientTypeOptions}
      patientStatusOptions={patientStatusOptions}
      addAssignment={addAssignment}
      updateAssignment={updateAssignment}
      deleteAssignment={deleteAssignment}
      refresh={refresh}
    />
  );
}
