import { deadlineDate } from "./clock.mjs";
const day=86400000;
const summaryKeys=["city","province","district","organization","announcement_title","job_name","job_code","publish_date","registration_deadline","announcement_url","registration_url"];
export function project(data, now=new Date()) {
  const history=new Map((data.history||[]).map(row=>[row.id,{...row}])), active=[];
  for(const row of data.active||[]) {
    const deadline=deadlineDate(row.job.registration_deadline);
    const stale=new Date(new Date(row.updated_at).getTime()+180*day);
    const anchor=deadline||stale;
    if(Number.isFinite(anchor.getTime())&&now>anchor) {
      const item={id:row.id,source:row.source,archive_reason:deadline?"expired":"unconfirmed",archive_at:anchor.toISOString(),retention_anchor:anchor.toISOString()};
      for(const key of summaryKeys)item[key]=row.job[key];
      history.set(row.id,item);
    } else {active.push(row);history.delete(row.id);}
  }
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
