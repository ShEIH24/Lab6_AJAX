// переменная для хранения текущего поискового запроса
let currentQuery = '';
// переменная для отслеживания текущей страницы (смещения данных)
let currentOffset = 0;
// количество результатов на одну загрузку
const ITEMS_PER_PAGE = 10;
// флаг для предотвращения множественных одновременных запросов
let isLoading = false;

// получаем ссылки на элементы DOM
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const resultsSection = document.getElementById('resultsSection');
const resultsList = document.getElementById('resultsList');
const loadMoreBtn = document.getElementById('loadMoreBtn');

// обработчик нажатия на кнопку поиска
searchButton.addEventListener('click', performSearch);

// обработчик нажатия Enter в поле ввода
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// обработчик кнопки "загрузить ещё"
loadMoreBtn.addEventListener('click', loadMoreResults);

// функция выполнения нового поиска
function performSearch() {
    const query = searchInput.value.trim();

    // проверяем что поле не пустое
    if (query === '') {
        return;
    }

    // сбрасываем состояние для нового поиска
    currentQuery = query;
    currentOffset = 0;
    resultsList.innerHTML = '';

    // загружаем первую порцию данных
    loadResults(false);
}

// функция загрузки дополнительных результатов
function loadMoreResults() {
    // увеличиваем смещение для следующей порции данных
    currentOffset += ITEMS_PER_PAGE;
    // загружаем данные с добавлением к существующим
    loadResults(true);
}

// основная функция загрузки результатов через AJAX
function loadResults(append = false) {
    // предотвращаем повторные запросы пока идёт загрузка
    if (isLoading) return;

    isLoading = true;

    // показываем индикатор загрузки
    if (!append) {
        showLoading();
    }

    // делаем кнопку "загрузить ещё" неактивной
    loadMoreBtn.disabled = true;

    // создаём объект FormData для отправки данных
    const formData = new FormData();
    formData.append('query', currentQuery);
    formData.append('offset', currentOffset);
    formData.append('limit', ITEMS_PER_PAGE);

    // отправляем AJAX запрос к серверу
    fetch('AJAX.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            // проверяем успешность HTTP запроса
            if (!response.ok) {
                throw new Error('Ошибка сети: ' + response.status);
            }
            // получаем текст ответа
            return response.text();
        })
        .then(text => {
            try {
                // пытаемся распарсить JSON
                const data = JSON.parse(text);
                // обрабатываем полученные данные
                handleResponse(data, append);
            } catch (e) {
                // если не получилось распарсить
                console.error('Ошибка парсинга JSON:', e);
                throw new Error('Сервер вернул некорректный ответ');
            }
        })
        .catch(error => {
            // обрабатываем ошибки
            console.error('Ошибка:', error);
            showError(error.message || 'Произошла ошибка при загрузке данных');
        })
        .finally(() => {
            // сбрасываем флаг загрузки
            isLoading = false;
            loadMoreBtn.disabled = false;
        });
}

// функция обработки ответа от сервера
function handleResponse(data, append) {
    // показываем секцию с результатами
    resultsSection.classList.remove('hidden');

    // если не добавляем к существующим, очищаем список
    if (!append) {
        resultsList.innerHTML = '';
    }

    // проверяем наличие результатов
    if (!data.results || data.results.length === 0) {
        if (!append) {
            showNoResults();
        }
        // скрываем кнопку если больше нет данных
        loadMoreBtn.classList.add('hidden');
        return;
    }

    // добавляем каждый результат в список
    data.results.forEach((item) => {
        const resultItem = createResultItem(item);
        resultsList.appendChild(resultItem);
    });

    // управляем видимостью кнопки "загрузить ещё"
    if (data.hasMore) {
        loadMoreBtn.classList.remove('hidden');
    } else {
        loadMoreBtn.classList.add('hidden');
    }
}

// функция создания HTML элемента результата
function createResultItem(item) {
    const div = document.createElement('div');
    div.className = 'result-item';

    // простой текст с номером результата
    div.textContent = 'Результат №' + item.id;

    return div;
}

// функция показа индикатора загрузки
function showLoading() {
    resultsList.innerHTML = '<div class="loading">Загрузка...</div>';
}

// функция показа сообщения об отсутствии результатов
function showNoResults() {
    resultsList.innerHTML = '<div class="no-results">Результаты не найдены</div>';
}

// функция показа сообщения об ошибке
function showError(message) {
    resultsList.innerHTML = '<div class="no-results">Ошибка: ' + message + '</div>';
}