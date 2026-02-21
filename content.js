(function() {
  // --- UIの生成 (前回と同様) ---
  const box = document.createElement('div');
  box.id = 'gemini-history-box';
  const header = document.createElement('div');
  header.id = 'gemini-history-header';
  header.innerHTML = `<span>History Graph</span><span id="min-toggle">−</span>`;
  const toolbar = document.createElement('div');
  toolbar.id = 'gemini-width-toolbar';
  const widthConfigs = [
    { label: '><', class: 'w-normal' },
    { label: '<>', class: 'w-80' },
    { label: '<<>>', class: 'w-100' }
  ];
  widthConfigs.forEach(cfg => {
    const btn = document.createElement('button');
    btn.className = 'width-btn';
    btn.innerText = cfg.label;
    btn.onclick = (e) => {
      e.stopPropagation();
      document.body.classList.remove('w-80', 'w-100');
      if (cfg.class !== 'w-normal') document.body.classList.add(cfg.class);
    };
    toolbar.appendChild(btn);
  });
  const content = document.createElement('div');
  content.id = 'gemini-history-content';
  box.appendChild(header);
  box.appendChild(toolbar);
  box.appendChild(content);
  document.body.appendChild(box);

  let isMinimized = false;
  let processedNodes = []; 
  let lastUrl = location.href;

  function resetHistory() {
    processedNodes = [];
    content.innerHTML = '';
  }

  function getCleanText(node) {
    const clone = node.cloneNode(true);
    const hiddenElements = clone.querySelectorAll('.cdk-visually-hidden, [cdk-visually-hidden]');
    hiddenElements.forEach(el => el.remove());
    return clone.textContent.trim().replace(/\s+/g, ' ');
  }

  // --- メインロジック: インデックスと色分けの反映 ---
  function syncHistory() {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      resetHistory();
      return;
    }

    const currentQueries = Array.from(document.querySelectorAll('.query-text'));

    if (processedNodes.length > 0) {
      const firstNode = processedNodes[0].node;
      if (!document.body.contains(firstNode)) {
        resetHistory();
        return;
      }
    }

    currentQueries.forEach((query) => {
      if (!processedNodes.some(item => item.node === query)) {
        const rawText = getCleanText(query);
        if (!rawText) return;

        const itemObj = {
          node: query,
          text: rawText.substring(0, 15) + (rawText.length > 15 ? '...' : '')
        };
        processedNodes.push(itemObj);
        
        // 全体を再描画してインデックス（0, 1, 2...）を更新
        renderAllItems();
      }
    });
  }

  // リストを再描画する関数
  function renderAllItems() {
    content.innerHTML = '';
    // 最新が 0 なので、配列を逆順にしてループを回すか、
    // インデックスを (length - 1 - i) で計算します。
    const len = processedNodes.length;
    
    processedNodes.forEach((item, index) => {
      const displayIndex = len - 1 - index; // 最新が0
      const isOdd = displayIndex % 2 !== 0; // 1, 3, 5... かどうか

      const itemEl = document.createElement('div');
      itemEl.className = 'history-item';
      
      // 奇数番目には 'odd-dot' クラスを付与
      const dotClass = isOdd ? 'history-dot odd-dot' : 'history-dot';
      
      itemEl.innerHTML = `
        <div class="${dotClass}"></div>
        <div class="history-text">
          <span class="history-index">[${displayIndex}]</span> ${item.text}
        </div>
      `;
      
      itemEl.addEventListener('click', () => {
        item.node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        item.node.style.outline = '2px solid #8ab4f8';
        setTimeout(() => item.node.style.outline = 'none', 2000);
      });

      content.appendChild(itemEl);
    });
    content.scrollTop = content.scrollHeight;
  }

  header.addEventListener('click', () => {
    isMinimized = !isMinimized;
    content.classList.toggle('minimized', isMinimized);
    toolbar.classList.toggle('minimized', isMinimized);
    document.getElementById('min-toggle').innerText = isMinimized ? '＋' : '−';
  });

  const observer = new MutationObserver(() => syncHistory());
  observer.observe(document.body, { childList: true, subtree: true });

  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      resetHistory();
    }
  }, 1000);

  syncHistory();
})();
