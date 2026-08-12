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
- deploy_self darf nur nach einem ausdrücklichen Benutzerbefehl zum Installieren, Deployen oder Aktualisieren ausgeführt werden.
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
    description: "Prüft, ob erwartete Dateien tatsächlich gespeichert sind.",
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
    name: "list_projects",
    description: "Listet alle gespeicherten EO-Projekte.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "create_project",
    description: "Legt ein Projekt an.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" }
      },
      required: ["project"]
    }
  },
  {
    name: "delete_project",
    description: "Löscht ein Projekt einschließlich seiner Dateien.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" },
        confirm: { type: "string" }
      },
      required: ["project", "confirm"]
    }
  },
  {
    name: "project_info",
    description: "Zeigt Projektinformationen und Dateien.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" }
      },
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
    description: "Durchsucht Dateinamen und Inhalte eines Projekts.",
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
    description: "Ersetzt Text in einer Projektdatei und verifiziert die Speicherung.",
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
    description: "Listet gespeicherte Gedächtniseinträge.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "forget",
    description: "Löscht einen Gedächtniseintrag.",
    parameters: {
      type: "object",
      properties: {
        key: { type: "string" }
      },
      required: ["key"]
    }
  },
  {
    name: "file_info",
    description: "Zeigt Größe, Sprache, Zeitstempel und SHA-256 einer Datei.",
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
    description: "Führt eine statische Projektprüfung durch.",
    parameters: {
      type: "object",
      properties: {
        project: { type: "string" }
      },
      required: ["project"]
    }
  },
  {
    name: "http_request",
    description: "Ruft eine öffentliche HTTPS-API auf. Lokale und private Ziele sind blockiert.",
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
    description: "Speichert vollständigen neuen EO-Code als vorbereiteten Update-Kandidaten.",
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
    description: "Prüft, ob EO für automatische Updates vorbereitet ist.",
    parameters: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "deploy_self",
    description: "Deployt einen vorbereiteten EO-Update-Kandidaten nach ausdrücklicher Bestätigung.",
    parameters: {
      type: "object",
      properties: {
        confirm: { type: "string" }
      },
      required: ["confirm"]
    }
  },
  {
    name: "clear_history",
    description: "Löscht auf ausdrücklichen Wunsch den gespeicherten Chatverlauf.",
    parameters: {
      type: "object",
      properties: {
        confirm: { type: "string" }
      },
      required: ["confirm"]
    }
  },
  {
    name: "sha256",
    description: "Berechnet einen SHA-256-Hash.",
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
    description: "Analysiert bereitgestellte Logs defensiv.",
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

function normalizeArgs(call) {
  if (!call) return {};

  if (typeof call.arguments === "string") {
    try {
      return JSON.parse(call.arguments);
    } catch {
      return {};
    }
  }

  return call.arguments || {};
}

function canonicalToolName(name) {
  if (["create_file", "write_file", "update_file"].includes(name)) {
    return "save_file";
  }

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
           case "replace_in_file": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const project = cleanProject(args.project);
      const path = cleanPath(args.path);
      const search = String(args.search ?? "");
      const replacement = String(args.replace ?? "");

      if (!search) {
        return {
          ok: false,
          tool: name,
          error: "Suchtext ist leer."
        };
      }

      const file = await env.DB.prepare(`
        SELECT content, language
        FROM files
        WHERE project_name=? AND path=?
      `).bind(project, path).first();

      if (!file) {
        return {
          ok: false,
          tool: name,
          error: "Datei nicht gefunden.",
          project,
          path
        };
      }

      const count = file.content.split(search).length - 1;

      if (!count) {
        return {
          ok: false,
          tool: name,
          error: "Suchtext nicht gefunden.",
          project,
          path
        };
      }

      const content =
        args.all === false
          ? file.content.replace(search, replacement)
          : file.content.split(search).join(replacement);

      const saved = await saveFile(env, {
        project,
        path,
        content,
        language: file.language
      });

      return {
        ok: saved.ok,
        tool: name,
        project,
        path,
        replacements: args.all === false ? 1 : count,
        verified: saved.ok
      };
    }

    case "list_memory": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const result = await env.DB.prepare(`
        SELECT key, value, updated_at
        FROM memories
        ORDER BY updated_at DESC
        LIMIT 200
      `).all();

      return {
        ok: true,
        tool: name,
        entries: result.results || []
      };
    }

    case "forget": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const key = safeText(args.key, 500).trim();

      if (!key) {
        return {
          ok: false,
          tool: name,
          error: "Schlüssel fehlt."
        };
      }

      const result = await env.DB.prepare(`
        DELETE FROM memories
        WHERE key=?
      `).bind(key).run();

      const check = await env.DB.prepare(`
        SELECT key
        FROM memories
        WHERE key=?
      `).bind(key).first();

      return {
        ok: !!result.success && !check,
        tool: name,
        key,
        verified_deleted: !check
      };
    }

    case "file_info": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const project = cleanProject(args.project);
      const path = cleanPath(args.path);

      const file = await env.DB.prepare(`
        SELECT
          content,
          language,
          created_at,
          updated_at
        FROM files
        WHERE project_name=? AND path=?
      `).bind(project, path).first();

      if (!file) {
        return {
          ok: false,
          tool: name,
          error: "Datei nicht gefunden.",
          project,
          path
        };
      }

      return {
        ok: true,
        tool: name,
        project,
        path,
        bytes: new TextEncoder().encode(file.content).length,
        characters: file.content.length,
        language: file.language,
        created_at: file.created_at,
        updated_at: file.updated_at,
        sha256: await textSha256(file.content)
      };
    }

    case "validate_project": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const project = cleanProject(args.project);

      const result = await env.DB.prepare(`
        SELECT path, content
        FROM files
        WHERE project_name=?
        ORDER BY path
      `).bind(project).all();

      const files = result.results || [];
      const issues = [];

      for (const file of files) {
        if (!String(file.content || "").trim()) {
          issues.push(`${file.path}: Datei ist leer`);
        }

        if (/\.html?$/i.test(file.path)) {
          const text = String(file.content || "").toLowerCase();

          if (!text.includes("<html")) {
            issues.push(`${file.path}: <html> fehlt`);
          }

          if (!text.includes("</html>")) {
            issues.push(`${file.path}: </html> fehlt`);
          }
        }
      }

      return {
        ok: files.length > 0 && issues.length === 0,
        tool: name,
        project,
        files_checked: files.length,
        issues,
        note: "Statische Prüfung; kein echter Compiler oder Build wurde ausgeführt."
      };
    }

    case "http_request": {
      const target = publicHttpsUrl(args.url);

      if (!target) {
        return {
          ok: false,
          tool: name,
          error: "Nur öffentliche HTTPS-Ziele sind erlaubt."
        };
      }

      const method = String(args.method || "GET").toUpperCase();

      if (![
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
        "HEAD"
      ].includes(method)) {
        return {
          ok: false,
          tool: name,
          error: "HTTP-Methode nicht erlaubt."
        };
      }

      const headers = {
        "user-agent": "EO/4.0"
      };

      if (args.content_type) {
        headers["content-type"] = safeText(
          args.content_type,
          100
        );
      }

      const options = {
        method,
        headers,
        redirect: "follow"
      };

      if (
        !["GET", "HEAD"].includes(method) &&
        args.body != null
      ) {
        options.body = safeText(args.body, 200000);
      }

      const response = await fetch(
        target.toString(),
        options
      );

      const contentType =
        response.headers.get("content-type") || "";

      const text =
        (await response.text()).slice(0, 200000);

      return {
        ok: response.ok,
        tool: name,
        status: response.status,
        url: response.url,
        content_type: contentType,
        body: text
      };
    }

    case "prepare_self_update": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const code = safeText(args.code, 950000);

      if (
        !code.includes("export default") ||
        !code.includes("async fetch")
      ) {
        return {
          ok: false,
          tool: name,
          error: "Update-Kandidat sieht nicht wie ein vollständiger Worker aus."
        };
      }

      const hash = await textSha256(code);

      const result = await env.DB.prepare(`
        INSERT INTO eo_updates(
          code,
          note,
          sha256,
          status
        )
        VALUES(?, ?, ?, 'prepared')
      `).bind(
        code,
        safeText(args.note, 2000),
        hash
      ).run();

      return {
        ok: !!result.success,
        tool: name,
        sha256: hash,
        bytes: new TextEncoder().encode(code).length,
        status: "prepared"
      };
    }

    case "self_update_status": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      const candidate = await env.DB.prepare(`
        SELECT
          id,
          note,
          sha256,
          status,
          created_at,
          deployed_at,
          length(code) AS characters
        FROM eo_updates
        ORDER BY id DESC
        LIMIT 1
      `).first();

      return {
        ok: true,
        tool: name,
        candidate: candidate || null,
        deployment_ready: !!(
          env.CF_API_TOKEN &&
          env.CF_ACCOUNT_ID &&
          env.CF_WORKER_NAME
        ),
        required_secrets: {
          CF_API_TOKEN: !!env.CF_API_TOKEN,            CF_ACCOUNT_ID: !!env.CF_ACCOUNT_ID,
          CF_WORKER_NAME: !!env.CF_WORKER_NAME
        }
      };
    }

    case "deploy_self": {
      if (String(args.confirm || "") !== "DEPLOY EO") {
        return {
          ok: false,
          tool: name,
          error: "Bestätigung DEPLOY EO fehlt."
        };
      }

      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error: "D1-Bindung DB fehlt."
        };
      }

      if (
        !env.CF_API_TOKEN ||
        !env.CF_ACCOUNT_ID ||
        !env.CF_WORKER_NAME
      ) {
        return {
          ok: false,
          tool: name,
          error: "CF_API_TOKEN, CF_ACCOUNT_ID oder CF_WORKER_NAME fehlt."
        };
      }

      const candidate = await env.DB.prepare(`
        SELECT id, code, sha256
        FROM eo_updates
        WHERE status='prepared'
        ORDER BY id DESC
        LIMIT 1
      `).first();

      if (!candidate) {
        return {
          ok: false,
          tool: name,
          error: "Kein vorbereiteter Update-Kandidat vorhanden."
        };
      }

      const base =
        "https://api.cloudflare.com/client/v4/accounts/" +
        encodeURIComponent(env.CF_ACCOUNT_ID) +
        "/workers/scripts/" +
        encodeURIComponent(env.CF_WORKER_NAME);

      const auth = {
        Authorization: `Bearer ${env.CF_API_TOKEN}`
      };

      const settingsResponse = await fetch(
        base + "/settings",
        {
          headers: auth
        }
      );

      const settingsJson =
        await settingsResponse
          .json()
          .catch(() => null);

      if (
        !settingsResponse.ok ||
        !settingsJson?.success
      ) {
        return {
          ok: false,
          tool: name,
          error: "Worker-Settings konnten nicht gelesen werden. Deployment abgebrochen."
        };
      }

      const settings =
        settingsJson.result || {};

      const metadata = {
        main_module: "eo-worker.js",
        compatibility_date:
          settings.compatibility_date ||
          "2026-08-12",

        bindings:
          Array.isArray(settings.bindings)
            ? settings.bindings
            : [],

        keep_assets: true,

        annotations: {
          "workers/message":
            "EO self-update"
        }
      };

      const form =
        new FormData();

      form.set(
        "metadata",
        new Blob(
          [
            JSON.stringify(
              metadata
            )
          ],
          {
            type:
              "application/json"
          }
        )
      );

      form.set(
        "eo-worker.js",
        new Blob(
          [
            candidate.code
          ],
          {
            type:
              "application/javascript+module"
          }
        ),
        "eo-worker.js"
      );

      const deployResponse =
        await fetch(
          base,
          {
            method: "PUT",
            headers: auth,
            body: form
          }
        );

      const deployJson =
        await deployResponse
          .json()
          .catch(() => null);

      if (
        !deployResponse.ok ||
        !deployJson?.success
      ) {
        return {
          ok: false,
          tool: name,
          error:
            "Cloudflare-Deployment fehlgeschlagen.",
          details:
            deployJson
        };
      }

      await env.DB.prepare(`
        UPDATE eo_updates
        SET
          status='deployed',
          deployed_at=CURRENT_TIMESTAMP
        WHERE id=?
      `).bind(
        candidate.id
      ).run();

      return {
        ok: true,
        tool: name,
        sha256:
          candidate.sha256,
        status:
          "deployed"
      };
    }

    case "clear_history": {
      if (!env.DB) {
        return {
          ok: false,
          tool: name,
          error:
            "D1-Bindung DB fehlt."
        };
      }

      if (
        String(args.confirm || "") !==
        "CLEAR HISTORY"
      ) {
        return {
          ok: false,
          tool: name,
          error:
            "Bestätigung CLEAR HISTORY fehlt."
        };
      }

      const result =
        await env.DB.prepare(`
          DELETE FROM chat_history
        `).run();

      return {
        ok:
          !!result.success,
        tool:
          name,
        cleared:
          true
      };
    }

    case "sha256": {
      const hash =
        await textSha256(
          safeText(
            args.data,
            500000
          )
        );

      return {
        ok: true,
        tool: name,
        algorithm:
          "SHA-256",
        hash
      };
    }

    case "inspect_log": {
      const text =
        safeText(
          args.text,
          500000
        );

      const ips = [
        ...new Set(
          text.match(
            /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
          ) || []
        )
      ].slice(
        0,
        100
      );

      const urls = [
        ...new Set(
          text.match(
            /https?:\/\/[^\s"'<>]+/gi
          ) || []
        )
      ].slice(
        0,
        100
      );

      const words = [
        "error",
        "failed",
        "denied",
        "unauthorized",
        "exception",
        "blocked",
        "timeout",
        "warning"
      ];

      const keyword_hits = {};

      for (
        const word of words
      ) {
        const count =
          (
            text.match(
              new RegExp(
                word,
                "gi"
              )
            ) || []
          ).length;

        if (count) {
          keyword_hits[word] =
            count;
        }
      }

      return {
        ok: true,
        tool: name,
        lines:
          text
            ? text.split(
                "\n"
              ).length
            : 0,
        characters:
          text.length,
        ips,
        urls,
        keyword_hits
      };
    }

    default: {
      return {
        ok: false,
        tool:
          requestedName,
        error:
          `Nicht erlaubtes oder unbekanntes Werkzeug: ${requestedName}`
      };
    }
  }
}

