from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text()
old="""      if (\n        typeof syncCareerPlayerWithWorld ===\n        'function'\n      ) {\n        syncCareerPlayerWithWorld();\n      }\n\n      if (\n        typeof refreshScheduleEvents ===\n        'function'\n      ) {\n        refreshScheduleEvents();\n      }\n\n      /*\n       * openPostgameSummary reads ONLY the permanently saved\n"""
new="""      /*\n       * These presentation refreshes are useful, but they are not allowed\n       * to block the final-horn Continue control. A late-season schedule\n       * migration or another optional UI refresh can throw even though the\n       * completed game has already been finalized, applied and saved.\n       */\n      try {\n        if (\n          typeof syncCareerPlayerWithWorld ===\n          'function'\n        ) {\n          syncCareerPlayerWithWorld();\n        }\n\n        if (\n          typeof refreshScheduleEvents ===\n          'function'\n        ) {\n          refreshScheduleEvents();\n        }\n      } catch (error) {\n        console.warn(\n          '[Project Ice] Optional postgame presentation refresh failed; Continue remains available.',\n          error\n        );\n      }\n\n      /*\n       * openPostgameSummary reads ONLY the permanently saved\n"""
if old not in s:
    raise SystemExit('final horn refresh block not found')
s=s.replace(old,new,1)
p.write_text(s)
