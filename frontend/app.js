const state = {
  messages: [],
  conversations: JSON.parse(localStorage.getItem("oao-conversations") || "[]"),
  busy: false
};

const $ = (id) => document.getElementById(id);
const messagesEl = $("messages");
const welcomeEl = $("welcome");
const promptEl = $("prompt");
const modelSelect = $("modelSelect");
const topModel = $("topModel");
const sendButton = $("sendButton");
const historyList = $("historyList");
const healthText = $("healthText");

function saveConversations() {
  localStorage.setItem("oao-conversations", JSON.stringify(state.conversations.slice(0, 12)));
}

function renderHistory() {
  historyList.innerHTML = "";
  state.conversations.forEach((c, index) => {
    const button = document.createElement("button");
    button.className = "history-item";
    button.textContent = c.title;
    button.onclick = () => loadConversation(index);
    historyList.appendChild(button);
  });
}

function loadConversation(index) {
  const conversation = state.conversations[index];
  if (!conversation) return;
  state.messages = conversation.messages.map(x => ({...x}));
  renderMessages();
}

function storeCurrentConversation() {
  if (!state.messages.length) return;
  const firstUser = state.messages.find(m => m.role === "user");
  const title = (firstUser?.content || "New conversation").slice(0, 60);
  state.conversations = [
    { title, messages: state.messages },
    ...state.conversations.filter(c => c.title !== title)
  ].slice(0, 12);
  saveConversations();
  renderHistory();
}

function updateModel() {
  topModel.textContent = modelSelect.value || "auto-oao-1";
}

async function loadModels() {
  try {
    const r = await fetch("/api/models");
    const data = await r.json();
    modelSelect.innerHTML = "";
    (data.models || []).forEach(model => {
      const o = document.createElement("option");
      o.value = model;
      o.textContent = model;
      modelSelect.appendChild(o);
    });
    updateModel();
    renderBenchmarkModels(data.models || []);
  } catch {
    modelSelect.innerHTML = "<option>auto-oao-1</option>";
  }
}

async function checkHealth() {
  try {
    const r = await fetch("/api/health");
    const data = await r.json();
    healthText.textContent = data.ok ? "Backend ready" : "Add API key to .env";
  } catch {
    healthText.textContent = "Backend unavailable";
  }
}

function setView(name) {
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.view === name);
  });
  $("chatView").classList.toggle("active", name === "chat");
  $("benchmarkView").classList.toggle("active", name === "benchmark");
}

function scrollBottom() {
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function renderMarkdown(text) {
  if (!window.marked) return text.replace(/</g, "&lt;");
  const html = marked.parse(text);
  return window.DOMPurify ? DOMPurify.sanitize(html) : html;
}

function addMessage(role, content, isStreaming = false) {
  const wrapper = document.createElement("article");
  wrapper.className = `message ${role}`;

  const roleEl = document.createElement("div");
  roleEl.className = "role";
  roleEl.textContent = role === "user" ? "YOU" : "AI";

  const bubble = document.createElement("div");
  bubble.className = `bubble ${isStreaming ? "typing" : ""}`;
  bubble.innerHTML = role === "assistant" ? renderMarkdown(content) : "";
  if (role === "user") bubble.textContent = content;

  wrapper.append(roleEl, bubble);
  messagesEl.appendChild(wrapper);
  scrollBottom();

  return bubble;
}

function renderMessages() {
  messagesEl.innerHTML = "";
  welcomeEl.style.display = state.messages.length ? "none" : "";
  state.messages.forEach(m => addMessage(m.role, m.content));
  addCopyButtons();
}

function addCopyButtons() {
  document.querySelectorAll(".bubble pre").forEach(pre => {
    if (pre.querySelector(".copy-code")) return;
    const button = document.createElement("button");
    button.className = "copy-code";
    button.textContent = "Copy";
    button.onclick = async () => {
      const code = pre.querySelector("code")?.innerText || pre.innerText;
      await navigator.clipboard.writeText(code);
      button.textContent = "Copied";
      setTimeout(() => button.textContent = "Copy", 1200);
    };
    pre.prepend(button);
  });

  document.querySelectorAll("pre code").forEach(el => {
    if (window.hljs) hljs.highlightElement(el);
  });
}

async function send(text) {
  if (!text || state.busy) return;

  state.busy = true;
  sendButton.disabled = true;
  promptEl.value = "";
  promptEl.style.height = "auto";
  welcomeEl.style.display = "none";

  state.messages.push({ role: "user", content: text });
  addMessage("user", text);

  const bubble = addMessage("assistant", "Thinking…", true);
  let answer = "";
  const started = performance.now();

  try {
    const response = await fetch("/api/chat/stream", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({
        model: modelSelect.value,
        messages: state.messages
      })
    });

    if (!response.ok) throw new Error(await response.text());

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let latency = null;

    while (true) {
      const {value, done} = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, {stream: true});

      const events = buffer.split("\n\n");
      buffer = events.pop();

      for (const event of events) {
        const dataLine = event.split("\n").find(line => line.startsWith("data: "));
        if (!dataLine) continue;
        const data = JSON.parse(dataLine.slice(6));

        if (data.content) {
          answer += data.content;
          bubble.classList.remove("typing");
          bubble.innerHTML = renderMarkdown(answer);
          addCopyButtons();
          scrollBottom();
        }
        if (event.startsWith("event: done")) latency = data.latency_ms;
        if (event.startsWith("event: error")) throw new Error(data.error);
      }
    }

    bubble.classList.remove("typing");
    bubble.innerHTML = renderMarkdown(answer || "(No response.)");
    const elapsed = latency ?? Math.round(performance.now() - started);

    const meta = document.createElement("div");
    meta.className = "meta-line";
    meta.textContent = `${modelSelect.value} · ${elapsed} ms`;
    bubble.appendChild(meta);

    state.messages.push({ role: "assistant", content: answer });
    storeCurrentConversation();
    addCopyButtons();
  } catch (err) {
    bubble.classList.remove("typing");
    bubble.textContent = `Error: ${err.message}`;
  } finally {
    state.busy = false;
    sendButton.disabled = false;
    promptEl.focus();
  }
}

