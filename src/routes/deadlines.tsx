import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";
import { CalendarClock, CalendarDays, ChevronRight, Clock3 } from "lucide-react";
import { useMemo, useState } from "react";
import { api } from "../../convex/_generated/api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/deadlines")({ component: DeadlinesPage });
type DeadlineRow = { id:string; name:string; date:number; source:"Opportunity"|"Application"; company:string; opportunity:string; status:string };

function DeadlinesPage() {
  const { user } = useAuth(); const uid=user?.id;
  const opportunities=useQuery(api.opportunities.list,uid?{workosUserId:uid}:"skip");
  const applications=useQuery(api.applications.list,uid?{workosUserId:uid}:"skip");
  const [scope,setScope]=useState<"upcoming"|"past"|"all">("upcoming");
  const deadlines=useMemo<DeadlineRow[]>(()=>[
    ...(opportunities??[]).flatMap((item:any)=>item.deadlines.map((deadline:any,index:number)=>({id:`o-${item._id}-${index}`,name:deadline.name,date:deadline.date,source:"Opportunity" as const,company:item.company?.name??"Unknown company",opportunity:item.name,status:item.status}))),
    ...(applications??[]).flatMap((item:any)=>item.deadlines.map((deadline:any,index:number)=>({id:`a-${item._id}-${index}`,name:deadline.name,date:deadline.date,source:"Application" as const,company:item.company?.name??"Unknown company",opportunity:item.opportunity?.name??"General application",status:item.status}))),
  ].sort((a,b)=>a.date-b.date),[applications,opportunities]);
  const now=startOfToday(); const visible=deadlines.filter(item=>scope==="all"||(scope==="past"?item.date<now:item.date>=now));
  const next=deadlines.filter(item=>item.date>=now)[0];
  return <div className="deadline-workspace">
    <header className="page-command deadline-heading"><div><p className="page-kicker">Time-sensitive</p><h1>Deadlines</h1><span>Every milestone, ordered by what needs attention next.</span></div>{next&&<div className="next-deadline"><span>Next deadline</span><strong>{countdown(next.date)}</strong><small>{next.company} · {next.name}</small></div>}</header>
    <section className="deadline-summary"><div><CalendarClock size={15}/><span>Upcoming<strong>{deadlines.filter(item=>item.date>=now).length}</strong></span></div><div><Clock3 size={15}/><span>Within 7 days<strong>{deadlines.filter(item=>{const days=daysBetween(item.date);return days>=0&&days<=7}).length}</strong></span></div><div><CalendarDays size={15}/><span>Passed<strong>{deadlines.filter(item=>item.date<now).length}</strong></span></div></section>
    <section className="deadline-ledger"><header><div className="segmented-control">{(["upcoming","past","all"] as const).map(value=><button className={scope===value?"active":""} onClick={()=>setScope(value)} key={value}>{value[0].toUpperCase()+value.slice(1)}</button>)}</div><span>{visible.length} milestones</span></header>
      {opportunities===undefined||applications===undefined?<DeadlineSkeleton/>:visible.length===0?<div className="deadline-empty"><CalendarClock size={22}/><strong>No {scope} deadlines</strong><span>Add milestones to opportunities or applications.</span></div>:<div className="deadline-list">{visible.map((item,index)=>{const urgency=urgencyFor(item.date);const date=new Date(item.date);const showMonth=index===0||new Date(visible[index-1].date).getMonth()!==date.getMonth()||new Date(visible[index-1].date).getFullYear()!==date.getFullYear();return <div className={cn("deadline-row",urgency)} key={item.id}>{showMonth?<span className="deadline-month">{new Intl.DateTimeFormat("en-GB",{month:"long",year:"numeric"}).format(date)}</span>:<span/>}<time><b>{date.getDate().toString().padStart(2,"0")}</b><small>{new Intl.DateTimeFormat("en-GB",{weekday:"short"}).format(date)}</small></time><span className="deadline-line"/><div className="deadline-copy"><span>{item.source} · {item.status}</span><strong>{item.name}</strong><small>{item.company} · {item.opportunity}</small></div><span className="countdown-badge"><i/>{countdown(item.date)}</span><Link to={item.source==="Opportunity"?"/opportunities":"/applications"} aria-label={`Open ${item.source}`}><ChevronRight size={15}/></Link></div>})}</div>}
    </section>
  </div>;
}
function startOfToday(){const date=new Date();date.setHours(0,0,0,0);return date.getTime()}
function daysBetween(timestamp:number){return Math.ceil((timestamp-startOfToday())/86400000)}
function countdown(timestamp:number){const days=daysBetween(timestamp);if(days===0)return "Today";if(days===1)return "Tomorrow";if(days>1)return `${days} days`;const passed=Math.abs(days);return passed===1?"1 day ago":`${passed} days ago`}
function urgencyFor(timestamp:number){const days=daysBetween(timestamp);return days<0?"passed":days<=3?"urgent":days<=14?"soon":"upcoming"}
function DeadlineSkeleton(){return <div className="deadline-skeleton">{Array.from({length:5}).map((_,i)=><div key={i}><i/><span/><b/></div>)}</div>}
