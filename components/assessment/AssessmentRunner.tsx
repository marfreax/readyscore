"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, ShieldCheck } from "lucide-react";

type AssessmentType="free"|"premium"|"riasec"|"disc"|"eq"|"cognitive";
type Question={id:string;code:string;text:string;domain:string;subdomain:string|null;indicator:string|null;sequence:number;answered?:boolean;answer?:number|null};
type Progress={answered:number;total:number;remaining:number;percentage:number};
type AttemptView={attempt:{id:string;assessmentType:AssessmentType;status:string};questions:Question[];progress:Progress};

const OPTIONS=[[1,"Sangat Tidak Sesuai"],[2,"Tidak Sesuai"],[3,"Netral / Kadang Sesuai"],[4,"Sesuai"],[5,"Sangat Sesuai"]] as const;
const RIASEC_LABELS: Record<string,string>={R:"Realistic",I:"Investigative",A:"Artistic",S:"Social",E:"Enterprising",C:"Conventional"};
const DISC_LABELS: Record<string,string>={D:"Dominance",I:"Influence",S:"Steadiness",C:"Conscientiousness"};
const EQ_LABELS: Record<string,string>={EMOTION_AWARENESS:"Emotion Awareness",EMOTION_REGULATION:"Emotion Regulation",EMPATHY_SOCIAL_AWARENESS:"Empathy / Social Awareness",RELATIONSHIP_SOCIAL_RESPONSE:"Relationship / Social Response"};
const COGNITIVE_LABELS: Record<string,string>={VERBAL_REASONING:"Verbal Reasoning",NUMERICAL_REASONING:"Numerical Reasoning",LOGICAL_REASONING:"Logical Reasoning",ABSTRACT_REASONING:"Abstract Reasoning"};
const STORAGE_PREFIX="readyscore:active-attempt:";

