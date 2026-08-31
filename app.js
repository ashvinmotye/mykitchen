"use strict";

const SUPABASE_URL = "https://xacwgipxqujbqvhzogbd.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_-_rGsscYv3ipNd7hW23-RQ_bUCB9hTf";
const AUTH_USER_KEY = "myKitchen.authUser.v1";
const STATE_PREFIX = "myKitchen.state.v1";
const LAST_SYNC_PREFIX = "myKitchen.lastSync.v1";
const LAST_THEME_KEY = "myKitchen.lastTheme.v1";
const SYNC_DELAY_MS = 1400;
const Core = window.MyKitchenCore;

const dom = {
  authScreen: document.querySelector("#authScreen"),
  authLoading: document.querySelector("#authLoading"),
  authFormContent: document.querySelector("#authFormContent"),
  authForm: document.querySelector("#authForm"),
  authEmail: document.querySelector("#authEmail"),
  authPassword: document.querySelector("#authPassword"),
  authPasswordHelp: document.querySelector("#authPasswordHelp"),
  authSubmitButton: document.querySelector("#authSubmitButton"),
  authMessage: document.querySelector("#authMessage"),
  signInModeButton: document.querySelector("#signInModeButton"),
  signUpModeButton: document.querySelector("#signUpModeButton"),
  appShell: document.querySelector("#appShell"),
  topGreeting: document.querySelector("#topGreeting"),
  viewEyebrow: document.querySelector("#viewEyebrow"),
  connectionPill: document.querySelector("#connectionPill"),
  themeToggle: document.querySelector("#themeToggle"),
  recipeSearch: document.querySelector("#recipeSearch"),
  recipeCategoryFilter: document.querySelector("#recipeCategoryFilter"),
  recipeCountLabel: document.querySelector("#recipeCountLabel"),
  recipeGrid: document.querySelector("#recipeGrid"),
  recipesEmpty: document.querySelector("#recipesEmpty"),
  selectionBar: document.querySelector("#selectionBar"),
  selectedRecipeCount: document.querySelector("#selectedRecipeCount"),
  groceryList: document.querySelector("#groceryList"),
  groceryEmpty: document.querySelector("#groceryEmpty"),
  groceryOpenCount: document.querySelector("#groceryOpenCount"),
  groceryPantryCount: document.querySelector("#groceryPantryCount"),
  groceryBoughtCount: document.querySelector("#groceryBoughtCount"),
  groceryNavCount: document.querySelector("#groceryNavCount"),
  groceryMobileCount: document.querySelector("#groceryMobileCount"),
  clearGroceryButton: document.querySelector("#clearGroceryButton"),
  pantryList: document.querySelector("#pantryList"),
  pantryEmpty: document.querySelector("#pantryEmpty"),
  availablePantryCount: document.querySelector("#availablePantryCount"),
  finishedPantryCount: document.querySelector("#finishedPantryCount"),
  openPantryOrganiserButton: document.querySelector("#openPantryOrganiserButton"),
  pantryOrganiserSearch: document.querySelector("#pantryOrganiserSearch"),
  pantryOrganiserList: document.querySelector("#pantryOrganiserList"),
  pantryOrganiserEmpty: document.querySelector("#pantryOrganiserEmpty"),
  pantryOrganiserTotal: document.querySelector("#pantryOrganiserTotal"),
  pantryOrganiserInPantry: document.querySelector("#pantryOrganiserInPantry"),
  pantryOrganiserRemaining: document.querySelector("#pantryOrganiserRemaining"),
  pantryOrganiserActionBar: document.querySelector("#pantryOrganiserActionBar"),
  pantryOrganiserSelectedCount: document.querySelector("#pantryOrganiserSelectedCount"),
  addPantryOrganiserSelectionButton: document.querySelector("#addPantryOrganiserSelectionButton"),
  clearPantryOrganiserSelectionButton: document.querySelector("#clearPantryOrganiserSelectionButton"),
  backToPantryButton: document.querySelector("#backToPantryButton"),
  profileNameInput: document.querySelector("#profileNameInput"),
  accountEmail: document.querySelector("#accountEmail"),
  cloudSyncStatus: document.querySelector("#cloudSyncStatus"),
  settingsConnectionStatus: document.querySelector("#settingsConnectionStatus"),
  accountMessage: document.querySelector("#accountMessage"),
  syncNowButton: document.querySelector("#syncNowButton"),
  signOutButton: document.querySelector("#signOutButton"),
  openIngredientReviewButton: document.querySelector("#openIngredientReviewButton"),
  ingredientReviewSearch: document.querySelector("#ingredientReviewSearch"),
  ingredientReviewList: document.querySelector("#ingredientReviewList"),
  ingredientReviewEmpty: document.querySelector("#ingredientReviewEmpty"),
  ingredientReviewTotal: document.querySelector("#ingredientReviewTotal"),
  ingredientReviewDuplicateCount: document.querySelector("#ingredientReviewDuplicateCount"),
  ingredientMergeBar: document.querySelector("#ingredientMergeBar"),
  ingredientMergeCount: document.querySelector("#ingredientMergeCount"),
  ingredientMergeHint: document.querySelector("#ingredientMergeHint"),
  ingredientKeepSelect: document.querySelector("#ingredientKeepSelect"),
  mergeIngredientsButton: document.querySelector("#mergeIngredientsButton"),
  clearIngredientSelectionButton: document.querySelector("#clearIngredientSelectionButton"),
  backToSettingsButton: document.querySelector("#backToSettingsButton"),
  nameDialog: document.querySelector("#nameDialog"),
  firstNameInput: document.querySelector("#firstNameInput"),
  recipeDialog: document.querySelector("#recipeDialog"),
  recipeForm: document.querySelector("#recipeForm"),
  recipeIdInput: document.querySelector("#recipeIdInput"),
  recipeDialogEyebrow: document.querySelector("#recipeDialogEyebrow"),
  recipeDialogTitle: document.querySelector("#recipeDialogTitle"),
  recipeTitleInput: document.querySelector("#recipeTitleInput"),
  recipeCategoryInput: document.querySelector("#recipeCategoryInput"),
  recipeIngredientsInput: document.querySelector("#recipeIngredientsInput"),
  recipeStepsInput: document.querySelector("#recipeStepsInput"),
  recipeYoutubeLinksInput: document.querySelector("#recipeYoutubeLinksInput"),
  recipeNotesInput: document.querySelector("#recipeNotesInput"),
  recipeDetailDialog: document.querySelector("#recipeDetailDialog"),
  detailCategory: document.querySelector("#detailCategory"),
  detailTitle: document.querySelector("#detailTitle"),
  detailIngredients: document.querySelector("#detailIngredients"),
  detailSteps: document.querySelector("#detailSteps"),
  detailReferencesSection: document.querySelector("#detailReferencesSection"),
  detailReferences: document.querySelector("#detailReferences"),
  detailNotes: document.querySelector("#detailNotes"),
  detailShareButton: document.querySelector("#detailShareButton"),
  detailEditButton: document.querySelector("#detailEditButton"),
  detailAddToGroceryButton: document.querySelector("#detailAddToGroceryButton"),
  confirmDialog: document.querySelector("#confirmDialog"),
  confirmTitle: document.querySelector("#confirmTitle"),
  confirmMessage: document.querySelector("#confirmMessage"),
  confirmCancelButton: document.querySelector("#confirmCancelButton"),
  confirmActionButton: document.querySelector("#confirmActionButton"),
  importFileInput: document.querySelector("#importFileInput"),
  toast: document.querySelector("#toast")
};

let state = Core.blankState();
let activeUserId = null;
let authClient = null;
let authSession = null;
let authMode = "signin";
let authBusy = false;
let syncBusy = false;
let syncRequested = false;
let syncTimer = null;
let currentView = "recipes";
let pantryFilter = "available";
let recipeCategoryFilter = "all";
let ingredientReviewFilter = "all";
let pantryOrganiserFilter = "all";
let selectedRecipes = new Set();
let ingredientReviewSelection = new Set();
let pantryOrganiserSelection = new Set();
let ingredientKeepName = "";
let ingredientReviewLookup = new Map();
let pantryOrganiserLookup = new Map();
let detailRecipeId = null;
let confirmResolver = null;
let toastTimer = null;

