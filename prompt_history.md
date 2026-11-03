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

### Prompt 43: Go On
```
go on
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

---

### Prompt 43: Go on (Resume Task 291 Chapter 2)
```
go on
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

---

### Prompt 25: Create Next Version From Scratch Architecture Guide
```
create a docs/next_version_from_scratch.md
explain how to create this application in the simplest form by explaining the app design without getting into details. that doc should be used as the how-to build such application but without taking the bad part which are part of this project history.
start from a zoom out explanaiton and give a closer overview in few steps. no need to explain how to build a component only to dscribe each's goal.
```

---

### Prompt 26: Architectural Review of Next Version Design via Yes/No Questions
```
lets review that document. using yes/no question to reveal what is the most important app-level-design decisions.
```

---

### Prompt 27: Persist Yes/No Architectural Decisions into Document
```
did u wrote all to the .md file ?
```

---

### Prompt 28: Write steps.md of creating app with isolated testable/designable modules and minimal integration
```
1. write the steps.md  of creating such app in a way that every module and component can be tested in isolation. can be design in isolation and be able to be part of the app using minimal integration. order the steps by importance (for example)
```

---

---

### Prompt 30: Proxy Server Investigation for Subtitle URL Fetching & Historical Implementation
```
1. which server does it use to proxy the   subtitles url fetch address with/without entire request params ?

2. did u find the old implementation for that feature ?
```

---

### Prompt 31: Verify Full Use of Old Implementation: Random Strategy & Statistics-Driven Promotion
```
does it fully used the old implementation including the random strategy being used and report statistics while using it to choose the best strategy next ?
```

---

### Prompt 32: Persist Stored Default Subtitles, Switchable Default Languages Around Video Component (and Playground), & Different Accordion Background Colors
```
1. fix: the list of default subtitles should be stored correctly - currently when user choose another subtitles from the video's menu the list is reseted. keep the switchable list of default languages (those subtitles which fetched from youtube's api) around the video component (also on the playground). 
2. use different color for each accordion background
```

---

### Prompt 33: Hotfix ReferenceError: initialState is not defined
```
Fix the errors in the app
[APP_BOOT_ERROR] Router rendered ErrorComponent: This page didn't load initialState is not defined
ReferenceError: initialState is not defined at src/routes/index.tsx
```

---

### Prompt 34: Go on (Resume and verify app)
```
go on
```

---

### Prompt 35: Intercept YouTube API Caption Changes (X -> Y -> Z) & Accumulate in Switchable Default Languages Around Video
```
to be clear - i repeat the last sowftware requirement for making sure the app is updated:
assume the default subtitles is X, the user may update the video to show captions of language Y and later chooses Z. then all those subtitles changes should have triggered youtube api requests and all those request should be intercepted. more-over - all those subtitles should be added to the list of default languages and be apeared on a switchable list around the video.
```

---

### Prompt 36: Language Ratios at End of Learning Goals & Named Stored Compositions Dropdown Around Video
```
1. language ratios settings are part of learning goals and should come in the end of that stage

2. the user can setup and store different compositions of languages ration and give it a name and later is able to switch between those options using an easy dropdown list which is located next/around the video
```

---

### Prompt 37: Hotfix Pre-warming Dev Server Process Died & Linter Fix
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: Pre-warming failed: dev server process died. > subtitle-sync@2.0.83 dev > vite --host 0.0.0.0 --port 3000 --port 3000 --host 0.0.0.0 VITE v8.1.5  ready in 1507 ms ➜  Local:   http://localhost:3000/ ➜  Network: http://169.254.8.1:3000/ ➜  Network: http://169.254.9.1:3000/ ➜  Network: http://169.254.169.1:3000/
[AIS_METADATA_SECTION_END]
```

---

### Prompt 38: Hotfix ReferenceError: Sliders is not defined
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: [APP_BOOT_ERROR] Router rendered ErrorComponent: This page didn't load Sliders is not defined
error 1: [APP_PAGE_ERROR] This page didn't load: Sliders is not defined
error 2: ReferenceError: Sliders is not defined
    at https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/routes/index.tsx:9379:52
    at Array.map (<anonymous>)
    at Index (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/routes/index.tsx:6030:9)
    at Object.react_stack_bottom_frame (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:14140:12)
    at renderWithHooks (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:4398:19)
    at updateFunctionComponent (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:5773:16)
    at beginWork (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:6389:20)
    at runWithFiberInDEV (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:943:66)
    at performUnitOfWork (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:9146:92)
    at workLoopSync (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:9042:37)
error 3: %o

%s

%s ReferenceError: Sliders is not defined
    at https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/routes/index.tsx:9379:52
    at Array.map (<anonymous>)
    at Index (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/routes/index.tsx:6030:9)
    at Object.react_stack_bottom_frame (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:14140:12)
    at renderWithHooks (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:4398:19)
    at updateFunctionComponent (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:5773:16)
    at beginWork (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=58ceee0f:6389:20)
[AIS_METADATA_SECTION_END]
```

