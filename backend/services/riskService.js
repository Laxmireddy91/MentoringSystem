import RiskSettings from '../models/RiskSettings.js';
import AuditLog from '../models/AuditLog.js';
import { RISK_DEFAULTS } from '../config/constants.js';

export async function getRiskSettings(department) {
  const settings = await RiskSettings.findOne({ department });
  return settings || {
    department,
    cgpaThreshold: RISK_DEFAULTS.CGPA_THRESHOLD,
    backlogThreshold: RISK_DEFAULTS.BACKLOG_THRESHOLD,
    cieThreshold: RISK_DEFAULTS.CIE_THRESHOLD,
    attendanceThreshold: RISK_DEFAULTS.ATTENDANCE_THRESHOLD,
  };
}

export async function upsertRiskSettings(department, data, actorId) {
  const settings = await RiskSettings.findOneAndUpdate(
    { department },
    { ...data, department, updatedBy: actorId },
    { new: true, upsert: true, runValidators: true }
  );
  await AuditLog.create({
    actorId,
    actorRole: 'hod',
    action: 'risk.settings.update',
    entityType: 'RiskSettings',
    entityId: settings._id,
    department,
    metadata: data,
  });
  return settings;
}

export function classifyStudentRisk(student, settings) {
  const cgpa = Number(student.cgpa || 0);
  const backlogs = Number(student.backlog || 0);
  const subjects = Array.isArray(student.subjects) ? student.subjects : [];
  const academicSubjects = subjects.filter(s =>
    Number(s?.cie1 || 0) > 0 || Number(s?.cie2 || 0) > 0 || Number(s?.cie3 || 0) > 0
  );
  const cieAvg = academicSubjects.length
    ? academicSubjects.reduce((sum, s) => sum + (Number(s.cie1 || 0) + Number(s.cie2 || 0) + Number(s.cie3 || 0)) / 3, 0) / academicSubjects.length
    : 0;

  let riskScore = 0;
  const reasons = [];

  if (cgpa > 0 && cgpa < settings.cgpaThreshold) {
    riskScore += 30;
    reasons.push(`CGPA ${cgpa.toFixed(2)} is below threshold ${settings.cgpaThreshold}`);
  }
  if (backlogs >= settings.backlogThreshold) {
    riskScore += 25;
    reasons.push(`${backlogs} backlog(s) meets or exceeds threshold ${settings.backlogThreshold}`);
  }
  if (cieAvg > 0 && cieAvg < settings.cieThreshold) {
    riskScore += 20;
    reasons.push(`CIE average ${cieAvg.toFixed(1)} is below threshold ${settings.cieThreshold}`);
  }

  riskScore = Math.min(riskScore, 100);
  let level = 'Low';
  if (riskScore >= 50) level = 'High';
  else if (riskScore >= 25) level = 'Medium';

  return { riskScore, level, reasons, cieAverage: Number(cieAvg.toFixed(2)) };
}
