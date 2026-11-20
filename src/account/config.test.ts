import { accountConfig, emailCodeEnabled, isAuthCallback } from "./config";

describe("accountConfig", () => {
  it("is off without both values, so accounts are simply hidden", () => {
    expect(accountConfig({})).toBeNull();
    expect(accountConfig({ VITE_SUPABASE_URL: "https://abc.supabase.co" })).toBeNull();
    expect(accountConfig({ VITE_SUPABASE_URL: "not a url", VITE_SUPABASE_PUBLISHABLE_KEY: "k" })).toBeNull();
  });

  it("works out where supabase-js keeps the session", () => {
    expect(
      accountConfig({
        VITE_SUPABASE_URL: "https://hynbvcxulcklilmeqjtj.supabase.co",
        VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x",
      })
    ).toEqual({
      url: "https://hynbvcxulcklilmeqjtj.supabase.co",
      key: "sb_publishable_x",
      storageKey: "sb-hynbvcxulcklilmeqjtj-auth-token",
    });
  });
});

describe("isAuthCallback", () => {
  it.each([
    ["#access_token=a&refresh_token=b", ""],
    ["#error=access_denied&error_code=otp_expired", ""],
    ["", "?code=abc"],
    ["", "?token_hash=abc&type=email"],
  ])("spots a sign-in link (%s%s)", (hash, search) => {
    expect(isAuthCallback({ hash, search })).toBe(true);
  });

  it("ignores ordinary addresses", () => {
    expect(isAuthCallback({ hash: "", search: "" })).toBe(false);
    expect(isAuthCallback({ hash: "#top", search: "?utm_source=x" })).toBe(false);
  });
});

describe("emailCodeEnabled", () => {
  it("is off unless the flag is exactly \"true\"", () => {
    expect(emailCodeEnabled({})).toBe(false);
    expect(emailCodeEnabled({ VITE_SUPABASE_EMAIL_CODE: "false" })).toBe(false);
    expect(emailCodeEnabled({ VITE_SUPABASE_EMAIL_CODE: "true" })).toBe(true);
  });
});
