/* ===================================================
  Imports
=================================================== */
import { themes } from "./data/themedata.js";
import { sounds } from "./sounds/sounds.js";

/* ===================================================
  Global Variables
=================================================== */

// DOCUMENT ELEMENTS
// General
const SITE_TITLE =
  "Chiikawa Timer - A cute pomodoro timer to boost your productivity";

// Timer
const TIMER_MODES_MENU = document.querySelectorAll(".timer-modes .mode");
const TIMER_DISPLAY = document.querySelector(".timer-display");
const TASK_INPUT = document.querySelector(".task-input");
const AVATAR = document.querySelector(".avatar");
const START_BTN = document.querySelector(".start-btn");
const RESET_BTN = document.querySelector(".reset-btn");

// Settings
const MODAL_OVERLAY = document.querySelector(".modal-overlay");
const SETTINGS_BTN = document.querySelector(".settings-btn");
const SETTINGS_MENU = document.querySelector(".settings");
const SETTINGS_CLOSE_BTN = document.querySelector(".settings-close-btn");
const DURATION_INPUTS = document.querySelectorAll(".duration-inputs input");
const INPUT_DURATION_POMODORO = document.querySelector("#pomodoro-duration");
const INPUT_DURATION_SHORT_BREAK = document.querySelector(
  "#short-break-duration"
);
const INPUT_DURATION_LONG_BREAK = document.querySelector(
  "#long-break-duration"
);
const RESET_TIMER_DURATIONS_BTN = document.querySelector(
  ".reset-timer-durations-btn"
);
const SOUND_OPTIONS_LIST = document.querySelector(".sound-options");
const THEME_OPTIONS_LIST = document.querySelector(".theme-options");
const TASK_HISTORY = document.querySelector(".task-history");
const DELETE_TASK_HISTORY_BTN = document.querySelector(
  ".delete-task-history-btn"
);
const MUTE_TOGGLE = document.querySelector("#mute-toggle");
const RANDOMIZE_THEME_TOGGLE = document.querySelector(
  "#randomize-theme-toggle"
);

// ASSETS
const ROOT = document.documentElement;
const THEMES = themes;

// TIMER VARIABLES
const DEFAULT_DURATION_POMODORO = 25;
const DEFAULT_DURATION_SHORT_BREAK = 5;
const DEFAULT_DURATION_LONG_BREAK = 10;

const TIMER_MODES = {
  POMODORO: { label: "POMODORO", duration: DEFAULT_DURATION_POMODORO },
  SHORT_BREAK: { label: "SHORT_BREAK", duration: DEFAULT_DURATION_SHORT_BREAK },
  LONG_BREAK: { label: "LONG_BREAK", duration: DEFAULT_DURATION_LONG_BREAK },
};

let currentTimerMode = TIMER_MODES.POMODORO.label; // Tracks which timer mode is selected
let currentTimerMinutes = DEFAULT_DURATION_POMODORO;
let timerStarted = false;
let timerInterval;
let timeRemaining;
let notificationSound = new Audio(sounds[0].file);

/* ===================================================
 Functions
=================================================== */

// Operates the timer every 1s
const runTimer = () => {
  const DURATION = currentTimerMinutes * 60;

  // Check if timer is already in progress
  if (timeRemaining == null) {
    timeRemaining = DURATION;
  }

  // Clears previous interval
  clearInterval(timerInterval);

  // Updates timer display (so timer "begins" immediately)
  updateTimerDisplay(timeRemaining);

  // Create new interval
  timerInterval = setInterval(() => {
    // Ensure timer is still running
    if (!timerStarted) return;

    // Decrease time
    timeRemaining--;

    // Update timer display
    updateTimerDisplay(timeRemaining);

    // Perform operations when timer is completed
    if (timeRemaining <= 0) {
      // Clear timer variables
      clearInterval(timerInterval);
      timerStarted = false;
      timeRemaining = null;

      // Update timer UI
      updateTimerDisplay(currentTimerMinutes * 60);
      updateTimerControlBtnText();

      // If a pomodoro was completed, add task to list
      if (currentTimerMode === "POMODORO") {
        let task = createTask();

        // Save task to local storage
        if (task) saveTaskToLocalStorage(task);

        // Output task to HTML
        TASK_HISTORY.prepend(createTaskHTML(task));
      }

      // Play timer completion sound
      notificationSound.play();

      // Switch theme (if Randomize Theme Toggle is checked)
      if (localStorage.getItem("randomizeTheme") === "true") {
        const randomThemeID = getRandomThemeID();
        saveThemeToLocalStorage(randomThemeID);
        highlightThemeThumbnail(randomThemeID);
        switchTheme(randomThemeID);
      }
    }
  }, 1000);
};

