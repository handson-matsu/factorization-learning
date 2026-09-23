/* 因数形を先に作り、展開結果を問題文にする。各選択肢は係数配列として保持する。 */
const $ = (id) => document.getElementById(id);
const slots = [
  ['基本', () => monic(2, 6, false)], ['基本', () => monic(3, 8, false)],
  ['一次式', linear], ['符号を含む', () => monic(2, 7, true)], ['一次式', linear],
  ['ステップアップ', () => monic(4, 10, true)], ['一次式', linear],
  ['発展', () => nonMonic(false)], ['発展', () => nonMonic(false)], ['チャレンジ', () => nonMonic(true)]
];
let questions = [], current = 0, score = 0, answered = false;
const rnd = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (items) => items[rnd(0, items.length - 1)];
const shuffle = (items) => [...items].sort(() => Math.random() - .5);
const sign = (n, first = false) => n < 0 ? ` − ${Math.abs(n)}` : first ? `${n}` : ` + ${n}`;
const term = (coef, power, first = false) => {
  if (coef === 0) return '';
  const abs = Math.abs(coef), variable = power === 2 ? 'x<sup>2</sup>' : power === 1 ? 'x' : '';
  const body = variable && abs === 1 ? variable : `${abs}${variable}`;
  return first ? (coef < 0 ? '−' : '') + body : (coef < 0 ? ' − ' : ' + ') + body;
};
const expression = ({a,b,c}) => {
  const values = [[a,2],[b,1],[c,0]].filter(([coefficient]) => coefficient !== 0);
  return `<span class="math">${values.map(([coefficient, power], index) => term(coefficient, power, index === 0)).join('')}</span>`;
};
const factor = (a,b) => `(${a === 1 ? '' : a === -1 ? '−' : a}x${b === 0 ? '' : sign(b)})`;
const key = (factors) => factors.map(([a,b]) => `${a},${b}`).sort().join('|');
const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a,b] = [b,a % b]; return a; };
const polynomialGcd = ({a,b,c}) => gcd(gcd(a,b),c);
const expand = (factors) => {
  if (factors.length === 1) { const [[a,b]] = factors; return {a:0, b:a, c:b}; }
  const [[a,b],[c,d]] = factors; return {a:a*c, b:a*d+b*c, c:b*d};
};
const expandForm = ({common, factors}) => {
  const expanded = expand(factors);
  return {a: expanded.a * common, b: expanded.b * common, c: expanded.c * common};
};
const formKey = ({common, factors}) => `${common}:${key(factors)}`;
const formatForm = ({common, factors}) => `${common === 1 ? '' : common}${factors.map(([a,b]) => factor(a,b)).join('')}`;
function makeQuestion(form, type) {
  const source = expandForm(form);
  return { source, ...form, answer: formKey(form), type, explanation: explain(form, source) };
}
function monic(low, high, mixed) {
  let p = rnd(low, high), q = rnd(low, high); if (mixed) { if (Math.random() < .55) p *= -1; else q *= -1; } else if (Math.random() < .3) p = -p, q = -q;
  return makeQuestion({common:1, factors:[[1,p],[1,q]]}, 'quadratic');
}
function linear() { const k = rnd(2,6), n = (Math.random()<.48 ? -1 : 1) * rnd(2,8); return makeQuestion({common:k, factors:[[1,n]]}, 'linear'); }
function nonMonic(hard) {
  const pairs = hard ? [[2,3],[2,4],[3,4]] : [[2,1],[3,1],[2,3]]; const [a,c] = pick(pairs); let b = rnd(1, hard?7:5), d = rnd(1,hard?7:5);
  while (gcd(a,b) !== 1) b = rnd(1, hard?7:5);
  while (gcd(c,d) !== 1) d = rnd(1, hard?7:5);
  if (Math.random()<.4) { b = -b; d = -d; } else if (Math.random()<.3) b = -b;
  const common = Math.random() < .45 ? pick([2,3]) : 1;
  return makeQuestion({common, factors:[[a,b],[c,d]]}, 'quadratic');
}
function explain({common, factors}, source) {
  if (source.a === 0) {
    const [[a,b]] = factors;
    return `最大公約数 ${common} を最初にくくると、${common}${factor(a,b)} になります。展開して ${source.b}x ${source.c < 0 ? '−' : '+'} ${Math.abs(source.c)} に戻るか確認しよう。`;
  }
  const [[a,b],[c,d]] = factors;
  const prefix = common > 1 ? `まず全体の最大公約数 ${common} をくくります。残りは ` : '';
  if (source.a === 1) return `${prefix}${b} と ${d} は、足すと ${source.b}、掛けると ${source.c}。だから ${formatForm({common,factors})} を展開すると元の式になります。`;
  return `${prefix}${formatForm({common,factors})} を展開すると、x²の係数は ${common}×${a}×${c}=${source.a}、xの係数は ${common}×(${a}×${d} ${b < 0 ? '−' : '+'} ${Math.abs(b)}×${c})=${source.b} です。`;
}
function candidateFactors(question) {
  if (question.factors.length === 1) {
    const [[a,b]] = question.factors;
    const pool = [
      {common:question.common, factors:question.factors},
      {common:1, factors:[[question.common * a, question.common * b]]}, // 共通因数をくくらない誤答
      {common:question.common, factors:[[a,-b]]}, {common:question.common, factors:[[a,b+1]]},
      {common:Math.max(1,question.common - 1), factors:[[a,b]]}
    ];
    const unique = [];
    for (const choice of pool) if (!unique.some(item => formKey(item) === formKey(choice))) unique.push(choice);
    return shuffle(unique.slice(0,4));
  }
  const [[a,b],[c,d]] = question.factors;
  const choices = [
    {common:question.common, factors:question.factors},
    {common:1, factors:[[question.common*a, question.common*b],[c,d]]}, // 全体の共通因数を残す誤答
    {common:question.common, factors:[[a,-b],[c,d]]}, {common:question.common, factors:[[a,b],[c,-d]]},
    {common:question.common, factors:[[a,d],[c,b]]}, {common:question.common, factors:[[a,b+1],[c,d]]}
  ];
  const distinct = [];
  for (const f of choices) if (!distinct.some(v => formKey(v) === formKey(f))) distinct.push(f);
  const valid = [{common:question.common, factors:question.factors}];
  for (const f of distinct) if (formKey(f) !== question.answer && valid.length < 4) valid.push(f);
  while (valid.length < 4) { const f = {common:question.common, factors:[[a, b + rnd(-4,4) || 2],[c, d + rnd(-4,4) || -2]]}; if (!valid.some(v => formKey(v)===formKey(f))) valid.push(f); }
  return shuffle(valid);
}
function isFullyFactored(question) {
  return question.common === polynomialGcd(question.source)
    && question.common > 0
    && question.factors.every(([a,b]) => gcd(a,b) === 1);
}
function createRound() { return slots.map(([level, generator]) => ({...generator(), level})); }
function showQuestion() {
  answered = false; const q = questions[current];
  $('question-count').textContent = `${String(current + 1).padStart(2,'0')} / 10`;
  $('progress-bar').style.width = `${current * 10}%`; $('live-score').textContent = score;
  $('level-label').textContent = q.level; $('expression').innerHTML = expression(q.source);
  $('feedback').className = 'feedback hidden';
  $('choices').innerHTML = candidateFactors(q).map((form,i) => `<button class="choice" data-answer="${formKey(form)}"><span class="choice-key">${'ABCD'[i]}</span><span class="choice-math math">${formatForm(form)}</span></button>`).join('');
  document.querySelectorAll('.choice').forEach(button => button.addEventListener('click', () => answer(button, q)));
}
function answer(button, q) {
  if (answered) return; answered = true; const correct = button.dataset.answer === q.answer;
  document.querySelectorAll('.choice').forEach(el => { el.disabled=true; if (el.dataset.answer === q.answer) el.classList.add('correct'); });
  if (!correct) button.classList.add('wrong'); else score++;
  $('live-score').textContent = score; const feedback = $('feedback'); feedback.className = `feedback ${correct ? 'correct-feedback' : 'wrong-feedback'}`;
  $('feedback-icon').textContent = correct ? '✓' : '!'; $('feedback-title').textContent = correct ? '正解！ 展開して確かめられました。' : 'おしい！ 正解を展開して確かめよう。'; $('feedback-text').textContent = q.explanation;
  $('next-button').textContent = current === 9 ? '結果を見る →' : '次の問題へ →';
}
function start() { questions=createRound(); current=0; score=0; $('start-screen').classList.add('hidden'); $('result-screen').classList.add('hidden'); $('quiz-screen').classList.remove('hidden'); showQuestion(); }
function next() { if (!answered) return; current++; if (current < 10) showQuestion(); else results(); }
function results() { $('quiz-screen').classList.add('hidden'); $('result-screen').classList.remove('hidden'); $('result-score').textContent=score; const percent=score*10; $('accuracy').textContent=`${percent}%`; $('result-heading').textContent = score >= 9 ? 'すばらしい！' : score >= 6 ? 'よくできました！' : '10問、完走！'; $('result-message').textContent = score >= 9 ? '因数形を展開して確かめる力が身についています。' : '答えを選んだら、一度展開して元の式に戻るか考えてみよう。'; }
if (typeof document !== 'undefined') {
  $('start-button').addEventListener('click', start); $('retry-button').addEventListener('click', start); $('next-button').addEventListener('click', next);
}
// Record one visit per page load without waiting for the response or retrying.
try {
  fetch('https://script.google.com/macros/s/AKfycbxssCIHsD-N97SHxNC_GN0ihYeC0qy-lb-EY0KmSs6Gnztaph1sITMerLVEnNWOGkYc/exec?app=factorization-learning', {
    method: 'GET',
    mode: 'no-cors',
    cache: 'no-store',
    credentials: 'omit',
    keepalive: true,
  }).catch(() => {});
} catch {
  // Access logging must never interrupt the app.
}
// Node のテストからも使用できるように公開する。
if (typeof module !== 'undefined') module.exports = { expand, expandForm, makeQuestion, createRound, candidateFactors, isFullyFactored, polynomialGcd, formKey };
