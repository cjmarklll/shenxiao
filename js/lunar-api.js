const API_SOURCES = [
  (year) => `https://api.example.com/calendar/chinese-new-year?year=${year}`,
  (year) => `https://api2.example.com/lunar/newyear/${year}`
];

async function fetchWithTimeout(url, timeout = 5000){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try{
    const res = await fetch(url, { signal: controller.signal });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

function parseDateFromUnknownPayload(payload, year){
  const candidates = [
    payload?.data?.lunarNewYear,
    payload?.lunarNewYear,
    payload?.newYear,
    payload?.data?.newYearDate,
    payload?.date
  ].filter(Boolean);

  for(const c of candidates){
    const m = String(c).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if(m && Number(m[1]) === year){
      return { month: Number(m[2]), day: Number(m[3]) };
    }
  }
  return null;
}

export async function getSpringFestivalDate(year){
  for (const buildUrl of API_SOURCES){
    const url = buildUrl(year);
    try{
      const payload = await fetchWithTimeout(url, 5000);
      const date = parseDateFromUnknownPayload(payload, year);
      if(date) return { ...date, source: url };
    }catch(_e){}
  }
  return { month: 2, day: 4, source: "fallback-lichun" };
}
