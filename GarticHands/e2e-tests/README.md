# End-to-end Testing for GarticHands

Author: Hoang Minh Do

# User Stories tracking document
https://docs.google.com/spreadsheets/d/1CeiBnrzP5W0_T-N77HpOyhe37h4fWcH2o0HUklU9Ko8/edit?gid=0#gid=0

# Run the tests
1. npm install
2. npm run test:e2e

# Extras
Generate and open HTML report:
npx playwright show-report e2e-tests/playwright-report

Run a single spec:
npx playwright test --config=e2e-tests/playwright.config.ts e2e-tests/us9-slideshow.spec.ts

Open Playwright UI runner:
npm run test:e2e:ui

Clean previous artifacts:
powershell command:
Remove-Item -Recurse -Force e2e-tests/test-results, e2e-tests/playwright-report -ErrorAction SilentlyContinue