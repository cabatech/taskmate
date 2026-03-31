## TaskMate v2.3.0

### Internationalisation (i18n)

TaskMate is now fully translatable. Every user-facing string — the backend config flow, options menus, select options, service descriptions, and all 14 Lovelace cards — supports translation.

**Frontend (Lovelace cards):**
- New `taskmate-localize.js` module loaded globally — detects language from `hass.language`, fetches the matching locale file, and falls back to English
- Language fallback chain with caching: `en-GB` → `en-GB.json`, `pt-BR` → `pt.json` → `en-GB.json`
- 372 translation keys across all 14 cards with `{placeholder}` substitution for dynamic values

**Backend (HA integration):**
- Config flow setup wizard fully translated
- Options flow menus translated — main menu via HA's native system, sub-menus via runtime translation lookup
- All select option labels (time categories, days of week, schedule modes, recurrence intervals, streak modes, action buttons) translated via `translation_key`
- All 14 service descriptions translated in Developer Tools

**Included languages:**

| Language | Frontend | Backend |
|----------|----------|---------|
| English | `en-GB.json` | `en.json`, `en-GB.json` |
| Norwegian Bokmål | `nb.json` | `nb.json` |
| Norwegian Nynorsk | `nn.json` | `nn.json` |
| Portuguese | `pt.json` | `pt.json`, `pt-BR.json` |

**Adding a new language:**
1. Copy `www/locales/en-GB.json` → `www/locales/<lang>.json` (372 keys)
2. Copy `translations/en.json` → `translations/<lang>.json`
3. Translate the values, keep all keys unchanged
4. Restart HA — the new language loads automatically

---

### Bug Fixes

**Chore Completion & Approval**
- **Reject fully reverses awards** — rejecting an auto-approved chore now correctly reverses points, `total_points_earned`, `total_chores_completed`, and streak. Previously only base points were deducted.
- **Points awarded includes weekend bonus** — `completion.points_awarded` now stores the full amount (base + weekend multiplier) so reject reverses the correct total.
- **Perfect week counts pending completions** — children no longer miss the perfect week bonus because a parent hasn't approved yet.
- **Streak uses completion date** — approving a Saturday chore on Monday correctly records the streak against Saturday, not Monday.
- **Warnings on missing approval IDs** — `async_approve_chore` and `async_approve_reward` now log a warning instead of silently returning when an ID isn't found.

**Rewards**
- **Reward deletion cleans up claims** — `async_remove_reward` now removes pending claims for the deleted reward, preventing orphaned data and errors.
- **Committed points race condition fixed** — the pending-claims loop in `async_claim_reward` now fetches each reward once per iteration, eliminating the double-lookup TOCTOU.
- **ClaimRewardButton availability** — subtracts committed points from pending claims when determining if the button should be enabled.

**Data Integrity**
- **Mutable list aliasing fixed** — `Child.from_dict`, `Chore.from_dict`, `Reward.from_dict`, and `Penalty.from_dict` now copy lists with `list()` instead of sharing references with storage, preventing in-place mutations from bypassing the update path.
- **Points name/icon preserved on restart** — uses a `_initial_setup_done` flag instead of comparing against default values. Deliberately choosing "Stars" as a points name no longer gets overwritten.

**Approvals Card**
- **Works with either entity** — accepts both `sensor.pending_approvals` (reads `chore_completions`) and `sensor.taskmate_overview` (reads `todays_completions`, filters unapproved). Previously showed "All caught up!" when pointed at the overview sensor.

**Buttons & Sensors**
- **Buttons update dynamically** — new chores, rewards, or children added after setup get button entities without requiring a restart.
- **Class rename** — `ChoremandorOverallStatsSensor` → `TaskMateOverallStatsSensor` (internal only, no entity ID change).
- **Sensor attributes cached** — overview sensor's `extra_state_attributes` cached per coordinator refresh, avoiding O(children × chores) recomputation on every HA poll.

**Services**
- **6 missing service definitions** — `preview_sound`, `set_chore_order`, `add_penalty`, `update_penalty`, `remove_penalty`, `apply_penalty` now appear in Developer Tools with descriptions and field documentation.

**Code Quality**
- Penalty imports consolidated at module level in `storage.py` and `coordinator.py`
- Deprecated `event_loop` test fixture removed; `asyncio_mode = auto` in `pytest.ini`
- Voluptuous no longer mocked in tests — real schema validation runs
- All 120 tests pass
