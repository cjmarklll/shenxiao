// Built-in Spring Festival (Chinese New Year) precise date table, 1900–2100.
// Each entry is [month, day] for the year at index (year - 1900).
// Verified for 1900–2030 against authoritative astronomical tables;
// 2031–2100 based on 19-year Metonic-cycle approximation (±1 day).
//
// Boundary case examples (see acceptance tests):
//   2024-02-09 → before 2024-02-10 (春节) → zodiac year 2023 (兔)
//   2024-02-10 → on/after 2024-02-10    → zodiac year 2024 (龙)
//   2025-01-28 → before 2025-01-29 (春节) → zodiac year 2024 (龙)
//   2025-01-29 → on/after 2025-01-29    → zodiac year 2025 (蛇)
const SF_TABLE = [
  // 1900–1909
  [1,31],[2,19],[2,8],[1,29],[2,16],[2,4],[1,25],[2,13],[2,2],[1,22],
  // 1910–1919
  [2,10],[1,30],[2,18],[2,6],[1,26],[2,14],[2,3],[1,23],[2,11],[2,1],
  // 1920–1929
  [2,20],[2,8],[1,28],[2,16],[2,5],[1,25],[2,13],[2,2],[1,23],[2,10],
  // 1930–1939
  [1,30],[2,17],[2,6],[1,26],[2,14],[2,4],[1,24],[2,11],[1,31],[2,19],
  // 1940–1949
  [2,8],[1,27],[2,15],[2,5],[1,25],[2,13],[2,2],[1,22],[2,10],[1,29],
  // 1950–1959
  [2,17],[2,6],[1,27],[2,14],[2,3],[1,24],[2,12],[1,31],[2,18],[2,8],
  // 1960–1969
  [1,28],[2,15],[2,5],[1,25],[2,13],[2,2],[1,21],[2,9],[1,30],[2,17],
  // 1970–1979
  [2,6],[1,27],[2,15],[2,3],[1,23],[2,11],[1,31],[2,18],[2,7],[1,28],
  // 1980–1989
  [2,16],[2,5],[1,25],[2,13],[2,2],[2,20],[2,9],[1,29],[2,17],[2,6],
  // 1990–1999
  [1,27],[2,15],[2,4],[1,23],[2,10],[1,31],[2,19],[2,7],[1,28],[2,16],
  // 2000–2009
  [2,5],[1,24],[2,12],[2,1],[1,22],[2,9],[1,29],[2,18],[2,7],[1,26],
  // 2010–2019
  [2,14],[2,3],[1,23],[2,10],[1,31],[2,19],[2,8],[1,28],[2,16],[2,5],
  // 2020–2029
  [1,25],[2,12],[2,1],[1,22],[2,10],[1,29],[2,17],[2,6],[1,26],[2,13],
  // 2030–2039
  [2,3],[1,23],[2,11],[1,31],[2,19],[2,8],[1,28],[2,15],[2,4],[1,24],
  // 2040–2049
  [2,12],[2,1],[1,22],[2,10],[1,30],[2,17],[2,6],[1,26],[2,14],[2,2],
  // 2050–2059
  [1,23],[2,11],[1,31],[2,19],[2,8],[1,28],[2,15],[2,4],[1,24],[2,12],
  // 2060–2069
  [2,2],[1,21],[2,9],[1,29],[2,17],[2,5],[1,26],[2,14],[2,3],[1,23],
  // 2070–2079
  [2,11],[1,31],[2,19],[2,7],[1,28],[2,15],[2,5],[1,24],[2,12],[2,2],
  // 2080–2089
  [1,22],[2,9],[1,29],[2,17],[2,6],[1,27],[2,14],[2,4],[1,24],[2,10],
  // 2090–2099
  [1,30],[2,18],[2,7],[1,27],[2,15],[2,4],[1,24],[2,11],[2,1],[1,22],
  // 2100
  [2,8]
];

function getFromTable(year){
  const idx = year - 1900;
  if(idx < 0 || idx >= SF_TABLE.length) return null;
  const [month, day] = SF_TABLE[idx];
  return { month, day, source: "built-in-table" };
}

async function fetchWithTimeout(url, timeout = 5000){
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try{
    const res = await fetch(url, { signal: controller.signal });
    if(!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally { clearTimeout(timer); }
}

// Parse timor.tech holiday API: finds the earliest date labelled "春节"
function parseTimorTech(payload, year){
  if(!payload?.holiday) return null;
  let earliest = null;
  for(const [dateStr, info] of Object.entries(payload.holiday)){
    if(info?.holiday === true && info.name === "初一"){
      // Prefer explicit date field; fall back to year + dateStr (MM-DD format)
      const mmdd = /^\d{1,2}-\d{1,2}$/.test(dateStr) ? `${year}-${dateStr}` : null;
      const full = info.date || mmdd;
      const m = full && String(full).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if(m && Number(m[1]) === year){
        const month = Number(m[2]), day = Number(m[3]);
        const val = month * 100 + day;
        const earlyVal = earliest ? earliest.month * 100 + earliest.day : Infinity;
        if(val < earlyVal) earliest = { month, day };
      }
    }
  }
  return earliest;
}
const API_SOURCES = [
  {
    buildUrl: (year) => `https://timor.tech/api/holiday/year/${year}/`,
    parse: parseTimorTech,
    label: "timor.tech"
  }
];
export async function getSpringFestivalDate(year){
  for(const { buildUrl, parse, label } of API_SOURCES){
    const url = buildUrl(year);
    try{
      const payload = await fetchWithTimeout(url, 5000);
      const date = parse(payload, year);
      if(date) return { ...date, source: `api:${label}` };
    }catch(_e){}
  }
  // All APIs failed – use built-in table
  const result = getFromTable(year);
  if(result) return result;
  // Out-of-range year: approximate with 立春
  return { month: 2, day: 4, source: "fallback-approximate" };
}

// Reusable validation helper for testing boundary cases
export function validateBoundary(cases){
  return cases.map(({ year, month, day, expectedZodiacYear }) => {
    const sf = getFromTable(year);
    if(!sf) return { input: `${year}-${month}-${day}`, error: "year out of range" };
    const isBefore = month < sf.month || (month === sf.month && day < sf.day);
    const actualZodiacYear = isBefore ? year - 1 : year;
    return {
      input: `${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`,
      springFestival: `${year}-${String(sf.month).padStart(2,"0")}-${String(sf.day).padStart(2,"0")}`,
      zodiacYear: actualZodiacYear,
      pass: actualZodiacYear === expectedZodiacYear
    };
  });
}
