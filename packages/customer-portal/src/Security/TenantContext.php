<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Security;

use Contao\FrontendUser;
use Doctrine\DBAL\Connection;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Symfony\Component\Security\Core\Exception\AccessDeniedException;

final class TenantContext
{
    public function __construct(private Connection $db, private TokenStorageInterface $tokens) {}

    public function current(): Tenant
    {
        $member = $this->tokens->getToken()?->getUser();
        if (!$member instanceof FrontendUser) {
            throw new AccessDeniedException('Bitte melden Sie sich an.');
        }

        // Frisch prüfen: Entzug einer Firmenzuordnung gilt auch für bestehende Sitzungen.
        $row = $this->db->fetchAssociative(
            'SELECT m.id, m.firstname, m.lastname, m.groups, m.rolle, m.disable, m.login, m.start, m.stop,
                    f.id AS firma_id, f.name, f.mitgliedergruppe,
                    g.disable AS group_disable, g.start AS group_start, g.stop AS group_stop
             FROM tl_member m INNER JOIN tl_portal_firma f ON f.id = m.firma_id
             INNER JOIN tl_member_group g ON g.id = f.mitgliedergruppe
             WHERE m.id = ? AND f.aktiv = ?', [(int) $member->id, '1']
        );
        if (!$row || !self::allows($row, time())) {
            throw new AccessDeniedException('Ihr Zugang ist noch keiner Kundenfirma zugeordnet.');
        }

        return new Tenant((int) $row['firma_id'], (int) $row['id'], $row['name'],
            trim($row['firstname'].' '.$row['lastname']), $row['rolle']);
    }

    public static function allows(array $row, int $now): bool
    {
        $groups = is_array($row['groups']) ? $row['groups'] : @unserialize($row['groups'] ?? '', ['allowed_classes' => false]);
        return (int) ($row['firma_id'] ?? 0) > 0
            && (int) ($row['mitgliedergruppe'] ?? 0) > 0
            && is_array($groups)
            && in_array((string) $row['mitgliedergruppe'], array_map('strval', $groups), true)
            && in_array($row['rolle'] ?? '', ['entscheider', 'mitleser'], true)
            && (string) ($row['disable'] ?? '') !== '1' && (string) ($row['login'] ?? '') === '1'
            && (!(int) ($row['start'] ?? 0) || (int) $row['start'] <= $now)
            && (!(int) ($row['stop'] ?? 0) || (int) $row['stop'] > $now)
            && (string) ($row['group_disable'] ?? '') !== '1'
            && (!(int) ($row['group_start'] ?? 0) || (int) $row['group_start'] <= $now)
            && (!(int) ($row['group_stop'] ?? 0) || (int) $row['group_stop'] > $now);
    }
}
