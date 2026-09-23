const { createRound, expandForm, makeQuestion, candidateFactors, formKey, isFullyFactored, polynomialGcd } = require('./app.js');

// 仕様で重視する「共通因数を先にくくる」代表例。
const examples = [
  { form: { common: 6, factors: [[1, 8]] }, source: { a: 0, b: 6, c: 48 } },
  { form: { common: 3, factors: [[1, 2]] }, source: { a: 0, b: 3, c: 6 } },
  { form: { common: 4, factors: [[1, -3]] }, source: { a: 0, b: 4, c: -12 } },
  { form: { common: 2, factors: [[1, -2], [1, -2]] }, source: { a: 2, b: -8, c: 8 } },
  { form: { common: 1, factors: [[2, 1], [1, 3]] }, source: { a: 2, b: 7, c: 3 } }
];
examples.forEach(({ form, source }) => {
  const q = makeQuestion(form, 'test');
  if (JSON.stringify(q.source) !== JSON.stringify(source) || !isFullyFactored(q)) throw new Error('代表例の完全因数分解が不正');
});

for (let n = 0; n < 500; n++) {
  const round = createRound();
  if (round.length !== 10) throw new Error('10問生成されません');
  round.forEach((q, index) => {
    const actual = expandForm(q);
    if (actual.a !== q.source.a || actual.b !== q.source.b || actual.c !== q.source.c) throw new Error(`第${index + 1}問の展開が不一致`);
    if (!isFullyFactored(q)) throw new Error(`第${index + 1}問が完全因数分解ではありません`);
    if (q.common !== polynomialGcd(q.source)) throw new Error(`第${index + 1}問で最大公約数をくくれていません`);
    const choices = candidateFactors(q);
    if (choices.length !== 4 || new Set(choices.map(formKey)).size !== 4) throw new Error(`第${index + 1}問の選択肢が不正`);
    if (!choices.some(v => formKey(v) === q.answer)) throw new Error(`第${index + 1}問に正解がありません`);
  });
}
console.log('500ラウンド（5,000問）の生成・展開・4択検証に成功しました。');
