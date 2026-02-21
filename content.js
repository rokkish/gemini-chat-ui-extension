(function() {
  // --- 1. UIの生成 ---
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

  // --- 2. 最小化/最大化ロジック ---
  let isMinimized = false;
  header.addEventListener('click', () => {
    isMinimized = !isMinimized;
    content.classList.toggle('minimized', isMinimized);
    toolbar.classList.toggle('minimized', isMinimized);
    document.getElementById('min-toggle').innerText = isMinimized ? '＋' : '−';
  });

  // --- 3. 履歴抽出と更新ロジック ---
  const processedNodes = new Set();

  function updateHistory() {
    const queries = document.querySelectorAll('.query-text');
    
    queries.forEach((query) => {
      if (!processedNodes.has(query)) {
        processedNodes.add(query);
        
        const item = document.createElement('div');
        item.className = 'history-item';
        
        const dot = document.createElement('div');
        dot.className = 'history-dot';
        
        const text = document.createElement('div');
        text.className = 'history-text';
        
        // cdk-visually-hidden を除外してテキストを抽出
        const clone = query.cloneNode(true);
        const hiddenElements = clone.querySelectorAll('.cdk-visually-hidden, [cdk-visually-hidden]');
        hiddenElements.forEach(el => el.remove());
        
        // 15文字抽出
        const rawText = clone.textContent.trim().replace(/\s+/g, ' ');
        text.innerText = rawText.substring(0, 15) + (rawText.length > 15 ? '...' : '');
        
        item.appendChild(dot);
        item.appendChild(text);
        
        // クリックで該当箇所へスクロール
        item.addEventListener('click', () => {
          query.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 一時的にハイライト
          query.style.outline = '2px solid #8ab4f8';
          query.style.borderRadius = '4px';
          setTimeout(() => { query.style.outline = 'none'; }, 2000);
        });
        
        content.appendChild(item);
        
        // 自動スクロール（履歴ボックス内）
        content.scrollTop = content.scrollHeight;
      }
    });
  }

  // --- 4. 監視の開始 ---
  updateHistory();
  const observer = new MutationObserver(() => updateHistory());
  observer.observe(document.body, { childList: true, subtree: true });
})();
