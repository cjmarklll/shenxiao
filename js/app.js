import { ZODIACS, zodiacIndexByYear } from "./zodiac-data.js";
import { getSpringFestivalDate } from "./lunar-api.js";

const $ = (id)=>document.getElementById(id);
const yearEl = $("year"), monthEl = $("month"), dayEl = $("day"), boundaryEl = $("boundary");
const msgEl = $("msg"), resultEl = $("result");
const animalTitleEl = $("animalTitle"), animalDescEl = $("animalDesc"), metaEl = $("meta"), sameYearsEl = $("sameYears");

function pad(n){ return String(n).padStart(2, "0"); }
function isLeap(y){ return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function dim(y,m){ return [31,isLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1] || 0; }

function validate(y,m,d){
  if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isInteger(d)) return "请输入有效的年月日（整数）";
  if(y < 1900 || y > 2100) return "年份建议范围 1900-2100";
  if(m < 1 || m > 12) return "月份应为 1-12";
  const maxDay = dim(y,m);
  if(d < 1 || d > maxDay) return `该日期不存在：${y}-${pad(m)} 最大 ${maxDay} 日`;
  return "";
}
function getZodiacYearByLichun(y,m,d){
  if(m < 2 || (m === 2 && d < 4)) return y - 1;
  return y;
}
async function getZodiacYear(y,m,d,mode){
  if(mode === "lichun"){
    return { zodiacYear: getZodiacYearByLichun(y,m,d), boundaryText: "立春（2月4日近似）" };
  }
  const sf = await getSpringFestivalDate(y);
  const isBefore = m < sf.month || (m === sf.month && d < sf.day);
  return { zodiacYear: isBefore ? y - 1 : y, boundaryText: `春节（${y}-${pad(sf.month)}-${pad(sf.day)}，来源：${sf.source}）` };
}
function sameAnimalYears(center, count=11){
  const start = center - 12 * Math.floor(count/2);
  return Array.from({ length: count }, (_,i)=> start + i*12);
}
function render({y,m,d,zodiacYear,boundaryText}){
  const idx = zodiacIndexByYear(zodiacYear);
  const z = ZODIACS[idx];
  animalTitleEl.textContent = `${z.name}（生肖年：${zodiacYear}）`;
  animalDescEl.textContent = z.desc;
  metaEl.innerHTML = `
    <div class="item"><b>生日</b><div>${y}-${pad(m)}-${pad(d)}</div></div>
    <div class="item"><b>地支</b><div>${z.branch}</div></div>
    <div class="item"><b>分界规则</b><div>${boundaryText}</div></div>
  `;
  sameYearsEl.textContent = sameAnimalYears(zodiacYear).join("、");
  resultEl.classList.remove("hidden");
  msgEl.textContent = "查询成功 ✅";
}
$("queryBtn").addEventListener("click", async ()=>{
  const y = Number(yearEl.value), m = Number(monthEl.value), d = Number(dayEl.value), mode = boundaryEl.value;
  const err = validate(y,m,d);
  if(err){ msgEl.textContent = `⚠️ ${err}`; resultEl.classList.add("hidden"); return; }
  msgEl.textContent = "正在查询历法数据...";
  const { zodiacYear, boundaryText } = await getZodiacYear(y,m,d,mode);
  render({ y,m,d,zodiacYear,boundaryText });
});
$("todayBtn").addEventListener("click", ()=>{
  const now = new Date();
  yearEl.value = now.getFullYear();
  monthEl.value = now.getMonth() + 1;
  dayEl.value = now.getDate();
});
$("clearBtn").addEventListener("click", ()=>{
  yearEl.value = ""; monthEl.value = ""; dayEl.value = "";
  msgEl.textContent = ""; resultEl.classList.add("hidden");
});
$("themeToggle").addEventListener("click", ()=>{
  document.documentElement.classList.toggle("light");
});
