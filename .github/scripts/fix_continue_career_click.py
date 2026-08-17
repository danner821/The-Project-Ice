from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()
old="""    card.addEventListener('click', async () => {
      card.disabled = true;
      const loaded = await WorldEngine.selectCareerSave(save.id);
      if (!loaded) { card.disabled = false; return; }
      localStorage.removeItem(SAVE_KEY);
      recoverCareerPreviewFromWorld();
      loadCareerPreview();
    });
"""
new="""    card.addEventListener('click', async () => {
      card.disabled = true;

      try {
        /* Normal Continue Career must never inherit the temporary dev shortcut. */
        window.PROJECT_ICE_DEV_SESSION = false;

        const loaded = await WorldEngine.selectCareerSave(save.id);
        if (!loaded) {
          card.disabled = false;
          console.error('[Project Ice] Could not load selected career:', save.id);
          return;
        }

        localStorage.removeItem(SAVE_KEY);

        const recovered = recoverCareerPreviewFromWorld();
        if (!recovered) {
          card.disabled = false;
          console.error('[Project Ice] Selected career loaded, but player recovery failed:', save.id);
          return;
        }

        /*
         * Route from the selected canonical save directly. This avoids a second
         * ambiguous save lookup and makes Continue Career deterministic.
         */
        Game.player.currentDate =
          WorldEngine.state?.season?.currentDate ||
          WorldEngine.state?.player?.currentDate ||
          Game.player.currentDate ||
          '2026-09-01';

        syncCareerPlayerWithWorld();
        ensureCareerScheduleEventsOnLoad();
        refreshScheduleEvents();

        if (Game.player.stage === 'hub' || Game.player.tryoutsComplete === true) {
          Game.player.stage = 'hub';
          refreshCareerUI();
          showScreen('hub');
          ensureHubLiveGameDiagnosticButton();
          return;
        }

        loadCareerPreview();
      } catch (error) {
        card.disabled = false;
        console.error('[Project Ice] Continue Career failed:', error);
      }
    });
"""
if old not in s:
    raise SystemExit('career click handler anchor missing')
s=s.replace(old,new,1)
p.write_text(s)
print('hardened Continue Career click path')
