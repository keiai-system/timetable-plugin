export interface Assignment {
  id: string;
  patientName: string;
  patientType: string;
  patientStatus: string;
  doctorName: string;
  nurseName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
};

export type UnavailableSlot = {
  id: string;
  date: string;
  time: string;
  reason: string;
};

export interface NursingDiaryData {
  id?: string;
  日付: string;
  部署: string;
  // 看護師
  看護師_日勤: string;
  看護師_夜勤: string;
  看護師_明け: string;
  看護師_公休: string;
  看護師_有休: string;
  看護師_欠勤: string;
  // 准看護師
  准看護師_日勤: string;
  准看護師_夜勤: string;
  准看護師_明け: string;
  准看護師_公休: string;
  准看護師_有休: string;
  准看護師_欠勤: string;
  // 看護補助者
  看護補助者_日勤: string;
  看護補助者_夜勤: string;
  看護補助者_明け: string;
  看護補助者_公休: string;
  看護補助者_有休: string;
  看護補助者_欠勤: string;
  // 特記事項
  "特記事項_8:30-16:45": string;
  "特記事項_16:30-9:00": string;
  // 夜間巡視サイン
  "巡視_17:00": string;
  "巡視_18:00": string;
  "巡視_19:00": string;
  "巡視_20:00": string;
  "巡視_21:00": string;
  "巡視_22:00": string;
  "巡視_23:00": string;
  "巡視_1:30": string;
  "巡視_4:00": string;
  "巡視_6:00": string;
  "巡視_7:00": string;
  "巡視_8:00": string;
}
