# School lunch draw: local review

Implemented, tested, and deployed to the existing AWS application on October 22, 2026.

Live site: https://d3ffb7dpndy76h.cloudfront.net/

## Try it

Open http://127.0.0.1:5173/.

A local demo account contains twelve tagged recipes:

- Email: `lunch-review@example.com`
- Password: `LunchReview2026!`

This account exists only in the local database emulator. It is for review, not production use.

To use your own account, create a label named **Ran's school lunch** in Recipes → Labels. Add it to at least five recipes. The tag also accepts a curly apostrophe and upper/lowercase letters.

In Planning, select Powerball or Dice, then click **I feel lucky**. Powerball runs automatically. Click the spinning dice to stop it; it settles in 1.6 seconds, then reveals the lunches at 1.8 seconds. Review five distinct lunches, then select **Do it again** or **Confirm**. Confirm saves Monday–Friday lunches for the selected week. An existing lunch plan is replaced only on confirmation. Dinner entries are preserved.

The animation choice is saved in this browser. Dice now uses the selected Classic tumble animation: one ivory six-sided cube with dot faces. All eligible recipes remain in the draw pool; the six visual faces do not limit the recipe pool. With exactly five recipes, redraw can change their weekday order.

## Verified results

`npm run build` passed. `npm run test:lunch` passed all five browser cases in 42.3 seconds.

Tests use headed Chrome with actual browser clicks and keyboard input. They run against the local FastAPI server and Moto DynamoDB emulator. Each case records a WebM video. One test injects an HTTP 500 response to verify the save-error retry flow; other application requests use the real local API.

| Case | Checks | Result |
| --- | --- | --- |
| Powerball | Create tag and recipes through the UI; block draws with zero/four recipes; draw automatically; five distinct picks; redraw; no write before confirm; save and reload | Passed |
| Dice | Twelve eligible recipes and a classic cube with six correctly dotted faces; spin until clicked; settle in 1–2 seconds; redraw with dice; saved mode; this-week/next-week isolation; preserve dinner | Passed |
| Cancel and failure | Close during animation; no delayed save; retry failed confirm; preserve lunches through dinner update/delete; explain replacement; Escape cancels results | Passed |
| Mobile | 390 × 844 viewport; reduced motion; classic dice; keyboard stop; results fit the viewport; save | Passed |
| API validation | Reject duplicate IDs, four/six picks, untagged recipes, another household's recipes, malformed/non-Monday dates, and unauthenticated requests; failed writes leave the existing plan intact | Passed |

Desktop, mobile, and animation screenshots were visually inspected. The dice layout was adjusted to keep its stop instruction clear. Frames were also extracted from both review videos to check playback.

## Review artifacts

Recordings and screenshots are local and Git-ignored:

- [Powerball video](../test-results/school-lunch-review/powerball.webm)
- [Classic dice video](../test-results/school-lunch-review/classic-dice.webm)
- [Saved calendar](../test-results/school-lunch-review/school-lunch-calendar.png)
- [Mobile results](../test-results/school-lunch-review/mobile-results.png)
- [Initial browser test report, before Classic integration](../test-results/school-lunch-report/index.html)

## Run again

With the local API, database emulator, and Vite server running:

```sh
cd frontend
npm ci
npx playwright install ffmpeg
npm run build
npm run test:lunch
```

Google Chrome must be installed. The config records every test and runs one browser at a time. Backend setup and local launch use the existing ignored `.local-dev/start.sh` helper in this checkout.

## Scope and deployment

Lunches are stored in a separate `school_lunch_entries` attribute on the existing weekly-plan DynamoDB item. Confirmation updates all five lunches in one database operation. Dinner writes now update their own attribute, so they preserve lunch entries. Older plans without lunch data still load.

Frontend and backend were deployed together after review. No AWS infrastructure or table migration was performed. Existing dinner rules and ICS export still operate on dinner entries; this feature adds lunches to the website calendar.

## Dice animation alternatives

The local `/dice-options` page presents three interactive alternatives: Classic tumble (ivory cube), Tabletop roll (amber cube with bounces), and A lucky pair (ivory and slate cubes in a tray). All show six-sided dice with dot faces. Classic tumble was selected and is now used by the planner. The comparison page remains available; using its previews does not change the calendar.

Two additional Chrome tests passed in 17.7 seconds. They check face/pip geometry, continuous motion, stop and replay, settlement within two seconds, absence of calendar writes, mobile layout, reduced motion, and keyboard control. The desktop recording was refreshed after the copy update and passed again.

- [Three-option comparison video](../test-results/dice-options-review/three-dice-options.webm)
- [Comparison screenshot](../test-results/dice-options-review/comparison.png)

Classic integration verification: production build and all five school-lunch browser cases passed. The current recording shows the ivory cube in the actual planner, click-to-stop, redraw, confirm, and week isolation. The cube settles over 1.6 seconds; results appear at 1.8 seconds. Recipe selection uses the full eligible pool independently of the six decorative faces.


## Production deployment verification

The existing `mealprepbuddy-dev` deployment in `us-west-2` was updated in place.

- Created an on-demand DynamoDB backup and confirmed it was available before deployment.
- Kept the same DynamoDB table and ARN. No CloudFormation resource updates, schema migration, database seed, or database write was performed.
- Downloaded the existing Lambda archive for rollback. Replaced only the Python application code, keeping the existing Linux dependencies byte-for-byte. Updated code using the original Lambda revision ID.
- Preserved Lambda configuration, including the JWT signing secret, table name, runtime, handler, architecture, and function ARN.
- Uploaded frontend assets before publishing `index.html`. Deleted no S3 objects, so previous assets remain available to open browser tabs. Saved the prior entry page for rollback.
- Completed the CloudFront cache invalidation.
- Compared consistent-read hashes of all records before and after deployment: **all 103 records were unchanged**, including 71 recipes, five users, five households, eight tags, and 14 weekly plans.
- Confirmed the live API health check, new school-lunch endpoint, and response schema. API Gateway rejected unauthenticated lunch writes with HTTP 403.
- Opened the public site in Chrome. The login page rendered without JavaScript errors and served this release's frontend bundle, including Classic tumble and the school-lunch feature. This check wrote no user data.

Rollback archives, backup reference, configuration fingerprints, record hashes, and verification output are stored in the ignored `.local-dev/release/` directory on this Mac. The database backup remains in AWS. The live-site screenshot is at `test-results/cloud-deployment/live-site.png`.
