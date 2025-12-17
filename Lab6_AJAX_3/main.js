// переменные для хранения данных
let scheduleData = [];
let bellsData = [];
let currentFilters = {
    search: '',
    course: '3',
    group: 'ИВТ-3',
    day: ''
};

// получаем ссылки на элементы DOM
const scheduleList = document.getElementById('scheduleList');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const courseFilter = document.getElementById('courseFilter');
const groupFilter = document.getElementById('groupFilter');
const dayFilter = document.getElementById('dayFilter');
const currentDateEl = document.getElementById('currentDate');
const weekTypeEl = document.getElementById('weekType');
const weekInfo = document.getElementById('weekInfo');

// при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // загружаем данные из cookies если они есть
    loadFiltersFromCookies();

    // устанавливаем текущую дату и неделю
    setCurrentDate();

    // загружаем расписание и звонки
    loadScheduleData();
});

// обработчик кнопки поиска
searchButton.addEventListener('click', applyFilters);

// обработчик Enter в поле поиска
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        applyFilters();
    }
});

// обработчики изменения фильтров
courseFilter.addEventListener('change', applyFilters);
groupFilter.addEventListener('change', applyFilters);
dayFilter.addEventListener('change', applyFilters);

// функция загрузки данных расписания и звонков из JSON
function loadScheduleData() {
    showLoading();

    // загружаем расписание
    fetch('schedule.json')
        .then(response => response.json())
        .then(data => {
            scheduleData = data.schedule;

            // загружаем звонки
            return fetch('bells.json');
        })
        .then(response => response.json())
        .then(data => {
            bellsData = data.bells;

            // применяем фильтры и отображаем расписание
            applyFilters();
        })
        .catch(error => {
            console.error('Ошибка загрузки данных:', error);
            showError('Не удалось загрузить расписание');
        });
}

// функция установки текущей даты и недели
function setCurrentDate() {
    const now = new Date();

    // форматируем дату как ДД.ММ.ГГГГ
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    currentDateEl.textContent = `${day}.${month}.${year}`;

    // определяем номер недели с 1 сентября 2025 года
    const startDate = new Date(2025, 8, 1);
    const weekNumber = getWeekNumberFromStart(now, startDate);

    // определяем верхняя или нижняя неделя (начинаем с верхней)
    const weekType = weekNumber % 2 === 1 ? 'верхняя' : 'нижняя';
    weekTypeEl.textContent = `${weekType} неделя`;

    // добавляем tooltip с номером недели
    weekInfo.setAttribute('title', `Неделя №${weekNumber}`);

    // если день недели не выбран, устанавливаем текущий
    if (!currentFilters.day) {
        const dayNumber = now.getDay(); // 0-воскресенье, 1-понедельник и т.д.
        // преобразуем в формат 1-понедельник, 2-вторник
        currentFilters.day = dayNumber === 0 ? '' : String(dayNumber);
        if (currentFilters.day) {
            dayFilter.value = currentFilters.day;
        }
    }
}

// функция вычисления номера недели с заданной начальной даты
function getWeekNumberFromStart(currentDate, startDate) {
    // вычисляем разницу в днях
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // вычисляем номер недели (начиная с 1)
    const weekNumber = Math.floor(diffDays / 7) + 1;

    return weekNumber > 0 ? weekNumber : 1;
}

// функция загрузки фильтров из cookies
function loadFiltersFromCookies() {
    const savedFilters = getCookie('scheduleFilters');

    if (savedFilters) {
        try {
            const filters = JSON.parse(savedFilters);

            // устанавливаем значения фильтров
            if (filters.search) {
                searchInput.value = filters.search;
                currentFilters.search = filters.search;
            }

            if (filters.course) {
                courseFilter.value = filters.course;
                currentFilters.course = filters.course;
                highlightChanged(courseFilter.parentElement);
            }

            if (filters.group) {
                groupFilter.value = filters.group;
                currentFilters.group = filters.group;
                highlightChanged(groupFilter.parentElement);
            }

            if (filters.day) {
                dayFilter.value = filters.day;
                currentFilters.day = filters.day;
                highlightChanged(dayFilter.parentElement);
            }
        } catch (e) {
            console.error('Ошибка парсинга cookies:', e);
        }
    }
}

// функция сохранения фильтров в cookies
function saveFiltersToCookies() {
    const filters = {
        search: searchInput.value.trim(),
        course: courseFilter.value,
        group: groupFilter.value,
        day: dayFilter.value
    };

    // сохраняем на 30 дней
    setCookie('scheduleFilters', JSON.stringify(filters), 30);
}

