/* The page's five languages. A language is the page's own words, never a flag:
   the switch lists each language by its endonym. The choice travels in ?lang= and
   is remembered in localStorage; anything unknown falls back to English. */
const LANGS = [
  { code: 'en', tag: 'en', label: 'English', short: 'EN' },
  { code: 'zh-CN', tag: 'zh-CN', label: '简体中文', short: '简' },
  { code: 'zh-TW', tag: 'zh-TW', label: '繁體中文', short: '繁' },
  { code: 'ja', tag: 'ja', label: '日本語', short: '日' },
  { code: 'ko', tag: 'ko', label: '한국어', short: '한' },
];

const T = {
  en: {
    'meta.title': 'Imaget: batch image downloader for Chrome',
    'meta.desc': 'Imaget lists every image a page loads, filters it by size and file type, and saves the set as one ZIP. Free, open source and local to your browser.',
    'meta.ogtitle': 'Imaget: batch image downloader for Chrome',
    'meta.ogdesc': 'Lists every image a page loads, filters it by size and type, and saves the set as one ZIP.',
    'meta.ogalt': 'Imaget: grab every image on the page, in one click',

    'nav.skip': 'Skip to content',
    'nav.main': 'Main',
    'nav.footer': 'Footer',
    'nav.panel': 'Panel',
    'nav.features': 'Features',
    'nav.settings': 'Settings',
    'nav.questions': 'Questions',
    'nav.menu': 'Menu',
    'nav.lang': 'Language',
    'cta.download': 'Add to Chrome',

    'hero.h1': 'Batch image downloader for Chrome',
    'hero.lead': 'Imaget lists every image a page loads — srcset, CSS backgrounds, inline SVG and nested frames — filters it by size and type, then saves the set as one ZIP.',
    'hero.proof': 'Free and open source under GPL-3.0, in 14 languages.',
    'hero.art': "Imaget's side panel over a photo gallery: a grid of images with their formats, a download bar at the foot",

    'w.images': 'Images',
    'w.settings': 'Settings',
    'w.search': 'Search',
    'w.exclude': 'Exclude',
    'w.type': 'Type',
    'w.nottype': 'Not type',
    'w.all': 'All',
    'w.order': 'Order',
    'w.images34': '34 images',
    'w.filters2': '2 filters',
    'w.saved': 'Saved to the-quiet-field.zip',
    'w.dlzip': 'Download ZIP',
    'w.download': 'Download',

    'panel.h2': 'Every image on the page, in one panel',
    'panel.lead': 'The side panel opens beside the page and lists what loaded: tags, srcset, CSS backgrounds, inline SVG and frames.',
    'panel.art': "Imaget's side panel: a list of the page's images with their sizes, beside a full-size preview of the selected file",
    'list.this': 'This page',
    'list.order': 'Order',
    'list.selected': 'Selected',
    'list.thumb': 'Thumb',
    'list.alt': 'A green hillside under low cloud in the western Ghats',

    'works.h2a': 'Four image features.',
    'works.h2b': 'Reads the page, resolves the original, filters and saves.',
    'card1.h': 'Reads images in every frame',
    'card1.p': 'Tags, srcset, CSS backgrounds, inline SVG and nested iframes, Shadow DOM included.',
    'card2.h': 'Resolves original images',
    'card2.p': 'On six sites the panel swaps a thumbnail for the file behind it, at full size.',
    'card3.h': 'Filters images before download',
    'card3.p': 'Width and height, PNG, JPG, WebP or GIF, plus keyword and exclude rules.',
    'card4.h': 'Saves images on hover',
    'card4.p': 'A floating button on any image above 128 px opens a preview, then saves it in place.',
    'mini.img': 'img and picture tags',
    'mini.srcset': 'srcset and CSS',
    'mini.shadow': 'Shadow roots',
    'mini.frames': 'Nested frames',
    'apps.title': 'Original files',
    'apps.sites': '{n} sites',
    'apps.full': 'Full size',
    'apps.fullimg': 'Full image',
    'apps.blob': 'Chat blob',
    'apps.unwrap': 'Unwrapped',
    'apps.connected': 'Connected',
    'fb.keyword': 'Keyword: field',
    'fb.exclude': 'Exclude: icon',
    'fb.count': '<b>34</b> of 67 images',
    'fb.on': '2 on',
    'pause.label': 'Pause the demo',
    'play.label': 'Play the demo',

    'export.h2a': 'Settings for every download.',
    'export.h2b': 'Format, file names, folders and the smallest image.',
    'row.format': 'Format',
    'row.format.p': 'WebP by default, or JPG and PNG for older editors.',
    'row.name': 'File name',
    'row.name.tail': ", or the file's own name.",
    'row.folder': 'Folder',
    'row.folder.p': 'One subfolder per page title, off by default.',
    'row.folder.v': 'On',
    'row.min': 'Smallest image',
    'row.min.p': 'Below this, the panel skips it.',
    'tg.title': 'What it does on its own',
    'tg.on': '{n} of 5 on',
    'tg1.l': 'Convert to WebP on download',
    'tg1.s': 'Quality 0.9, or keep the original',
    'tg2.l': 'Read CSS background images',
    'tg2.s': 'Also inside Shadow roots',
    'tg3.l': 'Show the floating button',
    'tg3.s': 'Images from 128 px up',
    'tg4.l': 'Sort downloads into folders',
    'tg4.s': 'Named after the page title',
    'tg5.l': 'Ask before a batch',
    'tg5.s': 'One confirmation above 50 files',

    'questions.h2': 'Questions',
    'q1.h': 'Which sites give the original image?',
    'q1.p': "Pixiv, X, Weibo, Reddit, Telegram and Discord. Every other site lists its images at the size the page loads.",
    'q2.h': 'Where do the images go?',
    'q2.p': 'To Downloads, or to a subfolder named after the page title when that rule is on.',
    'q3.h': 'Does the panel work where right-click is blocked?',
    'q3.p': "Yes. It lists the page's images without the context menu.",
    'q4.h': 'Do images leave the browser?',
    'q4.p': 'No. Sniffing, conversion and ZIP packing run on your machine; there is no account.',
    'q5.h': 'What does a batch of images cost?',
    'q5.p': 'Nothing. Imaget is open source under GPL-3.0, and the code is on GitHub.',
    'zip.sub': '34 images · 2.4 MB',
    'zip.saved': 'Saved to Downloads',
    'zip.more': '24 more files',

    'close.h2': 'Save the whole page in one folder',
    'close.lead': 'Version 1.3.0 for Chrome, Edge and Brave. Free under GPL-3.0.',
    'footer.lede': 'Image sniffing and batch download for the browser.',
    'footer.product': 'Product',
    'footer.project': 'Project',
    'footer.legal': 'Legal',
    'footer.panel': 'Panel',
    'footer.features': 'Features',
    'footer.settings': 'Settings',
    'footer.github': 'GitHub',
    'footer.releases': 'Releases',
    'footer.questions': 'Questions',
    'footer.privacy': 'Privacy',
    'footer.license': 'License',
    'footer.credits': 'Photographs via Wikimedia Commons',
    'footer.credits.p': 'The gallery images are stand-ins, CC0, via Wikimedia Commons: Over-Betuwe by Cultureel Gelderland; sky, mountains and tree by Pixel.la Free Stock Photos; Newcastle trail by Reinhart Coetsee (CC BY-SA 4.0); Unilorin green space by Abdurrazaq A.F.O (CC BY-SA 4.0); Murshid Thali Paramban (CC BY-SA 4.0); Madurai by Arjuncommons (CC BY-SA 4.0).',
  },

  'zh-CN': {
    'meta.title': 'Imaget：Chrome 批量图片下载扩展',
    'meta.desc': 'Imaget 列出页面加载的每一张图片，按尺寸和文件类型筛选，再把整组图片保存为一个 ZIP。免费、开源，全程在本地浏览器中完成。',
    'meta.ogtitle': 'Imaget：Chrome 批量图片下载扩展',
    'meta.ogdesc': '列出页面加载的每一张图片，按尺寸和类型筛选，再整组保存为一个 ZIP。',
    'meta.ogalt': 'Imaget：一键抓取页面上的每一张图片',

    'nav.skip': '跳到正文',
    'nav.main': '主导航',
    'nav.footer': '页脚',
    'nav.panel': '侧栏',
    'nav.features': '功能',
    'nav.settings': '设置',
    'nav.questions': '常见问题',
    'nav.menu': '菜单',
    'nav.lang': '语言',
    'cta.download': '添加到 Chrome',

    'hero.h1': 'Chrome 批量图片下载器',
    'hero.lead': 'Imaget 列出页面加载的全部图片——srcset、CSS 背景、内联 SVG 和嵌套框架——按尺寸与类型筛选，再把整组保存成一个 ZIP。',
    'hero.proof': '采用 GPL-3.0 开源协议，完全免费，支持 14 种语言。',
    'hero.art': 'Imaget 侧栏叠加在图片库上方：带格式标注的图片网格，底部是一条下载栏',

    'w.images': '图片',
    'w.settings': '设置',
    'w.search': '搜索',
    'w.exclude': '排除',
    'w.type': '类型',
    'w.nottype': '排除类型',
    'w.all': '全部',
    'w.order': '排序',
    'w.images34': '34 张图片',
    'w.filters2': '2 个筛选',
    'w.saved': '已保存至 the-quiet-field.zip',
    'w.dlzip': '下载 ZIP',
    'w.download': '下载',

    'panel.h2': '页面上的每张图片，都在同一个侧栏里',
    'panel.lead': '侧栏在页面旁展开，列出所有已加载的内容：标签、srcset、CSS 背景、内联 SVG 和框架。',
    'panel.art': 'Imaget 侧栏：左侧是页面图片列表及其尺寸，右侧是所选文件的原始尺寸预览',
    'list.this': '本页',
    'list.order': '排序',
    'list.selected': '已选中',
    'list.thumb': '缩略图',
    'list.alt': '西高止山脉低云下的绿色山坡',

    'works.h2a': '四项图片功能。',
    'works.h2b': '读取页面、解析原图、筛选并保存。',
    'card1.h': '读取每一层框架里的图片',
    'card1.p': '标签、srcset、CSS 背景、内联 SVG 和嵌套 iframe，包括 Shadow DOM。',
    'card2.h': '解析原始图片',
    'card2.p': '在六个站点上，侧栏会把缩略图换成它背后的原文件，按原始尺寸显示。',
    'card3.h': '下载前筛选图片',
    'card3.p': '按宽高、PNG、JPG、WebP 或 GIF 筛选，并支持关键词与排除规则。',
    'card4.h': '悬停即可保存图片',
    'card4.p': '任意大于 128 px 的图片上会出现浮动按钮，预览后原地保存。',
    'mini.img': 'img 与 picture 标签',
    'mini.srcset': 'srcset 与 CSS',
    'mini.shadow': 'Shadow DOM',
    'mini.frames': '嵌套框架',
    'apps.title': '原始文件',
    'apps.sites': '{n} 个站点',
    'apps.full': '原始尺寸',
    'apps.fullimg': '原图',
    'apps.blob': '聊天附件',
    'apps.unwrap': '已还原',
    'apps.connected': '已连接',
    'fb.keyword': '关键词：field',
    'fb.exclude': '排除：icon',
    'fb.count': '<b>34</b> / 共 67 张',
    'fb.on': '已开启 2 项',
    'pause.label': '暂停演示',
    'play.label': '播放演示',

    'export.h2a': '每一次下载都可设置。',
    'export.h2b': '格式、文件名、文件夹与最小尺寸。',
    'row.format': '格式',
    'row.format.p': '默认使用 WebP，老版本编辑器可选 JPG 和 PNG。',
    'row.name': '文件名',
    'row.name.tail': '，或文件本身的名称。',
    'row.folder': '文件夹',
    'row.folder.p': '每个页面标题一个子文件夹，默认关闭。',
    'row.folder.v': '开启',
    'row.min': '最小图片',
    'row.min.p': '低于此尺寸的图片，侧栏会跳过。',
    'tg.title': '它会自动做什么',
    'tg.on': '已开启 {n}/5 项',
    'tg1.l': '下载时转为 WebP',
    'tg1.s': '质量 0.9，或保留原图',
    'tg2.l': '读取 CSS 背景图片',
    'tg2.s': '包括 Shadow DOM 内部',
    'tg3.l': '显示浮动按钮',
    'tg3.s': '128 px 以上的图片',
    'tg4.l': '按文件夹整理下载',
    'tg4.s': '以页面标题命名',
    'tg5.l': '批量下载前询问',
    'tg5.s': '超过 50 个文件时确认一次',

    'questions.h2': '常见问题',
    'q1.h': '哪些站点能拿到原图？',
    'q1.p': 'Pixiv、X、微博、Reddit、Telegram 和 Discord。其他站点按页面加载时的尺寸列出图片。',
    'q2.h': '图片保存到哪里？',
    'q2.p': '保存到“下载”文件夹；开启对应规则后，则保存到以页面标题命名的子文件夹。',
    'q3.h': '禁止右键的页面也能用吗？',
    'q3.p': '可以。无需右键菜单，也能列出页面上的图片。',
    'q4.h': '图片会离开浏览器吗？',
    'q4.p': '不会。嗅探、格式转换和 ZIP 打包都在你的电脑上完成，也不需要账号。',
    'q5.h': '批量下载图片要收费吗？',
    'q5.p': '不收费。Imaget 以 GPL-3.0 开源，代码就在 GitHub 上。',
    'zip.sub': '34 张图片 · 2.4 MB',
    'zip.saved': '已保存到“下载”',
    'zip.more': '另有 24 个文件',

    'close.h2': '把整个页面存进一个文件夹',
    'close.lead': '1.3.0 版，支持 Chrome、Edge 和 Brave。GPL-3.0，免费使用。',
    'footer.lede': '面向浏览器的图片嗅探与批量下载。',
    'footer.product': '产品',
    'footer.project': '项目',
    'footer.legal': '法律',
    'footer.panel': '侧栏',
    'footer.features': '功能',
    'footer.settings': '设置',
    'footer.github': 'GitHub',
    'footer.releases': '版本发布',
    'footer.questions': '常见问题',
    'footer.privacy': '隐私政策',
    'footer.license': '许可证',
    'footer.credits': '图片来自 Wikimedia Commons',
    'footer.credits.p': '图库中的图片为占位素材（CC0），来自 Wikimedia Commons：Over-Betuwe，Cultureel Gelderland；天空、山脉与树木，Pixel.la Free Stock Photos；Newcastle 步道，Reinhart Coetsee（CC BY-SA 4.0）；Unilorin 绿地，Abdurrazaq A.F.O（CC BY-SA 4.0）；Murshid Thali Paramban（CC BY-SA 4.0）；Madurai，Arjuncommons（CC BY-SA 4.0）。',
  },

  'zh-TW': {
    'meta.title': 'Imaget：Chrome 批次圖片下載擴充功能',
    'meta.desc': 'Imaget 列出網頁載入的每一張圖片，依尺寸與檔案類型篩選，再把整組圖片存成一個 ZIP。免費、開源，全程在瀏覽器本機完成。',
    'meta.ogtitle': 'Imaget：Chrome 批次圖片下載擴充功能',
    'meta.ogdesc': '列出網頁載入的每一張圖片，依尺寸與類型篩選，再整組存成一個 ZIP。',
    'meta.ogalt': 'Imaget：一鍵抓取頁面上的每一張圖片',

    'nav.skip': '跳至內容',
    'nav.main': '主要導覽',
    'nav.footer': '頁尾',
    'nav.panel': '側邊面板',
    'nav.features': '功能',
    'nav.settings': '設定',
    'nav.questions': '常見問題',
    'nav.menu': '選單',
    'nav.lang': '語言',
    'cta.download': '加到 Chrome',

    'hero.h1': 'Chrome 批次圖片下載器',
    'hero.lead': 'Imaget 列出網頁載入的所有圖片——srcset、CSS 背景、內嵌 SVG 與巢狀框架——依尺寸與類型篩選，再把整組存成一個 ZIP。',
    'hero.proof': '以 GPL-3.0 開源，完全免費，支援 14 種語言。',
    'hero.art': 'Imaget 側邊面板疊在圖片庫上：標有格式的圖片格線，底部是一條下載列',

    'w.images': '圖片',
    'w.settings': '設定',
    'w.search': '搜尋',
    'w.exclude': '排除',
    'w.type': '類型',
    'w.nottype': '排除類型',
    'w.all': '全部',
    'w.order': '排序',
    'w.images34': '34 張圖片',
    'w.filters2': '2 個篩選',
    'w.saved': '已儲存至 the-quiet-field.zip',
    'w.dlzip': '下載 ZIP',
    'w.download': '下載',

    'panel.h2': '網頁上的每張圖片，都在同一個面板裡',
    'panel.lead': '側邊面板在網頁旁展開，列出所有已載入的內容：標籤、srcset、CSS 背景、內嵌 SVG 與框架。',
    'panel.art': 'Imaget 側邊面板：左側是網頁圖片清單與尺寸，右側是所選檔案的原始尺寸預覽',
    'list.this': '本頁',
    'list.order': '排序',
    'list.selected': '已選取',
    'list.thumb': '縮圖',
    'list.alt': '西高止山脈低雲下的綠色山坡',

    'works.h2a': '四項圖片功能。',
    'works.h2b': '讀取網頁、解析原圖、篩選並儲存。',
    'card1.h': '讀取每一層框架裡的圖片',
    'card1.p': '標籤、srcset、CSS 背景、內嵌 SVG 與巢狀 iframe，包含 Shadow DOM。',
    'card2.h': '解析原始圖片',
    'card2.p': '在六個網站上，面板會把縮圖換成它背後的原始檔案，以原始尺寸顯示。',
    'card3.h': '下載前篩選圖片',
    'card3.p': '依寬高、PNG、JPG、WebP 或 GIF 篩選，並支援關鍵字與排除規則。',
    'card4.h': '懸停即可儲存圖片',
    'card4.p': '任何大於 128 px 的圖片上會出現浮動按鈕，預覽後原地儲存。',
    'mini.img': 'img 與 picture 標籤',
    'mini.srcset': 'srcset 與 CSS',
    'mini.shadow': 'Shadow DOM',
    'mini.frames': '巢狀框架',
    'apps.title': '原始檔案',
    'apps.sites': '{n} 個網站',
    'apps.full': '原始尺寸',
    'apps.fullimg': '原圖',
    'apps.blob': '聊天附件',
    'apps.unwrap': '已還原',
    'apps.connected': '已連線',
    'fb.keyword': '關鍵字：field',
    'fb.exclude': '排除：icon',
    'fb.count': '<b>34</b> / 共 67 張',
    'fb.on': '已開啟 2 項',
    'pause.label': '暫停示範',
    'play.label': '播放示範',

    'export.h2a': '每一次下載都可設定。',
    'export.h2b': '格式、檔名、資料夾與最小尺寸。',
    'row.format': '格式',
    'row.format.p': '預設使用 WebP，舊版編輯器可選 JPG 與 PNG。',
    'row.name': '檔名',
    'row.name.tail': '，或檔案本身的名稱。',
    'row.folder': '資料夾',
    'row.folder.p': '每個網頁標題一個子資料夾，預設關閉。',
    'row.folder.v': '開啟',
    'row.min': '最小圖片',
    'row.min.p': '低於此尺寸的圖片，面板會略過。',
    'tg.title': '它會自動做什麼',
    'tg.on': '已開啟 {n}/5 項',
    'tg1.l': '下載時轉為 WebP',
    'tg1.s': '品質 0.9，或保留原圖',
    'tg2.l': '讀取 CSS 背景圖片',
    'tg2.s': '包含 Shadow DOM 內部',
    'tg3.l': '顯示浮動按鈕',
    'tg3.s': '128 px 以上的圖片',
    'tg4.l': '依資料夾整理下載',
    'tg4.s': '以網頁標題命名',
    'tg5.l': '批次下載前詢問',
    'tg5.s': '超過 50 個檔案時確認一次',

    'questions.h2': '常見問題',
    'q1.h': '哪些網站能取得原圖？',
    'q1.p': 'Pixiv、X、微博、Reddit、Telegram 與 Discord。其他網站則依網頁載入時的尺寸列出圖片。',
    'q2.h': '圖片會存到哪裡？',
    'q2.p': '存到「下載」資料夾；開啟對應規則後，則存到以網頁標題命名的子資料夾。',
    'q3.h': '禁止右鍵的網頁也能用嗎？',
    'q3.p': '可以。不必開啟右鍵選單，也能列出網頁上的圖片。',
    'q4.h': '圖片會離開瀏覽器嗎？',
    'q4.p': '不會。偵測、格式轉換與 ZIP 打包都在你的電腦上完成，也不需要帳號。',
    'q5.h': '批次下載圖片要付費嗎？',
    'q5.p': '不用。Imaget 以 GPL-3.0 開源，程式碼就在 GitHub 上。',
    'zip.sub': '34 張圖片 · 2.4 MB',
    'zip.saved': '已儲存到「下載」',
    'zip.more': '另有 24 個檔案',

    'close.h2': '把整個網頁存進一個資料夾',
    'close.lead': '1.3.0 版，支援 Chrome、Edge 與 Brave。GPL-3.0，免費使用。',
    'footer.lede': '為瀏覽器而做的圖片偵測與批次下載。',
    'footer.product': '產品',
    'footer.project': '專案',
    'footer.legal': '法律',
    'footer.panel': '側邊面板',
    'footer.features': '功能',
    'footer.settings': '設定',
    'footer.github': 'GitHub',
    'footer.releases': '版本發布',
    'footer.questions': '常見問題',
    'footer.privacy': '隱私權政策',
    'footer.license': '授權條款',
    'footer.credits': '圖片來自 Wikimedia Commons',
    'footer.credits.p': '圖庫中的圖片為佔位素材（CC0），來自 Wikimedia Commons：Over-Betuwe，Cultureel Gelderland；天空、山脈與樹木，Pixel.la Free Stock Photos；Newcastle 步道，Reinhart Coetsee（CC BY-SA 4.0）；Unilorin 綠地，Abdurrazaq A.F.O（CC BY-SA 4.0）；Murshid Thali Paramban（CC BY-SA 4.0）；Madurai，Arjuncommons（CC BY-SA 4.0）。',
  },

  ja: {
    'meta.title': 'Imaget：Chrome 向け画像一括ダウンローダー',
    'meta.desc': 'Imaget はページが読み込むすべての画像を一覧にし、サイズとファイル形式で絞り込んで 1 つの ZIP にまとめて保存します。無料・オープンソースで、すべてブラウザー内で完結します。',
    'meta.ogtitle': 'Imaget：Chrome 向け画像一括ダウンローダー',
    'meta.ogdesc': 'ページが読み込むすべての画像を一覧にし、サイズと形式で絞り込んで 1 つの ZIP に保存します。',
    'meta.ogalt': 'Imaget：ページ上のすべての画像をワンクリックで',

    'nav.skip': '本文へスキップ',
    'nav.main': 'メインナビゲーション',
    'nav.footer': 'フッター',
    'nav.panel': 'パネル',
    'nav.features': '機能',
    'nav.settings': '設定',
    'nav.questions': 'よくある質問',
    'nav.menu': 'メニュー',
    'nav.lang': '言語',
    'cta.download': 'Chrome に追加',

    'hero.h1': 'Chrome の画像<br>一括ダウンロード',
    'hero.lead': 'Imaget はページが読み込むすべての画像（srcset、CSS 背景、インライン SVG、ネストしたフレーム）を一覧にし、サイズと形式で絞り込んで、まとめて 1 つの ZIP に保存します。',
    'hero.proof': 'GPL-3.0 の無料オープンソース、14 言語に対応。',
    'hero.art': '写真ギャラリーの上に重なった Imaget のサイドパネル：形式付きの画像グリッドと、下部のダウンロードバー',

    'w.images': '画像',
    'w.settings': '設定',
    'w.search': '検索',
    'w.exclude': '除外',
    'w.type': '種類',
    'w.nottype': '除外する種類',
    'w.all': 'すべて',
    'w.order': '並び順',
    'w.images34': '34 枚の画像',
    'w.filters2': 'フィルター 2 件',
    'w.saved': 'the-quiet-field.zip に保存済み',
    'w.dlzip': 'ZIP を保存',
    'w.download': '保存',

    'panel.h2': 'ページのあらゆる画像を、1 つのパネルに',
    'panel.lead': 'サイドパネルがページの横に開き、読み込まれた画像を一覧にします：タグ、srcset、CSS 背景、インライン SVG、フレーム。',
    'panel.art': 'Imaget のサイドパネル：ページの画像とサイズの一覧の横に、選択したファイルの原寸プレビュー',
    'list.this': 'このページ',
    'list.order': '並び順',
    'list.selected': '選択中',
    'list.thumb': 'サムネイル',
    'list.alt': '西ガーツ山脈、低い雲の下に広がる緑の斜面',

    'works.h2a': '4 つの画像機能。',
    'works.h2b': 'ページを読み、原画を解決し、絞り込んで保存します。',
    'card1.h': 'あらゆるフレームの画像を読み取る',
    'card1.p': 'タグ、srcset、CSS 背景、インライン SVG、ネストした iframe、Shadow DOM にも対応。',
    'card2.h': '原画を解決する',
    'card2.p': '6 つのサイトでは、サムネイルをその背後の元ファイルに置き換え、原寸で表示します。',
    'card3.h': 'ダウンロード前に絞り込む',
    'card3.p': '幅と高さ、PNG・JPG・WebP・GIF、さらにキーワードと除外ルールで絞り込めます。',
    'card4.h': 'ホバーで画像を保存',
    'card4.p': '128 px 以上の画像にはフローティングボタンが出て、プレビュー後にその場で保存できます。',
    'mini.img': 'img と picture タグ',
    'mini.srcset': 'srcset と CSS',
    'mini.shadow': 'Shadow ルート',
    'mini.frames': 'ネストしたフレーム',
    'apps.title': '元ファイル',
    'apps.sites': '{n} サイト',
    'apps.full': '原寸',
    'apps.fullimg': '原画',
    'apps.blob': 'チャット画像',
    'apps.unwrap': '展開済み',
    'apps.connected': '接続済み',
    'fb.keyword': 'キーワード: field',
    'fb.exclude': '除外: icon',
    'fb.count': '<b>34</b> / 67 枚',
    'fb.on': '2 件オン',
    'pause.label': 'デモを一時停止',
    'play.label': 'デモを再生',

    'export.h2a': 'ダウンロードごとの<br>設定。',
    'export.h2b': '形式、ファイル名、フォルダー、最小サイズ。',
    'row.format': '形式',
    'row.format.p': '既定は WebP。古いエディター向けに JPG と PNG も選べます。',
    'row.name': 'ファイル名',
    'row.name.tail': '、またはファイル自身の名前。',
    'row.folder': 'フォルダー',
    'row.folder.p': 'ページタイトルごとにサブフォルダーを作成（既定はオフ）。',
    'row.folder.v': 'オン',
    'row.min': '最小サイズ',
    'row.min.p': 'これより小さい画像はパネルがスキップします。',
    'tg.title': '自動で行うこと',
    'tg.on': '{n}/5 項目オン',
    'tg1.l': 'ダウンロード時に WebP へ変換',
    'tg1.s': '品質 0.9、または元のまま',
    'tg2.l': 'CSS 背景画像を読み取る',
    'tg2.s': 'Shadow ルート内も対象',
    'tg3.l': 'フローティングボタンを表示',
    'tg3.s': '128 px 以上の画像',
    'tg4.l': 'ダウンロードをフォルダーに整理',
    'tg4.s': 'ページタイトルで命名',
    'tg5.l': '一括前に確認',
    'tg5.s': '50 ファイル以上で 1 回確認',

    'questions.h2': 'よくある質問',
    'q1.h': '元画像を取得できるサイトは？',
    'q1.p': 'Pixiv、X、Weibo、Reddit、Telegram、Discord です。ほかのサイトは読み込み時のサイズで表示します。',
    'q2.h': '画像はどこに保存されますか？',
    'q2.p': '「ダウンロード」、またはページタイトル名のサブフォルダーに保存されます。',
    'q3.h': '右クリックが禁止されたページでも使えますか？',
    'q3.p': 'はい。コンテキストメニューなしでページの画像を一覧できます。',
    'q4.h': '画像がブラウザーの外に出ることはありますか？',
    'q4.p': 'いいえ。すべての処理はお使いのマシン上で完結します。',
    'q5.h': '一括ダウンロードに料金はかかりますか？',
    'q5.p': 'かかりません。Imaget は GPL-3.0 のオープンソースで、コードは GitHub にあります。',
    'zip.sub': '34 枚の画像 · 2.4 MB',
    'zip.saved': 'ダウンロードに保存',
    'zip.more': '他 24 ファイル',

    'close.h2': 'ページ全体を<br>1 つのフォルダーに',
    'close.lead': 'Chrome、Edge、Brave 対応のバージョン 1.3.0。GPL-3.0 で無料。',
    'footer.lede': '画像の検出と一括ダウンロード。',
    'footer.product': '製品',
    'footer.project': 'プロジェクト',
    'footer.legal': '法務',
    'footer.panel': 'パネル',
    'footer.features': '機能',
    'footer.settings': '設定',
    'footer.github': 'GitHub',
    'footer.releases': 'リリース',
    'footer.questions': 'よくある質問',
    'footer.privacy': 'プライバシー',
    'footer.license': 'ライセンス',
    'footer.credits': '写真は Wikimedia Commons より',
    'footer.credits.p': 'ギャラリーの画像は Wikimedia Commons の CC0 素材（代替画像）です：Over-Betuwe（Cultureel Gelderland）、空・山・木（Pixel.la Free Stock Photos）、Newcastle のトレイル（Reinhart Coetsee、CC BY-SA 4.0）、Unilorin の緑地（Abdurrazaq A.F.O、CC BY-SA 4.0）、Murshid Thali Paramban（CC BY-SA 4.0）、Madurai（Arjuncommons、CC BY-SA 4.0）。',
  },

  ko: {
    'meta.title': 'Imaget: Chrome용 이미지 일괄 다운로더',
    'meta.desc': 'Imaget는 페이지가 불러오는 모든 이미지를 나열하고, 크기와 파일 형식으로 걸러 하나의 ZIP으로 저장합니다. 무료 오픈 소스이며 모든 작업이 브라우저 안에서 이루어집니다.',
    'meta.ogtitle': 'Imaget: Chrome용 이미지 일괄 다운로더',
    'meta.ogdesc': '페이지가 불러오는 모든 이미지를 나열하고, 크기와 형식으로 걸러 하나의 ZIP으로 저장합니다.',
    'meta.ogalt': 'Imaget: 페이지의 모든 이미지를 한 번에',

    'nav.skip': '본문으로 건너뛰기',
    'nav.main': '주 메뉴',
    'nav.footer': '바닥글',
    'nav.panel': '패널',
    'nav.features': '기능',
    'nav.settings': '설정',
    'nav.questions': '질문',
    'nav.menu': '메뉴',
    'nav.lang': '언어',
    'cta.download': 'Chrome에 추가',

    'hero.h1': 'Chrome용 이미지 일괄 다운로더',
    'hero.lead': 'Imaget는 페이지가 불러오는 모든 이미지(srcset, CSS 배경, 인라인 SVG, 중첩 프레임)를 나열하고, 크기와 형식으로 걸러 하나의 ZIP으로 저장합니다.',
    'hero.proof': 'GPL-3.0 무료 오픈 소스, 14개 언어 지원.',
    'hero.art': '사진 갤러리 위에 겹쳐진 Imaget 사이드 패널: 형식이 표시된 이미지 그리드와 하단의 다운로드 바',

    'w.images': '이미지',
    'w.settings': '설정',
    'w.search': '검색',
    'w.exclude': '제외',
    'w.type': '유형',
    'w.nottype': '제외 유형',
    'w.all': '전체',
    'w.order': '정렬',
    'w.images34': '이미지 34개',
    'w.filters2': '필터 2개',
    'w.saved': 'the-quiet-field.zip에 저장됨',
    'w.dlzip': 'ZIP 다운로드',
    'w.download': '저장',

    'panel.h2': '페이지의 모든 이미지를 한 패널에',
    'panel.lead': '사이드 패널이 페이지 옆에 열려 불러온 항목을 나열합니다: 태그, srcset, CSS 배경, 인라인 SVG, 프레임.',
    'panel.art': 'Imaget 사이드 패널: 페이지 이미지와 크기 목록 옆에 선택한 파일의 원본 크기 미리보기',
    'list.this': '이 페이지',
    'list.order': '정렬',
    'list.selected': '선택됨',
    'list.thumb': '썸네일',
    'list.alt': '서가츠 산맥, 낮은 구름 아래 펼쳐진 초록 언덕',

    'works.h2a': '네 가지 이미지 기능.',
    'works.h2b': '페이지를 읽고, 원본을 찾고, 걸러서 저장합니다.',
    'card1.h': '모든 프레임의 이미지 읽기',
    'card1.p': '태그, srcset, CSS 배경, 인라인 SVG, 중첩 iframe, Shadow DOM까지 읽습니다.',
    'card2.h': '원본 이미지 찾기',
    'card2.p': '6개 사이트에서는 패널이 썸네일을 그 뒤의 원본 파일로 바꿔 원래 크기로 보여 줍니다.',
    'card3.h': '다운로드 전 필터링',
    'card3.p': '너비와 높이, PNG, JPG, WebP, GIF에 키워드와 제외 규칙까지.',
    'card4.h': '마우스 오버로 저장',
    'card4.p': '128 px 이상 이미지에는 뜨는 버튼이 생겨 미리 본 뒤 바로 저장합니다.',
    'mini.img': 'img 및 picture 태그',
    'mini.srcset': 'srcset 및 CSS',
    'mini.shadow': 'Shadow 루트',
    'mini.frames': '중첩 프레임',
    'apps.title': '원본 파일',
    'apps.sites': '{n}개 사이트',
    'apps.full': '원본 크기',
    'apps.fullimg': '원본 이미지',
    'apps.blob': '채팅 이미지',
    'apps.unwrap': '원본 링크',
    'apps.connected': '연결됨',
    'fb.keyword': '키워드: field',
    'fb.exclude': '제외: icon',
    'fb.count': '<b>34</b> / 67개',
    'fb.on': '2개 켜짐',
    'pause.label': '데모 일시정지',
    'play.label': '데모 재생',

    'export.h2a': '모든 다운로드를 설정하세요.',
    'export.h2b': '형식, 파일 이름, 폴더, 최소 크기.',
    'row.format': '형식',
    'row.format.p': '기본은 WebP, 오래된 편집기용으로 JPG와 PNG도 고를 수 있습니다.',
    'row.name': '파일 이름',
    'row.name.tail': ', 또는 파일 자체 이름.',
    'row.folder': '폴더',
    'row.folder.p': '페이지 제목마다 하위 폴더 생성, 기본은 꺼짐.',
    'row.folder.v': '켜짐',
    'row.min': '최소 이미지',
    'row.min.p': '이보다 작으면 패널이 건너뜁니다.',
    'tg.title': '자동으로 하는 일',
    'tg.on': '{n}/5개 켜짐',
    'tg1.l': '다운로드 시 WebP로 변환',
    'tg1.s': '품질 0.9, 또는 원본 유지',
    'tg2.l': 'CSS 배경 이미지 읽기',
    'tg2.s': 'Shadow 루트 내부 포함',
    'tg3.l': '플로팅 버튼 표시',
    'tg3.s': '128 px 이상 이미지',
    'tg4.l': '다운로드를 폴더로 정리',
    'tg4.s': '페이지 제목으로 이름 지정',
    'tg5.l': '일괄 다운로드 전 확인',
    'tg5.s': '파일 50개 이상일 때 한 번 확인',

    'questions.h2': '자주 묻는 질문',
    'q1.h': '원본 이미지를 주는 사이트는?',
    'q1.p': 'Pixiv, X, Weibo, Reddit, Telegram, Discord입니다. 그 밖의 사이트는 페이지가 불러온 크기로 이미지를 나열합니다.',
    'q2.h': '이미지는 어디에 저장되나요?',
    'q2.p': '다운로드 폴더에 저장되며, 해당 규칙이 켜져 있으면 페이지 제목 이름의 하위 폴더에 저장됩니다.',
    'q3.h': '오른쪽 클릭이 막힌 페이지에서도 되나요?',
    'q3.p': '네. 컨텍스트 메뉴 없이도 페이지의 이미지를 나열합니다.',
    'q4.h': '이미지가 브라우저 밖으로 나가나요?',
    'q4.p': '아니요. 감지, 변환, ZIP 압축은 모두 내 컴퓨터에서 실행되며 계정도 없습니다.',
    'q5.h': '일괄 다운로드에 비용이 드나요?',
    'q5.p': '무료입니다. Imaget는 GPL-3.0 오픈 소스이며 코드는 GitHub에 있습니다.',
    'zip.sub': '이미지 34개 · 2.4 MB',
    'zip.saved': '다운로드에 저장됨',
    'zip.more': '파일 24개 더',

    'close.h2': '페이지 전체를 한 폴더에',
    'close.lead': 'Chrome, Edge, Brave용 버전 1.3.0. GPL-3.0 무료.',
    'footer.lede': '브라우저를 위한 이미지 감지와 일괄 다운로드.',
    'footer.product': '제품',
    'footer.project': '프로젝트',
    'footer.legal': '법적 고지',
    'footer.panel': '패널',
    'footer.features': '기능',
    'footer.settings': '설정',
    'footer.github': 'GitHub',
    'footer.releases': '릴리스',
    'footer.questions': '질문',
    'footer.privacy': '개인정보',
    'footer.license': '라이선스',
    'footer.credits': '사진: Wikimedia Commons',
    'footer.credits.p': '갤러리 이미지는 Wikimedia Commons의 CC0 대체 이미지입니다: Over-Betuwe(Cultureel Gelderland), 하늘·산·나무(Pixel.la Free Stock Photos), Newcastle 트레일(Reinhart Coetsee, CC BY-SA 4.0), Unilorin 녹지(Abdurrazaq A.F.O, CC BY-SA 4.0), Murshid Thali Paramban(CC BY-SA 4.0), Madurai(Arjuncommons, CC BY-SA 4.0).',
  },
};

