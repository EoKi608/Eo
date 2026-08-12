const MODEL = "@cf/zai-org/glm-5.2";

const SYSTEM = `
Du bist EO, ein technischer Engineering-, Analyse- und Forensik-Assistent.

GRUNDPRINZIP:
Verstehen -> Planen -> Ausführen -> Prüfen -> erst dann Erfolg melden.

VERBINDLICHE REGELN:
- Nutze nur echte Werkzeuge, die dir angeboten werden.
- Zum Erstellen oder Aktualisieren von Projektdateien verwendest du save_file.
- Nach mehreren Dateiänderungen verwendest du verify_files oder list_files.
- Behaupte niemals, eine Datei gespeichert, gelöscht oder geprüft zu haben, wenn das entsprechende Werkzeug keinen erfolgreichen Rückgabewert geliefert hat.
- Wenn ein Werkzeug fehlschlägt, nenne den echten Fehler und versuche eine sichere, sinnvolle Korrektur.
- Erfinde niemals Werkzeugnamen, Deployments, Tests, Dateien oder Werkzeugergebnisse.
- Wenn der Benutzer ein Programm oder eine App verlangt, plane die benötigten Dateien, speichere sie einzeln und verifiziere sie.
- Für legitime technische Forensik darfst du Logs, Texte, Hashes, Metadaten und vom Benutzer bereitgestellte Daten defensiv untersuchen.
- Antworte standardmäßig auf Deutsch.
- Fasse Werkzeugergebnisse verständlich zusammen, ohne erfolgreiche Ausführung vorzutäuschen.
`;

const TOOLS = [
  {
    name: "remember",
    description: "Speichert eine Information dauerhaft im EO-Gedächtnis.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string" },
        value: { type: "string" }
      },
      required: ["key", "value"]
    }
  },
  {
    name: "recall",
    description: "Sucht im dauerhaften EO-Gedächtnis.",
    parameters: {
      type: "object",
      properties: { query: { type: "string" } },
      required: ["query"]
    }
  },
  {
    name: "save_file",
    description: "Erstellt oder aktualisiert genau eine Projektdatei und verifiziert die Speicherung.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        path: { type: "string" },
        content: { type: "string" },
        language: { type: "string" }
      },
      required: ["project", "path", "content"]
    }
  },
  {
    name: "read_file",
    description: "Liest eine tatsächlich gespeicherte Projektdatei.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        path: { type: "string" }
      },
      required: ["project", "path"]
    }
  },
  {
    name: "list_files",
    description: "Listet alle tatsächlich gespeicherten Dateien eines Projekts.",
    parameters: {
      type: "object",
      properties: { project: { type: "string" } },
      required: ["project"]
    }
  },
  {
    name: "delete_file",
    description: "Löscht eine Projektdatei und verifiziert die Löschung.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        path: { type: "string" }
      },
      required: ["project", "path"]
    }
  },
  {
    name: "verify_files",
    description: "Prüft, ob eine Liste erwarteter Dateien tatsächlich im Projekt vorhanden ist.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        paths: { type: "array", items: { type: "string" } }
      },
      required: ["project", "paths"]
    }
  },
  {
    name: "sha256",
    description: "Berechnet den SHA-256-Hash für bereitgestellte Text- oder Dateninhalte.",
    parameters: {
      type: "object",
      properties: { data: { type: "string" } },
      required: ["data"]
    }
  },
  {
    name: "inspect_log",
    description: "Untersucht bereitgestellte Log- oder Textdaten defensiv auf IPs, URLs und Fehlerindikatoren.",
    parameters: {
      type: "object",
      properties: { text: { type: "string" } },
      required: ["text"]
    }
  }
];

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=UTF-8",
      "cache-control": "no-store"
    }
  });
}

function safeText(value, max = 200000) {
  return String(value ?? "").slice(0, max);
}

function cleanProject(value) {
  return safeText(value, 200).trim() || "EO";
}

function cleanPath(value) {
  return safeText(value, 800)
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\.{2,}/g, ".")
    .trim();
}

function normalizeArgs(call) {
  if (!call) return {};
  if (typeof call.arguments === "string") {
    try { return JSON.parse(call.arguments); }
    catch { return {}; }
  }
  return call.arguments || {};
}

function canonicalToolName(name) {
  if (["create_file", "write_file", "update_file"].includes(name)) return "save_file";
  return name;
}

async function ensureSchema(env) {
  if (!env.DB) return false;

  await env.DB.batch([
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_name TEXT NOT NULL,
        path TEXT NOT NULL,
        content TEXT NOT NULL,
        language TEXT DEFAULT '',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(project_name, path)
      )
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        object_key TEXT UNIQUE NOT NULL,
        file_name TEXT NOT NULL,
        content_type TEXT DEFAULT '',
        bytes INTEGER DEFAULT 0,
        storage TEXT NOT NULL,
        project_name TEXT DEFAULT 'EO',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `)
  ]);

  return true;
}

async function saveFile(env, args) {
  if (!env.DB) return { ok: false, tool: "save_file", error: "D1-Bindung DB fehlt." };

  const project = cleanProject(args.project);
  const path = cleanPath(args.path);
  const content = safeText(args.content, 500000);
  const language = safeText(args.language, 80);

  if (!path) return { ok: false, tool: "save_file", error: "Dateipfad fehlt." };

  await env.DB.prepare(`
    INSERT INTO projects(name) VALUES(?)
    ON CONFLICT(name) DO UPDATE SET updated_at=CURRENT_TIMESTAMP
  `).bind(project).run();

  const result = await env.DB.prepare(`
    INSERT INTO files(project_name, path, content, language)
    VALUES(?, ?, ?, ?)
    ON CONFLICT(project_name, path) DO UPDATE SET
      content=excluded.content,
      language=excluded.language,
      updated_at=CURRENT_TIMESTAMP
  `).bind(project, path, content, language).run();

  const check = await env.DB.prepare(`
    SELECT project_name, path, language, length(content) AS bytes, updated_at
    FROM files WHERE project_name=? AND path=?
  `).bind(project, path).first();

  return {
    ok: !!result.success && !!check,
    tool: "save_file",
    project,
    path,
    verified: !!check,
    stored: check || null
  };
}

async function runTool(env, requestedName, args) {
  const name = canonicalToolName(requestedName);

  switch (name) {
    case "remember": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const key = safeText(args.key, 500).trim();
      const value = safeText(args.value, 50000);
      if (!key) return { ok: false, tool: name, error: "Leerer Schlüssel." };

      const result = await env.DB.prepare(`
        INSERT INTO memories(key, value) VALUES(?, ?)
        ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=CURRENT_TIMESTAMP
      `).bind(key, value).run();

      return { ok: !!result.success, tool: name, key };
    }

    case "recall": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const query = safeText(args.query, 1000).trim();
      const q = `%${query}%`;
      const result = await env.DB.prepare(`
        SELECT key, value, updated_at
        FROM memories
        WHERE key LIKE ? OR value LIKE ?
        ORDER BY updated_at DESC LIMIT 30
      `).bind(q, q).all();
      return { ok: true, tool: name, results: result.results || [] };
    }

    case "save_file":
      return saveFile(env, args);

    case "read_file": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const path = cleanPath(args.path);
      const file = await env.DB.prepare(`
        SELECT project_name, path, content, language, updated_at
        FROM files WHERE project_name=? AND path=?
      `).bind(project, path).first();

      return file
        ? { ok: true, tool: name, file }
        : { ok: false, tool: name, error: "Datei nicht gefunden.", project, path };
    }

    case "list_files": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt
