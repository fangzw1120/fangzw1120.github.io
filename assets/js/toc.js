document.addEventListener('DOMContentLoaded', function() {
  const tocContent = document.getElementById('toc-content');
  const article = document.querySelector('.markdown-body');
  
  if (!tocContent || !article) return;

  // 获取所有标题元素
  const headings = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
  if (headings.length === 0) return;

  // 创建目录树
  const toc = document.createElement('ul');
  const stack = [{ level: 0, element: toc }];

  headings.forEach((heading, index) => {
    // 为每个标题添加id
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }

    const level = parseInt(heading.tagName.charAt(1));
    const item = document.createElement('li');
    
    // 创建展开/折叠按钮
    if (level < 6) { // 最后一级不需要展开/折叠按钮
      const toggleBtn = document.createElement('span');
      toggleBtn.className = 'toggle-btn';
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 阻止事件冒泡
        const ul = item.querySelector('ul');
        if (ul) {
          ul.classList.toggle('collapsed');
          toggleBtn.classList.toggle('collapsed');
        }
      });
      item.appendChild(toggleBtn);
    }

    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.appendChild(link);

    // 根据标题层级构建目录树
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    if (level > stack[stack.length - 1].level) {
      const ul = document.createElement('ul');
      ul.appendChild(item);
      stack[stack.length - 1].element.appendChild(ul);
      stack.push({ level: level, element: ul });
    } else {
      stack[stack.length - 1].element.appendChild(item);
    }
  });

  tocContent.appendChild(toc);

  // 点击目录项滚动到对应位置
  tocContent.addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
      e.preventDefault();
      const targetId = e.target.getAttribute('href').slice(1);
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  });

  // 滚动时更新目录高亮
  const tocLinks = tocContent.getElementsByTagName('a');
  const headingElements = Array.from(headings);

  function updateTocHighlight() {
    const scrollPosition = window.scrollY;
    
    // 找到当前可见的标题
    let currentHeading = headingElements[0];
    for (const heading of headingElements) {
      if (heading.offsetTop - 100 <= scrollPosition) {
        currentHeading = heading;
      } else {
        break;
      }
    }

    // 更新目录高亮
    for (const link of tocLinks) {
      link.classList.remove('toc-active');
      if (link.getAttribute('href') === `#${currentHeading.id}`) {
        link.classList.add('toc-active');
      }
    }
  }

  window.addEventListener('scroll', updateTocHighlight);
  updateTocHighlight(); // 初始化高亮
});