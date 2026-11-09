# Football goals and assists: source verification

**TL;DR:** The exact historical chart is not ready for implementation: its image and author source remain unverified, and the accessible updated dataset has severe career-coverage gaps.

Research date: 2026-11-08. Research only. No app code, credentials, commits, deployment, or access-control work was used. HTTP downloads were parsed in memory. This document is the only project file changed.

## 1. Original chart: evidence and unresolved details

User reference: [the original Reddit post](https://www.reddit.com/r/soccer/comments/umidk9/oc_who_have_been_the_biggest_goalscoring_and/).

The user confirmed a named-player bubble chart with Messi and Beckham. This is user-provided context, not independent image verification.

The search index returned this excerpt for that exact Reddit URL:

> This graph plots players based on their total non-penalty goals and assist rates in domestic leagues. The code and data to build this is

This is useful discovery evidence, but not enough to establish the chart specification. In particular, the excerpt contains both “total” and “rates.” Do not infer raw totals, a per-90 denominator, or axis orientation from it alone.

Direct access did not return the post. The ordinary page returned an HTML JavaScript challenge instead of post content. Reddit's JSON endpoint returned HTTP 403. The old Reddit page returned only a skip link. No challenge was solved, proxy used, authentication attempted, or access restriction bypassed.

| Original property | Verified status |
| --- | --- |
| Post URL | Supplied by user; also present in search results |
| Messi and Beckham, named bubbles | Confirmed by user, not independently read from image |
| Non-penalty goals | Supported by indexed post excerpt, not image inspection |
| Domestic leagues | Supported by indexed post excerpt; exact league set unknown |
| X versus Y orientation | Unverified |
| Per 90 versus another rate versus totals | Unverified |
| Period and cutoff | Unverified |
| Whole careers versus available seasons | Unverified |
| Bubble area or radius encoding | Unverified; minutes is only a hypothesis |
| Minimum minutes | Unverified |
| Original author and linked code/data | Unverified |
| Original image URL and image reuse rights | Unverified |

**Required next input:** the original image and the author's source/code link, or copied post text including the source comment. These are ordinary public artifacts, not credentials. Until then, describe any new chart as an adaptation with explicitly chosen settings, not an exact reproduction.

## 2. Transfermarkt-derived public dataset: downloadable, but unsuitable for full careers

### Publisher, provenance, and freshness

[David Cariboo's transfermarkt-datasets](https://github.com/dcaribou/transfermarkt-datasets) is a third-party collection of Transfermarkt data, not an official Transfermarkt bulk release. The [README](https://raw.githubusercontent.com/dcaribou/transfermarkt-datasets/master/README.md) describes joinable CSV tables and a DuckDB database. The [Kaggle metadata API](https://www.kaggle.com/api/v1/datasets/view/davidcariboo/player-scores) explicitly says that the data was scraped from Transfermarkt.

The maintainer's [status announcement](https://github.com/dcaribou/transfermarkt-datasets/discussions/383) says updates stopped in mid-July 2026, with no restart date. It gives these cutoffs:

- Games and game events: 2026-07-06.
- Appearances: 2026-06-28.
- Player valuations: 2026-06-12.
- Player squads: no `last_season` beyond 2025; no 2026/27 squads.

The Kaggle metadata response reports version **679**, `lastUpdated = 2026-09-05T09:16:22.72Z`. This is the dataset publication date, not the latest match date. The maintainer's statement about the August Kaggle build predates this September metadata. Neither date proves newer football coverage.

### Actual download verification

The README advertises `https://pub-e682421888d945d684bcae8890b0ec20.r2.dev/data/`. Ordinary GETs for `appearances.csv.gz`, `players.csv.gz`, and `competitions.csv.gz` all returned **403** here. Those URLs are not verified working downloads in this environment.

The publisher also distributes the dataset through Kaggle. These public file downloads returned **HTTP 200**, without credentials, and yielded actual parsed CSV bytes:

| File and direct endpoint | Verified bytes |
| --- | ---: |
| [appearances.csv](https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores/appearances.csv) | 198,398,405 |
| [players.csv](https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores/players.csv) | 19,624,138 |
| [competitions.csv](https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores/competitions.csv) | 12,247 |

The [public file-list API](https://www.kaggle.com/api/v1/datasets/list/davidcariboo/player-scores) also lists these files. At this research date, the endpoints returned plain CSV, not a ZIP. An importer must inspect its actual response rather than assume an archive format.

`appearances.csv` SHA256:

```text
c4ba5327f9005e4a9914c0f78c3b07132ef2cf1a4babda379bbf54ffd207ebec
```

Parsed header:

```csv
appearance_id,game_id,player_id,player_club_id,player_current_club_id,date,player_name,competition_id,yellow_cards,red_cards,goals,assists,minutes_played
```

Full-file checks found **1,894,350 rows**, from **2012-07-03 through 2026-06-28**. No empty `goals`, `assists`, or `minutes_played` fields were found. This does not establish complete historical assist recording: a numeric zero can still represent an upstream default or an unrecorded contribution.

### Historical and current player coverage: measured, not inferred from profiles

The following figures were calculated from all appearance rows for each exact player ID. They include all competitions represented for that player and are **not career totals**.

| Player | ID | Rows | First appearance | Last appearance | Goals | Assists | Minutes |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: |
| David Beckham | 3139 | 12 | 2013-02-24 | 2013-05-18 | 0 | 2 | 391 |
| Lionel Messi | 28003 | 529 | 2012-08-19 | 2026-06-28 | 458 | 224 | 44,940 |
| Cristiano Ronaldo | 8198 | 485 | 2012-08-19 | 2026-06-28 | 434 | 114 | 41,420 |
| Erling Haaland | 418560 | 292 | 2019-09-17 | 2026-06-23 | 259 | 52 | 23,636 |
| Kylian Mbappé | 342229 | 429 | 2015-12-02 | 2026-06-26 | 330 | 114 | 33,003 |

Source for these computed results: the exact [appearance file](https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores/appearances.csv) identified by the hash above. Names and IDs were checked against the [player file](https://www.kaggle.com/api/v1/datasets/download/davidcariboo/player-scores/players.csv).

Important findings:

- Beckham has only **10 Ligue 1 rows: 0 goals, 2 assists, 314 minutes**, and **2 Champions League rows: 0 goals, 0 assists, 77 minutes**. His Manchester United, Real Madrid, Milan, and LA Galaxy periods are not represented in these appearances. A 900-minute or career-size threshold would exclude him. It must not be lowered merely to force his name onto the chart.
- Messi's appearances contain La Liga, Ligue 1, various cups, and three 2026 World Cup matches, but **no MLS rows**. His profile says Inter Miami. A current club profile is not proof of appearance coverage.
- Ronaldo's appearances contain European clubs and three 2026 World Cup matches, but **no Saudi Pro League rows**, despite his Al-Nassr profile.
- Haaland's first row is a 2019 Champions League appearance, not the beginning of his senior career.
- `competitions.csv` includes `MLS1`, `SA1`, and many other league IDs. **Neither `MLS1` nor `SA1` occurs anywhere in the downloaded appearance file.** Do not use the competition catalog as the coverage manifest.
- Appearance rows contain IDs missing from the downloaded competition table, including `KLUB`, `CGB`, `POCP`, and `UKRS`. Check join completeness before assigning competition scope.

These are concrete blockers for a Beckham-versus-current-players career chart. The file can support an explicitly limited observed-period chart, but not the requested historical comparison without another source.

### Latest real domestic coverage

Measured from the appearance rows, not repository activity:

| Competition | ID | Latest appearance date |
| --- | --- | --- |
| Premier League | GB1 | 2026-05-24 |
| La Liga | ES1 | 2026-05-24 |
| Serie A | IT1 | 2026-05-24 |
| Bundesliga | L1 | 2026-05-16 |
| Ligue 1 | FR1 | 2026-05-17 |
| Danish Superliga | DK1 | 2026-03-01 |
| Scottish Premiership | SC1 | 2026-04-12 |
| MLS | MLS1 | No rows |
| Saudi Pro League | SA1 | No rows |

A latest date alone does not prove all fixtures or all player appearances are present. For example, league splits and playoffs can have different IDs. Verify expected fixtures and player coverage before describing any season as complete. The latest World Cup rows do not make the domestic data current to June.

### Units, penalties, and reuse terms

- The appearance file supplies match-level integer goals, assists, and minutes. Per-90 values can be calculated from those fields for the **same selected rows**.
- There is **no penalty-goals field** in the appearance file. Therefore it cannot directly reproduce a non-penalty-goal chart. `game_events` would need a separate, audited penalty classification and a validated join, or a different source must supply penalty goals. This research did not verify that reconstruction.
- The project [LICENSE](https://raw.githubusercontent.com/dcaribou/transfermarkt-datasets/master/LICENSE) is CC0 1.0. Kaggle metadata also labels the dataset CC0/Public Domain.
- This is the third-party publisher's license declaration, not an official Transfermarkt grant. CC0 section 4(c) expressly does not clear third-party rights. Do not claim that scraping or public download alone resolves the upstream rights question.
- Retain attribution and provenance regardless of CC0. Do not copy player portraits or logos merely because their URLs occur in the CSV; asset rights are separate.

## 3. StatsBomb Open Data: primary provider, real files, selected coverage

[StatsBomb's own repository](https://github.com/statsbomb/open-data) provides JSON, with [competition/season metadata](https://raw.githubusercontent.com/statsbomb/open-data/master/data/competitions.json), per-season match lists, per-match events, and lineups. This is a primary source, unlike the Transfermarkt-derived mirror.

The competitions file downloaded successfully. Its latest listed season is Women's Euro **2025**. Metadata timestamps in 2026 describe data updates, not 2026 matches. Men's coverage includes Euro 2024 and Copa América 2024, Bundesliga 2023/24, selected MLS 2023, and many selected historical seasons. There is no 2026 World Cup season in the downloaded manifest.

Actual downloaded match-list examples:

| Direct JSON file | Matches | Actual match dates |
| --- | ---: | --- |
| [Premier League 2003/04](https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/2/44.json) | 38 | 2003-08-16 to 2004-05-15 |
| [La Liga 2006/07](https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/11/39.json) | 26 | 2006-08-28 to 2007-06-17 |
| [Euro 2024](https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/55/282.json) | 51 | 2024-06-14 to 2024-07-14 |
| [Women's Euro 2025](https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/53/315.json) | 31 | 2025-07-02 to 2025-07-27 |
| [MLS 2023](https://raw.githubusercontent.com/statsbomb/open-data/master/data/matches/44/107.json) | 6 | 2023-08-27 to 2023-10-22 |

The historical league examples are clearly not full league schedules. Do not treat every competition-season entry as a complete season for all players. An opponent who appears in selected Messi matches does not have the same career coverage as Messi.

Event data can support goals, penalty classification, and provider-defined goal assists. Minutes require a documented method using lineups, substitutions, dismissals, periods, and match endings. These are event-derived values, not a verified ready-made career totals file. Selected historical matches cannot supply complete Beckham career values or present-day domestic league coverage.

### Terms are more restrictive than the README summary

The [README](https://raw.githubusercontent.com/statsbomb/open-data/master/README.md) permits public research and asks for StatsBomb attribution and its logo. However, the actual [Public Data User Agreement PDF](https://raw.githubusercontent.com/statsbomb/open-data/master/LICENSE.pdf), downloaded and extracted during this research, contains important restrictions:

- Section 1.1: access for analysis, research, and shared understanding.
- Section 1.2.1: prohibits distributing, reproducing, selling, or providing the data to external or third parties.
- Section 1.2.2: prohibits commercial exploitation of the data **or derived analysis**.
- Section 1.4: requires the StatsBomb brand logo on published analysis.
- Section 7: reserves data rights and requires express permission except where the agreement permits use.
- The PDF says its terms were last updated **8 September 2023**.

Thus, this is not unrestricted open-license data. A noncommercial published analysis with attribution is different from redistributing raw events or a downloadable database. Obtain clarification before shipping browser-readable row-level extracts or commercial use. Even with permission, its coverage does not satisfy the requested updated historical chart.

## 4. Other candidates and why they do not close the gap

### FBref

[David Beckham's indexed FBref profile](https://fbref.com/en/players/53539318/David-Beckham) advertises domestic league standard statistics and CSV/Excel exports. This suggests a possible route to the original kind of data, but the page itself returned **403** here. The [coverage page](https://fbref.com/en/about/coverage) and [Sports Reference data-use terms](https://www.sports-reference.com/data_use.html) also returned **403**. No legitimate current bulk download and reuse grant were verified. Do not promise an automated FBref import based on search snippets or export-button labels.

### worldfootballR_data

The [maintainer's README](https://raw.githubusercontent.com/JaseZiv/worldfootballR_data/master/README.md) says the repository and package are archived and no longer maintained. It identifies its data as scraped from FBref, Transfermarkt, Understat, and FotMob.

The [GitHub directory API](https://api.github.com/repos/JaseZiv/worldfootballR_data/contents/data/fb_big5_advanced_season_stats) lists actual RDS files, including [big5_player_standard.rds](https://raw.githubusercontent.com/JaseZiv/worldfootballR_data/master/data/fb_big5_advanced_season_stats/big5_player_standard.rds), listed at 1,882,342 bytes. This research verified the file listing, not decoded RDS rows or a current data cutoff. No RDS reader was available. Do not present its latest real season, historical Beckham coverage, or upstream data reuse rights as verified. An archived scrape is not a continuing primary feed.

### Fantasy Premier League

The [vaastav dataset README](https://raw.githubusercontent.com/vaastav/Fantasy-Premier-League/master/README.md) says weekly updates stopped after 2024/25, with only three planned updates each season. It documents player CSVs from 2016 onward. This excludes Beckham and Messi's club career and uses fantasy-game assists. It is not a substitute for a consistent historical provider definition.

### Public Transfermarkt API mirror

The [API project's own README](https://raw.githubusercontent.com/felipeall/transfermarkt-api/main/README.md) describes club player statistics by season/competition/club. It also explicitly states that its **MIT license covers code, not data**, that the upstream API is internal and undocumented, and that the public deployment is only for testing and rate limited. Its [OpenAPI document](https://transfermarkt-api.fly.dev/openapi.json) was accessible, but current player payload coverage and an upstream reuse grant were not verified. A public mirror must not be used to evade an upstream block. It is not a production data contract.

### Football match-result CSV projects

[footballcsv/england](https://raw.githubusercontent.com/footballcsv/england/master/README.md) publishes public-domain team match results. The documented schema contains teams and scores, not player goals, assists, and minutes. Open reuse terms do not make it suitable for this chart.

## 5. Historical assist comparability

Assist counts must retain their provider and definition. They are not safely interchangeable across sites or eras.

A direct example concerns Beckham in MLS. [MLS's own profile](https://www.mlssoccer.com/players/david-beckham/) says he had **10 assists in 2008**. The [indexed FBref profile](https://fbref.com/en/players/53539318/David-Beckham) lists **8** for that season. The official MLS profile was available through the search index; FBref direct access was blocked, so this is a discrepancy to investigate, not a resolved reconciliation. Do not combine either number with another provider's career totals without checking definitions, including secondary assists.

The [official FIFA 2022 scoring summary](https://www.fifa.com/en/articles/top-goalscorers-leading-marksmen-golden-boot-fifa-world-cup-qatar-2022) says World Cup assists are determined by its Technical Study Group. A FIFA tournament assist total therefore needs its own definition and scope. It is not an automatic extension of a domestic league provider's record.

The Transfermarkt appearance file beginning in July 2012 proves a separate coverage issue even before comparing definitions. A sum beginning in 2012 is not a player's full career. Adding missing career goals from another site while retaining covered-period assists and minutes produces invalid rates.

Required safeguards:

1. Keep unknown or unrecorded assists as `null`, not zero.
2. Use one assist definition and provider within a comparison cohort, or separate cohorts visibly.
3. Compute numerator and denominator from exactly the same competition/date/player rows.
4. Exclude national teams, cups, youth/reserve competitions, and friendlies when the selected scope is domestic senior leagues.
5. Distinguish domestic top division from all domestic divisions. Do not silently add missing lower-league seasons.
6. Label results “covered-period totals” unless complete career coverage has been established for every included player.
7. Do not use a shared start date to hide unequal pre-period careers. A 2012 start truncates Beckham very differently from Mbappé.
8. Do not join on player display names. Preserve provider player IDs and an audited identity mapping.

## 6. Supported implementation contract and blockers

### Full requested chart: blocked

Do not implement a claimed updated reproduction or all-time career comparison yet. Two independent gates remain:

1. **Original-specification gate:** obtain the image and author source to verify units, penalties, exact leagues, dates, bubble encoding, and minimum minutes.
2. **Data gate:** obtain permission-compatible goals, assists, penalty goals, and minutes with verified historical coverage for Beckham and verified recent coverage for current players. No source tested here meets all of these requirements.

Do not fabricate coordinates, infer totals from rounded rates, or call a limited dataset “career data.” A new illustration with invented values would not meet the user's request.

### Limited alternative that is technically supported

If the user explicitly accepts changed scope and the publisher/upstream rights question is resolved, the downloaded Transfermarkt-derived CSV can support:

- Title: **Goals and assists in covered domestic league appearances since 2012**.
- Scope: an explicit, versioned allowlist of competition IDs, with a verified fixture-coverage manifest for each season. The five large European leagues are `GB1`, `ES1`, `IT1`, `L1`, and `FR1`.
- Dates: source observations only. Publish per-league latest dates, not one misleading “updated today” label.
- X: `90 * sum(goals) / sum(minutes_played)`.
- Y: `90 * sum(assists) / sum(minutes_played)`.
- Both rates use penalty-inclusive goals and source-defined assists. Clearly state that this differs from the indexed original's non-penalty description.
- Optional totals view: use the same selected rows, and label totals as covered-period totals.
- Bubble **area**, not radius, can encode selected minutes if the user accepts this new design choice. Show a size legend. This is not a verified original encoding.
- Minimum minutes: a new configurable analysis setting, not a recovered original threshold. Do not choose a threshold merely to include Beckham.
- Historical names that fail coverage or minutes checks remain excluded, with a clear reason. In particular, do not advertise Beckham as a meaningful comparison in this dataset.

Data model, regardless of eventual provider:

```text
provider
providerPlayerId
playerName
competitionId
season
coverageStart
coverageEnd
coverageStatus: complete | partial | unknown
goals
penaltyGoals: integer | null
assists: integer | null
minutesPlayed
assistDefinition
sourceUrl
retrievedAt
sourceVersion
sourceSha256
reuseTermsUrl
```

Aggregation rules:

- Apply scope/date filters before summing and before minimum-minute eligibility.
- Reject negative counts, non-finite numbers, and zero-minute rate denominators.
- Deduplicate player-match records, and verify matches do not duplicate across competition joins.
- Never sum a multi-club season aggregate together with its component club rows.
- Keep `nonPenaltyGoals = null` when penalty goals are unknown; do not set it equal to total goals.
- Preserve source precision internally and round only in tooltips and labels.
- Publish source version, cutoff, definition, and partial-coverage warnings in the UI and exports.

**Parent handoff:** Ask for the original image/source link and whether a licensed data provider or a clearly limited observed-period adaptation is acceptable. Do not silently substitute the limited dataset for the requested historical chart.