---

### Prompt 39: Single Place of Truth Versioning & Automated GitHub Actions Sync
```
1. currently the agent  update version for every change. this ofcourse not effective to update many files with the same version. try to find a way to effectivly update a version while relying on a single place of truth. consider moving automated operations to github action and being rely on single config file.
```

---

### Prompt 40: Hotfix Dev Server Pre-warming Failure
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: Pre-warming failed: dev server process died. > subtitle-sync@2.0.86 dev > vite --port 3000 --host 0.0.0.0 VITE v8.1.5  ready in 2122 ms ➜  Local:   http://localhost:3000/ ➜  Network: http://169.254.8.1:3000/ ➜  Network: http://169.254.9.1:3000/ ➜  Network: http://169.254.169.1:3000/
[AIS_METADATA_SECTION_END]
```

---

### Prompt 41: TTS Validation, Anonymity, Storybook First Component Policy, Direct Google TTS & Player Fallback Switch
```
0. general for tts service: first show validation button. after validation is ok - show a play button. (any request to tts service - should be visually monitored for farther debugging on the same view)
0.1 allow to choose between using that service regular way or anonymosly.

0.AGENTS.md - any component should first be implemented on storyboard - and only after being approved be used on the application itself.

1. choosing tts service: direct google tts rises lovable error!!! but this should use google tts directly and not via lovable !!!! 

 2. use a switch around the player - to determine the order of fallbacks while using the tts service: i.e: 1. google directly 2. tts3 service 3. native (the user would be able to click to navigate into the tts-service-setup to set tts3 token and choose which provider to use on tts3 - by default use "auto")
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(1) > main:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(1)
CSS 1: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 42: Hotfix Dev Server Pre-warming Failure & Lint Formatting
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: Pre-warming failed: dev server process died. > subtitle-sync@2.0.87 dev > vite --port 3000 --host 0.0.0.0 VITE v8.1.5  ready in 1828 ms ➜  Local:   http://localhost:3000/ ➜  Network: http://169.254.8.1:3000/ ➜  Network: http://169.254.9.1:3000/ ➜  Network: http://169.254.169.1:3000/
[AIS_METADATA_SECTION_END]
```

---

### Prompt 43: Hotfix Client Pre-transform Parse Error & Prettier Lint Formatting
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: 1:04:08 AM [vite] (client) Pre-transform error: Transform failed with 1 error:
error 1: [31m[PARSE_ERROR] [0mExpected a semicolon or an implicit semicolon after a statement, but found none
[AIS_METADATA_SECTION_END]
```

---

### Prompt 44: Go On
```
go on
```

---

### Prompt 45: Default Subtitles Comma-Based Recommendation Icon & Punctuation Statistics
```
add recommendation icon next to the default subtitles which has more "," signs, and expose statistics of punctuation counting for all the default subtitles.
```

---

### Prompt 46: Fix Video Playback Resume After TTS Play & Learning Goals Filters (Max Words Slider & Complete Sentence Filter)
```
0. it happens that the app doesnt resume the video after tts-play is finish playing.

1.
learning goals:

- add slider which allows to limit the number of words a subtitle row contains (then skip any record which have highter number of words)

- add control to skip any record which is not a complete sentence (not ending with a punctuation sign which is "," or "." or  "?" or "!")
```

---

