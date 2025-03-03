// 确保在 HTML 文档完全加载和解析完成后才执行，避免操作尚未加载的 DOM 元素
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
  // let lastLevel = 0;

  headings.forEach((heading, index) => {
    // 为每个标题添加id
    if (!heading.id) {
      heading.id = `heading-${index}`;
    }

    const level = parseInt(heading.tagName.charAt(1));
    const item = document.createElement('li');
    const hasChildren = index < headings.length - 1 && 
                       parseInt(headings[index + 1].tagName.charAt(1)) > level;
    
    // 创建展开/折叠按钮或圆点
    const toggleBtn = document.createElement('span');
    if (hasChildren) {
      toggleBtn.className = 'toggle-btn';
      toggleBtn.onclick = function(e) {
        e.stopPropagation();
        const uls = this.parentElement.parentElement.querySelectorAll('ul');
        if (uls.length > 0) { // 确保找到了 ul 元素才进行操作
          // 对每个 ul 元素进行隐藏或者显示操作
          uls.forEach(ul => {
              ul.style.display = ul.style.display === 'none' ? 'block' : 'none';
          });
          this.classList.toggle('collapsed');
        }
      };
    } else {
      toggleBtn.className = 'dot-btn'; // 最小层级使用圆点样式
    }
    item.appendChild(toggleBtn);

    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent;
    item.appendChild(link);

    // 调整目录层级
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

    // lastLevel = level;
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