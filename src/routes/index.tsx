import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuth } from "@workos-inc/authkit-react";
import { useQuery } from "convex/react";
import { ArrowRight, BriefcaseBusiness, Building2, CalendarClock, CheckCircle2, ChevronRight, FileText, Plus, Sparkles, Target, Users, X } from "lucide-react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: DashboardPage });
const PIPELINE=["Interested","Preparing","Applied","Assessment","Interview","Offer"];

function DashboardPage(){
  const {user,isLoading}=useAuth(); const uid=user?.id;
  const companies=useQuery(api.companies.list,uid?{workosUserId:uid}:"skip");
  const opportunities=useQuery(api.opportunities.list,uid?{workosUserId:uid}:"skip");
  const applications=useQuery(api.applications.list,uid?{workosUserId:uid}:"skip");
  const contacts=useQuery(api.contacts.list,uid?{workosUserId:uid}:"skip");
  const [addOpen,setAddOpen]=useState(false);
  if(isLoading)return <DashboardSkeleton/>;
  const firstName=user?.firstName??user?.email?.split("@")[0]??"there"; const hour=new Date().getHours(); const greeting=hour<12?"Good morning":hour<17?"Good afternoon":"Good evening";
  const deadlines=getDeadlines(opportunities??[],applications??[]); const topCompanies=[...(companies??[])].filter(item=>item.overallScore!==undefined).sort((a,b)=>(b.overallScore??0)-(a.overallScore??0)).slice(0,5); const active=(applications??[]).filter((item:any)=>!["Rejected","Withdrawn"].includes(item.status));
  return <div className="linear-dashboard">
    <header className="linear-hero"><div><span className="dashboard-date">{new Intl.DateTimeFormat("en-GB",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}</span><h1>{greeting}, {firstName}</h1><p>Here’s where your search stands right now.</p></div><div className="quick-add-wrap"><Button onClick={()=>setAddOpen(value=>!value)}><Plus size={14}/> Create</Button>{addOpen&&<div className="quick-add-menu"><header><span>Create new</span><button onClick={()=>setAddOpen(false)}><X size={13}/></button></header><QuickLink to="/companies" icon={<Building2 size={14}/>} label="Company" hint="C"/><QuickLink to="/opportunities" icon={<BriefcaseBusiness size={14}/>} label="Opportunity" hint="O"/><QuickLink to="/applications" icon={<FileText size={14}/>} label="Application" hint="A"/><QuickLink to="/contacts" icon={<Users size={14}/>} label="Contact" hint="P"/></div>}</div></header>
    <section className="dashboard-overview"><div className="overview-title"><span><Sparkles size={13}/> Overview</span><small>Live workspace</small></div><Metric label="Companies" value={companies?.length??0} detail={`${opportunities?.filter((x:any)=>x.isOpen).length??0} open opportunities`}/><Metric label="Applications" value={applications?.length??0} detail={`${active.length} active`}/><Metric label="Interviews" value={applications?.filter((x:any)=>x.status==="Interview").length??0} detail="current stage"/><Metric label="Offers" value={applications?.filter((x:any)=>x.status==="Offer").length??0} detail={`${contacts?.length??0} contacts tracked`}/></section>
    <div className="dashboard-layout">
      <main className="dashboard-primary">
        <Panel title="Upcoming deadlines" eyebrow="Focus" action={<Link to="/deadlines">View all <ArrowRight size={12}/></Link>}>
          <div className="focus-list">{deadlines.slice(0,5).map((item:any,index)=><Link to={item.source==="Application"?"/applications":"/opportunities"} className="focus-row" key={item.id}><span className={`focus-marker urgency-${urgency(item.date)}`}><i/>{index===0?"Next":urgency(item.date)}</span><div><strong>{item.name}</strong><small>{item.company} · {item.opportunity}</small></div><time><b>{countdown(item.date)}</b><small>{formatDate(item.date)}</small></time><ChevronRight size={14}/></Link>)}{!deadlines.length&&<DashboardEmpty icon={<CalendarClock size={19}/>} title="No deadlines on the horizon" copy="Add a date to an opportunity or application."/>}</div>
        </Panel>
        <Panel title="Application pipeline" eyebrow="Progress" action={<Link to="/applications">Open board <ArrowRight size={12}/></Link>}>
          <div className="linear-pipeline">{PIPELINE.map((status,index)=>{const count=applications?.filter((item:any)=>item.status===status).length??0;return <div key={status}><span><i style={{width:`${Math.max(count?18:0,Math.min(100,count*24))}%`}}/></span><div><small>{status}</small><strong>{count}</strong></div>{index<PIPELINE.length-1&&<ChevronRight size={12}/>}</div>})}</div>
        </Panel>
      </main>
      <aside className="dashboard-secondary">
        <Panel title="Top companies" eyebrow="Shortlist" action={<Link to="/companies">Browse <ArrowRight size={12}/></Link>}>
          <div className="shortlist">{topCompanies.map((company:any,index)=><Link to="/companies" key={company._id}><span className="rank-number">{String(index+1).padStart(2,"0")}</span><i className="mini-company-logo">{company.logoUrl?<img src={company.logoUrl} alt=""/>:company.name[0]}</i><strong>{company.name}</strong><b>{company.overallScore}</b></Link>)}{!topCompanies.length&&<DashboardEmpty icon={<Target size={18}/>} title="No ranked companies" copy="Add scores to create a shortlist."/>}</div>
        </Panel>
        <Panel title="Workspace health" eyebrow="System"><div className="health-list"><Health label="Companies linked" value={opportunities?.filter((x:any)=>x.company).length??0} total={opportunities?.length??0}/><Health label="Opportunities dated" value={opportunities?.filter((x:any)=>x.deadlines.length).length??0} total={opportunities?.length??0}/><Health label="Applications active" value={active.length} total={applications?.length??0}/></div></Panel>
      </aside>
    </div>
  </div>;
}
function Metric({label,value,detail}:{label:string;value:number;detail:string}){return <div className="linear-metric"><span>{label}</span><strong>{value.toString().padStart(2,"0")}</strong><small>{detail}</small></div>}
function Panel({title,eyebrow,action,children}:{title:string;eyebrow:string;action?:React.ReactNode;children:React.ReactNode}){return <section className="linear-panel"><header><div><span>{eyebrow}</span><h2>{title}</h2></div>{action}</header>{children}</section>}
function QuickLink({to,icon,label,hint}:{to:string;icon:React.ReactNode;label:string;hint:string}){return <Link to={to} onClick={()=>{}}>{icon}<span>{label}</span><kbd>{hint}</kbd></Link>}
function DashboardEmpty({icon,title,copy}:{icon:React.ReactNode;title:string;copy:string}){return <div className="dashboard-empty">{icon}<strong>{title}</strong><span>{copy}</span></div>}
function Health({label,value,total}:{label:string;value:number;total:number}){const pct=total?Math.round(value/total*100):0;return <div><span><CheckCircle2 size={13}/>{label}<b>{pct}%</b></span><i><em style={{width:`${pct}%`}}/></i></div>}
function getDeadlines(opportunities:any[],applications:any[]){return [...opportunities.flatMap(item=>item.deadlines.map((deadline:any,index:number)=>({id:`o-${item._id}-${index}`,source:"Opportunity",company:item.company?.name??"Unknown",opportunity:item.name,...deadline}))),...applications.flatMap(item=>item.deadlines.map((deadline:any,index:number)=>({id:`a-${item._id}-${index}`,source:"Application",company:item.company?.name??"Unknown",opportunity:item.opportunity?.name??"General application",...deadline})))].filter(item=>item.date>=startToday()).sort((a,b)=>a.date-b.date)}
function startToday(){const d=new Date();d.setHours(0,0,0,0);return d.getTime()} function days(date:number){return Math.ceil((date-startToday())/86400000)} function countdown(date:number){const value=days(date);return value===0?"Today":value===1?"Tomorrow":`${value} days`} function urgency(date:number){const value=days(date);return value<=3?"urgent":value<=14?"soon":"upcoming"} function formatDate(date:number){return new Intl.DateTimeFormat("en-GB",{day:"numeric",month:"short"}).format(date)}
function DashboardSkeleton(){return <div className="dashboard-skeleton">{Array.from({length:10}).map((_,i)=><i key={i}/>)}</div>}
