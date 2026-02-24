export const SEVERITY_COLORS = {
  Extreme: '#d32f2f',
  Severe: '#f57c00',
  Moderate: '#fbc02d',
  Minor: '#388e3c',
  Unknown: '#757575',
};

export function getSeverityColor(severity) {
  return SEVERITY_COLORS[severity] ?? SEVERITY_COLORS.Unknown;
}

export const SEVERITY_ORDER = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];
