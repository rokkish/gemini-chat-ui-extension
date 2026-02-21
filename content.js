(function() {
  // --- 1. UIの生成 (履歴ボックスと幅調整ボタン) ---
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

  // --- 2. 状態管理変数 ---
  let isMinimized = false;
  let processedNodes = []; // 順番を維持するため配列で管理
  let lastUrl = location.href;

  // --- 3. ユーティリティ関数 ---

  // 履歴を完全にリセットする
  function resetHistory() {
    processedNodes = [];
    content.innerHTML = '';
  }

  // テキスト抽出 (cdk-visually-hiddenを除外)
  function getCleanText(node) {
    const clone = node.cloneNode(true);
    const hiddenElements = clone.querySelectorAll('.cdk-visually-hidden, [cdk-visually-hidden]');
    hiddenElements.forEach(el => el.remove());
    return clone.textContent.trim().replace(/\s+/g, ' ');
  }

  // --- 4. メインロジック: 履歴の同期 ---
  function syncHistory() {
    // A: URLが変更されたらリセット
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      resetHistory();
      return;
    }

    const currentQueries = Array.from(document.querySelectorAll('.query-text'));

    // B: 整合性チェック
    // すでに登録した要素がDOMから消えていたら、チャットが切り替わったとみなしてリセット
    if (processedNodes.length > 0) {
      const firstNode = processedNodes[0].node;
      if (!document.body.contains(firstNode)) {
        resetHistory();
        return;
      }
    }

    // C: 新しい要素を追加
    currentQueries.forEach((query) => {
      // すでに登録済みかチェック
      if (!processedNodes.some(item => item.node === query)) {
        const rawText = getCleanText(query);
        if (!rawText) return;

        const itemObj = {
          node: query,
          text: rawText.substring(0, 15) + (rawText.length > 15 ? '...' : '')
        };

        const itemEl = document.createElement('div');
        itemEl.className = 'history-item';
        itemEl.innerHTML = `<div class="history-dot"></div><div class="history-text">${itemObj.text}</div>`;
        
        itemEl.addEventListener('click', () => {
          query.scrollIntoView({ behavior: 'smooth', block: 'center' });
          query.style.outline = '2px solid #8ab4f8';
          setTimeout(() => query.style.outline = 'none', 2000);
        });

        content.appendChild(itemEl);
        processedNodes.push(itemObj);

        // ボックスを最下部へスクロール
        content.scrollTop = content.scrollHeight;
      }
    });
  }

  // --- 5. イベントと監視 ---

  // 最小化切り替え
  header.addEventListener('click', () => {
    isMinimized = !isMinimized;
    content.classList.toggle('minimized', isMinimized);
    toolbar.classList.toggle('minimized', isMinimized);
    document.getElementById('min-toggle').innerText = isMinimized ? '＋' : '−';
  });

  // MutationObserver で DOM 変化を監視
  const observer = new MutationObserver(() => syncHistory());
  observer.observe(document.body, { childList: true, subtree: true });

  // URL変更をポーリングでも監視 (SPAの挙動対策)
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      resetHistory();
    }
  }, 1000);

  // 初回実行
  syncHistory();
})();
