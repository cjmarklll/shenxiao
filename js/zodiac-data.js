export const ZODIACS = [
  { name:"鼠", branch:"子", desc:"机敏灵活，适应力强。" },
  { name:"牛", branch:"丑", desc:"踏实稳重，责任感强。" },
  { name:"虎", branch:"寅", desc:"自信果敢，行动力高。" },
  { name:"兔", branch:"卯", desc:"温和细腻，亲和力好。" },
  { name:"龙", branch:"辰", desc:"格局开阔，创造力强。" },
  { name:"蛇", branch:"巳", desc:"思维缜密，洞察力佳。" },
  { name:"马", branch:"午", desc:"热情奔放，执行力强。" },
  { name:"羊", branch:"未", desc:"温柔体贴，注重和谐。" },
  { name:"猴", branch:"申", desc:"聪明机变，创意丰富。" },
  { name:"鸡", branch:"酉", desc:"认真负责，讲求效率。" },
  { name:"狗", branch:"戌", desc:"忠诚可靠，重视承诺。" },
  { name:"猪", branch:"亥", desc:"真诚豁达，乐观包容。" }
];
export function zodiacIndexByYear(year){
  return ((year - 2020) % 12 + 12) % 12;
}
