/**
 * NOAA severity → visual style config.
 * Used by the map polygon layer, sidebar badges, and filter chips.
 */
export const SEVERITY_CONFIG = {
  Extreme: {
    color: '#ef4444',
    fillColor: '#ef4444',
    fillOpacity: 0.45,
    weight: 2.5,
    label: 'Extreme',
    order: 0,
    tw: {
      badge:  'bg-red-600 text-white',
      border: 'border-red-500',
      text:   'text-red-400',
      dot:    'bg-red-500',
    },
  },
  Severe: {
    color: '#f97316',
    fillColor: '#f97316',
    fillOpacity: 0.40,
    weight: 2,
    label: 'Severe',
    order: 1,
    tw: {
      badge:  'bg-orange-600 text-white',
      border: 'border-orange-500',
      text:   'text-orange-400',
      dot:    'bg-orange-500',
    },
  },
  Moderate: {
    color: '#eab308',
    fillColor: '#eab308',
    fillOpacity: 0.35,
    weight: 1.5,
    label: 'Moderate',
    order: 2,
    tw: {
      badge:  'bg-yellow-600 text-white',
      border: 'border-yellow-500',
      text:   'text-yellow-400',
      dot:    'bg-yellow-500',
    },
  },
  Minor: {
    color: '#3b82f6',
    fillColor: '#3b82f6',
    fillOpacity: 0.30,
    weight: 1,
    label: 'Minor',
    order: 3,
    tw: {
      badge:  'bg-blue-600 text-white',
      border: 'border-blue-500',
      text:   'text-blue-400',
      dot:    'bg-blue-500',
    },
  },
  Unknown: {
    color: '#6b7280',
    fillColor: '#6b7280',
    fillOpacity: 0.25,
    weight: 1,
    label: 'Unknown',
    order: 4,
    tw: {
      badge:  'bg-slate-600 text-slate-200',
      border: 'border-slate-500',
      text:   'text-slate-400',
      dot:    'bg-slate-500',
    },
  },
};

export const SEVERITY_LEVELS = ['Extreme', 'Severe', 'Moderate', 'Minor', 'Unknown'];

export function getSeverityConfig(severity) {
  return SEVERITY_CONFIG[severity] ?? SEVERITY_CONFIG.Unknown;
}

export function getSeverityOrder(severity) {
  return SEVERITY_CONFIG[severity]?.order ?? 99;
}
