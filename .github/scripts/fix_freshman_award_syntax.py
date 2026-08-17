from pathlib import Path
p=Path('artifacts/project-ice/public/game.js')
s=p.read_text(errors='ignore')
needle="""  });
}

}
function simulateToDate(
"""
replacement="""  });
}

function simulateToDate(
"""
if needle not in s:
    raise SystemExit('freshman award stray brace anchor missing')
s=s.replace(needle,replacement,1)
p.write_text(s)
print('removed stray brace after renderLeagueAwardsPreview')
