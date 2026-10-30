<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Security;

/** Ausschließlich aus dem authentifizierten Mitglied und der Datenbank erzeugen. */
final readonly class Tenant
{
    public function __construct(
        public int $companyId,
        public int $memberId,
        public string $companyName,
        public string $memberName,
        public string $role,
    ) {
        if ($companyId < 1 || $memberId < 1 || !in_array($role, ['entscheider', 'mitleser'], true)) {
            throw new \InvalidArgumentException('Ungültige Portal-Zuordnung.');
        }
    }

    public function canApprove(): bool
    {
        return $this->role === 'entscheider';
    }
}
