// переменная для хранения текущей страницы
let currentPage = 1;
// количество новостей на одной странице
const NEWS_PER_PAGE = 5;
// переменная для хранения поискового запроса
let searchQuery = '';
// флаг загрузки данных
let isLoading = false;

// получаем ссылки на элементы DOM
const newsList = document.getElementById('newsList');
const pagination = document.getElementById('pagination');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const modal = document.getElementById('modal');
const closeModal = document.getElementById('closeModal');
const modalTitle = document.getElementById('modalTitle');
const modalText = document.getElementById('modalText');

// при загрузке страницы загружаем первую порцию новостей
document.addEventListener('DOMContentLoaded', () => {
    loadNews(1, '');
});

// обработчик кнопки поиска
searchButton.addEventListener('click', performSearch);

// обработчик нажатия Enter в поле поиска
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch();
    }
});

// обработчик закрытия модального окна по клику на крестик
closeModal.addEventListener('click', () => {
    modal.classList.add('hidden');
});

// обработчик закрытия модального окна по клику вне его области
modal.addEventListener('click', (e) => {
    if (e.target === modal) {
        modal.classList.add('hidden');
    }
});

// функция выполнения поиска
function performSearch() {
    searchQuery = searchInput.value.trim();
    currentPage = 1;
    loadNews(currentPage, searchQuery);
}

// основная функция загрузки новостей через AJAX
function loadNews(page, search) {
    // предотвращаем множественные запросы
    if (isLoading) return;

    isLoading = true;

    // показываем индикатор загрузки
    showLoading();

    // создаём объект FormData для отправки данных
    const formData = new FormData();
    formData.append('page', page);
    formData.append('limit', NEWS_PER_PAGE);
    formData.append('search', search);

    // отправляем AJAX запрос к серверу
    fetch('AJAX.php', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            // проверяем успешность запроса
            if (!response.ok) {
                throw new Error('Ошибка сети');
            }
            return response.text();
        })
        .then(text => {
            try {
                // парсим JSON ответ
                const data = JSON.parse(text);
                // обрабатываем полученные данные
                displayNews(data);
                // создаём пагинацию
                createPagination(data.totalPages, page);
            } catch (e) {
                console.error('Ошибка парсинга JSON:', e);
                showError('Ошибка загрузки данных');
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            showError('Произошла ошибка при загрузке новостей');
        })
        .finally(() => {
            isLoading = false;
        });
}

// функция отображения новостей на странице
function displayNews(data) {
    // очищаем список новостей
    newsList.innerHTML = '';

    // проверяем наличие новостей
    if (!data.news || data.news.length === 0) {
        showNoResults();
        return;
    }

    // добавляем каждую новость
    data.news.forEach(newsItem => {
        const newsElement = createNewsElement(newsItem);
        newsList.appendChild(newsElement);
    });
}

// функция создания HTML элемента новости
function createNewsElement(newsItem) {
    const div = document.createElement('div');
    div.className = 'news-item';

    // создаём структуру новости
    div.innerHTML = `
        <div class="news-header">Новость №${newsItem.id}</div>
        <div class="news-body">
            <div class="news-text">Привет, мир!</div>
            <div class="more-info">
                <span class="more-info-link" data-id="${newsItem.id}">More info</span>
            </div>
        </div>
    `;

    // добавляем обработчик клика на ссылку "More info"
    const moreInfoLink = div.querySelector('.more-info-link');
    moreInfoLink.addEventListener('click', () => {
        openModal(newsItem.id);
    });

    return div;
}

// функция открытия модального окна с полным текстом новости
function openModal(newsId) {
    // показываем модальное окно с индикатором загрузки
    modal.classList.remove('hidden');
    modalTitle.textContent = 'Загрузка...';
    modalText.textContent = '';

    // создаём объект FormData для запроса полного текста
    const formData = new FormData();
    formData.append('id', newsId);

    // отправляем AJAX запрос за полным текстом новости
    fetch('AJAX.php', {
        method: 'POST',
        body: formData
    })
        .then(response => response.text())
        .then(text => {
            try {
                const data = JSON.parse(text);
                // отображаем полный текст в модальном окне
                modalTitle.textContent = 'Новость №' + newsId;
                modalText.textContent = data.fullText || 'Текст новости не найден';
            } catch (e) {
                console.error('Ошибка загрузки новости:', e);
                modalTitle.textContent = 'Ошибка';
                modalText.textContent = 'Не удалось загрузить новость';
            }
        })
        .catch(error => {
            console.error('Ошибка:', error);
            modalTitle.textContent = 'Ошибка';
            modalText.textContent = 'Произошла ошибка при загрузке';
        });
}

// функция создания пагинации
function createPagination(totalPages, currentPageNum) {
    // очищаем пагинацию
    pagination.innerHTML = '';

    // если страница только одна, не показываем пагинацию
    if (totalPages <= 1) {
        return;
    }

    // кнопка "Prev"
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.textContent = 'Prev';
    prevBtn.disabled = currentPageNum === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPageNum > 1) {
            currentPage = currentPageNum - 1;
            loadNews(currentPage, searchQuery);
        }
    });
    pagination.appendChild(prevBtn);

    // создаём кнопки для страниц
    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement('button');
        pageBtn.className = 'page-btn';
        pageBtn.textContent = i;

        // выделяем текущую страницу
        if (i === currentPageNum) {
            pageBtn.classList.add('active');
        }

        // добавляем обработчик клика
        pageBtn.addEventListener('click', () => {
            currentPage = i;
            loadNews(currentPage, searchQuery);
        });

        pagination.appendChild(pageBtn);
    }

    // кнопка "Next"
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.textContent = 'Next';
    nextBtn.disabled = currentPageNum === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPageNum < totalPages) {
            currentPage = currentPageNum + 1;
            loadNews(currentPage, searchQuery);
        }
    });
    pagination.appendChild(nextBtn);
}

// функция показа индикатора загрузки
function showLoading() {
    newsList.innerHTML = '<div class="loading">Загрузка новостей...</div>';
    pagination.innerHTML = '';
}

// функция показа сообщения об отсутствии результатов
function showNoResults() {
    newsList.innerHTML = '<div class="no-results">Новости не найдены</div>';
    pagination.innerHTML = '';
}

// функция показа сообщения об ошибке
function showError(message) {
    newsList.innerHTML = '<div class="no-results">Ошибка: ' + message + '</div>';
    pagination.innerHTML = '';
}