import { describe, expect, it } from "vitest";
import { UrlResolver } from "../utils/url-resolver";

describe("UrlResolver", () => {
  it("selects the highest-width URL from srcset and resolves it absolutely", () => {
    const result = UrlResolver.parseSrcset("/small.jpg 320w, /large.jpg 1280w");

    expect(result).toBe("http://localhost:3000/large.jpg");
  });

  it("selects the highest-density URL from srcset", () => {
    const result = UrlResolver.parseSrcset(
      "https://example.com/one.jpg 1x, https://example.com/two.jpg 2x",
    );

    expect(result).toBe("https://example.com/two.jpg");
  });

  it("prefers lazy-load data attributes over the visible image URL", () => {
    const img = document.createElement("img");
    img.src = "https://example.com/preview.jpg";
    img.dataset.src = "/full.jpg";

    expect(UrlResolver.resolveBestUrl(img)).toBe(
      "http://localhost:3000/full.jpg",
    );
  });

  it("extracts an inline background image URL", () => {
    const el = document.createElement("div");
    el.style.backgroundImage = 'url("https://example.com/bg.webp")';

    expect(UrlResolver.resolveBestUrl(el)).toBe("https://example.com/bg.webp");
  });

  it("keeps Twitter original-image resolution idempotent", () => {
    const original = "https://pbs.twimg.com/media/abc123?format=jpg&name=small";
    const once = UrlResolver.transformSiteSpecificUrl(original);
    const twice = UrlResolver.transformSiteSpecificUrl(once);

    expect(once).toBe(
      "https://pbs.twimg.com/media/abc123?format=jpg&name=orig",
    );
    expect(twice).toBe(once);
  });
});
