const POPULAR_ZONES = {
  'UTC': 'UTC', 'GMT': 'Europe/London',
  'EST': 'America/New_York', 'CST': 'America/Chicago', 'MST': 'America/Denver', 'PST': 'America/Los_Angeles',
  'KST': 'Asia/Seoul', 'JST': 'Asia/Tokyo', 'CST_CN': 'Asia/Shanghai', 'IST': 'Asia/Kolkata',
  'CET': 'Europe/Berlin', 'EET': 'Europe/Helsinki', 'AEST': 'Australia/Sydney',
  'SGT': 'Asia/Singapore', 'HKT': 'Asia/Hong_Kong', 'BRT': 'America/Sao_Paulo',
};

function resolveZone(input) {
  return POPULAR_ZONES[input.toUpperCase()] || input;
}

function now(timezone) {
  const tz = resolveZone(timezone || 'UTC');
  const d = new Date();
  const formatted = d.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
  const iso = d.toLocaleString('sv-SE', { timeZone: tz }).replace(' ', 'T');
  const offset = getOffset(tz);
  return { timezone: tz, datetime: formatted, iso, unix: Math.floor(d.getTime() / 1000), offset };
}

function convert(datetime, fromTz, toTz) {
  const from = resolveZone(fromTz);
  const to = resolveZone(toTz);

  // Parse the input datetime in the source timezone
  const d = new Date(datetime);
  if (isNaN(d.getTime())) throw new Error('Invalid datetime');

  const fromFormatted = d.toLocaleString('en-US', { timeZone: from, dateStyle: 'full', timeStyle: 'long' });
  const toFormatted = d.toLocaleString('en-US', { timeZone: to, dateStyle: 'full', timeStyle: 'long' });
  const toIso = d.toLocaleString('sv-SE', { timeZone: to }).replace(' ', 'T');

  return {
    from: { timezone: from, datetime: fromFormatted },
    to: { timezone: to, datetime: toFormatted, iso: toIso },
    unix: Math.floor(d.getTime() / 1000),
  };
}

function worldClock(zones) {
  const d = new Date();
  return zones.map(z => {
    const tz = resolveZone(z);
    try {
      return {
        timezone: tz,
        alias: z,
        time: d.toLocaleString('en-US', { timeZone: tz, timeStyle: 'short' }),
        date: d.toLocaleString('en-US', { timeZone: tz, dateStyle: 'medium' }),
        offset: getOffset(tz),
      };
    } catch { return { timezone: z, error: 'Invalid timezone' }; }
  });
}

function meetingPlanner(zones, preferredHours = [9, 17]) {
  const [startHour, endHour] = preferredHours;
  const results = [];

  for (let utcHour = 0; utcHour < 24; utcHour++) {
    const d = new Date();
    d.setUTCHours(utcHour, 0, 0, 0);

    const times = zones.map(z => {
      const tz = resolveZone(z);
      const localHour = parseInt(d.toLocaleString('en-US', { timeZone: tz, hour: 'numeric', hour12: false }));
      return {
        timezone: tz,
        alias: z,
        localHour,
        localTime: d.toLocaleString('en-US', { timeZone: tz, timeStyle: 'short' }),
        isWorkHours: localHour >= startHour && localHour < endHour,
      };
    });

    const allWorking = times.every(t => t.isWorkHours);
    results.push({ utcHour, allInWorkHours: allWorking, times });
  }

  return {
    workHours: `${startHour}:00-${endHour}:00`,
    bestSlots: results.filter(r => r.allInWorkHours),
    allSlots: results,
  };
}

function getOffset(tz) {
  try {
    const d = new Date();
    const utc = d.toLocaleString('en-US', { timeZone: 'UTC' });
    const local = d.toLocaleString('en-US', { timeZone: tz });
    const diff = (new Date(local) - new Date(utc)) / 3600000;
    const h = Math.floor(Math.abs(diff));
    const m = Math.round((Math.abs(diff) - h) * 60);
    return `UTC${diff >= 0 ? '+' : '-'}${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  } catch { return 'Unknown'; }
}

function listZones() {
  return Object.entries(POPULAR_ZONES).map(([alias, iana]) => ({
    alias, iana, offset: getOffset(iana),
    currentTime: new Date().toLocaleString('en-US', { timeZone: iana, timeStyle: 'short' }),
  }));
}

module.exports = { now, convert, worldClock, meetingPlanner, listZones, POPULAR_ZONES };
