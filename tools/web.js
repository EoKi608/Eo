// ===== EO WEB-WERKZEUGE =====
// Zusatzmodul für EO

export const WEB_TOOLS = [
  {
    name: "web_fetch",
    description: "Liest den Inhalt einer öffentlichen HTTPS-Webseite.",
    parameters: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "Vollständige HTTPS-Adresse"
        }
      },
      required: ["url"]
    }
  }
];

export async function runWebTool(name, args) {
  if (name === "web_fetch") {
    const url = String(args?.url || "").trim();

    if (!url.startsWith("https://")) {
      return {
        ok: false,
        error: "Nur HTTPS-Adressen sind erlaubt."
      };
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "User-Agent": "EO/1.0"
        }
      });

      if (!response.ok) {
        return {
          ok: false,
          status: response.status,
          error: "Webseite konnte nicht geladen werden."
        };
      }

      const contentType =
        response.headers.get("content-type") || "";

      if (!contentType.includes("text")) {
        return {
          ok: false,
          error: "Diese Ressource enthält keinen unterstützten Text."
        };
      }

      let text = await response.text();

      text = text
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();

      if (text.length > 12000) {
        text = text.slice(0, 12000);
      }

      return {
        ok: true,
        url,
        text
      };
    } catch (error) {
      return {
        ok: false,
        error: String(error?.message || error)
      };
    }
  }

  return {
    ok: false,
    error: "Unbekanntes Web-Werkzeug: " + name
  };
}
