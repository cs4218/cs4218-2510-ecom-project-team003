import { getShortDescription } from "./string";

const DESCRIPTION_OVER_0 = "O".repeat(1);
const DESCRIPTION_UNDER_60 = "U".repeat(59);
const DESCRIPTION_EXACT_60 = "E".repeat(60);
const DESCRIPTION_OVER_60 = "O".repeat(61);

describe('getShortDescription Function', () => {
  it('returns placeholder when input is null', async () => {
    const res = getShortDescription(null);
    expect(res).toEqual('No description');
  });

  it('returns placeholder when input is undefined', async () => {
    const res = getShortDescription(undefined);
    expect(res).toEqual('No description');
  });

  it('returns full description when it is over 0 characters', async () => {
    const res = getShortDescription(DESCRIPTION_OVER_0);
    expect(res).toEqual(DESCRIPTION_OVER_0);
  });

  it('returns full description when it is under 60 characters', async () => {
    const res = getShortDescription(DESCRIPTION_UNDER_60);
    expect(res).toEqual(DESCRIPTION_UNDER_60);
  });

  it('returns full description when it is exactly 60 characters', async () => {
    const res = getShortDescription(DESCRIPTION_EXACT_60);
    expect(res).toEqual(DESCRIPTION_EXACT_60);
  });

  it('returns truncated description and ellipsis when input is over 60 characters', async () => {
    const exp = `${'O'.repeat(60)}...`
    const res = getShortDescription(DESCRIPTION_OVER_60);
    expect(res).toEqual(exp);
  });
});