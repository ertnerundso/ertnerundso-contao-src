<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Backend;

use Contao\BackendUser;
use Contao\DataContainer;
use Contao\Input;
use Contao\System;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class BackendGuard
{
    public static function adminOnly(): void
    {
        if (!BackendUser::getInstance()->isAdmin) {
            throw new AccessDeniedException('Die Portal-Verwaltung ist Administratoren vorbehalten.');
        }
    }

    public static function validateRelation(mixed $value, DataContainer $dc): mixed
    {
        self::adminOnly();
        $definition = $GLOBALS['TL_DCA'][$dc->table]['fields'][$dc->field];
        [$table] = explode('.', $definition['foreignKey']);
        $db = System::getContainer()->get('database_connection');
        $record = $db->fetchAssociative('SELECT * FROM '.$table.' WHERE id = ?', [(int) $value]);
        if (!$record) { throw new \InvalidArgumentException('Bitte wählen Sie einen gültigen Datensatz.'); }
        $companyId = (int) (Input::post('firma_id') ?? $dc->activeRecord?->firma_id ?? 0);
        if (isset($record['firma_id']) && (int) $record['firma_id'] !== $companyId) {
            throw new \InvalidArgumentException('Die verknüpften Datensätze müssen zur gleichen Firma gehören.');
        }
        return $value;
    }
}
