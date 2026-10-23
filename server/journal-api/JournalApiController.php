<?php

declare(strict_types=1);

namespace App;

use Contao\CoreBundle\Framework\ContaoFramework;
use Contao\Database;
use Symfony\Bundle\FrameworkBundle\Console\Application;
use Symfony\Component\Console\Input\ArrayInput;
use Symfony\Component\Console\Output\BufferedOutput;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\KernelInterface;

final class JournalApiController
{
    public function __construct(
        private readonly KernelInterface $kernel,
        private readonly ContaoFramework $framework,
        private readonly string $tokenFile,
        private readonly string $publishTokenFile,
        private readonly int $archiveDe,
        private readonly int $archiveEn,
    ) {
    }

    public function create(Request $request): JsonResponse
    {
        if ($error = $this->authenticate($request)) {
            return $error;
        }

        if ($error = $this->parsePayload($request, true, $data)) {
            return $error;
        }

        $archive = $data['locale'] === 'de' ? $this->archiveDe : $this->archiveEn;
        $this->framework->initialize();
        if (!$this->archiveExists($archive)) {
            return $this->error('Journal archive is not configured.', 503);
        }

        $options = [
            '--headline' => $data['headline'],
            '--pid' => (string) $archive,
            '--operator' => 'n8n-journal',
            '--set' => ['teaser='.$data['teaser'], 'source=default'],
        ];
        if (isset($data['date'])) {
            $options['--date'] = $data['date'];
        }

        $created = $this->runCommand('contao:news:create', $options);
        if (!$created || !isset($created['id'])) {
            return $this->error('Could not create journal draft.', 500);
        }

        $newsId = (int) $created['id'];
        $content = $this->runCommand('contao:content:create', [
            '--type' => 'text',
            '--pid' => (string) $newsId,
            '--ptable' => 'tl_news',
            '--operator' => 'n8n-journal',
            '--set' => ['text='.$this->bodyHtml($data['body'])],
        ]);

        if (!$content || !isset($content['id'])) {
            return new JsonResponse([
                'error' => 'Draft created, but content failed. Retry with PATCH.',
                'id' => $newsId,
            ], 500);
        }

        return new JsonResponse([
            'id' => $newsId,
            'content_id' => (int) $content['id'],
            'alias' => $created['alias'] ?? null,
            'locale' => $data['locale'],
            'published' => false,
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if ($error = $this->authenticate($request)) {
            return $error;
        }

        if ($id < 1) {
            return $this->error('Invalid draft ID.', 400);
        }

        if ($error = $this->parsePayload($request, false, $data)) {
            return $error;
        }

        $this->framework->initialize();
        $news = Database::getInstance()->prepare('SELECT id, pid, published FROM tl_news WHERE id=?')->execute($id);
        if (!$news->numRows || !\in_array((int) $news->pid, [$this->archiveDe, $this->archiveEn], true)) {
            return $this->error('Journal draft not found.', 404);
        }
        if ((int) $news->published !== 0) {
            return $this->error('Published articles cannot be changed through this API.', 409);
        }

        $contentId = null;
        if (isset($data['body'])) {
            $content = Database::getInstance()
                ->prepare('SELECT id, type FROM tl_content WHERE pid=? AND ptable=? ORDER BY sorting')
                ->execute($id, 'tl_news');
            if ($content->numRows !== 1 || $content->type !== 'text') {
                return $this->error('Body can only be replaced on API-managed drafts with one text element.', 409);
            }
            $contentId = (int) $content->id;
        }

        $fields = [];
        foreach (['headline', 'teaser'] as $field) {
            if (isset($data[$field])) {
                $fields[] = $field.'='.$data[$field];
            }
        }
        if ($fields && !$this->runCommand('contao:news:update', [
            'id' => (string) $id,
            '--operator' => 'n8n-journal',
            '--set' => $fields,
        ])) {
            return $this->error('Could not update journal draft.', 500);
        }

        if ($contentId && !$this->runCommand('contao:content:update', [
            'id' => (string) $contentId,
            '--operator' => 'n8n-journal',
            '--set' => ['text='.$this->bodyHtml($data['body'])],
        ])) {
            return $this->error('Draft metadata saved, but content update failed.', 500);
        }

        return new JsonResponse(['id' => $id, 'published' => false, 'updated' => true]);
    }

    public function publish(Request $request, int $id): JsonResponse
    {
        if ($error = $this->authenticate($request, $this->publishTokenFile)) {
            return $error;
        }

        if ($id < 1) {
            return $this->error('Invalid draft ID.', 400);
        }

        if (!str_starts_with((string) $request->headers->get('Content-Type'), 'application/json')) {
            return $this->error('Content-Type must be application/json.', 415);
        }
        if (\strlen($request->getContent()) > 1000) {
            return $this->error('Payload too large.', 413);
        }
        try {
            $data = json_decode($request->getContent(), true, 4, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $this->error('Invalid JSON.', 400);
        }
        if ($data !== ['confirm' => true]) {
            return $this->error('Send {"confirm":true} to publish.', 400);
        }

        $this->framework->initialize();
        $news = Database::getInstance()
            ->prepare('SELECT id, pid, headline, teaser, alias, published, start, stop FROM tl_news WHERE id=?')
            ->execute($id);
        if (!$news->numRows || !\in_array((int) $news->pid, [$this->archiveDe, $this->archiveEn], true)) {
            return $this->error('Journal draft not found.', 404);
        }
        if ((int) $news->published === 1) {
            return new JsonResponse(['id' => $id, 'published' => true, 'already_published' => true]);
        }
        if (trim((string) $news->headline) === '' || trim((string) $news->teaser) === ''
            || trim((string) $news->alias) === '') {
            return $this->error('Headline, teaser and alias are required before publication.', 409);
        }
        if ((string) $news->start !== '' || (string) $news->stop !== '') {
            return $this->error('Scheduled articles must be reviewed in Contao before publication.', 409);
        }

        $content = Database::getInstance()
            ->prepare('SELECT id, type, text, invisible FROM tl_content WHERE pid=? AND ptable=? ORDER BY sorting')
            ->execute($id, 'tl_news');
        if ($content->numRows !== 1 || $content->type !== 'text' || (int) $content->invisible !== 0
            || trim(strip_tags((string) $content->text)) === '') {
            return $this->error('A visible text element is required before publication.', 409);
        }

        if (!$this->runCommand('contao:news:update', [
            'id' => (string) $id,
            '--operator' => 'n8n-journal-publish',
            '--set' => ['published=1'],
        ])) {
            return $this->error('Could not publish journal article.', 500);
        }

        return new JsonResponse([
            'id' => $id,
            'locale' => (int) $news->pid === $this->archiveDe ? 'de' : 'en',
            'alias' => (string) $news->alias,
            'published' => true,
        ]);
    }

    private function authenticate(Request $request, ?string $tokenFile = null): ?JsonResponse
    {
        $expected = @file_get_contents($tokenFile ?? $this->tokenFile);
        $provided = $request->headers->get('Authorization', '');
        if (!$expected || !preg_match('/^Bearer ([A-Za-z0-9_-]{32,128})$/', $provided, $match)
            || !hash_equals(trim($expected), $match[1])) {
            return $this->error('Unauthorized.', 401);
        }

        return null;
    }

    private function parsePayload(Request $request, bool $creating, ?array &$data): ?JsonResponse
    {
        if (!str_starts_with((string) $request->headers->get('Content-Type'), 'application/json')) {
            return $this->error('Content-Type must be application/json.', 415);
        }
        if (\strlen($request->getContent()) > 100000) {
            return $this->error('Payload too large.', 413);
        }
        try {
            $data = json_decode($request->getContent(), true, 32, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return $this->error('Invalid JSON.', 400);
        }
        if (!\is_array($data) || array_is_list($data)) {
            return $this->error('Expected a JSON object.', 400);
        }

        $allowed = $creating ? ['locale', 'headline', 'teaser', 'body', 'date'] : ['headline', 'teaser', 'body'];
        if (array_diff(array_keys($data), $allowed)) {
            return $this->error('Unknown field.', 400);
        }
        if ($creating && (!isset($data['locale'], $data['headline'], $data['teaser'], $data['body']))) {
            return $this->error('locale, headline, teaser and body are required.', 400);
        }
        if (!$creating && !$data) {
            return $this->error('At least one field is required.', 400);
        }
        if (isset($data['locale']) && !\in_array($data['locale'], ['de', 'en'], true)) {
            return $this->error('locale must be de or en.', 400);
        }
        foreach (['headline' => 255, 'teaser' => 2000, 'body' => 50000] as $field => $max) {
            if (array_key_exists($field, $data)
                && (!\is_string($data[$field]) || trim($data[$field]) === '' || mb_strlen($data[$field]) > $max)) {
                return $this->error('Invalid '.$field.'.', 400);
            }
        }
        if (isset($data['date'])) {
            if (!\is_string($data['date']) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['date'])) {
                return $this->error('date must be YYYY-MM-DD.', 400);
            }
            [$year, $month, $day] = array_map('intval', explode('-', $data['date']));
            if (!checkdate($month, $day, $year)) {
                return $this->error('Invalid date.', 400);
            }
        }

        return null;
    }

    private function archiveExists(int $id): bool
    {
        return $id > 0 && Database::getInstance()
            ->prepare('SELECT id FROM tl_news_archive WHERE id=?')->execute($id)->numRows > 0;
    }

    private function bodyHtml(string $body): string
    {
        $paragraphs = preg_split('/\R{2,}/u', trim($body));
        return implode('', array_map(
            static fn (string $paragraph): string => '<p>'.nl2br(htmlspecialchars(trim($paragraph), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'), false).'</p>',
            $paragraphs,
        ));
    }

    private function runCommand(string $name, array $options): ?array
    {
        $application = new Application($this->kernel);
        $application->setAutoExit(false);
        $output = new BufferedOutput();
        $status = $application->run(new ArrayInput(['command' => $name] + $options), $output);
        $result = json_decode(trim($output->fetch()), true);

        return $status === 0 && \is_array($result) && ($result['status'] ?? null) === 'ok' ? $result : null;
    }

    private function error(string $message, int $status): JsonResponse
    {
        return new JsonResponse(['error' => $message], $status);
    }
}
