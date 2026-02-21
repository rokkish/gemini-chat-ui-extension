// UIの構築
const box = document.createElement('div');
box.id = 'gemini-history-box';

const header = document.createElement('div');
header.id = 'gemini-history-header';

const title = document.createElement('span');
title.innerText = 'History Graph';

const toggleBtn = document.createElement('span');
toggleBtn.innerText = '−';
toggleBtn.style.fontSize = '16px';

header.appendChild(title);
header.appendChild(toggleBtn);

const content = document.createElement('div');
content.id = 'gemini-history-content';

box.appendChild(header);
box.appendChild(content);
document.body.appendChild(box);

// 最小化/最大化の切り替え処理
let isMinimized = false;
header.addEventListener('click', () => {
  isMinimized = !isMinimized;
  content.classList.toggle('minimized', isMinimized);
  toggleBtn.innerText = isMinimized ? '＋' : '−';
  
  header.style.borderRadius = isMinimized ? '8px' : '8px 8px 0 0';
});

// 重複追加を防ぐためのSet
const processedNodes = new Set();

// 履歴を更新する関数
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
      
      // ==========================================
      // 修正箇所: cdk-visually-hidden を除外するロジック
      // ==========================================
      // 元のDOMに影響を与えないようノードを複製
      const clone = query.cloneNode(true);
      
      // クラス名または属性に cdk-visually-hidden を持つ要素をすべて取得して削除
      const hiddenElements = clone.querySelectorAll('.cdk-visually-hidden, [cdk-visually-hidden]');
      hiddenElements.forEach(el => el.remove());
      
      // DOMにアタッチされていない複製ノードからテキストを取得するため、innerText ではなく textContent を使用
      const fullText = clone.textContent.trim().replace(/\s+/g, ' ');
      // ==========================================
      
      text.innerText = fullText.substring(0, 15) + (fullText.length > 15 ? '...' : '');
      
      item.appendChild(dot);
      item.appendChild(text);
      
      // クリックイベント: 対象の発言へスクロール
      item.addEventListener('click', () => {
        query.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        const originalBg = query.style.backgroundColor;
        query.style.transition = 'background-color 0.5s';
        query.style.backgroundColor = 'rgba(138, 180, 248, 0.3)';
        setTimeout(() => {
          query.style.backgroundColor = originalBg;
        }, 1500);
      });
      
      content.appendChild(item);
    }
  });
  
  if (content.scrollHeight > content.clientHeight) {
    content.scrollTop = content.scrollHeight;
  }
}

// 初回ロード時のチェック
updateHistory();

// チャットが動的に追加された時の監視設定
const observer = new MutationObserver((mutations) => {
  updateHistory();
});

observer.observe(document.body, { childList: true, subtree: true });
