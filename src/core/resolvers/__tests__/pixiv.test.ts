import { describe, expect, it } from "vitest";
import { PixivResolver } from "../pixiv";

const resolver = new PixivResolver();

describe("PixivResolver", () => {
  it("matches only pximg.net URLs", () => {
    expect(resolver.matches("https://i.pximg.net/img-master/img/a.jpg")).toBe(
      true,
    );
    expect(resolver.matches("https://example.com/a.jpg")).toBe(false);
  });

  it("resolves master1200 thumbnails to original URLs", () => {
    expect(
      resolver.resolve(
        "https://i.pximg.net/img-master/img/2015/06/12/01/51/39/50849292_p0_master1200.jpg",
      ),
    ).toBe(
      "https://i.pximg.net/img-original/img/2015/06/12/01/51/39/50849292_p0.jpg",
    );
  });

  it("resolves cropped thumbnail paths and strips square suffixes", () => {
    expect(
      resolver.resolve(
        "https://i.pximg.net/c/250x250_80_a2/img-master/img/2022/04/20/23/04/06/17433378_p0_square1200.jpg",
      ),
    ).toBe(
      "https://i.pximg.net/img-original/img/2022/04/20/23/04/06/17433378_p0.jpg",
    );
  });

  it("converts novel covers from jpg to png", () => {
    expect(
      resolver.resolve(
        "https://i.pximg.net/c/240x480_70_a2/img-master/img/2020/01/01/00/00/00/sci12345_abc123_master1200.jpg",
      ),
    ).toBe(
      "https://i.pximg.net/novel-cover-original/img/2020/01/01/00/00/00/sci12345_abc123.png",
    );
  });

  describe("getFallbackUrls", () => {
    it("tries extension variants then master1200 for a guessed jpg original", () => {
      expect(
        resolver.getFallbackUrls(
          "https://i.pximg.net/img-original/img/2015/06/12/01/51/39/50849292_p0.jpg",
        ),
      ).toEqual([
        "https://i.pximg.net/img-original/img/2015/06/12/01/51/39/50849292_p0.png",
        "https://i.pximg.net/img-original/img/2015/06/12/01/51/39/50849292_p0.gif",
        "https://i.pximg.net/img-master/img/2015/06/12/01/51/39/50849292_p0_master1200.jpg",
      ]);
    });

    it("tries jpg before gif for a png original", () => {
      expect(
        resolver.getFallbackUrls(
          "https://i.pximg.net/img-original/img/2015/06/12/01/51/39/50849292_p0.png",
        )[0],
      ).toBe(
        "https://i.pximg.net/img-original/img/2015/06/12/01/51/39/50849292_p0.jpg",
      );
    });

    it("returns no thumbnail fallback for novel covers", () => {
      const fallbacks = resolver.getFallbackUrls(
        "https://i.pximg.net/novel-cover-original/img/2020/01/01/00/00/00/sci12345_abc123.png",
      );
      expect(fallbacks).toHaveLength(2);
      expect(fallbacks.every((u) => u.includes("novel-cover-original"))).toBe(
        true,
      );
    });

    it("returns empty for non-original URLs (thumbnails, other sites)", () => {
      expect(
        resolver.getFallbackUrls(
          "https://i.pximg.net/img-master/img/2015/06/12/01/51/39/50849292_p0_master1200.jpg",
        ),
      ).toEqual([]);
      expect(resolver.getFallbackUrls("https://example.com/a.jpg")).toEqual([]);
    });
  });
});
