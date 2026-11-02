# Prompt History (`prompt_history.md`)

This file records and preserves all user prompts in chronological order.

---

### Prompt 1: Initial App Import
```
This app was imported from GitHub repository mostuf2556/subtitle-sync.
```

---

### Prompt 2: Punctuation Paired Wrapping & TTS In-Between Order
```
1. by default split by punctuations (in case of ".",
,","?", "!" (but wrap together text within start/closing couples of punctuation chars  such as: "\"\" or "("  )
2. should the video be played before or after the tts-play? add another option which is to play the video in between tts-play groups (1 group to play before , one group to play after the video-play)
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(5) > div:nth-of-type(1)
CSS 1: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 3: Migration Verification
```
This app was imported from GitHub repository mostuf2556/subtitle-sync.
```

---

### Prompt 4: Supabase Quarantine, TTS-Ratio Fix, Alternative TTS Services, Place Video in Language Order & Mobile Responsiveness
```
0. AGENTS.md - quarentine any superbase related files and docs (no prompt instruction have been issued regarding db support on this project!). always keep historic prompts to prompt_history.md
1. advance mode - tts-ratio sometimes work, sometimes the tts-play stops without any reported reason
2. currently not working: 
- using google tts service directly (it worked before)
- using https://tts3.lovable.app/api/public/openapi.json
3. there is no in-between order for tts-play. tts-play before-video is not working
4. by design it should be easier to set the place of the video within the order of the languages in order to detemine when to play the video
5. on mobile view - page size should be responsive and adapt to fit the screen size
```

---

### Prompt 5: Validation for Remote TTS Services (Google TTS Directly or TTS3 Service)
```
add validation to tts-remove-service: google-tts-directly or tts3 service
```

---

### Prompt 6: Quarantine Beginner Mode, Debug Mode Menu Toggle, and Language Selection Columns (is-primary and json3)
```
1. go on
2. currently quarentine beginner mode 
3. ensure toggle on top menu to switch to debug mode where experimental views are also presented (such as playground)
4. language selection view:
- add column "is-primary" - the only way to define the tts-ration absolute parent
- add column "json3" which should be updated based upon user's manual toggling of that language on the video player (another indication of direct fetching).
```

---

### Prompt 7: Accordion Stages of Appearance
```
1. go on
2. divide accordion elements to stages-of-appearance to decide when to present each accordion type:

2.1 
stage 1 - 
when? upon sharing a video with the app 
what to present? only the video accordion up untill the subtitles are detected.

in case no subtitles are detected - instruct the user using a floating red-text to turn on the captions (or other instruction). 

like the case of the video-playground screen - the user should be able to turn on and to switch subtitles using the video element

for every new subtitles which detected there should be presented a botton on the bottom of the accordion element "NEXT (<the-number-of-detected-subtitles>)

stage-2 -"learning goals" 
the user should approve the list of favorite languages he wants to learn, and which language from the detected languages from state1 to set as the default langauge (the lang to translate from) 

stage -3 - show the subtitles-table-view accordion.

stage -4 - all other accordion elements will be presented if the user clicks on the settings icon. the user may click that button again to hide these elements.
```

---

### Prompt 8: Test Coverage on GitHub Pages Report Page
```
create test coverage - this should be seen on github-pages report page
```

---

### Prompt 9: Quick Loader Button, Memory Defaults (Debug Button & Version Details), and Remove Raw Video Data
```
1. 1st pointed element: id: quick-subtitles-and-video loader -> use a "quick-loader" button to show it. hide it by default

2. memory.md - defaults: boolean localstorage:boolean 
- by default - set debug button -present-on-start:off , local storage:off

3. version details element - clean view by using a version button - toggle it to show the relevant parent element (present-on-start:off , local storage:off)

