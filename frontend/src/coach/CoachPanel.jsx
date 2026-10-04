import { useMemo, useState } from "react";
import { PHASES, answersMatch, isoDate, lessonFor, weekPlan } from "./plan.js";
import {
  applyAdjust, applyComplete, archiveText, dueWeaknesses, loadCoach, progressRows, quizOf, recordResult, saveCoach, submitQuiz, totals, weakLabel, weekStatus,
} from "./progress.js";

const VIEWS = [
  ["today", "今天"],
  ["road", "路線"],
  ["week", "週表"],
  ["progress", "進度"],
  ["exam", "考核"],
  ["weak", "弱點"],
  ["archive", "存檔"],
];

const FORM_FIELDS = [
  ["jaMin", "日文分鐘"],
  ["enMin", "英文分鐘"],
  ["kana", "新記住假名"],
  ["jaVocab", "新日文單字"],
  ["jaGrammar", "新文法點"],
  ["kanji", "新漢字"],
  ["enVocab", "新英文單字"],
  ["enGrammar", "新英文文法"],
  ["jaListen", "日文聽力分鐘"],
  ["jaRead", "日文閱讀分鐘"],
  ["enRead", "英文閱讀分鐘"],
  ["enListen", "英文聽力分鐘"],
  ["enSpeak", "英文口說分鐘"],
  ["enWrite", "英文寫作分鐘"],
];

function percent(rate) {
  return `${Math.round(rate * 100)}%`;
}

