import { ZODIACS, zodiacIndexByYear } from "./zodiac-data.js";
import { getSpringFestivalDate } from "./lunar-api.js";

const $ = id => document.getElementById(id);
const yearEl = $("year"), monthEl = $("month"), dayEl = $("day"), boundaryEl = $("boundary");
const msgEl = $("msg"), resultEl = $("result"), zodiacVisual = $("zodiacVisual");
const animalTitle = $("animalTitle"), animalDesc = $("animalDesc");
const metaEl = $("meta"), sameYearsEl = $("sameYears"), boundarySourceEl = $("boundarySource");

function pad(n){ return String(n).padStart(2, "0"); }
function isLeap(y){ return (y%4===0&&y%100!==0)||y%400===0; }
function dim(y,m){ return [31,isLeap(y)?29:28,31,30,31,30,31,31,30,31,30,31][m-1]||0; }

function validate(y,m,d){
  if(!Number.isInteger(y)||!Number.isInteger(m)||!Number.isInteger(d)) return "请输入有效的整数年月日。";
  if(y<1900||y>2100) return "年份范围建议 1900 - 2100。";
  if(m<1||m>12) return "月份应在 1 - 12。";
  const max = dim(y,m);
  if(d<1||d>max) return `该日期不存在：${y}-${pad(m)} 最大 ${max} 日。`;
  return "";
}

function yearsAround(center,count=11){
  const start = center - 12*Math.floor(count/2);
  return Array.from({length:count},(_,i)=> start + i*12);
}

async function determineZodiacYear(y,m,d,mode){
  if(mode === "lichun"){
    // 立春近似：2月4日
    const zy = (m < 2 || (m === 2 && d < 4)) ? y - 1 : y;
    return { zodiacYear: zy, sourceText: "立春（2月4日近似）" };
  }
  // 春节：依赖 lunar-api.js 的 getSpringFestivalDate(year)
  const sf = await getSpringFestivalDate(y);
  const before = (m < sf.month) || (m === sf.month && d < sf.day);
  const zy = before ? y - 1 : y;
  const sourceText = `春节（${y}-${pad(sf.month)}-${pad(sf.day)}，来源：${sf.source}）`;
  return { zodiacYear: zy, sourceText };
}

function renderResult({y,m,d,zodiacYear,sourceText}){
  const idx = zodiacIndexByYear(zodiacYear);
  const z = ZODIACS[idx] || { name: "未知", branch: "—", desc: "" };

  // 视觉区：显示 emoji（name 里通常含 emoji）
  zodiacVisual.innerHTML = `<div class="emoji">${z.name.split(/(?<=.)/)[0] || ""}</div>`; // 简单获取首字符（emoji）
  zodiacVisual.classList.add("animated");
  setTimeout(()=>zodiacVisual.classList.remove("animated"),420);

  animalTitle.textContent = `${z.name} · 生肖年 ${zodiacYear}`;
  animalDesc.textContent = z.desc;

  metaEl.innerHTML = `
    <div class="meta-item"><b>生日</b><p>${y}-${pad(m)}-${pad(d)}</p></div>
    <div class="meta-item"><b>地支</b><p>${z.branch ?? "—"}</p></div>
    <div class="meta-item"><b>分界</b><p>${sourceText}</p></div>
  `;

  sameYearsEl.textContent = `与你同生肖的参考年份：${yearsAround(zodiacYear).join("、")}`;
  boundarySourceEl.textContent = `数据来源：${sourceText}`;

  resultEl.classList.remove("hidden");
  msgEl.textContent = "查询成功 ✅";
}

document.getElementById("zform").addEventListener("submit", async (e)=>{
  e.preventDefault();
  const y = Number(yearEl.value), m = Number(monthEl.value), d = Number(dayEl.value);
  const mode = boundaryEl.value;
  const err = validate(y,m,d);
  if(err){ msgEl.textContent = `⚠️ ${err}`; resultEl.classList.add("hidden"); return; }

  msgEl.textContent = "正在计算（可能会请求历法数据）…";
  try{
    const info = await determineZodiacYear(y,m,d,mode);
    renderResult({ y,m,d, zodiacYear: info.zodiacYear, sourceText: info.sourceText });
    localStorage.setItem("shenxiao-last", JSON.stringify({ y,m,d,mode }));
  }catch(err){
    console.error(err);
    msgEl.textContent = "请求历法数据失败，已使用兜底规则。";
    const info = await determineZodiacYear(y,m,d,"lichun");
    renderResult({ y,m,d, zodiacYear: info.zodiacYear, sourceText: info.sourceText });
  }
});

document.getElementById("todayBtn").addEventListener("click", ()=>{
  const t = new Date();
  yearEl.value = t.getFullYear();
  monthEl.value = t.getMonth()+1;
  dayEl.value = t.getDate();
});

document.getElementById("clearBtn").addEventListener("click", ()=>{
  yearEl.value = monthEl.value = dayEl.value = "";
  msgEl.textContent = "";
  resultEl.classList.add("hidden");
});

document.getElementById("themeToggle").addEventListener("click", ()=>{
  document.documentElement.classList.toggle("light");
  localStorage.setItem("shenxiao-theme", document.documentElement.classList.contains("light") ? "light" : "dark");
});

(function init(){
  const theme = localStorage.getItem("shenxiao-theme");
  if(theme === "light") document.documentElement.classList.add("light");

  const last = localStorage.getItem("shenxiao-last");
  if(last){
    try{
      const { y,m,d,mode } = JSON.parse(last);
      yearEl.value = y; monthEl.value = m; dayEl.value = d; boundaryEl.value = mode ?? "springFestival";
    }catch{}
  }
})();