function safeParse(value) {
  try { return JSON.parse(value); } catch { return null; }
}

function escapeHtml(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function cachedUser() {
  const value = safeParse(localStorage.getItem(AUTH_USER_KEY));
  return value?.id && value?.email ? value : null;
}

function cacheUser(user) {
  if (!user?.id || !user?.email) return;
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ id: user.id, email: user.email, cachedAt: Date.now() }));
}

function stateKey(userId = activeUserId) {
  return userId ? `${STATE_PREFIX}.${userId}` : null;
}

function lastSyncKey(userId = activeUserId) {
  return userId ? `${LAST_SYNC_PREFIX}.${userId}` : null;
}

function loadUserState(userId) {
  const key = stateKey(userId);
  return Core.hydrateState(key ? safeParse(localStorage.getItem(key)) : null);
}

function persistState() {
  const key = stateKey();
  if (key) localStorage.setItem(key, JSON.stringify(state));
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  dom.toast.textContent = message;
  dom.toast.classList.add("is-visible");
  toastTimer = window.setTimeout(() => dom.toast.classList.remove("is-visible"), 2600);
}

function applyTheme(theme, saveGlobal = true) {
  const nextTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = nextTheme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", nextTheme === "dark" ? "#201823" : "#fff7e8");
  dom.themeToggle.setAttribute("aria-label", nextTheme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  document.querySelectorAll("[data-theme-choice]").forEach(button => button.classList.toggle("is-active", button.dataset.themeChoice === nextTheme));
  if (saveGlobal) localStorage.setItem(LAST_THEME_KEY, nextTheme);
}

function commit(nextState, options = {}) {
  state = Core.hydrateState(nextState);
  persistState();
  applyTheme(state.profile.theme);
  renderAll();
  if (options.message) showToast(options.message);
  if (options.sync !== false) requestSync();
}

function activeRecipes() { return Core.active(state.recipes); }
function activeGrocery() { return Core.active(state.grocery); }
function activePantry() { return Core.active(state.pantry); }

function categoryKey(value) {
  const category = Core.cleanText(value, 36);
  return category ? category.toLocaleLowerCase() : "__uncategorized__";
}

function renderCategoryOptions(recipes) {
  const categories = new Map();
  for (const recipe of recipes) {
    const key = categoryKey(recipe.category);
    if (!categories.has(key)) categories.set(key, recipe.category || "Uncategorised");
  }
  if (recipeCategoryFilter !== "all" && !categories.has(recipeCategoryFilter)) recipeCategoryFilter = "all";
  const sorted = [...categories.entries()].sort((a, b) => a[1].localeCompare(b[1], undefined, { sensitivity: "base" }));
  dom.recipeCategoryFilter.innerHTML = `<option value="all">All categories</option>${sorted.map(([key, label]) => `<option value="${escapeHtml(key)}">${escapeHtml(label)}</option>`).join("")}`;
  dom.recipeCategoryFilter.value = recipeCategoryFilter;
}

function ingredientCatalogue() {
  const byName = new Map();
  for (const recipe of activeRecipes()) {
    const seenInRecipe = new Set();
    for (const rawIngredient of recipe.ingredients) {
      const name = Core.parseIngredientLine(rawIngredient).name;
      if (!name) continue;
      if (!byName.has(name)) byName.set(name, { name, normalizedName: Core.normalizeName(name), recipeIds: new Set(), recipeTitles: new Set() });
      if (seenInRecipe.has(name)) continue;
      seenInRecipe.add(name);
      const item = byName.get(name);
      item.recipeIds.add(recipe.id);
      item.recipeTitles.add(recipe.title);
    }
  }

  const duplicateGroups = new Map();
  for (const item of byName.values()) {
    if (!duplicateGroups.has(item.normalizedName)) duplicateGroups.set(item.normalizedName, []);
    duplicateGroups.get(item.normalizedName).push(item.name);
  }

  return [...byName.values()]
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name))
    .map((item, index) => ({
      id: `ingredient-${index}`,
      name: item.name,
      normalizedName: item.normalizedName,
      recipeCount: item.recipeIds.size,
      recipeTitles: [...item.recipeTitles].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
      duplicateGroupSize: duplicateGroups.get(item.normalizedName)?.length || 1
    }));
}

function ingredientRecipeSummary(item) {
  const visibleTitles = item.recipeTitles.slice(0, 3);
  const extra = item.recipeTitles.length - visibleTitles.length;
  return `${item.recipeCount} ${item.recipeCount === 1 ? "recipe" : "recipes"}${visibleTitles.length ? ` · ${visibleTitles.join(", ")}${extra > 0 ? ` +${extra}` : ""}` : ""}`;
}

function updateIngredientMergeBar(items) {
  const validNames = new Set(items.map(item => item.name));
  ingredientReviewSelection = new Set([...ingredientReviewSelection].filter(name => validNames.has(name)));
  const selectedNames = [...ingredientReviewSelection].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  if (!ingredientReviewSelection.has(ingredientKeepName)) ingredientKeepName = selectedNames[0] || "";
  dom.ingredientMergeBar.hidden = selectedNames.length === 0;
  dom.ingredientMergeCount.textContent = String(selectedNames.length);
  dom.ingredientMergeHint.textContent = selectedNames.length < 2 ? "Select at least two names to merge." : "Choose the spelling every recipe should keep.";
  dom.ingredientKeepSelect.innerHTML = selectedNames.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
  dom.ingredientKeepSelect.value = ingredientKeepName;
  dom.ingredientKeepSelect.disabled = selectedNames.length < 2;
  dom.mergeIngredientsButton.disabled = selectedNames.length < 2;
}

function renderIngredientReview() {
  const items = ingredientCatalogue();
  const duplicateGroupCount = new Set(items.filter(item => item.duplicateGroupSize > 1).map(item => item.normalizedName)).size;
  dom.ingredientReviewTotal.textContent = String(items.length);
  dom.ingredientReviewDuplicateCount.textContent = String(duplicateGroupCount);
  document.querySelectorAll("[data-ingredient-review-filter]").forEach(button => button.classList.toggle("is-active", button.dataset.ingredientReviewFilter === ingredientReviewFilter));
  updateIngredientMergeBar(items);

  const query = dom.ingredientReviewSearch.value.trim().toLocaleLowerCase();
  const visibleItems = items.filter(item => {
    const matchesSearch = !query || [item.name, ...item.recipeTitles].join(" ").toLocaleLowerCase().includes(query);
    const matchesFilter = ingredientReviewFilter === "all" || item.duplicateGroupSize > 1;
    return matchesSearch && matchesFilter;
  });
  ingredientReviewLookup = new Map(items.map(item => [item.id, item.name]));
  dom.ingredientReviewList.innerHTML = visibleItems.map(item => {
    const selected = ingredientReviewSelection.has(item.name);
    return `<button class="ingredient-manager-item${selected ? " is-selected" : ""}" type="button" data-review-ingredient-id="${item.id}" aria-pressed="${selected}" aria-label="${selected ? "Deselect" : "Select"} ${escapeHtml(item.name)}">
      <span class="ingredient-selection-mark"><svg><use href="#i-check"></use></svg></span>
      <span class="ingredient-manager-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(ingredientRecipeSummary(item))}</small></span>
      ${item.duplicateGroupSize > 1 ? '<span class="ingredient-state-badge is-duplicate">Possible duplicate</span>' : ""}
    </button>`;
  }).join("");
  dom.ingredientReviewList.hidden = visibleItems.length === 0;
  dom.ingredientReviewEmpty.hidden = visibleItems.length !== 0;
}

function pantryIngredientStatus(name) {
  const normalized = Core.normalizeName(name);
  const matches = activePantry().filter(item => Core.normalizeName(Core.parseIngredientLine(item.name).name) === normalized);
  if (matches.some(item => item.status === "available")) return "available";
  if (matches.some(item => item.status === "finished")) return "finished";
  return "missing";
}