async function askEO(
  env,
  incomingMessages
) {
  const messages = [
    {
      role: "system",
      content: SYSTEM
    },
    ...incomingMessages
  ];

  const audit = [];
  const MAX_ROUNDS = 10;

  for (
    let round = 0;
    round < MAX_ROUNDS;
    round++
  ) {
    const response =
      await env.AI.run(
        MODEL,
        {
          messages,
          tools:
            TOOLS,
          max_tokens:
            4096
        }
      );

    const toolCalls =
      Array.isArray(
        response?.tool_calls
      )
        ? response.tool_calls
        : [];

    if (
      !toolCalls.length
    ) {
      return {
        reply:
          response?.response ||
          response?.result ||
          "EO hat keine Textantwort geliefert.",
        tools:
          audit
      };
    }

    messages.push({
      role:
        "assistant",
      content:
        response?.response ||
        JSON.stringify(
          toolCalls
        )
    });

    const roundResults =
      [];

    for (
      const call of
      toolCalls.slice(
        0,
        12
      )
    ) {
      const args =
        normalizeArgs(
          call
        );

      let result;

      try {
        result =
          await runTool(
            env,
            call.name,
            args
          );
      } catch (
        error
      ) {
        result = {
          ok: false,
          tool:
            call.name,
          error:
            error?.message ||
            String(
              error
            )
        };
      }

      const entry = {
        requested_name:
          call.name,

        name:
          canonicalToolName(
            call.name
          ),

        arguments:
          args,

        result
      };

      audit.push(
        entry
      );

      roundResults.push(
        entry
      );
    }

    messages.push({
      role:
        "tool",
      content:
        JSON.stringify(
          roundResults
        )
    });
  }

  return {
    reply:
      "EO hat das maximale Werkzeuglimit erreicht. Nicht bestätigte Schritte gelten nicht als erledigt.",
    tools:
      audit
  };
          }function isTextLike(type, name) {
  const t = (type || "").toLowerCase();
  const n = (name || "").toLowerCase();

  return (
    t.startsWith("text/") ||
    [
      "application/json",
      "application/xml",
      "application/javascript"
    ].includes(t) ||
    /\.(txt|md|csv|json|js|mjs|cjs|ts|tsx|jsx|html|htm|css|xml|yml|yaml|py|java|c|cpp|h|hpp|go|rs|php|sql|log)$/i.test(n)
  );
}

