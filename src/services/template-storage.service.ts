import { SavedTemplate } from '../types/template';

const STORAGE_KEY = 'transriptland_saved_templates';

function loadAll(): SavedTemplate[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveAll(templates: SavedTemplate[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

function save(template: SavedTemplate): void {
    const all = loadAll();
    // Replace if same id exists, otherwise append
    const idx = all.findIndex(t => t.id === template.id);
    if (idx >= 0) all[idx] = template;
    else all.push(template);
    saveAll(all);
}

function remove(id: string): void {
    saveAll(loadAll().filter(t => t.id !== id));
}

function get(id: string): SavedTemplate | undefined {
    return loadAll().find(t => t.id === id);
}

export const templateStorageService = { loadAll, save, remove, get };
