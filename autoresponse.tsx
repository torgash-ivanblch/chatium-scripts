import {
  transformGcEventParams,
  addConversationReply,
  getConversationTransports,
} from '@getcourse/sdk';
import { provideUser } from '@app/auth';
import { Heap } from '@app/heap';
import { getGcUserData } from '@getcourse/sdk';

export const staffApp = app.use(provideUser({ minRole: 'Staff' }));

// Таблица с автоответами, чтобы не повторяться
export const AutoResponses = Heap.Table('auto_responses', {
  conversationId: Heap.Number(),
});

const daysOfWeek = {
  0: 'monday',
  1: 'tuesday',
  2: 'wednesday',
  3: 'thursday',
  4: 'friday',
  5: 'saturday',
  6: 'sunday',
};

export const AutoResponseSettings = Heap.Table('auto_response_settings', {
  responseText: Heap.String(),
  responseTextVacation: Heap.Optional(Heap.String()), // если оставить пустым, будет использоваться responseText
  is_enabled: Heap.Boolean(),
  adminId: Heap.Number(), // ID админа, который будет "отвечать"
  vacationDays: Heap.Object(
    {
      monday: Heap.Boolean(),
      tuesday: Heap.Boolean(),
      wednesday: Heap.Boolean(),
      thursday: Heap.Boolean(),
      friday: Heap.Boolean(),
      saturday: Heap.Boolean(),
      sunday: Heap.Boolean(),
    },
    {
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: true,
      sunday: true,
    }
  ),
});

