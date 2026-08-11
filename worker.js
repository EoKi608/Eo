const HTML = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>EO</title>

<style>
body{
  margin:0;
  background:#0b0f14;
  color:white;
  font-family:Arial,sans-serif;
}

header{
  padding:18px;
  background:#111820;
  font-size:24px;
  font-weight:bold;
}

#chat{
  padding:18px;
  height:65vh;
  overflow-y:auto;
}

.msg{
  padding:14px 16px;
  margin:10px 0;
  border-radius:16px;
  line-height:1.4;
}

.du{
  background:#294057;
}

.eo{
  background:#18232e;
}

#unten{
  position:fixed;
  bottom:0;
  left:0;
  right:0;
  display:flex;
  gap:10px;
  padding:14px;
  background:#111820;
}

input{
  flex:1;
  padding:15px;
  border-radius:14px;
  border:0;
  font-size:16px;
}

button{
  padding:15px 20px;
  border:0;
  border-radius:14px;
  font-size:16px;
  font-weight:bold;
}
</style>

</head>

<body>

<header>EO 🤖</header>

<div id="chat">
  <div class="msg eo">
    <b>EO:</b> Bereit. Was soll ich für dich machen?
  </div>
</div>

<div id="unten">
  <input id="frage" placeholder="Schreibe EO einen Befehl...">
  <button onclick="senden()">Senden</button>
</div>

<script>
async function senden(){

  const feld = document.getElementById("frage");
  const text = feld.value.trim();

  if(!text) return;

  const chat = document.getElementById("chat");

  const du = document.createElement("div");
  du.className = "msg du";
  du.innerHTML = "<b>Du:</b> " + text;
  chat.appendChild(du);

  feld.value = "";

  const warten = document.createElement("div");
  warten.className = "msg eo";
  warten.innerHTML = "<b>EO:</b> Denke nach...";
  chat.appendChild(warten);

  chat.scrollTop = chat.scrollHeight;

  try {

    const r = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: text
      })
    });

    const data = await r.json();

    warten.innerHTML =
      "<b>EO:</b> " +
      (data.response || data.error || "Keine Antwort erhalten.");

  } catch(e) {

    warten.innerHTML =
      "<b>EO:</b> Verbindung zur KI fehlgeschlagen: " +
      String(e.message || e);

  }

  chat.scrollTop = chat.scrollHeight;
}

document.getElementById("frage").addEventListener("keydown", function(e){
  if(e.key === "Enter"){
    senden();
  }
});
</script>

</body>
</html>`;

export default {

  async fetch(request, env) {

    const url = new URL(request.url);

    if(url.pathname === "/api/chat" && request.method === "POST") {

      try {

        const body = await request.json();

        const message =
          String(body.message || "").trim();

        if(!message) {

          return Response.json(
            {
              error: "Keine Nachricht erhalten."
            },
            {
              status: 400
            }
          );
        }

        if(!env.AI) {

          return Response.json(
            {
              error: "AI-Bindung fehlt.",
              response: "KI-Fehler: Die Workers-AI-Bindung AI wurde nicht gefunden."
            },
            {
              status: 500
            }
          );
        }

        const result = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct",
          {
            messages: [
              {
                role: "system",
                content:
                  "Du bist EO, ein hilfreicher KI-Assistent. Antworte standardmäßig auf Deutsch, klar und verständlich."
              },
              {
                role: "user",
                content: message
              }
            ]
          }
        );

        return Response.json({
          response:
            result?.response ||
            "Ich konnte darauf gerade keine Antwort erzeugen."
        });

      } catch(error) {

        return Response.json(
          {
            error: "KI-Fehler",
            response:
              "KI-Fehler: " +
              String(error?.message || error)
          },