export default function AssessmentRunner({type,mode="standard"}:{type:AssessmentType;mode?:"standard"|"reassessment"}){
  const router=useRouter();
  const [attemptId,setAttemptId]=useState("");
  const [questions,setQuestions]=useState<Question[]>([]);
  const [current,setCurrent]=useState(0);
  const [answers,setAnswers]=useState<Record<string,number>>({});
  const [progress,setProgress]=useState<Progress>({answered:0,total:0,remaining:0,percentage:0});
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [showReview,setShowReview]=useState(false);
  const [confirmSubmit,setConfirmSubmit]=useState(false);
  const [resuming,setResuming]=useState(false);
  const storageKey=STORAGE_PREFIX+mode+":"+type;

  const question=questions[current];
  const answeredCount=useMemo(()=>Object.keys(answers).length,[answers]);
  const isPremium=type==="premium";
  const isRiasec=type==="riasec";
  const isDisc=type==="disc";
  const isEq=type==="eq";
  const isCognitive=type==="cognitive";
  const answeredPercent=progress.total?Math.round(answeredCount/progress.total*100):0;

  useEffect(()=>{
    const saved=window.sessionStorage.getItem(storageKey);
    if(!saved)return;
    setResuming(true);
    fetch(`/api/assessment/${saved}`)
      .then(async response=>{
        const data=await response.json();
        if(!response.ok||!data.ok||data.attempt?.status!=="IN_PROGRESS"||data.attempt?.assessmentType!==type)throw new Error("NO_ACTIVE_ATTEMPT");
        const nextAnswers:Record<string,number>={};
        for(const q of data.questions as Question[])if(typeof q.answer==="number")nextAnswers[q.id]=q.answer;
        setAttemptId(saved);setQuestions(data.questions);setProgress(data.progress);setAnswers(nextAnswers);
      })
      .catch(()=>window.sessionStorage.removeItem(storageKey))
      .finally(()=>setResuming(false));
  },[storageKey]);

  async function start(){
    setBusy(true);setMessage("");
    try{
      const endpoint=mode==="reassessment"?"/api/assessment/reassessment/start":"/api/assessment/start";
      const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type})});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error?.message??"Gagal memulai assessment.");
      setAttemptId(data.attemptId);setQuestions(data.questions);setProgress(data.progress);setCurrent(0);setAnswers({});setShowReview(false);setConfirmSubmit(false);
      window.sessionStorage.setItem(storageKey,data.attemptId);
    }catch(error){setMessage(error instanceof Error?error.message:"Gagal memulai assessment.");}
    finally{setBusy(false);}
  }

  async function answer(value:number){
    if(!question||!attemptId)return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/assessment/${attemptId}/answer`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId:question.id,value})});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error?.message??"Jawaban gagal disimpan.");
      setAnswers(currentAnswers=>({...currentAnswers,[question.id]:value}));setProgress(data.progress);
      if(current<questions.length-1)setCurrent(valueIndex=>valueIndex+1);else setShowReview(true);
    }catch(error){setMessage(error instanceof Error?error.message:"Jawaban gagal disimpan.");}
    finally{setBusy(false);}
  }

  async function abandon(){
    if(!attemptId)return;
    setBusy(true);
    try{await fetch(`/api/assessment/${attemptId}/abandon`,{method:"POST"});}finally{window.sessionStorage.removeItem(storageKey);setAttemptId("");setQuestions([]);setAnswers({});setCurrent(0);setShowReview(false);setConfirmSubmit(false);setBusy(false);}
  }

  async function submit(){
    if(!attemptId)return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/assessment/${attemptId}/submit`,{method:"POST"});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error?.message??"Assessment gagal disubmit.");
      window.sessionStorage.removeItem(storageKey);
      router.push(`/result/${attemptId}`);
    }catch(error){setMessage(error instanceof Error?error.message:"Assessment gagal disubmit.");setConfirmSubmit(false);}
    finally{setBusy(false);}
  }

  if(resuming)return <LoadingScreen label="Memulihkan assessment Anda..." />;

  if(!attemptId)return <Intro type={type} busy={busy} message={message} onStart={start} />;
  if(!question)return null;

  const selected=answers[question.id]??null;
  const firstUnanswered=questions.findIndex(q=>answers[q.id]===undefined);

  return <div className="min-h-full bg-slate-50 text-slate-950">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wide text-indigo-600">ReadyScore {isRiasec?"RIASEC":isDisc?"DISC":isEq?"EQ":isCognitive?"Cognitive":isPremium?"Premium":"Free"}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">Assessment kesiapan Anda</p></div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500"><Clock3 className="h-4 w-4" /> {current+1} / {questions.length}</div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-600 transition-all" style={{width:`${progress.percentage}%`}}/></div>
        <div className="mt-2 flex justify-between text-xs text-slate-500"><span>{answeredCount} terjawab</span><span>{answeredPercent}% selesai</span></div>
      </div>
    </header>

    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {isPremium && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-800"><ShieldCheck className="h-4 w-4 shrink-0" /> Assessment Premium menggunakan cakupan yang lebih lengkap dari Question Bank yang sama.</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
          <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            {isRiasec ? `${question.domain} · ${RIASEC_LABELS[question.domain]??question.domain}` : isDisc ? `${question.domain} · ${DISC_LABELS[question.domain]??question.domain}` : isEq ? `${EQ_LABELS[question.domain]??question.domain}` : isCognitive ? `${COGNITIVE_LABELS[question.domain]??question.domain}` : question.domain}
          </span><span className="text-xs font-semibold text-slate-400">{question.code}</span></div>
          <h1 className="mt-7 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{question.text}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isRiasec
              ? "Pilih jawaban yang paling menggambarkan ketertarikan Anda saat ini. Tidak ada jawaban benar atau salah."
              : isDisc
                ? "Pilih jawaban yang paling menggambarkan kecenderungan perilaku Anda. Tidak ada jawaban benar atau salah."
                : isEq
                  ? "Pilih jawaban yang paling menggambarkan pengalaman dan respons Anda saat ini. Tidak ada jawaban benar atau salah."
                  : isCognitive
                    ? "Pilih jawaban yang paling menggambarkan cara Anda biasanya memahami informasi dan menghadapi tugas penalaran. Hasil ini bukan skor IQ."
                    : "Pilih jawaban yang paling menggambarkan kondisi Anda saat ini."}
          </p>
          <div className="mt-8 grid gap-3">{OPTIONS.map(([value,label])=><button key={value} disabled={busy} onClick={()=>answer(value)} className={`group flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected===value?"border-indigo-600 bg-indigo-50 text-indigo-800":"border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selected===value?"bg-indigo-600 text-white":"bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"}`}>{value}</span><span className="text-sm font-semibold">{label}</span>{selected===value&&<Check className="ml-auto h-5 w-5 text-indigo-600"/>}</button>)}</div>
          {message&&<p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><button onClick={()=>setCurrent(Math.max(0,current-1))} disabled={busy||current===0} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-35"><ChevronLeft className="h-4 w-4"/>Sebelumnya</button>{current<questions.length-1?<button onClick={()=>setCurrent(Math.min(questions.length-1,current+1))} disabled={busy||selected===null} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-35">Berikutnya<ChevronRight className="h-4 w-4"/></button>:<button onClick={()=>setConfirmSubmit(true)} disabled={busy||answeredCount!==questions.length} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-35">Selesai & Lihat Hasil<ArrowRight className="h-4 w-4"/></button>}</div>
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:h-fit">
          <div className="flex items-center justify-between"><h2 className="font-bold">Navigasi Soal</h2><CircleHelp className="h-4 w-4 text-slate-400"/></div>
          <p className="mt-1 text-xs text-slate-500">Pilih nomor untuk kembali mengubah jawaban.</p>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-5">{questions.map((q,index)=>{const answered=answers[q.id]!==undefined;return <button key={q.id} onClick={()=>setCurrent(index)} disabled={busy} aria-label={`Soal ${index+1}`} className={`h-9 rounded-lg text-xs font-bold ${index===current?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-600"} ${answered&&index!==current?"ring-2 ring-indigo-100":""}`}>{index+1}</button>})}</div>
          <div className="mt-5 space-y-2 text-xs text-slate-500"><div className="flex justify-between"><span>Terjawab</span><strong className="text-slate-800">{answeredCount}</strong></div><div className="flex justify-between"><span>Belum dijawab</span><strong className="text-slate-800">{questions.length-answeredCount}</strong></div></div>
          {firstUnanswered>=0&&<button onClick={()=>setCurrent(firstUnanswered)} className="mt-5 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700">Ke soal belum dijawab</button>}
          <button onClick={()=>setConfirmSubmit(true)} disabled={busy||answeredCount!==questions.length} className="mt-3 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-35">Review & Selesai</button>
          <button onClick={abandon} disabled={busy} className="mt-3 w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600">Keluar dari assessment</button>
        </aside>
      </div>
    </div>

    {showReview&&<div className="fixed inset-0 z-40 bg-slate-950/40 p-4 backdrop-blur-sm"><div className="mx-auto mt-10 max-w-lg rounded-3xl bg-white p-7 shadow-2xl"><h2 className="text-2xl font-bold">Review jawaban</h2><p className="mt-2 text-sm leading-6 text-slate-600">Anda sudah menjawab {answeredCount} dari {questions.length} soal. Anda masih bisa kembali ke soal mana pun.</p><button onClick={()=>{setShowReview(false);setCurrent(Math.max(0,firstUnanswered));}} className="mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Kembali ke Assessment</button></div></div>}

    {confirmSubmit&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl"><h2 className="text-2xl font-bold">Selesaikan assessment?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Setelah dikirim, jawaban akan dihitung dan hasil assessment dibuat sebagai snapshot. Anda tidak dapat mengubah jawaban pada attempt ini.</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={()=>setConfirmSubmit(false)} disabled={busy} className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Kembali</button><button onClick={submit} disabled={busy||answeredCount!==questions.length} className="rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy?"Menghitung...":"Kirim & Lihat Hasil"}</button></div></div></div>}
  </div>;
}

function Intro({type,busy,message,onStart}:{type:AssessmentType;busy:boolean;message:string;onStart:()=>void}){
  const premium=type==="premium";
  const riasec=type==="riasec";
  const disc=type==="disc";
  const eq=type==="eq";
  const title=riasec?"Temukan profil minat Anda.":disc?"Kenali kecenderungan perilaku Anda.":eq?"Eksplorasi profil EQ Anda.":premium?"Assessment Premium yang lebih lengkap.":"Mulai dengan assessment gratis.";
  const description=riasec?"Ukur pola minat Anda melalui enam dimensi RIASEC dengan 60 pertanyaan terstruktur.":disc?"Eksplorasi pola perilaku melalui empat dimensi DISC: Dominance, Influence, Steadiness, dan Conscientiousness.":eq?"Eksplorasi empat dimensi EQ: Emotion Awareness, Emotion Regulation, Empathy / Social Awareness, dan Relationship / Social Response.":premium?"Ukur kesiapan Anda dengan cakupan yang lebih luas menggunakan Question Bank dan scoring model ReadyScore yang sama.":"Dapatkan gambaran awal kesiapan Anda melalui assessment singkat yang terstruktur.";
  const count=riasec?"60":disc||eq?"24":premium?"100":"20";
  const button=riasec?"Mulai Assessment RIASEC":disc?"Mulai Assessment DISC":eq?"Mulai Assessment EQ":premium?"Mulai Assessment Premium":"Mulai Assessment Gratis";
  return <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950 sm:px-6"><div className="mx-auto max-w-3xl"><div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><ShieldCheck className="h-4 w-4"/>ReadyScore {riasec?"RIASEC":disc?"DISC":eq?"EQ":premium?"Premium":"Free"}</div><h1 className="mt-5 text-4xl font-bold tracking-tight">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[[count,"soal"],[riasec?"6":disc||eq?"4":"1","dimensi / Question Bank"],["5","pilihan jawaban"]].map(([value,label])=><div key={label} className="rounded-2xl bg-slate-50 p-4"><p className="text-2xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-500">{label}</p></div>)}</div><div className="mt-8 rounded-2xl border border-slate-200 p-5"><p className="text-sm font-bold">Sebelum mulai</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li>• Tidak ada jawaban benar atau salah.</li><li>• Jawab berdasarkan kondisi Anda saat ini.</li><li>• Anda dapat kembali ke soal sebelumnya.</li><li>• Setelah submit, hasil dibuat sebagai snapshot assessment.</li></ul></div><button onClick={onStart} disabled={busy} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white disabled:opacity-40">{busy?"Menyiapkan...":button}<ArrowRight className="h-4 w-4"/></button>{message&&<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}</div></div></div>;
}

function LoadingScreen({label}:{label:string}){return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"/><p className="mt-4 text-sm font-semibold text-slate-600">{label}</p></div></div>;}
