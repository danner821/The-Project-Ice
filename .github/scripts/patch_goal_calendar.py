from pathlib import Path

p=Path('artifacts/project-ice/public/game.js'); s=p.read_text()
s=s.replace("eventElement.className =\n    'live-game__timeline-event';","eventElement.className =\n    'live-game__timeline-event';\n\n  if (eventType === 'goal') {\n    eventElement.classList.add('live-game__timeline-event--goal');\n  }",1)
s=s.replace("  if (hasCareerEvents) {\n    return false;\n  }","  const latestGameDate = existingSchedule.filter(e => String(e?.type || '').toLowerCase() === 'game').reduce((m,e) => String(e?.date || '') > m ? String(e.date) : m, '');\n  const latestCareerDate = existingSchedule.filter(e => ['practice','recovery','training'].includes(String(e?.type || '').toLowerCase())).reduce((m,e) => String(e?.date || '') > m ? String(e.date) : m, '');\n\n  if (hasCareerEvents && (!latestGameDate || latestCareerDate >= latestGameDate)) {\n    return false;\n  }",1)
p.write_text(s)

p=Path('artifacts/project-ice/public/world.js'); s=p.read_text()
s=s.replace('function createHighSchoolLifeEvents() {','function createHighSchoolLifeEvents(endDateOverride = null) {',1)
s=s.replace("const endDate =\n      new Date(\n        '2027-03-31T12:00:00'\n      );","const endDate =\n      new Date(\n        `${endDateOverride || '2027-03-31'}T12:00:00`\n      );",1)
s=s.replace('const lifeEvents =\n        createHighSchoolLifeEvents();',"const lastGameDate = gameEvents.reduce((latest, game) => {\n        const date = String(game?.date || '');\n        return date > latest ? date : latest;\n      }, '') || null;\n\n      const lifeEvents =\n        createHighSchoolLifeEvents(lastGameDate);",1)
p.write_text(s)

p=Path('artifacts/project-ice/public/style.css'); s=p.read_text()
anchor='.live-game__timeline-time {'
css=""".live-game__timeline-event--goal {\n  border-color: rgba(255, 231, 153, 0.95);\n  background: linear-gradient(145deg, #8f6414, #d5a62e);\n  box-shadow: 0 0 14px rgba(213, 166, 46, 0.30);\n}\n\n.live-game__timeline-event--goal .live-game__timeline-time,\n.live-game__timeline-event--goal .live-game__timeline-primary,\n.live-game__timeline-event--goal .live-game__timeline-secondary {\n  color: #ffffff;\n}\n\n"""
if css not in s:
    s=s.replace(anchor,css+anchor,1)
p.write_text(s)