### Prompt 47: Fix Vite Reload and TypeScript Type Errors (Hotfix)
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: [vite] Failed to reload /src/routes/index.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 1: [vite] Failed to reload /src/components/LanguageSubtitleUrlModal.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 2: [vite] Failed to reload /src/components/WebDemoUrlsInput.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 3: [vite] Failed to reload /src/components/VideoLibraryPanel.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 4: [vite] Failed to reload /src/components/ShareStateModal.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 5: [vite] Failed to reload /src/components/ApkReleasesFooter.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 6: [vite] Failed to reload /src/components/WinnerPromotionReportModal.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 7: [vite] Failed to reload /src/styles.css. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 8: [vite] Failed to reload /src/components/LanguageBoxesSelector.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 9: [vite] Failed to reload /src/components/beginner/BeginnerFlowContainer.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
[AIS_METADATA_SECTION_END]
```

---

### Prompt 48: Go On
```
go on
```

---

### Prompt 49: Fix Vite Reload and Missing Module Errors (Hotfix)
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: [vite] Failed to reload /src/styles.css. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 1: [vite] Failed to reload /src/components/beginner/BeginnerFavoriteLanguageSelector.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 2: [vite] Failed to reload /src/components/WebDemoUrlsInput.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 3: [vite] Failed to reload /src/routes/index.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 4: [vite] Failed to reload /src/components/ApkReleaseModal.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 5: [vite] Failed to reload /src/components/FloatingSubtitleRetryIndicator.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 6: [vite] Failed to reload /src/components/SubtitleRow.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 7: [vite] Failed to reload /src/components/beginner/PerLanguageTtsPreferences.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 8: [vite] Failed to reload /src/components/FloatingDraggablePauseButton.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 9: [vite] Failed to reload /src/components/NewSubtitlesParserBar.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
[AIS_METADATA_SECTION_END]
```

---

### Prompt 50: Video-Playing Precedence Bar Movable Among Pointed Table Records
```
in order to decide the video-playing precedence all we need is a bar to move and place among the pointed table records
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > table:nth-of-type(1) > tbody:nth-of-type(1) > tr:nth-of-type(1) > td:nth-of-type(1)
CSS 1: {

}
CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1) > div:nth-of-type(3) > table:nth-of-type(1) > tbody:nth-of-type(1) > tr:nth-of-type(2) > td:nth-of-type(1)
CSS 2: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 51: Move Row Criteria to Subtitles Table View & Hide Language Settings on Stage 3
```
row criteria should move to the subtitles-table-view in order to be able to view the change originated from the control dynamicly on the table.

hide language settings on stage 3 because we already have those on stage 2.
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(2) > div:nth-of-type(1) > div#stage-2-learning-goals-card:nth-of-type(1) > div:nth-of-type(2) > div:nth-of-type(2) > div#stage-2-learning-filters-container:nth-of-type(4) > div#learning-goals-filters-panel:nth-of-type(1)
CSS 1: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 52: Hotfix Filter Is Not Defined in index.tsx
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: [APP_BOOT_ERROR] Router rendered ErrorComponent: This page didn't load Filter is not defined
error 1: [APP_PAGE_ERROR] This page didn't load: Filter is not defined
error 2: ReferenceError: Filter is not defined
    at https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/src/routes/index.tsx:9551:52
    at Array.map (<anonymous>)
    at Index (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/src/routes/index.tsx:6186:9)
    at Object.react_stack_bottom_frame (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:14140:12)
    at renderWithHooks (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:4398:19)
    at updateFunctionComponent (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:5773:16)
    at beginWork (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:6389:20)
    at runWithFiberInDEV (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:943:66)
    at performUnitOfWork (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:9146:92)
    at workLoopSync (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:9042:37)
error 3: %o

%s