// Resets the timer to the current timer mode
const resetTimer = () => {
  // Reset timer values
  timerStarted = false;
  timeRemaining = null;

  // Update UI
  clearInterval(timerInterval);
  updateTimerControlBtnText();
  updateTimerDisplay(currentTimerMinutes * 60);
};

// Updates the timer display and the site title
const updateTimerDisplay = (secondsRemaining) => {
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;

  let displayText = `${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;

  // Update timer UI
  TIMER_DISPLAY.textContent = displayText;

  // Update site title
  document.title = `${displayText} - ${SITE_TITLE}`;
};

// Toggles the Start/Pause button text
const updateTimerControlBtnText = () => {
  START_BTN.innerHTML = timerStarted
    ? "&#10073;&#10073;&nbsp;&nbsp;Pause"
    : "&#9658; Start";
};

// Deletes custom timer durations in local storage
const deleteCustomTimersLocalStorage = () => {
  localStorage.removeItem("customTimers");
};

// Resets timers to default durations
const resetTimerDurationsToDefault = () => {
  TIMER_MODES.POMODORO.duration = DEFAULT_DURATION_POMODORO;
  TIMER_MODES.SHORT_BREAK.duration = DEFAULT_DURATION_SHORT_BREAK;
  TIMER_MODES.LONG_BREAK.duration = DEFAULT_DURATION_LONG_BREAK;
};

// Updates HTML timer inputs to defaults
const updateTimerDurationsHTML = () => {
  INPUT_DURATION_POMODORO.value = DEFAULT_DURATION_POMODORO;
  INPUT_DURATION_SHORT_BREAK.value = DEFAULT_DURATION_SHORT_BREAK;
  INPUT_DURATION_LONG_BREAK.value = DEFAULT_DURATION_LONG_BREAK;
};

// Saves user's custom timer durations to local storage
const saveTimerDurationsToLocalStorage = () => {
  const customDurations = {
    POMODORO: parseFloat(INPUT_DURATION_POMODORO.value),
    SHORT_BREAK: parseFloat(INPUT_DURATION_SHORT_BREAK.value),
    LONG_BREAK: parseFloat(INPUT_DURATION_LONG_BREAK.value),
  };
  localStorage.setItem("customTimers", JSON.stringify(customDurations));
};

// Creates unformatted task object
const createTask = () => ({
  name: TASK_INPUT.value.trim() || "Pomodoro",
  length: currentTimerMinutes,
  date: new Date().toISOString(),
});

// Returns task history array if it exists
const getTaskHistory = () => {
  const history = localStorage.getItem("taskHistory");
  return history ? JSON.parse(history) : [];
};

// Given taskHistory array, outputs the list to HTML
const outputTaskHistoryHTML = (taskHistory) => {
  if (Array.isArray(taskHistory) && taskHistory.length > 0) {
    taskHistory.forEach((task) => TASK_HISTORY.prepend(createTaskHTML(task)));
  } else {
    deleteTaskHistoryHTML();
  }
};

// Saves a task to taskHistory array to local storage
const saveTaskToLocalStorage = (task) => {
  const history = getTaskHistory();
  history.push(task);
  localStorage.setItem("taskHistory", JSON.stringify(history));
};

// Formats Date objects to formatted string
const formatDateTime = (dateString) => {
  const date = new Date(dateString);
  const datePart = date
    .toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    })
    .replace(",", "");

  const timePart = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${datePart} ${timePart}`;
};