staffApp.html('/', async (ctx, req) => {
  let config = await getConfig(ctx);
  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>GetCourse — форма автоответа</title>
  <style>
    #gc-autoreply{font-family: system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; color: #111}
    #gc-autoreply .gc-card{max-width:760px;background:#fff;border:1px solid #e6e6e6;border-radius:12px;box-shadow:0 6px 18px rgba(20,20,20,0.04);padding:18px;margin:12px}
    #gc-autoreply h2{margin:0 0 12px;font-size:18px}
    #gc-autoreply .gc-row{display:flex;gap:14px;align-items:center;margin-bottom:12px}
    #gc-autoreply .gc-col{flex:1}
    .gc-switch{display:inline-flex;align-items:center;gap:10px}
    .gc-switch input{position:absolute;left:-9999px}
    .gc-switch-label{position:relative;display:inline-block;width:52px;height:30px;background:#e5e7eb;border-radius:999px;cursor:pointer;transition:background .18s}
    .gc-switch-knob{position:absolute;top:3px;left:3px;width:24px;height:24px;background:#fff;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,0.12);transition:transform .18s}
    .gc-switch input:checked + .gc-switch-label{background:#4f46e5}
    .gc-switch input:checked + .gc-switch-label .gc-switch-knob{transform:translateX(22px)}
    #gc-autoreply label{display:block;font-size:13px;color:#374151;margin-bottom:6px}
    #gc-autoreply input[type="text"],
    #gc-autoreply select,
    #gc-autoreply textarea{width:100%;box-sizing:border-box;padding:10px;border-radius:8px;border:1px solid #d1d5db;background:#fff;font-size:14px}
    #gc-autoreply textarea{min-height:160px;resize:vertical}
    .gc-actions{display:flex;gap:10px;align-items:center;justify-content:flex-end;margin-top:14px}
    .gc-btn{padding:9px 14px;border-radius:8px;border:0;cursor:pointer;font-weight:600}
    .gc-btn--primary{background:#111827;color:#fff}
    .gc-btn--ghost{background:transparent;border:1px solid #e5e7eb}
    .gc-btn[disabled]{opacity:.6;cursor:not-allowed}
    .gc-note{font-size:13px;color:#6b7280}
    .gc-error{color:#b91c1c}
    .gc-success{color:#065f46}
    .gc-spinner{width:18px;height:18px;border:2px solid rgba(0,0,0,.08);border-top-color:rgba(0,0,0,.5);border-radius:50%;animation:gc-spin .9s linear infinite;display:inline-block}
    @keyframes gc-spin{to{transform:rotate(360deg)}}
    @media (max-width:560px){#gc-autoreply .gc-row{flex-direction:column;align-items:stretch}}
    .gc-weekdays{display:flex;flex-wrap:wrap;gap:8px}
    .gc-weekdays label{font-size:13px;display:flex;align-items:center;gap:4px}
  </style>
</head>
<body>
  <div id="gc-autoreply">
    <div class="gc-card" role="region" aria-label="Форма автоответа">
      <h2>Настройка автоответа на обращения</h2>

      <div class="gc-row" style="align-items:center">
        <div class="gc-col">
          <label for="gc-enabled">Автоответ</label>
          <div class="gc-switch" title="Включить/выключить автоответ">
            <input id="gc-enabled-input" type="checkbox" ${config.is_enabled ? 'checked' : ''
    }/>
            <label class="gc-switch-label" for="gc-enabled-input">
              <span class="gc-switch-knob" aria-hidden="true"></span>
            </label>
            <span id="gc-enabled-text" style="font-size:14px;margin-left:8px">Отключен</span>
          </div>
        </div>
        <div class="gc-status" id="gc-load-status" aria-live="polite"></div>
      </div>

      <div class="gc-row">
        <div class="gc-col">
          <label for="gc-text">Текст автоответа (будни)</label>
          <textarea id="gc-text" name="text" rows="8" placeholder="Например: Спасибо за обращение! Мы ответим в ближайшее рабочее время." >${config.responseText ? config.responseText : ''
    }</textarea>
          <div class="gc-note">Обязательное поле.</div>
        </div>
      </div>

      <div class="gc-row">
        <div class="gc-col">
          <label for="gc-text-vac">Текст автоответа (выходные)</label>
          <textarea id="gc-text-vac" name="text_vacation" rows="8" placeholder="Оставьте пустым, если хотите использовать будний текст">${config.responseTextVacation ? config.responseTextVacation : ''
    }</textarea>
          <div class="gc-note">Можно оставить пустым — тогда применяется будний текст.</div>
        </div>
      </div>

      <div class="gc-row">
        <div class="gc-col">
          <label>Выходные дни</label>
          <div class="gc-weekdays">
            <label><input type="checkbox" data-day="0" ${config.vacationDays.monday ? 'checked' : ''
    }> Пн</label>
            <label><input type="checkbox" data-day="1" ${config.vacationDays.tuesday ? 'checked' : ''
    }> Вт</label>
            <label><input type="checkbox" data-day="2" ${config.vacationDays.wednesday ? 'checked' : ''
    }> Ср</label>
            <label><input type="checkbox" data-day="3" ${config.vacationDays.thursday ? 'checked' : ''
    }> Чт</label>
            <label><input type="checkbox" data-day="4" ${config.vacationDays.friday ? 'checked' : ''
    }> Пт</label>
            <label><input type="checkbox" data-day="5" ${config.vacationDays.saturday ? 'checked' : ''
    }> Сб</label>
            <label><input type="checkbox" data-day="6" ${config.vacationDays.sunday ? 'checked' : ''
    }> Вс</label>
          </div>
        </div>
      </div>

      <div class="gc-row">
        <div class="gc-col">
          <label for="gc-admin">Отправитель</label>
          <select id="gc-admin" required>
            <option value="">Загрузка списка...</option>
          </select>
          
        </div>
      </div>

      <div class="gc-actions">
        <div id="gc-msg" aria-live="polite"></div>
        <button id="gc-save" class="gc-btn gc-btn--primary">Сохранить</button>
        <button id="gc-reset" class="gc-btn gc-btn--ghost" type="button">Сброс</button>
      </div>
    </div>
  </div>

  <script>
    (function(){
      const GET_ADMIN_URL = '/pl/user/user/models-list?type[]=admin&type[]=teacher';
      const SAVE_URL = '${appPostAutoresponseSettingsRoute.url()}';

      const el = id => document.getElementById(id);
      const enabledInput = el('gc-enabled-input');
      const enabledText = el('gc-enabled-text');
      const textInput = el('gc-text');
      const vacInput = el('gc-text-vac');
      const adminSelect = el('gc-admin');
      const saveBtn = el('gc-save');
      const resetBtn = el('gc-reset');
      const msgBox = el('gc-msg');
      const loadStatus = el('gc-load-status');
      const weekdayCheckboxes = document.querySelectorAll('.gc-weekdays input[type="checkbox"]');

      function setEnabledUI(checked){
        enabledText.textContent = checked ? 'Включен' : 'Отключен';
      }
      setEnabledUI(enabledInput.checked);
      enabledInput.addEventListener('change', ()=> setEnabledUI(enabledInput.checked));

      function showMessage(text, type='info', timeout=4000){
        msgBox.textContent = text;
        msgBox.className = type === 'error' ? 'gc-error' : (type === 'success' ? 'gc-success' : 'gc-note');
        if(timeout) setTimeout(()=>{ if(msgBox.textContent===text) msgBox.textContent=''; }, timeout);
      }

      function setLoadingStatus(node, text){
        node.textContent = text || '';
      }

      async function getAdminList(url){
        adminSelect.innerHTML = '<option value="">Загрузка...</option>';
        try{
          setLoadingStatus(loadStatus, 'Загружаем админов...');

          const response = await fetch('/pl/user/user/models-list?type[]=admin&type[]=teacher');
          if(!response.ok) throw new Error('HTTP '+res.status);
          const data = await response.json().then((v)=>{return v.models.map((el)=>{return {id: el.key.toString(), name: el.label}})});
                    
          adminSelect.innerHTML = '<option value="">-- Не выбран --</option>';
          if(Array.isArray(data) && data.length){
            data.forEach(a => {
              const opt = document.createElement('option');
              opt.value = String(a.id);
              opt.textContent = a.name;
              adminSelect.appendChild(opt);
            });
            let configAdminId = ${config.adminId};
            if (adminSelect.innerHTML.indexOf('value="' + ${config.adminId
    } + '"') > -1) {
                adminSelect.value = ${config.adminId};
            }
          } else {
            const opt = document.createElement('option'); opt.value=''; opt.textContent='(нет админов)'; adminSelect.appendChild(opt);
          }
          setLoadingStatus(loadStatus, '');
          return data;
        }catch(err){
          adminSelect.innerHTML = '<option value="">Ошибка загрузки</option>';
          setLoadingStatus(loadStatus, 'Ошибка загрузки списка админов');
          console.error('getAdminList error', err);
          return null;
        }
      }

      if(GET_ADMIN_URL && GET_ADMIN_URL !== '{GET_ADMIN_URL}'){
        
        getAdminList(GET_ADMIN_URL);
      } else {
        adminSelect.innerHTML = '<option value="">(подставьте GET_ADMIN_URL)</option>';
      }

      function validate(){
        if(!textInput.value.trim()){
          showMessage('Поле "Текст автоответа (будни)" обязательно', 'error', 5000);
          textInput.focus();
          return false;
        }

        if(!adminSelect.value) {
        showMessage('Выберите отправителя (безымянная отправка невозможна)', 'error', 5000);
        return false;
        }
        
        return true;
      }

      function setSaving(isSaving){
        if(isSaving){
          saveBtn.disabled = true; saveBtn.innerHTML = '<span class="gc-spinner" aria-hidden="true"></span> Сохранение...';
        } else {
          saveBtn.disabled = false; saveBtn.textContent = 'Сохранить';
        }
      }

      async function handleSave(e){
        e && e.preventDefault && e.preventDefault();
        if(!validate()) return;
        const payload = new URLSearchParams();
        payload.append('is_enabled', enabledInput.checked ? true : false);
        payload.append('admin_id', adminSelect.value ? String(adminSelect.value) : '');
        payload.append('text', textInput.value.trim());
        payload.append('text_vacation', vacInput.value.trim());
        const weekends = {};
        weekdayCheckboxes.forEach(cb => {
          const day = parseInt(cb.dataset.day);
          weekends[day] = cb.checked;
        });
        payload.append('weekends', JSON.stringify(weekends));

        if(!SAVE_URL || SAVE_URL === '{SAVE_URL}'){
          showMessage('Подставьте SAVE_URL в код перед использованием.', 'error');
          return;
        }

        try{
          setSaving(true);
          setLoadingStatus(loadStatus, 'Сохранение...');
          const res = await fetch(SAVE_URL, {
            method: 'POST',
            headers: {'Content-Type':'application/x-www-form-urlencoded'},
            body: payload.toString(),
            credentials: 'same-origin'
          });
          const text = await res.text();
          if(!res.ok){
            throw new Error('Ошибка сервера: '+res.status+' '+text);
          }
          showMessage('Сохранено успешно', 'success', 4000);
        }catch(err){
          console.error('save error', err);
          showMessage('Ошибка при сохранении: '+(err.message||err), 'error', 7000);
        }finally{
          setSaving(false);
          setLoadingStatus(loadStatus, '');
        }
      }

      saveBtn.addEventListener('click', handleSave);

      resetBtn.addEventListener('click', ()=>{
        enabledInput.checked = false; setEnabledUI(false);
        textInput.value = '';
        vacInput.value = '';
        if(adminSelect.options && adminSelect.options.length) adminSelect.selectedIndex = 0;
        weekdayCheckboxes.forEach(cb => { cb.checked = cb.dataset.day == 5 || cb.dataset.day == 6; });
        showMessage('Поля сброшены');
      });

      window.gcAutoreply = {
        getAdminList: getAdminList,
        submit: handleSave,
        getValues: function(){
          const weekends = {};
          weekdayCheckboxes.forEach(cb => {
            weekends[parseInt(cb.dataset.day)] = cb.checked;
          });
          return {
            is_enabled: enabledInput.checked,
            admin_id: adminSelect.value ? Number(adminSelect.value) : null,
            text: textInput.value,
            text_vacation: vacInput.value,
            weekends
          };
        }
      };
    })();
  </script>
</body>
</html>


    `;
});

export const appPostAutoresponseSettingsRoute = staffApp.post(
  '/',
  async (ctx, req) => {
    let form = req.body;
    if (!form) {
      return { status: false };
    }
    ctx.account.log(`form posted: ${JSON.stringify(form)}`);
    let { is_enabled, admin_id, text, text_vacation, weekends } = req.body;
    weekends = JSON.parse(weekends);

    ctx.account.log(`form days: ${weekends['0']}`);
    try {
      config = await AutoResponseSettings.updateSingleton(ctx, {
        responseText: text,
        responseTextVacation: text_vacation,
        is_enabled: is_enabled === 'true',
        adminId: Number(admin_id),
        vacationDays: {
          monday: Boolean(weekends['0']),
          tuesday: Boolean(weekends['1']),
          wednesday: Boolean(weekends['2']),
          thursday: Boolean(weekends['3']),
          friday: Boolean(weekends['4']),
          saturday: Boolean(weekends['5']),
          sunday: Boolean(weekends['6']),
        },
      });
      ctx.account.log(`Новый конфиг: ${JSON.stringify(config)}`);
    } catch (err) {
      ctx.account.log(`autoresponse settings update error: ${err}`);
    }
    return { status: true };
  }
);


async function getConfig(ctx) {
  let config = await AutoResponseSettings.getSingleton(ctx);

  if (!config.responseText) {
    config = await AutoResponseSettings.updateSingleton(ctx, {
      responseText:
        'Добрый день! Ваше сообщение принято, наши сотрудники вам скоро ответят.\n\nЭто техническое сообщение, отвечать не нужно.',
      responseTextVacation: '',
      is_enabled: false,
      adminId: 0,
      vacationDays: {
        monday: false,
        tuesday: false,
        wednesday: false,
        thursday: false,
        friday: false,
        saturday: true,
        sunday: true,
      },
    });
  }

  return config;
}

import { showContextMenu } from '@app/ui';
app.apiCall('/settings-action', (ctx) => {
  return showContextMenu([
    {
      title: 'Настройки',
      onClick: ctx.account.navigate(appPostAutoresponseSettingsRoute.url(), {
        openInExternalApp: true,
      }),
    },
  ]);
});
app.accountHook(
  'metric-event-event://getcourse/conversation/addedMessage',
  async (ctx, params) => {
    let config = await getConfig(ctx);
    // ничего не делать, если в конфиге автоответ выключен или не задан админ
    if (!config.is_enabled || config.adminId == 0) {
      return;
    }

    const event = transformGcEventParams(ctx, params.event);
    //ctx.account.log(`Message Event: \n\n ${JSON.stringify(event)}`)
    let senderUserId = event.comment.user_id;
    //ctx.account.log(`message incoming, obtaining user info`);

    const autoResponseInDB = await AutoResponses.findOneBy(ctx, {
      conversationId: event.conversation.id,
    });

    // ничего не делать, если в этой ветке автоответ уже был
    if (autoResponseInDB) {
      return;
    } else {

      // записать попытку автоответа в БД чтобы не повторяться
      // даже если отвечать сейчас не надо
      const newAutoResponseInDB = await AutoResponses.create(ctx, {
        conversationId: event.conversation.id,
      });
    }

    let userInfo = await getGcUserData(ctx, { id: senderUserId });

    //ctx.account.log(`userInfo: ${JSON.stringify(userInfo)}`);

    if (['admin', 'teacher'].includes(userInfo.user.type)) {
      return;
    }

    let transports = await getConversationTransports(
      ctx,
      (senderUserId = event.user.gcId)
    );


    let transportsAvailable = transports
      .filter(function (item) {
        return item.is_enabled;
      })
      .map(function (item) {
        return item.name;
      });

    let now = new Date();
    let nowDayOfWeek = (now.getDay() + 6) % 7;
    let isVacation = config.vacationDays[daysOfWeek[nowDayOfWeek]];
    //ctx.account.log(`Выходной день? ${isVacation}, userInfo: ${JSON.stringify(userInfo)}`);
    let responseText = '';
    if (isVacation) {
      // если текста для выходных не задано, использовать текст для будней
      if (config.responseTextVacation) {
        responseText = config.responseTextVacation;
      } else {
        responseText = config.responseText;
      }
    } else {
      responseText = config.responseText;
    }
    if (responseText.includes('{conversation_id}')) {
      responseText = responseText.replaceAll(
        '{conversation_id}',
        event.conversation.responsibility_id
      );
    }
    await addConversationReply(
      (ctx = ctx),
      (params = {
        fromUserId: config.adminId,
        conversationId: event.conversation.id,
        text: responseText,
        transports: transportsAvailable,
        //  forceEmails?: boolean
      })
    );

  }
);
