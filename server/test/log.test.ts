import { describe, expect, it } from 'vitest';

import { describeError } from '../src/log';

describe('describeError', () => {
  it('shows the underlying cause and where it happened', () => {
    const pg = Object.assign(new Error('column "meta_enc" does not exist'), { name: 'PostgresError', code: '42703' });
    const wrapped = new Error('Failed query: select "id" from "entries" where user_id = $1\nparams: abc-123', { cause: pg });
    const out = describeError(wrapped);
    expect(out).toContain('column "meta_enc" does not exist');
    expect(out).toContain('[42703]');
    expect(out).toContain('Failed query: select "id" from "entries"');
    expect(out).toContain('caused by: PostgresError');
    expect(out).toMatch(/at .*log\.test/); // a stack frame
  });

  it('never prints query values or quoted entry data', () => {
    const wrapped = new Error('Failed query: insert into entries (text_enc) values ($1)\nparams: v1.SECRET.CIPHERTEXT');
    expect(describeError(wrapped)).not.toContain('SECRET');

    let syntax: unknown;
    try {
      JSON.parse('{"text": "my private journal sentence" oops');
    } catch (e) {
      syntax = e;
    }
    const out = describeError(syntax);
    expect(out).not.toContain('private');
    expect(out).toContain('SyntaxError');
  });
});
