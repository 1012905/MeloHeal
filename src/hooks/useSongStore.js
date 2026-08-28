/**
 * MeloHeal song store — reactive data layer wrapping localStorage
 * Songs, playlists, recent picks, and deleted songs are managed as Solid signals.
 * All CRUD operations are exposed via the returned object.
 */

import { createSignal, createEffect } from "solid-js";
import { detectLanguage, normalizeForCompare, findSimilar } from "../lib/songs.js";

/* ── helpers ── */
let _idCounter = Date.now();
function uid() { return `s${++_idCounter}`; }

function loadJSON(key, fallback) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch (e) { console.warn("loadJSON error for", key, e); return fallback; }
}
function saveJSON(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.warn("saveJSON error for", key, e); }
}

/* ── storage keys ── */
const SONGS_KEY = "mh-songs";
const PLAYLISTS_KEY = "mh-playlists";
const RECENT_PICKS_KEY = "mh-recent-picks";
const DELETED_KEY = "mh-deleted";

export default function useSongStore() {
  const [songs, setSongs] = createSignal(loadJSON(SONGS_KEY, []));
  const [playlists, setPlaylists] = createSignal(loadJSON(PLAYLISTS_KEY, getDefaultPlaylists()));
  const [recentPicks, setRecentPicks] = createSignal(loadJSON(RECENT_PICKS_KEY, []));
  const [deletedSongs, setDeletedSongs] = createSignal(loadJSON(DELETED_KEY, []));

  // persist on change
  createEffect(() => saveJSON(SONGS_KEY, songs()));
  createEffect(() => saveJSON(PLAYLISTS_KEY, playlists()));
  createEffect(() => saveJSON(RECENT_PICKS_KEY, recentPicks()));
  createEffect(() => saveJSON(DELETED_KEY, deletedSongs()));

  // ── defaults ──
  function getDefaultPlaylists() {
    return [{ id: "default", name: "All Songs", songIds: [], sortOrder: [] }];
  }

  // ── song CRUD ──
  function addSong(name, overrides = {}) {
    const now = Date.now();
    const song = {
      id: uid(),
      name: name.trim(),
      category: overrides.category || "",
      language: overrides.language || detectLanguage(name),
      favorite: overrides.favorite || false,

      tags: overrides.tags || [],
      createdAt: now,
      updatedAt: now,
    };
    setSongs((prev) => [...prev, song]);
    // Add to All Songs playlist
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === "default" ? { ...p, songIds: [...p.songIds, song.id] } : p
      )
    );
    return song;
  }

  function addSongs(names, overrides = {}) {
    const added = [];
    for (const name of names) {
      const trimmed = name.trim();
      if (trimmed) {
        const s = addSong(trimmed, overrides);
        added.push(s);
      }
    }
    return added;
  }

  function updateSong(id, updates) {
    setSongs((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      )
    );
  }

  function deleteSongs(ids) {
    const removed = songs().filter((s) => ids.includes(s.id));
    setDeletedSongs((prev) => [...removed, ...prev].slice(0, 50)); // keep last 50 deletions
    setSongs((prev) => prev.filter((s) => !ids.includes(s.id)));
    // Remove from all playlists
    setPlaylists((prev) =>
      prev.map((p) => ({
        ...p,
        songIds: p.songIds.filter((sid) => !ids.includes(sid)),
        sortOrder: p.sortOrder.filter((sid) => !ids.includes(sid)),
      }))
    );
  }

  function undoDelete() {
    const last = deletedSongs()[0];
    if (!last) return false;
    setDeletedSongs((prev) => prev.slice(1));
    setSongs((prev) => [...prev, last]);
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === "default" ? { ...p, songIds: [...p.songIds, last.id] } : p
      )
    );
    return true;
  }

  // ── playlist CRUD ──
  function addPlaylist(name) {
    const pl = { id: uid(), name, songIds: [], sortOrder: [] };
    setPlaylists((prev) => [...prev, pl]);
    return pl;
  }

  function updatePlaylist(id, updates) {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );
  }

  function deletePlaylist(id) {
    if (id === "default") return; // can't delete All Songs
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }

  function addSongToPlaylist(songId, playlistId) {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId && !p.songIds.includes(songId)
          ? { ...p, songIds: [...p.songIds, songId] }
          : p
      )
    );
  }

  function removeSongFromPlaylist(songId, playlistId) {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              songIds: p.songIds.filter((id) => id !== songId),
              sortOrder: p.sortOrder.filter((id) => id !== songId),
            }
          : p
      )
    );
  }

  function updatePlaylistSortOrder(playlistId, songIds) {
    setPlaylists((prev) =>
      prev.map((p) => (p.id === playlistId ? { ...p, sortOrder: songIds } : p))
    );
  }

  // ── get songs for a playlist ──
  function getPlaylistSongs(playlistId) {
    const pl = playlists().find((p) => p.id === playlistId);
    if (!pl) return [];
    const all = songs();
    const ids = pl.sortOrder.length > 0 ? pl.sortOrder : pl.songIds;
    const list = ids.map((id) => all.find((s) => s.id === id)).filter(Boolean);
    // Append any songs not in sortOrder
    const inOrder = new Set(list.map((s) => s.id));
    for (const s of all) {
      if (pl.songIds.includes(s.id) && !inOrder.has(s.id)) {
        list.push(s);
      }
    }
    return list;
  }

  // ── search & filter ──
  function searchSongs(query, filters = {}) {
    let result = songs();
    // text search
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((s) => s.name.toLowerCase().includes(q));
    }
    // playlist filter
    if (filters.playlistId && filters.playlistId !== "all") {
      const pl = playlists().find((p) => p.id === filters.playlistId);
      if (pl) result = result.filter((s) => pl.songIds.includes(s.id));
    }
    // category
    if (filters.category) {
      result = result.filter((s) => s.category === filters.category);
    }
    // language
    if (filters.language) {
      result = result.filter((s) => s.language === filters.language);
    }
    // favorite only
    if (filters.favoriteOnly) {
      result = result.filter((s) => s.favorite);
    }
    return result;
  }

  // ── sorting ──
  function sortSongs(list, sortBy) {
    const sorted = [...list];
    sorted.sort((a, b) => {
      // 收藏置顶
      if (a.favorite !== b.favorite) return b.favorite ? 1 : -1;
      switch (sortBy) {
        case "az": return a.name.localeCompare(b.name);
        case "za": return b.name.localeCompare(a.name);
        case "newest": return b.createdAt - a.createdAt;
        case "random": return Math.random() - 0.5;
        default: return 0;
      }
    });
    return sorted;
  }

  // ── random pick ──
  function pickRandom(filters = {}) {
    let pool = searchSongs("", filters);
    if (pool.length === 0) return null;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    // record pick
    setRecentPicks((prev) => {
      const next = [{ songId: pick.id, pickedAt: Date.now() }, ...prev];
      return next.slice(0, 10);
    });
    return pick;
  }

  // ── import/export ──
  function exportTxt(lang) {
    const footer = lang === "zh" ? `共${songs().length}首` : `Total: ${songs().length}`;
    return ["Song Name", "", ...songs().map((s) => s.name), "", footer].join("\n");
  }

  function importTxt(text) {
    const lines = text.split("\n")
      .map((l) => l.trim())
      .filter((l) => l && !/^共\d+首$|^Total:\s*\d+$/i.test(l) && l !== "Song Name" && l !== "歌名");
    return addSongs(lines);
  }

  function exportJson() {
    return JSON.stringify({ songs: songs(), playlists: playlists() }, null, 2);
  }

  function importJson(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      const idMap = {};
      if (data.songs) {
        for (const s of data.songs) {
          const similar = findSimilar(s.name, songs());
          if (similar.length > 0) {
            // 已有同名歌曲，映射到现有 ID
            idMap[s.id] = similar[0].match.id;
          } else {
            const newId = uid();
            idMap[s.id] = newId;
            setSongs((prev) => [...prev, { ...s, id: newId, createdAt: Date.now(), updatedAt: Date.now() }]);
          }
        }
      }
      if (data.playlists) {
        for (const pl of data.playlists) {
          if (!playlists().find((p) => p.name === pl.name)) {
            const newPlId = uid();
            const mappedSongIds = (pl.songIds || []).map((id) => idMap[id]).filter(Boolean);
            setPlaylists((prev) => [...prev, { ...pl, id: newPlId, songIds: mappedSongIds }]);
          }
        }
      }
      return true;
    } catch { return false; }
  }

  // ── fuzzy dedup check ──
  function checkDuplicates(name, excludeId = null) {
    const existing = excludeId ? songs().filter((s) => s.id !== excludeId) : songs();
    return findSimilar(name, existing);
  }

  // ── stats ──
  function getStats() {
    const all = songs();
    const now = new Date();
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
    const categories = {};
    const languages = {};
    let weeklyCount = 0, monthlyCount = 0, favCount = 0;

    for (const s of all) {
      const cat = s.category || "Uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
      const lang = s.language || "other";
      languages[lang] = (languages[lang] || 0) + 1;
      if (s.createdAt >= weekAgo) weeklyCount++;
      if (s.createdAt >= monthAgo) monthlyCount++;
      if (s.favorite) favCount++;
    }

    // Sort categories/languages by count desc
    const catSorted = Object.entries(categories)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
    const langSorted = Object.entries(languages)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    return {
      total: all.length,
      weekly: weeklyCount,
      monthly: monthlyCount,
      favorites: favCount,
      playlists: playlists().length,
      categories: catSorted,
      languages: langSorted,
    };
  }

  return {
    songs,
    playlists,
    recentPicks,
    deletedSongs,
    addSong,
    addSongs,
    updateSong,
    deleteSongs,
    undoDelete,
    addPlaylist,
    updatePlaylist,
    deletePlaylist,
    addSongToPlaylist,
    removeSongFromPlaylist,
    updatePlaylistSortOrder,
    getPlaylistSongs,
    searchSongs,
    sortSongs,
    pickRandom,
    exportTxt,
    importTxt,
    exportJson,
    importJson,
    checkDuplicates,
    getStats,
    detectLanguage,
  };
}