async function handleUpload(request, env) {
  if (!env.DB) {
    return json(
      {
        ok: false,
        error: "D1-Bindung DB fehlt."
      },
      500
    );
  }

  await ensureSchema(env);

  const form = await request.formData();
  const file = form.get("file");

  const project = cleanProject(
    form.get("project") || "Uploads"
  );

  if (!(file instanceof File)) {
    return json(
      {
        ok: false,
        error: "Keine Datei empfangen."
      },
      400
    );
  }

  if (!file.name) {
    return json(
      {
        ok: false,
        error: "Dateiname fehlt."
      },
      400
    );
  }

  const contentType =
    file.type || "application/octet-stream";

  const objectKey =
    `${Date.now()}-${crypto.randomUUID()}-` +
    file.name.replace(
      /[^a-zA-Z0-9._-]/g,
      "_"
    );

  if (
    isTextLike(contentType, file.name) &&
    file.size <= 500000
  ) {
    const text = await file.text();

    const saved = await saveFile(env, {
      project,
      path: file.name,
      content: text,
      language: contentType
    });

    if (!saved.ok) {
      return json(
        {
          ok: false,
          error:
            "Textdatei konnte nicht verifiziert gespeichert werden."
        },
        500
      );
    }

    await env.DB.prepare(`
      INSERT INTO uploads(
        object_key,
        file_name,
        content_type,
        bytes,
        storage,
        project_name
      )
      VALUES(?, ?, ?, ?, 'D1', ?)
    `).bind(
      objectKey,
      file.name,
      contentType,
      file.size,
      project
    ).run();

    return json({
      ok: true,
      storage: "D1",
      file: file.name,
      bytes: file.size,
      project,
      verified: true
    });
  }

  if (!env.MEDIA) {
    return json(
      {
        ok: false,
        needs_media_binding: true,
        error:
          "Für Bilder, PDF, Audio, Video oder größere Dateien fehlt das R2-Binding MEDIA.",
        file: file.name,
        bytes: file.size,
        content_type: contentType
      },
      409
    );
  }

  await env.MEDIA.put(
    objectKey,
    file.stream(),
    {
      httpMetadata: {
        contentType
      }
    }
  );

  const head =
    await env.MEDIA.head(objectKey);

  if (!head) {
    return json(
      {
        ok: false,
        error:
          "Upload wurde in R2 nicht verifiziert."
      },
      500
    );
  }

  await env.DB.prepare(`
    INSERT INTO uploads(
      object_key,
      file_name,
      content_type,
      bytes,
      storage,
      project_name
    )
    VALUES(?, ?, ?, ?, 'R2', ?)
  `).bind(
    objectKey,
    file.name,
    contentType,
    file.size,
    project
  ).run();

  return json({
    ok: true,
    storage: "R2",
    key: objectKey,
    file: file.name,
    bytes: file.size,
    content_type: contentType,
    project,
    verified: true
  });
}

