import { deadlineDate } from "./clock.mjs";
const day=86400000;
const summaryKeys=["city","province","district","organization","announcement_title","job_name","job_code","publish_date","registration_deadline","announcement_url","registration_url"];
export function isAnnouncement(row) {
  const job=row.job||row;
  return row.record_kind==="announcement"||["体育教师相关招聘公告（岗位待核验）","招聘公告（岗位待核验）"].includes(job.job_name);
}
function relevant(row) {
  if(!isAnnouncement(row))return true;
  const title=(row.job||row).announcement_title||"";
  return /教师|学校|教育/.test(title)&&/招聘|选聘|招录/.test(title)&&!/拟录用|拟聘|公示|成绩|体检|资格复审|签约|测试|考试|取消|核减|递补|考察/.test(title);
}
export function project(data, now=new Date()) {
  const history=new Map((data.history||[]).filter(relevant).map(row=>[row.id,{...row}])), active=[];
  for(const original of data.active||[]) {
    if(!relevant(original))continue;
    const row=isAnnouncement(original)?{...original,record_kind:"announcement",job:{...original.job,job_name:"招聘公告（岗位待核验）"}}:original;
    const deadline=deadlineDate(row.job.registration_deadline);
    const stale=new Date(new Date(row.updated_at).getTime()+180*day);
    const anchor=deadline||stale;
    if(Number.isFinite(anchor.getTime())&&now>anchor) {
      const item={id:row.id,record_kind:row.record_kind||"job",source:row.source,archive_reason:deadline?"expired":"unconfirmed",archive_at:anchor.toISOString(),retention_anchor:anchor.toISOString()};
      for(const key of summaryKeys)item[key]=row.job[key];
      history.set(row.id,item);
    } else {active.push(row);history.delete(row.id);}
  }
  active.sort((a,b)=>Number(isAnnouncement(a))-Number(isAnnouncement(b)));
  return {...data,active,history:[...history.values()].filter(row=>now<=new Date(new Date(row.retention_anchor).getTime()+365*day)).sort((a,b)=>new Date(b.retention_anchor)-new Date(a.retention_anchor)).slice(0,5000)};
}
export function selectRows(rows,{city="",q="",deadline="all"}={},now=new Date()) {
  const search=q.trim().toLocaleLowerCase();
  return rows.filter(row=>{
    const job=row.job||row;
    if(city&&job.city!==city)return false;
    if(search&&![job.city,job.district,job.organization,job.job_name,job.job_code,job.announcement_title].join(" ").toLocaleLowerCase().includes(search))return false;
    const due=deadlineDate(job.registration_deadline);
    if(deadline==="unknown"&&due)return false;
    if(deadline==="soon"&&(!due||due<now||due>new Date(now.getTime()+7*day)))return false;
    return true;
  });
}
