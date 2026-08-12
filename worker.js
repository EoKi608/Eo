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
- Wenn ein Werkzeug fehlschlägt, nenne den echten Fehler.
- Erfinde niemals Werkzeugnamen, Deployments, Tests, Dateien oder Werkzeugergebnisse.
- Wenn der Benutzer ein Programm oder eine App verlangt, speichere ALLE benötigten Dateien einzeln.
- Beende einen Mehrdatei-Auftrag NICHT nach der ersten oder zweiten Datei.
- Nach dem Speichern mehrerer Dateien MUSST du verify_files oder list_files verwenden.
- Ein Auftrag ist erst abgeschlossen, wenn alle angeforderten Dateien verifiziert wurden.
- Schreibe Werkzeugaufrufe NICHT als Beispiel, JSON oder normalen Text in deine Antwort.
- Wenn ein Werkzeug nötig ist, fordere den Werkzeugaufruf tatsächlich an.
- Werkzeugergebnisse werden dir vom System zurückgegeben.
- Für legitime technische Forensik darfst du Logs, Texte, Hashes, Metadaten und vom Benutzer bereitgestellte Daten defensiv untersuchen.
- Antworte standardmäßig auf Deutsch.
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
      properties: {
        query: { type: "string" }
      },
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
      properties: {
        project: { type: "string" }
      },
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
    description: "Prüft, ob alle erwarteten Dateien tatsächlich im Projekt vorhanden sind.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        paths: {
          type: "array",
          items: { type: "string" }
        }
      },
      required: ["project", "paths"]
    }
  },
  {
    name: "sha256",
    description: "Berechnet den SHA-256-Hash eines Text- oder Dateninhalts.",
    parameters: {
      type: "object",
      properties: {
        data: { type: "string" }
      },
      required: ["data"]
    }
  },
  {
    name: "inspect_log",
    description: "Untersucht Log- oder Textdaten defensiv auf IPs, URLs und Fehlerindikatoren.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string" }
      },
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

function canonicalToolName(name) {
  const n = safeText(name, 100).trim();

  if (
    n === "create_file" ||
    n === "write_file" ||
    n === "update_file"
  ) {
    return "save_file";
  }

  return n;
}

function parseObject(value) {
  if (!value) return {};

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === "object"
        ? parsed
        : {};
    } catch {
      return {};
    }
  }

  return {};
}

function normalizeToolCall(call) {
  if (!call || typeof call !== "object") {
    return null;
  }

  /*
   * Workers-AI traditionell:
   * {
   *   name: "...",
   *   arguments: {...}
   * }
   */
  if (call.name) {
    return {
      id: call.id || crypto.randomUUID(),
      name: canonicalToolName(call.name),
      requestedName: safeText(call.name, 100),
      arguments: parseObject(
        call.arguments ??
        call.parameters ??
        call.input ??
        {}
      )
    };
  }

  /*
   * OpenAI-kompatible Form:
   * {
   *   id: "...",
   *   type: "function",
   *   function: {
   *     name: "...",
   *     arguments: "..."
   *   }
   * }
   */
  if (call.function && call.function.name) {
    return {
      id: call.id || crypto.randomUUID(),
      name: canonicalToolName(call.function.name),
      requestedName: safeText(call.function.name, 100),
      arguments: parseObject(
        call.function.arguments ??
        call.function.parameters ??
        {}
      )
    };
  }

  return null;
}

function responseText(response) {
  if (!response) return "";

  if (typeof response.response === "string") {
    return response.response;
  }

  if (typeof response.result === "string") {
    return response.result;
  }

  if (
    response.result &&
    typeof response.result.response === "string"
  ) {
    return response.result.response;
  }

  if (
    Array.isArray(response.choices) &&
    response.choices[0]
  ) {
    const choice = response.choices[0];

    if (
      choice.message &&
      typeof choice.message.content === "string"
    ) {
      return choice.message.content;
    }

    if (typeof choice.text === "string") {
      return choice.text;
    }
  }

  return "";
}

function structuredToolCalls(response) {
  const candidates = [];

  if (Array.isArray(response?.tool_calls)) {
    candidates.push(...response.tool_calls);
  }

  if (Array.isArray(response?.result?.tool_calls)) {
    candidates.push(...response.result.tool_calls);
  }

  if (
    Array.isArray(response?.choices) &&
    response.choices[0]?.message &&
    Array.isArray(response.choices[0].message.tool_calls)
  ) {
    candidates.push(
      ...response.choices[0].message.tool_calls
    );
  }

  const normalized = [];

  for (const call of candidates) {
    const n = normalizeToolCall(call);

    if (n && n.name) {
      normalized.push(n);
    }
  }

  return normalized;
}