// функция подсветки изменённого поля
function highlightChanged(element) {
    element.classList.add('changed');

    // убираем подсветку через 2 секунды
    setTimeout(() => {
        element.classList.remove('changed');
    }, 2000);
}

// функция применения фильтров
function applyFilters() {
    // получаем значения фильтров
    currentFilters.search = searchInput.value.trim().toLowerCase();
    currentFilters.course = courseFilter.value;
    currentFilters.group = groupFilter.value;
    currentFilters.day = dayFilter.value;

    // сохраняем в cookies
    saveFiltersToCookies();

    // фильтруем расписание
    const filtered = scheduleData.filter(item => {
        // фильтр по курсу
        if (currentFilters.course && item.course !== parseInt(currentFilters.course)) {
            return false;
        }

        // фильтр по группе
        if (currentFilters.group && item.group !== currentFilters.group) {
            return false;
        }

        // фильтр по дню недели
        if (currentFilters.day && item.dayNumber !== parseInt(currentFilters.day)) {
            return false;
        }

        // фильтр по поиску в названии предмета
        if (currentFilters.search && !item.subject.toLowerCase().includes(currentFilters.search)) {
            return false;
        }

        // фильтр по типу недели (верхняя/нижняя)
        const startDate = new Date(2025, 8, 1);
        const weekNumber = getWeekNumberFromStart(new Date(), startDate);
        const isUpperWeek = weekNumber % 2 === 1;

        if (item.week === 'upper' && !isUpperWeek) {
            return false;
        }

        if (item.week === 'lower' && isUpperWeek) {
            return false;
        }

        return true;
    });

    // отображаем результаты
    displaySchedule(filtered);
}

// функция отображения расписания
function displaySchedule(items) {
    scheduleList.innerHTML = '';

    if (items.length === 0) {
        showNoResults();
        return;
    }

    // сортируем по номеру пары
    items.sort((a, b) => a.pairNumber - b.pairNumber);

    // создаём элементы для каждой пары
    items.forEach(item => {
        const scheduleItem = createScheduleItem(item);
        scheduleList.appendChild(scheduleItem);
    });
}

// функция создания элемента расписания
function createScheduleItem(item) {
    const div = document.createElement('div');
    div.className = 'schedule-item';

    // находим время начала и окончания пары
    const bell = bellsData.find(b => b.number === item.pairNumber);
    const timeStr = bell ? `(${bell.start} - ${bell.end})` : '';

    // создаём структуру элемента
    div.innerHTML = `
        <div class="schedule-item-header">
            <div class="day-label">${item.day}</div>
            <div class="pair-number">${item.pairNumber} пара ${timeStr}</div>
            <div class="subject-name">${item.subject}</div>
            <div class="teacher-badge">
                ${item.type}<br>
                ${item.teacher ? item.teacher.replace('доц. ', '').replace('ст. преп. ', '') : ''}
            </div>
            <div class="expand-button">ЕЩЁ</div>
        </div>
        <div class="schedule-item-details">
            <div class="details-row">
                <div class="details-label">Предмет:</div>
                <div class="details-value">${item.subject}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Тип занятия:</div>
                <div class="details-value">${item.type}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Преподаватель:</div>
                <div class="details-value">${item.teacher || 'Не указан'}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Аудитория:</div>
                <div class="details-value">${item.room}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Группа:</div>
                <div class="details-value">${item.group}</div>
            </div>
            <div class="details-row">
                <div class="details-label">День недели:</div>
                <div class="details-value">${item.day}</div>
            </div>
            <div class="details-row">
                <div class="details-label">Время:</div>
                <div class="details-value">${bell ? `${bell.start} - ${bell.end}` : 'Не указано'}</div>
            </div>
        </div>
    `;

    // обработчик клика для раскрытия/скрытия деталей (аккордеон)
    const header = div.querySelector('.schedule-item-header');
    header.addEventListener('click', () => {
        // закрываем все другие открытые элементы
        document.querySelectorAll('.schedule-item.expanded').forEach(el => {
            if (el !== div) {
                el.classList.remove('expanded');
            }
        });

        // переключаем текущий элемент
        div.classList.toggle('expanded');
    });

    return div;
}

// функция показа индикатора загрузки
function showLoading() {
    scheduleList.innerHTML = '<div class="loading">Загрузка расписания...</div>';
}

// функция показа сообщения об отсутствии результатов
function showNoResults() {
    scheduleList.innerHTML = '<div class="no-results">Пары не найдены</div>';
}

// функция показа сообщения об ошибке
function showError(message) {
    scheduleList.innerHTML = `<div class="no-results">Ошибка: ${message}</div>`;
}

// функция установки cookie
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + (value || '') + expires + '; path=/';
}

// функция получения cookie
function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}