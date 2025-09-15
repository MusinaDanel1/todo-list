// Rick & Morty UI + тот же функционал
(function(){
  const B = () => window.backend && window.backend.TaskHandler;

  const state = {
    query: { status:'all', date_scope:'all', sort_by:'created_at', sort_order:'desc' },
    toDelete: null,
  };

  const $ = (s)=>document.querySelector(s);
  const listActive = $('#listActive');
  const listCompleted = $('#listCompleted');

  // Тема: по умолчанию тёмная, кнопка переключает иконку
  (function initTheme(){
    const saved = localStorage.getItem('theme');
    const dark = saved ? saved === 'dark' : true;
    document.documentElement.classList.toggle('dark', dark);
    updateThemeBtn();
  })();
  function updateThemeBtn(){
    $('#themeToggle').textContent = document.documentElement.classList.contains('dark') ? '🌙' : '☀️';
  }
  $('#themeToggle').addEventListener('click', ()=>{
    const dark = !document.documentElement.classList.contains('dark');
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
    updateThemeBtn();
  });

  function fmtDate(iso){ if(!iso) return ''; const d = new Date(iso); return d.toLocaleString(); }
  function makeBadge(priority){
    const s = document.createElement('span'); s.className='badge';
    let label = 'Низкий', cls = 'badge--low';
    if(priority === 'medium'){ label = 'Средний'; cls='badge--medium'; }
    if(priority === 'high'){ label = 'Высокий'; cls='badge--high'; }
    s.textContent = label; s.classList.add(cls);
    return s;
  }

  async function refresh(){
    const api = B(); if(!api) return;
    const items = await api.List(state.query);
    const active = items.filter(i=>!i.done);
    const done = items.filter(i=>i.done);
    renderList(listActive, active);
    renderList(listCompleted, done);
  }

  function renderList(root, items){
    root.innerHTML = '';
    if(items.length === 0){
      const empty = document.createElement('div');
      empty.className = 'card glass';
      empty.textContent = 'Пусто';
      root.appendChild(empty);
      return;
    }
    for(const t of items){
      const wrap = document.createElement('div');
      wrap.className = 'item card glass' + (t.done ? ' item-done' : '');

      const left = document.createElement('div'); left.className='item-left';

      const cb = document.createElement('input');
      cb.type='checkbox'; cb.checked=t.done;
      cb.addEventListener('change', async ()=>{
        await B().SetDone(t.id, cb.checked);
        await refresh();
      });

      const textWrap = document.createElement('div');
      const title = document.createElement('div'); title.className='item-title'; title.textContent=t.title;
      textWrap.appendChild(title);

      const meta = document.createElement('div');
      meta.style.fontSize='12px'; meta.style.opacity='.82';
      meta.style.display='flex'; meta.style.gap='8px'; meta.style.marginTop='4px';

      if(t.due_at){
        const m = document.createElement('span'); m.textContent='⏰ ' + fmtDate(t.due_at);
        meta.appendChild(m);
      }
      meta.appendChild(makeBadge(t.priority));
      textWrap.appendChild(meta);

      left.appendChild(cb);
      left.appendChild(textWrap);

      const del = document.createElement('button');
      del.className='btn-ghost'; del.textContent='🗑️';
      del.addEventListener('click', ()=> openModal(t.id));

      wrap.appendChild(left);
      wrap.appendChild(del);
      root.appendChild(wrap);
    }
  }

  // форма
  $('#taskForm').addEventListener('submit', async (e)=>{
    e.preventDefault();
    const title = $('#title').value.trim(); if(!title) return;
    const priority = $('#priority').value;
    const due = $('#due').value;
    await B().CreateTask({ title, priority, due_at: due ? new Date(due) : null });
    $('#title').value=''; $('#due').value='';
    await refresh();
  });

  // фильтры/сортировки
  ['status','date_scope','sort_by','sort_order'].forEach(id=>{
    document.getElementById(id).addEventListener('change', (e)=>{
      state.query[id] = e.target.value;
      refresh();
    });
  });
  $('#reload').addEventListener('click', refresh);

  // модалка
  function openModal(id){ state.toDelete = id; $('#modal').classList.remove('hidden'); }
  function closeModal(){ state.toDelete = null; $('#modal').classList.add('hidden'); }
  $('#modalCancel').addEventListener('click', closeModal);
  $('#modalOk').addEventListener('click', async ()=>{
    if(state.toDelete != null){ await B().DeleteTask(state.toDelete); }
    closeModal(); await refresh();
  });
  $('#modal').addEventListener('click', (e)=>{ if(e.target.id==='modal') closeModal(); });

  // старт
  document.addEventListener('DOMContentLoaded', refresh);
})();
