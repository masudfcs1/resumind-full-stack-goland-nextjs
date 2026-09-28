#!/bin/bash
# QA 12-b: console errors + dark mode + mobile 390 + reduced-motion probe (single call)
AB="agent-browser --session q12b"
cd /home/z/my-project || exit 1

SEEDER='(() => { const now = Date.now(); const h = 3600000; const cats = (k,i,f,s,l) => ({Keywords:k, Impact:i, Formatting:f, Sections:s, Length:l}); const history = [ { id:"seed-h-a1", resumeId:"seed-alex", resumeTitle:"Senior Frontend Engineer — Google", score:71, at:now-26*h, categories:cats(68,44,83,75,64) }, { id:"seed-h-a2", resumeId:"seed-alex", resumeTitle:"Senior Frontend Engineer — Google", score:84, at:now-2*h, categories:cats(74,52,87,75,60) }, { id:"seed-h-m1", resumeId:"seed-maya", resumeTitle:"Product Manager — Stripe", score:88, at:now-5*h, categories:cats(81,66,72,90,55) } ]; localStorage.setItem("resumeforge-store", JSON.stringify({ state: { scoreHistory: history }, version: 0 })); localStorage.removeItem("resumeforge-notifs-read-v2"); return "seeded"; })()'

$AB open http://localhost:3000/dashboard/compare >/dev/null 2>&1
sleep 2
SEED=$($AB eval 'localStorage.getItem("resumeforge-store") ? "has" : "no"' 2>/dev/null | tail -1)
echo "seed-state: $SEED"
if [ "$SEED" != '"has"' ]; then
  $AB eval "$SEDER" >/dev/null 2>&1
  $AB open http://localhost:3000/dashboard/compare >/dev/null 2>&1
  sleep 3
fi

$AB errors --clear >/dev/null 2>&1

echo "— pick B=David, swap-free interaction, errors after:"
$AB scrollintoview '[data-category-breakdown]' >/dev/null 2>&1
sleep 1
$AB errors 2>&1 | tail -4

echo "— DARK: set theme, reload compare:"
$AB eval 'localStorage.setItem("theme","dark"); "theme-dark-set"' 2>&1 | tail -1
$AB open http://localhost:3000/dashboard/compare >/dev/null 2>&1
sleep 3
$AB eval 'document.documentElement.className' 2>&1 | tail -1
$AB scrollintoview '[data-category-breakdown]' >/dev/null 2>&1
sleep 1
$AB screenshot tool-results/qa12b-dark-compare.png 2>&1 | tail -1

echo "— DARK bell dropdown:"
$AB open http://localhost:3000/dashboard >/dev/null 2>&1
sleep 2
$AB click 'button[aria-label*="Notifications"]' >/dev/null 2>&1
sleep 1
$AB screenshot tool-results/qa12b-dark-bell.png 2>&1 | tail -1
$AB eval 'document.body.click(); "closed"' >/dev/null 2>&1

echo "— page errors (cumulative, dark visits):"
$AB errors 2>&1 | tail -4

echo "— reset theme light:"
$AB eval 'localStorage.setItem("theme","light"); "theme-light-set"' 2>&1 | tail -1

echo "— MOBILE 390 compare:"
$AB set viewport 390 844 2>&1 | tail -1
$AB open http://localhost:3000/dashboard/compare >/dev/null 2>&1
sleep 3
$AB eval 'JSON.stringify({ scrollW: document.documentElement.scrollWidth, bodyW: document.body.scrollWidth, innerW: window.innerWidth, section: !!document.querySelector("[data-category-breakdown]"), insight: document.querySelector("[data-cat-insight]")?.textContent.trim() ?? null })' 2>&1 | tail -1
$AB screenshot tool-results/qa12b-mobile-compare.png 2>&1 | tail -1
$AB scrollintoview '[data-category-breakdown]' >/dev/null 2>&1
sleep 1
$AB screenshot tool-results/qa12b-mobile-section.png 2>&1 | tail -1

echo "— MOBILE dashboard bell:"
$AB open http://localhost:3000/dashboard >/dev/null 2>&1
sleep 2
$AB click 'button[aria-label*="Notifications"]' >/dev/null 2>&1
sleep 1
$AB eval 'JSON.stringify({ scrollW: document.documentElement.scrollWidth, chips: [...document.querySelectorAll("[data-bell-category-chip]")].length })' 2>&1 | tail -1
$AB screenshot tool-results/qa12b-mobile-bell.png 2>&1 | tail -1

echo "— page errors (all visits this pass):"
$AB errors 2>&1 | tail -6

echo "— reset viewport:"
$AB set viewport 1280 720 2>&1 | tail -1
