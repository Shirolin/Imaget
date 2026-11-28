# Audio Asset Sources & Licenses

All sound effects are normalized to 48 kHz stereo 16-bit PCM WAV (`-3.0 dBFS` peak, strict 44-byte RIFF header) via `audio_craft.py normalize-sfx`.

## Background Music (BGM)

| File | Source | License / Usage | Notes |
| :--- | :--- | :--- | :--- |
| `bgm.wav` (`.tmp/promo-video/audio/bgm.wav`) | Google Flow Music — `Untitled (PassingQuail — Instrumental)` (`https://www.flowmusic.app/song/b1b681f4-058a-44c2-9f99-45f203f0dacb`) | AI-generated instrumental (Google Flow Music, Instrumental mode) | 120.0 BPM, D minor, `bgm_start=12.0s` (groove drop at 16.0s aligns with video 4.0s / frame 120), vocal-free verified `[12.0s–42.0s]` |

## Sound Effects (SFX)

| File | Source | License | Usage (Cue) |
| :--- | :--- | :--- | :--- |
| `brand_reveal.wav` | Earshot `shine/air` (`https://leonxlnx.github.io/earshot-site/sounds/shine/air.mp3`) | MIT / Public Domain | `intro_optical_grid_open`, `finale_logo_cta_shimmer` |
| `shutter_lock.wav` | Earshot `toggle/shutter_open` (`https://leonxlnx.github.io/earshot-site/sounds/toggle/shutter_open.mp3`) | MIT / Public Domain | `hook_bracket_lock` |
| `aperture_glint.wav` | Earshot `shine/glint` (`https://leonxlnx.github.io/earshot-site/sounds/shine/glint.mp3`) | MIT / Public Domain | `brand_aperture_reveal` (natural A6 / 1760 Hz, in D minor) |
| `whoosh_reverse.wav` | Earshot `whoosh_fast/reverse` (`https://leonxlnx.github.io/earshot-site/sounds/whoosh_fast/reverse.mp3`) | MIT / Public Domain | `pre_drop_riser` |
| `drop_impact.wav` | Earshot `cut_hit/air` (`https://leonxlnx.github.io/earshot-site/sounds/cut_hit/air.mp3`) | MIT / Public Domain | `main_groove_drop_scene2` |
| `scan_sweep.wav` | Earshot `shine/sweep` (`https://leonxlnx.github.io/earshot-site/sounds/shine/sweep.mp3`) | MIT / Public Domain | `shadow_dom_scan_sweep` (natural A5 / 880 Hz, in D minor) |
| `ui_glass_tick.wav` | Earshot `tock/glass` (`https://leonxlnx.github.io/earshot-site/sounds/tock/glass.mp3`) | MIT / Public Domain | `adapter_pixiv_lock`, `adapter_x_lock`, `adapter_weibo_lock`, `adapter_reddit_lock`, `adapter_telegram_lock`, `shift_click_batch_cascade`, `bento_card_stagger_1_2_3` |
| `panel_slide.wav` | Earshot `slide/panel` (`https://leonxlnx.github.io/earshot-site/sounds/slide/panel.mp3`) | MIT / Public Domain | `sidepanel_slide_in`, `settings_tab_switch` |
| `filter_snap.wav` | Earshot `toggle/micro` (`https://leonxlnx.github.io/earshot-site/sounds/toggle/micro.mp3`) | MIT / Public Domain | `filter_min_resolution_snap`, `filter_format_toggle` |
| `ui_click_soft.wav` | Earshot `click/soft` (`https://leonxlnx.github.io/earshot-site/sounds/click/soft.mp3`) | MIT / Public Domain | `filter_aspect_landscape`, `format_select_webp` |
| `typing_key.wav` | Earshot `typing_key/light` (`https://leonxlnx.github.io/earshot-site/sounds/typing_key/light.mp3`) | MIT / Public Domain | `filter_keyword_search_type` |
| `scene_whoosh_soft.wav` | Earshot `whoosh/soft` (`https://leonxlnx.github.io/earshot-site/sounds/whoosh/soft.mp3`) | MIT / Public Domain | `scene4_photo_zoom_in`, `zip_export_start`, `global_privacy_bento_enter`, `finale_aperture_clear` |
| `scene_whoosh_tight.wav` | Earshot `whoosh_fast/tight` (`https://leonxlnx.github.io/earshot-site/sounds/whoosh_fast/tight.mp3`) | MIT / Public Domain | `batch_grid_whip_pan` |
| `ui_pop.wav` | Earshot `ui_pop/soft` (`https://leonxlnx.github.io/earshot-site/sounds/ui_pop/soft.mp3`) | MIT / Public Domain | `floating_button_pop_in` |
| `ui_thock.wav` | Earshot `click/thock` (`https://leonxlnx.github.io/earshot-site/sounds/click/thock.mp3`) | MIT / Public Domain | `quick_download_click`, `shift_click_batch_cascade` |
| `key_down.wav` | Earshot `toggle/key_down` (`https://leonxlnx.github.io/earshot-site/sounds/toggle/key_down.mp3`) | MIT / Public Domain | `shift_key_hold_hud` |
| `slider_tick.wav` | Earshot `tick/soft` (`https://leonxlnx.github.io/earshot-site/sounds/tick/soft.mp3`) | MIT / Public Domain | `quality_slider_scrub` |
| `confirm_chime.wav` | Earshot `notify/mid_tine` (`https://leonxlnx.github.io/earshot-site/sounds/notify/mid_tine.mp3`), pitch-shifted +1 st to A5 (880 Hz) | MIT / Public Domain | `quick_download_saved_chime` |
| `batch_complete.wav` | Earshot `success/fifth` (`https://leonxlnx.github.io/earshot-site/sounds/success/fifth.mp3`), pitch-shifted -2 st to D5–A5 (587–880 Hz) | MIT / Public Domain | `zip_export_complete_chime` |
| `finale_settle.wav` | Earshot `thump/soft` (`https://leonxlnx.github.io/earshot-site/sounds/thump/soft.mp3`) | MIT / Public Domain | `finale_logo_cta_settle` |
