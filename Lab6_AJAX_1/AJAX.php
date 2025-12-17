<?php
// включаем отображение ошибок для отладки (в продакшене отключить!)
error_reporting(E_ALL);
ini_set('display_errors', 0); // не показываем ошибки в HTML
ini_set('log_errors', 1); // логируем ошибки

// отключаем буферизацию вывода чтобы заголовки отправились первыми
ob_start();

// функция генерации тестовых данных
function generateTestData($query, $count) {
    $results = [];

    // массив с различными категориями для разнообразия
    $categories = ['Технологии', 'Наука', 'Бизнес', 'Образование', 'Медицина'];
    $adjectives = ['Новый', 'Инновационный', 'Современный', 'Продвинутый', 'Эффективный'];

    // генерируем указанное количество результатов
    for ($i = 1; $i <= $count; $i++) {
        $category = $categories[($i - 1) % count($categories)];
        $adjective = $adjectives[($i - 1) % count($adjectives)];

        $results[] = [
            'id' => $i,
            'title' => "$adjective результат по запросу: $query #$i",
            'description' => "Описание результата из категории «$category». Это детальная информация о найденном элементе номер $i.",
            'category' => $category,
            'date' => date('d.m.Y', strtotime("-$i days"))
        ];
    }

    return $results;
}

// очищаем любой вывод который мог появиться до этого
ob_clean();

// устанавливаем заголовок для JSON ответа
header('Content-Type: application/json; charset=utf-8');

// разрешаем CORS для локальной разработки
header('Access-Control-Allow-Origin: *');

try {
    // получаем данные из POST запроса
    $query = isset($_POST['query']) ? trim($_POST['query']) : '';
    $offset = isset($_POST['offset']) ? intval($_POST['offset']) : 0;
    $limit = isset($_POST['limit']) ? intval($_POST['limit']) : 10;

    // небольшая задержка для имитации работы с базой данных
    usleep(300000); // 0.3 секунды

    // генерируем тестовые данные (в реальном проекте здесь будет запрос к БД)
    $allResults = generateTestData($query, 35); // генерируем 35 результатов

    // получаем нужную порцию данных согласно offset и limit
    $results = array_slice($allResults, $offset, $limit);

    // проверяем есть ли ещё данные для загрузки
    $hasMore = ($offset + $limit) < count($allResults);

    // формируем ответ в формате JSON
    $response = [
        'success' => true,
        'query' => $query,
        'total' => count($allResults),
        'offset' => $offset,
        'limit' => $limit,
        'results' => $results,
        'hasMore' => $hasMore
    ];

    // отправляем JSON ответ клиенту
    echo json_encode($response, JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    // в случае ошибки отправляем JSON с информацией об ошибке
    $errorResponse = [
        'success' => false,
        'error' => 'Произошла ошибка на сервере',
        'message' => $e->getMessage()
    ];
    echo json_encode($errorResponse, JSON_UNESCAPED_UNICODE);
}

// завершаем вывод
ob_end_flush();
?>