export default function CoachPanel() {
  const today = isoDate();
  const [state, setState] = useState(loadCoach);
  const [view, setView] = useState("today");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [checked, setChecked] = useState(false);
  const [needInput, setNeedInput] = useState(false);
  const [form, setForm] = useState(null);
  const [savedNote, setSavedNote] = useState("");
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [adjustReport, setAdjustReport] = useState(null);
  const lesson = useMemo(() => lessonFor(today, state), [today, state]);
  const status = weekStatus(state, today);
  const block = lesson.blocks[Math.min(step, lesson.blocks.length - 1)];
  const freeWrite = block?.kind === "write" && !(block.mustInclude || []).length;
  const matched = checked && answersMatch(block, draft);

  function commit(next) {
    setState(saveCoach(next));
    return next;
  }

  function openToday() {
    setView("today");
    setStep(0);
    setDraft("");
    setChecked(false);
    setNeedInput(false);
    setForm(null);
    setSavedNote("");
  }

  function checkDraft() {
    if (block.requireOutput && !String(draft).trim()) {
      setNeedInput(true);
      setChecked(false);
      return;
    }
    setNeedInput(false);
    setChecked(true);
  }

  function nextStep() {
    if (!checked || !String(draft).trim()) return;
    if (!freeWrite) {
      const recordId = block.reviewId || `lesson-${block.id}-${block.answer || ""}`;
      const tags = {
        "ja-warm": "假名",
        "ja-new": "假名",
        "ja-out": "日文造句",
        "ja-check": "日文助詞",
        "en-warm": "英文單字",
        "en-new": "英文文法",
        "en-out": "because 寫作",
        "en-check": "英文單字",
      };
      commit(recordResult(state, { ...block, id: recordId, tag: block.tag || tags[block.id] || block.title }, matched, today));
    }
    if (step >= lesson.blocks.length - 1) {
      setForm({ ...lesson.suggest, note: "" });
      return;
    }
    setStep(step + 1);
    setDraft("");
    setChecked(false);
    setNeedInput(false);
  }

  function saveSession(event) {
    event.preventDefault();
    const next = applyComplete(state, { ...form, date: today });
    commit(next);
    setForm(null);
    setSavedNote("今天的紀錄已寫進進度。下面是目前的狀態存檔。");
    setView("archive");
  }

  function startQuiz(kind) {
    setQuiz(quizOf(kind, today));
    setQuizAnswers({});
    setQuizResult(null);
    setView("exam");
  }

  function gradeQuiz(event) {
    event.preventDefault();
    const graded = submitQuiz(state, quiz, quizAnswers, today);
    commit(graded.state);
    setQuizResult(graded.result);
  }

  function adjust() {
    const adjusted = applyAdjust(state, today);
    commit(adjusted.state);
    setAdjustReport(adjusted.report);
    setView("archive");
  }

  return (
    <section className="panel coach">
      <div className="coach-top">
        <div>
          <h2>學習教練</h2>
          <p className="coach-lead">{lesson.phase.title}</p>
        </div>
        <button type="button" className="btn btn-line" onClick={adjust}>調整</button>
      </div>
      <p className="coach-meta">
        本週 {status.got}/{status.goal} 分鐘
        {status.gap > 0 ? `，到昨天還差 ${status.gap} 分鐘` : "，到昨天的時數已跟上"}
      </p>
      <div className="coach-views">
        {VIEWS.map(([id, label]) => (
          <button key={id} type="button" className={`coach-view ${view === id ? "is-on" : ""}`} onClick={() => (id === "today" ? openToday() : setView(id))}>
            {label}
          </button>
        ))}
      </div>
      <div className="scroll-pane coach-body">
        {view === "today" && (
          form ? (
            <form className="coach-stack" onSubmit={saveSession}>
              <h3>完成今天</h3>
              <p>數字是今天這份課的建議值。多做或少做都改成實際數字。同一天再存一次，會改寫今天，不會累加。</p>
              <div className="coach-form-grid">
                {FORM_FIELDS.map(([key, label]) => (
                  <label key={key}>{label}
                    <input className="field" inputMode="numeric" value={form[key]} onChange={(event) => setForm({ ...form, [key]: event.target.value })} />
                  </label>
                ))}
              </div>
              <label>今天做了什麼
                <textarea className="field coach-area" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} placeholder="例如：あ行默寫了兩次，英文寫了兩句 because" />
              </label>
              <button className="btn btn-accent" type="submit">寫進進度</button>
            </form>
          ) : (
            <div className="coach-stack">
              <p className="coach-kicker">{today} · {lesson.theme}</p>
              <p>日文 {lesson.minutes.ja} 分鐘，英文 {lesson.minutes.en} 分鐘，合計 {lesson.minutes.total} 分鐘。教材：{lesson.materials}</p>
              <p>今天用：{lesson.materialsToday}。若只有 60 分鐘，做標著「核心」的段落，小測改到下一次。</p>
              <p className="coach-kicker">第 {Math.min(step, lesson.blocks.length - 1) + 1} / {lesson.blocks.length} 段 · {block.title} · {block.minutes} 分鐘{block.core ? " · 核心" : " · 加長"}</p>
              <div className="coach-teach">{block.teach}</div>
              {block.choices ? (
                <div className="coach-choices">
                  {block.choices.map((choice) => (
                    <button key={choice} type="button" className={`coach-choice ${draft === choice ? "is-on" : ""}`} onClick={() => { if (!checked) setDraft(choice); }}>
                      {choice}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea className="field coach-area" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={block.prompt} />
              )}
              <p>{block.prompt}</p>
              <div className="coach-actions">
                <button type="button" className="btn btn-primary" onClick={checkDraft}>對答案</button>
                <button type="button" className="btn btn-accent" disabled={!checked} onClick={nextStep}>
                  {step >= lesson.blocks.length - 1 ? "完成" : "下一段"}
                </button>
              </div>
              {needInput && <p className="mag">先寫出你的答案，再往下。</p>}
              {checked && String(draft).trim() && (
                <div className="coach-review">
                  <p className={matched ? "ok-msg" : "mag"}>
                    {freeWrite && matched && "已收下你的句子。對照例句後，改一處再往下。"}
                    {freeWrite && !matched && "句子太短。再補幾個字，然後重新對答案。"}
                    {!freeWrite && matched && "這題對了。"}
                    {!freeWrite && !matched && "這題還不對。看原因，明天會再出現。"}
                  </p>
                  {!freeWrite && !matched && <p>你的答案：{draft}</p>}
                  <p>對照：{block.model}</p>
                  {block.modelReading && <p>讀音：{block.modelReading}</p>}
                  {block.modelZh && <p>中文：{block.modelZh}</p>}
                  {block.why && <p>原因：{block.why}</p>}
                </div>
              )}
            </div>
          )
        )}

        {view === "road" && (
          <div className="coach-stack">
            <p>這份 App 用方案 1。2026 年 12 月不考 N3。起點是假名約一半、文法只有です／ます和は・を・に，每週約 11.5 小時。</p>
            {PHASES.map((phase) => (
              <article key={phase.id} className={`coach-card ${lesson.phase.id === phase.id ? "is-on" : ""}`}>
                <h3>{phase.title}</h3>
                <p>{phase.start} 到 {phase.end}</p>
                <p>{phase.exam}</p>
                <p>平日日文 {phase.split.weekday.ja}／英文 {phase.split.weekday.en} 分鐘。週末日文 {phase.split.weekend.ja}／英文 {phase.split.weekend.en} 分鐘。</p>
                <ul>{phase.criteria.map((line) => <li key={line}>{line}</li>)}</ul>
              </article>
            ))}
          </div>
        )}

        {view === "week" && (
          <div className="coach-stack">
            <p>同一天兩種語言都學。早上先日文新內容，後半段英文。錯題不順延到「有空再看」。</p>
            <div className="coach-table-wrap">
              <table className="coach-table">
                <thead>
                  <tr><th>日</th><th>主題</th><th>日文</th><th>英文</th><th>教材</th></tr>
                </thead>
                <tbody>
                  {weekPlan(today).map((row) => (
                    <tr key={row.key}>
                      <td>{row.day}</td>
                      <td>{row.theme}</td>
                      <td>{row.ja} 分</td>
                      <td>{row.en} 分</td>
                      <td>{row.materials}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {view === "progress" && (
          <div className="coach-stack">
            <p>完成率＝目前累計 ÷ 這個階段的目標。自評「假名認讀約一半」不計入完成率，要等你實際寫進紀錄。</p>
            <div className="coach-table-wrap">
              <table className="coach-table">
                <thead>
                  <tr><th>語言</th><th>項目</th><th>累計</th><th>階段目標</th><th>完成率</th></tr>
                </thead>
                <tbody>
                  {progressRows(state, today).map((row) => (
                    <tr key={row.key}>
                      <td>{row.group}</td>
                      <td>{row.item}</td>
                      <td>{row.have} {row.unit}</td>
                      <td>{row.target}</td>
                      <td>{percent(row.rate)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>兩種</td>
                    <td>本週學習</td>
                    <td>{status.got} 分鐘</td>
                    <td>{status.goal} 分鐘</td>
                    <td>{percent(status.goal ? Math.min(1, status.got / status.goal) : 0)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>累計 {totals(state).totalMin} 分鐘。全週滿檔是 {status.weekGoal} 分鐘；這個階段的第一週如果從週日開始，本週目標會少於滿檔。</p>
          </div>
        )}

        {view === "exam" && (
          <div className="coach-stack">
            <h3>考核門檻</h3>
            <ul>
              <li>週考 8 題，70% 起跳，至少 6 題才算通過。</li>
              <li>月考 12 題。N5 階段至少 8 題（60%）。之後的階段至少 9 題（70%）。</li>
              <li>日文題對應 JLPT 文字、語彙、文法、読解。英文題對應閱讀主旨、單字和寫作段落。</li>
              <li>寫作要有 because，而且達到字數。答錯的題隔天複習，接著是 3、7、14、30 天。</li>
            </ul>
            <div className="coach-actions">
              <button type="button" className="btn btn-primary" onClick={() => startQuiz("week")}>週考</button>
              <button type="button" className="btn btn-line" onClick={() => startQuiz("month")}>月考</button>
            </div>
            {quiz && !quizResult && (
              <form className="coach-stack" onSubmit={gradeQuiz}>
                <h3>{quiz.title} · 要對 {quiz.need}/{quiz.total}</h3>
                {quiz.items.map((item, index) => (
                  <fieldset key={item.id} className="coach-card">
                    <legend>{index + 1}. {item.exam} · {item.skill}</legend>
                    <div className="coach-teach">{item.stem}</div>
                    {item.choices ? (
                      <div className="coach-choices">
                        {item.choices.map((choice) => (
                          <button key={choice} type="button" className={`coach-choice ${quizAnswers[item.id] === choice ? "is-on" : ""}`} onClick={() => setQuizAnswers({ ...quizAnswers, [item.id]: choice })}>
                            {choice}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea className="field coach-area" value={quizAnswers[item.id] || ""} onChange={(event) => setQuizAnswers({ ...quizAnswers, [item.id]: event.target.value })} placeholder={item.prompt} />
                    )}
                  </fieldset>
                ))}
                <button className="btn btn-accent" type="submit">批改</button>
              </form>
            )}
            {quizResult && (
              <div className="coach-stack">
                <h3>{quizResult.passed ? "這次通過" : "這次未過"} · {quizResult.hits}/{quizResult.total}</h3>
                <p>日文 {quizResult.ja.hits}/{quizResult.ja.total}，英文 {quizResult.en.hits}/{quizResult.en.total}。錯題已排進弱點。</p>
                {quizResult.items.map((item) => (
                  <article key={item.id} className="coach-card">
                    <p className={item.correct ? "ok-msg" : "mag"}>{item.correct ? "對" : "錯"} · {item.exam}</p>
                    <div className="coach-teach">{item.stem}</div>
                    {!item.correct && <p>你的答案：{item.given || "（空白）"}</p>}
                    <p>對照：{item.model}</p>
                    {item.modelReading && <p>讀音：{item.modelReading}</p>}
                    {item.modelZh && <p>中文：{item.modelZh}</p>}
                    <p>原因：{item.why}</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "weak" && (
          <div className="coach-stack">
            <p>錯題按 1、3、7、14、30 天回來。到期的題會出現在「今天」的第一段。</p>
            {state.weaknesses.length === 0 && <p>還沒有錯題。週考或月考答錯之後，會列在這裡。</p>}
            {state.weaknesses.map((item) => (
              <article key={item.id} className="coach-card">
                <h3>{weakLabel(item)}</h3>
                <p>{item.exam} · 錯 {item.misses} 次 · 下次 {item.nextReview}{dueWeaknesses(state, today).some((row) => row.id === item.id) ? " · 今天到期" : ""}</p>
                <div className="coach-teach">{item.stem}</div>
                <p>原因：{item.why}</p>
              </article>
            ))}
          </div>
        )}

        {view === "archive" && (
          <div className="coach-stack">
            {savedNote && <p className="ok-msg">{savedNote}</p>}
            {adjustReport && (
              <article className="coach-card is-on">
                <h3>調整</h3>
                <p>{adjustReport.message}</p>
                <p>{adjustReport.remedy}</p>
              </article>
            )}
            <textarea className="field coach-area coach-archive" readOnly value={archiveText(state, today)} />
            <button type="button" className="btn btn-line" onClick={() => navigator.clipboard?.writeText(archiveText(state, today))}>複製存檔</button>
          </div>
        )}
      </div>
    </section>
  );
}
