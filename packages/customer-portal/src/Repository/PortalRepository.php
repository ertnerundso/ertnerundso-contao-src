<?php
declare(strict_types=1);

namespace Ertnerundso\CustomerPortal\Repository;

use Doctrine\DBAL\Connection;
use Ertnerundso\CustomerPortal\Security\Tenant;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

/** Keine Methode akzeptiert eine vom Browser ausgewählte firma_id. */
final class PortalRepository
{
    public function __construct(private Connection $db) {}

    public function projects(Tenant $tenant, string $query = ''): array
    {
        $rows = $this->db->fetchAllAssociative(
            "SELECT id, titel, vorlage, korrekturlaeufe_inklusive FROM tl_portal_projekt
             WHERE firma_id = ? AND archiviert = '' ORDER BY tstamp DESC, id DESC", [$tenant->companyId]);
        if ($query !== '') {
            $rows = array_values(array_filter($rows, static fn(array $r): bool => mb_stripos($r['titel'], $query) !== false));
        }
        foreach ($rows as &$row) {
            $row['phases'] = $this->phases($tenant, (int) $row['id']);
        }
        return $rows;
    }

    public function project(Tenant $tenant, int $id): array
    {
        $row = $this->db->fetchAssociative(
            "SELECT id, titel, vorlage, korrekturlaeufe_inklusive FROM tl_portal_projekt
             WHERE id = ? AND firma_id = ? AND archiviert = ''", [$id, $tenant->companyId]);
        if (!$row) {
            throw new NotFoundHttpException('Projekt nicht gefunden.');
        }
        $row['phases'] = $this->phases($tenant, $id);
        return $row;
    }

    private function phases(Tenant $tenant, int $projectId): array
    {
        return $this->db->fetchAllAssociative(
            'SELECT id, name, reihenfolge, status, korrekturlaeufe FROM tl_portal_phase
             WHERE projekt_id = ? AND firma_id = ? ORDER BY reihenfolge, id', [$projectId, $tenant->companyId]);
    }

    public function reviews(Tenant $tenant): array
    {
        // Auch Elternverknüpfungen prüfen: ein falscher Fremdschlüssel darf nichts offenlegen.
        return $this->db->fetchAllAssociative(
            "SELECT v.id, v.nummer, v.dateiname, v.typ, v.freigeschaltet_am,
                    p.id AS projekt_id, p.titel, ph.name AS phase
             FROM tl_portal_version v
             INNER JOIN tl_portal_phase ph ON ph.id = v.phase_id AND ph.firma_id = v.firma_id
             INNER JOIN tl_portal_projekt p ON p.id = ph.projekt_id AND p.firma_id = ph.firma_id
             WHERE v.firma_id = ? AND v.freigeschaltet_am > 0 AND v.freigeschaltet_am <= ?
               AND ph.status = 'pruefung' AND p.archiviert = ''
             ORDER BY v.freigeschaltet_am DESC, v.id DESC", [$tenant->companyId, time()]);
    }

    public function deliveries(Tenant $tenant): array
    {
        return $this->db->fetchAllAssociative(
            "SELECT a.id, a.dateiname, a.format, a.groesse, p.id AS projekt_id, p.titel
             FROM tl_portal_abgabe a
             INNER JOIN tl_portal_projekt p ON p.id = a.projekt_id AND p.firma_id = a.firma_id
             WHERE a.firma_id = ? AND a.freigeschaltet_am > 0 AND a.freigeschaltet_am <= ?
               AND p.archiviert = '' ORDER BY a.id DESC", [$tenant->companyId, time()]);
    }

    public function activity(Tenant $tenant): array
    {
        // Keine Event-Payloads im Browser: interne Metadaten gehören nicht in die UI.
        return $this->db->fetchAllAssociative(
            "SELECT e.id, e.art, e.zeitpunkt, p.id AS projekt_id, p.titel
             FROM tl_portal_ereignis e
             INNER JOIN tl_portal_projekt p ON p.id = e.projekt_id AND p.firma_id = e.firma_id
             WHERE e.firma_id = ? AND p.archiviert = '' ORDER BY e.id DESC LIMIT 20", [$tenant->companyId]);
    }

    public function team(Tenant $tenant): array
    {
        $members = $this->db->fetchAllAssociative(
            "SELECT id, firstname, lastname, rolle FROM tl_member
             WHERE firma_id = ? AND disable = '' AND login = '1' ORDER BY lastname, firstname", [$tenant->companyId]);
        // Weder Mailadressen noch andere Mitgliederdaten als pauschalen Export ausliefern.
        return $members;
    }
}
