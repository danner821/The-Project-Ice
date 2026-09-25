# Safari native storage acceptance

An opt-in diagnostic must use a uniquely named IndexedDB database, never open or modify `projectice_database`, load any backup only from the local Files picker, and delete only its own diagnostic database. The isolated Chromium mock passes small synthetic and fictional backup write/read/recheck/cleanup. Native Safari acceptance is pending.