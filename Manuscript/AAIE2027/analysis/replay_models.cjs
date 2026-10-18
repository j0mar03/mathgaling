'use strict';
// Pure offline extraction/replay. No application imports, DB engine or network.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const ROOT = path.resolve(__dirname, '../../..');
const REF = '0c407d0';
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const commit = execFileSync('git', ['rev-parse', REF], {cwd: ROOT, encoding: 'utf8'}).trim();
const bktRaw = execFileSync('git', ['show', `${commit}:client/server/utils/bktAlgorithm.js`], {cwd: ROOT});
const quizRaw = execFileSync('git', ['show', `${commit}:client/src/components/student/QuizView.js`], {cwd: ROOT});
assert.equal(sha(bktRaw), 'acb3aeb9e4f557d55badc81da7f06a721049fbf30de445d38083628ccb8edd0e');
assert.equal(sha(quizRaw), '4305b1a73e81e55b06aa69f9b4c3a223f49b833d2ad0fda806983a6451bfe428');
const bkt = bktRaw.toString().replace(/\r\n/g, '\n');
const quiz = quizRaw.toString().replace(/\r\n/g, '\n');
function extract(source, name) {
  const declaration = new RegExp(`^([\\t ]*)const ${name} = `, 'm').exec(source);
  assert(declaration, `Missing source function ${name}`);
  const tail = source.slice(declaration.index);
  const end = new RegExp(`^${declaration[1]}};[\\t ]*$`, 'm').exec(tail);
  assert(end, `Missing source function terminator ${name}`);
  return tail.slice(0, end.index + end[0].length);
}
const names = ['getBktParams', 'updateKnowledgeProbability', 'getKnowledgeState', 'updateKnowledgeState', 'applyFuzzyAdjustments'];
const functions = names.map(n => extract(bkt, n)).join('\n');
const validateFunction = extract(quiz, 'validateAnswer');
const defaults = {pL0: .3, pT: .09, pS: .1, pG: .2};

function memoryRuntime(items, kcs) {
  const clock = {now: 0};
  const rows = [];
  const states = new Map();
  const gt = Symbol('gt'), inside = Symbol('in');
  const itemMap = new Map(items.map(x => [Number(x.id), x]));
  const kcMap = new Map(kcs.map(x => [Number(x.id), x]));
  const queries = [];
  const db = {
    Sequelize: {Op: {gt, in: inside}, literal: query => {
      const m = /knowledge_component_id = (\d+)$/.exec(query);
      assert(m, 'Unexpected literal: only an in-memory KC lookup is supported');
      return {kc: Number(m[1])};
    }},
    ContentItem: {findByPk: async id => itemMap.get(Number(id))},
    KnowledgeComponent: {findByPk: async id => kcMap.get(Number(id))},
    KnowledgeState: {
      findOne: async ({where}) => states.get(`${where.student_id}:${where.knowledge_component_id}`),
      create: async attrs => {
        const state = {...attrs};
        state.update = async values => {Object.assign(state, values); return state;};
        states.set(`${attrs.student_id}:${attrs.knowledge_component_id}`, state);
        return state;
      }
    },
    Response: {findAll: async ({where, limit}) => {
      let found = rows.filter(r => r.student_id === where.student_id && r.createdAt > where.createdAt[gt]);
      if (where.content_item_id) {
        const kc = where.content_item_id[inside][0].kc;
        found = found.filter(r => itemMap.get(r.content_item_id).knowledge_component_id === kc);
      }
      found = found.slice().sort((a, b) => b.createdAt - a.createdAt || b.order - a.order);
      if (limit !== undefined) found = found.slice(0, limit);
      queries.push({limit: limit ?? null, count: found.length});
      return found;
    }}
  };
  class ReplayDate extends Date {
    constructor(...args) {super(...(args.length ? args : [clock.now]));}
    static now() {return clock.now;}
  }
  const sandbox = vm.createContext({db, Op: db.Sequelize.Op, Date: ReplayDate,
    console: {log() {}, error() {}, warn() {}}});
  vm.runInContext(`const DEFAULT_PARAMS=${JSON.stringify(defaults)};\n${functions}\n${validateFunction}`, sandbox);
  const api = vm.runInContext(`({${names.join(',')}, validateAnswer})`, sandbox);
  return {api, clock, rows, states, queries};
}

function paramsFor(kc) {return {...defaults, ...(kc.metadata?.bktParams || {})};}
function prediction(state, p) {return state * (1 - p.pS) + (1 - state) * p.pG;}
async function replay(input) {
  const rt = memoryRuntime(input.items, input.kcs);
  const itemMap = new Map(input.items.map(x => [x.id, x]));
  const kcMap = new Map(input.kcs.map(x => [x.id, x]));
  const base = new Map(), seen = new Map(), result = [];
  let primary = 0, derivedPositive = 0, derivedNegative = 0;
  let maxGoodSessions = 0, zeroStateFallbacks = 0;
  const dates = input.events.map(e => [e.ts, e.order]);
  for (let i = 1; i < dates.length; i++) {
    assert(dates[i][0] > dates[i-1][0] || dates[i][0] === dates[i-1][0] && dates[i][1] >= dates[i-1][1]);
  }
  for (const e of input.events) {
    rt.clock.now = e.ts;
    const item = itemMap.get(e.item), kc = kcMap.get(item.knowledge_component_id);
    const p = paramsFor(kc), key = `${e.account}:${kc.id}`;
    let state, pb, ph, previous;
    if (e.primary) {
      state = await rt.api.getKnowledgeState(e.account, kc.id);
      previous = seen.get(key) || 0;
      const oldBase = base.has(key) ? base.get(key) : p.pL0;
      // Neither prediction reads the current answer, time or interaction fields.
      pb = prediction(oldBase, p);
      ph = prediction(state.p_mastery, p);
      assert(Number.isFinite(pb) && Number.isFinite(ph));
      assert(pb >= 0 && pb <= 1 && ph >= 0 && ph <= 1);
    }
    // Original controller inserted the current response before updating mastery.
    // Context retains original stored truthiness, including excluded practices.
    rt.rows.push({student_id: e.account, content_item_id: e.item,
      createdAt: e.ts, correct: e.storedCorrect, order: e.order});
    if (!e.primary) continue;
    const y = rt.api.validateAnswer(e.answer, item.correct_answer) ? 1 : 0;
    if (input.assertPrimaryLabelAgreement) assert.equal(y, e.storedCorrect ? 1 : 0);
    primary++; if (y) derivedPositive++; else derivedNegative++;
    if (previous > 0) result.push({account: e.account, y, bkt: pb, hybrid: ph});
    const oldBase = base.has(key) ? base.get(key) : p.pL0;
    base.set(key, rt.api.updateKnowledgeProbability(p, oldBase || .3, Boolean(y)));
    if (state.p_mastery === 0) zeroStateFallbacks++;
    const interaction = JSON.parse(JSON.stringify(e.interaction));
    await rt.api.updateKnowledgeState(e.account, e.item, Boolean(y), e.time, interaction);
    maxGoodSessions = Math.max(maxGoodSessions, interaction.recentPerformance?.sessionsWithGoodPerformance || 0);
    assert(state.p_mastery >= 0 && state.p_mastery <= 1);
    seen.set(key, previous + 1);
  }
  return {predictions: result, diagnostics: {primary, derivedPositive, derivedNegative,
    excludedContextOnly: input.events.length - primary, sequences: seen.size,
    maxGoodSessions, zeroStateFallbacks}};
}

