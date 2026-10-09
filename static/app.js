const $ = (s) => document.querySelector(s);
const esc = (t) =>
  String(t ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const S = {
  scenario: "",
  sim: null,
  branch: null,
  decision: null,
  view: "original",
  demo: null,
  retry: null,
};
const EXAMPLES = [
  "What if everyone received £1 million tomorrow?",
  "What if AI replaced most office jobs?",
  "What if humans could live to 200?",
  "What if the internet disappeared for one year?",
  "What if I started a business with £10,000?",
];
const MSGS = [
  "Analysing the scenario…",
  "Exploring possible consequences…",
  "Modelling alternative outcomes…",
  "Building your timeline…",
];
let timer;

function show(id) {
  ["landing", "loading", "error", "results"].forEach(
    (x) => ($("#" + x).hidden = x !== id),
  );
  clearInterval(timer);
  if (id === "loading") {
    let i = 0;
    $("#loadmsg").textContent = MSGS[0];
    timer = setInterval(
      () => ($("#loadmsg").textContent = MSGS[++i % MSGS.length]),
      2200,
    );
  }
  scrollTo(0, 0);
}

async function api(path, body) {
  const ctl = new AbortController(),
    t = setTimeout(() => ctl.abort(), 300000);
  try {
    const r = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Something went wrong.");
    return d;
  } catch (e) {
    throw new Error(
      e.name === "AbortError"
        ? "That took too long. Please try again."
        : e.message === "Failed to fetch"
          ? "Can't reach the server. Is it running?"
          : e.message,
    );
  } finally {
    clearTimeout(t);
  }
}

async function run(fn, back = "landing") {
  S.retry = () => run(fn, back);
  show("loading");
  try {
    await fn();
    show("results");
    render();
  } catch (e) {
    $("#errmsg").textContent = e.message;
    show("error");
  }
}

function simulate() {
  const text = $("#scenario").value.trim();
  if (text.length < 10) {
    $("#scenario").focus();
    $("#scenario").placeholder =
      "Please describe a scenario (at least 10 characters)…";
    return;
  }
  run(async () => {
    S.scenario = text;
    S.demo = null;
    S.branch = null;
    S.decision = null;
    S.view = "original";
    S.sim = await api("/api/simulate", { scenario: text });
  });
}

function pick(d) {
  if (S.demo) {
    if (d.id !== S.demo.demo_branch_id) {
      alert(
        "Demo mode only includes the 'Release it gradually' branch. Try option " +
          S.demo.demo_branch_id +
          ".",
      );
      return;
    }
    S.decision = d;
    S.branch = S.demo.branch;
    S.view = "branch";
    render();
    scrollTo(0, 0);
    return;
  }
  run(async () => {
    const s = S.sim;
    S.branch = await api("/api/branch", {
      scenario: S.scenario,
      decision: d,
      context: {
        title: s.scenario_title,
        summary: s.summary,
        assumptions: s.assumptions,
        key_effects: s.key_effects,
        stage_headlines: s.timeline.map((x) => x.headline),
      },
    });
    S.decision = d;
    S.view = "branch";
  });
}

async function loadDemo() {
  show("loading");
  try {
    S.demo = await (await fetch("/api/demo")).json();
    S.scenario = S.demo.scenario;
    S.sim = S.demo.simulation;
    S.branch = null;
    S.view = "original";
    show("results");
    render();
  } catch {
    $("#errmsg").textContent = "Couldn't load the demo.";
    show("error");
  }
}

const list = (a) =>
  `<ul>${(a || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;
const chips = (a) =>
  `<ul class="chips">${(a || []).map((x) => `<li>${esc(x)}</li>`).join("")}</ul>`;

function stage(s, i, cls) {
  return `<article class="card ${cls} s${i + 1}" style="--i:${i}">
    <div class="period"><span>${esc(s.period)}</span><span class="u-${esc(s.uncertainty_level)}">● ${esc(s.uncertainty_level)} uncertainty</span></div>
    <div class="icon" aria-hidden="true">${esc(s.icon)}</div><h3>${esc(s.headline)}</h3><p>${esc(s.summary)}</p>${list(s.consequences)}
    <p class="wl"><b>Winners:</b> ${esc((s.winners || []).join(", "))}</p><p class="wl"><b>Losers:</b> ${esc((s.losers || []).join(", "))}</p></article>`;
}

function block(d, cls, extra = "") {
  return `<div class="timeline">${d.timeline.map((s, i) => stage(s, i, cls)).join("")}</div>
  <h2>Key consequences</h2>${list(d.key_effects)}${extra}
  <div class="two"><div><h2>Risks</h2>${list(d.risks)}</div><div><h2>Benefits</h2>${list(d.benefits)}</div></div>`;
}

function render() {
  const s = S.sim,
    b = S.branch,
    v = S.view;
  const tab = (id, label, cls = "") =>
    `<button class="tab ${cls}" role="tab" aria-selected="${v === id}" data-view="${id}">${label}</button>`;
  let h = `<div class="tabs" role="tablist">${tab("original", "Original path")}${b ? tab("branch", "Alternative path", "alt") + tab("compare", "Compare") : ""}</div>`;
  const head = `<span class="badge orig">ORIGINAL PATH</span><h2 style="margin-top:8px">${esc(s.scenario_title)}</h2><p class="sum">${esc(s.summary)}</p>
    <h2>Assumptions</h2>${chips(s.assumptions)}<h2>Timeline</h2>`;
  if (v === "original")
    h +=
      head +
      block(
        s,
        "orig-c",
        `<h2>Unexpected effects</h2>${list(s.second_order_effects)}`,
      );
  if (v === "branch")
    h +=
      `<span class="badge alt">ALTERNATIVE PATH</span><h2 style="margin-top:8px">${esc(S.decision.title)}</h2>
    <p class="sum">${esc(b.decision_explanation)}</p><div class="note"><b>How this differs:</b> ${esc(b.how_it_differs)}</div>` +
      block(b, "alt-c");
  if (v === "compare")
    h += `<h2>${esc(s.scenario_title)}</h2><div class="note"><b>${esc(S.decision.title)}:</b> ${esc(b.how_it_differs)}</div>
    <div class="compare"><div><span class="badge orig">ORIGINAL</span>${s.timeline.map((x, i) => stage(x, i, "orig-c")).join("")}</div>
    <div><span class="badge alt">ALTERNATIVE</span>${b.timeline.map((x, i) => stage(x, i, "alt-c")).join("")}</div></div>`;
  h += `<h2>${b ? "Try another decision" : "What happens next? Choose a path"}</h2><div class="decs">${s.decisions
    .map(
      (d) =>
        `<button class="dec ${S.decision && S.decision.id === d.id ? "sel" : ""}" data-id="${esc(d.id)}"><b>OPTION ${esc(d.id)}</b>${esc(d.title)}<br><span>${esc(d.description)}</span></button>`,
    )
    .join("")}</div>
    <div class="row" style="margin-top:32px"><button class="btn primary newsim" style="padding:12px 28px;font-size:16px">New Simulation</button></div>`;
  $("#results").innerHTML = h;
  $("#results")
    .querySelectorAll(".tab")
    .forEach(
      (t) =>
        (t.onclick = () => {
          S.view = t.dataset.view;
          render();
        }),
    );
  $("#results")
    .querySelectorAll(".dec")
    .forEach(
      (el) =>
        (el.onclick = () =>
          pick(s.decisions.find((d) => d.id === el.dataset.id))),
    );
  $("#results .newsim").onclick = reset;
}

function reset() {
  Object.assign(S, {
    sim: null,
    branch: null,
    decision: null,
    demo: null,
    view: "original",
  });
  $("#scenario").value = "";
  show("landing");
  $("#scenario").focus();
}

$("#examples").innerHTML = EXAMPLES.map(
  (e) => `<button class="ex" role="listitem">${esc(e)}</button>`,
).join("");
$("#examples")
  .querySelectorAll(".ex")
  .forEach(
    (b) =>
      (b.onclick = () => {
        $("#scenario").value = b.textContent;
        $("#scenario").focus();
      }),
  );
$("#go").onclick = simulate;
$("#scenario").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) simulate();
});
$("#retry").onclick = () => (S.retry ? S.retry() : show("landing"));
$("#demo").onclick = loadDemo;
document.querySelectorAll(".newsim").forEach((b) => (b.onclick = reset));
