# YouTube JSON3 Subtitles Sentence Splitting & Timing Architecture

This specification documents how to segment raw YouTube `json3` timedtext subtitles into short, readable sentences, and how acoustic time calculations solve the fundamental flaws of pure punctuation-based splitting.

---

## 1. Overview: The Subtitle Segmentation Challenge

Video subtitles are authored for **visual screen display** (2 lines of ~35 characters displayed for 2–5 seconds), **not for grammatical or pedagogical sentence structure**.

When building parallel language tables, foreign language learners and translation tools need coherent, complete **sentences**, not arbitrary subtitle screen fragments.

However, raw YouTube captions pose major challenges:

- **Authored captions** often split a single grammatical sentence across 3 or 4 sequential screen cues.
- **Auto-generated (ASR) captions** frequently lack punctuation altogether, or stream a run-on block spanning 30+ seconds.
- **Machine-translated tracks** frequently shift word order, placing punctuation marks at completely different time offsets than the original spoken audio.

---

## 2. Understanding the YouTube `json3` Schema

YouTube's timedtext service returns subtitle cues in a proprietary `json3` format with the following core schema:

```json
{
  "wireMagic": "pb3",
  "pens": [{}],
  "wsWinStyles": [{}],
  "wpWinPositions": [{}],
  "events": [
    {
      "tStartMs": 1420,
      "dDurationMs": 2840,
      "segs": [
        { "utf8": "Hello ", "tOffsetMs": 0 },
        { "utf8": "world, ", "tOffsetMs": 420 },
        { "utf8": "how ", "tOffsetMs": 950 },
        { "utf8": "are ", "tOffsetMs": 1400 },
        { "utf8": "you?", "tOffsetMs": 1920 }
      ]
    }
  ]
}
```

### Key Properties:

- **`events[]`**: Chronological sequence of caption cue blocks.
- **`tStartMs`**: Absolute start timestamp of the cue block in milliseconds from video origin.
- **`dDurationMs`**: Visual duration of the cue block on screen.
- **`segs[]`**: Sub-segments within the cue. In human-authored captions, this often contains a single segment with the entire line text. In word-timed ASR captions, each word has its own segment.
- **`utf8`**: The text content of the segment.
- **`tOffsetMs`**: The intra-cue relative offset in milliseconds from `tStartMs` when this specific word was uttered.

---

## 3. Splitting by Punctuation Characters (Default Strategy)

By default, human readers expect subtitles to split into sentences using punctuation characters:

### Punctuation Marks Recognized

- **Western Sentence Terminators**: Period (`.`), Question Mark (`?`), Exclamation Mark (`!`).
- **Full-Width & CJK Stops**: Full-width period (`。`), Full-width question/exclamation marks.
- **Right-to-Left (Arabic/Hebrew) Terminators**: Arabic question mark (`؟`), Arabic full stop (`۔`).
- **Ellipses & Quote Pairs**: Horizontal ellipsis (`…`), combinations with quotation marks (`."`, `!"`, `?'`, `.)`).
- **Optional Secondary Clause Breaks**: Commas (`,`, `،`), semicolons (`;`, `؛`), colons (`:`).

### Sentence Termination Regex

```regex
/[.?!…。؟]["'»)”]*$/
```

When iterating over caption cues in the base (pivot) track, whenever a cue ends with a sentence-terminating punctuation character, the parser registers a section cut at the start of the subsequent cue (`pv[i + 1].start`). The **Pure Sentences** preset also splits punctuation occurring inside a cue. When JSON3 segment timing offsets exist, the cut is interpolated across the segment's text and timing; for a single unsegmented text payload, the event duration is interpolated by text position. This option is controlled by the sentence criterion's **Split sentences inside a subtitle cue** checkbox. Pure Sentences applies punctuation boundaries without minimum- or maximum-duration section clamps.

Each parser criterion checkbox enables or disables only its named criterion. An explicitly empty selection disables all criteria; it is not silently replaced with sentence punctuation.

---

## 4. Why Pure Punctuation Splitting Fails in Practice

Relying exclusively on punctuation characters creates severe issues when parsing video subtitles:

| Issue                         | Manifestation in Pure Punctuation Splitting                                                                  | User Experience Impact                                                                                     |
| :---------------------------- | :----------------------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Missing Punctuation (ASR)** | YouTube auto-generated captions often contain zero periods or question marks for minutes at a time.          | Subtitles collapse into an enormous single block spanning minutes of video.                                |
| **Abbreviations & Numbers**   | Strings like `Dr. Smith`, `e.g.`, `U.S.A.`, or `version 3.14` trigger false cuts.                            | Sentences get split in half unnaturally (e.g., "Dr." on row 1, "Smith arrived" on row 2).                  |
| **Run-on Speech**             | Passionate or fast speakers speaking for 20+ seconds without pausing or concluding a sentence.               | Overcrowded table rows that overflow the mobile viewport and desynchronize TTS.                            |
| **Cross-Language Drift**      | English puts a period at word 8 (4.2s), but German verb placement delays the sentence end to word 14 (7.8s). | Parallel table rows desynchronize; English displays sentence 2 while German is still finishing sentence 1. |
| **Sub-Second Slivers**        | Rapid exclamation tags like "Oh!" or "No!" create 300ms cue blocks.                                          | Flickering subtitle transitions and stuttering audio playback.                                             |