function renderPantryOrganiser() {
  const items = ingredientCatalogue().map(item => ({ ...item, pantryStatus: pantryIngredientStatus(item.name) }));
  const validSelectableNames = new Set(items.filter(item => item.pantryStatus !== "available").map(item => item.name));
  pantryOrganiserSelection = new Set([...pantryOrganiserSelection].filter(name => validSelectableNames.has(name)));
  const inPantryCount = items.filter(item => item.pantryStatus === "available").length;
  dom.pantryOrganiserTotal.textContent = String(items.length);
  dom.pantryOrganiserInPantry.textContent = String(inPantryCount);
  dom.pantryOrganiserRemaining.textContent = String(items.length - inPantryCount);
  dom.pantryOrganiserActionBar.hidden = pantryOrganiserSelection.size === 0;
  dom.pantryOrganiserSelectedCount.textContent = String(pantryOrganiserSelection.size);
  document.querySelectorAll("[data-pantry-organiser-filter]").forEach(button => button.classList.toggle("is-active", button.dataset.pantryOrganiserFilter === pantryOrganiserFilter));

  const query = dom.pantryOrganiserSearch.value.trim().toLocaleLowerCase();
  const visibleItems = items.filter(item => {
    const matchesSearch = !query || [item.name, ...item.recipeTitles].join(" ").toLocaleLowerCase().includes(query);
    const matchesFilter = pantryOrganiserFilter === "all"
      || (pantryOrganiserFilter === "missing" && item.pantryStatus !== "available")
      || (pantryOrganiserFilter === "available" && item.pantryStatus === "available");
    return matchesSearch && matchesFilter;
  });
  pantryOrganiserLookup = new Map(items.map(item => [item.id, item.name]));
  dom.pantryOrganiserList.innerHTML = visibleItems.map(item => {
    const selected = pantryOrganiserSelection.has(item.name);
    const available = item.pantryStatus === "available";
    const statusLabel = available ? "In pantry" : item.pantryStatus === "finished" ? "Finished" : "Not in pantry";
    const statusClass = available ? "is-available" : item.pantryStatus === "finished" ? "is-finished" : "";
    return `<button class="ingredient-manager-item${selected ? " is-selected" : ""}${available ? " is-available" : ""}" type="button" data-pantry-ingredient-id="${item.id}" aria-pressed="${selected}" aria-label="${available ? `${escapeHtml(item.name)} is already in the pantry` : `${selected ? "Deselect" : "Select"} ${escapeHtml(item.name)}`}" ${available ? "disabled" : ""}>
      <span class="ingredient-selection-mark"><svg><use href="#i-check"></use></svg></span>
      <span class="ingredient-manager-copy"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(ingredientRecipeSummary(item))}</small></span>
      <span class="ingredient-state-badge ${statusClass}">${statusLabel}</span>
    </button>`;
  }).join("");
  dom.pantryOrganiserList.hidden = visibleItems.length === 0;
  dom.pantryOrganiserEmpty.hidden = visibleItems.length !== 0;
}