// Creates formatted task HTML object <li>
const createTaskHTML = (task) => {
  // Format task length and date
  task.length = `${currentTimerMinutes} min`;
  task.date = formatDateTime(task.date);

  // Create li object
  const li = document.createElement("li");
  li.textContent = `[${task.date}] ${task.name} \u2014 ${task.length}`;

  return li;
};

// Deletes task history in local storage
const deleteTaskHistory = () => {
  localStorage.removeItem("taskHistory");
};

// Deletes the HTML content inside the HTML element holding task history
const deleteTaskHistoryHTML = () => {
  TASK_HISTORY.innerHTML = "";
};

// Highlights a thumbnail in the theme list
const highlightThemeThumbnail = (themeID) => {
  // Remove existing highlight markers
  document
    .querySelectorAll(".theme-options .theme-option")
    .forEach((btn) => btn.classList.remove("selected"));

  // Get selected theme choice button
  const button = document.querySelector(
    `.theme-option[data-theme-id="${themeID}"]`
  );

  if (button) button.classList.add("selected");
};

// Sets the selected notification sound to local storage
const saveNotificationSoundToLocalStorage = (id) => {
  localStorage.setItem("selectedSound", id);
};

// Sets the selected theme ID to local storage
const saveThemeToLocalStorage = (id) => {
  localStorage.setItem("selectedTheme", id);
};

// Gets a random theme ID
const getRandomThemeID = () => {
  return Math.floor(Math.random() * themes.length) + 1;
};

// Switches the current theme to chosen theme
const switchTheme = (id) => {
  // Check if selected theme exists
  const theme = themes.find((t) => t.id === Number(id));
  if (!theme) return;

  // Change avatar
  AVATAR.src = theme.avatar;

  // Update CSS variables
  ROOT.style.setProperty("--bg-color", theme.bgColor);
  ROOT.style.setProperty("--accent-color", theme.accentColor);

  // Update gradient background class
  const bgElement = document.querySelector(".bg-gradient");
  if (bgElement) {
    // Remove existing gradient classes
    bgElement.classList.forEach((cls) => {
      if (cls.startsWith("gradient-")) {
        bgElement.classList.remove(cls);
      }
    });
    bgElement.classList.add(theme.gradientClass);
  }
};

// Mutes or unmutes sounds
const setMutedState = (mute) => {
  notificationSound.muted = mute;
};

// Creates themes list HTML
const createThemeOptionsHTML = () => {
  THEMES.forEach((theme) => {
    const li = document.createElement("li");

    const button = document.createElement("button");
    button.classList.add("theme-option");
    button.setAttribute("data-theme-id", theme.id);

    const img = document.createElement("img");
    img.src = theme.avatar;
    img.alt = `Theme ${theme.id} preview`;

    button.appendChild(img);
    li.appendChild(button);
    THEME_OPTIONS_LIST.appendChild(li);

    // Attach event listener that switches the theme
    li.addEventListener("click", (e) => {
      // Get the selected theme
      const selectedTheme = e.target.closest(".theme-option");

      if (selectedTheme) {
        // Highlight selected theme thumbnail
        document
          .querySelectorAll(".theme-options .theme-option")
          .forEach((btn) => btn.classList.remove("selected"));
        selectedTheme.classList.add("selected");

        // Set theme to local storage
        const id = selectedTheme.dataset.themeId;
        saveThemeToLocalStorage(id);

        // Switch the theme
        switchTheme(id);
      }
    });
  });
};