async function listUploads(env) {
  if (!env.DB) {
    return json(
      {
        ok: false,
        error: "D1-Bindung DB fehlt."
      },
      500
    );
  }

  await ensureSchema(env);

  const result = await env.DB.prepare(`
    SELECT
      file_name,
      content_type,
      bytes,
      storage,
      project_name,
      created_at
    FROM uploads
    ORDER BY id DESC
    LIMIT 50
  `).all();

  return json({
    ok: true,
    uploads: result.results || []
  });
}

const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta
  name="viewport"
  content="width=device-width,initial-scale=1,maximum-scale=1"
>
<title>EO</title>

<style>
*{box-sizing:border-box}

:root{
  --bg:#080d12;
  --panel:#101820;
  --panel2:#131d26;
  --line:#263746;
  --blue:#2196f3;
  --text:#fff;
  --muted:#94a8bb;
  --red:#8f2525;
  --green:#60c98a;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:Arial,sans-serif;
}

header{
  padding:14px 15px;
  background:var(--panel);
  border-bottom:1px solid var(--line);
  position:sticky;
  top:0;
  z-index:10;
}

.logo{
  font-size:27px;
  font-weight:800;
}

.sub{
  font-size:12px;
  color:var(--muted);
  margin-top:3px;
}

#status{
  font-size:12px;
  color:#87cfff;
  margin-top:8px;
  line-height:1.45;
}

