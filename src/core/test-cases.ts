export interface TestCase {
  id: string;
  type: "img" | "background" | "picture" | "shadow-dom" | "svg";
  url: string;
  title: string;
}

export const TEST_CASES: TestCase[] = [
  {
    id: "t1",
    type: "img",
    url: "https://images.unsplash.com/photo-1579353977828-2a4eab540b9a?q=80&w=1000&auto=format&fit=crop",
    title: "High Quality JPEG (Unsplash)",
  },
  {
    id: "t2",
    type: "img",
    url: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    title: "Branding PNG (Google)",
  },
  {
    id: "t3",
    type: "img",
    url: "https://mathiasbynens.be/demo/animated-webp-supported.webp",
    title: "Animated WebP",
  },
  {
    id: "t4",
    type: "svg",
    url: "https://v2.mantine.dev/mantine-logo.svg",
    title: "Vector SVG (Mantine)",
  },
  {
    id: "t5",
    type: "img",
    url: "https://upload.wikimedia.org/wikipedia/commons/2/2c/Rotating_earth_(large).gif",
    title: "Animated GIF (Rotating Earth)",
  },
  {
    id: "t6",
    type: "img",
    url: "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Imaget",
    title: "Dynamic PNG (QR Code)",
  },
  {
    id: "t7",
    type: "background",
    url: "https://picsum.photos/id/29/1000/600",
    title: "CSS Background (JPEG)",
  },
  {
    id: "t8",
    type: "picture",
    url: "https://picsum.photos/id/35/800/800",
    title: "Square Aspect Ratio (1:1)",
  },
  {
    id: "t9",
    type: "shadow-dom",
    url: "https://picsum.photos/id/42/400/800",
    title: "Portrait Aspect Ratio (Vertical)",
  },
  {
    id: "t10",
    type: "img",
    url: "https://www.gstatic.com/webp/gallery/4.sm.webp",
    title: "Static WebP (Google)",
  },
];
