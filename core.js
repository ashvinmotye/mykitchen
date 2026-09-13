(function attachMyKitchenCore(root) {
  "use strict";

  const SCHEMA_VERSION = 2;
  const EPOCH = "1970-01-01T00:00:00.000Z";
  const DEFAULT_AISLE_ID = "aisle-unassigned";

  function nowIso() {
    return new Date().toISOString();
  }

  function clone(value) {
    return value == null ? value : JSON.parse(JSON.stringify(value));
  }

  function cleanText(value, maxLength = 200) {
    return String(value == null ? "" : value).replace(/\s+/g, " ").trim().slice(0, maxLength);
  }

  function cleanLines(value, maxItems = 100, maxLength = 160) {
    const input = Array.isArray(value) ? value : String(value || "").split(/\r?\n/);
    return input.map(item => cleanText(item, maxLength)).filter(Boolean).slice(0, maxItems);
  }

  function parseIngredientLine(value) {
    const full = cleanText(value, 120);
    if (!full) return { full: "", name: "", details: "" };
    const measurement = full.match(/\s+[-–—]\s*|[-–—]\s+/);
    const optional = full.match(/\s*\(\s*optional\s*\)/i);
    const boundaries = [measurement?.index, optional?.index].filter(index => Number.isInteger(index) && index > 0);
    if (!boundaries.length) return { full, name: full, details: "" };
    const boundary = Math.min(...boundaries);
    const name = cleanText(full.slice(0, boundary), 120);
    return name ? { full, name, details: full.slice(boundary) } : { full, name: full, details: "" };
  }

  function cleanYoutubeLinks(value) {
    const links = [];
    const seen = new Set();
    for (let candidate of cleanLines(value, 12, 500)) {
      if (!/^https?:\/\//i.test(candidate) && /^(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(candidate)) candidate = `https://${candidate}`;
      try {
        const url = new URL(candidate);
        const hostname = url.hostname.toLocaleLowerCase().replace(/^www\./, "");
        const isYoutube = hostname === "youtu.be" || hostname === "youtube.com" || hostname.endsWith(".youtube.com") || hostname === "youtube-nocookie.com" || hostname.endsWith(".youtube-nocookie.com");
        if (!isYoutube || !["http:", "https:"].includes(url.protocol)) continue;
        url.protocol = "https:";
        const normalized = url.toString();
        if (!seen.has(normalized)) { seen.add(normalized); links.push(normalized); }
      } catch {}
    }
    return links;
  }

  function normalizeName(value) {
    let normalized = cleanText(value, 120)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9\s-]/g, " ")
      .replace(/[-\s]+/g, " ")
      .trim();

    const words = normalized.split(" ");
    const last = words.at(-1) || "";
    if (last.length > 4 && last.endsWith("ies")) words[words.length - 1] = `${last.slice(0, -3)}y`;
    else if (last.length > 4 && last.endsWith("oes")) words[words.length - 1] = last.slice(0, -2);
    else if (last.length > 3 && last.endsWith("s") && !/(ss|us|is)$/.test(last)) words[words.length - 1] = last.slice(0, -1);
    normalized = words.join(" ");
    return normalized;
  }

  function recordId(prefix = "item") {
    const randomId = root.crypto && typeof root.crypto.randomUUID === "function"
      ? root.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
    return `${prefix}-${randomId}`;
  }

  function blankState() {
    return {
      schemaVersion: SCHEMA_VERSION,
      profile: { name: "", theme: "light", selectedShopId: "", updatedAt: EPOCH },
      recipes: [],
      grocery: [],
      pantry: [],
      house: [],
      aisles: [],
      shops: []
    };
  }

  function normalizeCommon(record, prefix) {
    const createdAt = cleanText(record?.createdAt || record?.clientCreatedAt || nowIso(), 40);
    return {
      id: cleanText(record?.id || recordId(prefix), 120),
      createdAt,
      updatedAt: cleanText(record?.updatedAt || record?.clientUpdatedAt || createdAt, 40),
      deletedAt: record?.deletedAt ? cleanText(record.deletedAt, 40) : null
    };
  }

  function normalizeRecipe(record) {
    const common = normalizeCommon(record, "recipe");
    return {
      ...common,
      title: cleanText(record?.title, 80),
      category: cleanText(record?.category, 36),
      notes: cleanText(record?.notes, 500),
      ingredients: cleanLines(record?.ingredients, 100, 120),
      steps: cleanLines(record?.steps, 80, 500),
      youtubeLinks: cleanYoutubeLinks(record?.youtubeLinks || record?.youtube_links)
    };
  }

  function recipePlainText(record) {
    const recipe = normalizeRecipe(record);
    const lines = [recipe.title];
    if (recipe.category) lines.push(`Category: ${recipe.category}`);
    lines.push("", "Ingredients:");
    lines.push(...(recipe.ingredients.length ? recipe.ingredients.map(item => `- ${item}`) : ["- None added"]));
    lines.push("", "Method:");
    lines.push(...(recipe.steps.length ? recipe.steps.map((step, index) => `${index + 1}. ${step}`) : ["No method added."]));
    if (recipe.notes) lines.push("", "Notes:", recipe.notes);
    if (recipe.youtubeLinks.length) {
      lines.push("", "YouTube references:");
      lines.push(...recipe.youtubeLinks.map((link, index) => `${index + 1}. ${link}`));
    }
    return lines.join("\n");
  }

  function normalizeGrocery(record) {
    const common = normalizeCommon(record, "grocery");
    const name = cleanText(record?.name, 120);
    return {
      ...common,
      name,
      normalizedName: normalizeName(record?.normalizedName || name),
      category: record?.category === "house" ? "house" : "pantry",
      aisleId: cleanText(record?.aisleId || record?.aisle_id || DEFAULT_AISLE_ID, 120) || DEFAULT_AISLE_ID,
      sourceRecipeIds: [...new Set(cleanLines(record?.sourceRecipeIds, 100, 120))],
      bought: Boolean(record?.bought),
      boughtAt: record?.boughtAt ? cleanText(record.boughtAt, 40) : null
    };
  }

  function normalizePantry(record) {
    const common = normalizeCommon(record, "pantry");
    const name = cleanText(record?.name, 120);
    const status = record?.status === "finished" ? "finished" : "available";
    return {
      ...common,
      name,
      normalizedName: normalizeName(record?.normalizedName || name),
      aisleId: cleanText(record?.aisleId || record?.aisle_id || DEFAULT_AISLE_ID, 120) || DEFAULT_AISLE_ID,
      status,
      stockedAt: cleanText(record?.stockedAt || common.createdAt, 40),
      finishedAt: status === "finished" && record?.finishedAt ? cleanText(record.finishedAt, 40) : null
    };
  }

  function normalizeHouse(record) {
    const common = normalizeCommon(record, "house");
    const name = cleanText(record?.name, 120);
    const status = record?.status === "finished" ? "finished" : "available";
    return {
      ...common,
      name,
      normalizedName: normalizeName(record?.normalizedName || name),
      aisleId: cleanText(record?.aisleId || record?.aisle_id || DEFAULT_AISLE_ID, 120) || DEFAULT_AISLE_ID,
      status,
      stockedAt: cleanText(record?.stockedAt || common.createdAt, 40),
      finishedAt: status === "finished" && record?.finishedAt ? cleanText(record.finishedAt, 40) : null
    };
  }

  function normalizeAisle(record) {
    const common = normalizeCommon(record, "aisle");
    const name = cleanText(record?.name, 60);
    return {
      ...common,
      name,
      normalizedName: normalizeName(record?.normalizedName || name)
    };
  }

  function normalizeShop(record) {
    const common = normalizeCommon(record, "shop");
    const name = cleanText(record?.name, 60);
    return {
      ...common,
      name,
      normalizedName: normalizeName(record?.normalizedName || name),
      aisleOrder: [...new Set(cleanLines(record?.aisleOrder || record?.aisle_order, 300, 120))]
    };
  }

  function hydrateState(raw) {
    const base = blankState();
    const source = raw && typeof raw === "object" ? raw : {};
    const profile = source.profile && typeof source.profile === "object" ? source.profile : {};
    base.profile = {
      name: cleanText(profile.name, 40),
      theme: profile.theme === "dark" ? "dark" : "light",
      selectedShopId: cleanText(profile.selectedShopId || profile.selected_shop_id, 120),
      updatedAt: cleanText(profile.updatedAt || EPOCH, 40)
    };
    base.recipes = Array.isArray(source.recipes) ? source.recipes.map(normalizeRecipe).filter(item => item.title) : [];
    base.grocery = Array.isArray(source.grocery) ? source.grocery.map(normalizeGrocery).filter(item => item.name && item.normalizedName) : [];
    base.pantry = Array.isArray(source.pantry) ? source.pantry.map(normalizePantry).filter(item => item.name && item.normalizedName) : [];
    base.house = Array.isArray(source.house) ? source.house.map(normalizeHouse).filter(item => item.name && item.normalizedName) : [];
    base.aisles = Array.isArray(source.aisles) ? source.aisles.map(normalizeAisle).filter(item => item.name && item.normalizedName) : [];
    base.shops = Array.isArray(source.shops) ? source.shops.map(normalizeShop).filter(item => item.name && item.normalizedName) : [];
    return base;
  }

  function timestamp(value) {
    const parsed = Date.parse(value || EPOCH);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  function mergeRecordLists(localRecords, remoteRecords) {
    const merged = new Map();
    for (const record of [...(localRecords || []), ...(remoteRecords || [])]) {
      if (!record?.id) continue;
      const existing = merged.get(record.id);
      const recordTime = timestamp(record.updatedAt);
      const existingTime = timestamp(existing?.updatedAt);
      const tombstoneWinsTie = existing && recordTime === existingTime && record.deletedAt && !existing.deletedAt;
      if (!existing || recordTime > existingTime || tombstoneWinsTie) merged.set(record.id, clone(record));
    }
    return [...merged.values()].sort((a, b) => timestamp(b.updatedAt) - timestamp(a.updatedAt));
  }

  function mergeStates(localInput, remoteInput) {
    const local = hydrateState(localInput);
    const remote = hydrateState(remoteInput);
    const profile = timestamp(remote.profile.updatedAt) >= timestamp(local.profile.updatedAt)
      ? clone(remote.profile)
      : clone(local.profile);
    return hydrateState({
      schemaVersion: SCHEMA_VERSION,
      profile,
      recipes: mergeRecordLists(local.recipes, remote.recipes),
      grocery: mergeRecordLists(local.grocery, remote.grocery),
      pantry: mergeRecordLists(local.pantry, remote.pantry),
      house: mergeRecordLists(local.house, remote.house),
      aisles: mergeRecordLists(local.aisles, remote.aisles),
      shops: mergeRecordLists(local.shops, remote.shops)
    });
  }

  function active(records) {
    return (records || []).filter(record => !record.deletedAt);
  }

  function recipeCategoryGroups(records) {
    const groups = new Map();
    for (const record of active((records || []).map(normalizeRecipe)).filter(recipe => recipe.title)) {
      const category = cleanText(record.category, 36);
      const key = category ? category.toLocaleLowerCase() : "__uncategorized__";
      if (!groups.has(key)) groups.set(key, { key, label: category || "Uncategorised", recipes: [] });
      groups.get(key).recipes.push(record);
    }
    return [...groups.values()]
      .map(group => ({
        ...group,
        recipes: group.recipes.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }) || a.title.localeCompare(b.title))
      }))
      .sort((a, b) => a.label.localeCompare(b.label, undefined, { sensitivity: "base" }) || a.label.localeCompare(b.label));
  }

  function pantryHas(state, name) {
    const key = normalizeName(parseIngredientLine(name).name);
    return active(state?.pantry).some(item => item.status === "available" && normalizeName(parseIngredientLine(item.name).name) === key);
  }

  function houseHas(state, name) {
    const key = normalizeName(parseIngredientLine(name).name);
    return active(state?.house).some(item => item.status === "available" && normalizeName(parseIngredientLine(item.name).name) === key);
  }

  function knownGroceryItems(inputState) {
    const state = hydrateState(inputState);
    const items = new Map();
    const availablePantryNames = new Set(
      active(state.pantry)
        .filter(item => item.status === "available")
        .map(item => normalizeName(parseIngredientLine(item.name).name))
        .filter(Boolean)
    );
    const activeGroceryNames = new Set(
      active(state.grocery)
        .map(item => normalizeName(parseIngredientLine(item.name).name))
        .filter(Boolean)
    );

    const availableHouseNames = new Set(
      active(state.house)
        .filter(item => item.status === "available")
        .map(item => normalizeName(parseIngredientLine(item.name).name))
        .filter(Boolean)
    );

    function remember(rawName, source, details = {}) {
      const name = parseIngredientLine(rawName).name;
      const normalizedName = normalizeName(name);
      if (!name || !normalizedName) return;
      if (!items.has(normalizedName)) items.set(normalizedName, { name, normalizedName, sources: [], category: "pantry", aisleId: DEFAULT_AISLE_ID });
      const item = items.get(normalizedName);
      if (!item.sources.includes(source)) item.sources.push(source);
      if (details.category) item.category = details.category === "house" ? "house" : "pantry";
      if (details.aisleId) item.aisleId = cleanText(details.aisleId, 120) || DEFAULT_AISLE_ID;
    }

    for (const recipe of active(state.recipes)) {
      for (const ingredient of recipe.ingredients) remember(ingredient, "recipe");
    }
    for (const item of active(state.pantry)) remember(item.name, "pantry", { category: "pantry", aisleId: item.aisleId });
    for (const item of active(state.house)) remember(item.name, "house", { category: "house", aisleId: item.aisleId });
    for (const item of [...state.grocery].sort((a, b) => timestamp(a.updatedAt) - timestamp(b.updatedAt))) {
      remember(item.name, "history", { category: item.category, aisleId: item.aisleId });
    }

    return [...items.values()]
      .map(item => ({
        ...item,
        inPantry: availablePantryNames.has(item.normalizedName),
        inHouse: availableHouseNames.has(item.normalizedName),
        onList: activeGroceryNames.has(item.normalizedName)
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name));
  }

  function addRecipesToGrocery(inputState, recipeIds, at = nowIso()) {
    const state = hydrateState(inputState);
    const selected = new Set(recipeIds || []);
    const recipes = active(state.recipes).filter(recipe => selected.has(recipe.id));
    const byName = new Map([...state.grocery]
      .sort((a, b) => timestamp(a.updatedAt) - timestamp(b.updatedAt))
      .map(item => [item.normalizedName, item]));

    for (const recipe of recipes) {
      for (const ingredient of recipe.ingredients) {
        const normalized = normalizeName(ingredient);
        if (!normalized) continue;
        const existing = byName.get(normalized);
        if (existing) {
          existing.sourceRecipeIds = [...new Set([...(existing.sourceRecipeIds || []), recipe.id])];
          existing.bought = false;
          existing.boughtAt = null;
          existing.updatedAt = at;
          existing.deletedAt = null;
        } else {
          const item = normalizeGrocery({
            id: recordId("grocery"),
            name: ingredient,
            normalizedName: normalized,
            category: "pantry",
            aisleId: DEFAULT_AISLE_ID,
            sourceRecipeIds: [recipe.id],
            bought: false,
            createdAt: at,
            updatedAt: at
          });
          state.grocery.unshift(item);
          byName.set(normalized, item);
        }
      }
    }
    return state;
  }

  function stockPantry(inputState, name, at = nowIso(), aisleId = DEFAULT_AISLE_ID) {
    const state = hydrateState(inputState);
    const ingredientName = parseIngredientLine(name).name;
    const normalized = normalizeName(ingredientName);
    if (!normalized) return state;
    const existing = active(state.pantry).find(item => normalizeName(parseIngredientLine(item.name).name) === normalized);
    if (existing) {
      existing.name = ingredientName;
      existing.normalizedName = normalized;
      existing.aisleId = cleanText(aisleId, 120) || DEFAULT_AISLE_ID;
      existing.status = "available";
      existing.stockedAt = at;
      existing.finishedAt = null;
      existing.updatedAt = at;
      return state;
    }
    state.pantry.unshift(normalizePantry({
      id: recordId("pantry"),
      name: ingredientName,
      normalizedName: normalized,
      aisleId,
      status: "available",
      stockedAt: at,
      createdAt: at,
      updatedAt: at
    }));
    return state;
  }

  function stockHouse(inputState, name, at = nowIso(), aisleId = DEFAULT_AISLE_ID) {
    const state = hydrateState(inputState);
    const itemName = parseIngredientLine(name).name;
    const normalized = normalizeName(itemName);
    if (!normalized) return state;
    const existing = active(state.house).find(item => normalizeName(parseIngredientLine(item.name).name) === normalized);
    if (existing) {
      existing.name = itemName;
      existing.normalizedName = normalized;
      existing.aisleId = cleanText(aisleId, 120) || DEFAULT_AISLE_ID;
      existing.status = "available";
      existing.stockedAt = at;
      existing.finishedAt = null;
      existing.updatedAt = at;
      return state;
    }
    state.house.unshift(normalizeHouse({
      id: recordId("house"),
      name: itemName,
      normalizedName: normalized,
      aisleId,
      status: "available",
      stockedAt: at,
      createdAt: at,
      updatedAt: at
    }));
    return state;
  }

  function shopAisleOrder(inputState, shop) {
    const state = hydrateState(inputState);
    const activeIds = active(state.aisles).map(item => item.id);
    const activeSet = new Set(activeIds);
    const saved = (shop?.aisleOrder || []).filter(id => activeSet.has(id));
    const missing = active(state.aisles)
      .filter(item => !saved.includes(item.id))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name))
      .map(item => item.id);
    return [...saved, ...missing];
  }

  function mergeRecipeIngredients(inputState, ingredientNames, keepName, at = nowIso()) {
    const state = hydrateState(inputState);
    const selectedNames = new Set(cleanLines(ingredientNames, 500, 120));
    const keeper = cleanText(keepName, 120);
    if (!keeper || selectedNames.size < 2 || !selectedNames.has(keeper)) return state;

    for (const recipe of active(state.recipes)) {
      let changed = false;
      const nextIngredients = [];
      const mergedLines = new Set();
      for (const ingredient of recipe.ingredients) {
        const parsed = parseIngredientLine(ingredient);
        if (!selectedNames.has(parsed.name)) {
          nextIngredients.push(ingredient);
          continue;
        }
        const mergedLine = cleanText(`${keeper}${parsed.details}`, 120);
        if (mergedLines.has(mergedLine)) {
          changed = true;
          continue;
        }
        mergedLines.add(mergedLine);
        nextIngredients.push(mergedLine);
        if (ingredient !== mergedLine) changed = true;
      }
      if (changed) {
        recipe.ingredients = nextIngredients;
        recipe.updatedAt = at;
      }
    }
    return state;
  }

  const api = {
    SCHEMA_VERSION,
    EPOCH,
    DEFAULT_AISLE_ID,
    nowIso,
    clone,
    cleanText,
    cleanLines,
    parseIngredientLine,
    cleanYoutubeLinks,
    normalizeName,
    recordId,
    blankState,
    hydrateState,
    normalizeRecipe,
    recipePlainText,
    normalizeGrocery,
    normalizePantry,
    normalizeHouse,
    normalizeAisle,
    normalizeShop,
    mergeRecordLists,
    mergeStates,
    active,
    recipeCategoryGroups,
    pantryHas,
    houseHas,
    knownGroceryItems,
    addRecipesToGrocery,
    stockPantry,
    stockHouse,
    shopAisleOrder,
    mergeRecipeIngredients
  };

  root.MyKitchenCore = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