#chat{
  padding:14px;
  padding-bottom:270px;
  min-height:100vh;
}

.msg{
  padding:12px 13px;
  border-radius:14px;
  margin:10px 0;
  white-space:pre-wrap;
  word-break:break-word;
  line-height:1.45;
}

.user{
  background:#184e77;
  margin-left:9%;
}

.ai{
  background:var(--panel2);
  border:1px solid var(--line);
  margin-right:4%;
}

.audit{
  font-size:12px;
  color:#9fc6e5;
  border-top:1px solid #2b4052;
  margin-top:10px;
  padding-top:8px;
}

.bottom{
  position:fixed;
  left:0;
  right:0;
  bottom:0;
  background:#0d151d;
  border-top:1px solid var(--line);
  padding:9px;
  z-index:20;
}

.actions{
  display:flex;
  gap:7px;
  margin-bottom:7px;
}

.actions button{
  height:38px;
  flex:1;
  min-width:0;
  background:#172431;
  border:1px solid #304353;
  font-size:11px;
}

.controls{
  display:flex;
  gap:7px;
}

textarea{
  flex:1;
  height:74px;
  resize:none;
  background:#111c25;
  color:#fff;
  border:1px solid #304353;
  border-radius:10px;
  padding:10px;
  font-size:15px;
}