/*
 * Falls GLM einen Werkzeugaufruf fälschlich als normalen
 * JSON-Text ausgibt, lesen wir JSON-Objekte sicher aus dem Text.
 */
function extractJsonValues(text) {
  const results = [];
  const input = safeText(text, 200000);

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === '"') {
        inString = false;
      }

      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      if (depth === 0) {
        start = i;
      }

      depth++;
      continue;
    }

    if (ch === "}" || ch === "]") {
      if (depth > 0) {
        depth--;
      }

      if (depth === 0 && start >= 0) {
        const raw = input.slice(start, i + 1);

        try {
          results.push(JSON.parse(raw));
        } catch {
          // Kein gültiges JSON -> ignorieren.
        }

        start = -1;
      }
    }
  }

  return results;
}

function collectTextToolCalls(value, output) {
  if (!value) return;

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextToolCalls(item, output);
    }
    return;
  }

  if (typeof value !== "object") {
    return;
  }

  const possible =
    normalizeToolCall(value);

  if (possible && possible.name) {
    output.push(possible);
    return;
  }

  if (
    value.tool &&
    typeof value.tool === "string"
  ) {
    output.push({
      id: crypto.randomUUID(),
      requestedName: value.tool,
      name: canonicalToolName(value.tool),
      arguments: parseObject(
        value.arguments ??
        value.parameters ??
        value.input ??
        {}
      )
    });

    return;
  }

  for (const child of Object.values(value)) {
    collectTextToolCalls(child, output);
  }
}

function textualToolCalls(text) {
  const calls = [];

  for (const value of extractJsonValues(text)) {
    collectTextToolCalls(value, calls);
  }

  const allowed = new Set(
    TOOLS.map(x => x.name)
      .concat([
        "create_file",
        "write_file",
        "update_file"
      ])
  );

  return calls.filter(call =>
    allowed.has(call.requestedName) ||
    allowed.has(call.name)
  );
}

function dedupeCalls(calls) {
  const result = [];
  const seen = new Set();

  for (const call of calls) {
    const key =
      call.name +
      "::" +
      JSON.stringify(call.arguments || {});

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(call);
  }

  return result;
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
  if (!env.DB) {
    return {
      ok: false,
      tool: "save_file",
      error: "D1-Bindung DB fehlt."
    };
  }

  const project =
    cleanProject(args.project);

  const path =
    cleanPath(args.path);

  const content =
    safeText(args.content, 500000);

  const language =
    safeText(args.language, 80);

  if (!path) {
    return {
      ok: false,
      tool: "save_file",
      error: "Dateipfad fehlt."
    };
  }

  await env.DB.prepare(`
    INSERT INTO projects(name)
    VALUES(?)
    ON CONFLICT(name)
    DO UPDATE SET updated_at=CURRENT_TIMESTAMP
  `)
    .bind(project)
    .run();

  const result =
    await env.DB.prepare(`
      INSERT INTO files(
        project_name,
        path,
        content,
        language
      )
      VALUES(?, ?, ?, ?)

      ON CONFLICT(project_name, path)
      DO UPDATE SET
        content=excluded.content,
        language=excluded.language,
        updated_at=CURRENT_TIMESTAMP
    `)
      .bind(
        project,
        path,
        content,
        language
      )
      .run();

  /*
   * Harte Nachprüfung:
   * Erfolg erst, wenn die Datei wirklich wieder aus D1
   * gelesen werden kann.
   */
  const check =
    await env.DB.prepare(`
      SELECT
        project_name,
        path,
        language,
        length(content) AS bytes,
        updated_at
      FROM files
      WHERE project_name=?
        AND path=?
    `)
      .bind(project, path)
      .first();

  return {
    ok:
      !!result.success &&
      !!check,
    tool: "save_file",
    project,
    path,
    verified: !!check,
    stored: check || null
  };
}

async function runTool(env, requestedName, args = {}) {
  const name =
    canonicalToolName(requestedName);

  switch (name) {
    case "remember": {
      if (!env.DB) {