// Creates notification sounds list HTML
const createNotificationSoundOptionsHTML = () => {
  sounds.forEach((sound, index) => {
    const wrapper = document.createElement("div");
    wrapper.className = "sound-option";

    // Create input radio
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "notificationSound";
    input.id = sound.id;
    input.value = sound.file;

    // Set default checked sound option
    const savedSound = localStorage.getItem("selectedSound");
    if (savedSound) {
      if (savedSound === input.id) input.checked = true;
    } else {
      if (index === 0) input.checked = true;
    }

    // Create label
    const label = document.createElement("label");
    label.setAttribute("for", sound.id);
    label.textContent = sound.name;

    // Add event listener
    input.addEventListener("change", () => {
      // Play sound preview
      const audio = new Audio(sound.file);
      audio.play();

      // Set sound selection
      notificationSound = audio;

      // Save sound selection to local storage
      localStorage.setItem("selectedSound", sound.id);
    });

    // Create HTML
    wrapper.appendChild(input);
    wrapper.appendChild(label);
    SOUND_OPTIONS_LIST.appendChild(wrapper);
  });
};

// Sets the mute toggle slider
const setMuteToggleSlider = (mute) => {
  MUTE_TOGGLE.checked = muteSounds;
};

// Sets the randomize theme toggle slider
const setRandomizeThemeToggle = (randomize) => {
  RANDOMIZE_THEME_TOGGLE.checked = randomize;
};

// Opens Settings menu
const openSettings = () => {
  MODAL_OVERLAY.classList.add("modal-overlay-open");
  SETTINGS_MENU.classList.remove("settings-closed");
  SETTINGS_MENU.classList.add("settings-open");
  SETTINGS_MENU.style.visibility = "visible";
};

// Checks if Settings menu animation was completed
const onModalTransitionEnd = () => {
  if (SETTINGS_MENU.classList.contains("settings-closed")) {
    SETTINGS_MENU.style.visibility = "hidden";
  }
  SETTINGS_MENU.removeEventListener("transitionend", onModalTransitionEnd);
};

// Closes Settings menu
const closeSettings = () => {
  SETTINGS_MENU.classList.remove("settings-open");
  SETTINGS_MENU.classList.add("settings-closed");
  MODAL_OVERLAY.classList.remove("modal-overlay-open");
  SETTINGS_MENU.addEventListener("transitionend", onModalTransitionEnd);
};

/* ===================================================
  Page Load Operations
=================================================== */

// SETTINGS MENU: THEME LIST
// Generate sounds list in Settings modal
createNotificationSoundOptionsHTML();

// Generates theme list in Settings modal
createThemeOptionsHTML();

// LOCAL STORAGE: LOAD USER SETTINGS
if (localStorage.getItem("customTimers")) {
  const customTimers = JSON.parse(localStorage.getItem("customTimers"));

  Object.keys(customTimers).forEach((mode) => {
    // Update custom timer durations
    TIMER_MODES[mode].duration = customTimers[mode];

    // Update custom timer HTML inputs
    document.querySelector(`[data-timer="${mode}"]`).value = customTimers[mode];
  });

  // Update current timer minutes
  currentTimerMinutes = TIMER_MODES[currentTimerMode].duration;

  // Update timer display
  updateTimerDisplay(TIMER_MODES[currentTimerMode].duration * 60);
} else {
  // If no custom durations exist, fill default timer durations
  INPUT_DURATION_POMODORO.value = DEFAULT_DURATION_POMODORO;
  INPUT_DURATION_SHORT_BREAK.value = DEFAULT_DURATION_SHORT_BREAK;
  INPUT_DURATION_LONG_BREAK.value = DEFAULT_DURATION_LONG_BREAK;
}

// Display task history in Settings modal, if it exists
outputTaskHistoryHTML(
  JSON.parse(localStorage.getItem("taskHistory") || "null")
);

// Depending on user's local storage choice
// Mute all sounds toggle
const muteSounds = JSON.parse(localStorage.getItem("muteSounds")) ?? false;
setMutedState(muteSounds);
setMuteToggleSlider(muteSounds);

// Randomize theme toggle
const randomizeTheme =
  JSON.parse(localStorage.getItem("randomizeTheme")) ?? false;
setRandomizeThemeToggle(randomizeTheme);

