<?php
// включаем отображение ошибок для отладки
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// отключаем буферизацию вывода
ob_start();

/**
 * функция генерации тестовых новостей
 */
function generateNewsData($totalCount) {
    $news = [];

    // генерируем указанное количество новостей
    for ($i = 1; $i <= $totalCount; $i++) {
        $news[] = [
            'id' => $i,
            'title' => 'Приветствие',
            'shortText' => 'Привет, мир!',
            'fullText' => 'Привет, мир! Это полный текст новости номер ' . $i . '. Здесь находится расширенная информация о новости. Привет, мир! Привет, мир! Это детальное описание новости с дополнительными подробностями и информацией.'
        ];
    }

    return $news;
}

// очищаем любой вывод
ob_clean();

// устанавливаем заголовок для JSON
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

try {
    // проверяем тип запроса - запрос списка новостей или отдельной новости
    if (isset($_POST['id'])) {
        // запрос полного текста одной новости
        $newsId = intval($_POST['id']);

        // генерируем все новости и находим нужную
        $allNews = generateNewsData(25);
        $foundNews = null;

        foreach ($allNews as $newsItem) {
            if ($newsItem['id'] === $newsId) {
                $foundNews = $newsItem;
                break;
            }
        }

        // отправляем ответ
        if ($foundNews) {
            echo json_encode([
                'success' => true,
                'fullText' => $foundNews['fullText']
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'error' => 'Новость не найдена'
            ], JSON_UNESCAPED_UNICODE);
        }

    } else {
        // запрос списка новостей с пагинацией
        $page = isset($_POST['page']) ? intval($_POST['page']) : 1;
        $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 5;
        $search = isset($_POST['search']) ? trim($_POST['search']) : '';

        // генерируем все новости
        $allNews = generateNewsData(25);

        // если есть поисковый запрос, фильтруем новости
        if ($search !== '') {
            $filteredNews = [];
            foreach ($allNews as $newsItem) {
                // ищем в заголовке и коротком тексте
                if (
                    stripos($newsItem['title'], $search) !== false ||
                    stripos($newsItem['shortText'], $search) !== false ||
                    stripos($newsItem['fullText'], $search) !== false
                ) {
                    $filteredNews[] = $newsItem;
                }
            }
            $allNews = $filteredNews;
        }

        // считаем общее количество и страниц
        $totalNews = count($allNews);
        $totalPages = ceil($totalNews / $limit);

        // проверяем корректность номера страницы
        if ($page < 1) $page = 1;
        if ($page > $totalPages && $totalPages > 0) $page = $totalPages;

        // вычисляем смещение для текущей страницы
        $offset = ($page - 1) * $limit;

        // получаем новости для текущей страницы
        $newsForPage = array_slice($allNews, $offset, $limit);

        // формируем ответ
        $response = [
            'success' => true,
            'page' => $page,
            'totalPages' => $totalPages,
            'totalNews' => $totalNews,
            'news' => $newsForPage
        ];

        // отправляем JSON ответ
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    // в случае ошибки отправляем JSON с информацией об ошибке
    echo json_encode([
        'success' => false,
        'error' => 'Произошла ошибка на сервере',
        'message' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
}

// завершаем вывод
ob_end_flush();
?>