%s ReferenceError: Filter is not defined
    at https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/src/routes/index.tsx:9551:52
    at Array.map (<anonymous>)
    at Index (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/src/routes/index.tsx:6186:9)
    at Object.react_stack_bottom_frame (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:14140:12)
    at renderWithHooks (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:4398:19)
    at updateFunctionComponent (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:5773:16)
    at beginWork (https://ais-dev-qr7b7j46r5yv52es5uzhcu-94725394228.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=6566324c:6389:20)
    ... [3 frames omitted]
[AIS_METADATA_SECTION_END]
```

---

### Prompt 53: Remove Redundant Sequence Control & TTS Order Column (Superseded by Video Precedence Bar)
```
those items are redundunt now after having the video precedence bar
Apply style changes to the selected element(s).
[AIS_METADATA_SECTION_START]
CSS selector 1: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(3)
CSS 1: {

}
CSS selector 2: div#root:nth-of-type(1) > div:nth-of-type(1) > div:nth-of-type(4) > details:nth-of-type(3) > div:nth-of-type(1) > div:nth-of-type(3) > table:nth-of-type(1) > thead:nth-of-type(1) > tr:nth-of-type(1) > th:nth-of-type(7)
CSS 2: {

}
[AIS_METADATA_SECTION_END]
```

---

### Prompt 54: Subtitles-Table on Stage 3, Auto-Focus/Auto-Scroll Disablement, Learning Goals Stage 1 & Video Final Stage, Video Resume Causes & Fixes
```
1. the demo website doesnt include a subtitles-table-view on stage 3
2. create docs/auto-focus.md - create table of auto-focus /auto-scroll triggers - and disable all of them !
3. the first stage should be learning-goals. the last stage should be the video and the video shouldn't be shown on any other stage
4. list the reasons why the app doesnt resume the video after it pauses docs/stop.md  - and remove all of them.
```

---

### Prompt 55: TTS Blacklist / Whitelist, Up to 1:20 Ratio, localStorage Persistence, and Export/Import Application Settings
```
languages goal - whitelist/blacklist - allow to set languages to be on the black-list of tts-play - in that case even if the default subtitles are X , then X would be skipped for tts-play.
allow tts-ratio to be up to 1:20 ratio.
tts-ration is to be stored using local-storage.
2
add option to export/import application settings
```

---

### Prompt 56: Fix App Errors (getTtsFallbackOrder, isLanguageTtsBlacklisted, SwitchableDefaultSubtitlesBar useState Hook Error)
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: [vite] SyntaxError: The requested module '/src/lib/alternative-tts.ts' does not provide an export named 'getTtsFallbackOrder'
error 1: [vite] Failed to reload /src/routes/index.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 2: [vite] SendBeforeConnectError: send was called before connect
    at Object.send (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:384:15)
    at HMRClient.send (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:161:18)
    at HMRContext.send (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:123:18)
    at HMRContext.invalidate (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:92:8)
    at https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/components/VideoPlayground.tsx:990:46
    at https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:70:95
    at https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:222:52
    at https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:200:55
    at Array.forEach (<anonymous>)
    at HMRClient.queueUpdate (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/@vite/client:200:33)
error 3: [vite] SyntaxError: The requested module '/src/lib/playback-preferences.ts' does not provide an export named 'isLanguageTtsBlacklisted'
error 4: [vite] Failed to reload /src/components/beginner/PerLanguageTtsPreferences.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 5: Invalid hook call. Hooks can only be called inside of the body of a function component. This could happen for one of the following reasons:
1. You might have mismatching versions of React and the renderer (such as React DOM)
2. You might be breaking the Rules of Hooks
3. You might have more than one copy of React in the same app
See https://react.dev/link/invalid-hook-call for tips about how to debug and fix this problem.
error 6: [APP_BOOT_ERROR] Router rendered ErrorComponent: This page didn't load Cannot read properties of null (reading 'useState')
error 7: [APP_PAGE_ERROR] This page didn't load: Cannot read properties of null (reading 'useState')
error 8: TypeError: Cannot read properties of null (reading 'useState')
    at exports.useState (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react.js?v=8cb0b07d:769:30)
    at SwitchableDefaultSubtitlesBar (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/components/SwitchableDefaultSubtitlesBar.tsx?t=1793742056192:23:36)
    at Object.react_stack_bottom_frame (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:14140:12)
    at renderWithHooks (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:4398:19)
    at updateFunctionComponent (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:5773:16)
    at beginWork (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:6389:20)
    at runWithFiberInDEV (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:943:66)
    at performUnitOfWork (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:9146:92)
    at workLoopSync (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/dep
    ... [stack truncated]
error 9: %o

%s

%s TypeError: Cannot read properties of null (reading 'useState')
    at exports.useState (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react.js?v=8cb0b07d:769:30)
    at SwitchableDefaultSubtitlesBar (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/src/components/SwitchableDefaultSubtitlesBar.tsx?t=1793742056192:23:36)
    at Object.react_stack_bottom_frame (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:14140:12)
    at renderWithHooks (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:4398:19)
    at updateFunctionComponent (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:5773:16)
    at beginWork (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:6389:20)
    at runWithFiberInDEV (https://ais-dev-o4fswksomoqcbae6o4fp6v-515898758927.europe-west1.run.app/node_modules/.vite/deps/react-dom_client.js?v=74830f5e:943:66)
    ... [3 frames omitted]
[AIS_METADATA_SECTION_END]
```

---

### Prompt 57: Slow / Fast Mode (Hide & Disable Non-Obligatory Elements by Default, docs/disable_and_hide.md, Disable-All/Enable-All in Settings)
```
slow/fast mode - by default dont use&show all elements which are not obligatory for the function of the app. this should be listed on docs/disable_and_hide.md. allow to disable-all/enable-all on the settings.
```

---

### Prompt 58: Fix App Errors (Vite Reload & TypeScript Compiler Errors across index.tsx, settingsBackupManager, SwitchableDefaultSubtitlesBar, StorybookWorkbench)
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: [vite] Failed to reload /src/components/LanguageBoxesSelector.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 1: [vite] Failed to reload /src/components/beginner/BeginnerFlowContainer.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 2: [vite] Failed to reload /src/styles.css. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 3: [vite] Failed to reload /src/components/SubtitlesTablePanel.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 4: [vite] Failed to reload /src/routes/index.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 5: [vite] Failed to reload /src/components/NetworkRequestsInspector.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 6: [vite] Failed to reload /src/components/AiSubtitlePunctuationTab.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 7: [vite] Failed to reload /src/components/beginner/tabs/BeginnerPreferencesTab.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 8: [vite] Failed to reload /src/components/ExternalTtsDebuggerPanel.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
error 9: [vite] Failed to reload /src/components/beginner/PerLanguageTtsPreferences.tsx. This could be due to syntax errors or importing non-existent modules. (see errors above)
[AIS_METADATA_SECTION_END]
```

---

### Prompt 59: Hotfix Maximum Update Depth Exceeded & getSnapshot Caching in useSyncExternalStore
```
Fix the errors in the app
[AIS_METADATA_SECTION_START]
fix_it_trigger: manual
error 0: The result of getSnapshot should be cached to avoid an infinite loop
error 1: [APP_BOOT_ERROR] Router rendered ErrorComponent: This page didn't load Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
error 2: [APP_PAGE_ERROR] This page didn't load: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
error 3: Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at getRootForUpdatedFiber (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:2784:166)
    at enqueueConcurrentRenderForLane (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:2774:11)
    at forceStoreRerender (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:4770:15)
    at updateStoreInstance (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:4752:36)
    at Object.react_stack_bottom_frame (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:14176:13)
    at runWithFiberInDEV (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:943:66)
    at commitHookEffectListMount (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:6899:153)
    at commitHookPassiveMountEffects (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-w
    ... [stack truncated]
error 4: %o

%s

%s Error: Maximum update depth exceeded. This can happen when a component repeatedly calls setState inside componentWillUpdate or componentDidUpdate. React limits the number of nested updates to prevent infinite loops.
    at getRootForUpdatedFiber (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:2784:166)
    at enqueueConcurrentRenderForLane (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:2774:11)
    at forceStoreRerender (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:4770:15)
    at updateStoreInstance (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:4752:36)
    at Object.react_stack_bottom_frame (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:14176:13)
    at runWithFiberInDEV (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:943:66)
    at commitHookEffectListMount (https://ais-dev-ypeejppykfdal26vcakg74-778504381984.europe-west2.run.app/node_modules/.vite/deps/react-dom_client.js?v=c9b35bb5:6899:153)
    ... [3 frames omitted]
[AIS_METADATA_SECTION_END]
```


