import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/data/plans.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } });
const { quote, configFromSearch, configQuery, DEFAULT_CONFIG, formatPrice, toDisplayAmount } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`);

const config = (patch = {}) => ({ ...DEFAULT_CONFIG, term: 1, currency: 'eur', ...patch });

test('monthly plan prices and own-infrastructure credits agree with the revised list', () => {
  for (const [planId, cloud, own] of [['starter', 49, 49], ['go', 499, 399], ['pro', 1499, 1199], ['max', 4499, 3599]]) {
    assert.equal(quote(config({ planId })).monthly, cloud);
    assert.equal(quote(config({ planId, deployment: 'self-hosted' })).monthly, own);
  }
});

test('yearly and three-year discounts affect plan fees but do not discount storage', () => {
  const yearly = quote(config({ planId: 'go', term: 12, storageBlocks: 2 }));
  assert.equal(yearly.planMonthly, 449.10);
  assert.equal(yearly.storageMonthly, 298);
  assert.equal(yearly.monthly, 747.10);
  assert.equal(yearly.invoice, 8965.20);
  const threeYear = quote(config({ planId: 'pro', deployment: 'self-hosted', term: 36, storageBlocks: 1 }));
  assert.equal(threeYear.planMonthly, 1019.15);
  assert.equal(threeYear.monthly, 1168.15);
  assert.equal(threeYear.invoice, 14017.80);
});

test('retired product flags and preview flags cannot add a charge or survive a quote link', () => {
  const c = configFromSearch('?plan=go&term=1&currency=eur&pageroot=1&aurora=1&seats=20&eaglesre=1');
  assert.equal(quote(c).monthly, 499);
  assert.doesNotMatch(configQuery(c), /pageroot|aurora|seats|eaglesre/);
});

test('Starter stays cloud-only and ignores extra storage requests', () => {
  const q = quote(config({ planId: 'starter', deployment: 'self-hosted', storageBlocks: 10 }));
  assert.equal(q.deployment, 'cloud');
  assert.equal(q.storageBlocks, 0);
  assert.equal(q.totalTb, 1);
  assert.equal(q.monthly, 49);
});

test('quote links preserve the selected deployment, billing term, region and storage', () => {
  const c = config({ planId: 'max', deployment: 'self-hosted', dc: 'us', term: 36, currency: 'usd', storageBlocks: 3 });
  assert.deepEqual(configFromSearch(`?${configQuery(c)}`), c);
  assert.equal(formatPrice(499, 'usd'), '$599');
  assert.equal(formatPrice(499, 'eur'), '€499');
});


test('USD invoices annualise the displayed monthly charge and storage blocks use the displayed unit price', () => {
  for (const planId of ['go', 'pro', 'max']) {
    for (const term of [1, 12, 36]) {
      for (const storageBlocks of [0, 1, 3, 99]) {
        const q = quote(config({ planId, term, storageBlocks, currency: 'usd' }));
        const display = amount => toDisplayAmount(amount, 'usd');
        assert.equal(display(q.storageMonthly), storageBlocks * display(149));
        assert.equal(display(q.monthly), display(q.planMonthly) + display(q.storageMonthly));
        assert.equal(display(q.invoice), display(q.monthly) * (term === 1 ? 1 : 12));
      }
    }
  }
});

test('Max demo activation survives quote links for every eligible self-hosted plan', () => {
  for (const planId of ['go', 'pro', 'max']) {
    const c = configFromSearch(`?plan=${planId}&deploy=self-hosted&trial=max&term=1&currency=eur`);
    assert.equal(c.fromTrial, true);
    assert.equal(c.deployment, 'self-hosted');
    assert.equal(c.planId, planId);
    assert.match(configQuery(c), /trial=max/);
    assert.deepEqual(configFromSearch(`?${configQuery(c)}`), c);
    assert.equal(quote(c).monthly, quote({ ...c, fromTrial: false }).monthly);
  }
});

test('Max demo activation defaults to self-hosted and cannot apply to cloud or Starter', () => {
  assert.equal(configFromSearch('?plan=go&trial=max').deployment, 'self-hosted');
  for (const search of ['?plan=starter&deploy=self-hosted&trial=max', '?plan=go&deploy=cloud&trial=max']) {
    const c = configFromSearch(search);
    assert.equal(c.fromTrial, false);
    assert.doesNotMatch(configQuery(c), /trial=max/);
  }
});
