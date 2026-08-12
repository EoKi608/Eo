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
- Fasse Werkzeugergebnisse kurz und verständlich zusammen. Gib keine langen Roh-JSON-Blöcke aus, außer der Benutzer verlangt sie ausdrücklich.
- Verwende vorhandene Werkzeuge selbstständig, wenn sie zur Erledigung des Auftrags nötig sind.
- Änderungen an EOs eigenem Worker dürfen nur über prepare_self_update und deploy_self erfolgen.
- deploy_self darf nur nach einem ausdrücklichen Benutzerbefehl zum Installieren/Deployen/Aktualisieren ausgeführt werden.
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
    name: "list_projects",
    description: "Listet alle gespeicherten EO-Projekte auf.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "create_project",
    description: "Legt ein Projekt ausdrücklich an.",
    parameters: {
      type: "object",
      properties: { project: { type: "string" } },
      required: ["project"]
    }
  },
  {
    name: "delete_project",
    description: "Löscht ein Projekt einschließlich aller darin gespeicherten D1-Projektdateien.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        confirm: { type: "string", description: "Muss DELETE PROJECT lauten." }
      },
      required: ["project", "confirm"]
    }
  },
  {
    name: "project_info",
    description: "Zeigt Projektinformationen und die enthaltenen Dateien.",
    parameters: {
      type: "object",
      properties: { project: { type: "string" } },
      required: ["project"]
    }
  },
  {
    name: "copy_file",
    description: "Kopiert eine gespeicherte Projektdatei.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        source: { type: "string" },
        target: { type: "string" }
      },
      required: ["project", "source", "target"]
    }
  },
  {
    name: "move_file",
    description: "Verschiebt oder benennt eine Projektdatei um.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        source: { type: "string" },
        target: { type: "string" }
      },
      required: ["project", "source", "target"]
    }
  },
  {
    name: "search_project",
    description: "Durchsucht Dateinamen und Dateiinhalte eines Projekts.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        query: { type: "string" }
      },
      required: ["project", "query"]
    }
  },
  {
    name: "replace_in_file",
    description: "Ersetzt Text in einer gespeicherten Projektdatei und verifiziert die Speicherung.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        path: { type: "string" },
        search: { type: "string" },
        replace: { type: "string" },
        all: { type: "boolean" }
      },
      required: ["project", "path", "search", "replace"]
    }
  },
  {
    name: "list_memory",
    description: "Listet gespeicherte Gedächtniseinträge ohne versteckte Systemgeheimnisse.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "forget",
    description: "Löscht einen Gedächtniseintrag nach Schlüssel.",
    parameters: {
      type: "object",
      properties: { key: { type: "string" } },
      required: ["key"]
    }
  },
  {
    name: "file_info",
    description: "Zeigt Größe, Sprache, Zeitstempel und SHA-256 einer gespeicherten Textdatei.",
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
    name: "validate_project",
    description: "Prüft ein Projekt auf leere Dateien und einfache HTML/CSS/JS-Strukturprobleme. Dies ist eine statische Prüfung, kein echter Build.",
    parameters: {
      type: "object",
      properties: { project: { type: "string" } },
      required: ["project"]
    }
  },
  {
    name: "http_request",
    description: "Führt eine begrenzte HTTPS-Anfrage an eine öffentliche externe API aus. Lokale/private Ziele werden blockiert.",
    parameters: {
      type: "object",
      properties: {
        url: { type: "string" },
        method: { type: "string" },
        body: { type: "string" },
        content_type: { type: "string" }
      },
      required: ["url"]
    }
  },
  {
    name: "prepare_self_update",
    description: "Speichert neuen vollständigen EO-Worker-Code als Update-Kandidat in D1. Führt noch kein Deployment aus.",
    parameters: {
      type: "object",
      properties: {
        code: { type: "string" },
        note: { type: "string" }
      },
      required: ["code"]
    }
  },
  {
    name: "self_update_status",
    description: "Zeigt, ob ein vorbereiteter EO-Update-Kandidat und die benötigten Cloudflare-Deployment-Secrets vorhanden sind.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "deploy_self",
    description: "Deployt den zuletzt vorbereiteten EO-Worker-Code über die Cloudflare Workers API. Erfordert CF_API_TOKEN, CF_ACCOUNT_ID und CF_WORKER_NAME als Secrets sowie die Bestätigung DEPLOY EO.",
    parameters: {
      type: "object",
      properties: {
        confirm: { type: "string", description: "Muss DEPLOY EO lauten." }
      },
      required: ["confirm"]
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
  // Kompatibilität gegen den alten EO-Fehler, ohne beliebige erfundene Tools zu akzeptieren.
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
    `),
    env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS eo_updates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL,
        note TEXT DEFAULT '',
        sha256 TEXT NOT NULL,
        status TEXT DEFAULT 'prepared',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        deployed_at TEXT
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


async function textSha256(data) {
  const bytes = new TextEncoder().encode(String(data ?? ""));
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map(x => x.toString(16).padStart(2, "0")).join("");
}

function publicHttpsUrl(value) {
  let u;
  try { u = new URL(String(value || "")); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const h = u.hostname.toLowerCase();
  if (
    h === "localhost" || h === "0.0.0.0" || h === "::1" ||
    h.endsWith(".local") || h.endsWith(".internal") ||
    /^127\./.test(h) || /^10\./.test(h) || /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) || /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  ) return null;
  return u;
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
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const result = await env.DB.prepare(`
        SELECT path, language, length(content) AS bytes, updated_at
        FROM files WHERE project_name=? ORDER BY path
      `).bind(project).all();
      const files = result.results || [];
      return { ok: true, tool: name, project, files, count: files.length };
    }

    case "delete_file": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const path = cleanPath(args.path);
      const result = await env.DB.prepare(`DELETE FROM files WHERE project_name=? AND path=?`)
        .bind(project, path).run();
      const check = await env.DB.prepare(`SELECT path FROM files WHERE project_name=? AND path=?`)
        .bind(project, path).first();
      return {
        ok: !!result.success && !check,
        tool: name,
        project,
        path,
        verified_deleted: !check
      };
    }

    case "verify_files": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const requested = Array.isArray(args.paths)
        ? args.paths.map(cleanPath).filter(Boolean)
        : [];
      if (!requested.length) return { ok: false, tool: name, error: "Keine Dateipfade zum Prüfen übergeben." };

      const result = await env.DB.prepare(`
        SELECT path, length(content) AS bytes, updated_at
        FROM files WHERE project_name=? ORDER BY path
      `).bind(project).all();

      const actual = result.results || [];
      const names = new Set(actual.map(x => x.path));
      const present = requested.filter(x => names.has(x));
      const missing = requested.filter(x => !names.has(x));

      return {
        ok: missing.length === 0,
        tool: name,
        project,
        requested,
        present,
        missing,
        actual
      };
    }

    case "list_projects": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const result = await env.DB.prepare(`
        SELECT p.name,
               p.created_at,
               p.updated_at,
               COUNT(f.id) AS files
        FROM projects p
        LEFT JOIN files f ON f.project_name=p.name
        GROUP BY p.name
        ORDER BY p.updated_at DESC
        LIMIT 200
      `).all();
      return { ok: true, tool: name, projects: result.results || [] };
    }

    case "create_project": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const result = await env.DB.prepare(`
        INSERT INTO projects(name) VALUES(?)
        ON CONFLICT(name) DO UPDATE SET updated_at=CURRENT_TIMESTAMP
      `).bind(project).run();
      return { ok: !!result.success, tool: name, project };
    }

    case "delete_project": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      if (String(args.confirm || "") !== "DELETE PROJECT")
        return { ok: false, tool: name, error: "Bestätigung DELETE PROJECT fehlt." };
      const project = cleanProject(args.project);
      await env.DB.batch([
        env.DB.prepare(`DELETE FROM files WHERE project_name=?`).bind(project),
        env.DB.prepare(`DELETE FROM projects WHERE name=?`).bind(project)
      ]);
      const check = await env.DB.prepare(`SELECT name FROM projects WHERE name=?`).bind(project).first();
      return { ok: !check, tool: name, project, verified_deleted: !check };
    }

    case "project_info": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const p = await env.DB.prepare(`SELECT * FROM projects WHERE name=?`).bind(project).first();
      const fs = await env.DB.prepare(`
        SELECT path, language, length(content) AS bytes, updated_at
        FROM files WHERE project_name=? ORDER BY path
      `).bind(project).all();
      return { ok: !!p || (fs.results || []).length > 0, tool: name, project, info: p || null, files: fs.results || [] };
    }

    case "copy_file":
    case "move_file": {
      if (!env.DB) return { ok: false, tool: name, error: "D1-Bindung DB fehlt." };
      const project = cleanProject(args.project);
      const source = cleanPath(args.source);
      const target = cleanPath(args.target);
      if (!source || !target) return { ok: false, tool: name, error: "Qu
