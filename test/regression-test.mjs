#!/usr/bin/env node
import { apiGet, apiPost, apiPut, apiDelete, encId, runTest } from './test-utils.mjs';

const DIR = import.meta.dirname;

await runTest('timing', DIR, async (ctx) => {
  // ── Create timing diagram ──
  let s = ctx.step('Create timing diagram');
  let diagramId;
  try {
    const res = await apiPost('/api/timing/diagrams', { name: 'Elevator Timing' });
    diagramId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Create lifeline: Clock ──
  s = ctx.step('Create lifeline (Clock)');
  let clockLlId;
  try {
    const res = await apiPost('/api/timing/lifelines', {
      diagramId, name: 'Clock',
      x1: 5, y1: 30, x2: 700, y2: 150,
    });
    clockLlId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Create lifeline: Data ──
  s = ctx.step('Create lifeline (Data)');
  let dataLlId;
  try {
    const res = await apiPost('/api/timing/lifelines', {
      diagramId, name: 'Data',
      x1: 5, y1: 150, x2: 700, y2: 270,
    });
    dataLlId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Get lifeline view IDs ──
  s = ctx.step('Get lifeline view IDs');
  let clockViewId, dataViewId;
  try {
    const res = await apiGet(`/api/diagrams/${encId(diagramId)}/views`);
    const clockView = res.data.find(v => v.modelId === clockLlId);
    const dataView = res.data.find(v => v.modelId === dataLlId);
    if (!clockView) throw new Error('Clock lifeline view not found');
    if (!dataView) throw new Error('Data lifeline view not found');
    clockViewId = clockView._id;
    dataViewId = dataView._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Create timing states for Clock: High, Low ──
  s = ctx.step('Create timing state (Clock: High)');
  let highId;
  try {
    const res = await apiPost('/api/timing/timing-states', {
      diagramId, name: 'High', tailViewId: clockViewId,
    });
    highId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Create timing state (Clock: Low)');
  let lowId;
  try {
    const res = await apiPost('/api/timing/timing-states', {
      diagramId, name: 'Low', tailViewId: clockViewId,
    });
    lowId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Create timing states for Data: Valid, Invalid ──
  s = ctx.step('Create timing state (Data: Valid)');
  let validId;
  try {
    const res = await apiPost('/api/timing/timing-states', {
      diagramId, name: 'Valid', tailViewId: dataViewId,
    });
    validId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Create timing state (Data: Invalid)');
  let invalidId;
  try {
    const res = await apiPost('/api/timing/timing-states', {
      diagramId, name: 'Invalid', tailViewId: dataViewId,
    });
    invalidId = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Create time segments for Clock: High→Low→High→Low (square wave) ──
  s = ctx.step('Create time segment: Clock High → Low');
  let seg1Id;
  try {
    const res = await apiPost('/api/timing/time-segments', {
      diagramId, sourceId: highId, targetId: lowId,
      x1: 150, y1: 50, x2: 350, y2: 80,
    });
    seg1Id = res.data._id;
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Create time segment: Clock Low → High');
  try {
    await apiPost('/api/timing/time-segments', {
      diagramId, sourceId: lowId, targetId: highId,
      x1: 350, y1: 80, x2: 550, y2: 50,
    });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Create time segment: Clock High → Low (2nd)');
  try {
    await apiPost('/api/timing/time-segments', {
      diagramId, sourceId: highId, targetId: lowId,
      x1: 550, y1: 50, x2: 700, y2: 80,
    });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Create time segments for Data: Invalid→Valid→Invalid ──
  s = ctx.step('Create time segment: Data Invalid → Valid');
  try {
    await apiPost('/api/timing/time-segments', {
      diagramId, sourceId: invalidId, targetId: validId,
      x1: 150, y1: 220, x2: 400, y2: 190,
    });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Create time segment: Data Valid → Invalid');
  try {
    await apiPost('/api/timing/time-segments', {
      diagramId, sourceId: validId, targetId: invalidId,
      x1: 400, y1: 190, x2: 700, y2: 220,
    });
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── List operations ──
  s = ctx.step('List lifelines');
  try {
    const res = await apiGet(`/api/timing/lifelines?diagramId=${encId(diagramId)}`);
    if (res.data.length < 2) throw new Error(`Expected 2 lifelines, got ${res.data.length}`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('List timing states');
  try {
    const res = await apiGet(`/api/timing/timing-states?diagramId=${encId(diagramId)}`);
    if (res.data.length < 4) throw new Error(`Expected 4 timing states, got ${res.data.length}`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('List time segments');
  try {
    const res = await apiGet(`/api/timing/time-segments?diagramId=${encId(diagramId)}`);
    if (res.data.length < 5) throw new Error(`Expected 5 time segments, got ${res.data.length}`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Get individual elements ──
  s = ctx.step('Get lifeline by ID');
  try {
    const res = await apiGet(`/api/timing/lifelines/${encId(clockLlId)}`);
    if (res.data.name !== 'Clock') throw new Error(`Expected name "Clock", got "${res.data.name}"`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Get timing state by ID');
  try {
    const res = await apiGet(`/api/timing/timing-states/${encId(highId)}`);
    if (res.data.name !== 'High') throw new Error(`Expected name "High", got "${res.data.name}"`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Get time segment by ID');
  try {
    const res = await apiGet(`/api/timing/time-segments/${encId(seg1Id)}`);
    if (!res.data._id) throw new Error('Time segment not found');
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Update operations ──
  s = ctx.step('Update lifeline name');
  try {
    const res = await apiPut(`/api/timing/lifelines/${encId(clockLlId)}`, { name: 'System Clock' });
    if (res.data.name !== 'System Clock') throw new Error(`Expected "System Clock", got "${res.data.name}"`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  s = ctx.step('Update timing state name');
  try {
    const res = await apiPut(`/api/timing/timing-states/${encId(highId)}`, { name: 'H' });
    if (res.data.name !== 'H') throw new Error(`Expected "H", got "${res.data.name}"`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }

  // ── Layout (timing diagrams resize frame only, no dagre) ──
  await ctx.layoutDiagram(diagramId);

  // ── Export and visually verify ──
  await ctx.exportDiagram(diagramId, 'Export timing image');

  // ── Cleanup ──
  s = ctx.step('Delete diagram');
  try {
    await apiDelete(`/api/timing/diagrams/${encId(diagramId)}`);
    s.pass();
  } catch (e) { s.fail(e.message); throw e; }
});