function newChat() {
  state.messages = [];
  messagesEl.innerHTML = "";
  welcomeEl.style.display = "";
}

function renderBenchmarkModels(models) {
  const holder = $("benchmarkModels");
  holder.innerHTML = "";
  models.slice(0, 9).forEach((model, i) => {
    const label = document.createElement("label");
    label.className = "check";
    label.innerHTML = `
      <input type="checkbox" value="${model}" ${i < 3 ? "checked" : ""}>
      <span>${model}</span>`;
    holder.appendChild(label);
  });
}

async function runBenchmark() {
  const prompt = $("benchmarkPrompt").value.trim();
  const selected = [...document.querySelectorAll("#benchmarkModels input:checked")].map(x => x.value);
  const resultsEl = $("benchmarkResults");

  if (!prompt || !selected.length) return;

  resultsEl.innerHTML = "<div class='result'>Running benchmark…</div>";
  $("runBenchmark").disabled = true;

  try {
    const r = await fetch("/api/benchmark", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({prompt, models: selected})
    });
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Benchmark failed");

    resultsEl.innerHTML = "";
    data.results.forEach(result => {
      const card = document.createElement("article");
      card.className = "result";

      if (!result.ok) {
        card.innerHTML = `
          <div class="result-head">
            <div class="result-model">${result.model}</div>
            <div class="result-stats">${result.latency_ms} ms · failed</div>
          </div>
          <div class="result-content">${result.error}</div>`;
      } else {
        card.innerHTML = `
          <div class="result-head">
            <div class="result-model">${result.model}</div>
            <div class="result-stats">${result.latency_ms} ms${result.total_tokens ? ` · ${result.total_tokens} tokens` : ""}</div>
          </div>
          <div class="result-content">${renderMarkdown(result.content)}</div>`;
      }
      resultsEl.appendChild(card);
    });

    addCopyButtons();
  } catch (err) {
    resultsEl.innerHTML = `<div class="result">Error: ${err.message}</div>`;
  } finally {
    $("runBenchmark").disabled = false;
  }
}

$("chatForm").addEventListener("submit", e => {
  e.preventDefault();
  send(promptEl.value.trim());
});

promptEl.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    $("chatForm").requestSubmit();
  }
});

promptEl.addEventListener("input", () => {
  promptEl.style.height = "auto";
  promptEl.style.height = Math.min(promptEl.scrollHeight, 180) + "px";
});

modelSelect.addEventListener("change", updateModel);
$("newChat").addEventListener("click", newChat);
$("clearCurrent").addEventListener("click", newChat);
$("runBenchmark").addEventListener("click", runBenchmark);

$("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("oao-theme", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("oao-theme") === "dark") document.body.classList.add("dark");

document.querySelectorAll(".nav-item").forEach(button => {
  button.addEventListener("click", () => setView(button.dataset.view));
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    promptEl.value = button.dataset.prompt;
    promptEl.focus();
  });
});

renderHistory();
loadModels();
checkHealth();
