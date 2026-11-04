const solarNames='小寒 大寒 立春 雨水 惊蛰 春分 清明 谷雨 立夏 小满 芒种 夏至 小暑 大暑 立秋 处暑 白露 秋分 寒露 霜降 立冬 小雪 大雪 冬至'.split(' ');
const festivals={'01-01':'元旦','02-14':'情人节','03-08':'妇女节','03-12':'植树节','05-01':'劳动节','05-04':'青年节','06-01':'儿童节','08-01':'建军节','09-10':'教师节','10-01':'国庆节','12-25':'圣诞节'};
const traditional={'1/1':'春节','1/15':'元宵节','5/5':'端午节','7/7':'七夕','8/15':'中秋节','9/9':'重阳节','12/8':'腊八节'};
const lunarFormat=new Intl.DateTimeFormat('en-u-ca-chinese',{timeZone:'Asia/Shanghai',month:'numeric',day:'numeric'});
function lunarKey(date){const parts=lunarFormat.formatToParts(date);return ['month','day'].map(type=>parts.find(p=>p.type===type).value).join('/')}
function dateLabels(d){
 const [year,month,n]=d.split('-').map(Number),date=new Date(d+'T04:00:00Z'),labels=[];
 const holiday=festivals[d.slice(5)],lunar=traditional[lunarKey(date)];
 if(holiday)labels.push(holiday);
 if(lunar)labels.push(lunar);
 if(lunarKey(new Date(+date+86400000))==='1/1')labels.push('除夕');
 if(date.getUTCDay()===0){if(month===5&&n>=8&&n<=14)labels.push('母亲节');if(month===6&&n>=15&&n<=21)labels.push('父亲节')}
 const row=solarDays[year-1901];
 if(row){for(let i=(month-1)*2;i<month*2;i++)if(row[i]===n)labels.push(solarNames[i])}
 return labels
}
const dayFacts={
 '01-04':[2019,'世界盲文日','盲文用凸起的点排列成字，读者可以用指尖辨认。','联合国'],
 '02-21':[2000,'国际母语日','这一天关注人们最早学会的语言，也关注正在消失的语言。','联合国教科文组织'],
 '03-14':[1988,'π 日','把 3 月 14 日写成 3/14，恰好是圆周率开头的三位数字。','旧金山探索馆'],
 '04-12':[1961,'人类第一次进入太空','1961 年，加加林乘东方一号绕地球一周，飞行约 108 分钟。','NASA'],
 '05-20':[1875,'一把尺子的来历','1875 年，17 个国家在巴黎签署《米制公约》。5 月 20 日后来成为世界计量日。','国际计量局'],
 '06-08':[2009,'世界海洋日','从 2009 年起，联合国在这一天庆祝世界海洋日。','联合国'],
 '07-20':[1969,'人类首次登月','按世界时，1969 年的今天，阿波罗 11 号的鹰号登月舱在月面着陆。','NASA'],
 '08-19':[1839,'照片里的银版','1839 年，达盖尔银版摄影法的细节在巴黎向公众公布。','美国国会图书馆'],
 '09-08':[1967,'国际扫盲日','联合国教科文组织自 1967 年起纪念这一天，关注每个人读写的机会。','联合国教科文组织'],
 '10-04':[1957,'夜空里的一颗人造卫星','1957 年，斯普特尼克一号升空。地面上的无线电爱好者也能收到它的信号。','NASA'],
 '11-04':[1946,'教科文组织的生日','1946 年的今天，《联合国教育、科学及文化组织组织法》生效。','联合国教科文组织'],
 '12-10':[1901,'第一届诺贝尔奖','1901 年的今天，首届诺贝尔奖颁发。这个日期也是诺贝尔的忌日。','诺贝尔奖官网']
};
function annotation(d){return S.prefs.almanac===false?'':'<small class="almanac">'+dateLabels(d).join(' · ')+'</small>'}
function dayStory(d){
 if(S.prefs.almanac===false)return '';
 const fact=dayFacts[d.slice(5)];
 if(!fact||Number(d.slice(0,4))<fact[0])return '';
 return '<section class="daystory"><small>'+d+' · 这一天</small><h3>'+fact[1]+'</h3><p>'+fact[2]+'</p><small>来源 · '+fact[3]+'</small></section>'
}
