"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, ChevronLeft, ChevronRight, CircleHelp, Clock3, ShieldCheck } from "lucide-react";

type AssessmentType="free"|"premium"|"riasec"|"disc"|"eq"|"cognitive";
type Question={id:string;code:string;text:string;domain:string;subdomain:string|null;indicator:string|null;sequence:number;answered?:boolean;answer?:number|null;answerType?:string;options?:string[]};
type Progress={answered:number;total:number;remaining:number;percentage:number};
type AttemptView={attempt:{id:string;assessmentType:AssessmentType;status:string;startedAt:string;expiresAt?:string};timer?:{startedAt:string;expiresAt:string;timeLimitSeconds:number;remainingSeconds:number;serverNow:string}|null;questions:Question[];progress:Progress;result?:unknown};

const LIKERT_OPTIONS=[[1,"Sangat Tidak Sesuai"],[2,"Tidak Sesuai"],[3,"Netral / Kadang Sesuai"],[4,"Sesuai"],[5,"Sangat Sesuai"]] as const;
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
  const [timer,setTimer]=useState<{expiresAt:string;remainingSeconds:number;serverNow:string}|null>(null);
  const storageKey=STORAGE_PREFIX+mode+":"+type;

  const question=questions[current];
  const selected=question ? answers[question.id]??null : null;
  const answeredCount=useMemo(()=>Object.keys(answers).length,[answers]);
  const isPremium=type==="premium";
  const isRiasec=type==="riasec";
  const isDisc=type==="disc";
  const isEq=type==="eq";
  const isCognitive=type==="cognitive";
  const isSingleChoice4=(isCognitive||isEq) && question?.answerType==="SINGLE_CHOICE_4";
  const answeredPercent=progress.total?Math.round(answeredCount/progress.total*100):0;

  useEffect(()=>{
    const saved=window.localStorage.getItem(storageKey);
    if(!saved)return;
    setResuming(true);
    fetch(`/api/assessment/${saved}`, { cache: "no-store" })
      .then(async response=>{
        const data=await response.json();
        if(!response.ok||!data.ok||!data.attempt||data.attempt.assessmentType!==type)throw new Error("NO_ACTIVE_ATTEMPT");
        if(data.attempt.status==="EXPIRED" || data.result){
          window.localStorage.removeItem(storageKey);
          router.push(`/result/${saved}`);
          return;
        }
        if(data.attempt.status!=="IN_PROGRESS")throw new Error("NO_ACTIVE_ATTEMPT");
        const nextAnswers:Record<string,number>={};
        for(const q of data.questions as Question[])if(typeof q.answer==="number")nextAnswers[q.id]=q.answer;
        setAttemptId(saved);setQuestions(data.questions);setProgress(data.progress);setAnswers(nextAnswers);
        setTimer(data.timer ? { expiresAt:data.timer.expiresAt, remainingSeconds:data.timer.remainingSeconds, serverNow:data.timer.serverNow } : null);
      })
      .catch(()=>window.localStorage.removeItem(storageKey))
      .finally(()=>setResuming(false));
  },[storageKey,type,router]);

  useEffect(()=>{
    if(!attemptId || !timer?.expiresAt)return;
    const tick=()=>setTimer(current=>current?{...current,remainingSeconds:Math.max(0,Math.ceil((new Date(current.expiresAt).getTime()-Date.now())/1000))}:current);
    tick();
    const interval=window.setInterval(tick,1000);
    return()=>window.clearInterval(interval);
  },[attemptId,timer?.expiresAt]);

  useEffect(()=>{
    if(!attemptId)return;
    const interval=window.setInterval(async()=>{
      try{
        const response=await fetch(`/api/assessment/${attemptId}`,{cache:"no-store"});
        const data=await response.json();
        if(!response.ok||!data.ok)return;
        if(data.timer)setTimer({expiresAt:data.timer.expiresAt,remainingSeconds:data.timer.remainingSeconds,serverNow:data.timer.serverNow});
        if(data.attempt?.status==="EXPIRED" || data.result){
          window.localStorage.removeItem(storageKey);
          router.push(`/result/${attemptId}`);
        }
      }catch{}
    },15000);
    return()=>window.clearInterval(interval);
  },[attemptId,storageKey,router]);

  useEffect(() => {
    if (!attemptId || !questions.length) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (busy || confirmSubmit) return;
      if (event.key === "ArrowLeft" && current > 0) { event.preventDefault(); setCurrent((value) => value - 1); }
      if (event.key === "ArrowRight" && selected !== null && current < questions.length - 1) { event.preventDefault(); setCurrent((value) => value + 1); }
    };
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (progress.answered > 0 && progress.answered < progress.total) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [attemptId, questions.length, current, selected, busy, confirmSubmit, progress.answered, progress.total]);

  async function start(){
    setBusy(true);setMessage("");
    try{
      const endpoint=mode==="reassessment"?"/api/assessment/reassessment/start":"/api/assessment/start";
      const response=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({type})});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error?.message??"Gagal memulai assessment.");
      setAttemptId(data.attemptId);setQuestions(data.questions);setProgress(data.progress);setCurrent(0);setAnswers({});setShowReview(false);setConfirmSubmit(false);
      setTimer(data.timer ? {expiresAt:data.timer.expiresAt,remainingSeconds:data.timer.remainingSeconds,serverNow:data.timer.serverNow} : null);
      window.localStorage.setItem(storageKey,data.attemptId);
    }catch(error){setMessage(error instanceof Error?error.message:"Gagal memulai assessment.");}
    finally{setBusy(false);}
  }

  async function answer(value:number){
    if(!question||!attemptId)return;
    setBusy(true);setMessage("");
    setAnswers(currentAnswers=>({...currentAnswers,[question.id]:value}));
    let lastError:Error|null=null;
    for(let attempt=0;attempt<3;attempt+=1){
      try{
        const response=await fetch(`/api/assessment/${attemptId}/answer`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({questionId:question.id,value})});
        const data=await response.json();
        if(!response.ok)throw new Error(data?.error?.message??"Jawaban gagal disimpan.");
        setProgress(data.progress);
        if(current<questions.length-1)setCurrent(valueIndex=>valueIndex+1);else setShowReview(true);
        lastError=null;
        break;
      }catch(error){
        lastError=error instanceof Error?error:new Error("Jawaban gagal disimpan.");
        if(attempt<2)await new Promise(resolve=>window.setTimeout(resolve,500*(attempt+1)));
      }
    }
    if(lastError)setMessage(`${lastError.message} Jawaban tetap tersimpan sementara dan akan dicoba kembali saat koneksi pulih.`);
    setBusy(false);
  }

  async function abandon(){
    if(!attemptId)return;
    setBusy(true);
    try{await fetch(`/api/assessment/${attemptId}/abandon`,{method:"POST"});}finally{window.localStorage.removeItem(storageKey);setAttemptId("");setQuestions([]);setAnswers({});setCurrent(0);setShowReview(false);setConfirmSubmit(false);setBusy(false);}
  }

  async function submit(){
    if(!attemptId)return;
    setBusy(true);setMessage("");
    try{
      const response=await fetch(`/api/assessment/${attemptId}/submit`,{method:"POST"});
      const data=await response.json();
      if(!response.ok)throw new Error(data?.error?.message??"Assessment gagal disubmit.");
      window.localStorage.removeItem(storageKey);
      router.push(`/result/${attemptId}`);
    }catch(error){setMessage(error instanceof Error?error.message:"Assessment gagal disubmit.");setConfirmSubmit(false);}
    finally{setBusy(false);}
  }

  if(resuming)return <LoadingScreen label="Memulihkan assessment Anda..." />;

  if(!attemptId)return <Intro type={type} busy={busy} message={message} onStart={start} />;
  if(!question)return null;

  const firstUnanswered=questions.findIndex(q=>answers[q.id]===undefined);

  return <main className="min-h-full bg-slate-50 text-slate-950" aria-label="Assessment runtime">
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><div className="flex items-center gap-2 text-[11px] font-bold text-slate-400"><Link href="/app" className="hover:text-slate-700">Workspace</Link><span>›</span><span className="text-indigo-600">Assessment</span></div><p className="mt-1 text-xs font-bold uppercase tracking-wide text-indigo-600">ReadyScore {isRiasec?"RIASEC":isDisc?"DISC":isEq?"EQ":isCognitive?"Cognitive":isPremium?"Premium":"Free"}</p><p className="mt-1 truncate text-sm font-semibold text-slate-900">Actual Assessment</p></div>
          <div className="flex items-center gap-3 text-xs font-semibold text-slate-500"><span className={timer&&timer.remainingSeconds<=60?"font-black text-rose-600":""}><Clock3 className="mr-1 inline h-4 w-4" /> {timer?formatRemaining(timer.remainingSeconds):"—"}</span><span>{current+1} / {questions.length}</span></div>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-label="Progress assessment" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percentage}><div className="h-full rounded-full bg-indigo-600 transition-all" style={{width:`${progress.percentage}%`}}/></div>
        <div className="mt-2 flex justify-between text-xs text-slate-500" aria-live="polite"><span>{answeredCount} terjawab</span><span>{answeredPercent}% selesai</span></div><p className="mt-2 text-[11px] text-slate-400">Jawaban tersimpan saat Anda memilih respons. ← → untuk berpindah soal.</p>
      </div>
    </header>

    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      {isPremium && <div className="mb-5 flex items-center gap-2 rounded-2xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-xs font-medium text-indigo-800"><ShieldCheck className="h-4 w-4 shrink-0" /> Assessment Premium menggunakan cakupan yang lebih lengkap dari Question Bank yang sama.</div>}

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <section className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-9" aria-labelledby="assessment-question-title">
          <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
            {isRiasec ? `${question.domain} · ${RIASEC_LABELS[question.domain]??question.domain}` : isDisc ? `${question.domain} · ${DISC_LABELS[question.domain]??question.domain}` : isEq ? `${EQ_LABELS[question.domain]??question.domain}` : isCognitive ? `${COGNITIVE_LABELS[question.domain]??question.domain}` : question.domain}
          </span><span className="text-xs font-semibold text-slate-400">{question.code}</span></div>
          <h1 id="assessment-question-title" className="mt-7 text-2xl font-bold leading-tight tracking-tight sm:text-3xl">{question.text}</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {isRiasec
              ? "Pilih jawaban yang paling menggambarkan ketertarikan Anda saat ini. Tidak ada jawaban benar atau salah."
              : isDisc
                ? "Pilih jawaban yang paling menggambarkan kecenderungan perilaku Anda. Tidak ada jawaban benar atau salah."
                : isEq
                  ? "Pilih satu respons yang paling tepat untuk situasi yang diberikan. Tidak ada jawaban yang perlu Anda hitung sendiri."
                  : isSingleChoice4 && isCognitive
                    ? "Pilih satu jawaban yang paling tepat berdasarkan informasi pada soal. Setiap soal memiliki satu jawaban yang benar."
                    : isCognitive
                      ? "Pilih jawaban yang paling menggambarkan kondisi Anda saat ini."
                    : "Pilih jawaban yang paling menggambarkan kondisi Anda saat ini."}
          </p>
          <div className="mt-8 grid gap-3">{(isSingleChoice4
            ? (question.options ?? []).map((label,index)=>[index+1,label] as [number,string])
            : LIKERT_OPTIONS.map(([value,label])=>[value,label] as [number,string])
          ).map(([value,label])=><button key={value} disabled={busy} onClick={()=>answer(value)} aria-pressed={selected===value} className={`rs-a11y-target group flex items-center gap-4 rounded-2xl border p-4 text-left transition ${selected===value?"border-indigo-600 bg-indigo-50 text-indigo-800":"border-slate-200 bg-white text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40"}`}><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${selected===value?"bg-indigo-600 text-white":"bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700"}`}>{value}</span><span className="text-sm font-semibold">{label}</span>{selected===value&&<Check className="ml-auto h-5 w-5 text-indigo-600"/>}</button>)}</div>
          {message&&<p className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-100 pt-5"><button onClick={()=>setCurrent(Math.max(0,current-1))} disabled={busy||current===0} className="rs-a11y-target inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-35"><ChevronLeft className="h-4 w-4"/>Sebelumnya</button>{current<questions.length-1?<button onClick={()=>setCurrent(Math.min(questions.length-1,current+1))} disabled={busy||selected===null} className="rs-a11y-target inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-35">Berikutnya<ChevronRight className="h-4 w-4"/></button>:<button onClick={()=>setConfirmSubmit(true)} disabled={busy||answeredCount!==questions.length} className="rs-a11y-target inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-35">Selesai & Lihat Hasil<ArrowRight className="h-4 w-4"/></button>}</div>
        </section>

        <aside className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:h-fit">
          <div className="flex items-center justify-between"><h2 className="font-bold">Navigasi Soal</h2><CircleHelp className="h-4 w-4 text-slate-400"/></div>
          <p className="mt-1 text-xs text-slate-500">Pilih nomor untuk kembali mengubah jawaban.</p>
          <div className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-10 lg:grid-cols-5">{questions.map((q,index)=>{const answered=answers[q.id]!==undefined;return <button key={q.id} onClick={()=>setCurrent(index)} disabled={busy} aria-label={`Soal ${index+1}`} aria-current={index===current ? "step" : undefined} className={`rs-a11y-target h-9 rounded-lg text-xs font-bold ${index===current?"bg-slate-950 text-white":"border border-slate-200 bg-white text-slate-600"} ${answered&&index!==current?"ring-2 ring-indigo-100":""}`}>{index+1}</button>})}</div>
          <div className="mt-5 space-y-2 text-xs text-slate-500"><div className="flex justify-between"><span>Terjawab</span><strong className="text-slate-800">{answeredCount}</strong></div><div className="flex justify-between"><span>Belum dijawab</span><strong className="text-slate-800">{questions.length-answeredCount}</strong></div></div>
          {firstUnanswered>=0&&<button onClick={()=>setCurrent(firstUnanswered)} className="rs-touch-target mt-5 w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2.5 text-xs font-bold text-indigo-700">Ke soal belum dijawab</button>}
          <button onClick={()=>setConfirmSubmit(true)} disabled={busy||answeredCount!==questions.length} className="rs-touch-target mt-3 w-full rounded-xl bg-slate-950 px-3 py-2.5 text-xs font-bold text-white disabled:opacity-35">Review & Selesai</button>
          <button onClick={abandon} disabled={busy} className="rs-touch-target mt-3 w-full px-3 py-2 text-xs font-semibold text-slate-400 hover:text-slate-600">Keluar dari assessment</button>
        </aside>
      </div>
    </div>

    {showReview&&<div className="fixed inset-0 z-40 bg-slate-950/40 p-4 backdrop-blur-sm" role="presentation"><div className="mx-auto mt-10 max-w-lg rounded-3xl bg-white p-7 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="review-dialog-title"><h2 id="review-dialog-title" className="text-2xl font-bold">Review jawaban</h2><p className="mt-2 text-sm leading-6 text-slate-600">Anda sudah menjawab {answeredCount} dari {questions.length} soal. Anda masih bisa kembali ke soal mana pun.</p><button onClick={()=>{setShowReview(false);setCurrent(Math.max(0,firstUnanswered));}} className="rs-touch-target mt-6 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Kembali ke Assessment</button></div></div>}

    {confirmSubmit&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4" role="presentation"><div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="submit-dialog-title"><h2 id="submit-dialog-title" className="text-2xl font-bold">Selesaikan assessment?</h2><p className="mt-3 text-sm leading-6 text-slate-600">Setelah dikirim, jawaban akan dihitung dan hasil assessment dibuat sebagai snapshot. Anda tidak dapat mengubah jawaban pada attempt ini.</p><div className="mt-6 grid gap-2 sm:grid-cols-2"><button onClick={()=>setConfirmSubmit(false)} disabled={busy} className="rs-a11y-target rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold">Kembali</button><button onClick={submit} disabled={busy||answeredCount!==questions.length} className="rs-a11y-target rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">{busy?"Menghitung...":"Kirim & Lihat Hasil"}</button></div></div></div>}
  </main>;
}

function Intro({type,busy,message,onStart}:{type:AssessmentType;busy:boolean;message:string;onStart:()=>void}){
  const premium=type==="premium";
  const riasec=type==="riasec";
  const disc=type==="disc";
  const eq=type==="eq";
  const label=riasec?"RIASEC":disc?"DISC":eq?"EQ":type==="cognitive"?"Cognitive":premium?"Premium":"Free";
  const title=riasec?"Temukan profil minat Anda.":disc?"Kenali kecenderungan perilaku Anda.":eq?"Eksplorasi profil EQ Anda.":type==="cognitive"?"Uji kemampuan penalaran Anda melalui soal objektif.":premium?"Assessment Premium yang lebih lengkap.":"Mulai dengan assessment gratis.";
  const description=riasec?"Ukur pola minat Anda melalui enam dimensi RIASEC dengan 60 pertanyaan terstruktur.":disc?"Eksplorasi pola perilaku melalui empat dimensi DISC: Dominance, Influence, Steadiness, dan Conscientiousness.":eq?"Eksplorasi empat dimensi EQ: Emotion Awareness, Emotion Regulation, Empathy / Social Awareness, dan Relationship / Social Response.":type==="cognitive"?"Uji penalaran verbal, numerik, logis, dan abstrak melalui 40 soal objektif. Durasi maksimal 20 menit. Hasilnya adalah Cognitive Reasoning Score, bukan skor IQ universal.":premium?"Ukur kesiapan Anda dengan cakupan yang lebih luas menggunakan Question Bank dan scoring model ReadyScore yang sama.":"Dapatkan gambaran awal kesiapan Anda melalui assessment singkat yang terstruktur.";
  const count=riasec?"60":disc?"80":eq?"50":type==="cognitive"?"40":premium?"100":"20";
  const duration=riasec||disc||eq||type==="cognitive"?"20 menit":premium?"15–20 menit":"5 menit";
  const purpose=riasec?"Memahami pola minat dan area ketertarikan Anda.":disc?"Memahami kecenderungan gaya perilaku Anda.":eq?"Memahami pola respons emosional dan sosial Anda.":type==="cognitive"?"Memahami pola kemampuan penalaran Anda pada beberapa domain kognitif.":premium?"Mendapatkan gambaran kesiapan yang lebih lengkap.":"Mendapatkan gambaran awal kesiapan Anda.";
  const button=riasec?"Mulai Assessment RIASEC":disc?"Mulai Assessment DISC":eq?"Mulai Assessment EQ":type==="cognitive"?"Mulai Assessment Cognitive":premium?"Mulai Assessment Premium":"Mulai Assessment Gratis";
  return <div className="min-h-screen bg-slate-50 px-4 py-10 text-slate-950"><div className="mx-auto max-w-3xl"><div className="mb-4 flex items-center gap-2 text-xs font-bold text-slate-400"><span>Assessment</span><span>›</span><span className="text-indigo-600">Pre-Test</span></div><div className="rounded-[32px] border border-slate-200 bg-white p-7 shadow-sm sm:p-10"><div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700"><ShieldCheck className="h-4 w-4"/>ReadyScore {label}</div><p className="mt-6 text-xs font-black uppercase tracking-[0.16em] text-slate-400">Pre-Test</p><h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1><p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">{description}</p><div className="mt-8 grid gap-3 sm:grid-cols-3">{[[count,"soal"],[duration,"durasi"],[purpose,"tujuan"]].map(([value,item])=><div key={item} className="rounded-2xl bg-slate-50 p-4"><p className="text-sm font-bold leading-5">{value}</p><p className="mt-1 text-xs text-slate-500">{item}</p></div>)}</div><div className="mt-8 rounded-2xl border border-slate-200 p-5"><p className="text-sm font-bold">Sebelum mulai</p><ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600"><li>• Pastikan Anda memiliki waktu yang cukup dan koneksi internet yang stabil.</li><li>• Ikuti instruksi dan jawab berdasarkan kondisi atau respons Anda sesuai jenis assessment.</li><li>• Anda dapat kembali ke soal sebelumnya selama assessment berlangsung.</li><li>• Jawaban disimpan selama proses berlangsung agar assessment dapat dilanjutkan.</li><li>• Setelah submit, hasil dibuat sebagai snapshot dan Anda diarahkan ke halaman hasil.</li></ul></div>{type==="cognitive"&&<p className="mt-4 rounded-2xl bg-slate-50 p-4 text-xs leading-5 text-slate-600">Catatan: assessment Cognitive tidak menggunakan atau menghasilkan skor IQ universal.</p>}<button onClick={onStart} disabled={busy} className="rs-a11y-target mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white disabled:opacity-40">{busy?"Menyiapkan...":button}<ArrowRight className="h-4 w-4"/></button>{message&&<p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">{message}</p>}</div></div></div>;
}

function formatRemaining(seconds:number){const safe=Math.max(0,seconds);const m=Math.floor(safe/60);const s=safe%60;return `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;}

function LoadingScreen({label}:{label:string}){return <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6"><div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600"/><p className="mt-4 text-sm font-semibold text-slate-600">{label}</p></div></div>;}