function setView(view, options = {}) {
  const next = ["recipes", "grocery", "pantry", "settings", "ingredient-review", "pantry-organiser"].includes(view) ? view : "recipes";
  currentView = next;
  document.querySelectorAll(".view").forEach(section => section.classList.toggle("is-active", section.id === `view-${next}`));
  const navView = next === "ingredient-review" ? "settings" : next === "pantry-organiser" ? "pantry" : next;
  document.querySelectorAll(".nav-button[data-view]").forEach(button => button.classList.toggle("is-active", button.dataset.view === navView));
  const eyebrow = { recipes: "RECIPE BOX", grocery: "SHOPPING RUN", pantry: "WHAT'S AT HOME", settings: "MY KITCHEN", "ingredient-review": "TIDY THE SHELF", "pantry-organiser": "STOCK THE PANTRY" }[next];
  dom.viewEyebrow.textContent = eyebrow;
  if (next === "ingredient-review") renderIngredientReview();
  if (next === "pantry-organiser") renderPantryOrganiser();
  if (!options.silentHash) history.replaceState(null, "", `${location.pathname}${location.search}#${next}`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderRecipeGrid() {
  const allRecipes = activeRecipes();
  renderCategoryOptions(allRecipes);
  const query = dom.recipeSearch.value.trim().toLocaleLowerCase();
  const recipes = allRecipes.filter(recipe => {
    const matchesCategory = recipeCategoryFilter === "all" || categoryKey(recipe.category) === recipeCategoryFilter;
    const matchesSearch = !query || [recipe.title, recipe.category, recipe.notes, ...recipe.ingredients, ...recipe.youtubeLinks].join(" ").toLocaleLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });
  const validIds = new Set(allRecipes.map(recipe => recipe.id));
  selectedRecipes = new Set([...selectedRecipes].filter(id => validIds.has(id)));
  const filtering = Boolean(query) || recipeCategoryFilter !== "all";
  dom.recipeCountLabel.textContent = filtering ? `${recipes.length} of ${allRecipes.length} recipes` : `${allRecipes.length} ${allRecipes.length === 1 ? "recipe" : "recipes"}`;
  dom.selectionBar.hidden = selectedRecipes.size === 0;
  dom.selectedRecipeCount.textContent = String(selectedRecipes.size);
  dom.recipeGrid.innerHTML = recipes.map(recipe => {
    const selected = selectedRecipes.has(recipe.id);
    const preview = recipe.ingredients.slice(0, 4).join(" · ") || "No ingredients yet";
    return `<article class="recipe-card${selected ? " is-selected" : ""}" data-recipe-id="${escapeHtml(recipe.id)}">
      <button class="recipe-select" type="button" data-action="toggle-recipe" aria-label="${selected ? "Deselect" : "Select"} ${escapeHtml(recipe.title)}" aria-pressed="${selected}"><svg><use href="#i-check"></use></svg></button>
      <div class="recipe-card-top" data-action="view-recipe" role="button" tabindex="0">
        <span class="category-chip">${escapeHtml(recipe.category || "Recipe")}</span><h2>${escapeHtml(recipe.title)}</h2>
      </div>
      <div class="recipe-card-body"><div class="recipe-meta"><span>${recipe.ingredients.length} ingredients</span><span>${recipe.steps.length} steps</span>${recipe.youtubeLinks.length ? `<span>${recipe.youtubeLinks.length} ${recipe.youtubeLinks.length === 1 ? "video" : "videos"}</span>` : ""}</div>
        <p class="recipe-preview">${escapeHtml(preview)}</p>
        <div class="recipe-actions"><button class="mini-icon-button" type="button" data-action="edit-recipe" aria-label="Edit ${escapeHtml(recipe.title)}"><svg><use href="#i-edit"></use></svg></button><button class="mini-icon-button" type="button" data-action="delete-recipe" aria-label="Delete ${escapeHtml(recipe.title)}"><svg><use href="#i-trash"></use></svg></button><button class="mini-icon-button" type="button" data-action="view-recipe" aria-label="Open ${escapeHtml(recipe.title)}"><svg><use href="#i-arrow"></use></svg></button></div>
      </div></article>`;
  }).join("");
  dom.recipeGrid.hidden = recipes.length === 0;
  dom.recipesEmpty.hidden = recipes.length !== 0;
  const emptyTitle = dom.recipesEmpty.querySelector("h2");
  const emptyCopy = dom.recipesEmpty.querySelector("p");
  const emptyButton = dom.recipesEmpty.querySelector("button");
  if (filtering && allRecipes.length) {
    emptyTitle.textContent = "No recipe matches those filters";
    emptyCopy.textContent = "Try another search or category.";
    emptyButton.hidden = true;
  } else {
    emptyTitle.textContent = "Your recipe box is waiting";
    emptyCopy.textContent = "Add the dishes you love and myKitchen will remember the shopping.";
    emptyButton.hidden = false;
  }
}

function recipeSourceLabel(item) {
  if (!item.sourceRecipeIds.length) return "Added manually";
  const titles = item.sourceRecipeIds.map(id => state.recipes.find(recipe => recipe.id === id && !recipe.deletedAt)?.title).filter(Boolean);
  return titles.length ? `From ${titles.join(", ")}` : "From a recipe";
}

function renderGrocery() {
  const items = activeGrocery().sort((a, b) => Number(a.bought) - Number(b.bought) || Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  const pantryCount = items.filter(item => Core.pantryHas(state, item.name)).length;
  const boughtCount = items.filter(item => item.bought).length;
  const openCount = items.length - boughtCount;
  dom.groceryOpenCount.textContent = String(openCount);
  dom.groceryPantryCount.textContent = String(pantryCount);
  dom.groceryBoughtCount.textContent = String(boughtCount);
  dom.clearGroceryButton.hidden = items.length === 0;
  for (const badge of [dom.groceryNavCount, dom.groceryMobileCount]) {
    badge.textContent = String(openCount);
    badge.hidden = openCount === 0;
  }
  dom.groceryList.innerHTML = items.map(item => {
    const inPantry = Core.pantryHas(state, item.name);
    return `<article class="grocery-item${item.bought ? " is-bought" : ""}" data-grocery-id="${escapeHtml(item.id)}">
      <button class="shopping-check" type="button" data-action="toggle-grocery" aria-label="${item.bought ? "Mark not bought" : "Mark bought"}: ${escapeHtml(item.name)}" aria-pressed="${item.bought}"><svg><use href="#i-check"></use></svg></button>
      <div class="grocery-copy"><strong class="grocery-name">${escapeHtml(item.name)}</strong><small class="grocery-source">${escapeHtml(recipeSourceLabel(item))}</small></div>
      ${inPantry ? '<span class="pantry-badge">In pantry</span>' : ""}
      <button class="mini-icon-button" type="button" data-action="delete-grocery" aria-label="Remove ${escapeHtml(item.name)}"><svg><use href="#i-trash"></use></svg></button>
    </article>`;
  }).join("");
  dom.groceryList.hidden = items.length === 0;
  dom.groceryEmpty.hidden = items.length !== 0;
}

function renderPantry() {
  const allItems = activePantry().sort((a, b) => (a.status === b.status ? Date.parse(b.updatedAt) - Date.parse(a.updatedAt) : a.status === "available" ? -1 : 1));
  const available = allItems.filter(item => item.status === "available").length;
  const finished = allItems.length - available;
  dom.availablePantryCount.textContent = String(available);
  dom.finishedPantryCount.textContent = String(finished);
  document.querySelectorAll("[data-pantry-filter]").forEach(button => button.classList.toggle("is-active", button.dataset.pantryFilter === pantryFilter));
  const visible = allItems.filter(item => pantryFilter === "all" || item.status === pantryFilter);
  dom.pantryList.innerHTML = visible.map(item => `<article class="pantry-card${item.status === "finished" ? " is-finished" : ""}" data-pantry-id="${escapeHtml(item.id)}">
    <div class="pantry-card-head"><div><h3>${escapeHtml(item.name)}</h3><span class="pantry-status">${item.status === "available" ? "Available" : "Finished"}</span></div><button class="mini-icon-button" type="button" data-action="delete-pantry" aria-label="Remove ${escapeHtml(item.name)}"><svg><use href="#i-trash"></use></svg></button></div>
    <button class="button ${item.status === "available" ? "ghost" : "secondary"}" type="button" data-action="toggle-pantry">${item.status === "available" ? "Mark finished" : "Put back"}</button>
  </article>`).join("");
  dom.pantryList.hidden = visible.length === 0;
  dom.pantryEmpty.hidden = visible.length !== 0;
  dom.pantryEmpty.querySelector("h2").textContent = allItems.length ? `No ${pantryFilter} items` : "Nothing here yet";
  dom.pantryEmpty.querySelector("p").textContent = allItems.length ? "Choose another pantry filter." : "Add pantry items manually or tick them off while shopping.";
}

function renderAccount() {
  const user = authSession?.user || cachedUser();
  const offline = !navigator.onLine || !authSession;
  dom.accountEmail.textContent = user?.email || "—";
  dom.connectionPill.classList.toggle("is-offline", offline);
  dom.connectionPill.querySelector("span").textContent = offline ? "Offline" : "Connected";
  dom.settingsConnectionStatus.textContent = offline ? "Offline access" : "Connected";
  dom.settingsConnectionStatus.classList.toggle("is-offline", offline);
  dom.syncNowButton.disabled = offline || syncBusy;
  if (!syncBusy) updateSyncStatus();
}

function renderAll() {
  const name = state.profile.name || "there";
  dom.topGreeting.textContent = `Hello, ${name}!`;
  dom.profileNameInput.value = state.profile.name;
  renderRecipeGrid();
  renderGrocery();
  renderPantry();
  renderIngredientReview();
  renderPantryOrganiser();
  renderAccount();
  applyTheme(state.profile.theme);
}

function openRecipeForm(recipe = null) {
  dom.recipeForm.reset();
  dom.recipeIdInput.value = recipe?.id || "";
  dom.recipeDialogEyebrow.textContent = recipe ? "EDIT RECIPE" : "NEW RECIPE";
  dom.recipeDialogTitle.textContent = recipe ? "Edit recipe" : "Add a recipe";
  if (recipe) {
    dom.recipeTitleInput.value = recipe.title;
    dom.recipeCategoryInput.value = recipe.category;
    dom.recipeIngredientsInput.value = recipe.ingredients.join("\n");
    dom.recipeStepsInput.value = recipe.steps.join("\n");
    dom.recipeYoutubeLinksInput.value = recipe.youtubeLinks.join("\n");
    dom.recipeNotesInput.value = recipe.notes;
  }
  dom.recipeDialog.showModal();
  window.setTimeout(() => dom.recipeTitleInput.focus(), 50);
}

function openRecipeDetail(recipe) {
  detailRecipeId = recipe.id;
  dom.detailCategory.textContent = (recipe.category || "Recipe").toLocaleUpperCase();
  dom.detailTitle.textContent = recipe.title;
  dom.detailIngredients.innerHTML = recipe.ingredients.map(item => `<li>${escapeHtml(item)}</li>`).join("") || "<li>No ingredients added.</li>";
  dom.detailSteps.innerHTML = recipe.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("") || "<li>No method added.</li>";
  dom.detailReferences.innerHTML = recipe.youtubeLinks.map((link, index) => `<a class="reference-link" href="${escapeHtml(link)}" target="_blank" rel="noopener noreferrer"><svg aria-hidden="true"><use href="#i-play"></use></svg>YouTube reference ${index + 1}</a>`).join("");
  dom.detailReferencesSection.hidden = recipe.youtubeLinks.length === 0;
  dom.detailNotes.textContent = recipe.notes;
  dom.detailNotes.hidden = !recipe.notes;
  dom.recipeDetailDialog.showModal();
}

async function copyPlainText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.append(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) throw new Error("Copy is not available on this device.");
}

async function shareRecipe(recipe) {
  const text = Core.recipePlainText(recipe);
  try {
    if (navigator.share) {
      await navigator.share({ title: recipe.title, text });
      return;
    }
    await copyPlainText(text);
    showToast("Recipe copied as plain text.");
  } catch (error) {
    if (error?.name === "AbortError") return;
    try {
      await copyPlainText(text);
      showToast("Recipe copied as plain text.");
    } catch {
      showToast("This device could not share the recipe.");
    }
  }
}

function askConfirm(title, message, actionLabel = "Delete") {
  dom.confirmTitle.textContent = title;
  dom.confirmMessage.textContent = message;
  dom.confirmActionButton.textContent = actionLabel;
  if (dom.confirmDialog.open) dom.confirmDialog.close();
  dom.confirmDialog.showModal();
  return new Promise(resolve => { confirmResolver = resolve; });
}

function resolveConfirm(value) {
  dom.confirmDialog.close();
  if (confirmResolver) confirmResolver(Boolean(value));
  confirmResolver = null;
}

function touchProfile(updates) {
  state.profile = { ...state.profile, ...updates, updatedAt: Core.nowIso() };
  commit(state);
}

function addManualGrocery(name) {
  const displayName = Core.cleanText(name, 120);
  const normalized = Core.normalizeName(displayName);
  if (!normalized) return;
  const now = Core.nowIso();
  const existing = state.grocery.find(item => item.normalizedName === normalized);
  if (existing) {
    existing.name = displayName;
    existing.deletedAt = null;
    existing.bought = false;
    existing.boughtAt = null;
    existing.updatedAt = now;
  } else {
    state.grocery.unshift(Core.normalizeGrocery({ id: Core.recordId("grocery"), name: displayName, sourceRecipeIds: [], bought: false, createdAt: now, updatedAt: now }));
  }
  commit(state, { message: `${displayName} added to your list.` });
}

function addSelectedRecipesToGrocery(recipeIds = [...selectedRecipes]) {
  const ids = recipeIds.filter(Boolean);
  if (!ids.length) return;
  const ingredientCount = activeRecipes().filter(recipe => ids.includes(recipe.id)).reduce((total, recipe) => total + recipe.ingredients.length, 0);
  state = Core.addRecipesToGrocery(state, ids);
  selectedRecipes.clear();
  commit(state, { message: `${ingredientCount} ingredient ${ingredientCount === 1 ? "item" : "items"} added.` });
  if (dom.recipeDetailDialog.open) dom.recipeDetailDialog.close();
  setView("grocery");
}

function backupPayload() {
  return {
    app: "myKitchen",
    version: 1,
    exportedAt: Core.nowIso(),
    data: {
      schemaVersion: 1,
      profile: Core.clone(state.profile),
      recipes: Core.active(state.recipes),
      grocery: Core.active(state.grocery),
      pantry: Core.active(state.pantry)
    }
  };
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(backupPayload(), null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `myKitchen-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  showToast("Backup exported.");
}

function prepareReplacement(importedInput) {
  const imported = Core.hydrateState(importedInput);
  const now = Core.nowIso();
  const replaceList = (current, incoming) => {
    const incomingIds = new Set(Core.active(incoming).map(item => item.id));
    const liveIncoming = Core.active(incoming).map(item => ({ ...item, deletedAt: null, updatedAt: now }));
    const tombstones = current.filter(item => !item.deletedAt && !incomingIds.has(item.id)).map(item => ({ ...item, deletedAt: now, updatedAt: now }));
    return [...liveIncoming, ...tombstones];
  };
  return Core.hydrateState({
    profile: { ...imported.profile, name: imported.profile.name || state.profile.name, updatedAt: now },
    recipes: replaceList(state.recipes, imported.recipes),
    grocery: replaceList(state.grocery, imported.grocery),
    pantry: replaceList(state.pantry, imported.pantry)
  });
}

async function importBackup(file) {
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed?.app && parsed.app !== "myKitchen") throw new Error("This is not a myKitchen backup.");
    const source = parsed?.data || parsed?.state || parsed;
    if (!source || !Array.isArray(source.recipes) || !Array.isArray(source.grocery) || !Array.isArray(source.pantry)) throw new Error("This backup is missing myKitchen data.");
    const confirmed = await askConfirm("Replace this kitchen?", "The imported recipes, grocery list and pantry will replace the current data for this account. A fresh backup is recommended first.", "Import backup");
    if (!confirmed) return;
    selectedRecipes.clear();
    ingredientReviewSelection.clear();
    pantryOrganiserSelection.clear();
    ingredientKeepName = "";
    commit(prepareReplacement(source), { message: "Backup imported. Syncing your kitchen…" });
  } catch (error) {
    showToast(error.message || "The backup could not be imported.");
  } finally {
    dom.importFileInput.value = "";
  }
}

function setAuthMode(mode, clear = true) {
  authMode = mode === "signup" ? "signup" : "signin";
  const signingUp = authMode === "signup";
  dom.signInModeButton.classList.toggle("is-active", !signingUp);
  dom.signUpModeButton.classList.toggle("is-active", signingUp);
  dom.signInModeButton.setAttribute("aria-pressed", String(!signingUp));
  dom.signUpModeButton.setAttribute("aria-pressed", String(signingUp));
  dom.authSubmitButton.textContent = signingUp ? "Create account" : "Sign in";
  dom.authPassword.autocomplete = signingUp ? "new-password" : "current-password";
  dom.authPasswordHelp.textContent = signingUp ? "Use at least 6 characters. You may need to confirm your email." : "Use the same password as your other apps.";
  if (clear) setAuthMessage();
}

function setAuthMessage(message = "", type = "") {
  dom.authMessage.textContent = message;
  dom.authMessage.classList.toggle("is-error", type === "error");
  dom.authMessage.classList.toggle("is-success", type === "success");
}

function setAccountMessage(message = "", type = "") {
  dom.accountMessage.textContent = message;
  dom.accountMessage.classList.toggle("is-error", type === "error");
  dom.accountMessage.classList.toggle("is-success", type === "success");
}

function showAuthForm(message = "", type = "") {
  dom.appShell.hidden = true;
  dom.authScreen.hidden = false;
  dom.authLoading.hidden = true;
  dom.authFormContent.hidden = false;
  setAuthMessage(message, type);
}

function showAuthLoading(message = "Checking your account…") {
  dom.appShell.hidden = true;
  dom.authScreen.hidden = false;
  dom.authLoading.hidden = false;
  dom.authLoading.lastChild.textContent = message;
  dom.authFormContent.hidden = true;
}

function setAuthBusy(busy) {
  authBusy = busy;
  [dom.authEmail, dom.authPassword, dom.signInModeButton, dom.signUpModeButton, dom.authSubmitButton].forEach(element => { element.disabled = busy; });
  dom.authSubmitButton.textContent = busy ? (authMode === "signup" ? "Creating account…" : "Signing in…") : (authMode === "signup" ? "Create account" : "Sign in");
}

function friendlyAuthError(error) {
  const message = String(error?.message || "").trim();
  const lower = message.toLocaleLowerCase();
  if (!navigator.onLine || lower.includes("failed to fetch") || lower.includes("network")) return "You appear to be offline. Connect and try again.";
  if (lower.includes("invalid login credentials")) return "The email or password is incorrect.";
  if (lower.includes("email not confirmed")) return "Confirm your email, then return to sign in.";
  if (lower.includes("user already registered")) return "An account already exists for this email. Try signing in.";
  if (lower.includes("rate limit") || lower.includes("too many")) return "Too many attempts. Wait a little, then try again.";
  return message || "Authentication could not be completed.";
}

function friendlySyncError(error) {
  const message = String(error?.message || "").trim();
  const lower = message.toLocaleLowerCase();
  if (!navigator.onLine || lower.includes("failed to fetch") || lower.includes("network")) return "Waiting for an internet connection";
  if (lower.includes("mykitchen_") && (lower.includes("does not exist") || lower.includes("not find") || lower.includes("relation") || lower.includes("schema cache"))) return "Run the included myKitchen Supabase migration";
  if (lower.includes("row-level security")) return "Sync was blocked by the database security policy";
  return message ? `Sync failed: ${message}` : "myKitchen could not be synced";
}

function authRedirectUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function submitAuth(event) {
  event.preventDefault();
  if (authBusy || !authClient) return;
  const email = dom.authEmail.value.trim().toLocaleLowerCase();
  const password = dom.authPassword.value;
  if (!email || !dom.authEmail.validity.valid) { setAuthMessage("Enter a valid email address.", "error"); dom.authEmail.focus(); return; }
  if (password.length < 6) { setAuthMessage("Your password must contain at least 6 characters.", "error"); dom.authPassword.focus(); return; }
  if (!navigator.onLine) { setAuthMessage("Connect to the internet to sign in or create an account.", "error"); return; }
  setAuthBusy(true);
  setAuthMessage();
  try {
    if (authMode === "signup") {
      const { data, error } = await authClient.auth.signUp({ email, password, options: { emailRedirectTo: authRedirectUrl() } });
      if (error) throw error;
      if (data.session?.user) await showAuthenticatedApp(data.session);
      else { dom.authPassword.value = ""; setAuthMessage("Account created. Confirm your email, then return to sign in.", "success"); }
    } else {
      const { data, error } = await authClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (!data.session?.user) throw new Error("The account session could not be started.");
      await showAuthenticatedApp(data.session);
    }
  } catch (error) {
    setAuthMessage(friendlyAuthError(error), "error");
  } finally {
    setAuthBusy(false);
  }
}

async function showAuthenticatedApp(session, options = {}) {
  const user = session?.user || options.user;
  if (!user) return;
  authSession = session?.user ? session : null;
  cacheUser(user);
  if (activeUserId !== user.id) {
    activeUserId = user.id;
    state = loadUserState(user.id);
    selectedRecipes.clear();
    ingredientReviewSelection.clear();
    pantryOrganiserSelection.clear();
    ingredientKeepName = "";
    applyTheme(state.profile.theme);
  }
  dom.authScreen.hidden = true;
  dom.appShell.hidden = false;
  setView(location.hash.replace("#", "") || "recipes", { silentHash: true });
  renderAll();
  if (!options.offline && authSession && navigator.onLine) await syncKitchen({ initial: true });
  requestNameIfNeeded();
}

async function signOut() {
  dom.signOutButton.disabled = true;
  setAccountMessage("Signing out…");
  try {
    if (authClient && authSession) {
      const { error } = await authClient.auth.signOut({ scope: "local" });
      if (error) throw error;
    }
    authSession = null;
    activeUserId = null;
    localStorage.removeItem(AUTH_USER_KEY);
    if (dom.nameDialog.open) dom.nameDialog.close();
    setAuthMode("signin", false);
    showAuthForm("You have been signed out. Your myKitchen data remains on this device.", "success");
  } catch (error) {
    setAccountMessage(friendlyAuthError(error), "error");
  } finally {
    dom.signOutButton.disabled = false;
  }
}

function requestNameIfNeeded() {
  if (!activeUserId || state.profile.name || dom.nameDialog.open) return;
  dom.firstNameInput.value = "";
  dom.nameDialog.showModal();
}

function cloudRecipe(row) {
  return Core.normalizeRecipe({ id: row.id, title: row.title, category: row.category, notes: row.notes, ingredients: row.ingredients, steps: row.steps, youtubeLinks: row.youtube_links, createdAt: row.client_created_at, updatedAt: row.client_updated_at, deletedAt: row.deleted_at });
}

function cloudGrocery(row) {
  return Core.normalizeGrocery({ id: row.id, name: row.name, normalizedName: row.normalized_name, sourceRecipeIds: row.source_recipe_ids, bought: row.bought, boughtAt: row.bought_at, createdAt: row.client_created_at, updatedAt: row.client_updated_at, deletedAt: row.deleted_at });
}

function cloudPantry(row) {
  return Core.normalizePantry({ id: row.id, name: row.name, normalizedName: row.normalized_name, status: row.status, stockedAt: row.stocked_at, finishedAt: row.finished_at, createdAt: row.client_created_at, updatedAt: row.client_updated_at, deletedAt: row.deleted_at });
}

async function fetchCloudState() {
  const [profile, recipes, grocery, pantry] = await Promise.all([
    authClient.from("mykitchen_profiles").select("user_id, name, theme, schema_version, client_updated_at, updated_at"),
    authClient.from("mykitchen_recipes").select("id, title, category, notes, ingredients, steps, youtube_links, client_created_at, client_updated_at, deleted_at, updated_at"),
    authClient.from("mykitchen_grocery_items").select("id, name, normalized_name, source_recipe_ids, bought, bought_at, client_created_at, client_updated_at, deleted_at, updated_at"),
    authClient.from("mykitchen_pantry_items").select("id, name, normalized_name, status, stocked_at, finished_at, client_created_at, client_updated_at, deleted_at, updated_at")
  ]);
  for (const response of [profile, recipes, grocery, pantry]) if (response.error) throw response.error;
  const profileRow = profile.data?.[0];
  return Core.hydrateState({
    profile: profileRow ? { name: profileRow.name, theme: profileRow.theme, updatedAt: profileRow.client_updated_at } : Core.blankState().profile,
    recipes: (recipes.data || []).map(cloudRecipe),
    grocery: (grocery.data || []).map(cloudGrocery),
    pantry: (pantry.data || []).map(cloudPantry)
  });
}

async function upsertCloudState(source) {
  const userId = authSession.user.id;
  const requests = [];
  requests.push(authClient.from("mykitchen_profiles").upsert({ user_id: userId, name: source.profile.name, theme: source.profile.theme, schema_version: 1, client_updated_at: source.profile.updatedAt }, { onConflict: "user_id" }));
  if (source.recipes.length) requests.push(authClient.from("mykitchen_recipes").upsert(source.recipes.map(item => ({ user_id: userId, id: item.id, title: item.title, category: item.category, notes: item.notes, ingredients: item.ingredients, steps: item.steps, youtube_links: item.youtubeLinks, client_created_at: item.createdAt, client_updated_at: item.updatedAt, deleted_at: item.deletedAt })), { onConflict: "user_id,id" }));
  if (source.grocery.length) requests.push(authClient.from("mykitchen_grocery_items").upsert(source.grocery.map(item => ({ user_id: userId, id: item.id, name: item.name, normalized_name: item.normalizedName, source_recipe_ids: item.sourceRecipeIds, bought: item.bought, bought_at: item.boughtAt, client_created_at: item.createdAt, client_updated_at: item.updatedAt, deleted_at: item.deletedAt })), { onConflict: "user_id,id" }));
  if (source.pantry.length) requests.push(authClient.from("mykitchen_pantry_items").upsert(source.pantry.map(item => ({ user_id: userId, id: item.id, name: item.name, normalized_name: item.normalizedName, status: item.status, stocked_at: item.stockedAt, finished_at: item.finishedAt, client_created_at: item.createdAt, client_updated_at: item.updatedAt, deleted_at: item.deletedAt })), { onConflict: "user_id,id" }));
  const responses = await Promise.all(requests);
  for (const response of responses) if (response.error) throw response.error;
}

function formatLastSync(value) {
  const elapsed = Math.max(0, Math.round((Date.now() - Number(value)) / 1000));
  if (elapsed < 60) return "Synced just now";
  if (elapsed < 3600) return `Synced ${Math.round(elapsed / 60)}m ago`;
  return `Last synced ${new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(Number(value)))}`;
}

function setSyncStatus(message, type = "") {
  dom.cloudSyncStatus.textContent = message;
  dom.cloudSyncStatus.style.color = type === "error" ? "var(--tomato-deep)" : "";
  dom.syncNowButton.disabled = syncBusy || !authSession || !navigator.onLine;
}

function updateSyncStatus() {
  if (!navigator.onLine || !authSession) { setSyncStatus("Offline — changes are saved on this device"); return; }
  if (syncBusy) { setSyncStatus("Syncing your kitchen…"); return; }
  const key = lastSyncKey();
  const last = key ? Number(localStorage.getItem(key)) : 0;
  setSyncStatus(last ? formatLastSync(last) : "Ready to sync");
}

async function syncKitchen(options = {}) {
  if (syncBusy) { syncRequested = true; return false; }
  if (!authClient || !authSession || !navigator.onLine) { updateSyncStatus(); if (options.manual) showToast("myKitchen will sync when you are back online."); return false; }
  syncBusy = true;
  syncRequested = false;
  setSyncStatus("Syncing your kitchen…");
  try {
    const remoteBefore = await fetchCloudState();
    state = Core.mergeStates(state, remoteBefore);
    persistState();
    renderAll();
    await upsertCloudState(state);
    const remoteAfter = await fetchCloudState();
    state = Core.mergeStates(state, remoteAfter);
    persistState();
    renderAll();
    const key = lastSyncKey();
    if (key) localStorage.setItem(key, String(Date.now()));
    setSyncStatus("Synced just now");
    setAccountMessage();
    if (options.manual) showToast("Your kitchen is synced.");
    return true;
  } catch (error) {
    const message = friendlySyncError(error);
    setSyncStatus(message, "error");
    setAccountMessage(message, "error");
    if (options.manual) showToast(message);
    return false;
  } finally {
    syncBusy = false;
    dom.syncNowButton.disabled = !authSession || !navigator.onLine;
    if (syncRequested) window.setTimeout(() => syncKitchen(), 0);
  }
}

function requestSync(options = {}) {
  if (!authSession || !navigator.onLine) { renderAccount(); return; }
  if (syncBusy) { syncRequested = true; return; }
  window.clearTimeout(syncTimer);
  syncTimer = window.setTimeout(() => syncKitchen(), options.force ? 0 : SYNC_DELAY_MS);
}

async function refreshAuthentication() {
  if (!authClient) return;
  try {
    const { data, error } = await authClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await showAuthenticatedApp(data.session);
  } catch { renderAccount(); }
}

function bindEvents() {
  dom.signInModeButton.addEventListener("click", () => setAuthMode("signin"));
  dom.signUpModeButton.addEventListener("click", () => setAuthMode("signup"));
  dom.authForm.addEventListener("submit", submitAuth);
  document.querySelectorAll(".nav-button[data-view]").forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  dom.themeToggle.addEventListener("click", () => touchProfile({ theme: state.profile.theme === "dark" ? "light" : "dark" }));
  document.querySelectorAll("[data-theme-choice]").forEach(button => button.addEventListener("click", () => touchProfile({ theme: button.dataset.themeChoice })));
  document.querySelector("#addRecipeButton").addEventListener("click", () => openRecipeForm());
  document.querySelector("#emptyAddRecipeButton").addEventListener("click", () => openRecipeForm());
  dom.recipeSearch.addEventListener("input", renderRecipeGrid);
  dom.recipeCategoryFilter.addEventListener("change", () => { recipeCategoryFilter = dom.recipeCategoryFilter.value; renderRecipeGrid(); });
  document.querySelector("#clearSelectionButton").addEventListener("click", () => { selectedRecipes.clear(); renderRecipeGrid(); });
  document.querySelector("#addSelectedToGroceryButton").addEventListener("click", () => addSelectedRecipesToGrocery());
  dom.openIngredientReviewButton.addEventListener("click", () => setView("ingredient-review"));
  dom.backToSettingsButton.addEventListener("click", () => setView("settings"));
  dom.openPantryOrganiserButton.addEventListener("click", () => setView("pantry-organiser"));
  dom.backToPantryButton.addEventListener("click", () => setView("pantry"));

  dom.ingredientReviewSearch.addEventListener("input", renderIngredientReview);
  document.querySelectorAll("[data-ingredient-review-filter]").forEach(button => button.addEventListener("click", () => {
    ingredientReviewFilter = button.dataset.ingredientReviewFilter;
    renderIngredientReview();
  }));
  dom.ingredientReviewList.addEventListener("click", event => {
    const row = event.target.closest("[data-review-ingredient-id]");
    const name = row ? ingredientReviewLookup.get(row.dataset.reviewIngredientId) : null;
    if (!name) return;
    if (ingredientReviewSelection.has(name)) ingredientReviewSelection.delete(name);
    else ingredientReviewSelection.add(name);
    renderIngredientReview();
  });
  dom.ingredientKeepSelect.addEventListener("change", () => { ingredientKeepName = dom.ingredientKeepSelect.value; });
  dom.clearIngredientSelectionButton.addEventListener("click", () => {
    ingredientReviewSelection.clear();
    ingredientKeepName = "";
    renderIngredientReview();
  });
  dom.mergeIngredientsButton.addEventListener("click", async () => {
    const selectedNames = [...ingredientReviewSelection];
    const keepName = ingredientKeepName;
    if (selectedNames.length < 2 || !selectedNames.includes(keepName)) return;
    const affectedRecipes = activeRecipes().filter(recipe => recipe.ingredients.some(ingredient => {
      const ingredientName = Core.parseIngredientLine(ingredient).name;
      return selectedNames.includes(ingredientName) && ingredientName !== keepName;
    })).length;
    const replacedNames = selectedNames.filter(name => name !== keepName);
    const confirmed = await askConfirm("Merge these ingredient names?", `${replacedNames.join(", ")} will become ${keepName} in ${affectedRecipes} ${affectedRecipes === 1 ? "recipe" : "recipes"}. Your grocery list and pantry will not change.`, "Merge");
    if (!confirmed) return;
    state = Core.mergeRecipeIngredients(state, selectedNames, keepName, Core.nowIso());
    ingredientReviewSelection.clear();
    ingredientKeepName = "";
    commit(state, { message: `Ingredient names merged as ${keepName}.` });
  });

  dom.pantryOrganiserSearch.addEventListener("input", renderPantryOrganiser);
  document.querySelectorAll("[data-pantry-organiser-filter]").forEach(button => button.addEventListener("click", () => {
    pantryOrganiserFilter = button.dataset.pantryOrganiserFilter;
    renderPantryOrganiser();
  }));
  dom.pantryOrganiserList.addEventListener("click", event => {
    const row = event.target.closest("[data-pantry-ingredient-id]");
    const name = row ? pantryOrganiserLookup.get(row.dataset.pantryIngredientId) : null;
    if (!name || row.disabled || Core.pantryHas(state, name)) return;
    if (pantryOrganiserSelection.has(name)) pantryOrganiserSelection.delete(name);
    else pantryOrganiserSelection.add(name);
    renderPantryOrganiser();
  });
  dom.clearPantryOrganiserSelectionButton.addEventListener("click", () => {
    pantryOrganiserSelection.clear();
    renderPantryOrganiser();
  });
  dom.addPantryOrganiserSelectionButton.addEventListener("click", () => {
    const selectedNames = [...pantryOrganiserSelection].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
    const uniqueNames = new Map();
    for (const name of selectedNames) {
      const normalized = Core.normalizeName(name);
      if (normalized && !Core.pantryHas(state, name) && !uniqueNames.has(normalized)) uniqueNames.set(normalized, name);
    }
    if (!uniqueNames.size) {
      pantryOrganiserSelection.clear();
      renderPantryOrganiser();
      return;
    }
    const now = Core.nowIso();
    for (const name of uniqueNames.values()) state = Core.stockPantry(state, name, now);
    pantryOrganiserSelection.clear();
    const count = uniqueNames.size;
    commit(state, { message: `${count} ${count === 1 ? "ingredient" : "ingredients"} added to your pantry.` });
  });

  dom.recipeGrid.addEventListener("click", async event => {
    const card = event.target.closest("[data-recipe-id]");
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!card || !action) return;
    const recipe = state.recipes.find(item => item.id === card.dataset.recipeId && !item.deletedAt);
    if (!recipe) return;
    if (action === "toggle-recipe") {
      selectedRecipes.has(recipe.id) ? selectedRecipes.delete(recipe.id) : selectedRecipes.add(recipe.id);
      renderRecipeGrid();
    } else if (action === "view-recipe") openRecipeDetail(recipe);
    else if (action === "edit-recipe") openRecipeForm(recipe);
    else if (action === "delete-recipe") {
      const recipeId = recipe.id;
      const recipeTitle = recipe.title;
      const confirmed = await askConfirm("Delete this recipe?", `${recipeTitle} will be removed. Existing grocery items will stay on your list.`);
      if (!confirmed) return;
      const liveRecipe = state.recipes.find(item => item.id === recipeId && !item.deletedAt);
      if (!liveRecipe) return;
      const now = Core.nowIso();
      liveRecipe.deletedAt = now; liveRecipe.updatedAt = now; selectedRecipes.delete(recipeId);
      commit(state, { message: "Recipe deleted." });
    }
  });
  dom.recipeGrid.addEventListener("keydown", event => {
    if (!["Enter", " "].includes(event.key)) return;
    const target = event.target.closest('[data-action="view-recipe"]');
    if (!target) return;
    event.preventDefault(); target.click();
  });

  document.querySelectorAll("[data-close-dialog]").forEach(button => button.addEventListener("click", () => document.querySelector(`#${button.dataset.closeDialog}`)?.close()));
  dom.recipeForm.addEventListener("submit", event => {
    event.preventDefault();
    const title = Core.cleanText(dom.recipeTitleInput.value, 80);
    const ingredients = Core.cleanLines(dom.recipeIngredientsInput.value, 100, 120);
    const rawYoutubeLinks = Core.cleanLines(dom.recipeYoutubeLinksInput.value, 12, 500);
    const youtubeLinks = Core.cleanYoutubeLinks(rawYoutubeLinks);
    if (!title) { dom.recipeTitleInput.focus(); return; }
    if (!ingredients.length) { dom.recipeIngredientsInput.focus(); return; }
    if (rawYoutubeLinks.some(link => Core.cleanYoutubeLinks([link]).length === 0)) { showToast("Please use valid YouTube links only."); dom.recipeYoutubeLinksInput.focus(); return; }
    const now = Core.nowIso();
    const id = dom.recipeIdInput.value;
    const existing = id ? state.recipes.find(item => item.id === id) : null;
    if (existing) Object.assign(existing, { title, category: Core.cleanText(dom.recipeCategoryInput.value, 36), notes: Core.cleanText(dom.recipeNotesInput.value, 500), ingredients, steps: Core.cleanLines(dom.recipeStepsInput.value, 80, 500), youtubeLinks, deletedAt: null, updatedAt: now });
    else state.recipes.unshift(Core.normalizeRecipe({ id: Core.recordId("recipe"), title, category: dom.recipeCategoryInput.value, notes: dom.recipeNotesInput.value, ingredients, steps: dom.recipeStepsInput.value, youtubeLinks, createdAt: now, updatedAt: now }));
    dom.recipeDialog.close();
    commit(state, { message: existing ? "Recipe updated." : "Recipe added." });
  });
  dom.detailShareButton.addEventListener("click", () => { const recipe = state.recipes.find(item => item.id === detailRecipeId && !item.deletedAt); if (recipe) shareRecipe(recipe); });
  dom.detailEditButton.addEventListener("click", () => { const recipe = state.recipes.find(item => item.id === detailRecipeId && !item.deletedAt); if (!recipe) return; dom.recipeDetailDialog.close(); openRecipeForm(recipe); });
  dom.detailAddToGroceryButton.addEventListener("click", () => addSelectedRecipesToGrocery([detailRecipeId]));

  document.querySelector("#groceryAddForm").addEventListener("submit", event => { event.preventDefault(); const input = document.querySelector("#groceryNameInput"); addManualGrocery(input.value); input.value = ""; input.focus(); });
  dom.clearGroceryButton.addEventListener("click", async () => {
    const itemCount = activeGrocery().length;
    if (!itemCount) return;
    const confirmed = await askConfirm("Clear the grocery list?", `All ${itemCount} ${itemCount === 1 ? "item" : "items"} will be removed. Your pantry will not change.`, "Clear all");
    if (!confirmed) return;
    const liveItems = activeGrocery();
    if (!liveItems.length) return;
    const now = Core.nowIso();
    liveItems.forEach(item => { item.deletedAt = now; item.updatedAt = now; });
    commit(state, { message: "Grocery list cleared." });
  });
  dom.groceryList.addEventListener("click", async event => {
    const card = event.target.closest("[data-grocery-id]");
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!card || !action) return;
    const item = state.grocery.find(record => record.id === card.dataset.groceryId && !record.deletedAt);
    if (!item) return;
    if (action === "toggle-grocery") {
      const now = Core.nowIso();
      item.bought = !item.bought; item.boughtAt = item.bought ? now : null; item.updatedAt = now;
      state = item.bought ? Core.stockPantry(state, item.name, now) : state;
      commit(state, { message: item.bought ? `${item.name} added to your pantry.` : `${item.name} marked as not bought.` });
    } else if (action === "delete-grocery") {
      const itemId = item.id;
      const itemName = item.name;
      const confirmed = await askConfirm("Remove this grocery item?", `${itemName} will leave the grocery list. Its pantry status will not change.`, "Remove");
      if (!confirmed) return;
      const liveItem = state.grocery.find(record => record.id === itemId && !record.deletedAt);
      if (!liveItem) return;
      const now = Core.nowIso(); liveItem.deletedAt = now; liveItem.updatedAt = now;
      commit(state, { message: "Grocery item removed." });
    }
  });

  document.querySelector("#pantryAddForm").addEventListener("submit", event => { event.preventDefault(); const input = document.querySelector("#pantryNameInput"); const name = Core.cleanText(input.value, 120); if (!name) return; commit(Core.stockPantry(state, name), { message: `${name} is now in your pantry.` }); input.value = ""; input.focus(); });
  document.querySelectorAll("[data-pantry-filter]").forEach(button => button.addEventListener("click", () => { pantryFilter = button.dataset.pantryFilter; renderPantry(); }));
  dom.pantryList.addEventListener("click", async event => {
    const card = event.target.closest("[data-pantry-id]");
    const action = event.target.closest("[data-action]")?.dataset.action;
    if (!card || !action) return;
    const item = state.pantry.find(record => record.id === card.dataset.pantryId && !record.deletedAt);
    if (!item) return;
    if (action === "toggle-pantry") {
      const now = Core.nowIso(); item.status = item.status === "available" ? "finished" : "available"; item.finishedAt = item.status === "finished" ? now : null; item.stockedAt = item.status === "available" ? now : item.stockedAt; item.updatedAt = now;
      commit(state, { message: item.status === "finished" ? `${item.name} marked finished.` : `${item.name} is available again.` });
    } else if (action === "delete-pantry") {
      const itemId = item.id;
      const itemName = item.name;
      const confirmed = await askConfirm("Remove this pantry item?", `${itemName} will be removed from the pantry. Grocery items will remain.`, "Remove");
      if (!confirmed) return;
      const liveItem = state.pantry.find(record => record.id === itemId && !record.deletedAt);
      if (!liveItem) return;
      const now = Core.nowIso(); liveItem.deletedAt = now; liveItem.updatedAt = now;
      commit(state, { message: "Pantry item removed." });
    }
  });

  document.querySelector("#profileForm").addEventListener("submit", event => { event.preventDefault(); const name = Core.cleanText(dom.profileNameInput.value, 40); if (!name) return; touchProfile({ name }); showToast("Name saved."); });
  document.querySelector("#nameForm").addEventListener("submit", event => { event.preventDefault(); const name = Core.cleanText(dom.firstNameInput.value, 40); if (!name) { dom.firstNameInput.focus(); return; } dom.nameDialog.close(); touchProfile({ name }); showToast(`Welcome to myKitchen, ${name}!`); });
  dom.nameDialog.addEventListener("cancel", event => event.preventDefault());
  dom.syncNowButton.addEventListener("click", () => syncKitchen({ manual: true }));
  dom.signOutButton.addEventListener("click", signOut);
  document.querySelector("#exportButton").addEventListener("click", exportBackup);
  document.querySelector("#importButton").addEventListener("click", () => dom.importFileInput.click());
  dom.importFileInput.addEventListener("change", () => { if (dom.importFileInput.files?.[0]) importBackup(dom.importFileInput.files[0]); });
  dom.confirmCancelButton.addEventListener("click", () => resolveConfirm(false));
  dom.confirmActionButton.addEventListener("click", () => resolveConfirm(true));
  dom.confirmDialog.addEventListener("cancel", event => { event.preventDefault(); resolveConfirm(false); });

  window.addEventListener("online", refreshAuthentication);
  window.addEventListener("offline", renderAccount);
  window.addEventListener("focus", () => requestSync({ force: true }));
  document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") requestSync(); });
}

async function initialize() {
  applyTheme(localStorage.getItem(LAST_THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"), false);
  bindEvents();
  setAuthMode("signin");
  showAuthLoading();
  if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js").catch(() => {}));
  if (!window.supabase?.createClient) {
    const user = cachedUser();
    if (!navigator.onLine && user) await showAuthenticatedApp(null, { user, offline: true });
    else showAuthForm("The account service could not be loaded. Check your connection and reload.", "error");
    return;
  }
  authClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, { auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true } });
  authClient.auth.onAuthStateChange((event, session) => window.setTimeout(() => {
    if (session?.user) showAuthenticatedApp(session).catch(() => {});
    else if (event === "SIGNED_OUT" || event === "USER_DELETED") { authSession = null; activeUserId = null; localStorage.removeItem(AUTH_USER_KEY); showAuthForm("You have been signed out.", "success"); }
  }, 0));
  try {
    const { data, error } = await authClient.auth.getSession();
    if (error) throw error;
    if (data.session?.user) await showAuthenticatedApp(data.session);
    else {
      const user = cachedUser();
      if (!navigator.onLine && user) await showAuthenticatedApp(null, { user, offline: true });
      else showAuthForm();
    }
  } catch (error) {
    const user = cachedUser();
    if (!navigator.onLine && user) await showAuthenticatedApp(null, { user, offline: true });
    else showAuthForm(friendlyAuthError(error), "error");
  }
}

initialize();