---

## 5. How Timing Calculations Eliminate Splitting Issues

To solve the limitations of punctuation-only parsing, timing features leverage acoustic signals and temporal alignment math.

### 5.1 Natural Speech Pauses (`pauseTimes`)

In word-timed (ASR) tracks, each word includes a `tOffsetMs`. The parser calculates the silence gap between consecutive words:

$$\Delta t = (\text{tStartMs} + \text{tOffsetMs}_{i}) - (\text{tStartMs} + \text{tOffsetMs}_{i-1})$$

When $\Delta t \ge 500\text{ ms}$, the speaker took a breath or paused speaking. Even if the speaker omitted a period, this acoustic silence represents a natural sentence or clause boundary.

#### Snapping to Translation Boundaries

Acoustic gaps occur at continuous millisecond timestamps. To prevent cutting across translation subtitles, the detected pause timestamp $g$ is snapped to the nearest subtitle cue start $s$ across parallel tracks:

$$\text{cut} = \arg\min_{s \in \text{cueStarts}} |s - g| \quad \text{subject to } |s - g| \le 1200\text{ ms}$$

### 5.2 Context Window Clamping (`fromCuts`)

To prevent run-on sentences from expanding indefinitely, the parser enforces minimum and maximum temporal boundaries:

- **Minimum Duration (`minSectionMs = 1500ms`)**: If a punctuation mark occurs less than 1.5 seconds after the previous cut, it is suppressed to prevent tiny fragments.
- **Maximum Duration (`maxSectionMs = 12000ms–20000ms`)**: If no punctuation or pause occurs within 12–20 seconds, the parser cleanly subdivides the section at the most balanced intermediate cue.

### 5.3 Multi-Track Timing Consensus (`consensus`)

Parallel subtitle tracks often drift. By clustering the start times of all cues across all active languages within a tolerance window (e.g. $\pm 400\text{ ms}$):

$$\text{Cluster}(t_1, t_2, \dots, t_k) \quad \text{where } |t_a - t_b| \le 400\text{ ms}$$

When a majority of translation languages ($\ge 50\%$) initiate a new caption cue within the same cluster, this indicates a universal thought transition across all languages, anchoring the table row.

### 5.4 Multi-Track Punctuation Agreement (`punctVote`)

Instead of trusting the punctuation of only one language, the parser collects sentence-ending marks across all parallel tracks. When 2 or more language tracks simultaneously end a sentence within a 500ms cluster, a cut is guaranteed.

---

## 6. Comparison Matrix: Splitting Methods

| Criteria                          | Punctuation Only | Speech Pauses | Window Clamp | Multi-Track Consensus | Hybrid (Punct + Timing) |
| :-------------------------------- | :--------------- | :------------ | :----------- | :-------------------- | :---------------------- |
| **Handles Grammatical Sentences** | Excellent        | Fair          | Poor         | Good                  | **Excellent**           |
| **Handles Unpunctuated ASR**      | Fails (Run-ons)  | Excellent     | Good         | Good                  | **Excellent**           |
| **Prevents Viewport Overflow**    | Poor             | Fair          | Excellent    | Good                  | **Excellent**           |
| **Aligns Parallel Translations**  | Fair             | Fair          | Fair         | Excellent             | **Excellent**           |
| **Eliminates Sub-Second Slivers** | Poor             | Good          | Excellent    | Good                  | **Excellent**           |

---

## 7. Interactive Experimentation in the Application

The application provides an interactive **Parser Panel** allowing users to experiment with these features live:

1. **Default Mode (Pure Punctuation)**:
   - Uses sentence-ending characters (`.`, `?`, `!`, `…`, `。`, `؟`).
   - Ideal for professionally authored, well-punctuated videos.
2. **Timing-Enhanced Mode (Speech Pauses + Punctuation)**:
   - Detects $>500\text{ ms}$ pauses in audio to split speech where punctuation was omitted.
   - Eliminates run-on monologues on conversational videos.
3. **Multi-Track Consensus Mode**:
   - Compares timing and punctuation across all selected favorite languages.
   - Snaps parallel columns so sentences start and end synchronously.
4. **Custom Tuning**:
   - Configure minimum pause length, snap tolerance, minimum words per sentence, and context window clamps.

## 8. Native Timed-Cue Boundaries and Live Parser Settings

The current parallel-table simple parser treats every valid JSON3 event as an independent timed source cue. It may split text **inside that event** according to the selected punctuation settings, interpolating the resulting row times within the event duration. It never concatenates text from separate native events into one row. When **Intra-cue splitting** is off, each native timed cue is rendered as its own row.

On-demand translations are indexed against the parsed source rows. Changing parser settings therefore clears index-aligned on-demand results, discards any late results from the previous parser configuration, and requests translations for the newly parsed rows. This keeps the target-language column aligned with the currently displayed source rows.