button{
  border:0;
  border-radius:10px;
  color:#fff;
  font-weight:700;
  padding:0 10px;
}

#send{
  width:78px;
  background:var(--blue);
}

#stop{
  width:68px;
  background:var(--red);
}

#stop:disabled,
#send:disabled{
  opacity:.45;
}

.panel{
  display:none;
  position:fixed;
  left:10px;
  right:10px;
  bottom:158px;
  max-height:58vh;
  overflow:auto;
  background:#101820;
  border:1px solid #304353;
  border-radius:14px;
  padding:12px;
  z-index:30;
}

.panel.show{
  display:block;
}

.row{
  display:flex;
  gap:7px;
  margin:8px 0;
}

.row input{
  min-width:0;
  flex:1;
  background:#111c25;
  color:#fff;
  border:1px solid #304353;
  border-radius:9px;
  padding:10px;
}

.small{
  font-size:12px;
  color:var(--muted);
  line-height:1.4;
}

.item{
  padding:9px;
  border:1px solid #263746;
  border-radius:9px;
  margin:7px 0;
  background:#0d151d;
  font-size:13px;
}

.close{
  float:right;
  background:#263746;
  height:30px;
}

.good{color:var(--green)}
.bad{color:#ff8b8b}
</style>
</head>

<body>

<header>
  <div class="logo">EO 🤖</div>

  <div class="sub">
    Engineering · Projekte · Code · Speicher · Analyse
  </div>

  <div id="status">
    AI … | DB … | MEDIA … | UPDATE …
  </div>
</header>

<div id="chat">
  <div class="msg ai">EO V4 ist bereit.

Engineering, Projekte, Dateien, Speicher, Upload, Analyse und verifizierte Werkzeugausführung sind aktiviert.</div>
</div>

<div id="uploadPanel" class="panel">
  <button
    class="close"
    onclick="togglePanel('uploadPanel',false)"
  >✕</button>

  <h3>📎 Hochladen</h3>

  <div class="small">
    Text und Code bis 500 KB werden direkt in D1 gespeichert.
    Bilder, PDF, Audio, Video und größere Dateien verwenden MEDIA/R2.
  </div>

  <div class="row">
    <input
      id="uploadProject"
      value="Uploads"
      placeholder="Projektname"
    >
  </div>

  <div class="row">
    <input id="fileInput" type="file">
  </div>

  <div class="row">
    <button
      style="background:#2196f3;height:40px;flex:1"
      onclick="uploadFile()"
    >
      DATEI HOCHLADEN
    </button>
  </div>

  <div id="uploadResult" class="small"></div>
</div>

<div id="filesPanel" class="panel">
  <button
    class="close"
    onclick="togglePanel('filesPanel',false)"
  >✕</button>

  <h3>📁 Projektdateien</h3>

  <div class="row">
    <input
     
};
