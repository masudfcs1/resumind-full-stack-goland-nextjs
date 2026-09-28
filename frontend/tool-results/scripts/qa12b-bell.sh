#!/bin/bash
# QA 12-b: bell chips + unread logic (single call — sandbox kills browser between calls)
AB="agent-browser --session q12b"
cd /home/z/my-project || exit 1

$AB open http://localhost:3000/dashboard >/dev/null 2>&1
sleep 2

SEED=$($AB eval 'localStorage.getItem("resumeforge-store") ? "has" : "no"' 2>/dev/null | tail -1)
echo "seed-state: $SEED"
if [ "$SEED" != '"has"' ]; then
  $AB eval '(() => { const now = Date.now(); const h = 3600000; const cats = (k,i,f,s,l) => ({Keywords:k, Impact:i, Formatting:f, Sections:s, Length:l}); const history = [ { id:"seed-h-a1", resumeId:"seed-alex", resumeTitle:"Senior Frontend Engineer — Google", score:71, at:now-26*h, categories:cats(68,44,83,75,64) }, { id:"seed-h-a2", resumeId:"seed-alex", resumeTitle:"Senior Frontend Engineer — Google", score:84, at:now-2*h, categories:cats(74,52,87,75,60) }, { id:"seed-h-m1", resumeId:"seed-maya", resumeTitle:"Product Manager — Stripe", score:88, at:now-5*h, categories:cats(81,66,72,90,55) } ]; localStorage.setItem("resumeforge-store", JSON.stringify({ state: { scoreHistory: history }, version: 0 })); localStorage.removeItem("resumeforge-notifs-read-v2"); return "seeded"; })()' >/dev/null 2>&1
  $AB open http://localhost:3000/dashboard >/dev/null 2>&1
  sleep 3
fi

echo "— open bell:"
$AB click 'button[aria-label*="Notifications"]' 2>&1 | tail -1
sleep 1

echo "— chips + unread before mark-all-read:"
$AB eval '(() => { const b = document.querySelector("[data-bell-category-deltas]"); if (!b) return JSON.stringify({err:"no-block"}); const li = b.closest("li"); const titleEl = [...li.querySelectorAll("span")].find(s => (s.getAttribute("class")||"").includes("12.5")); const bellBtn = [...document.querySelectorAll("button")].find(x => (x.getAttribute("aria-label")||"").startsWith("Notifications")); return JSON.stringify({ title: titleEl ? titleEl.textContent : "?", chipTexts: [...b.querySelectorAll("[data-bell-category-chip]")].map(c => c.textContent.trim()), more: b.querySelector("[data-bell-category-more]")?.textContent.trim() ?? null, bellAria: bellBtn ? bellBtn.getAttribute("aria-label") : null, unreadDots: document.querySelectorAll("li [aria-label=Unread]").length }); })()' 2>&1 | tail -1

echo "— screenshot unread dropdown:"
$AB screenshot tool-results/qa12b-bell.png 2>&1 | tail -1

echo "— click Mark all read:"
$AB eval '(() => { const b = [...document.querySelectorAll("button")].find(x => x.textContent.includes("Mark all read")); if (!b) return "missing"; b.click(); return "clicked"; })()' 2>&1 | tail -1
sleep 1

echo "— unread after mark-all-read:"
$AB eval '(() => { const bellBtn = [...document.querySelectorAll("button")].find(x => (x.getAttribute("aria-label")||"").startsWith("Notifications")); return JSON.stringify({ bellAria: bellBtn ? bellBtn.getAttribute("aria-label") : null, badge: bellBtn && bellBtn.querySelector("span.absolute") ? "present" : "gone", unreadDots: document.querySelectorAll("li [aria-label=Unread]").length }); })()' 2>&1 | tail -1
