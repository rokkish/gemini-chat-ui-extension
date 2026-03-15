(function() {

  const STORAGE_KEY_PREFIX = "chat_history_";
  let currentChatId = getChatId();
  let historyMap = new Map(); // messageId -> { text, element } ※sortedで再代入あり

  createUI();
  observeMessages();
  restoreState();

  function getChatId() {
    const match = location.pathname.match(/\/c\/([^/]+)/);
    return match ? match[1] : location.pathname;
  }

  function createUI() {
    if (document.getElementById("history-box")) return;

    const box = document.createElement("div");
    box.id = "history-box";

    const header = document.createElement("div");
    header.id = "history-header";
    header.innerHTML = `<span>History</span><button id="history-toggle">−</button>`;

    const content = document.createElement("div");
    content.id = "history-content";

    box.appendChild(header);
    box.appendChild(content);
    document.body.appendChild(box);

    document.getElementById("history-toggle").onclick = () => {
      box.classList.toggle("minimized");
    };
  }

  function observeMessages() {
    const observer = new MutationObserver(() => {
      scanMessages();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    scanMessages();
  }

  function scanMessages() {
    const nodes = document.querySelectorAll(".whitespace-pre-wrap:not(.sr-only)");
    let updated = false;

    nodes.forEach(node => {
      const container = node.closest("[data-message-author-role='user']");
      if (!container) return;

      const messageId = container.getAttribute("data-message-id") || container.innerText.slice(0,50);

      if (!historyMap.has(messageId)) {
        const text = node.innerText.trim();
        historyMap.set(messageId, {
          text: text,
          element: container
        });
        updated = true;
      }
    });

    if (updated) {
      // DOM順（チャットの表示順）にソートして正しい順序を保証する
      const sorted = new Map(
        Array.from(historyMap.entries()).sort((a, b) => {
          const elA = a[1].element;
          const elB = b[1].element;
          const pos = elA.compareDocumentPosition(elB);
          if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
          if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
          return 0;
        })
      );
      historyMap = sorted;
      renderHistory();
    }
  }

  function renderHistory() {
    const content = document.getElementById("history-content");
    content.innerHTML = "";

    const entries = Array.from(historyMap.values());

    entries.forEach((entry, index) => {
      const item = document.createElement("div");
      item.className = "history-item";

      const dot = document.createElement("div");
      dot.className = "history-dot " + (index % 2 === 0 ? "color-a" : "color-b");

      const text = document.createElement("span");
      text.textContent = entry.text.slice(0, 30) + (entry.text.length > 30 ? "..." : "");

      item.appendChild(dot);
      item.appendChild(text);

      item.onclick = () => {
        entry.element.scrollIntoView({ behavior: "smooth", block: "center" });
      };

      content.appendChild(item);
    });

    saveState();
  }

  function saveState() {
    const data = Array.from(historyMap.entries()).map(([id, val]) => ({
      id: id,
      text: val.text
    }));
    chrome.storage.local.set({
      [STORAGE_KEY_PREFIX + currentChatId]: data
    });
  }

  function restoreState() {
    chrome.storage.local.get(STORAGE_KEY_PREFIX + currentChatId, result => {
      const data = result[STORAGE_KEY_PREFIX + currentChatId];
      if (!data) return;

      data.forEach(entry => {
        const el = document.querySelector(`[data-message-id="${entry.id}"]`);
        if (el) {
          historyMap.set(entry.id, {
            text: entry.text,
            element: el
          });
        }
      });

      renderHistory();
    });
  }

  window.addEventListener("popstate", () => {
    const newId = getChatId();
    if (newId !== currentChatId) {
      currentChatId = newId;
      historyMap.clear();
      renderHistory();
      restoreState();
    }
  });

})();
