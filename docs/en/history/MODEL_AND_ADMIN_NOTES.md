# Earlier model selection and Admin design notes

**English** · [Tiếng Việt](../../vi/history/MODEL_AND_ADMIN_NOTES.md) · [Documentation index](../README.md)

This section was separated from recommendations and archived on 03/10/2026. The following records earlier proposals; model descriptions are not current recommendations. The initial Admin design also does not replace the current [API](../API.md) and [architecture](../ARCHITECTURE.md).

The earlier note recommended **GPT‑6.1 Sol** as MemeMap's main Codex model because frontend, backend, maps, images and authentication require understanding several parts while balancing cost. It described Sol as balancing capability and cost, and **GPT‑6 Astra** as the strongest choice for complex problems, linking to the [official model documentation](https://developers.openai.com/api/docs/models).

- **GPT‑6.1 Sol** — everyday feature development and fixes.
- **GPT‑6 Astra** — difficult bugs, broad refactoring and deeper reasoning.
- **GPT‑6 Luna** — small, clear requests such as copy, documentation or simple CSS.

For the model list in the screenshot discussed at that time, the recommendation was GPT‑6.1 Sol by default.

| Effort | Earlier suggested use |
| --- | --- |
| **Low** | Copy, icons, fonts, colors or minor edits |
| **Medium** | Simple features, ordinary UI fixes or documentation |
| **High** | Backend, login, media processing, animations and map/menu coordination |
| **Xhigh / Max** | Hard-to-reproduce bugs, repeated failed fixes or broad refactoring |

| Feature | Admin location | Proposed layout and interaction |
| --- | --- | --- |
| **Hide/restore memes** | **Memes** tab | Rows show title, author, date, aura and status. Open details with **View on map** and **Hide meme**. Hidden items offer **Restore**. Hiding asks for a reason. **Permanent delete** belongs in the `⋯` menu to reduce accidental clicks. |
| **Meme reports** | **Reports** tab | **Pending · Reviewing · Resolved** filters. Group reports by meme, show count and common reasons. Details show content and individual reports; hide or dismiss with a handling note. |
| **Pin search and filters** | Top of **Memes** | Search title, story or `@username`. Filters cover status, dates and images. Sort newest/oldest/highest or lowest aura; show results count and clear filters. |
| **Posting/voting restrictions** | **Users** → account details | Show name, username, meme count, aura and restrictions. Restrict posting, voting or both with duration/reason. Show current restrictions and a lift action. |
| **Administrative history** | History button beside Admin title | A subview with a back action. Rows show administrator, action, target, time and reason. Filter by action/actor. Meme/account details link to that target's history. |
| **Spam detection** | **Overview** alerts; labels in **Memes/Users** | Show concrete signs such as posting bursts, repeated content and unusual votes. Open the target and evidence. Initially flag for human review; administrators decide whether to hide or restrict. |
| **Basic statistics** | **Overview** | Prioritize **Pending reports** and **Spam alerts**, then new memes, new users and image storage for **Today · 7 days · 30 days**. Selecting a metric opens its related list. |