4. 2nd pointed element: raw-vide-data -  rm it
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)
CSS 1: {

}
CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > header:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > span:nth-of-type(1)
CSS 2: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 10: Redundant Item Removal, Video Folded by Default, and Move Chars Removal & Parser under Settings
```
1. redundunt item - rm it.
2. memory.md - fold video item by default , localstorage:off
3. settings - the settings itself should contain few accordion elements such as  the ,parser, spacifal charecter removal  (so move them under settings)
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)
CSS 1: {

}
CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(5) > details:nth-of-type(1) > div:nth-of-type(1)
CSS 2: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 11: Go On
```
go on
```

---

### Prompt 12: Go On
```
go on
```

---

### Prompt 13: Remove Annoying Duplications of Favorite Languages in Languages Accordion
```
dont u notice annoying duplications where u show the same list of favotite languages over and over and over ?
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1)
CSS 1: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 14: Default Language Restricted to Successfully Fetched Subtitles
```
the default language can only be one of those languages their subtitles have been successfully fetched already.
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1) > div#stage-2-learning-goals-card:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)
CSS 1: {

}
---

### Prompt 15: Extend List of Favorite Languages in Stage 2 Learning Goals Card
```
there should be a way to extend the list of favorite languages - here and only here is the right place
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1) > div#stage-2-learning-goals-card:nth-of-type(1)
CSS 1: {

}
---

### Prompt 16: Go On & Single Floating Button of 1 Icon
```
1. go on
2. no need of 2 items. its enough to use 1 floating button of 1 icon
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(6)
CSS 1: {

}
[AIS_METADATA_SECTION_END]
```

---

---

### Prompt 18: TTS3 Docs Compliance, Direct Google TTS Parity, and Full Request/Response External TTS Debugger
```
0. fix it:
this project failed to work with docs: https://tts3.lovable.app/docs

1 direct using of google tts services implemented on https://github.com/bao002/subtitle-sync/tree/main but doesnt correctly implemented in this project

2. using the external tts service - show full request and response in order to help debugging.
```

---

### Prompt 19: Remote Speak API Token Authentication (spk_) & Upstream Provider Key Separation
```
i have generated a token on the remote tts service: spk_452003d7-32c5-4bb7-ac67-f3062c7b5965.o6ANX5Jt699eIiuAdbweAcSYj37juM7stQDlVJKlxz8

request:
curl --url 'https://tts3.lovable.app/api/public/tts' \
  -H 'accept: */*' \
  -H 'accept-language: he-IL,he;q=0.9' \
  -H 'content-type: application/json' \
  -H 'origin: https://ais-dev-g2m5sblwvppcvkwplxs4u3-450223931914.europe-west2.run.app' \
  -H 'priority: u=1, i' \
  -H 'referer: https://ais-dev-g2m5sblwvppcvkwplxs4u3-450223931914.europe-west2.run.app/' \
  -H 'sec-ch-ua: "Not:A-Brand";v="8", "Chromium";v="156", "Brave";v="156"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: cors' \
  -H 'sec-fetch-site: cross-site' \
  -H 'sec-gpc: 1' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36' \
  --data-raw '{"text":"Test","lang":"en","format":"json","provider":"lovable","voice":"Kore","api_key":"spk_452003d7-32c5-4bb7-ac67-f3062c7b5965.o6ANX5Jt699eIiuAdbweAcSYj37juM7stQDlVJKlxz8"}'
response:
{
    "error": "lovable request failed (HTTP 401). Lovable AI rejected the API key. Check that the key is current and correctly saved. Provider detail: Invalid API key format. Key must start with 'sk_' prefix."
}
```




---

### Prompt 20: Continue Execution (go on)
```
go on
```


---

### Prompt 21: Utilize Storybook, Clean Reactive TTS Service Controls & GitHub Pages Storybook Hosting
```
1. utilize storybook: currently the new components appears in the application once they are created. it is better to develop it first in clean environment. therefor make use of storybook - should github-pages show the storybook as well.
2. for example: when developing a tts-service and user select direct google tts service - the component shows menus which are not relevant. and there are duplications in the buttons which are appeared non-stop under the selector control.

such cases could be spotted and pointed out regardless the context of the app.

3. first storybook mission:  tts service - plan which control to show and when. (reactive)
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(1) > details:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(5) > div:nth-of-type(2) > div:nth-of-type(4)
CSS 1: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 22: Continue Execution (go on)
```
1. go on
```

---

### Prompt 23: Application Components in Storybook
```
ensure storybook contains the component of the application
```

---

### Prompt 24: GitHub Actions Storybook Deployment and README Link
```
github actions should deploy the storybook and README should contain its link
```