const byCode = new Map(LANGS.map((l) => [l.code, l]));
const normalize = (v) => {
  if (!v) return null;
  const s = String(v).trim().toLowerCase().replace('_', '-');
  if (byCode.has(s)) return s;
  if (s === 'zh' || s === 'zh-hans' || s === 'cn' || s === 'zh-cn') return 'zh-CN';
  if (s === 'zh-hant' || s === 'tw' || s === 'hk' || s === 'zh-tw' || s === 'zh-hk' || s === 'zh-mo') return 'zh-TW';
  if (s === 'ja' || s === 'jp' || s === 'ja-jp') return 'ja';
  if (s === 'ko' || s === 'kr' || s === 'ko-kr') return 'ko';
  if (s.startsWith('en')) return 'en';
  return null;
};

const store = {
  get() { try { return localStorage.getItem('imaget-lang'); } catch { return null; } },
  set(v) { try { localStorage.setItem('imaget-lang', v); } catch { /* private mode */ } },
};

const params = new URLSearchParams(location.search);
let current = normalize(params.get('lang')) || normalize(store.get()) || 'en';

const t = (key) => (T[current] && T[current][key]) || T.en[key] || '';

/* the mocks' tallies ("6 sites", "4 of 5 on") are rewritten by their own loops with the figure
   only; this keeps the words in the page's language and restores the figure each cycle */
