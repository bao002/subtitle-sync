# Current Subtask (`current-sub-task.md`)

## Active Subtask: Subtask 138.1 - Clean Subtitles Table View on Video Change
- **Description**: Ensure subtitles table view is completely cleared and reset when a video is loaded after another. When `videoId` transitions, flush `tracks`, `rawTracks`, `rows`, `active`, `playedTtsRecords`, and `subtitlesPage` so previous video subtitles never linger in the table while the new video is loading or if the new video has no subtitles.
- **Status**: IN PROGRESS.