// Set user's local theme and highlight theme thumbnail in list, if it exists
const userTheme = localStorage.getItem("selectedTheme");
if (userTheme) {
  switchTheme(userTheme);
  highlightThemeThumbnail(userTheme);
}

/* ===================================================
  Event Listeners
=================================================== */

// TIMER CONTROL (START/PAUSE) BUTTON
// Toggles the label on the button appropriately and resets if needed
START_BTN.addEventListener("click", () => {
  if (!timerStarted) runTimer();
  timerStarted = !timerStarted;
  updateTimerControlBtnText();
});

// Resets the timer
RESET_BTN.addEventListener("click", () => {
  resetTimer();
});

// TIMER MODES
// Switches timer modes
TIMER_MODES_MENU.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    // Change button status
    TIMER_MODES_MENU.forEach((b) => b.classList.remove("selected-mode"));
    btn.classList.add("selected-mode");

    // Identify which mode was pressed
    const selectedButton = e.target.closest("button");
    const selectedMode = selectedButton.dataset.timer;

    // Set new timer mode
    currentTimerMode = TIMER_MODES[selectedMode].label;
    currentTimerMinutes = TIMER_MODES[selectedMode].duration;

    // Update timer display
    updateTimerDisplay(currentTimerMinutes * 60);

    // Reset timer
    resetTimer();
  });
});

// SETTINGS MENU
// Open settings menu on button click
SETTINGS_BTN.addEventListener("click", openSettings);

// Close settings menu on close button click
SETTINGS_CLOSE_BTN.addEventListener("click", closeSettings);

// Close background overlay when clicking outside the settings menu
MODAL_OVERLAY.addEventListener("click", () => {
  if (SETTINGS_MENU.classList.contains("settings-open")) {
    closeSettings();
  }
});

// Mutes all sounds in app
MUTE_TOGGLE.addEventListener("change", () => {
  const isMuted = MUTE_TOGGLE.checked;

  // Save choice in local storage
  localStorage.setItem("muteSounds", isMuted);

  // Mute/unmute sounds
  setMutedState(isMuted);
});

// Changes timer mode lengths
DURATION_INPUTS.forEach((input) => {
  input.addEventListener("change", (e) => {
    let inputDuration = e.target.value;
    const selectedMode = e.target.dataset.timer;

    // Check input is not negative
    if (inputDuration < 0) {
      inputDuration = 0;
      e.target.value = 0;
    }

    // Change input to number
    inputDuration = parseFloat(inputDuration);

    // Change duration of targeted timer mode
    TIMER_MODES[selectedMode].duration = inputDuration;

    // Check if changed timer mode is currently selected or running
    if (currentTimerMode == selectedMode) {
      // Update current timer mode duration
      currentTimerMinutes = inputDuration;

      // Reset timer
      resetTimer();

      // Update timer display
      updateTimerDisplay(currentTimerMinutes * 60);
    }

    // Save custom timer durations to local storage
    saveTimerDurationsToLocalStorage();
  });
});

// Deletes custom timers in local storage
RESET_TIMER_DURATIONS_BTN.addEventListener("click", () => {
  // Delete custom timers from local storage
  deleteCustomTimersLocalStorage();
  resetTimerDurationsToDefault();

  // Reset timer
  resetTimer();

  // Update UIs
  updateTimerDurationsHTML();
  updateTimerDisplay(TIMER_MODES[currentTimerMode].duration * 60);
});

// Deletes all task history in local storage
DELETE_TASK_HISTORY_BTN.addEventListener("click", () => {
  // Confirm with user
  if (confirm("Are you sure you want to delete your task history?") == true) {
    deleteTaskHistory();
    deleteTaskHistoryHTML();
  }
});

// Randomize theme toggle
RANDOMIZE_THEME_TOGGLE.addEventListener("click", () => {
  const toggle = RANDOMIZE_THEME_TOGGLE.checked;

  // Save choice in local storage
  localStorage.setItem("randomizeTheme", toggle);
});

// AVATAR
// Prevent right-click on avatar
AVATAR.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});