function keepCounts() {
  for (const el of document.querySelectorAll('[data-i18n-count]')) {
    const m = el.textContent.match(/\d+/);
    if (!m) continue;
    const next = t(el.dataset.i18nCount).replace('{n}', m[0]);
    if (next && el.textContent !== next) el.textContent = next;
  }
}

function watchCounts() {
  const mo = new MutationObserver(keepCounts);
  for (const el of document.querySelectorAll('[data-i18n-count]')) {
    mo.observe(el, { childList: true, characterData: true, subtree: true });
  }
}

function setMeta(selector, value) {
  const el = document.querySelector(selector);
  if (el && value) el.setAttribute('content', value);
}

function apply(code, { writeUrl = false } = {}) {
  const entry = byCode.get(code);
  if (!entry) return;
  current = code;
  const root = document.documentElement;
  root.lang = entry.tag;
  root.dataset.lang = entry.code;

  for (const el of document.querySelectorAll('[data-i18n]')) {
    const v = t(el.dataset.i18n);
    if (v) el.textContent = v;
  }
  for (const el of document.querySelectorAll('[data-i18n-html]')) {
    const v = t(el.dataset.i18nHtml);
    if (v) el.innerHTML = v;
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    const v = t(el.dataset.i18nAria);
    if (v) el.setAttribute('aria-label', v);
  }
  for (const el of document.querySelectorAll('[data-i18n-alt]')) {
    const v = t(el.dataset.i18nAlt);
    if (v) el.setAttribute('alt', v);
  }

  document.title = t('meta.title');
  setMeta('meta[name="description"]', t('meta.desc'));
  setMeta('meta[property="og:title"]', t('meta.ogtitle'));
  setMeta('meta[property="og:description"]', t('meta.ogdesc'));
  setMeta('meta[property="og:image:alt"]', t('meta.ogalt'));
  setMeta('meta[name="twitter:title"]', t('meta.ogtitle'));
  setMeta('meta[name="twitter:description"]', t('meta.ogdesc'));

  const pause = document.querySelector('.loop-pause');
  if (pause) pause.setAttribute('aria-label', pause.getAttribute('aria-pressed') === 'true' ? t('play.label') : t('pause.label'));

  for (const btn of document.querySelectorAll('[data-lang]')) {
    const on = btn.dataset.lang === code;
    if (on) btn.setAttribute('aria-current', 'true');
    else btn.removeAttribute('aria-current');
  }
  const short = document.querySelector('.lang__code');
  if (short) short.textContent = entry.short;

  keepCounts();
  const sw = document.querySelector('[data-lang-switch]');
  if (sw) sw.setAttribute('lang', entry.tag);

  if (writeUrl) {
    const url = new URL(location.href);
    url.searchParams.set('lang', code);
    history.replaceState(null, '', url.toString());
  }
  store.set(code);
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: code } }));
}

function wire() {
  const sw = document.querySelector('[data-lang-switch]');
  const btn = sw && sw.querySelector('.lang__btn');
  const menu = sw && sw.querySelector('.lang__menu');

  const close = ({ focus = false } = {}) => {
    if (!sw) return;
    sw.classList.remove('is-open');
    btn?.setAttribute('aria-expanded', 'false');
    if (focus) btn?.focus();
  };

  btn?.addEventListener('click', () => {
    const open = sw.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', String(open));
    if (open) menu?.querySelector('button')?.focus();
  });

  menu?.addEventListener('click', (e) => {
    const item = e.target.closest('[data-lang]');
    if (!item) return;
    apply(item.dataset.lang, { writeUrl: true });
    close({ focus: true });
  });

  document.addEventListener('click', (e) => {
    if (sw && !sw.contains(e.target)) close();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && sw?.classList.contains('is-open')) close({ focus: true });
  });
}

apply(current);
wire();
watchCounts();

window.imagetI18n = { t, apply, get lang() { return current; }, langs: LANGS };