function near(actual, expected) {assert(Math.abs(actual - expected) < 1e-12, `${actual} != ${expected}`);}
async function selfTests() {
  const items = [{id: 1, knowledge_component_id: 1, difficulty: 3, correct_answer: 'A'},
    {id: 2, knowledge_component_id: 2, difficulty: 3, correct_answer: 'A'}];
  const kcs = [{id: 1, metadata: {bktParams: defaults}}, {id: 2, metadata: {bktParams: defaults}}];
  const rt = memoryRuntime(items, kcs), f = rt.api.applyFuzzyAdjustments;
  near(rt.api.updateKnowledgeProbability(defaults, .3, true), .6892682926829268);
  near(rt.api.updateKnowledgeProbability(defaults, .3, false), .13627118644067797);
  near(prediction(.3, defaults), .41);
  near(f(.6, true, 5, 3, {}), .65);
  near(f(.6, true, 15, 3, {}), .625);
  near(f(.6, true, 70, 3, {}), .59);
  near(f(.6, false, 5, 3, {}), .55);
  near(f(.6, false, 70, 3, {}), .585);
  near(f(.6, false, 30, 3, {}), .57);
  near(f(.6, true, 15, 3, {hintRequests: 2, attempts: 3}), .585);
  near(f(.6, true, 15, 3, {recentPerformance: {correctRate: .4}}), .595);
  near(f(.78, true, 5, 3, {}), .79);
  near(f(.78, true, 5, 3, {recentPerformance: {correctRate: .8}}), .83);
  near(f(.99, true, 5, 3, {}), 1);
  near(f(.01, false, 5, 3, {}), 0);
  const now = 10_000_000;
  rt.clock.now = now;
  rt.rows.push({student_id: 1, content_item_id: 1, createdAt: now-80*60*1000, correct: true, order: 1},
    {student_id: 1, content_item_id: 1, createdAt: now-40*60*1000, correct: true, order: 2},
    {student_id: 1, content_item_id: 1, createdAt: now, correct: true, order: 3});
  const interaction = {attempts: 1, hintRequests: 0};
  const out = await rt.api.updateKnowledgeState(1, 1, true, 30, interaction);
  assert.equal(interaction.recentPerformance.totalResponses, 1);
  assert.equal(interaction.recentPerformance.consecutiveCorrect, 1);
  // Preserve the descending-order subtraction in the source: no session split.
  assert.equal(interaction.recentPerformance.sessionsWithGoodPerformance, 1);
  near(out.newMastery, rt.api.updateKnowledgeProbability(defaults, .3, true));
  const rt2 = memoryRuntime(items, kcs); rt2.clock.now = now;
  // Exact ten-minute boundary excluded; different KCs/practice-like rows included.
  rt2.rows.push({student_id: 1, content_item_id: 1, createdAt: now-600000, correct: false, order: 0});
  for (let i = 0; i < 14; i++) rt2.rows.push({student_id: 1, content_item_id: i%2+1,
    createdAt: now-(13-i)*1000, correct: i%2===0, order: i+1});
  const context = {};
  await rt2.api.updateKnowledgeState(1, 2, false, 30, context);
  assert.equal(context.recentPerformance.totalResponses, 10);
  assert.equal(context.recentPerformance.correctResponses, 5);
  assert.equal(context.recentPerformance.consecutiveCorrect, 0);
  const events = [0,1,2,3].map(i => ({account: 1, item: 1, order: i, ts: now+i*1000,
    primary: true, storedCorrect: i!==2, answer: i!==2 ? 'A':'B', time: 10+i*10,
    interaction: {attempts: 1, hintRequests: 0}}));
  const fixture = {items, kcs, events};
  const all = await replay(fixture);
  const prefix = await replay({...fixture, events: events.slice(0,3)});
  assert.deepEqual(all.predictions.slice(0,2), prefix.predictions);
  const changed = events.map(e=>({...e, interaction:{...e.interaction}}));
  changed[1].answer = 'B'; changed[1].storedCorrect = false; changed[1].time = 300;
  changed[1].interaction.hintRequests = 9;
  const altered = await replay({...fixture, events: changed});
  near(all.predictions[0].bkt, altered.predictions[0].bkt);
  near(all.predictions[0].hybrid, altered.predictions[0].hybrid);
  assert.equal(all.predictions.length, 3);
  return {passed: true, scope: ['Bayesian closed-form updates', 'time branches',
    'hint/attempt/recent penalties', 'bounds and mastery gate', 'actual wrapper with inert memory collections',
    'descending-session behavior preserved', 'strict time window and ten-record limit',
    'cross-KC context', 'current response present before update', 'future-prefix invariance',
    'current answer/time/hints cannot alter their own prediction'],
    limitation: 'Tests use isolated synthetic fixtures and inert collections; no real database or deployment is validated.'};
}

(async () => {
  const checks = await selfTests();
  const provenance = {commit, sourceSha256: sha(bktRaw), validatorSha256: sha(quizRaw),
    extractedFunctionSha256: sha(functions), node: process.version};
  if (process.argv.includes('--self-test')) {
    process.stdout.write(JSON.stringify({checks, provenance}));
    return;
  }
  const input = JSON.parse(fs.readFileSync(0, 'utf8'));
  const result = await replay(input);
  process.stdout.write(JSON.stringify({...result, checks, provenance}));
})().catch(error => {process.stderr.write(`Offline replay failed: ${error.message}\n`); process.exit(1);});
